import React from 'react';
import { X, MapPin, Copy, Calendar, User, Clock } from 'lucide-react';
import { calculateHubberFee, calculateRenterFee } from '../utils/feeUtils';

interface BookingDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  currentUserRole: 'renter' | 'hubber';
  renderBookingStatusBadge: (status: string) => React.ReactElement;
  onCancelBooking?: (booking: any) => void;
  onModifyDates?: (booking: any) => void;
}

export const BookingDetailDrawer: React.FC<BookingDetailDrawerProps> = ({
  isOpen,
  onClose,
  booking,
  currentUserRole,
  renderBookingStatusBadge,
  onCancelBooking,
  onModifyDates,
}) => {
  if (!isOpen || !booking) return null;

// Calcola rental_days se mancante
if (!booking.rental_days && booking.start_date && booking.end_date) {
  const start = new Date(booking.start_date);
  const end = new Date(booking.end_date);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  booking.rental_days = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);
}

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const copyBookingCode = () => {
    const code = `#${booking.id.slice(0, 8).toUpperCase()}`;
    navigator.clipboard.writeText(code);
  };

  const openGoogleMaps = () => {
    if (booking.pickup_address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.pickup_address)}`, '_blank');
    }
  };

  // Calcolo rimborso dinamico per policy di cancellazione
  const calculateRefund = () => {
    const now = new Date();
    const startDate = new Date(booking.start_date || booking.startDate);
    const msUntilStart = startDate.getTime() - now.getTime();
    const hoursUntilStart = msUntilStart / (1000 * 60 * 60);
    const daysUntilStart = msUntilStart / (1000 * 60 * 60 * 24);
    
    const totalAmount = booking.totalPrice || booking.amount_total || 0;
    const policy = booking.listing?.cancellation_policy || booking.cancellation_policy || 'flexible';
    
    let percentage = 0;
    let policyThreshold = '';
    let msUntilRefundDeadline = 0; // Tempo fino alla scadenza del rimborso
    
    switch (policy) {
      case 'flexible':
        if (hoursUntilStart >= 24) {
          percentage = 100;
          policyThreshold = '24 ore';
          // Deadline = 24h prima dell'inizio
          msUntilRefundDeadline = msUntilStart - (24 * 60 * 60 * 1000);
        }
        break;
      case 'moderate':
        if (daysUntilStart >= 5) {
          percentage = 50;
          policyThreshold = '5 giorni';
          // Deadline = 5 giorni prima dell'inizio
          msUntilRefundDeadline = msUntilStart - (5 * 24 * 60 * 60 * 1000);
        }
        break;
      case 'strict':
        if (daysUntilStart >= 7) {
          percentage = 50;
          policyThreshold = '7 giorni';
          // Deadline = 7 giorni prima dell'inizio
          msUntilRefundDeadline = msUntilStart - (7 * 24 * 60 * 60 * 1000);
        }
        break;
      case 'non_refundable':
        percentage = 0;
        policyThreshold = 'mai';
        msUntilRefundDeadline = 0;
        break;
      default:
        if (hoursUntilStart >= 24) {
          percentage = 100;
          policyThreshold = '24 ore';
          msUntilRefundDeadline = msUntilStart - (24 * 60 * 60 * 1000);
        }
    }
    
    // Calcola countdown fino alla deadline del rimborso (non fino all'inizio!)
    const days = Math.max(0, Math.floor(msUntilRefundDeadline / (1000 * 60 * 60 * 24)));
    const hours = Math.max(0, Math.floor((msUntilRefundDeadline % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
    const minutes = Math.max(0, Math.floor((msUntilRefundDeadline % (1000 * 60 * 60)) / (1000 * 60)));
    
    return {
      percentage,
      amount: (totalAmount * percentage) / 100,
      countdown: {
        days,
        hours,
        minutes,
        total: msUntilRefundDeadline
      },
      policy,
      policyThreshold,
      canCancel: msUntilStart > 0,
      isRefundable: msUntilRefundDeadline > 0 // Nuovo: true se puoi ancora ricevere rimborso
    };
  };

  const refund = calculateRefund();

  // Helper per mostrare politica di cancellazione
  const getPolicyDisplay = () => {
    const policy = refund.policy;
    
    switch (policy) {
      case 'flexible':
        return { name: 'Flessibile', color: 'green', icon: '🟢' };
      case 'moderate':
        return { name: 'Moderata', color: 'yellow', icon: '🟡' };
      case 'strict':
        return { name: 'Rigida', color: 'orange', icon: '🟠' };
      case 'non_refundable':
        return { name: 'Non rimborsabile', color: 'red', icon: '🔴' };
      default:
        return { name: 'Flessibile', color: 'green', icon: '🟢' };
    }
  };

  const policyDisplay = getPolicyDisplay();

  return (
    <>
      {/* Overlay */}
     <div 
  className="absolute inset-0 bg-black/50 z-40 transition-opacity"  // ← fixed → absolute
  onClick={onClose}
/>
      
      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full md:w-[400px] bg-white shadow-2xl z-50 overflow-y-auto">  
                {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-gray-900">Dettaglio prenotazione</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          
          {/* VISTA RENTER */}
          {currentUserRole === 'renter' && (
            <>
             {/* Header Prenotazione */}

     {/* Codice Prenotazione */}
              <div className="bg-white border border-gray-200 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">CODICE PRENOTAZIONE</p>
                <div className="flex items-center justify-between">
                  <p className="font-mono font-bold text-gray-900">
                    #{booking.id.slice(0, 6).toUpperCase()}
                  </p>
                  <button
                    onClick={copyBookingCode}
                    className="text-brand hover:text-brand-dark text-sm flex items-center gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    Copia
                  </button>
                </div>
              </div>

<div className="bg-white border border-gray-200 rounded-xl p-4">
  <div className="flex items-start gap-3 mb-3">
    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
      {booking.listingImages && booking.listingImages.length > 0 ? (
        <img src={booking.listingImages[0]} alt={booking.listingTitle} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-brand/10 flex items-center justify-center">
          <span className="text-2xl">📦</span>
        </div>
      )}
    </div>
    <div className="flex-1">
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="text-xs text-gray-500">PRENOTAZIONE</p>
          <h4 className="font-semibold text-gray-900">{booking.listingTitle}</h4>
        </div>
        {renderBookingStatusBadge(booking.status)}
      </div>
    </div>
  </div>

  {/* Date */}
  <div className="bg-gray-50 rounded-lg p-3">
    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
      <Calendar className="w-3 h-3" />
      PERIODO
    </p>
    <p className="text-sm font-medium text-gray-900">
      {formatDate(booking.start_date || booking.startDate)} - {formatDate(booking.end_date || booking.endDate)}
    </p>
  </div>
</div>

              {/* Hubber Info */}
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-2">HUBBER</p>
                <div className="flex items-center gap-3">
                  <img
                    src={booking.hubberAvatar || `https://ui-avatars.com/api/?name=${booking.hubberName}&background=0891b2&color=fff`}
                    alt={booking.hubberName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <p className="font-semibold text-gray-900">{booking.hubberName}</p>
                </div>
              </div>

              {/* Indirizzo di ritiro */}
{booking.listing?.pickup_address && (
  <div className="bg-gray-50 rounded-xl p-3">
    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
      <MapPin className="w-3 h-3" />
      INDIRIZZO DI RITIRO
    </p>
    <p className="text-sm text-gray-900 mb-1">{booking.listing.pickup_address}</p>
    <p className="text-sm text-gray-600 mb-3">{booking.listing.pickup_city || ''}</p>
    <button
      onClick={() => {
        if (booking.listing?.pickup_address) {
          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.listing.pickup_address)}`, '_blank');
        }
      }}
      className="w-full bg-gray-800 hover:bg-gray-900 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
    >
      <MapPin className="w-4 h-4" />
      Apri in Google Maps
    </button>
  </div>
)}
{/* Riepilogo Costi */}
<div className="bg-white border border-gray-200 rounded-xl p-3">
  <p className="text-xs text-gray-500 mb-3">RIEPILOGO COSTI</p>
  <div className="space-y-2">
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">
        €{(booking.price_per_day || booking.base_price || 0).toFixed(2)} × {booking.rental_days || 1} giorn{booking.rental_days > 1 ? 'i' : 'o'}
      </span>
      <span className="font-medium">
        €{((booking.price_per_day || booking.base_price || 0) * (booking.rental_days || 1)).toFixed(2)}
      </span>
    </div>
    
    {(() => {
      const baseAmount = (booking.price_per_day || booking.base_price || 0) * (booking.rental_days || 1);
      const { variableFee, fixedFee, totalFee } = calculateRenterFee(baseAmount);
      
      return (
        <>
          {/* Commissione 10% */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Commissione di servizio 10% (IVA inclusa)</span>
            <span className="font-medium">€{variableFee.toFixed(2)}</span>
          </div>
          
          {/* Fee fissa */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Fee fissa piattaforma (IVA inclusa)</span>
            <span className="font-medium">€{fixedFee.toFixed(2)}</span>
          </div>
        </>
      );
    })()}
    
    <div className="h-px bg-gray-300 my-2" />
    <div className="flex justify-between">
      <span className="font-bold text-gray-900">Totale pagato</span>
      <span className="font-bold text-lg">€{booking.totalPrice?.toFixed(2) || booking.amount_total?.toFixed(2) || '0.00'}</span>
    </div>
  </div>
</div>

    {booking.status === 'cancelled' && (
  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
    <p className="text-red-700 font-semibold text-center mb-2">
      ⚠️ Prenotazione Cancellata
    </p>
    <p className="text-sm text-gray-600 text-center">
      Hai ricevuto un rimborso completo sul tuo wallet
    </p>
  </div>
)}

              {/* Metodo di Pagamento */}
<div className="bg-gray-50 rounded-xl p-3">
  <p className="text-xs text-gray-500 mb-2">METODO DI PAGAMENTO</p>
  <div className="space-y-1">
    {/* Se ha usato wallet */}
    {booking.wallet_used_cents > 0 && (
      <div className="flex justify-between text-sm">
        <span className="text-gray-900">Wallet RentHubber</span>
        <span className="font-medium">€{(booking.wallet_used_cents / 100).toFixed(2)}</span>
      </div>
    )}
    
    {/* Se ha usato carta */}
    {booking.card_paid_cents > 0 && (
      <div className="flex justify-between text-sm">
        <span className="text-gray-900">Carta di credito</span>
        <span className="font-medium">€{(booking.card_paid_cents / 100).toFixed(2)}</span>
      </div>
    )}
    
    {/* Totale (se ha usato entrambi) */}
    {booking.wallet_used_cents > 0 && booking.card_paid_cents > 0 && (
      <>
        <div className="h-px bg-gray-300 my-1" />
        <div className="flex justify-between">
          <span className="font-semibold text-gray-900">Totale pagato</span>
          <span className="font-bold">€{booking.totalPrice?.toFixed(2) || booking.amount_total?.toFixed(2) || '0.00'}</span>
        </div>
      </>
    )}
    
    {/* Se ha usato solo uno dei due, mostra solo quello */}
    {(booking.wallet_used_cents > 0) !== (booking.card_paid_cents > 0) && (
      <div className="flex justify-between mt-1">
        <span className="font-semibold text-gray-900">Totale</span>
        <span className="font-bold">€{booking.totalPrice?.toFixed(2) || booking.amount_total?.toFixed(2) || '0.00'}</span>
      </div>
    )}
  </div>
</div>

              {/* Politica di Cancellazione Dinamica */}
              {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Politica di Cancellazione</h3>
                  
                  {/* Box Countdown + Rimborso */}
                  <div className={`
                    ${policyDisplay.color === 'green' ? 'bg-green-50 border-green-200' : ''}
                    ${policyDisplay.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' : ''}
                    ${policyDisplay.color === 'orange' ? 'bg-orange-50 border-orange-200' : ''}
                    ${policyDisplay.color === 'red' ? 'bg-red-50 border-red-200' : ''}
                    border rounded-lg p-4 mb-3
                  `}>
                    <div className="flex items-start gap-3">
                      <Clock className={`
                        ${policyDisplay.color === 'green' ? 'text-green-600' : ''}
                        ${policyDisplay.color === 'yellow' ? 'text-yellow-600' : ''}
                        ${policyDisplay.color === 'orange' ? 'text-orange-600' : ''}
                        ${policyDisplay.color === 'red' ? 'text-red-600' : ''}
                        w-5 h-5 flex-shrink-0 mt-0.5
                      `} />
                      <div className="flex-1">
                        {/* Countdown */}
                        {refund.canCancel ? (
                          <>
                            {refund.isRefundable ? (
                              <>
                                <p className="text-sm font-semibold text-gray-900 mb-1">
                                  {refund.countdown.days > 0 && `${refund.countdown.days}g `}
                                  {refund.countdown.hours}h {refund.countdown.minutes}m
                                  <span className="text-xs text-gray-600 ml-2">per ricevere {refund.percentage}% rimborso</span>
                                </p>
                                
                                {/* Rimborso attuale */}
                                <p className="text-lg font-bold text-gray-900">
                                  Rimborso: {refund.percentage}% 
                                  <span className="text-base font-normal text-gray-700 ml-2">
                                    (€{refund.amount.toFixed(2)})
                                  </span>
                                </p>
                                
                                {/* Avviso soglia critica */}
                                <p className="text-xs text-gray-600 mt-1">
                                  ⚠️ Dopo questa scadenza: nessun rimborso
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-sm font-semibold text-orange-700 mb-1">
                                  ⏰ Scadenza rimborso superata
                                </p>
                                <p className="text-base text-gray-900">
                                  Rimborso: 0% 
                                  <span className="text-sm text-gray-600 ml-2">
                                    (Nessun rimborso disponibile)
                                  </span>
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  Puoi ancora cancellare ma senza rimborso
                                </p>
                              </>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-red-600 font-medium">
                            ❌ Prenotazione già iniziata - Cancellazione non disponibile
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dettagli Policy */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      {policyDisplay.icon} Politica di cancellazione: {policyDisplay.name}
                    </p>
                    
                    <div className="text-xs text-gray-600 space-y-1">
                      {refund.policy === 'flexible' && (
                        <>
                          <p>• Più di 24h dall'inizio: <strong>rimborso 100%</strong></p>
                          <p>• Meno di 24h dall'inizio: <strong>nessun rimborso</strong></p>
                        </>
                      )}
                      
                      {refund.policy === 'moderate' && (
                        <>
                          <p>• Più di 5 giorni dall'inizio: <strong>rimborso 50%</strong></p>
                          <p>• Meno di 5 giorni dall'inizio: <strong>nessun rimborso</strong></p>
                        </>
                      )}
                      
                      {refund.policy === 'strict' && (
                        <>
                          <p>• Più di 7 giorni dall'inizio: <strong>rimborso 50%</strong></p>
                          <p>• Meno di 7 giorni dall'inizio: <strong>nessun rimborso</strong></p>
                        </>
                      )}
                      
                      {refund.policy === 'non_refundable' && (
                        <p className="text-red-600 font-medium">• Prenotazione non rimborsabile</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Bottoni Azioni */}
              {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                <div className="space-y-2">
                  {onModifyDates && (
                    <button
                      onClick={() => onModifyDates(booking)}
                      className="w-full bg-white border-2 border-brand text-brand hover:bg-brand hover:text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-5 h-5" />
                      Modifica date
                    </button>
                  )}
                  {onCancelBooking && refund.canCancel && (
                    <button
                      onClick={() => onCancelBooking(booking)}
                      disabled={!refund.canCancel}
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                        refund.percentage === 0 
                          ? 'bg-white border-2 border-gray-400 text-gray-600 hover:bg-gray-50' 
                          : 'bg-white border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      Cancella prenotazione
                      {refund.percentage > 0 && (
                        <span className="block text-sm mt-1">
                          (Riceverai €{refund.amount.toFixed(2)})
                        </span>
                      )}
                      {refund.percentage === 0 && (
                        <span className="block text-xs mt-1">
                          (Nessun rimborso)
                        </span>
                      )}
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* VISTA HUBBER */}
          {currentUserRole === 'hubber' && (
            <>
              {/* Header Prenotazione */}

               {/* Codice Prenotazione */}
              <div className="bg-white border border-gray-200 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">CODICE PRENOTAZIONE</p>
                <div className="flex items-center justify-between">
                  <p className="font-mono font-bold text-gray-900">
                    #{booking.id.slice(0, 6).toUpperCase()}
                  </p>
                  <button
                    onClick={copyBookingCode}
                    className="text-brand hover:text-brand-dark text-sm flex items-center gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    Copia
                  </button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
  {booking.listingImages && booking.listingImages.length > 0 ? (
    <img src={booking.listingImages[0]} alt={booking.listingTitle} className="w-full h-full object-cover" />
  ) : (
    <div className="w-full h-full bg-brand/10 flex items-center justify-center">
      <span className="text-2xl">📦</span>
    </div>
  )}
</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <p className="text-xs text-gray-500">PRENOTAZIONE</p>
                        <h4 className="font-semibold text-gray-900">{booking.listingTitle}</h4>
                      </div>
                      {renderBookingStatusBadge(booking.status)}
                    </div>
                  </div>
                </div>

                {/* Periodo */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    PERIODO
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(booking.start_date || booking.startDate)} - {formatDate(booking.end_date || booking.endDate)}
                  </p>
                </div>
              </div>

              {/* Renter Info */}
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  RENTER
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={booking.renterAvatar || `https://ui-avatars.com/api/?name=${booking.renterName}&background=0891b2&color=fff`}
                    alt={booking.renterName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <p className="font-semibold text-gray-900">{booking.renterName}</p>
                </div>
              </div>


              {/* Il Renter ha Pagato */}
              <div className="bg-white border border-gray-200 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-3">IL RENTER HA PAGATO</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Noleggio</span>
                    <span className="font-medium">€{((booking.price_per_day || booking.base_price || 0) * (booking.rental_days || 1)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Commissione di servizio</span>
                    <span className="font-medium">€{booking.platform_fee?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="h-px bg-gray-300 my-2" />
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900">Totale (EUR)</span>
                    <span className="font-bold text-lg">€{booking.totalPrice?.toFixed(2) || booking.amount_total?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>

            {/* Compenso dell'Hubber */}
<div className="bg-green-50 border border-green-200 rounded-xl p-3">
  <p className="text-xs text-gray-500 mb-3">COMPENSO DELL'HUBBER</p>
  <div className="space-y-2">
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">Importo noleggio</span>
      <span className="font-medium">€{((booking.price_per_day || booking.base_price || 0) * (booking.rental_days || 1)).toFixed(2)}</span>
    </div>
    <div className="flex justify-between text-sm text-red-600">
      <span>Commissione di servizio (10% IVA inclusa)</span>
      <span>-€{(((booking.price_per_day || booking.base_price || 0) * (booking.rental_days || 1)) * 0.1).toFixed(2)}</span>
    </div>
    <div className="flex justify-between text-sm text-red-600">
      <span>Fee fissa piattaforma</span>
      <span>-€{(() => {
        const baseAmount = (booking.price_per_day || booking.base_price || 0) * (booking.rental_days || 1);
        const { fixedFee } = calculateHubberFee(baseAmount);
        return fixedFee.toFixed(2);
      })()}</span>
    </div>
    <div className="h-px bg-gray-300 my-2" />
    <div className="flex justify-between">
      <span className="font-bold text-gray-900">Totale (EUR)</span>
      <span className="font-bold text-lg text-green-600">
        €{(booking.hubber_net_amount || (() => {
          const baseAmount = (booking.price_per_day || booking.base_price || 0) * (booking.rental_days || 1);
          const { totalFee } = calculateHubberFee(baseAmount);
          return baseAmount - totalFee;
        })()).toFixed(2)}
      </span>
    </div>
  </div>
</div>

    {booking.status === 'cancelled' && (
  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
    <p className="text-red-700 font-semibold text-center mb-2">
      ⚠️ Prenotazione Cancellata
    </p>
    <p className="text-sm text-gray-600 text-center">
      {currentUserRole === 'hubber'
        ? 'Il renter ha ricevuto un rimborso completo'
        : 'Hai ricevuto un rimborso completo sul tuo wallet'
      }
    </p>
  </div>
)}

              {/* Bottone Cancella */}
              {booking.status !== 'cancelled' && booking.status !== 'completed' && onCancelBooking && (
                <button
                  onClick={() => onCancelBooking(booking)}
                  className="w-full bg-white border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  Cancella prenotazione
                </button>
              )}
            
            </>
          )}

        </div>
      </div>
    </>
  );
};
