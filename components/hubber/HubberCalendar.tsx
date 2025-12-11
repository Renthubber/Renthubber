import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  Package,
  X,
  MapPin,
} from 'lucide-react';

// Tipo per le prenotazioni (compatibile con BookingRequest)
interface CalendarBooking {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage?: string;
  startDate: string; // ISO date
  endDate: string;   // ISO date
  status: string;
  renterName?: string;
  renterAvatar?: string;
  renterId?: string;
  totalPrice?: number;
  netEarnings?: number;
}

interface HubberCalendarProps {
  bookings: CalendarBooking[];
  onBookingClick?: (booking: CalendarBooking) => void;
  onViewRenterProfile?: (renter: { id: string; name: string; avatar?: string }) => void;
}

// Colori per differenziare gli annunci
const LISTING_COLORS = [
  { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-800', dot: 'bg-blue-500' },
  { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-800', dot: 'bg-green-500' },
  { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-800', dot: 'bg-purple-500' },
  { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-800', dot: 'bg-orange-500' },
  { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-800', dot: 'bg-pink-500' },
  { bg: 'bg-teal-100', border: 'border-teal-400', text: 'text-teal-800', dot: 'bg-teal-500' },
  { bg: 'bg-indigo-100', border: 'border-indigo-400', text: 'text-indigo-800', dot: 'bg-indigo-500' },
  { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-800', dot: 'bg-amber-500' },
];

// Nomi giorni e mesi in italiano
const DAYS_IT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const MONTHS_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

export const HubberCalendar: React.FC<HubberCalendarProps> = ({
  bookings,
  onBookingClick,
  onViewRenterProfile,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Mappa listingId -> colore
  const listingColorMap = useMemo(() => {
    const map = new Map<string, typeof LISTING_COLORS[0]>();
    const uniqueListings = [...new Set(bookings.map(b => b.listingId))];
    uniqueListings.forEach((listingId, index) => {
      map.set(listingId, LISTING_COLORS[index % LISTING_COLORS.length]);
    });
    return map;
  }, [bookings]);

  // Calcola giorni del mese corrente
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Primo giorno del mese
    const firstDay = new Date(year, month, 1);
    // Ultimo giorno del mese
    const lastDay = new Date(year, month + 1, 0);
    
    // Giorno della settimana del primo giorno (0 = domenica, convertiamo a lunedì = 0)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;
    
    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    
    // ✅ FIX: Aggiungi celle vuote invece dei giorni del mese precedente
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({
        date: new Date(year, month - 1, 1), // data placeholder
        isCurrentMonth: false,
      });
    }
    
    // Giorni del mese corrente
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }
    
    // ✅ FIX: Aggiungi celle vuote invece dei giorni del mese successivo
    const remainingDays = 42 - days.length; // 6 righe × 7 giorni
    for (let i = 0; i < remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, 1), // data placeholder
        isCurrentMonth: false,
      });
    }
    
    return days;
  }, [currentDate]);

  // Funzione per ottenere prenotazioni di un giorno specifico
  const getBookingsForDay = (date: Date): CalendarBooking[] => {
    const dateStr = date.toISOString().split('T')[0];
    
    return bookings.filter(booking => {
      // Normalizza le date
      const startStr = (booking.startDate || '').split('T')[0];
      const endStr = (booking.endDate || '').split('T')[0];
      
      if (!startStr || !endStr) return false;
      
      // Controlla se la data è nel range della prenotazione
      return dateStr >= startStr && dateStr <= endStr;
    });
  };

  // Navigazione mesi
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Apri solo il modale senza navigare
  const openBookingDetail = (booking: CalendarBooking) => {
    setSelectedBooking(booking);
    setDetailModalOpen(true);
  };

  // Formatta data per display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Badge stato
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: 'In attesa', className: 'bg-yellow-100 text-yellow-700' },
      accepted: { label: 'Accettata', className: 'bg-blue-100 text-blue-700' },
      confirmed: { label: 'Confermata', className: 'bg-green-100 text-green-700' },
      active: { label: 'In corso', className: 'bg-purple-100 text-purple-700' },
      completed: { label: 'Completata', className: 'bg-gray-100 text-gray-700' },
      cancelled: { label: 'Cancellata', className: 'bg-red-100 text-red-700' },
      rejected: { label: 'Rifiutata', className: 'bg-red-100 text-red-700' },
    };
    
    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-600' };
    return (
      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${config.className}`}>
        {config.label}
      </span>
    );
  };

  // Verifica se è oggi
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Lista unica degli annunci per la legenda
  const uniqueListings = useMemo(() => {
    const seen = new Map<string, { id: string; title: string; color: typeof LISTING_COLORS[0] }>();
    bookings.forEach(b => {
      if (!seen.has(b.listingId)) {
        seen.set(b.listingId, {
          id: b.listingId,
          title: b.listingTitle,
          color: listingColorMap.get(b.listingId) || LISTING_COLORS[0],
        });
      }
    });
    return Array.from(seen.values());
  }, [bookings, listingColorMap]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* ✅ FIX: Header responsive migliorato */}
      <div className="p-3 sm:p-4 border-b border-gray-100">
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* Titolo mese - più piccolo su mobile */}
          <h2 className="text-base sm:text-xl font-bold text-gray-900 flex-shrink truncate">
            {MONTHS_IT[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          
          {/* Navigazione - sempre visibile e compatta */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={goToPreviousMonth}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Mese precedente"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
            <button
              onClick={goToToday}
              className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Oggi
            </button>
            <button
              onClick={goToNextMonth}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Mese successivo"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Legenda annunci - scrollabile su mobile */}
        {uniqueListings.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {uniqueListings.map(listing => (
              <div key={listing.id} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full ${listing.color.dot}`} />
                <span className="text-xs text-gray-600 truncate max-w-[120px]">
                  {listing.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Calendario */}
      <div className="p-3 sm:p-4">
        {/* Header giorni settimana */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {DAYS_IT.map(day => (
            <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Griglia giorni */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarDays.map((dayInfo, index) => {
            // ✅ FIX: Non renderizzare giorni di altri mesi
            if (!dayInfo.isCurrentMonth) {
              return (
                <div key={index} className="aspect-square" />
              );
            }

            const dayBookings = getBookingsForDay(dayInfo.date);
            const isTodayDate = isToday(dayInfo.date);

            return (
              <div
                key={index}
                className={`
                  aspect-square border rounded-lg p-1 sm:p-2 cursor-pointer
                  hover:bg-gray-50 transition-colors relative overflow-hidden
                  ${isTodayDate ? 'border-brand bg-brand/5' : 'border-gray-200'}
                `}
              >
                {/* Numero giorno */}
                <div className={`
                  text-xs font-medium mb-1 flex items-center justify-between px-1
                  ${isTodayDate ? 'text-brand font-bold' : 'text-gray-900'}
                `}>
                  <span>{dayInfo.date.getDate()}</span>
                  {isTodayDate && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                  )}
                </div>

                {/* Eventi del giorno */}
                <div className="space-y-0.5 overflow-hidden">
                  {dayBookings.slice(0, 3).map((booking, bIndex) => {
                    const color = listingColorMap.get(booking.listingId) || LISTING_COLORS[0];
                    const isStart = booking.startDate.split('T')[0] === dayInfo.date.toISOString().split('T')[0];
                    const isEnd = booking.endDate.split('T')[0] === dayInfo.date.toISOString().split('T')[0];
                    
                    return (
                      <div
                        key={booking.id + bIndex}
                        onClick={(e) => {
                          e.stopPropagation();
                          openBookingDetail(booking);
                        }}
                        className={`
                          text-[10px] px-1 py-0.5 truncate cursor-pointer
                          ${color.bg} ${color.text} ${color.border}
                          ${isStart && isEnd ? 'rounded' : isStart ? 'rounded-l border-l-2' : isEnd ? 'rounded-r border-r-2' : ''}
                          hover:opacity-80 transition-opacity
                        `}
                        title={`${booking.listingTitle} - ${booking.renterName}`}
                      >
                        {isStart && booking.listingTitle.slice(0, 12)}
                        {!isStart && !isEnd && '─'}
                      </div>
                    );
                  })}
                  
                  {/* Indicatore "altri" */}
                  {dayBookings.length > 3 && (
                    <div className="text-[10px] text-gray-500 px-1">
                      +{dayBookings.length - 3} altri
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Statistiche rapide */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-blue-50 rounded-xl p-2 sm:p-3 text-center">
            <p className="text-xl sm:text-2xl font-bold text-blue-600">
              {bookings.filter(b => ['confirmed', 'accepted', 'active'].includes(b.status)).length}
            </p>
            <p className="text-[10px] sm:text-xs text-blue-600 font-medium">Attive</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-2 sm:p-3 text-center">
            <p className="text-xl sm:text-2xl font-bold text-yellow-600">
              {bookings.filter(b => b.status === 'pending').length}
            </p>
            <p className="text-[10px] sm:text-xs text-yellow-600 font-medium">In attesa</p>
          </div>
          <div className="bg-green-50 rounded-xl p-2 sm:p-3 text-center">
            <p className="text-xl sm:text-2xl font-bold text-green-600">
              {bookings.filter(b => b.status === 'completed').length}
            </p>
            <p className="text-[10px] sm:text-xs text-green-600 font-medium">Completate</p>
          </div>
        </div>
      </div>

      {/* ✅ Modale Dettaglio Prenotazione */}
      {detailModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative mx-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setDetailModalOpen(false)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0">
                {selectedBooking.listingImage ? (
                  <img
                    src={selectedBooking.listingImage}
                    alt={selectedBooking.listingTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-lg leading-tight">
                  {selectedBooking.listingTitle}
                </h3>
                {/* ✅ Numero prenotazione cliccabile */}
                <button
                  onClick={() => {
                    if (onBookingClick) {
                      setDetailModalOpen(false);
                      onBookingClick(selectedBooking);
                    }
                  }}
                  className="text-xs text-brand hover:text-brand-dark font-semibold mt-1 hover:underline"
                >
                  Prenotazione #{selectedBooking.id.slice(0, 8)}
                </button>
                <div className="mt-2">
                  {getStatusBadge(selectedBooking.status)}
                </div>
              </div>
            </div>

            {/* Dettagli */}
            <div className="space-y-3 text-sm">
              {/* Date */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Periodo</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(selectedBooking.startDate)} – {formatDate(selectedBooking.endDate)}
                  </p>
                </div>
              </div>

              {/* Renter */}
              {selectedBooking.renterName && (
                <div 
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    if (onViewRenterProfile && selectedBooking.renterId) {
                      onViewRenterProfile({
                        id: selectedBooking.renterId,
                        name: selectedBooking.renterName || '',
                        avatar: selectedBooking.renterAvatar,
                      });
                    }
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    {selectedBooking.renterAvatar ? (
                      <img
                        src={selectedBooking.renterAvatar}
                        alt={selectedBooking.renterName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Renter</p>
                    <p className="font-medium text-gray-900">{selectedBooking.renterName}</p>
                  </div>
                </div>
              )}

              {/* Importi */}
              {(selectedBooking.totalPrice !== undefined || selectedBooking.netEarnings !== undefined) && (
                <div className="p-3 bg-brand/5 rounded-xl border border-brand/10">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Prezzo base</span>
                    <span className="font-medium text-gray-900">
                      €{(selectedBooking.totalPrice || 0).toFixed(2)}
                    </span>
                  </div>
                  {selectedBooking.netEarnings !== undefined && (
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-brand/10">
                      <span className="font-semibold text-gray-900">Netto per te</span>
                      <span className="font-bold text-green-600">
                        €{selectedBooking.netEarnings.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Azioni */}
            <div className="mt-6">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HubberCalendar;