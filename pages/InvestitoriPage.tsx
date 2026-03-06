import React from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";

export const InvestitoriPage: React.FC = () => {
  return (
    <PageLayout slug="investitori" fallbackTitle="Investitori">
      <div className="bg-white text-gray-800">
        
        {/* HERO */}
        <section className="py-24 bg-gradient-to-br from-[#0D414B] to-[#0D414B]/80">
          <div className="max-w-5xl mx-auto px-6 text-center text-white">
            <h1 className="text-5xl font-bold mb-6">Il futuro della sharing economy</h1>
            <p className="text-xl leading-relaxed max-w-3xl mx-auto opacity-90">
              Renthubber sta costruendo la principale piattaforma italiana per il noleggio 
              peer-to-peer. Un mercato in forte espansione, un modello scalabile, 
              un'opportunità concreta.
            </p>
          </div>
        </section>

        {/* IL MERCATO */}
        <section className="py-20 border-b">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              Un mercato in crescita esponenziale
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-5xl font-bold text-[#0D414B] mb-3">€50Mld+</div>
                <p className="text-gray-700 font-medium mb-2">Mercato sharing economy europeo</p>
                <p className="text-sm text-gray-600">Crescita annua 20%+</p>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-[#0D414B] mb-3">70%</div>
                <p className="text-gray-700 font-medium mb-2">Consumatori europei interessati</p>
                <p className="text-sm text-gray-600">Al noleggio vs acquisto</p>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-[#0D414B] mb-3">Italia</div>
                <p className="text-gray-700 font-medium mb-2">Mercato ancora frammentato</p>
                <p className="text-sm text-gray-600">Opportunità di leadership</p>
              </div>
            </div>
          </div>
        </section>

        {/* IL MODELLO */}
        <section className="py-20 bg-gray-50">
  <div className="max-w-5xl mx-auto px-6">
    <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
      Un modello di business provato e scalabile
    </h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-8">
              Renthubber replica il successo di modelli marketplace già validati 
              adattandoli al contesto italiano con focus 
              su sicurezza, pagamenti e fiducia tra utenti.
            </p>
            <div className="grid md:grid-cols-2 gap-8">
  <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-100">
    <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Revenue Streams</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Commissioni transazionali (doppio lato)</li>
                  <li>• Servizi premium per Hubber professionali</li>
                  <li>• Partnership assicurative e logistiche</li>
                </ul>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Vantaggi Competitivi</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Sistema di pagamenti integrato con Stripe</li>
                  <li>• Protezione transazioni e gestione dispute</li>
                  <li>• Focus su trust & safety (verifiche, recensioni)</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* LA TRACTION */}
        <section className="py-20">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Traction e fase di sviluppo
            </h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-12 max-w-3xl mx-auto">
              La piattaforma è operativa e in fase di crescita. Stiamo consolidando 
              il prodotto, acquisendo i primi utenti e validando il product-market fit 
              prima di scalare in modo aggressivo.
            </p>
            <div className="inline-block bg-[#0D414B] text-white px-8 py-4 rounded-lg">
              <p className="text-sm font-semibold mb-1">FASE ATTUALE</p>
              <p className="text-2xl font-bold">Seed / Early Stage</p>
            </div>
          </div>
        </section>

        {/* OPPORTUNITÀ */}
        <section className="py-20 bg-gray-50 border-y">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              Opportunità di investimento
            </h2>
            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-[#0D414B]/20 max-w-3xl mx-auto">
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                Per Partner strategici e investitori che credono nel potenziale 
                della sharing economy e vogliono partecipare alla costruzione di una 
                piattaforma leader nel mercato italiano.
              </p>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-4">Documentazione disponibile per investitori qualificati:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>✓ Business plan completo e proiezioni finanziarie</li>
                  <li>✓ Analisi di mercato e competitive landscape</li>
                  <li>✓ Roadmap di prodotto e strategia di go-to-market</li>
                  <li>✓ Metriche attuali e KPI target</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-br from-[#0D414B] to-[#0D414B]/80 text-white text-center">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-4xl font-bold mb-6">
              Parliamone
            </h2>
            <p className="text-xl mb-10 opacity-90 leading-relaxed">
              Se sei un investitore, business angel o fondo interessato a valutare 
              questa opportunità, contattaci per ricevere materiali riservati e 
              organizzare una call conoscitiva.
            </p>
            <Link 
              to="/contatti"
              className="inline-block px-10 py-4 rounded-lg text-lg font-bold bg-white text-[#0D414B] hover:bg-gray-100 transition shadow-xl"
            >
              Richiedi documentazione →
            </Link>
            <p className="text-sm mt-6 opacity-75">
              Tutte le informazioni sono coperte da NDA
            </p>
          </div>
        </section>

      </div>
    </PageLayout>
  );
};

export default InvestitoriPage;