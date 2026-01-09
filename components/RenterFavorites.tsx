import React, { useState, useEffect } from 'react';
import { Heart, MapPin } from 'lucide-react';
import { supabase } from "../services/supabaseClient";
import { Listing } from '../types';

interface RenterFavoritesProps {
  currentUser: any;
  onListingClick: (listing: Listing) => void;
  onExploreClick: () => void;
}

export const RenterFavorites: React.FC<RenterFavoritesProps> = ({
  currentUser,
  onListingClick,
  onExploreClick,
}) => {
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, [currentUser?.id]);

  const loadFavorites = async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          listing_id,
          created_at,
          listing:listings(*)
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Mappa i dati dal DB (snake_case) al formato app (camelCase)
      const listingsData = data?.map((fav: any) => {
        const l = fav.listing;
        if (!l) return null;
        
        return {
          ...l,
          priceUnit: l.price_unit || l.priceUnit,
          cleaningFee: l.cleaning_fee || l.cleaningFee || 0,
          subCategory: l.sub_category || l.subCategory,
          // Aggiungi altri campi se necessario
        };
      }).filter(Boolean) || [];
      
      setFavorites(listingsData as Listing[]);
    } catch (err) {
      console.error('Errore caricamento preferiti:', err);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (listingId: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', currentUser?.id)
        .eq('listing_id', listingId);
      
      if (error) throw error;
      
      // Rimuovi dalla lista locale
      setFavorites(prev => prev.filter(l => l.id !== listingId));
    } catch (err) {
      console.error('Errore rimozione preferito:', err);
      alert('Errore durante la rimozione. Riprova.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">I miei preferiti</h2>
          <p className="text-gray-500 mt-1">Annunci che hai salvato</p>
        </div>
        {favorites.length > 0 && (
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
            {favorites.length} {favorites.length === 1 ? 'annuncio' : 'annunci'}
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-gray-500">Caricamento preferiti...</p>
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <Heart className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Nessun preferito salvato</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Inizia a salvare i tuoi annunci preferiti cliccando sul cuore ❤️
          </p>
          <button
            onClick={onExploreClick}
            className="px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors shadow-sm"
          >
            Esplora annunci
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1">
          {favorites.map((listing) => (
            <div key={listing.id} className="bg-white rounded-md border border-gray-200 overflow-hidden hover:shadow-md transition-all group cursor-pointer w-full max-w-[200px]">
              <div className="relative h-[115px] overflow-hidden bg-gray-200" onClick={() => onListingClick(listing)}>
                <img
                  src={listing.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'}
                  alt={listing.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFavorite(listing.id);
                  }}
                  className="absolute top-1.5 left-1.5 z-10 w-7 h-7 rounded-full bg-white/90 hover:bg-white shadow-md transition-all flex items-center justify-center"
                  aria-label="Rimuovi dai preferiti"
                >
                  <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                </button>
              </div>

              <div className="p-2.5">
                <h3 className="font-semibold text-gray-900 text-[12px] leading-tight line-clamp-1 mb-0.5">{listing.title}</h3>
                <p className="text-[10px] text-gray-500 mb-2 flex items-center">
                  <MapPin className="w-2.5 h-2.5 mr-1 flex-shrink-0" />
                  <span className="line-clamp-1">{listing.location}</span>
                </p>
                <div className="pt-1 border-t border-gray-100">
                  <span className="font-bold text-[14px] text-brand">€{listing.price}</span>
                  <span className="text-[10px] text-gray-500">/{listing.priceUnit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};