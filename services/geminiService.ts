
import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
    const apiKey = process.env.API_KEY || ''; 
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
};

export const generateListingDescription = async (title: string, features: string, category: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) {
    return "Descrizione automatica non disponibile (API Key mancante). Inserisci una descrizione manualmente.";
  }

  const prompt = `
    Sei un esperto copywriter per Renthubber (marketplace di noleggio).
    Scrivi una descrizione professionale, persuasiva e dettagliata per questo annuncio.
    
    Categoria: ${category}
    Titolo: ${title}
    Dettagli tecnici e contesto: ${features}
    
    Requisiti:
    - Lunghezza: circa 100-150 parole.
    - Tono: Affidabile, chiaro, invogliante (stile Airbnb).
    - Includi una frase sui vantaggi di noleggiare questo specifico item/spazio.
    - Formattazione: Usa paragrafi brevi. Niente markdown complesso.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Impossibile generare la descrizione al momento.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Errore nella generazione della descrizione.";
  }
};

export const suggestPrice = async (title: string, category: string): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "";
  
    const prompt = `
      Agisci come un analista di mercato per il noleggio.
      Stima un prezzo medio di noleggio GIORNALIERO (in Euro) realistico per:
      Categoria: ${category}
      Oggetto/Spazio: ${title}
      
      Rispondi SOLO con il numero intero (es. 50). Niente testo, niente valuta.
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text?.trim() || "";
    } catch (error) {
      return "";
    }
  };
