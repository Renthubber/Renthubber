import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Favorite {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
  listing?: any; // Listing type dal tuo types.ts
}

export const useFavorites = (listingId?: string, userId?: string) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);

  // Verifica se un annuncio è nei preferiti
  const checkFavorite = async () => {
    if (!userId || !listingId) {
      setIsFavorite(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('listing_id', listingId)
        .maybeSingle();

      if (error) throw error;
      setIsFavorite(!!data);
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  // Carica tutti i preferiti dell'utente
  const loadFavorites = async () => {
    if (!userId) {
      setFavorites([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          listing:listings(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  // Aggiungi o rimuovi dai preferiti
  const toggleFavorite = async () => {
    if (!userId || !listingId) {
      return false;
    }

    try {
      if (isFavorite) {
        // Rimuovi
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('listing_id', listingId);

        if (error) throw error;
        setIsFavorite(false);
        return false;
      } else {
        // Aggiungi
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: userId,
            listing_id: listingId,
          });

        if (error) throw error;
        setIsFavorite(true);
        return true;
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      if (error.code === '23505') {
        // Already exists
        setIsFavorite(true);
      }
      return isFavorite;
    }
  };

  // Rimuovi un preferito specifico (per la pagina favorites)
  const removeFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId)
        .eq('user_id', userId);

      if (error) throw error;
      
      setFavorites(prev => prev.filter(f => f.id !== favoriteId));
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      return false;
    }
  };

  // Check al mount se listingId è presente
  useEffect(() => {
    if (listingId && userId) {
      checkFavorite();
    }
  }, [listingId, userId]);

  return {
    isFavorite,
    favorites,
    loading,
    toggleFavorite,
    loadFavorites,
    removeFavorite,
  };
};