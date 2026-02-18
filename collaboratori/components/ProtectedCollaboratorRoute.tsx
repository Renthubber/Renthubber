// ============================================================
// RENTHUBBER - MODULO COLLABORATORI - Protected Route
// Path: collaboratori/components/ProtectedCollaboratorRoute.tsx
// ============================================================
// ⚠️ NON tocca le route protette esistenti
// ============================================================

import React from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2, Clock, XCircle } from 'lucide-react';
import { useCollaboratorAuth } from '../context/CollaboratorAuthContext';

interface Props {
  children: React.ReactNode;
}

export const ProtectedCollaboratorRoute: React.FC<Props> = ({ children }) => {
  const { collaborator, loading, isAuthenticated } = useCollaboratorAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !collaborator) {
    return <Navigate to="/collaboratori/login" replace />;
  }

  if (collaborator.status === 'in_attesa') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Candidatura in Esame</h2>
          <p className="text-gray-600 mb-6">
            Ciao <strong>{collaborator.first_name}</strong>, la tua candidatura è in fase di valutazione.
            Riceverai un'email non appena verrà approvata.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            Ti contatteremo al più presto. Nel frattempo, puoi controllare la tua email per aggiornamenti.
          </div>
        </div>
      </div>
    );
  }

  if (collaborator.status === 'sospeso') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Account Sospeso</h2>
          <p className="text-gray-600 mb-6">
            Il tuo account collaboratore è stato temporaneamente sospeso.
            Contatta il supporto per maggiori informazioni.
          </p>
          <a
            href="mailto:supporto@renthubber.com"
            className="inline-block bg-brand text-white font-bold py-3 px-6 rounded-xl hover:bg-brand-dark transition-all"
          >
            Contatta Supporto
          </a>
        </div>
      </div>
    );
  }

  if (collaborator.status === 'rifiutato') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Candidatura non Approvata</h2>
          <p className="text-gray-600 mb-6">
            Purtroppo la tua candidatura non è stata approvata al momento.
            Puoi contattarci per maggiori informazioni.
          </p>
          <a
            href="mailto:supporto@renthubber.com"
            className="inline-block bg-brand text-white font-bold py-3 px-6 rounded-xl hover:bg-brand-dark transition-all"
          >
            Contatta Supporto
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
