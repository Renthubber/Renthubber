import React, { useMemo, useState } from "react";

/**
 * RentHubber – City Prelaunch Page
 * - Single-file preview component
 * - TailwindCSS classes used with RentHubber brand colors
 * - No backend: simulates submit + local counter
 * 
 * Brand Colors:
 * - Primary: #0A4759 (blu scuro)
 * - Secondary: #3DD9D0 (turchese)
 */

type WaitlistRole = "renter" | "hubber" | "both";

type City = {
  slug: string;
  name: string;
  isActive: boolean;
  waitlistCount: number;
};

const mockCity: City = {
  slug: "milano",
  name: "Milano",
  isActive: false,
  waitlistCount: 128,
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function CityPrelaunchPage() {
  const city = mockCity;

  const [role, setRole] = useState<WaitlistRole>("both");
  const [email, setEmail] = useState<string>("");
  const [count, setCount] = useState<number>(city.waitlistCount);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const title = useMemo(() => {
    return city.isActive
      ? `RentHubber ${city.name}`
      : `RentHubber sta arrivando a ${city.name}`;
  }, [city.isActive, city.name]);

  function validateEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    setErrorMsg("");

    const v = email.trim();
    if (!validateEmail(v)) {
      setStatus("error");
      setErrorMsg("Inserisci un'email valida.");
      return;
    }

    // Simulate successful submission
    setStatus("success");
    setCount((c) => c + 1);
    setEmail("");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0A4759] to-[#3DD9D0]">
              <span className="text-lg font-bold text-white">R</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold text-[#0A4759]">RentHubber</div>
              <div className="text-xs text-slate-500">Non comprarlo. Noleggialo.</div>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a className="text-slate-700 transition-colors hover:text-[#0A4759]" href="#come-funziona">
              Come funziona
            </a>
            <a className="text-slate-700 transition-colors hover:text-[#0A4759]" href="#vantaggi">
              Vantaggi
            </a>
            <a className="text-slate-700 transition-colors hover:text-[#0A4759]" href="#categorie">
              Categorie
            </a>
            <a
              className="rounded-xl border border-[#0A4759] px-3 py-1.5 text-[#0A4759] transition-colors hover:bg-[#0A4759]/5"
              href="#"
              onClick={(ev) => ev.preventDefault()}
            >
              Accedi
            </a>
          </nav>

          <a
            href="#waitlist"
            className="rounded-xl bg-[#0A4759] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0A4759]/90 hover:shadow-md"
          >
            Avvisami
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-12 md:pb-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#3DD9D0]/30 bg-[#3DD9D0]/10 px-3 py-1 text-xs font-medium text-[#0A4759]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#3DD9D0]" />
              <span>In arrivo</span>
              <span className="text-slate-400">•</span>
              <span className="font-semibold">{city.name}</span>
            </div>

            <h1 className="mt-4 bg-gradient-to-r from-[#0A4759] to-[#3DD9D0] bg-clip-text text-3xl font-extrabold tracking-tight text-transparent md:text-5xl">
              {title}
            </h1>

            <p className="mt-4 max-w-prose text-base text-slate-600 md:text-lg">
              Noleggia <span className="font-semibold text-[#0A4759]">oggetti</span> e{' '}
              <span className="font-semibold text-[#0A4759]">spazi</span> tra privati in modo semplice.
              Iscriviti alla lista d'attesa: più cresce, prima apriamo.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="#waitlist"
                className="rounded-2xl bg-[#0A4759] px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#0A4759]/90 hover:shadow-xl"
              >
                Unisciti alla lista
              </a>
              <a
                href="#categorie"
                className="rounded-2xl border-2 border-[#3DD9D0] bg-white px-5 py-3 text-sm font-semibold text-[#0A4759] transition-all hover:bg-[#3DD9D0]/10"
              >
                Guarda cosa troverai
              </a>
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#3DD9D0]/30 bg-gradient-to-r from-white to-[#3DD9D0]/5 p-4 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#3DD9D0]/20 to-[#3DD9D0]/10">
                <span className="text-2xl">🔥</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-[#0A4759]">
                  <span className="tabular-nums">{count}</span> persone in attesa a {city.name}
                </div>
                <div className="text-xs text-slate-500">Più cresce la lista, prima apriamo la città.</div>
              </div>
            </div>
          </div>

          {/* Waitlist Card */}
          <div id="waitlist" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-[#0A4759]">Lista d'attesa – {city.name}</div>
                <div className="mt-1 text-xs text-slate-500">Niente spam. Ti scriviamo solo per il lancio.</div>
              </div>
              <div className="rounded-full bg-gradient-to-r from-[#3DD9D0]/20 to-[#3DD9D0]/10 px-3 py-1 text-xs font-medium text-[#0A4759]">
                Bonus lancio
              </div>
            </div>

            <form className="mt-5 space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="text-sm font-semibold text-[#0A4759]">Come vuoi usare RentHubber?</label>
                <div className="mt-2 grid gap-2 md:grid-cols-3">
                  {(
                    [
                      { k: "renter", label: "Voglio noleggiare" },
                      { k: "hubber", label: "Voglio mettere a noleggio" },
                      { k: "both", label: "Entrambi" },
                    ] as const
                  ).map((o) => (
                    <button
                      key={o.k}
                      type="button"
                      onClick={() => setRole(o.k)}
                      className={cn(
                        "rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition-all",
                        role === o.k
                          ? "border-[#0A4759] bg-gradient-to-br from-[#0A4759] to-[#3DD9D0] text-white shadow-md"
                          : "border-slate-200 bg-white text-slate-800 hover:border-[#3DD9D0] hover:bg-[#3DD9D0]/5"
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-[#0A4759]">Email</label>
                <input
                  type="email"
                  placeholder="tuaemail@esempio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all",
                    status === "error"
                      ? "border-red-500 bg-red-50"
                      : "border-slate-200 bg-white focus:border-[#3DD9D0] focus:ring-2 focus:ring-[#3DD9D0]/20"
                  )}
                />
              </div>

              {status === "error" && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5">⚠️</span>
                    <span>{errorMsg}</span>
                  </div>
                </div>
              )}

              {status === "success" && (
                <div className="rounded-xl bg-gradient-to-r from-[#3DD9D0]/10 to-[#3DD9D0]/5 px-4 py-3 text-sm text-[#0A4759]">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5">✅</span>
                    <div>
                      <div className="font-semibold">Iscrizione completata!</div>
                      <div className="mt-1 text-xs">Ti avviseremo appena {city.name} sarà attiva.</div>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-[#0A4759] to-[#3DD9D0] px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl"
              >
                Avvisami quando apre
              </button>

              <div className="text-center text-xs text-slate-500">
                Iscrivendoti accetti <a href="#" className="text-[#0A4759] hover:underline">Termini</a> e <a href="#" className="text-[#0A4759] hover:underline">Privacy</a>
              </div>
            </form>

            <div className="mt-6 grid gap-3 rounded-3xl bg-gradient-to-br from-[#3DD9D0]/10 to-[#3DD9D0]/5 p-4">
              <div className="text-sm font-semibold text-[#0A4759]">Vantaggi al lancio</div>
              <ul className="grid gap-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">✅</span> Accesso anticipato alla città
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">✅</span> Priorità per i primi Hubber
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">✅</span> Bonus promo dedicati ai primi iscritti
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Come funziona */}
      <section id="come-funziona" className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-2xl font-extrabold text-[#0A4759]">Come funziona (in 3 step)</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                emoji: "🔍",
                t: "Cerca",
                d: "Trova oggetti e spazi vicino a te, confronta prezzi e disponibilità.",
              },
              {
                emoji: "📅",
                t: "Prenota",
                d: "Blocca le date e ricevi conferma. Pagamento e regole chiare.",
              },
              {
                emoji: "✨",
                t: "Ritira e usa",
                d: "Ritiro/consegna secondo accordi. Recensioni per fiducia e qualità.",
              },
            ].map((s) => (
              <div key={s.t} className="group rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 transition-all hover:border-[#3DD9D0] hover:shadow-lg">
                <div className="mb-3 text-3xl">{s.emoji}</div>
                <div className="text-base font-semibold text-[#0A4759]">{s.t}</div>
                <div className="mt-2 text-sm text-slate-600">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vantaggi */}
      <section id="vantaggi" className="border-t bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-2xl font-extrabold text-[#0A4759]">Perché iscriversi adesso</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              { emoji: "⚡", title: "Accesso anticipato", desc: "Entri prima degli altri e trovi per primo le migliori opportunità." },
              { emoji: "🎁", title: "Bonus lancio", desc: "Promo dedicate ai primi iscritti (wallet / fee ridotte / vantaggi)." },
              { emoji: "👑", title: "Priorità Hubber", desc: "Se vuoi pubblicare annunci, ti contattiamo prima per partire forte." },
              { emoji: "💬", title: "Supporto dedicato", desc: "Ti aiutiamo a creare annunci chiari e a ricevere le prime richieste." },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-6 transition-all hover:border-[#3DD9D0] hover:shadow-md">
                <div className="mb-3 text-3xl">{item.emoji}</div>
                <div className="text-sm font-semibold text-[#0A4759]">{item.title}</div>
                <div className="mt-2 text-sm text-slate-600">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categorie preview */}
      <section id="categorie" className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-[#0A4759]">Cosa potrai noleggiare a {city.name}</h2>
              <p className="mt-2 max-w-prose text-sm text-slate-600">
                Anteprima categorie (in prelancio). Al lancio troverai annunci reali e disponibili.
              </p>
            </div>
            <a
              href="#waitlist"
              className="rounded-2xl bg-gradient-to-r from-[#0A4759] to-[#3DD9D0] px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg"
            >
              Avvisami
            </a>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6">
              <div className="mb-1 text-2xl">🔧</div>
              <div className="text-sm font-semibold text-[#0A4759]">Oggetti</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {["Fai-da-te", "Elettronica", "Sport", "Eventi & Party", "Giardinaggio", "Attrezzature"].map(
                  (c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800 transition-all hover:border-[#3DD9D0] hover:bg-[#3DD9D0]/5"
                    >
                      {c}
                      <div className="mt-1 text-xs font-normal text-slate-500">Disponibile al lancio</div>
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6">
              <div className="mb-1 text-2xl">🏢</div>
              <div className="text-sm font-semibold text-[#0A4759]">Spazi</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {["Sale riunioni", "Location eventi", "Garage", "Magazzini", "Studi", "Terreni"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800 transition-all hover:border-[#3DD9D0] hover:bg-[#3DD9D0]/5"
                  >
                    {c}
                    <div className="mt-1 text-xs font-normal text-slate-500">Disponibile al lancio</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-1 text-xl">❓</div>
            <div className="text-sm font-semibold text-[#0A4759]">FAQ</div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-sm font-semibold text-[#0A4759]">Quando apre {city.name}?</div>
                <div className="mt-1 text-sm text-slate-600">
                  Appena raggiungiamo abbastanza utenti e annunci per partire bene.
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-[#0A4759]">Posso già pubblicare annunci?</div>
                <div className="mt-1 text-sm text-slate-600">
                  Non ancora. Se sei Hubber, entra in lista e ti avvisiamo per primo.
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-[#0A4759]">RentHubber è attivo altrove?</div>
                <div className="mt-1 text-sm text-slate-600">
                  Sì, alcune città sono già attive. Qui stiamo preparando il lancio.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col gap-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#0A4759] to-[#3DD9D0]">
                  <span className="text-sm font-bold text-white">R</span>
                </div>
                <div>
                  <div className="font-bold text-[#0A4759]">RentHubber</div>
                  <div className="text-xs text-slate-500">Non comprarlo. Noleggialo.</div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <a className="transition-colors hover:text-[#0A4759]" href="#" onClick={(e) => e.preventDefault()}>
                Termini
              </a>
              <a className="transition-colors hover:text-[#0A4759]" href="#" onClick={(e) => e.preventDefault()}>
                Privacy
              </a>
              <a className="transition-colors hover:text-[#0A4759]" href="#" onClick={(e) => e.preventDefault()}>
                Supporto
              </a>
              <a className="transition-colors hover:text-[#0A4759]" href="#" onClick={(e) => e.preventDefault()}>
                Come funziona
              </a>
            </div>
          </div>
          <div className="mt-6 border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
            © 2024 RentHubber. Tutti i diritti riservati.
          </div>
        </div>
      </footer>
    </div>
  );
}