import React from 'react';
import { Calendar, ChevronDown, ChevronUp, Package, Star, CheckCircle2 } from 'lucide-react';
import { calculateHubberFixedFee } from '../../../utils/feeUtils';

type HubberBookingFilter = 'all' | 'pending' | 'accepted' | 'completed' | 'cancelled' | 'rejected';
type TimeFilter = 'current' | 'historical';

interface PrenotazioniRicevuteProps {
  hubberBookings: any[];
  hubberBookingFilter: HubberBookingFilter;
  hubberTimeFilter: TimeFilter;
  expandedMonths: Set<string>;
  selectedHubberBookingId: string | null;
  onFilterChange: (filter: HubberBookingFilter) => void;
  onTimeFilterChange: (filter: TimeFilter) => void;
  onToggleMonth: (monthKey: string) => void;
  onSelectBooking: (bookingId: string) => void;
  onRequestAction: (id: string, action: 'accepted' | 'rejected') => void;
  onViewRenterProfile: (profile: any) => void;
  renderBookingStatusBadge: (status: string) => React.ReactElement;
  onOpenReviewModal: (booking: any, type: string) => void;
  onOpenCancelModal: (booking: any) => void;
}

export const PrenotazioniRicevute: React.FC<PrenotazioniRicevuteProps> = ({
  hubberBookings,
  hubberBookingFilter,
  hubberTimeFilter,
  expandedMonths,
  selectedHubberBookingId,
  onFilterChange,
  onTimeFilterChange,
  onToggleMonth,
  onSelectBooking,
  onRequestAction,
  onViewRenterProfile,
  renderBookingStatusBadge,
  onOpenReviewModal,
  onOpenCancelModal,
}) => {
  

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Applico il filtro scelto
    let filteredHubberBookings = hubberBookings.filter((b) => {
      // Filtro per stato
      if (hubberBookingFilter !== 'all') {
        // Considero anche 'confirmed' come stato valido per 'accepted'
        if (hubberBookingFilter === 'accepted' && b.status === 'confirmed') {
          // continua
        } else if (b.status !== hubberBookingFilter) {
          return false;
        }
      }

      // ✅ NUOVO: Filtro temporale
      if (hubberTimeFilter === 'current') {
        // "In corso" = prenotazioni attive, future o correnti
        const endDate = new Date(b.end_date || b.endDate || '');
        const activeStatuses = ['pending', 'accepted', 'confirmed', 'paid', 'active'];
        
        // Mostra se: (1) stato attivo E (2) data fine >= oggi
        return activeStatuses.includes(b.status) && endDate >= today;
      }
      
      // "Storico" = tutte le prenotazioni (già filtrate per stato sopra)
      return true;
    });

    // ✅ NUOVO: Raggruppa per mese se "Storico"
    const groupedBookings: Record<string, typeof filteredHubberBookings> = {};
    const groupedByYear: Record<string, Record<string, typeof filteredHubberBookings>> = {};
    
    if (hubberTimeFilter === 'historical') {
      filteredHubberBookings.forEach(b => {
        const startDate = new Date(b.start_date || b.startDate || '');
        const year = startDate.getFullYear();
        const monthKey = `${year}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!groupedBookings[monthKey]) {
          groupedBookings[monthKey] = [];
        }
        groupedBookings[monthKey].push(b);
        
        // Raggruppa anche per anno
        if (!groupedByYear[year]) {
          groupedByYear[year] = {};
        }
        if (!groupedByYear[year][monthKey]) {
          groupedByYear[year][monthKey] = [];
        }
        groupedByYear[year][monthKey].push(b);
      });
      
      // Ordina i gruppi per data (più recente prima)
      const sortedKeys = Object.keys(groupedBookings).sort().reverse();
      const sortedGrouped: Record<string, typeof filteredHubberBookings> = {};
      sortedKeys.forEach(key => {
        sortedGrouped[key] = groupedBookings[key];
      });
      Object.assign(groupedBookings, sortedGrouped);
    }

    // Verifica se ci sono più anni
    const hasMultipleYears = Object.keys(groupedByYear).length > 1;

    // Toggle espansione mese
    const toggleMonth = (monthKey: string) => {
  onToggleMonth(monthKey);
};

    const selectedBooking =
      filteredHubberBookings.find((b) => b.id === selectedHubberBookingId) ||
      filteredHubberBookings[0] ||
      null;

     return (
      <div className="space-y-8 animate-in fade-in duration-300">
                
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center md:text-left">
              Prenotazioni ricevute
            </h2>
            <p className="text-sm text-gray-500">
              Gestisci tutte le prenotazioni dei tuoi annunci come Hubber.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {/* ✅ NUOVO: Toggle temporale */}
            <div className="inline-flex bg-white rounded-xl border border-gray-200 p-1 text-xs justify-center sm:justify-start">
              <button
                onClick={() => onTimeFilterChange('current')}
                className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
                  hubberTimeFilter === 'current'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🔵 In corso
              </button>
              <button
                onClick={() => onTimeFilterChange('historical')}
                className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
                  hubberTimeFilter === 'historical'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📅 Storico
              </button>
            </div>

            {/* Filtri stato */}
            <div className="inline-flex bg-white rounded-xl border border-gray-200 p-1 text-xs flex-wrap justify-center sm:justify-start">
              {(
                [
                  { key: 'all', label: 'Tutte' },
                  { key: 'pending', label: 'In attesa' },
                  { key: 'accepted', label: 'Accettate' },
                  { key: 'completed', label: 'Completate' },
                  { key: 'cancelled', label: 'Cancellate' },
                  { key: 'rejected', label: 'Rifiutate' },
                ] as { key: HubberBookingFilter; label: string }[]
              ).map((item) => (
                <button
                  key={item.key}
                  onClick={() => onFilterChange(item.key)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    hubberBookingFilter === item.key
                      ? 'bg-gray-100 text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LISTA PRENOTAZIONI */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50 flex justify-between items-center">
              <span className="font-bold text-gray-800 text-sm">
                {filteredHubberBookings.length} prenotazioni
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="p-3">Periodo</th>
                    <th className="p-3">Annuncio</th>
                    <th className="p-3">Renter</th>
                    <th className="p-3">Stato</th>
                    <th className="p-3 text-right">Prezzo base</th>
                    <th className="p-3 text-center">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {/* ✅ Modalità "In corso" - Lista normale */}
                  {hubberTimeFilter === 'current' && filteredHubberBookings.map((booking) => {
  
                    const isSelected = booking.id === selectedHubberBookingId;
                    return (
                      <tr
                        key={booking.id}
                        onClick={() => onSelectBooking(booking.id)}
                        className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                          isSelected ? 'bg-gray-50' : ''
                        }`}
                      >
                        <td className="p-3 text-xs whitespace-nowrap">
                          {booking.dates}
                        </td>
                        <td className="p-3 font-medium text-gray-900">
                          {booking.listingTitle}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onViewRenterProfile && (booking as any).renterId) {
                                onViewRenterProfile({
                                  id: (booking as any).renterId,
                                  name: booking.renterName,
                                  avatar: booking.renterAvatar,
                                });
                              }
                            }}
                            className="text-gray-600 hover:text-brand hover:underline"
                          >
                            {booking.renterName}
                          </button>
                        </td>
                        <td className="p-3">
                          {renderBookingStatusBadge(booking.status)}
                        </td>
                        <td className="p-3 text-right">
  {booking.status === 'cancelled' ? (
    <div className="space-y-0.5">
      <div className="text-gray-400 line-through text-xs">
        €{booking.totalPrice.toFixed(2)}
      </div>
      <div className="font-bold text-red-600 text-sm">
        €0.00
      </div>
    </div>
  ) : (
    <span className="font-bold">
      €{booking.totalPrice.toFixed(2)}
    </span>
  )}
