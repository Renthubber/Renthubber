import React from "react";
import PageLayout from "../components/PageLayout";

export const PrivacyPage: React.FC = () => {
  return (
    <PageLayout slug="privacy" fallbackTitle="Informativa Privacy">
      <div className="bg-gray-50 text-gray-800">
        {/* HERO */}
        <section className="bg-white py-20 border-b">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold text-gray-900">
              Informativa Privacy
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto text-justify md:text-center">
              In questa pagina trovi informazioni su come Renthubber tratta i dati
              personali degli utenti, nel rispetto della normativa applicabile in
              materia di protezione dei dati (incluso, ove applicabile, il Regolamento
              (UE) 2016/679 – “GDPR”).
            </p>
          </div>
        </section>

        {/* TITOLARE DEL TRATTAMENTO */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
              1. Titolare del trattamento
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-2 max-w-3xl">
              Il Titolare del trattamento dei dati personali raccolti tramite la
              piattaforma Renthubber è:
            </p>
            <p className="text-gray-700 leading-relaxed text-justify mb-4 max-w-3xl">
              <span className="font-semibold">Amalis Group S.r.l.</span>  
              {/* Aggiorna con dati reali */}
              <br />
              (di seguito, “Titolare” o “noi”)
            </p>
            <p className="text-gray-600 leading-relaxed text-justify max-w-3xl">
              Per qualsiasi domanda relativa al trattamento dei dati personali o
              per esercitare i tuoi diritti, puoi contattarci ai recapiti indicati
              nella sezione “Contatti” o tramite la pagina “Contattaci” della
              piattaforma.
            </p>
          </div>
        </section>

        {/* DATI RACCOLTI */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
              2. Tipologie di dati trattati
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-4 max-w-3xl">
              Utilizzando Renthubber, possono essere raccolte e trattate diverse
              categorie di dati personali, tra cui:
            </p>

            <ul className="list-disc list-inside text-gray-700 text-sm md:text-base space-y-2 max-w-3xl">
              <li className="text-justify">
                <span className="font-semibold">Dati anagrafici e di contatto</span>  
                (es. nome, cognome, indirizzo email, numero di telefono, eventuali
                altri recapiti forniti).
              </li>
              <li className="text-justify">
                <span className="font-semibold">Dati relativi all’account</span>  
                (es. credenziali di accesso, impostazioni del profilo, ruoli Renter/Hubber).
              </li>
              <li className="text-justify">
                <span className="font-semibold">Dati relativi alle prenotazioni</span>  
                (es. oggetti/spazi noleggiati, date, importi, stato delle richieste).
              </li>
              <li className="text-justify">
                <span className="font-semibold">Dati di pagamento</span>  
                (in genere gestiti tramite fornitori terzi certificati; possono includere
                informazioni necessarie a eseguire transazioni e gestire rimborsi).
              </li>
              <li className="text-justify">
                <span className="font-semibold">Dati di comunicazione</span>  
                (contenuti dei messaggi scambiati tramite la chat interna, email di
                supporto, segnalazioni).
              </li>
              <li className="text-justify">
                <span className="font-semibold">Dati tecnici e di utilizzo</span>  
                (es. indirizzo IP, tipo di dispositivo, log di accesso, dati di
                navigazione, cookie e tecnologie simili, secondo quanto indicato
                nella Cookie Policy).
              </li>
            </ul>
          </div>
        </section>

        {/* FINALITÀ E BASI GIURIDICHE */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
              3. Finalità del trattamento e basi giuridiche
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-4 max-w-3xl">
              I dati personali possono essere trattati per le seguenti finalità,
              sulla base delle relative basi giuridiche:
            </p>

            <ul className="list-disc list-inside text-gray-700 text-sm md:text-base space-y-2 max-w-3xl">
              <li className="text-justify">
                <span className="font-semibold">Gestione dell’account e della piattaforma</span>  
                (creazione del profilo, autenticazione, uso delle funzionalità Renter/Hubber).  
                <br />
                <span className="text-gray-600 text-xs">
                  Base giuridica: esecuzione di un contratto / misure precontrattuali.
                </span>
              </li>
              <li className="text-justify">
                <span className="font-semibold">Gestione di prenotazioni, pagamenti e rimborsi</span>  
                (esecuzione delle richieste di noleggio, fatturazione, storno importi).  
                <br />
                <span className="text-gray-600 text-xs">
                  Base giuridica: esecuzione di un contratto / obblighi legali.
                </span>
              </li>
              <li className="text-justify">
                <span className="font-semibold">Assistenza clienti e gestione delle segnalazioni</span>  
                (risposte a richieste di supporto, gestione di reclami e controversie).  
                <br />
                <span className="text-gray-600 text-xs">
                  Base giuridica: esecuzione di un contratto / legittimo interesse del Titolare.
                </span>
              </li>
              <li className="text-justify">
                <span className="font-semibold">Sicurezza, prevenzione abusi e tutela della piattaforma</span>  
                (monitoraggio di utilizzi anomali, prevenzione frodi, protezione dei diritti).  
                <br />
                <span className="text-gray-600 text-xs">
                  Base giuridica: legittimo interesse del Titolare / obblighi legali.
                </span>
              </li>
              <li className="text-justify">
                <span className="font-semibold">Comunicazioni informative e di servizio</span>  
                (es. avvisi di prenotazione, aggiornamenti di sistema, modifiche contrattuali).  
                <br />
                <span className="text-gray-600 text-xs">
                  Base giuridica: esecuzione di un contratto / obblighi legali.
                </span>
              </li>
              <li className="text-justify">
                <span className="font-semibold">Attività di marketing, newsletter e offerte personalizzate</span>  
                (laddove previste).  
                <br />
                <span className="text-gray-600 text-xs">
                  Base giuridica: consenso dell’utente, liberamente revocabile in ogni momento.
                </span>
              </li>
              <li className="text-justify">
                <span className="font-semibold">Analisi statistiche e miglioramento del servizio</span>  
                (analisi anonime/aggregate sull’uso della piattaforma per migliorarne
                funzionalità e performance).  
                <br />
                <span className="text-gray-600 text-xs">
                  Base giuridica: legittimo interesse del Titolare / consenso, ove richiesto.
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* MODALITÀ DI TRATTAMENTO E CONSERVAZIONE */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
              4. Modalità di trattamento e periodo di conservazione
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-4 max-w-3xl">
              I dati personali sono trattati prevalentemente con strumenti elettronici
              e informatici, adottando misure tecniche e organizzative adeguate a
              garantirne la sicurezza, la riservatezza e l’integrità.
            </p>
            <p className="text-gray-600 leading-relaxed text-justify max-w-3xl">
              I dati vengono conservati per il tempo strettamente necessario a
              conseguire le finalità per cui sono stati raccolti e, successivamente,
              per il periodo previsto da obblighi di legge (es. adempimenti fiscali,
              contabili) o per tutelare i diritti del Titolare in caso di contenzioso.
            </p>
          </div>
        </section>

        {/* DESTINATARI E TRASFERIMENTI */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
              5. Destinatari dei dati e servizi terzi
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-4 max-w-3xl">
              I dati personali possono essere comunicati a soggetti terzi che
              supportano il Titolare nella gestione della piattaforma e dei servizi
              connessi, ad esempio:
            </p>

            <ul className="list-disc list-inside text-gray-700 text-sm md:text-base space-y-2 max-w-3xl">
              <li className="text-justify">fornitori di servizi di hosting e infrastruttura IT;</li>
              <li className="text-justify">fornitori di servizi di pagamento e processori di transazioni;</li>
              <li className="text-justify">fornitori di strumenti di analisi, email e comunicazione;</li>
              <li className="text-justify">consulenti legali, fiscali o tecnici, ove necessario.</li>
            </ul>

            <p className="text-gray-600 leading-relaxed text-justify mt-4 max-w-3xl">
              Tali soggetti agiscono, a seconda dei casi, come Titolari autonomi
              o come Responsabili del trattamento, sulla base di accordi scritti
              che ne disciplinano i compiti e le responsabilità.
            </p>
          </div>
        </section>

        {/* COOKIE E STRUMENTI DI TRACCIAMENTO */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
              6. Cookie e tecnologie simili
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-4 max-w-3xl">
              Renthubber utilizza cookie e tecnologie simili per migliorare
              l’esperienza di navigazione, analizzare l’utilizzo del sito e, ove
              previsto, proporre contenuti personalizzati.
            </p>
            <p className="text-gray-600 leading-relaxed text-justify max-w-3xl">
              Per maggiori informazioni su tipologie, finalità, tempi di
              conservazione e modalità di gestione dei cookie, ti invitiamo a
              consultare la nostra apposita{" "}
              <span className="font-semibold">Cookie Policy</span>.
            </p>
          </div>
        </section>

        {/* DIRITTI DEGLI INTERESSATI */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
              7. Diritti degli utenti
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-4 max-w-3xl">
              In qualità di interessato, hai il diritto di:
            </p>

            <ul className="list-disc list-inside text-gray-700 text-sm md:text-base space-y-2 max-w-3xl">
              <li className="text-justify">
                ottenere conferma dell’esistenza o meno di dati personali che ti
                riguardano e accederne al contenuto;
              </li>
              <li className="text-justify">
                richiedere la rettifica di dati inesatti o l’integrazione di dati incompleti;
              </li>
              <li className="text-justify">
                richiedere la cancellazione dei dati nei casi previsti dalla legge;
              </li>
              <li className="text-justify">
                richiedere la limitazione del trattamento, ove ricorrano i presupposti;
              </li>
              <li className="text-justify">
                opporti al trattamento basato su legittimo interesse, per motivi
                connessi alla tua situazione particolare;
              </li>
              <li className="text-justify">
                revocare in qualsiasi momento il consenso prestato, senza
                pregiudicare la liceità del trattamento basato sul consenso prima
                della revoca;
              </li>
              <li className="text-justify">
                richiedere la portabilità dei dati, ove applicabile.
              </li>
            </ul>

            <p className="text-gray-600 leading-relaxed text-justify mt-4 max-w-3xl">
              Per esercitare questi diritti, puoi contattarci tramite i recapiti
              indicati di seguito. Inoltre, hai il diritto di proporre reclamo
              all’Autorità di controllo competente, se ritieni che il trattamento
              dei tuoi dati violi la normativa applicabile.
            </p>
          </div>
        </section>

        {/* MINORI E SICUREZZA */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
                8. Dati dei minori
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                La piattaforma Renthubber non è destinata a minori al di sotto
                dell’età prevista dalla normativa locale per la conclusione
                autonoma di contratti. Qualora venissimo a conoscenza del fatto
                che sono stati raccolti dati relativi a minori senza adeguo
                consenso da parte dei genitori o di chi ne esercita la potestà,
                adotteremo le misure opportune per cancellarli.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3 text-left">
                9. Sicurezza dei dati
              </h2>
              <p className="text-gray-600 text-sm md:text-base text-justify">
                Adottiamo misure tecniche e organizzative adeguate per proteggere
                i dati personali da accessi non autorizzati, perdita, distruzione
                o divulgazione. Nessun sistema, tuttavia, può garantire sicurezza
                assoluta: ti invitiamo a utilizzare password robuste e a non
                condividerle con terzi.
              </p>
            </div>
          </div>
        </section>

        {/* AGGIORNAMENTI E CONTATTI */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
                10. Aggiornamenti della presente informativa
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                La presente Informativa Privacy può essere soggetta a modifiche
                o aggiornamenti, ad esempio in caso di cambi normativi o di
                evoluzioni della piattaforma. Ti invitiamo a consultare
                periodicamente questa pagina per rimanere informato.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
                11. Contatti
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-2">
                Per qualsiasi richiesta relativa al trattamento dei dati personali
                o per l’esercizio dei tuoi diritti, puoi contattarci a:
              </p>
              <p className="text-gray-700 leading-relaxed text-justify">
                <span className="font-semibold">Email:</span>{" "}
                privacy@renthubber.com {/* aggiorna con indirizzo reale */}
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
              Trasparenza e tutela dei tuoi dati
            </h2>
            <p className="text-lg text-gray-200 mb-8 text-justify md:text-center">
              La protezione dei tuoi dati personali è una priorità per Renthubber.
              Se hai dubbi o domande sull’utilizzo dei tuoi dati, contattaci:
              saremo lieti di fornirti tutte le informazioni necessarie.
            </p>
            <a
              href="/contatti"
              className="inline-block px-8 py-3 rounded-full text-lg font-semibold bg-white text-[#0D414B] hover:bg-gray-100 transition"
            >
              Vai alla pagina Contatti
            </a>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default PrivacyPage;
