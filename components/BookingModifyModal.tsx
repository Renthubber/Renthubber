import React, { useState, useEffect, useRef } from 'react';
import { X, Edit3, Wallet, CreditCard } from 'lucide-react';
import { AirbnbCalendar } from './AirbnbCalendar';
import { ModifyStripeForm } from './ModifyStripeForm';
import { calculateRenterFixedFee } from '../utils/feeUtils';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface BookingModifyModalProps {
  isOpen: boolean;
  booking: any;
  currentUser: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookingModifyModal: React.FC<BookingModifyModalProps> = ({
  isOpen,
  booking,
  currentUser,
  onClose,
  onSuccess,
}) => {
  const [isModifying, setIsModifying] = useState(false);
  const [modifyError, setModifyError] = useState<string | null>(null);
  const [modifySuccess, setModifySuccess] = useState<string | null>(null);
  const [newStartDate, setNewStartDate] = useState<Date | undefined>(undefined);
  const [newEndDate, setNewEndDate] = useState<Date | undefined>(undefined);
  const [modifyCalendarOpen, setModifyCalendarOpen] = useState(false);
  const [priceDifference, setPriceDifference] = useState<number>(0);
  const [showPaymentForModify, setShowPaymentForModify] = useState(false);
  const modifyCalendarRef = useRef<HTMLDivElement>(null);
  const [modifyDisabledDates, setModifyDisabledDates] = useState<Date[]>([]);
  const [modifyPaymentMethod, setModifyPaymentMethod] = useState<'wallet' | 'card' | null>(null);
  const [renterWalletBalance, setRenterWalletBalance] = useState(0);
  const [modifyStripeClientSecret, setModifyStripeClientSecret] = useState<string | null>(null);

  // Reset quando si apre/chiude
  useEffect(() => {
    if (!isOpen) {
      setNewStartDate(undefined);
      setNewEndDate(undefined);
      setModifyCalendarOpen(false);
      setPriceDifference(0);
      setShowPaymentForModify(false);
      setModifyPaymentMethod(null);
      setModifyError(null);
      setModifySuccess(null);
      setModifyStripeClientSecret(null);
      setRenterWalletBalance(0);
    } else if (booking && currentUser) {
      // Carica wallet balance
      loadWalletBalance();
    }
  }, [isOpen, booking, currentUser]);

  const loadWalletBalance = async () => {
    if (!currentUser?.id) return;
    
    try {
      const { supabase } = await import('../services/supabaseClient');
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance_cents')
        .eq('user_id', currentUser.id)
        .single();
      
      setRenterWalletBalance((wallet?.balance_cents || 0) / 100);
    } catch (err) {
      console.error('Errore caricamento wallet:', err);
    }
  };

   // Carica date occupate e pre-compila date attuali
useEffect(() => {
  if (!isOpen || !booking) return;

  // Pre-compila con date attuali
  const currentStart = new Date(booking.startDate || booking.start_date);
  const currentEnd = new Date(booking.endDate || booking.end_date);
  setNewStartDate(currentStart);
  setNewEndDate(currentEnd);

  // Carica date occupate
  const loadDisabledDates = async () => {
    try {
      const listingId = booking.listingId || booking.listing_id;
      if (!listingId) return;

      const { supabase } = await import('../services/supabaseClient');
      
      // Carica prenotazioni confermate per questo listing (esclusa quella corrente)
      const { data: bookings } = await supabase
        .from('bookings')
        .select('start_date, end_date')
        .eq('listing_id', listingId)
        .eq('status', 'confirmed')
        .neq('id', booking.id);

      if (!bookings) return;

      // Converti in array di Date
      const disabled: Date[] = [];
      bookings.forEach((b: any) => {
        const start = new Date(b.start_date);
        const end = new Date(b.end_date);
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          disabled.push(new Date(d));
        }
      });

      setModifyDisabledDates(disabled);
    } catch (err) {
      console.error('Errore caricamento date occupate:', err);
    }
  };

  loadDisabledDates();
}, [isOpen, booking]);


  // Calcola differenza prezzo
  useEffect(() => {
    if (!booking || !newStartDate || !newEndDate) {
      setPriceDifference(0);
      return;
    }

    const originalStart = new Date(booking.startDate || booking.start_date);
    const originalEnd = new Date(booking.endDate || booking.end_date);
    const originalDays = Math.ceil((originalEnd.getTime() - originalStart.getTime()) / (1000 * 60 * 60 * 24));
    
    const newDays = Math.ceil((newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const pricePerDay = booking.pricePerDay || booking.price_per_day || 0;
    const originalBasePrice = originalDays * pricePerDay;
    const newBasePrice = newDays * pricePerDay;
    const basePriceDiff = newBasePrice - originalBasePrice;
    
    const originalCommission = (originalBasePrice * 10) / 100;
    const newCommission = (newBasePrice * 10) / 100;
    const commissionDiff = newCommission - originalCommission;

    const originalFixedFee = calculateRenterFixedFee(originalBasePrice);
    const newFixedFee = calculateRenterFixedFee(newBasePrice);
    const fixedFeeDiff = newFixedFee - originalFixedFee;

    const totalDiff = basePriceDiff + commissionDiff + fixedFeeDiff;
    setPriceDifference(totalDiff);
  }, [booking, newStartDate, newEndDate]);

  const handleModifyCalendarChange = (start: Date | undefined, end: Date | undefined) => {
    setNewStartDate(start);
    setNewEndDate(end);
    
    if (start && end) {
      setModifyCalendarOpen(false);
    }
  };

  const handleModifyBooking = async () => {
    if (!booking || !newStartDate) {
      setModifyError('Seleziona le nuove date');
      return;
    }

    if (priceDifference > 0 && !showPaymentForModify) {
      setShowPaymentForModify(true);
      setModifyError(null);
      return;
    }

    if (priceDifference > 0) {
      if (!modifyPaymentMethod) {
        setModifyError('Seleziona un metodo di pagamento');
        return;
      }

      if (modifyPaymentMethod === 'wallet' && renterWalletBalance < priceDifference) {
        setModifyError('Saldo wallet insufficiente');
        return;
      }
    }

    await executeModifyBooking();
  };

  const executeModifyBooking = async () => {
    setIsModifying(true);
    setModifyError(null);

   try {
  const endDateToUse = newEndDate || newStartDate;
  if (!endDateToUse) {
    throw new Error('Date non valide');
  }

  console.log('📤 DATE PRIMA DI INVIARE:', {
    newStartDate: newStartDate,
    endDateToUse: endDateToUse,
    startFormatted: `${newStartDate.getFullYear()}-${String(newStartDate.getMonth() + 1).padStart(2, '0')}-${String(newStartDate.getDate()).padStart(2, '0')}`,
    endFormatted: `${endDateToUse.getFullYear()}-${String(endDateToUse.getMonth() + 1).padStart(2, '0')}-${String(endDateToUse.getDate()).padStart(2, '0')}`,
  });

  const response = await fetch('/.netlify/functions/modify-booking-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bookingId: booking.id,
      renterId: currentUser.id,
      newStartDate: `${newStartDate.getFullYear()}-${String(newStartDate.getMonth() + 1).padStart(2, '0')}-${String(newStartDate.getDate()).padStart(2, '0')}`,
      newEndDate: `${endDateToUse.getFullYear()}-${String(endDateToUse.getMonth() + 1).padStart(2, '0')}-${String(endDateToUse.getDate()).padStart(2, '0')}`,
      ...(priceDifference > 0 ? { paymentMethod: modifyPaymentMethod } : {}),
    }),
  });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore durante la modifica');
      }

      const result = await response.json();

      if (result.requiresPayment && result.clientSecret) {
        setModifyStripeClientSecret(result.clientSecret);
        setIsModifying(false);
        return;
      }

      if (result.error) {
        setModifyError(result.error);
        setIsModifying(false);
        return;
      }

      let successMsg = "Prenotazione modificata con successo!";
      if (result.refundedWallet && result.refundedWallet > 0) {
        successMsg += ` €${result.refundedWallet.toFixed(2)} rimborsati sul wallet.`;
      }
      if (result.refundedCard && result.refundedCard > 0) {
        successMsg += ` €${result.refundedCard.toFixed(2)} verranno rimborsati sulla carta entro 5-10 giorni.`;
      }
      if (result.chargedExtra && result.chargedExtra > 0) {
        successMsg += ` €${result.chargedExtra.toFixed(2)} addebitati.`;
      }

      setModifySuccess(successMsg);
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (error: any) {
      console.error('Errore modifica:', error);
      setModifyError(error.message || 'Errore durante la modifica');
    } finally {
      setIsModifying(false);
    }
  };

  const formatDateDisplay = (date: Date | undefined) => {
    if (!date) return "Seleziona data";
    return date.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (!isOpen || !booking) return null;

  // Modale Stripe
  if (modifyStripeClientSecret) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div 
          className="bg-white rounded-2xl shadow-xl w-full max-w-md relative mx-4 mb-20 md:mb-0 flex flex-col"
          style={{ maxHeight: 'calc(100vh - 180px)' }}
        >
          <div className="p-6 border-b border-gray-200 relative flex-shrink-0">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <h2 className="text-xl font-bold text-gray-900 text-center">
              Completa il pagamento
            </h2>

            <p className="text-sm text-gray-600 mt-2 text-center">
              Supplemento da pagare: <span className="font-bold text-lg">€{priceDifference.toFixed(2)}</span>
            </p>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            <Elements 
              stripe={stripePromise}
              options={{ clientSecret: modifyStripeClientSecret }}
            >
              <ModifyStripeForm
                clientSecret={modifyStripeClientSecret}
                bookingId={booking.id}
                amount={priceDifference}
                onSuccess={() => {
                  setModifyStripeClientSecret(null);
                  setModifySuccess('Prenotazione modificata e pagamento completato!');
                  setTimeout(() => {
                    onSuccess();
                    onClose();
                  }, 2000);
                }}
                onError={(error) => {
                  setModifyError(error);
                  setModifyStripeClientSecret(null);
                }}
              />
            </Elements>
          </div>
        </div>
      </div>
    );
  }

  // Modale principale
  return (
    <div className="fixed inset-0 z-50 flex items-center md:items-start justify-center bg-black/60 backdrop-blur-sm pt-16 md:pt-20 pb-8 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl relative mx-4 mb-20 md:mb-0 flex flex-col"
        style={{ maxHeight: 'calc(100vh - 100px)' }}
      >
        <div className="p-6 border-b border-gray-200 relative flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isModifying}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 z-10"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Edit3 className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Modifica prenotazione
            </h2>
            <p className="text-sm text-gray-500">
              Modifica le date della tua prenotazione
            </p>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Dettagli prenotazione */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                {booking.listingImage && (
                  <img
                    src={booking.listingImage}
                    alt={booking.listingTitle}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-sm truncate">
                  {booking.listingTitle || booking.listing_title || 'Prenotazione'}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Date attuali: {booking.dates || `${new Date(booking.startDate || booking.start_date).toLocaleDateString('it-IT')} - ${new Date(booking.endDate || booking.end_date).toLocaleDateString('it-IT')}`}
                </p>
                <p className="text-sm font-bold text-brand mt-1">
                  Totale attuale: €{(booking.renterTotalPaid || booking.totalPrice || booking.amount_total || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Selezione date */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Seleziona le nuove date
            </label>
            
            <div 
              className="border border-gray-300 rounded-xl bg-white cursor-pointer mb-3"
              onClick={() => setModifyCalendarOpen(!modifyCalendarOpen)}
            >
              <div className="grid grid-cols-2">
                <div className="p-3 border-r border-gray-300 hover:bg-gray-50 transition-colors rounded-l-xl">
                  <p className="text-[10px] font-bold uppercase text-gray-600">Check-in</p>
                  <p className={`text-sm ${newStartDate ? "text-gray-900" : "text-gray-400"}`}>
                    {formatDateDisplay(newStartDate)}
                  </p>
                </div>
                <div className="p-3 hover:bg-gray-50 transition-colors rounded-r-xl">
                  <p className="text-[10px] font-bold uppercase text-gray-600">Check-out</p>
                  <p className={`text-sm ${newEndDate ? "text-gray-900" : "text-gray-400"}`}>
                    {formatDateDisplay(newEndDate)}
                  </p>
                </div>
              </div>
            </div>

            {modifyCalendarOpen && (
              <div 
                ref={modifyCalendarRef}
                className="border border-gray-200 rounded-xl bg-white overflow-hidden flex justify-center"
                style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}
              >
                <AirbnbCalendar
                  selectedStart={newStartDate}
                  selectedEnd={newEndDate}
                  onChange={handleModifyCalendarChange}
                  disabledDates={modifyDisabledDates}
                  location=""
                  onClose={() => setModifyCalendarOpen(false)}
                />
              </div>
            )}
          </div>

          {/* Selettore pagamento */}
          {showPaymentForModify && priceDifference > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Scegli il metodo di pagamento
              </h3>
              
              <div className="space-y-3">
                {/* Wallet */}
                <div
                  onClick={() => setModifyPaymentMethod('wallet')}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    modifyPaymentMethod === 'wallet'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        modifyPaymentMethod === 'wallet' ? 'border-blue-500' : 'border-gray-300'
                      }`}>
                        {modifyPaymentMethod === 'wallet' && (
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">Wallet Renthubber</p>
                        <p className="text-xs text-gray-500">
                          Saldo disponibile: €{renterWalletBalance.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <Wallet className="w-5 h-5 text-gray-400" />
                  </div>
                  {modifyPaymentMethod === 'wallet' && renterWalletBalance < priceDifference && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-xs text-red-600 font-medium">
                        ⚠️ Saldo insufficiente. Ricarica il wallet o scegli la carta.
                      </p>
                    </div>
                  )}
                </div>

                {/* Carta */}
                <div
                  onClick={() => setModifyPaymentMethod('card')}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    modifyPaymentMethod === 'card'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        modifyPaymentMethod === 'card' ? 'border-blue-500' : 'border-gray-300'
                      }`}>
                        {modifyPaymentMethod === 'card' && (
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">Carta di credito/debito</p>
                        <p className="text-xs text-gray-500">Pagamento sicuro tramite Stripe</p>
                      </div>
                    </div>
                    <CreditCard className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Riepilogo */}
          {newStartDate && (
            <div className={`rounded-xl p-4 mb-6 ${
              priceDifference > 0 
                ? 'bg-orange-50 border border-orange-100' 
                : priceDifference < 0 
                  ? 'bg-green-50 border border-green-100'
                  : 'bg-gray-50 border border-gray-100'
            }`}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {priceDifference > 0 
                    ? 'Da pagare in più:' 
                    : priceDifference < 0 
                      ? 'Ti verrà rimborsato:'
                      : 'Nessuna differenza di prezzo'}
                </span>
                {priceDifference !== 0 && (
                  <span className={`font-bold ${
                    priceDifference > 0 ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    €{Math.abs(priceDifference).toFixed(2)}
                  </span>
                )}
              </div>
              {priceDifference < 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Il rimborso verrà accreditato: wallet immediatamente, carta entro 5-10 giorni lavorativi.
                </p>
              )}
              {priceDifference > 0 && !showPaymentForModify && (
                <p className="text-xs text-gray-500 mt-2">
                  Potrai pagare con wallet o carta nella schermata successiva.
                </p>
              )}
            </div>
          )}

          {/* Errori/Successo */}
          {modifyError && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
              <p className="text-sm text-red-700">{modifyError}</p>
            </div>
          )}

          {modifySuccess && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-4">
              <p className="text-sm text-green-700">{modifySuccess}</p>
            </div>
          )}

          {/* Bottoni */}
          {!modifySuccess && (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (showPaymentForModify) {
                    setShowPaymentForModify(false);
                    setModifyPaymentMethod(null);
                    setModifyError(null);
                  } else {
                    onClose();
                  }
                }}
                disabled={isModifying}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {showPaymentForModify ? 'Indietro' : 'Annulla'}
              </button>
              <button
                onClick={handleModifyBooking}
                disabled={
                  isModifying || 
                  !newStartDate || 
                  (showPaymentForModify && !modifyPaymentMethod) ||
                  (modifyPaymentMethod === 'wallet' && renterWalletBalance < priceDifference)
                }
                className={`flex-1 py-3 rounded-xl font-bold text-sm disabled:opacity-50 transition-colors ${
                  showPaymentForModify
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : priceDifference > 0
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isModifying 
                  ? 'Elaborazione...' 
                  : showPaymentForModify
                    ? `Conferma pagamento (€${priceDifference.toFixed(2)})`
                    : priceDifference > 0 
                      ? `Procedi al pagamento (€${priceDifference.toFixed(2)})`
                      : 'Conferma modifica'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
