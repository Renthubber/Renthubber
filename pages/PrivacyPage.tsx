import React from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";

const LAST_UPDATED = "12 dicembre 2025";

export const PrivacyPage: React.FC = () => {
  return (
    <PageLayout slug="privacy-policy" fallbackTitle="Privacy Policy">
      <div className="bg-gray-50 text-gray-800">
        {/* HERO */}
        <section className="bg-white py-20 border-b">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold text-gray-900">
              Informativa sulla Privacy
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              Ultimo aggiornamento:{" "}
              <span className="font-medium">{LAST_UPDATED}</span>
            </p>

            <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto text-justify md:text-center">
              La presente Informativa descrive le modalità di trattamento dei
              dati personali degli utenti che accedono e utilizzano la
              piattaforma <span className="font-semibold">Renthubber</span>, ai
              sensi del Regolamento (UE) 2016/679 (“GDPR”).
            </p>
          </div>
        </section>

        {/* INDICE */}
       <section className="py-10 bg-white border-b">
  <div className="max-w-6xl mx-auto px-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
      Indice
    </h2>
<div className="grid md:grid-cols-2 gap-2 text-sm max-w-2xl mx-auto">
      {[
        ["#titolare", "1. Titolare del trattamento"],
        ["#dati", "2. Tipologie di dati raccolti"],
        ["#finalita", "3. Finalità del trattamento"],
        ["#base", "4. Base giuridica"],
        ["#modalita", "5. Modalità di trattamento"],
        ["#conservazione", "6. Conservazione dei dati"],
        ["#destinatari", "7. Comunicazione dei dati"],
        ["#trasferimenti", "8. Trasferimenti extra UE"],
        ["#diritti", "9. Diritti dell'interessato"],
        ["#cookie", "10. Cookie e tracciamento"],
        ["#sicurezza", "11. Sicurezza dei dati"],
        ["#minori", "12. Dati di minori"],
        ["#automatizzati", "13. Processi automatizzati"],
        ["#aggiornamenti", "14. Aggiornamenti"],
        ["#contatti", "15. Contatti"],
      ].map(([href, label]) => (
        <a
          key={href}
          href={href}
          className="text-[#0D414B] hover:underline"
        >
          {label}
        </a>
      ))}
    </div>
  </div>
</section>

        {/* CONTENUTO */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-6">
            <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-10">

              {/* 1 */}
              <div id="titolare" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  1. Titolare del trattamento
                </h2>
                <div className="bg-gray-50 border rounded-xl p-5">
                  <p className="font-semibold text-gray-900">Amalis Group Srl</p>
                  <p className="text-gray-700">
                    Via San Nicola, snc – 95040 Camporotondo Etneo (CT), Italia
                  </p>
                  <p className="text-gray-700">P.IVA 06169160873</p>
                  <p className="text-gray-700">
                    Email privacy:{" "}
                    <a
                      href="mailto:privacy@renthubber.com"
                      className="text-[#0D414B] hover:underline"
                    >
                      privacy@renthubber.com
                    </a>
                  </p>
                </div>
              </div>

              {/* 2 */}
              <div id="dati" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  2. Tipologie di dati raccolti
                </h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Dati identificativi e di contatto</li>
                  <li>Dati di accesso e autenticazione (log, IP)</li>
                  <li>Dati relativi ad annunci, messaggi e recensioni</li>
                  <li>Dati di pagamento (gestiti da provider terzi)</li>
                  <li>Dati fiscali e contabili</li>
                  <li>
                    Dati wallet e crediti (bonus, referral, rimborsi interni)
                  </li>
                  <li>Dati tecnici di navigazione e cookie</li>
                </ul>
              </div>

              {/* 3 */}
              <div id="finalita" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  3. Finalità del trattamento
                </h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Registrazione e gestione dell’account</li>
                  <li>Gestione annunci, prenotazioni e transazioni</li>
                  <li>Adempimenti legali, fiscali e contabili</li>
                  <li>Assistenza clienti e comunicazioni di servizio</li>
                  <li>Prevenzione frodi e sicurezza della piattaforma</li>
                  <li>Marketing e newsletter (solo previo consenso)</li>
                  <li>Analisi statistiche e miglioramento dei servizi</li>
                </ul>
              </div>

              {/* 4 */}
              <div id="base" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  4. Base giuridica del trattamento
                </h2>
                <p className="text-gray-700 leading-relaxed text-justify">
                  Il trattamento si fonda su: esecuzione di un contratto,
                  adempimento di obblighi di legge, legittimo interesse del
                  Titolare e, ove richiesto, consenso espresso dell’utente.
                </p>
              </div>

              {/* 5 */}
              <div id="modalita" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  5. Modalità del trattamento
                </h2>
                <p className="text-gray-700 leading-relaxed text-justify">
                  I dati sono trattati con strumenti informatici e telematici,
                  adottando misure tecniche e organizzative adeguate a garantire
                  la sicurezza e la riservatezza.
                </p>
              </div>

              {/* 6 */}
              <div id="conservazione" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  6. Conservazione dei dati
                </h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Dati account: fino a richiesta di cancellazione</li>
                  <li>Dati fiscali e contabili: 10 anni</li>
                  <li>Dati marketing: fino a revoca del consenso</li>
                  <li>Log tecnici e sicurezza: fino a 24 mesi</li>
                </ul>
              </div>

              {/* 7 */}
              <div id="destinatari" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  7. Comunicazione dei dati
                </h2>
                <p className="text-gray-700 leading-relaxed text-justify">
                  I dati possono essere comunicati a fornitori tecnici, provider
                  di pagamento, consulenti e autorità competenti, nei limiti
                  delle finalità indicate. I dati non sono venduti né diffusi.
                </p>
              </div>

              {/* 8 */}
              <div id="trasferimenti" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  8. Trasferimenti di dati extra UE
                </h2>
                <p className="text-gray-700 leading-relaxed text-justify">
                  Eventuali trasferimenti verso Paesi extra UE avvengono nel
                  rispetto degli artt. 44–49 GDPR, mediante garanzie adeguate.
                </p>
              </div>

              {/* 9 */}
              <div id="diritti" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  9. Diritti dell’interessato
                </h2>
                <p className="text-gray-700 leading-relaxed text-justify">
                  L’utente può esercitare i diritti di accesso, rettifica,
                  cancellazione, limitazione, opposizione, portabilità e revoca
                  del consenso, nonché proporre reclamo al Garante Privacy.
                </p>
              </div>

              {/* 10 */}
              <div id="cookie" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  10. Cookie e strumenti di tracciamento
                </h2>
                <p className="text-gray-700 leading-relaxed text-justify">
                  Renthubber utilizza cookie tecnici necessari e, previo consenso,
                  cookie analitici e di marketing. Per maggiori dettagli consulta
                  la Cookie Policy.
                </p>
              </div>

              {/* 11 */}
              <div id="sicurezza" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  11. Sicurezza dei dati
                </h2>
                <p className="text-gray-700 leading-relaxed text-justify">
                  Il Titolare adotta misure di sicurezza avanzate (HTTPS, backup,
                  cifratura password, accessi controllati). In caso di data
                  breach saranno applicate le procedure previste dal GDPR.
                </p>
              </div>

              {/* 12 */}
              <div id="minori" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  12. Dati di minori
                </h2>
                <p className="text-gray-700 leading-relaxed text-justify">
                  I servizi sono riservati a utenti maggiorenni. Eventuali dati
                  di minori raccolti per errore saranno cancellati.
                </p>
              </div>

              {/* 13 */}
              <div id="automatizzati" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  13. Processi decisionali automatizzati
                </h2>
                <p className="text-gray-700 leading-relaxed text-justify">
                  Renthubber non adotta decisioni automatizzate con effetti
                  giuridici vincolanti. Eventuali sistemi di suggerimento o
                  sicurezza non producono effetti automatici definitivi.
                </p>
              </div>

              {/* 14 */}
              <div id="aggiornamenti" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  14. Aggiornamenti dell’informativa
                </h2>
                <p className="text-gray-700 leading-relaxed text-justify">
                  La presente Privacy Policy può essere aggiornata. La versione
                  aggiornata è sempre disponibile su questa pagina.
                </p>
              </div>

              {/* 15 */}
              <div id="contatti" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  15. Contatti
                </h2>
                <div className="bg-gray-50 border rounded-xl p-5">
                  <p className="font-semibold text-gray-900">Amalis Group Srl</p>
                  <p className="text-gray-700">
                    Via San Nicola, snc – 95040 Camporotondo Etneo (CT), Italia
                  </p>
                  <p className="text-gray-700">P.IVA 06169160873</p>
                  <p className="text-gray-700">
                    Email privacy:{" "}
                    <a
                      href="mailto:privacy@renthubber.com"
                      className="text-[#0D414B] hover:underline"
                    >
                      privacy@renthubber.com
                    </a>
                  </p>
                </div>
              </div>

            </div>

            <div className="mt-8 flex justify-between items-center">
              <a href="#titolare" className="text-[#0D414B] hover:underline text-sm">
                ↑ Torna in alto
              </a>
              <Link to="/"
                className="inline-flex justify-center px-6 py-3 rounded-full text-sm font-semibold bg-[#0D414B] text-white hover:opacity-95 transition"
              >
                Torna alla home
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default PrivacyPage;
