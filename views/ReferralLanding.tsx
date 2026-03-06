import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Gift, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from "../services/supabaseClient";

interface ReferrerInfo {
  name: string;
  publicName: string;
  avatar: string;
  isValid: boolean;
}

export const ReferralLanding: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [referrer, setReferrer] = useState<ReferrerInfo | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    validateReferralCode();
  }, [code]);

  const validateReferralCode = async () => {
    if (!code) {
      setError('Codice referral mancante');
      setLoading(false);
      return;
    }

    try {
      // Valida il codice e recupera info sul referrer
      const { data, error } = await supabase
        .from('users')
        .select('id, name, first_name, last_name, public_name, avatar_url')
        .eq('referral_code', code.toUpperCase())
        .single();

      if (error || !data) {
        setError('Codice invito non valido o scaduto');
        setLoading(false);
        return;
      }

      // Costruisci nome e avatar
      const fullName = data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim();
      const publicName = data.public_name || fullName;
      const avatar = data.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`;

      setReferrer({
        name: fullName,
        publicName,
        avatar,
        isValid: true
      });
      setLoading(false);
    } catch (err) {
      console.error('Errore validazione referral:', err);
      setError('Errore durante la validazione del codice');
      setLoading(false);
    }
  };

  const handleRegister = () => {
    navigate(`/signup?ref=${code?.toUpperCase()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand/5 via-white to-brand-light/10 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (error || !referrer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Codice Non Valido</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl"
          >
            Torna alla Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand/5 via-white to-brand-light/10">
      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Banner */}
          <div className="bg-gradient-to-r from-brand to-brand-light p-8 text-white text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
              <Gift className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Sei stato invitato!</h1>
            <p className="text-white text-lg">Registrati e ricevi un bonus di benvenuto</p>
          </div>

          {/* Referrer Info */}
          <div className="p-8">
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <img 
                  src={referrer.avatar} 
                  alt={referrer.name}
                  className="w-24 h-24 rounded-full border-4 border-brand/20 shadow-lg"
                />
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1.5 shadow-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {referrer.publicName} ti invita su Renthubber
              </h2>
              <p className="text-gray-600">
                Unisciti alla community di sharing economy più affidabile d'Italia
              </p>
            </div>

            {/* Benefits */}
            <div className="bg-gradient-to-br from-brand/5 to-brand-light/10 rounded-2xl p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Gift className="w-5 h-5 text-brand mr-2" />
                Cosa ottieni:
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">
                    <strong className="font-semibold text-gray-900">Bonus di benvenuto</strong> dopo la tua prima prenotazione
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">
                    <strong className="font-semibold text-gray-900">Accesso immediato</strong> a migliaia di oggetti e spazi
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">
                    <strong className="font-semibold text-gray-900">Transazioni sicure</strong> con garanzia al 100%
                  </span>
                </li>
              </ul>
            </div>

            {/* Referral Code Display */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 border-2 border-dashed border-brand/30">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Il tuo codice invito:</p>
                <p className="text-2xl font-bold text-brand tracking-wider font-mono">
                  {code?.toUpperCase()}
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleRegister}
              className="w-full bg-gradient-to-r from-brand to-brand-light hover:from-brand-dark hover:to-brand text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center group"
            >
              <span className="mr-2">Registrati Ora</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Footer Note */}
            <p className="text-center text-sm text-gray-500 mt-6">
              La registrazione è gratuita e richiede meno di 2 minuti
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-brand">100%</p>
            <p className="text-xs text-gray-600 mt-1">Sicuro</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-brand">24/7</p>
            <p className="text-xs text-gray-600 mt-1">Supporto</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-brand">1000+</p>
            <p className="text-xs text-gray-600 mt-1">Utenti</p>
          </div>
        </div>
      </div>
    </div>
  );
};