// Edge Function: Open Graph per articoli del Centro Risorse
// Stesso pattern di og-preview.ts — intercetta solo i bot social

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

function isSocialBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return SOCIAL_BOTS.some(bot => ua.includes(bot.toLowerCase()));
}

async function fetchPostData(slug: string, supabaseUrl: string, supabaseKey: string) {
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/blog_posts?slug=eq.${slug}&published=eq.true&select=title,excerpt,cover_url,cover_image_url,category,author_name`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Errore fetch blog post:', error);
    return null;
  }
}

function generateOGHtml(post: any, url: string): string {
  const title = post.title || 'Centro Risorse Renthubber';
  const description = post.excerpt
    ? post.excerpt.substring(0, 200) + (post.excerpt.length > 200 ? '...' : '')
    : 'Guide pratiche, trend di mercato e consigli dal team Renthubber.';
  const image = post.cover_url || post.cover_image_url
    || 'https://upyznglekmynztmydtxi.supabase.co/storage/v1/object/public/images/logo-renthubber.png';

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>${title} — Renthubber</title>
  <meta name="description" content="${description}" />

  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="it_IT" />
  <meta property="og:site_name" content="Renthubber" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${url}" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />

  <!-- Redirect immediato alla SPA per utenti reali -->
  <meta http-equiv="refresh" content="0;url=${url}" />

  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; margin: 0; background: #f5f5f5;
    }
    .loader { text-align: center; color: #0D414B; }
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

function generateFallbackHtml(url: string): string {
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Centro Risorse — Renthubber</title>
  <meta name="description" content="Guide pratiche, trend di mercato e consigli dal team Renthubber." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="Centro Risorse — Renthubber" />
  <meta property="og:description" content="Guide pratiche, trend di mercato e consigli dal team Renthubber." />
  <meta property="og:image" content="https://upyznglekmynztmydtxi.supabase.co/storage/v1/object/public/images/logo-renthubber.png" />
  <meta property="og:locale" content="it_IT" />
  <meta property="og:site_name" content="Renthubber" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Centro Risorse — Renthubber" />
  <meta name="twitter:description" content="Guide pratiche, trend di mercato e consigli dal team Renthubber." />
  <meta name="twitter:image" content="https://upyznglekmynztmydtxi.supabase.co/storage/v1/object/public/images/logo-renthubber.png" />
  <meta http-equiv="refresh" content="0;url=${url}" />
  <style>
    body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
    .loader { text-align: center; color: #0D414B; }
  </style>
</head>
<body>
  <div class="loader"><h1>Caricamento...</h1><p>Reindirizzamento in corso...</p></div>
</body>
</html>`;
}

export default async (request: Request, context: any) => {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';

  const postMatch = url.pathname.match(/^\/risorse\/([a-zA-Z0-9-]+)$/);
  if (!postMatch) return context.next();

  // Utenti normali → SPA React
  if (!isSocialBot(userAgent)) return context.next();

  const slug = postMatch[1];
  console.log(`🤖 Bot social rilevato: ${userAgent} per post: ${slug}`);

  const supabaseUrl = Netlify.env.get('VITE_SUPABASE_URL');
  const supabaseKey = Netlify.env.get('VITE_SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseKey) {
    return new Response(generateFallbackHtml(request.url), {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }

  const post = await fetchPostData(slug, supabaseUrl, supabaseKey);

  if (!post) {
    console.log(`⚠️ Post ${slug} non trovato, uso fallback`);
    return new Response(generateFallbackHtml(request.url), {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }

  console.log(`✅ Post caricato: ${post.title}`);

  return new Response(generateOGHtml(post, request.url), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
};
