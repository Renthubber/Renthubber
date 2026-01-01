import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// ✅ Configurazione Supabase (sostituisci con le tue credenziali ENV)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const handler: Handler = async (event, context) => {
  try {
    // ✅ 1. Recupera tutti i listing PUBBLICATI dal database
    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, created_at, status')
      .eq('status', 'published')  // Solo annunci pubblicati
      .is('deleted_at', null)  // Esclude quelli eliminati
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Errore Supabase:', error);
      return {
        statusCode: 500,
        body: 'Errore nel recupero dei listing',
      };
    }

    // ✅ 2. Data corrente per lastmod
    const today = new Date().toISOString().split('T')[0];

    // ✅ 3. Genera XML del sitemap
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  
  <!-- Homepage con Loghi -->
  <url>
    <loc>https://renthubber.com</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>https://renthubber.com/R-logo.png</image:loc>
      <image:title>Renthubber Logo</image:title>
      <image:caption>Logo principale di Renthubber</image:caption>
    </image:image>
    <image:image>
      <image:loc>https://renthubber.com/android-chrome-192x192.png</image:loc>
      <image:title>Renthubber Logo Android 192x192</image:title>
    </image:image>
    <image:image>
      <image:loc>https://renthubber.com/android-chrome-512x512.png</image:loc>
      <image:title>Renthubber Logo Android 512x512</image:title>
    </image:image>
    <image:image>
      <image:loc>https://renthubber.com/apple-touch-icon.png</image:loc>
      <image:title>Renthubber Apple Touch Icon</image:title>
    </image:image>
    <image:image>
      <image:loc>https://renthubber.com/favicon-96x96.png</image:loc>
      <image:title>Renthubber Favicon 96x96</image:title>
    </image:image>
    <image:image>
      <image:loc>https://renthubber.com/favicon.svg</image:loc>
      <image:title>Renthubber Favicon SVG</image:title>
    </image:image>
  </url>
  
  <!-- Pagina Annunci -->
  <url>
    <loc>https://renthubber.com/annunci</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <!-- Pagine statiche -->
  <url>
    <loc>https://renthubber.com/login</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <url>
    <loc>https://renthubber.com/signup</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <url>
    <loc>https://renthubber.com/privacy-policy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  
  <url>
    <loc>https://renthubber.com/cookie-policy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  
  <url>
    <loc>https://renthubber.com/terms</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  
  <!-- ✅ LISTING DINAMICI (aggiunti automaticamente) -->
${listings?.map(listing => `  <url>
    <loc>https://renthubber.com/listing/${listing.id}</loc>
    <lastmod>${listing.created_at ? new Date(listing.created_at).toISOString().split('T')[0] : today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n') || ''}
  
</urlset>`;

    // ✅ 4. Ritorna XML con header corretto
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache di 1 ora
      },
      body: xml,
    };

  } catch (err) {
    console.error('Errore generazione sitemap:', err);
    return {
      statusCode: 500,
      body: 'Errore interno del server',
    };
  }
};