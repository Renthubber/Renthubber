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
      // Prima otteniamo tutte le dispute aperte
      const { data: openDisputes } = await supabase
        .from('disputes')
        .select('id')
        .eq('status', 'open');

      if (openDisputes && openDisputes.length > 0) {
        const disputeIds = openDisputes.map(d => d.id);

        // Poi otteniamo quelle già viste
        const { data: viewedDisputes } = await supabase
          .from('admin_viewed_items')
          .select('item_id')
          .eq('admin_user_id', user.id)
          .eq('item_type', 'dispute')
          .in('item_id', disputeIds);

        const viewedIds = viewedDisputes?.map(v => v.item_id) || [];

        // Contiamo solo quelle NON viste
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

    // Polling ogni 10 secondi
    const interval = setInterval(() => {
      loadNotifications();
    }, 10000);

    return () => clearInterval(interval);
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