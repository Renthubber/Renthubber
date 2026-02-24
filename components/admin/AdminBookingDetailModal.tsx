import React from 'react';
import { X, Calendar, MapPin, User, CreditCard, Clock, CheckCircle, XCircle, AlertTriangle, Copy, ExternalLink } from 'lucide-react';

interface BookingData {
  id: string;
  status: string;
  listingTitle?: string;
  listingImage?: string;
  renterName?: string;
  renterEmail?: string;
  renterAvatar?: string;
  hubberName?: string;
  hubberEmail?: string;
  hubberAvatar?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  totalPrice?: number;
  commission?: number;
  hubberNetAmount?: number;
  platformFee?: number;
  serviceFee?: number;
  cleaningFee?: number;
  deposit?: number;
  walletUsedCents?: number;
  cardPaidCents?: number;
  stripePaymentIntentId?: string;
  stripeTransferId?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  createdAt?: string;
  completedAt?: string;
  pickupAddress?: string;
  pickupCity?: string;
  pickupInstructions?: string;
  transferCompleted?: boolean;
  renterFeePercent?: number;
  hubberFeePercent?: number;
  refundAmount?: number;
  refundedWalletCents?: number;
  refundedCardCents?: number;
}

interface AdminBookingDetailModalProps {
  booking: BookingData;
  onClose: () => void;
  onComplete?: (bookingId: string) => void;
  onCancel?: (bookingId: string) => void;
}

