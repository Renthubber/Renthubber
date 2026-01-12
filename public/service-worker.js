// Service Worker per RentHubber PWA
const CACHE_NAME = 'renthubber-v1';
const STATIC_CACHE = 'renthubber-static-v1';
const DYNAMIC_CACHE = 'renthubber-dynamic-v1';

// File statici da cacheare immediatamente
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/R-logo.png'
];

// Installazione del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  // Attiva immediatamente il nuovo service worker
  self.skipWaiting();
});

// Attivazione del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          // Rimuovi vecchie cache
          if (cache !== STATIC_CACHE && cache !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  
  // Prendi controllo immediato di tutte le pagine
  return self.clients.claim();
});

// Strategia di cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignora richieste non-HTTP (chrome-extension, etc)
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Ignora chiamate API Supabase - sempre dalla rete
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(fetch(request));
    return;
  }
  
  // Strategia: Cache First per assets statici, Network First per il resto
  if (request.destination === 'image' || 
      request.destination === 'style' || 
      request.destination === 'script' ||
      request.destination === 'font') {
    // Cache First per risorse statiche
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(request).then((networkResponse) => {
          // Cache della risposta per richieste future
          return caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
  } else {
    // Network First per HTML e dati dinamici
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Aggiorna cache con risposta fresca
          return caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // Fallback alla cache se la rete non è disponibile
          return caches.match(request);
        })
    );
  }
});

// Gestione messaggi dal client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => caches.delete(cache))
        );
      })
    );
  }
});
