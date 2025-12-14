/**
 * 📩 BOOKING MESSAGES
 * Gestisce tutti i messaggi di sistema per cancellazioni e modifiche prenotazioni
 */

interface CancelRenterMessagesParams {
  listingTitle: string;
  renterPublicName: string;
  hubberPublicName: string;
  refundAmount: number;
  refundPercentage: number;
  refundMethod: 'wallet' | 'card';
  policy: 'flexible' | 'moderate' | 'strict';
  hubberNetAmount: number;
}

interface CancelHubberMessagesParams {
  listingTitle: string;
  hubberPublicName: string;
  refundAmount: number;
}

/**
 * Genera messaggi per cancellazione da parte del Renter
 */
export function getCancelRenterMessages(params: CancelRenterMessagesParams): {
  messageForRenter: string;
  messageForHubber: string;
} {
  const {
    listingTitle,
    renterPublicName,
    refundAmount,
    refundPercentage,
    refundMethod,
    policy,
    hubberNetAmount,
  } = params;

  // Nomi politiche
  const policyNames: Record<string, string> = {
    flexible: 'Flessibile',
    moderate: 'Moderata',
    strict: 'Rigida',
  };
  const policyName = policyNames[policy] || 'Standard';

  // Dettagli politica
  const policyDetails: Record<string, string> = {
    flexible: 'Per la politica flessibile serve almeno 24 ore di preavviso',
    moderate: 'Per la politica moderata servono almeno 5 giorni di preavviso',
    strict: 'Per la politica rigida servono almeno 7 giorni di preavviso',
  };
  const policyDetail = policyDetails[policy] || '';

  // MESSAGGIO PER IL RENTER
  let messageForRenter = '';
  if (refundPercentage === 0) {
    // CASO: 0% rimborso
    messageForRenter = `Hai cancellato la prenotazione per "${listingTitle}".

Politica di cancellazione: ${policyName}
⚠️ Nessun rimborso disponibile

La cancellazione è avvenuta oltre i termini previsti dalla politica di cancellazione.
${policyDetail}

L'importo pagato non verrà rimborsato e l'Hubber riceverà il compenso.`;
  } else {
    // CASO: 100% o 50% rimborso
    const refundDestination = refundMethod === 'wallet' 
      ? 'Wallet RentHubber' 
      : 'Wallet RentHubber (per quota utilizzata) e metodo di pagamento (Stripe)';

    const timeInfo = refundMethod === 'wallet'
      ? '• Wallet RentHubber: immediato'
      : `• Wallet RentHubber: immediato\n• Metodo di pagamento (Stripe): 5–10 giorni lavorativi`;

    messageForRenter = `Hai cancellato la prenotazione per "${listingTitle}".

Politica di cancellazione: ${policyName}
💰 Rimborso: €${refundAmount.toFixed(2)} (${refundPercentage}%)

Il rimborso è stato accreditato su ${refundDestination}.

Tempistiche:
${timeInfo}`;
  }

  // MESSAGGIO PER L'HUBBER
  let messageForHubber = '';
  if (refundPercentage === 0) {
    // CASO: 0% rimborso
    messageForHubber = `${renterPublicName} ha cancellato la prenotazione per "${listingTitle}".

Politica applicata: ${policyName}
💰 Riceverai il compenso nonostante la cancellazione

L'importo di €${hubberNetAmount.toFixed(2)} verrà accreditato sul tuo Wallet Hubber come da policy.`;
  } else {
    // CASO: 100% o 50% rimborso
    messageForHubber = `${renterPublicName} ha cancellato la prenotazione per "${listingTitle}".

Politica applicata: ${policyName}
💰 Rimborso al Renter: €${refundAmount.toFixed(2)} (${refundPercentage}%).`;
  }

  return { messageForRenter, messageForHubber };
}

/**
 * Genera messaggi per cancellazione da parte dell'Hubber
 */
export function getCancelHubberMessages(params: CancelHubberMessagesParams): {
  messageForRenter: string;
  messageForHubber: string;
} {
  const { listingTitle, hubberPublicName, refundAmount } = params;

  // MESSAGGIO PER IL RENTER
  const messageForRenter = `${hubberPublicName} ha cancellato la prenotazione per "${listingTitle}".

💰 Rimborso completo: €${refundAmount.toFixed(2)} (100%)
Il rimborso verrà riaccreditato sul metodo di pagamento utilizzato (Stripe).

Tempistiche: 5–10 giorni lavorativi.
Ci scusiamo per l'inconveniente.`;

  // MESSAGGIO PER L'HUBBER
  const messageForHubber = `Hai cancellato la prenotazione per "${listingTitle}".

💰 Rimborso al Renter: €${refundAmount.toFixed(2)} (100%)
sul metodo di pagamento originale (Stripe).`;

  return { messageForRenter, messageForHubber };
}