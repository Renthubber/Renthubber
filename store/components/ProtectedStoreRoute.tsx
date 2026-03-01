// ============================================================
// RENTHUBBER STORE - Protected Route
// Path: store/components/ProtectedStoreRoute.tsx
// ============================================================

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStoreAuth } from '../context/StoreAuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedStoreRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { store, loading, isAuthenticated } = useStoreAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-brand animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Caricamento dashboard store...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !store) {
    return <Navigate to="/store/login" replace />;
  }

  return <>{children}</>;
};