</td>
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          {booking.status === 'completed' ? (
                            (booking as any).hasReviewedByHubber ? (
                              <span className="px-3 py-1.5 rounded-lg text-xs font-bold text-green-600 bg-green-50 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Recensito
                              </span>
                            ) : (
                              <button
                                onClick={() => onOpenReviewModal(booking, 'hubber_to_renter')}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors inline-flex items-center gap-1"
                              >
                                <Star className="w-3 h-3" /> Recensione
                              </button>
                            )
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* ✅ Modalità "Storico" - Raggruppato per anno/mese */}
                  {hubberTimeFilter === 'historical' && (() => {
                    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                                       'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
                    
                    if (hasMultipleYears) {
                      // Mostra anni separati
                      return Object.keys(groupedByYear).sort().reverse().map(year => (
                        <React.Fragment key={year}>
                          {/* Header Anno */}
                          <tr className="bg-gray-100 border-b-2 border-gray-300">
                            <td colSpan={6} className="p-4">
                              <span className="text-base font-bold text-gray-900">
                                📆 {year}
                              </span>
                            </td>
                          </tr>
                          
                          {/* Mesi dell'anno */}
                          {Object.keys(groupedByYear[year]).sort().reverse().map(monthKey => {
                            const monthBookings = groupedByYear[year][monthKey];
                            const [, month] = monthKey.split('-');
                            const monthName = monthNames[parseInt(month) - 1];
                            const isExpanded = expandedMonths.has(monthKey);
                            
                            return (
                              <React.Fragment key={monthKey}>
                                {/* Header mese espandibile */}
                                <tr 
                                  className="bg-gray-50 border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
                                  onClick={() => toggleMonth(monthKey)}
                                >
                                  <td colSpan={6} className="p-3">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <span className="text-sm font-bold text-gray-800">
                                          {isExpanded ? '▼' : '▶'} {monthName}
                                        </span>
                                        <span className="ml-2 text-xs text-gray-500">
                                          ({monthBookings.length} prenotazioni)
                                        </span>
                                      </div>
                                      <span className="text-xs text-gray-400">
                                        {isExpanded ? 'Clicca per chiudere' : 'Clicca per aprire'}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                                
                                {/* Prenotazioni del mese (solo se espanso) */}
                                {isExpanded && monthBookings.map((booking) => {
                                  const isSelected = booking.id === selectedHubberBookingId;
                                  return (
                                    <tr
                                      key={booking.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectBooking(booking.id)
                                      }}
                                      className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                                        isSelected ? 'bg-gray-50' : ''
                                      }`}
                                    >
                                      <td className="p-3 text-xs whitespace-nowrap">
                                        {booking.dates}
                                      </td>
                                      <td className="p-3 font-medium text-gray-900">
                                        {booking.listingTitle}
                                      </td>
                                      <td className="p-3">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (onViewRenterProfile && (booking as any).renterId) {
                                              onViewRenterProfile({
                                                id: (booking as any).renterId,
                                                name: booking.renterName,
                                                avatar: booking.renterAvatar,
                                              });
                                            }
                                          }}
                                          className="text-gray-600 hover:text-brand hover:underline"
                                        >
                                          {booking.renterName}
                                        </button>
                                      </td>
                                      <td className="p-3">
                                        {renderBookingStatusBadge(booking.status)}
                                      </td>
                                      <td className="p-3 font-bold text-right">
                                        €{booking.totalPrice.toFixed(2)}
                                      </td>
                                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                        {booking.status === 'completed' ? (
                                          (booking as any).hasReviewedByHubber ? (
                                            <span className="px-3 py-1.5 rounded-lg text-xs font-bold text-green-600 bg-green-50 inline-flex items-center gap-1">
                                              <CheckCircle2 className="w-3 h-3" /> Recensito
                                            </span>
                                          ) : (
                                            <button
                                              onClick={() => onOpenReviewModal(booking, 'hubber_to_renter')}
                                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors inline-flex items-center gap-1"
                                            >
                                              <Star className="w-3 h-3" /> Recensione
                                            </button>
                                          )
                                        ) : (
                                          <span className="text-xs text-gray-400">—</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}
                        </React.Fragment>
                      ));
                    } else {
                      // Anno singolo - mostra solo mesi
                      return Object.keys(groupedBookings).map((monthKey) => {
                        const monthBookings = groupedBookings[monthKey];
                        const [year, month] = monthKey.split('-');
                        const monthName = monthNames[parseInt(month) - 1];
                        const isExpanded = expandedMonths.has(monthKey);
                        
                        return (
                          <React.Fragment key={monthKey}>
                            {/* Header mese espandibile */}
                            <tr 
                              className="bg-gray-50 border-b-2 border-gray-200 hover:bg-gray-100 cursor-pointer"
                              onClick={() => toggleMonth(monthKey)}
                            >
                              <td colSpan={6} className="p-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="text-sm font-bold text-gray-800">
                                      {isExpanded ? '▼' : '▶'} {monthName} {year}
                                    </span>
                                    <span className="ml-2 text-xs text-gray-500">
                                      ({monthBookings.length} prenotazioni)
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-400">
                                    {isExpanded ? 'Clicca per chiudere' : 'Clicca per aprire'}
                                  </span>
                                </div>
                              </td>
                            </tr>
                            
                            {/* Prenotazioni del mese (solo se espanso) */}
                            {isExpanded && monthBookings.map((booking) => {
                              const isSelected = booking.id === selectedHubberBookingId;
                              return (
                                <tr
                                  key={booking.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectBooking(booking.id)
                                  }}
                                  className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                                    isSelected ? 'bg-gray-50' : ''
                                  }`}
                                >
                                  <td className="p-3 text-xs whitespace-nowrap">
                                    {booking.dates}
                                  </td>
                                  <td className="p-3 font-medium text-gray-900">
                                    {booking.listingTitle}
                                  </td>
                                  <td className="p-3">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (onViewRenterProfile && (booking as any).renterId) {
                                          onViewRenterProfile({
                                            id: (booking as any).renterId,
                                            name: booking.renterName,
                                            avatar: booking.renterAvatar,
                                          });
                                        }
                                      }}
                                      className="text-gray-600 hover:text-brand hover:underline"
                                    >
                                      {booking.renterName}
                                    </button>
                                  </td>
                                  <td className="p-3">
                                    {renderBookingStatusBadge(booking.status)}
                                  </td>
                                  <td className="p-3 font-bold text-right">
                                    €{booking.totalPrice.toFixed(2)}
                                  </td>
                                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                    {booking.status === 'completed' ? (
                                      (booking as any).hasReviewedByHubber ? (
                                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold text-green-600 bg-green-50 inline-flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3" /> Recensito
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() => onOpenReviewModal(booking, 'hubber_to_renter')}
                                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors inline-flex items-center gap-1"
                                        >
                                          <Star className="w-3 h-3" /> Recensione
                                        </button>
                                      )
                                    ) : (
                                      <span className="text-xs text-gray-400">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      });
                    }
                  })()}

                  {filteredHubberBookings.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-gray-400 text-sm"
                      >
                        Nessuna prenotazione trovata per il filtro selezionato.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* DETTAGLIO PRENOTAZIONE */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {selectedBooking ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden">
                      {selectedBooking.listingImage && (
                        <img
                          src={selectedBooking.listingImage}
                          alt={selectedBooking.listingTitle}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-semibold">
                        Prenotazione
                      </p>
                      <h3 className="font-bold text-gray-900 text-sm">
                        {selectedBooking.listingTitle}
                      </h3>
                      {/* ✅ Numero prenotazione */}
                      <p className="text-xs text-gray-500 mt-0.5">
                        #{selectedBooking.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                  {renderBookingStatusBadge(selectedBooking.status)}
                </div>

                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-semibold mb-1">
                        Periodo
                      </p>
                      <p className="font-medium text-gray-800">
                        {selectedBooking.dates}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Package className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-semibold mb-1">
                        Renter
                      </p>
                      <div 
                        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          if (onViewRenterProfile && (selectedBooking as any).renterId) {
                            onViewRenterProfile({
                              id: (selectedBooking as any).renterId,
                              name: selectedBooking.renterName,
                              avatar: selectedBooking.renterAvatar,
                            });
                          }
                        }}
                      >
                        {selectedBooking.renterAvatar && (
                          <img
                            src={selectedBooking.renterAvatar}
                            alt={selectedBooking.renterName}
                            className="w-7 h-7 rounded-full"
                          />
                        )}
                        <p className="font-medium text-gray-800 hover:text-brand hover:underline">
                          {selectedBooking.renterName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ✅ SEZIONE 1: IL RENTER HA PAGATO */}
<div className="border-t border-gray-100 pt-4 mt-2 space-y-2">
  <p className="text-xs text-gray-400 uppercase font-semibold">
    Il renter ha pagato
  </p>

  {/* ✅ Prezzo base senza pulizia */}
  <div className="flex justify-between text-sm">
    <span className="text-gray-600">
      Noleggio
    </span>
    <span className="font-medium text-gray-900">
     €{((selectedBooking as any).renterTotalPaid - (selectedBooking as any).renterTotalFee - ((selectedBooking as any).cleaningFee || 0)).toFixed(2)}
    </span>
  </div>
  {/* ✅ Costo pulizia (se presente) */}
  {((selectedBooking as any).cleaningFee || 0) > 0 && (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">
        Costo pulizia
      </span>
      <span className="font-medium text-gray-900">
        €{((selectedBooking as any).cleaningFee || 0).toFixed(2)}
      </span>
    </div>
  )}
  {/* ✅ Commissione servizio (SOLO commissioni, senza cauzione) */}
  <div className="flex justify-between text-sm">
    <span className="text-gray-600">
      Commissione di servizio
    </span>
    <span className="font-medium text-gray-900">
     €{((selectedBooking as any).renterTotalFee || 0).toFixed(2)}
    </span>
  </div>
  {/* ✅ Cauzione (se presente) */}
  {((selectedBooking as any).deposit || 0) > 0 && (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">
        Cauzione (rimborsabile)
      </span>
      <span className="font-medium text-amber-600">
        €{((selectedBooking as any).deposit || 0).toFixed(2)}
      </span>
    </div>
  )}
  <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
    <span className="text-gray-800 font-semibold">
      Totale (EUR)
    </span>
    <span className="font-bold text-gray-900">
      €{((selectedBooking as any).renterTotalPaid || 0).toFixed(2)}
    </span>
  </div>
</div>

                  {/* ✅ SEZIONE 2: COMPENSO DELL'HUBBER */}
<div className="border-t border-gray-100 pt-4 mt-4 space-y-2">
  <p className="text-xs text-gray-400 uppercase font-semibold">
    Compenso dell'hubber
  </p>
  
  {selectedBooking.status === 'cancelled' ? (
    <>
      {/* ⚠️ PRENOTAZIONE CANCELLATA - Importi azzerati */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
          Prenotazione Cancellata
        </p>
        <p className="text-xs text-gray-400">
          Nessun compenso
        </p>
      </div>
      
      {/* Importo noleggio */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">
          Importo noleggio
        </span>
        <span className="font-medium text-gray-400">€0.00</span>
      </div>
      
      {/* Costo pulizia (se presente) */}
      {((selectedBooking as any).cleaningFee || 0) > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">
            Costo pulizia
          </span>
          <span className="font-medium text-gray-400">€0.00</span>
        </div>
      )}
      
      {/* Commissione variabile */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">
          Commissione di servizio (10% iva inclusa)
        </span>
        <span className="font-medium text-gray-400">-€0.00</span>
      </div>
      
      {/* Fee fissa */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">
          Fee fissa piattaforma
        </span>
        <span className="font-medium text-gray-400">-€0.00</span>
      </div>
      
      {/* Totale */}
      <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
        <span className="text-gray-500 font-semibold">
          Totale (EUR)
        </span>
        <span className="font-bold text-gray-400">€0.00</span>
      </div>
    </>
  ) : (
    <>
      {/* ✅ PRENOTAZIONE NORMALE */}
      
      {/* ✅ Importo base senza pulizia */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">
          Importo noleggio
        </span>
        <span className="font-medium text-gray-900">
          €{((selectedBooking as any).renterTotalPaid - (selectedBooking as any).renterTotalFee - ((selectedBooking as any).cleaningFee || 0)).toFixed(2)}
        </span>
      </div>
      
      {/* ✅ Costo pulizia (se presente) */}
      {((selectedBooking as any).cleaningFee || 0) > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            Costo pulizia
          </span>
          <span className="font-medium text-gray-900">
            €{((selectedBooking as any).cleaningFee || 0).toFixed(2)}
          </span>
        </div>
      )}
      
{/* ✅ Commissione hubber (10%) */}
{(() => {
  const cleaningFee = (selectedBooking as any).cleaningFee || 0;
  const baseAmount = (selectedBooking as any).renterTotalPaid - (selectedBooking as any).renterTotalFee;
  const variableCommission = baseAmount * 0.10;
  const fixedFee = calculateHubberFixedFee(baseAmount + cleaningFee);

  return (
    <>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">
          Commissione di servizio (10% IVA inclusa)
        </span>
        <span className="font-medium text-red-500">
          -€{variableCommission.toFixed(2)}
        </span>
      </div>
      
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">
          Fee fissa piattaforma
        </span>
        <span className="font-medium text-red-500">
          -€{fixedFee.toFixed(2)}
        </span>
      </div>
    </>
  );
})()}
      
      {/* Totale */}
      <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
        <span className="text-gray-800 font-semibold">
          Totale (EUR)
        </span>
        <span className="font-bold text-green-600">
          €{(selectedBooking.netEarnings ?? (selectedBooking.totalPrice - (selectedBooking.commission || 0))).toFixed(2)}
        </span>
      </div>
    </>
  )}
</div>

{selectedBooking.status === 'pending' && (
  <div className="pt-4 border-t border-gray-100 mt-2 space-y-2">
    <p className="text-xs text-gray-400 uppercase font-semibold">
      Azioni
    </p>
    <div className="flex gap-2">
      <button
        onClick={() =>
          onRequestAction(
            selectedBooking.id,
            'rejected'
          )
        }
        className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-bold hover:bg-gray-50"
      >
        Rifiuta
      </button>
      <button
        onClick={() =>
          onRequestAction(
            selectedBooking.id,
            'accepted'
          )
        }
        className="flex-1 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-dark"
      >
        Accetta
      </button>
    </div>
  </div>
)}

                  {/* ✅ PULSANTE CANCELLA PER PRENOTAZIONI CONFERMATE/ATTIVE */}
                  {['confirmed', 'accepted', 'active'].includes(selectedBooking.status) && (
                    <div className="pt-4 border-t border-gray-100 mt-2">
                      <button
                        onClick={() => onOpenCancelModal(selectedBooking)}
                        className="w-full py-2.5 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
                      >
                        Cancella prenotazione
                      </button>
                      <p className="text-xs text-gray-400 mt-2 text-center">
                        Il Renter riceverà un rimborso completo
                      </p>
                    </div>
                  )}

                  {/* ✅ PULSANTE RECENSIONE PER PRENOTAZIONI COMPLETATE */}
                  {selectedBooking.status === 'completed' && (
                    <div className="pt-4 border-t border-gray-100 mt-2">
                      {(selectedBooking as any).hasReviewedByHubber ? (
                        <div className="w-full py-2.5 rounded-lg bg-green-50 text-green-600 text-sm font-semibold text-center flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Hai già lasciato una recensione
                        </div>
                      ) : (
                        <button
                          onClick={() => onOpenReviewModal(selectedBooking, 'hubber_to_renter')}
                          className="w-full py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
                        >
                          <Star className="w-4 h-4" />
                          Lascia una recensione al Renter
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 text-sm">
                <Calendar className="w-8 h-8 mb-3" />
                <p>Seleziona una prenotazione dalla lista per vedere i dettagli.</p>
              </div>
            )}
         </div>
        </div>
      </div>
    );
};