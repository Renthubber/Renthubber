import React from "react";
import PageLayout from "../components/PageLayout";

export const MappaSitoPage: React.FC = () => {
  return (
    <PageLayout slug="mappa-sito" fallbackTitle="Mappa del sito">
      <div className="bg-gray-50 text-gray-800">
        {/* HERO */}
        <section className="bg-white py-20 border-b">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold text-gray-900">
              Mappa del sito
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto text-justify md:text-center">
              In questa pagina trovi una panoramica delle principali sezioni di
              Renthubber. Usa la mappa del sito per orientarti rapidamente tra
              pagine informative, supporto, area legale e strumenti per il tuo
              account.
            </p>
          </div>
        </section>

        {/* SEZIONE – SEZIONI PRINCIPALI */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
              Sezioni principali
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-6 max-w-3xl">
              Le pagine principali ti aiutano a capire cos’è Renthubber, come
              funziona la piattaforma e quali opportunità offre a Renter e Hubber.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-left">
                  Renthubber
                </h3>
                <ul className="space-y-2 text-sm md:text-base text-gray-700">
                  <li>
                    <a href="/" className="hover:text-[#0D414B]">
                      Home
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Chi siamo
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Come funziona
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Sicurezza
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Tariffe e commissioni
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Programma Invita un amico
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Programma SuperHubber
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Investitori
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-left">
                  Per chi vuole noleggiare (Renter)
                </h3>
                <ul className="space-y-2 text-sm md:text-base text-gray-700">
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Cerca un annuncio
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Filtri avanzati di ricerca
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Come prenotare
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Gestione prenotazioni
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-left">
                  Per chi vuole mettere a noleggio (Hubber)
                </h3>
                <ul className="space-y-2 text-sm md:text-base text-gray-700">
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Diventare Hubber
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Pubblica un annuncio
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Dashboard Hubber
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Programma SuperHubber
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SEZIONE – SUPPORTO & ASSISTENZA */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
              Supporto & assistenza
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-6 max-w-3xl">
              Se hai bisogno di aiuto, chiarimenti o vuoi segnalare un problema,
              puoi fare riferimento alle seguenti pagine.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-left">
                  Centro assistenza
                </h3>
                <ul className="space-y-2 text-sm md:text-base text-gray-700">
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Centro assistenza
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Domande frequenti (FAQ)
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Come diventare Hubber
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-left">
                  Gestione problemi e segnalazioni
                </h3>
                <ul className="space-y-2 text-sm md:text-base text-gray-700">
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Regole di cancellazione
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Segnala un problema
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Sicurezza
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-left">
                  Contatti
                </h3>
                <ul className="space-y-2 text-sm md:text-base text-gray-700">
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Contattaci
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Supporto via email
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SEZIONE – AREA LEGALE & POLICY */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
              Area legale & policy
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-6 max-w-3xl">
              Qui trovi le pagine dedicate alle condizioni di utilizzo, alla
              privacy e alle politiche della community.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-left">
                  Documenti legali
                </h3>
                <ul className="space-y-2 text-sm md:text-base text-gray-700">
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Termini e condizioni
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Informativa Privacy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Cookie Policy
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-left">
                  Regole della community
                </h3>
                <ul className="space-y-2 text-sm md:text-base text-gray-700">
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Linee guida della community
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Politica antidiscriminazione
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-left">
                  Trasparenza & sicurezza
                </h3>
                <ul className="space-y-2 text-sm md:text-base text-gray-700">
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Sicurezza & verifiche
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Programmi di tutela
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SEZIONE – ACCOUNT & DASHBOARD */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
              Account & dashboard
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-6 max-w-3xl">
              Collegamenti alle aree riservate per la gestione del tuo profilo,
              delle prenotazioni e degli annunci.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-left">
                  Area utente
                </h3>
                <ul className="space-y-2 text-sm md:text-base text-gray-700">
                  <li>
                    <a href="/login" className="hover:text-[#0D414B]">
                      Login / Registrazione
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Profilo personale
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Impostazioni account
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-left">
                  Dashboard Renter
                </h3>
                <ul className="space-y-2 text-sm md:text-base text-gray-700">
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Le mie prenotazioni
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Messaggi & chat
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Storico noleggi
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-left">
                  Dashboard Hubber
                </h3>
                <ul className="space-y-2 text-sm md:text-base text-gray-700">
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      I miei annunci
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Prenotazioni ricevute
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#0D414B]">
                      Wallet & pagamenti
                    </a>
                  </li>
                </ul>
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
              Trova subito ciò che ti serve
            </h2>
            <p className="text-lg text-gray-200 mb-8 text-justify md:text-center">
              Usa la mappa del sito per raggiungere rapidamente la pagina che stai
              cercando oppure torna alla home per ricominciare la navigazione.
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

export default MappaSitoPage;
