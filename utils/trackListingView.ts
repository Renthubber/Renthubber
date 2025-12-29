import { supabase } from '../lib/supabase';

export async function trackListingView(listingId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Verifica se l'utente ha già visualizzato questo annuncio nelle ultime 24 ore
    if (user) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentView } = await supabase
        .from('listing_views')
        .select('id')
        .eq('listing_id', listingId)
        .eq('viewer_id', user.id)
        .gte('viewed_at', oneDayAgo)
        .maybeSingle();
      
      // Se ha già visualizzato nelle ultime 24 ore, non registrare
      if (recentView) return;
    }

    // Registra la visualizzazione
    await supabase
      .from('listing_views')
      .insert({
        listing_id: listingId,
        viewer_id: user?.id || null,
        user_agent: navigator.userAgent
      });
  } catch (error) {
    console.error('Error tracking listing view:', error);
    // Non bloccare l'app se il tracking fallisce
  }
}