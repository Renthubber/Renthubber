// ⏸️ PWA temporaneamente disattivata
// Per riattivare: rimuovi i commenti /* */ sotto

/*
// Registrazione Service Worker per PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        
        // Controlla aggiornamenti ogni 60 secondi
        setInterval(() => {
          registration.update();
        }, 60000);
        
        // Gestisci aggiornamenti
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nuovo service worker disponibile
              if (confirm('Nuova versione di RentHubber disponibile! Vuoi aggiornarla?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        });
      })
      .catch((error) => {
        console.error('❌ Registrazione Service Worker fallita:', error);
      });
    
    // Ricarica quando il nuovo SW prende il controllo
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        window.location.reload();
        refreshing = true;
      }
    });
  });
}

// Gestione installazione PWA
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallPromotion();
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  hideInstallPromotion();
});

function showInstallPromotion() {
  // Banner personalizzato per installazione
}

function hideInstallPromotion() {
}

window.installPWA = function() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt = null;
  }
};
*/