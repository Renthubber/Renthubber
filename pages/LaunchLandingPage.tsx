import React, { useState } from "react";
import { supabase } from "../services/supabaseClient";

/**
 * RentHubber – Launch Landing Page
 * Landing page per comunicare città attive e raccogliere interesse per espansione
 * 
 * Brand Colors:
 * - Primary: #0A4759 (blu scuro)
 * - Secondary: #3DD9D0 (turchese)
 */

const upcomingCities = [
  "Roma",
  "Milano", 
  "Napoli",
  "Torino",
  "Palermo",
  "Genova",
  "Bologna",
  "Firenze",
  "Bari",
  "Venezia"
];

export default function LaunchLandingPage() {
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [otherCity, setOtherCity] = useState("");
  const [userType, setUserType] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    // Validazione
    if (!email || !validateEmail(email)) {
      setStatus("error");
      setErrorMsg("Inserisci un'email valida");
      return;
    }

    if (!city) {
      setStatus("error");
      setErrorMsg("Seleziona una città");
      return;
    }

    if (city === "Altra città" && !otherCity.trim()) {
      setStatus("error");
      setErrorMsg("Specifica quale città");
      return;
    }

    if (!userType) {
      setStatus("error");
      setErrorMsg("Seleziona come vuoi usare Renthubber");
      return;
    }

    // Salva su Supabase
    try {
      const finalCity = city === "Altra città" ? otherCity : city;
      
      const { error } = await supabase
        .from("city_waitlist")
        .insert({
          email: email.trim().toLowerCase(),
          city: finalCity,
          user_type: userType
        });

      if (error) {
        console.error("Supabase error:", error);
        setStatus("error");
        setErrorMsg("Errore nel salvataggio. Riprova.");
        return;
      }

      // Successo!
      setStatus("success");
      setEmail("");
      setCity("");
      setOtherCity("");
      setUserType("");

      // Reset dopo 5 secondi
      setTimeout(() => {
        setStatus("idle");
      }, 5000);

    } catch (err) {
      console.error("Error:", err);
      setStatus("error");
      setErrorMsg("Errore imprevisto. Riprova.");
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center md:py-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#3DD9D0]/30 bg-[#3DD9D0]/10 px-4 py-2 text-sm font-medium text-[#0A4759]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#3DD9D0]" />
          <span>Attivo a Catania</span>
        </div>

        <h1 className="mt-6 bg-gradient-to-r from-[#0A4759] to-[#3DD9D0] bg-clip-text text-4xl font-extrabold tracking-tight text-transparent md:text-6xl">
          Renthubber è attivo<br />a Catania! 🎉
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 md:text-xl">
          Noleggia <span className="font-semibold text-[#0A4759]">oggetti</span> e{' '}
          <span className="font-semibold text-[#0A4759]">spazi</span> tra privati.
          Risparmia denaro, guadagna dai tuoi beni inutilizzati, riduci l'impatto ambientale.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="/"
            className="rounded-2xl bg-gradient-to-r from-[#0A4759] to-[#3DD9D0] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl"
          >
            Inizia a noleggiare a Catania
          </a>
          <a
            href="#waitlist"
            className="rounded-2xl border-2 border-[#3DD9D0] bg-white px-8 py-4 text-base font-semibold text-[#0A4759] transition-all hover:bg-[#3DD9D0]/10"
          >
            Segnala la tua città
          </a>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-12 grid max-w-3xl gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-3xl font-bold text-[#0A4759]">🏙️</div>
            <div className="mt-2 text-2xl font-bold text-[#0A4759]">Catania</div>
            <div className="text-sm text-slate-600">Città attiva</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-3xl font-bold text-[#0A4759]">🚀</div>
            <div className="mt-2 text-2xl font-bold text-[#0A4759]">10+</div>
            <div className="text-sm text-slate-600">Città in arrivo</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-3xl font-bold text-[#0A4759]">💰</div>
            <div className="mt-2 text-2xl font-bold text-[#0A4759]">Risparmia</div>
            <div className="text-sm text-slate-600">Fino all'80%</div>
          </div>
        </div>
      </section>

      {/* Come Funziona */}
      <section className="border-t bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-extrabold text-[#0A4759]">
            Come funziona
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3DD9D0]/20 to-[#3DD9D0]/10">
                <span className="text-3xl">🔍</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#0A4759]">1. Cerca</h3>
              <p className="mt-2 text-sm text-slate-600">
                Trova oggetti e spazi vicino a te. Confronta prezzi e disponibilità.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3DD9D0]/20 to-[#3DD9D0]/10">
                <span className="text-3xl">📅</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#0A4759]">2. Prenota</h3>
              <p className="mt-2 text-sm text-slate-600">
                Blocca le date con un click. Pagamento sicuro e regole chiare.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3DD9D0]/20 to-[#3DD9D0]/10">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#0A4759]">3. Usa e guadagna</h3>
              <p className="mt-2 text-sm text-slate-600">
                Ritira, usa e restituisci. Oppure metti a noleggio e guadagna.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Prossime Città */}
      <section className="border-t bg-gradient-to-b from-slate-50 to-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-[#0A4759]">
              🚀 Prossime città in arrivo
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Stiamo espandendo in tutta Italia. Lascia la tua email per essere il primo
              a saperlo quando apriamo nella tua città!
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-5">
            {upcomingCities.map((city) => (
              <div
                key={city}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-all hover:border-[#3DD9D0] hover:shadow-md"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center">
                  <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none">
                    <defs>
                      <linearGradient id={`gradient-${city}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0A4759" />
                        <stop offset="100%" stopColor="#3DD9D0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                      fill={`url(#gradient-${city})`}
                    />
                  </svg>
                </div>
                <div className="mt-2 font-semibold text-[#0A4759]">{city}</div>
                <div className="mt-1 text-xs text-slate-500">In arrivo</div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600">
              Non vedi la tua città?{' '}
              <a href="#waitlist" className="font-semibold text-[#0A4759] underline">
                Segnalacela!
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Waitlist Form */}
      <section id="waitlist" className="border-t bg-white py-16">
        <div className="mx-auto max-w-3xl px-4">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 shadow-xl md:p-12">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#3DD9D0]/20 to-[#3DD9D0]/10 px-4 py-2 text-sm font-medium text-[#0A4759]">
                <span>🎁</span>
                <span>Bonus per i primi iscritti</span>
              </div>
              <h2 className="mt-4 text-3xl font-extrabold text-[#0A4759]">
                Porta Renthubber nella tua città
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Lascia la tua email e scegli la città. Ti avviseremo non appena apriremo
                e riceverai vantaggi esclusivi come primo utente!
              </p>
            </div>

            {/* Custom Waitlist Form */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-[#0A4759]">
                  Indirizzo email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tuaemail@esempio.com"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-[#3DD9D0] focus:ring-2 focus:ring-[#3DD9D0]/20"
                  disabled={status === "loading"}
                />
              </div>

              {/* Città */}
              <div>
                <label className="block text-sm font-semibold text-[#0A4759]">
                  In quale città vorresti Renthubber?
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-[#3DD9D0] focus:ring-2 focus:ring-[#3DD9D0]/20"
                  disabled={status === "loading"}
                >
                  <option value="">Seleziona una città</option>
                  {upcomingCities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="Altra città">Altra città</option>
                </select>
              </div>

              {/* Campo condizionale per altra città */}
              {city === "Altra città" && (
                <div className="animate-fadeIn">
                  <label className="block text-sm font-semibold text-[#0A4759]">
                    Quale città?
                  </label>
                  <input
                    type="text"
                    value={otherCity}
                    onChange={(e) => setOtherCity(e.target.value)}
                    placeholder="Scrivi la tua città"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-[#3DD9D0] focus:ring-2 focus:ring-[#3DD9D0]/20"
                    disabled={status === "loading"}
                  />
                </div>
              )}

              {/* Tipo utente */}
              <div>
                <label className="block text-sm font-semibold text-[#0A4759]">
                  Come vorresti usare Renthubber?
                </label>
                <div className="mt-3 space-y-2">
                  {[
                    { value: "noleggiare", label: "Voglio noleggiare oggetti e spazi" },
                    { value: "mettere_a_noleggio", label: "Voglio mettere a noleggio i miei beni" },
                    { value: "entrambi", label: "Entrambi" }
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-[#3DD9D0] hover:bg-[#3DD9D0]/5"
                    >
                      <input
                        type="radio"
                        name="userType"
                        value={option.value}
                        checked={userType === option.value}
                        onChange={(e) => setUserType(e.target.value)}
                        className="h-4 w-4 accent-[#0A4759]"
                        disabled={status === "loading"}
                      />
                      <span className="text-sm font-medium text-slate-700">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Messaggi di errore/successo */}
              {status === "error" && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-lg">⚠️</span>
                    <p className="text-sm font-medium text-red-800">{errorMsg}</p>
                  </div>
                </div>
              )}

              {status === "success" && (
                <div className="rounded-xl bg-gradient-to-r from-[#3DD9D0]/10 to-[#3DD9D0]/5 border border-[#3DD9D0]/30 p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-lg">✅</span>
                    <div>
                      <p className="text-sm font-semibold text-[#0A4759]">
                        Perfetto! Sei nella lista!
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Ti avviseremo non appena apriremo nella tua città.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-xl bg-gradient-to-r from-[#0A4759] to-[#3DD9D0] px-6 py-4 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === "loading" ? "Invio in corso..." : "Avvisami quando apre"}
              </button>

              <p className="text-center text-xs text-slate-500">
                Iscrivendoti accetti i nostri{" "}
                <a href="/termini-condizioni" className="text-[#0A4759] underline">
                  Termini e Condizioni
                </a>{" "}
                e la{" "}
                <a href="/privacy-policy" className="text-[#0A4759] underline">
                  Privacy Policy
                </a>
              </p>
            </form>

            <div className="mt-6 grid gap-4 rounded-2xl bg-gradient-to-br from-[#3DD9D0]/10 to-[#3DD9D0]/5 p-6 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl">⚡</div>
                <div className="mt-2 text-sm font-semibold text-[#0A4759]">Accesso anticipato</div>
                <div className="text-xs text-slate-600">Entra prima degli altri</div>
              </div>
              <div className="text-center">
                <div className="text-2xl">🎁</div>
                <div className="mt-2 text-sm font-semibold text-[#0A4759]">Bonus lancio</div>
                <div className="text-xs text-slate-600">Promo ai primi iscritti</div>
              </div>
              <div className="text-center">
                <div className="text-2xl">👑</div>
                <div className="mt-2 text-sm font-semibold text-[#0A4759]">Priorità Hubber</div>
                <div className="text-xs text-slate-600">Pubblica per primo</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Catania */}
      <section className="border-t bg-gradient-to-br from-[#0A4759] to-[#3DD9D0] py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-extrabold md:text-4xl">
            Sei di Catania? Inizia subito! 🎉
          </h2>
          <p className="mt-4 text-lg opacity-90">
            Il marketplace è già attivo. Noleggia quello che ti serve o metti a noleggio
            i tuoi oggetti inutilizzati.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/"
              className="rounded-2xl bg-white px-8 py-4 text-base font-semibold text-[#0A4759] shadow-lg transition-all hover:shadow-xl"
            >
              Vai al marketplace
            </a>
            <a
              href="/signup"
              className="rounded-2xl border-2 border-white bg-transparent px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/10"
            >
              Registrati gratis
            </a>
          </div>
        </div>
      </section>

      {/* Info Footer */}
      <div className="border-t bg-white py-6">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center text-sm text-slate-500">
            Attivo a Catania • Prossimamente in tutta Italia
          </div>
        </div>
      </div>
    </div>
  );
}