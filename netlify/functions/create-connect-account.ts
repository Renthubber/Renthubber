import { Handler } from '@netlify/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Netlify Function: Crea Stripe Connect Account per Hubber
 * 
 * POST /api/create-connect-account
 * Body: { userId: string, email: string, firstName?: string, lastName?: string }
 * 
 * Returns: { accountId: string, onboardingUrl: string }
 */
export const handler: Handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight
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
    const body = JSON.parse(event.body || '{}');
    const { userId, email, firstName, lastName } = body;

    if (!userId || !email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'userId and email are required' }),
      };
    }

    console.log('🚀 Creating Stripe Connect Account for user:', userId);

    // 1. Verifica se l'utente ha già un Connect Account
    const userResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    const users = await userResponse.json();
    const user = users[0];

    if (!user) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    let stripeAccountId = user.stripe_account_id;

    // 2. Se non ha account, crealo
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'IT', // Italia
        email: email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual', // Per privati e ditte individuali
        metadata: {
          renthubber_user_id: userId,
          platform: 'renthubber',
        },
      });

      stripeAccountId = account.id;

      // 3. Salva stripe_account_id su Supabase
      await fetch(
        `${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            stripe_account_id: stripeAccountId,
            stripe_onboarding_completed: false,
          }),
        }
      );

      console.log('✅ Stripe Connect Account created:', stripeAccountId);
    } else {
      console.log('✅ Stripe Connect Account already exists:', stripeAccountId);
    }

    // 4. Genera AccountLink per completare onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.URL || 'http://localhost:8888'}/dashboard?stripe_refresh=true`,
      return_url: `${process.env.URL || 'http://localhost:8888'}/dashboard?stripe_success=true`,
      type: 'account_onboarding',
    });

    console.log('✅ Onboarding URL generated');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        accountId: stripeAccountId,
        onboardingUrl: accountLink.url,
      }),
    };

  } catch (error: any) {
    console.error('❌ Error creating Connect Account:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Failed to create Connect Account',
      }),
    };
  }
};