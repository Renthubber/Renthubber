import React, { useState } from "react";
import { supabase } from "../services/supabaseClient";

/* ─────────────────────────────────────────────
   Tipi locali
───────────────────────────────────────────── */
interface OpeningHourSlot {
  open: string;
  close: string;
}

interface StoreApplicationForm {
  business_name: string;
  vat_number: string;
  legal_representative: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  business_type: string;
  square_meters: string;
  has_shelving: boolean;
  has_camera_device: boolean;
  opening_hours: Record<string, OpeningHourSlot | null>;
  google_maps_url: string;
  motivation: string;
}

const DAYS = [
  { key: "mon", label: "Lunedì" },
  { key: "tue", label: "Martedì" },
  { key: "wed", label: "Mercoledì" },
  { key: "thu", label: "Giovedì" },
  { key: "fri", label: "Venerdì" },
  { key: "sat", label: "Sabato" },
  { key: "sun", label: "Domenica" },
];

const BUSINESS_TYPES = [
  { value: "poste_private", label: "Poste Private / Cityposte" },
  { value: "cartoleria", label: "Cartoleria / Copisteria" },
  { value: "tabaccheria", label: "Tabaccheria" },
  { value: "edicola", label: "Edicola" },
  { value: "ferramenta", label: "Ferramenta" },
  { value: "negozio", label: "Negozio / Attività commerciale" },
  { value: "altro", label: "Altro" },
];

const INITIAL_HOURS: Record<string, OpeningHourSlot | null> = {
  mon: { open: "09:00", close: "19:00" },
  tue: { open: "09:00", close: "19:00" },
  wed: { open: "09:00", close: "19:00" },
  thu: { open: "09:00", close: "19:00" },
  fri: { open: "09:00", close: "19:00" },
  sat: { open: "09:00", close: "13:00" },
  sun: null,
};

const INITIAL_FORM: StoreApplicationForm = {
  business_name: "",
  vat_number: "",
  legal_representative: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  province: "",
  postal_code: "",
  business_type: "",
  square_meters: "",
  has_shelving: false,
  has_camera_device: false,
  opening_hours: { ...INITIAL_HOURS },
  google_maps_url: "",
  motivation: "",
};

