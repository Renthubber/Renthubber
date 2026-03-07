import React from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";

export const ComeFunzionaPage: React.FC = () => {
  return (
    <PageLayout slug="come-funziona" fallbackTitle="Come funziona">
      <div className="bg-gray-50 text-gray-800">
        {/* HERO */}
        <section className="bg-white py-20 border-b">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold text-gray-900">Come funziona</h1>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto text-justify md:text-center">
              Renthubber mette in contatto chi ha oggetti, spazi o esperienze da offrire
              con chi ha bisogno di utilizzarli o parteciparvi per poche ore, giorni o settimane.
              Tutto in modo semplice, sicuro e trasparente.
            </p>
          </div>
        </section>

        {/* DUE MODI DI USARE RENTHUBBER */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-semibold text-gray-900 mb-10 text-center">
              Due modi per usare Renthubber
            </h2>
            <div className="grid md:grid-cols-2 gap-10">
              <div className="bg-white rounded-xl shadow-sm p-8 border">
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">
                  Come Renter
                </h3>
                <p className="text-gray-600 text-sm md:text-base text-justify">
                  Trovi quello che ti serve solo quando ti serve. Noleggi oggetti, prenoti spazi o partecipi a esperienze in
                  sicurezza, senza dover acquistare tutto. Filtri per categoria,
                  prezzo e posizione ti aiutano a trovare rapidamente ciò di cui
                  hai bisogno, vicino a te.
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-8 border">
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">
                  Come Hubber
                </h3>
                <p className="text-gray-600 text-sm md:text-base text-justify">
                  Metti a reddito oggetti, spazi, attrezzature o esperienze che vuoi condividere.
                  Gestisci prezzi, disponibilità, slot e regole direttamente
                  dalla dashboard, mantenendo il controllo su ogni prenotazione.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* COME FUNZIONA PER IL RENTER */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                Per chi cerca (Renter)
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6 text-justify">
                In pochi passaggi puoi trovare, prenotare e utilizzare quello di
                cui hai bisogno, dal piccolo oggetto alla grande attrezzatura o
                allo spazio per eventi. Tutto è pensato per ridurre i tempi di
                ricerca e aumentare la sicurezza.
              </p>

              <ol className="space-y-4 text-gray-700 text-sm md:text-base">
                <li className="text-justify">
                  <span className="font-semibold text-gray-900">
                    1. Cerca ciò che ti serve
                  </span>
                  <br />
                  Inserisci la città, le date e i filtri (prezzo, categoria, ecc.)
                  e scopri gli annunci disponibili nella tua zona.
                </li>
                <li className="text-justify">
                  <span className="font-semibold text-gray-900">
                    2. Verifica i dettagli
                  </span>
                  <br />
                  Leggi descrizione, regole, recensioni, posizione e condizioni di
                  noleggio prima di inviare la richiesta.
                </li>
                <li className="text-justify">
                  <span className="font-semibold text-gray-900">
                    3. Prenota in sicurezza
                  </span>
                  <br />
                  Invia la richiesta, effettua il pagamento tramite Renthubber e
                  attendi la conferma dell’Hubber direttamente in piattaforma.
                </li>
                <li className="text-justify">
                  <span className="font-semibold text-gray-900">
                    4. Ritiro, consegna o presentazione
                  </span>
                  <br />
                  Concorda con l’Hubber il ritiro dell’oggetto/spazio o la
                  consegna, in base alle opzioni disponibili nell’annuncio.
                  Per le esperienze, presentati nel luogo e all’orario indicati nello slot prenotato.
                </li>
                <li className="text-justify">
                  <span className="font-semibold text-gray-900">
                    5. Restituzione & recensione
                  </span>
                  <br />
                  A fine utilizzo restituisci l’oggetto/spazio nelle condizioni
                  concordate e lascia una recensione per aiutare la community.
                </li>
              </ol>
            </div>

           <div>
  <img
    src="https://i.imgur.com/Zvwn1Em.png"
    alt="Renter Renthubber"
    className="rounded-xl shadow-lg"
  />
</div>
          </div>
        </section>

        {/* COME FUNZIONA PER L’HUBBER */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            <div className="order-2 md:order-1">
              <div className="order-2 md:order-1">
  <img
    src="https://i.imgur.com/DWayyBZ.png"
    alt="Hubber Renthubber"
    className="rounded-xl shadow-lg"
              />
            </div>
          </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                Per chi mette a disposizione (Hubber)
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6 text-justify">
                Trasforma le tue risorse in un’entrata extra strutturata. Puoi
                decidere prezzi, cauzione, regole e disponibilità, mantenendo il
                controllo completo su ogni noleggio.
              </p>

              <ol className="space-y-4 text-gray-700 text-sm md:text-base">
                <li className="text-justify">
                  <span className="font-semibold text-gray-900">
                    1. Crea il tuo account Hubber
                  </span>
                  <br />
                  Completa il profilo, verifica la tua identità e aggiungi le
                  informazioni principali del tuo account.
                </li>
                <li className="text-justify">
                  <span className="font-semibold text-gray-900">
                    2. Pubblica il tuo annuncio
                  </span>
                  <br />
                  Aggiungi foto chiare, descrizione dettagliata, prezzo,
                  disponibilità, cauzione e regole di utilizzo.
                </li>
                <li className="text-justify">
                  <span className="font-semibold text-gray-900">
                    3. Ricevi e gestisci le richieste
                  </span>
                  <br />
                  Ricevi richieste di prenotazione, accetta o rifiuta e utilizza
                  la chat per chiarire ogni dubbio con il Renter.
                </li>
                <li className="text-justify">
                  <span className="font-semibold text-gray-900">
                    4. Consegna, gestione o erogazione
                  </span>
                  <br />
                  Organizza ritiro/consegna e assicurati che l’oggetto/spazio sia
                  conforme a quanto promesso nell’annuncio.
                  Per le esperienze, preparati per l’orario dello slot e accogliere i partecipanti prenotati.
                </li>
                <li className="text-justify">
                  <span className="font-semibold text-gray-900">
                    5. Ricevi il pagamento
                  </span>
                  <br />
                  A noleggio concluso, il pagamento viene elaborato secondo le
                  regole della piattaforma e accreditato in base alle modalità
                  previste.
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* ESPERIENZE */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-center">
              Come funzionano le Esperienze
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto text-center mb-12">
              Le esperienze sono attività, laboratori, tour, workshop e corsi proposti dagli Hubber e prenotabili tramite slot orari. Ecco come funzionano per entrambe le parti.
            </p>

            <div className="grid md:grid-cols-2 gap-12 items-start">

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-left">Per chi partecipa (Renter)</h3>
                <ol className="space-y-4 text-gray-700 text-sm md:text-base">
                  <li className="text-justify">
                    <span className="font-semibold text-gray-900">1. Cerca l’esperienza</span><br />
                    Sfoglia le esperienze disponibili nella tua zona, filtra per categoria, data e prezzo.
                  </li>
                  <li className="text-justify">
                    <span className="font-semibold text-gray-900">2. Scegli lo slot</span><br />
                    Seleziona la data e l’orario che preferisci tra quelli disponibili e verifica eventuali requisiti (età, attrezzatura, ecc.).
                  </li>
                  <li className="text-justify">
                    <span className="font-semibold text-gray-900">3. Prenota e paga</span><br />
                    Completa la prenotazione e il pagamento in piattaforma. Riceverai la conferma direttamente nell’app.
                  </li>
                  <li className="text-justify">
                    <span className="font-semibold text-gray-900">4. Presentati allo slot</span><br />
                    Recati nel luogo indicato all’orario preciso dello slot. In caso di impedimento, cancella entro i termini previsti dalla politica dell’annuncio.
                  </li>
                  <li className="text-justify">
                    <span className="font-semibold text-gray-900">5. Lascia una recensione</span><br />
                    Al termine dell’esperienza, condividi il tuo feedback per aiutare la community.
                  </li>
                </ol>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-left">Per chi organizza (Hubber)</h3>
                <ol className="space-y-4 text-gray-700 text-sm md:text-base">
                  <li className="text-justify">
                    <span className="font-semibold text-gray-900">1. Crea l’annuncio</span><br />
                    Descrivi l’esperienza, carica foto, imposta prezzo, durata, numero massimo di partecipanti ed eventuali requisiti.
                  </li>
                  <li className="text-justify">
                    <span className="font-semibold text-gray-900">2. Configura gli slot</span><br />
                    Definisci le date e gli orari disponibili direttamente dalla dashboard. Puoi aggiungere, modificare o rimuovere slot in qualsiasi momento.
                  </li>
                  <li className="text-justify">
                    <span className="font-semibold text-gray-900">3. Gestisci le prenotazioni</span><br />
                    Ricevi le prenotazioni dei partecipanti, accetta o rifiuta e utilizza la chat per chiarire eventuali dubbi.
                  </li>
                  <li className="text-justify">
                    <span className="font-semibold text-gray-900">4. Eroga l’esperienza</span><br />
                    Accogliere i partecipanti all’orario dello slot e assicurati che l’attività si svolga come descritto nell’annuncio.
                  </li>
                  <li className="text-justify">
                    <span className="font-semibold text-gray-900">5. Ricevi il pagamento</span><br />
                    A esperienza conclusa, il compenso viene elaborato e accreditato sul tuo wallet secondo le regole della piattaforma.
                  </li>
                </ol>
              </div>

            </div>
          </div>
        </section>

        {/* TUTTO PASSA DALLA PIATTAFORMA */}
<section className="py-16 bg-white border-y">
  <div className="max-w-6xl mx-auto px-6">
    <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
      Tutto passa attraverso Renthubber
    </h2>
    <p className="text-gray-600 max-w-3xl mx-auto text-center">
      Pagamenti, cauzioni, recensioni e comunicazioni sono gestiti
      direttamente sulla piattaforma. In questo modo possiamo tutelare
      sia chi noleggia sia chi mette a disposizione, riducendo rischi,
      incomprensioni e perdite di tempo. L'obiettivo è garantire un
      ecosistema chiaro, tracciato e affidabile per tutti.
    </p>
  </div>
</section>

        {/* CTA FINALE */}
        <section
          className="py-20 text-white text-center"
          style={{ backgroundColor: "#0D414B" }}
        >
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-4">
              Pronto a iniziare con Renthubber?
            </h2>
            <p className="text-lg text-gray-200 mb-8 text-justify md:text-center">
              Registrati come Renter, come Hubber o entrambe le cose e inizia a
              usare la piattaforma in base alle tue esigenze. Ogni profilo può
              evolversi nel tempo, seguendo le tue necessità reali.
            </p>
            <Link to="/Signup" // sostituisci con la tua route reale
              className="inline-block px-8 py-3 rounded-full text-lg font-semibold bg-white text-[#0D414B] hover:bg-gray-100 transition"
            >
              Crea il tuo account
            </Link>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default ComeFunzionaPage;