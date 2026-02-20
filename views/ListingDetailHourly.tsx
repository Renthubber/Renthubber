import React, { useState, useEffect, useRef, useMemo } from "react";
import { Listing, SystemConfig, User } from "../types";
import {
  Star,
  MapPin,
  Check,
  ChevronLeft,
  Minus,
  Plus,
  MessageSquare,
  Clock,
} from "lucide-react";
import { PhotoGallery } from "../components/PhotoGallery";
import { FavoriteButton } from '../components/FavoriteButton';
import { ShareButton } from '../components/ShareButton';
import { HostInfo } from "../components/HostInfo";
import { ListingBadges } from "../components/ListingBadges";
import { RulesAndPolicies } from "../components/RulesAndPolicies";
import { MapSection } from "../components/MapSection";
import { ReviewsSection } from "../components/ReviewsSection";
import { RelatedListingsSection } from "../components/RelatedListingsSection";
import { api } from "../services/api";
import { BookingPaymentModal } from "../components/BookingPaymentModal";
import { referralApi } from "../services/referralApi";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from 'react-router-dom';
import { calculateHubberFixedFee, calculateRenterFixedFee } from '../utils/feeUtils';

interface ListingDetailHourlyProps {
  listing: Listing;
  currentUser: User | null;
  onBack: () => void;
  systemConfig?: SystemConfig;
  onPaymentSuccess: (amount: number, useWallet: number) => void;
  onHostClick?: (host: User) => void;
  onRenterClick?: (renter: { id: string; name: string; avatar?: string }) => void;
}

// ✅ GENERA SLOT ORARI OGNI 30 MINUTI (09:00 - 23:30)
const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 9; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeStr);
      // Aggiungi 23:30 come ultimo slot
      if (hour === 23 && minute === 0) {
        slots.push('23:30');
        break;
      }
    }
  }
  return slots;
};

// ✅ CALCOLA ORE TRA DUE SLOT
const calculateHoursBetween = (startTime: string, endTime: string): number => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return (endMinutes - startMinutes) / 60;
};

