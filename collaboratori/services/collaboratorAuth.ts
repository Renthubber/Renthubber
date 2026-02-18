// ============================================================
// RENTHUBBER - MODULO COLLABORATORI - Auth Service
// Path: collaboratori/services/collaboratorAuth.ts
// ============================================================
// ⚠️ COMPLETAMENTE SEPARATO da supabase.auth
// Usa la tabella 'collaborators' direttamente
// JWT custom salvato con prefisso collaborator_ in localStorage
// ============================================================

import { supabase } from '../../services/supabaseClient';
import { Collaborator, CollaboratorRegistrationData } from '../types/collaborator.types';

const TOKEN_KEY = 'collaborator_token';
const COLLABORATOR_KEY = 'collaborator_data';

// ============================================================
// HELPER: Hash password
// ============================================================

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '_renthubber_collab_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const newHash = await hashPassword(password);
  return newHash === hash;
}

// ============================================================
// HELPER: JWT semplice per sessione collaboratore
// ============================================================

function generateToken(collaborator: Collaborator): string {
  const payload = {
    id: collaborator.id,
    email: collaborator.email,
    status: collaborator.status,
    iat: Date.now(),
    exp: Date.now() + (24 * 60 * 60 * 1000), // 24 ore
  };
  return btoa(JSON.stringify(payload));
}

function decodeToken(token: string): { id: string; email: string; status: string; exp: number } | null {
  try {
    const payload = JSON.parse(atob(token));
    if (payload.exp && payload.exp > Date.now()) {
      return payload;
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================================
// AUTH API
// ============================================================

export const collaboratorAuth = {

  /**
   * Registrazione nuovo collaboratore
   */
  async register(data: CollaboratorRegistrationData): Promise<Collaborator> {
    // 1. Verifica che l'email non esista già
    const { data: existing } = await supabase
      .from('collaborators')
      .select('id')
      .eq('email', data.email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      throw new Error('Questa email è già registrata come collaboratore.');
    }

    // 2. Hash password
    const password_hash = await hashPassword(data.password);

    // 3. Crea il collaboratore (referral_code generato dal trigger DB)
    const { data: collaborator, error } = await supabase
      .from('collaborators')
      .insert({
        email: data.email.toLowerCase().trim(),
        password_hash,
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        phone: data.phone?.trim() || null,
        tax_id: data.tax_id?.trim() || null,
        bio: data.bio?.trim() || null,
        status: 'in_attesa',
        referral_code: '',
      })
      .select('*')
      .single();

    if (error) {
      console.error('❌ Errore registrazione collaboratore:', error);
      throw new Error('Errore durante la registrazione. Riprova.');
    }

    // 4. Crea le richieste zone
    if (data.zones && data.zones.length > 0) {
      const zoneInserts = data.zones.map(zone => ({
        collaborator_id: collaborator.id,
        zone_level: zone.zone_level,
        region: zone.region,
        province: zone.province || null,
        city: zone.city || null,
        status: 'richiesta',
      }));

      const { error: zoneError } = await supabase
        .from('collaborator_zones')
        .insert(zoneInserts);

      if (zoneError) {
        console.warn('⚠️ Errore inserimento zone (non bloccante):', zoneError);
      }
    }

    return collaborator as Collaborator;
  },

  /**
   * Login collaboratore
   */
  async login(email: string, password: string): Promise<Collaborator> {
    const { data: collaborator, error } = await supabase
      .from('collaborators')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error || !collaborator) {
      throw new Error('Email o password non corretti.');
    }

    const isValid = await verifyPassword(password, collaborator.password_hash);
    if (!isValid) {
      throw new Error('Email o password non corretti.');
    }

    const token = generateToken(collaborator as Collaborator);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(COLLABORATOR_KEY, JSON.stringify(collaborator));

    return collaborator as Collaborator;
  },

  /**
   * Logout collaboratore
   */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(COLLABORATOR_KEY);
  },

  /**
   * Recupera sessione corrente (se valida)
   */
  async getCurrentSession(): Promise<Collaborator | null> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    const decoded = decodeToken(token);
    if (!decoded) {
      this.logout();
      return null;
    }

    const { data: collaborator, error } = await supabase
      .from('collaborators')
      .select('*')
      .eq('id', decoded.id)
      .maybeSingle();

    if (error || !collaborator) {
      this.logout();
      return null;
    }

    localStorage.setItem(COLLABORATOR_KEY, JSON.stringify(collaborator));
    return collaborator as Collaborator;
  },

  /**
   * Recupera dati dal localStorage (sync, senza DB call)
   */
  getStoredCollaborator(): Collaborator | null {
    try {
      const data = localStorage.getItem(COLLABORATOR_KEY);
      if (!data) return null;
      return JSON.parse(data) as Collaborator;
    } catch {
      return null;
    }
  },

  /**
   * Verifica se c'è un token valido
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    const decoded = decodeToken(token);
    return decoded !== null;
  },

  /**
   * Aggiorna profilo collaboratore
   */
  async updateProfile(id: string, updates: Partial<Collaborator>): Promise<Collaborator> {
    const { password_hash, referral_code, status, badge, total_earnings, paid_earnings, ...safeUpdates } = updates as any;

    const { data, error } = await supabase
      .from('collaborators')
      .update(safeUpdates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error('Errore aggiornamento profilo.');
    }

    localStorage.setItem(COLLABORATOR_KEY, JSON.stringify(data));
    return data as Collaborator;
  },
};
