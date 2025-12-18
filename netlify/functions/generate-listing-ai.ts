// netlify/functions/generate-listing-ai.ts

import { Handler } from '@netlify/functions';

interface RequestBody {
  title: string;
  features: string;
  category: string;
  type: 'description' | 'price';
}

export const handler: Handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only POST allowed
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    const body: RequestBody = JSON.parse(event.body || '{}');
    const { title, features, category, type } = body;

    // Validate
    if (!title || !category || !type) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Get API key from environment (server-side, secure!)
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('❌ OPENAI_API_KEY not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API key not configured' }),
      };
    }

    let prompt: string;
    let result: string;

    if (type === 'description') {
      // Generate description
      prompt = `Sei un esperto copywriter per RentHubber, un marketplace di noleggio peer-to-peer in Italia.

Scrivi una descrizione professionale, persuasiva e dettagliata per questo annuncio:

Categoria: ${category}
Titolo: ${title}
Dettagli tecnici e contesto: ${features}

Requisiti:
- Lunghezza: circa 100-150 parole
- Tono: Affidabile, chiaro, invogliante (stile Airbnb)
- Includi una frase sui vantaggi di noleggiare questo specifico item/spazio
- Usa paragrafi brevi e chiari
- Scrivi in italiano
- NON usare markdown, solo testo semplice

Rispondi SOLO con la descrizione, senza introduzioni o titoli.`;

    } else if (type === 'price') {
      // Suggest price
      prompt = `Agisci come un analista di mercato per il noleggio in Italia.

Stima un prezzo medio di noleggio GIORNALIERO realistico (in Euro) per:
Categoria: ${category}
Oggetto/Spazio: ${title}

Considera il mercato italiano e prezzi competitivi per un marketplace peer-to-peer.

IMPORTANTE: Rispondi SOLO con il numero intero (es. 25), senza simboli €, valuta o testo.

Esempi:
- Trapano → 15
- Fotocamera professionale → 45
- Sala eventi 100 persone → 800
- Consolle DJ → 60

Rispondi solo con il numero:`;

    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid type' }),
      };
    }

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: type === 'description' ? 300 : 50,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      console.error('❌ OpenAI API Error:', error);
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await openaiResponse.json();
    result = data.choices[0]?.message?.content?.trim() || '';

    // For price, extract only numbers
    if (type === 'price') {
      result = result.replace(/[^0-9]/g, '');
    }

    console.log(`✅ AI ${type} generated successfully`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ result }),
    };

  } catch (error) {
    console.error('❌ OpenAI API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate content',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};