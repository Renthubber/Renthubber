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
    Tutti i pagamenti vengono elaborati tramite <strong>Stripe</strong>, uno dei 
    sistemi più sicuri al mondo. Il Renter paga direttamente su Renthubber, e 
    l'importo rimane sospeso fino alla conferma dell'Hubber e alla conclusione 
    del noleggio.
  </p>
  <p className="text-gray-600 leading-relaxed text-justify">
    Questo garantisce che ogni transazione sia tracciata, verificata e priva di 
    rischi di truffe o accordi privati non controllati.
  </p>
</div>

          {/* IMMAGINE */}
<div className="flex justify-center items-center bg-white rounded-xl shadow-lg p-8 border border-gray-200">
  <img
    src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg"
    alt="Pagamenti sicuri con Stripe"
    className="w-64 h-auto"
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
<div className="flex justify-center items-center bg-[#0D414B] rounded-xl shadow-lg p-16">
  <div className="relative">
    <div className="w-48 h-48 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-green-500">
      <svg className="w-32 h-32 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
      </svg>
    </div>
  </div>
</div>
          </div>
        </section>

        {/* SEZIONE 4 – RECENSIONI REALI */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
{/* IMMAGINE */}
<div className="order-2 md:order-1">
  <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-gray-100">
    <div className="flex items-center mb-4">
      <div className="w-12 h-12 bg-[#0D414B] rounded-full flex items-center justify-center text-white font-bold">
        MR
      </div>
      <div className="ml-3">
        <div className="font-semibold text-gray-900">Mario Rossi</div>
        <div className="flex text-yellow-400">
          {'★'.repeat(5)}
        </div>
      </div>
    </div>
    <p className="text-gray-600 italic">
      "Esperienza fantastica! L'oggetto era perfetto e il proprietario molto disponibile. 
      Consiglio vivamente!"
    </p>
    <div className="mt-4 text-sm text-gray-400">
      Noleggio completato il 15 gennaio 2026
    </div>
  </div>
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
<div className="bg-gray-50 rounded-xl shadow-lg p-6 border border-gray-200">
  <div className="bg-white rounded-lg p-4 mb-3 shadow-sm">
    <div className="flex items-start">
      <div className="w-8 h-8 bg-[#0D414B] rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
        H
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-gray-900 mb-1">Hubber</div>
        <div className="text-sm text-gray-600 bg-gray-100 rounded-lg p-2">
          Ciao! L'oggetto è disponibile per quelle date 👍
        </div>
      </div>
    </div>
  </div>
  
  <div className="bg-white rounded-lg p-4 shadow-sm">
    <div className="flex items-start flex-row-reverse">
      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold ml-2">
        R
      </div>
      <div className="flex-1 text-right">
        <div className="text-sm font-semibold text-gray-900 mb-1">Renter</div>
        <div className="text-sm text-gray-600 bg-blue-50 rounded-lg p-2 inline-block">
          Perfetto! Procedo con la prenotazione
        </div>
      </div>
    </div>
  </div>
  
  <div className="mt-4 flex items-center justify-center text-green-600 text-sm">
    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
    </svg>
    Chat protetta end-to-end
  </div>
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
