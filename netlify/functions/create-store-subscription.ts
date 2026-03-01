import { Handler } from '@netlify/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const STORE_PRICE_ID = process.env.STRIPE_STORE_PRICE_ID || '';

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
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { storeId } = JSON.parse(event.body || '{}');

    if (!storeId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'storeId mancante' }) };
    }

    if (!STORE_PRICE_ID) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'STRIPE_STORE_PRICE_ID non configurato' }) };
    }

    console.log('🏪 Creating store subscription for:', storeId);

    // 1. Carica dati store da Supabase
    const storeResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/stores?id=eq.${storeId}&select=id,business_name,email,stripe_customer_id,subscription_status`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const stores = await storeResponse.json();
    const store = stores[0];

    if (!store) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Store non trovato' }) };
    }

    if (store.subscription_status === 'active') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Store già abbonato' }) };
    }

    // 2. Crea o recupera Stripe Customer
    let customerId = store.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: store.email,
        name: store.business_name,
        metadata: { store_id: storeId },
      });
      customerId = customer.id;

      console.log('✅ Stripe customer creato:', customerId);

      await fetch(`${SUPABASE_URL}/rest/v1/stores?id=eq.${storeId}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stripe_customer_id: customerId }),
      });
    }

    // 3. Crea Subscription con payment_behavior: default_incomplete
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: STORE_PRICE_ID }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: { store_id: storeId },
    });

    // 4. Estrai clientSecret dal PaymentIntent
    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    if (!paymentIntent?.client_secret) {
      throw new Error('ClientSecret non disponibile');
    }

    console.log('✅ Subscription creata:', subscription.id);

    // 5. Salva subscription_id (stato pending finché webhook non conferma)
    await fetch(`${SUPABASE_URL}/rest/v1/stores?id=eq.${storeId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stripe_subscription_id: subscription.id,
        subscription_status: 'pending',
      }),
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        clientSecret: paymentIntent.client_secret,
        subscriptionId: subscription.id,
      }),
    };

  } catch (error: any) {
    console.error('❌ Errore create-store-subscription:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Errore interno' }),
    };
  }
};
