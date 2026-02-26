import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { calculateRenterFee, calculateHubberFee } from '../../utils/feeUtils';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

interface CreatePaymentIntentRequest {
  listingId: string;
  listingTitle: string;
  renterId: string;
  hubberId: string;
  startDate: string;
  endDate: string;
  
  // Prezzi
  basePrice: number;
  renterFee: number;
  hubberFee: number;
  deposit: number;
  cleaningFee?: number;
  extraGuestsCount?: number;
  extraGuestsFee?: number;
  totalAmount: number;
  
  // Wallet da usare
  useWallet: boolean;
  generalBalanceToUse?: number;
  refundBalanceToUse?: number;
  referralBalanceToUse?: number;
}

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
      listingTitle = '',
      renterId,
      hubberId,
      startDate,
      endDate,
      basePrice,
      renterFee,
      hubberFee,
      deposit,
      cleaningFee = 0,
      extraGuestsCount = 0,
      extraGuestsFee = 0,
      totalAmount,
      useWallet,
      generalBalanceToUse = 0,
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
      generalBalanceToUse,
      refundBalanceToUse,
      referralBalanceToUse,
    });

    // 1. Carica saldi wallet da WALLETS TABLE
    const walletResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/wallets?user_id=eq.${renterId}`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const wallets = await walletResponse.json();
    const wallet = wallets[0];

    if (!wallet) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Wallet not found' }),
      };
    }

    // 2. Verifica saldi disponibili
    const generalBalance = Number(wallet.balance_cents || 0) / 100;
    const refundBalance = Number(wallet.refund_balance_cents || 0) / 100;
    const referralBalance = Number(wallet.referral_balance_cents || 0) / 100;

    console.log('💰 Current balances:', {
      generalBalance,
      refundBalance,
      referralBalance,
    });

    if (generalBalanceToUse > generalBalance) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Insufficient general balance' }),
      };
    }

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
    const walletUsedTotal = useWallet ? (generalBalanceToUse + refundBalanceToUse + referralBalanceToUse) : 0;
    const amountToPay = Math.max(0, totalAmount - walletUsedTotal);
    const amountToPayCents = Math.round(amountToPay * 100);

    console.log('💰 Wallet calculation:', {
      totalAmount,
      generalBalanceToUse,
      refundBalanceToUse,
      referralBalanceToUse,
      walletUsedTotal,
      amountToPay,
    });

    // 4. Se tutto pagato con wallet, salta Stripe
    if (amountToPayCents === 0) {
      console.log('✅ Payment 100% with wallet, creating booking...');
      
      const bookingData = {
        listing_id: listingId,
        renter_id: renterId,
        hubber_id: hubberId,
        start_date: startDate,
        end_date: endDate,
        amount_total: totalAmount,
        platform_fee: renterFee,
        service_fee: hubberFee,
        hubber_net_amount: basePrice + cleaningFee - hubberFee,
        cleaning_fee: cleaningFee,
        deposit: deposit,
        wallet_used_cents: Math.round(walletUsedTotal * 100),
        status: 'confirmed',
        stripe_payment_intent_id: null,
        created_at: new Date().toISOString(),
      };

      console.log('📝 Creating booking with data:', bookingData);

      // ✅ Usa function database create_booking_with_payment
      const bookingResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/rpc/create_booking_with_payment`,
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
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
            p_wallet_used_cents: Math.round(walletUsedTotal * 100),
            p_extra_guests_count: extraGuestsCount,
            p_extra_guests_fee_cents: Math.round(extraGuestsFee * 100),
            p_provider: 'wallet',
            p_provider_payment_id: 'WALLET_PAYMENT',
          }),
        }
      );

      console.log('📝 Booking response status:', bookingResponse.status);

      if (!bookingResponse.ok) {
        const errorText = await bookingResponse.text();
        console.error('❌ Booking creation failed:', errorText);
        throw new Error(`Failed to create booking: ${errorText}`);
      }

      const bookingResult = await bookingResponse.json();
      console.log('📝 Booking result:', JSON.stringify(bookingResult));

      // Gestisci sia array che oggetto singolo
      const booking = Array.isArray(bookingResult) ? bookingResult[0] : bookingResult;

      if (!booking || !booking.id) {
        console.error('❌ No booking ID in response');
        throw new Error('Failed to create booking: No ID returned');
      }

      console.log('✅ Booking created:', booking.id);
        /*
      // Scala i crediti dal wallet
      const newGeneralBalanceCents = Math.round((generalBalance - generalBalanceToUse) * 100);
      const newRefundBalanceCents = Math.round((refundBalance - refundBalanceToUse) * 100);
      const newReferralBalanceCents = Math.round((referralBalance - referralBalanceToUse) * 100);

      console.log('💰 Updating wallet balances:', {
        general: newGeneralBalanceCents,
        refund: newRefundBalanceCents,
        referral: newReferralBalanceCents,
      });

      const walletUpdateResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/wallets?user_id=eq.${renterId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            balance_cents: newGeneralBalanceCents,
            refund_balance_cents: newRefundBalanceCents,
            referral_balance_cents: newReferralBalanceCents,
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (!walletUpdateResponse.ok) {
        const errorText = await walletUpdateResponse.text();
        console.error('⚠️ Wallet update failed:', errorText);
      } else {
        console.log('✅ Wallet updated successfully');
      }
       */
      
      // Crea transazioni wallet per tracciabilità
      const transactions = [];
      
      // Formato uniforme per tutte le transazioni: "Pagamento prenotazione #ID (Titolo)"
      const txDescription = `Pagamento prenotazione #${booking.id.slice(0, 8).toUpperCase()} (${listingTitle})`;
      
      if (generalBalanceToUse > 0) {
        transactions.push({
          user_id: renterId,
          amount_cents: -Math.round(generalBalanceToUse * 100),
          type: 'debit',
          source: 'booking_payment',
          wallet_type: 'renter',
          description: txDescription,
          related_booking_id: booking.id,
          created_at: new Date().toISOString(),
        });
      }

      if (refundBalanceToUse > 0) {
        transactions.push({
          user_id: renterId,
          amount_cents: -Math.round(refundBalanceToUse * 100),
          type: 'debit',
          source: 'booking_payment',
          wallet_type: 'renter',
          description: txDescription,
          related_booking_id: booking.id,
          created_at: new Date().toISOString(),
        });
      }

      if (referralBalanceToUse > 0) {
        transactions.push({
          user_id: renterId,
          amount_cents: -Math.round(referralBalanceToUse * 100),
          type: 'debit',
          source: 'booking_payment',
          wallet_type: 'renter',
          description: txDescription,
          related_booking_id: booking.id,
          created_at: new Date().toISOString(),
        });
      }

      console.log(`💳 Creating ${transactions.length} wallet transactions...`);

      if (transactions.length > 0) {
        const txResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/wallet_transactions`,
          {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(transactions),
          }
        );

        if (!txResponse.ok) {
          const errorText = await txResponse.text();
          console.error('⚠️ Wallet transactions creation failed:', errorText);
        } else {
          console.log('✅ Wallet transactions created successfully');
        }
      }

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
        renthubber_extra_guests_count: extraGuestsCount.toString(),
        renthubber_extra_guests_fee: extraGuestsFee.toString(),
        renthubber_total_amount: totalAmount.toString(),
        renthubber_wallet_used: walletUsedTotal.toString(),
        renthubber_general_used: generalBalanceToUse.toString(),
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