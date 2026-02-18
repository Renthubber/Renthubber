// Service Worker per RentHubber PWA
const CACHE_NAME = 'renthubber-v2';
const STATIC_CACHE = 'renthubber-static-v2';
const DYNAMIC_CACHE = 'renthubber-dynamic-v2';

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
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Errore caching static assets:', err);
      });
    })
  );
  
  self.skipWaiting();
});

// Attivazione del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== STATIC_CACHE && cache !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// Strategia di cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // ❌ Ignora richieste non-HTTP
  if (!request.url.startsWith('http')) return;
  
  // ❌ Ignora TUTTE le richieste POST (non cachabili)
  if (request.method !== 'GET') return;
  
  // ❌ Ignora API esterne — sempre dalla rete senza intercettare
  if (url.hostname.includes('supabase.co') ||
      url.hostname.includes('stripe.com') ||
      url.hostname.includes('js.stripe.com') ||
      url.hostname.includes('sms.to') ||
      url.hostname.includes('googleapis.com')) {
    return;
  }
  
  // ❌ Ignora richieste chrome-extension, webpack HMR, etc
  if (url.protocol === 'chrome-extension:' || url.pathname.includes('__vite')) return;

  // ✅ Cache First per assets statici (immagini, CSS, JS, font)
  if (request.destination === 'image' || 
      request.destination === 'style' || 
      request.destination === 'script' ||
      request.destination === 'font') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Asset non disponibile offline — ritorna undefined
          return undefined;
        });
      })
    );
    return;
  }

  // ✅ Network First per HTML e navigazione
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.ok) {
          const responseClone = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        return caches.match(request).then((cached) => {
          return cached || caches.match('/index.html');
        });
      })
    );
    return;
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