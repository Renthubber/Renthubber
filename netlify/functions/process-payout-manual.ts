import { Handler } from '@netlify/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Netlify Function: Processa payout MANUALE (approvato da admin)
 * 
 * POST /api/process-payout-manual
 * Body: { 
 *   payoutRequestId: string,
 *   adminId: string,
 *   approved: boolean,
 *   rejectionReason?: string 
 * }
 * 
 * Admin approva/rifiuta richiesta payout da Dashboard Admin
 * 
 * Returns: { success: boolean, stripePayoutId?: string }
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
    const body = JSON.parse(event.body || '{}');
    const { payoutRequestId, adminId, approved, rejectionReason } = body;

    if (!payoutRequestId || !adminId || approved === undefined) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    console.log('💰 Processing payout request:', {
      payoutRequestId,
      approved,
      adminId,
    });

    // 1. Carica richiesta payout
    const payoutResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/payout_requests?id=eq.${payoutRequestId}&select=*,user:user_id(id,stripe_account_id,hubber_balance,stripe_charges_enabled,stripe_payouts_enabled,first_name,last_name,email)`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    const payoutRequests = await payoutResponse.json();
    const payoutRequest = payoutRequests[0];

    if (!payoutRequest) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Payout request not found' }),
      };
    }

    // 2. Verifica stato
    if (payoutRequest.status !== 'pending') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Payout request already processed',
          currentStatus: payoutRequest.status 
        }),
      };
    }

    const hubber = payoutRequest.user;
    const requestedAmount = Number(payoutRequest.amount || 0);

    // 3. Se RIFIUTATO
    if (!approved) {
      await fetch(
        `${SUPABASE_URL}/rest/v1/payout_requests?id=eq.${payoutRequestId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'rejected',
            rejection_reason: rejectionReason || 'Rifiutato dall\'admin',
            processed_at: new Date().toISOString(),
            processed_by: adminId,
          }),
        }
      );

      console.log('❌ Payout request rejected');

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          approved: false,
          message: 'Payout request rejected',
        }),
      };
    }

    // 4. Se APPROVATO - Verifica prerequisiti

    if (!hubber || !hubber.stripe_account_id) {
      throw new Error('Hubber has no Stripe Connect Account');
    }

    if (!hubber.stripe_charges_enabled || !hubber.stripe_payouts_enabled) {
      throw new Error('Hubber Stripe account not fully activated');
    }

    const currentBalance = Number(hubber.hubber_balance || 0);

    if (requestedAmount > currentBalance) {
      throw new Error(`Insufficient balance. Current: €${currentBalance}, Requested: €${requestedAmount}`);
    }

    if (requestedAmount <= 0) {
      throw new Error('Invalid payout amount');
    }

    // 5. Verifica dispute aperte
    const disputesResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/disputes?against_user_id=eq.${hubber.id}&status=eq.open`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    const openDisputes = await disputesResponse.json();

    if (openDisputes && openDisputes.length > 0) {
      throw new Error(`Hubber has ${openDisputes.length} open disputes. Cannot process payout.`);
    }

    console.log('✅ All checks passed. Creating Stripe payout...');

    // 6. Crea Payout su Stripe
    const amountCents = Math.round(requestedAmount * 100);

    const payout = await stripe.payouts.create(
      {
        amount: amountCents,
        currency: 'eur',
        description: `RentHubber Payout - ${hubber.first_name} ${hubber.last_name}`,
        metadata: {
          renthubber_payout_request_id: payoutRequestId,
          renthubber_hubber_id: hubber.id,
          renthubber_admin_id: adminId,
        },
      },
      {
        stripeAccount: hubber.stripe_account_id, // Payout dal Connect Account
      }
    );

    console.log('✅ Stripe payout created:', payout.id);

    // 7. Aggiorna richiesta payout
    await fetch(
      `${SUPABASE_URL}/rest/v1/payout_requests?id=eq.${payoutRequestId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'approved',
          stripe_payout_id: payout.id,
          processed_at: new Date().toISOString(),
          processed_by: adminId,
          paid_at: new Date().toISOString(), // Stripe payout è immediato
        }),
      }
    );

    // 8. Deduce hubberBalance
    const newBalance = currentBalance - requestedAmount;

    await fetch(
      `${SUPABASE_URL}/rest/v1/users?id=eq.${hubber.id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hubber_balance: newBalance,
        }),
      }
    );

    console.log('✅ Hubber balance updated:', newBalance, '€');

    // 9. Log transazione
    await fetch(
      `${SUPABASE_URL}/rest/v1/transactions`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: hubber.id,
          wallet_type: 'hubber',
          amount: -requestedAmount, // Negativo perché è uscita
          type: 'debit',
          description: `Bonifico a ${payoutRequest.iban || 'banca'}`,
          payout_request_id: payoutRequestId,
          created_at: new Date().toISOString(),
        }),
      }
    );

    console.log('🎉 Payout processed successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        approved: true,
        stripePayoutId: payout.id,
        amount: requestedAmount,
        newBalance: newBalance,
      }),
    };

  } catch (error: any) {
    console.error('❌ Error processing payout:', error);
    
    // Salva errore nel payout request
    try {
      const body = JSON.parse(event.body || '{}');
      const { payoutRequestId } = body;
      
      if (payoutRequestId) {
        await fetch(
          `${SUPABASE_URL}/rest/v1/payout_requests?id=eq.${payoutRequestId}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: 'rejected',
              rejection_reason: error.message,
              processed_at: new Date().toISOString(),
            }),
          }
        );
      }
    } catch (e) {
      console.error('Failed to update payout request with error:', e);
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Failed to process payout',
      }),
    };
  }
};