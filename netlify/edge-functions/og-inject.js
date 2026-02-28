// Edge Function: Inietta meta tag OG specifici per pagina
// I crawler social (Facebook, LinkedIn, Twitter) non eseguono JavaScript,
// quindi questa function intercetta le richieste e modifica l'HTML al volo.

const OG_PAGES = {
  '/promo/lancio-catania': {
    title: 'RentHubber è finalmente attivo a Catania!',
    description: 'Noleggia ciò che ti serve. Guadagna da ciò che non usi. Registrati gratis in 1 minuto — Zero commissioni per 30 giorni!',
    image: 'https://upyznglekmynztmydtxi.supabase.co/storage/v1/object/public/images/Renthubber_attivo_a_Catania.webp',
    url: 'https://renthubber.com/promo/lancio-catania',
  },
  // Aggiungi altre pagine promo qui in futuro:
  // '/promo/lancio-milano': { title: '...', description: '...', image: '...', url: '...' },
};

async function fetchReferralUser(referralCode, supabaseUrl, supabaseKey) {
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/users?referral_code=eq.${referralCode}&select=public_name,first_name`,
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
    console.error('Errore fetch referral user:', error);
    return null;
  }
}

export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // Controlla se è una pagina con OG personalizzati
  const ogData = OG_PAGES[path];
  if (!ogData) {
    // --- Gestione dinamica link referral: /invito/:codice ---
  const referralMatch = path.match(/^\/invito\/([A-Z0-9_]+)$/i);
  if (referralMatch) {
    const referralCode = referralMatch[1].toUpperCase();

    const supabaseUrl = Netlify.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Netlify.env.get('VITE_SUPABASE_ANON_KEY');

    let userName = 'Un tuo amico';

    if (supabaseUrl && supabaseKey) {
      const user = await fetchReferralUser(referralCode, supabaseUrl, supabaseKey);
      if (user) {
        userName = user.public_name || user.first_name || 'Un tuo amico';
      }
    }

    const fullUrl = `https://renthubber.com/invito/${referralCode}`;

    const referralOG = {
      title: `${userName} ti invita su Renthubber!`,
      description: `Registrati con il suo invito e ricevi un bonus sul tuo primo noleggio. Noleggia ciò che ti serve. Guadagna da ciò che non usi.`,
      image: 'https://upyznglekmynztmydtxi.supabase.co/storage/v1/object/public/images/logo-renthubber.png',
      url: fullUrl,
    };

    const response = await context.next();
    const html = await response.text();
    return new Response(injectOGTags(html, referralOG), {
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'content-type': 'text/html; charset=UTF-8',
      },
    });
  }

  return context.next();
  }

 // Inietta i meta tag OG nell'HTML
  function injectOGTags(html, ogData) {
    let modifiedHtml = html;
    modifiedHtml = modifiedHtml.replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${ogData.title}" />`);
    modifiedHtml = modifiedHtml.replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${ogData.description}" />`);
    modifiedHtml = modifiedHtml.replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${ogData.image}" />`);
    modifiedHtml = modifiedHtml.replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${ogData.url}" />`);
    modifiedHtml = modifiedHtml.replace(/<title>[^<]*<\/title>/, `<title>${ogData.title}</title>`);
    modifiedHtml = modifiedHtml.replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${ogData.description}" />`);
    modifiedHtml = modifiedHtml.replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${ogData.title}" />`);
    modifiedHtml = modifiedHtml.replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${ogData.description}" />`);
    modifiedHtml = modifiedHtml.replace(/<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${ogData.image}" />`);
    return modifiedHtml;
  }

  // Ottieni la risposta originale
  const response = await context.next();
  const html = await response.text();

  const modifiedHtml = injectOGTags(html, ogData);

  return new Response(modifiedHtml, {
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'content-type': 'text/html; charset=UTF-8',
    },
  });
};