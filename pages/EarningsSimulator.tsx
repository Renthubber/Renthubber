import { useState, useEffect } from "react";
import { ArrowRight, TrendingUp, MapPin, Calendar, RotateCcw, Info } from "lucide-react";

// ─── DATI ────────────────────────────────────────────────────────────────────

const LISTING_TYPES = [
  { id: "oggetto",     label: "🧰 Oggetto",     desc: "Veicoli, elettronica, sport…" },
  { id: "spazio",      label: "🏠 Spazio",      desc: "Garage, location, uffici…"      },
  { id: "esperienza",  label: "🎯 Esperienza",  desc: "Tour, corsi, attività, ecc."    },
];

const ITEMS = {
  oggetto: [
    { id: "fotocamera",   label: "📷 Fotocamera / Obiettivi",  basePrice: 60,  minP: 40,  maxP: 150, demand: 0.72, category: "Elettronica" },
    { id: "drone",        label: "🚁 Drone",                   basePrice: 80,  minP: 50,  maxP: 180, demand: 0.65, category: "Elettronica" },
    { id: "proiettore",   label: "📽️ Proiettore",              basePrice: 45,  minP: 30,  maxP: 90,  demand: 0.60, category: "Elettronica" },
    { id: "audio_prof",   label: "🔊 Sistema Audio Pro",       basePrice: 120, minP: 80,  maxP: 250, demand: 0.55, category: "Elettronica" },
    { id: "ebike",        label: "🚲 E-Bike",                  basePrice: 55,  minP: 35,  maxP: 100, demand: 0.80, category: "Sport" },
    { id: "kayak",        label: "🛶 Kayak / SUP",             basePrice: 50,  minP: 30,  maxP: 90,  demand: 0.70, category: "Sport" },
    { id: "ski",          label: "⛷️ Kit Sci completo",         basePrice: 40,  minP: 25,  maxP: 80,  demand: 0.75, category: "Sport" },
    { id: "monopattino",  label: "🛴 Monopattino elettrico",   basePrice: 35,  minP: 20,  maxP: 70,  demand: 0.78, category: "Sport" },
    { id: "trapano",      label: "🔧 Trapano / Avvitatore",    basePrice: 20,  minP: 12,  maxP: 40,  demand: 0.68, category: "Utensili" },
    { id: "idropulitrice",label: "💦 Idropulitrice",           basePrice: 35,  minP: 20,  maxP: 60,  demand: 0.72, category: "Utensili" },
    { id: "ponteggio",    label: "🪜 Ponteggio / Scala",       basePrice: 30,  minP: 18,  maxP: 55,  demand: 0.60, category: "Utensili" },
    { id: "tendone",      label: "🎪 Tendone / Gazebo",        basePrice: 80,  minP: 50,  maxP: 160, demand: 0.65, category: "Eventi" },
    { id: "led_party",    label: "🎉 Kit luci LED Festa",      basePrice: 50,  minP: 30,  maxP: 100, demand: 0.70, category: "Eventi" },
    { id: "bbq",          label: "🍖 Barbecue professionale",  basePrice: 55,  minP: 35,  maxP: 100, demand: 0.68, category: "Eventi" },
    { id: "chitarra",     label: "🎸 Chitarra / Basso",        basePrice: 30,  minP: 18,  maxP: 70,  demand: 0.50, category: "Musica" },
    { id: "dj_set",       label: "🎧 Controller DJ",           basePrice: 90,  minP: 60,  maxP: 180, demand: 0.55, category: "Musica" },
    { id: "camper",       label: "🚐 Camper / Furgone",        basePrice: 150, minP: 100, maxP: 300, demand: 0.62, category: "Veicoli" },
    { id: "cargo_bike",   label: "📦 Cargo Bike",              basePrice: 45,  minP: 28,  maxP: 90,  demand: 0.60, category: "Veicoli" },
  ],
  spazio: [
    { id: "garage",       label: "🚗 Garage / Box auto",       basePrice: 25,  minP: 15,  maxP: 60,  demand: 0.82, category: "Storage" },
    { id: "parcheggio",   label: "🅿️ Parcheggio privato",      basePrice: 10,  minP: 6,   maxP: 25,  demand: 0.88, category: "Storage" },
    { id: "deposito",     label: "📦 Magazzino / Deposito",    basePrice: 40,  minP: 25,  maxP: 100, demand: 0.72, category: "Storage" },
    { id: "location_ev",  label: "🎊 Location per eventi",     basePrice: 300, minP: 150, maxP: 800, demand: 0.55, category: "Location" },
    { id: "giardino",     label: "🌿 Giardino / Terrazza",     basePrice: 80,  minP: 50,  maxP: 200, demand: 0.60, category: "Location" },
    { id: "studio_foto",  label: "📸 Studio Fotografico",      basePrice: 120, minP: 80,  maxP: 250, demand: 0.60, category: "Creativo" },
    { id: "sala_reg",     label: "🎙️ Sala di Registrazione",   basePrice: 100, minP: 60,  maxP: 200, demand: 0.50, category: "Creativo" },
    { id: "coworking",    label: "💻 Spazio Coworking",         basePrice: 25,  minP: 15,  maxP: 60,  demand: 0.75, category: "Ufficio" },
    { id: "sala_riunioni",label: "🤝 Sala Riunioni",           basePrice: 50,  minP: 30,  maxP: 120, demand: 0.70, category: "Ufficio" },
    { id: "pop_up",       label: "🏪 Negozio Pop-up",          basePrice: 150, minP: 80,  maxP: 350, demand: 0.52, category: "Commerciale" },
  ],


esperienza: [
  // Tour & Visite
  { id: "tour_città",    label: "🗺️ Tour guidato città",       basePrice: 30,  minP: 20,  maxP: 80,  demand: 0.70, category: "Tour & Visite" },
  { id: "tour_natura",   label: "🌄 Escursione / Trekking",    basePrice: 35,  minP: 20,  maxP: 90,  demand: 0.65, category: "Tour & Visite" },
  { id: "tour_barca",    label: "⛵ Gita in barca / kayak",    basePrice: 60,  minP: 35,  maxP: 150, demand: 0.68, category: "Tour & Visite" },
  { id: "tour_moto",     label: "🏍️ Tour in moto / scooter",   basePrice: 50,  minP: 30,  maxP: 120, demand: 0.55, category: "Tour & Visite" },
  // Corsi & Workshop
  { id: "corso_cucina",  label: "👨‍🍳 Corso di cucina",           basePrice: 55,  minP: 35,  maxP: 130, demand: 0.72, category: "Corsi" },
  { id: "corso_foto",    label: "📸 Workshop fotografia",       basePrice: 60,  minP: 40,  maxP: 150, demand: 0.60, category: "Corsi" },
  { id: "corso_yoga",    label: "🧘 Lezione yoga / pilates",    basePrice: 25,  minP: 15,  maxP: 60,  demand: 0.75, category: "Corsi" },
  { id: "corso_surf",    label: "🏄 Lezione surf / kite",       basePrice: 70,  minP: 45,  maxP: 160, demand: 0.62, category: "Corsi" },
  { id: "corso_musica",  label: "🎹 Lezione di musica",         basePrice: 35,  minP: 20,  maxP: 80,  demand: 0.58, category: "Corsi" },
  // Esperienze Gastronomiche
  { id: "degustazione",  label: "🍷 Degustazione vini / olio",  basePrice: 45,  minP: 25,  maxP: 100, demand: 0.65, category: "Gastronomia" },
  { id: "cena_chef",     label: "🍽️ Cena con chef privato",     basePrice: 120, minP: 80,  maxP: 280, demand: 0.55, category: "Gastronomia" },
  { id: "street_food",   label: "🥘 Tour street food",          basePrice: 30,  minP: 18,  maxP: 70,  demand: 0.70, category: "Gastronomia" },
  // Avventura & Sport
  { id: "arrampicata",   label: "🧗 Arrampicata guidata",       basePrice: 50,  minP: 30,  maxP: 120, demand: 0.58, category: "Avventura" },
  { id: "immersione",    label: "🤿 Immersione subacquea",      basePrice: 80,  minP: 50,  maxP: 180, demand: 0.60, category: "Avventura" },
  { id: "parapendio",    label: "🪂 Parapendio / volo",         basePrice: 100, minP: 70,  maxP: 220, demand: 0.52, category: "Avventura" },
  // Benessere & Relax
  { id: "massaggio",     label: "💆 Massaggio / trattamento",   basePrice: 60,  minP: 40,  maxP: 130, demand: 0.78, category: "Benessere" },
  { id: "meditazione",   label: "🌸 Sessione meditazione",      basePrice: 20,  minP: 12,  maxP: 50,  demand: 0.60, category: "Benessere" },
],
};

