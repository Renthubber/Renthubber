import { supabase } from '../lib/supabase';

/**
 * Finance Settings Service - Gestione Impostazioni Finanziarie
 */

// ========== TYPES ==========

export interface FinanceSettings {
  minPayoutAmount: number;
  payoutSchedule: string;
  autoApproveRefunds: boolean;
  autoApproveRefundsMaxAmount: number;
  stripeEnabled: boolean;
  walletEnabled: boolean;
  defaultCurrency?: string;
  // Dati bancari azienda per SEPA
  companyIban?: string;
  companyBic?: string;
  companyBankName?: string;
}

// ========== FUNCTIONS ==========

export async function getFinanceSettings(): Promise<FinanceSettings | null> {
  try {
    const { data, error } = await supabase
      .from('cms_settings')
      .select('value')
      .eq('type', 'finance_settings')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Non trovato, ritorna defaults
        return {
          minPayoutAmount: 50,
          payoutSchedule: 'manual',
          autoApproveRefunds: false,
          autoApproveRefundsMaxAmount: 50,
          stripeEnabled: true,
          walletEnabled: true,
        };
      }
      throw error;
    }
    
    return data?.value as FinanceSettings;
  } catch (error) {
    console.error('Errore caricamento finance settings:', error);
    return null;
  }
}

export async function updateFinanceSettings(settings: FinanceSettings): Promise<void> {
  const { data: existing } = await supabase
    .from('cms_settings')
    .select('id')
    .eq('type', 'finance_settings')
    .single();
  
  if (existing) {
    // Update
    const { error } = await supabase
      .from('cms_settings')
      .update({ 
        value: settings,
        updated_at: new Date().toISOString()
      })
      .eq('type', 'finance_settings');
    
    if (error) throw error;
  } else {
    // Insert
    const { error } = await supabase
      .from('cms_settings')
      .insert({
        type: 'finance_settings',
        value: settings
      });
    
    if (error) throw error;
  }
}