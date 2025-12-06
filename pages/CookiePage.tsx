import React from "react";
import PageLayout from "../components/PageLayout";

export const CookiePage: React.FC = () => {
  return (
    <PageLayout slug="cookie" fallbackTitle="Cookie & tecnologie simili">
      <div className="bg-gray-50 text-gray-800">
        {/* HERO */}
        <section className="bg-white py-20 border-b">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold text-gray-900">
              Cookie & tecnologie simili
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto text-justify md:text-center">
              Questa pagina spiega cosa sono i cookie, quali tipi utilizziamo su
              Renthubber, per quali finalità e quali scelte hai a disposizione
              per gestirli.
            </p>
          </div>
        </section>

        {/* COSA SONO I COOKIE */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
              Cosa sono i cookie
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-4">
              I cookie sono piccoli file di testo che i siti web inviano al tuo
              dispositivo (computer, smartphone, tablet) mentre navighi. Questi
              file vengono memorizzati nel browser e possono essere letti
              successivamente dal sito che li ha inviati o da altri servizi
              terzi integrati nella pagina.
            </p>
            <p className="text-gray-600 leading-relaxed text-justify">
              I cookie permettono, ad esempio, di ricordare le tue preferenze,
              mantenere attiva la sessione di accesso, analizzare l’utilizzo del
              sito e mostrarti contenuti e offerte più rilevanti per te.
            </p>
          </div>
        </section>

        {/* TIPI DI COOKIE UTILIZZATI */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-left">
              Tipologie di cookie che possiamo utilizzare
            </h2>

            <div className="grid md:grid-cols-2 gap-10">
              {/* Tecnici */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 text-left">
                  Cookie tecnici (necessari)
                </h3>
                <p className="text-gray-600 text-justify">
                  Sono essenziali per il corretto funzionamento del sito e non
                  possono essere disattivati tramite i nostri strumenti.
                  Vengono utilizzati, ad esempio, per:
                </p>
                <ul className="list-disc list-inside text-gray-700 text-sm md:text-base mt-2 space-y-1">
                  <li className="text-justify">gestire la sessione di accesso;</li>
                  <li className="text-justify">
                    mantenere le preferenze di base (lingua, layout, ecc.);
                  </li>
                  <li className="text-justify">
                    garantire sicurezza e prevenire accessi non autorizzati.
                  </li>
                </ul>
              </div>

              {/* Preferenze */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 text-left">
                  Cookie di preferenza
                </h3>
                <p className="text-gray-600 text-justify">
                  Permettono al sito di ricordare alcune scelte che fai (ad
                  esempio area geografica, opzioni di visualizzazione,
                  impostazioni dell’account) per offrirti un’esperienza più
                  personalizzata.
                </p>
              </div>

              {/* Statistica */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 text-left">
                  Cookie statistici (analytics)
                </h3>
                <p className="text-gray-600 text-justify">
                  Ci aiutano a capire come viene utilizzato Renthubber: quante
                  visite riceviamo, quali pagine sono più consultate, come gli
                  utenti arrivano sul sito. I dati vengono trattati in forma
                  aggregata e anonima, ove possibile, per migliorare le
                  funzionalità e le performance.
                </p>
              </div>

              {/* Marketing */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 text-left">
                  Cookie di marketing e profilazione
                </h3>
                <p className="text-gray-600 text-justify">
                  Possono essere utilizzati per mostrarti annunci o contenuti in
                  linea con i tuoi interessi, sia su Renthubber che su altri siti
                  o social network, tramite partner pubblicitari. Questi cookie
                  vengono attivati solo se esprimi il tuo consenso.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* COOKIE DI TERZE PARTI */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
              Cookie di terze parti
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-4">
              Alcune funzionalità di Renthubber possono integrare servizi
              forniti da soggetti terzi (ad esempio strumenti di analisi, sistemi
              di pagamento, pulsanti social, mappe, piattaforme pubblicitarie).
              In questi casi, i fornitori esterni possono installare i propri
              cookie.
            </p>
            <p className="text-gray-600 leading-relaxed text-justify">
              L’utilizzo di questi cookie è regolato dalle informative privacy e
              cookie dei rispettivi fornitori. Quando possibile, ti verrà
              richiesto il consenso specifico per attivarli o potrai gestirli
              tramite il pannello di preferenze.
            </p>
          </div>
        </section>

        {/* CONSENSO & GESTIONE PREFERENZE */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
                Come gestire il consenso ai cookie
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Al primo accesso a Renthubber viene mostrato un banner informativo
                che ti permette di accettare tutti i cookie, rifiutare quelli non
                necessari oppure personalizzare le tue scelte.
              </p>
              <p className="text-gray-600 leading-relaxed text-justify">
                Puoi in qualsiasi momento modificare le preferenze sui cookie
                richiamando il pannello dedicato (ad esempio tramite il link
                “Impostazioni cookie” presente nel footer del sito, se
                disponibile).
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border">
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">
                Impostazioni del browser
              </h3>
              <p className="text-gray-600 text-sm md:text-base text-justify mb-3">
                Oltre agli strumenti messi a disposizione dal sito, puoi gestire
                i cookie anche direttamente dal tuo browser, ad esempio:
              </p>
              <ul className="list-disc list-inside text-gray-700 text-sm md:text-base space-y-1">
                <li className="text-justify">cancellando i cookie esistenti;</li>
                <li className="text-justify">
                  bloccando l’installazione di tutti o di alcuni cookie;
                </li>
                <li className="text-justify">
                  richiedendo una notifica prima che un cookie venga memorizzato.
                </li>
              </ul>
              <p className="text-gray-600 text-sm md:text-base text-justify mt-3">
                Tieni presente che disattivare alcuni cookie tecnici o funzionali
                potrebbe compromettere il corretto funzionamento di alcune parti
                del sito.
              </p>
            </div>
          </div>
        </section>

        {/* PERIODO DI CONSERVAZIONE */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
              Durata dei cookie
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-4">
              I cookie possono avere una durata diversa:
            </p>
            <ul className="list-disc list-inside text-gray-700 text-sm md:text-base space-y-2 max-w-3xl">
              <li className="text-justify">
                <span className="font-semibold">Cookie di sessione</span>:
                vengono cancellati automaticamente alla chiusura del browser.
              </li>
              <li className="text-justify">
                <span className="font-semibold">Cookie persistenti</span>:
                restano memorizzati sul dispositivo per un periodo più lungo,
                definito dal singolo cookie (ad esempio giorni, mesi o anni),
                salvo cancellazione manuale da parte tua.
              </li>
            </ul>
            <p className="text-gray-600 leading-relaxed text-justify mt-4 max-w-3xl">
              I dettagli specifici (nome del cookie, tipo, finalità, durata)
              possono essere riportati in un elenco tecnico aggiornato,
              accessibile dal banner o dal pannello di gestione dei cookie, se
              presente.
            </p>
          </div>
        </section>

        {/* COLLEGAMENTO A PRIVACY & NOTE FINALI */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
                Privacy e trattamento dei dati
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Per maggiori informazioni su come trattiamo i dati personali, sui
                diritti degli utenti e sui contatti del titolare del trattamento,
                ti invitiamo a consultare la nostra Informativa Privacy.
              </p>
              <a
                href="#"
                className="inline-block mt-2 text-sm font-semibold text-[#0D414B] hover:underline"
              >
                Leggi l’Informativa Privacy
              </a>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border">
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">
                Aggiornamenti di questa informativa
              </h3>
              <p className="text-gray-600 text-sm md:text-base text-justify">
                Questa pagina può essere aggiornata nel tempo per adeguarsi a
                modifiche normative, tecniche o organizzative legate a Renthubber.
                Ti consigliamo di consultarla periodicamente per restare informato
                sul nostro utilizzo dei cookie e delle tecnologie simili.
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
              Gestisci le tue preferenze sui cookie
            </h2>
            <p className="text-lg text-gray-200 mb-8 text-justify md:text-center">
              Puoi modificare le tue scelte in qualsiasi momento tramite il banner
              o il pannello di gestione dei cookie (se presente), oppure
              intervenendo dalle impostazioni del tuo browser.
            </p>
            <button
              type="button"
              className="inline-block px-8 py-3 rounded-full text-lg font-semibold bg-white text-[#0D414B] hover:bg-gray-100 transition"
              onClick={() => {
                // Qui in futuro potrai richiamare il cookie banner o il preference center
                // ad esempio: window.myCookieManager?.open()
              }}
            >
              Apri impostazioni cookie
            </button>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default CookiePage;
