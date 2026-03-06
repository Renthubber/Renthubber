// ============================================================
// RENTHUBBER STORE - Auth Service
// Path: store/services/storeAuth.ts
// ============================================================
// ⚠️ COMPLETAMENTE SEPARATO da supabase.auth
// Usa la tabella 'stores' direttamente
// JWT custom salvato con prefisso store_ in localStorage
// ============================================================

import { supabase } from '../../services/supabaseClient';
import { Store } from '../types/store.types';

const TOKEN_KEY = 'store_token';
const STORE_KEY = 'store_data';

// ============================================================
// HELPER: Hash password
// ============================================================

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '_renthubber_store_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const newHash = await hashPassword(password);
  return newHash === hash;
}

// ============================================================
// HELPER: JWT semplice per sessione store
// ============================================================

function generateToken(store: Store): string {
  const payload = {
    id: store.id,
    email: store.email,
    status: store.status,
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

export const storeAuth = {

  /**
   * Login store
   */
  async login(email: string, password: string): Promise<Store> {
    const { data: store, error } = await supabase
      .from('stores')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error || !store) {
      throw new Error('Email o password non corretti.');
    }

    if (!store.password_hash) {
      throw new Error('Account non ancora attivato. Contatta il supporto.');
    }

    const isValid = await verifyPassword(password, store.password_hash);
    if (!isValid) {
      throw new Error('Email o password non corretti.');
    }

    if (store.status === 'suspended') {
      throw new Error('Il tuo store è stato sospeso. Contatta il supporto.');
    }

    if (store.status === 'terminated') {
      throw new Error('Il tuo store è stato chiuso.');
    }

    const token = generateToken(store as Store);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(STORE_KEY, JSON.stringify(store));

    return store as Store;
  },

  /**
   * Logout store
   */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STORE_KEY);
  },

  /**
   * Recupera sessione corrente (se valida)
   */
  async getCurrentSession(): Promise<Store | null> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    const decoded = decodeToken(token);
    if (!decoded) {
      this.logout();
      return null;
    }

    const { data: store, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', decoded.id)
      .maybeSingle();

    if (error || !store) {
      this.logout();
      return null;
    }

    localStorage.setItem(STORE_KEY, JSON.stringify(store));
    return store as Store;
  },

  /**
   * Recupera dati dal localStorage (sync, senza DB call)
   */
  getStoredStore(): Store | null {
    try {
      const data = localStorage.getItem(STORE_KEY);
      if (!data) return null;
      return JSON.parse(data) as Store;
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
   * Aggiorna profilo store
   */
  async updateProfile(id: string, updates: Partial<Store>): Promise<Store> {
    const { password_hash, status, subscription_status, stripe_customer_id, stripe_subscription_id, ...safeUpdates } = updates as any;

    const { data, error } = await supabase
      .from('stores')
      .update(safeUpdates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error('Errore aggiornamento profilo.');
    }

    localStorage.setItem(STORE_KEY, JSON.stringify(data));
    return data as Store;
  },
};
