import React from 'react';
import { DollarSign, FileText, CheckCircle2, Download } from 'lucide-react';

type TimeFilter = 'current' | 'historical';

interface PagamentiFattureRenterProps {
  renterBookings: any[];
  user: any;
  renterPaymentsTimeFilter: TimeFilter;
  expandedRenterPaymentsMonths: Set<string>;
  onTimeFilterChange: (filter: TimeFilter) => void;
  onToggleMonth: (monthKey: string) => void;
  getTransactionNumber: (bookingId: string, isHubber: boolean) => string;
  userInvoices: any[];
  renterInvoicesTimeFilter: TimeFilter;
  expandedRenterInvoicesMonths: Set<string>;
  onInvoicesTimeFilterChange: (filter: TimeFilter) => void;
  onToggleInvoiceMonth: (monthKey: string) => void;
  loadingInvoices: boolean;
}

export const PagamentiFattureRenter: React.FC<PagamentiFattureRenterProps> = ({
  renterBookings,
  user,
  userInvoices,
  renterPaymentsTimeFilter,
  expandedRenterPaymentsMonths,
  onTimeFilterChange,
  onToggleMonth,
  getTransactionNumber,
  renterInvoicesTimeFilter,
  expandedRenterInvoicesMonths,
  onInvoicesTimeFilterChange,
  onToggleInvoiceMonth,
  loadingInvoices,
}) => {

      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      // Filtra solo prenotazioni pagate (confirmed, accepted, completed, active)
      let paidBookings = renterBookings.filter((b) =>
        ['confirmed', 'accepted', 'completed', 'active'].includes(b.status)
      );
    
      // ✅ Applico filtro temporale
      if (renterPaymentsTimeFilter === 'current') {
        // "In corso" = mese corrente
        paidBookings = paidBookings.filter(b => {
          const paymentDate = new Date(b.start_date || b.startDate || '');
          return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
        });
      }
    
      // Calcola totale speso
      const totalSpent = paidBookings.reduce(
        (sum, b) => sum + ((b as any).renterTotalPaid || b.totalPrice || 0),
        0
      );
    
      // ✅ Raggruppa per anno/mese se "Storico"
      const groupedPayments: Record<string, typeof paidBookings> = {};
      const groupedByYear: Record<string, Record<string, typeof paidBookings>> = {};
      
      if (renterPaymentsTimeFilter === 'historical') {
        paidBookings.forEach(b => {
          const paymentDate = new Date(b.start_date || b.startDate || '');
          const year = paymentDate.getFullYear();
          const monthKey = `${year}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
          
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
        const sortedGrouped: Record<string, typeof paidBookings> = {};
        sortedKeys.forEach(key => {
          sortedGrouped[key] = groupedPayments[key];
        });
        Object.assign(groupedPayments, sortedGrouped);
      }
    
      // Verifica se ci sono più anni
      const hasMultipleYears = Object.keys(groupedByYear).length > 1;
    
      // Toggle espansione mese
const togglePaymentMonth = (monthKey: string) => {
  onToggleMonth(monthKey);
};
    
     // ✅ FILTRO FATTURE PER MESE CORRENTE O STORICO
let filteredInvoices = userInvoices.filter(inv => inv.invoice_type === 'renter');
if (renterInvoicesTimeFilter === 'current') {
  filteredInvoices = filteredInvoices.filter(inv => {
    const invoiceDate = new Date(inv.created_at);
    return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
  });
}

// ✅ RAGGRUPPA FATTURE PER ANNO/MESE SE "STORICO"
const groupedInvoices: Record<string, typeof filteredInvoices> = {};
const groupedInvoicesByYear: Record<string, Record<string, typeof filteredInvoices>> = {};

if (renterInvoicesTimeFilter === 'historical') {
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

          {/* Riepilogo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-brand/10 p-2 rounded-lg">
                  <DollarSign className="w-6 h-6 text-brand" />
                </div>
              </div>
              <p className="text-sm text-gray-500">Totale speso</p>
              <h3 className="text-2xl font-bold text-gray-900">€{totalSpent.toFixed(2)}</h3>
            </div>
    
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-100 p-2 rounded-lg">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500">Ricevute disponibili</p>
              <h3 className="text-2xl font-bold text-gray-900">{paidBookings.length}</h3>
            </div>
    
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-gray-500">Credito Wallet</p>
              <h3 className="text-2xl font-bold text-gray-900">€{user.renterBalance.toFixed(2)}</h3>
            </div>
          </div>
    
          {/* Storico Pagamenti */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-brand" /> Storico Pagamenti
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">
                    Tutti i pagamenti effettuati per i tuoi noleggi su Renthubber.
                  </p>
                </div>
                
                {/* ✅ Toggle temporale */}
                <div className="inline-flex bg-white rounded-xl border border-gray-200 p-1 text-xs justify-center sm:justify-start">
                  <button
                    onClick={() => onTimeFilterChange('current')}
                    className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
                      renterPaymentsTimeFilter === 'current'
                        ? 'bg-brand text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    🔵 Mese corrente
                  </button>
                  <button
                    onClick={() => onTimeFilterChange('historical')}
                    className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
                      renterPaymentsTimeFilter === 'historical'
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
                    <th className="p-4">N° Ordine</th>
                    <th className="p-4">Annuncio</th>
                    <th className="p-4">Periodo</th>
                    <th className="p-4">Metodo</th>
                    <th className="p-4">Stato</th>
                    <th className="p-4 text-right">Importo</th>
                  </tr>
                </thead>
                <tbody>
                  {/* ✅ Modalità "Mese corrente" - Lista normale */}
                  {renterPaymentsTimeFilter === 'current' && paidBookings.map((booking) => {
                    const totalPaid = (booking as any).renterTotalPaid || booking.totalPrice || 0;
                    const walletUsed = ((booking as any).walletUsedCents || 0) / 100;
                    const cardPaid = Math.max(totalPaid - walletUsed, 0);
                    const paymentDate = (booking as any).start_date || new Date().toISOString();
                    const orderNumber = getTransactionNumber(booking.id, false); // ✅ USA HELPER GLOBALE
    
                    return (
                      <tr
                        key={booking.id}
                        className="border-b border-gray-50 hover:bg-gray-50"
                      >
                        <td className="p-4 text-xs whitespace-nowrap">
                          {new Date(paymentDate).toLocaleDateString('it-IT', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="p-4 font-mono text-xs text-gray-600">
                          {orderNumber}
                        </td>
                        <td className="p-4 font-medium text-gray-900">
                          {booking.listingTitle}
                        </td>
                        <td className="p-4 text-xs text-gray-500">
                          {booking.dates}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-0.5">
                            {walletUsed > 0 && (
                              <span className="text-xs text-purple-600 font-medium">
                                Wallet: €{walletUsed.toFixed(2)}
                              </span>
                            )}
                            {cardPaid > 0 && (
                              <span className="text-xs text-gray-600">
                                Carta: €{cardPaid.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="flex items-center text-green-600 text-xs font-bold uppercase">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Pagato
                          </span>
                        </td>
                        <td className="p-4 font-bold text-right text-gray-900">
                          €{totalPaid.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
    
                  {/* ✅ Modalità "Storico" - Raggruppato per anno/mese */}
                  {renterPaymentsTimeFilter === 'historical' && (() => {
                    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                                       'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
                    
                    if (hasMultipleYears) {
                      // Mostra anni separati
                      return Object.keys(groupedByYear).sort().reverse().map(year => (
                        <React.Fragment key={year}>
                          {/* Header Anno */}
                          <tr className="bg-gray-100 border-b-2 border-gray-300">
                            <td colSpan={7} className="p-4">
                              <span className="text-base font-bold text-gray-900">
                                📆 {year}
                              </span>
                            </td>
                          </tr>
                          
                          {/* Mesi dell'anno */}
                          {Object.keys(groupedByYear[year]).sort().reverse().map(monthKey => {
                            const monthPayments = groupedByYear[year][monthKey];
                            const [, month] = monthKey.split('-');
                            const monthName = monthNames[parseInt(month) - 1];
                            const isExpanded = expandedRenterPaymentsMonths.has(monthKey);
                            
                            return (
                              <React.Fragment key={monthKey}>
                                {/* Header mese espandibile */}
                                <tr 
                                  className="bg-gray-50 border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
                                  onClick={() => togglePaymentMonth(monthKey)}
                                >
                                  <td colSpan={7} className="p-3">
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
                                
                                {/* Pagamenti del mese (solo se espanso) */}
                                {isExpanded && monthPayments.map((booking) => {
                                  const totalPaid = (booking as any).renterTotalPaid || booking.totalPrice || 0;
                                  const walletUsed = ((booking as any).walletUsedCents || 0) / 100;
                                  const cardPaid = Math.max(totalPaid - walletUsed, 0);
                                  const paymentDate = (booking as any).start_date || new Date().toISOString();
                                  const orderNumber = getTransactionNumber(booking.id, false); // ✅ USA HELPER GLOBALE
    
                                  return (
                                    <tr
                                      key={booking.id}
                                      onClick={(e) => e.stopPropagation()}
                                      className="border-b border-gray-50 hover:bg-gray-50"
                                    >
                                      <td className="p-4 text-xs whitespace-nowrap">
                                        {new Date(paymentDate).toLocaleDateString('it-IT', {
                                          day: '2-digit',
                                          month: 'short',
                                          year: 'numeric',
                                        })}
                                      </td>
                                      <td className="p-4 font-mono text-xs text-gray-600">
                                        {orderNumber}
                                      </td>
                                      <td className="p-4 font-medium text-gray-900">
                                        {booking.listingTitle}
                                      </td>
                                      <td className="p-4 text-xs text-gray-500">
                                        {booking.dates}
                                      </td>
                                      <td className="p-4">
                                        <div className="flex flex-col gap-0.5">
                                          {walletUsed > 0 && (
                                            <span className="text-xs text-purple-600 font-medium">
                                              Wallet: €{walletUsed.toFixed(2)}
                                            </span>
                                          )}
                                          {cardPaid > 0 && (
                                            <span className="text-xs text-gray-600">
                                              Carta: €{cardPaid.toFixed(2)}
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="p-4">
                                        <span className="flex items-center text-green-600 text-xs font-bold uppercase">
                                          <CheckCircle2 className="w-3 h-3 mr-1" /> Pagato
                                        </span>
                                      </td>
                                      <td className="p-4 font-bold text-right text-gray-900">
                                        €{totalPaid.toFixed(2)}
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
                      return Object.keys(groupedPayments).map((monthKey) => {
                        const monthPayments = groupedPayments[monthKey];
                        const [year, month] = monthKey.split('-');
                        const monthName = monthNames[parseInt(month) - 1];
                        const isExpanded = expandedRenterPaymentsMonths.has(monthKey);
                        
                        return (
                          <React.Fragment key={monthKey}>
                            {/* Header mese espandibile */}
                            <tr 
                              className="bg-gray-50 border-b-2 border-gray-200 hover:bg-gray-100 cursor-pointer"
                              onClick={() => togglePaymentMonth(monthKey)}
                            >
                              <td colSpan={7} className="p-3">
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
                            
                            {/* Pagamenti del mese (solo se espanso) */}
                            {isExpanded && monthPayments.map((booking) => {
                              const totalPaid = (booking as any).renterTotalPaid || booking.totalPrice || 0;
                              const walletUsed = ((booking as any).walletUsedCents || 0) / 100;
                              const cardPaid = Math.max(totalPaid - walletUsed, 0);
                              const paymentDate = (booking as any).start_date || new Date().toISOString();
                              const orderNumber = getTransactionNumber(booking.id, false); // ✅ USA HELPER GLOBALE
    
                              return (
                                <tr
                                  key={booking.id}
                                  onClick={(e) => e.stopPropagation()}
                                  className="border-b border-gray-50 hover:bg-gray-50"
                                >
                                  <td className="p-4 text-xs whitespace-nowrap">
                                    {new Date(paymentDate).toLocaleDateString('it-IT', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </td>
                                  <td className="p-4 font-mono text-xs text-gray-600">
                                    {orderNumber}
                                  </td>
                                  <td className="p-4 font-medium text-gray-900">
                                    {booking.listingTitle}
                                  </td>
                                  <td className="p-4 text-xs text-gray-500">
                                    {booking.dates}
                                  </td>
                                  <td className="p-4">
                                    <div className="flex flex-col gap-0.5">
                                      {walletUsed > 0 && (
                                        <span className="text-xs text-purple-600 font-medium">
                                          Wallet: €{walletUsed.toFixed(2)}
                                        </span>
                                      )}
                                      {cardPaid > 0 && (
                                        <span className="text-xs text-gray-600">
                                          Carta: €{cardPaid.toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <span className="flex items-center text-green-600 text-xs font-bold uppercase">
                                      <CheckCircle2 className="w-3 h-3 mr-1" /> Pagato
                                    </span>
                                  </td>
                                  <td className="p-4 font-bold text-right text-gray-900">
                                    €{totalPaid.toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      });
                    }
                  })()}
    
                  {paidBookings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-400">
                        Nessun pagamento effettuato.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
    
          {/* Ricevute scaricabili */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-brand" /> Ricevute di Pagamento
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">
                    Scarica le ricevute per i tuoi noleggi completati.
                  </p>
                </div>
                
                {/* ✅ Stesso toggle temporale */}
                <div className="inline-flex bg-white rounded-xl border border-gray-200 p-1 text-xs justify-center sm:justify-start">
                  <button
                    onClick={() => onTimeFilterChange('current')}
                    className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
                      renterPaymentsTimeFilter === 'current'
                        ? 'bg-brand text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    🔵 Mese corrente
                  </button>
                  <button
                    onClick={() => onTimeFilterChange('historical')}
                    className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
                      renterPaymentsTimeFilter === 'historical'
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
                    <th className="p-4">N° Ricevuta</th>
                    <th className="p-4">Descrizione</th>
                    <th className="p-4">Importo</th>
                    <th className="p-4">Stato</th>
                    <th className="p-4 text-right">Download</th>
                  </tr>
                </thead>
                <tbody>
                  {/* ✅ Modalità "Mese corrente" - Lista normale */}
                  {renterPaymentsTimeFilter === 'current' && paidBookings.map((booking) => {
                    const totalPaid = (booking as any).renterTotalPaid || booking.totalPrice || 0;
                    const paymentDate = (booking as any).start_date || new Date().toISOString();
                    const receiptNumber = getTransactionNumber(booking.id, false); // ✅ USA HELPER GLOBALE
    
                    return (
                      <tr
                        key={booking.id}
                        className="border-b border-gray-50 hover:bg-gray-50"
                      >
                        <td className="p-4 text-xs whitespace-nowrap">
                          {new Date(paymentDate).toLocaleDateString('it-IT', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="p-4 font-mono font-medium text-gray-900">
                          {receiptNumber}
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-gray-900">{booking.listingTitle}</p>
                            <p className="text-xs text-gray-500">{booking.dates}</p>
                          </div>
                        </td>
                        <td className="p-4 font-bold">
                          €{totalPaid.toFixed(2)}
                        </td>
                        <td className="p-4">
                          <span className="flex items-center text-green-600 text-xs font-bold uppercase">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Emessa
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
      onClick={() => {
        const invoice = userInvoices.find(inv => inv.booking_id === booking.id);
        if (invoice?.pdf_url) {
          window.open(invoice.pdf_url, '_blank');
        } else {
          alert('Ricevuta non disponibile. Contatta il supporto.');
        }
      }}
      className="text-brand hover:bg-brand/10 p-2 rounded-lg transition-colors"
      title="Scarica PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
    
                  {/* ✅ Modalità "Storico" - Raggruppato per anno/mese */}
                  {renterPaymentsTimeFilter === 'historical' && (() => {
                    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                                       'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
                    
                    if (hasMultipleYears) {
                      return Object.keys(groupedByYear).sort().reverse().map(year => (
                        <React.Fragment key={year}>
                          <tr className="bg-gray-100 border-b-2 border-gray-300">
                            <td colSpan={6} className="p-4">
                              <span className="text-base font-bold text-gray-900">
                                📆 {year}
                              </span>
                            </td>
                          </tr>
                          
                          {Object.keys(groupedByYear[year]).sort().reverse().map(monthKey => {
                            const monthPayments = groupedByYear[year][monthKey];
                            const [, month] = monthKey.split('-');
                            const monthName = monthNames[parseInt(month) - 1];
                            const isExpanded = expandedRenterPaymentsMonths.has(monthKey);
                            
                            return (
                              <React.Fragment key={monthKey}>
                                <tr 
                                  className="bg-gray-50 border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
                                  onClick={() => togglePaymentMonth(monthKey)}
                                >
                                  <td colSpan={6} className="p-3">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <span className="text-sm font-bold text-gray-800">
                                          {isExpanded ? '▼' : '▶'} {monthName}
                                        </span>
                                        <span className="ml-2 text-xs text-gray-500">
                                          ({monthPayments.length} ricevute)
                                        </span>
                                      </div>
                                      <span className="text-xs text-gray-400">
                                        {isExpanded ? 'Clicca per chiudere' : 'Clicca per aprire'}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                                
                                {isExpanded && monthPayments.map((booking) => {
                                  const totalPaid = (booking as any).renterTotalPaid || booking.totalPrice || 0;
                                  const paymentDate = (booking as any).start_date || new Date().toISOString();
                                  const receiptNumber = getTransactionNumber(booking.id, false); // ✅ USA HELPER GLOBALE
    
                                  return (
                                    <tr
                                      key={booking.id}
                                      onClick={(e) => e.stopPropagation()}
                                      className="border-b border-gray-50 hover:bg-gray-50"
                                    >
                                      <td className="p-4 text-xs whitespace-nowrap">
                                        {new Date(paymentDate).toLocaleDateString('it-IT', {
                                          day: '2-digit',
                                          month: 'short',
                                          year: 'numeric',
                                        })}
                                      </td>
                                      <td className="p-4 font-mono font-medium text-gray-900">
                                        {receiptNumber}
                                      </td>
                                      <td className="p-4">
                                        <div>
                                          <p className="font-medium text-gray-900">{booking.listingTitle}</p>
                                          <p className="text-xs text-gray-500">{booking.dates}</p>
                                        </div>
                                      </td>
                                      <td className="p-4 font-bold">
                                        €{totalPaid.toFixed(2)}
                                      </td>
                                      <td className="p-4">
                                        <span className="flex items-center text-green-600 text-xs font-bold uppercase">
                                          <CheckCircle2 className="w-3 h-3 mr-1" /> Emessa
                                        </span>
                                      </td>
                                      <td className="p-4 text-right">
                                        <button
      onClick={() => {
        const invoice = userInvoices.find(inv => inv.booking_id === booking.id);
        if (invoice?.pdf_url) {
          window.open(invoice.pdf_url, '_blank');
        } else {
          alert('Ricevuta non disponibile. Contatta il supporto.');
        }
      }}
      className="text-brand hover:bg-brand/10 p-2 rounded-lg transition-colors"
      title="Scarica PDF"
    >
      <Download className="w-4 h-4" />
    </button>
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
                        const isExpanded = expandedRenterPaymentsMonths.has(monthKey);
                        
                        return (
                          <React.Fragment key={monthKey}>
                            <tr 
                              className="bg-gray-50 border-b-2 border-gray-200 hover:bg-gray-100 cursor-pointer"
                              onClick={() => togglePaymentMonth(monthKey)}
                            >
                              <td colSpan={6} className="p-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="text-sm font-bold text-gray-800">
                                      {isExpanded ? '▼' : '▶'} {monthName} {year}
                                    </span>
                                    <span className="ml-2 text-xs text-gray-500">
                                      ({monthPayments.length} ricevute)
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-400">
                                    {isExpanded ? 'Clicca per chiudere' : 'Clicca per aprire'}
                                  </span>
                                </div>
                              </td>
                            </tr>
                            
                            {isExpanded && monthPayments.map((booking) => {
                              const totalPaid = (booking as any).renterTotalPaid || booking.totalPrice || 0;
                              const paymentDate = (booking as any).start_date || new Date().toISOString();
                              const receiptNumber = getTransactionNumber(booking.id, false); // ✅ USA HELPER GLOBALE
    
                              return (
                                <tr
                                  key={booking.id}
                                  onClick={(e) => e.stopPropagation()}
                                  className="border-b border-gray-50 hover:bg-gray-50"
                                >
                                  <td className="p-4 text-xs whitespace-nowrap">
                                    {new Date(paymentDate).toLocaleDateString('it-IT', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </td>
                                  <td className="p-4 font-mono font-medium text-gray-900">
                                    {receiptNumber}
                                  </td>
                                  <td className="p-4">
                                    <div>
                                      <p className="font-medium text-gray-900">{booking.listingTitle}</p>
                                      <p className="text-xs text-gray-500">{booking.dates}</p>
                                    </div>
                                  </td>
                                  <td className="p-4 font-bold">
                                    €{totalPaid.toFixed(2)}
                                  </td>
                                  <td className="p-4">
                                    <span className="flex items-center text-green-600 text-xs font-bold uppercase">
                                      <CheckCircle2 className="w-3 h-3 mr-1" /> Emessa
                                    </span>
                                  </td>
                                  <td className="p-4 text-right">
                                    <button
      onClick={() => {
        const invoice = userInvoices.find(inv => inv.booking_id === booking.id);
        if (invoice?.pdf_url) {
          window.open(invoice.pdf_url, '_blank');
        } else {
          alert('Ricevuta non disponibile. Contatta il supporto.');
        }
      }}
      className="text-brand hover:bg-brand/10 p-2 rounded-lg transition-colors"
      title="Scarica PDF"
    >
      <Download className="w-4 h-4" />
    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      });
                    }
                  })()}
    
                  {paidBookings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400">
                        Nessuna ricevuta disponibile.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* ✅ SEZIONE FATTURE COMMISSIONI RENTHUBBER */}
<div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
  <div className="p-6 border-b border-gray-100">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
      <div>
        <h3 className="font-bold text-gray-900 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-brand" /> Fatture Commissioni RentHubber
        </h3>
        <p className="text-gray-500 text-sm mt-1">
          Fatture relative alle commissioni di servizio applicate da RentHubber.
        </p>
      </div>
      
      {/* Toggle temporale */}
      <div className="inline-flex bg-white rounded-xl border border-gray-200 p-1 text-xs justify-center sm:justify-start">
        <button
          onClick={() => onInvoicesTimeFilterChange('current')}
          className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
            renterInvoicesTimeFilter === 'current'
              ? 'bg-brand text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🔵 Mese corrente
        </button>
        <button
          onClick={() => onInvoicesTimeFilterChange('historical')}
          className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
            renterInvoicesTimeFilter === 'historical'
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
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="p-4 text-left text-xs font-bold text-gray-600 uppercase">Data</th>
          <th className="p-4 text-left text-xs font-bold text-gray-600 uppercase">N° Fattura</th>
          <th className="p-4 text-left text-xs font-bold text-gray-600 uppercase">Periodo</th>
          <th className="p-4 text-left text-xs font-bold text-gray-600 uppercase">Importo</th>
          <th className="p-4 text-left text-xs font-bold text-gray-600 uppercase">Stato</th>
          <th className="p-4 text-right text-xs font-bold text-gray-600 uppercase">Download</th>
        </tr>
      </thead>
      <tbody>
        {(() => {
          const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
          
          if (renterInvoicesTimeFilter === 'current') {
            return filteredInvoices.map((inv) => (
              <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
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
            ));
          } else if (hasMultipleInvoiceYears) {
            // Raggruppa per anno e mese
            return Object.keys(groupedInvoicesByYear).sort().reverse().map((year) => (
              <React.Fragment key={year}>
                {Object.keys(groupedInvoicesByYear[year]).map((monthKey) => {
                  const monthInvoices = groupedInvoicesByYear[year][monthKey];
                  const [, month] = monthKey.split('-');
                  const monthName = monthNames[parseInt(month) - 1];
                  const isExpanded = expandedRenterInvoicesMonths.has(monthKey);
                  
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
                })}
              </React.Fragment>
            ));
          } else {
            return Object.keys(groupedInvoices).map((monthKey) => {
              const monthInvoices = groupedInvoices[monthKey];
              const [year, month] = monthKey.split('-');
              const monthName = monthNames[parseInt(month) - 1];
              const isExpanded = expandedRenterInvoicesMonths.has(monthKey);
              
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

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Informazioni sui pagamenti
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Le ricevute sono generate automaticamente per ogni pagamento completato</li>
              <li>• Il credito wallet può essere utilizzato per futuri noleggi</li>
              <li>• I rimborsi su carta richiedono 5-10 giorni lavorativi</li>
              <li>• Per fatture fiscali, contatta il supporto con il numero ricevuta</li>
            </ul>
          </div>
        </div>
      );
    };