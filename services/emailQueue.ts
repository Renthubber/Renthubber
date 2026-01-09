import { supabase } from "../services/supabaseClient";

/**
 * Email Queue Service
 * 
 * Servizio centralizzato per inserire email nella queue
 * Gestisce automaticamente:
 * - Loading template
 * - Loading user data
 * - Sostituzione variabili base
 * - Insert in email_queue
 * 
 * Usage:
 * await queueEmail('booking_confirmed', { bookingId, renterId, hubberId });
 */

// ========== TYPES ==========

type EmailEvent = 
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_completed'
  | 'review_received'
  | 'dispute_opened'
  | 'dispute_resolved'
  | 'message_received'
  | 'support_ticket_created'
  | 'support_ticket_closed'
  | 'wallet_credit'
  | 'wallet_debit'
  | 'payout_requested'
  | 'payout_sent'
  | 'invoice_generated';

interface EmailEventData {
  // Common
  userId?: string;
  
  // Booking events
  bookingId?: string;
  renterId?: string;
  hubberId?: string;
  listingId?: string;
  
  // Review events
  reviewId?: string;
  reviewerId?: string;
  revieweeId?: string;
  
  // Dispute events
  disputeId?: string;
  
  // Message events
  messageId?: string;
  conversationId?: string;
  senderId?: string;
  recipientId?: string;
  
  // Support ticket events
  ticketId?: string;
  
  // Wallet events
  transactionId?: string;
  amount?: number;
  
  // Payout events
  payoutRequestId?: string;
  
  // Invoice events
  invoiceId?: string;
}

// ========== TEMPLATE MAPPING ==========

const EVENT_TEMPLATES: Record<EmailEvent, string> = {
  'booking_confirmed': 'tpl-booking-confirmed-object-renter', // Will be dynamic based on category
  'booking_cancelled': 'tpl-booking-cancelled',
  'booking_completed': 'tpl-booking-completed',
  'review_received': 'tpl-review-received',
  'dispute_opened': 'tpl-dispute-opened',
  'dispute_resolved': 'tpl-dispute-resolved',
  'message_received': 'tpl-message-received',
  'support_ticket_created': 'tpl-ticket-created',
  'support_ticket_closed': 'tpl-ticket-closed',
  'wallet_credit': 'tpl-wallet-credit',
  'wallet_debit': 'tpl-wallet-debit',
  'payout_requested': 'tpl-payout-requested',
  'payout_sent': 'tpl-payout-sent',
  'invoice_generated': 'tpl-invoice-generated',
};

// ========== HELPER FUNCTIONS ==========

/**
 * Carica dati utente
 */
async function loadUser(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, public_name')
    .eq('id', userId)
    .single();
  
  if (error || !data) {
    throw new Error(`User not found: ${userId}`);
  }
  
  return {
    ...data,
    name: data.public_name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Utente'
  };
}

/**
 * Carica dati listing
 */
async function loadListing(listingId: string) {
  const { data, error } = await supabase
    .from('listings')
    .select('id, title, category')
    .eq('id', listingId)
    .single();
  
  if (error || !data) {
    throw new Error(`Listing not found: ${listingId}`);
  }
  
  return data;
}

/**
 * Carica dati booking
 */
async function loadBooking(bookingId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, listing:listing_id(title, category)')
    .eq('id', bookingId)
    .single();
  
  if (error || !data) {
    throw new Error(`Booking not found: ${bookingId}`);
  }
  
  return data;
}

/**
 * Carica template email
 */
async function loadTemplate(templateId: string) {
  const { data, error } = await supabase
    .from('email_templates')
    .select('id, subject, body_html, body_text')
    .eq('id', templateId)
    .eq('is_active', true)
    .single();
  
  if (error || !data) {
    throw new Error(`Template not found or inactive: ${templateId}`);
  }
  
  return data;
}

// ========== MAIN FUNCTION ==========

/**
 * Inserisce email nella queue
 * 
 * @param event - Tipo di evento email
 * @param data - Dati dell'evento
 * 
 * @example
 * // Booking confirmed
 * await queueEmail('booking_confirmed', { 
 *   bookingId: 'xxx',
 *   renterId: 'yyy',
 *   hubberId: 'zzz'
 * });
 * 
 * // Review received
 * await queueEmail('review_received', {
 *   reviewId: 'xxx',
 *   revieweeId: 'yyy'
 * });
 */
