// services/geminiService.ts
// NOTA: Il nome del file è rimasto "geminiService" ma ora usa OpenAI tramite Netlify Function

/**
 * Genera descrizione annuncio usando Netlify Function (con OpenAI)
 */
export const generateListingDescription = async (
  title: string,
  features: string,
  category: string
): Promise<string> => {
  try {
    console.log('🤖 Chiamando AI per descrizione...');

    const response = await fetch('/.netlify/functions/generate-listing-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        features,
        category,
        type: 'description',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Function error:', error);
      throw new Error(error.error || 'Failed to generate description');
    }

    const data = await response.json();
    console.log('✅ Descrizione generata:', data.result.substring(0, 100) + '...');
    
    return data.result;

  } catch (error) {
    console.error('❌ Errore generazione descrizione:', error);
    return 'Descrizione automatica non disponibile al momento. Inserisci una descrizione manualmente.';
  }
};

/**
 * Suggerisce un prezzo di noleggio giornaliero usando Netlify Function (con OpenAI)
 */
export const suggestPrice = async (
  title: string,
  category: string
): Promise<string> => {
  try {
    console.log('💰 Chiamando AI per prezzo...');

    const response = await fetch('/.netlify/functions/generate-listing-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        features: '',
        category,
        type: 'price',
      }),
    });

    if (!response.ok) {
      console.warn('⚠️ Function error per prezzo');
      return '';
    }

    const data = await response.json();
    console.log('✅ Prezzo suggerito:', data.result);
    
    return data.result;

  } catch (error) {
    console.error('❌ Errore suggerimento prezzo:', error);
    return '';
  }
};