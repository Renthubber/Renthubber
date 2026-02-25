import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Zap, TrendingUp, Clock, Gift, CheckCircle } from 'lucide-react';

/**
 * PromoLandingPage - Landing page per promozione lancio
 * 
 * URL: /promo/lancio
 * Reindirizza alla registrazione con ?promo=lancio
 */
const PromoLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [spotsLeft, setSpotsLeft] = useState<number>(100);

  useEffect(() => {
    const fetchSpotsLeft = async () => {
      const { supabase } = await import('../../services/supabaseClient');
      const { count } = await supabase
        .from('user_fee_overrides')
        .select('*', { count: 'exact', head: true })
        .like('reason', '%lancio%');
      
      setSpotsLeft(Math.max(0, 100 - (count || 0)));
    };
    fetchSpotsLeft();
  }, []);

  const handleSignup = () => {
    navigate('/signup?promo=lancio-catania');
  };

  return (
    <div className="min-h-screen bg-white">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D414B] via-[#0D414B] to-[#0a3a42]" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#3DD9D0] rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#3DD9D0] rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
          {/* Badge promo */}
          <div className="inline-flex items-center gap-2 bg-[#3DD9D0]/20 text-[#3DD9D0] px-4 py-2 rounded-full text-sm font-semibold mb-8 border border-[#3DD9D0]/30">
            <Gift className="w-4 h-4" />
            <span>Offerta di Lancio — Catania e Provincia — Solo {spotsLeft} posti rimasti!</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
            Guadagna noleggiando i tuoi oggetti e Spazi.
            <br />
            <span className="text-[#3DD9D0]">Zero commissioni.</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Sei un hubber di Catania e provincia? Registrati ora e <strong className="text-white">Risparmi sulle commissioni per 30 giorni</strong> o 
            fino a <strong className="text-white">€1.000 di transazioni</strong>. 
            Tutto quello che guadagni è tuo, al 100%.
          </p>

          <button
            onClick={handleSignup}
            className="inline-flex items-center gap-3 bg-[#3DD9D0] text-[#0D414B] px-8 py-4 rounded-xl text-lg font-bold hover:bg-[#2fc9c0] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 group"
          >
            Registrati Gratis
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-sm text-gray-400 mt-4">
            Iscrizione gratuita per sempre · Nessun vincolo · Cancella il tuo account quando vuoi
          </p>
        </div>
      </section>

      {/* Vantaggi */}
      <section className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#0D414B] text-center mb-12">
          Perché registrarsi adesso?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-50 rounded-2xl p-6 text-center">
            <div className="w-14 h-14 bg-[#3DD9D0]/15 rounded-xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-7 h-7 text-[#0D414B]" />
            </div>
            <h3 className="font-bold text-[#0D414B] text-lg mb-2">0% Commissioni Hubber</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Per i primi 30 giorni o €1.000 di transazioni, tutto quello che guadagni dai noleggi è tuo al 100%.
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 text-center">
            <div className="w-14 h-14 bg-[#3DD9D0]/15 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-[#0D414B]" />
            </div>
            <h3 className="font-bold text-[#0D414B] text-lg mb-2">Pagamenti Sicuri</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Transazioni protette da Stripe. I tuoi guadagni vengono trasferiti direttamente sul tuo conto.
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 text-center">
            <div className="w-14 h-14 bg-[#3DD9D0]/15 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-7 h-7 text-[#0D414B]" />
            </div>
            <h3 className="font-bold text-[#0D414B] text-lg mb-2">Inizia in 1 Minuto</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Registrati, pubblica il tuo primo annuncio e inizia a ricevere richieste di noleggio.
            </p>
          </div>
        </div>
      </section>

      {/* Come Funziona */}
      <section className="bg-[#0D414B]/5 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0D414B] text-center mb-12">
            Come funziona
          </h2>

          <div className="space-y-6">
            {[
              { step: '1', title: 'Registrati gratis', desc: 'Crea il tuo account in pochi secondi. La promo viene applicata automaticamente.' },
              { step: '2', title: 'Pubblica un annuncio', desc: 'Fotografa i tuoi oggetti o spazi, imposta il prezzo e pubblica.' },
              { step: '3', title: 'Ricevi prenotazioni', desc: 'I renter nella tua zona trovano il tuo annuncio e prenotano.' },
              { step: '4', title: 'Guadagna al 100%', desc: 'Per 30 giorni o fino a €1.000, nessuna commissione sui tuoi guadagni.' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4 bg-white rounded-xl p-5 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 bg-[#0D414B] text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-[#0D414B] mb-1">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cosa puoi noleggiare */}
      <section className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#0D414B] text-center mb-4">
          Cosa puoi noleggiare?
        </h2>
        <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
          Su RentHubber puoi noleggiare qualsiasi oggetto o spazio. Ecco qualche idea:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
       {[
            'Attrezzatura fotografica',
            'Utensili da giardino',
            'Biciclette e monopattini',
            'Attrezzi da lavoro',
            'Strumenti musicali',
            'Attrezzatura sportiva',
            'Attrezzatura da campeggio',
            'Elettrodomestici',
            'Giochi e gonfiabili',
            'Abbigliamento per eventi',
            'Proiettori e audio',
            'Articoli per feste',
            'Garage e box auto',
            'Location per eventi',
            'Sale di registrazione',
            'Spazi per coworking',
            'Magazzini e depositi',
            'Negozi temporanei',
            'Giardini e terrazze',
            'Studi fotografici',
            'E molto altro...',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
              <CheckCircle className="w-4 h-4 text-[#3DD9D0] flex-shrink-0" />
              <span className="text-sm text-[#0D414B] font-medium">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Dettagli promo */}
      <section className="bg-[#0D414B] py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-[#3DD9D0]/20 text-[#3DD9D0] px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-[#3DD9D0]/30">
            <Clock className="w-4 h-4" />
            <span>Dettagli dell'offerta</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8">
            La promo in dettaglio
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            <div className="bg-white/10 rounded-xl p-5 border border-white/10">
              <p className="text-3xl font-extrabold text-[#3DD9D0] mb-2">0%</p>
              <p className="text-gray-300 text-sm">Commissioni hubber</p>
            </div>
            <div className="bg-white/10 rounded-xl p-5 border border-white/10">
              <p className="text-3xl font-extrabold text-[#3DD9D0] mb-2">30</p>
              <p className="text-gray-300 text-sm">Giorni di promo</p>
            </div>
            <div className="bg-white/10 rounded-xl p-5 border border-white/10">
              <p className="text-3xl font-extrabold text-[#3DD9D0] mb-2">€1.000</p>
              <p className="text-gray-300 text-sm">Tetto transazioni</p>
            </div>
          </div>

          <div className="text-left bg-white/5 rounded-xl p-6 mb-8 border border-white/10">
            <h4 className="text-white font-bold mb-3 text-sm">Regolamento della promozione</h4>
            <ul className="text-gray-400 text-xs space-y-2 list-disc list-inside">
              <li>La promozione è riservata ai primi 100 nuovi utenti che si registrano come <strong className="text-gray-300">hubber</strong> tramite questa pagina.</li>
              <li>La promo è attiva solo per hubber residenti a <strong className="text-gray-300">Catania e provincia</strong>.</li>
              <li>Le commissioni percentuali hubber sono azzerate per <strong className="text-gray-300">30 giorni</strong> dalla registrazione o fino a <strong className="text-gray-300">€1.000 di transazioni</strong> completate (il primo dei due limiti).</li>
              <li>Le fee fisse della piattaforma restano invariate.</li>
              <li>Al termine della promozione si applicano le commissioni standard.</li>
              <li>RentHubber si riserva il diritto di modificare o terminare la promozione in qualsiasi momento.</li>
              <li>La promozione è limitata ai <strong className="text-gray-300">primi 100 hubber</strong> che si registrano tramite questa pagina.</li>
            </ul>
          </div>

          <button
            onClick={handleSignup}
            className="inline-flex items-center gap-3 bg-[#3DD9D0] text-[#0D414B] px-8 py-4 rounded-xl text-lg font-bold hover:bg-[#2fc9c0] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 group"
          >
            Approfitta dell'offerta
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer minimal */}
      <footer className="py-8 text-center">
        <p className="text-gray-400 text-sm">
          © {new Date().getFullYear()} RentHubber — La piattaforma di noleggio oggetti e spazi vicino a te.
        </p>
      </footer>
    </div>
  );
};

export default PromoLandingPage;