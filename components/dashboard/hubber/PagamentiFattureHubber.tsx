import React from 'react';
import { Download, ChevronDown, ChevronUp, DollarSign, Calendar, FileText, CheckCircle2 } from 'lucide-react';

type TimeFilter = 'current' | 'historical';

interface PagamentiFattureHubberProps {
  hubberBookings: any[];
  userInvoices: any[];
  hubberPaymentsTimeFilter: TimeFilter;
  hubberInvoicesTimeFilter: TimeFilter;
  expandedHubberPaymentsMonths: Set<string>;
  expandedHubberInvoicesMonths: Set<string>;
  onPaymentsTimeFilterChange: (filter: TimeFilter) => void;
  onInvoicesTimeFilterChange: (filter: TimeFilter) => void;
  onTogglePaymentMonth: (monthKey: string) => void;
  onToggleInvoiceMonth: (monthKey: string) => void;
  onDownloadInvoice: (invoiceId: string) => void;
  getTransactionNumber: (bookingId: string, isHubber: boolean) => string;
  onViewRenterProfile: (profile: any) => void;
  renderBookingStatusBadge: (status: string) => React.ReactElement;
  loadingInvoices: boolean;
}

export const PagamentiFattureHubber: React.FC<PagamentiFattureHubberProps> = ({
  hubberBookings,
  userInvoices,
  hubberPaymentsTimeFilter,
  hubberInvoicesTimeFilter,
  expandedHubberPaymentsMonths,
  expandedHubberInvoicesMonths,
  onPaymentsTimeFilterChange,
  onInvoicesTimeFilterChange,
  onTogglePaymentMonth,
  onToggleInvoiceMonth,
  onDownloadInvoice,
  getTransactionNumber,
  onViewRenterProfile,
  renderBookingStatusBadge,
  loadingInvoices,
}) => {

      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      // Filtra prenotazioni pagate/completate
      let paidHubberBookings = hubberBookings.filter((b) =>
        ['confirmed', 'accepted', 'completed', 'active', 'paid'].includes(b.status)
      );
  
      // ✅ Applico filtro temporale
      if (hubberPaymentsTimeFilter === 'current') {
        // "Mese corrente"
        paidHubberBookings = paidHubberBookings.filter(b => {
          const bookingDate = new Date(b.start_date || b.startDate || '');
          return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
        });
      }
  
      // ✅ Raggruppa per anno/mese se "Storico"
      const groupedPayments: Record<string, typeof paidHubberBookings> = {};
      const groupedByYear: Record<string, Record<string, typeof paidHubberBookings>> = {};
      
      if (hubberPaymentsTimeFilter === 'historical') {
        paidHubberBookings.forEach(b => {
          const bookingDate = new Date(b.start_date || b.startDate || '');
          const year = bookingDate.getFullYear();
          const monthKey = `${year}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}`;
          
          if (!groupedPayments[monthKey]) {
            groupedPayments[monthKey] = [];
          }
          groupedPayments[monthKey].push(b);
          
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
        const sortedKeys = Object.keys(groupedPayments).sort().reverse();
        const sortedGrouped: Record<string, typeof paidHubberBookings> = {};
        sortedKeys.forEach(key => {
          sortedGrouped[key] = groupedPayments[key];
        });
        Object.assign(groupedPayments, sortedGrouped);
      }
  
      // Verifica se ci sono più anni
      const hasMultipleYears = Object.keys(groupedByYear).length > 1;
  
      // Toggle espansione mese
    const togglePaymentMonth = (monthKey: string) => {
      onTogglePaymentMonth(monthKey);
    };
  
      // ✅ Filtro fatture per mese corrente o storico
      let filteredInvoices = userInvoices;
      if (hubberInvoicesTimeFilter === 'current') {
        // Mese corrente
        filteredInvoices = userInvoices.filter(inv => {
          const invoiceDate = new Date(inv.created_at);
          return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
        });
      }
  
      // ✅ Raggruppa fatture per anno/mese se "Storico"
      const groupedInvoices: Record<string, typeof filteredInvoices> = {};
      const groupedInvoicesByYear: Record<string, Record<string, typeof filteredInvoices>> = {};
      
      if (hubberInvoicesTimeFilter === 'historical') {
        filteredInvoices.forEach(inv => {
          const invoiceDate = new Date(inv.created_at);
          const year = invoiceDate.getFullYear();
          const monthKey = `${year}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`;
          
          if (!groupedInvoices[monthKey]) {
            groupedInvoices[monthKey] = [];
          }
          groupedInvoices[monthKey].push(inv);
          
          if (!groupedInvoicesByYear[year]) {
            groupedInvoicesByYear[year] = {};
          }
          if (!groupedInvoicesByYear[year][monthKey]) {
            groupedInvoicesByYear[year][monthKey] = [];
          }
          groupedInvoicesByYear[year][monthKey].push(inv);
        });
        
        const sortedKeys = Object.keys(groupedInvoices).sort().reverse();
        const sortedGrouped: Record<string, typeof filteredInvoices> = {};
        sortedKeys.forEach(key => {
          sortedGrouped[key] = groupedInvoices[key];
        });
        Object.assign(groupedInvoices, sortedGrouped);
      }
  
      const hasMultipleInvoiceYears = Object.keys(groupedInvoicesByYear).length > 1;
  
      const toggleInvoiceMonth = (monthKey: string) => {
      onToggleInvoiceMonth(monthKey);
    };
  
      return (
    <div className="space-y-8 animate-in fade-in duration-300">    
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-brand" /> Dettaglio
                  Prenotazioni & Guadagni
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  Lista delle prenotazioni completate o accettate con dettaglio
                  commissioni.
                </p>
              </div>
              
              {/* ✅ Toggle temporale */}
              <div className="inline-flex bg-white rounded-xl border border-gray-200 p-1 text-xs justify-center sm:justify-start">
                <button
                  onClick={() => onPaymentsTimeFilterChange('current')}
                  className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
                    hubberPaymentsTimeFilter === 'current'
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  🔵 Mese corrente
                </button>
                <button
                  onClick={() => onPaymentsTimeFilterChange('historical')}
                  className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
                    hubberPaymentsTimeFilter === 'historical'
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📅 Storico
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-100">
                <tr>
                  <th className="p-4">Data</th>
                  <th className="p-4">N° Transazione</th>
                  <th className="p-4">Annuncio</th>
                  <th className="p-4">Renter</th>
                  <th className="p-4">Stato</th>
                  <th className="p-4">Prezzo base</th>
                  <th className="p-4 text-red-500">Commissione</th>
                  <th className="p-4 text-green-600 text-right">Netto Hubber</th>
                </tr>
              </thead>
              <tbody>
                {/* ✅ Modalità "Mese corrente" - Lista normale */}
                {hubberPaymentsTimeFilter === 'current' && paidHubberBookings.map((booking) => {
                  const bookingDate = booking.start_date || booking.startDate || '';
                  const transactionNumber = getTransactionNumber(booking.id, true); // ✅ USA HELPER GLOBALE
                  
                  return (
                    <tr
                      key={booking.id}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="p-4 text-xs whitespace-nowrap">
                        {booking.dates}
                      </td>
                      <td className="p-4 font-mono text-xs text-gray-600">
                        {transactionNumber}
                      </td>
                      <td className="p-4 font-medium text-gray-900">
                        {booking.listingTitle}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => {
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
                      <td className="p-4">
                        {renderBookingStatusBadge(booking.status)}
                      </td>
                      <td className="p-4 font-bold">
                        €{booking.totalPrice.toFixed(2)}
                      </td>
                      <td className="p-4 text-red-500">
                        - €{booking.commission?.toFixed(2) || '0.00'}
                      </td>
                      <td className="p-4 font-bold text-green-600 text-right">
                        €
                        {booking.netEarnings?.toFixed(2) ||
                          booking.totalPrice.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
  
                {/* ✅ Modalità "Storico" - Raggruppato per anno/mese */}
                {hubberPaymentsTimeFilter === 'historical' && (() => {
                  const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                                     'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
                  
                  if (hasMultipleYears) {
                    return Object.keys(groupedByYear).sort().reverse().map(year => (
                      <React.Fragment key={year}>
                        <tr className="bg-gray-100 border-b-2 border-gray-300">
                          <td colSpan={8} className="p-4">
                            <span className="text-base font-bold text-gray-900">
                              📆 {year}
                            </span>
                          </td>
                        </tr>
                        
                        {Object.keys(groupedByYear[year]).sort().reverse().map(monthKey => {
                          const monthPayments = groupedByYear[year][monthKey];
                          const [, month] = monthKey.split('-');
                          const monthName = monthNames[parseInt(month) - 1];
                          const isExpanded = expandedHubberPaymentsMonths.has(monthKey);
                          
                          return (
                            <React.Fragment key={monthKey}>
                              <tr 
                                className="bg-gray-50 border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
                                onClick={() => togglePaymentMonth(monthKey)}
                              >
                                <td colSpan={8} className="p-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="text-sm font-bold text-gray-800">
                                        {isExpanded ? '▼' : '▶'} {monthName}
                                      </span>
                                      <span className="ml-2 text-xs text-gray-500">
                                        ({monthPayments.length} pagamenti)
                                      </span>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                      {isExpanded ? 'Clicca per chiudere' : 'Clicca per aprire'}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                              
                              {isExpanded && monthPayments.map((booking) => {
                                const bookingDate = booking.start_date || booking.startDate || '';
                                const transactionNumber = getTransactionNumber(booking.id, true); // ✅ USA HELPER GLOBALE
                                
                                return (
                                  <tr
                                    key={booking.id}
                                    onClick={(e) => e.stopPropagation()}
                                    className="border-b border-gray-50 hover:bg-gray-50"
                                  >
                                    <td className="p-4 text-xs whitespace-nowrap">
                                      {booking.dates}
                                    </td>
                                    <td className="p-4 font-mono text-xs text-gray-600">
                                      {transactionNumber}
                                    </td>
                                    <td className="p-4 font-medium text-gray-900">
                                      {booking.listingTitle}
                                    </td>
                                    <td className="p-4">
                                      <button
                                        onClick={() => {
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
                                    <td className="p-4">
                                      {renderBookingStatusBadge(booking.status)}
                                    </td>
                                    <td className="p-4 font-bold">
                                      €{booking.totalPrice.toFixed(2)}
                                    </td>
                                    <td className="p-4 text-red-500">
                                      - €{booking.commission?.toFixed(2) || '0.00'}
                                    </td>
                                    <td className="p-4 font-bold text-green-600 text-right">
                                      €
                                      {booking.netEarnings?.toFixed(2) ||
                                        booking.totalPrice.toFixed(2)}
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
                    return Object.keys(groupedPayments).map((monthKey) => {
                      const monthPayments = groupedPayments[monthKey];
                      const [year, month] = monthKey.split('-');
                      const monthName = monthNames[parseInt(month) - 1];
                      const isExpanded = expandedHubberPaymentsMonths.has(monthKey);
                      
                      return (
                        <React.Fragment key={monthKey}>
                          <tr 
                            className="bg-gray-50 border-b-2 border-gray-200 hover:bg-gray-100 cursor-pointer"
                            onClick={() => togglePaymentMonth(monthKey)}
                          >
                            <td colSpan={8} className="p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-sm font-bold text-gray-800">
                                    {isExpanded ? '▼' : '▶'} {monthName} {year}
                                  </span>
                                  <span className="ml-2 text-xs text-gray-500">
                                    ({monthPayments.length} pagamenti)
                                  </span>
                                </div>
                                <span className="text-xs text-gray-400">
                                  {isExpanded ? 'Clicca per chiudere' : 'Clicca per aprire'}
                                </span>
                              </div>
                            </td>
                          </tr>
                          
                          {isExpanded && monthPayments.map((booking) => {
                            const bookingDate = booking.start_date || booking.startDate || '';
                            const transactionNumber = getTransactionNumber(booking.id, true); // ✅ USA HELPER GLOBALE
                            
                            return (
                              <tr
                                key={booking.id}
                                onClick={(e) => e.stopPropagation()}
                                className="border-b border-gray-50 hover:bg-gray-50"
                              >
                                <td className="p-4 text-xs whitespace-nowrap">
                                  {booking.dates}
                                </td>
                                <td className="p-4 font-mono text-xs text-gray-600">
                                  {transactionNumber}
                                </td>
                                <td className="p-4 font-medium text-gray-900">
                                  {booking.listingTitle}
                                </td>
                                <td className="p-4">
                                  <button
                                    onClick={() => {
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
                                <td className="p-4">
                                  {renderBookingStatusBadge(booking.status)}
                                </td>
                                <td className="p-4 font-bold">
                                  €{booking.totalPrice.toFixed(2)}
                                </td>
                                <td className="p-4 text-red-500">
                                  - €{booking.commission?.toFixed(2) || '0.00'}
                                </td>
                                <td className="p-4 font-bold text-green-600 text-right">
                                  €
                                  {booking.netEarnings?.toFixed(2) ||
                                    booking.totalPrice.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    });
                  }
                })()}
  
                {paidHubberBookings.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400">
                      Nessuna prenotazione registrata.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
  
        {/* Fatture */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-brand" /> Fatture da
                  Renthubber
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  Le fatture per le commissioni del servizio trattenute dalla
                  piattaforma.
                </p>
              </div>
              
              {/* ✅ Toggle temporale */}
              <div className="inline-flex bg-white rounded-xl border border-gray-200 p-1 text-xs justify-center sm:justify-start">
                <button
                  onClick={() => onInvoicesTimeFilterChange('current')}
                  className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
                    hubberInvoicesTimeFilter === 'current'
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  🔵 Mese corrente
                </button>
                <button
                  onClick={() => onInvoicesTimeFilterChange('historical')}
                  className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
                    hubberInvoicesTimeFilter === 'historical'
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📅 Storico
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-100">
                <tr>
                  <th className="p-4">Data</th>
                  <th className="p-4">Numero Fattura</th>
                  <th className="p-4">Periodo di Riferimento</th>
                  <th className="p-4">Totale Servizio</th>
                  <th className="p-4">Stato</th>
                  <th className="p-4 text-right">Download</th>
                </tr>
              </thead>
              <tbody>
               {/* ✅ Modalità "Mese corrente" - Lista normale */}
               {hubberInvoicesTimeFilter === 'current' && filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="p-4 text-xs">
                      {new Date(inv.created_at).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="p-4 font-mono font-medium text-gray-900">
                      {inv.invoice_number}
                    </td>
                    <td className="p-4">
                      {inv.period_start && inv.period_end 
                        ? `${new Date(inv.period_start).toLocaleDateString('it-IT')} - ${new Date(inv.period_end).toLocaleDateString('it-IT')}`
                        : inv.description?.slice(0, 40) || '—'
                      }
                    </td>
                    <td className="p-4 font-bold">
                      €{Number(inv.total || 0).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span className={`flex items-center text-xs font-bold uppercase ${
                        inv.status === 'paid' ? 'text-green-600' :
                        inv.status === 'issued' ? 'text-blue-600' :
                        inv.status === 'sent' ? 'text-yellow-600' :
                        'text-gray-500'
                      }`}>
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {inv.status === 'paid' ? 'Pagata' :
                         inv.status === 'issued' ? 'Emessa' :
                         inv.status === 'sent' ? 'Inviata' :
                         inv.status === 'draft' ? 'Bozza' : inv.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        className="text-brand hover:bg-brand/10 p-2 rounded-lg transition-colors"
                        title="Scarica PDF"
                        onClick={() => {
    if (inv.pdf_url) {
      window.open(inv.pdf_url, '_blank');
    } else {
      alert(`PDF non disponibile per ${inv.invoice_number}`);
    }
  }}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
  
                {/* ✅ Modalità "Storico" - Raggruppato per anno/mese */}
                {hubberInvoicesTimeFilter === 'historical' && (() => {
                  const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                                     'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
                  
                  if (hasMultipleInvoiceYears) {
                    return Object.keys(groupedInvoicesByYear).sort().reverse().map(year => (
                      <React.Fragment key={year}>
                        <tr className="bg-gray-100 border-b-2 border-gray-300">
                          <td colSpan={6} className="p-4">
                            <span className="text-base font-bold text-gray-900">
                              📆 {year}
                            </span>
                          </td>
                        </tr>
                        
                        {Object.keys(groupedInvoicesByYear[year]).sort().reverse().map(monthKey => {
                          const monthInvoices = groupedInvoicesByYear[year][monthKey];
                          const [, month] = monthKey.split('-');
                          const monthName = monthNames[parseInt(month) - 1];
                          const isExpanded = expandedHubberInvoicesMonths.has(monthKey);
                          
                          return (
                            <React.Fragment key={monthKey}>
                              <tr 
                                className="bg-gray-50 border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
                                onClick={() => toggleInvoiceMonth(monthKey)}
                              >
                                <td colSpan={6} className="p-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="text-sm font-bold text-gray-800">
                                        {isExpanded ? '▼' : '▶'} {monthName}
                                      </span>
                                      <span className="ml-2 text-xs text-gray-500">
                                        ({monthInvoices.length} fatture)
                                      </span>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                      {isExpanded ? 'Clicca per chiudere' : 'Clicca per aprire'}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                              
                              {isExpanded && monthInvoices.map((inv) => (
                                <tr
                                  key={inv.id}
                                  onClick={(e) => e.stopPropagation()}
                                  className="border-b border-gray-50 hover:bg-gray-50"
                                >
                                  <td className="p-4 text-xs">
                                    {new Date(inv.created_at).toLocaleDateString('it-IT', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </td>
                                  <td className="p-4 font-mono font-medium text-gray-900">
                                    {inv.invoice_number}
                                  </td>
                                  <td className="p-4">
                                    {inv.period_start && inv.period_end 
                                      ? `${new Date(inv.period_start).toLocaleDateString('it-IT')} - ${new Date(inv.period_end).toLocaleDateString('it-IT')}`
                                      : inv.description?.slice(0, 40) || '—'
                                    }
                                  </td>
                                  <td className="p-4 font-bold">
                                    €{Number(inv.total || 0).toFixed(2)}
                                  </td>
                                  <td className="p-4">
                                    <span className={`flex items-center text-xs font-bold uppercase ${
                                      inv.status === 'paid' ? 'text-green-600' :
                                      inv.status === 'issued' ? 'text-blue-600' :
                                      inv.status === 'sent' ? 'text-yellow-600' :
                                      'text-gray-500'
                                    }`}>
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      {inv.status === 'paid' ? 'Pagata' :
                                       inv.status === 'issued' ? 'Emessa' :
                                       inv.status === 'sent' ? 'Inviata' :
                                       inv.status === 'draft' ? 'Bozza' : inv.status}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right">
                                    <button
                                      className="text-brand hover:bg-brand/10 p-2 rounded-lg transition-colors"
                                      title="Scarica PDF"
                                      onClick={() => {
                                        if (inv.pdf_url) {
                                          window.open(inv.pdf_url, '_blank');
                                        } else {
                                          alert(`PDF non disponibile per ${inv.invoice_number}`);
                                        }
                                      }}
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          );
                        })}
                      </React.Fragment>
                    ));
                  } else {
                    return Object.keys(groupedInvoices).map((monthKey) => {
                      const monthInvoices = groupedInvoices[monthKey];
                      const [year, month] = monthKey.split('-');
                      const monthName = monthNames[parseInt(month) - 1];
                      const isExpanded = expandedHubberInvoicesMonths.has(monthKey);
                      
                      return (
                        <React.Fragment key={monthKey}>
                          <tr 
                            className="bg-gray-50 border-b-2 border-gray-200 hover:bg-gray-100 cursor-pointer"
                            onClick={() => toggleInvoiceMonth(monthKey)}
                          >
                            <td colSpan={6} className="p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-sm font-bold text-gray-800">
                                    {isExpanded ? '▼' : '▶'} {monthName} {year}
                                  </span>
                                  <span className="ml-2 text-xs text-gray-500">
                                    ({monthInvoices.length} fatture)
                                  </span>
                                </div>
                                <span className="text-xs text-gray-400">
                                  {isExpanded ? 'Clicca per chiudere' : 'Clicca per aprire'}
                                </span>
                              </div>
                            </td>
                          </tr>
                          
                          {isExpanded && monthInvoices.map((inv) => (
                            <tr
                              key={inv.id}
                              onClick={(e) => e.stopPropagation()}
                              className="border-b border-gray-50 hover:bg-gray-50"
                            >
                              <td className="p-4 text-xs">
                                {new Date(inv.created_at).toLocaleDateString('it-IT', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </td>
                              <td className="p-4 font-mono font-medium text-gray-900">
                                {inv.invoice_number}
                              </td>
                              <td className="p-4">
                                {inv.period_start && inv.period_end 
                                  ? `${new Date(inv.period_start).toLocaleDateString('it-IT')} - ${new Date(inv.period_end).toLocaleDateString('it-IT')}`
                                  : inv.description?.slice(0, 40) || '—'
                                }
                              </td>
                              <td className="p-4 font-bold">
                                €{Number(inv.total || 0).toFixed(2)}
                              </td>
                              <td className="p-4">
                                <span className={`flex items-center text-xs font-bold uppercase ${
                                  inv.status === 'paid' ? 'text-green-600' :
                                  inv.status === 'issued' ? 'text-blue-600' :
                                  inv.status === 'sent' ? 'text-yellow-600' :
                                  'text-gray-500'
                                }`}>
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  {inv.status === 'paid' ? 'Pagata' :
                                   inv.status === 'issued' ? 'Emessa' :
                                   inv.status === 'sent' ? 'Inviata' :
                                   inv.status === 'draft' ? 'Bozza' : inv.status}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  className="text-brand hover:bg-brand/10 p-2 rounded-lg transition-colors"
                                  title="Scarica PDF"
                                  onClick={() => {
                                    if (inv.pdf_url) {
                                      window.open(inv.pdf_url, '_blank');
                                    } else {
                                      alert(`PDF non disponibile per ${inv.invoice_number}`);
                                    }
                                  }}
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    });
                  }
                })()}
  
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">
                      {loadingInvoices ? 'Caricamento fatture...' : 'Nessuna fattura disponibile.'}
                    </td>
                  </tr>
                )}
             </tbody>
            </table>
          </div>
        </div>
      </div>
    );
};