export async function queueEmail(event: EmailEvent, data: EmailEventData): Promise<void> {
  try {
    console.log(`📧 Queueing email: ${event}`, data);
    
    // ========== REVIEW RECEIVED ==========
    if (event === 'review_received') {
      if (!data.revieweeId) {
        throw new Error('Missing required field: revieweeId');
      }
      
      const reviewee = await loadUser(data.revieweeId);
      const template = await loadTemplate('tpl-review-received');
      
      await supabase.from('email_queue').insert({
        template_id: 'tpl-review-received',
        recipient_email: reviewee.email,
        recipient_name: reviewee.name,
        recipient_user_id: reviewee.id,
        subject: template.subject,
        body_html: template.body_html,
        body_text: template.body_text,
        variables: {
          name: reviewee.name
        },
        status: 'pending',
        scheduled_at: new Date().toISOString()
      });
      
      console.log(`✅ Review notification email queued for user ${data.revieweeId}`);
    }
    
    // ========== DISPUTE OPENED ==========
    else if (event === 'dispute_opened') {
      if (!data.userId) {
        throw new Error('Missing required field: userId');
      }
      
      const user = await loadUser(data.userId);
      const template = await loadTemplate('tpl-dispute-opened');
      
      await supabase.from('email_queue').insert({
        template_id: 'tpl-dispute-opened',
        recipient_email: user.email,
        recipient_name: user.name,
        recipient_user_id: user.id,
        subject: template.subject,
        body_html: template.body_html,
        body_text: template.body_text,
        variables: {
          name: user.name
        },
        status: 'pending',
        scheduled_at: new Date().toISOString()
      });
      
      console.log(`✅ Dispute notification email queued for user ${data.userId}`);
    }
    
    // ========== MESSAGE RECEIVED ==========
    else if (event === 'message_received') {
      if (!data.recipientId || !data.senderId) {
        throw new Error('Missing required fields: recipientId, senderId');
      }
      
      const recipient = await loadUser(data.recipientId);
      const sender = await loadUser(data.senderId);
      const template = await loadTemplate('tpl-message-received');
      
      await supabase.from('email_queue').insert({
        template_id: 'tpl-message-received',
        recipient_email: recipient.email,
        recipient_name: recipient.name,
        recipient_user_id: recipient.id,
        subject: template.subject,
        body_html: template.body_html,
        body_text: template.body_text,
        variables: {
          name: recipient.name,
          sender: sender.name
        },
        status: 'pending',
        scheduled_at: new Date().toISOString()
      });
      
      console.log(`✅ Message notification email queued for user ${data.recipientId}`);
    }
    
    // ========== SUPPORT TICKET CREATED ==========
    else if (event === 'support_ticket_created') {
      if (!data.userId || !data.ticketId) {
        throw new Error('Missing required fields: userId, ticketId');
      }
      
      const user = await loadUser(data.userId);
      const template = await loadTemplate('tpl-ticket-created');
      
      await supabase.from('email_queue').insert({
        template_id: 'tpl-ticket-created',
        recipient_email: user.email,
        recipient_name: user.name,
        recipient_user_id: user.id,
        subject: template.subject,
        body_html: template.body_html,
        body_text: template.body_text,
        variables: {
          name: user.name,
          ticket_id: data.ticketId
        },
        status: 'pending',
        scheduled_at: new Date().toISOString()
      });
      
      console.log(`✅ Support ticket email queued for user ${data.userId}`);
    }
    
    // ========== WALLET CREDIT ==========
    else if (event === 'wallet_credit') {
      if (!data.userId || data.amount === undefined) {
        throw new Error('Missing required fields: userId, amount');
      }
      
      const user = await loadUser(data.userId);
      const template = await loadTemplate('tpl-wallet-credit');
      
      await supabase.from('email_queue').insert({
        template_id: 'tpl-wallet-credit',
        recipient_email: user.email,
        recipient_name: user.name,
        recipient_user_id: user.id,
        subject: template.subject,
        body_html: template.body_html,
        body_text: template.body_text,
        variables: {
          name: user.name,
          amount: data.amount.toFixed(2)
        },
        status: 'pending',
        scheduled_at: new Date().toISOString()
      });
      
      console.log(`✅ Wallet credit email queued for user ${data.userId}`);
    }
    
    // ========== ALTRI EVENTI ==========
    else {
      console.warn(`⚠️ Email event not implemented: ${event}`);
    }
    
  } catch (error) {
    // Non-blocking: logga errore ma non blocca il flusso
    console.error(`⚠️ Failed to queue email (non-blocking):`, error);
  }
}

/**
 * Inserisce email personalizzata nella queue
 * Per casi d'uso specifici non coperti dagli eventi standard
 */
export async function queueCustomEmail(params: {
  templateId: string;
  recipientEmail: string;
  recipientName?: string;
  recipientUserId?: string;
  variables?: Record<string, any>;
  scheduledAt?: Date;
}): Promise<void> {
  try {
    // ✅ Usa la funzione database per evitare errore 406 nel client
    const { error } = await supabase.rpc('queue_email_from_template', {
      p_template_id: params.templateId,
      p_recipient_email: params.recipientEmail,
      p_recipient_name: params.recipientName,
      p_recipient_user_id: params.recipientUserId,
      p_variables: params.variables || {},
      p_scheduled_at: (params.scheduledAt || new Date()).toISOString()
    });
    
    if (error) throw error;
    
    console.log(`✅ Custom email queued: ${params.templateId}`);
  } catch (error) {
    console.error(`⚠️ Failed to queue custom email (non-blocking):`, error);
  }
}