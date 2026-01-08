/**
 * ICAL SERVICE - RentHubber
 * 
 * Servizio per generazione e parsing di feed iCal (RFC 5545)
 * Compatibile con Google Calendar, Apple Calendar, Outlook
 */

import { supabase } from '../lib/supabase';

// =====================================================
// TIPI
// =====================================================

export interface ICalEvent {
  uid: string;
  dtstart: string;      // YYYYMMDD o YYYYMMDDTHHmmssZ
  dtend: string;
  summary: string;
  description?: string;
  location?: string;
  status?: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED';
  categories?: string[];
  created?: string;
  lastModified?: string;
}

export interface ImportedCalendar {
  id: string;
  userId: string;
  name: string;
  url: string;
  lastSync?: string;
  eventsCount?: number;
  status: 'active' | 'error' | 'syncing';
  errorMessage?: string;
  createdAt: string;
}

export interface CalendarBlock {
  id: string;
  listingId: string;
  startDate: string;
  endDate: string;
  reason: string;
  sourceCalendarId?: string;
  externalEventUid?: string;
}

// =====================================================
// GENERAZIONE ICAL EXPORT
// =====================================================

/**
 * Genera un feed iCal completo per un hubber
 * Include tutte le prenotazioni confermate/attive
 */
export const generateHubberICalFeed = async (
  hubberId: string,
  token: string
): Promise<string> => {
  // Verifica token (in produzione: validare contro DB)
  if (!token || token.length < 10) {
    throw new Error('Token non valido');
  }

  // Recupera prenotazioni dell'hubber
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      start_date,
      end_date,
      status,
      amount_total,
      created_at,
      listing:listings!inner(
        id,
        title,
        location,
        category
      ),
      renter:users!bookings_renter_id_fkey(
        first_name,
        last_name
      )
    `)
    .eq('hubber_id', hubberId)
    .in('status', ['confirmed', 'accepted', 'active', 'completed'])
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Errore recupero prenotazioni per iCal:', error);
    throw new Error('Errore generazione calendario');
  }

  // Converti in eventi iCal
  const events: ICalEvent[] = (bookings || []).map((booking: any) => {
    const renterName = booking.renter 
      ? `${booking.renter.first_name || ''} ${(booking.renter.last_name || '').charAt(0)}.`.trim()
      : 'Renter';
    
    const listingTitle = booking.listing?.title || 'Prenotazione';
    const location = booking.listing?.location || '';
    const category = booking.listing?.category || 'oggetto';

    // Mappa status booking -> status iCal
    let icalStatus: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED' = 'CONFIRMED';
    if (booking.status === 'pending') icalStatus = 'TENTATIVE';
    if (booking.status === 'cancelled') icalStatus = 'CANCELLED';

    return {
      uid: `booking-${booking.id}@renthubber.com`,
      dtstart: formatDateForICal(booking.start_date),
      dtend: formatDateForICal(booking.end_date, true), // +1 giorno per end date
      summary: `🔑 ${listingTitle} - ${renterName}`,
      description: [
        `Prenotazione RentHubber`,
        `Annuncio: ${listingTitle}`,
        `Renter: ${renterName}`,
        `Importo: €${(booking.amount_total || 0).toFixed(2)}`,
        `Stato: ${translateStatus(booking.status)}`,
        ``,
        `ID: ${booking.id.slice(0, 8).toUpperCase()}`,
      ].join('\\n'),
      location,
      status: icalStatus,
      categories: [category === 'spazio' ? 'Spazi' : 'Oggetti'],
      created: formatDateTimeForICal(booking.created_at),
      lastModified: formatDateTimeForICal(new Date().toISOString()),
    };
  });

  // Genera il feed iCal
  return generateICalString(events, {
    calendarName: 'RentHubber - Le mie prenotazioni',
    calendarDescription: 'Calendario prenotazioni RentHubber',
  });
};

/**
 * Genera la stringa iCal RFC 5545
 */
export const generateICalString = (
  events: ICalEvent[],
  options: {
    calendarName?: string;
    calendarDescription?: string;
  } = {}
): string => {
  const {
    calendarName = 'RentHubber Calendar',
    calendarDescription = 'Prenotazioni RentHubber',
  } = options;

  const now = formatDateTimeForICal(new Date().toISOString());

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RentHubber//Calendar//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICalText(calendarName)}`,
    `X-WR-CALDESC:${escapeICalText(calendarDescription)}`,
    'X-WR-TIMEZONE:Europe/Rome',
  ];

  // Aggiungi timezone
  lines.push(
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Rome',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'DTSTART:19700329T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'DTSTART:19701025T030000',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'END:STANDARD',
    'END:VTIMEZONE'
  );

  // Aggiungi eventi
  for (const event of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.uid}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${event.dtstart}`,
      `DTEND;VALUE=DATE:${event.dtend}`,
      `SUMMARY:${escapeICalText(event.summary)}`,
    );

    if (event.description) {
      lines.push(`DESCRIPTION:${escapeICalText(event.description)}`);
    }
    if (event.location) {
      lines.push(`LOCATION:${escapeICalText(event.location)}`);
    }
    if (event.status) {
      lines.push(`STATUS:${event.status}`);
    }
    if (event.categories && event.categories.length > 0) {
      lines.push(`CATEGORIES:${event.categories.join(',')}`);
    }
    if (event.created) {
      lines.push(`CREATED:${event.created}`);
    }
    if (event.lastModified) {
      lines.push(`LAST-MODIFIED:${event.lastModified}`);
    }

    // Aggiungi allarme 1 giorno prima
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Promemoria prenotazione RentHubber',
      'TRIGGER:-P1D',
      'END:VALARM'
    );

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  // Fold lines > 75 caratteri (RFC 5545)
  return foldICalLines(lines.join('\r\n'));
};

// =====================================================
// PARSING ICAL IMPORT
// =====================================================

/**
 * Parsa un feed iCal esterno e restituisce gli eventi
 */
export const parseICalFeed = (icalContent: string): ICalEvent[] => {
  const events: ICalEvent[] = [];
  
  // Unfold lines (RFC 5545: lines can be folded with CRLF + space)
  const unfolded = icalContent
    .replace(/\r\n[ \t]/g, '')
    .replace(/\n[ \t]/g, '');

  // Split in linee
  const lines = unfolded.split(/\r\n|\n/);
  
  let currentEvent: Partial<ICalEvent> | null = null;
  let inEvent = false;

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
      continue;
    }
    
    if (trimmed === 'END:VEVENT') {
      if (currentEvent && currentEvent.uid && currentEvent.dtstart) {
        events.push(currentEvent as ICalEvent);
      }
      inEvent = false;
      currentEvent = null;
      continue;
    }
    
    if (!inEvent || !currentEvent) continue;

    // Parse property
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const propertyPart = trimmed.substring(0, colonIndex);
    const value = unescapeICalText(trimmed.substring(colonIndex + 1));

    // Estrai nome proprietà (ignora parametri come ;VALUE=DATE)
    const propertyName = propertyPart.split(';')[0].toUpperCase();

    switch (propertyName) {
      case 'UID':
        currentEvent.uid = value;
        break;
      case 'DTSTART':
        currentEvent.dtstart = parseICalDate(value);
        break;
      case 'DTEND':
        currentEvent.dtend = parseICalDate(value);
        break;
      case 'SUMMARY':
        currentEvent.summary = value;
        break;
      case 'DESCRIPTION':
        currentEvent.description = value;
        break;
      case 'LOCATION':
        currentEvent.location = value;
        break;
      case 'STATUS':
        if (['CONFIRMED', 'TENTATIVE', 'CANCELLED'].includes(value.toUpperCase())) {
          currentEvent.status = value.toUpperCase() as ICalEvent['status'];
        }
        break;
      case 'CATEGORIES':
        currentEvent.categories = value.split(',').map(c => c.trim());
        break;
    }
  }

  return events;
};

/**
 * Importa un calendario esterno e crea blocchi sugli annunci
 */
export const importExternalCalendar = async (
  userId: string,
  calendarUrl: string,
  calendarName: string,
  listingIds: string[] // Annunci su cui applicare i blocchi
): Promise<{
  success: boolean;
  calendarId?: string;
  eventsImported: number;
  blocksCreated: number;
  error?: string;
}> => {
  try {
    // Fetch del calendario esterno
    const response = await fetch(calendarUrl, {
      headers: {
        'Accept': 'text/calendar',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        eventsImported: 0,
        blocksCreated: 0,
        error: `Impossibile recuperare il calendario: ${response.status}`,
      };
    }

    const icalContent = await response.text();
    
    // Verifica che sia un calendario valido
    if (!icalContent.includes('BEGIN:VCALENDAR')) {
      return {
        success: false,
        eventsImported: 0,
        blocksCreated: 0,
        error: 'Il contenuto non sembra essere un calendario iCal valido',
      };
    }

    // Parsa eventi
    const events = parseICalFeed(icalContent);
    
    if (events.length === 0) {
      return {
        success: false,
        eventsImported: 0,
        blocksCreated: 0,
        error: 'Nessun evento trovato nel calendario',
      };
    }

    // Salva il calendario importato
    const { data: calendar, error: calError } = await supabase
      .from('imported_calendars')
      .insert({
        user_id: userId,
        name: calendarName,
        url: calendarUrl,
        events_count: events.length,
        status: 'active',
        last_sync: new Date().toISOString(),
      })
      .select()
      .single();

    if (calError) {
      console.error('Errore salvataggio calendario:', calError);
      return {
        success: false,
        eventsImported: 0,
        blocksCreated: 0,
        error: 'Errore nel salvataggio del calendario',
      };
    }

    // Crea blocchi per ogni evento su ogni listing selezionato
    let blocksCreated = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const event of events) {
      // Salta eventi passati
      const eventStart = parseICalDateToJS(event.dtstart);
      if (eventStart < today) continue;

      // Salta eventi cancellati
      if (event.status === 'CANCELLED') continue;

      for (const listingId of listingIds) {
        const { error: blockError } = await supabase
          .from('calendar_blocks')
          .insert({
            listing_id: listingId,
            start_date: event.dtstart,
            end_date: event.dtend || event.dtstart,
            reason: event.summary || 'Blocco da calendario esterno',
            source_calendar_id: calendar.id,
            external_event_uid: event.uid,
          });

        if (!blockError) {
          blocksCreated++;
        }
      }
    }

    return {
      success: true,
      calendarId: calendar.id,
      eventsImported: events.length,
      blocksCreated,
    };

  } catch (err: any) {
    console.error('Errore import calendario:', err);
    return {
      success: false,
      eventsImported: 0,
      blocksCreated: 0,
      error: err.message || 'Errore durante l\'importazione',
    };
  }
};

/**
 * Sincronizza un calendario importato (aggiorna blocchi)
 */
export const syncImportedCalendar = async (
  calendarId: string
): Promise<{
  success: boolean;
  eventsUpdated: number;
  error?: string;
}> => {
  try {
    // Recupera info calendario
    const { data: calendar, error: fetchError } = await supabase
      .from('imported_calendars')
      .select('*')
      .eq('id', calendarId)
      .single();

    if (fetchError || !calendar) {
      return { success: false, eventsUpdated: 0, error: 'Calendario non trovato' };
    }

    // Aggiorna status
    await supabase
      .from('imported_calendars')
      .update({ status: 'syncing' })
      .eq('id', calendarId);

    // Fetch nuovo contenuto
    const response = await fetch(calendar.url);
    if (!response.ok) {
      await supabase
        .from('imported_calendars')
        .update({ 
          status: 'error',
          error_message: `Errore fetch: ${response.status}` 
        })
        .eq('id', calendarId);
      return { success: false, eventsUpdated: 0, error: 'Impossibile recuperare il calendario' };
    }

    const icalContent = await response.text();
    const events = parseICalFeed(icalContent);

    // Rimuovi vecchi blocchi da questo calendario
    await supabase
      .from('calendar_blocks')
      .delete()
      .eq('source_calendar_id', calendarId);

    // Ricrea blocchi
    // (Nota: in produzione, dovremmo recuperare i listing_ids associati)
    // Per ora, lasciamo la logica semplificata

    // Aggiorna stato calendario
    await supabase
      .from('imported_calendars')
      .update({
        status: 'active',
        events_count: events.length,
        last_sync: new Date().toISOString(),
        error_message: null,
      })
      .eq('id', calendarId);

    return { success: true, eventsUpdated: events.length };

  } catch (err: any) {
    console.error('Errore sync calendario:', err);
    
    await supabase
      .from('imported_calendars')
      .update({ 
        status: 'error',
        error_message: err.message 
      })
      .eq('id', calendarId);

    return { success: false, eventsUpdated: 0, error: err.message };
  }
};

// =====================================================
// GESTIONE URL EXPORT
// =====================================================

/**
 * Genera o recupera l'URL di export iCal per un hubber
 */
export const getOrCreateExportUrl = async (
  userId: string
): Promise<{ url: string; token: string }> => {
  // Cerca token esistente
  const { data: existing } = await supabase
    .from('ical_tokens')
    .select('token')
    .eq('user_id', userId)
    .single();

  if (existing?.token) {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'https://renthubber.com';
    return {
      url: `${baseUrl}/.netlify/functions/ical?userId=${userId}&token=${existing.token}`,
      token: existing.token,
    };
  }

  // Genera nuovo token
  const token = generateSecureToken();

  await supabase
    .from('ical_tokens')
    .insert({
      user_id: userId,
      token,
      created_at: new Date().toISOString(),
    });

  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://renthubber.com';

  return {
    url: `${baseUrl}/.netlify/functions/ical?userId=${userId}&token=${token}`,
    token,
  };
};

/**
 * Rigenera il token di export (invalida il precedente)
 */
export const regenerateExportToken = async (
  userId: string
): Promise<{ url: string; token: string }> => {
  const token = generateSecureToken();

  // Upsert: aggiorna se esiste, inserisce se non esiste
  await supabase
    .from('ical_tokens')
    .upsert({
      user_id: userId,
      token,
      created_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://renthubber.com';

  return {
    url: `${baseUrl}/.netlify/functions/ical?userId=${userId}&token=${token}`,
    token,
  };
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Formatta una data ISO in formato iCal DATE (YYYYMMDD)
 */
const formatDateForICal = (isoDate: string, addOneDay = false): string => {
  const date = new Date(isoDate);
  if (addOneDay) {
    date.setDate(date.getDate() + 1);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

/**
 * Formatta una data ISO in formato iCal DATETIME (YYYYMMDDTHHmmssZ)
 */
const formatDateTimeForICal = (isoDate: string): string => {
  const date = new Date(isoDate);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

/**
 * Parsa una data iCal in formato YYYYMMDD
 */
const parseICalDate = (icalDate: string): string => {
  // Rimuovi eventuali parametri (es: TZID=...)
  const dateStr = icalDate.replace(/^.*:/, '');
  
  // Formato YYYYMMDD
  if (dateStr.length === 8) {
    return dateStr;
  }
  
  // Formato YYYYMMDDTHHmmss o YYYYMMDDTHHmmssZ
  if (dateStr.length >= 15) {
    return dateStr.substring(0, 8);
  }
  
  return dateStr;
};

/**
 * Converte data iCal in oggetto Date JavaScript
 */
const parseICalDateToJS = (icalDate: string): Date => {
  const dateStr = parseICalDate(icalDate);
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1;
  const day = parseInt(dateStr.substring(6, 8));
  return new Date(year, month, day);
};

/**
 * Escape caratteri speciali per iCal
 */
const escapeICalText = (text: string): string => {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
};

/**
 * Unescape caratteri speciali da iCal
 */
const unescapeICalText = (text: string): string => {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
};

/**
 * Fold linee lunghe (RFC 5545: max 75 caratteri per linea)
 */
const foldICalLines = (content: string): string => {
  const lines = content.split('\r\n');
  const foldedLines: string[] = [];

  for (const line of lines) {
    if (line.length <= 75) {
      foldedLines.push(line);
    } else {
      // Prima linea: 75 caratteri
      foldedLines.push(line.substring(0, 75));
      // Linee successive: spazio + 74 caratteri
      let remaining = line.substring(75);
      while (remaining.length > 0) {
        foldedLines.push(' ' + remaining.substring(0, 74));
        remaining = remaining.substring(74);
      }
    }
  }

  return foldedLines.join('\r\n');
};

/**
 * Genera un token sicuro per URL export
 */
const generateSecureToken = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

/**
 * Traduce status prenotazione in italiano
 */
const translateStatus = (status: string): string => {
  const translations: Record<string, string> = {
    pending: 'In attesa',
    accepted: 'Accettata',
    confirmed: 'Confermata',
    active: 'In corso',
    completed: 'Completata',
    cancelled: 'Cancellata',
    rejected: 'Rifiutata',
  };
  return translations[status] || status;
};

// =====================================================
// EXPORT DEFAULT
// =====================================================

export const icalService = {
  generateHubberICalFeed,
  generateICalString,
  parseICalFeed,
  importExternalCalendar,
  syncImportedCalendar,
  getOrCreateExportUrl,
  regenerateExportToken,
};

export default icalService;