/* ─────────────────────────────────────────────
   Componente Pagina
───────────────────────────────────────────── */
export const StoreAdesionePage: React.FC = () => {
  const [form, setForm] = useState<StoreApplicationForm>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  /* ── Handlers ── */
  const updateField = (field: keyof StoreApplicationForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDay = (dayKey: string) => {
    setForm((prev) => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [dayKey]: prev.opening_hours[dayKey]
          ? null
          : { open: "09:00", close: "19:00" },
      },
    }));
  };

  const updateHour = (
    dayKey: string,
    field: "open" | "close",
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [dayKey]: {
          ...(prev.opening_hours[dayKey] as OpeningHourSlot),
          [field]: value,
        },
      },
    }));
  };

  const validateForm = (): string | null => {
    if (!form.business_name.trim()) return "Inserisci il nome dell'attività";
    if (!form.vat_number.trim()) return "Inserisci la Partita IVA";
    if (!/^[0-9]{11}$/.test(form.vat_number.replace(/\s/g, "")))
      return "La Partita IVA deve essere di 11 cifre";
    if (!form.legal_representative.trim())
      return "Inserisci il nome del rappresentante legale";
    if (!form.email.trim()) return "Inserisci l'email";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return "Inserisci un'email valida";
    if (!form.phone.trim()) return "Inserisci il numero di telefono";
    if (!form.address.trim()) return "Inserisci l'indirizzo";
    if (!form.city.trim()) return "Inserisci la città";
    if (!form.province.trim()) return "Inserisci la provincia";
    if (!form.postal_code.trim()) return "Inserisci il CAP";
    if (!form.business_type) return "Seleziona il tipo di attività";

    const hasAtLeastOneDay = Object.values(form.opening_hours).some(
      (v) => v !== null
    );
    if (!hasAtLeastOneDay) return "Seleziona almeno un giorno di apertura";

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: insertError } = await supabase
        .from("store_applications")
        .insert({
          business_name: form.business_name.trim(),
          vat_number: form.vat_number.replace(/\s/g, ""),
          legal_representative: form.legal_representative.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          province: form.province.trim().toUpperCase(),
          postal_code: form.postal_code.trim(),
          business_type: form.business_type,
          square_meters: form.square_meters
            ? parseFloat(form.square_meters)
            : null,
          has_shelving: form.has_shelving,
          has_camera_device: form.has_camera_device,
          opening_hours: form.opening_hours,
          google_maps_url: form.google_maps_url.trim() || null,
          motivation: form.motivation.trim() || null,
        });

      if (insertError) throw insertError;

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("Errore invio candidatura:", err);
      setError(
        err.message || "Si è verificato un errore. Riprova più tardi."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToForm = () => {
    setShowForm(true);
    setTimeout(() => {
      document.getElementById("candidatura")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  /* ─────────────────────────────────────────
     RENDER: Conferma post-invio
  ───────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-10">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Candidatura Inviata!
            </h2>
            <p className="text-gray-600 mb-6">
              Grazie per il tuo interesse nel diventare un Renthubber Store Autorizzato.
              Il nostro team valuterà la tua candidatura e ti contatterà all'indirizzo{" "}
              <strong>{form.email}</strong> entro 48 ore lavorative.
            </p>
            <a
              href="/"
              className="inline-block bg-brand text-white font-semibold px-8 py-3 rounded-xl hover:bg-brand-dark transition-colors"
            >
              Torna alla Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────
     RENDER: Pagina principale
  ───────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ══════════ HERO ══════════ */}
      <section className="relative bg-brand-dark text-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Testo */}
            <div>
              <span className="inline-block bg-brand-accent text-brand-dark text-sm font-bold px-4 py-1.5 rounded-full mb-6">
                Programma Early Adopter
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold mb-5 leading-tight">
                Diventa un Renthubber<br />Store Autorizzato
              </h1>
              <p className="text-lg text-white/80 mb-8 leading-relaxed">
                Entra nella rete di punti fisici partner di Renthubber.
                Genera nuove entrate dalla tua attività commerciale senza stravolgere il tuo business.
              </p>
              <button
                onClick={scrollToForm}
                className="bg-brand-accent text-brand-dark font-bold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:brightness-110 transition-all"
              >
                Candidati Ora
              </button>
            </div>

           {/* Immagine / Badge */}
<div className="flex justify-center">
  <div className="w-[26rem] md:w-[32rem] h-[26rem] md:h-[32rem] rounded-full bg-white shadow-2xl flex items-center justify-center p-20">
    <img 
      src="https://upyznglekmynztmydtxi.supabase.co/storage/v1/object/public/images/renthubberStoreAutorizzato.webp" 
      alt="Renthubber Store Autorizzato" 
      className="w-full h-full object-contain"
    />
  </div>
</div>
</div>
</div>
        {/* Wave decorativa */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,40 C360,0 720,60 1440,20 L1440,60 L0,60 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ══════════ COME FUNZIONA ══════════ */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-4">
            Come Funziona
          </h2>
          <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">
            Tre semplici passaggi per iniziare a guadagnare con Renthubber
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                icon: "📦",
                title: "Ricevi gli oggetti",
                desc: "Gli Hubber depositano i loro oggetti nel tuo store. Tu fai il check-in con una semplice scansione QR.",
              },
              {
                step: "2",
                icon: "🤝",
                title: "Gestisci ritiri e riconsegne",
                desc: "I Renter ritirano e riconsegnano gli oggetti nel tuo punto. Verifichi identità e stato con un tap.",
              },
              {
                step: "3",
                icon: "💰",
                title: "Guadagni automatici",
                desc: "Ricevi commissioni su ogni transazione e guadagni dalla custodia degli oggetti. Tutto automatizzato.",
              },
            ].map((step, i) => (
              <div key={i} className="text-center p-6 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand text-white font-bold text-lg mb-4">
                  {step.step}
                </div>
                <div className="text-4xl mb-3">{step.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ VANTAGGI ══════════ */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-4">
            Perché Diventare Store Autorizzato
          </h2>
          <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">
            Vantaggi concreti per la tua attività, fin dal primo giorno
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: "👥",
                title: "Nuovo flusso di clienti",
                desc: "Ogni ritiro e riconsegna porta persone nuove nel tuo negozio, potenziali clienti per i tuoi servizi.",
              },
              {
                icon: "📈",
                title: "Revenue ricorrente",
                desc: "Commissioni su ogni transazione + guadagni dalla custodia a pagamento degli oggetti.",
              },
              {
                icon: "🏷️",
                title: "Badge e visibilità",
                desc: "Il badge \"Renthubber Store Autorizzato\" e l'adesivo vetrina aumentano la credibilità della tua attività.",
              },
              {
                icon: "⚙️",
                title: "Zero complessità",
                desc: "Dashboard dedicata, notifiche automatiche, pagamenti gestiti. Tu scansioni, il sistema fa il resto.",
              },
              {
                icon: "🎯",
                title: "Costi d'ingresso minimi",
                desc: "Solo 25€ + IVA per iniziare, con 100 ritiri inclusi. Nessun rischio, nessun canone nascosto.",
              },
              {
                icon: "🚀",
                title: "Vantaggio Early Adopter",
                desc: "I primi store ottengono condizioni esclusive che non saranno più disponibili in futuro.",
              },
            ].map((v, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition-shadow"
              >
                <div className="text-3xl flex-shrink-0">{v.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{v.title}</h3>
                  <p className="text-gray-600 text-sm">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ PRICING ══════════ */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-10">
            Quanto Costa
          </h2>
          <div className="bg-gradient-to-br from-brand to-brand-dark rounded-2xl p-8 md:p-10 text-white shadow-xl">
            <div className="text-sm font-semibold uppercase tracking-wider mb-2 text-white/60">
              Prezzo Early Adopter
            </div>
            <div className="text-5xl font-extrabold mb-2">
              25€ <span className="text-xl font-normal text-white/70">+ IVA</span>
            </div>
            <div className="text-white/70 mb-6">una tantum</div>
            <div className="space-y-3 text-left max-w-sm mx-auto mb-8">
              {[
                "100 ritiri inclusi nel pacchetto",
                "Dashboard dedicata completa",
                "Badge e adesivo vetrina",
                "Supporto prioritario",
                "Commissioni su ogni transazione",
                "Dopo i 100 ritiri: solo 10€+IVA/mese",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-brand-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white/90 text-sm">{item}</span>
                </div>
              ))}
            </div>
            <button
              onClick={scrollToForm}
              className="bg-brand-accent text-brand-dark font-bold px-8 py-3 rounded-xl hover:brightness-110 transition-all"
            >
              Candidati Ora
            </button>
          </div>
        </div>
      </section>

      {/* ══════════ FORM CANDIDATURA ══════════ */}
      {showForm && (
        <section id="candidatura" className="py-16 md:py-20 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-3">
              Richiedi Adesione
            </h2>
            <p className="text-center text-gray-500 mb-10">
              Compila il modulo e il nostro team valuterà la tua candidatura
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">

              {/* ── Dati Attività ── */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Dati Attività</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Attività *
                    </label>
                    <input
                      type="text"
                      value={form.business_name}
                      onChange={(e) => updateField("business_name", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                      placeholder="Es. Mail Boxes Etc. Catania Centro"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Partita IVA *
                    </label>
                    <input
                      type="text"
                      value={form.vat_number}
                      onChange={(e) => updateField("vat_number", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                      placeholder="12345678901"
                      maxLength={11}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rappresentante Legale *
                    </label>
                    <input
                      type="text"
                      value={form.legal_representative}
                      onChange={(e) => updateField("legal_representative", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                      placeholder="Nome e Cognome"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                      placeholder="info@tuaattivita.it"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefono *
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                      placeholder="+39 095 123 4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo di Attività *
                    </label>
                    <select
                      value={form.business_type}
                      onChange={(e) => updateField("business_type", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none bg-white"
                    >
                      <option value="">Seleziona...</option>
                      {BUSINESS_TYPES.map((bt) => (
                        <option key={bt.value} value={bt.value}>
                          {bt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ── Indirizzo ── */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Indirizzo</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Indirizzo Completo *
                    </label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => updateField("address", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                      placeholder="Via Roma, 123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Città *
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                      placeholder="Catania"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Provincia *
                      </label>
                      <input
                        type="text"
                        value={form.province}
                        onChange={(e) => updateField("province", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                        placeholder="CT"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CAP *
                      </label>
                      <input
                        type="text"
                        value={form.postal_code}
                        onChange={(e) => updateField("postal_code", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                        placeholder="95100"
                        maxLength={5}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Dettagli Operativi ── */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Dettagli Operativi</h3>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Metratura disponibile (mq)
                    </label>
                    <input
                      type="number"
                      value={form.square_meters}
                      onChange={(e) => updateField("square_meters", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                      placeholder="Es. 50"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Link Google Maps (opzionale)
                    </label>
                    <input
                      type="url"
                      value={form.google_maps_url}
                      onChange={(e) => updateField("google_maps_url", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                      placeholder="https://maps.google.com/..."
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.has_shelving}
                      onChange={(e) => updateField("has_shelving", e.target.checked)}
                      className="w-4 h-4 text-brand rounded focus:ring-brand"
                    />
                    <span className="text-sm text-gray-700">Ho scaffalature / spazio di custodia</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.has_camera_device}
                      onChange={(e) => updateField("has_camera_device", e.target.checked)}
                      className="w-4 h-4 text-brand rounded focus:ring-brand"
                    />
                    <span className="text-sm text-gray-700">Ho un dispositivo con fotocamera</span>
                  </label>
                </div>
              </div>

              {/* ── Orari di Apertura ── */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Orari di Apertura *</h3>
                <div className="space-y-3">
                  {DAYS.map((day) => {
                    const isOpen = form.opening_hours[day.key] !== null;
                    const hours = form.opening_hours[day.key] as OpeningHourSlot | null;
                    return (
                      <div key={day.key} className="flex items-center gap-3 flex-wrap">
                        <label className="flex items-center gap-2 w-28 flex-shrink-0 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isOpen}
                            onChange={() => toggleDay(day.key)}
                            className="w-4 h-4 text-brand rounded focus:ring-brand"
                          />
                          <span className={`text-sm font-medium ${isOpen ? "text-gray-900" : "text-gray-400"}`}>
                            {day.label}
                          </span>
                        </label>
                        {isOpen && hours && (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={hours.open}
                              onChange={(e) => updateHour(day.key, "open", e.target.value)}
                              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                            />
                            <span className="text-gray-400 text-sm">—</span>
                            <input
                              type="time"
                              value={hours.close}
                              onChange={(e) => updateHour(day.key, "close", e.target.value)}
                              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                            />
                          </div>
                        )}
                        {!isOpen && (
                          <span className="text-sm text-gray-400 italic">Chiuso</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Motivazione ── */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Perché vuoi aderire? (opzionale)</h3>
                <textarea
                  value={form.motivation}
                  onChange={(e) => updateField("motivation", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none resize-none"
                  rows={4}
                  placeholder="Raccontaci brevemente perché la tua attività è ideale per diventare un Renthubber Store Autorizzato..."
                  maxLength={1000}
                />
                <div className="text-right text-xs text-gray-400 mt-1">
                  {form.motivation.length}/1000
                </div>
              </div>

              {/* ── Submit ── */}
              <div className="text-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-brand text-white font-bold text-lg px-10 py-4 rounded-xl shadow-lg hover:bg-brand-dark hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2 justify-center">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Invio in corso...
                    </span>
                  ) : (
                    "Invia Candidatura"
                  )}
                </button>
                <p className="text-xs text-gray-400 mt-4">
                  Inviando questo modulo accetti i{" "}
                  <a href="/termini-condizioni" className="underline hover:text-gray-600">
                    Termini e Condizioni
                  </a>{" "}
                  e la{" "}
                  <a href="/privacy-policy" className="underline hover:text-gray-600">
                    Privacy Policy
                  </a>{" "}
                  di Renthubber.
                </p>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* ══════════ CTA FINALE (se form non visibile) ══════════ */}
      {!showForm && (
        <section className="py-16 bg-brand-dark text-white text-center">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Pronto a far crescere la tua attività?
            </h2>
            <p className="text-white/70 mb-8">
              Unisciti ai primi store della rete Renthubber e ottieni condizioni esclusive.
            </p>
            <button
              onClick={scrollToForm}
              className="bg-brand-accent text-brand-dark font-bold text-lg px-8 py-4 rounded-xl hover:brightness-110 transition-all"
            >
              Candidati Ora
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default StoreAdesionePage;