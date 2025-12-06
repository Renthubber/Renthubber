import { Handler } from '@netlify/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Netlify Function: Trasferisce fondi a Hubber Connect Account
 * 
 * POST /api/create-transfer
 * Body: { bookingId: string }
 * 
 * Chiamata da pg_cron quando booking diventa "completed"
 * 
 * Returns: { success: boolean, transferId: string, amount: number }
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
    const { bookingId } = body;

    if (!bookingId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'bookingId is required' }),
      };
    }

    console.log('💸 Creating transfer for booking:', bookingId);

    // 1. Carica booking con hubber info
    const bookingResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/bookings?id=eq.${bookingId}&select=*,hubber:hubber_id(id,stripe_account_id,stripe_charges_enabled,stripe_payouts_enabled)`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    const bookings = await bookingResponse.json();
    const booking = bookings[0];

    if (!booking) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Booking not found' }),
      };
    }

    // 2. Verifica stato booking
    if (booking.status !== 'completed') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Booking must be completed before transfer',
          currentStatus: booking.status 
        }),
      };
    }

    // 3. Verifica se già trasferito
    if (booking.transfer_completed) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Transfer already completed',
          transferId: booking.stripe_transfer_id 
        }),
      };
    }

    const hubber = booking.hubber;

    if (!hubber || !hubber.stripe_account_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Hubber has no Stripe Connect Account' }),
      };
    }

    if (!hubber.stripe_charges_enabled || !hubber.stripe_payouts_enabled) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Hubber Stripe account not fully activated',
          details: {
            chargesEnabled: hubber.stripe_charges_enabled,
            payoutsEnabled: hubber.stripe_payouts_enabled
          }
        }),
      };
    }

    // 4. Calcola importo da trasferire
    const hubberNetAmount = Number(booking.hubber_net_amount || 0);
    const amountCents = Math.round(hubberNetAmount * 100);

    if (amountCents <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid transfer amount' }),
      };
    }

    console.log('💰 Transfer amount:', hubberNetAmount, '€');

    // 5. Crea Transfer su Stripe
    const transfer = await stripe.transfers.create({
      amount: amountCents,
      currency: 'eur',
      destination: hubber.stripe_account_id,
      description: `RentHubber Booking ${bookingId.substring(0, 8)}`,
      metadata: {
        renthubber_booking_id: bookingId,
        renthubber_hubber_id: booking.hubber_id,
        renthubber_listing_id: booking.listing_id,
      },
    });

    console.log('✅ Transfer created:', transfer.id);

    // 6. Aggiorna booking
    await fetch(
      `${SUPABASE_URL}/rest/v1/bookings?id=eq.${bookingId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transfer_completed: true,
          stripe_transfer_id: transfer.id,
          transfer_completed_at: new Date().toISOString(),
        }),
      }
    );

    // 7. Aggiorna hubberBalance su users (per dashboard)
    const userResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/users?id=eq.${booking.hubber_id}`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    const users = await userResponse.json();
    const hubberUser = users[0];

    if (hubberUser) {
      const currentBalance = Number(hubberUser.hubber_balance || 0);
      const newBalance = currentBalance + hubberNetAmount;

      await fetch(
        `${SUPABASE_URL}/rest/v1/users?id=eq.${booking.hubber_id}`,
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
    }

    // 8. Log transazione (opzionale)
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
          user_id: booking.hubber_id,
          wallet_type: 'hubber',
          amount: hubberNetAmount,
          type: 'credit',
          description: `Guadagno da booking ${bookingId.substring(0, 8)}`,
          booking_id: bookingId,
          created_at: new Date().toISOString(),
        }),
      }
    );

    console.log('🎉 Transfer completed successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        transferId: transfer.id,
        amount: hubberNetAmount,
        hubberAccountId: hubber.stripe_account_id,
      }),
    };

  } catch (error: any) {
    console.error('❌ Error creating transfer:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Failed to create transfer',
      }),
    };
  }
};