import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* 4 COLONNE ALLINEATE PULITE */}
        <div className="flex flex-col md:flex-row md:justify-between gap-12">
          
          {/* COLONNA 1 */}
          <div className="max-w-sm">
            <div className="flex items-center mb-4">
              <img 
                src="https://upyznglekmynztmydtxi.supabase.co/storage/v1/object/public/images/logo-renthubber.png" 
                alt="Renthubber" 
                className="h-16 w-auto"
              />
            </div>
            <p className="text-gray-500 text-sm">
              Noleggia ciò che ti serve. Guadagna da ciò che non usi. La piattaforma per oggetti e spazi vicino a te.
            </p>
          </div>

          {/* COLONNA 2 – Renthubber */}
          <div className="max-w-[190px]">
            <h3 className="font-semibold text-gray-900 mb-4">Renthubber</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/chi-siamo" className="hover:text-brand">Chi siamo</Link></li>
              <li><Link to="/come-funziona" className="hover:text-brand">Come funziona</Link></li>
              <li><Link to="/sicurezza" className="hover:text-brand">Sicurezza</Link></li>
              <li><Link to="/tariffe" className="hover:text-brand">Tariffe e Commissioni</Link></li>
              <li><Link to="/invita-amico" className="hover:text-brand">Programma Invita un amico</Link></li>
              <li><Link to="/super-hubber" className="hover:text-brand">Programma SuperHubber</Link></li>
              <li><Link to="/investitori" className="hover:text-brand">Investitori</Link></li>
            </ul>
          </div>

          {/* COLONNA 3 – Supporto */}
          <div className="max-w-[190px]">
            <h3 className="font-semibold text-gray-900 mb-4">Supporto</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/faq" className="hover:text-brand">Domande frequenti</Link></li>
              <li><Link to="/diventare-hubber" className="hover:text-brand">Come diventare Hubber</Link></li>
              <li><Link to="/assistenza" className="hover:text-brand">Centro assistenza</Link></li>
              <li><Link to="/cancellazione" className="hover:text-brand">Regole di cancellazione</Link></li>
              <li><Link to="/segnala" className="hover:text-brand">Segnala un problema</Link></li>
              <li><Link to="/contatti" className="hover:text-brand">Contattaci</Link></li>
            </ul>
          </div>

          {/* COLONNA 4 – Legali */}
          <div className="max-w-[190px]">
            <h3 className="font-semibold text-gray-900 mb-4">Legale</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/cookie-policy" className="hover:text-brand">Cookie policy</Link></li>
              <li><Link to="/linee-guida" className="hover:text-brand">Linee guida della community</Link></li>
              <li><Link to="/antidiscriminazione" className="hover:text-brand">Politica antidiscriminazione</Link></li>
            </ul>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} Renthubber è una piattaforma di Amalis Group S.r.l.</p>

          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/privacy-policy" className="hover:text-gray-600">Privacy</Link>
            <Link to="/termini-condizioni" className="hover:text-gray-600">Termini</Link>
            <Link to="/mappa-sito" className="hover:text-gray-600">Mappa del sito</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};
