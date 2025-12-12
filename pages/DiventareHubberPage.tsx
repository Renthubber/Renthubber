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
                aiutando altre persone e monetizzando allo stesso tempo.
              </p>
              <p className="text-gray-600 leading-relaxed text-justify">
                Puoi pubblicare annunci per attrezzature, strumenti, mezzi, spazi eventi,
                stanze, terreni, apparecchiature e molto altro. L'obiettivo è valorizzare
                ciò che già possiedi, senza alcun costo iniziale.
              </p>
            </div>

            <div>
              <img
                src="https://images.unsplash.com/photo-1605902711622-cfb43c4437f9"
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
                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d"
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
                  Puoi essere solo Hubber o avere un profilo ibrido Renter/Hubber, tutto con un solo account.
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

        {/* SEZIONE – COSA PUOI NOLEGGIARE */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-semibold text-gray-900 mb-8 text-left">
              Cosa puoi mettere a noleggio
            </h2>

            <p className="text-gray-600 leading-relaxed text-justify max-w-3xl mb-6">
              Le categorie possibili sono davvero molte. Renthubber è pensato per
              accogliere ogni tipo di annuncio, purché sia conforme alle regole della
              piattaforma e sicuro per gli utenti.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-50 border rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-2 text-gray-900">
                  Oggetti & attrezzature
                </h3>
                <p className="text-gray-600 text-sm text-justify">
                  Utensili, fotocamere, droni, attrezzature sportive, strumenti musicali, ecc.
                </p>
              </div>

              <div className="bg-gray-50 border rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-2 text-gray-900">
                  Spazi & ambienti
                </h3>
                <p className="text-gray-600 text-sm text-justify">
                  Sale per eventi, uffici temporanei, magazzini, terrazze, aree all'aperto.
                </p>
              </div>

              <div className="bg-gray-50 border rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-2 text-gray-900">
                  Veicoli & mezzi
                </h3>
                <p className="text-gray-600 text-sm text-justify">
                  Biciclette, scooter, auto, furgoni, mezzi agricoli, attrezzature da lavoro.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SEZIONE – VANTAGGI PER GLI HUBBER */}
        <section className="py-20">
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

            <div>
              <img
                src="https://images.unsplash.com/photo-1553877522-43269d4ea984"
                alt="Hubber vantaggi"
                className="rounded-xl shadow-lg"
              />
            </div>
          </div>
        </section>

        {/* SEZIONE – REGOLE PRINCIPALI */}
        <section className="py-20 bg-white border-y">
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
