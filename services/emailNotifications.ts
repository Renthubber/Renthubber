/**
 * 📧 EMAIL NOTIFICATIONS
 * 
 * Sistema centralizzato per l'invio di email transazionali.
 * Ogni funzione determina automaticamente il template corretto in base al listing_type.
 */

import { queueCustomEmail } from './emailQueue';
import { supabase } from './supabaseClient';

// ============================================================================
// 🔧 HELPER FUNCTIONS
// ============================================================================

/**
 * Helper: Invia email a un utente
 */
async function sendToUser(userId: string, templateId: string, variables: Record<string, any> = {}) {
  const { data: user } = await supabase
    .from('users')
    .select('email, first_name, last_name, public_name')
    .eq('id', userId)
    .single();
  
  if (!user) {
    console.warn(`⚠️ User not found: ${userId}`);
    return;
  }
  
  const name = user.public_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Utente';
  
  await queueCustomEmail({
    templateId,
    recipientEmail: user.email,
    recipientName: name,
    recipientUserId: userId,
    variables: { ...variables, name }
  });
}

/**
 * Helper: Recupera il listing_type di una prenotazione
 */
async function getBookingListingType(bookingId: string): Promise<'object' | 'space'> {
  const { data: booking } = await supabase
    .from('bookings')
    .select('listing_type')
    .eq('id', bookingId)
    .single();
    
  return booking?.listing_type || 'object';
}

/**
 * Helper: Invia email a renter e hubber di una prenotazione
 */
async function sendToBookingUsers(
  bookingId: string,
  renterTemplateSlug: string,
  hubberTemplateSlug: string,
  variables: Record<string, any> = {}
) {
  const { data: booking } = await supabase
    .from('bookings')
    .select('renter_id, hubber_id')
    .eq('id', bookingId)
    .single();
  
  if (!booking) {
    console.warn(`⚠️ Booking not found: ${bookingId}`);
    return;
  }
  
  const enrichedVariables = { ...variables, bookingId };
  
  await sendToUser(booking.renter_id, renterTemplateSlug, enrichedVariables);
  await sendToUser(booking.hubber_id, hubberTemplateSlug, enrichedVariables);
}

// ============================================================================
// 📦 PRENOTAZIONI
// ============================================================================

/**
 * Notifica nuova richiesta di prenotazione (a renter e hubber)
 */
export const notifyBookingRequested = async (bookingId: string) => {
  try {
    const listingType = await getBookingListingType(bookingId);
    const renterSlug = listingType === 'space' ? 'booking-request-space-renter' : 'booking-request-object-renter';
    const hubberSlug = listingType === 'space' ? 'booking-request-space-hubber' : 'booking-request-object-hubber';
    
    await sendToBookingUsers(bookingId, renterSlug, hubberSlug);
  } catch (error) {
    console.error('❌ Errore notifyBookingRequested:', error);
  }
};

/**
 * Notifica prenotazione confermata (a renter e hubber)
 */
export const notifyBookingConfirmed = async (bookingId: string) => {
  try {
    const listingType = await getBookingListingType(bookingId);
    const renterSlug = listingType === 'space' ? 'booking-confirmed-space-renter' : 'booking-confirmed-object-renter';
    const hubberSlug = listingType === 'space' ? 'booking-confirmed-space-hubber' : 'booking-confirmed-object-hubber';
    
    await sendToBookingUsers(bookingId, renterSlug, hubberSlug);
  } catch (error) {
    console.error('❌ Errore notifyBookingConfirmed:', error);
  }
};

/**
 * Notifica prenotazione rifiutata (solo a renter)
 */
export const notifyBookingRejected = async (bookingId: string) => {
  try {
    const { data: booking } = await supabase
      .from('bookings')
      .select('renter_id, listing_type')
      .eq('id', bookingId)
      .single();
    
    if (!booking) return;
    
    const listingType = booking.listing_type || 'object';
    const renterSlug = listingType === 'space' ? 'booking-rejected-space-renter' : 'booking-rejected-object-renter';
    
    await sendToUser(booking.renter_id, renterSlug, { bookingId });
  } catch (error) {
    console.error('❌ Errore notifyBookingRejected:', error);
  }
};

/**
 * Notifica prenotazione cancellata (a renter e hubber)
 */
export const notifyBookingCancelled = async (bookingId: string) => {
  try {
    const listingType = await getBookingListingType(bookingId);
    const renterSlug = listingType === 'space' ? 'booking-cancelled-space-renter' : 'booking-cancelled-object-renter';
    const hubberSlug = listingType === 'space' ? 'booking-cancelled-space-hubber' : 'booking-cancelled-object-hubber';
    
    await sendToBookingUsers(bookingId, renterSlug, hubberSlug);
  } catch (error) {
    console.error('❌ Errore notifyBookingCancelled:', error);
  }
};

/**
 * Notifica prenotazione completata (a renter e hubber)
 */
