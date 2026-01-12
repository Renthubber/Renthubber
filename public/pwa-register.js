// Registrazione Service Worker per PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('✅ Service Worker registrato con successo:', registration.scope);
        
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
  console.log('💾 Evento beforeinstallprompt intercettato');
  e.preventDefault();
  deferredPrompt = e;
  
  // Mostra banner personalizzato (opzionale)
  showInstallPromotion();
});

window.addEventListener('appinstalled', () => {
  console.log('✅ PWA installata con successo!');
  deferredPrompt = null;
  
  // Analytics o notifica utente (opzionale)
  hideInstallPromotion();
});

// Funzioni helper per UI installazione (opzionali)
function showInstallPromotion() {
  // Puoi creare un banner personalizzato qui
  console.log('📱 App installabile! Mostra banner promozionale.');
}

function hideInstallPromotion() {
  console.log('✅ App già installata, nascondi banner.');
}

// Funzione globale per triggare installazione manualmente
window.installPWA = function() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ Utente ha accettato installazione PWA');
      } else {
        console.log('❌ Utente ha rifiutato installazione PWA');
      }
      deferredPrompt = null;
    });
  } else {
    console.log('⚠️ PWA non disponibile per installazione o già installata');
  }
};