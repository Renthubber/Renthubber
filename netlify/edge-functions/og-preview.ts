import { Context } from "https://edge.netlify.com";

// Lista User-Agent dei bot social che devono ricevere i meta tag
const SOCIAL_BOTS = [
  'facebookexternalhit',
  'Facebot',
  'WhatsApp',
  'Twitterbot',
  'LinkedInBot',
  'TelegramBot',
  'Slackbot',
  'pinterest',
  'reddit',
];

// Funzione per controllare se la richiesta viene da un bot social
function isSocialBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return SOCIAL_BOTS.some(bot => ua.includes(bot.toLowerCase()));
}

// Funzione per caricare i dati dell'annuncio da Supabase
async function fetchListingData(listingId: string, supabaseUrl: string, supabaseKey: string) {
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/listings?id=eq.${listingId}&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Errore fetch Supabase:', response.status);
      return null;
    }

    const data = await response.json();
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Errore caricamento listing:', error);
    return null;
  }
}

// Funzione per generare HTML con meta tag Open Graph
function generateOGHtml(listing: any, url: string): string {
  const title = listing.title || 'Annuncio su RentHubber';
  const description = listing.description 
    ? listing.description.substring(0, 200) + (listing.description.length > 200 ? '...' : '')
    : 'Noleggia questo oggetto o spazio su RentHubber';
  const price = listing.pricePerDay ? `${listing.pricePerDay}€/giorno` : '';
  const image = listing.images && listing.images.length > 0 
    ? listing.images[0] 
    : 'https://upyznglekmynztmydtxi.supabase.co/storage/v1/object/public/images/logo-renthubber.png';
  
  // ✅ Aggiungi prefisso in base alla categoria
  const prefix = listing.category === 'space' ? 'Affitta' : 'Noleggia';
  const fullTitle = price ? `${prefix} ${title} - ${price}` : `${prefix} ${title}`;
  const ogType = listing.category === 'space' ? 'place' : 'product';

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- SEO Base -->
  <title>${fullTitle}</title>
  <meta name="description" content="${description}" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${ogType}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${fullTitle}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="it_IT" />
  <meta property="og:site_name" content="RentHubber" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${url}" />
  <meta name="twitter:title" content="${fullTitle}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  
  <!-- Redirect immediato alla SPA per utenti reali -->
  <meta http-equiv="refresh" content="0;url=${url}" />
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .loader {
      text-align: center;
      color: #0D414B;
    }
  </style>
</head>
<body>
  <div class="loader">
    <h1>Caricamento...</h1>
    <p>Reindirizzamento in corso...</p>
  </div>
</body>
</html>`;
}

// Funzione per generare HTML fallback (se listing non trovato)
function generateFallbackHtml(url: string): string {
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <title>RentHubber - Noleggia qualsiasi cosa</title>
  <meta name="description" content="La piattaforma di sharing economy per noleggiare oggetti e spazi in sicurezza. Non comprarlo, Noleggialo!" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="RentHubber - Noleggia qualsiasi cosa" />
  <meta property="og:description" content="La piattaforma di sharing economy per noleggiare oggetti e spazi in sicurezza. Non comprarlo, Noleggialo!" />
  <meta property="og:image" content="https://upyznglekmynztmydtxi.supabase.co/storage/v1/object/public/images/logo-renthubber.png" />
  <meta property="og:locale" content="it_IT" />
  <meta property="og:site_name" content="RentHubber" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${url}" />
  <meta name="twitter:title" content="RentHubber - Noleggia qualsiasi cosa" />
  <meta name="twitter:description" content="La piattaforma di sharing economy per noleggiare oggetti e spazi in sicurezza. Non comprarlo, Noleggialo!" />
  <meta name="twitter:image" content="https://upyznglekmynztmydtxi.supabase.co/storage/v1/object/public/images/logo-renthubber.png" />
  
  <!-- Redirect immediato alla SPA -->
  <meta http-equiv="refresh" content="0;url=${url}" />
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .loader {
      text-align: center;
      color: #0D414B;
    }
  </style>
</head>
<body>
  <div class="loader">
    <h1>Caricamento...</h1>
    <p>Reindirizzamento in corso...</p>
  </div>
</body>
</html>`;
}

// Handler principale della Edge Function
export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  
  // Controlla se è una richiesta a /listing/:id
  const listingMatch = url.pathname.match(/^\/listing\/([a-zA-Z0-9-]+)$/);
  
  if (!listingMatch) {
    // Non è un listing, passa alla SPA
    return context.next();
  }
  
  const listingId = listingMatch[1];
  
  // Se non è un bot social, passa alla SPA React normale
  if (!isSocialBot(userAgent)) {
    return context.next();
  }
  
  console.log(`🤖 Bot social rilevato: ${userAgent} per listing: ${listingId}`);
  
  // Carica variabili ambiente
  const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
  const supabaseKey = Deno.env.get('VITE_SUPABASE_ANON_KEY');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variabili ambiente Supabase mancanti');
    return new Response(generateFallbackHtml(request.url), {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }
  
  // Carica dati listing
  const listing = await fetchListingData(listingId, supabaseUrl, supabaseKey);
  
  if (!listing) {
    console.log(`⚠️ Listing ${listingId} non trovato, uso fallback`);
    return new Response(generateFallbackHtml(request.url), {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }
  
  console.log(`✅ Listing caricato: ${listing.title}`);
  
  // Genera HTML con meta tag Open Graph
  const html = generateOGHtml(listing, request.url);
  
  return new Response(html, {
    headers: { 
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=3600', // Cache 1 ora
    },
  });
};