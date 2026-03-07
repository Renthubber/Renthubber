import React from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";

export const CancellazionePage: React.FC = () => {
  return (
    <PageLayout slug="cancellazione" fallbackTitle="Regole di Cancellazione">
      <div className="bg-gray-50 text-gray-800">

        {/* HERO */}
        <section className="bg-white py-20 border-b">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold text-gray-900">
              Regole di Cancellazione
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto text-justify md:text-center">
              Le politiche di cancellazione su Renthubber garantiscono chiarezza e 
              trasparenza sia per chi noleggia (Renter) sia per chi mette a 
              disposizione oggetti, spazi o esperienze (Hubber). Ogni annuncio deve indicare 
              in modo chiaro la politica applicata.
            </p>
          </div>
        </section>

        {/* POLITICHE DI CANCELLAZIONE */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6">

            <h2 className="text-3xl font-semibold text-gray-900 mb-10 text-center">
              Tipologie di politiche di cancellazione
            </h2>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">

              {/* FLESSIBILE */}
              <div className="bg-gray-50 border rounded-2xl p-6 text-center flex flex-col gap-3">
                <h3 className="text-2xl font-bold text-gray-900">Flessibile</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  La politica di cancellazione più permissiva.
                </p>
                <p className="font-semibold text-gray-800 text-sm">
                  Rimborso 100% fino a 24 ore prima dell’inizio del noleggio o dello slot.
                </p>
              </div>

              {/* MODERATA */}
              <div className="bg-gray-50 border rounded-2xl p-6 text-center flex flex-col gap-3">
                <h3 className="text-2xl font-bold text-gray-900">Moderata</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  Ideale per noleggi programmati con più anticipo.
                </p>
                <p className="font-semibold text-gray-800 text-sm">
                  Rimborso 100% fino a 5 giorni prima dell’inizio del noleggio o dello slot.
                </p>
              </div>

              {/* RIGIDA */}
              <div className="bg-gray-50 border rounded-2xl p-6 text-center flex flex-col gap-3">
                <h3 className="text-2xl font-bold text-gray-900">Rigida</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  Pensata per oggetti/spazi con elevata richiesta o utilizzo specifico.
                </p>
                <p className="font-semibold text-gray-800 text-sm">
                  Rimborso 50% fino a 7 giorni prima dell’inizio del noleggio o dello slot.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* ESPERIENZE */}
        <section className="py-12 bg-gray-50 border-y">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              Regole specifiche per le Esperienze
            </h2>
            <p className="text-gray-600 leading-relaxed text-center mb-8 max-w-3xl mx-auto">
              Per le Esperienze prenotate tramite slot orari, si applicano le stesse politiche sopra descritte con riferimento all’orario di inizio dello slot. In aggiunta valgono le seguenti regole:
            </p>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <div className="bg-white border rounded-xl p-5 text-center">
                <p className="font-semibold text-gray-900 mb-2">Mancata presentazione (no-show)</p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Se il Partecipante non si presenta all’orario dello slot senza aver cancellato nei termini previsti dalla politica, non è previsto alcun rimborso.
                </p>
              </div>
              <div className="bg-white border rounded-xl p-5 text-center">
                <p className="font-semibold text-gray-900 mb-2">Annullamento da parte dell’Hubber</p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Se l’Hubber annulla uno slot per qualsiasi motivo, i Partecipanti hanno sempre diritto al rimborso integrale dell’importo pagato, indipendentemente dalla politica applicata.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ALTRE INFORMAZIONI */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6 text-center">

            <h2 className="text-3xl font-semibold text-gray-900 mb-4">
              Modalità di rimborso
            </h2>

            <p className="text-gray-600 leading-relaxed mb-4 max-w-3xl mx-auto">
              In caso di cancellazione entro i limiti previsti dalla politica selezionata,
              il rimborso viene elaborato automaticamente tramite il metodo di pagamento
              utilizzato, al netto di eventuali commissioni non rimborsabili indicate
              specificamente nella piattaforma. Per le Esperienze, il rimborso segue la politica associata allo slot prenotato.
            </p>

            <p className="text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Se la cancellazione avviene oltre i limiti della politica scelta, 
              non è previsto alcun rimborso salvo diversa autorizzazione dell’Hubber.
            </p>

          </div>
        </section>

        {/* CTA FINALE */}
        <section
          className="py-20 text-white text-center"
          style={{ backgroundColor: "#0D414B" }}
        >
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-4">
              Scegli con cura la politica più adatta
            </h2>
            <p className="text-lg text-gray-200 mb-8 text-justify md:text-center">
              Le politiche di cancellazione aiutano a tutelare sia te che gli altri utenti.
              Prima di prenotare o pubblicare un annuncio, verifica sempre la politica
              applicata.
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

export default CancellazionePage;