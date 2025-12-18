import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll immediato in cima alla pagina
    window.scrollTo(0, 0);
    
    // Backup: forza scroll anche se il primo non funziona
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);
  }, [pathname]); // Si attiva ogni volta che cambia l'URL

  return null; // Componente invisibile
};

export default ScrollToTop;