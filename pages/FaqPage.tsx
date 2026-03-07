import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import PageLayout from "../components/PageLayout";

export const FaqPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  // FAQ DIVISE PER CATEGORIA (VERSIONE ESTESA)
  const faqData = [
    {
      title: "Per chi noleggia (Renter)",
      color: "border-blue-500 bg-blue-50",
      textColor: "text-blue-700",
      faqs: [
        {
          q: "Come funziona una prenotazione?",
          a: "Per prenotare un oggetto o spazio è sufficiente andare nella pagina dell’annuncio, selezionare le date e inviare una richiesta. In base alle impostazioni dell’Hubber, la prenotazione può essere confermata automaticamente oppure richiedere l’accettazione manuale.",
        },
        {
          q: "Devo contattare l’Hubber prima di prenotare?",
          a: "Non è obbligatorio, ma è consigliato in caso di dubbi su orari, utilizzo, condizioni particolari o dettagli non chiari nell’annuncio. Utilizza sempre la chat interna di Renthubber per mantenere le conversazioni tracciate.",
        },
        {
          q: "Cosa succede se l’Hubber non si presenta (no-show)?",
          a: "Se l’Hubber non si presenta o non consegna l’oggetto/lo spazio come concordato, ti invitiamo a segnalarlo subito tramite il Centro assistenza. Il nostro team valuterà il caso e potrà predisporre eventuali rimborsi secondo le regole della piattaforma.",
        },
        {
          q: "Come funzionano le politiche di cancellazione?",
          a: "Ogni annuncio indica la propria politica di cancellazione: Flessibile (100% rimborso fino a 24h prima), Moderata (100% rimborso fino a 5 giorni prima) o Rigida (50% rimborso fino a 7 giorni prima). Prima di prenotare, controlla sempre la politica applicata.",
        },
        {
          q: "Posso modificare una prenotazione già confermata?",
          a: "In alcuni casi è possibile richiedere modifiche a date o orari, previo accordo con l’Hubber. Le modifiche potrebbero influire sul prezzo totale o sulla possibilità di mantenere il diritto a cancellazione e rimborso.",
        },
        {
          q: "Posso lasciare una recensione dopo il noleggio?",
          a: "Sì, al termine del noleggio potrai lasciare una recensione sull’Hubber e sull’esperienza. Le recensioni aiutano la community a scegliere utenti affidabili e a migliorare la qualità degli annunci.",
        },
      ],
    },
    {
      title: "Per chi pubblica (Hubber)",
      color: "border-green-500 bg-green-50",
      textColor: "text-green-700",
      faqs: [
        {
          q: "Che tipo di annuncio posso pubblicare?",
          a: "Su RentHubber è possibile pubblicare annunci di noleggio di oggetti, spazi e immobili per affitto a medio/lungo termine (durata minima 30 giorni). Non sono ammessi annunci di affitti brevi, alloggi turistici o strutture per il pernottamento. Per quanto riguarda gli oggetti, è possibile mettere a noleggio beni di uso personale, hobbistico o professionale, come attrezzature, strumenti, dispositivi, accessori, materiali per eventi, sport, lavoro o tempo libero. Per quanto riguarda gli spazi, sono ammessi spazi utilizzabili per attività temporanee o specifiche, come garage, box, depositi, magazzini, uffici, sale riunioni, studi professionali, laboratori, spazi creativi, aree private o spazi per eventi. Per quanto riguarda gli immobili, è possibile pubblicare annunci di affitto residenziale o commerciale con durata minima di 30 giorni.",
        },
        {
          q: "È possibile pubblicare annunci di affitti brevi o strutture per il pernottamento su RentHubber?",
          a: "No. Su RentHubber non è consentito pubblicare annunci di affitto con durata inferiore a 30 giorni, né annunci relativi a B&B, hotel, case vacanza o qualsiasi struttura destinata al pernottamento turistico. È invece possibile pubblicare annunci di affitto residenziale o commerciale a medio/lungo termine (durata minima 30 giorni). RentHubber non è una piattaforma di affitti turistici, ma un marketplace dedicato al noleggio di oggetti, spazi e immobili per affitto medio/lungo termine.",
         },
          {
          q: "Come pubblico un nuovo annuncio?",
          a: "Accedi alla tua area Hubber, clicca su “Pubblica un annuncio” e compila tutti i campi richiesti: titolo, descrizione, categoria, foto, prezzo, deposito cauzionale (se previsto) e politica di cancellazione.",
        },
        {
  q: "Cosa devo inserire nella descrizione dell’annuncio?",
  a: (
    <>
      <p>
        Descrivi in modo chiaro l’oggetto o lo spazio che stai mettendo a noleggio,
        specificando le <strong>condizioni d’uso</strong>, eventuali{" "}
        <strong>limiti</strong>, i{" "}
        <strong>requisiti per il ritiro o la consegna</strong> e qualsiasi
        informazione utile per aiutare il Renter a capire cosa aspettarsi.
      </p>

      <p className="mt-2">
        Per rendere tutto più semplice e veloce,{" "}
        <strong>Renthubber integra un sistema di intelligenza artificiale</strong>{" "}
        che ti aiuta a{" "}
        <strong>
          generare automaticamente una descrizione completa e ben strutturata
        </strong>{" "}
        a partire dai dati inseriti.
      </p>

      <p className="mt-2">
        La descrizione generata dall’AI può essere{" "}
        <strong>modificata e personalizzata liberamente</strong> prima della
        pubblicazione dell’annuncio.
      </p>

      <p className="mt-3 text-sm text-gray-500">
        Più la descrizione è precisa e dettagliata, minori saranno i
        fraintendimenti e migliore sarà l’esperienza di noleggio per entrambe le
        parti.
      </p>
    </>
  ),
},

        {
          q: "Posso rifiutare una prenotazione?",
          a: "Sì, puoi rifiutare una richiesta di prenotazione se non sei disponibile, se le condizioni non ti sembrano adeguate o se l’uso proposto non è in linea con l’annuncio. Ti invitiamo comunque a motivare in modo educato il rifiuto, se possibile.",
        },
        {
          q: "Come gestisco cauzione e danni?",
          a: "Se imposti un deposito cauzionale, questo viene gestito secondo le regole della piattaforma (ad esempio tramite pre-autorizzazione). In caso di danni, potrai aprire una segnalazione allegando prove (foto, descrizioni, documenti) per valutare eventuali trattenute.",
        },
        {
          q: "Posso mettere in pausa i miei annunci?",
          a: "Sì, puoi sospendere temporaneamente la visibilità di uno o più annunci (ad esempio durante ferie o periodi di indisponibilità). In questo modo non riceverai nuove richieste di prenotazione, ma potrai continuare a gestire quelle già confermate.",
        },
        {
          q: "Come posso aumentare le possibilità di ricevere prenotazioni?",
          a: "Foto chiare, descrizioni complete, prezzi competitivi, risposta rapida ai messaggi e un buon punteggio di recensioni sono tutti elementi che aumentano la probabilità di essere scelti dai Renter. Anche aderire al programma SuperHubber può offrire maggiore visibilità.",
        },
      ],
    },
    {
      title: "Pagamenti & Sicurezza",
      color: "border-yellow-500 bg-yellow-50",
      textColor: "text-yellow-700",
      faqs: [
      {
  q: "Come collego il mio IBAN tramite Stripe?",
  a: (
    <>
      <p>
        Per ricevere i pagamenti su Renthubber è necessario collegare il proprio
        conto corrente (IBAN) tramite Stripe, il nostro partner per la
        gestione sicura dei pagamenti.
      </p>

      <p className="mt-2">
        Puoi farlo accedendo alla sezione <strong>Wallet Hubber</strong>, dove
        troverai il pulsante <strong>“Configura Pagamenti Stripe”</strong>.
        Cliccando su questa voce verrai guidato passo dopo passo nella procedura
        di collegamento del conto.
      </p>

      <p className="mt-2">
        Il processo richiede generalmente circa <strong>5 minuti</strong> e
        prevede:
      </p>

      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li>l’inserimento dei dati personali o aziendali</li>
        <li>l’indicazione dell’IBAN su cui ricevere i pagamenti</li>
        <li>
          eventuali verifiche richieste da Stripe per motivi di sicurezza e
          conformità
        </li>
      </ul>

      <p className="mt-3">
        Una volta completata la configurazione e approvata da Stripe, potrai
        ricevere i compensi sul tuo wallet e richiedere il bonifico quando il
        saldo risulterà disponibile.
      </p>

      <p className="mt-3 text-sm text-gray-500">
        📌 <strong>Nota:</strong> senza il collegamento dell’IBAN tramite Stripe
        Connect non è possibile ricevere i pagamenti.
      </p>
    </>
  ),
},

        {
          q: "Quando ricevo il pagamento come Hubber?",
          a: "In genere, i pagamenti vengono elaborati entro 48 ore dal completamento della prenotazione. Il compenso viene quindi accreditato sul wallet interno della piattaforma, nella sezione Wallet Hubber, salvo la presenza di verifiche, controlli o segnalazioni in corso. Una volta che il saldo risulta disponibile, e solo dopo aver configurato correttamente il proprio IBAN tramite Stripe, sarà possibile richiedere il bonifico. Il pagamento verrà poi elaborato entro 5–10 giorni lavorativi. I tempi effettivi possono variare in base al metodo di pagamento utilizzato e ai tempi di elaborazione del fornitore di servizi di pagamento.",
        },
        {
          q: "Perché vedo una pre-autorizzazione sulla carta del Renter?",
          a: "In alcuni casi, prima di confermare una prenotazione o un deposito cauzionale, il sistema effettua una pre-autorizzazione per verificare la disponibilità dei fondi. Si tratta di una procedura standard dei circuiti di pagamento.",
        },
        {
          q: "Dove trovo fatture o ricevute dei pagamenti?",
          a: "All’interno della tua area personale potrai consultare lo storico dei pagamenti, scaricare ricevute e, se previsto, documenti fiscali collegati alle transazioni effettuate tramite Renthubber.",
        },
        {
          q: "È sicuro pagare su Renthubber?",
          a: "Le transazioni avvengono tramite fornitori di pagamento certificati che utilizzano protocolli di sicurezza avanzati. Ti ricordiamo di non condividere mai dati sensibili (come PIN o password) tramite chat o canali non ufficiali.",
        },
        {
          q: "Cosa devo fare se sospetto una truffa o un uso improprio?",
          a: "In caso di comportamenti sospetti, richieste di pagamento fuori piattaforma o comunicazioni anomale, ti invitiamo a non procedere con il pagamento e a contattare immediatamente il Centro assistenza o a utilizzare la funzione “Segnala un problema”.",
        },
        {
          q: "Posso essere rimborsato in caso di problema con il noleggio?",
          a: "Ogni situazione viene valutata singolarmente dal team di supporto, considerando le politiche di cancellazione, le prove fornite e le regole della piattaforma. È importante documentare il problema con foto, descrizioni e messaggi in chat.",
        },
      ],
    },
    {
      title: "Esperienze",
      color: "border-purple-500 bg-purple-50",
      textColor: "text-purple-700",
      faqs: [
        {
          q: "Come funziona la prenotazione di un’esperienza?",
          a: "Cerca l’esperienza che ti interessa, seleziona uno slot disponibile (data e orario) e completa la prenotazione con il pagamento in piattaforma. Riceverai una conferma direttamente nell’app. La conferma può essere automatica o richiedere l’approvazione manuale dell’Hubber, a seconda delle impostazioni dell’annuncio.",
        },
        {
          q: "Cosa succede se non mi presento allo slot (no-show)?",
          a: "Se non ti presenti all’orario dello slot senza aver cancellato nei termini previsti dalla politica di cancellazione dell’annuncio, non è previsto alcun rimborso. Ti consigliamo di cancellare in anticipo se sai che non potrai partecipare.",
        },
        {
          q: "Posso cancellare la prenotazione di un’esperienza?",
          a: "Sì, puoi cancellare entro i termini stabiliti dalla politica di cancellazione dell’annuncio (Flessibile, Moderata o Rigida). Il rimborso dipende da quando effettui la cancellazione rispetto all’orario di inizio dello slot. Controlla sempre la politica prima di prenotare.",
        },
        {
          q: "L’esperienza può essere annullata dall’Hubber?",
          a: "Sì, l’Hubber può annullare uno slot per cause di forza maggiore o motivi straordinari. In questo caso hai sempre diritto al rimborso integrale dell’importo pagato, indipendentemente dalla politica di cancellazione applicata. Riceverai una notifica tramite la piattaforma.",
        },
        {
          q: "Come pubblico un’esperienza come Hubber?",
          a: "Accedi alla tua area Hubber, seleziona la categoria ‘Esperienza’ e compila tutti i campi: titolo, descrizione, categoria, foto, prezzo, durata, numero massimo di partecipanti ed eventuali requisiti speciali (età minima, attrezzatura, ecc.). Dopo la pubblicazione potrai configurare gli slot direttamente dalla dashboard.",
        },
        {
          q: "Come gestisco gli slot di un’esperienza?",
          a: "Dalla dashboard Hubber puoi aggiungere, modificare o rimuovere slot in qualsiasi momento. Per ogni slot definisci data, orario e numero massimo di posti disponibili. Gli slot già prenotati non possono essere modificati senza comunicarlo ai partecipanti.",
        },
        {
          q: "Cosa succede se un partecipante non si presenta (no-show)?",
          a: "Se un partecipante non si presenta allo slot senza aver cancellato nei termini previsti, non è previsto alcun rimborso a suo favore. Il compenso per lo slot verrà comunque elaborato secondo le regole della piattaforma.",
        },
        {
          q: "Posso annullare uno slot già pubblicato?",
          a: "Sì, puoi annullare uno slot per motivi straordinari o di forza maggiore. In caso di annullamento da parte tua, tutti i partecipanti già prenotati hanno diritto al rimborso integrale. Ti invitiamo a comunicare l’annullamento il prima possibile tramite la piattaforma e, se possibile, a proporre una data alternativa.",
        },
      ],
    },
  ];

  return (
    <PageLayout slug="faq" fallbackTitle="Domande frequenti">
      <div className="bg-gray-50 text-gray-800">
        {/* HERO */}
        <section className="bg-white py-20 border-b">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold text-gray-900">Domande frequenti</h1>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto text-justify md:text-center">
              Qui trovi le risposte ai dubbi più comuni su Renthubber. Scegli una
              categoria e clicca sulla domanda per aprire la risposta.
            </p>
          </div>
        </section>

        {/* FAQ CATEGORIES */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6 space-y-16">
            {faqData.map((category, catIndex) => (
              <div key={catIndex}>
                {/* Titolo della categoria */}
                <h2
                  className={`text-2xl font-bold mb-6 ${category.textColor}`}
                >
                  {category.title}
                </h2>

                <div className="space-y-4">
                  {category.faqs.map((item, index) => {
                    const realIndex = `${catIndex}-${index}`;
                    const isOpen = openIndex === realIndex;

                    return (
                      <div
                        key={realIndex}
                        className={`border rounded-xl p-4 transition-all ${category.color}`}
                      >
                        {/* Domanda */}
                        <button
                          onClick={() =>
                            setOpenIndex(isOpen ? null : realIndex)
                          }
                          className="w-full flex justify-between items-center text-left"
                        >
                          <span className="font-semibold text-gray-800">
                            {item.q}
                          </span>
                          <span>
                            {isOpen ? (
                              <ChevronUp className="text-gray-600" />
                            ) : (
                              <ChevronDown className="text-gray-600" />
                            )}
                          </span>
                        </button>

                        {/* Risposta */}
                        {isOpen && (
                          <p className="mt-3 text-gray-700 leading-relaxed text-justify">
                            {item.a}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section
          className="py-20 text-white text-center"
          style={{ backgroundColor: "#0D414B" }}
        >
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-4">
              Non hai trovato la risposta?
            </h2>
            <p className="text-lg text-gray-200 mb-8 text-justify md:text-center">
              Il nostro team di supporto è sempre disponibile per aiutarti.
              Contattaci o apri una segnalazione dal Centro assistenza.
            </p>
            <a
              href="/assistenza"
              className="inline-block px-8 py-3 rounded-full text-lg font-semibold bg-white text-[#0D414B] hover:bg-gray-100 transition"
            >
              Vai al Centro Assistenza
            </a>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default FaqPage;