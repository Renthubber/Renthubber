import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { calculateRenterFixedFee } from '../../utils/feeUtils';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

interface ModifyBookingRequest {
  bookingId: string;
  renterId: string;
  newStartDate: string;
  newEndDate: string;
  
  // Pagamento (opzionale - solo se supplemento)
  paymentMethod?: 'wallet' | 'card';
  useWallet?: boolean;
  walletAmountToUse?: number;
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
    // Crea client Supabase
    const SUPABASE_URL = process.env.SUPABASE_URL!;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    const body: ModifyBookingRequest = JSON.parse(event.body || '{}');
    
    const {
      bookingId,
      renterId,
      newStartDate,
      newEndDate,
      paymentMethod,
      useWallet = false,
      walletAmountToUse = 0,
    } = body;

    console.log('🔄 Modify Booking Request:', {
      bookingId,
      renterId,
      newStartDate,
      newEndDate,
      paymentMethod,
    });

    // ========================================
    // 1. VALIDAZIONE INPUT
    // ========================================
    if (!bookingId || !renterId || !newStartDate || !newEndDate) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // ========================================
    // 2. RECUPERA BOOKING ESISTENTE + LISTING
    // ========================================
    const bookingResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/bookings?id=eq.${bookingId}&renter_id=eq.${renterId}&select=*,listings(price,price_unit,title,host_id)`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!bookingResponse.ok) {
      throw new Error('Failed to fetch booking');
    }

    const bookings = await bookingResponse.json();
    const booking = bookings[0];

    if (!booking) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Booking not found or not yours' }),
      };
    }

    if (booking.status !== 'confirmed') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: `Cannot modify booking with status: ${booking.status}` 
        }),
      };
    }

    const listing = booking.listings;
    if (!listing) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Listing not found' }),
      };
    }

    console.log('✅ Booking found:', {
      id: booking.id,
      status: booking.status,
      originalDates: `${booking.start_date} → ${booking.end_date}`,
      newDates: `${newStartDate} → ${newEndDate}`,
    });

    // ========================================
    // 3. RICALCOLA PRICE DIFFERENCE
    // ========================================
    const listingPrice = Number(listing.price) || 0;
    const priceUnit = listing.price_unit || 'giorno';

    if (listingPrice === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid listing price' }),
      };
    }

    // Calcola giorni ORIGINALI
    const originalStart = new Date(booking.start_date);
    const originalEnd = new Date(booking.end_date);
    const originalDiffTime = Math.abs(originalEnd.getTime() - originalStart.getTime());
    let originalDays = Math.max(Math.ceil(originalDiffTime / (1000 * 60 * 60 * 24)), 1);

    // Calcola giorni NUOVI
    const newStart = new Date(newStartDate + 'T12:00:00Z'); // ← Mezzogiorno UTC
    const newEnd = new Date(newEndDate + 'T12:00:00Z');     // ← Mezzogiorno UTC
    const newDiffTime = Math.abs(newEnd.getTime() - newStart.getTime());
    let newDays = Math.max(Math.ceil(newDiffTime / (1000 * 60 * 60 * 24)), 1);

    // Adatta per unità diverse
    if (priceUnit === 'settimana') {
      originalDays = Math.max(Math.ceil(originalDays / 7), 1);
      newDays = Math.max(Math.ceil(newDays / 7), 1);
    } else if (priceUnit === 'mese') {
      originalDays = Math.max(Math.ceil(originalDays / 30), 1);
      newDays = Math.max(Math.ceil(newDays / 30), 1);
    }

    // Calcola prezzi base
    const originalBasePrice = originalDays * listingPrice;
    const newBasePrice = newDays * listingPrice;
    const basePriceDiff = newBasePrice - originalBasePrice;

   // Calcola commissioni 10%
const originalCommission = (originalBasePrice * 10) / 100;
const newCommission = (newBasePrice * 10) / 100;
const commissionDiff = newCommission - originalCommission;

// Calcola fee fissa (sul NUOVO totale, non sulla differenza!)
const originalFixedFee = calculateRenterFixedFee(originalBasePrice);
const newFixedFee = calculateRenterFixedFee(newBasePrice);
const fixedFeeDiff = newFixedFee - originalFixedFee;

// Differenza totale = prezzo base + commissione + fee fissa
const priceDifference = basePriceDiff + commissionDiff + fixedFeeDiff;

    console.log('💰 Price calculation:', {
      originalDays,
      newDays,
      originalBasePrice: originalBasePrice.toFixed(2),
      newBasePrice: newBasePrice.toFixed(2),
      originalCommission: originalCommission.toFixed(2),
      newCommission: newCommission.toFixed(2),
      priceDifference: priceDifference.toFixed(2),
    });

    // ========================================
    // 4. NUOVO TOTALE
    // ========================================
    const currentTotal = Number(booking.amount_total) || 0;
    const newTotal = currentTotal + priceDifference;

    // ========================================
    // 5. CASO A: NESSUNA DIFFERENZA (priceDifference === 0)
    // ========================================
    if (Math.abs(priceDifference) < 0.01) {
      console.log('ℹ️ No price difference, just updating dates...');

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
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (!updateResponse.ok) {
        throw new Error('Failed to update booking');
      }

      console.log('✅ Booking updated (no payment needed)');

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          priceDifference: 0,
          newTotal: currentTotal,
        }),
      };
    }

    // ========================================
    // 6. CASO B: RIMBORSO (priceDifference < 0)
    // ========================================
    if (priceDifference < 0) {
      const refundAmount = Math.abs(priceDifference);
      console.log('💸 Refund scenario:', refundAmount.toFixed(2));

      // Calcola quanto era stato pagato con wallet vs carta
      const walletPaidCents = Number(booking.wallet_used_cents) || 0;
      const cardPaidCents = Number(booking.card_paid_cents) || 0;
      const walletPaid = walletPaidCents / 100;
      const cardPaid = cardPaidCents / 100;

      let walletRefund = 0;
      let cardRefund = 0;

      // Rimborso proporzionale
      const totalPaid = walletPaid + cardPaid;
      if (totalPaid > 0) {
        const walletProportion = walletPaid / totalPaid;
        walletRefund = Math.min(refundAmount * walletProportion, walletPaid);
        cardRefund = refundAmount - walletRefund;
      }

      console.log('💸 Refund breakdown:', {
        walletRefund: walletRefund.toFixed(2),
        cardRefund: cardRefund.toFixed(2),
      });

      // Rimborso wallet (immediato)
      if (walletRefund > 0) {
        const walletUpdateResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/wallets?user_id=eq.${renterId}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              balance_cents: `balance_cents + ${Math.round(walletRefund * 100)}`,
              updated_at: new Date().toISOString(),
            }),
          }
        );

        if (!walletUpdateResponse.ok) {
          console.error('⚠️ Wallet refund failed');
        }

        // Crea transazione wallet
        await fetch(
          `${SUPABASE_URL}/rest/v1/wallet_transactions`,
          {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: renterId,
              amount_cents: Math.round(walletRefund * 100),
              type: 'credit',
              source: 'booking_modification_refund',
              wallet_type: 'renter',
              description: `Rimborso modifica prenotazione #${bookingId.slice(0, 8).toUpperCase()} (${listing.title})`,
              related_booking_id: bookingId,
              created_at: new Date().toISOString(),
            }),
          }
        );

        console.log('✅ Wallet refund completed');
      }

      // Rimborso carta (via Stripe)
      let stripeRefundId = null;
      if (cardRefund > 0 && booking.stripe_payment_intent_id) {
        try {
          const refund = await stripe.refunds.create({
            payment_intent: booking.stripe_payment_intent_id,
            amount: Math.round(cardRefund * 100),
            metadata: {
              booking_id: bookingId,
              reason: 'booking_modification',
            },
          });

          stripeRefundId = refund.id;
          console.log('✅ Stripe refund created:', refund.id);
        } catch (stripeError: any) {
          console.error('⚠️ Stripe refund failed:', stripeError.message);
        }
      }

      // Aggiorna booking
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
            refunded_wallet_cents: (Number(booking.refunded_wallet_cents) || 0) + Math.round(walletRefund * 100),
            refunded_card_cents: (Number(booking.refunded_card_cents) || 0) + Math.round(cardRefund * 100),
            stripe_refund_id: stripeRefundId || booking.stripe_refund_id,
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (!updateResponse.ok) {
        throw new Error('Failed to update booking after refund');
      }

      console.log('✅ Booking updated with refund');

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          priceDifference,
          newTotal,
          refundedWallet: walletRefund,
          refundedCard: cardRefund,
        }),
      };
    }

    // ========================================
    // 7. CASO C: SUPPLEMENTO (priceDifference > 0)
    // ========================================
    console.log('💳 Supplement scenario:', priceDifference.toFixed(2));

    // Se priceDifference è realmente > 0, richiedi paymentMethod
