import React, { useEffect, useState } from 'react';
import { Heart, Trash2, MapPin, Star } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';
import { User } from '../types';

interface FavoritesProps {
  user: User;
  onListingClick: (listingId: string) => void;
}

export const Favorites: React.FC<FavoritesProps> = ({ user, onListingClick }) => {
  const { favorites, loading, loadFavorites, removeFavorite } = useFavorites(undefined, user.id);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleRemove = async (favoriteId: string) => {
    setRemovingId(favoriteId);
    await removeFavorite(favoriteId);
    setRemovingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Caricamento...</div>
      </div>
    );
  }

  // Empty state
  if (favorites.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
            <Heart className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Nessun annuncio salvato
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Inizia a esplorare gli annunci e salva i tuoi preferiti cliccando sul cuore.
            Potrai trovarli tutti qui!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Heart className="w-8 h-8 text-brand fill-brand" />
          <h1 className="text-3xl font-bold text-gray-900">I miei preferiti</h1>
        </div>
        <p className="text-gray-600">
          Hai salvato {favorites.length} {favorites.length === 1 ? 'annuncio' : 'annunci'}
        </p>
      </div>

      {/* Grid dei preferiti */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {favorites.map((favorite) => {
          const listing = favorite.listing;
          if (!listing) return null;

          const coverImage = listing.images?.[0] || 'https://via.placeholder.com/400x300';
          const isRemoving = removingId === favorite.id;

          return (
            <div
              key={favorite.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Immagine */}
              <div
                onClick={() => onListingClick(listing.id)}
                className="relative h-48 bg-gray-200 cursor-pointer group"
              >
                <img
                  src={coverImage}
                  alt={listing.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {listing.subCategory && (
                  <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-semibold text-brand uppercase">
                    {listing.subCategory}
                  </div>
                )}
              </div>

              {/* Contenuto */}
              <div className="p-4">
                <div
                  onClick={() => onListingClick(listing.id)}
                  className="cursor-pointer mb-3"
                >
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 hover:text-brand transition-colors">
                    {listing.title}
                  </h3>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="line-clamp-1">{listing.location}</span>
                  </div>
                  {listing.rating && (
                    <div className="flex items-center text-sm text-gray-900">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                      <span>{listing.rating}</span>
                    </div>
                  )}
                </div>

                {/* Footer con prezzo e rimuovi */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div>
                    <span className="font-bold text-lg text-brand">€{listing.price}</span>
                    <span className="text-gray-600 text-sm">/{listing.priceUnit}</span>
                  </div>
                  <button
                    onClick={() => handleRemove(favorite.id)}
                    disabled={isRemoving}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    aria-label="Rimuovi dai preferiti"
                  >
                    {isRemoving ? (
                      <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Data aggiunta */}
                <div className="text-xs text-gray-500 mt-2">
                  Aggiunto il {new Date(favorite.created_at).toLocaleDateString('it-IT')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};