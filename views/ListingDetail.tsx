import React, { useState, useEffect, useRef, useMemo } from "react";
import { Listing, SystemConfig, User } from "../types";
import {
  Star,
  MapPin,
  Check,
  ChevronLeft,
  Minus,
  Plus,
} from "lucide-react";
import { AirbnbCalendar } from "../components/AirbnbCalendar";
import { PhotoGallery } from "../components/PhotoGallery";
import { FavoriteButton } from '../components/FavoriteButton';  // ← AGGIUNGI
import { ShareButton } from '../components/ShareButton';        // ← AGGIUNGI
import { HostInfo } from "../components/HostInfo";
import { ListingBadges } from "../components/ListingBadges";
import { RulesAndPolicies } from "../components/RulesAndPolicies";
import { MapSection } from "../components/MapSection";
import { ReviewsSection } from "../components/ReviewsSection";
import { RelatedListingsSection } from "../components/RelatedListingsSection";
import { api } from "../services/api";
import { BookingPaymentModal } from "../components/BookingPaymentModal";
import { referralApi } from "../services/referralApi";
import { supabase } from "../lib/supabase";

interface ListingDetailProps {
  listing: Listing;
  currentUser: User | null;
  onBack: () => void;
  systemConfig?: SystemConfig;
  onPaymentSuccess: (amount: number, useWallet: number) => void;
  onHostClick?: (host: User) => void;
  onRenterClick?: (renter: { id: string; name: string; avatar?: string }) => void;
}