export const notifyBookingCompleted = async (bookingId: string) => {
  try {
    const listingType = await getBookingListingType(bookingId);
    const renterSlug = listingType === 'space' ? 'booking-completed-space-renter' : 'booking-completed-object-renter';
    const hubberSlug = listingType === 'space' ? 'booking-completed-space-hubber' : 'booking-completed-object-hubber';
    
    await sendToBookingUsers(bookingId, renterSlug, hubberSlug);
  } catch (error) {
    console.error('❌ Errore notifyBookingCompleted:', error);
  }
};

/**
 * Notifica fattura generata (a renter e hubber)
 */
export const notifyInvoiceGenerated = async (bookingId: string) => {
  try {
    const listingType = await getBookingListingType(bookingId);
    const renterSlug = listingType === 'space' ? 'invoice-space-renter' : 'invoice-object-renter';
    const hubberSlug = listingType === 'space' ? 'invoice-space-hubber' : 'invoice-object-hubber';
    
    await sendToBookingUsers(bookingId, renterSlug, hubberSlug);
  } catch (error) {
    console.error('❌ Errore notifyInvoiceGenerated:', error);
  }
};

// ============================================================================
// 💰 WALLET & PAYOUT
// ============================================================================

/**
 * Notifica richiesta payout ricevuta
 */
export const notifyPayoutRequested = async (payoutId: string) => {
  try {
    const { data: payout } = await supabase
      .from('payout_requests')
      .select('user_id')
      .eq('id', payoutId)
      .single();
    
    if (!payout) return;
    
    await sendToUser(payout.user_id, 'payout-requested', { payoutId });
  } catch (error) {
    console.error('❌ Errore notifyPayoutRequested:', error);
  }
};

/**
 * Notifica payout inviato con successo
 */
export const notifyPayoutSent = async (payoutId: string) => {
  try {
    const { data: payout } = await supabase
      .from('payout_requests')
      .select('user_id')
      .eq('id', payoutId)
      .single();
    
    if (!payout) return;
    
    await sendToUser(payout.user_id, 'payout-sent', { payoutId });
  } catch (error) {
    console.error('❌ Errore notifyPayoutSent:', error);
  }
};

/**
 * Notifica payout fallito
 */
export const notifyPayoutFailed = async (payoutId: string) => {
  try {
    const { data: payout } = await supabase
      .from('payout_requests')
      .select('user_id')
      .eq('id', payoutId)
      .single();
    
    if (!payout) return;
    
    await sendToUser(payout.user_id, 'payout-failed', { payoutId });
  } catch (error) {
    console.error('❌ Errore notifyPayoutFailed:', error);
  }
};

/**
 * Notifica credito wallet
 */
export const notifyWalletCredit = async (transactionId: string) => {
  try {
    const { data: transaction } = await supabase
      .from('wallet_transactions')
      .select('user_id')
      .eq('id', transactionId)
      .single();
    
    if (!transaction) return;
    
    await sendToUser(transaction.user_id, 'wallet-credit', { transactionId });
  } catch (error) {
    console.error('❌ Errore notifyWalletCredit:', error);
  }
};

/**
 * Notifica addebito wallet
 */
export const notifyWalletDebit = async (transactionId: string) => {
  try {
    const { data: transaction } = await supabase
      .from('wallet_transactions')
      .select('user_id')
      .eq('id', transactionId)
      .single();
    
    if (!transaction) return;
    
    await sendToUser(transaction.user_id, 'wallet-debit', { transactionId });
  } catch (error) {
    console.error('❌ Errore notifyWalletDebit:', error);
  }
};

/**
 * Notifica rimborso wallet
 */
export const notifyWalletRefund = async (transactionId: string) => {
  try {
    const { data: transaction } = await supabase
      .from('wallet_transactions')
      .select('user_id')
      .eq('id', transactionId)
      .single();
    
    if (!transaction) return;
    
    await sendToUser(transaction.user_id, 'wallet-refund', { transactionId });
  } catch (error) {
    console.error('❌ Errore notifyWalletRefund:', error);
  }
};

// ============================================================================
// 🆔 KYC / VERIFICA DOCUMENTI
// ============================================================================

/**
 * Notifica documento ricevuto (conferma caricamento)
 */
export const notifyKycReceived = async (userId: string) => {
  try {
    await sendToUser(userId, 'kyc-received', { userId });
  } catch (error) {
    console.error('❌ Errore notifyKycReceived:', error);
  }
};

/**
 * Notifica documento approvato
 */
export const notifyKycApproved = async (userId: string) => {
  try {
    await sendToUser(userId, 'kyc-approved', { userId });
  } catch (error) {
    console.error('❌ Errore notifyKycApproved:', error);
  }
};

/**
 * Notifica documento rifiutato
 */
export const notifyKycRejected = async (userId: string) => {
  try {
    await sendToUser(userId, 'kyc-rejected', { userId });
  } catch (error) {
    console.error('❌ Errore notifyKycRejected:', error);
  }
};

// ============================================================================
// 📋 ANNUNCI / LISTING
// ============================================================================

/**
 * Notifica annuncio approvato
 */
