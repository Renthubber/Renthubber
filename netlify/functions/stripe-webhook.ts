import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { calculateRenterFee, calculateHubberFee } from '../../utils/feeUtils';

/**
 * Netlify Function: Stripe Webhook Handler
 * 
 * POST /.netlify/functions/stripe-webhook
 * 
 * Gestisce eventi Stripe:
 * - payment_intent.succeeded → Crea booking e deduce wallet
 * - payment_intent.payment_failed → Log errore
 * - account.updated → Aggiorna stato onboarding hubber
 */
export const handler: Handler = async (event, context) => {
  // ✅ Inizializza Stripe DENTRO l'handler per accedere alle env vars a runtime
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
  const STRIPE_WEBHOOK_SECRET_CONNECT = process.env.STRIPE_WEBHOOK_SECRET_CONNECT || '';

  // ✅ Verifica che le chiavi siano presenti
  if (!STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY not found in environment variables');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error - Missing STRIPE_SECRET_KEY' }),
    };
  }

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
});

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
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

  const sig = event.headers['stripe-signature'];
  
  if (!sig) {
    console.error('❌ No Stripe signature found');
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'No signature' }),
    };
  }

  let stripeEvent: Stripe.Event;

  try {
  // Prova prima con il secret principale (pagamenti)
  stripeEvent = stripe.webhooks.constructEvent(
    event.body!,
    sig,
    STRIPE_WEBHOOK_SECRET
  );
  console.log('✅ Validated with STRIPE_WEBHOOK_SECRET');
} catch (err1: any) {
  // Se fallisce, prova con il secret Connect (account hubber)
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body!,
      sig,
      STRIPE_WEBHOOK_SECRET_CONNECT
    );
    console.log('✅ Validated with STRIPE_WEBHOOK_SECRET_CONNECT');
  } catch (err2: any) {
    console.error('❌ Webhook signature verification failed with both secrets');
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Webhook signature verification failed' }),
    };
  }
}

