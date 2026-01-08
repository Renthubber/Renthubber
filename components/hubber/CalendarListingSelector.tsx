import React, { useState, useEffect } from 'react';
import { ChevronLeft, Calendar } from 'lucide-react';
import { HubberCalendar } from './HubberCalendar';
import { ICalManager } from './ICalManager';
import { api } from '../../services/api';
import { calendarBlocksApi } from '../../services/calendarBlocksApi';
import type { Listing } from '../../types';

interface CalendarListingSelectorProps {
  userId: string;
  userName?: string;
  listings: Listing[];
  onViewRenterProfile?: (renter: { id: string; name: string; avatar?: string }) => void;
  onImportCalendar?: (listingId: string, url: string, name: string) => Promise<void>;
  onSyncCalendar?: (calendarId: string) => Promise<void>;
  onRemoveCalendar?: (calendarId: string) => Promise<void>;
}

export const CalendarListingSelector: React.FC<CalendarListingSelectorProps> = ({
  userId,
  userName,
  listings,
  onViewRenterProfile,
  onImportCalendar,
  onSyncCalendar,
  onRemoveCalendar,
}) => {
  
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 🔄 Carica prenotazioni e blocchi quando viene selezionato un listing
  useEffect(() => {
    if (!selectedListing) {
      setBookings([]);
      setBlockedDates([]);
      return;
    }

    const loadCalendarData = async () => {
      setIsLoading(true);
     

      try {
        // Carica prenotazioni dell'hubber e filtra per questo listing
        const allBookings = await api.bookings.getForHubberFromDb(userId);
        const filteredBookings = allBookings.filter(b => b.listingId === selectedListing.id);
       
        setBookings(filteredBookings);

        // Carica blocchi
        const blocksData = await calendarBlocksApi.getByListingId(selectedListing.id);
   
        
        // Converti stringhe in Date
        const blockDates = blocksData.map(b => new Date(b.startDate));
        setBlockedDates(blockDates);
      } catch (error) {
        console.error('❌ Errore caricamento dati calendario:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCalendarData();
  }, [selectedListing]);

  // 🚫 Gestisce il salvataggio dei blocchi manuali
  const handleBlockDates = async (dates: Date[]) => {
    if (!selectedListing) return;

    try {
      const result = await calendarBlocksApi.createMultiple({
        listingId: selectedListing.id,
        dates,
        reason: 'Blocco manuale',
      });

      if (result.success) {
        
        // Ricarica i blocchi
        const blocksData = await calendarBlocksApi.getByListingId(selectedListing.id);
        const blockDates = blocksData.map(b => new Date(b.startDate));
        setBlockedDates(blockDates);
      } else {
        console.error('❌ Errore blocco date:', result.error);
        alert('Errore durante il blocco delle date: ' + result.error);
      }
    } catch (error) {
      console.error('❌ Errore inatteso blocco date:', error);
      alert('Errore durante il blocco delle date');
    }
  };

// 🗑️ Gestisce lo sblocco di una singola data
  const handleUnblockDate = async (date: Date) => {
    if (!selectedListing) return;

    try {
      const result = await calendarBlocksApi.deleteByDates({
        listingId: selectedListing.id,
        dates: [date],
      });

      if (result.success) {
        
        // Ricarica i blocchi
        const blocksData = await calendarBlocksApi.getByListingId(selectedListing.id);
        const blockDates = blocksData.map(b => new Date(b.startDate));
        setBlockedDates(blockDates);
      } else {
        console.error('❌ Errore sblocco data:', result.error);
        alert('Errore durante lo sblocco della data: ' + result.error);
      }
    } catch (error) {
      console.error('❌ Errore inatteso sblocco data:', error);
      alert('Errore durante lo sblocco della data');
    }
  };

  // Vista lista annunci
  if (!selectedListing) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Calendari</h2>
          <p className="text-sm text-gray-500 mt-1">
            Seleziona un annuncio per gestire il suo calendario
          </p>
        </div>

        {/* Lista annunci */}
        <div className="space-y-3">
          {listings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nessun annuncio pubblicato</p>
              <p className="text-sm text-gray-400 mt-1">
                Pubblica un annuncio per iniziare a gestire il calendario
              </p>
            </div>
          ) : (
            listings.map((listing) => (
              <button
                key={listing.id}
                onClick={() => setSelectedListing(listing)}
                className="w-full bg-white rounded-xl border border-gray-200 p-4 hover:border-brand hover:shadow-md transition-all flex items-center gap-4 text-left"
              >
                {/* Foto annuncio */}
                <img
                  src={listing.images[0] || '/placeholder.jpg'}
                  alt={listing.title}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                />

                {/* Info annuncio */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {listing.title}
                  </h3>
                 <p className="text-sm text-gray-500 capitalize">
                 {listing.status === 'published' ? 'Pubblicato' : 
                 listing.status === 'draft' ? 'Non pubblicato' :
                 listing.status === 'suspended' ? 'Sospeso' : 
                 listing.status}
                  </p>
                </div>

                {/* Icona calendario mini */}
                <div className="flex-shrink-0">
                  <Calendar className="w-6 h-6 text-gray-400" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  // Vista calendario singolo annuncio
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back button */}
      <button
        onClick={() => setSelectedListing(null)}
        className="flex items-center gap-2 text-gray-600 hover:text-brand transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
        Torna ai calendari
      </button>

      {/* Titolo annuncio selezionato */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{selectedListing.title}</h2>
        <p className="text-sm text-gray-500 mt-1">
          Gestisci le prenotazioni e sincronizza il calendario
        </p>
      </div>

      {/* Calendario + iCal Manager */}
     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
            </div>
          ) : (
            <HubberCalendar
              bookings={bookings}
              blockedDates={blockedDates}
              onBookingClick={(booking) => {
                // TODO: gestire click su prenotazione
              }}
              onViewRenterProfile={onViewRenterProfile}
              onBlockDates={handleBlockDates}
              onUnblockDate={handleUnblockDate}
            />
          )}
        </div>

        <div>
          <ICalManager
            userId={userId}
            userName={userName}
            listingId={selectedListing.id} // 🆕 PASSA listingId
            onImportCalendar={
              onImportCalendar 
                ? (url, name) => onImportCalendar(selectedListing.id, url, name)
                : undefined
            }
            onSyncCalendar={onSyncCalendar}
            onRemoveCalendar={onRemoveCalendar}
          />
        </div>
      </div>
    </div>
  );
};