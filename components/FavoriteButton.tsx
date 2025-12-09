import React from 'react';
import { Heart } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';

interface FavoriteButtonProps {
  listingId: string;
  userId?: string;
  variant?: 'card' | 'detail';
  className?: string;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  listingId,
  userId,
  variant = 'card',
  className = '',
}) => {
  const { isFavorite, toggleFavorite } = useFavorites(listingId, userId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // ✅ Se non è loggato, mostra messaggio per login
    if (!userId) {
      alert('Accedi o crea un account per aggiungere questo annuncio ai preferiti! 🔐');
      return;
    }
    
    // Altrimenti toggle normale
    await toggleFavorite();
  };

  if (variant === 'card') {
    // Versione per le card - icona compatta in alto a SINISTRA
    return (
      <button
        onClick={handleClick}
        className={`absolute top-1.5 left-1.5 z-10 
                   w-7 h-7 rounded-full
                   bg-white/90 hover:bg-white
                   shadow-md hover:shadow-lg
                   transition-all duration-200
                   flex items-center justify-center
                   ${className}`}
        aria-label={isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
      >
        <Heart
          className={`w-4 h-4 transition-all duration-200 ${
            isFavorite
              ? 'fill-red-500 text-red-500'
              : 'text-gray-700 hover:scale-110'
          }`}
        />
      </button>
    );
  }

  // Versione per il listing detail - SOLO ICONA senza testo
  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-lg
                 border border-gray-300 hover:border-gray-400
                 bg-white hover:bg-gray-50
                 transition-all duration-200
                 ${className}`}
      aria-label={isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
    >
      <Heart
        className={`w-5 h-5 transition-all duration-200 ${
          isFavorite
            ? 'fill-red-500 text-red-500'
            : 'text-gray-700'
        }`}
      />
    </button>
  );
};