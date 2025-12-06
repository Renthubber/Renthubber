/**
 * API CALENDAR & ICAL - RentHubber
 * 
 * Funzioni da aggiungere al file api.ts esistente
 * per gestione calendario e sincronizzazione iCal
 */

import { supabase } from '../lib/supabase';
import { icalService, ImportedCalendar, CalendarBlock } from './ical';

// =====================================================
// TIPI CALENDARIO
// =====================================================

export interface CalendarBooking {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage?: string;
  listingCategory?: string;
  startDate: string;
  endDate: string;
  status: string;
  renterName?: string;
  renterAvatar?: string;
  renterId?: string;
  totalPrice?: number;
  netEarnings?: number;
  createdAt?: string;
}

// =====================================================
// FUNZIONI CALENDARIO
// =====================================================

/**
 * Recupera tutte le prenotazioni di un hubber formattate per il calendario
 */
export const getCalendarBookingsForHubber = async (
  hubberId: string
): Promise<CalendarBooking[]> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        start_date,
        end_date,
        status,
        amount_total,
        platform_fee,
        hubber_net_amount,
        created_at,
        listing:listings!inner(
          id,
          title,
          category,
          images
        ),
        renter:users!bookings_renter_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('hubber_id', hubberId)
      .in('status', ['pending', 'accepted', 'confirmed', 'active', 'completed'])
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Errore recupero prenotazioni calendario:', error);
      return [];
    }

    return (data || []).map((booking: any) => {
      const renterName = booking.renter
        ? `${booking.renter.first_name || ''} ${booking.renter.last_name || ''}`.trim()
        : 'Renter';

      const listingImages = booking.listing?.images || [];
      const listingImage = listingImages.length > 0 ? listingImages[0] : undefined;

      return {
        id: booking.id,
        listingId: booking.listing?.id || '',
        listingTitle: booking.listing?.title || 'Prenotazione',
        listingImage,
        listingCategory: booking.listing?.category,
        startDate: booking.start_date,
        endDate: booking.end_date,
        status: booking.status,
        renterName,
        renterAvatar: booking.renter?.avatar_url,
        renterId: booking.renter?.id,
        totalPrice: booking.amount_total,
        netEarnings: booking.hubber_net_amount,
        createdAt: booking.created_at,
      };
    });
  } catch (err) {
    console.error('Errore getCalendarBookingsForHubber:', err);
    return [];
  }
};

/**
 * Recupera i blocchi calendario per un listing
 */
export const getCalendarBlocksForListing = async (
  listingId: string
): Promise<CalendarBlock[]> => {
  try {
    const { data, error } = await supabase
      .from('calendar_blocks')
      .select('*')
      .eq('listing_id', listingId)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Errore recupero blocchi calendario:', error);
      return [];
    }

    return (data || []).map((block: any) => ({
      id: block.id,
      listingId: block.listing_id,
      startDate: block.start_date,
      endDate: block.end_date,
      reason: block.reason,
      sourceCalendarId: block.source_calendar_id,
      externalEventUid: block.external_event_uid,
    }));
  } catch (err) {
    console.error('Errore getCalendarBlocksForListing:', err);
    return [];
  }
};

/**
 * Crea un blocco manuale sul calendario
 */
