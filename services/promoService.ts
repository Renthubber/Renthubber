import { supabase } from "../services/supabaseClient";

/**
 * Promo Service - Gestione promozioni automatiche alla registrazione
 * 
 * Quando un utente si registra tramite una landing page promo,
 * questo servizio applica automaticamente il fee override configurato.
 */

export interface PromoConfig {
  code: string;
  customRenterFee: number | null;  // null = standard
  customHubberFee: number | null;  // 0 = nessuna commissione
  feesDisabled: boolean;
  durationDays: number;
  maxTransactionAmount: number | null;
  reason: string;
}

// Configurazione promozioni disponibili
const PROMO_CONFIGS: Record<string, PromoConfig> = {
  lancio: {
    code: 'lancio-catania',
    customRenterFee: null,       // Renter: commissioni standard
    customHubberFee: 0,          // Hubber: 0% commissioni
    feesDisabled: false,
    durationDays: 30,
    maxTransactionAmount: 1000,  // Tetto €1000
    reason: 'Promo lancio - 0% commissioni hubber per 30gg o €1000',
  },
};

/**
 * Applica la promozione all'utente appena registrato.
 * Inserisce un record nella tabella user_fee_overrides.
 * Non richiede admin - usa inserimento diretto.
 */
export async function applyPromoToUser(userId: string, promoCode: string): Promise<boolean> {
  try {
    const config = PROMO_CONFIGS[promoCode.toLowerCase()];
    if (!config) {
      console.warn(`⚠️ Codice promo non valido: ${promoCode}`);
      return false;
    }

    // Calcola scadenza
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + config.durationDays);

    const { error } = await supabase
      .from('user_fee_overrides')
      .insert({
        user_id: userId,
        fees_disabled: config.feesDisabled,
        custom_renter_fee: config.customRenterFee,
        custom_hubber_fee: config.customHubberFee,
        valid_from: new Date().toISOString(),
        valid_until: validUntil.toISOString(),
        duration_days: config.durationDays,
        max_transaction_amount: config.maxTransactionAmount,
        current_transaction_amount: 0,
        status: 'active',
        reason: config.reason,
        notes: `Applicata automaticamente da landing page /promo/${promoCode}`,
        created_by: userId, // L'utente stesso (auto-assegnata)
      });

    if (error) {
      console.error('❌ Errore applicazione promo:', error);
      return false;
    }

    console.log(`✅ Promo "${promoCode}" applicata a utente ${userId}`);
    return true;
  } catch (err) {
    console.error('❌ Errore inatteso applicazione promo:', err);
    return false;
  }
}

/**
 * Verifica se un codice promo è valido
 */
export function isValidPromo(code: string): boolean {
  return !!PROMO_CONFIGS[code.toLowerCase()];
}

/**
 * Restituisce la configurazione di una promo
 */
export function getPromoConfig(code: string): PromoConfig | null {
  return PROMO_CONFIGS[code.toLowerCase()] || null;
}
