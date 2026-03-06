import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Calendar } from 'lucide-react';
import { AirbnbCalendar } from '../components/AirbnbCalendar';
import { calculateRenterFee, calculateHubberFee } from '../utils/feeUtils';

interface CancelBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onConfirm: (bookingId: string) => Promise<void>;
  currentUserRole: 'renter' | 'hubber';  // ← AGGIUNGI QUESTO
}

export const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
  isOpen,
  onClose,
  booking,
  onConfirm,
  currentUserRole,
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !booking) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(booking.id);
      onClose();
    } catch (error) {
      console.error('Errore cancellazione:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcolo rimborso
  const calculateRefund = () => {
    const now = new Date();
    const startDate = new Date(booking.start_date || booking.startDate);
    const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilStart >= 24) {
      return { percentage: 100, amount: booking.totalPrice || booking.amount_total || 0 };
    }
    return { percentage: 0, amount: 0 };
  };

  const refund = calculateRefund();

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Cancella prenotazione</h3>
                <p className="text-sm text-gray-500">#{booking.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Sei sicuro di voler cancellare questa prenotazione per <strong>{booking.listingTitle}</strong>?
            </p>

            {/* Refund Info */}
<div className={`p-4 rounded-lg border ${refund.percentage === 100 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
  <p className="text-sm font-semibold mb-1">
    {refund.percentage === 100 ? '✓ Rimborso completo' : '✗ Nessun rimborso'}
  </p>
  <p className="text-sm text-gray-600">
  {refund.percentage === 100 
    ? currentUserRole === 'hubber'
      ? `Il renter riceverà un rimborso completo di €${refund.amount.toFixed(2)} secondo la politica di cancellazione`
      : `Riceverai un rimborso di €${refund.amount.toFixed(2)} secondo la politica di cancellazione`
    : 'La cancellazione è fuori dal periodo di rimborso secondo la politica di cancellazione'
  }
  </p>
</div>

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                <strong>Attenzione:</strong> Questa azione non può essere annullata.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Cancellazione...' : 'Conferma cancellazione'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

interface ModifyDatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onConfirm: (bookingId: string, newStartDate: string, newEndDate: string) => Promise<void>;
}

export const ModifyDatesModal: React.FC<ModifyDatesModalProps> = ({
  isOpen,
  onClose,
  booking,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);
  const [newStartDate, setNewStartDate] = useState<Date | undefined>(undefined);
  const [newEndDate, setNewEndDate] = useState<Date | undefined>(undefined);
  const [priceBreakdown, setPriceBreakdown] = useState<{
    oldTotal: number;
    newTotal: number;
    difference: number;
    days: number;
    basePrice: number;
    renterFee: number;
  } | null>(null);

  // Calcola il prezzo quando cambiano le date
  useEffect(() => {
    if (!newStartDate || !newEndDate || !booking) {
      setPriceBreakdown(null);
      return;
    }

    // Calcola giorni
    const diffTime = Math.abs(newEndDate.getTime() - newStartDate.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Prezzo base per giorno (da booking o da listing)
    const pricePerDay = booking.price_per_day || booking.base_price / (booking.rental_days || 1);
    const basePrice = pricePerDay * days;

    // Calcola fee renter
    const { totalFee: renterTotalFee } = calculateRenterFee(basePrice);
    const newTotal = basePrice + renterTotalFee;

    // Prezzo vecchio
    const oldTotal = booking.amount_total || booking.totalPrice || 0;

    // Differenza
    const difference = newTotal - oldTotal;

    setPriceBreakdown({
      oldTotal,
      newTotal,
      difference,
      days,
      basePrice,
      renterFee: renterTotalFee,
    });
  }, [newStartDate, newEndDate, booking]);

  if (!isOpen || !booking) return null;

  const handleConfirm = async () => {
    if (!newStartDate || !newEndDate) {
      alert('Seleziona entrambe le date dal calendario');
      return;
    }

    setLoading(true);
    try {
      await onConfirm(booking.id, newStartDate.toISOString(), newEndDate.toISOString());
      onClose();
    } catch (error) {
      console.error('Errore modifica date:', error);
      alert('Errore durante la modifica delle date');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (start: Date | undefined, end: Date | undefined) => {
    setNewStartDate(start);
    setNewEndDate(end);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-start justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-brand" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Modifica date</h3>
                <p className="text-sm text-gray-500">{booking.listingTitle}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Current Dates */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Date attuali</p>
              <p className="text-sm font-medium">
                {new Date(booking.start_date || booking.startDate).toLocaleDateString('it-IT')} - {new Date(booking.end_date || booking.endDate).toLocaleDateString('it-IT')}
              </p>
            </div>

            {/* Airbnb Calendar */}
            <div className="flex justify-center">
              <AirbnbCalendar
                selectedStart={newStartDate}
                selectedEnd={newEndDate}
                onChange={handleDateChange}
                location={booking.listingTitle}
                disabledDates={[]} // Qui puoi passare le date già prenotate
              />
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Nota:</strong> La modifica delle date è soggetta all'approvazione dell'hubber.
              </p>
            </div>

            {/* Price Breakdown */}
            {priceBreakdown && (
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-900 mb-3">Riepilogo costi</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Prezzo attuale</span>
                    <span className="font-medium">€{priceBreakdown.oldTotal.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-gray-200 my-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{priceBreakdown.days} giorn{priceBreakdown.days > 1 ? 'i' : 'o'} × €{(priceBreakdown.basePrice / priceBreakdown.days).toFixed(2)}</span>
                    <span className="font-medium">€{priceBreakdown.basePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Commissioni servizio</span>
                    <span className="font-medium">€{priceBreakdown.renterFee.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-gray-200 my-2" />
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900">Nuovo totale</span>
                    <span className="font-bold text-lg">€{priceBreakdown.newTotal.toFixed(2)}</span>
                  </div>
                  {priceBreakdown.difference !== 0 && (
                    <div className={`flex justify-between items-center p-3 rounded-lg mt-3 ${
                      priceBreakdown.difference > 0 
                        ? 'bg-red-50 border border-red-200' 
                        : 'bg-green-50 border border-green-200'
                    }`}>
                      <span className={`font-semibold ${
                        priceBreakdown.difference > 0 ? 'text-red-700' : 'text-green-700'
                      }`}>
                        {priceBreakdown.difference > 0 ? 'Da pagare' : 'Rimborso'}
                      </span>
                      <span className={`font-bold text-lg ${
                        priceBreakdown.difference > 0 ? 'text-red-700' : 'text-green-700'
                      }`}>
                        €{Math.abs(priceBreakdown.difference).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
<div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex gap-3">
  <button
    onClick={onClose}
    className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
  >
    Annulla
  </button>
  <button
    onClick={handleConfirm}
    disabled={loading || !newStartDate || !newEndDate}
    className="flex-1 px-4 py-2 bg-brand text-white rounded-lg font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {loading 
      ? 'Salvataggio...' 
      : priceBreakdown && priceBreakdown.difference > 0
        ? `Paga €${priceBreakdown.difference.toFixed(2)} e conferma`
        : 'Conferma modifiche'
    }
  </button>
          </div>
        </div>
      </div>
    </>
  );
};