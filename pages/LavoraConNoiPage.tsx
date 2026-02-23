import React, { useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";

const faqs = [
  {
    q: "Serve P.IVA?",
    a: "No, per attività occasionale non serve. Se diventi agente strutturato, ti guidiamo noi.",
  },
  {
    q: "Quando vengo pagato?",
    a: "Mensilmente, entro il 15 del mese successivo via bonifico.",
  },
  {
    q: "Posso operare in più zone?",
    a: "Sì! Puoi richiedere più zone dalla tua dashboard collaboratore.",
  },
  {
    q: "C'è un minimo di Hubber da portare?",
    a: "No, nessun obbligo. Vai al tuo ritmo.",
  },
  {
    q: "Cosa succede se un Hubber smette?",
    a: "Le commissioni sono solo su prenotazioni effettive. Niente prenotazioni = niente costi per te.",
  },
];

const tiers = [
  {
    medal: "🛡️",
    name: "Starter",
    range: "0–9 Hubber",
    bonus: "€5",
    commission: "5%",
    milestone: null,
    featured: false,
  },
  {
    medal: "🥉",
    name: "Bronze",
    range: "10–24 Hubber",
    bonus: "€7",
    commission: "7%",
    milestone: "€50",
    featured: false,
  },
  {
    medal: "🥈",
    name: "Silver",
    range: "25–49 Hubber",
    bonus: "€8",
    commission: "8%",
    milestone: "€150",
    featured: true,
  },
  {
    medal: "🥇",
    name: "Gold",
    range: "50+ Hubber",
    bonus: "€10",
    commission: "10%",
    milestone: "€250",
    featured: false,
  },
];

export const LavoraConNoiPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <PageLayout slug="lavora-con-noi" fallbackTitle="Lavora con noi">
      <div className="bg-gray-50 text-gray-800">
        {/* HERO */}
        <section className="bg-white py-20 border-b">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <span className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
              <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
              Programma Collaboratori Aperto
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Diventa{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-700">
                Collaboratore
              </span>{" "}
              Renthubber
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 text-justify md:text-center">
              Trasforma le tue connessioni in opportunità reali. Guadagna
              commissioni ricorrenti portando nuovi Hubber sulla piattaforma del
              noleggio tra privati.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/collaboratori/registrazione"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-lg font-semibold bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700 transition shadow-lg shadow-teal-500/25"
              >
                Candidati Ora
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <a
                href="#presentazione"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-lg font-semibold bg-white text-gray-800 border-2 border-gray-200 hover:border-teal-500 hover:text-teal-700 transition"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Leggi la Presentazione
              </a>
            </div>
          </div>
        </section>

        {/* STATS BAR */}
        <div className="max-w-4xl mx-auto px-6 -mt-8 relative z-10">
          <div className="bg-white rounded-2xl shadow-lg grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className="py-6 px-6 text-center">
              <div className="text-2xl font-extrabold text-teal-500">€0</div>
              <div className="text-sm text-gray-500 mt-1">
                Investimento iniziale
              </div>
            </div>
            <div className="py-6 px-6 text-center">
              <div className="text-2xl font-extrabold text-teal-500">
                fino a 10%
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Commissioni ricorrenti
              </div>
            </div>
            <div className="py-6 px-6 text-center">
              <div className="text-2xl font-extrabold text-teal-500">€870+</div>
              <div className="text-sm text-gray-500 mt-1">
                Guadagno potenziale 1° anno
              </div>
            </div>
          </div>
        </div>

        {/* COS'È RENTHUBBER */}
        <section className="py-20 bg-white border-y mt-8">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <span className="inline-block bg-teal-50 text-teal-700 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                La Piattaforma
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Cos'è Renthubber?
              </h2>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                Il primo marketplace italiano per il noleggio tra privati di
                oggetti e spazi. Tutto tranne gli alloggi.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: "🔒",
                  title: "Pagamenti Sicuri",
                  desc: "Transazioni gestite tramite Stripe con protezione completa per entrambe le parti.",
                },
                {
                  icon: "💬",
                  title: "Messaggistica Integrata",
                  desc: "Comunicazione diretta tra Renter e Hubber all'interno della piattaforma.",
                },
                {
                  icon: "⭐",
                  title: "Sistema Recensioni",
                  desc: "Recensioni reciproche e badge SuperHubber per i migliori noleggiatori.",
                },
                {
                  icon: "📋",
                  title: "Verifica Documenti",
                  desc: "Identità verificata per maggiore sicurezza e fiducia nella community.",
                },
                {
                  icon: "📅",
                  title: "Gestione Disponibilità",
                  desc: "Calendario integrato per gestire le prenotazioni in modo semplice e veloce.",
                },
                {
                  icon: "⚖️",
                  title: "Gestione Dispute",
                  desc: "Sistema di risoluzione controversie con supporto admin dedicato.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all"
                >
                  <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-2xl mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COME FUNZIONA PER IL COLLABORATORE */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <span className="inline-block bg-teal-50 text-teal-700 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                Il Tuo Ruolo
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Come funziona per te
              </h2>
              <p className="text-gray-500 text-lg">
                Non vendi nulla. Colleghi persone a un'opportunità.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  num: 1,
                  icon: "💬",
                  title: "Parla",
                  desc: "Parli con persone che hanno oggetti o spazi da noleggiare nella tua zona.",
                },
                {
                  num: 2,
                  icon: "🔗",
                  title: "Invita",
                  desc: "Li inviti a registrarsi su Renthubber tramite il tuo link personale.",
                },
                {
                  num: 3,
                  icon: "💰",
                  title: "Guadagna",
                  desc: "Guadagni ogni volta che i tuoi Hubber ricevono prenotazioni. Commissioni ricorrenti!",
                },
              ].map((step) => (
                <div
                  key={step.num}
                  className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
                >
                  <div className="w-11 h-11 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-full flex items-center justify-center font-extrabold text-lg mx-auto mb-4">
                    {step.num}
                  </div>
                  <div className="text-3xl mb-3">{step.icon}</div>
                  <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* GUADAGNI */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <span className="inline-block bg-teal-50 text-teal-700 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                Compensi
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Quanto guadagni come Collaboratore
              </h2>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                Più Hubber porti, più cresci. Scala i livelli per bonus e
                commissioni maggiori.
              </p>
            </div>

            {/* TIER CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
              {tiers.map((tier, i) => (
                <div
                  key={i}
                  className={`relative bg-white rounded-xl p-6 text-center border-2 transition-all hover:shadow-md hover:-translate-y-1 ${
                    tier.featured
                      ? "border-teal-500 shadow-md"
                      : "border-gray-100"
                  }`}
                >
                  {tier.featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Popolare
                    </span>
                  )}
                  <div className="text-4xl mb-2">{tier.medal}</div>
                  <div className="text-xl font-extrabold text-gray-900">
                    {tier.name}
                  </div>
                  <div className="text-xs text-gray-400 mb-4">{tier.range}</div>
                  <div className="text-3xl font-extrabold text-teal-500 mb-1">
                    {tier.bonus}
                  </div>
                  <div className="text-xs text-gray-500 mb-3">
                    per Hubber attivo
                  </div>
                  <div className="bg-teal-50 text-teal-700 text-sm font-semibold px-3 py-2 rounded-lg mb-2">
                    {tier.commission} sulle commissioni
                  </div>
                  {tier.milestone && (
                    <div className="text-sm text-gray-500">
                      Premio milestone:{" "}
                      <strong className="text-gray-800">
                        {tier.milestone}
                      </strong>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* SCENARIO BOX */}
            <div
              className="rounded-2xl p-8 md:p-12 text-white max-w-3xl mx-auto"
              style={{ backgroundColor: "#0D414B" }}
            >
              <h3 className="text-xl font-bold mb-2">
                📊 Scenario Reale: Marco, Collaboratore Silver
              </h3>
              <p className="text-gray-300 text-sm mb-6 leading-relaxed text-justify">
                Marco ha portato 30 Hubber in 1 mese nella sua zona. 20 di loro
                sono attivi con prenotazioni regolari. Ogni Hubber genera in media
                €25/mese di commissioni per Renthubber.
              </p>
              <div className="space-y-3 mb-6">
                {[
                  {
                    label: "Bonus acquisizione (30 × €8)",
                    value: "€240",
                  },
                  {
                    label: "Ricorrente mensile (20 × €25 × 8%)",
                    value: "€40/mese → €480/anno",
                  },
                  {
                    label: "Premio milestone Silver",
                    value: "€150",
                  },
                ].map((row, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center bg-white/10 rounded-xl px-5 py-3.5"
                  >
                    <span className="text-gray-300 text-sm">{row.label}</span>
                    <span className="font-bold text-teal-300 text-lg">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="bg-teal-500 rounded-xl px-6 py-4 flex justify-between items-center">
                <span className="font-bold text-lg">Totale primo anno</span>
                <span className="font-extrabold text-2xl md:text-3xl">
                  circa €870
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* TU DECIDI IL RITMO */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <span className="inline-block bg-teal-50 text-teal-700 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                Flessibilità Totale
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Tu decidi il ritmo
              </h2>
              <p className="text-gray-500 text-lg">
                Non è un lavoro full-time. Nessun minimo, nessun obbligo.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  emoji: "🌿",
                  title: "Casual",
                  hours: "2–3 ore/settimana",
                  desc: "Parli con amici e conoscenti. Obiettivo: 2–3 Hubber al mese.",
                },
                {
                  emoji: "⚡",
                  title: "Attivo",
                  hours: "5–8 ore/settimana",
                  desc: "Outreach mirato, visiti attività, usi i social. Obiettivo: 5–8 Hubber al mese.",
                },
                {
                  emoji: "🚀",
                  title: "Intensivo",
                  hours: "15+ ore/settimana",
                  desc: "Diventi ambassador di zona. Obiettivo: 10+ Hubber al mese. Percorso verso Gold.",
                },
              ].map((pace, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
                >
                  <div className="text-3xl mb-2">{pace.emoji}</div>
                  <h3 className="text-xl font-extrabold text-gray-900">
                    {pace.title}
                  </h3>
                  <div className="text-teal-600 font-semibold text-sm mb-4">
                    {pace.hours}
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {pace.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-white border-y">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-12">
              <span className="inline-block bg-teal-50 text-teal-700 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                FAQ
              </span>
              <h2 className="text-3xl font-bold text-gray-900">
                Domande Frequenti
              </h2>
            </div>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden transition-all hover:shadow-sm"
                >
                  <button
                    className="w-full flex justify-between items-center px-6 py-5 text-left font-bold text-gray-900"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    {faq.q}
                    <span
                      className={`text-teal-500 text-2xl font-light transition-transform ${
                        openFaq === i ? "rotate-45" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openFaq === i ? "max-h-40" : "max-h-0"
                    }`}
                  >
                    <p className="px-6 pb-5 text-gray-500 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRESENTAZIONE PDF */}
        <section id="presentazione" className="py-20 bg-gradient-to-b from-teal-50 to-white">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-12">
              <span className="inline-block bg-teal-50 text-teal-700 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                Approfondimento
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Presentazione Ufficiale
              </h2>
              <p className="text-gray-500 text-lg">
                Scarica o leggi la presentazione completa del programma
                collaboratori Renthubber.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
              <div
                className="flex items-center justify-between px-6 py-4 text-white"
                style={{ backgroundColor: "#0D414B" }}
              >
                <span className="font-semibold text-sm">
                  📄 Presentazione_Renthubber_Collaboratore.pdf
                </span>
                <a
                  href="https://upyznglekmynztmydtxi.supabase.co/storage/v1/object/public/documents/Presentazione%20Renthubber%20Collaboratore.pdf"
                  download
                  className="bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                >
                  ⬇ Scarica PDF
                </a>
              </div>
              <iframe
                className="w-full border-0"
                style={{ height: "600px" }}
                src="https://upyznglekmynztmydtxi.supabase.co/storage/v1/object/public/documents/Presentazione%20Renthubber%20Collaboratore.pdf"
                title="Presentazione Renthubber Collaboratore"
              />
            </div>
          </div>
        </section>

        {/* CTA FINALE */}
        <section
          className="py-20 text-white text-center"
          style={{ backgroundColor: "#0D414B" }}
        >
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-4">Pronto a iniziare?</h2>
            <p className="text-lg text-gray-200 mb-8 text-justify md:text-center">
              Candidati ora come Collaboratore ufficiale Renthubber. Nessun
              investimento, nessun obbligo, solo opportunità.
            </p>
            <Link
              to="/collaboratori/registrazione"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-lg font-semibold bg-white text-[#0D414B] hover:bg-gray-100 transition"
            >
              Candidati come Collaboratore
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <p className="mt-6 text-xs text-gray-400">
              Non è richiesta P.IVA per attività occasionale. Gli esempi di
              guadagno sono indicativi e dipendono dall'attività svolta.
            </p>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default LavoraConNoiPage;