if (priceDifference > 0.01) {  // Margine di tolleranza per arrotondamenti
  if (!paymentMethod) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: 'Payment method required for supplement' 
      }),
    };
  }
} else {
  console.log('⚠️ Nessun supplemento reale da pagare, salto logica pagamento');
  
  // Aggiorna solo le date senza pagamento
  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      start_date: newStartDate,
      end_date: newEndDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  if (updateError) {
    console.error('❌ Error updating booking:', updateError);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to update booking dates' }),
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      message: 'Booking dates updated successfully (no payment required)',
    }),
  };
}

    // PAGAMENTO CON WALLET
    if (paymentMethod === 'wallet') {
      console.log('💰 Paying with wallet...');

      // Recupera saldo wallet
      const walletResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/wallets?user_id=eq.${renterId}`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
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

      const walletBalance = Number(wallet.balance_cents || 0) / 100;

      if (walletBalance < priceDifference) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: `Insufficient balance. Available: €${walletBalance.toFixed(2)}, Required: €${priceDifference.toFixed(2)}` 
          }),
        };
      }

      // Addebita dal wallet renter
      const newBalanceCents = Math.round((walletBalance - priceDifference) * 100);
      
      const walletUpdateResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/wallets?user_id=eq.${renterId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            balance_cents: newBalanceCents,
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (!walletUpdateResponse.ok) {
        throw new Error('Failed to debit wallet');
      }

      console.log('✅ Wallet debited');

      console.log('📝 Creating renter transaction:', {
  renterId,
  priceDifference,
  amount_cents: -Math.round(priceDifference * 100),
});

// Crea transazione wallet renter (debito)
const txResponse = await fetch(
  `${SUPABASE_URL}/rest/v1/wallet_transactions`,
  {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: renterId,
      amount_cents: -Math.round(priceDifference * 100),
      type: 'debit',
      source: 'booking_modification_charge',
      wallet_type: 'renter',
      description: `Supplemento modifica #${bookingId.slice(0, 8).toUpperCase()} (${listing.title})`,
      related_booking_id: bookingId,
      created_at: new Date().toISOString(),
    }),
  }
);

