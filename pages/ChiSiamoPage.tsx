import React from "react";
import { PageLayout } from "../components/PageLayout";

interface ChiSiamoPageProps {
  setView?: (view: string) => void;
}

export const ChiSiamoPage: React.FC<ChiSiamoPageProps> = () => {
  return (
  <PageLayout slug="SLUG" fallbackTitle="TITOLO">
    <div className="bg-gray-50">
      {/* HERO */}
      <section className="bg-white py-20 border-b">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Chi siamo
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto text-justify md:text-center">
            Renthubber nasce per rendere il noleggio di oggetti e spazi
            un gesto semplice, sicuro e sostenibile. Mettiamo in contatto
            persone e attività che vogliono condividere ciò che hanno,
            con chi ne ha bisogno in un preciso momento.
          </p>
        </div>
      </section>

      {/* SEZIONE – COS’È RENTHUBBER */}
      <section className="py-20 bg-white border-y">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
            Cos’è Renthubber
          </h2>
          <p className="text-gray-600 leading-relaxed text-justify mb-4 max-w-3xl">
            Renthubber è una piattaforma di sharing economy che permette a chiunque
            di mettere a disposizione o noleggiare oggetti, attrezzature e spazi:
            dal piccolo accessorio di uso quotidiano, alla sala per eventi, fino
            a mezzi e strumenti specializzati.
          </p>
          <p className="text-gray-600 leading-relaxed text-justify max-w-3xl">
            Il nostro obiettivo è ridurre sprechi, costi inutili e acquisti
            “una tantum”, valorizzando il riutilizzo e la condivisione in modo
            organizzato e tracciabile.
          </p>
        </div>
      </section>

      {/* SEZIONE – PERCHÉ È NATA LA PIATTAFORMA */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
              Perché è nata Renthubber
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-4">
              Ogni giorno oggetti e spazi restano inutilizzati, mentre altre
              persone li cercano solo per poche ore o pochi giorni. Da qui
              l’idea di creare un luogo digitale unico dove far incontrare
              chi ha qualcosa in più con chi ne ha bisogno.
            </p>
            <p className="text-gray-600 leading-relaxed text-justify">
              Renthubber vuole trasformare il noleggio in una scelta normale,
              comoda e vantaggiosa: per chi noleggia, che può risparmiare,
              e per chi mette a disposizione, che può generare un reddito
              extra dai propri beni.
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-sm border">
            <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">
              Condivisione, non spreco
            </h3>
            <p className="text-gray-600 text-sm md:text-base text-justify">
              Crediamo che un oggetto “fermo” sia un’opportunità persa. Attraverso
              il noleggio, lo stesso bene può essere utilizzato da più persone in
              momenti diversi, riducendo l’impatto ambientale e migliorando
              l’efficienza nelle spese di famiglie, professionisti e aziende.
            </p>
          </div>
        </div>
      </section>

      {/* SEZIONE – I NOSTRI VALORI */}
      <section className="py-20 bg-white border-y">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
            I valori su cui costruiamo Renthubber
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mt-6">
            <div className="bg-gray-50 rounded-xl p-6 border">
              <h3 className="text-lg font-bold text-gray-900 mb-2 text-left">
                Fiducia
              </h3>
              <p className="text-gray-600 text-sm md:text-base text-justify">
                Recensioni, profili completi e sistemi di verifica aiutano
                la community a riconoscere utenti affidabili e a costruire
                relazioni basate sul rispetto reciproco.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border">
              <h3 className="text-lg font-bold text-gray-900 mb-2 text-left">
                Sicurezza
              </h3>
              <p className="text-gray-600 text-sm md:text-base text-justify">
                Chat interna, pagamenti tracciati e regole chiare mirano a
                proteggere Renter e Hubber in ogni fase del noleggio.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border">
              <h3 className="text-lg font-bold text-gray-900 mb-2 text-left">
                Sostenibilità
              </h3>
              <p className="text-gray-600 text-sm md:text-base text-justify">
                Condividere invece di comprare sempre nuovo significa usare
                meglio le risorse, ridurre sprechi e generare valore in modo
                più consapevole.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEZIONE – RENTHUBBER & AMALIS GROUP */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
              Renthubber e Amalis Group S.r.l.
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify mb-4">
              Renthubber è un progetto sviluppato all’interno di{" "}
              <span className="font-semibold">Amalis Group S.r.l.</span>, una
              realtà che lavora su soluzioni innovative legate alla
              sostenibilità, ai servizi condivisi e a nuovi modelli di
              economia circolare.
            </p>
            <p className="text-gray-600 leading-relaxed text-justify">
              L’obiettivo è costruire una piattaforma solida, scalabile e
              in continua evoluzione, capace di crescere insieme alla
              community e di aprirsi, nel tempo, a nuovi mercati e nuove
              tipologie di noleggio.
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-sm border">
            <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">
              Uno sviluppo continuo
            </h3>
            <p className="text-gray-600 text-sm md:text-base text-justify">
              Aggiorniamo costantemente la piattaforma con nuove funzioni:
              filtri più intuitivi, dashboard più chiare, strumenti per
              gestire prenotazioni, pagamenti, recensioni e programmi
              dedicati come SuperHubber e Invita un amico.
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
            Diventa parte della community Renthubber
          </h2>
          <p className="text-lg text-gray-200 mb-8 text-justify md:text-center">
            Che tu voglia noleggiare ciò che ti serve solo per qualche ora
            o mettere a reddito ciò che già possiedi, Renthubber è il luogo
            giusto per iniziare. Crea il tuo account e inizia a condividere.
          </p>
          <a
            href="/login"
            className="inline-block px-8 py-3 rounded-full text-lg font-semibold bg-white text-[#0D414B] hover:bg-gray-100 transition"
          >
            Inizia ora
          </a>
        </div>
      </section>
    </div>
  </PageLayout>
  );
};

export default ChiSiamoPage;