export const ListingDetailHourly: React.FC<ListingDetailHourlyProps> = ({
  listing,
  currentUser,
  onBack,
  systemConfig,
  onPaymentSuccess,
  onHostClick,
  onRenterClick,
}) => {
  const navigate = useNavigate();
  
  // ✅ OWNER (HOST) CARICATO DAL DB
  const [owner, setOwner] = useState<User | null>(null);

  // ✅ CARICA FEE DA SUPABASE
  const [platformFees, setPlatformFees] = useState<{
    renterPercentage: number;
    hubberPercentage: number;
    superHubberPercentage: number;
    fixedFeeEur: number;
  } | null>(null);
  const [maxCreditUsagePercent, setMaxCreditUsagePercent] = useState(30);

  // ✅ SALDI WALLET SEPARATI
  const [generalBalance, setGeneralBalance] = useState(0);
  const [referralBalance, setReferralBalance] = useState(0);
  const [refundBalance, setRefundBalance] = useState(0);

  // ✅ STATE PER NOLEGGIO A ORE
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [totalHours, setTotalHours] = useState<number>(0);
  const [guests, setGuests] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [useWallet, setUseWallet] = useState(true);

  const timeSlots = useMemo(() => generateTimeSlots(), []);

  useEffect(() => {
    const loadFees = async () => {
      try {
        const fees = await api.admin.getFees();
        if (fees) {
          setPlatformFees(fees);
        }
        
        const refSettings = await referralApi.getSettings();
        if (refSettings) {
          setMaxCreditUsagePercent(refSettings.maxCreditUsagePercent);
           }
      } catch (err) {
        console.error("Errore caricamento fee:", err);
      }
    };
    loadFees();
  }, []);

  // ✅ CALCOLA ORE QUANDO CAMBIANO GLI ORARI
  useEffect(() => {
    if (startTime && endTime) {
      const hours = calculateHoursBetween(startTime, endTime);
      if (hours >= 1) {
        setTotalHours(hours);
      } else {
        setTotalHours(0);
      }
    } else {
      setTotalHours(0);
    }
  }, [startTime, endTime]);

  // ✅ TRACCIA VISUALIZZAZIONE ANNUNCIO
useEffect(() => {
  const trackView = async () => {
    if (currentUser?.id === listing.hostId) return;
    
    try {
      if (currentUser?.id) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: recentView } = await supabase
          .from('listing_views')
          .select('id')
          .eq('listing_id', listing.id)
          .eq('viewer_id', currentUser.id)
          .gte('viewed_at', oneDayAgo)
          .maybeSingle();
        
        if (recentView) return;
      }
      
      await supabase
        .from('listing_views')
        .insert({
          listing_id: listing.id,
          viewer_id: currentUser?.id || null,
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('Errore tracking visualizzazione:', error);
    }
  };
  
  trackView();
}, [listing.id, listing.hostId, currentUser?.id]);

// ✅ CARICA SALDI WALLET
useEffect(() => {
  const loadWalletBalances = async () => {
    if (!currentUser?.id) return;
    
    try {
      const { data: wallet, error } = await supabase
        .from("wallets")
        .select("balance_cents, referral_balance_cents, refund_balance_cents")
        .eq("user_id", currentUser.id)
        .single();
      
      if (error) {
        return;
      }
      
      if (wallet) {
        setGeneralBalance((wallet.balance_cents || 0) / 100);
        setReferralBalance((wallet.referral_balance_cents || 0) / 100);
        setRefundBalance((wallet.refund_balance_cents || 0) / 100);
      }
    } catch (err) {
      console.error("Errore caricamento wallet:", err);
    }
  };
  
  loadWalletBalances();
}, [currentUser?.id]);

// ✅ CARICA OWNER
useEffect(() => {
  let isMounted = true;

  if (listing.owner) {
    setOwner(listing.owner);
    return;
  }

  const fetchOwner = async () => {
    try {
      if (!listing.hostId) {
        console.warn("Listing senza hostId:", listing.id);
        return;
      }
      const user = await api.users.get(listing.hostId);
      if (isMounted) {
        setOwner(user);
      }
    } catch (err) {
      console.error("Errore caricamento host per listing", listing.id, err);
      if (isMounted) {
        setOwner(null);
      }
    }
  };

  fetchOwner();

  return () => {
    isMounted = false;
  };
}, [listing.hostId, listing.id, listing.owner]);

// ✅ TRACCIA ANNUNCIO VISUALIZZATO
useEffect(() => {
  if (!listing.id || !currentUser?.id) return;
  
  const saveView = async () => {
    try {
      await api.recentlyViewed.add(currentUser.id, listing.id);
    } catch (err) {
      console.error('Errore salvataggio annuncio visualizzato:', err);
    }
  };
  
  saveView();
}, [listing.id, currentUser?.id]);

  // ✅ FILTRA SLOT ORARI FINALI DISPONIBILI
  const availableEndSlots = useMemo(() => {
    if (!startTime) return [];
    
    const startIndex = timeSlots.indexOf(startTime);
    if (startIndex === -1) return [];
    
    // Minimo 1 ora dopo (2 slot di 30 min)
    const minEndIndex = startIndex + 2;
    
    return timeSlots.slice(minEndIndex);
  }, [startTime, timeSlots]);

  // ✅ CALCOLO PREZZO
  // ✅ Fee dal DB
const renterFeePercentage = platformFees?.renterPercentage ?? systemConfig?.fees?.platformPercentage ?? 10;
const hubberFeePercentage = platformFees?.hubberPercentage ?? 10;
const superHubberFeePercentage = platformFees?.superHubberPercentage ?? 5;

// ✅ Determina se l'hubber è SuperHubber
const isOwnerSuperHubber = owner?.isSuperHubber ?? false;
const actualHubberFeePercentage = isOwnerSuperHubber ? superHubberFeePercentage : hubberFeePercentage;
  const subtotal = useMemo(() => {
    if (!totalHours || !listing.pricePerHour) return 0;
    return totalHours * listing.pricePerHour;
  }, [totalHours, listing.pricePerHour]);

  // ✅ CALCOLI COMPLETI COMMISSIONI
const serviceFee = useMemo(() => {
  if (!subtotal) return 0;
  const variableFee = (subtotal * renterFeePercentage) / 100;
  const fixedFee = calculateRenterFixedFee(subtotal);
  return variableFee + fixedFee;
}, [subtotal, renterFeePercentage]);

const hubberFee = useMemo(() => {
  if (!subtotal) return 0;
  const variableFee = (subtotal * actualHubberFeePercentage) / 100;
  const fixedFee = calculateHubberFixedFee(subtotal);
  return variableFee + fixedFee;
}, [subtotal, actualHubberFeePercentage]);

const hubberNet = useMemo(() => {
  return subtotal - hubberFee;
}, [subtotal, hubberFee]);

const total = useMemo(() => {
  const deposit = listing.deposit || 0;
  return subtotal + serviceFee + deposit;
}, [subtotal, serviceFee, listing.deposit]);

// ✅ CALCOLO WALLET
const totalWalletAvailable = refundBalance + referralBalance;

const walletUsedEur = useMemo(() => {
  if (!useWallet || !currentUser || total <= 0) return 0;
  
  const refundUsed = Math.min(refundBalance, total);
  const remainingAfterRefund = total - refundUsed;
  
  const maxReferralUsable = (serviceFee * maxCreditUsagePercent) / 100;
  const referralUsed = Math.min(referralBalance, maxReferralUsable, remainingAfterRefund);
  
  return refundUsed + referralUsed;
}, [useWallet, currentUser, total, refundBalance, referralBalance, serviceFee, maxCreditUsagePercent]);

const remainingToPay = total - walletUsedEur;


  // Rest of the component logic similar to ListingDetail...
  // (I'll continue with the essential parts)

  const handleBookNow = () => {
  if (!currentUser) {
    alert("Effettua il login per prenotare");
    return;
  }

  // ✅ BLOCCO: Non puoi prenotare il tuo stesso annuncio
  if (currentUser.id === listing.hostId) {
    alert("❌ Non puoi prenotare il tuo stesso annuncio!");
    return;
  }

  if (!selectedDate) {
    alert("Seleziona una data");
    return;
  }

  if (!startTime || !endTime) {
    alert("Seleziona ora di inizio e fine");
    return;
  }

  if (totalHours < 1) {
    alert("Il noleggio deve essere di almeno 1 ora");
    return;
  }

  setShowPaymentModal(true);
};

const handleContactHubber = () => {
  if (!currentUser) {
    const currentPath = window.location.pathname;
    navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
    return;
  }
  
  navigate(`/messages?listing=${listing.id}&hubber=${listing.hostId}`);
};

const handlePaymentSuccess = async () => {
  if (!currentUser) {
    console.warn("Nessun utente loggato.");
    return;
  }

  try {
    onPaymentSuccess(total, walletUsedEur);
  } catch (err) {
    console.error("Errore durante l'aggiornamento post-pagamento:", err);
  }
};

 // Se annuncio sospeso e utente non è il proprietario → non disponibile
  if (listing.status === 'suspended' && currentUser?.id !== listing.hostId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-xl font-bold text-gray-700 mb-2">Annuncio non disponibile</p>
          <p className="text-gray-500 mb-4">Questo annuncio è stato temporaneamente sospeso.</p>
          <button onClick={onBack} className="px-6 py-2 bg-brand text-white rounded-xl">
            Torna indietro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con back button */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <FavoriteButton
              listingId={listing.id}
              userId={currentUser?.id || null}
            />
            <ShareButton
  listingId={listing.id}
  listingTitle={listing.title}
/>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Gallery */}
        <PhotoGallery images={listing.images} />

        {/* Main Content */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & Location */}
            <div>
              <ListingBadges listing={listing} />
              <h1 className="text-3xl font-bold text-gray-900 mt-4">
                {listing.title}
              </h1>
              <div className="flex items-center gap-4 mt-3 text-gray-600">
                {listing.rating && (
  <div className="flex items-center gap-1">
    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
    <span className="font-semibold">{listing.rating.toFixed(1)}</span>
    <span>({listing.reviewCount || 0} recensioni)</span>
  </div>
)}
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{listing.location}</span>
                </div>
              </div>
            </div>

            {/* Host Info */}
            {owner && (
              <HostInfo owner={owner || undefined} onHostClick={onHostClick}
           />
            )}

            {/* Description */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Descrizione
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {listing.description}
              </p>
            </div>

            {/* Features */}
            {listing.features && listing.features.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Caratteristiche
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {listing.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 bg-white rounded-xl border border-gray-200"
                    >
                      <Check className="w-5 h-5 text-brand flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rules & Policies */}
           <RulesAndPolicies
          rules={listing.rules}
          cancellationPolicy={listing.cancellationPolicy}
         deposit={listing.deposit}
         openingHours={(listing as any).openingHours}
         closingHours={(listing as any).closingHours}
         category={listing.category}
         />

            {/* Map */}
             <MapSection
            location={listing.location}
            coordinates={listing.coordinates}
            category={listing.category}
            zoneDescription={(listing as any).zoneDescription}
         />
            {/* Reviews */}
            <ReviewsSection
                          listingId={listing.id}
                          onRenterClick={onRenterClick}
                        />
                      </div>

          {/* Right Column - Booking Card (MODIFICATO PER ORE) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    €{listing.pricePerHour}
                  </span>
                  <span className="text-gray-600">/ora</span>
                </div>
              </div>

              {/* Date Selector */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Seleziona la data
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    setSelectedDate(e.target.value ? new Date(e.target.value) : null);
                    setStartTime('');
                    setEndTime('');
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none"
                />
              </div>

              {/* Time Selectors */}
              {selectedDate && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Ora inizio
                    </label>
                    <select
                      value={startTime}
                      onChange={(e) => {
                        setStartTime(e.target.value);
                        setEndTime(''); // Reset ora fine quando cambia l'inizio
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none"
                    >
                      <option value="">Seleziona ora inizio</option>
                      {timeSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>

                  {startTime && (
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Ora fine
                      </label>
                      <select
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none"
                      >
                        <option value="">Seleziona ora fine</option>
                        {availableEndSlots.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* Total Hours Display */}
              {totalHours > 0 && (
                <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Durata noleggio:</span>
                    <span className="font-bold text-brand">
                      {totalHours} {totalHours === 1 ? 'ora' : 'ore'}
                    </span>
                  </div>
                </div>
              )}

              {/* Guests Counter */}
              {listing.category !== "oggetto" && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ospiti
                  </label>
                  <div className="flex items-center justify-between p-3 border border-gray-300 rounded-xl">
                    <button
                      onClick={() => setGuests(Math.max(1, guests - 1))}
                      disabled={guests <= 1}
                      className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-semibold text-lg">{guests}</span>
                    <button
                      onClick={() => setGuests(Math.min(listing.maxGuests || 10, guests + 1))}
                      disabled={guests >= (listing.maxGuests || 10)}
                      className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Price Breakdown */}
              {totalHours > 0 && (
                <div className="mb-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      €{listing.pricePerHour} × {totalHours} {totalHours === 1 ? 'ora' : 'ore'}
                    </span>
                    <span className="font-semibold">€{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-900">Totale</span>
                      <span className="font-bold text-xl text-brand">
                        €{subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Book Button */}
              <button
                onClick={handleBookNow}
                disabled={totalHours < 1 || !currentUser}
                className="w-full py-4 bg-gradient-to-r from-[#ff6b35] to-[#f7931e] text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!currentUser
                  ? "Accedi per prenotare"
                  : totalHours < 1
                  ? "Seleziona data e orari"
                  : "Prenota ora"}
              </button>

              {/* Contact Host */}
              {currentUser && currentUser.id !== listing.hostId && (
                <button
                  onClick={() => {
                    navigate(`/messages?listing=${listing.id}&hubber=${listing.hostId}`);
                  }}
                  className="w-full mt-3 py-3 border-2 border-brand text-brand font-semibold rounded-xl hover:bg-brand hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  Contatta l'Hubber
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Related Listings */}
        <div className="mt-16 pt-12 border-t border-gray-200">
                  <RelatedListingsSection category={listing.category} />
      </div>

     {/* Payment Modal */}
{showPaymentModal && selectedDate && currentUser && (
  <BookingPaymentModal
    isOpen={showPaymentModal}
    onClose={() => setShowPaymentModal(false)}
    renter={currentUser}
    listing={listing}
    startDate={selectedDate.toISOString()}
    endDate={selectedDate.toISOString()}
    totalAmountEur={total}
    rentalAmountEur={subtotal}
    platformFeeEur={serviceFee}
    depositEur={Number(listing.deposit) || 0}
    cleaningFeeEur={0}
    walletUsedEur={walletUsedEur}
    generalBalance={generalBalance}
    onSuccess={async () => {
      await handlePaymentSuccess();
      setShowPaymentModal(false);
      alert("Prenotazione confermata con successo!");
      onBack();
    }}
  />
)}
      </div>
    </div>
  );
};