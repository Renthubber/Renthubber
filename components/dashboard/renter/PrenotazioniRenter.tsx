import React from 'react';
import { Calendar, Package, Star, CheckCircle2, X, Clock, MapPin, Edit3 } from 'lucide-react';

type TimeFilter = 'current' | 'historical';

interface PrenotazioniRenterProps {
  renterBookings: any[];
  renterTimeFilter: TimeFilter;
  expandedRenterMonths: Set<string>;
  selectedRenterBooking: any | null;
  onTimeFilterChange: (filter: TimeFilter) => void;
  onToggleMonth: (monthKey: string) => void;
  onSelectBooking: (booking: any) => void;
  onViewHubberProfile: (profile: any) => void;
  onCancelBooking: (booking: any) => void;
  onOpenReviewModal: (booking: any, type: string) => void;
  renderBookingStatusBadge: (status: string) => React.ReactElement;
  loadBookingDetail: (booking: any) => void;
  closeBookingDetail: () => void;
  bookingDetailData: any;
  loadingBookingDetail: boolean;
  canCancelBooking: (status: string) => boolean;
  openModifyModal: (booking: any) => void;
  openCancelModal: (booking: any) => void;
  formatCancellationPolicy: (policy: string) => any;
}

export const PrenotazioniRenter: React.FC<PrenotazioniRenterProps> = ({
  renterBookings,
  renterTimeFilter,
  expandedRenterMonths,
  selectedRenterBooking,
  onTimeFilterChange,
  onToggleMonth,
  onSelectBooking,
  onViewHubberProfile,
  onCancelBooking,
  onOpenReviewModal,
  renderBookingStatusBadge,
  loadBookingDetail,
  closeBookingDetail,
  bookingDetailData,
  loadingBookingDetail,
  canCancelBooking,
  openModifyModal,
  openCancelModal,
  formatCancellationPolicy,
}) => {

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Applico filtro temporale
        let filteredRenterBookings = renterBookings.filter((b) => {
          if (renterTimeFilter === 'current') {
            // "In corso" = prenotazioni attive, future o correnti
            const endDate = new Date(b.end_date || b.endDate || '');
            const activeStatuses = ['pending', 'accepted', 'confirmed', 'paid', 'active'];
            
            // Mostra se: (1) stato attivo E (2) data fine >= oggi
            return activeStatuses.includes(b.status) && endDate >= today;
          }
          
          // "Storico" = tutte le prenotazioni
          return true;
        });
    
        // ✅ Raggruppa per mese se "Storico"
        const groupedBookings: Record<string, typeof filteredRenterBookings> = {};
        const groupedByYear: Record<string, Record<string, typeof filteredRenterBookings>> = {};
        
        if (renterTimeFilter === 'historical') {
          filteredRenterBookings.forEach(b => {
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
          const sortedGrouped: Record<string, typeof filteredRenterBookings> = {};
          sortedKeys.forEach(key => {
            sortedGrouped[key] = groupedBookings[key];
          });
          Object.assign(groupedBookings, sortedGrouped);
        }
    
        // Verifica se ci sono più anni
        const hasMultipleYears = Object.keys(groupedByYear).length > 1;

        // Toggle espansione mese
    const toggleRenterMonth = (monthKey: string) => {
      onToggleMonth(monthKey);
    };
    
        return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* ✅ NUOVO: Header con toggle temporale */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center md:text-left">
                Le mie prenotazioni
              </h2>
              <p className="text-sm text-gray-500">
                Tutte le prenotazioni che hai effettuato su Renthubber.
              </p>
            </div>
    
            {/* Toggle temporale */}
            <div className="inline-flex bg-white rounded-xl border border-gray-200 p-1 text-xs justify-center sm:justify-start">
              <button
                onClick={() => onTimeFilterChange('current')}
                className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
                  renterTimeFilter === 'current'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🔵 In corso
              </button>
              <button
                onClick={() => onTimeFilterChange('historical')}
                className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
                  renterTimeFilter === 'historical'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📅 Storico
              </button>
            </div>
          </div>
    
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LISTA PRENOTAZIONI */}
            <div className={`${selectedRenterBooking ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden`}>
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-brand" /> {filteredRenterBookings.length} prenotazioni
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  Clicca su una prenotazione per vedere i dettagli.
                </p>
              </div>
    
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="p-4">Periodo</th>
                      <th className="p-4">Annuncio</th>
                      <th className="p-4">Stato</th>
                      <th className="p-4 text-right">Totale</th>
                      <th className="p-4 text-center">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* ✅ Modalità "In corso" - Lista normale */}
                    {renterTimeFilter === 'current' && filteredRenterBookings.map((booking) => {
                      const isSelected = selectedRenterBooking?.id === booking.id;
                      // Usa renterTotalPaid se disponibile, altrimenti fallback
                      const displayTotal = (booking as any).renterTotalPaid || booking.totalPrice;
                      
                      return (
                        <tr
                          key={booking.id}
                          onClick={(e) => {
  e.preventDefault();
  const scrollPosition = window.scrollY;
  loadBookingDetail(booking);
  setTimeout(() => window.scrollTo(0, scrollPosition), 0);
}}
                          className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50 hover:bg-blue-50' : ''
                          }`}
                        >
                          <td className="p-4 text-xs whitespace-nowrap">
                            {booking.dates}
                          </td>
                          <td className="p-4 font-medium text-gray-900">
                            {booking.listingTitle}
                          </td>
                          <td className="p-4">
                            {renderBookingStatusBadge(booking.status)}
                          </td>
                          <td className="p-4 font-bold text-right">
                            €{displayTotal.toFixed(2)}
                          </td>
                         <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
      {booking.status === 'completed' ? (
        (booking as any).hasReviewed ? (
          <span className="px-3 py-1.5 rounded-lg text-xs font-bold text-green-600 bg-green-50 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Recensito
          </span>
        ) : (
          <button
            onClick={() => onOpenReviewModal(booking, 'renter_to_hubber')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors inline-flex items-center gap-1"
          >
            <Star className="w-3 h-3" /> Recensione
          </button>
        )
      ) : canCancelBooking(booking.status) ? (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => openModifyModal (booking)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1"
          >
            <Edit3 className="w-3 h-3" />
            Modifica
          </button>
          <button
            onClick={() => openCancelModal(booking)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
          >
            Cancella
          </button>
        </div>
      ) : (
        <span className="text-xs text-gray-400">—</span>
      )}
    </td>
                        </tr>
                      );
                    })}
    
                    {/* ✅ Modalità "Storico" - Raggruppato per anno/mese */}
                    {renterTimeFilter === 'historical' && (() => {
                      const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                                         'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
                      
                      if (hasMultipleYears) {
                        // Mostra anni separati
                        return Object.keys(groupedByYear).sort().reverse().map(year => (
                          <React.Fragment key={year}>
                            {/* Header Anno */}
                            <tr className="bg-gray-100 border-b-2 border-gray-300">
                              <td colSpan={5} className="p-4">
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
                              const isExpanded = expandedRenterMonths.has(monthKey);
                              
                              return (
                                <React.Fragment key={monthKey}>
                                  {/* Header mese espandibile */}
                                  <tr 
                                    className="bg-gray-50 border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => toggleRenterMonth(monthKey)}
                                  >
                                    <td colSpan={5} className="p-3">
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
                                    const isSelected = selectedRenterBooking?.id === booking.id;
                                    const displayTotal = (booking as any).renterTotalPaid || booking.totalPrice;
                                    
                                    return (
                                      <tr
                                        key={booking.id}
                                        onClick={(e) => {
                                      e.preventDefault();
                                      const scrollPosition = window.scrollY;
                                      loadBookingDetail(booking);
                                      setTimeout(() => window.scrollTo(0, scrollPosition), 0);
                                     }}
                                        className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                                          isSelected ? 'bg-blue-50 hover:bg-blue-50' : ''
                                        }`}
                                      >
                                        <td className="p-4 text-xs whitespace-nowrap">
                                          {booking.dates}
                                        </td>
                                        <td className="p-4 font-medium text-gray-900">
                                          {booking.listingTitle}
                                        </td>
                                        <td className="p-4">
                                          {renderBookingStatusBadge(booking.status)}
                                        </td>
                                        <td className="p-4 font-bold text-right">
                                          €{displayTotal.toFixed(2)}
                                        </td>
                                       <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
      {booking.status === 'completed' ? (
        (booking as any).hasReviewed ? (
          <span className="px-3 py-1.5 rounded-lg text-xs font-bold text-green-600 bg-green-50 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Recensito
          </span>
        ) : (
          <button
            onClick={() => onOpenReviewModal(booking, 'renter_to_hubber')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors inline-flex items-center gap-1"
          >
            <Star className="w-3 h-3" /> Recensione
          </button>
        )
      ) : canCancelBooking(booking.status) ? (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => openModifyModal(booking)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1"
          >
            <Edit3 className="w-3 h-3" />
            Modifica
          </button>
          <button
            onClick={() => openCancelModal(booking)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
          >
            Cancella
          </button>
        </div>
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
                          const isExpanded = expandedRenterMonths.has(monthKey);
                          
                          return (
                            <React.Fragment key={monthKey}>
                              {/* Header mese espandibile */}
                              <tr 
                                className="bg-gray-50 border-b-2 border-gray-200 hover:bg-gray-100 cursor-pointer"
                                onClick={() => toggleRenterMonth(monthKey)}
                              >
                                <td colSpan={5} className="p-3">
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
                                const isSelected = selectedRenterBooking?.id === booking.id;
                                const displayTotal = (booking as any).renterTotalPaid || booking.totalPrice;
                                
                                return (
                                  <tr
                                    key={booking.id}
                                    onClick={(e) => {
                                   e.preventDefault();
                                 const scrollPosition = window.scrollY;
                                  loadBookingDetail(booking);
                                  setTimeout(() => window.scrollTo(0, scrollPosition), 0);
                                  }}
                                    className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                                      isSelected ? 'bg-blue-50 hover:bg-blue-50' : ''
                                    }`}
                                  >
                                    <td className="p-4 text-xs whitespace-nowrap">
                                      {booking.dates}
                                    </td>
                                    <td className="p-4 font-medium text-gray-900">
                                      {booking.listingTitle}
                                    </td>
                                    <td className="p-4">
                                      {renderBookingStatusBadge(booking.status)}
                                    </td>
                                    <td className="p-4 font-bold text-right">
                                      €{displayTotal.toFixed(2)}
                                    </td>
                                   <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
      {booking.status === 'completed' ? (
        (booking as any).hasReviewed ? (
          <span className="px-3 py-1.5 rounded-lg text-xs font-bold text-green-600 bg-green-50 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Recensito
          </span>
        ) : (
          <button
            onClick={() => onOpenReviewModal(booking, 'renter_to_hubber')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors inline-flex items-center gap-1"
          >
            <Star className="w-3 h-3" /> Recensione
          </button>
        )
      ) : canCancelBooking(booking.status) ? (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => openModifyModal(booking)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1"
          >
            <Edit3 className="w-3 h-3" />
            Modifica
          </button>
          <button
            onClick={() => openCancelModal(booking)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
          >
            Cancella
          </button>
        </div>
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
    
                    {filteredRenterBookings.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-400">
                          Non hai ancora effettuato nessuna prenotazione.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
    
            {/* DETTAGLIO PRENOTAZIONE */}
            {selectedRenterBooking && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6" style={{ scrollMarginTop: 0 }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Dettaglio prenotazione</h3>
                  <button
                    onClick={closeBookingDetail}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
    
                {/* Info prenotazione */}
                <div className="flex items-start gap-3 mb-4 pb-4 border-b border-gray-100">
                  <div className="w-16 h-16 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                    {selectedRenterBooking.listingImage && (
                      <img
                        src={selectedRenterBooking.listingImage}
                        alt={selectedRenterBooking.listingTitle}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm">
                      {selectedRenterBooking.listingTitle}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {selectedRenterBooking.dates}
                    </p>
                    <div className="mt-2">
                      {renderBookingStatusBadge(selectedRenterBooking.status)}
                    </div>
                 </div>
              </div>
    
    {/* Proprietario/Hubber */}
    <div className="mb-4 pb-4 border-b border-gray-100">
      <p className="text-xs text-gray-400 uppercase font-semibold mb-2">
        Hubber
      </p>
      <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
          {selectedRenterBooking.hubberAvatar ? (
            <img
              src={selectedRenterBooking.hubberAvatar}
              alt={selectedRenterBooking.hubberName || 'Proprietario'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">
              {(selectedRenterBooking.hubberName || 'H')[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">
            {selectedRenterBooking.hubberName || 'Proprietario'}
          </p>
          <p className="text-xs text-gray-500"></p>
        </div>
      </div>
    </div>
    
                {/* Codice prenotazione */}
                <div className="bg-gray-50 rounded-xl p-3 mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Codice Prenotazione</p>
                    <p className="text-lg font-mono font-bold text-brand tracking-wider">
                      #{selectedRenterBooking.id.replace(/-/g, '').slice(0, 6).toUpperCase()}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const code = selectedRenterBooking.id.replace(/-/g, '').slice(0, 6).toUpperCase();
                      navigator.clipboard.writeText(code);
                    }}
                    className="text-xs text-brand hover:underline"
                  >
                    Copia
                  </button>
                </div>
    
                {/* Indirizzo ritiro - solo se confermata/accettata */}
                {(selectedRenterBooking.status === 'confirmed' || selectedRenterBooking.status === 'accepted') && bookingDetailData && (
                  <div className="bg-brand/5 border border-brand/20 rounded-xl p-4 mb-4">
                    <p className="text-xs text-brand uppercase font-semibold mb-2 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      Indirizzo di ritiro
                    </p>
                    {(bookingDetailData as any).pickupAddress ? (
                      <>
                        <p className="font-bold text-gray-900 text-sm">
                          {(bookingDetailData as any).pickupAddress}
                        </p>
                        {(bookingDetailData as any).pickupCity && (
                          <p className="text-sm text-gray-600">{(bookingDetailData as any).pickupCity}</p>
                        )}
                        {(bookingDetailData as any).pickupInstructions && (
                          <p className="text-xs text-gray-500 mt-2 italic">
                            "{(bookingDetailData as any).pickupInstructions}"
                          </p>
                        )}
                         <button
                          onClick={() => {
                            const address = encodeURIComponent(
                              `${(bookingDetailData as any).pickupAddress}, ${(bookingDetailData as any).pickupCity || ''}`
                            );
                            window.open(
                              `https://www.google.com/maps/search/?api=1&query=${address}`,
                              '_blank'
                            );
                          }}
                          className="mt-3 w-full bg-brand text-white font-bold py-2 px-4 rounded-lg text-sm hover:bg-brand-dark transition-colors flex items-center justify-center gap-2"
                        >
                          <MapPin className="w-4 h-4" />
                          Apri in Google Maps
                        </button>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">
                        L'hubber non ha ancora inserito l'indirizzo. Contattalo per maggiori informazioni.
                      </p>
                    )}
                  </div>
                )}
    
                {/* Messaggio se in attesa di conferma */}
                {selectedRenterBooking.status === 'pending' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                    <p className="text-xs text-yellow-700 font-semibold mb-1 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      In attesa di conferma
                    </p>
                    <p className="text-sm text-yellow-600">
                      L'indirizzo di ritiro sarà visibile dopo la conferma dell'hubber.
                    </p>
                  </div>
                )}
    
                {/* Breakdown costi */}
    {loadingBookingDetail ? (
      <div className="text-center py-8">
        <div className="animate-spin w-6 h-6 border-2 border-brand border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-sm text-gray-500">Caricamento dettagli...</p>
      </div>
    ) : bookingDetailData ? (
      <div className="space-y-4">
        <div>
          <p className="text-xs text-gray-400 uppercase font-semibold mb-2">
            Riepilogo costi
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">
€{bookingDetailData.listingPrice.toFixed(2)} × {bookingDetailData.days} {bookingDetailData.days === 1 ? (bookingDetailData.priceUnit === 'giorno' ? 'giorno' : bookingDetailData.priceUnit === 'settimana' ? 'settimana' : bookingDetailData.priceUnit === 'mese' ? 'mese' : bookingDetailData.priceUnit) : (bookingDetailData.priceUnit === 'giorno' ? 'giorni' : bookingDetailData.priceUnit === 'settimana' ? 'settimane' : bookingDetailData.priceUnit === 'mese' ? 'mesi' : bookingDetailData.priceUnit)}
              </span>
              <span className="font-medium text-gray-900">
                €{bookingDetailData.basePrice.toFixed(2)}
              </span>
            </div>
            {bookingDetailData.cleaningFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Costo pulizia
                </span>
                <span className="font-medium text-gray-900">
                  €{bookingDetailData.cleaningFee.toFixed(2)}
                </span>
              </div>
            )}
            {bookingDetailData.extraGuestsCount > 0 && bookingDetailData.extraGuestsFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {bookingDetailData.extraGuestsCount} ospit{bookingDetailData.extraGuestsCount > 1 ? 'i' : 'e'} extra
                </span>
                <span className="font-medium text-gray-900">
                  €{bookingDetailData.extraGuestsFee.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">
                Commissione di servizio ({bookingDetailData.renterFeePercent ?? 10}% IVA inclusa)
              </span>
              <span className="font-medium text-gray-900">
                €{bookingDetailData.commission.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">
                Fee fissa piattaforma
              </span>
              <span className="font-medium text-gray-900">
                €{bookingDetailData.fixedFee.toFixed(2)}
              </span>
            </div>
            {(bookingDetailData as any).deposit > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Cauzione (rimborsabile)
                </span>
                <span className="font-medium text-amber-600">
                  €{((bookingDetailData as any).deposit || 0).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
    
        <div className="border-t border-gray-100 pt-3">
          <div className="flex justify-between text-base font-bold">
            <span className="text-gray-900">Totale pagato</span>
            <span className="text-brand">€{bookingDetailData.total.toFixed(2)}</span>
          </div>
        </div>
    
                    {/* Metodo di pagamento */}
                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-xs text-gray-400 uppercase font-semibold mb-2">
                        Metodo di pagamento
                      </p>
                      <div className="space-y-1 text-sm">
                        {bookingDetailData.walletUsed > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Wallet</span>
                            <span className="font-medium text-gray-900">
                              €{bookingDetailData.walletUsed.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {bookingDetailData.cardPaid > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Carta</span>
                            <span className="font-medium text-gray-900">
                              €{bookingDetailData.cardPaid.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
    
                    {/* Politica di cancellazione */}
                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-xs text-gray-400 uppercase font-semibold mb-2">
                        Politica di cancellazione
                      </p>
                      {(() => {
                        const policyInfo = formatCancellationPolicy(bookingDetailData.cancellationPolicy);
                        return (
                          <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ${policyInfo.color}`}>
                            {policyInfo.label}
                          </div>
                        );
                      })()}
                      <p className="text-xs text-gray-500 mt-1">
                        {formatCancellationPolicy(bookingDetailData.cancellationPolicy).description}
                      </p>
                      
                      {/* Anteprima rimborso se cancelli ora */}
                      {canCancelBooking(selectedRenterBooking.status) && (
                        <div className={`mt-2 p-2 rounded-lg text-xs ${
                          bookingDetailData.refundInfo.percentage === 100 
                            ? 'bg-green-50 text-green-700'
                            : bookingDetailData.refundInfo.percentage > 0
                              ? 'bg-yellow-50 text-yellow-700'
                              : 'bg-red-50 text-red-700'
                        }`}>
                          <p className="font-medium">Se cancelli ora:</p>
                          <p>{bookingDetailData.refundInfo.message}</p>
                          {bookingDetailData.refundInfo.amount > 0 && (
                            <p className="font-bold mt-1">
                              Rimborso: €{bookingDetailData.refundInfo.amount.toFixed(2)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
    
                    {/* Azioni */}
                    {canCancelBooking(selectedRenterBooking.status) && (
                      <div className="border-t border-gray-100 pt-4 mt-4 space-y-2">
                        <button
                          onClick={() => openModifyModal(selectedRenterBooking)}
                          className="w-full py-2.5 rounded-xl border border-blue-200 text-blue-600 font-bold text-sm hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                        >
                          <Edit3 className="w-4 h-4" />
                          Modifica date
                        </button>
                        <button
                          onClick={() => openCancelModal(selectedRenterBooking)}
                          className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors"
                        >
                          Cancella prenotazione
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    <p>Seleziona una prenotazione per vedere i dettagli</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        );
      };