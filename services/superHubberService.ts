/**
 * SuperHubber Service - RentHubber
 * 
 * Gestisce il calcolo delle metriche hubber e l'assegnazione automatica
 * del badge SuperHubber basato su criteri di qualità e affidabilità.
 */

import { supabase } from './supabaseClient';

// ========================================
// COSTANTI E CONFIGURAZIONE
// ========================================

/**
 * Requisiti per ottenere il badge SuperHubber
 * Tutti i criteri devono essere soddisfatti
 */
export const SUPERHUBBER_REQUIREMENTS = {
  minCompletedBookings90d: 15,      // Minimo 15 noleggi completati ogni trimestre
  minRating: 4.8,                   // Rating medio minimo 4.8/5
  maxCancellationRate: 5.0,         // Massimo 5% di cancellazioni
  minReviews: 5,                    // Minimo 5 recensioni per rating affidabile
  requireDocumentVerified: true,    // Documento identità verificato obbligatorio
  minActiveListings: 1              // Almeno 1 annuncio attivo
};

/**
 * Restituisce i requisiti SuperHubber correnti
 */
export function getSuperHubberRequirements() {
  return { ...SUPERHUBBER_REQUIREMENTS };
}

/**
 * Calcola la prossima data di controllo trimestrale SuperHubber
 * @returns Data del prossimo controllo (1 Gen, 1 Apr, 1 Lug, 1 Ott)
 */
export function getNextSuperHubberCheckDate(): Date {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11
  
  // Date trimestrali: 1 Gen (0), 1 Apr (3), 1 Lug (6), 1 Ott (9)
  const quarterlyMonths = [0, 3, 6, 9];
  
  // Trova il prossimo mese trimestrale
  let nextMonth = quarterlyMonths.find(m => m > month);
  let nextYear = year;
  
  if (!nextMonth && nextMonth !== 0) {
    // Se siamo oltre ottobre, vai al 1 gennaio dell'anno prossimo
    nextMonth = 0;
    nextYear = year + 1;
  }
  
  return new Date(nextYear, nextMonth, 1, 0, 0, 0, 0);
}

// ========================================
// GESTIONE CONTROLLI TRIMESTRALI
// ========================================

/**
 * Calcola la prossima data di controllo trimestrale
 * Date trimestrali: 1 Gennaio, 1 Aprile, 1 Luglio, 1 Ottobre
 */
function getNextQuarterlyDate(fromDate: Date): Date {
  const year = fromDate.getFullYear();
  const month = fromDate.getMonth(); // 0-11
  
  // Date trimestrali: 1 Gen (0), 1 Apr (3), 1 Lug (6), 1 Ott (9)
  const quarterlyMonths = [0, 3, 6, 9];
  
  // Trova il prossimo mese trimestrale
  let nextMonth = quarterlyMonths.find(m => m > month);
  let nextYear = year;
  
  if (!nextMonth && nextMonth !== 0) {
    // Se siamo oltre ottobre, vai al 1 gennaio dell'anno prossimo
    nextMonth = 0;
    nextYear = year + 1;
  }
  
  return new Date(nextYear, nextMonth, 1, 0, 0, 0, 0);
}

/**
 * Verifica se è il momento di controllare il badge SuperHubber
 * Controllo trimestrale: 1 Gen, 1 Apr, 1 Lug, 1 Ott
 */
function shouldCheckSuperHubberStatus(lastCheckDate: string | null): boolean {
  if (!lastCheckDate) return true; // Prima volta, controlla sempre
  
  const last = new Date(lastCheckDate);
  const now = new Date();
  
  // Calcola la prossima data trimestrale dopo l'ultimo controllo
  const nextQuarterlyCheck = getNextQuarterlyDate(last);
  
  // Controlla se siamo oltre la data trimestrale
  return now >= nextQuarterlyCheck;
}

/**
 * Verifica se un SuperHubber deve perdere il badge per calo qualità
 * Controllo ogni 15 giorni: 3+ recensioni ≤3 stelle negli ultimi 15gg E rating <4.7
 */
async function shouldRemoveSuperHubberForQualityDrop(userId: string): Promise<boolean> {
  try {
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    
    // 1. Conta recensioni negative recenti (≤3 stelle)
    const { count: negativeReviews } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('reviewee_id', userId)
      .eq('status', 'approved')
      .lte('rating', 3)
      .gte('created_at', fifteenDaysAgo.toISOString());
    
    // 2. Leggi rating attuale e status SuperHubber
    const { data: userData } = await supabase
      .from('users')
      .select('rating, is_super_hubber')
      .eq('id', userId)
      .single();
    
    if (!userData) return false;
    
    // 3. Verifica condizioni per rimozione
    const hasThreeNegativeReviews = (negativeReviews || 0) >= 3;
    const ratingBelowThreshold = (userData.rating || 0) < 4.7;
    const isSuperHubber = userData.is_super_hubber || false;
    
    return isSuperHubber && hasThreeNegativeReviews && ratingBelowThreshold;
    
  } catch (error) {
    console.error('❌ Errore shouldRemoveSuperHubberForQualityDrop:', error);
    return false;
  }
}

