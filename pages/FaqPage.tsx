import React, { useState } from "react";
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
          q: "Come pubblico un nuovo annuncio?",
          a: "Accedi alla tua area Hubber, clicca su “Pubblica un annuncio” e compila tutti i campi richiesti: titolo, descrizione, categoria, foto, prezzo, deposito cauzionale (se previsto) e politica di cancellazione.",
        },
        {
          q: "Cosa devo inserire nella descrizione dell’annuncio?",
          a: "Descrivi in modo chiaro l’oggetto o lo spazio, specifica condizioni d’uso, eventuali limiti, requisiti per il ritiro/consegna e tutto ciò che può aiutare il Renter a capire cosa aspettarsi. Più la descrizione è precisa, meno saranno i fraintendimenti.",
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
          q: "Quando ricevo il pagamento come Hubber?",
          a: "In genere i pagamenti vengono elaborati entro 48 ore dalla fine del noleggio, salvo verifiche o segnalazioni in corso. I tempi esatti possono variare in base al metodo di pagamento e al fornitore utilizzato.",
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
              href="#"
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
