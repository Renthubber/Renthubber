import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export const useUserPresence = (userId: string | undefined) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Funzione per aggiornare presenza
    const updatePresence = async () => {
      try {
        await supabase
          .from('user_presence')
          .upsert({
            user_id: userId,
            is_online: true,
            last_seen: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      } catch (error) {
        console.error('Errore aggiornamento presenza:', error);
      }
    };

    // Aggiorna subito
    updatePresence();

    // Aggiorna ogni 30 secondi
    intervalRef.current = setInterval(updatePresence, 30000);

    // Cleanup quando l'utente chiude/lascia la pagina
    const handleBeforeUnload = async () => {
      await supabase
        .from('user_presence')
        .update({
          is_online: false,
          last_seen: new Date().toISOString()
        })
        .eq('user_id', userId);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload(); // Setta offline quando componente smonta
    };
  }, [userId]);
};