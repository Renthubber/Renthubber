import React from "react";
import PageLayout from "../components/PageLayout";

export const ContattiPage: React.FC = () => {
  return (
    <PageLayout slug="contatti" fallbackTitle="Contattaci">
      <div className="bg-gray-50 text-gray-800">
        {/* HERO */}
        <section className="bg-white py-20 border-b">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold text-gray-900">Contattaci</h1>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto text-justify md:text-center">
              Hai una domanda, un dubbio o una proposta per Renthubber? Compila il
              form qui sotto oppure utilizza i recapiti indicati: il nostro team ti
              risponderà nel più breve tempo possibile.
            </p>
          </div>
        </section>

        {/* SEZIONE – FORM + INFO CONTATTI */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            {/* FORM CONTATTI (solo UI, nessun submit reale) */}
            <div className="bg-white rounded-xl shadow-sm border p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
                Invia un messaggio
              </h2>
              <p className="text-gray-600 text-sm md:text-base text-justify mb-6">
                Compila tutti i campi obbligatori per aiutarci a comprendere al meglio
                la tua richiesta. Ti risponderemo via email appena possibile.
              </p>

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  // Qui in futuro potrai collegare l'invio reale (API, email, ecc.)
                  alert(
                    "Questo è un form di esempio. L'invio reale verrà configurato in seguito."
                  );
                }}
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome e cognome *
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border-gray-300 focus:ring-[#0D414B] focus:border-[#0D414B] text-sm px-3 py-2"
                    placeholder="Inserisci il tuo nome"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Indirizzo email *
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-lg border-gray-300 focus:ring-[#0D414B] focus:border-[#0D414B] text-sm px-3 py-2"
                    placeholder="nome@esempio.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Oggetto *
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border-gray-300 focus:ring-[#0D414B] focus:border-[#0D414B] text-sm px-3 py-2"
                    placeholder="Es. Problema con una prenotazione"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Messaggio *
                  </label>
                  <textarea
                    className="w-full rounded-lg border-gray-300 focus:ring-[#0D414B] focus:border-[#0D414B] text-sm px-3 py-2 min-h-[140px]"
                    placeholder="Descrivi in modo chiaro cosa è successo o cosa desideri chiederci"
                    required
                  />
                </div>

                <div className="flex items-start space-x-2">
                  <input
                    id="privacy"
                    type="checkbox"
                    className="mt-1 rounded border-gray-300 text-[#0D414B] focus:ring-[#0D414B]"
                    required
                  />
                  <label
                    htmlFor="privacy"
                    className="text-xs md:text-sm text-gray-600 text-justify"
                  >
                    Dichiaro di aver letto e compreso l’informativa privacy e acconsento
                    al trattamento dei miei dati per la gestione della richiesta di
                    contatto.
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full md:w-auto px-6 py-2.5 rounded-full text-sm font-semibold bg-[#0D414B] text-white hover:bg-[#0f5260] transition"
                >
                  Invia messaggio
                </button>
              </form>
            </div>

            {/* INFO CONTATTI / CANALI / ORARI */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
                Altri modi per contattarci
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Oltre al form, puoi utilizzare i recapiti ufficiali di Renthubber
                per comunicazioni più strutturate, partnership o richieste legali
                e amministrative.
              </p>

              <div className="space-y-4 text-sm md:text-base text-gray-700">
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Email di supporto</h3>
                  <p className="text-justify">
                    Per assistenza generale, problemi con prenotazioni o dubbi sul
                    funzionamento della piattaforma:
                    <br />
                    <span className="font-semibold">supporto@renthubber.com</span>
                    {/* Sostituisci con la tua mail reale */}
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-1">
                    Partnership & collaborazioni
                  </h3>
                  <p className="text-justify">
                    Se rappresenti un’azienda, un ente o desideri valutare forme di
                    collaborazione, partnership o integrazioni:
                    <br />
                    <span className="font-semibold">partnerships@renthubber.com</span>
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-1">
                    Segnalazioni e sicurezza
                  </h3>
                  <p className="text-justify">
                    Per casi urgenti legati alla sicurezza, segnalazioni di abusi o
                    comportamenti gravi, ti invitiamo a utilizzare la pagina
                    <span className="font-semibold"> “Segnala un problema”</span> o il
                    Centro assistenza, così da poter gestire il caso in modo tracciato.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-1">
                    Orari indicativi di risposta
                  </h3>
                  <p className="text-justify">
                    Generalmente rispondiamo alle richieste dal lunedì al venerdì,
                    in orario di ufficio. I tempi possono variare in base al numero
                    di richieste in corso e alla complessità del caso.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BLOCCO FINALE – LINK UTILI */}
        <section className="py-16 bg-white border-t">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-bold text-gray-900 mb-2 text-left">
                Domande frequenti (FAQ)
              </h3>
              <p className="text-gray-600 text-sm text-justify mb-3">
                Prima di contattarci, dai un’occhiata alle FAQ: potresti trovare
                subito la risposta che cerchi.
              </p>
              <a
                href="#"
                className="text-sm font-semibold text-[#0D414B] hover:underline"
              >
                Vai alle FAQ
              </a>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-bold text-gray-900 mb-2 text-left">
                Centro assistenza
              </h3>
              <p className="text-gray-600 text-sm text-justify mb-3">
                Per problemi legati a prenotazioni, pagamenti o account, usa il
                Centro assistenza per aprire una richiesta tracciata.
              </p>
              <a
                href="#"
                className="text-sm font-semibold text-[#0D414B] hover:underline"
              >
                Vai al Centro assistenza
              </a>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-bold text-gray-900 mb-2 text-left">
                Segnala un problema
              </h3>
              <p className="text-gray-600 text-sm text-justify mb-3">
                Se ritieni che ci sia stato un comportamento scorretto o un problema
                grave durante un noleggio, invia una segnalazione dedicata.
              </p>
              <a
                href="#"
                className="text-sm font-semibold text-[#0D414B] hover:underline"
              >
                Vai alla pagina segnalazioni
              </a>
            </div>
          </div>
        </section>

        {/* CTA CONCLUSIVA */}
        <section
          className="py-20 text-white text-center"
          style={{ backgroundColor: "#0D414B" }}
        >
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-4">Siamo qui per aiutarti</h2>
            <p className="text-lg text-gray-200 mb-8 text-justify md:text-center">
              Qualsiasi sia il motivo del tuo contatto, il nostro obiettivo è
              offrirti un supporto chiaro, umano e trasparente. Compila il form
              o utilizza i recapiti indicati: ti risponderemo il prima possibile.
            </p>
            <a
              href="/login" // o eventualmente la route alla dashboard / area utente
              className="inline-block px-8 py-3 rounded-full text-lg font-semibold bg-white text-[#0D414B] hover:bg-gray-100 transition"
            >
              Accedi alla tua area personale
            </a>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default ContattiPage;
