import React from "react";
import PageLayout from "../components/PageLayout";

export const SuperHubberPage: React.FC = () => {
  return (
    <PageLayout slug="superhubber" fallbackTitle="Programma SuperHubber">
      <div className="bg-gray-50 text-gray-800">

        {/* HERO */}
        <section className="bg-white py-20 border-b">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold text-gray-900">Programma SuperHubber</h1>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto text-justify md:text-center">
              Il badge SuperHubber è un riconoscimento che premia gli Hubber più affidabili,
              attivi e apprezzati dalla community. Essere SuperHubber significa ottenere
              maggiore visibilità, più prenotazioni e vantaggi esclusivi.
            </p>
          </div>
        </section>

        {/* SEZIONE – COS’È */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
            {/* TESTO */}
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                Cos’è il badge SuperHubber
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Il badge SuperHubber certifica che un Hubber rispetta standard elevati
                di qualità, affidabilità e puntualità. È pensato per identificare i profili
                più professionali e dare loro un vantaggio competitivo nella piattaforma.
              </p>
              <p className="text-gray-600 leading-relaxed text-justify">
                Gli utenti che ottengono il badge vengono evidenziati negli annunci,
                nelle ricerche e in varie sezioni della piattaforma, aumentando la
                possibilità di ricevere prenotazioni.
              </p>
            </div>

            {/* IMMAGINE */}
            <div>
              <img
                src="https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b"
                alt="SuperHubber Badge"
                className="rounded-xl shadow-lg"
              />
            </div>
          </div>
        </section>

        {/* CRITERI */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-semibold text-gray-900 mb-8 text-left">
              Criteri per diventare SuperHubber
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-6 max-w-3xl">
              Per ottenere il badge SuperHubber è necessario mantenere performance eccellenti
              su quattro criteri fondamentali. La piattaforma valuta questi dati in modo
              automatico e continuo.
            </p>

            <ul className="space-y-6 text-gray-700 text-sm md:text-base max-w-3xl">
              <li className="text-justify">
                <span className="font-semibold text-gray-900">1. Tasso di risposta rapido</span><br />
                Gli Hubber devono rispondere tempestivamente ai messaggi e alle richieste
                di prenotazione. Solitamente è richiesto un tasso di risposta superiore al 90%.
              </li>

              <li className="text-justify">
                <span className="font-semibold text-gray-900">2. Recensioni positive</span><br />
                La media delle recensioni deve essere pari o superiore a 4.7 stelle per
                garantire un’esperienza eccellente ai Renter.
              </li>

              <li className="text-justify">
                <span className="font-semibold text-gray-900">3. Tasso di cancellazione basso</span><br />
                Gli Hubber devono evitare di cancellare le prenotazioni confermate.
                Una soglia tipica è un tasso di cancellazione inferiore all’1%.
              </li>

              <li className="text-justify">
                <span className="font-semibold text-gray-900">4. Affidabilità generale</span><br />
                L’Hubber deve rispettare gli orari, consegnare oggetti/spazi in buono
                stato e seguire le regole previste negli annunci.
              </li>
            </ul>
          </div>
        </section>

        {/* BENEFICI */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            {/* IMMAGINE */}
            <div className="order-2 md:order-1">
              <img
                src="https://images.unsplash.com/photo-1560264280-88b68371db39"
                alt="Benefici SuperHubber"
                className="rounded-xl shadow-lg"
              />
            </div>

            {/* TESTO */}
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                I vantaggi del badge SuperHubber
              </h2>

              <ul className="space-y-4 text-gray-700 text-sm md:text-base">
                <li className="text-justify">
                  <span className="font-semibold">Maggiore visibilità</span>: gli annunci
                  dei SuperHubber compaiono più spesso e in posizioni migliori nelle ricerche.
                </li>
                <li className="text-justify">
                  <span className="font-semibold">Più fiducia dai Renter</span>: il badge
                  rappresenta una garanzia di qualità e professionalità.
                </li>
                <li className="text-justify">
                  <span className="font-semibold">Accesso prioritario al supporto</span>:
                  i SuperHubber ricevono assistenza più rapida quando necessario.
                </li>
                <li className="text-justify">
                  <span className="font-semibold">Promozioni esclusive</span>: campagne
                  dedicate, visibilità speciale e opportunità aggiuntive.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* COME OTTENERLO */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
              Come ottenere il badge
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-6 max-w-3xl">
              Non serve inviare richieste o candidature: il badge SuperHubber viene assegnato
              automaticamente dalla piattaforma quando un Hubber rispetta costantemente i
              criteri richiesti. Il sistema analizza:
            </p>

            <ul className="list-disc list-inside text-gray-700 space-y-2 text-sm md:text-base max-w-3xl">
              <li className="text-justify">storico delle prenotazioni;</li>
              <li className="text-justify">affidabilità dimostrata nel tempo;</li>
              <li className="text-justify">recensioni e feedback dei Renter;</li>
              <li className="text-justify">rispetto delle regole della piattaforma.</li>
            </ul>

            <p className="text-gray-600 leading-relaxed text-justify mt-6 max-w-3xl">
              Una volta raggiunti i requisiti, il badge appare automaticamente nel profilo
              dell’Hubber e in tutti i suoi annunci pubblicati.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section
          className="py-20 text-white text-center"
          style={{ backgroundColor: "#0D414B" }}
        >
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-4">Diventa un SuperHubber</h2>
            <p className="text-lg text-gray-200 mb-8 text-justify md:text-center">
              Offri un servizio impeccabile, rispetta le regole, mantieni alta la tua
              reputazione e lascia che Renthubber ti aiuti a crescere.
              Il badge SuperHubber è il riconoscimento che premia il tuo impegno.
            </p>
            <a
              href="/dashboard"
              className="inline-block px-8 py-3 rounded-full text-lg font-semibold bg-white text-[#0D414B] hover:bg-gray-100 transition"
            >
              Vai alla tua dashboard
            </a>
          </div>
        </section>

      </div>
    </PageLayout>
  );
};

export default SuperHubberPage;