// ========================================
// CALCOLO METRICHE HUBBER
// ========================================

/**
 * Calcola e aggiorna tutte le metriche di un hubber
 * 
 * @param userId - ID dell'utente hubber
 * @returns Oggetto con le metriche calcolate
 */
export async function updateHubberMetrics(userId: string): Promise<{
  completedBookings90d: number;
  cancellationRate90d: number;
  reviewsCount: number;
  activeListingsCount: number;
  rating: number;
  success: boolean;
}> {
  try {
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // 1. Conta prenotazioni completate ultimi 90 giorni
    const { count: completedBookings90d } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('hubber_id', userId)
      .eq('status', 'completed')
      .gte('end_date', ninetyDaysAgo.toISOString());

    // 2. Conta prenotazioni cancellate dall'hubber ultimi 90 giorni
    const { count: cancelledByHubber } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('hubber_id', userId)
      .eq('cancelled_by', 'hubber')
      .gte('created_at', ninetyDaysAgo.toISOString());

    // 3. Conta totale prenotazioni ultimi 90 giorni (per calcolare %)
    const { count: totalBookings90d } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('hubber_id', userId)
      .gte('created_at', ninetyDaysAgo.toISOString());

    // 4. Calcola tasso di cancellazione
    const cancellationRate90d = totalBookings90d && totalBookings90d > 0
      ? ((cancelledByHubber || 0) / totalBookings90d) * 100
      : 0;

    // 5. Conta recensioni totali ricevute come hubber
    const { count: reviewsCount } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('reviewee_id', userId)
      .eq('status', 'approved');

    // 6. Conta annunci attivi
    const { count: activeListingsCount } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .eq('status', 'published');

    // 7. Leggi rating medio corrente (già calcolato da altre funzioni)
    const { data: userData } = await supabase
      .from('users')
      .select('rating')
      .eq('id', userId)
      .single();

    const rating = userData?.rating || 0;

    // 8. Aggiorna tutte le metriche nel database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        completed_bookings_90d: completedBookings90d || 0,
        cancellation_rate_90d: parseFloat(cancellationRate90d.toFixed(2)),
        reviews_count: reviewsCount || 0,
        active_listings_count: activeListingsCount || 0
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Errore aggiornamento metriche hubber:', updateError);
      throw updateError;
    }

    return {
      completedBookings90d: completedBookings90d || 0,
      cancellationRate90d: parseFloat(cancellationRate90d.toFixed(2)),
      reviewsCount: reviewsCount || 0,
      activeListingsCount: activeListingsCount || 0,
      rating,
      success: true
    };

  } catch (error) {
    console.error('❌ Errore updateHubberMetrics:', error);
    return {
      completedBookings90d: 0,
      cancellationRate90d: 0,
      reviewsCount: 0,
      activeListingsCount: 0,
      rating: 0,
      success: false
    };
  }
}

// ========================================
// VERIFICA E ASSEGNAZIONE BADGE SUPERHUBBER
// ========================================

/**
 * Verifica se un hubber soddisfa i requisiti SuperHubber
 * e aggiorna il badge di conseguenza
 * 
 * @param userId - ID dell'utente hubber
 * @returns Oggetto con status e dettagli
 */
