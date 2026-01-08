import { supabase } from './supabaseClient';

/**
 * 🚫 CALENDAR BLOCKS API
 * Gestione blocchi manuali e sincronizzati per il calendario
 */

export const calendarBlocksApi = {
  /**
   * 🔹 OTTIENI BLOCCHI PER UN LISTING
   * Ritorna tutte le date bloccate per un annuncio specifico
   */
  getByListingId: async (listingId: string): Promise<{ startDate: string; endDate: string; reason?: string }[]> => {
    try {
      
      const { data, error } = await supabase
        .from("calendar_blocks")
        .select("start_date, end_date, reason")
        .eq("listing_id", listingId)
        .gte("end_date", new Date().toISOString().split('T')[0]); // Solo blocchi futuri

      if (error) {
        console.error("❌ Errore fetch calendar_blocks:", error);
        return [];
      }

      if (!data) return [];
      
      return data.map((b: any) => ({
        startDate: b.start_date,
        endDate: b.end_date,
        reason: b.reason,
      }));
    } catch (e) {
      console.error("❌ Errore inatteso getByListingId calendar_blocks:", e);
      return [];
    }
  },

  /**
   * 🔹 CREA BLOCCHI MULTIPLI
   * Blocca manualmente una lista di date per un listing
   */
  createMultiple: async (params: {
    listingId: string;
    dates: Date[];
    reason?: string;
  }): Promise<{ success: boolean; error?: string; blockedCount?: number }> => {
    try {
      const { listingId, dates, reason } = params;

      if (dates.length === 0) {
        return { success: false, error: "Nessuna data selezionata" };
      }

     // Crea un blocco per ogni giorno selezionato (con timezone locale)
const blocksToInsert = dates.map(date => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  
  
  return {
    listing_id: listingId,
    start_date: dateStr,
    end_date: dateStr, // Blocco di un solo giorno
    reason: reason || "Blocco manuale",
    source_calendar_id: null, // null = blocco manuale (non da iCal)
    external_event_uid: null,
  };
});

      const { error, count } = await supabase
        .from("calendar_blocks")
        .insert(blocksToInsert);

      if (error) {
        console.error("❌ Errore creazione calendar_blocks:", error);
        return { success: false, error: error.message };
      }

      return { success: true, blockedCount: dates.length };
    } catch (e: any) {
      console.error("❌ Errore inatteso createMultiple calendar_blocks:", e);
      return { success: false, error: e.message };
    }
  },

  /**
   * 🔹 CREA BLOCCO SINGOLO
   * Blocca manualmente un range di date per un listing
   */
  create: async (params: {
    listingId: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const { listingId, startDate, endDate, reason } = params;

      // Verifica che le date siano valide
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
        return { success: false, error: "La data di inizio deve essere precedente alla data di fine" };
      }

      // Inserisci il blocco
      const { error } = await supabase
        .from("calendar_blocks")
        .insert({
          listing_id: listingId,
          start_date: startDate,
          end_date: endDate,
          reason: reason || "Blocco manuale",
          source_calendar_id: null,
          external_event_uid: null,
        });

      if (error) {
        console.error("❌ Errore creazione calendar_block:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (e: any) {
      console.error("❌ Errore inatteso create calendar_block:", e);
      return { success: false, error: e.message };
    }
  },

  /**
   * 🔹 ELIMINA BLOCCO
   * Rimuove un blocco specifico
   */
  delete: async (blockId: string): Promise<{ success: boolean; error?: string }> => {
    try {

      
      const { error } = await supabase
        .from("calendar_blocks")
        .delete()
        .eq("id", blockId);

      if (error) {
        console.error("❌ Errore eliminazione calendar_block:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (e: any) {
      console.error("❌ Errore inatteso delete calendar_block:", e);
      return { success: false, error: e.message };
    }
  },

  /**
   * 🔹 ELIMINA BLOCCHI PER DATE SPECIFICHE
   * Rimuove blocchi per specifiche date di un listing
   */
  deleteByDates: async (params: {
  listingId: string;
  dates: Date[];
}): Promise<{ success: boolean; error?: string; deletedCount?: number }> => {
  try {
    const { listingId, dates } = params;

    if (dates.length === 0) {
      return { success: false, error: "Nessuna data specificata" };
    }

    // Converti date in stringhe YYYY-MM-DD (timezone locale)
    const dateStrings = dates.map(d => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    });

    const { error, count } = await supabase
      .from("calendar_blocks")
      .delete()
      .eq("listing_id", listingId)
      .in("start_date", dateStrings)
      .is("source_calendar_id", null); // Elimina solo blocchi manuali

    if (error) {
      console.error("❌ Errore eliminazione calendar_blocks:", error);
      return { success: false, error: error.message };
    }

    return { success: true, deletedCount: count || 0 };
  } catch (e: any) {
    console.error("❌ Errore inatteso deleteByDates:", e);
    return { success: false, error: e.message };
  }
},
};