export const createCalendarBlock = async (
  listingId: string,
  startDate: string,
  endDate: string,
  reason: string = 'Blocco manuale'
): Promise<{ success: boolean; blockId?: string; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('calendar_blocks')
      .insert({
        listing_id: listingId,
        start_date: startDate,
        end_date: endDate,
        reason,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, blockId: data.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

/**
 * Rimuove un blocco calendario
 */
export const removeCalendarBlock = async (
  blockId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('calendar_blocks')
      .delete()
      .eq('id', blockId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

// =====================================================
// FUNZIONI ICAL EXPORT
// =====================================================

/**
 * Ottiene l'URL di export iCal per un hubber
 */
export const getICalExportUrl = async (
  userId: string
): Promise<{ url: string; token: string } | null> => {
  try {
    return await icalService.getOrCreateExportUrl(userId);
  } catch (err) {
    console.error('Errore getICalExportUrl:', err);
    return null;
  }
};

/**
 * Rigenera l'URL di export iCal (invalida il precedente)
 */
export const regenerateICalExportUrl = async (
  userId: string
): Promise<{ url: string; token: string } | null> => {
  try {
    return await icalService.regenerateExportToken(userId);
  } catch (err) {
    console.error('Errore regenerateICalExportUrl:', err);
    return null;
  }
};

// =====================================================
// FUNZIONI ICAL IMPORT
// =====================================================

/**
 * Recupera i calendari importati per un utente
 */
export const getImportedCalendars = async (
  userId: string
): Promise<ImportedCalendar[]> => {
  try {
    const { data, error } = await supabase
      .from('imported_calendars')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Errore recupero calendari importati:', error);
      return [];
    }

    return (data || []).map((cal: any) => ({
      id: cal.id,
      userId: cal.user_id,
      name: cal.name,
      url: cal.url,
      lastSync: cal.last_sync,
      eventsCount: cal.events_count,
      status: cal.status,
      errorMessage: cal.error_message,
      createdAt: cal.created_at,
    }));
  } catch (err) {
    console.error('Errore getImportedCalendars:', err);
    return [];
  }
};

/**
 * Importa un nuovo calendario esterno
 */
export const importCalendar = async (
  userId: string,
  calendarUrl: string,
  calendarName: string,
  listingIds: string[] = []
): Promise<{
  success: boolean;
  calendarId?: string;
  eventsImported: number;
  error?: string;
}> => {
  try {
    // Se non sono specificati listing, recupera tutti i listing dell'utente
    let targetListingIds = listingIds;
    
    if (targetListingIds.length === 0) {
      const { data: listings } = await supabase
        .from('listings')
        .select('id')
        .eq('host_id', userId)
        .eq('status', 'published');
      
      targetListingIds = (listings || []).map((l: any) => l.id);
    }

    const result = await icalService.importExternalCalendar(
      userId,
      calendarUrl,
      calendarName,
      targetListingIds
    );

    return {
      success: result.success,
      calendarId: result.calendarId,
      eventsImported: result.eventsImported,
      error: result.error,
    };
  } catch (err: any) {
    return {
      success: false,
      eventsImported: 0,
      error: err.message,
    };
  }
};

/**
 * Sincronizza un calendario importato
 */
export const syncCalendar = async (
  calendarId: string
): Promise<{ success: boolean; eventsUpdated: number; error?: string }> => {
  try {
    return await icalService.syncImportedCalendar(calendarId);
  } catch (err: any) {
    return { success: false, eventsUpdated: 0, error: err.message };
  }
};

/**
 * Rimuove un calendario importato e i suoi blocchi
 */
export const removeImportedCalendar = async (
  calendarId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Prima rimuovi i blocchi associati
    await supabase
      .from('calendar_blocks')
      .delete()
      .eq('source_calendar_id', calendarId);

    // Poi rimuovi il calendario
    const { error } = await supabase
      .from('imported_calendars')
      .delete()
      .eq('id', calendarId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

// =====================================================
// EXPORT OGGETTO API CALENDAR
// =====================================================

export const calendarApi = {
  // Calendario prenotazioni
  getCalendarBookingsForHubber,
  getCalendarBlocksForListing,
  createCalendarBlock,
  removeCalendarBlock,
  
  // iCal Export
  getICalExportUrl,
  regenerateICalExportUrl,
  
  // iCal Import
  getImportedCalendars,
  importCalendar,
  syncCalendar,
  removeImportedCalendar,
};

export default calendarApi;


// =====================================================
// SNIPPET DA AGGIUNGERE AL FILE api.ts ESISTENTE
// =====================================================

/*
ISTRUZIONI:
1. Importa questo file nel tuo api.ts:
   import { calendarApi } from './calendarApi';

2. Aggiungi al tuo oggetto api esistente:
   export const api = {
     // ... funzioni esistenti ...
     
     calendar: calendarApi,
   };

3. Oppure copia le funzioni direttamente nel file api.ts

ESEMPIO UTILIZZO:
- const bookings = await api.calendar.getCalendarBookingsForHubber(userId);
- const { url } = await api.calendar.getICalExportUrl(userId);
- await api.calendar.importCalendar(userId, 'https://calendar.google.com/...', 'Google');
*/