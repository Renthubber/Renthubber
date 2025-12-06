import React from "react";
import PageLayout from "../components/PageLayout";

export const LineeGuidaPage: React.FC = () => {
  return (
    <PageLayout slug="linee-guida" fallbackTitle="Linee guida della community">
      <div className="bg-gray-50 text-gray-800">
        {/* HERO */}
        <section className="bg-white py-20 border-b">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold text-gray-900">
              Linee guida della community
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto text-justify md:text-center">
              Renthubber si basa su fiducia, rispetto reciproco e responsabilità.
              Queste linee guida definiscono i comportamenti attesi da tutti gli
              utenti, sia Renter che Hubber, per mantenere una community sicura,
              corretta e professionale.
            </p>
          </div>
        </section>

        {/* PRINCIPI DI BASE */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
              Principi di base
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-4 max-w-3xl">
              Tutti gli utenti di Renthubber si impegnano a rispettare alcuni
              principi fondamentali che stanno alla base di ogni interazione sulla
              piattaforma.
            </p>

            <ul className="list-disc list-inside text-gray-700 text-sm md:text-base space-y-2 max-w-3xl">
              <li className="text-justify">
                <span className="font-semibold">Rispetto reciproco</span>: trattare
                gli altri utenti con educazione, senza offese, insulti o linguaggio
                discriminatorio.
              </li>
              <li className="text-justify">
                <span className="font-semibold">Trasparenza</span>: fornire
                informazioni corrette su sé stessi, sugli oggetti e sugli spazi
                messi a disposizione.
              </li>
              <li className="text-justify">
                <span className="font-semibold">Affidabilità</span>: rispettare
                accordi, orari, condizioni di noleggio e regole degli annunci.
              </li>
              <li className="text-justify">
                <span className="font-semibold">Sicurezza</span>: adottare
                comportamenti che non mettano a rischio la propria incolumità e
                quella altrui.
              </li>
            </ul>
          </div>
        </section>

        {/* COMPORTAMENTI CONSIGLIATI */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                Comportamenti consigliati
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Alcune buone pratiche aiutano a mantenere un’esperienza positiva
                per tutti e contribuiscono a costruire fiducia all’interno della
                community.
              </p>

              <ul className="space-y-3 text-gray-700 text-sm md:text-base">
                <li className="text-justify">
                  Comunicare in modo chiaro e cortese tramite la chat interna.
                </li>
                <li className="text-justify">
                  Arrivare puntuali agli appuntamenti di consegna o ritiro.
                </li>
                <li className="text-justify">
                  Trattare gli oggetti e gli spazi noleggiati come se fossero propri.
                </li>
                <li className="text-justify">
                  Aggiornare tempestivamente l’altro utente in caso di imprevisti.
                </li>
                <li className="text-justify">
                  Lasciare recensioni oneste e costruttive dopo un noleggio.
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border">
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">
                Un buon comportamento porta benefici
              </h3>
              <p className="text-gray-600 text-sm md:text-base text-justify">
                Un atteggiamento corretto, puntuale e rispettoso aumenta la
                probabilità di ricevere recensioni positive, di essere scelti più
                spesso dai Renter e, per gli Hubber, di accedere a programmi
                dedicati come il badge SuperHubber.
              </p>
            </div>
          </div>
        </section>

        {/* CONTENUTI E COMPORTAMENTI VIETATI */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
              Contenuti e comportamenti non ammessi
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-4 max-w-3xl">
              Per tutelare la community, alcuni comportamenti e contenuti sono
              espressamente vietati sulla piattaforma.
            </p>

            <ul className="list-disc list-inside text-gray-700 text-sm md:text-base space-y-2 max-w-3xl">
              <li className="text-justify">
                Linguaggio offensivo, minacce, molestie, discriminazione o
                incitamento all’odio.
              </li>
              <li className="text-justify">
                Pubblicazione di annunci falsi, ingannevoli o con informazioni
                volutamente incomplete.
              </li>
              <li className="text-justify">
                Tentativi di truffa, richieste di pagamento fuori piattaforma,
                schemi fraudolenti o attività illegali.
              </li>
              <li className="text-justify">
                Condivisione di dati sensibili propri o altrui in violazione
                della privacy.
              </li>
              <li className="text-justify">
                Utilizzo della piattaforma per scopi diversi da quelli previsti
                (ad esempio promuovere attività estranee al noleggio consentito).
              </li>
            </ul>
          </div>
        </section>

        {/* COMUNICAZIONE & CHAT INTERNA */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                Uso corretto della chat interna
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                La chat interna è lo strumento principale per comunicare in modo
                tracciato e sicuro. Ti invitiamo a utilizzarla sempre con
                professionalità.
              </p>

              <ul className="space-y-3 text-gray-700 text-sm md:text-base">
                <li className="text-justify">
                  Usa un tono cortese, anche in caso di incomprensioni.
                </li>
                <li className="text-justify">
                  Evita di condividere numeri di telefono, email o contatti esterni
                  prima che la piattaforma lo consenta.
                </li>
                <li className="text-justify">
                  Non inviare spam, contenuti pubblicitari non richiesti o link
                  sospetti.
                </li>
                <li className="text-justify">
                  In caso di conflitto, rimani sul piano dei fatti e, se necessario,
                  coinvolgi il supporto tramite le funzioni di assistenza.
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 shadow-sm border">
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">
                Perché è importante restare in piattaforma
              </h3>
              <p className="text-gray-600 text-sm md:text-base text-justify">
                Gestire comunicazioni e accordi all’interno di Renthubber permette
                di tutelare entrambe le parti in caso di contestazioni. Accordi
                presi fuori piattaforma possono non essere tracciabili e non
                garantire la stessa protezione.
              </p>
            </div>
          </div>
        </section>

        {/* RECENSIONI & FEEDBACK */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
              Recensioni e feedback
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-4 max-w-3xl">
              Le recensioni sono uno strumento fondamentale per creare fiducia
              all’interno della community. Ti invitiamo a utilizzarle in modo
              responsabile.
            </p>

            <ul className="list-disc list-inside text-gray-700 text-sm md:text-base space-y-2 max-w-3xl">
              <li className="text-justify">
                Esprimi il tuo giudizio in modo onesto, basandoti su fatti reali.
              </li>
              <li className="text-justify">
                Evita insulti o attacchi personali: descrivi l’esperienza, non la
                persona.
              </li>
              <li className="text-justify">
                Se ci sono stati problemi, prova prima a risolverli comunicando
                in modo diretto e rispettoso.
              </li>
              <li className="text-justify">
                Segnala eventuali recensioni palesemente false o offensive tramite
                gli strumenti di assistenza.
              </li>
            </ul>
          </div>
        </section>

        {/* CONSEGUENZE DELLE VIOLAZIONI */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                Violazioni delle linee guida
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Renthubber si riserva il diritto di intervenire in caso di
                comportamenti non conformi alle presenti linee guida o ai Termini
                di utilizzo della piattaforma.
              </p>

              <ul className="space-y-3 text-gray-700 text-sm md:text-base">
                <li className="text-justify">
                  Avvisi o richiami formali all’utente coinvolto.
                </li>
                <li className="text-justify">
                  Limitazioni temporanee all’utilizzo di alcune funzionalità.
                </li>
                <li className="text-justify">
                  Sospensione o chiusura definitiva dell’account nei casi più gravi.
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border">
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">
                Tutela della community
              </h3>
              <p className="text-gray-600 text-sm md:text-base text-justify">
                L’obiettivo degli interventi non è “punire”, ma proteggere la
                community, prevenire abusi e garantire un ambiente affidabile per
                chi utilizza Renthubber in modo corretto e responsabile.
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
              Contribuisci a una community migliore
            </h2>
            <p className="text-lg text-gray-200 mb-8 text-justify md:text-center">
              Ogni utente è parte attiva di Renthubber. Rispettare queste linee
              guida significa aiutare la piattaforma a crescere in modo sano,
              creando opportunità reali di condivisione e collaborazione.
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

export default LineeGuidaPage;