export async function checkAndUpdateSuperHubberStatus(userId: string): Promise<{
  isSuperHubber: boolean;
  meetsRequirements: boolean;
  failedCriteria: string[];
  success: boolean;
  checked: boolean;
}> {
  try {
    // 1. Leggi i dati dell'utente e l'ultima data di controllo
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id_document_verified, is_super_hubber, superhubber_last_check')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('❌ Errore lettura dati utente:', userError);
      throw userError;
    }

    // 2. PRIMA: Verifica se deve perdere il badge per calo qualità (ogni 15gg)
    if (await shouldRemoveSuperHubberForQualityDrop(userId)) {
      console.log(`⚠️ Rimozione badge SuperHubber per calo qualità: ${userId}`);
      await supabase.from('users').update({ 
        is_super_hubber: false,
        superhubber_last_check: new Date().toISOString()
      }).eq('id', userId);
      
      return {
        isSuperHubber: false,
        meetsRequirements: false,
        failedCriteria: ['Calo qualità: 3+ recensioni negative in 15gg e rating <4.7'],
        success: true,
        checked: true
      };
    }

    // 3. POI: Verifica se è il momento di controllare (trimestrale)
    if (!shouldCheckSuperHubberStatus(userData.superhubber_last_check)) {
      const nextCheck = getNextQuarterlyDate(new Date(userData.superhubber_last_check!));
      console.log(`⏭️ Controllo SuperHubber saltato per ${userId} - prossimo: ${nextCheck.toLocaleDateString('it-IT')}`);
      return {
        isSuperHubber: userData.is_super_hubber || false,
        meetsRequirements: userData.is_super_hubber || false,
        failedCriteria: [],
        success: true,
        checked: false
      };
    }

    // 4. Aggiorna tutte le metriche
    const metrics = await updateHubberMetrics(userId);
    
    if (!metrics.success) {
      throw new Error('Impossibile aggiornare metriche');
    }

    // 5. Verifica ogni criterio
    const failedCriteria: string[] = [];
    
    if (metrics.completedBookings90d < SUPERHUBBER_REQUIREMENTS.minCompletedBookings90d) {
      failedCriteria.push(`Noleggi completati: ${metrics.completedBookings90d}/${SUPERHUBBER_REQUIREMENTS.minCompletedBookings90d}`);
    }
    
    if (metrics.rating < SUPERHUBBER_REQUIREMENTS.minRating) {
      failedCriteria.push(`Rating: ${metrics.rating}/${SUPERHUBBER_REQUIREMENTS.minRating}`);
    }
    
    if (metrics.cancellationRate90d > SUPERHUBBER_REQUIREMENTS.maxCancellationRate) {
      failedCriteria.push(`Tasso cancellazione: ${metrics.cancellationRate90d}%/${SUPERHUBBER_REQUIREMENTS.maxCancellationRate}%`);
    }
    
    if (metrics.reviewsCount < SUPERHUBBER_REQUIREMENTS.minReviews) {
      failedCriteria.push(`Recensioni: ${metrics.reviewsCount}/${SUPERHUBBER_REQUIREMENTS.minReviews}`);
    }
    
    if (SUPERHUBBER_REQUIREMENTS.requireDocumentVerified && !userData.id_document_verified) {
      failedCriteria.push('Documento non verificato');
    }
    
    if (metrics.activeListingsCount < SUPERHUBBER_REQUIREMENTS.minActiveListings) {
      failedCriteria.push(`Annunci attivi: ${metrics.activeListingsCount}/${SUPERHUBBER_REQUIREMENTS.minActiveListings}`);
    }

    // 6. Determina se soddisfa TUTTI i requisiti
    const meetsRequirements = failedCriteria.length === 0;
    const currentStatus = userData.is_super_hubber || false;

    // 7. Aggiorna badge E data ultimo controllo
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        is_super_hubber: meetsRequirements,
        superhubber_last_check: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Errore aggiornamento badge SuperHubber:', updateError);
      throw updateError;
    }

    return {
      isSuperHubber: meetsRequirements,
      meetsRequirements,
      failedCriteria,
      success: true,
      checked: true
    };

  } catch (error) {
    console.error('❌ Errore checkAndUpdateSuperHubberStatus:', error);
    return {
      isSuperHubber: false,
      meetsRequirements: false,
      failedCriteria: ['Errore sistema'],
      success: false,
      checked: false
    };
  }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Verifica lo status SuperHubber di tutti gli hubber
 * Utile per job schedulati trimestrali
 */
export async function checkAllHubbersSuperStatus(): Promise<{
  totalChecked: number;
  newSuperHubbers: number;
  removedSuperHubbers: number;
  success: boolean;
}> {
  try {
    console.log('🔄 Inizio verifica status SuperHubber per tutti gli hubber...');

    // 1. Ottieni tutti gli utenti che sono hubber
    const { data: hubbers, error } = await supabase
      .from('users')
      .select('id, is_super_hubber')
      .or('role.eq.hubber,roles.cs.{hubber}');

    if (error) throw error;

    if (!hubbers || hubbers.length === 0) {
      console.log('ℹ️ Nessun hubber trovato');
      return { totalChecked: 0, newSuperHubbers: 0, removedSuperHubbers: 0, success: true };
    }

    let newSuperHubbers = 0;
    let removedSuperHubbers = 0;

    // 2. Verifica ogni hubber
    for (const hubber of hubbers) {
      const wasSuperHubber = hubber.is_super_hubber || false;
      const result = await checkAndUpdateSuperHubberStatus(hubber.id);
      
      if (result.success) {
        if (!wasSuperHubber && result.isSuperHubber) {
          newSuperHubbers++;
        } else if (wasSuperHubber && !result.isSuperHubber) {
          removedSuperHubbers++;
        }
      }
    }

    return {
      totalChecked: hubbers.length,
      newSuperHubbers,
      removedSuperHubbers,
      success: true
    };

  } catch (error) {
    console.error('❌ Errore checkAllHubbersSuperStatus:', error);
    return {
      totalChecked: 0,
      newSuperHubbers: 0,
      removedSuperHubbers: 0,
      success: false
    };
  }
}