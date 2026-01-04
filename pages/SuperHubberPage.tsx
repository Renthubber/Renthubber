import React from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";

export const SuperHubberPage: React.FC = () => {
  return (
    <PageLayout slug="superhubber" fallbackTitle="Programma Superhubber">
      <div className="bg-gray-50 text-gray-800">

        {/* HERO */}
        <section className="bg-white py-20 border-b">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold text-gray-900">Programma Superhubber</h1>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto text-justify md:text-center">
              Il badge Superhubber è un riconoscimento che premia gli Hubber più affidabili,
              attivi e apprezzati dalla community. Essere Superhubber significa ottenere
              maggiore visibilità, più prenotazioni e vantaggi esclusivi.
            </p>
          </div>
        </section>

        {/* SEZIONE – COS'È */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
            {/* TESTO */}
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                Cos'è il badge Superhubber
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Il badge Superhubber certifica che un Hubber rispetta standard elevati
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
<div className="flex justify-center items-center bg-gray-50 rounded-xl shadow-lg p-12">
  <div className="relative">
    {/* Foto profilo */}
    <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-[#0D414B] shadow-xl">
      <img
        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d"
        alt="Superhubber"
        className="w-full h-full object-cover"
      />
    </div>
    {/* Badge Superhubber sovrapposto */}
    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-[#0D414B] px-4 py-2 rounded-full shadow-lg border-2 border-white flex items-center space-x-2">
      <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
      </svg>
      <span className="font-bold text-white text-sm">Superhubber</span>
    </div>
  </div>
</div>
          </div>
        </section>

        {/* CRITERI */}
<section className="py-20">
  <div className="max-w-6xl mx-auto px-6">
    <h2 className="text-3xl font-semibold text-gray-900 mb-8 text-center">
      Criteri per diventare Superhubber
    </h2>
    <p className="text-gray-600 leading-relaxed text-justify mb-6">
  Per ottenere il badge Superhubber è necessario soddisfare tutti i seguenti 
  requisiti, valutati automaticamente dalla piattaforma. ogni 90 giorni.
</p>

    <ul className="space-y-6 text-gray-700 text-sm md:text-base max-w-3xl">
      <li className="text-justify">
        <span className="font-semibold text-gray-900">1. Noleggi completati</span><br />
        Almeno 5 prenotazioni completate con successo negli ultimi 90 giorni.
      </li>

      <li className="text-justify">
        <span className="font-semibold text-gray-900">2. Rating eccellente</span><br />
        Media delle recensioni pari o superiore a 4.5 stelle su 5.
      </li>

      <li className="text-justify">
        <span className="font-semibold text-gray-900">3. Affidabilità nelle prenotazioni</span><br />
        Tasso di cancellazione inferiore al 5% negli ultimi 90 giorni.
      </li>

      <li className="text-justify">
        <span className="font-semibold text-gray-900">4. Identità verificata</span><br />
        Documento d'identità verificato dalla piattaforma.
      </li>

      <li className="text-justify">
        <span className="font-semibold text-gray-900">5. Almeno un annuncio attivo</span><br />
        Disponibilità continuativa di oggetti o spazi da noleggiare.
      </li>
    </ul>
  </div>
</section>

        {/* BENEFICI */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            {/* IMMAGINE */}
<div className="order-2 md:order-1 bg-[#0D414B] rounded-xl shadow-lg p-8">
  <div className="grid grid-cols-2 gap-6">
    {/* Fee Ridotta */}
    <div className="bg-white rounded-lg p-6 text-center shadow-md">
      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
        <span className="text-2xl font-bold text-white">5%</span>
      </div>
      <p className="text-sm font-semibold text-gray-800">Fee Ridotta</p>
    </div>
    
    {/* Visibilità */}
    <div className="bg-white rounded-lg p-6 text-center shadow-md">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-800">Alta Visibilità</p>
    </div>
    
    {/* Badge Fiducia */}
    <div className="bg-white rounded-lg p-6 text-center shadow-md">
      <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-800">Badge Premium</p>
    </div>
    
    {/* Supporto Prioritario */}
    <div className="bg-white rounded-lg p-6 text-center shadow-md">
      <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-800">Supporto VIP</p>
    </div>
  </div>
</div>

            {/* TESTO */}
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                I vantaggi del badge Superhubber
              </h2>

              <ul className="space-y-4 text-gray-700 text-sm md:text-base">
                <li className="text-justify">
                  <span className="font-semibold">Maggiore visibilità</span>: gli annunci
                  dei Superhubber compaiono più spesso e in posizioni migliori nelle ricerche.
                </li>
                <li className="text-justify">
                  <span className="font-semibold">Più fiducia dai Renter</span>: il badge
                  rappresenta una garanzia di qualità e professionalità.
                </li>
                <li className="text-justify">
                  <span className="font-semibold">Accesso prioritario al supporto</span>:
                  i Superhubber ricevono assistenza più rapida quando necessario.
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
    <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-center">
      Come ottenere il badge
    </h2>
    <p className="text-gray-600 leading-relaxed text-justify mb-6">
      Non serve inviare richieste o candidature: il badge Superhubber viene assegnato
      automaticamente dalla piattaforma quando un Hubber rispetta costantemente i
      criteri richiesti. Il sistema verifica ogni 90 giorni:
    </p>

    <ul className="list-disc list-inside text-gray-700 space-y-2 text-sm md:text-base">
      <li className="text-justify">almeno 5 noleggi completati negli ultimi 90 giorni;</li>
      <li className="text-justify">rating medio pari o superiore a 4.5 stelle;</li>
      <li className="text-justify">tasso di cancellazione inferiore al 5%;</li>
      <li className="text-justify">identità verificata;</li>
      <li className="text-justify">almeno un annuncio attivo sulla piattaforma.</li>
    </ul>

    <p className="text-gray-600 leading-relaxed text-justify mt-6">
      Una volta raggiunti tutti i requisiti, il badge appare automaticamente nel profilo
      dell'Hubber e in tutti i suoi annunci pubblicati. Il badge viene anche rimosso
      automaticamente se i criteri non sono più soddisfatti.
    </p>
  </div>
</section>

        {/* CTA */}
        <section
          className="py-20 text-white text-center"
          style={{ backgroundColor: "#0D414B" }}
        >
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-4">Diventa un Superhubber</h2>
            <p className="text-lg text-gray-200 mb-8 text-justify md:text-center">
              Offri un servizio impeccabile, rispetta le regole, mantieni alta la tua
              reputazione e lascia che Renthubber ti aiuti a crescere.
              Il badge Superhubber è il riconoscimento che premia il tuo impegno.
            </p>
            <Link 
              to="/login"
              className="inline-block px-8 py-3 rounded-full text-lg font-semibold bg-white text-[#0D414B] hover:bg-gray-100 transition"
            >
              Accedi per iniziare
            </Link>
          </div>
        </section>

      </div>
    </PageLayout>
  );
};

export default SuperHubberPage;
