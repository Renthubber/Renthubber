import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Listing, SystemConfig, User } from "../types";
import {
  Star,
  MapPin,
  Check,
  ChevronLeft,
  Minus,
  Plus,
  Clock,
  MessageSquare,
  Calendar,
  Users,
  Globe,
  AlertCircle,
  X,
} from "lucide-react";
import { PhotoGallery } from "../components/PhotoGallery";
import { FavoriteButton } from "../components/FavoriteButton";
import { ShareButton } from "../components/ShareButton";
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
import { AirbnbCalendar } from "../components/AirbnbCalendar";
import { useNavigate } from "react-router-dom";
import { calculateHubberFixedFee, calculateRenterFixedFee } from "../utils/feeUtils";
import { getAvatarUrl } from "../utils/avatarUtils";

interface ExperienceSlot {
  id: string;
  listing_id: string;
  date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  max_participants: number;
  booked_count: number;
  status: string;
}

interface ListingDetailEsperienzaProps {
  listing: Listing;
  currentUser: User | null;
  onBack: () => void;
  systemConfig?: SystemConfig;
  onPaymentSuccess: (amount: number, useWallet: number) => void;
  onHostClick?: (host: User) => void;
  onRenterClick?: (renter: { id: string; name: string; avatar?: string }) => void;
}

