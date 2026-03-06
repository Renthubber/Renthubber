import React, { useState, useEffect } from 'react';
import {
  Ticket, Calendar, Users, Search, RefreshCw, Eye, Trash2,
  Clock, MapPin, Star, ChevronDown, ChevronUp, Loader2, AlertCircle
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface ExperienceListing {
  id: string;
  title: string;
  location: string;
  price: number;
  price_type: string;
  status: string;
  rating: number;
  review_count: number;
  max_guests: number;
  duration_value: string;
  duration_unit: string;
  images: string[];
  host_id: string;
  created_at: string;
  owner?: { name: string; email: string; avatar_url: string };
  slots?: ExperienceSlot[];
}

interface ExperienceSlot {
  id: string;
  listing_id: string;
  date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  max_participants: number;
  booked_count: number;
  status: string;
  bookings?: SlotBooking[];
}

interface SlotBooking {
  id: string;
  renter_id: string;
  participants_count: number;
  amount_total: number;
  status: string;
  created_at: string;
  renter?: { full_name: string; email: string; avatar_url: string };
}

export const AdminEsperienze: React.FC = () => {
  const [listings, setListings] = useState<ExperienceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'suspended'>('all');
  const [expandedListing, setExpandedListing] = useState<string | null>(null);
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState<string | null>(null);

  const loadListings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('category', 'esperienza')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const listingsData = data || [];
      
      // Carica owner separatamente
      const hostIds = [...new Set(listingsData.map((l: any) => l.host_id).filter(Boolean))];
      if (hostIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, name, email, avatar_url')
          .in('id', hostIds);
        
        const usersMap = Object.fromEntries((users || []).map(u => [u.id, u]));
        setListings(listingsData.map((l: any) => ({
          ...l,
          owner: usersMap[l.host_id] || null,
        })));
      } else {
        setListings(listingsData);
      }
    } catch (err) {
      console.error('Errore caricamento esperienze:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const loadSlots = async (listingId: string) => {
    setIsLoadingSlots(listingId);
    try {
      const { data: slots, error } = await supabase
        .from('experience_slots')
        .select('*')
        .eq('listing_id', listingId)
        .order('date', { ascending: true });

      if (error) throw error;

      // Carica bookings per ogni slot
      if (slots && slots.length > 0) {
        const slotIds = slots.map(s => s.id);
        const { data: bookings } = await supabase
          .from('bookings')
          .select(`
            *,
            renter:users!bookings_renter_id_fkey(full_name, email, avatar_url)
          `)
          .in('experience_slot_id', slotIds)
          .neq('status', 'cancelled');

        const slotsWithBookings = slots.map(slot => ({
          ...slot,
          bookings: (bookings || []).filter(b => b.experience_slot_id === slot.id),
        }));

        setListings(prev => prev.map(l =>
          l.id === listingId ? { ...l, slots: slotsWithBookings } : l
        ));
      } else {
        setListings(prev => prev.map(l =>
          l.id === listingId ? { ...l, slots: [] } : l
        ));
      }
    } catch (err) {
      console.error('Errore caricamento slot:', err);
    } finally {
      setIsLoadingSlots(null);
    }
  };

  const handleToggleListing = async (listingId: string) => {
    if (expandedListing === listingId) {
      setExpandedListing(null);
      return;
    }
    setExpandedListing(listingId);
    const listing = listings.find(l => l.id === listingId);
    if (!listing?.slots) {
      await loadSlots(listingId);
    }
  };

  const handleSuspend = async (listingId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'published' : 'suspended';
    if (!confirm(`${newStatus === 'suspended' ? 'Sospendere' : 'Riattivare'} questa esperienza?`)) return;
    try {
      await supabase.from('listings').update({ status: newStatus }).eq('id', listingId);
      setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: newStatus } : l));
    } catch (err) {
      console.error('Errore aggiornamento status:', err);
    }
  };

  const handleCancelSlot = async (slotId: string, listingId: string) => {
    if (!confirm('Annullare questo slot? I renter prenotati verranno notificati.')) return;
    try {
      await supabase.from('experience_slots').update({ status: 'cancelled' }).eq('id', slotId);
      setListings(prev => prev.map(l =>
        l.id === listingId ? {
          ...l,
          slots: l.slots?.map(s => s.id === slotId ? { ...s, status: 'cancelled' } : s)
        } : l
      ));
    } catch (err) {
      console.error('Errore annullamento slot:', err);
    }
  };

  const filteredListings = listings.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.owner?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('it-IT', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const formatTime = (slot: ExperienceSlot) => {
    if (!slot.start_time) return null;
    return slot.end_time ? `${slot.start_time} → ${slot.end_time}` : slot.start_time;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700';
      case 'draft': return 'bg-gray-100 text-gray-600';
      case 'suspended': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getSlotStatusColor = (slot: ExperienceSlot) => {
    if (slot.status === 'cancelled') return 'bg-red-100 text-red-600';
    const available = slot.max_participants - slot.booked_count;
    if (available === 0) return 'bg-orange-100 text-orange-600';
    return 'bg-green-100 text-green-600';
  };

  const getSlotStatusLabel = (slot: ExperienceSlot) => {
    if (slot.status === 'cancelled') return 'Annullato';
    const available = slot.max_participants - slot.booked_count;
    if (available === 0) return 'Esaurito';
    return `${available} posti liberi`;
  };

  // Stats
  const totalSlots = listings.reduce((sum, l) => sum + (l.slots?.length || 0), 0);
  const totalBookings = listings.reduce((sum, l) =>
    sum + (l.slots?.reduce((s2, sl) => s2 + (sl.bookings?.length || 0), 0) || 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center">
            <Ticket className="w-5 h-5 text-brand" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Slot Esperienze</h2>
            <p className="text-sm text-gray-500">{listings.length} esperienze totali</p>
          </div>
        </div>
        <button
          onClick={loadListings}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Aggiorna
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Totale Esperienze', value: listings.length, icon: Ticket, color: 'text-brand' },
          { label: 'Pubblicate', value: listings.filter(l => l.status === 'published').length, icon: Eye, color: 'text-green-600' },
          { label: 'Slot Totali', value: totalSlots, icon: Calendar, color: 'text-blue-600' },
          { label: 'Prenotazioni', value: totalBookings, icon: Users, color: 'text-purple-600' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-4">
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filtri */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca per titolo, città, hubber..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand outline-none"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'published', 'draft', 'suspended'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                statusFilter === s ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === 'all' ? 'Tutti' : s === 'published' ? 'Pubblicati' : s === 'draft' ? 'Bozze' : 'Sospesi'}
            </button>
          ))}
        </div>
      </div>

      {/* Lista Esperienze */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl">
          <Ticket className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">Nessuna esperienza trovata</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredListings.map(listing => (
            <div key={listing.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              {/* Listing Row */}
              <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => handleToggleListing(listing.id)}>
                {/* Immagine */}
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                  {listing.images?.[0] ? (
                    <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Ticket className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 truncate">{listing.title}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(listing.status)}`}>
                      {listing.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {listing.location || 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> Max {listing.max_guests || '-'} pers.
                    </span>
                    {listing.duration_value && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {listing.duration_value} {listing.duration_unit}
                      </span>
                    )}
                    <span className="font-semibold text-gray-700">
                      €{listing.price} / {listing.price_type === 'persona' ? 'pers.' : 'gruppo'}
                    </span>
                  </div>
                  {listing.owner && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        {listing.owner.avatar_url ? (
                          <img src={listing.owner.avatar_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center text-[9px] font-bold text-gray-500">
                            {listing.owner.name?.[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        <span className="font-medium text-gray-600">{listing.owner.name}</span> · {listing.owner.email}
                      </p>
                    </div>
                  )}
                </div>

                {/* Azioni */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleSuspend(listing.id, listing.status)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      listing.status === 'suspended'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {listing.status === 'suspended' ? 'Riattiva' : 'Sospendi'}
                  </button>
                  <button
                    onClick={() => handleToggleListing(listing.id)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    {expandedListing === listing.id
                      ? <ChevronUp className="w-5 h-5 text-gray-500" />
                      : <ChevronDown className="w-5 h-5 text-gray-500" />
                    }
                  </button>
                </div>
              </div>

              {/* Slots Expanded */}
              {expandedListing === listing.id && (
                <div className="border-t border-gray-100 bg-gray-50 p-4">
                  {isLoadingSlots === listing.id ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-6 h-6 text-brand animate-spin" />
                    </div>
                  ) : !listing.slots || listing.slots.length === 0 ? (
                    <div className="text-center py-4">
                      <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                      <p className="text-sm text-gray-400">Nessuno slot configurato</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-gray-500 uppercase">
                        {listing.slots.length} slot configurati
                      </p>
                      {listing.slots.map(slot => (
                        <div key={slot.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                          {/* Slot Row */}
                          <div className="p-3 flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-gray-900">{formatDate(slot.date)}</span>
                                {slot.end_date && slot.end_date !== slot.date && (
                                  <span className="text-xs text-gray-500">→ {formatDate(slot.end_date)}</span>
                                )}
                                {formatTime(slot) && (
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {formatTime(slot)}
                                  </span>
                                )}
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getSlotStatusColor(slot)}`}>
                                  {getSlotStatusLabel(slot)}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Users className="w-3 h-3" />
                                  <span>{slot.booked_count}/{slot.max_participants} prenotati</span>
                                </div>
                                {/* Progress bar */}
                                <div className="flex-1 max-w-32 bg-gray-100 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${
                                      slot.booked_count === slot.max_participants ? 'bg-orange-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min((slot.booked_count / slot.max_participants) * 100, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {slot.booked_count === 0 && slot.status !== 'cancelled' && (
                                <button
                                  onClick={() => handleCancelSlot(slot.id, listing.id)}
                                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Annulla slot"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                              {slot.bookings && slot.bookings.length > 0 && (
                                <button
                                  onClick={() => setExpandedSlot(expandedSlot === slot.id ? null : slot.id)}
                                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  {expandedSlot === slot.id
                                    ? <ChevronUp className="w-4 h-4 text-gray-500" />
                                    : <ChevronDown className="w-4 h-4 text-gray-500" />
                                  }
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Bookings per slot */}
                          {expandedSlot === slot.id && slot.bookings && slot.bookings.length > 0 && (
                            <div className="border-t border-gray-100 bg-gray-50 p-3 space-y-2">
                              <p className="text-xs font-bold text-gray-500 uppercase">Prenotazioni</p>
                              {slot.bookings.map(booking => (
                                <div key={booking.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100">
                                  <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                                    {booking.renter?.avatar_url ? (
                                      <img src={booking.renter.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                                    ) : (
                                      <span className="text-xs font-bold text-brand">
                                        {(booking.renter?.full_name || 'R')[0].toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                      {booking.renter?.full_name || 'Renter'}
                                    </p>
                                    <p className="text-xs text-gray-500">{booking.renter?.email}</p>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className="text-sm font-bold text-gray-900">
                                      {booking.participants_count || 1} pers.
                                    </p>
                                    <p className="text-xs text-gray-500">€{booking.amount_total?.toFixed(2)}</p>
                                  </div>
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                                    booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                    booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {booking.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
