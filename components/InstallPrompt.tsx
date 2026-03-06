import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface InstallPromptProps {
  onClose?: () => void;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({ onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Controlla se è già installato
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Controlla se è iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Gestisci evento beforeinstallprompt (Android/Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Mostra il banner solo se non è già stato chiuso in questa sessione
      const bannerClosed = sessionStorage.getItem('pwa-banner-closed');
      if (!bannerClosed && !standalone) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Su iOS mostra sempre il banner (a meno che non sia già installato o chiuso)
    if (iOS && !standalone) {
      const bannerClosed = sessionStorage.getItem('pwa-banner-closed');
      if (!bannerClosed) {
        setShowPrompt(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleClose = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa-banner-closed', 'true');
    onClose?.();
  };

  // Non mostrare se già installato
  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-brand to-brand-light text-white p-4 shadow-2xl animate-slide-up">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        
        {/* Logo */}
        <div className="flex-shrink-0">
          <img 
            src="/R-logo.png" 
            alt="Renthubber" 
            className="w-12 h-12 rounded-xl shadow-lg"
          />
        </div>

        {/* Contenuto */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base mb-1">Installa l'App</h3>
          
          {isIOS ? (
            <p className="text-sm text-white/90">
              Tocca <span className="inline-flex items-center mx-1 px-2 py-0.5 bg-white/20 rounded">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/>
                </svg>
              </span> poi "Aggiungi a Home"
            </p>
          ) : (
            <p className="text-sm text-white/90">
              Accedi più velocemente e ricevi notifiche
            </p>
          )}
        </div>

        {/* Pulsanti */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="px-4 py-2 bg-white text-brand font-semibold rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Installa
            </button>
          )}
          
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};