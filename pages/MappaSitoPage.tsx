import React from "react";
import { Link } from "react-router-dom";
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
              Le pagine principali ti aiutano a capire cos'è Renthubber, come
              funziona la piattaforma e quali opportunità offre a Renter e Hubber.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-left">
                  Renthubber
                </h3>
                <ul className="space-y-2 text-sm md:text-base text-gray-700">
                  <li><Link to="/" className="hover:text-[#0D414B]">Home</Link></li>
                  <li><Link to="/chi-siamo" className="hover:text-[#0D414B]">Chi siamo</Link></li>
                  <li><Link to="/come-funziona" className="hover:text-[#0D414B]">Come funziona</Link></li>
                  <li><Link to="/sicurezza" className="hover:text-[#0D414B]">Sicurezza</Link></li>
                  <li><Link to="/tariffe" className="hover:text-[#0D414B]">Tariffe e commissioni</Link></li>
                  <li><Link to="/invita-amico" className="hover:text-[#0D414B]">Programma Invita un amico</Link></li>
                  <li><Link to="/super-hubber" className="hover:text-[#0D414B]">Programma SuperHubber</Link></li>
                  <li><Link to="/simulatore-guadagni" className="hover:text-[#0D414B]">Simulatore guadagni</Link></li>
                  <li><Link to="/risorse" className="hover:text-[#0D414B]">Risorse per Hubber</Link></li>
                  <li><Link to="/investitori" className="hover:text-[#0D414B]">Investitori</Link></li>
                  <li><Link to="/lavora-con-noi" className="hover:text-[#0D414B]">Lavora con noi</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-left">
                  Per chi vuole noleggiare (Renter)
                </h3>
                <ul className="space-y-2 text-sm md:text-base text-gray-700">
                  <li><Link to="/" className="hover:text-[#0D414B]">Cerca un annuncio</Link></li>
                  <li><Link to="/come-funziona" className="hover:text-[#0D414B]">Come prenotare</Link></li>
                  <li><Link to="/cancellazione" className="hover:text-[#0D414B]">Regole di cancellazione</Link></li>
                  <li><Link to="/dashboard/bookings" className="hover:text-[#0D414B]">Gestione prenotazioni</Link></li>
                  <li><Link to="/dashboard/favorites" className="hover:text-[#0D414B]">Le mie recensioni</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-left">
                  Per chi vuole mettere a noleggio (Hubber)
                </h3>
                <ul className="space-y-2 text-sm md:text-base text-gray-700">
                  <li><Link to="/diventare-hubber" className="hover:text-[#0D414B]">Diventare Hubber</Link></li>
                  <li><Link to="/dashboard/overview" className="hover:text-[#0D414B]">Pubblica un annuncio</Link></li>
                  <li><Link to="/dashboard/overview" className="hover:text-[#0D414B]">Dashboard Hubber</Link></li>
                  <li><Link to="/super-hubber" className="hover:text-[#0D414B]">Programma SuperHubber</Link></li>
                  <li><Link to="/dashboard/hubber_bookings" className="hover:text-[#0D414B]">Prenotazioni ricevute</Link></li>
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
                  <li><Link to="/assistenza" className="hover:text-[#0D414B]">Centro assistenza</Link></li>
                  <li><Link to="/faq" className="hover:text-[#0D414B]">Domande frequenti (FAQ)</Link></li>
                  <li><Link to="/diventare-hubber" className="hover:text-[#0D414B]">Come diventare Hubber</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-left">
                  Gestione problemi e segnalazioni
                </h3>
                <ul className="space-y-2 text-sm md:text-base text-gray-700">
                  <li><Link to="/cancellazione" className="hover:text-[#0D414B]">Regole di cancellazione</Link></li>
                  <li><Link to="/segnala" className="hover:text-[#0D414B]">Segnala un problema</Link></li>
                  <li><Link to="/sicurezza" className="hover:text-[#0D414B]">Sicurezza</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-left">
                  Contatti
                </h3>
                <ul className="space-y-2 text-sm md:text-base text-gray-700">
                  <li><Link to="/contatti" className="hover:text-[#0D414B]">Contattaci</Link></li>
                  <li><Link to="/assistenza" className="hover:text-[#0D414B]">Supporto via email</Link></li>
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
                  <li><Link to="/termini-condizioni" className="hover:text-[#0D414B]">Termini e condizioni</Link></li>
                  <li><Link to="/privacy-policy" className="hover:text-[#0D414B]">Informativa Privacy</Link></li>
                  <li><Link to="/cookie-policy" className="hover:text-[#0D414B]">Cookie Policy</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-left">
                  Regole della community
                </h3>
                <ul className="space-y-2 text-sm md:text-base text-gray-700">
                  <li><Link to="/linee-guida" className="hover:text-[#0D414B]">Linee guida della community</Link></li>
                  <li><Link to="/antidiscriminazione" className="hover:text-[#0D414B]">Politica antidiscriminazione</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-left">
                  Trasparenza & sicurezza
                </h3>
                <ul className="space-y-2 text-sm md:text-base text-gray-700">
                  <li><Link to="/sicurezza" className="hover:text-[#0D414B]">Sicurezza & verifiche</Link></li>
                  <li><Link to="/dashboard/security" className="hover:text-[#0D414B]">Verifica identità</Link></li>
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
                  <li><Link to="/login" className="hover:text-[#0D414B]">Login / Registrazione</Link></li>
                  <li><Link to="/dashboard/profile" className="hover:text-[#0D414B]">Profilo personale</Link></li>
                  <li><Link to="/dashboard/security" className="hover:text-[#0D414B]">Impostazioni account</Link></li>
                  <li><Link to="/wallet" className="hover:text-[#0D414B]">Wallet</Link></li>
                  <li><Link to="/messages" className="hover:text-[#0D414B]">Messaggi & chat</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-left">
                  Dashboard Renter
                </h3>
                <ul className="space-y-2 text-sm md:text-base text-gray-700">
                  <li><Link to="/dashboard/overview" className="hover:text-[#0D414B]">Panoramica</Link></li>
                  <li><Link to="/dashboard/bookings" className="hover:text-[#0D414B]">Le mie prenotazioni</Link></li>
                  <li><Link to="/dashboard/favorites" className="hover:text-[#0D414B]">Le mie recensioni</Link></li>
                  <li><Link to="/dashboard/payments" className="hover:text-[#0D414B]">Pagamenti & Fatture</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-left">
                  Dashboard Hubber
                </h3>
                <ul className="space-y-2 text-sm md:text-base text-gray-700">
                  <li><Link to="/dashboard/overview" className="hover:text-[#0D414B]">Panoramica</Link></li>
                  <li><Link to="/dashboard/hubber_bookings" className="hover:text-[#0D414B]">Prenotazioni ricevute</Link></li>
                  <li><Link to="/dashboard/calendar" className="hover:text-[#0D414B]">Calendario</Link></li>
                  <li><Link to="/dashboard/payments" className="hover:text-[#0D414B]">Wallet & pagamenti</Link></li>
                  <li><Link to="/dashboard/reviews" className="hover:text-[#0D414B]">Recensioni</Link></li>
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
            <Link to="/"
              className="inline-block px-8 py-3 rounded-full text-lg font-semibold bg-white text-[#0D414B] hover:bg-gray-100 transition"
            >
              Torna alla home
            </Link>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default MappaSitoPage;