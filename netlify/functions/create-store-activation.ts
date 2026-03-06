import { Handler } from '@netlify/functions';
import Stripe from 'stripe';

/**
 * Netlify Function: Create Store Activation Payment
 *
 * POST /.netlify/functions/create-store-activation
 *
 * Crea un PaymentIntent per la quota di iscrizione store
 * €25 + IVA 22% = €30.50 (3050 centesimi)
 */
export const handler: Handler = async (event) => {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

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

  if (!STRIPE_SECRET_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Missing STRIPE_SECRET_KEY' }) };
  }

  let storeId: string;

  try {
    const body = JSON.parse(event.body || '{}');
    storeId = body.storeId;
    if (!storeId) throw new Error('Missing storeId');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-11-17.clover' });

  try {
    // Carica store da Supabase
    const storeRes = await fetch(`${SUPABASE_URL}/rest/v1/stores?id=eq.${storeId}&select=id,business_name,email,stripe_customer_id,activated_at`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });

    const stores = await storeRes.json();
    const store = stores[0];

    if (!store) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Store not found' }) };
    }

    if (store.activated_at) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Store already activated' }) };
    }

    // Crea o recupera customer Stripe
    let customerId = store.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: store.email,
        name: store.business_name,
        metadata: { store_id: storeId },
      });
      customerId = customer.id;

      await fetch(`${SUPABASE_URL}/rest/v1/stores?id=eq.${storeId}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stripe_customer_id: customerId }),
      });
    }

    // Crea PaymentIntent: €25 + IVA 22% = €30.50 = 3050 centesimi
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 3050,
      currency: 'eur',
      customer: customerId,
      metadata: {
        type: 'store_activation',
        store_id: storeId,
        business_name: store.business_name,
      },
      description: `Quota iscrizione Store RentHubber - ${store.business_name}`,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ clientSecret: paymentIntent.client_secret }),
    };

  } catch (error: any) {
    console.error('❌ create-store-activation error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
