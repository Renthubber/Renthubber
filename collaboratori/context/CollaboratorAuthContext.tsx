// ============================================================
// RENTHUBBER - MODULO COLLABORATORI - Auth Context
// Path: collaboratori/context/CollaboratorAuthContext.tsx
// ============================================================
// ⚠️ COMPLETAMENTE SEPARATO da AuthContext principale
// ============================================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Collaborator, CollaboratorRegistrationData } from '../types/collaborator.types';
import { collaboratorAuth } from '../services/collaboratorAuth';

interface CollaboratorAuthContextType {
  collaborator: Collaborator | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: CollaboratorRegistrationData) => Promise<Collaborator>;
  logout: () => void;
  updateProfile: (updates: Partial<Collaborator>) => Promise<void>;
  refreshCollaborator: () => Promise<void>;
}

const CollaboratorAuthContext = createContext<CollaboratorAuthContextType | undefined>(undefined);

export const CollaboratorAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collaborator, setCollaborator] = useState<Collaborator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initSession();
  }, []);

  const initSession = async () => {
    try {
      const stored = collaboratorAuth.getStoredCollaborator();
      if (stored && collaboratorAuth.isAuthenticated()) {
        setCollaborator(stored);
        const fresh = await collaboratorAuth.getCurrentSession();
        if (fresh) {
          setCollaborator(fresh);
        } else {
          setCollaborator(null);
        }
      }
    } catch (error) {
      console.error('Errore init sessione collaboratore:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const collab = await collaboratorAuth.login(email, password);
    setCollaborator(collab);
  };

  const register = async (data: CollaboratorRegistrationData): Promise<Collaborator> => {
    const collab = await collaboratorAuth.register(data);
    return collab;
  };

  const logout = () => {
    collaboratorAuth.logout();
    setCollaborator(null);
  };

  const updateProfile = async (updates: Partial<Collaborator>) => {
    if (!collaborator) return;
    const updated = await collaboratorAuth.updateProfile(collaborator.id, updates);
    setCollaborator(updated);
  };

  const refreshCollaborator = async () => {
    const fresh = await collaboratorAuth.getCurrentSession();
    if (fresh) {
      setCollaborator(fresh);
    }
  };

  return (
    <CollaboratorAuthContext.Provider
      value={{
        collaborator,
        loading,
        isAuthenticated: !!collaborator && collaboratorAuth.isAuthenticated(),
        login,
        register,
        logout,
        updateProfile,
        refreshCollaborator,
      }}
    >
      {children}
    </CollaboratorAuthContext.Provider>
  );
};

export const useCollaboratorAuth = () => {
  const context = useContext(CollaboratorAuthContext);
  if (context === undefined) {
    throw new Error('useCollaboratorAuth must be used within a CollaboratorAuthProvider');
  }
  return context;
};
