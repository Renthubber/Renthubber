var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/generate-listing-ai.ts
var generate_listing_ai_exports = {};
__export(generate_listing_ai_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(generate_listing_ai_exports);
var handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }
  try {
    const body = JSON.parse(event.body || "{}");
    const { title, features, category, type } = body;
    if (!title || !category || !type) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields" })
      };
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("\u274C OPENAI_API_KEY not configured");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "API key not configured" })
      };
    }
    let prompt;
    let result;
    if (type === "description") {
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
    } else if (type === "price") {
      prompt = `Agisci come un analista di mercato per il noleggio in Italia.

Stima un prezzo medio di noleggio GIORNALIERO realistico (in Euro) per:
Categoria: ${category}
Oggetto/Spazio: ${title}

Considera il mercato italiano e prezzi competitivi per un marketplace peer-to-peer.

IMPORTANTE: Rispondi SOLO con il numero intero (es. 25), senza simboli \u20AC, valuta o testo.

Esempi:
- Trapano \u2192 15
- Fotocamera professionale \u2192 45
- Sala eventi 100 persone \u2192 800
- Consolle DJ \u2192 60

Rispondi solo con il numero:`;
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid type" })
      };
    }
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: type === "description" ? 300 : 50
      })
    });
    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      console.error("\u274C OpenAI API Error:", error);
      throw new Error(`OpenAI API error: ${error.error?.message || "Unknown error"}`);
    }
    const data = await openaiResponse.json();
    result = data.choices[0]?.message?.content?.trim() || "";
    if (type === "price") {
      result = result.replace(/[^0-9]/g, "");
    }
    console.log(`\u2705 AI ${type} generated successfully`);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ result })
    };
  } catch (error) {
    console.error("\u274C OpenAI API Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to generate content",
        details: error instanceof Error ? error.message : "Unknown error"
      })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=generate-listing-ai.js.map
