// ============================================================
// RENTHUBBER STORE - Auth Context
// Path: store/context/StoreAuthContext.tsx
// ============================================================
// ⚠️ COMPLETAMENTE SEPARATO da AuthContext principale
// ============================================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Store } from '../types/store.types';
import { storeAuth } from '../services/storeAuth';

interface StoreAuthContextType {
  store: Store | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<Store>) => Promise<void>;
  refreshStore: () => Promise<void>;
}

const StoreAuthContext = createContext<StoreAuthContextType | undefined>(undefined);

export const StoreAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initSession();
  }, []);

  const initSession = async () => {
    try {
      const stored = storeAuth.getStoredStore();
      if (stored && storeAuth.isAuthenticated()) {
        setStore(stored);
        const fresh = await storeAuth.getCurrentSession();
        if (fresh) {
          setStore(fresh);
        } else {
          setStore(null);
        }
      }
    } catch (error) {
      console.error('Errore init sessione store:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const s = await storeAuth.login(email, password);
    setStore(s);
  };

  const logout = () => {
    storeAuth.logout();
    setStore(null);
  };

  const updateProfile = async (updates: Partial<Store>) => {
    if (!store) return;
    const updated = await storeAuth.updateProfile(store.id, updates);
    setStore(updated);
  };

  const refreshStore = async () => {
    const fresh = await storeAuth.getCurrentSession();
    if (fresh) {
      setStore(fresh);
    }
  };

  return (
    <StoreAuthContext.Provider
      value={{
        store,
        loading,
        isAuthenticated: !!store && storeAuth.isAuthenticated(),
        login,
        logout,
        updateProfile,
        refreshStore,
      }}
    >
      {children}
    </StoreAuthContext.Provider>
  );
};

export const useStoreAuth = () => {
  const context = useContext(StoreAuthContext);
  if (context === undefined) {
    throw new Error('useStoreAuth must be used within a StoreAuthProvider');
  }
  return context;
};
