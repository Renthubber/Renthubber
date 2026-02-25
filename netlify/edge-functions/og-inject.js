// Edge Function: Inietta meta tag OG specifici per pagina
// I crawler social (Facebook, LinkedIn, Twitter) non eseguono JavaScript,
// quindi questa function intercetta le richieste e modifica l'HTML al volo.

const OG_PAGES = {
  '/promo/lancio-catania': {
    title: 'RentHubber è finalmente attivo a Catania!',
    description: 'Noleggia ciò che ti serve. Guadagna da ciò che non usi. Registrati gratis in 1 minuto — Zero commissioni per 30 giorni!',
    image: 'https://upyznglekmynztmydtxi.supabase.co/storage/v1/object/public/images/Renthubber_Catania.webp',
    url: 'https://renthubber.com/promo/lancio-catania',
  },
  // Aggiungi altre pagine promo qui in futuro:
  // '/promo/lancio-milano': { title: '...', description: '...', image: '...', url: '...' },
};

export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // Controlla se è una pagina con OG personalizzati
  const ogData = OG_PAGES[path];
  if (!ogData) {
    return context.next();
  }

  // Ottieni la risposta originale
  const response = await context.next();
  const html = await response.text();

  // Sostituisci i meta tag OG esistenti
  let modifiedHtml = html;

  // Sostituisci og:title
  modifiedHtml = modifiedHtml.replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${ogData.title}" />`
  );

  // Sostituisci og:description
  modifiedHtml = modifiedHtml.replace(
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${ogData.description}" />`
  );

  // Sostituisci og:image
  modifiedHtml = modifiedHtml.replace(
    /<meta property="og:image" content="[^"]*" \/>/,
    `<meta property="og:image" content="${ogData.image}" />`
  );

  // Sostituisci og:url
  modifiedHtml = modifiedHtml.replace(
    /<meta property="og:url" content="[^"]*" \/>/,
    `<meta property="og:url" content="${ogData.url}" />`
  );

  // Sostituisci title tag
  modifiedHtml = modifiedHtml.replace(
    /<title>[^<]*<\/title>/,
    `<title>${ogData.title}</title>`
  );

  // Sostituisci meta description
  modifiedHtml = modifiedHtml.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${ogData.description}" />`
  );

  // Sostituisci Twitter card
  modifiedHtml = modifiedHtml.replace(
    /<meta name="twitter:title" content="[^"]*" \/>/,
    `<meta name="twitter:title" content="${ogData.title}" />`
  );
  modifiedHtml = modifiedHtml.replace(
    /<meta name="twitter:description" content="[^"]*" \/>/,
    `<meta name="twitter:description" content="${ogData.description}" />`
  );
  modifiedHtml = modifiedHtml.replace(
    /<meta name="twitter:image" content="[^"]*" \/>/,
    `<meta name="twitter:image" content="${ogData.image}" />`
  );

  return new Response(modifiedHtml, {
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'content-type': 'text/html; charset=UTF-8',
    },
  });
};