console.log('🎣 Webhook received:', stripeEvent.type);

  console.log('🎣 Webhook received:', stripeEvent.type);

  try {
    // Gestisci diversi tipi di eventi
    switch (stripeEvent.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(stripeEvent.data.object as Stripe.PaymentIntent, SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(stripeEvent.data.object as Stripe.PaymentIntent);
        break;

      case 'account.updated':
        await handleAccountUpdated(stripeEvent.data.object as Stripe.Account, SUPABASE_URL, SUPABASE_ANON_KEY);
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true }),
    };

  } catch (error: any) {
    console.error('❌ Webhook handler error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

/**
 * Gestisce pagamento riuscito
 */
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  SUPABASE_URL: string,
  SUPABASE_ANON_KEY: string
) {
  console.log('✅ Payment succeeded:', paymentIntent.id);

  const metadata = paymentIntent.metadata;

   // ✅ GESTIONE MODIFICA PRENOTAZIONE
  if (metadata.type === 'booking_modification') {
    await handleBookingModification(paymentIntent, SUPABASE_URL, SUPABASE_ANON_KEY);
    return;
  }

  // Estrai dati dalla metadata
  const listingId = metadata.renthubber_listing_id;
  const renterId = metadata.renthubber_renter_id;
  const hubberId = metadata.renthubber_hubber_id;
  const startDate = metadata.renthubber_start_date;
  const endDate = metadata.renthubber_end_date;
  const basePrice = parseFloat(metadata.renthubber_base_price || '0');
  const renterFee = parseFloat(metadata.renthubber_renter_fee || '0');
  const hubberFee = parseFloat(metadata.renthubber_hubber_fee || '0');
  const deposit = parseFloat(metadata.renthubber_deposit || '0');
  const cleaningFee = parseFloat(metadata.renthubber_cleaning_fee || '0');
  const totalAmount = parseFloat(metadata.renthubber_total_amount || '0');
  const walletUsed = parseFloat(metadata.renthubber_wallet_used || '0');
  const refundUsed = parseFloat(metadata.renthubber_refund_used || '0');
  const referralUsed = parseFloat(metadata.renthubber_referral_used || '0');

  if (!listingId || !renterId || !hubberId) {
    console.error('❌ Missing required metadata');
    return;
  }

  // 1. ✅ Crea booking con function database
  const bookingResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/rpc/create_booking_with_payment`,
    {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_renter_id: renterId,
        p_listing_id: listingId,
        p_start_date: startDate,
        p_end_date: endDate,
        p_amount_total_cents: Math.round(totalAmount * 100),
        p_platform_fee_cents: Math.round(renterFee * 100),
        p_hubber_net_amount_cents: Math.round((basePrice + cleaningFee - hubberFee) * 100),
        p_wallet_used_cents: Math.round(walletUsed * 100),
        p_provider: 'stripe',
        p_provider_payment_id: paymentIntent.id,
        p_cleaning_fee_cents: Math.round(cleaningFee * 100),
        p_deposit_cents: Math.round(deposit * 100),
      }),
    }
  );

  if (!bookingResponse.ok) {
    const error = await bookingResponse.text();
    console.error('❌ Failed to create booking:', error);
    throw new Error('Failed to create booking');
  }

  const booking = await bookingResponse.json();

  console.log('✅ Booking created:', booking.id);

  // 2. Deduce wallet se usato
  if (walletUsed > 0) {
    // Carica saldi attuali
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

    if (renter) {
      const currentRefundBalance = Number(renter.refund_balance_cents || 0) / 100;
      const currentReferralBalance = Number(renter.referral_balance_cents || 0) / 100;

      const newRefundBalance = Math.max(0, currentRefundBalance - refundUsed);
      const newReferralBalance = Math.max(0, currentReferralBalance - referralUsed);
      const newRefundBalanceCents = Math.round(newRefundBalance * 100);
      const newReferralBalanceCents = Math.round(newReferralBalance * 100);

      // Update users
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
            refund_balance_cents: newRefundBalanceCents,
            referral_balance_cents: newReferralBalanceCents,
          }),
        }
      );

      // Update wallets (mantiene sincronizzazione)
      try {
        await fetch(
          `${SUPABASE_URL}/rest/v1/wallets?user_id=eq.${renterId}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
          body: JSON.stringify({
              refund_balance_cents: newRefundBalanceCents,
              referral_balance_cents: newReferralBalanceCents,
            }),
          }
        );
        console.log('✅ Wallets table updated');
     } catch (walletError) {
        console.error('⚠️ Wallet update failed, but users updated:', walletError);
        // Continua comunque - almeno users è aggiornato
      }

      // ⬇️ NUOVO BLOCCO QUI
      // Crea transazione wallet per tracciamento
      try {
        await fetch(
          `${SUPABASE_URL}/rest/v1/wallet_transactions`,
          {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation',
            },
            body: JSON.stringify({
              user_id: renterId,
              amount_cents: -Math.round(walletUsed * 100),
              type: 'debit',
              source: 'booking_payment',
              wallet_type: 'renter',
              description: `Pagamento prenotazione - Wallet usato: €${walletUsed.toFixed(2)}`,
              related_booking_id: booking.id,
            }),
          }
        );
        console.log('✅ Wallet transaction created');
      } catch (txError) {
        console.error('⚠️ Transaction record failed:', txError);
      }
      // ⬆️ FINE NUOVO BLOCCO

      // ⬇️ QUESTO RIMANE!
      console.log('✅ Wallet deducted:', { refundUsed, referralUsed });
    }
  }

  console.log('🎉 Payment processing completed');
}

/**
 * Gestisce pagamento fallito
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.error('❌ Payment failed:', paymentIntent.id);
  
  const metadata = paymentIntent.metadata;
  const renterId = metadata.renthubber_renter_id;

  // Log errore (opzionale: invia email a utente)
  console.log('Payment failed for renter:', renterId);
  
  // TODO: Invia email di notifica errore pagamento
}

/**
 * Gestisce aggiornamento account Connect
 */
