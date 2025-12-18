import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
    // ✅ FIX: Usa import.meta.env per Vite
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''; 
    
    if (!apiKey) {
      console.warn("⚠️ VITE_GEMINI_API_KEY non configurata");
      return null;
    }
    
    return new GoogleGenAI({ apiKey });
};

export const generateListingDescription = async (
  title: string, 
  features: string, 
  category: string
): Promise<string> => {
  const ai = getAiClient();
  
  if (!ai) {
    console.error("❌ Gemini non disponibile - API Key mancante");
    return "Descrizione automatica non disponibile (API Key mancante). Inserisci una descrizione manualmente.";
  }

  const prompt = `
Sei un esperto copywriter per RentHubber, un marketplace di noleggio peer-to-peer in Italia.

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

Rispondi SOLO con la descrizione, senza introduzioni o titoli.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });
    
    const text = response.text || "Impossibile generare la descrizione al momento.";
    console.log("✅ Descrizione generata:", text.substring(0, 100) + "...");
    return text;
    
  } catch (error) {
    console.error("❌ Gemini API Error:", error);
    return "Errore nella generazione della descrizione. Verifica la configurazione API.";
  }
};

export const suggestPrice = async (
  title: string, 
  category: string
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) {
    console.warn("⚠️ Gemini non disponibile per suggerimento prezzo");
    return "";
  }

  const prompt = `
Agisci come un analista di mercato per il noleggio in Italia.

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

Rispondi solo con il numero:
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });
    
    const priceText = response.text?.trim() || "";
    // Estrai solo numeri
    const price = priceText.replace(/[^0-9]/g, '');
    
    console.log("✅ Prezzo suggerito:", price);
    return price;
    
  } catch (error) {
    console.error("❌ Gemini Price Error:", error);
    return "";
  }
};