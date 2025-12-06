import React from "react";
import  { PageLayout }  from "../components/PageLayout";

export const AntidiscriminazionePage: React.FC = () => {
  return (
    <PageLayout slug="antidiscriminazione" fallbackTitle="Politica Antidiscriminazione">
      <div className="bg-gray-50 text-gray-800">

        {/* HERO */}
        <section className="bg-white py-20 border-b">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold text-gray-900">
              Politica Antidiscriminazione
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto text-justify md:text-center">
              Renthubber si impegna a garantire un ambiente inclusivo,
              rispettoso e privo di discriminazioni. Tutti gli utenti – Renter,
              Hubber e ospiti – devono sentirsi accolti e trattati con correttezza,
              indipendentemente dalle loro caratteristiche personali.
            </p>
          </div>
        </section>

        {/* PRINCIPI DI PARITÀ */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
              Il nostro impegno per la parità
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-4 max-w-3xl">
              Crediamo che la diversità sia un valore e che ogni persona debba poter 
              accedere ai servizi offerti da Renthubber senza paura di essere giudicata, 
              esclusa o penalizzata. Per questo adottiamo pratiche volte a prevenire 
              discriminazioni di qualsiasi tipo.
            </p>
            <p className="text-gray-600 leading-relaxed text-justify max-w-3xl">
              La piattaforma e la community operano nel rispetto dei principi di 
              uguaglianza, correttezza e inclusione, garantendo lo stesso trattamento 
              a tutti gli utenti.
            </p>
          </div>
        </section>

        {/* CRITERI DI NON DISCRIMINAZIONE */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                Criteri di non discriminazione
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-3">
                È severamente vietata qualsiasi forma di discriminazione basata su:
              </p>

              <ul className="list-disc list-inside text-gray-700 text-sm md:text-base space-y-2">
                <li className="text-justify">Genere o identità di genere</li>
                <li className="text-justify">Orientamento sessuale</li>
                <li className="text-justify">Etnia, nazionalità o origine</li>
                <li className="text-justify">Religione o convinzioni personali</li>
                <li className="text-justify">Disabilità o condizioni di salute</li>
                <li className="text-justify">Età</li>
                <li className="text-justify">
                  Condizioni socio-economiche o stato lavorativo
                </li>
              </ul>

              <p className="text-gray-600 leading-relaxed text-justify mt-4">
                Ogni comportamento offensivo, esclusivo o che limiti l’accesso alla
                piattaforma sulla base di uno di questi criteri è vietato.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border">
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">
                Un ambiente accogliente per tutti
              </h3>
              <p className="text-gray-600 text-sm md:text-base text-justify">
                Renthubber desidera creare una community basata sulla collaborazione,
                sulla fiducia reciproca e sull’uguaglianza. Rifiutiamo ogni forma di
                discriminazione e promuoviamo comportamenti inclusivi in ogni
                interazione sulla piattaforma.
              </p>
            </div>
          </div>
        </section>

        {/* COMPORTAMENTI NON AMMESSI */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
              Comportamenti non ammessi
            </h2>

            <p className="text-gray-600 leading-relaxed text-justify mb-4 max-w-3xl">
              Sono vietati comportamenti o contenuti che mirano a discriminare o 
              escludere altri utenti, tra cui:
            </p>

            <ul className="list-disc list-inside text-gray-700 text-sm md:text-base space-y-2 max-w-3xl">
              <li className="text-justify">
                Rifiuto immotivato di una prenotazione basato su caratteristiche personali.
              </li>
              <li className="text-justify">
                Commenti, messaggi o recensioni offensivi o discriminatori.
              </li>
              <li className="text-justify">
                Pubblicazione di contenuti denigratori, razzisti, sessisti o aggressivi.
              </li>
              <li className="text-justify">
                Comportamenti che creano ambienti ostili o non sicuri.
              </li>
              <li className="text-justify">
                Incitamento all’odio, alla violenza o all’esclusione.
              </li>
            </ul>

            <p className="text-gray-600 leading-relaxed text-justify mt-4 max-w-3xl">
              Ogni violazione sarà valutata attentamente e può comportare interventi
              come richiami, sospensioni o chiusura definitiva dell’account.
            </p>
          </div>
        </section>

        {/* RESPONSABILITÀ DEGLI UTENTI */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                Responsabilità della community
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Tutti gli utenti hanno la responsabilità di mantenere un ambiente sicuro,
                rispettoso e accogliente. Le linee guida antidiscriminazione sono valide
                in ogni fase del noleggio: dalla pubblicazione dell’annuncio, alla chat,
                all’incontro di persona.
              </p>
              <p className="text-gray-600 leading-relaxed text-justify">
                Gli utenti sono invitati a segnalare comportamenti discriminatori
                tramite la funzione “Segnala un problema”, così da permettere alla
                piattaforma di intervenire.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 shadow-sm border">
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">
                Supporto e tutela
              </h3>
              <p className="text-gray-600 text-sm md:text-base text-justify">
                Il team di Renthubber è disponibile ad assistere chi subisce
                discriminazioni, garantendo ascolto, tutela e, se necessario,
                interventi per proteggere la sicurezza emotiva e fisica degli utenti.
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
              Insieme per una community inclusiva
            </h2>
            <p className="text-lg text-gray-200 mb-8 text-justify md:text-center">
              Rispettare queste regole significa contribuire a un ambiente in cui
              ogni persona può noleggiare e mettere a disposizione i propri beni
              liberamente, senza paura di essere discriminata.
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

export default AntidiscriminazionePage;
