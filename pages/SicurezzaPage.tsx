import React from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";

export const SicurezzaPage: React.FC = () => {
  return (
    <PageLayout slug="sicurezza" fallbackTitle="Sicurezza">
      <div className="bg-gray-50 text-gray-800">

        {/* HERO */}
        <section className="bg-white py-20 border-b">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold text-gray-900">Sicurezza</h1>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto text-justify md:text-center">
              La sicurezza è al centro dell’esperienza Renthubber. Ogni noleggio,
              pagamento e comunicazione è pensato per proteggere sia chi prende
              in prestito (Renter) sia chi mette a disposizione (Hubber).
            </p>
          </div>
        </section>

        {/* SEZIONE 1 – PAGAMENTI PROTETTI */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">

            {/* TESTO */}
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                Pagamenti protetti
              </h2>
              <p className="text-gray-600 mb-4 leading-relaxed text-justify">
                Tutti i pagamenti vengono elaborati tramite sistemi sicuri e certificati.
                Il Renter paga direttamente su Renthubber, e l’importo rimane sospeso
                fino alla conferma dell’Hubber e alla conclusione del noleggio.
              </p>
              <p className="text-gray-600 leading-relaxed text-justify">
                Questo garantisce che ogni transazione sia tracciata, verificata e
                priva di rischi di truffe o accordi privati non controllati.
              </p>
            </div>

            {/* IMMAGINE */}
            <div>
              <img
                src="https://images.unsplash.com/photo-1605902711622-cfb43c44367e"
                alt="Pagamenti sicuri Renthubber"
                className="rounded-xl shadow-lg"
              />
            </div>
          </div>
        </section>

        {/* SEZIONE 2 – CAUZIONI & DANNI */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">

            {/* IMMAGINE */}
            <div className="order-2 md:order-1">
              <img
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4"
                alt="Cauzione Renthubber"
                className="rounded-xl shadow-lg"
              />
            </div>

            {/* TESTO */}
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                Cauzioni e protezione danni
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Gli Hubber possono richiedere una cauzione per proteggersi da eventuali danni.
                La cauzione viene temporaneamente bloccata e non trasferita all'Hubber
                fino a quando non conferma la restituzione regolare dell’oggetto o dello spazio.
              </p>
              <p className="text-gray-600 leading-relaxed text-justify">
                In caso di contestazioni, Renthubber interviene per analizzare la situazione,
                applicare le policy e tutelare entrambe le parti.
              </p>
            </div>
          </div>
        </section>

        {/* SEZIONE 3 – VERIFICHE PROFILO */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">

            {/* TESTO */}
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                Profili verificati
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                La sicurezza parte dalle persone. Per questo Renthubber mette a disposizione
                strumenti di verifica dell’identità, controllo dei dati e prevenzione di abusi.
              </p>
              <p className="text-gray-600 leading-relaxed text-justify">
                I profili verificati ricevono un badge extra visibilità e più affidabilità.
                Crediamo in una community basata sulla fiducia reciproca.
              </p>
            </div>

            {/* IMMAGINE */}
            <div>
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e"
                alt="Verifica identità"
                className="rounded-xl shadow-lg"
              />
            </div>
          </div>
        </section>

        {/* SEZIONE 4 – RECENSIONI REALI */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">

            {/* IMMAGINE */}
            <div className="order-2 md:order-1">
              <img
                src="https://images.unsplash.com/photo-1573497019418-b400bb3ab063"
                alt="Recensioni Renthubber"
                className="rounded-xl shadow-lg"
              />
            </div>

            {/* TESTO */}
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                Recensioni reali e trasparenti
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Al termine di ogni noleggio, Renter e Hubber si lasciano una recensione
                reciproca. Questo crea un sistema di reputazione chiaro, utile e meritocratico.
              </p>
              <p className="text-gray-600 leading-relaxed text-justify">
                Le recensioni non sono modificabili o filtrate manualmente: garantiamo
                trasparenza totale per permettere scelte consapevoli.
              </p>
            </div>
          </div>
        </section>

        {/* SEZIONE 5 – PROTEZIONE CHAT */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">

            {/* TESTO */}
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                Chat protetta
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Tutte le comunicazioni tra Renter e Hubber avvengono sulla piattaforma.
                Questo evita lo scambio anticipato di dati personali e previene situazioni
                rischiose come accordi esterni non controllati.
              </p>
              <p className="text-gray-600 leading-relaxed text-justify">
                La chat è monitorata da sistemi automatici che rilevano contenuti
                sospetti, link pericolosi o tentativi di eludere la piattaforma.
              </p>
            </div>

            {/* IMMAGINE */}
            <div>
              <img
                src="https://images.unsplash.com/photo-1551817958-20204d6ab1e8"
                alt="Chat protetta"
                className="rounded-xl shadow-lg"
              />
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
              La tua sicurezza è la nostra priorità
            </h2>
            <p className="text-lg text-gray-200 mb-8 text-justify md:text-center">
              Il nostro obiettivo è rendere ogni noleggio semplice, chiaro e sicuro.
              Con protocolli avanzati, controlli interni e una community attiva,
              Renthubber è il posto ideale per condividere e noleggiare responsabilmente.
            </p>
            <Link to="/Signup"
              className="inline-block px-8 py-3 rounded-full text-lg font-semibold bg-white text-[#0D414B] hover:bg-gray-100 transition"
            >
              Inizia ora
            </Link>
          </div>
        </section>

      </div>
    </PageLayout>
  );
};

export default SicurezzaPage;
