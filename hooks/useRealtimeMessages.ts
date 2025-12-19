import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface UseRealtimeMessagesProps {
  userId: string | null;
  onNewMessage?: (message: any) => void;
}

export const useRealtimeMessages = ({ userId, onNewMessage }: UseRealtimeMessagesProps) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    console.log('🔔 Realtime: Subscribing to messages for user:', userId);

    // 📊 CARICA CONTATORE INIZIALE
    const loadInitialCount = async () => {
      try {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('to_user_id', userId)
          .eq('read', false);
        
        if (count !== null) {
          setUnreadCount(count);
          console.log('📊 Unread count iniziale:', count);
        }
      } catch (err) {
        console.error('Errore caricamento count iniziale:', err);
      }
    };

    loadInitialCount();

    // 🔔 SUBSCRIPTION REALTIME (per aggiornamenti istantanei)
    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `to_user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('🔔 Nuovo messaggio ricevuto:', payload.new);
          setUnreadCount(prev => prev + 1);
          
          // Notifica browser
          if (Notification.permission === 'granted') {
            new Notification('Nuovo messaggio', {
              body: 'Hai ricevuto un nuovo messaggio',
              icon: '/logo.png',
            });
          }
          
          // Callback personalizzato
          if (onNewMessage) {
            onNewMessage(payload.new);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `to_user_id=eq.${userId}`,
        },
        (payload) => {
          // Aggiorna count se messaggio segnato come letto
          if ((payload.new as any).read === true && (payload.old as any).read === false) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime status:', status);
      });

    // 🔄 POLLING BACKUP (ogni 5 secondi per garantire aggiornamenti)
    const pollingInterval = setInterval(async () => {
      try {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('to_user_id', userId)
          .eq('read', false);
        
        if (count !== null) {
          setUnreadCount(count);
        }
      } catch (err) {
        console.error('Errore polling count:', err);
      }
    }, 5000);

    // Cleanup
    return () => {
      console.log('🔕 Unsubscribing from realtime messages');
      supabase.removeChannel(channel);
      clearInterval(pollingInterval);
    };
  }, [userId, onNewMessage]);

  return { unreadCount };
};