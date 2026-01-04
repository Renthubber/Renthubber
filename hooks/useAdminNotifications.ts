import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface AdminNotification {
  type: string;
  count: number;
  label: string;
  icon: string;
  color: string;
  priority: 'critical' | 'important' | 'info';
  tab: string;
}

export const useAdminNotifications = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const notifs: AdminNotification[] = [];

      // 1. DISPUTE APERTE E NON VISTE
      const { data: openDisputes } = await supabase
        .from('disputes')
        .select('id')
        .eq('status', 'open');

      if (openDisputes && openDisputes.length > 0) {
        const disputeIds = openDisputes.map(d => d.id);
        const { data: viewedDisputes } = await supabase
          .from('admin_viewed_items')
          .select('item_id')
          .eq('admin_user_id', user.id)
          .eq('item_type', 'dispute')
          .in('item_id', disputeIds);

        const viewedIds = viewedDisputes?.map(v => v.item_id) || [];
        const unseenCount = disputeIds.filter(id => !viewedIds.includes(id)).length;

        if (unseenCount > 0) {
          notifs.push({
            type: 'dispute',
            count: unseenCount,
            label: unseenCount === 1 ? 'Nuova disputa' : 'Nuove dispute',
            icon: '⚖️',
            color: 'text-red-600 bg-red-50',
            priority: 'critical',
            tab: 'disputes'
          });
        }
      }

      // Ordina per priorità
      const priorityOrder = { critical: 0, important: 1, info: 2 };
      notifs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      setNotifications(notifs);
      setTotalCount(notifs.reduce((sum, n) => sum + n.count, 0));
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading admin notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    // ✅ REALTIME: Ascolta nuove dispute
    const disputesChannel = supabase
      .channel('admin-disputes-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'disputes' },
        () => {
          console.log('🚨 Nuova disputa in tempo reale!');
          loadNotifications(); // Ricarica notifiche
        }
      )
      .subscribe();

    // ✅ REALTIME: Ascolta nuovi booking
    const bookingsChannel = supabase
      .channel('admin-bookings-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        () => {
          console.log('📦 Nuova prenotazione in tempo reale!');
          loadNotifications();
        }
      )
      .subscribe();

    // ✅ REALTIME: Ascolta nuovi messaggi
    const messagesChannel = supabase
      .channel('admin-messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          console.log('💬 Nuovo messaggio in tempo reale!');
          loadNotifications();
        }
      )
      .subscribe();

    // Polling ogni 10 secondi (backup)
    const interval = setInterval(() => {
      loadNotifications();
    }, 10000);

    return () => {
      supabase.removeChannel(disputesChannel);
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(messagesChannel);
      clearInterval(interval);
    };
  }, [loadNotifications]);

  return {
    notifications,
    totalCount,
    loading,
    lastUpdate,
    refresh: loadNotifications
  };
};

// ✨ NUOVA FUNZIONE: Marca un elemento come "visto"
export const markAsViewed = async (itemType: string, itemId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('admin_viewed_items')
      .upsert({
        admin_user_id: user.id,
        item_type: itemType,
        item_id: itemId
      }, {
        onConflict: 'admin_user_id,item_type,item_id'
      });
  } catch (error) {
    console.error('Error marking as viewed:', error);
  }
};