async function handleAccountUpdated(
  account: Stripe.Account,
  SUPABASE_URL: string,
  SUPABASE_ANON_KEY: string
) {
  console.log('🔄 Account updated:', account.id);

  const userId = account.metadata?.renthubber_user_id;

  if (!userId) {
    console.log('No user ID in metadata, updating by stripe_account_id instead');
}

  // Aggiorna stato onboarding su Supabase
  await fetch(
    `${SUPABASE_URL}/rest/v1/users?stripe_account_id=eq.${account.id}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stripe_onboarding_completed: account.details_submitted || false,
        stripe_charges_enabled: account.charges_enabled || false,
        stripe_payouts_enabled: account.payouts_enabled || false,
      }),
    }
  );

  console.log('✅ User account status updated');
}

/**
 * Gestisce pagamento modifica prenotazione
 */
async function handleBookingModification(
  paymentIntent: Stripe.PaymentIntent,
  SUPABASE_URL: string,
  SUPABASE_ANON_KEY: string
) {
  console.log('🔄 Handling booking modification payment');

  const metadata = paymentIntent.metadata;
  const bookingId = metadata.booking_id;
  const newStartDate = metadata.new_start_date;
  const newEndDate = metadata.new_end_date;
  const priceDifference = parseFloat(metadata.price_difference || '0');
  const newTotal = parseFloat(metadata.new_total || '0');

  if (!bookingId) {
    console.error('❌ Missing booking_id in metadata');
    return;
  }

  console.log('📝 Updating booking:', {
    bookingId,
    newStartDate,
    newEndDate,
    newTotal,
  });

 // Prima carica il booking per prendere card_paid_cents attuale
const getBookingResponse = await fetch(
  `${SUPABASE_URL}/rest/v1/bookings?id=eq.${bookingId}&select=card_paid_cents`,
  {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  }
);

const bookings = await getBookingResponse.json();
const currentCardPaid = bookings[0]?.card_paid_cents || 0;
const newCardPaid = currentCardPaid + Math.round(priceDifference * 100);

console.log('💳 Card payment update:', {
  currentCardPaid,
  supplement: Math.round(priceDifference * 100),
  newCardPaid,
});

// Poi aggiorna il booking
const updateResponse = await fetch(
  `${SUPABASE_URL}/rest/v1/bookings?id=eq.${bookingId}`,
  {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      start_date: newStartDate,
      end_date: newEndDate,
      amount_total: newTotal,
      card_paid_cents: newCardPaid,
      updated_at: new Date().toISOString(),
    }),
  }
);

if (!updateResponse.ok) {
  const error = await updateResponse.text();
  console.error('❌ Failed to update booking:', error);
  throw new Error('Failed to update booking');
}

console.log('✅ Booking updated successfully');

  // 💬 Invia messaggio di sistema nella conversazione
try {
  const conversationId = `conv-booking-${bookingId}`;
  const listingTitle = metadata.listing_title || 'l\'annuncio';
  const newDatesFormatted = `${new Date(newStartDate).toLocaleDateString('it-IT')} - ${new Date(newEndDate).toLocaleDateString('it-IT')}`;
  
  const systemMessage = `📅 Le date della prenotazione per "${listingTitle}" sono state modificate.\n\nNuove date: ${newDatesFormatted}\nSupplemento pagato con carta: €${priceDifference.toFixed(2)}`;

  await fetch(
    `${SUPABASE_URL}/rest/v1/messages`,
    {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: `msg-modify-${bookingId}-${Date.now()}`,
        conversation_id: conversationId,
        from_user_id: metadata.renter_id,
        to_user_id: metadata.hubber_id,
        text: systemMessage,
        is_system_message: true,
        created_at: new Date().toISOString(),
      }),
    }
  );

  console.log('✅ System message sent');
} catch (err) {
  console.error('⚠️ System message failed:', err);
}

console.log('🎉 Booking modification completed');
}