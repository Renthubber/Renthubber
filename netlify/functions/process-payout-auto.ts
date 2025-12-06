import { Handler } from '@netlify/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

// 🎛️ CONFIGURAZIONE PAYOUT AUTOMATICO
const AUTO_PAYOUT_CONFIG = {
  enabled: process.env.AUTO_PAYOUT_ENABLED === 'true', // Toggle generale
  maxAmountAuto: parseFloat(process.env.AUTO_PAYOUT_MAX_AMOUNT || '200'), // Max €200 automatico
  minBalance: parseFloat(process.env.AUTO_PAYOUT_MIN_BALANCE || '50'), // Min €50 per richiedere
  requireVerifiedAccount: true, // Account deve essere completamente verificato
  checkOpenDisputes: true, // Verifica dispute aperte
  minAccountAgeDays: 30, // Account hubber deve avere almeno 30 giorni
  minCompletedBookings: 5, // Almeno 5 booking completati
};

/**
 * Netlify Function: Processa payout AUTOMATICO (con verifiche)
 * 
 * POST /api/process-payout-auto
 * Body: { payoutRequestId: string }
 * 
 * Sistema automatico con verifiche:
 * - Importo <= soglia configurabile
 * - Account verificato
 * - Nessuna disputa aperta
 * - Account anzianità minima
 * - Booking completati minimi
 * 
 * Returns: { success: boolean, approved: boolean, reason?: string }
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
    const { payoutRequestId } = body;

    if (!payoutRequestId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'payoutRequestId is required' }),
      };
    }

    // 0. Verifica se auto-payout è abilitato
    if (!AUTO_PAYOUT_CONFIG.enabled) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Automatic payouts are disabled. Use manual approval.',
          approved: false,
          requiresManualApproval: true,
        }),
      };
    }

    console.log('🤖 Processing automatic payout:', payoutRequestId);

    // 1. Carica richiesta payout con dati hubber
    const payoutResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/payout_requests?id=eq.${payoutRequestId}&select=*,user:user_id(id,stripe_account_id,hubber_balance,stripe_charges_enabled,stripe_payouts_enabled,first_name,last_name,email,created_at,hubber_since)`,
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

    console.log('📊 Checking eligibility:', {
      amount: requestedAmount,
      maxAuto: AUTO_PAYOUT_CONFIG.maxAmountAuto,
    });

    // 2. VERIFICA IMPORTO
    if (requestedAmount > AUTO_PAYOUT_CONFIG.maxAmountAuto) {
      const reason = `Amount €${requestedAmount} exceeds automatic limit (€${AUTO_PAYOUT_CONFIG.maxAmountAuto}). Requires manual approval.`;
      
      await updatePayoutStatus(payoutRequestId, 'pending', reason);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          approved: false,
          requiresManualApproval: true,
          reason: reason,
        }),
      };
    }

    // 3. VERIFICA BALANCE
    const currentBalance = Number(hubber.hubber_balance || 0);
    
    if (requestedAmount > currentBalance) {
      const reason = `Insufficient balance. Current: €${currentBalance}, Requested: €${requestedAmount}`;
      
      await updatePayoutStatus(payoutRequestId, 'rejected', reason);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          approved: false,
          reason: reason,
        }),
      };
    }

    if (requestedAmount < AUTO_PAYOUT_CONFIG.minBalance) {
      const reason = `Amount below minimum (€${AUTO_PAYOUT_CONFIG.minBalance})`;
      
      await updatePayoutStatus(payoutRequestId, 'rejected', reason);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          approved: false,
          reason: reason,
        }),
      };
    }

    // 4. VERIFICA STRIPE ACCOUNT
    if (!hubber.stripe_account_id || !hubber.stripe_charges_enabled || !hubber.stripe_payouts_enabled) {
      const reason = 'Stripe Connect Account not fully activated';
      
      await updatePayoutStatus(payoutRequestId, 'rejected', reason);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          approved: false,
          reason: reason,
        }),
      };
    }

    // 5. VERIFICA DISPUTE APERTE
    if (AUTO_PAYOUT_CONFIG.checkOpenDisputes) {
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
        const reason = `Hubber has ${openDisputes.length} open disputes. Cannot process payout.`;
        
        await updatePayoutStatus(payoutRequestId, 'pending', reason);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            approved: false,
            requiresManualApproval: true,
            reason: reason,
          }),
        };
      }
    }

    // 6. VERIFICA ANZIANITÀ ACCOUNT
    const hubberSince = new Date(hubber.hubber_since || hubber.created_at);
    const accountAgeDays = Math.floor((Date.now() - hubberSince.getTime()) / (1000 * 60 * 60 * 24));

    if (accountAgeDays < AUTO_PAYOUT_CONFIG.minAccountAgeDays) {
      const reason = `Account too new (${accountAgeDays} days). Minimum: ${AUTO_PAYOUT_CONFIG.minAccountAgeDays} days. Requires manual approval.`;
      
      await updatePayoutStatus(payoutRequestId, 'pending', reason);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          approved: false,
          requiresManualApproval: true,
          reason: reason,
        }),
      };
    }

    // 7. VERIFICA BOOKING COMPLETATI
    const bookingsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/bookings?hubber_id=eq.${hubber.id}&status=eq.completed&select=id`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    const completedBookings = await bookingsResponse.json();
    const bookingCount = completedBookings.length;

    if (bookingCount < AUTO_PAYOUT_CONFIG.minCompletedBookings) {
      const reason = `Insufficient completed bookings (${bookingCount}). Minimum: ${AUTO_PAYOUT_CONFIG.minCompletedBookings}. Requires manual approval.`;
      
      await updatePayoutStatus(payoutRequestId, 'pending', reason);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          approved: false,
          requiresManualApproval: true,
          reason: reason,
        }),
      };
    }

    console.log('✅ All automatic checks passed. Creating Stripe payout...');

    // 8. CREA PAYOUT SU STRIPE
    const amountCents = Math.round(requestedAmount * 100);

    const payout = await stripe.payouts.create(
      {
        amount: amountCents,
        currency: 'eur',
        description: `RentHubber Auto Payout - ${hubber.first_name} ${hubber.last_name}`,
        metadata: {
          renthubber_payout_request_id: payoutRequestId,
          renthubber_hubber_id: hubber.id,
          automatic: 'true',
        },
      },
      {
        stripeAccount: hubber.stripe_account_id,
      }
    );

    console.log('✅ Stripe payout created:', payout.id);

    // 9. Aggiorna payout request
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
          processed_by: null, // Automatico
          paid_at: new Date().toISOString(),
          automatic_approval: true,
        }),
      }
    );

    // 10. Deduce balance
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

    // 11. Log transazione
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
          amount: -requestedAmount,
          type: 'debit',
          description: `Bonifico automatico a ${payoutRequest.iban || 'banca'}`,
          payout_request_id: payoutRequestId,
          created_at: new Date().toISOString(),
        }),
      }
    );

    console.log('🎉 Automatic payout processed successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        approved: true,
        stripePayoutId: payout.id,
        amount: requestedAmount,
        newBalance: newBalance,
        automatic: true,
      }),
    };

  } catch (error: any) {
    console.error('❌ Error processing automatic payout:', error);
    
    try {
      const body = JSON.parse(event.body || '{}');
      const { payoutRequestId } = body;
      
      if (payoutRequestId) {
        await updatePayoutStatus(payoutRequestId, 'rejected', error.message);
      }
    } catch (e) {
      console.error('Failed to update payout request:', e);
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Failed to process automatic payout',
      }),
    };
  }
};

// Helper function
async function updatePayoutStatus(payoutRequestId: string, status: string, reason?: string) {
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
        status: status,
        rejection_reason: reason || null,
        processed_at: new Date().toISOString(),
      }),
    }
  );
}