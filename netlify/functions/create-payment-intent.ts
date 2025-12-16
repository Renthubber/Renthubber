import { Handler } from '@netlify/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

interface CreatePaymentIntentRequest {
  listingId: string;
  renterId: string;
  hubberId: string;
  startDate: string;
  endDate: string;
  
  // Prezzi
  basePrice: number;          // Prezzo base (es. €100)
  renterFee: number;          // Commissione renter (es. €12)
  hubberFee: number;          // Commissione hubber (es. €12)
  deposit: number;            // Cauzione (es. €50)
  cleaningFee: number;        // Costo pulizia (es. €5)
  totalAmount: number;        // Totale (es. €162)
  
  // Wallet da usare
  useWallet: boolean;
  refundBalanceToUse?: number;    // Crediti rimborsi da usare
  referralBalanceToUse?: number;  // Crediti referral da usare
}

/**
 * Netlify Function: Crea Payment Intent con deduzione wallet
 * 
 * POST /api/create-payment-intent
 * Body: CreatePaymentIntentRequest
 * 
 * Returns: { clientSecret: string, paymentIntentId: string, amountToPay: number }
 */
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
    const body: CreatePaymentIntentRequest = JSON.parse(event.body || '{}');
    
    const {
      listingId,
      renterId,
      hubberId,
      startDate,
      endDate,
      basePrice,
      renterFee,
      hubberFee,
      deposit,
      cleaningFee = 0,
      totalAmount,
      useWallet,
      refundBalanceToUse = 0,
      referralBalanceToUse = 0,
    } = body;

    // Validazione
    if (!listingId || !renterId || !hubberId || !startDate || !endDate) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    if (totalAmount <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid amount' }),
      };
    }

    console.log('💳 Creating Payment Intent:', {
      renterId,
      listingId,
      totalAmount,
      refundBalanceToUse,
      referralBalanceToUse,
    });

    // 1. Carica saldi wallet renter
    const userResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/users?id=eq.${renterId}`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    const users = await userResponse.json();
    const renter = users[0];

    if (!renter) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Renter not found' }),
      };
    }

    // 2. Verifica saldi disponibili
    const refundBalance = Number(renter.refund_balance_cents || 0) / 100;
    const referralBalance = Number(renter.referral_balance_cents || 0) / 100;

    if (refundBalanceToUse > refundBalance) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Insufficient refund balance' }),
      };
    }

    if (referralBalanceToUse > referralBalance) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Insufficient referral balance' }),
      };
    }

    // 3. Calcola quanto usare dal wallet
    const walletUsedTotal = useWallet ? (refundBalanceToUse + referralBalanceToUse) : 0;
    const amountToPay = Math.max(0, totalAmount - walletUsedTotal);
    const amountToPayCents = Math.round(amountToPay * 100);

    console.log('💰 Wallet calculation:', {
      totalAmount,
      refundBalanceToUse,
      referralBalanceToUse,
      walletUsedTotal,
      amountToPay,
    });

    // 4. Se tutto pagato con wallet, salta Stripe
    if (amountToPayCents === 0) {
      // Salva prenotazione direttamente (senza Payment Intent)
      const bookingResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/bookings`,
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            listing_id: listingId,
            renter_id: renterId,
            hubber_id: hubberId,
            start_date: startDate,
            end_date: endDate,
            amount_total: totalAmount,
            platform_fee: hubberFee,
            hubber_net_amount: basePrice + cleaningFee - hubberFee,
            cleaning_fee: cleaningFee,
            wallet_used_cents: Math.round(walletUsedTotal * 100),
            status: 'confirmed',
            payment_status: 'paid',
            stripe_payment_intent_id: null,
            created_at: new Date().toISOString(),
          }),
        }
      );

      const bookings = await bookingResponse.json();
      const booking = bookings[0];

      // Deduce wallet
      await fetch(
        `${SUPABASE_URL}/rest/v1/users?id=eq.${renterId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refund_balance_cents: Math.round((refundBalance - refundBalanceToUse) * 100),
            referral_balance_cents: Math.round((referralBalance - referralBalanceToUse) * 100),
          }),
        }
      );

      console.log('✅ Booking created without Stripe (paid with wallet)');

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          paidWithWallet: true,
          bookingId: booking.id,
        }),
      };
    }

    // 5. Crea Payment Intent per importo rimanente
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountToPayCents,
      currency: 'eur',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        renthubber_listing_id: listingId,
        renthubber_renter_id: renterId,
        renthubber_hubber_id: hubberId,
        renthubber_start_date: startDate,
        renthubber_end_date: endDate,
        renthubber_base_price: basePrice.toString(),
        renthubber_renter_fee: renterFee.toString(),
        renthubber_hubber_fee: hubberFee.toString(),
        renthubber_deposit: deposit.toString(),
        renthubber_cleaning_fee: cleaningFee.toString(),
        renthubber_total_amount: totalAmount.toString(),
        renthubber_wallet_used: walletUsedTotal.toString(),
        renthubber_refund_used: refundBalanceToUse.toString(),
        renthubber_referral_used: referralBalanceToUse.toString(),
      },
    });

    console.log('✅ Payment Intent created:', paymentIntent.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amountToPay: amountToPay,
        amountToPayCents: amountToPayCents,
      }),
    };

  } catch (error: any) {
    console.error('❌ Error creating Payment Intent:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Failed to create Payment Intent',
      }),
    };
  }
};
