import React from 'react';

interface FooterProps {
  setView: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setView }) => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* 4 COLONNE ALLINEATE PULITE */}
        <div className="flex flex-col md:flex-row md:justify-between gap-12">
          
          {/* COLONNA 1 */}
          <div className="max-w-sm">
            <div className="flex items-center mb-4">
              <img 
                src="https://upyznglekmynztmydtxi.supabase.co/storage/v1/object/public/images/logo-renthubber.png.png" 
                alt="Renthubber" 
                className="h-16 w-auto"
              />
            </div>
            <p className="text-gray-500 text-sm">
              La piattaforma di sharing economy per noleggiare oggetti e spazi in sicurezza. Risparmia, guadagna e riduci gli sprechi.
            </p>
          </div>

          {/* COLONNA 2 – Renthubber */}
          <div className="max-w-[190px]">
            <h3 className="font-semibold text-gray-900 mb-4">Renthubber</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><span onClick={() => setView('chi-siamo')} className="hover:text-brand cursor-pointer">Chi siamo</span></li>
              <li><span onClick={() => setView('come-funziona')} className="hover:text-brand cursor-pointer">Come funziona</span></li>
              <li><span onClick={() => setView('sicurezza')} className="hover:text-brand cursor-pointer">Sicurezza</span></li>
              <li><span onClick={() => setView('tariffe')} className="hover:text-brand cursor-pointer">Tariffe e Commissioni</span></li>
              <li><span onClick={() => setView('invita-amico')} className="hover:text-brand cursor-pointer">Programma Invita un amico</span></li>
              <li><span onClick={() => setView('super-hubber')} className="hover:text-brand cursor-pointer">Programma SuperHubber</span></li>
              <li><span onClick={() => setView('investitori')} className="hover:text-brand cursor-pointer">Investitori</span></li>
            </ul>
          </div>

          {/* COLONNA 3 – Supporto */}
          <div className="max-w-[190px]">
            <h3 className="font-semibold text-gray-900 mb-4">Supporto</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><span onClick={() => setView('faq')} className="hover:text-brand cursor-pointer">Domande frequenti</span></li>
              <li><span onClick={() => setView('diventare-hubber')} className="hover:text-brand cursor-pointer">Come diventare Hubber</span></li>
              <li><span onClick={() => setView('assistenza')} className="hover:text-brand cursor-pointer">Centro assistenza</span></li>
              <li><span onClick={() => setView('cancellazione')} className="hover:text-brand cursor-pointer">Regole di cancellazione</span></li>
              <li><span onClick={() => setView('segnala')} className="hover:text-brand cursor-pointer">Segnala un problema</span></li>
              <li><span onClick={() => setView('contatti')} className="hover:text-brand cursor-pointer">Contattaci</span></li>
            </ul>
          </div>

          {/* COLONNA 4 – Legali */}
          <div className="max-w-[190px]">
            <h3 className="font-semibold text-gray-900 mb-4">Legale</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><span onClick={() => setView('cookie')} className="hover:text-brand cursor-pointer">Cookie policy</span></li>
              <li><span onClick={() => setView('linee-guida')} className="hover:text-brand cursor-pointer">Linee guida della community</span></li>
              <li><span onClick={() => setView('antidiscriminazione')} className="hover:text-brand cursor-pointer">Politica antidiscriminazione</span></li>
            </ul>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>© 2025 Renthubber è una piattaforma di Amalis Group S.r.l.</p>

          <div className="flex space-x-6 mt-4 md:mt-0">
            <span onClick={() => setView('privacy')} className="hover:text-gray-600 cursor-pointer">Privacy</span>
            <span onClick={() => setView('termini')} className="hover:text-gray-600 cursor-pointer">Termini</span>
            <span onClick={() => setView('mappa-sito')} className="hover:text-gray-600 cursor-pointer">Mappa del sito</span>
          </div>
        </div>

      </div>
    </footer>
  );
};