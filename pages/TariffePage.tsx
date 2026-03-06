import React from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";

export const TariffePage: React.FC = () => {
  return (
    <PageLayout slug="tariffe" fallbackTitle="Tariffe & Commissioni">
      <div className="bg-gray-50 text-gray-800">
        {/* HERO */}
        <section className="bg-white py-20 border-b">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold text-gray-900">
              Tariffe & Commissioni
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto text-justify md:text-center">
              Renthubber è pensato per essere trasparente su prezzi, commissioni e
              costi aggiuntivi. In questa pagina trovi una panoramica chiara di come
              funzionano le tariffe per Renter e Hubber.
            </p>
          </div>
        </section>

        {/* PANORAMICA GENERALE */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                Struttura delle tariffe
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Ogni noleggio su Renthubber genera una transazione composta da:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 text-sm md:text-base">
                <li className="text-justify">
                  <span className="font-semibold">Importo di noleggio</span>: stabilito
                  dall’Hubber in base al valore dell’oggetto/spazio e alla durata.
                </li>
                <li className="text-justify">
                  <span className="font-semibold">Commissione Renthubber</span>: una
                  piccola percentuale che rende sostenibile la piattaforma.
                </li>
                <li className="text-justify">
                  <span className="font-semibold">Eventuali costi extra</span>: ad esempio
                  assicurazione, pulizia o servizi aggiuntivi, se previsti.
                </li>
              </ul>
              <p className="text-gray-600 leading-relaxed text-justify mt-4">
                Prima di confermare qualsiasi prenotazione, Renter e Hubber vedono sempre
                un riepilogo chiaro e dettagliato di tutti gli importi.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 shadow-sm border">
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">
                Trasparenza prima di tutto
              </h3>
              <p className="text-gray-600 text-sm md:text-base text-justify">
                Nessun costo nascosto, nessuna sorpresa dopo. Ogni cifra è mostrata
                prima della conferma della prenotazione, con il dettaglio di ciò che
                va all’Hubber e ciò che rappresenta la commissione di piattaforma.
              </p>
            </div>
          </div>
        </section>

        {/* TARIFFE PER IL RENTER */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                Tariffe per chi noleggia (Renter)
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Come Renter, paghi l’importo di noleggio definito dall’Hubber più una
                piccola commissione di servizio che contribuisce a garantire sicurezza,
                supporto e manutenzione della piattaforma.
              </p>
              <ul className="space-y-3 text-gray-700 text-sm md:text-base">
                <li className="text-justify">
                  <span className="font-semibold">Commissione di servizio</span>: una
                  percentuale variabile in base alla categoria e alla durata del noleggio.
                </li>
                <li className="text-justify">
                  <span className="font-semibold">Assicurazione (se prevista)</span>:
                  può essere aggiunta come voce separata per coprire determinati rischi.
                </li>
                <li className="text-justify">
                  <span className="font-semibold">Eventuali costi extra</span>:
                  ad esempio pulizia, consegna o servizi opzionali, sempre mostrati in
                  modo esplicito.
                </li>
              </ul>
              <p className="text-gray-600 leading-relaxed text-justify mt-4">
                L’importo totale che vedi in fase di conferma è quello che verrà
                addebitato: non ci sono aggiunte inaspettate dopo la prenotazione.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border">
  <h3 className="text-xl font-bold text-gray-900 mb-4 text-left">
    Esempio per il Renter
  </h3>
  <div className="space-y-2 mb-4">
    <div className="flex justify-between text-gray-700">
      <span>Noleggio attrezzatura</span>
      <span className="font-medium">€50,00</span>
    </div>
    <div className="flex justify-between text-gray-700">
      <span>Commissione servizio (10% + €2)</span>
      <span className="font-medium">€7,00</span>
    </div>
    <div className="border-t pt-2 flex justify-between text-gray-900 font-bold">
      <span>Totale da pagare</span>
      <span>€57,00</span>
    </div>
  </div>
  <p className="text-gray-600 text-sm text-justify mb-3">
  L'importo totale che vedi in fase di conferma è quello che verrà
  addebitato: non ci sono aggiunte inaspettate dopo la prenotazione.
</p>
<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
  <p className="text-xs font-semibold text-gray-700 mb-2">Come funzionano le commissioni:</p>
  <ul className="text-xs text-gray-600 space-y-1">
    <li>• <strong>Commissione:</strong> 10% + fee fissa (€0,50 fino a €8, €2 oltre)</li>
  </ul>
</div>
            </div>
          </div>
        </section>

        {/* TARIFFE PER L’HUBBER */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            <div className="order-2 md:order-1">
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-left">
                Tariffe per chi mette a disposizione (Hubber)
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Come Hubber, pubblichi gratuitamente i tuoi annunci e paghi una
                commissione solo quando ricevi una prenotazione andata a buon fine.
              </p>
              <ul className="space-y-3 text-gray-700 text-sm md:text-base">
                <li className="text-justify">
                  <span className="font-semibold">
                    Commissione sulla prenotazione
                  </span>
                  : una percentuale dell’importo di noleggio, trattenuta
                  automaticamente da Renthubber.
                </li>
                <li className="text-justify">
                  <span className="font-semibold">
                    Nessun costo di pubblicazione
                  </span>
                  : puoi creare e gestire i tuoi annunci senza costi fissi.
                </li>
                <li className="text-justify">
                  <span className="font-semibold">Strumenti inclusi</span>:
                  dashboard, calendario, gestione richieste, recensioni e
                  statistiche sono compresi nella commissione.
                </li>
              </ul>
              <p className="text-gray-600 leading-relaxed text-justify mt-4">
                In questo modo paghi solo quando guadagni, con costi proporzionati
                all’utilizzo reale della piattaforma.
              </p>
            </div>

            <div className="order-1 md:order-2 bg-gray-50 rounded-xl p-8 shadow-sm border">
  <h3 className="text-xl font-bold text-gray-900 mb-4 text-left">
    Esempio per l'Hubber
  </h3>
  <div className="space-y-2 mb-4">
    <div className="flex justify-between text-gray-700">
      <span>Importo noleggio</span>
      <span className="font-medium">€50,00</span>
    </div>
    <div className="flex justify-between text-gray-700">
      <span>Commissione piattaforma (10% + €2)</span>
      <span className="font-medium text-red-600">-€7,00</span>
    </div>
    <div className="border-t pt-2 flex justify-between text-gray-900 font-bold">
      <span>Importo netto Hubber</span>
      <span>€43,00</span>
    </div>
  </div>
 <p className="text-gray-600 text-sm text-justify mb-3">
  L'Hubber riceve l'importo di noleggio al netto delle commissioni previste.
</p>
<div className="bg-white rounded-lg p-4 border border-gray-200">
  <p className="text-xs font-semibold text-gray-700 mb-2">Come funzionano le commissioni:</p>
  <ul className="text-xs text-gray-600 space-y-1">
    <li>• <strong>Hubber standard:</strong> 10% + fee fissa (€0,50 fino a €10, €2 oltre)</li>
    <li>• <strong>SuperHubber:</strong> 8% + fee fissa (€0,50 fino a €10, €2 oltre)</li>
  </ul>
</div>
            </div>
          </div>
        </section>

        {/* SEZIONE COSTI EXTRA & PROMO */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
                Costi extra e servizi aggiuntivi
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Alcune categorie possono prevedere costi extra opzionali come pulizia,
                consegna a domicilio, montaggio o supporto tecnico. Queste voci sono
                sempre indicate in modo chiaro all’interno dell’annuncio.
              </p>
              <p className="text-gray-600 leading-relaxed text-justify">
                L’Hubber è tenuto a specificare ogni eventuale costo aggiuntivo in
                anticipo, evitando supplementi non concordati dopo la prenotazione.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-left">
                Promozioni, sconti e coupon
              </h2>
              <p className="text-gray-600 leading-relaxed text-justify mb-4">
                Periodicamente Renthubber può attivare codici sconto, promozioni
                dedicate o campagne “Invita un amico”. In questi casi, le riduzioni
                applicate sono visibili direttamente nel riepilogo del pagamento.
              </p>
              <p className="text-gray-600 leading-relaxed text-justify">
                Gli sconti non alterano la trasparenza dei prezzi: vedrai sempre
                l’importo originale, lo sconto applicato e il totale finale.
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
              Trasparenza prima di confermare, sempre
            </h2>
            <p className="text-lg text-gray-200 mb-8 text-justify md:text-center">
              Prima di ogni prenotazione hai a disposizione un riepilogo completo
              di tutti i costi. Il nostro obiettivo è che tu sappia sempre quanto
              paghi, perché lo paghi e quanto guadagni.
            </p>
            <Link to="/Signup" // sostituisci con la tua route reale
              className="inline-block px-8 py-3 rounded-full text-lg font-semibold bg-white text-[#0D414B] hover:bg-gray-100 transition"
            >
              Inizia a usare Renthubber
            </Link>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default TariffePage;
