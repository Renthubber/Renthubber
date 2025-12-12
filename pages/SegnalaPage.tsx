import React from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { useAuth } from "../contexts/AuthContext";

export const SegnalaPage: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <PageLayout slug="segnala-problema" fallbackTitle="Segnala un problema">
      <div className="bg-gray-50 text-gray-800">

        {/* HERO */}
        <section className="bg-white py-20 border-b">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold text-gray-900">Segnala un problema</h1>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto text-justify md:text-center">
              Se hai avuto un problema con una prenotazione, un utente, un pagamento
              o hai notato un comportamento non conforme alle regole della piattaforma,
              puoi inviare una segnalazione. Il nostro team analizzerà la situazione
              nel più breve tempo possibile.
            </p>
          </div>
        </section>

        {/* SEZIONE – QUANDO SEGNALARE */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">

            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                Quando è importante segnalare
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Una segnalazione è fondamentale per garantire un ambiente sicuro,
                affidabile e trasparente per tutti. Non esitare a segnalarci qualsiasi
                comportamento o situazione che ritieni non conforme o potenzialmente
                dannosa.
              </p>

              <ul className="list-disc list-inside text-gray-700 space-y-2 text-sm md:text-base">
                <li className="text-justify">
                  Mancata consegna o mancata presentazione all'appuntamento (no-show).
                </li>
                <li className="text-justify">
                  Pagamenti richiesti fuori dalla piattaforma.
                </li>
                <li className="text-justify">
                  Comportamenti scorretti, aggressivi o inappropriati.
                </li>
                <li className="text-justify">
                  Oggetti/spazi consegnati in condizioni diverse da quelle dichiarate.
                </li>
                <li className="text-justify">
                  Account sospetti, fake o che violano le regole di Renthubber.
                </li>
                <li className="text-justify">
                  Contenuti fraudolenti o tentativi di truffa.
                </li>
              </ul>
            </div>

            <div>
              <img
                src="https://images.unsplash.com/photo-1557804506-669a67965ba0"
                alt="Segnalazioni"
                className="rounded-xl shadow-lg"
              />
            </div>

          </div>
        </section>

        {/* COME INVIARE UNA SEGNALAZIONE */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">

            <div>
              <img
                src="https://images.unsplash.com/photo-1607706189992-eae578626c86"
                alt="Supporto"
                className="rounded-xl shadow-lg"
              />
            </div>

            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                Come inviare una segnalazione
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Inviare una segnalazione tramite Renthubber è semplice e veloce.
                Ti consigliamo di farlo direttamente dalla tua area personale
                per permetterci di identificare automaticamente la prenotazione
                o l'utente coinvolto.
              </p>

              <ol className="space-y-3 text-gray-700 text-sm md:text-base">
                <li className="text-justify">
                  <span className="font-semibold">1. Accedi alla piattaforma</span><br />
                  Vai nella tua area personale con le tue credenziali.
                </li>
                <li className="text-justify">
                  <span className="font-semibold">2. Apri la sezione "Segnala un problema"</span><br />
                  Puoi trovarla nel Centro assistenza o nella pagina della prenotazione.
                </li>
                <li className="text-justify">
                  <span className="font-semibold">3. Compila il form</span><br />
                  Indica cosa è successo, la data, l'utente coinvolto e allega eventuali foto o screenshot.
                </li>
                <li className="text-justify">
                  <span className="font-semibold">4. Invia la segnalazione</span><br />
                  Il nostro team analizzerà il caso e ti risponderà appena possibile.
                </li>
              </ol>
            </div>

          </div>
        </section>

        {/* COSA SUCCEDE DOPO LA SEGNALAZIONE */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
              Cosa succede dopo la segnalazione
            </h2>

            <p className="text-gray-600 leading-relaxed text-justify mb-4 max-w-3xl">
              Il team di Renthubber prende molto seriamente tutte le segnalazioni.
              Ogni caso viene analizzato con attenzione, considerando le evidenze
              fornite e la cronologia dei rapporti tra gli utenti.
            </p>

            <ul className="space-y-3 text-gray-700 text-sm md:text-base max-w-3xl">
              <li className="text-justify">
                Le segnalazioni urgenti (no-show, rischi fisici, comportamenti aggressivi)
                vengono gestite in via prioritaria.
              </li>
              <li className="text-justify">
                Se la segnalazione riguarda una prenotazione in corso, l'assistenza può
                intervenire immediatamente.
              </li>
              <li className="text-justify">
                In caso di comportamenti scorretti ripetuti, l'account può subire
                limitazioni, sospensioni temporanee o la chiusura definitiva.
              </li>
              <li className="text-justify">
                Se necessario, Renthubber può richiedere ulteriori prove (foto, chat,
                documenti) prima di definire il caso.
              </li>
            </ul>
          </div>
        </section>

        {/* CASI CHE RICHIEDONO URGENZA */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
              Casi che richiedono un intervento immediato
            </h2>

            <p className="text-gray-600 leading-relaxed text-justify mb-4 max-w-3xl">
              Alcune situazioni richiedono un contatto rapido con l'assistenza.
              In questi casi consigliamo di aprire subito una richiesta urgente.
            </p>

            <ul className="space-y-3 text-gray-700 text-sm md:text-base max-w-3xl">
              <li className="text-justify">Oggetti o spazi non consegnati.</li>
              <li className="text-justify">Rischi per la sicurezza delle persone.</li>
              <li className="text-justify">Richieste di pagamento extra o fuori piattaforma.</li>
              <li className="text-justify">Danni gravi durante il noleggio.</li>
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
              Hai bisogno di inviare una segnalazione?
            </h2>
            <p className="text-lg text-gray-200 mb-8 text-justify md:text-center">
              {currentUser
                ? "Accedi alla sezione Messaggi per inviare una segnalazione al nostro team di supporto."
                : "Accedi al tuo account per inviare una segnalazione tramite la sezione Messaggi."
              }
            </p>
            <Link 
              to={currentUser ? "/messages" : "/login"}
              className="inline-block px-8 py-3 rounded-full text-lg font-semibold bg-white text-[#0D414B] hover:bg-gray-100 transition"
            >
              {currentUser ? "Invia segnalazione" : "Accedi per segnalare"}
            </Link>
          </div>
        </section>

      </div>
    </PageLayout>
  );
};

export default SegnalaPage;
