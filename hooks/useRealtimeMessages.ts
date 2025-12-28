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
    const { data: messages } = await supabase
      .from('messages')
      .select('id, conversation:conversations!inner(renter_id, hubber_id, deleted_by_renter, deleted_by_hubber)')
      .eq('to_user_id', userId)
      .eq('read', false);
    
    const validCount = messages?.filter((m: any) => {
      const isRenter = m.conversation.renter_id === userId;
      const isHubber = m.conversation.hubber_id === userId;
      
      if (isRenter && m.conversation.deleted_by_renter) return false;
      if (isHubber && m.conversation.deleted_by_hubber) return false;
      
      return true;
    }).length || 0;
    
    setUnreadCount(validCount);
    console.log('📊 Unread count iniziale (escluse cancellate):', validCount);
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
        async (payload) => {
  console.log('🔔 Nuovo messaggio ricevuto:', payload.new);
  
  const msg: any = payload.new;
  if (msg.conversation_id) {
    const { data: conv } = await supabase
      .from('conversations')
      .select('renter_id, hubber_id, deleted_by_renter, deleted_by_hubber')
      .eq('id', msg.conversation_id)
      .single();
    
    if (conv) {
      const isRenter = conv.renter_id === userId;
      const isHubber = conv.hubber_id === userId;
      
      if ((isRenter && conv.deleted_by_renter) || (isHubber && conv.deleted_by_hubber)) {
        console.log('⚠️ Messaggio ignorato: conversazione cancellata');
        return;
      }
    }
  }
  
  setUnreadCount(prev => prev + 1);
  
  if (Notification.permission === 'granted') {
    new Notification('Nuovo messaggio', {
      body: 'Hai ricevuto un nuovo messaggio',
      icon: '/logo.png',
    });
  }
  
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
.on(
  'postgres_changes',
  {
    event: 'UPDATE',
    schema: 'public',
    table: 'conversations',
    filter: `or(renter_id.eq.${userId},hubber_id.eq.${userId})`,
  },
  async (payload) => {
    const oldConv: any = payload.old;
    const newConv: any = payload.new;
    
    const isRenter = newConv.renter_id === userId;
    const isHubber = newConv.hubber_id === userId;
    
    const justDeleted = 
      (isRenter && !oldConv.deleted_by_renter && newConv.deleted_by_renter) ||
      (isHubber && !oldConv.deleted_by_hubber && newConv.deleted_by_hubber);
    
    if (justDeleted) {
      console.log('🗑️ Conversazione cancellata, ricalcolo count...');
      loadInitialCount();
    }
  }
)
.subscribe((status) => {
  console.log('📡 Realtime status:', status);
});

   // 🔄 POLLING BACKUP (ogni 5 secondi per garantire aggiornamenti)
const pollingInterval = setInterval(async () => {
  try {
    const { data: messages } = await supabase
      .from('messages')
      .select('id, conversation:conversations!inner(renter_id, hubber_id, deleted_by_renter, deleted_by_hubber)')
      .eq('to_user_id', userId)
      .eq('read', false);
    
    const validCount = messages?.filter((m: any) => {
      const isRenter = m.conversation.renter_id === userId;
      const isHubber = m.conversation.hubber_id === userId;
      
      if (isRenter && m.conversation.deleted_by_renter) return false;
      if (isHubber && m.conversation.deleted_by_hubber) return false;
      
      return true;
    }).length || 0;
    
    setUnreadCount(validCount);
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