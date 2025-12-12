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
              disposizione oggetti o spazi (Hubber). Ogni annuncio deve indicare 
              in modo chiaro la politica applicata.
            </p>
          </div>
        </section>

        {/* POLITICHE DI CANCELLAZIONE */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6">

            <h2 className="text-3xl font-semibold text-gray-900 mb-10 text-left">
              Tipologie di politiche di cancellazione
            </h2>

            {/* FLESSIBILE */}
            <div className="mb-16">
              <h3 className="text-2xl font-bold text-gray-900 mb-3 text-left">
                Flessibile
              </h3>
              <p className="text-gray-600 leading-relaxed text-justify max-w-3xl">
                La politica di cancellazione più permissiva. 
                <br />
                <span className="font-semibold text-gray-800">
                  Rimborso 100% fino a 24 ore prima dell’inizio del noleggio.
                </span>
              </p>
            </div>

            {/* MODERATA */}
            <div className="mb-16">
              <h3 className="text-2xl font-bold text-gray-900 mb-3 text-left">
                Moderata
              </h3>
              <p className="text-gray-600 leading-relaxed text-justify max-w-3xl">
                Ideale per noleggi programmati con più anticipo.
                <br />
                <span className="font-semibold text-gray-800">
                  Rimborso 100% fino a 5 giorni prima dell’inizio del noleggio.
                </span>
              </p>
            </div>

            {/* RIGIDA */}
            <div className="mb-16">
              <h3 className="text-2xl font-bold text-gray-900 mb-3 text-left">
                Rigida
              </h3>
              <p className="text-gray-600 leading-relaxed text-justify max-w-3xl">
                Pensata per oggetti/spazi con elevata richiesta o utilizzo specifico.
                <br />
                <span className="font-semibold text-gray-800">
                  Rimborso 50% fino a 7 giorni prima dell’inizio del noleggio.
                </span>
              </p>
            </div>

          </div>
        </section>

        {/* ALTRE INFORMAZIONI */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6">

            <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
              Modalità di rimborso
            </h2>

            <p className="text-gray-600 leading-relaxed text-justify mb-4 max-w-3xl">
              In caso di cancellazione entro i limiti previsti dalla politica selezionata,
              il rimborso viene elaborato automaticamente tramite il metodo di pagamento
              utilizzato, al netto di eventuali commissioni non rimborsabili indicate
              specificamente nella piattaforma.
            </p>

            <p className="text-gray-600 leading-relaxed text-justify max-w-3xl">
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