const CITIES = [
  { id: "milano",  label: "Milano",      mult: 1.40 },
  { id: "roma",    label: "Roma",        mult: 1.32 },
  { id: "firenze", label: "Firenze",     mult: 1.22 },
  { id: "venezia", label: "Venezia",     mult: 1.28 },
  { id: "torino",  label: "Torino",      mult: 1.12 },
  { id: "bologna", label: "Bologna",     mult: 1.18 },
  { id: "napoli",  label: "Napoli",      mult: 1.02 },
  { id: "genova",  label: "Genova",      mult: 1.08 },
  { id: "verona",  label: "Verona",      mult: 1.10 },
  { id: "catania", label: "Catania",     mult: 0.88 },
  { id: "palermo", label: "Palermo",     mult: 0.90 },
  { id: "bari",    label: "Bari",        mult: 0.93 },
  { id: "altra",   label: "Altra città", mult: 0.97 },
];

const SIMILAR = {
  fotocamera:   [{ n: "Sony A7 III", p: 65 }, { n: "Canon R6", p: 55 }, { n: "Nikon Z6", p: 50 }],
  drone:        [{ n: "DJI Air 3", p: 85 }, { n: "DJI Mini 4 Pro", p: 70 }, { n: "DJI Mavic 3", p: 110 }],
  ebike:        [{ n: "E-bike Bianchi", p: 60 }, { n: "E-bike Trek", p: 50 }, { n: "E-bike Scott", p: 55 }],
  monopattino:  [{ n: "Xiaomi Pro 3", p: 30 }, { n: "Segway Ninebot", p: 35 }, { n: "Pure Air Pro", p: 40 }],
  tendone:      [{ n: "Gazebo 3x3m", p: 60 }, { n: "Tendone 4x8m", p: 120 }, { n: "Tensostruttura", p: 200 }],
  camper:       [{ n: "Fiat Ducato camper", p: 140 }, { n: "VW California", p: 200 }, { n: "Furgone cargo", p: 100 }],
  location_ev:  [{ n: "Villa con giardino", p: 400 }, { n: "Sala industriale", p: 250 }, { n: "Rooftop terrace", p: 500 }],
  studio_foto:  [{ n: "Studio ciclorama", p: 130 }, { n: "Loft industriale", p: 100 }, { n: "Studio con kit luce", p: 150 }],
  coworking:    [{ n: "Desk open space", p: 20 }, { n: "Scrivania privata", p: 30 }, { n: "Postazione premium", p: 40 }],
  garage:       [{ n: "Box singolo", p: 20 }, { n: "Garage doppio", p: 35 }, { n: "Box con presa EV", p: 45 }],
  audio_prof:   [{ n: "PA Sistema 1000W", p: 130 }, { n: "Set mixer + casse", p: 100 }, { n: "Monitor da studio", p: 80 }],
  dj_set:       [{ n: "Pioneer DDJ-1000", p: 100 }, { n: "Traktor S4", p: 70 }, { n: "Rane One", p: 90 }],
  sala_riunioni:[{ n: "Sala 6 pax centro", p: 55 }, { n: "Sala 10 pax", p: 80 }, { n: "Boardroom premium", p: 120 }],
  pop_up:       [{ n: "Spazio corso Umberto", p: 140 }, { n: "Temporary store", p: 180 }, { n: "Kiosk mercato", p: 100 }],
  tour_città:   [{ n: "Tour centro storico 2h", p: 28 }, { n: "Walking tour notturno", p: 35 }, { n: "Tour in bici elettrica", p: 45 }],
  corso_cucina: [{ n: "Pasta fresca con nonna", p: 60 }, { n: "Masterclass pizza", p: 55 }, { n: "Corso sushi", p: 70 }],
  degustazione: [{ n: "Degustazione vini DOC", p: 40 }, { n: "Olio EVO + formaggi", p: 35 }, { n: "Wine tour cantina", p: 60 }],
  cena_chef:    [{ n: "Chef a domicilio 4 px", p: 130 }, { n: "Cena gourmet 6 px", p: 200 }, { n: "Menu degustazione privato", p: 160 }],
  massaggio:    [{ n: "Massaggio rilassante 60'", p: 55 }, { n: "Massaggio sportivo 90'", p: 75 }, { n: "Trattamento viso+corpo", p: 90 }],
  immersione:   [{ n: "Dive Discovery 2h", p: 75 }, { n: "Night dive", p: 90 }, { n: "Snorkeling guidato", p: 40 }],
  corso_foto:   [{ n: "Workshop paesaggio", p: 65 }, { n: "Street photography", p: 55 }, { n: "Ritratto in studio", p: 80 }],
  tour_barca:   [{ n: "Giro in barca a vela 3h", p: 65 }, { n: "Kayak sea tour", p: 40 }, { n: "Gommone snorkeling", p: 55 }],
  default:      [{ n: "Annuncio simile A", p: 0 }, { n: "Annuncio simile B", p: 0 }, { n: "Annuncio simile C", p: 0 }],
};

