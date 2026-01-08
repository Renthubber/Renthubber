import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { generateHubberICalFeed } from '../../services/ical';

/**
 * Netlify Function: iCal Export
 * 
 * Gestisce richieste GET a /.netlify/functions/ical
 * URL pattern: /api/ical/:userId/:token.ics
 * 
 * Esempio: https://renthubber.com/.netlify/functions/ical?userId=xxx&token=yyy
 */
export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  // Solo GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    // Estrai parametri dall'URL
    const params = event.queryStringParameters || {};
    const userId = params.userId;
    const token = params.token;

    if (!userId || !token) {
      return {
        statusCode: 400,
        body: 'Missing userId or token',
      };
    }

    // Genera il feed iCal
    const icalContent = await generateHubberICalFeed(userId, token);

    // Restituisci con header appropriati
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="renthubber.ics"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      body: icalContent,
    };

  } catch (error: any) {
    console.error('Errore generazione iCal:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: `Errore: ${error.message || 'Errore generazione calendario'}`,
    };
  }
};