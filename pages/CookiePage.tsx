import React from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";

const LAST_UPDATED = "12 dicembre 2025";

export const CookiePage: React.FC = () => {
  const openCookiePreferences = () => {
    // Se usi un CMP (es. Cookiebot/Complianz/Iubenda), qui puoi richiamare il preference center.
    // Esempi (da adattare al tuo CMP):
    // (window as any).Cookiebot?.renew?.();
    // (window as any).complianz?.open?.();
    // (window as any).iubenda?.cs?.open?.();
    (window as any).openCookiePreferences?.();
  };

  return (
    <PageLayout slug="cookie-policy" fallbackTitle="Cookie Policy">
      <div className="bg-gray-50 text-gray-800">
        {/* HERO */}
        <section className="bg-white py-20 border-b">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold text-gray-900">
              Cookie & tecnologie simili
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              Ultimo aggiornamento:{" "}
              <span className="font-medium">{LAST_UPDATED}</span>
            </p>
            <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto text-justify md:text-center">
              Questa pagina spiega cosa sono i cookie, quali tipi utilizziamo su
              Renthubber, per quali finalità e quali scelte hai a disposizione
              per gestirli.
            </p>
          </div>
        </section>

        {/* TITOLARE */}
        <section className="py-12 bg-white border-b">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
              Titolare del trattamento
            </h2>
            <div className="bg-gray-50 border rounded-xl p-5 max-w-3xl">
              <p className="font-semibold text-gray-900">Amalis Group Srl</p>
              <p className="text-gray-700">
                Via San Nicola, snc – 95040 Camporotondo Etneo (CT), Italia
              </p>
              <p className="text-gray-700">P.IVA 06169160873</p>
              <p className="text-gray-700">
                Email privacy:{" "}
                <a
                  href="mailto:privacy@renthubber.com"
                  className="text-[#0D414B] hover:underline"
                >
                  privacy@renthubber.com
                </a>
              </p>
            </div>
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
                  Ci aiutano a capire come viene utilizzato Renthubber (es. numero
                  di visitatori, pagine consultate, performance) per migliorare
                  funzionalità e stabilità del servizio.  
                  <span className="font-semibold">
                    {" "}Questi cookie vengono attivati solo previo consenso.
                  </span>
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
                  o social network, tramite partner pubblicitari.  
                  <span className="font-semibold">
                    {" "}Questi cookie vengono attivati solo previo consenso.
                  </span>
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
              cookie dei rispettivi fornitori. Quando previsto, ti verrà
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
                Al primo accesso a Renthubber viene mostrato un banner che ti
                permette di accettare tutti i cookie, rifiutare quelli non
                necessari oppure personalizzare le tue scelte.
              </p>
              <p className="text-gray-600 leading-relaxed text-justify">
                Puoi in qualsiasi momento modificare o revocare le preferenze
                richiamando il pannello dedicato (ad esempio tramite il link
                “Impostazioni cookie” nel footer, se disponibile).
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border">
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">
                Impostazioni del browser
              </h3>
              <p className="text-gray-600 text-sm md:text-base text-justify mb-3">
                Puoi gestire i cookie anche direttamente dal tuo browser, ad esempio:
              </p>
              <ul className="list-disc list-inside text-gray-700 text-sm md:text-base space-y-1">
                <li className="text-justify">cancellando i cookie esistenti;</li>
                <li className="text-justify">bloccando l’installazione di tutti o di alcuni cookie;</li>
                <li className="text-justify">richiedendo una notifica prima che un cookie venga memorizzato.</li>
              </ul>
              <p className="text-gray-600 text-sm md:text-base text-justify mt-3">
                Disattivare alcuni cookie tecnici o funzionali potrebbe compromettere
                il corretto funzionamento di alcune parti del sito.
              </p>
            </div>
          </div>
        </section>

        {/* DURATA */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
              Durata dei cookie
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-4">
              I cookie possono avere durata diversa:
            </p>
            <ul className="list-disc list-inside text-gray-700 text-sm md:text-base space-y-2 max-w-3xl">
              <li className="text-justify">
                <span className="font-semibold">Cookie di sessione</span>: vengono cancellati automaticamente alla chiusura del browser.
              </li>
              <li className="text-justify">
                <span className="font-semibold">Cookie persistenti</span>: restano memorizzati per un periodo definito, salvo cancellazione manuale.
              </li>
            </ul>
            <p className="text-gray-600 leading-relaxed text-justify mt-4 max-w-3xl">
              I dettagli tecnici (nome, finalità, durata) possono essere mostrati nel banner
              o nel pannello di gestione dei cookie, se presente.
            </p>
          </div>
        </section>

        {/* LINK PRIVACY + AGGIORNAMENTI */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
                Privacy e trattamento dei dati
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Per maggiori informazioni sul trattamento dei dati personali e sui diritti degli utenti,
                consulta la Privacy Policy.
              </p>
              <Link to="/privacy-policy"
                className="inline-block mt-2 text-sm font-semibold text-[#0D414B] hover:underline"
              >
                Leggi l’Informativa Privacy
              </Link>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border">
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">
                Aggiornamenti di questa informativa
              </h3>
              <p className="text-gray-600 text-sm md:text-base text-justify">
                Questa pagina può essere aggiornata nel tempo per adeguarsi a modifiche normative,
                tecniche o organizzative legate a Renthubber. Ti consigliamo di consultarla periodicamente.
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
              Puoi modificare le tue scelte in qualsiasi momento tramite il banner o il pannello di gestione dei cookie,
              oppure dalle impostazioni del tuo browser.
            </p>
            <button
              type="button"
              className="inline-block px-8 py-3 rounded-full text-lg font-semibold bg-white text-[#0D414B] hover:bg-gray-100 transition"
              onClick={openCookiePreferences}
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