function getSimilar(itemId, mult) {
  const base = SIMILAR[itemId] || SIMILAR.default;
  return base.map(s => ({ ...s, p: s.p > 0 ? Math.round(s.p * mult) : null }));
}

// ─── UTILS ────────────────────────────────────────────────────────────────────

function AnimatedNumber({ value, prefix = "", suffix = "" }) {
  const [disp, setDisp] = useState(0);
  useEffect(() => {
    const duration = 700;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisp(Math.round(value * ease));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span>{prefix}{disp.toLocaleString("it-IT")}{suffix}</span>;
}

function StepBadge({ n }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 28, height: 28, borderRadius: "50%",
      background: "#0D414B", color: "#fff",
      fontSize: 13, fontWeight: 700, flexShrink: 0,
    }}>{n}</span>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function EarningsSimulator() {
  const [listingType, setListingType] = useState("");
  const [itemId, setItemId]           = useState("");
  const [cityId, setCityId]           = useState("");
  const [days, setDays]               = useState(8);
  const [price, setPrice]             = useState(0);
  const [result, setResult]           = useState(null);

  const item = itemId ? ITEMS[listingType]?.find(i => i.id === itemId) : null;
  const city = cityId ? CITIES.find(c => c.id === cityId) : null;

  useEffect(() => {
    if (item && city) setPriceRounded(item, city);
    else if (item)    setPrice(item.basePrice);
  }, [itemId, cityId]);

  useEffect(() => { setItemId(""); setResult(null); }, [listingType]);

  function setPriceRounded(it, ct) {
    setPrice(Math.round(it.basePrice * ct.mult));
  }

  const canCalc = listingType && itemId && cityId;

  function calculate() {
    if (!canCalc || !item || !city) return;
    const gross = price * days;
    const net   = gross * 0.90;
    const suggestedPrice = Math.round(item.basePrice * city.mult);
    const minP  = Math.round(item.minP * city.mult);
    const maxP  = Math.round(item.maxP * city.mult);
    const status = price < minP ? "sotto" : price > maxP ? "sopra" : "ottimale";
    setResult({
      gross, net, annual: net * 12,
      suggestedPrice, minP, maxP,
      potentialDays: Math.round(30 * item.demand),
      demand: item.demand,
      status,
      similar: getSimilar(itemId, city.mult),
    });
  }

  function reset() {
    setResult(null); setListingType(""); setItemId(""); setCityId(""); setDays(8);
  }

  const byCategory = listingType
    ? ITEMS[listingType as keyof typeof ITEMS].reduce((acc: Record<string, typeof ITEMS.oggetto>, it) => {
        (acc[it.category] = acc[it.category] || []).push(it); return acc;
      }, {})
    : {} as Record<string, typeof ITEMS.oggetto>;

  const sliderPct = `${((days - 1) / 27) * 100}%`;

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", minHeight: "100vh", background: "#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .rh-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 16px; }

        .rh-select {
          width: 100%; padding: 13px 42px 13px 16px;
          border: 1.5px solid #e2e8f0; border-radius: 12px;
          font-size: 15px; font-family: inherit;
          background: #f8fafb url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%230D414B' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 14px center;
          color: #1a202c; cursor: pointer; appearance: none; outline: none;
          transition: border-color .2s, box-shadow .2s;
        }
        .rh-select:focus { border-color: #3DD9D0; box-shadow: 0 0 0 3px rgba(61,217,208,.18); background-color:#fff; }

        .type-btn {
          flex: 1; padding: 18px 12px; border-radius: 12px;
          border: 2px solid #e2e8f0; background: #f8fafb;
          cursor: pointer; text-align: center; font-family: inherit;
          transition: border-color .18s, background .18s;
        }
        .type-btn:hover { border-color: #3DD9D0; background: #f0fdfc; }
        .type-btn.active { border-color: #0D414B; background: #0D414B; }

        .rh-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 10px;
          border: none; border-radius: 12px; font-family: inherit; font-weight: 700;
          cursor: pointer; width: 100%; transition: background .15s, transform .15s, box-shadow .15s;
        }
        .rh-btn-primary {
          background: #3DD9D0; color: #0D414B;
          padding: 15px 28px; font-size: 16px;
          box-shadow: 0 4px 16px rgba(61,217,208,.35);
        }
        .rh-btn-primary:hover:not(:disabled) { background: #2fc9c0; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(61,217,208,.42); }
        .rh-btn-primary:disabled { opacity: .4; cursor: not-allowed; box-shadow: none; }
        .rh-btn-outline { background: transparent; color: #0D414B; padding: 13px 28px; font-size: 15px; border: 1.5px solid #cbd5e1; }
        .rh-btn-outline:hover { border-color: #0D414B; }

        .price-box {
          display: flex; align-items: center; gap: 8px;
          border: 1.5px solid #e2e8f0; border-radius: 12px;
          padding: 10px 16px; background: #f8fafb; transition: border-color .2s;
        }
        .price-box:focus-within { border-color: #3DD9D0; box-shadow: 0 0 0 3px rgba(61,217,208,.18); background: #fff; }
        .price-box input {
          border: none; background: transparent; font-size: 26px; font-weight: 800;
          color: #0D414B; width: 100px; text-align: center; font-family: inherit; outline: none;
        }
        .price-box input::-webkit-inner-spin-button { display: none; }

        .sim-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
        .sim-row:last-child { border-bottom: none; }

        .fade-up { animation: fadeUp .42s cubic-bezier(.16,1,.3,1) both; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }

        input[type=range] { accent-color: #3DD9D0; }

        @media(max-width:600px) {
          .hero-h1 { font-size: 26px !important; }
        }
      `}</style>



      {/* HERO */}
      <div style={{ background: "linear-gradient(135deg,#0D414B 0%,#0a3a42 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(61,217,208,.12) 0%,transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -50, left: -50, width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle,rgba(61,217,208,.08) 0%,transparent 70%)" }} />
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "52px 24px 64px", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(61,217,208,.15)", border: "1px solid rgba(61,217,208,.3)", borderRadius: 99, padding: "6px 16px", marginBottom: 20 }}>
            <TrendingUp size={14} color="#3DD9D0" />
            <span style={{ color: "#3DD9D0", fontSize: 20, fontWeight: 600 }}>Calcolatore Guadagni</span>
          </div>
          <h1 className="hero-h1" style={{ fontSize: 36, fontWeight: 800, color: "#fff", lineHeight: 1.2, marginBottom: 14 }}>
            Quanto puoi guadagnare<br /><span style={{ color: "#3DD9D0" }}>su Renthubber?</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,.65)", fontSize: 16, lineHeight: 1.65, maxWidth: 460, margin: "0 auto" }}>
            Seleziona il tuo oggetto - spazio - esperienza, la città e scopri il tuo potenziale di guadagno mensile.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 40, marginTop: 32 }}>
            {[["GRATUITA", "Iscrizione"], ["10%", "Commissione"], ["1 min", "Per iniziare"]].map(([v, l]) => (
              <div key={l}>
                <div style={{ color: "#3DD9D0", fontWeight: 800, fontSize: 20 }}>{v}</div>
                <div style={{ color: "rgba(255,255,255,.4)", fontSize: 12, marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 20px 72px" }}>

        {!result ? (
          /* ── FORM ── */
          <div className="rh-card" style={{ marginTop: 32, padding: "32px 28px" }}>

            {/* Step 1 */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <StepBadge n={1} />
                <span style={{ fontWeight: 700, fontSize: 15, color: "#0D414B" }}>Cosa vuoi affittare?</span>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {LISTING_TYPES.map(t => (
                  <button key={t.id} className={`type-btn ${listingType === t.id ? "active" : ""}`} onClick={() => setListingType(t.id)}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{t.label.split(" ")[0]}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: listingType === t.id ? "#3DD9D0" : "#0D414B" }}>
                      {t.label.split(" ").slice(1).join(" ")}
                    </div>
                    <div style={{ fontSize: 11, color: listingType === t.id ? "rgba(255,255,255,.55)" : "#94a3b8", marginTop: 3 }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2 */}
            {listingType && (
              <div style={{ marginBottom: 28 }} className="fade-up">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <StepBadge n={2} />
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#0D414B" }}>
                    {listingType === "oggetto" ? "Quale oggetto?" : listingType === "spazio" ? "Quale spazio?" : "Quale esperienza?"}
                  </span>
                </div>
                <select className="rh-select" value={itemId} onChange={e => setItemId(e.target.value)}>
                  <option value="">Seleziona…</option>
                  {Object.entries(byCategory).map(([cat, items]) => (
                    <optgroup key={cat} label={`— ${cat} —`}>
                      {items.map(it => <option key={it.id} value={it.id}>{it.label}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
            )}

            {/* Step 3 */}
            {itemId && (
              <div style={{ marginBottom: 28 }} className="fade-up">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <StepBadge n={3} />
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#0D414B" }}>In quale città?</span>
                </div>
                <select className="rh-select" value={cityId} onChange={e => setCityId(e.target.value)}>
                  <option value="">Seleziona la città…</option>
                  {CITIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
            )}

            {/* Step 4 */}
            {cityId && (
              <div style={{ marginBottom: 28 }} className="fade-up">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <StepBadge n={4} />
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#0D414B" }}>
                    Giorni disponibili al mese: <span style={{ color: "#3DD9D0" }}>{days}</span>
                  </span>
                </div>
                <input
                  type="range" min={1} max={28} value={days}
                  style={{ width: "100%", height: 6, borderRadius: 3 }}
                  onChange={e => setDays(Number(e.target.value))}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
                  <span>1 giorno</span><span>28 giorni</span>
                </div>
              </div>
            )}

            {/* Step 5 */}
            {cityId && (
              <div style={{ marginBottom: 32 }} className="fade-up">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <StepBadge n={5} />
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 15, color: "#0D414B" }}>Prezzo al giorno</span>
                    {item && city && (
                      <span style={{ marginLeft: 8, fontSize: 12, color: "#3DD9D0", fontWeight: 600 }}>
                        suggerito €{Math.round(item.basePrice * city.mult)}/gg
                      </span>
                    )}
                  </div>
                </div>
                <div className="price-box">
                  <span style={{ color: "#94a3b8", fontSize: 20, fontWeight: 600 }}>€</span>
                  <input
                    type="number" min={1} max={9999} value={price}
                    onChange={e => setPrice(Math.max(1, Number(e.target.value)))}
                  />
                  <span style={{ color: "#94a3b8", fontSize: 13 }}>/ giorno</span>
                </div>
                {item && city && (
                  <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
                    Fascia di mercato a {city.label}: €{Math.round(item.minP * city.mult)} – €{Math.round(item.maxP * city.mult)} / giorno
                  </p>
                )}
              </div>
            )}

            {/* Preview live */}
            {cityId && itemId && (
              <div style={{ background: "rgba(13,65,75,.04)", border: "1.5px solid rgba(61,217,208,.35)", borderRadius: 14, padding: "18px 20px", marginBottom: 20 }} className="fade-up">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>📊 Anteprima stima</span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{days} gg × €{price}/gg</span>
                </div>
                <div style={{ display: "flex" }}>
                  {([
                    ["Lordo mensile",   `€${(price * days).toLocaleString("it-IT")}`,              false],
                    ["Netto (–10%)",    `€${Math.round(price * days * 0.90).toLocaleString("it-IT")}`, true],
                    ["Stima annua",     `€${Math.round(price * days * 0.90 * 12).toLocaleString("it-IT")}`, false],
                  ] as [string, string, boolean][]).map(([lbl, val, accent], i) => (
                    <div key={lbl} style={{
                      flex: 1, textAlign: "center",
                      borderRight: i < 2 ? "1px solid rgba(13,65,75,.1)" : "none",
                      paddingBottom: 2,
                    }}>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4, fontWeight: 500 }}>{lbl}</div>
                      <div style={{ fontWeight: 800, fontSize: 18, color: accent ? "#0D414B" : "#475569" }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            {cityId && itemId && (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }} className="fade-up">
                <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>⚠️</span>
                <p style={{ fontSize: 12, color: "#92400e", lineHeight: 1.6, margin: 0 }}>
                  <strong>Stima orientativa.</strong> I valori sono calcolati sulla base di medie di mercato e non costituiscono una promessa o garanzia di guadagno. Il risultato reale dipende da qualità dell'annuncio, recensioni, stagionalità e domanda locale. Renthubber non si assume alcuna responsabilità per scostamenti tra la stima e i guadagni effettivi.
                </p>
              </div>
            )}

            <button className="rh-btn rh-btn-primary" disabled={!canCalc} onClick={calculate}>
              Calcola il mio guadagno <ArrowRight size={18} />
            </button>
          </div>

        ) : (
          /* ── RISULTATI ── */
          <div className="fade-up">

            {/* Big card dark */}
            <div style={{ background: "#0D414B", borderRadius: 16, padding: "28px 28px 24px", marginTop: -32, marginBottom: 14 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(61,217,208,.15)", border: "1px solid rgba(61,217,208,.25)", borderRadius: 99, padding: "4px 14px", marginBottom: 14 }}>
                <MapPin size={12} color="#3DD9D0" />
                <span style={{ color: "#3DD9D0", fontSize: 12, fontWeight: 600 }}>
                  {item?.label} · {city?.label}
                </span>
              </div>
              <p style={{ color: "rgba(255,255,255,.5)", fontSize: 13, marginBottom: 4 }}>Guadagno netto mensile stimato</p>
              <div style={{ fontSize: 58, fontWeight: 800, color: "#3DD9D0", lineHeight: 1, marginBottom: 6 }}>
                <AnimatedNumber value={Math.round(result.net)} prefix="€" />
              </div>
              <p style={{ color: "rgba(255,255,255,.35)", fontSize: 12 }}>
                {days} giorni/mese · dopo commissione Renthubber 10%
              </p>
              <div style={{ display: "flex", marginTop: 22, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,.08)" }}>
                {([
                  ["Lordo mensile", `€${Math.round(result.gross).toLocaleString("it-IT")}`, false],
                  ["Potenziale annuo", `€${Math.round(result.annual).toLocaleString("it-IT")}`, true],
                  ["Domanda zona", `${Math.round(result.demand * 100)}%`, false],
                ] as [string, string, boolean][]).map(([lbl, val, accent], i) => (
                  <div key={lbl} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,.08)" : "none" }}>
                    <div style={{ color: "rgba(255,255,255,.4)", fontSize: 11, marginBottom: 4 }}>{lbl}</div>
                    <div style={{ color: accent ? "#3DD9D0" : "#fff", fontWeight: 800, fontSize: 16 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Consiglio prezzo */}
            <div className="rh-card" style={{ padding: 24, marginBottom: 14 }}>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: "#0D414B", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <Info size={16} color="#3DD9D0" /> Consiglio sul prezzo
              </h3>
              <div style={{
                padding: "12px 16px", borderRadius: 10, marginBottom: 14, fontSize: 13, fontWeight: 500,
                ...(result.status === "ottimale"
                  ? { background: "#f0fdf4", border: "1.5px solid #bbf7d0", color: "#15803d" }
                  : result.status === "sotto"
                    ? { background: "#fffbeb", border: "1.5px solid #fde68a", color: "#b45309" }
                    : { background: "#fef2f2", border: "1.5px solid #fecaca", color: "#dc2626" })
              }}>
                {result.status === "ottimale" && `✅ Ottimo! €${price}/gg è nella fascia competitiva per ${city?.label}.`}
                {result.status === "sotto"    && `⚠️ Prezzo basso. Potresti salire fino a €${result.suggestedPrice}/gg senza perdere prenotazioni.`}
                {result.status === "sopra"    && `🔺 Prezzo sopra media. Considera €${result.suggestedPrice}/gg per più prenotazioni.`}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {[["Minimo", result.minP, false], ["Consigliato", result.suggestedPrice, true], ["Premium", result.maxP, false]].map(([lbl, val, accent]) => (
                  <div key={lbl} style={{
                    flex: 1, textAlign: "center", padding: "10px 8px", borderRadius: 10,
                    background: accent ? "rgba(61,217,208,.07)" : "#f8fafb",
                    border: accent ? "1.5px solid rgba(61,217,208,.4)" : "1.5px solid #f1f5f9",
                  }}>
                    <div style={{ fontSize: 11, color: accent ? "#0D414B" : "#94a3b8", marginBottom: 2, fontWeight: 600 }}>{lbl}</div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#0D414B" }}>€{val}/gg</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Simili */}
            <div className="rh-card" style={{ padding: 24, marginBottom: 14 }}>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: "#0D414B", marginBottom: 4 }}>
                📊 Annunci simili a {city?.label}
              </h3>
              <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>Prezzi calibrati sul mercato locale</p>
              {result.similar.map((s, i) => (
                <div className="sim-row" key={i}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#0D414B" }}>{s.n}</div>
                    <div style={{ fontSize: 11, color: "#f59e0b" }}>★★★★★</div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 17, color: "#0D414B" }}>
                    {s.p ? `€${s.p}/gg` : "—"}
                  </div>
                </div>
              ))}
            </div>

            {/* Potenziale */}
            <div style={{ background: "rgba(13,65,75,.04)", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "16px 20px", marginBottom: 14, display: "flex", alignItems: "center", gap: 14 }}>
              <Calendar size={20} color="#3DD9D0" />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#0D414B" }}>
                  Potenziale: fino a {result.potentialDays} giorni/mese noleggiati
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  Basato sulla domanda media nella tua categoria ({Math.round(result.demand * 100)}% occupazione stimata)
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="rh-card" style={{ padding: 28, textAlign: "center", marginBottom: 16 }}>
              <h3 style={{ fontWeight: 800, fontSize: 18, color: "#0D414B", marginBottom: 8 }}>Pronto a guadagnare?</h3>
              <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>
                Pubblica il tuo annuncio gratis e inizia a ricevere prenotazioni.
              </p>
              <button className="rh-btn rh-btn-primary" style={{ marginBottom: 12 }} onClick={() => alert("→ /signup")}>
                Pubblica il tuo annuncio <ArrowRight size={18} />
              </button>
              <button className="rh-btn rh-btn-outline" onClick={reset}>
                <RotateCcw size={15} /> Ricalcola con un altro annuncio
              </button>
            </div>

            <p style={{ textAlign: "center", fontSize: 11, color: "#cbd5e1", lineHeight: 1.6 }}>
              * Stime basate su dati medi di mercato. Il guadagno reale dipende da qualità dell'annuncio, recensioni e domanda locale.
            </p>
          </div>
        )}
      </div>

      </div>
  );
}