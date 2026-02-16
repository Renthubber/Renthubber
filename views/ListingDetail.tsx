import React, { useState, useEffect, useRef, useMemo } from "react";
import { format } from 'date-fns';
import { Listing, SystemConfig, User } from "../types";
import {
  Star,
  MapPin,
  Check,
  ChevronLeft,
  Minus,
  Plus,
  MessageSquare,
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
import { calendarBlocksApi } from '../services/calendarBlocksApi';
import { BookingPaymentModal } from "../components/BookingPaymentModal";
import { referralApi } from "../services/referralApi";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from 'react-router-dom';
import { calculateHubberFixedFee, calculateRenterFixedFee } from '../utils/feeUtils';
import { getAvatarUrl } from '../utils/avatarUtils';


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
  const [generalBalance, setGeneralBalance] = useState(0);   // Wallet generale (100% utilizzo)
  const [referralBalance, setReferralBalance] = useState(0); // Credito Invita Amico (max 30% commissioni)
  const [refundBalance, setRefundBalance] = useState(0);     // Credito Rimborsi (100% flessibile)

  // ✅ Override commissioni personalizzate
  const [feeOverride, setFeeOverride] = useState<{
    fees_disabled: boolean;
    custom_renter_fee: number | null;
    custom_hubber_fee: number | null;
  } | null>(null);

  // ✅ Carica override commissioni per utente corrente
  useEffect(() => {
    const loadFeeOverride = async () => {
      if (!currentUser?.id) return;
      try {
        const { data } = await supabase.rpc('get_active_fee_override', { p_user_id: currentUser.id });
        const override = Array.isArray(data) ? data[0] : data;
        if (override?.custom_renter_fee !== undefined || override?.custom_hubber_fee !== undefined || override?.fees_disabled) setFeeOverride(override);
      } catch (err) {
        console.error('Errore caricamento fee override:', err);
      }
    };
    loadFeeOverride();
  }, [currentUser?.id]);

  useEffect(() => {
    const loadFees = async () => {
      try {
        const fees = await api.admin.getFees();
        if (fees) {
          setPlatformFees(fees);
  
        }
        
        // Carica anche settings referral per il limite wallet
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
          .select("balance_cents, referral_balance_cents, refund_balance_cents")
          .eq("user_id", currentUser.id)
          .single();
        
        if (error) {
          console.log("Wallet non trovato, uso valori di default");
          return;
        }
        
        if (wallet) {
          setGeneralBalance((wallet.balance_cents || 0) / 100);
          setReferralBalance((wallet.referral_balance_cents || 0) / 100);
          setRefundBalance((wallet.refund_balance_cents || 0) / 100);
          console.log("✅ Saldi wallet caricati:", {
            general: (wallet.balance_cents || 0) / 100,
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

  // ✅ Date bloccate manualmente dall'hubber
const [blockedDates, setBlockedDates] = useState<Date[]>([]);

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

  // ✅ Slot orari occupati per la data selezionata
const [bookedTimeSlots, setBookedTimeSlots] = useState<string[]>([]); // Slot dove NON puoi INIZIARE
const [bookedEndTimeSlots, setBookedEndTimeSlots] = useState<string[]>([]); // Slot dove NON puoi FINIRE
  
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
  // Prima controlla override utente, poi fee standard
 const renterFeePercentage = feeOverride?.fees_disabled 
    ? 0 
    : feeOverride?.custom_renter_fee ?? platformFees?.renterPercentage ?? systemConfig?.fees?.platformPercentage ?? 10;
  const hubberFeePercentage = feeOverride?.fees_disabled 
    ? 0 
    : feeOverride?.custom_hubber_fee ?? platformFees?.hubberPercentage ?? 10;
  const superHubberFeePercentage = platformFees?.superHubberPercentage ?? 5;

  // ✅ Determina se l'hubber è SuperHubber (commissione ridotta)
  const isOwnerSuperHubber = owner?.isSuperHubber ?? false;
  const actualHubberFeePercentage = isOwnerSuperHubber ? superHubberFeePercentage : hubberFeePercentage;

 // Opzioni orari ogni 30 minuti (08:00 - 23:30)
const timeOptions = useMemo(() => {
  const slots: string[] = [];
  for (let hour = 8; hour <= 23; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 23) {
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }
  slots.push('23:30');
  return slots;
}, []);

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
        // ✅ SKIPPA le prenotazioni a ore (hanno start_time e end_time)
        // Quelle occupano solo slot orari, non l'intera giornata
        if (booking.startTime && booking.endTime) {
          console.log('⏭️ Skip prenotazione a ore:', booking.startDate, booking.startTime, '-', booking.endTime);
          return;
        }
        
        const start = new Date(booking.startDate);
        const end = new Date(booking.endDate);
        
        // Aggiungi tutte le date tra start e end (incluse)
        const current = new Date(start);
        while (current < end) {
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

// ✅ CARICA DATE BLOCCATE DALL'HUBBER
useEffect(() => {
  const loadBlockedDates = async () => {
    try {
      const blocksData = await calendarBlocksApi.getByListingId(listing.id);
      const allBlockedDates: Date[] = [];
      
      blocksData.forEach((block) => {
        const start = new Date(block.startDate);
        const end = new Date(block.endDate);
        
        // Aggiungi tutte le date tra start e end (incluse)
        const current = new Date(start);
        while (current < end) {
          allBlockedDates.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }
      });
      
      setBlockedDates(allBlockedDates);
      console.log("🚫 Date bloccate caricate:", allBlockedDates.length);
    } catch (err) {
      console.error("Errore caricamento date bloccate:", err);
    }
  };
  
  if (listing.id) {
    loadBlockedDates();
  }
}, [listing.id]);

  // ✅ CARICA SLOT ORARI OCCUPATI per la data selezionata
useEffect(() => {
  const loadBookedTimeSlots = async () => {
    console.log('🔍 loadBookedTimeSlots chiamato', {
      startDate,
      category: listing.category,
      priceUnit: listing.priceUnit
    });
    
    if (!startDate || listing.category !== 'spazio' || listing.priceUnit !== 'ora') {
      console.log('⏭️ Skip: condizioni non soddisfatte');
      return;
    }
    
    try {
      const bookings = await api.bookings.getByListingId(listing.id);
      console.log('📥 Bookings ricevuti:', bookings);
      
      const bookedSlots: string[] = [];
      const bookedEndSlots: string[] = [];
      const selectedDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      console.log('📅 Data selezionata (ISO):', selectedDateStr);
      
      bookings.forEach((booking: any) => {
        const bookingDateStr = new Date(booking.startDate).toISOString().split('T')[0];
        console.log('🔍 Confronto date:', { bookingDateStr, selectedDateStr, match: bookingDateStr === selectedDateStr });
        
       if (bookingDateStr === selectedDateStr) {
  console.log('✅ Match! StartTime:', booking.startTime, 'EndTime:', booking.endTime);
  if (booking.startTime && booking.endTime) {
    // Genera tutti gli slot tra start e end
    const startH = parseInt(booking.startTime.split(':')[0]);
    const startM = parseInt(booking.startTime.split(':')[1]);
    const endH = parseInt(booking.endTime.split(':')[0]);
    const endM = parseInt(booking.endTime.split(':')[1]);
    
    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    while (currentMinutes < endMinutes) {
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      bookedSlots.push(timeStr);
      currentMinutes += 30; // Incremento di 30 minuti
    }
    // Genera gli slot per NON FINIRE (esclude start, include end)
    currentMinutes = startH * 60 + startM + 30; // Parti dal primo slot DOPO lo start
   while (currentMinutes <= endMinutes) {
  const h = Math.floor(currentMinutes / 60);
  const m = currentMinutes % 60;
  const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  bookedEndSlots.push(timeStr);
  currentMinutes += 30;
 }
  }
}
});
      
setBookedTimeSlots(bookedSlots);
setBookedEndTimeSlots(bookedEndSlots);
    } catch (err) {
      console.error('Errore caricamento slot orari:', err);
    }
  };

  loadBookedTimeSlots();
}, [startDate, listing.id, listing.category, listing.priceUnit]);

  // Date disabilitate = date già prenotate + date bloccate dall'hubber
const disabledDates = [...bookedDates, ...blockedDates];

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
const renterFixedFee = calculateRenterFixedFee(completeSubtotal);
const renterTotalFee = renterVariableFee + renterFixedFee;

// ✅ CALCOLO COMMISSIONI HUBBER (sul subtotale completo)
const hubberVariableFee = (completeSubtotal * actualHubberFeePercentage) / 100;
const hubberFixedFee = calculateHubberFixedFee(completeSubtotal);
const hubberTotalFee = hubberVariableFee + hubberFixedFee;
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
  
  // ✅ CONTROLLO SLOT ORARI per spazi a ore
  if (listing.category === 'spazio' && listing.priceUnit === 'ora') {
    if (!checkInTime || !checkOutTime) {
      alert("❌ Seleziona gli orari di inizio e fine!");
      return;
    }
    
    // Genera tutti gli slot tra check-in e check-out
    const startH = parseInt(checkInTime.split(':')[0]);
    const startM = parseInt(checkInTime.split(':')[1]);
    const endH = parseInt(checkOutTime.split(':')[0]);
    const endM = parseInt(checkOutTime.split(':')[1]);
    
    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    const selectedSlots: string[] = [];
    while (currentMinutes < endMinutes) {
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      selectedSlots.push(timeStr);
      currentMinutes += 30;
    }
    
    // Controlla se qualche slot è già occupato
    const hasConflict = selectedSlots.some(slot => bookedTimeSlots.includes(slot));
    
    if (hasConflict) {
      alert("❌ Orari non disponibili!\n\nAlcuni slot nel periodo selezionato sono già prenotati.\nScegli altri orari.");
      return;
    }
  }
  
  // ✅ CONTROLLO DISPONIBILITÀ DATE: tutte le date devono essere libere
  if (!isRangeAvailable(startDate, endDate || startDate)) {
    alert("❌ Date non disponibili!\n\nAlcuni giorni nel periodo selezionato sono già prenotati.\nScegli altre date o prenota solo i giorni liberi.");
    return;
  }
  
  setShowPaymentModal(true);
};

  const handleContactHubber = () => {
  // Se non sei loggato, vai al login con redirect
  if (!currentUser) {
    const currentPath = window.location.pathname;
    navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
    return;
  }
  
  // Se sei loggato, vai ai messaggi con parametri per aprire chat
  navigate(`/messages?listing=${listing.id}&hubber=${listing.hostId}`);
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
    const remainingAfterReferral = remainingAfterRefund - referralUsed;
    
    // Infine usa il wallet generale (può coprire tutto)
    const generalUsed = Math.min(generalBalance, remainingAfterReferral);
    
    walletUsedEur = refundUsed + referralUsed + generalUsed;
  }
  
  const remainingToPay = total - walletUsedEur;

  const startDateIso = startDate ? format(startDate, 'yyyy-MM-dd') : "";
 const endDateIso = endDate ? format(endDate, 'yyyy-MM-dd') : startDateIso;

  // 🔗 DOPO IL PAGAMENTO: Solo aggiorna wallet (il webhook crea la prenotazione)
  const handlePaymentSuccess = async () => {
    if (!currentUser) {
      console.warn("Nessun utente loggato.");
      return;
    }

    try {
      // ✅ Il webhook ha già creato la prenotazione
      // Dobbiamo solo aggiornare il wallet locale per riflettere l'uso del credito
      
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
            <FavoriteButton 
              listingId={listing.id} 
              userId={currentUser?.id}
              variant="detail"
            />
            <ShareButton
              listingId={listing.id}
              listingTitle={listing.title}
            />
          </div>
        </div>
      </div>

      {/* Main Detail Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
       
       {/* TITOLO SOPRA LE FOTO */}
       <div className="mb-6 mt-2">
         <h1 className="text-3xl font-bold text-gray-900">
           {listing.title}
         </h1>
       </div>

       {/* 1. PHOTO GALLERY */}
<div className="relative">
  <PhotoGallery images={listing.images} />
</div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-8">
          {/* LEFT CONTENT */}
          <div className="lg:col-span-2 space-y-4">
            <div className="pb-2">
              {/* 2. LISTING BADGES */}
              <ListingBadges listing={listing} />
              
              <div className="flex items-center text-gray-600 text-sm mt-4">
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
              <p className="text-gray-700 leading-relaxed whitespace-pre-line break-words">
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
             closingHours={(listing as any).closingHours}
             category={listing.category}
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
  <>
    {/* Overlay per chiudere al click fuori */}
    <div 
      className="fixed inset-0 z-40" 
      onClick={() => setIsCheckInOpen(false)}
    />
    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-[160px] overflow-y-auto">
      {timeOptions.slice(0, -1).map((t) => {
        const isBooked = bookedTimeSlots.includes(t);
        return (
          <div
            key={t}
            onClick={() => {
              if (isBooked) return;
              setCheckInTime(t);
              setIsCheckInOpen(false);
              if (parseInt(t) >= parseInt(checkOutTime)) {
                const nextHour = parseInt(t.split(":")[0]) + 1;
                if (nextHour <= 23) {
                  setCheckOutTime(`${nextHour < 10 ? "0" + nextHour : nextHour}:00`);
                }
              }
            }}
            className={`px-3 py-2 text-center transition-colors ${
              isBooked 
                ? "bg-gray-100 text-gray-300 cursor-not-allowed" 
                : checkInTime === t 
                  ? "bg-blue-100 font-semibold cursor-pointer hover:bg-blue-50" 
                  : "cursor-pointer hover:bg-blue-50"
            }`}
          >
            {t} {isBooked && 'PRENOTATO'}
          </div>
        );
      })}
    </div>
  </>
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
    <>
      {/* Overlay per chiudere al click fuori */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={() => setIsCheckOutOpen(false)}
      />
      <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-[160px] overflow-y-auto">
        {timeOptions.map((t) => {
          const isBooked = bookedEndTimeSlots.includes(t);
          const isTooEarly = parseInt(t) <= parseInt(checkInTime);
          const isDisabled = isBooked || isTooEarly;
          return (
            <div
              key={t}
              onClick={() => {
                if (isDisabled) return;
                setCheckOutTime(t);
                setIsCheckOutOpen(false);
              }}
              className={`px-3 py-2 text-center transition-colors ${
                isDisabled
                  ? "text-gray-300 cursor-not-allowed bg-gray-50"
                  : checkOutTime === t
                  ? "bg-blue-100 font-semibold hover:bg-blue-50 cursor-pointer"
                  : "hover:bg-blue-50 cursor-pointer"
              }`}
            >
              {t} {isBooked && ' PRENOTATO'}
            </div>
          );
        })}
      </div>
    </>
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

              {/* Pulsante principale */}
              {currentUser?.id === listing.hostId ? (
                // Messaggio se è il proprio annuncio
                <div className="w-full bg-gray-100 text-gray-600 font-bold py-3.5 rounded-xl text-lg text-center mb-4 border-2 border-gray-200">
                  ✋ Questo è il tuo annuncio
                </div>
             ) : (
  <>
   <button
  onClick={handleContactHubber}
  className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl text-base shadow-sm border-2 border-gray-200 transition-all mb-3"
>
  Contatta l'hubber
</button>
    <button
      onClick={handleBookingClick}
      className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3.5 rounded-xl text-lg shadow-md transition-all mb-4"
    >
      {duration ? "Prenota" : "Verifica disponibilità"}
    </button>
  </>
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
                    
                    {(() => {
  // Calcola commissione variabile e fee fissa separate
  const completeSubtotal = subtotal + (Number(listing.cleaningFee) || 0);
  const variableFee = (completeSubtotal * renterFeePercentage) / 100;
  const fixedFee = calculateRenterFixedFee(completeSubtotal);
  
  return (
    <>
      <div className="flex justify-between underline decoration-gray-300">
        <span>Commissione servizio ({renterFeePercentage}%)</span>
        <span>€{variableFee.toFixed(2)}</span>
      </div>
      <div className="flex justify-between underline decoration-gray-300">
        <span>Fee fissa piattaforma</span>
        <span>€{fixedFee.toFixed(2)}</span>
      </div>
    </>
  );
})()}
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
  );
};