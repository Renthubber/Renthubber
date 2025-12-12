import React from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";

export const InvestitoriPage: React.FC = () => {
  return (
    <PageLayout slug="investitori" fallbackTitle="Investitori">
      <div className="bg-gray-50 text-gray-800">
        {/* HERO */}
        <section className="bg-white py-20 border-b">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold text-gray-900">Investitori</h1>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto text-justify md:text-center">
              Renthubber è una piattaforma digitale nata per scalare nel tempo,
              con un modello di business basato sulla sharing economy, sulle
              commissioni di transazione e su servizi aggiuntivi ad alto valore.
              In questa pagina trovi una panoramica dedicata a chi è interessato
              a sostenere la crescita del progetto.
            </p>
          </div>
        </section>

        {/* SEZIONE – VISION & OPPORTUNITÀ */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            {/* TESTO */}
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                Una piattaforma, molteplici opportunità
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Renthubber nasce per intercettare un cambiamento già in atto:
                le persone preferiscono sempre più noleggiare, condividere
                e utilizzare in modo intelligente gli oggetti e gli spazi,
                invece di possederli in modo definitivo.
              </p>
              <p className="text-gray-600 leading-relaxed text-justify">
                Il progetto è pensato per crescere progressivamente, partendo
                da un mercato nazionale per poi ampliarsi a mercati esteri, categorie
                e partnership strategiche. L’obiettivo è creare un ecosistema
                solido, scalabile e riconoscibile nel tempo.
              </p>
            </div>

            {/* BOX INFO */}
            <div className="bg-gray-50 rounded-xl p-8 shadow-sm border">
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">
                Pillole del progetto
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 text-sm md:text-base">
                <li className="text-justify">
                  Modello di business basato su commissioni, servizi premium e
                  possibili partnership verticali.
                </li>
                <li className="text-justify">
                  Focus su sicurezza, fiducia e gestione smart delle transazioni.
                </li>
                <li className="text-justify">
                  Visione di lungo periodo integrata con l’ecosistema Amalis Group.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* SEZIONE – MODELLO DI BUSINESS */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            {/* TESTO */}
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                Modello di business
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Il core del modello di business di Renthubber è rappresentato
                dalle commissioni applicate sulle transazioni tra Renter e Hubber.
                A questo si aggiungono possibili linee di ricavo secondarie.
              </p>
              <ul className="space-y-3 text-gray-700 text-sm md:text-base">
                <li className="text-justify">
                  <span className="font-semibold">Commissioni sui noleggi</span>: 
                  percentuale applicata sull’importo di ogni prenotazione.
                </li>
                <li className="text-justify">
                  <span className="font-semibold">Servizi premium</span>: 
                  posizionamenti in evidenza, promozioni dedicate e strumenti avanzati
                  per Hubber professionali.
                </li>
                <li className="text-justify">
                  <span className="font-semibold">Partnership e integrazioni</span>: 
                  collaborazioni con brand, assicurazioni, logistica e altri servizi
                  complementari.
                </li>
              </ul>
              <p className="text-gray-600 leading-relaxed text-justify mt-4">
                La piattaforma è progettata per poter aggiungere nuove fonti di
                ricavo senza snaturare l’esperienza utente, mantenendo semplice
                e chiaro il cuore del servizio.
              </p>
            </div>

            {/* IMMAGINE */}
            <div>
              <img
                src="https://images.unsplash.com/photo-1526379095098-d400fd0bf935"
                alt="Business model"
                className="rounded-xl shadow-lg"
              />
            </div>
          </div>
        </section>

        {/* SEZIONE – CRESCITA & SCALABILITÀ */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            {/* IMMAGINE */}
            <div className="order-2 md:order-1">
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4"
                alt="Crescita Renthubber"
                className="rounded-xl shadow-lg"
              />
            </div>

            {/* TESTO */}
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                Strategia di crescita
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                La scalabilità del progetto si basa su una crescita graduale,
                ma costante: prima consolidamento su un territorio e su alcune
                categorie chiave, poi espansione verso nuovi segmenti e aree
                geografiche.
              </p>
              <ul className="space-y-3 text-gray-700 text-sm md:text-base">
                <li className="text-justify">
                  Sviluppo della base utenti tramite campagne mirate e programmi
                  come “Invita un amico”.
                </li>
                <li className="text-justify">
                  Coinvolgimento di Hubber professionali (aziende, noleggiatori,
                  spazi eventi, ecc.).
                </li>
                <li className="text-justify">
                  Possibilità di integrare nuove funzionalità e verticali di
                  prodotto senza riscrivere l’intera piattaforma.
                </li>
              </ul>
              <p className="text-gray-600 leading-relaxed text-justify mt-4">
                L’infrastruttura tecnica è pensata per sostenere incrementi di
                volume nel tempo, mantenendo il controllo su performance, sicurezza
                e qualità del servizio.
              </p>
            </div>
          </div>
        </section>

        {/* SEZIONE – PERCHÉ INVESTIRE */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6 text-left">
              Perché valutare un investimento in Renthubber
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-6 max-w-3xl">
              Renthubber unisce trend già in forte crescita (sharing economy,
              digitalizzazione, sostenibilità) a una visione concreta legata
              al territorio e a progetti reali. Per un investitore, significa
              partecipare a una fase iniziale di sviluppo con potenziale
              di crescita nel medio-lungo periodo.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">
                  Trend di mercato
                </h3>
                <p className="text-gray-600 text-sm md:text-base text-justify">
                  Il noleggio e la condivisione stanno entrando nelle abitudini
                  quotidiane delle persone. La piattaforma intercetta un cambiamento
                  strutturale, non solo una moda temporanea.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">
                  Visione integrata
                </h3>
                <p className="text-gray-600 text-sm md:text-base text-justify">
                  Renthubber può dialogare con altri progetti dell’ecosistema
                  Amalis Group, creando sinergie tra mondo digitale, turismo,
                  agricoltura e sostenibilità.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">
                  Flessibilità del modello
                </h3>
                <p className="text-gray-600 text-sm md:text-base text-justify">
                  Il modello può essere adattato, ampliato e verticalizzato su
                  settori specifici (attrezzature, eventi, turismo, ecc.), aprendo
                  la porta a future linee di prodotto.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SEZIONE – COME ENTRARE IN CONTATTO */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
                Come entrare in contatto
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Se sei interessato ad approfondire il progetto Renthubber dal
                punto di vista di un investimento, di una partnership o di una
                collaborazione strategica, è possibile organizzare un incontro
                dedicato e una presentazione più dettagliata.
              </p>
              <p className="text-gray-600 leading-relaxed text-justify">
                In questa fase, le informazioni economico-finanziarie vengono
                condivise con potenziali partner realmente interessati, anche
                tramite documenti dedicati e, se necessario, accordi di
                riservatezza (NDA).
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 shadow-sm border">
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">
                Prossimi passi
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 text-sm md:text-base">
                <li className="text-justify">
                  Richiedere una prima call o incontro conoscitivo.
                </li>
                <li className="text-justify">
                  Ricevere una presentazione più approfondita del progetto.
                </li>
                <li className="text-justify">
                  Valutare insieme possibili modalità di ingresso o collaborazione.
                </li>
              </ul>
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
              Vuoi parlare con noi come investitore?
            </h2>
            <p className="text-lg text-gray-200 mb-8 text-justify md:text-center">
              Se desideri ricevere maggiori informazioni su Renthubber in ottica
              investimento o partnership, puoi contattare il team compilando il
              form dedicato o inviando una richiesta dalla sezione “Contattaci”.
            </p>
            <Link to="/contatti" // sostituisci con la tua route reale
              className="inline-block px-8 py-3 rounded-full text-lg font-semibold bg-white text-[#0D414B] hover:bg-gray-100 transition"
            >
              Vai alla pagina contatti
            </Link>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default InvestitoriPage;
