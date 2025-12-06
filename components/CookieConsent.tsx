import React, { useState, useEffect } from 'react';
import { X, Cookie, Shield } from 'lucide-react';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

export const CookieConsent: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Sempre attivi
    analytics: false,
    marketing: false,
  });

  // Verifica se l'utente ha già dato il consenso
  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Ritarda leggermente per migliorare UX
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  // Salva le preferenze
  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookieConsent', JSON.stringify(prefs));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    
    // Implementa logica per attivare/disattivare script
    if (prefs.analytics) {
      // Attiva Google Analytics
      console.log('✅ Analytics abilitati');
      // window.gtag('consent', 'update', { analytics_storage: 'granted' });
    }
    
    if (prefs.marketing) {
      // Attiva pixel marketing
      console.log('✅ Marketing abilitato');
    }
    
    setShowBanner(false);
    setShowPreferences(false);
  };

  // Accetta tutti
  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      analytics: true,
      marketing: true,
    };
    savePreferences(allAccepted);
  };

  // Solo essenziali
  const acceptEssential = () => {
    const essentialOnly: CookiePreferences = {
      essential: true,
      analytics: false,
      marketing: false,
    };
    savePreferences(essentialOnly);
  };

  // Salva preferenze personalizzate
  const saveCustomPreferences = () => {
    savePreferences(preferences);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Banner principale */}
      {!showPreferences && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-gray-200 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              {/* Icona */}
              <div className="flex-shrink-0">
                <Cookie className="w-10 h-10 text-brand" />
              </div>

              {/* Testo */}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  🍪 Questo sito utilizza cookie
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Utilizziamo cookie essenziali per il funzionamento del sito e cookie opzionali 
                  per analisi e miglioramento dell'esperienza utente. Puoi scegliere quali accettare.
                  {' '}
                  <a 
                    href="/privacy-policy" 
                    className="text-brand hover:underline font-medium"
                    target="_blank"
                  >
                    Privacy Policy
                  </a>
                  {' • '}
                  <a 
                    href="/cookie-policy" 
                    className="text-brand hover:underline font-medium"
                    target="_blank"
                  >
                    Cookie Policy
                  </a>
                </p>
              </div>

              {/* Pulsanti */}
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <button
                  onClick={() => setShowPreferences(true)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Gestisci preferenze
                </button>
                <button
                  onClick={acceptEssential}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Solo essenziali
                </button>
                <button
                  onClick={acceptAll}
                  className="px-6 py-2 text-sm font-bold text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors"
                >
                  Accetta tutti
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale preferenze dettagliate */}
      {showPreferences && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-brand" />
                <h2 className="text-xl font-bold text-gray-900">
                  Gestisci le tue preferenze
                </h2>
              </div>
              <button
                onClick={() => setShowPreferences(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-6 space-y-6">
              <p className="text-sm text-gray-600">
                Puoi personalizzare quali categorie di cookie accettare. I cookie essenziali 
                sono necessari per il funzionamento del sito e non possono essere disattivati.
              </p>

              {/* Cookie Essenziali */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">
                      🔒 Cookie Essenziali
                    </h3>
                    <p className="text-sm text-gray-600">
                      Necessari per il funzionamento del sito (autenticazione, sicurezza, preferenze di base).
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <span className="inline-block px-3 py-1 text-xs font-bold text-gray-500 bg-gray-100 rounded-full">
                      Sempre attivi
                    </span>
                  </div>
                </div>
              </div>

              {/* Cookie Analytics */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">
                      📊 Cookie Analytics
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Ci aiutano a capire come gli utenti utilizzano il sito per migliorare l'esperienza 
                      (es. Google Analytics, statistiche visite).
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) =>
                          setPreferences({ ...preferences, analytics: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Cookie Marketing */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">
                      🎯 Cookie Marketing
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Utilizzati per mostrare pubblicità personalizzata in base ai tuoi interessi 
                      (es. Facebook Pixel, Google Ads).
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) =>
                          setPreferences({ ...preferences, marketing: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Info aggiuntiva */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Nota:</strong> Puoi modificare le tue preferenze in qualsiasi momento 
                  cliccando sull'icona cookie in basso a destra o visitando le nostre{' '}
                  <a href="/cookie-policy" className="underline font-medium" target="_blank">
                    Impostazioni Cookie
                  </a>.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={acceptEssential}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Solo essenziali
              </button>
              <button
                onClick={saveCustomPreferences}
                className="px-6 py-2 text-sm font-bold text-white bg-brand rounded-lg hover:bg-brand-dark"
              >
                Salva preferenze
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Componente opzionale: pulsante per riaprire le preferenze
export const CookieSettingsButton: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    setShow(!!consent); // Mostra solo se l'utente ha già dato consenso
  }, []);

  const reopenPreferences = () => {
    localStorage.removeItem('cookieConsent');
    window.location.reload(); // Ricarica per mostrare il banner
  };

  if (!show) return null;

  return (
    <button
      onClick={reopenPreferences}
      className="fixed bottom-4 right-4 z-40 p-3 bg-white border-2 border-gray-300 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
      title="Gestisci preferenze cookie"
    >
      <Cookie className="w-5 h-5 text-brand" />
    </button>
  );
};