import React from 'react';
import { X, MapPin, Copy, Calendar, User } from 'lucide-react';
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

  // Calcolo rimborso per policy di cancellazione
  const calculateRefund = () => {
    const now = new Date();
    const startDate = new Date(booking.start_date || booking.startDate);
    const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilStart >= 24) {
      return { percentage: 100, amount: booking.totalPrice || booking.amount_total };
    } else if (hoursUntilStart > 0) {
      return { percentage: 0, amount: 0 };
    }
    return { percentage: 0, amount: 0 };
  };

  const refund = calculateRefund();

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
              {booking.pickup_address && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    INDIRIZZO DI RITIRO
                  </p>
                  <p className="text-sm text-gray-900 mb-1">{booking.pickup_address}</p>
                  <p className="text-sm text-gray-600 mb-3">{booking.pickup_city || ''}</p>
                  <button
                    onClick={openGoogleMaps}
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
    {booking.platform_fee > 0 && (
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Commissione di servizio (10% IVA inclusa)</span>
        <span className="font-medium">€{booking.platform_fee?.toFixed(2) || '0.00'}</span>
      </div>
    )}
    {booking.cleaning_fee > 0 && (
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Fee fissa piattaforma</span>
        <span className="font-medium">€{booking.cleaning_fee?.toFixed(2) || '0.00'}</span>
      </div>
    )}
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
                <div className="flex justify-between">
                  <span className="text-sm text-gray-900">{booking.payment_method || 'Wallet'}</span>
                  <span className="font-semibold">€{booking.totalPrice?.toFixed(2) || booking.amount_total?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              {/* Politica di Cancellazione */}
              <div className="bg-white border border-gray-200 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-2">POLITICA DI CANCELLAZIONE</p>
                <p className="text-sm font-semibold text-green-600 mb-1">Flessibile</p>
                <p className="text-sm text-gray-600 mb-3">Rimborso 100% fino a 24h prima</p>
                
                {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Se cancelli ora:</p>
                    <p className="text-sm text-green-700 font-medium">
                      Rimborso completo (più di 24h prima)
                    </p>
                    <p className="text-lg font-bold text-green-700 mt-1">
                      Rimborso: €{refund.amount.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

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
                  {onCancelBooking && (
                    <button
                      onClick={() => onCancelBooking(booking)}
                      className="w-full bg-white border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                    >
                      Cancella prenotazione
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