export const notifyListingApproved = async (listingId: string) => {
  try {
    const { data: listing } = await supabase
      .from('listings')
      .select('user_id, listing_type')
      .eq('id', listingId)
      .single();
    
    if (!listing) return;
    
    const listingType = listing.listing_type || 'object';
    const slug = listingType === 'space' ? 'listing-approved-space' : 'listing-approved-object';
    
    await sendToUser(listing.user_id, slug, { listingId });
  } catch (error) {
    console.error('❌ Errore notifyListingApproved:', error);
  }
};

/**
 * Notifica annuncio rifiutato
 */
export const notifyListingRejected = async (listingId: string) => {
  try {
    const { data: listing } = await supabase
      .from('listings')
      .select('user_id')
      .eq('id', listingId)
      .single();
    
    if (!listing) return;
    
    await sendToUser(listing.user_id, 'listing-rejected', { listingId });
  } catch (error) {
    console.error('❌ Errore notifyListingRejected:', error);
  }
};

/**
 * Notifica annuncio sospeso/pausato
 */
export const notifyListingPaused = async (listingId: string) => {
  try {
    const { data: listing } = await supabase
      .from('listings')
      .select('user_id')
      .eq('id', listingId)
      .single();
    
    if (!listing) return;
    
    await sendToUser(listing.user_id, 'listing-paused', { listingId });
  } catch (error) {
    console.error('❌ Errore notifyListingPaused:', error);
  }
};

/**
 * Notifica annuncio scaduto
 */
export const notifyListingExpired = async (listingId: string) => {
  try {
    const { data: listing } = await supabase
      .from('listings')
      .select('user_id')
      .eq('id', listingId)
      .single();
    
    if (!listing) return;
    
    await sendToUser(listing.user_id, 'listing-expired', { listingId });
  } catch (error) {
    console.error('❌ Errore notifyListingExpired:', error);
  }
};

// ============================================================================
// 🏆 SUPERHUBBER
// ============================================================================

/**
 * Notifica status SuperHubber ottenuto
 */
export const notifySuperHubberAchieved = async (userId: string) => {
  try {
    await sendToUser(userId, 'superhubber', { userId });
  } catch (error) {
    console.error('❌ Errore notifySuperHubberAchieved:', error);
  }
};

/**
 * Notifica status SuperHubber perso
 */
export const notifySuperHubberLost = async (userId: string) => {
  try {
    await sendToUser(userId, 'superhubber-lost', { userId });
  } catch (error) {
    console.error('❌ Errore notifySuperHubberLost:', error);
  }
};

// ============================================================================
// 🎁 REFERRAL
// ============================================================================

/**
 * Notifica amico iscritto tramite referral
 */
export const notifyReferralSignup = async (referrerId: string) => {
  try {
    await sendToUser(referrerId, 'referral-signup', { userId: referrerId });
  } catch (error) {
    console.error('❌ Errore notifyReferralSignup:', error);
  }
};

/**
 * Notifica bonus referral accreditato
 */
export const notifyReferralBonus = async (userId: string) => {
  try {
    await sendToUser(userId, 'referral-bonus', { userId });
  } catch (error) {
    console.error('❌ Errore notifyReferralBonus:', error);
  }
};

// ============================================================================
// 📝 RICHIESTE RECENSIONE
// ============================================================================

/**
 * Notifica richiesta recensione dopo prenotazione completata
 */
export const notifyReviewRequest = async (bookingId: string, recipientRole: 'renter' | 'hubber') => {
  try {
    const { data: booking } = await supabase
      .from('bookings')
      .select('renter_id, hubber_id, listing_type')
      .eq('id', bookingId)
      .single();
    
    if (!booking) return;
    
    const listingType = booking.listing_type || 'object';
    let slug: string;
    let userId: string;
    
    if (recipientRole === 'hubber') {
      slug = 'review-request-hubber';
      userId = booking.hubber_id;
    } else {
      slug = listingType === 'space' ? 'review-request-space-renter' : 'review-request-object-renter';
      userId = booking.renter_id;
    }
    
    await sendToUser(userId, slug, { bookingId });
  } catch (error) {
    console.error('❌ Errore notifyReviewRequest:', error);
  }
};

// ============================================================================
// 🔐 SECURITY
// ============================================================================

/**
 * Notifica cambio password
 */
export const notifyPasswordChanged = async (userId: string) => {
  try {
    await sendToUser(userId, 'password-changed', { userId });
  } catch (error) {
    console.error('❌ Errore notifyPasswordChanged:', error);
  }
};

/**
 * Notifica cambio email
 */
export const notifyEmailChanged = async (userId: string) => {
  try {
    await sendToUser(userId, 'email-changed', { userId });
  } catch (error) {
    console.error('❌ Errore notifyEmailChanged:', error);
  }
};

/**
 * Notifica nuovo device/login
 */
export const notifyNewDeviceLogin = async (userId: string) => {
  try {
    await sendToUser(userId, 'new-device-login', { userId });
  } catch (error) {
    console.error('❌ Errore notifyNewDeviceLogin:', error);
  }
};