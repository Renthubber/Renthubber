import { Handler } from '@netlify/functions';
import Stripe from 'stripe';

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
    apiVersion: '2024-11-20.acacia',
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
        await handlePaymentIntentSucceeded(stripeEvent.data.object as Stripe.PaymentIntent, SUPABASE_URL, SUPABASE_ANON_KEY);
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

  // 1. Crea booking
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
        wallet_used_cents: Math.round(walletUsed * 100),
        status: 'confirmed',
        stripe_payment_intent_id: paymentIntent.id,
        created_at: new Date().toISOString(),
      }),
    }
  );

  if (!bookingResponse.ok) {
    const error = await bookingResponse.text();
    console.error('❌ Failed to create booking:', error);
    throw new Error('Failed to create booking');
  }

  const bookings = await bookingResponse.json();
  const booking = bookings[0];

  console.log('✅ Booking created:', booking.id);

  // 📧 INSERISCI EMAIL IN QUEUE (il trigger non funziona con REST API)
try {
  console.log('📧 Inserting booking confirmation emails...');
  
  // Carica listing per categoria e title
  const listingResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/listings?id=eq.${listingId}&select=title,category,owner_id`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );
  const listings = await listingResponse.json();
  const listing = listings[0];
  
  if (!listing) {
    console.error('❌ Listing not found for email');
    throw new Error('Listing not found');
  }
  
  // Carica renter
  const renterResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/users?id=eq.${renterId}&select=email,first_name,last_name,public_name`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );
  const renters = await renterResponse.json();
  const renter = renters[0];
  
  // Carica hubber
  const hubberResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/users?id=eq.${hubberId}&select=email,first_name,last_name,public_name`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );
  const hubbers = await hubberResponse.json();
  const hubber = hubbers[0];
  
  if (!renter || !hubber) {
    console.error('❌ User data not found for email');
    throw new Error('User data not found');
  }
  
  const renterName = renter.public_name || `${renter.first_name || ''} ${renter.last_name || ''}`.trim() || 'Utente';
  const hubberName = hubber.public_name || `${hubber.first_name || ''} ${hubber.last_name || ''}`.trim() || 'Hubber';
  
  // Template basato su categoria
  const isSpace = listing.category?.toLowerCase() === 'spazi';
  const renterTemplate = isSpace ? 'tpl-booking-confirmed-space-renter' : 'tpl-booking-confirmed-object-renter';
  const hubberTemplate = isSpace ? 'tpl-booking-confirmed-space-hubber' : 'tpl-booking-confirmed-object-hubber';
  
  // Carica i template per subject e body
  const renterTplResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/email_templates?id=eq.${renterTemplate}&select=subject,body_html,body_text`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );
  const renterTemplates = await renterTplResponse.json();
  const renterTpl = renterTemplates[0];
  
  const hubberTplResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/email_templates?id=eq.${hubberTemplate}&select=subject,body_html,body_text`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );
  const hubberTemplates = await hubberTplResponse.json();
  const hubberTpl = hubberTemplates[0];
  
  if (!renterTpl || !hubberTpl) {
    console.error('❌ Email templates not found');
    throw new Error('Email templates not found');
  }
  
  // Inserisci email al RENTER
  await fetch(
    `${SUPABASE_URL}/rest/v1/email_queue`,
    {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_id: renterTemplate,
        recipient_email: renter.email,
        recipient_name: renterName,
        recipient_user_id: renterId,
        subject: renterTpl.subject,
        body_html: renterTpl.body_html,
        body_text: renterTpl.body_text,
        variables: {
          name: renterName,
          listing: listing.title,
          start_date: new Date(startDate).toLocaleDateString('it-IT'),
          end_date: new Date(endDate).toLocaleDateString('it-IT'),
          amount: totalAmount.toFixed(2)
        },
        status: 'pending',
        scheduled_at: new Date().toISOString()
      }),
    }
  );
  
  // Inserisci email all'HUBBER
  await fetch(
    `${SUPABASE_URL}/rest/v1/email_queue`,
    {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_id: hubberTemplate,
        recipient_email: hubber.email,
        recipient_name: hubberName,
        recipient_user_id: hubberId,
        subject: hubberTpl.subject,
        body_html: hubberTpl.body_html,
        body_text: hubberTpl.body_text,
        variables: {
          name: hubberName,
          listing: listing.title,
          renter: renterName,
          start_date: new Date(startDate).toLocaleDateString('it-IT'),
          end_date: new Date(endDate).toLocaleDateString('it-IT'),
          hubber_amount: (basePrice + cleaningFee - hubberFee).toFixed(2)
        },
        status: 'pending',
        scheduled_at: new Date().toISOString()
      }),
    }
  );
  
  console.log('✅ Booking confirmation emails inserted in queue');
} catch (emailError) {
  console.error('⚠️ Failed to insert emails (non-blocking):', emailError);
}

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
    console.log('No user ID in account metadata');
    return;
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