export const AdminBookingDetailModal: React.FC<AdminBookingDetailModalProps> = ({
  booking,
  onClose,
  onComplete,
  onCancel,
}) => {

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('it-IT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'In Attesa', bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock };
      case 'confirmed': return { label: 'Confermata', bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle };
      case 'completed': return { label: 'Completata', bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle };
      case 'cancelled': return { label: 'Cancellata', bg: 'bg-red-100', text: 'text-red-700', icon: XCircle };
      default: return { label: status, bg: 'bg-gray-100', text: 'text-gray-700', icon: AlertTriangle };
    }
  };

  const statusConfig = getStatusConfig(booking.status);
  const StatusIcon = statusConfig.icon;
  const bookingCode = booking.id?.replace(/-/g, '').slice(0, 6).toUpperCase() || '';

  const walletUsed = (booking.walletUsedCents || 0) / 100;
  const cardPaid = (booking.cardPaidCents || 0) / 100;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${statusConfig.bg}`}>
                <StatusIcon className={`w-5 h-5 ${statusConfig.text}`} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Dettaglio Prenotazione</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                    {statusConfig.label}
                  </span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-500 font-mono">#{bookingCode}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Annuncio */}
          <div className="flex items-start gap-4 pb-6 border-b border-gray-100">
            <div className="w-20 h-20 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0">
              {booking.listingImage ? (
                <img src={booking.listingImage} alt={booking.listingTitle} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">N/A</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900">{booking.listingTitle || 'N/A'}</h3>
              <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(booking.startDate)} → {formatDate(booking.endDate)}</span>
              </div>
              {booking.startTime && booking.endTime && (
                <div className="flex items-center gap-1 mt-0.5 text-sm text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{booking.startTime} - {booking.endTime}</span>
                </div>
              )}
            </div>
          </div>

          {/* Renter & Hubber */}
          <div className="grid grid-cols-2 gap-4 pb-6 border-b border-gray-100">
            {/* Renter */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Renter</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  {booking.renterAvatar ? (
                    <img src={booking.renterAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-bold">
                      {(booking.renterName || 'R')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{booking.renterName || 'N/A'}</p>
                  <p className="text-xs text-gray-500 truncate">{booking.renterEmail || ''}</p>
                </div>
              </div>
            </div>

            {/* Hubber */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Hubber</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  {booking.hubberAvatar ? (
                    <img src={booking.hubberAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-bold">
                      {(booking.hubberName || 'H')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{booking.hubberName || 'N/A'}</p>
                  <p className="text-xs text-gray-500 truncate">{booking.hubberEmail || ''}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Codice Prenotazione */}
          <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Codice Prenotazione</p>
              <p className="text-xl font-mono font-bold text-brand tracking-wider">#{bookingCode}</p>
            </div>
            <button
              onClick={() => copyToClipboard(bookingCode)}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              title="Copia codice"
            >
              <Copy className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Indirizzo ritiro */}
          {booking.pickupAddress && (
            <div className="bg-brand/5 border border-brand/20 rounded-xl p-4">
              <p className="text-[10px] text-brand uppercase font-bold mb-2 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Indirizzo di ritiro
              </p>
              <p className="font-bold text-gray-900 text-sm">{booking.pickupAddress}</p>
              {booking.pickupCity && <p className="text-sm text-gray-600">{booking.pickupCity}</p>}
              {booking.pickupInstructions && (
                <p className="text-xs text-gray-500 mt-2 italic">"{booking.pickupInstructions}"</p>
              )}
              <button
                onClick={() => {
                  const address = encodeURIComponent(`${booking.pickupAddress}, ${booking.pickupCity || ''}`);
                  window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
                }}
                className="mt-3 w-full bg-brand text-white font-bold py-2 px-4 rounded-lg text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Apri in Google Maps
              </button>
            </div>
          )}

          {/* Riepilogo Finanziario */}
          <div className="pb-6 border-b border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase font-bold mb-3">Riepilogo Finanziario</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Totale prenotazione</span>
                <span className="font-bold text-gray-900">€{(booking.totalPrice || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Commissione piattaforma</span>
                <span className="font-medium text-green-600">€{(booking.commission || booking.platformFee || 0).toFixed(2)}</span>
              </div>
              {(booking.serviceFee || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Fee servizio</span>
                  <span className="font-medium text-gray-900">€{(booking.serviceFee || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Netto Hubber</span>
                <span className="font-medium text-blue-600">€{(booking.hubberNetAmount || 0).toFixed(2)}</span>
              </div>
              {(booking.cleaningFee || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Costo pulizia</span>
                  <span className="font-medium text-gray-900">€{(booking.cleaningFee || 0).toFixed(2)}</span>
                </div>
              )}
              {(booking.deposit || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Cauzione</span>
                  <span className="font-medium text-amber-600">€{(booking.deposit || 0).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Metodo di pagamento */}
          <div className="pb-6 border-b border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase font-bold mb-3 flex items-center gap-1">
              <CreditCard className="w-3 h-3" />
              Metodo di Pagamento
            </p>
            <div className="space-y-2 text-sm">
              {walletUsed > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Wallet</span>
                  <span className="font-medium text-gray-900">€{walletUsed.toFixed(2)}</span>
                </div>
              )}
              {cardPaid > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Carta</span>
                  <span className="font-medium text-gray-900">€{cardPaid.toFixed(2)}</span>
                </div>
              )}
              {walletUsed === 0 && cardPaid === 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Carta</span>
                  <span className="font-medium text-gray-900">€{(booking.totalPrice || 0).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Transfer Hubber */}
          <div className="pb-6 border-b border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase font-bold mb-3">Trasferimento Hubber</p>
            <div className="flex items-center gap-2">
              {booking.transferCompleted ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                  <CheckCircle className="w-3.5 h-3.5" /> Completato
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                  <Clock className="w-3.5 h-3.5" /> In attesa
                </span>
              )}
              {booking.stripeTransferId && (
                <span className="text-xs text-gray-400 font-mono">{booking.stripeTransferId}</span>
              )}
            </div>
          </div>

          {/* Info cancellazione se cancellata */}
          {booking.status === 'cancelled' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-[10px] text-red-600 uppercase font-bold mb-2 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                Dettagli Cancellazione
              </p>
              <div className="space-y-1 text-sm">
                {booking.cancelledBy && (
                  <p className="text-gray-700">Cancellata da: <span className="font-semibold">{booking.cancelledBy}</span></p>
                )}
                {booking.cancelledAt && (
                  <p className="text-gray-700">Data: <span className="font-semibold">{formatDateTime(booking.cancelledAt)}</span></p>
                )}
                {booking.cancellationReason && (
                  <p className="text-gray-700">Motivo: <span className="font-semibold">{booking.cancellationReason}</span></p>
                )}
                {(booking.refundAmount || 0) > 0 && (
                  <p className="text-gray-700">Rimborso: <span className="font-bold text-red-600">€{(booking.refundAmount || 0).toFixed(2)}</span></p>
                )}
              </div>
            </div>
          )}

          {/* Stripe IDs */}
          {booking.stripePaymentIntentId && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Riferimenti Stripe</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Payment Intent</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono text-gray-700">{booking.stripePaymentIntentId.slice(0, 20)}...</span>
                    <button onClick={() => copyToClipboard(booking.stripePaymentIntentId!)} className="p-1 hover:bg-gray-200 rounded">
                      <Copy className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-bold mb-3">Timeline</p>
            <div className="space-y-3">
              {booking.createdAt && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <span className="text-gray-500 w-40">{formatDateTime(booking.createdAt)}</span>
                  <span className="text-gray-700">Prenotazione creata</span>
                </div>
              )}
              {booking.status === 'confirmed' && booking.createdAt && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span className="text-gray-500 w-40">{formatDateTime(booking.createdAt)}</span>
                  <span className="text-gray-700">Pagamento confermato</span>
                </div>
              )}
              {booking.completedAt && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-600"></div>
                  <span className="text-gray-500 w-40">{formatDateTime(booking.completedAt)}</span>
                  <span className="text-gray-700">Noleggio completato</span>
                </div>
              )}
              {booking.cancelledAt && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  <span className="text-gray-500 w-40">{formatDateTime(booking.cancelledAt)}</span>
                  <span className="text-gray-700">Prenotazione cancellata</span>
                </div>
              )}
            </div>
          </div>

          {/* Azioni Admin */}
          {(booking.status === 'confirmed' || booking.status === 'pending') && (
            <div className="border-t border-gray-100 pt-4 flex gap-3">
              {booking.status === 'confirmed' && onComplete && (
                <button
                  onClick={() => onComplete(booking.id)}
                  className="flex-1 py-2.5 bg-green-500 text-white font-bold text-sm rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Completa
                </button>
              )}
              {onCancel && (
                <button
                  onClick={() => onCancel(booking.id)}
                  className="flex-1 py-2.5 bg-red-100 text-red-600 font-bold text-sm rounded-xl hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Cancella
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};