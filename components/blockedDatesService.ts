import { supabase } from '../services/supabaseClient';

export interface BlockedDate {
  id: string;
  listing_id: string;
  hubber_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  created_at: string;
  updated_at: string;
}

export interface BlockedDateInput {
  listing_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
}

// Ottieni tutte le date bloccate per un listing
export async function getBlockedDates(listingId: string): Promise<BlockedDate[]> {
  const { data, error } = await supabase
    .from('blocked_dates')
    .select('*')
    .eq('listing_id', listingId)
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching blocked dates:', error);
    throw error;
  }

  return data || [];
}

// Crea un nuovo blocco di date
export async function createBlockedDate(input: BlockedDateInput): Promise<BlockedDate> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('blocked_dates')
    .insert({
      ...input,
      hubber_id: user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating blocked date:', error);
    throw error;
  }

  return data;
}

// Elimina un blocco di date
export async function deleteBlockedDate(id: string): Promise<void> {
  const { error } = await supabase
    .from('blocked_dates')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting blocked date:', error);
    throw error;
  }
}

// Verifica se una data è bloccata
export async function isDateBlocked(
  listingId: string,
  startDate: string,
  endDate: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('blocked_dates')
    .select('id')
    .eq('listing_id', listingId)
    .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

  if (error) {
    console.error('Error checking blocked dates:', error);
    throw error;
  }

  return (data?.length || 0) > 0;
}