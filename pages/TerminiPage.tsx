import React from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";

const LAST_UPDATED = "12 dicembre 2025";

export const TerminiPage: React.FC = () => {
  return (
    <PageLayout slug="termini-condizioni" fallbackTitle="Termini e Condizioni d’Uso e di Noleggio">
      <div className="bg-gray-50 text-gray-800">
        {/* HERO */}
        <section className="bg-white py-20 border-b">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold text-gray-900">
              Termini e Condizioni d’Uso e di Noleggio
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              Ultimo aggiornamento: <span className="font-medium">{LAST_UPDATED}</span>
            </p>

            <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto text-justify md:text-center">
              I presenti Termini (di seguito, “Termini”) regolano l’accesso e l’utilizzo
              della piattaforma Renthubber da parte degli utenti, siano essi{" "}
              <span className="font-semibold">Renter</span> (chi utilizza) o{" "}
              <span className="font-semibold">Hubber</span> (chi mette a disposizione beni o spazi).
              L’uso della Piattaforma implica l’accettazione dei presenti Termini, della Privacy Policy
              e della Cookie Policy.
            </p>

            {/* Quick highlight box */}
            <div className="mt-8 max-w-4xl mx-auto bg-gray-50 border rounded-2xl p-6 text-left shadow-sm">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Spazi ammessi</p>
                  <p className="text-sm text-gray-600">
                    Solo spazi privati o commerciali per uso temporaneo (non ricettivi).
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Commissioni</p>
                  <p className="text-sm text-gray-600">
                    10% Renter + 10% Hubber + fee fissa €2 / transazione.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Ruolo di Renthubber</p>
                  <p className="text-sm text-gray-600">
                    Intermediario tecnologico, non parte del contratto tra utenti.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* INDICE */}
        <section className="py-10 bg-white border-b">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Indice</h2>
            <div className="grid md:grid-cols-2 gap-2 text-sm">
              {[
                ["#titolare", "1. Titolare della piattaforma"],
                ["#oggetto", "2. Oggetto del servizio"],
                ["#definizioni", "3. Definizioni"],
                ["#requisiti", "4. Requisiti di accesso"],
                ["#ruolo", "5. Ruolo di Renthubber"],
                ["#account", "6. Registrazione e account"],
                ["#annunci", "7. Pubblicazione annunci"],
                ["#prenotazioni", "8. Prenotazioni"],
                ["#pagamenti", "9. Pagamenti, commissioni e fee fissa"],
                ["#cauzione", "10. Cauzione e responsabilità"],
                ["#consegna", "11. Consegna/ritardi e accesso spazi"],
                ["#accessori", "12. Costi accessori (pulizia, carburante, ecc.)"],
                ["#danni", "13. Danni e malfunzionamenti"],
                ["#cancellazioni", "14. Cancellazioni e rimborsi"],
                ["#assicurazioni", "15. Assicurazioni"],
                ["#corretto", "16. Uso corretto e divieto di elusione"],
                ["#recensioni", "17. Recensioni"],
                ["#ip", "18. Proprietà intellettuale"],
                ["#privacy", "19. Privacy"],
                ["#responsabilita", "20. Limitazione di responsabilità"],
                ["#modifiche", "21. Modifiche ai termini"],
                ["#foro", "22. Legge applicabile e foro competente"],
                ["#contatti", "23. Contatti"],
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
            {/* helper */}
            <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-10">

              {/* 1 */}
              <div id="titolare" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Titolare della piattaforma</h2>
                <p className="text-gray-700 leading-relaxed text-justify">
                  Il sito e la piattaforma digitale <span className="font-semibold">Renthubber</span> (di seguito, “Piattaforma”)
                  sono gestiti da:
                </p>
                <div className="mt-4 bg-gray-50 border rounded-xl p-5">
                  <p className="font-semibold text-gray-900">Amalis Group Srl</p>
                  <p className="text-gray-700">Via San Nicola, snc – 95040 Camporotondo Etneo (CT), Italia</p>
                  <p className="text-gray-700">P.IVA 06169160873</p>
                  <p className="text-gray-700">
                    Email:{" "}
                    <a className="text-[#0D414B] hover:underline" href="mailto:support@renthubber.com">
                      support@renthubber.com
                    </a>
                  </p>
                </div>
              </div>

              {/* 2 */}
              <div id="oggetto" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Oggetto del servizio</h2>
                <p className="text-gray-700 leading-relaxed text-justify">
                  Renthubber consente l’incontro tra utenti che desiderano noleggiare, concedere in uso o condividere:
                </p>
                <ul className="list-disc list-inside mt-3 text-gray-700 space-y-2">
                  <li className="text-justify">
                    <span className="font-semibold">Beni mobili</span> (attrezzature, strumenti, costumi, accessori, veicoli e simili, ove consentiti);
                  </li>
                  <li className="text-justify">
                    <span className="font-semibold">Spazi ad uso temporaneo</span> di tipo privato o commerciale (es. sale, locali, aree, terreni, spazi produttivi/ricreativi).
                  </li>
                </ul>

                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <p className="font-semibold text-amber-900 mb-2">
                    Esclusione ospitalità/alloggio (importante)
                  </p>
                  <p className="text-amber-900 leading-relaxed text-justify">
                    Gli “Spazi” presenti su Renthubber non includono e non possono includere immobili o servizi destinati
                    all’alloggio, al pernottamento o all’ospitalità. Sono pertanto esclusi: immobili residenziali, case vacanze,
                    affitti brevi, bed &amp; breakfast, hotel, residence o strutture ricettive assimilabili. Renthubber non consente
                    né intermedia servizi di alloggio o pernottamento.
                  </p>
                </div>

                <p className="mt-6 text-gray-700 leading-relaxed text-justify">
                  Renthubber non è parte contrattuale del contratto tra chi pubblica un annuncio e chi prenota.
                  Il Gestore fornisce un servizio di intermediazione tecnologica e strumenti digitali per facilitare comunicazioni
                  e transazioni tra utenti.
                </p>
              </div>

              {/* 3 */}
              <div id="definizioni" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. Definizioni</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li className="text-justify"><span className="font-semibold">Utente</span>: chiunque si registri alla Piattaforma.</li>
                  <li className="text-justify"><span className="font-semibold">Hubber / Proprietario / Inserzionista</span>: utente che pubblica un annuncio e mette a noleggio/uso un bene o uno spazio.</li>
                  <li className="text-justify"><span className="font-semibold">Renter / Utilizzatore / Locatario</span>: utente che prenota e utilizza un bene o uno spazio.</li>
                  <li className="text-justify"><span className="font-semibold">Annuncio</span>: scheda descrittiva con prezzo, disponibilità, condizioni, regole d’uso, eventuale cauzione e costi accessori.</li>
                  <li className="text-justify"><span className="font-semibold">Commissione di servizio</span>: percentuale trattenuta da Renthubber per ogni transazione.</li>
                  <li className="text-justify"><span className="font-semibold">Fee fissa</span>: importo fisso per transazione (vedi art. 9).</li>
                  <li className="text-justify"><span className="font-semibold">Deposito cauzionale (Cauzione)</span>: somma eventuale a garanzia di danni o mancata restituzione.</li>
                  <li className="text-justify"><span className="font-semibold">Wallet</span>: portafoglio digitale interno che può gestire crediti, bonus, rimborsi o importi tecnici secondo le regole di piattaforma.</li>
                </ul>
              </div>

              {/* 4 */}
              <div id="requisiti" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Requisiti di accesso</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li className="text-justify">Avere almeno 18 anni;</li>
                  <li className="text-justify">Fornire dati veri, aggiornati e verificabili;</li>
                  <li className="text-justify">Accettare Termini, Privacy Policy, Cookie Policy e regole richiamate;</li>
                  <li className="text-justify">Non utilizzare la Piattaforma per scopi illeciti o fraudolenti.</li>
                </ul>
                <p className="mt-4 text-gray-700 leading-relaxed text-justify">
                  Renthubber può sospendere o chiudere account in caso di violazioni o sospetti abusi.
                </p>
              </div>

              {/* 5 */}
              <div id="ruolo" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Ruolo di Renthubber (intermediario tecnologico)</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li className="text-justify">Renthubber non possiede i beni/spazi offerti;</li>
                  <li className="text-justify">Non garantisce qualità, sicurezza, conformità o idoneità dei beni/spazi;</li>
                  <li className="text-justify">Non garantisce solvibilità, affidabilità o identità degli utenti oltre gli strumenti eventualmente previsti;</li>
                  <li className="text-justify">Non risponde di danni, ritardi o inadempimenti derivanti dal rapporto tra Hubber e Renter.</li>
                </ul>
                <p className="mt-4 text-gray-700 leading-relaxed text-justify">
                  Il contratto di noleggio/uso si perfeziona direttamente tra Hubber e Renter, che restano responsabili delle rispettive obbligazioni.
                </p>
              </div>

              {/* 6 */}
              <div id="account" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Registrazione e account</h2>
                <p className="text-gray-700 leading-relaxed text-justify">
                  L’Utente è responsabile della riservatezza delle credenziali e delle attività svolte tramite il proprio account.
                  Renthubber può adottare misure di sicurezza (es. verifiche, limitazioni temporanee, sospensioni) in caso di uso anomalo o potenzialmente fraudolento.
                </p>
              </div>

              {/* 7 */}
              <div id="annunci" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Pubblicazione degli annunci</h2>
                <p className="text-gray-700 leading-relaxed text-justify">
                  Gli annunci devono essere chiari, completi e veritieri. L’Hubber si impegna a descrivere correttamente bene/spazio,
                  indicare prezzo, disponibilità, eventuale cauzione e costi accessori, e caricare foto reali e aggiornate.
                </p>
                <p className="mt-4 text-gray-700 leading-relaxed text-justify">
                  Sono vietati annunci relativi a beni/spazi illegali, pericolosi, offensivi, contraffatti o non conformi.
                  Renthubber può rimuovere annunci non conformi e sospendere l’account.
                </p>

                <div className="mt-6 bg-gray-50 border rounded-xl p-5">
                  <p className="font-semibold text-gray-900 mb-2">7.1 Dichiarazione specifica sugli “Spazi”</p>
                  <p className="text-gray-700 leading-relaxed text-justify">
                    L’Hubber dichiara e garantisce che gli spazi pubblicati non sono destinati ad alloggio/pernottamento/ospitalità turistica o residenziale
                    e che l’uso proposto è conforme alla normativa vigente (sicurezza, autorizzazioni, capienze, destinazioni d’uso, ecc.).
                  </p>
                </div>
              </div>

              {/* 8 */}
              <div id="prenotazioni" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Prenotazioni e accordo vincolante</h2>
                <p className="text-gray-700 leading-relaxed text-justify">
                  La prenotazione effettuata tramite la Piattaforma costituisce impegno vincolante tra Hubber e Renter alle condizioni dell’annuncio
                  e dei presenti Termini. Le parti devono concordare e rispettare tempi, modalità di consegna/ritiro (beni) o accesso/uso (spazi), regole e divieti.
                </p>
              </div>

              {/* 9 */}
              <div id="pagamenti" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Pagamenti, commissioni e fee fissa</h2>
                <p className="text-gray-700 leading-relaxed text-justify">
                  I pagamenti possono essere gestiti tramite provider terzi (es. Stripe o equivalenti). Renthubber non conserva i dati completi delle carte.
                </p>
                <div className="mt-4 bg-gray-50 border rounded-xl p-5">
                  <p className="font-semibold text-gray-900 mb-2">Commissioni applicate</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li className="text-justify"><span className="font-semibold">10%</span> a carico del <span className="font-semibold">Renter</span> sull’importo totale del noleggio/uso;</li>
                    <li className="text-justify"><span className="font-semibold">10%</span> a carico dell’<span className="font-semibold">Hubber</span> sull’importo totale del noleggio/uso;</li>
                    <li className="text-justify"><span className="font-semibold">Fee fissa di gestione: € 2,00</span> per transazione.</li>
                  </ul>
                  <p className="mt-3 text-gray-700 leading-relaxed text-justify">
                    Le commissioni e la fee fissa sono trattenute automaticamente e coprono costi tecnici, assistenza e gestione operativa.
                  </p>
                </div>
              </div>

              {/* 10 */}
              <div id="cauzione" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">10. Cauzione, responsabilità d’uso e verifiche</h2>
                <p className="text-gray-700 leading-relaxed text-justify">
                  Se prevista, la cauzione è a garanzia di danni, mancanze o ritardi. Il Renter è responsabile del bene/spazio per tutta la durata dell’utilizzo
                  e deve restituire/lasciare nelle condizioni concordate (salvo normale usura). Le parti sono invitate a documentare (foto/video) lo stato di consegna e riconsegna.
                </p>
              </div>

              {/* 11 */}
              <div id="consegna" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">11. Consegna, riconsegna e ritardi / Accesso e ritardi (spazi)</h2>
                <p className="text-gray-700 leading-relaxed text-justify">
                  Luogo e orario sono concordati tra le parti. Salvo diversa indicazione nell’annuncio: tolleranza di 30 minuti; oltre, può applicarsi
                  una penale pari a 1/10 del prezzo giornaliero per ogni ora di ritardo. In caso di mancata restituzione o abuso, l’Hubber può attivare segnalazione e richiedere assistenza.
                </p>
              </div>

              {/* 12 */}
              <div id="accessori" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">12. Fee di pulizia, carburante e spese accessorie</h2>
                <p className="text-gray-700 leading-relaxed text-justify">
                  Eventuali costi aggiuntivi (pulizia, carburante, manutenzione, consumabili, servizi extra) devono essere indicati nell’annuncio e restano regolati tra le parti.
                </p>
              </div>

              {/* 13 */}
              <div id="danni" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">13. Danni, smarrimenti e malfunzionamenti</h2>
                <p className="text-gray-700 leading-relaxed text-justify">
                  Il Renter risponde di danni, smarrimenti o uso improprio. L’Hubber deve documentare l’evento con prove. Renthubber può fornire supporto e mediazione tecnica,
                  ma non è parte contrattuale.
                </p>
              </div>

              {/* 14 */}
              <div id="cancellazioni" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">14. Cancellazioni e rimborsi</h2>
                <p className="text-gray-700 leading-relaxed text-justify">
                  Le cancellazioni e i rimborsi sono disciplinati dalla pagina “Regole di cancellazione” e/o da quanto indicato nell’annuncio, che costituiscono parte integrante dei presenti Termini.
                  In caso di conflitto, prevale quanto indicato nell’annuncio, salvo disposizioni inderogabili di legge.
                </p>
              </div>

              {/* 15 */}
              <div id="assicurazioni" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">15. Assicurazioni</h2>
                <p className="text-gray-700 leading-relaxed text-justify">
                  Salvo diversa indicazione, beni e spazi non sono coperti da assicurazione inclusiva. L’Hubber è responsabile dell’eventuale copertura e deve informare il Renter.
                  Renthubber non fornisce polizze dirette, salvo future integrazioni esplicitamente indicate.
                </p>
              </div>

              {/* 16 */}
              <div id="corretto" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">16. Uso corretto della piattaforma e divieto di elusione</h2>
                <p className="text-gray-700 leading-relaxed text-justify">
                  È vietato eludere la Piattaforma per evitare commissioni, inserire contenuti falsi/illeciti o utilizzare Renthubber per frodi o molestie.
                  Renthubber può sospendere/chiudere account e annullare operazioni in caso di violazioni.
                </p>
              </div>

              {/* 17 */}
              <div id="recensioni" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">17. Recensioni e feedback</h2>
                <p className="text-gray-700 leading-relaxed text-justify">
                  Recensioni e feedback devono essere veritieri e rispettosi. Renthubber può rimuovere contenuti falsi, offensivi o non conformi alle regole.
                  È vietato offrire vantaggi in cambio di recensioni positive.
                </p>
              </div>

              {/* 18 */}
              <div id="ip" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">18. Proprietà intellettuale</h2>
                <p className="text-gray-700 leading-relaxed text-justify">
                  Testi, loghi, grafica, layout e software della Piattaforma sono di proprietà del Gestore o dei rispettivi titolari.
                  È vietato l’uso non autorizzato.
                </p>
              </div>

              {/* 19 */}
              <div id="privacy" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">19. Privacy e trattamento dati</h2>
                <p className="text-gray-700 leading-relaxed text-justify">
                  Il trattamento dei dati personali avviene secondo la Privacy Policy e la Cookie Policy pubblicate sul sito, che costituiscono parte integrante dei presenti Termini.
                </p>
              </div>

              {/* 20 */}
              <div id="responsabilita" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">20. Limitazione di responsabilità</h2>
                <p className="text-gray-700 leading-relaxed text-justify">
                  Renthubber non garantisce continuità e assenza di errori del servizio. Il Gestore non è responsabile per danni diretti o indiretti derivanti da
                  interruzioni, eventi di forza maggiore, condotte degli utenti o inadempimenti tra Hubber e Renter.
                </p>
                <p className="mt-4 text-gray-700 leading-relaxed text-justify">
                  La responsabilità complessiva del Gestore non potrà superare, per la transazione contestata, l’importo delle commissioni e fee effettivamente percepite.
                </p>
              </div>

              {/* 21 */}
              <div id="modifiche" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">21. Modifiche ai termini</h2>
                <p className="text-gray-700 leading-relaxed text-justify">
                  Renthubber può aggiornare i presenti Termini. Le modifiche sono efficaci dalla data di pubblicazione. L’uso continuato del servizio dopo le modifiche implica accettazione.
                </p>
              </div>

              {/* 22 */}
              <div id="foro" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">22. Legge applicabile e foro competente</h2>
                <p className="text-gray-700 leading-relaxed text-justify">
                  I Termini sono regolati dalla legge italiana. Foro competente: Catania, salvo foro inderogabile del consumatore quando applicabile.
                </p>
              </div>

              {/* 23 */}
              <div id="contatti" className="scroll-mt-28">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">23. Contatti</h2>
                <div className="bg-gray-50 border rounded-xl p-5">
                  <p className="font-semibold text-gray-900">Amalis Group Srl</p>
                  <p className="text-gray-700">Via San Nicola, snc – 95040 Camporotondo Etneo (CT), Italia</p>
                  <p className="text-gray-700">P.IVA 06169160873</p>
                  <p className="text-gray-700">
                    Supporto:{" "}
                    <a className="text-[#0D414B] hover:underline" href="mailto:support@renthubber.com">
                      support@renthubber.com
                    </a>
                  </p>
                </div>
              </div>

            </div>

            {/* bottom actions */}
            <div className="mt-8 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
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

        {/* CTA finale brand */}
        <section className="py-16 text-white text-center" style={{ backgroundColor: "#0D414B" }}>
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-4">Usa Renthubber in modo consapevole</h2>
            <p className="text-lg text-gray-200 mb-8 text-justify md:text-center">
              Ti invitiamo a leggere con attenzione i presenti Termini prima di utilizzare la piattaforma.
              In caso di dubbi, contattaci attraverso il Centro assistenza o la pagina Contattaci.
            </p>
            <div className="flex justify-center">
              <Link to="/contatti"
                className="inline-block px-8 py-3 rounded-full text-lg font-semibold bg-white text-[#0D414B] hover:bg-gray-100 transition shadow-lg"
              >
                Contattaci
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default TerminiPage;
