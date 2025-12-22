import { Handler } from '@netlify/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

interface RefundRequest {
  paymentIntentId: string;
  amount?: number; // in centesimi, opzionale (se non specificato = rimborso completo)
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
      amount,
      reason = 'requested_by_customer',
      metadata = {},
    } = body;

    // Validazione
    if (!paymentIntentId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing paymentIntentId' }),
      };
    }

    console.log('💳 Creating refund:', {
      paymentIntentId,
      amount: amount ? `€${(amount / 100).toFixed(2)}` : 'full refund',
      reason,
    });

    // Crea il rimborso su Stripe
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
      reason,
      metadata,
    };

    // Aggiungi amount solo se specificato (altrimenti rimborso completo)
    if (amount !== undefined && amount > 0) {
      refundParams.amount = amount;
    }

    const refund = await stripe.refunds.create(refundParams);

    console.log('✅ Refund created:', refund.id, 'Status:', refund.status);

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

  } catch (error: any) {
    console.error('❌ Error creating refund:', error);
    
    // Gestisci errori specifici di Stripe
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