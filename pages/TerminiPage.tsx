import React from "react";
import PageLayout from "../components/PageLayout";

export const TerminiPage: React.FC = () => {
  return (
    <PageLayout slug="termini-condizioni" fallbackTitle="Termini e condizioni d’uso">
      <div className="bg-gray-50 text-gray-800">
        {/* HERO */}
        <section className="bg-white py-20 border-b">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold text-gray-900">
              Termini e condizioni d’uso
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto text-justify md:text-center">
              I presenti Termini e condizioni d’uso (di seguito, “Termini”)
              regolano l’accesso e l’utilizzo della piattaforma Renthubber
              da parte degli utenti, siano essi Renter (chi noleggia) o Hubber
              (chi mette a disposizione oggetti o spazi).
            </p>
          </div>
        </section>

        {/* 1. OGGETTO E PIATTAFORMA */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
              1. Oggetto della piattaforma
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-4 max-w-3xl">
              Renthubber è una piattaforma digitale che permette agli utenti di
              mettere a disposizione e/o noleggiare oggetti, attrezzature e spazi
              in modalità peer-to-peer. La piattaforma facilita l’incontro tra
              domanda e offerta, ma non è parte contrattuale del contratto di
              noleggio che si instaura tra Renter e Hubber.
            </p>
            <p className="text-gray-600 leading-relaxed text-justify max-w-3xl">
              Accedendo e utilizzando la piattaforma, l’utente dichiara di aver
              letto, compreso e accettato i presenti Termini.
            </p>
          </div>
        </section>

        {/* 2. REGISTRAZIONE E ACCOUNT */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
                2. Registrazione e gestione dell’account
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Per utilizzare le principali funzionalità di Renthubber è
                necessario creare un account, fornendo informazioni vere, corrette
                e aggiornate. L’utente è responsabile della riservatezza delle
                proprie credenziali di accesso e di tutte le attività svolte
                tramite il proprio account.
              </p>
              <p className="text-gray-600 leading-relaxed text-justify">
                Il Titolare si riserva la facoltà di sospendere o chiudere gli
                account che violano i Termini, le leggi applicabili o le policy
                della community.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border">
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">
                Requisiti minimi
              </h3>
              <p className="text-gray-600 text-sm md:text-base text-justify mb-2">
                Per registrarsi e utilizzare la piattaforma, l’utente dichiara:
              </p>
              <ul className="list-disc list-inside text-gray-700 text-sm md:text-base space-y-2">
                <li className="text-justify">
                  di aver compiuto l’età minima richiesta dalla normativa
                  locale per la conclusione di contratti;
                </li>
                <li className="text-justify">
                  di avere la capacità giuridica a stipulare contratti vincolanti;
                </li>
                <li className="text-justify">
                  di utilizzare la piattaforma nel rispetto delle leggi
                  e dei regolamenti applicabili.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. RUOLI DI RENTER E HUBBER */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
              3. Ruoli di Renter e Hubber
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-4 max-w-3xl">
              All’interno di Renthubber un utente può assumere il ruolo di:
            </p>
            <ul className="list-disc list-inside text-gray-700 text-sm md:text-base space-y-2 max-w-3xl">
              <li className="text-justify">
                <span className="font-semibold">Renter</span>: utilizza la
                piattaforma per cercare e prenotare oggetti o spazi messi
                a disposizione da altri utenti (Hubber);
              </li>
              <li className="text-justify">
                <span className="font-semibold">Hubber</span>: pubblica annunci,
                definisce disponibilità, condizioni e prezzi di noleggio;
              </li>
              <li className="text-justify">
                <span className="font-semibold">Renter/Hubber</span> (utente ibrido):
                può svolgere entrambe le funzioni.
              </li>
            </ul>

            <p className="text-gray-600 leading-relaxed text-justify mt-4 max-w-3xl">
              Il contratto di noleggio si perfeziona tra Renter e Hubber. Il
              Titolare non è responsabile della corretta esecuzione delle
              obbligazioni reciproche, salvo nei casi espressamente previsti
              dalla legge o dai presenti Termini.
            </p>
          </div>
        </section>

        {/* 4. ANNUNCI, PRENOTAZIONI E PAGAMENTI */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
                4. Annunci, prenotazioni e pagamenti
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Gli Hubber sono responsabili della veridicità, completezza e
                aggiornamento delle informazioni inserite nei propri annunci.
                I Renter si impegnano a leggere attentamente descrizioni,
                condizioni, prezzi e regole di cancellazione prima di prenotare.
              </p>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                I pagamenti vengono gestiti tramite fornitori terzi certificati.
                La piattaforma può trattenere commissioni sul transato, secondo
                quanto indicato nella sezione “Tariffe e commissioni”.
              </p>
              <p className="text-gray-600 leading-relaxed text-justify">
                Eventuali depositi cauzionali, rimborsi e penali sono gestiti
                secondo le regole specifiche dell’annuncio e della piattaforma.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 shadow-sm border">
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">
                Conferma della prenotazione
              </h3>
              <p className="text-gray-600 text-sm md:text-base text-justify">
                Una prenotazione si considera confermata quando:
              </p>
              <ul className="list-disc list-inside text-gray-700 text-sm md:text-base space-y-2 mt-2">
                <li className="text-justify">
                  il Renter ha completato il processo di richiesta o pagamento;
                </li>
                <li className="text-justify">
                  la piattaforma ha inviato un riepilogo (notifica o email);
                </li>
                <li className="text-justify">
                  l’eventuale conferma da parte dell’Hubber (se prevista) è stata registrata.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 5. CANCELLAZIONI E RIMBORSI */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
              5. Cancellazioni, rimborsi e no-show
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-4 max-w-3xl">
              Le cancellazioni e i rimborsi sono regolati dalle politiche di
              cancellazione associate a ciascun annuncio e dalle regole indicate
              nella pagina “Regole di cancellazione”. Invitiamo gli utenti a
              consultare tali regole prima di confermare una prenotazione.
            </p>
            <p className="text-gray-600 leading-relaxed text-justify max-w-3xl">
              In caso di mancata presentazione (no-show) di una delle parti, la
              piattaforma potrà applicare le regole previste per la gestione di
              questi casi, anche ai fini dell’eventuale rimborso o addebito
              parziale/totale.
            </p>
          </div>
        </section>

        {/* 6. COMPORTAMENTO DEGLI UTENTI */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
                6. Comportamento e contenuti degli utenti
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Gli utenti si impegnano a utilizzare la piattaforma in modo
                lecito, corretto e rispettoso, conformemente alle Leggi
                applicabili, ai presenti Termini e alle linee guida della
                community.
              </p>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                È vietato utilizzare Renthubber per pubblicare contenuti illeciti,
                offensivi, discriminatori, fraudolenti o che violino i diritti
                di terzi (es. diritti d’autore, marchi, privacy).
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border">
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">
                Violazioni e provvedimenti
              </h3>
              <p className="text-gray-600 text-sm md:text-base text-justify">
                In caso di violazioni, il Titolare può adottare misure quali:
              </p>
              <ul className="list-disc list-inside text-gray-700 text-sm md:text-base space-y-2 mt-2">
                <li className="text-justify">avvisi o richiami formali;</li>
                <li className="text-justify">
                  limitazione temporanea di alcune funzionalità;
                </li>
                <li className="text-justify">
                  sospensione o chiusura definitiva dell’account;
                </li>
                <li className="text-justify">
                  eventuale segnalazione alle autorità competenti, ove necessario.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 7. RESPONSABILITÀ E LIMITAZIONI */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
              7. Limitazione di responsabilità
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-4 max-w-3xl">
              Nei limiti massimi consentiti dalla legge applicabile, il Titolare
              non risponde di:
            </p>
            <ul className="list-disc list-inside text-gray-700 text-sm md:text-base space-y-2 max-w-3xl">
              <li className="text-justify">
                danni indiretti, consequenziali, perdita di profitto o mancato guadagno;
              </li>
              <li className="text-justify">
                comportamenti o inadempimenti imputabili esclusivamente a Renter o Hubber;
              </li>
              <li className="text-justify">
                informazioni inesatte o incomplete inserite negli annunci dagli utenti;
              </li>
              <li className="text-justify">
                malfunzionamenti dovuti a cause di forza maggiore o a servizi di terzi.
              </li>
            </ul>
            <p className="text-gray-600 leading-relaxed text-justify mt-4 max-w-3xl">
              Nulla in questi Termini esclude o limita la responsabilità del
              Titolare nei casi in cui non possa essere legalmente esclusa o limitata.
            </p>
          </div>
        </section>

        {/* 8. PROPRIETÀ INTELLETTUALE */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
              8. Proprietà intellettuale
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-4 max-w-3xl">
              Tutti i contenuti originali della piattaforma Renthubber (es. logo,
              grafica, layout, testi, codice sorgente, marchi registrati o
              registrabili) sono di proprietà del Titolare o utilizzati con
              autorizzazione e sono protetti dalle leggi applicabili in materia
              di diritto d’autore e proprietà industriale.
            </p>
            <p className="text-gray-600 leading-relaxed text-justify max-w-3xl">
              È vietata qualsiasi riproduzione, distribuzione, modifica o utilizzo
              non autorizzato di tali contenuti, salvo diverso accordo scritto
              con il Titolare.
            </p>
          </div>
        </section>

        {/* 9–10. MODIFICHE E LEGGE APPLICABILE */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
                9. Modifiche dei Termini
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Il Titolare si riserva il diritto di modificare o aggiornare i
                presenti Termini in qualsiasi momento, ad esempio per adeguarli
                a cambi normativi o a nuove funzionalità della piattaforma.
              </p>
              <p className="text-gray-600 leading-relaxed text-justify">
                In caso di modifiche rilevanti, gli utenti potranno essere
                informati tramite la piattaforma o via email. L’uso continuato
                del servizio dopo le modifiche implica l’accettazione dei nuovi Termini.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
                10. Legge applicabile e foro competente
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify">
                I presenti Termini sono regolati dalla legge italiana (o dalla
                legge che sarà indicata nella versione definitiva dei Termini).
                Eventuali controversie saranno devolute alla competenza del
                foro legalmente competente, salvo diritti inderogabili degli
                utenti-consumatori previsti dalla normativa applicabile.
              </p>
            </div>
          </div>
        </section>

        {/* CTA FINALE */}
        <section
          className="py-20 text-white text-center"
          style={{ backgroundColor: "#0D414B" }}
        >
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-4">
              Usa Renthubber in modo consapevole
            </h2>
            <p className="text-lg text-gray-200 mb-8 text-justify md:text-center">
              Ti invitiamo a leggere con attenzione i presenti Termini prima di
              utilizzare la piattaforma. In caso di dubbi, puoi contattarci
              attraverso la pagina Contatti o il Centro assistenza.
            </p>
            <a
              href="/"
              className="inline-block px-8 py-3 rounded-full text-lg font-semibold bg-white text-[#0D414B] hover:bg-gray-100 transition"
            >
              Torna alla home
            </a>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default TerminiPage;
