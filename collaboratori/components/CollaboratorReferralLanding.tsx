// ============================================================
// RENTHUBBER - COLLABORATOR REFERRAL LANDING PAGE
// Path: collaboratori/components/CollaboratorReferralLanding.tsx
// ============================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2, ArrowRight, Shield, Zap, TrendingUp, Users, Star, Award } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface CollaboratorInfo {
  firstName: string;
  lastName: string;
  publicName: string;
  badge: string;
  avatarUrl: string | null;
  isValid: boolean;
}

const BADGE_EMOJI: Record<string, string> = {
  none: '🔰',
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
};

export const CollaboratorReferralLanding: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [collaborator, setCollaborator] = useState<CollaboratorInfo | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    validateCode();
  }, [code]);

  const validateCode = async () => {
    if (!code) {
      setError('Codice invito mancante');
      setLoading(false);
      return;
    }

    try {
      const { data, error: err } = await supabase
        .from('collaborators')
        .select('first_name, last_name, badge, status, avatar_url')
        .eq('referral_code', code.toUpperCase())
        .eq('status', 'approvato')
        .single();

      if (err || !data) {
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('referral_code', code.toUpperCase())
          .single();
        
        if (userData) {
          navigate(`/invite/${code.toUpperCase()}`, { replace: true });
          return;
        }

        setError('Codice invito non valido o scaduto');
        setLoading(false);
        return;
      }

      setCollaborator({
        firstName: data.first_name,
        lastName: data.last_name,
        publicName: `${data.first_name} ${data.last_name.charAt(0)}.`,
        badge: data.badge || 'none',
        avatarUrl: data.avatar_url || null,
        isValid: true,
      });
      setLoading(false);
    } catch (err) {
      console.error('Errore validazione:', err);
      setError('Errore durante la validazione');
      setLoading(false);
    }
  };

  const handleRegister = () => {
    navigate(`/signup?ref=${code?.toUpperCase()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (error || !collaborator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Codice Non Valido</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={() => navigate('/')}
            className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl">
            Torna alla Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          <div className="relative bg-gradient-to-r from-brand to-emerald-600 p-8 sm:p-10 text-white text-center overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-8 text-6xl">🏠</div>
              <div className="absolute bottom-4 right-8 text-6xl">🔑</div>
              <div className="absolute top-12 right-20 text-4xl">📦</div>
              <div className="absolute bottom-8 left-16 text-4xl">🚲</div>
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
                <Star className="w-4 h-4 mr-1.5" />
                <span className="text-sm font-medium">Invito esclusivo</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-3">Scopri RentHubber</h1>
              <p className="text-white/90 text-lg">La piattaforma dove metti a reddito ciò che possiedi</p>
            </div>
          </div>

          <div className="p-8 sm:p-10">

            <div className="flex items-center justify-center mb-8">
              <div className="bg-gradient-to-br from-brand/5 to-emerald-50 border-2 border-brand/20 rounded-2xl p-6 text-center w-full max-w-sm">
                <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-3 overflow-hidden">
                  {collaborator.avatarUrl ? (
                    <img src={collaborator.avatarUrl} alt={collaborator.publicName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-brand">{collaborator.firstName.charAt(0)}{collaborator.lastName.charAt(0)}</span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{collaborator.publicName}</h2>
                <p className="text-sm text-gray-500 mt-1">Partner RentHubber {BADGE_EMOJI[collaborator.badge]}</p>
                <p className="text-brand font-medium text-sm mt-2">ti invita a unirti alla piattaforma</p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-bold text-gray-900 text-lg mb-4 text-center">Perché RentHubber?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start space-x-3 bg-gray-50 rounded-xl p-4">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Guadagna da subito</p>
                    <p className="text-xs text-gray-500 mt-0.5">Metti a noleggio oggetti, attrezzature e spazi che già possiedi</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 bg-gray-50 rounded-xl p-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">100% Sicuro</p>
                    <p className="text-xs text-gray-500 mt-0.5">Utenti verificati, pagamenti protetti, assistenza dedicata</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 bg-gray-50 rounded-xl p-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Semplice e veloce</p>
                    <p className="text-xs text-gray-500 mt-0.5">Registrati in 2 minuti, pubblica il tuo primo annuncio gratis</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 bg-gray-50 rounded-xl p-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Community attiva</p>
                    <p className="text-xs text-gray-500 mt-0.5">Entra in una rete di persone che condividono e risparmiano</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-brand/5 to-emerald-50 rounded-2xl p-6 mb-8">
              <h3 className="font-bold text-gray-900 mb-4 text-center">Come funziona in 3 passi</h3>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center flex-1">
                  <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center mx-auto mb-2 text-lg font-bold">1</div>
                  <p className="text-sm font-semibold text-gray-900">Registrati</p>
                  <p className="text-xs text-gray-500">Gratis in 2 minuti</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 hidden sm:block" />
                <div className="text-center flex-1">
                  <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center mx-auto mb-2 text-lg font-bold">2</div>
                  <p className="text-sm font-semibold text-gray-900">Pubblica</p>
                  <p className="text-xs text-gray-500">Il tuo primo annuncio</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 hidden sm:block" />
                <div className="text-center flex-1">
                  <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center mx-auto mb-2 text-lg font-bold">3</div>
                  <p className="text-sm font-semibold text-gray-900">Guadagna</p>
                  <p className="text-xs text-gray-500">Ricevi prenotazioni</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 border-2 border-dashed border-brand/30">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Il tuo codice invito personale:</p>
                <p className="text-2xl font-bold text-brand tracking-wider font-mono">{code?.toUpperCase()}</p>
              </div>
            </div>

            <button onClick={handleRegister}
              className="w-full bg-gradient-to-r from-brand to-emerald-600 hover:from-brand-dark hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center group">
              <span className="mr-2 text-lg">Registrati Gratis</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              Registrazione gratuita · Nessun vincolo · Cancellazione libera
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-brand">100%</p>
            <p className="text-xs text-gray-600 mt-1">Gratuito</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-brand">24/7</p>
            <p className="text-xs text-gray-600 mt-1">Supporto</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-brand">🔒</p>
            <p className="text-xs text-gray-600 mt-1">Sicuro</p>
          </div>
        </div>
      </div>
    </div>
  );
};