export const ListingDetail: React.FC<ListingDetailProps> = ({
  listing,
  currentUser,
  onBack,
  systemConfig,
  onPaymentSuccess,
  onHostClick,
  onRenterClick,
}) => {
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
  const [referralBalance, setReferralBalance] = useState(0); // Credito Invita Amico (max 30% commissioni)
  const [refundBalance, setRefundBalance] = useState(0);     // Credito Rimborsi (100% flessibile)

  useEffect(() => {
    const loadFees = async () => {
      try {
        const fees = await api.admin.getFees();
        if (fees) {
          setPlatformFees(fees);
          console.log("✅ Fee caricate da Supabase:", fees);
        }
        
        // Carica anche settings referral per il limite wallet
        const refSettings = await referralApi.getSettings();
        if (refSettings) {
          setMaxCreditUsagePercent(refSettings.maxCreditUsagePercent);
          console.log("✅ Referral settings caricate:", refSettings.maxCreditUsagePercent, "%");
        }
      } catch (err) {
        console.error("Errore caricamento fee:", err);
      }
    };
    loadFees();
  }, []);

  // ✅ TRACCIA VISUALIZZAZIONE ANNUNCIO
  useEffect(() => {
    const trackView = async () => {
      // Non tracciare se l'utente è il proprietario dell'annuncio
      if (currentUser?.id === listing.hostId) return;
      
      try {
        // Verifica se ha già visualizzato nelle ultime 24 ore
        if (currentUser?.id) {
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const { data: recentView } = await supabase
            .from('listing_views')
            .select('id')
            .eq('listing_id', listing.id)
            .eq('viewer_id', currentUser.id)
            .gte('viewed_at', oneDayAgo)
            .maybeSingle();
          
          if (recentView) return; // Già visualizzato recentemente
        }
        
        // Registra la visualizzazione
        await supabase
          .from('listing_views')
          .insert({
            listing_id: listing.id,
            viewer_id: currentUser?.id || null,
            user_agent: navigator.userAgent
          });
      } catch (error) {
        // Non bloccare l'app se il tracking fallisce
        console.error('Errore tracking visualizzazione:', error);
      }
    };
    
    trackView();
  }, [listing.id, listing.hostId, currentUser?.id]);

  // ✅ CARICA SALDI WALLET DAL DATABASE
  useEffect(() => {
    const loadWalletBalances = async () => {
      if (!currentUser?.id) return;
      
      try {
        const { data: wallet, error } = await supabase
          .from("wallets")
          .select("referral_balance_cents, refund_balance_cents")
          .eq("user_id", currentUser.id)
          .single();
        
        if (error) {
          console.log("Wallet non trovato, uso valori di default");
          return;
        }
        
        if (wallet) {
          setReferralBalance((wallet.referral_balance_cents || 0) / 100);
          setRefundBalance((wallet.refund_balance_cents || 0) / 100);
          console.log("✅ Saldi wallet caricati:", {
            referral: (wallet.referral_balance_cents || 0) / 100,
            refund: (wallet.refund_balance_cents || 0) / 100
          });
        }
      } catch (err) {
        console.error("Errore caricamento wallet:", err);
      }
    };
    
    loadWalletBalances();
  }, [currentUser?.id]);

  // 🔧 FIX: Usa listing.owner se già presente (dal JOIN), altrimenti carica separatamente
  useEffect(() => {
    let isMounted = true;

    // ✅ CASO 1: Se il listing ha già l'owner dal JOIN, usalo direttamente
    if (listing.owner) {
      setOwner(listing.owner);
      return;
    }

    // ✅ CASO 2: Fallback - carica l'owner separatamente se manca
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

  // State calendario
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // ✅ Date già prenotate (caricate da Supabase)
  const [bookedDates, setBookedDates] = useState<Date[]>([]);

  // ✅ TRACCIA ANNUNCIO VISUALIZZATO (per "Ultimi Visti") - DATABASE
useEffect(() => {
  if (!listing.id || !currentUser?.id) return;
  
  const saveView = async () => {
    try {
      await api.recentlyViewed.add(currentUser.id, listing.id);
      console.log('📌 Annuncio aggiunto ai visti di recente:', listing.title);
    } catch (err) {
      console.error('Errore salvataggio annuncio visualizzato:', err);
    }
  };
  
  saveView();
}, [listing.id, currentUser?.id]);

  // Spazi → orari e ospiti
  const [checkInTime, setCheckInTime] = useState("09:00");
  const [checkOutTime, setCheckOutTime] = useState("10:00");
  const [guests, setGuests] = useState(1);
  
  // Custom dropdown orari
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);

  // Oggetti orari → numero ore
  const [hours, setHours] = useState(1);

  // Stato calcoli
  const [duration, setDuration] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [serviceFee, setServiceFee] = useState(0);
  const [total, setTotal] = useState(0);
  
  // ✅ NUOVO: Calcoli per l'hubber
  const [hubberFee, setHubberFee] = useState(0);
  const [hubberNet, setHubberNet] = useState(0);

  // Stato pagamento
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [useWallet, setUseWallet] = useState(true);

  // ✅ Fee dal DB Supabase o fallback da SystemConfig
  const renterFeePercentage = platformFees?.renterPercentage ?? systemConfig?.fees?.platformPercentage ?? 10;
  const hubberFeePercentage = platformFees?.hubberPercentage ?? 10;
  const superHubberFeePercentage = platformFees?.superHubberPercentage ?? 5;
  const fixedFee = platformFees?.fixedFeeEur ?? systemConfig?.fees?.fixedFeeEur ?? 2;

  // ✅ Determina se l'hubber è SuperHubber (commissione ridotta)
  const isOwnerSuperHubber = owner?.isSuperHubber ?? false;
  const actualHubberFeePercentage = isOwnerSuperHubber ? superHubberFeePercentage : hubberFeePercentage;

  // Opzioni orari
  const timeOptions = Array.from({ length: 16 }, (_, i) => {
    const h = i + 8;
    return `${h < 10 ? "0" + h : h}:00`;
  });

  // Helper formato data
  const formatDate = (date: Date | undefined) => {
    if (!date) return "Aggiungi data";
    return date.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Etichetta unità (ora/ore, giorno/giorni, ecc.)
  const unitLabel = useMemo(() => {
    const base = listing.priceUnit;
    const d = duration;

    if (base === "ora") return d === 1 ? "ora" : "ore";
    if (base === "giorno") return d === 1 ? "giorno" : "giorni";
    if (base === "settimana") return d === 1 ? "settimana" : "settimane";
    if (base === "mese") return d === 1 ? "mese" : "mesi";

    return base;
  }, [listing.priceUnit, duration]);

  // Chiudi calendario al click fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ CARICA DATE GIÀ PRENOTATE DA SUPABASE
  useEffect(() => {
    const loadBookedDates = async () => {
      try {
        const bookings = await api.bookings.getByListingId(listing.id);
        
        const allBookedDates: Date[] = [];
        
        bookings.forEach((booking) => {
          const start = new Date(booking.startDate);
          const end = new Date(booking.endDate);
          
          // Aggiungi tutte le date tra start e end (incluse)
          const current = new Date(start);
          while (current <= end) {
            allBookedDates.push(new Date(current));
            current.setDate(current.getDate() + 1);
          }
        });
        
        setBookedDates(allBookedDates);
        console.log("📅 Date prenotate caricate:", allBookedDates.length);
      } catch (err) {
        console.error("Errore caricamento date prenotate:", err);
      }
    };

    if (listing.id) {
      loadBookedDates();
    }
  }, [listing.id]);

  // Date disabilitate = date già prenotate
  const disabledDates = bookedDates;

  // 🔥 CALCOLO durata + costi (oggetti + spazi, tutte le unità)
  useEffect(() => {
    let units = 0;
    let baseSubtotal = 0;

    // --- CASO ORARIO ----
    if (listing.priceUnit === "ora") {
      if (listing.category === "spazio") {
        const startHour = parseInt(checkInTime.split(":")[0]);
        const endHour = parseInt(checkOutTime.split(":")[0]);
        let diff = endHour - startHour;
        if (diff <= 0) diff = 1;
        units = diff;
      } else {
        units = hours;
      }

      if (startDate) {
        baseSubtotal = units * listing.price;
      }
    } else {
      // --- CASO GIORNO / SETTIMANA / MESE ----
      if (startDate) {
        // ✅ Se end non c'è, usa start (stesso giorno = 1 giorno)
        const effectiveEndDate = endDate || startDate;
        const diffTime = Math.abs(effectiveEndDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (listing.priceUnit === "giorno") {
          units = diffDays || 1; // Minimo 1 giorno
        } else if (listing.priceUnit === "settimana") {
          units = Math.max(Math.ceil(diffDays / 7), 1);
        } else if (listing.priceUnit === "mese") {
          units = Math.max(Math.ceil(diffDays / 30), 1);
        } else {
          units = diffDays || 1;
        }

        baseSubtotal = units * listing.price;
      }
    }

    const deposit = listing.deposit || 0;
    const cleaningFee = listing.cleaningFee || 0;
    
    // ✅ SUBTOTALE COMPLETO: prezzo base + tutti i costi extra impostati dall'hubber
    const completeSubtotal = baseSubtotal + cleaningFee;

    // ✅ CALCOLO COMMISSIONI RENTER (sul subtotale completo)
    const renterVariableFee = (completeSubtotal * renterFeePercentage) / 100;
    const renterTotalFee = renterVariableFee + fixedFee;

    // ✅ CALCOLO COMMISSIONI HUBBER (sul subtotale completo)
    const hubberVariableFee = (completeSubtotal * actualHubberFeePercentage) / 100;
    const hubberTotalFee = hubberVariableFee + fixedFee;
    const hubberNetAmount = completeSubtotal - hubberTotalFee;

    const totalCalc = completeSubtotal + renterTotalFee + deposit;

    setDuration(units);
    setSubtotal(baseSubtotal);
    setServiceFee(renterTotalFee);
    setHubberFee(hubberTotalFee);
    setHubberNet(hubberNetAmount);
    setTotal(totalCalc);
  }, [
    startDate,
    endDate,
    hours,
    checkInTime,
    checkOutTime,
    listing.price,
    listing.priceUnit,
    listing.deposit,
    listing.cleaningFee,
    listing.category,
    renterFeePercentage,
    actualHubberFeePercentage,
    fixedFee,
  ]);

  // Chiudi dropdown quando clicchi fuori
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.relative')) {
        setIsCheckInOpen(false);
        setIsCheckOutOpen(false);
      }
    };

    if (isCheckInOpen || isCheckOutOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isCheckInOpen, isCheckOutOpen]);

  const handleCalendarChange = (
    start: Date | undefined,
    end: Date | undefined
  ) => {
    // ✅ Gestione doppio click stesso giorno
    // Se clicco la stessa data già selezionata, setta end = start
    if (start && !end && startDate) {
      const isSameDay =
        start.getDate() === startDate.getDate() &&
        start.getMonth() === startDate.getMonth() &&
        start.getFullYear() === startDate.getFullYear();
      
      if (isSameDay) {
        // Doppio click! Setta end = start e chiudi
        setEndDate(start);
        setIsCalendarOpen(false);
        return;
      }
    }
    
    setStartDate(start);
    setEndDate(end);
    
    // ✅ Chiudi calendario quando range completo
    if (start && end) {
      setIsCalendarOpen(false);
    }
  };


  // ✅ CONTROLLO: Tutte le date nel range devono essere libere
  // IMPORTANTE: Il check-out non viene controllato (restituisci la mattina)
  const isRangeAvailable = (start: Date, end: Date): boolean => {
    if (!start) return true;
    
    const current = new Date(start);
    const checkoutDate = end ? new Date(end) : new Date(start);
    
    // ✅ Controlla dal check-in (incluso) al giorno PRIMA del check-out
    // Se stesso giorno (10→10), controlla solo il 10
    while (current <= checkoutDate) {
      // Se è il giorno di check-out E non è lo stesso del check-in, skippa
      const isSameDay = 
        start.getDate() === checkoutDate.getDate() &&
        start.getMonth() === checkoutDate.getMonth() &&
        start.getFullYear() === checkoutDate.getFullYear();
      
      const isCheckoutDay =
        current.getDate() === checkoutDate.getDate() &&
        current.getMonth() === checkoutDate.getMonth() &&
        current.getFullYear() === checkoutDate.getFullYear();
      
      // Se è check-out e NON è stesso giorno, skippa (restituisci mattina)
      if (isCheckoutDay && !isSameDay) {
        break; // Finito, non controllare check-out
      }
      
      // Controlla se questa data è in bookedDates
      const isBooked = bookedDates.some(bookedDate => {
        return (
          bookedDate.getFullYear() === current.getFullYear() &&
          bookedDate.getMonth() === current.getMonth() &&
          bookedDate.getDate() === current.getDate()
        );
      });
      
      if (isBooked) {
        return false; // ❌ Anche solo UN giorno occupato = blocca tutto
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    return true; // ✅ Tutte le date sono libere
  };

  const handleBookingClick = () => {
    if (!currentUser) {
      alert("Devi accedere per prenotare.");
      return;
    }
    
    // ✅ BLOCCO: Non puoi prenotare il tuo stesso annuncio
    if (currentUser.id === listing.hostId) {
      alert("❌ Non puoi prenotare il tuo stesso annuncio!");
      return;
    }
    
    if (!startDate) {
      setIsCalendarOpen(true);
      return;
    }
    
    // ✅ CONTROLLO DISPONIBILITÀ: tutte le date devono essere libere
    if (!isRangeAvailable(startDate, endDate || startDate)) {
      alert("❌ Date non disponibili!\n\nAlcuni giorni nel periodo selezionato sono già prenotati.\nScegli altre date o prenota solo i giorni liberi.");
      return;
    }
    
    setShowPaymentModal(true);
  };

  // ✅ CALCOLO WALLET CON SALDI SEPARATI
  // 1. Prima usa refundBalance (100% flessibile su tutto)
  // 2. Poi usa referralBalance (max X% sulle commissioni rimanenti)
  const totalWalletAvailable = refundBalance + referralBalance;
  
  // Calcola quanto usare
  let walletUsedEur = 0;
  if (useWallet && currentUser && total > 0) {
    // Prima usa il credito rimborsi (può coprire tutto)
    const refundUsed = Math.min(refundBalance, total);
    const remainingAfterRefund = total - refundUsed;
    
    // Poi usa il credito referral (max X% delle commissioni)
    const maxReferralUsable = (serviceFee * maxCreditUsagePercent) / 100;
    const referralUsed = Math.min(referralBalance, maxReferralUsable, remainingAfterRefund);
    
    walletUsedEur = refundUsed + referralUsed;
  }
  
  const remainingToPay = total - walletUsedEur;

  const startDateIso = startDate ? startDate.toISOString() : "";
  const endDateIso = endDate ? endDate.toISOString() : startDateIso;

  // 🔗 DOPO IL PAGAMENTO: Solo aggiorna wallet (il webhook crea la prenotazione)
  const handlePaymentSuccess = async () => {
    if (!currentUser) {
      console.warn("Nessun utente loggato.");
      return;
    }

    try {
      // ✅ Il webhook ha già creato la prenotazione
      // Dobbiamo solo aggiornare il wallet locale per riflettere l'uso del credito
      console.log("✅ Prenotazione creata dal webhook, aggiornamento wallet locale...");
      
      onPaymentSuccess(total, walletUsedEur);
    } catch (err) {
      console.error("Errore durante l'aggiornamento post-pagamento:", err);
    }
  };

  return (
    <div className="bg-white min-h-screen pb-12 relative font-sans">
      {/* Navbar Placeholder */}
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
          
          {/* Pulsanti azioni: Preferiti + Condividi */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {currentUser && (
              <FavoriteButton 
                listingId={listing.id} 
                userId={currentUser.id}
                variant="detail"
              />
            )}
            <ShareButton
              listingId={listing.id}
              listingTitle={listing.title}
            />
          </div>
        </div>
      </div>

      {/* Main Detail Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
       {/* 1. PHOTO GALLERY */}
<div className="relative">
  <PhotoGallery images={listing.images} />
</div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-8">
          {/* LEFT CONTENT */}
          <div className="lg:col-span-2 space-y-8">
            <div className="border-b border-gray-100 pb-6">
              {/* 2. LISTING BADGES */}
              <ListingBadges listing={listing} />

              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {listing.title}
              </h1>
              
              <div className="flex items-center text-gray-600 text-sm">
                <span className="font-semibold flex items-center text-gray-900 mr-1">
                  <Star className="w-4 h-4 fill-current mr-1" />{" "}
                  {listing.rating || "New"}
                </span>
                <span className="mx-2">·</span>
                <span className="underline">
                  {listing.reviewCount} recensioni
                </span>
                <span className="mx-2">·</span>
                <span className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" /> {listing.location}
                </span>
              </div>
            </div>

            {/* 3. HOST INFO */}
            <HostInfo owner={owner || undefined} onHostClick={onHostClick} />

            {/* Description & Features */}
            <div className="py-4 space-y-6 border-b border-gray-100 pb-8">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>

              <div>
                <h3 className="font-bold text-gray-900 mb-4">Cosa troverai</h3>
                <div className="grid grid-cols-2 gap-4">
                  {listing.features.map((f, i) => (
                    <div key={i} className="flex items-center text-gray-600">
                      <Check className="w-5 h-5 mr-3 text-gray-400" /> {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. RULES & POLICIES */}
            <RulesAndPolicies
              rules={listing.rules}
              cancellationPolicy={listing.cancellationPolicy}
              deposit={listing.deposit}
              openingHours={(listing as any).openingHours}
            />

            {/* 5. MAP SECTION */}
            <MapSection
              location={listing.location}
              coordinates={listing.coordinates}
              category={listing.category}
              zoneDescription={(listing as any).zoneDescription}
            />

            {/* 6. REVIEWS SECTION */}
            <ReviewsSection
              listingId={listing.id}
              onRenterClick={onRenterClick}
            />
          </div>

          {/* RIGHT WIDGET (Booking) */}
          <div className="lg:col-span-1 relative">
            <div className="sticky top-28 border border-gray-200 rounded-2xl shadow-xl p-6 bg-white z-30">
              {/* Price Header */}
              <div className="flex justify-between items-end mb-6">
                <div>
                  <span className="text-2xl font-bold text-gray-900">
                    €{listing.price}
                  </span>
                  <span className="text-gray-500"> / {listing.priceUnit}</span>
                </div>
                <div className="text-sm text-gray-500 underline cursor-pointer">
                  {listing.reviewCount} recensioni
                </div>
              </div>

              {/* WIDGET INPUTS */}
              <div className="border border-gray-400 rounded-xl overflow-visible mb-4 relative bg-white">
                {/* Date Section */}
                <div
                  className="grid grid-cols-2 border-b border-gray-400"
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                >
                  <div className="p-3 border-r border-gray-400 cursor-pointer hover:bg-gray-50 transition-colors relative rounded-tl-xl">
                    <p className="text-[10px] font-bold uppercase text-gray-800">
                      Check-in
                    </p>
                    <p
                      className={`text-sm truncate ${
                        startDate ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {formatDate(startDate)}
                    </p>
                  </div>
                  <div className="p-3 cursor-pointer hover:bg-gray-50 transition-colors relative rounded-tr-xl">
                    <p className="text-[10px] font-bold uppercase text-gray-800">
                      Check-out
                    </p>
                    <p
                      className={`text-sm truncate ${
                        endDate ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {formatDate(endDate)}
                    </p>
                  </div>
                </div>

                {/* ✅ CALENDAR POPOVER - RIPRISTINATO */}
                {isCalendarOpen && (
                  <div
                    ref={calendarRef}
                    className="absolute top-0 right-0 z-50 origin-top-right -mt-2"
                  >
                    <div className="w-[340px] md:w-[620px]">
                      <AirbnbCalendar
                        selectedStart={startDate}
                        selectedEnd={endDate}
                        onChange={handleCalendarChange}
                        disabledDates={disabledDates}
                        location={listing.location}
                        onClose={() => setIsCalendarOpen(false)}
                      />
                    </div>
                  </div>
                )}

                {/* Guests + Orari per SPAZI */}
                {listing.category === "spazio" && (
                  <>
                    <div className="p-3 border-b border-gray-400 cursor-pointer hover:bg-gray-50 transition-colors flex justify-between items-center">
                      <div className="flex-1">
                        <p className="text-[10px] font-bold uppercase text-gray-800 mb-1">
                          Ospiti
                        </p>
                        <input
                          type="number"
                          min="1"
                          value={guests}
                          onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-20 text-sm text-gray-900 font-medium border-none p-0 focus:ring-0 bg-transparent"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div
                        className="flex items-center space-x-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setGuests(Math.max(1, guests - 1))}
                          className={`p-1 rounded-full border ${
                            guests === 1
                              ? "border-gray-200 text-gray-300"
                              : "border-gray-400 text-gray-600 hover:border-black"
                          }`}
                          disabled={guests <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setGuests(guests + 1)}
                          className="p-1 rounded-full border border-gray-400 text-gray-600 hover:border-black"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 hover:bg-gray-50 rounded-b-xl">
                      <div className="w-full">
                        <p className="text-[10px] font-bold uppercase text-gray-800 mb-2">
                          Orario
                        </p>
                        <div className="flex items-center gap-3 text-sm">
                          {/* Custom Dropdown Check-In */}
                          <div className="flex-1 relative">
                            <button
                              onClick={() => {
                                setIsCheckInOpen(!isCheckInOpen);
                                setIsCheckOutOpen(false);
                              }}
                              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-center text-gray-900 font-medium hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-colors"
                            >
                              {checkInTime}
                            </button>
                            {isCheckInOpen && (
                              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-[160px] overflow-y-auto">
                                {timeOptions.slice(0, -1).map((t) => (
                                  <div
                                    key={t}
                                    onClick={() => {
                                      setCheckInTime(t);
                                      setIsCheckInOpen(false);
                                      // Auto-aggiusta check-out se necessario
                                      if (parseInt(t) >= parseInt(checkOutTime)) {
                                        const nextHour = parseInt(t.split(":")[0]) + 1;
                                        if (nextHour <= 23) {
                                          setCheckOutTime(`${nextHour < 10 ? "0" + nextHour : nextHour}:00`);
                                        }
                                      }
                                    }}
                                    className={`px-3 py-2 text-center cursor-pointer hover:bg-blue-50 transition-colors ${
                                      checkInTime === t ? "bg-blue-100 font-semibold" : ""
                                    }`}
                                  >
                                    {t}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <span className="text-gray-400 font-medium">-</span>

                          {/* Custom Dropdown Check-Out */}
                          <div className="flex-1 relative">
                            <button
                              onClick={() => {
                                setIsCheckOutOpen(!isCheckOutOpen);
                                setIsCheckInOpen(false);
                              }}
                              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-center text-gray-900 font-medium hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-colors"
                            >
                              {checkOutTime}
                            </button>
                            {isCheckOutOpen && (
                              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-[160px] overflow-y-auto">
                                {timeOptions.map((t) => (
                                  <div
                                    key={t}
                                    onClick={() => {
                                      if (parseInt(t) > parseInt(checkInTime)) {
                                        setCheckOutTime(t);
                                        setIsCheckOutOpen(false);
                                      }
                                    }}
                                    className={`px-3 py-2 text-center cursor-pointer transition-colors ${
                                      parseInt(t) <= parseInt(checkInTime)
                                        ? "text-gray-300 cursor-not-allowed"
                                        : checkOutTime === t
                                        ? "bg-blue-100 font-semibold hover:bg-blue-50"
                                        : "hover:bg-blue-50"
                                    }`}
                                  >
                                    {t}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Ore per OGGETTI ad ore */}
                {listing.priceUnit === "ora" &&
                  listing.category === "oggetto" && (
                    <div className="p-3 cursor-pointer hover:bg-gray-50 transition-colors flex justify-between items-center rounded-b-xl">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-gray-800">
                          Ore
                        </p>
                        <p className="text-sm text-gray-900">{hours} ore</p>
                      </div>
                      <div
                        className="flex items-center space-x-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setHours(Math.max(1, hours - 1))}
                          className="p-1 rounded-full border border-gray-400 text-gray-600 hover:border-black"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setHours(hours + 1)}
                          className="p-1 rounded-full border border-gray-400 text-gray-600 hover:border-black"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
              </div>

              {/* ✅ Toggle wallet CON SALDI SEPARATI */}
              {currentUser && (
                <div className="text-sm text-gray-600 mb-3">
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={useWallet}
                      onChange={(e) => setUseWallet(e.target.checked)}
                    />
                    <span>Usa credito wallet</span>
                  </label>
                  <div className="pl-6 space-y-1 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>💰 Credito Rimborsi:</span>
                      <span>€{refundBalance.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🎁 Credito Invita Amico:</span>
                      <span>€{referralBalance.toFixed(2)} <span className="text-gray-400">(max {maxCreditUsagePercent}% comm.)</span></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Pulsante principale */}
              {currentUser?.id === listing.hostId ? (
                // Messaggio se è il proprio annuncio
                <div className="w-full bg-gray-100 text-gray-600 font-bold py-3.5 rounded-xl text-lg text-center mb-4 border-2 border-gray-200">
                  ✋ Questo è il tuo annuncio
                </div>
              ) : (
                <button
                  onClick={handleBookingClick}
                  className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3.5 rounded-xl text-lg shadow-md transition-all mb-4"
                >
                  {duration ? "Prenota" : "Verifica disponibilità"}
                </button>
              )}

              {/* Riepilogo costi */}
              {duration > 0 && (
                <>
                  <p className="text-center text-sm text-gray-500 mb-6">
                    Paga nella schermata successiva in modo sicuro con Stripe.
                  </p>

                  <div className="space-y-3 text-gray-600">
                    <div className="flex justify-between underline decoration-gray-300">
                      <span>
                        €{listing.price} x {duration} {unitLabel}
                      </span>
                      <span>€{subtotal.toFixed(2)}</span>
                    </div>
                    {Number(listing.cleaningFee) > 0 && (
                      <div className="flex justify-between underline decoration-gray-300">
                        <span>Costo pulizia</span>
                        <span>€{Number(listing.cleaningFee).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between underline decoration-gray-300">
                      <span>Costi del servizio Renthubber</span>
                      <span>€{serviceFee.toFixed(2)}</span>
                    </div>
                    {Number(listing.deposit) > 0 && (
                      <div className="flex justify-between underline decoration-gray-300">
                        <span>Cauzione (rimborsabile)</span>
                        <span>€{Number(listing.deposit).toFixed(2)}</span>
                      </div>
                    )}
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
        </div>

        {/* 7. RELATED LISTINGS (Bottom) */}
        <div className="mt-16 pt-12 border-t border-gray-200">
          <RelatedListingsSection category={listing.category} />
        </div>
      </div>

      {/* 🔹 Stripe Booking Modal - PASSA I VALORI CORRETTI */}
      {currentUser && startDate && (
        <BookingPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          renter={currentUser}
          listing={listing}
          startDate={startDateIso}
          endDate={endDateIso}
          totalAmountEur={total}
          rentalAmountEur={subtotal}
          platformFeeEur={serviceFee}
          depositEur={Number(listing.deposit) || 0}
          cleaningFeeEur={Number(listing.cleaningFee) || 0}
          walletUsedEur={walletUsedEur}
          onSuccess={async () => {
            await handlePaymentSuccess();
            setShowPaymentModal(false);
            alert("Prenotazione confermata con successo!");
            onBack();
          }}
        />
      )}
    </div>
  );
};