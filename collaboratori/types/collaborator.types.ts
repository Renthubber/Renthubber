// ============================================================
// RENTHUBBER - MODULO COLLABORATORI - Types
// Path: collaboratori/types/collaborator.types.ts
// ============================================================

export interface Collaborator {
  id: string;
  email: string;
  password_hash?: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  tax_id: string | null;
  referral_code: string;
  status: 'in_attesa' | 'approvato' | 'sospeso' | 'rifiutato';
  bio: string | null;
  cv_url: string | null;
  avatar_url: string | null;
  total_earnings: number;
  paid_earnings: number;
  badge: 'none' | 'bronze' | 'silver' | 'gold';
  created_at: string;
  updated_at: string;
}

export interface CollaboratorZone {
  id: string;
  collaborator_id: string;
  zone_level: 'regione' | 'provincia' | 'citta';
  region: string;
  province: string | null;
  city: string | null;
  is_exclusive: boolean;
  status: 'richiesta' | 'approvata' | 'rifiutata' | 'revocata';
  approved_at: string | null;
  created_at: string;
}

export interface CollaboratorLead {
  id: string;
  collaborator_id: string;
  zone_id: string;
  business_name: string | null;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  category: string | null;
  notes: string | null;
  status: 'contattato' | 'interessato' | 'registrato' | 'attivo' | 'perso';
  hubber_user_id: string | null;
  registered_at: string | null;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
  lead_type: string | null;
  fiscal_code: string | null;
  vat_number: string | null;
  pec: string | null;
  sdi_code: string | null;
  // Joined
  zone?: CollaboratorZone;
}

export interface CollaboratorCommission {
  id: string;
  collaborator_id: string;
  lead_id: string | null;
  type: 'acquisition_bonus' | 'recurring' | 'milestone';
  amount: number;
  booking_id: string | null;
  status: 'maturata' | 'pagata' | 'annullata';
  paid_at: string | null;
  created_at: string;
  // Joined
  lead?: CollaboratorLead;
}

export interface CollaboratorSettings {
  id: string;
  acquisition_bonus_amount: number;
  recurring_commission_pct: number;
  recurring_duration_months: number;
  milestone_10_bonus: number;
  milestone_25_bonus: number;
  milestone_50_bonus: number;
  updated_at: string;
}

export interface CollaboratorAuthState {
  collaborator: Collaborator | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export interface CollaboratorRegistrationData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  tax_id?: string;
  bio?: string;
  zones: ZoneRequest[];
}

export interface ZoneRequest {
  zone_level: 'regione' | 'provincia' | 'citta';
  region: string;
  province?: string;
  city?: string;
}

// KPI per la dashboard
export interface CollaboratorKPI {
  totalLeads: number;
  activeHubbers: number;
  totalEarnings: number;
  conversionRate: number;
  pendingCommissions: number;
  paidCommissions: number;
}