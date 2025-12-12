import React from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";

export const InvitaAmicoPage: React.FC = () => {
  return (
    <PageLayout slug="invita-un-amico" fallbackTitle="Invita un amico">
      <div className="bg-gray-50 text-gray-800">
        {/* HERO */}
        <section className="bg-white py-20 border-b">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold text-gray-900">
              Programma “Invita un amico”
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto text-justify md:text-center">
              Con il programma “Invita un amico” di Renthubber puoi far scoprire la
              piattaforma a nuove persone e ricevere un bonus nel wallet ogni volta
              che uno dei tuoi invitati effettua la sua prima prenotazione.
            </p>
          </div>
        </section>

        {/* COME FUNZIONA IN BREVE */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                Come funziona
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Il meccanismo è semplice: condividi il tuo link personale,
                il tuo amico si registra su Renthubber e, quando effettua la sua
                prima prenotazione andata a buon fine, sia tu che lui ricevete un
                bonus nel wallet da utilizzare sulla piattaforma.
              </p>
              <p className="text-gray-600 leading-relaxed text-justify">
                È un modo per premiare chi contribuisce a far crescere la community
                e, allo stesso tempo, offrire un vantaggio concreto ai nuovi utenti
                che iniziano a utilizzare Renthubber.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 shadow-sm border">
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">
                Vantaggi principali
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 text-sm md:text-base">
                <li className="text-justify">
                  Bonus nel wallet per ogni amico che completa la sua prima prenotazione.
                </li>
                <li className="text-justify">
                  Anche i tuoi amici ricevono un credito di benvenuto.
                </li>
                <li className="text-justify">
                  Nessun limite al numero di persone che puoi invitare (entro le policy).
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* PASSI PER L’UTENTE CHE INVITA */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                Se inviti un amico
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Se utilizzi Renthubber come Renter, Hubber o entrambi, puoi accedere
                alla sezione “Invita un amico” dal tuo account e iniziare a condividere
                il tuo link personale in pochi secondi.
              </p>

              <ol className="space-y-4 text-gray-700 text-sm md:text-base">
                <li className="text-justify">
                  <span className="font-semibold text-gray-900">
                    1. Vai nella tua area personale
                  </span>
                  <br />
                  Accedi alla dashboard e apri la sezione dedicata al programma “Invita un amico”.
                </li>
                <li className="text-justify">
                  <span className="font-semibold text-gray-900">
                    2. Copia il tuo link personale
                  </span>
                  <br />
                  Avrai un link unico associato al tuo profilo, pronto per essere condiviso.
                </li>
                <li className="text-justify">
                  <span className="font-semibold text-gray-900">
                    3. Condividilo con chi vuoi
                  </span>
                  <br />
                  Invia il link ai tuoi contatti via chat, email, social o come preferisci.
                </li>
                <li className="text-justify">
                  <span className="font-semibold text-gray-900">
                    4. Il tuo amico si registra e prenota
                  </span>
                  <br />
                  Quando uno degli invitati effettua la sua prima prenotazione andata a buon fine,
                  il sistema riconosce automaticamente il tuo invito.
                </li>
                <li className="text-justify">
                  <span className="font-semibold text-gray-900">
                    5. Ricevete entrambi il bonus
                  </span>
                  <br />
                  A prenotazione conclusa, il bonus viene accreditato sia sul tuo wallet
                  sia su quello del tuo amico.
                </li>
              </ol>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border">
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">
                Esempio di bonus
              </h3>
              <p className="text-gray-600 text-sm md:text-base text-justify mb-2">
                • Bonus standard per invito: 5€ per te e 5€ per il tuo amico  
                • Valore minimo della prima prenotazione: ad esempio 30€  
                • Accreditato solo dopo il completamento del noleggio
              </p>
              <p className="text-gray-600 text-sm md:text-base text-justify">
                Gli importi del bonus possono variare in base a promozioni attive o
                campagne speciali. L’ammontare attuale viene sempre indicato chiaramente
                nella sezione dedicata del tuo account.
              </p>
            </div>
          </div>
        </section>

        {/* COSA VEDE L’AMICO INVITATO */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            <div className="order-2 md:order-1">
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                Cosa succede per il tuo amico
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Chi riceve il tuo link non deve fare nulla di complicato: gli basta
                registrarsi da quel link e completare la sua prima prenotazione su
                Renthubber per ricevere il bonus di benvenuto nel wallet.
              </p>
              <ul className="space-y-3 text-gray-700 text-sm md:text-base">
                <li className="text-justify">
                  Vede una pagina di registrazione standard, con il riferimento
                  al fatto che è stato invitato da un amico.
                </li>
                <li className="text-justify">
                  Può utilizzare il bonus dal wallet per le prenotazioni successive,
                  secondo le condizioni indicate.
                </li>
                <li className="text-justify">
                  Ha accesso a tutte le funzionalità della piattaforma, senza limitazioni.
                </li>
              </ul>
            </div>

            <div className="order-1 md:order-2 bg-gray-50 rounded-xl p-8 shadow-sm border">
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">
                Un invito che genera valore per tutti
              </h3>
              <p className="text-gray-600 text-sm md:text-base text-justify">
                Il programma è pensato per premiare sia chi invita sia chi inizia
                a utilizzare la piattaforma. In questo modo, Renthubber cresce in modo
                organico, basandosi su utenti reali che trovano il servizio utile
                e lo consigliano ad altre persone.
              </p>
            </div>
          </div>
        </section>

        {/* REGOLE & LIMITI */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
              Regole principali del programma
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-4">
              Per mantenere il programma corretto e sostenibile, esistono alcune regole
              di base che tutti gli utenti devono rispettare.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 text-sm md:text-base">
              <li className="text-justify">
                Il bonus viene erogato solo dopo che la prima prenotazione
                dell’invitato è stata completata con successo.
              </li>
              <li className="text-justify">
                Non è consentito creare account fittizi, multipli o auto-invitarsi
                per ottenere bonus in modo non corretto.
              </li>
              <li className="text-justify">
                Renthubber si riserva il diritto di sospendere il programma o
                revocare bonus in caso di abusi o violazioni delle condizioni d’uso.
              </li>
              <li className="text-justify">
                Il bonus non è convertibile direttamente in denaro, ma utilizzabile
                per le funzionalità previste dalla piattaforma (ad es. prenotazioni).
              </li>
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
              Inizia a invitare i tuoi amici su Renthubber
            </h2>
            <p className="text-lg text-gray-200 mb-8 text-justify md:text-center">
              Accedi alla tua area personale, copia il tuo link di invito e condividilo
              con le persone che potrebbero trovare utile Renthubber. Ogni nuovo utente
              attivo è un valore in più per la community.
            </p>
            <Link to="/login" // o la tua route reale per accedere all'account
              className="inline-block px-8 py-3 rounded-full text-lg font-semibold bg-white text-[#0D414B] hover:bg-gray-100 transition"
            >
              Vai alla tua area personale
            </Link>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default InvitaAmicoPage;
