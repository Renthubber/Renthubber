import { Handler } from '@netlify/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

interface RefundRequest {
  paymentIntentId?: string;  // Singolo PI (backward compatible)
  bookingId?: string;        // Cerca tutti i PI per questo booking
  amount?: number;           // in centesimi
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  metadata?: Record<string, string>;
}

export const handler: Handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body: RefundRequest = JSON.parse(event.body || '{}');
    
    const {
      paymentIntentId,
      bookingId,
      amount,
      reason = 'requested_by_customer',
      metadata = {},
    } = body;

    if (!paymentIntentId && !bookingId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing paymentIntentId or bookingId' }),
      };
    }

    // Se abbiamo un singolo PI e l'importo ci sta, rimborso semplice
    if (paymentIntentId && !bookingId) {
      console.log('💳 Single PI refund:', {
        paymentIntentId,
        amount: amount ? `€${(amount / 100).toFixed(2)}` : 'full refund',
      });

      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
        reason,
        metadata,
      };

      if (amount !== undefined && amount > 0) {
        refundParams.amount = amount;
      }

      try {
        const refund = await stripe.refunds.create(refundParams);
        console.log('✅ Refund created:', refund.id);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            refund: {
              id: refund.id,
              status: refund.status,
              amount: refund.amount,
              currency: refund.currency,
              payment_intent: refund.payment_intent,
            },
          }),
        };
      } catch (singleError: any) {
        // Se fallisce per importo troppo alto e abbiamo bookingId, prova cascata
        if (!bookingId) throw singleError;
        console.log('⚠️ Single PI refund failed, trying cascade...');
      }
    }

    // Cascata: cerca tutti i PaymentIntent per questo booking
    const searchBookingId = bookingId || metadata?.booking_id;
    if (!searchBookingId || !amount) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'bookingId and amount required for cascade refund' }),
      };
    }

    console.log('🔍 Cascade refund for booking:', searchBookingId, 'Amount:', `€${(amount / 100).toFixed(2)}`);

    // Cerca PI con metadata booking_id
    const searchResults = await stripe.paymentIntents.search({
      query: `metadata["booking_id"]:"${searchBookingId}" status:"succeeded"`,
    });

    // Raccogli tutti i PI (search + originale)
    const allPIs = [...searchResults.data];
    
    if (paymentIntentId) {
      const hasOriginal = allPIs.some(pi => pi.id === paymentIntentId);
      if (!hasOriginal) {
        try {
          const originalPI = await stripe.paymentIntents.retrieve(paymentIntentId);
          if (originalPI.status === 'succeeded') {
            allPIs.push(originalPI);
          }
        } catch (e) {
          console.warn('⚠️ Could not retrieve original PI');
        }
      }
    }

    // Ordina dal più recente
    allPIs.sort((a, b) => b.created - a.created);

    console.log(`📋 Found ${allPIs.length} PaymentIntents for booking`);

    let remainingAmount = amount;
    const refunds: any[] = [];

    for (const pi of allPIs) {
      if (remainingAmount <= 0) break;

      // Calcola quanto è già stato rimborsato su questo PI
      const alreadyRefunded = pi.amount - pi.amount_received + 
        (pi.latest_charge ? 0 : 0); // Stripe gestisce internamente
      
      const maxRefundable = pi.amount; // Stripe sa quanto è rimborsabile
      const refundForThis = Math.min(remainingAmount, maxRefundable);

      try {
        const refund = await stripe.refunds.create({
          payment_intent: pi.id,
          amount: refundForThis,
          reason,
          metadata: { ...metadata, booking_id: searchBookingId },
        });

        refunds.push({
          id: refund.id,
          status: refund.status,
          amount: refund.amount,
          payment_intent: pi.id,
        });

        remainingAmount -= refundForThis;
        console.log(`✅ Refund €${(refundForThis / 100).toFixed(2)} on PI ${pi.id}`);
      } catch (refundError: any) {
        console.warn(`⚠️ Refund failed on PI ${pi.id}: ${refundError.message}`);
        // Prova con meno se l'importo è troppo alto
        if (refundError.code === 'amount_too_large') {
          try {
            // Prova rimborso completo del PI
            const fullRefund = await stripe.refunds.create({
              payment_intent: pi.id,
              reason,
              metadata: { ...metadata, booking_id: searchBookingId },
            });
            
            refunds.push({
              id: fullRefund.id,
              status: fullRefund.status,
              amount: fullRefund.amount,
              payment_intent: pi.id,
            });
            
            remainingAmount -= fullRefund.amount;
            console.log(`✅ Full refund €${(fullRefund.amount / 100).toFixed(2)} on PI ${pi.id}`);
          } catch (e: any) {
            console.warn(`⚠️ Full refund also failed on PI ${pi.id}: ${e.message}`);
          }
        }
      }
    }

    if (remainingAmount > 0) {
      console.warn(`⚠️ Could not refund €${(remainingAmount / 100).toFixed(2)} - not enough PI balance`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        refunds,
        totalRefunded: amount - remainingAmount,
        remainingUnrefunded: remainingAmount,
        refund: refunds[0] || null, // Backward compatible
      }),
    };

  } catch (error: any) {
    console.error('❌ Error creating refund:', error);
    
    if (error.type === 'StripeInvalidRequestError') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: error.message || 'Invalid refund request',
          code: error.code,
        }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Failed to create refund',
      }),
    };
  }
};