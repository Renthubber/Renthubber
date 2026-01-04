import React from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";

export const DiventareHubberPage: React.FC = () => {
  return (
    <PageLayout slug="diventare-hubber" fallbackTitle="Diventa un Hubber">
      <div className="bg-gray-50 text-gray-800">
        {/* HERO */}
        <section className="bg-white py-20 border-b">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold text-gray-900">Diventa un Hubber</h1>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto text-justify md:text-center">
              Entrare nella community degli Hubber di Renthubber significa trasformare
              ciò che possiedi in un'opportunità di guadagno. Che tu abbia oggetti,
              attrezzature o spazi inutilizzati, puoi metterli a noleggio e iniziare
              a generare entrate extra in modo semplice e sicuro.
            </p>
          </div>
        </section>

        {/* SEZIONE – COSA SIGNIFICA ESSERE HUBBER */}
<section className="py-20 bg-white border-y">
  <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
    <div>
      <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
        Cosa significa essere Hubber
      </h2>
      <p className="text-gray-600 leading-relaxed text-justify mb-4">
        Essere Hubber significa condividere ciò che non utilizzi tutti i giorni,
        aiutando altre persone e monetizzando allo stesso tempo. È un modo intelligente
        per far fruttare beni che altrimenti resterebbero inutilizzati in garage, 
        cantine o depositi.
      </p>
      
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 mb-2">Oggetti e attrezzature:</h3>
        <p className="text-gray-600 text-sm leading-relaxed text-justify">
          Utensili da lavoro, trapani, seghe, scale, fotocamere professionali, 
          droni, attrezzature sportive (sci, surf, mountain bike), strumenti musicali 
          (chitarre, tastiere, amplificatori), elettrodomestici specializzati, 
          macchine da cucire, attrezzature da campeggio, console videogiochi e molto altro.
        </p>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 mb-2">Spazi:</h3>
        <p className="text-gray-600 text-sm leading-relaxed text-justify">
          Sale per eventi e feste, uffici temporanei o coworking privati, magazzini 
          e depositi, terrazzi e giardini per eventi all'aperto, terreni agricoli, 
          garage o box auto, laboratori attrezzati, cucine professionali, studi 
          fotografici o sale prove.
        </p>
      </div>
      
      <p className="text-gray-600 leading-relaxed text-justify mb-4">
        Non serve investire denaro: pubblichi gratuitamente e paghi una piccola 
        commissione solo quando ricevi una prenotazione completata. L'obiettivo è 
        valorizzare ciò che già possiedi, trasformandolo in una fonte di guadagno 
        continuativo.
      </p>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg mt-6">
  <div className="flex">
    <div className="flex-shrink-0">
      <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
      </svg>
    </div>
    <div className="ml-3">
      <p className="text-sm text-yellow-800 font-medium">
        <strong>Importante:</strong> Non è possibile pubblicare annunci di alloggi o abitazioni su Renthubber. 
        La piattaforma è dedicata esclusivamente a oggetti e spazi non residenziali.
      </p>
    </div>
  </div>
</div>
</div>

<div>
  <img
    src="https://i.imgur.com/ZQ44VNT.jpeg"
    alt="Diventa Hubber"
    className="rounded-xl shadow-lg"
  />
</div>
          </div>
        </section>

        {/* SEZIONE – COME FUNZIONA PER GLI HUBBER */}
        <section className="py-20">
  <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
    <div>
      <img
        src="https://i.imgur.com/KyG5ScW.png"
        alt="Come funziona"
        className="rounded-xl shadow-lg"
      />
    </div>

            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                Come funziona
              </h2>
              <ol className="space-y-4 text-gray-700 text-sm md:text-base">
                <li className="text-justify">
                  <span className="font-semibold text-gray-900">
                    1. Registrati come Hubber
                  </span>
                  <br />
                  Iscrivendosi come Hubber si ottiene un profilo ibrido Renter/Hubber, puoi mettere a noleggio e noleggiare con un solo account.
                </li>
                <li className="text-justify">
                  <span className="font-semibold text-gray-900">
                    2. Pubblica il tuo annuncio
                  </span>
                  <br />
                  Inserisci foto, descrizione, prezzo, disponibilità, regole e tutto ciò che serve per rendere il tuo annuncio completo e professionale.
                </li>
                <li className="text-justify">
                  <span className="font-semibold text-gray-900">
                    3. Ricevi richieste di prenotazione
                  </span>
                  <br />
                  I Renter possono inviarti richieste. Puoi accettarle o rifiutarle, e decidere come gestire il tuo calendario.
                </li>
                <li className="text-justify">
                  <span className="font-semibold text-gray-900">
                    4. Consegnalo e completa il noleggio
                  </span>
                  <br />
                  Una volta confermata la prenotazione, organizza consegna, ritiro o accesso. La comunicazione avviene sempre tramite chat interna.
                </li>
                <li className="text-justify">
                  <span className="font-semibold text-gray-900">
                    5. Ricevi il pagamento
                  </span>
                  <br />
                  Il pagamento viene gestito in sicurezza e rilasciato dopo la conclusione del noleggio.
                </li>
              </ol>
            </div>
          </div>
        </section>

       {/* SEZIONE – VANTAGGI PER GLI HUBBER */}
<section className="py-20 bg-white border-y">
  <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
    <div>
      <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
        Vantaggi per gli Hubber
      </h2>
      <ul className="space-y-4 text-gray-700 text-sm md:text-base">
        <li className="text-justify">
          <span className="font-semibold">Zero costi di pubblicazione</span>:
          aprire un annuncio è completamente gratuito.
        </li>
        <li className="text-justify">
          <span className="font-semibold">Guadagno sicuro</span>: il pagamento
          viene gestito e rilasciato solo a noleggio completato.
        </li>
        <li className="text-justify">
          <span className="font-semibold">Maggiore visibilità</span>: annunci
          curati e con buone recensioni scalano rapidamente le ricerche.
        </li>
        <li className="text-justify">
          <span className="font-semibold">Strumenti avanzati</span>: dashboard,
          statistiche, messaggistica, calendario, gestione disponibilità.
        </li>
        <li className="text-justify">
          <span className="font-semibold">Accesso a SuperHubber</span>: gli
          Hubber più affidabili possono ottenere il badge premium.
        </li>
      </ul>
    </div>

    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg p-8">
      <div className="grid grid-cols-2 gap-6">
        {/* Zero Costi */}
        <div className="bg-white rounded-lg p-6 text-center shadow-md">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-800">Gratis</p>
        </div>
        
        {/* Pagamenti Sicuri */}
        <div className="bg-white rounded-lg p-6 text-center shadow-md">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-800">Pagamenti Sicuri</p>
        </div>
        
        {/* Visibilità */}
        <div className="bg-white rounded-lg p-6 text-center shadow-md">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-800">Alta Visibilità</p>
        </div>
        
        {/* Strumenti */}
        <div className="bg-white rounded-lg p-6 text-center shadow-md">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-800">Strumenti Pro</p>
        </div>
        
        {/* SuperHubber Badge - Full Width */}
        <div className="col-span-2 bg-gradient-to-r from-[#0D414B] to-[#0D414B]/80 rounded-lg p-6 text-center shadow-lg">
          <div className="flex items-center justify-center space-x-3">
            <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            <p className="text-lg font-bold text-white">Badge SuperHubber</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

        {/* SEZIONE – REGOLE PRINCIPALI */}
        <section className="py-20 bg-gray border-y">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6 text-left">
              Regole principali per diventare Hubber
            </h2>

            <ul className="list-disc list-inside text-gray-700 text-sm md:text-base space-y-3 max-w-3xl">
              <li className="text-justify">Pubblicare annunci chiari e completi.</li>
              <li className="text-justify">Consegnare oggetti/spazi in buone condizioni.</li>
              <li className="text-justify">Essere puntuali agli orari di consegna/ritiro.</li>
              <li className="text-justify">Comunicare sempre tramite chat interna.</li>
              <li className="text-justify">Gestire le prenotazioni con responsabilità.</li>
              <li className="text-justify">Rispettare le policy della piattaforma.</li>
            </ul>
          </div>
        </section>

        {/* CTA FINALE */}
        <section
          className="py-20 text-white text-center"
          style={{ backgroundColor: "#0D414B" }}
        >
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-4">
              Sei pronto a diventare un Hubber?
            </h2>
            <p className="text-lg text-gray-200 mb-8 text-justify md:text-center">
              Trasforma ciò che possiedi in un'opportunità di guadagno. Pubblica
              il tuo primo annuncio e unisciti alla community di Renthubber.
            </p>
            <Link
              to="/signup"
              className="inline-block px-8 py-3 rounded-full text-lg font-semibold bg-white text-[#0D414B] hover:bg-gray-100 transition"
            >
              Registrati ora
            </Link>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default DiventareHubberPage;