export const ListingDetailEsperienza: React.FC<ListingDetailEsperienzaProps> = ({
  listing,
  currentUser,
  onBack,
  systemConfig,
  onPaymentSuccess,
  onHostClick,
  onRenterClick,
}) => {
  const navigate = useNavigate();

  // --- STATO ---
  const [owner, setOwner] = useState<User | null>(null);
  const [slots, setSlots] = useState<ExperienceSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<ExperienceSlot | null>(null);
  const [participants, setParticipants] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [useWallet, setUseWallet] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  const [showDayCalendar, setShowDayCalendar] = useState(false);
  const [showAllSlots, setShowAllSlots] = useState(false);

  // Fee
  const [platformFees, setPlatformFees] = useState<{
    renterPercentage: number;
    hubberPercentage: number;
    superHubberPercentage: number;
    fixedFeeEur: number;
  } | null>(null);
  const [feeOverride, setFeeOverride] = useState<{
    fees_disabled: boolean;
    custom_renter_fee: number | null;
    custom_hubber_fee: number | null;
  } | null>(null);
  const [maxCreditUsagePercent, setMaxCreditUsagePercent] = useState(30);

  // Wallet
  const [generalBalance, setGeneralBalance] = useState(0);
  const [referralBalance, setReferralBalance] = useState(0);
  const [refundBalance, setRefundBalance] = useState(0);

  // --- CARICA OWNER ---
  useEffect(() => {
    if (listing.owner) {
      setOwner(listing.owner);
      return;
    }
    const fetchOwner = async () => {
      try {
        const u = await api.users.get(listing.hostId);
        setOwner(u);
      } catch (err) {
        console.error("Errore caricamento owner:", err);
      }
    };
    fetchOwner();
  }, [listing.hostId, listing.owner]);

  // --- CARICA SLOT DA SUPABASE ---
  useEffect(() => {
    const loadSlots = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const { data, error } = await supabase
          .from("experience_slots")
          .select("*")
          .eq("listing_id", listing.id)
          .eq("status", "active")
          .gte("date", today)
          .order("date", { ascending: true });

        if (error) {
          console.error("Errore caricamento slot:", error);
          return;
        }
        setSlots(data || []);
      } catch (err) {
        console.error("Errore caricamento slot:", err);
      }
    };
    loadSlots();
  }, [listing.id]);

  // --- CARICA FEE ---
  useEffect(() => {
    const loadFees = async () => {
      try {
        const fees = await api.admin.getFees();
        if (fees) setPlatformFees(fees);
        const refSettings = await referralApi.getSettings();
        if (refSettings) setMaxCreditUsagePercent(refSettings.maxCreditUsagePercent);
      } catch (err) {
        console.error("Errore caricamento fee:", err);
      }
    };
    loadFees();
  }, []);

  // --- CARICA FEE OVERRIDE ---
  useEffect(() => {
    const loadFeeOverride = async () => {
      if (!currentUser?.id) return;
      try {
        const { data } = await supabase.rpc("get_active_fee_override", { p_user_id: currentUser.id });
        const override = Array.isArray(data) ? data[0] : data;
        if (override) setFeeOverride(override);
      } catch (err) {
        console.error("Errore caricamento fee override:", err);
      }
    };
    loadFeeOverride();
  }, [currentUser?.id]);

  // --- CARICA WALLET ---
  useEffect(() => {
    const loadWallet = async () => {
      if (!currentUser?.id) return;
      try {
        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance_cents, referral_balance_cents, refund_balance_cents")
          .eq("user_id", currentUser.id)
          .single();
        if (wallet) {
          setGeneralBalance((wallet.balance_cents || 0) / 100);
          setReferralBalance((wallet.referral_balance_cents || 0) / 100);
          setRefundBalance((wallet.refund_balance_cents || 0) / 100);
        }
      } catch (err) {
        console.error("Errore caricamento wallet:", err);
      }
    };
    loadWallet();
  }, [currentUser?.id]);

  // --- CALCOLO PREZZI ---
  const renterFeePercentage = feeOverride?.fees_disabled
    ? 0
    : feeOverride?.custom_renter_fee ?? platformFees?.renterPercentage ?? systemConfig?.fees?.platformPercentage ?? 10;

  const isOwnerSuperHubber = owner?.isSuperHubber ?? false;
  const hubberFeePercentage = feeOverride?.fees_disabled
    ? 0
    : feeOverride?.custom_hubber_fee ?? platformFees?.hubberPercentage ?? 10;
  const superHubberFeePercentage = platformFees?.superHubberPercentage ?? 5;
  const actualHubberFeePercentage = isOwnerSuperHubber ? superHubberFeePercentage : hubberFeePercentage;

  const pricePerUnit = listing.price || 0;
  const priceType = (listing as any).priceType || "persona";

  // Subtotale: se a persona moltiplica per partecipanti, se a gruppo è fisso
  const subtotal = priceType === "persona" ? pricePerUnit * participants : pricePerUnit;
  const extraCost = Number(listing.cleaningFee) || 0;
  const completeSubtotal = subtotal + extraCost;

  const renterFixedFee = platformFees ? calculateRenterFixedFee(platformFees.fixedFeeEur) : 0;
  const renterVariableFee = (completeSubtotal * renterFeePercentage) / 100;
  const serviceFee = renterVariableFee + renterFixedFee;
  const total = completeSubtotal + serviceFee;

  const hubberFixedFee = platformFees ? calculateHubberFixedFee(platformFees.fixedFeeEur) : 0;
  const hubberFee = (subtotal * actualHubberFeePercentage) / 100 + hubberFixedFee;
  const hubberNet = subtotal - hubberFee;

  // Wallet
  let walletUsedEur = 0;
  if (useWallet && currentUser && total > 0) {
    const refundUsed = Math.min(refundBalance, total);
    const remainingAfterRefund = total - refundUsed;
    const maxReferralUsable = (serviceFee * maxCreditUsagePercent) / 100;
    const referralUsed = Math.min(referralBalance, maxReferralUsable, remainingAfterRefund);
    const remainingAfterReferral = remainingAfterRefund - referralUsed;
    const generalUsed = Math.min(generalBalance, remainingAfterReferral);
    walletUsedEur = refundUsed + referralUsed + generalUsed;
  }
  const remainingToPay = total - walletUsedEur;

  // --- HANDLERS ---
  const handleContactHubber = () => {
    if (!currentUser) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    navigate(`/messages?listing=${listing.id}&hubber=${listing.hostId}`);
  };

  const handleBookingClick = () => {
    if (!currentUser) {
      alert("Devi accedere per prenotare.");
      return;
    }
    if (currentUser.id === listing.hostId) {
      alert("❌ Non puoi prenotare il tuo stesso annuncio!");
      return;
    }
    if (!selectedSlot) {
      alert("❌ Seleziona uno slot per continuare.");
      return;
    }
    const available = selectedSlot.max_participants - selectedSlot.booked_count;
    if (participants > available) {
      alert(`❌ Posti disponibili: ${available}`);
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    if (!currentUser) return;
    try {
      onPaymentSuccess(total, walletUsedEur);
    } catch (err) {
      console.error("Errore post-pagamento:", err);
    }
  };

const slotsForSelectedDay = selectedDay
    ? slots.filter(slot => {
        const slotStart = new Date(slot.date + 'T00:00:00');
        const slotEnd = slot.end_date ? new Date(slot.end_date + 'T00:00:00') : slotStart;
        const day = new Date(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate());
        const start = new Date(slotStart.getFullYear(), slotStart.getMonth(), slotStart.getDate());
        const end = new Date(slotEnd.getFullYear(), slotEnd.getMonth(), slotEnd.getDate());
        return day >= start && day <= end;
      })
    : [];

  const visibleSlots = selectedDay
    ? (showAllSlots ? slotsForSelectedDay : slotsForSelectedDay.slice(0, 5))
    : [];

  // Date che hanno almeno uno slot disponibile
  const datesWithSlots = slots
    .filter(s => s.max_participants - s.booked_count > 0)
    .map(s => new Date(s.date + 'T00:00:00'));

  // --- HELPERS ---
  const formatSlotDate = (slot: ExperienceSlot) => {
    const start = new Date(slot.date + "T00:00:00");
    const startStr = start.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "long" });
    if (slot.end_date && slot.end_date !== slot.date) {
      const end = new Date(slot.end_date + "T00:00:00");
      const endStr = end.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
      return `${startStr} → ${endStr}`;
    }
    return `${startStr} ${start.getFullYear()}`;
  };

  const formatSlotTime = (slot: ExperienceSlot) => {
    if (slot.start_time && slot.end_time) {
      return `${slot.start_time} – ${slot.end_time}`;
    }
    return null;
  };

  const availableSpots = (slot: ExperienceSlot) => slot.max_participants - slot.booked_count;

  const startDateIso = selectedSlot ? selectedSlot.date : "";
  const endDateIso = selectedSlot?.end_date || startDateIso;

  // --- SUSPENDED CHECK ---
  if (listing.status === "suspended" && currentUser?.id !== listing.hostId) {
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
    <div className="bg-white min-h-screen pb-12 relative font-sans">
      {/* NAVBAR */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-brand font-medium transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            <span className="hidden sm:inline">Torna alla ricerca</span>
            <span className="sm:hidden">Indietro</span>
          </button>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <FavoriteButton listingId={listing.id} userId={currentUser?.id} variant="detail" />
            <ShareButton listingId={listing.id} listingTitle={listing.title} />
          </div>
        </div>
      </div>

      {/* TITOLO SOPRA LE FOTO */}
      <div className="max-w-7xl mx-auto px-4 mb-6 mt-2">
        <h1 className="text-3xl font-bold text-gray-900">
          {listing.title}
        </h1>
      </div>

      {/* GALLERY */}
      <div className="relative max-w-7xl mx-auto px-4">
        <PhotoGallery images={listing.images} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-8"></div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-8">
          <div className="pb-2">
            <ListingBadges listing={listing} />
            <div className="flex items-center text-gray-600 text-sm mt-4">
              <span className="font-semibold flex items-center text-gray-900 mr-1">
                <Star className="w-4 h-4 fill-current mr-1" />{" "}
                {listing.rating || "New"}
              </span>
              <span className="mx-2">·</span>
              <span className="underline">{listing.reviewCount} recensioni</span>
              <span className="mx-2">·</span>
              <span className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" /> {listing.location}
              </span>
            </div>
          </div>

          {/* HOST INFO */}
          {owner && (
            <HostInfo
              owner={owner}
              onHostClick={onHostClick}
            />
          )}

          {/* INFO PILLOLE */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(listing as any).durationValue && (
              <div className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center text-center">
                <Clock className="w-5 h-5 text-brand mb-1" />
                <span className="text-xs text-gray-500">Durata</span>
                <span className="text-sm font-bold text-gray-900">
                  {(listing as any).durationValue} {(listing as any).durationUnit}
                </span>
              </div>
            )}
            {listing.maxGuests && (
              <div className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center text-center">
                <Users className="w-5 h-5 text-brand mb-1" />
                <span className="text-xs text-gray-500">Max per slot</span>
                <span className="text-sm font-bold text-gray-900">{listing.maxGuests} pers.</span>
              </div>
            )}
            {(listing as any).languages && (
              <div className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center text-center">
                <Globe className="w-5 h-5 text-brand mb-1" />
                <span className="text-xs text-gray-500">Lingua</span>
                <span className="text-sm font-bold text-gray-900">{(listing as any).languages}</span>
              </div>
            )}
            {(listing as any).difficulty && (
              <div className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center text-center">
                <AlertCircle className="w-5 h-5 text-brand mb-1" />
                <span className="text-xs text-gray-500">Difficoltà</span>
                <span className="text-sm font-bold text-gray-900 capitalize">{(listing as any).difficulty}</span>
              </div>
            )}
          </div>

          {/* DESCRIZIONE */}
          {listing.description && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">L'esperienza</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{listing.description}</p>
            </div>
          )}

          {/* INCLUSO / NON INCLUSO */}
          {((listing as any).included?.length > 0 || (listing as any).notIncluded?.length > 0) && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Cosa è incluso</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {(listing as any).included?.length > 0 && (
                  <div className="space-y-2">
                    {(listing as any).included.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                )}
                {(listing as any).notIncluded?.length > 0 && (
                  <div className="space-y-2">
                    {(listing as any).notIncluded.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-400">
                        <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CARATTERISTICHE */}
          {listing.features && listing.features.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Caratteristiche</h2>
              <div className="grid grid-cols-2 gap-3">
                {listing.features.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-brand flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SLOT DISPONIBILI - MOBILE */}
          <div className="lg:hidden">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Slot Disponibili</h2>
            {slots.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl p-6 text-center">
                <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Nessuno slot disponibile al momento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {slots.map((slot) => {
                  const spots = availableSpots(slot);
                  const isSelected = selectedSlot?.id === slot.id;
                  return (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(isSelected ? null : slot)}
                      disabled={spots === 0}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                        isSelected
                          ? "border-brand bg-brand/5"
                          : spots === 0
                          ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                          : "border-gray-200 hover:border-brand/50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{formatSlotDate(slot)}</p>
                          {formatSlotTime(slot) && (
                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {formatSlotTime(slot)}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            spots === 0
                              ? "bg-red-100 text-red-600"
                              : spots <= 3
                              ? "bg-orange-100 text-orange-600"
                              : "bg-green-100 text-green-600"
                          }`}>
                            {spots === 0 ? "Esaurito" : `${spots} posti`}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* REGOLE */}
          <RulesAndPolicies
            rules={listing.rules}
            cancellationPolicy={listing.cancellationPolicy}
            deposit={listing.deposit}
            category={listing.category}
          />
           
          {/* MAPPA */}
          <MapSection
            location={listing.location || listing.pickupCity || ''}
            coordinates={listing.coordinates}
            category="spazio"
            zoneDescription={(listing as any).zoneDescription}
          />

          {/* RECENSIONI */}
          <ReviewsSection
            listingId={listing.id}
            onRenterClick={onRenterClick}
          />

          {/* ANNUNCI CORRELATI */}
          <RelatedListingsSection category={listing.category} />
        </div>

        {/* RIGHT COLUMN — STICKY BOOKING */}
        <div className="hidden lg:block lg:col-span-1 relative">

          {/* Badge Esperienza */}
          <div className="mb-3 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand/10 text-brand">
              <Clock className="w-3.5 h-3.5" />
              Esperienza
            </span>
            <p className="text-[11px] text-gray-400 mt-1.5">
              {priceType === 'persona' ? 'Prezzo a persona' : 'Prezzo per gruppo'}
            </p>
          </div>

          <div className="sticky top-28 border border-gray-200 rounded-2xl shadow-xl p-6 bg-white z-30">

            {/* Price Header */}
            <div className="flex justify-between items-end mb-6">
              <div>
                <span className="text-2xl font-bold text-gray-900">€{pricePerUnit.toFixed(2)}</span>
                <span className="text-gray-500"> / {priceType === 'persona' ? 'persona' : 'gruppo'}</span>
              </div>
              <div className="text-sm text-gray-500 underline cursor-pointer">
                {listing.reviewCount} recensioni
              </div>
            </div>

            {/* SLOT SELECTOR */}
            <div className="border border-gray-400 rounded-xl overflow-visible mb-4 relative bg-white">
              <div className="p-3">
                <p className="text-[10px] font-bold uppercase text-gray-800 mb-2">Seleziona Data</p>
                
                {/* Bottone apri calendario */}
                <button
                  onClick={() => { setShowDayCalendar(!showDayCalendar); setShowAllSlots(false); setSelectedSlot(null); }}
                  className="w-full text-left px-3 py-2 border border-gray-300 rounded-xl text-sm hover:border-brand transition-colors"
                >
                  {selectedDay
                    ? selectedDay.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                    : <span className="text-gray-400">Scegli una data...</span>
                  }
                </button>

                {/* Calendario */}
                {showDayCalendar && (
                  <div className="mt-2 overflow-x-auto flex justify-center">
                    <AirbnbCalendar
                      selectedStart={selectedDay}
                      selectedEnd={undefined}
                      onChange={(start) => {
                        setSelectedDay(start);
                        setShowDayCalendar(false);
                        setShowAllSlots(false);
                        setSelectedSlot(null);
                      }}
                      onClose={() => setShowDayCalendar(false)}
                      compact={true}
                    />
                  </div>
                )}

                {/* Slot per il giorno selezionato */}
                {selectedDay && !showDayCalendar && (
                  <div className="mt-3 space-y-2">
                    {slotsForSelectedDay.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-2">Nessuno slot disponibile per questa data</p>
                    ) : (
                      <>
                        {visibleSlots.map((slot) => {
                          const spots = availableSpots(slot);
                          const isSelected = selectedSlot?.id === slot.id;
                          return (
                            <button
                              key={slot.id}
                              onClick={() => setSelectedSlot(isSelected ? null : slot)}
                              disabled={spots === 0}
                              className={`w-full p-2 rounded-xl border-2 text-left transition-all text-sm ${
                                isSelected ? 'border-brand bg-brand/5' :
                                spots === 0 ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed' :
                                'border-gray-200 hover:border-brand/50'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-semibold text-gray-900">{formatSlotDate(slot)}</p>
                                  {formatSlotTime(slot) && (
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> {formatSlotTime(slot)}
                                    </p>
                                  )}
                                </div>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                                  spots === 0 ? 'bg-red-100 text-red-600' :
                                  spots <= 3 ? 'bg-orange-100 text-orange-600' :
                                  'bg-green-100 text-green-600'
                                }`}>
                                  {spots === 0 ? 'Esaurito' : `${spots} posti`}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                        {slotsForSelectedDay.length > 5 && !showAllSlots && (
                          <button
                            onClick={() => setShowAllSlots(true)}
                            className="w-full text-center text-sm text-brand font-medium hover:underline py-1"
                          >
                            Mostra altri {slotsForSelectedDay.length - 5} slot →
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* PARTECIPANTI */}
              {selectedSlot && priceType === 'persona' && (
                <div className="p-3 border-t border-gray-400 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-800">Partecipanti</p>
                    <p className="text-sm text-gray-900">{participants} pers.</p>
                  </div>
                  <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setParticipants(Math.max(1, participants - 1))}
                      className={`p-1 rounded-full border ${participants === 1 ? 'border-gray-200 text-gray-300' : 'border-gray-400 text-gray-600 hover:border-black'}`}
                      disabled={participants <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setParticipants(Math.min(availableSpots(selectedSlot), participants + 1))}
                      className={`p-1 rounded-full border ${selectedSlot && participants >= availableSpots(selectedSlot) ? 'border-gray-200 text-gray-300' : 'border-gray-400 text-gray-600 hover:border-black'}`}
                      disabled={selectedSlot ? participants >= availableSpots(selectedSlot) : false}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* WALLET */}
            {currentUser && (
              <div className="text-sm text-gray-600 mb-3">
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={useWallet}
                    onChange={e => setUseWallet(e.target.checked)}
                  />
                  <span>Usa credito wallet</span>
                </label>
                <div className="pl-6 space-y-1 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Credito Wallet:</span>
                    <span>€{generalBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Credito Rimborsi:</span>
                    <span>€{refundBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Credito Invita Amico:</span>
                    <span>€{referralBalance.toFixed(2)} <span className="text-gray-400">(max {maxCreditUsagePercent}% comm.)</span></span>
                  </div>
                </div>
              </div>
            )}

            {/* BOTTONI */}
            {currentUser?.id === listing.hostId ? (
              <div className="w-full bg-gray-100 text-gray-600 font-bold py-3.5 rounded-xl text-lg text-center mb-4 border-2 border-gray-200">
                ✋ Questo è il tuo annuncio
              </div>
            ) : (
              <>
                <button
                  onClick={handleContactHubber}
                  className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl text-base shadow-sm border-2 border-gray-200 transition-all mb-3"
                >
                  Contatta l'organizzatore
                </button>
                <button
                  onClick={handleBookingClick}
                  className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3.5 rounded-xl text-lg shadow-md transition-all mb-4"
                >
                  {selectedSlot ? 'Prenota' : 'Seleziona uno slot'}
                </button>
              </>
            )}

            {/* RIEPILOGO COSTI */}
            {selectedSlot && (
              <>
                <p className="text-center text-sm text-gray-500 mb-6">
                  Paga nella schermata successiva in modo sicuro con Stripe.
                </p>
                <div className="space-y-3 text-gray-600">
                  <div className="flex justify-between underline decoration-gray-300">
                    <span>€{pricePerUnit.toFixed(2)} {priceType === 'persona' ? `× ${participants} pers.` : '× 1 gruppo'}</span>
                    <span>€{subtotal.toFixed(2)}</span>
                  </div>
                  {extraCost > 0 && (
                    <div className="flex justify-between underline decoration-gray-300">
                      <span>Costo extra</span>
                      <span>€{extraCost.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between underline decoration-gray-300">
                    <span>Commissione servizio ({renterFeePercentage}%)</span>
                    <span>€{renterVariableFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between underline decoration-gray-300">
                    <span>Fee fissa piattaforma</span>
                    <span>€{renterFixedFee.toFixed(2)}</span>
                  </div>
                  {walletUsedEur > 0 && (
                    <div className="flex justify-between underline decoration-dashed text-green-600">
                      <span>Credito wallet usato</span>
                      <span>-€{walletUsedEur.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between font-bold text-gray-900 text-lg">
                  <span>Totale</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
                {walletUsedEur > 0 && (
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>Da pagare con carta</span>
                    <span>€{remainingToPay.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      {/* MOBILE BOTTOM BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-xl font-bold text-gray-900">€{pricePerUnit.toFixed(2)}</span>
            <span className="text-sm text-gray-500 ml-1">
              {priceType === "persona" ? "/ pers." : "/ gruppo"}
            </span>
          </div>
          <button
            onClick={handleBookingClick}
            className="flex-1 py-3 rounded-2xl bg-brand text-white font-bold text-sm hover:bg-brand-dark transition-colors"
          >
            {selectedSlot ? "Prenota ora" : "Seleziona slot"}
          </button>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {currentUser && selectedSlot && (
        <BookingPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          renter={currentUser}
          listing={{ ...listing, selectedSlotId: selectedSlot?.id, selectedParticipants: participants } as any}
          startDate={startDateIso}
          endDate={endDateIso}
          totalAmountEur={total}
          rentalAmountEur={subtotal}
          platformFeeEur={serviceFee}
          depositEur={0}
          cleaningFeeEur={extraCost}
          extraGuestsCount={0}
          extraGuestsFeeEur={0}
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