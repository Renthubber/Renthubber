import React from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";

export const AssistenzaPage: React.FC = () => {
  return (
    <PageLayout slug="assistenza" fallbackTitle="Centro assistenza">
      <div className="bg-gray-50 text-gray-800">
        {/* HERO */}
        <section className="bg-white py-20 border-b">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold text-gray-900">Centro assistenza</h1>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto text-justify md:text-center">
              Qui puoi trovare supporto per utilizzare Renthubber in modo semplice e sicuro.
              Prima di contattarci, ti consigliamo di consultare le sezioni dedicate alle
              domande frequenti e alle guide principali.
            </p>
          </div>
        </section>

        {/* SEZIONE – COME POSSIAMO AIUTARTI */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                Come possiamo aiutarti
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Il Centro assistenza di Renthubber è pensato per guidarti passo dopo passo
                nella risoluzione dei problemi più comuni e nel chiarimento di dubbi su
                prenotazioni, pagamenti, profilo, sicurezza e molto altro.
              </p>
              <p className="text-gray-600 leading-relaxed text-justify">
                Puoi iniziare consultando le FAQ, esplorare le sezioni tematiche oppure,
                se non trovi ciò che ti serve, aprire una richiesta diretta al nostro team.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 shadow-sm border">
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">
                Le principali aree di supporto
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 text-sm md:text-base">
                <li className="text-justify">Registrazione, accesso e gestione dell’account.</li>
                <li className="text-justify">Prenotazioni, modifiche e cancellazioni.</li>
                <li className="text-justify">Pagamenti, cauzioni e rimborsi.</li>
                <li className="text-justify">Problemi con un Renter o un Hubber.</li>
                <li className="text-justify">Segnalazioni e violazioni delle regole.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* SEZIONE – PRIMA CONTROLLA LE FAQ */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                Prima controlla le FAQ
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Molte delle domande più comuni trovano risposta nella sezione
                “Domande frequenti”. È il punto di partenza ideale se hai dubbi su
                come funziona Renthubber o su come gestire una specifica situazione.
              </p>
              <p className="text-gray-600 leading-relaxed text-justify">
                Aggiorniamo periodicamente le FAQ in base ai feedback degli utenti,
                così da rendere sempre più semplice trovare le informazioni che cerchi.
              </p>
              <a
                href="#"
                className="inline-block mt-6 text-sm font-semibold text-[#0D414B] hover:underline"
              >
                Vai alle Domande frequenti
              </a>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border">
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">
                Tipologie di FAQ presenti
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 text-sm md:text-base">
                <li className="text-justify">Informazioni generali su Renthubber.</li>
                <li className="text-justify">Guida per Renter (chi noleggia).</li>
                <li className="text-justify">Guida per Hubber (chi mette a disposizione).</li>
                <li className="text-justify">Pagamenti, commissioni e tariffe.</li>
                <li className="text-justify">Sicurezza, cauzioni e segnalazioni.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* SEZIONE – COME APRIRE UNA RICHIESTA */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            <div className="order-2 md:order-1">
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                Come aprire una richiesta di assistenza
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Se le FAQ non sono sufficienti o hai bisogno di un supporto più specifico,
                puoi aprire una richiesta direttamente dalla piattaforma.
              </p>
              <ol className="space-y-3 text-gray-700 text-sm md:text-base">
                <li className="text-justify">
                  <span className="font-semibold">1. Accedi al tuo account</span>
                  <br />
                  Entra con le tue credenziali e vai nella sezione messaggi “Supporto Renthubber”.
                </li>
                <li className="text-justify">
                  <span className="font-semibold">2. Scegli l’area del problema</span>
                  <br />
                  Seleziona la categoria più vicina al tuo caso (prenotazioni, pagamenti, account, ecc.).
                </li>
                <li className="text-justify">
                  <span className="font-semibold">3. Descrivi cosa è successo</span>
                  <br />
                  Compila il form indicando tutti i dettagli, allegando se possibile screenshot o foto utili.
                </li>
                <li className="text-justify">
                  <span className="font-semibold">4. Invia la richiesta</span>
                  <br />
                  Il nostro team analizzerà la situazione e ti risponderà nel minor tempo possibile.
                </li>
              </ol>
            </div>

            <div className="order-1 md:order-2 bg-gray-50 rounded-xl p-8 shadow-sm border">
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">
                Suggerimenti per una risposta più rapida
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 text-sm md:text-base">
                <li className="text-justify">
                  Indica sempre il codice della prenotazione, se il problema è legato a un noleggio.
                </li>
                <li className="text-justify">
                  Specifica date, orari e nomi degli utenti coinvolti.
                </li>
                <li className="text-justify">
                  Aggiungi screenshot o foto, se possono chiarire meglio la situazione.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* SEZIONE – TEMPI DI RISPOSTA & PRIORITÀ */}
       <section className="py-20">
  <div className="max-w-6xl mx-auto px-6">
    <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-center">
      Tempi di risposta e priorità
    </h2>
    <p className="text-gray-600 leading-relaxed text-justify mb-4 max-w-3xl mx-auto">
  Facciamo il possibile per rispondere alle richieste nel più breve tempo
  possibile. Alcuni casi, però, richiedono verifiche approfondite per tutelare tutte le parti coinvolte.
</p>

<ul className="space-y-3 text-gray-700 text-sm md:text-base max-w-3xl mx-auto">
  <li className="text-justify">
    Le richieste urgenti legate a problemi in corso (ad esempio: accesso a uno
    spazio o consegna di un oggetto in tempo reale) ricevono la priorità più alta.
  </li>
      <li className="text-justify">
        Le segnalazioni su pagamenti, cauzioni e contestazioni vengono gestite
        con particolare attenzione, nel rispetto delle regole della piattaforma.
      </li>
      <li className="text-justify">
        Le richieste generali di informazioni possono richiedere tempi leggermente
        più lunghi, soprattutto in periodi di alto traffico.
      </li>
    </ul>
  </div>
</section>

        {/* SEZIONE – SICUREZZA & SEGNALAZIONI */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
                Segnalazioni e violazioni
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Se noti comportamenti sospetti, violazioni delle regole, contenuti
                inappropriati o attività che ritieni non sicure, ti invitiamo a segnalarlo
                immediatamente al team di Renthubber.
              </p>
              <p className="text-gray-600 leading-relaxed text-justify">
                Le segnalazioni vengono valutate con la massima attenzione per
                proteggere la community e, se necessario, adottare provvedimenti
                verso gli account coinvolti.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border">
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">
                Quando contattarci subito
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 text-sm md:text-base">
                <li className="text-justify">
                  Sospetto di truffa o richieste di pagamento fuori piattaforma.
                </li>
                <li className="text-justify">
                  Mancata consegna o accesso non garantito all’oggetto/spazio.
                </li>
                <li className="text-justify">
                  Danni gravi, pericoli o comportamenti aggressivi.
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
              Hai bisogno di aiuto proprio ora?
            </h2>
            <p className="text-lg text-gray-200 mb-8 text-justify md:text-center">
              Accedi al tuo account, apri una richiesta dal Centro assistenza o,
              se il problema riguarda una prenotazione in corso, segnala subito la
              situazione al nostro team. Siamo qui per aiutarti.
            </p>
            <Link to="/contatti"
              className="inline-block px-8 py-3 rounded-full text-lg font-semibold bg-white text-[#0D414B] hover:bg-gray-100 transition"
            >
              Contattaci
            </Link>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default AssistenzaPage;
