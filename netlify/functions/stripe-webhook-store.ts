import { Handler } from '@netlify/functions';
import Stripe from 'stripe';

export const handler: Handler = async (event, context) => {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
  const STRIPE_WEBHOOK_SECRET_STORE = process.env.STRIPE_WEBHOOK_SECRET_STORE || '';

  if (!STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY not found');
    return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error' }) };
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
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const sig = event.headers['stripe-signature'];

  if (!sig) {
    console.error('❌ No Stripe signature found');
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'No signature' }) };
  }

  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body!, sig, STRIPE_WEBHOOK_SECRET_STORE);
    console.log('✅ Validated with STRIPE_WEBHOOK_SECRET_STORE');
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Webhook signature verification failed' }) };
  }

  console.log('🎣 Store webhook received:', stripeEvent.type);

  try {
    switch (stripeEvent.type) {

      case 'invoice.paid':
        await handleInvoicePaid(stripeEvent.data.object as Stripe.Invoice, stripe, SUPABASE_URL, SUPABASE_SERVICE_KEY);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(stripeEvent.data.object as Stripe.Subscription, SUPABASE_URL, SUPABASE_SERVICE_KEY);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(stripeEvent.data.object as Stripe.Subscription, SUPABASE_URL, SUPABASE_SERVICE_KEY);
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${stripeEvent.type}`);
    }

    return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };

  } catch (error: any) {
    console.error('❌ Store webhook handler error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};

/**
 * Pagamento abbonamento riuscito (primo mese o rinnovo)
 */
async function handleInvoicePaid(
  invoice: Stripe.Invoice,
  stripe: Stripe,
  SUPABASE_URL: string,
  SUPABASE_SERVICE_KEY: string
) {
  const subscriptionId = (invoice as any).subscription as string;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const storeId = subscription.metadata?.store_id;

  if (!storeId) {
    console.log('ℹ️ invoice.paid: nessun store_id nei metadata, ignoro');
    return;
  }

  const periodEnd = new Date((subscription as any).current_period_end * 1000).toISOString();

  await fetch(`${SUPABASE_URL}/rest/v1/stores?id=eq.${storeId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subscription_status: 'active',
      activated_at: new Date().toISOString(),
      subscription_current_period_end: periodEnd,
    }),
  });

  console.log(`✅ Store ${storeId} abbonamento attivo fino al ${periodEnd}`);

  // Registra transazione abbonamento
  await fetch(`${SUPABASE_URL}/rest/v1/store_transactions`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      store_id: storeId,
      transaction_type: 'subscription',
      amount: invoice.amount_paid,
      vat_amount: (invoice as any).tax || 0,
      net_amount: invoice.amount_paid - ((invoice as any).tax || 0),
      stripe_payment_id: typeof (invoice as any).payment_intent === 'string' ? (invoice as any).payment_intent : (invoice as any).payment_intent?.id || null,
      stripe_invoice_id: invoice.id,
      status: 'completed',
      period_start: new Date((subscription as any).current_period_start * 1000).toISOString().split('T')[0],
      period_end: new Date((subscription as any).current_period_end * 1000).toISOString().split('T')[0],
      description: 'Abbonamento mensile Piano Store',
      created_at: new Date().toISOString(),
    }),
  });

  console.log(`💳 Transazione abbonamento registrata per store ${storeId}`);
}

/**
 * Subscription aggiornata (rinnovo, past_due, ecc.)
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  SUPABASE_URL: string,
  SUPABASE_SERVICE_KEY: string
) {
  const storeId = subscription.metadata?.store_id;
  if (!storeId) return;

  const statusMap: Record<string, string> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'cancelled',
    unpaid: 'past_due',
    trialing: 'active',
    incomplete: 'pending',
    incomplete_expired: 'inactive',
    paused: 'inactive',
  };

  const newStatus = statusMap[subscription.status] ?? 'inactive';
  const periodEnd = new Date((subscription as any).current_period_end * 1000).toISOString();

  await fetch(`${SUPABASE_URL}/rest/v1/stores?id=eq.${storeId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subscription_status: newStatus,
      subscription_current_period_end: periodEnd,
    }),
  });

  console.log(`🔄 Store ${storeId} → ${newStatus}`);
}

/**
 * Subscription cancellata
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  SUPABASE_URL: string,
  SUPABASE_SERVICE_KEY: string
) {
  const storeId = subscription.metadata?.store_id;
  if (!storeId) return;

  await fetch(`${SUPABASE_URL}/rest/v1/stores?id=eq.${storeId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subscription_status: 'cancelled',
      stripe_subscription_id: null,
    }),
  });

  console.log(`❌ Store ${storeId} abbonamento cancellato`);
  // TODO: invia email tpl-store-terminated
}