console.log('📝 Transaction response:', {
  status: txResponse.status,
  ok: txResponse.ok,
});

if (!txResponse.ok) {
  const errorText = await txResponse.text();
  console.error('❌ Transaction failed:', errorText);
}

      // Accredita all'hubber
      const hubberWalletResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/wallets?user_id=eq.${listing.host_id}`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      const hubberWallets = await hubberWalletResponse.json();
      const hubberWallet = hubberWallets[0];

      if (hubberWallet) {
        const hubberNewBalance = Number(hubberWallet.balance_cents || 0) + Math.round(priceDifference * 100);
        
        await fetch(
          `${SUPABASE_URL}/rest/v1/wallets?user_id=eq.${listing.host_id}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              balance_cents: hubberNewBalance,
              updated_at: new Date().toISOString(),
            }),
          }
        );

        // Transazione hubber (credito)
        await fetch(
          `${SUPABASE_URL}/rest/v1/wallet_transactions`,
          {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: listing.host_id,
              amount_cents: Math.round(priceDifference * 100),
              type: 'credit',
              source: 'booking_modification_income',
              wallet_type: 'hubber',
              description: `Supplemento modifica #${bookingId.slice(0, 8).toUpperCase()} (${listing.title})`,
              related_booking_id: bookingId,
              created_at: new Date().toISOString(),
            }),
          }
        );

        console.log('✅ Hubber wallet credited');
      }

      // Aggiorna booking
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
            wallet_used_cents: (Number(booking.wallet_used_cents) || 0) + Math.round(priceDifference * 100),
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (!updateResponse.ok) {
        throw new Error('Failed to update booking after wallet payment');
      }

      console.log('✅ Booking updated with wallet payment');

// 💬 Invia messaggio di sistema nella conversazione
try {
  const conversationId = `conv-booking-${bookingId}`;
  const newDatesFormatted = `${new Date(newStartDate).toLocaleDateString('it-IT')} - ${new Date(newEndDate).toLocaleDateString('it-IT')}`;
  
  const systemMessage = `Le date della prenotazione per "${listing.title}" sono state modificate.\n\n Nuove date: ${newDatesFormatted}\nSupplemento pagato: €${priceDifference.toFixed(2)}`;

  await fetch(
    `${SUPABASE_URL}/rest/v1/messages`,
    {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        id: `msg-modify-${bookingId}-${Date.now()}`,
        conversation_id: conversationId,
        from_user_id: 'system',
        to_user_id: listing.host_id,
        text: systemMessage,
        is_system_message: true,
        created_at: new Date().toISOString(),
      }),
    }
  );

  console.log('✅ System message sent to conversation');
} catch (err) {
  console.error('⚠️ Failed to send system message:', err);
}

return {
  statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          paidWithWallet: true,
          priceDifference,
          newTotal,
          chargedExtra: priceDifference,
        }),
      };
    }

    // PAGAMENTO CON CARTA
    if (paymentMethod === 'card') {
      console.log('💳 Creating Payment Intent for card...');

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(priceDifference * 100),
        currency: 'eur',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          type: 'booking_modification',
          booking_id: bookingId,
          renter_id: renterId,
          hubber_id: listing.host_id,
          listing_id: booking.listing_id,
          listing_title: listing.title,
          new_start_date: newStartDate,
          new_end_date: newEndDate,
          price_difference: priceDifference.toString(),
          new_total: newTotal.toString(),
        },
        description: `Supplemento modifica #${bookingId.slice(0, 8).toUpperCase()}`,
      });

      console.log('✅ PaymentIntent created:', paymentIntent.id);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          requiresPayment: true,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          priceDifference,
          newTotal,
        }),
      };
    }

    // Metodo di pagamento non valido
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: `Invalid payment method: ${paymentMethod}` 
      }),
    };

  } catch (error: any) {
    console.error('❌ Error modifying booking:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Failed to modify booking',
      }),
    };
  }
};