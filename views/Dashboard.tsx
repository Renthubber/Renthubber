import React, { useState, useEffect, useRef } from 'react';
import { User, BookingRequest, ActiveMode, Invoice } from '../types';
import { RenterFavorites } from '../components/RenterFavorites';
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Clock,
  Package,
  MapPin,
  FileText,
  Download,
  CheckCircle2,
  ShieldCheck,
  Upload,
  Lock,
  X,
  Edit3,
  AlertTriangle,
  Star,
  Heart,
  Gift,
  ArrowRight,
  Loader2,
  Trash2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MOCK_REQUESTS } from '../constants';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';
import { AirbnbCalendar } from '../components/AirbnbCalendar';
import { WriteReviewModal } from '../components/WriteReviewModal';
import { HubberCalendar } from '../components/hubber/HubberCalendar';
import { ICalManager } from '../components/hubber/ICalManager';
import { BillingDataSection } from '../components/BillingDataSection';

// Mock Data for Charts (rimane fittizio per ora)
type UserTypeOption =
  | 'privato'
  | 'ditta_individuale'
  | 'societa'
  | 'associazione';

type HubberBookingFilter = 'all' | 'pending' | 'accepted' | 'completed' | 'rejected' | 'cancelled';
interface CalendarBooking {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage?: string;
  startDate: string;
  endDate: string;
  status: string;
  renterName?: string;
  renterAvatar?: string;
  renterId?: string;
  totalPrice?: number;
  netEarnings?: number;
}

interface ImportedCalendar {
  id: string;
  name: string;
  url: string;
  lastSync?: string;
  eventsCount?: number;
  status: 'active' | 'error' | 'syncing';
  errorMessage?: string;
}

/* ------------------------------------------------------
   HELPER: mapping booking DB -> BookingRequest (UI)
   Usa i dati di Supabase e li adatta alla struttura
   che la dashboard già si aspetta (dates, totalPrice, ecc.)
   
   CALCOLO CORRETTO:
   - amount_total = quanto paga il renter (prezzo + commissioni renter)
   - platform_fee = commissione trattenuta all'hubber
   - hubber_net_amount = netto che riceve l'hubber
   - Prezzo base = hubber_net_amount + platform_fee
-------------------------------------------------------*/
const mapDbBookingToUiBooking = (raw: any): BookingRequest => {
  const formatDate = (dStr?: string) => {
    if (!dStr) return '';
    const d = new Date(dStr);
    if (Number.isNaN(d.getTime())) return dStr;
    return d.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const start = raw.startDate || raw.start_date;
  const end = raw.endDate || raw.end_date;
  const dates =
    start && end
      ? `${formatDate(start)} - ${formatDate(end)}`
      : start
      ? formatDate(start)
      : '';

  // amount_total = quanto paga il renter (prezzo base + commissioni renter)
  const renterTotalPaid =
    typeof raw.amountTotal === 'number'
      ? raw.amountTotal
      : typeof raw.amount_total === 'number'
      ? raw.amount_total
      : raw.totalPrice || 0;

  // platform_fee = commissione trattenuta all'hubber (es. €2.50)
  const hubberCommission =
    typeof raw.platformFee === 'number'
      ? raw.platformFee
      : typeof raw.platform_fee === 'number'
      ? raw.platform_fee
      : raw.commission || 0;

  // hubber_net_amount = netto che riceve l'hubber (es. €2.50)
  const netEarnings =
    typeof raw.hubberNetAmount === 'number'
      ? raw.hubberNetAmount
      : typeof raw.hubber_net_amount === 'number'
      ? raw.hubber_net_amount
      : raw.netEarnings || 0;

  // ✅ cleaning_fee = costo pulizia (es. €5.00)
  const cleaningFee =
    typeof raw.cleaningFee === 'number'
      ? raw.cleaningFee
      : typeof raw.cleaning_fee === 'number'
      ? raw.cleaning_fee
      : 0;

      // ✅ deposit = cauzione (es. €100.00)
const deposit =
  typeof raw.deposit === 'number'
    ? raw.deposit
    : 0;

  // ✅ Prezzo base dell'oggetto = netto hubber + commissione hubber
  // Esempio: €2.50 (netto) + €2.50 (comm) = €5.00 (prezzo base)
  const baseRentalPrice = netEarnings + hubberCommission;

  return {
    // campi "core" della richiesta già usati dalla UI
    id: raw.id,
    hostId: raw.hubberId || raw.hostId || raw.hubber_id || '',
    renterId: raw.renterId || raw.renter_id || (raw as any).renterId,
    listingId: raw.listingId || raw.listing_id || '',
    dates,
    // ✅ NUOVO: date originali per modifica prenotazione
    start_date: start,
    end_date: end,
    listingTitle:
      (raw as any).listingTitle ||
      `Prenotazione #${String(raw.id || '').slice(0, 6)}`,
    listingImage:
      (raw as any).listingImage ||
      'https://picsum.photos/seed/renthubber-booking/160/120',
    renterName: (raw as any).renterName || 'Renter',
    renterAvatar:
      (raw as any).renterAvatar ||
      'https://ui-avatars.com/api/?name=Renter&background=random',
      // ✅ NUOVO: Info Hubber
    hubberName: (raw as any).hubberName || 'Proprietario',
    hubberAvatar:
      (raw as any).hubberAvatar ||
      'https://ui-avatars.com/api/?name=Hubber&background=random',
    timeLeft: (raw as any).timeLeft || '',

    // ✅ Per l'hubber: mostriamo il prezzo base (€5), non il totale pagato dal renter (€7.50)
    totalPrice: baseRentalPrice,      // Prezzo base dell'oggetto (per hubber)
    
    // ✅ NUOVO: Totale pagato dal renter (per modale modifica e dettaglio)
    renterTotalPaid: renterTotalPaid, // Totale effettivo pagato dal renter
    
    // ✅ NUOVO: Wallet usato
    walletUsedCents: raw.walletUsedCents || raw.wallet_used_cents || 0,
    
    // ✅ NUOVO: Prezzo listing per calcoli dettaglio
    listingPrice: raw.listingPrice || 0,
    priceUnit: raw.priceUnit || 'giorno',
    
    // ✅ NUOVO: Politica di cancellazione
    cancellationPolicy: raw.cancellationPolicy || 'flexible',
    
    commission: hubberCommission,     // Commissione trattenuta all'hubber
    netEarnings,                      // Netto che riceve l'hubber
    status: raw.status || 'pending',
    cleaningFee,                      // ✅ NUOVO: Costo pulizia
    deposit,                          // ✅ NUOVO: Cauzione
  } as BookingRequest & { 
    start_date?: string; 
    end_date?: string; 
    renterTotalPaid?: number; 
    walletUsedCents?: number;
    listingPrice?: number;
    priceUnit?: string;
    cancellationPolicy?: string;
    cleaningFee?: number;           // ✅ NUOVO
    deposit?: number;  
    hubberName?: string;        // ✅ AGGIUNGI QUESTA
    hubberAvatar?: string;
  };
};

interface DashboardProps {
  user: User;
  activeMode: ActiveMode;
  onManageListings: () => void;
  onBecomeHubber?: () => void;  // ✅ AGGIUNTO: callback per aprire wizard "Diventa Hubber"
  onNavigateToWallet?: () => void;  // ✅ NUOVO: callback per navigare al wallet
  onViewListing?: (listing: any) => void; // ✅ NUOVO: per aprire dettaglio annuncio
  invoices?: Invoice[];
  // Callback opzionale per sincronizzare con Supabase / backend
  onUpdateProfile?: (updated: {
    email?: string;
    phoneNumber?: string;
    userType?: UserTypeOption;
    dateOfBirth?: string;
     bio?: string;
    avatarFile?: File | null;
    // flag per resettare verifiche
    resetEmailVerification?: boolean;
    resetPhoneVerification?: boolean;
    resetIdDocumentVerification?: boolean;

  document_front_url?: string;
  document_back_url?: string;
  idDocumentVerified?: boolean;
  phoneVerified?: boolean;
  emailVerified?: boolean;
}) => Promise<void> | void;
  onViewRenterProfile?: (renter: { id: string; name: string; avatar?: string }) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  activeMode,
  onManageListings,
  onBecomeHubber,  // ✅ AGGIUNTO
  onNavigateToWallet,  // ✅ NUOVO
  onViewListing, // ✅ NUOVO
  invoices = [],
  onUpdateProfile,
  onViewRenterProfile,
}) => {
  // ✅ NUOVO: Gestione caso user undefined (race condition durante login)
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#0A4D68] mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  // --- STATE GENERALE ---
  const [requests, setRequests] = useState<BookingRequest[]>(MOCK_REQUESTS);
  const [loadingBookings, setLoadingBookings] = useState(false); // ✅ solo per debug/estensioni future
  
  // ✅ NUOVO: State per payments reali dal DB
  const [renterPayments, setRenterPayments] = useState<any[]>([]);
  const [hubberPayments, setHubberPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  
 const [activeTab, setActiveTab] = useState<
  'overview' | 'payments' | 'security' | 'profile' | 'bookings' | 'hubber_bookings' | 'calendar'
>('overview');

  // Avatar & input ref per upload immagine
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user.avatar || null
  );
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  // Dati profilo "visibili" (UI)
  const [profileData, setProfileData] = useState(() => {
    const firstName =
      (user as any).firstName ||
      (user.name ? user.name.split(' ')[0] : '') ||
      '';
    const lastName =
      (user as any).lastName ||
      (user.name ? user.name.split(' ').slice(1).join(' ') : '') ||
      '';
    return {
      firstName,
      lastName,
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      userType:
        ((user as any).userType as UserTypeOption | undefined) || 'privato',
      dateOfBirth: (user as any).dateOfBirth || '',
      bio: (user as any).bio || '',
    };
  });
// ✅ Sincronizza profileData quando user cambia
  useEffect(() => {
    console.log("🔍 Dashboard - user.userType:", (user as any).userType);
    console.log("🔍 Dashboard - user completo:", user);
    
    setProfileData({
      firstName: (user as any).firstName || (user.name ? user.name.split(' ')[0] : '') || '',
      lastName: (user as any).lastName || (user.name ? user.name.split(' ').slice(1).join(' ') : '') || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      userType: ((user as any).userType as UserTypeOption | undefined) || 'privato',
      dateOfBirth: (user as any).dateOfBirth || '',
      bio: (user as any).bio || '',
    });
  }, [user]);
  // Preferenze account (solo UI per ora)
  const [preferences, setPreferences] = useState<{
    language: 'it' | 'en';
    emailNotifications: boolean;
    profilePrivacy: 'standard' | 'private' | 'public';
  }>({
    language: 'it',
    emailNotifications: true,
    profilePrivacy: 'standard',
  });

  // Stato per modale e form di modifica profilo
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    email: profileData.email,
    phoneNumber: profileData.phoneNumber,
    userType: profileData.userType as UserTypeOption,
    dateOfBirth: profileData.dateOfBirth,
    bio: profileData.bio,
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Stato per upload documento fronte/retro (solo UI)
  const [idFrontFileName, setIdFrontFileName] = useState<string | null>(null);
  const [idBackFileName, setIdBackFileName] = useState<string | null>(null);

  const [isUploadingFront, setIsUploadingFront] = useState(false);
  const [isUploadingBack, setIsUploadingBack] = useState(false);

  // FILTRI PRENOTAZIONI HUBBER
  const [hubberBookingFilter, setHubberBookingFilter] =
    useState<HubberBookingFilter>('all');
  const [hubberTimeFilter, setHubberTimeFilter] = useState<'current' | 'historical'>('current'); // ✅ NUOVO: filtro temporale
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set()); // ✅ NUOVO: mesi espansi
  const [selectedHubberBookingId, setSelectedHubberBookingId] =
    useState<string | null>(null);
  
  // ✅ NUOVO: filtri temporali pagamenti hubber
  const [hubberPaymentsTimeFilter, setHubberPaymentsTimeFilter] = useState<'current' | 'historical'>('current');
  const [expandedHubberPaymentsMonths, setExpandedHubberPaymentsMonths] = useState<Set<string>>(new Set());
  
  // ✅ NUOVO: filtri temporali fatture hubber (condivisi con pagamenti)
  const [hubberInvoicesTimeFilter, setHubberInvoicesTimeFilter] = useState<'current' | 'historical'>('current');
  const [expandedHubberInvoicesMonths, setExpandedHubberInvoicesMonths] = useState<Set<string>>(new Set());

  // ✅ STATISTICHE HUBBER (dati reali)
  const [hubberStats, setHubberStats] = useState({
    monthlyEarnings: 0,
    activeBookings: 0,
    totalViews: 0,
    avgResponseTime: 0, // in minuti
    earningsHistory: [] as { name: string; value: number }[],
    pendingBookings: 0,
    completedBookings: 0,
    isLoading: true,
  });

  // 💰 Saldo reale da Supabase (invece di user.hubberBalance)
  const [realHubberBalance, setRealHubberBalance] = useState<number>(user.hubberBalance || 0);

  // CANCELLAZIONE PRENOTAZIONI RENTER
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<BookingRequest | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);
  const [refundMethod, setRefundMethod] = useState<'wallet' | 'card'>('wallet'); // Metodo rimborso scelto

  // ✅ CANCELLAZIONE PRENOTAZIONI HUBBER
  const [hubberCancelModalOpen, setHubberCancelModalOpen] = useState(false);
  const [hubberBookingToCancel, setHubberBookingToCancel] = useState<BookingRequest | null>(null);
  const [hubberCancelReason, setHubberCancelReason] = useState("");
  const [isHubberCancelling, setIsHubberCancelling] = useState(false);
  const [hubberCancelError, setHubberCancelError] = useState<string | null>(null);
  const [hubberCancelSuccess, setHubberCancelSuccess] = useState<string | null>(null);

  // MODIFICA PRENOTAZIONI RENTER
  const [modifyModalOpen, setModifyModalOpen] = useState(false);
  const [bookingToModify, setBookingToModify] = useState<BookingRequest | null>(null);
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

  // DETTAGLIO PRENOTAZIONE RENTER
  const [selectedRenterBooking, setSelectedRenterBooking] = useState<BookingRequest | null>(null);
  const [renterTimeFilter, setRenterTimeFilter] = useState<'current' | 'historical'>('current'); // ✅ NUOVO: filtro temporale renter
  const [expandedRenterMonths, setExpandedRenterMonths] = useState<Set<string>>(new Set()); // ✅ NUOVO: mesi espansi renter
  
  // ✅ NUOVO: filtri temporali pagamenti renter
  const [renterPaymentsTimeFilter, setRenterPaymentsTimeFilter] = useState<'current' | 'historical'>('current');
  const [expandedRenterPaymentsMonths, setExpandedRenterPaymentsMonths] = useState<Set<string>>(new Set());
  const [bookingDetailData, setBookingDetailData] = useState<{
    listingPrice: number;
    priceUnit: string;
    days: number;
    basePrice: number;
    cleaningFee: number,
    commission: number;
    fixedFee: number;
    total: number;
    walletUsed: number;
    cardPaid: number;
    cancellationPolicy: string;
    refundInfo: {
      percentage: number;
      amount: number;
      message: string;
    };
  } | null>(null);
  const [loadingBookingDetail, setLoadingBookingDetail] = useState(false);

  // ✅ VERIFICA NUMERO DI TELEFONO
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [phoneStep, setPhoneStep] = useState<'input' | 'otp' | 'success'>('input');
  const [phoneInput, setPhoneInput] = useState(profileData.phoneNumber || '');
  const [otpCode, setOtpCode] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSentTo, setOtpSentTo] = useState('');

  // ✅ VERIFICA/MODIFICA EMAIL
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailStep, setEmailStep] = useState<'input' | 'otp' | 'success'>('input');
  const [emailInput, setEmailInput] = useState(profileData.email || '');
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);
  const [emailOtpSentTo, setEmailOtpSentTo] = useState('');

  // ✅ ELIMINA ACCOUNT
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ✅ CAMBIO PASSWORD
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // PROSSIMA PRENOTAZIONE RENTER (per Panoramica)
  const [nextUpcomingBooking, setNextUpcomingBooking] = useState<{
    id: string;
    listingTitle: string;
    listingImage: string;
    hubberName: string;
    startDate: string;
    endDate: string;
    pickupAddress: string;
    pickupCity: string;
    pickupCode: string;
    status: string;
    daysUntilStart: number;
  } | null>(null);
  const [loadingNextBooking, setLoadingNextBooking] = useState(false);

  // ✅ ANNUNCI VISTI DI RECENTE
  const [recentlyViewed, setRecentlyViewed] = useState<{
    id: string;
    title: string;
    image: string;
    price: number;
    priceUnit: string;
    viewedAt: string;
  }[]>([]);
  // ✅ RECENSIONI
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [bookingToReview, setBookingToReview] = useState<BookingRequest | null>(null);
  const [reviewType, setReviewType] = useState<'renter_to_hubber' | 'hubber_to_renter'>('renter_to_hubber');
  // ✅ CALENDARIO HUBBER
const [calendarBookings, setCalendarBookings] = useState<CalendarBooking[]>([]);
const [loadingCalendar, setLoadingCalendar] = useState(false);
const [icalExportUrl, setICalExportUrl] = useState<string>('');
const [importedCalendars, setImportedCalendars] = useState<ImportedCalendar[]>([]);
// ✅ FATTURE UTENTE (da Supabase)
  const [userInvoices, setUserInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Helper per formattare la politica di cancellazione
  const formatCancellationPolicy = (policy: string): { label: string; description: string; color: string } => {
    switch (policy) {
      case 'flexible':
        return {
          label: 'Flessibile',
          description: 'Rimborso 100% fino a 24h prima',
          color: 'text-green-600 bg-green-50',
        };
      case 'moderate':
        return {
          label: 'Moderata',
          description: 'Rimborso 100% fino a 5gg prima',
          color: 'text-yellow-600 bg-yellow-50',
        };
      case 'strict':
        return {
          label: 'Rigida',
          description: 'Rimborso 50% fino a 7gg prima',
          color: 'text-red-600 bg-red-50',
        };
      default:
        return {
          label: 'Flessibile',
          description: 'Rimborso 100% fino a 24h prima',
          color: 'text-green-600 bg-green-50',
        };
    }
  };

  // Helper per calcolare il rimborso previsto
  const calculateRefundPreview = (booking: BookingRequest): { percentage: number; amount: number; message: string } => {
    const policy = (booking as any).cancellationPolicy || 'flexible';
    const startDateStr = (booking as any).start_date;
    const totalPaid = (booking as any).renterTotalPaid || booking.totalPrice || 0;

    if (!startDateStr) {
      return { percentage: 100, amount: totalPaid, message: 'Rimborso completo' };
    }

    const startDate = new Date(startDateStr);
    const now = new Date();
    const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    const daysUntilStart = hoursUntilStart / 24;

    let percentage = 0;
    let message = '';

    if (policy === 'flexible') {
      if (hoursUntilStart >= 24) {
        percentage = 100;
        message = 'Rimborso completo (più di 24h prima)';
      } else {
        percentage = 0;
        message = 'Nessun rimborso (meno di 24h prima)';
      }
    } else if (policy === 'moderate') {
      if (daysUntilStart >= 5) {
        percentage = 100;
        message = 'Rimborso completo (più di 5 giorni prima)';
      } else {
        percentage = 0;
        message = 'Nessun rimborso (meno di 5 giorni prima)';
      }
    } else if (policy === 'strict') {
      if (daysUntilStart >= 7) {
        percentage = 50;
        message = 'Rimborso 50% (più di 7 giorni prima)';
      } else {
        percentage = 0;
        message = 'Nessun rimborso (meno di 7 giorni prima)';
      }
    } else {
      if (hoursUntilStart >= 24) {
        percentage = 100;
        message = 'Rimborso completo';
      } else {
        percentage = 0;
        message = 'Nessun rimborso';
      }
    }

    const amount = (totalPaid * percentage) / 100;
    return { percentage, amount, message };
  };

  // ✅ NUOVO: Helper per collegare payment a booking
  const getPaymentForBooking = (bookingId: string, isHubber: boolean) => {
    const payments = isHubber ? hubberPayments : renterPayments;
    return payments.find(p => p.booking_id === bookingId);
  };

  // ✅ NUOVO: Helper per ottenere numero transazione/ordine reale o fallback
  const getTransactionNumber = (bookingId: string, isHubber: boolean) => {
    const payment = getPaymentForBooking(bookingId, isHubber);
    
    if (payment?.provider_payment_id) {
      // Usa ID Stripe reale
      return payment.provider_payment_id;
    }
    
    // Fallback: genera numero temporaneo basato su booking ID
    const prefix = isHubber ? 'TX' : 'RH';
    const year = new Date().getFullYear();
    const shortId = bookingId.replace(/-/g, '').slice(0, 6).toUpperCase();
    return `${prefix}-${year}-${shortId}`;
  };

  // Risincronizza se cambia utente
  useEffect(() => {
    const firstName =
      (user as any).firstName ||
      (user.name ? user.name.split(' ')[0] : '') ||
      '';
    const lastName =
      (user as any).lastName ||
      (user.name ? user.name.split(' ').slice(1).join(' ') : '') ||
      '';
    const next = {
      firstName,
      lastName,
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      userType:
        ((user as any).userType as UserTypeOption | undefined) || 'privato',
      dateOfBirth: (user as any).dateOfBirth || '',
      bio: (user as any).bio || '',
    };
    setProfileData(next);
    setEditProfileForm({
      email: next.email,
      phoneNumber: next.phoneNumber,
      userType: next.userType,
      dateOfBirth: next.dateOfBirth,
      bio: next.bio,
    });
    setAvatarPreview(user.avatar || null);
  }, [user.id]);

  /* ------------------------------------------------------
     CARICAMENTO PRENOTAZIONI REALI DA SUPABASE
     - se ci sono dati reali -> li usa
     - se non ci sono / errore -> resta con MOCK_REQUESTS
  -------------------------------------------------------*/
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!user?.id) return;
      setLoadingBookings(true);
      setLoadingPayments(true);
      try {
        // se per qualunque motivo api.bookings non esiste, non rompiamo nulla
        if (!(api as any).bookings) {
          console.warn('api.bookings non definito, uso MOCK_REQUESTS');
          if (!cancelled) setRequests(MOCK_REQUESTS);
          return;
        }

        // ✅ Carica payments contemporaneamente ai bookings
        const paymentsPromise = activeMode === 'hubber'
          ? (api as any).payments?.getHubberPayments?.(user.id)
          : (api as any).payments?.getRenterPayments?.(user.id);

        if (activeMode === 'hubber') {
  const [dbBookings, payments] = await Promise.all([
    (api as any).bookings.getForHubberFromDb?.(user.id) || [],
    paymentsPromise || Promise.resolve([])
  ]);
  
  if (cancelled) return;

  // Salva payments
  setHubberPayments(payments);

  if (dbBookings.length > 0) {
    const mapped = dbBookings.map((b: any) => ({
      ...mapDbBookingToUiBooking(b),
      hasReviewed: b.hasReviewed || false,
      hasReviewedByHubber: b.hasReviewedByHubber || false,  // ✅ AGGIUNTO
    }));
    setRequests(mapped);
  } else {
    setRequests(MOCK_REQUESTS);
  }
} else {
  const [dbBookings, payments] = await Promise.all([
    (api as any).bookings.getForRenterFromDb?.(user.id) || [],
    paymentsPromise || Promise.resolve([])
  ]);
  
  if (cancelled) return;

  // Salva payments
  setRenterPayments(payments);

  if (dbBookings.length > 0) {
    const mapped = dbBookings.map((b: any) => ({
      ...mapDbBookingToUiBooking(b),
      hasReviewed: b.hasReviewed || false,
    }));
    setRequests(mapped);
  } else {
    setRequests(MOCK_REQUESTS);
  }
}
      } catch (err) {
        console.error('Errore caricamento prenotazioni (Dashboard):', err);
        if (!cancelled) setRequests(MOCK_REQUESTS);
      } finally {
        if (!cancelled) {
          setLoadingBookings(false);
          setLoadingPayments(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user.id, activeMode]);

  // --- FILTRI PRENOTAZIONI ---
  const hubberBookings = requests.filter((req) => req.hostId === user.id);
  const renterBookings = requests.filter(
    (req) => (req as any).renterId === user.id
  );

  // ✅ CARICA STATISTICHE HUBBER
  useEffect(() => {
    const loadHubberStats = async () => {
      console.log('🔄 loadHubberStats chiamata - activeMode:', activeMode, 'user.id:', user.id);
      console.log('📦 hubberBookings.length:', hubberBookings.length);
      console.log('📦 hubberBookings:', hubberBookings);
      
      if (activeMode !== 'hubber' || !user.id) {
        console.log('❌ loadHubberStats saltata - activeMode:', activeMode, 'user.id:', user.id);
        return;
      }

      setHubberStats(prev => ({ ...prev, isLoading: true }));

      try {
        // Calcola statistiche dalle prenotazioni caricate
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Prenotazioni attive (confirmed, accepted, active)
        const activeStatuses = ['confirmed', 'accepted', 'active'];
        const activeBookings = hubberBookings.filter(b => activeStatuses.includes(b.status));

        // Prenotazioni in attesa
        const pendingBookings = hubberBookings.filter(b => b.status === 'pending');

        // Prenotazioni completate
        const completedBookings = hubberBookings.filter(b => b.status === 'completed');

        // Guadagni del mese corrente (da prenotazioni completate/confermate)
        const monthlyEarnings = hubberBookings
          .filter(b => {
            const bookingDate = new Date(b.createdAt || Date.now());
            return bookingDate.getMonth() === currentMonth && 
                   bookingDate.getFullYear() === currentYear &&
                   ['confirmed', 'accepted', 'completed', 'active'].includes(b.status);
          })
          .reduce((sum, b) => sum + (b.netEarnings || b.totalPrice || 0), 0);

        console.log('💰 monthlyEarnings calcolato:', monthlyEarnings);

        // Storico guadagni ultimi 4 mesi
        const earningsHistory: { name: string; value: number }[] = [];
        const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
        
        for (let i = 3; i >= 0; i--) {
          const targetMonth = new Date(currentYear, currentMonth - i, 1);
          const monthEarnings = hubberBookings
            .filter(b => {
              const bookingDate = new Date(b.createdAt || Date.now());
              return bookingDate.getMonth() === targetMonth.getMonth() && 
                     bookingDate.getFullYear() === targetMonth.getFullYear() &&
                     ['confirmed', 'accepted', 'completed', 'active'].includes(b.status);
            })
            .reduce((sum, b) => sum + (b.netEarnings || b.totalPrice || 0), 0);
          
          earningsHistory.push({
            name: `${monthNames[targetMonth.getMonth()]}`,
            value: Math.round(monthEarnings * 100) / 100,
          });
        }

        console.log('📊 earningsHistory:', earningsHistory);

        // Aggiorna lo state
        setHubberStats({
          monthlyEarnings,
          activeBookings: activeBookings.length,
          totalViews: 0, // TODO: implementare tracking visualizzazioni
          avgResponseTime: 60, // TODO: calcolare dal tempo di risposta medio
          earningsHistory,
          pendingBookings: pendingBookings.length,
          completedBookings: completedBookings.length,
          isLoading: false,
        });

      } catch (err) {
        console.error('Errore caricamento statistiche hubber:', err);
        setHubberStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    // Carica quando le prenotazioni sono pronte
    if (!loadingBookings && hubberBookings.length >= 0) {
      loadHubberStats();
    }
  }, [activeMode, user.id, loadingBookings, hubberBookings.length]);

  // 💰 Carica saldo reale hubber da Supabase
  useEffect(() => {
    const loadRealBalance = async () => {
      if (activeMode !== 'hubber' || !user.id) return;

      try {
        const { supabase } = await import('../lib/supabase');
        const { data, error } = await supabase
          .from('users')
          .select('hubber_balance')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setRealHubberBalance(data.hubber_balance || 0);
          console.log('💰 Saldo hubber caricato:', data.hubber_balance);
        }
      } catch (err) {
        console.error('Errore caricamento saldo hubber:', err);
      }
    };

    loadRealBalance();
  }, [activeMode, user.id]);

  // --- PROSSIMA PRENOTAZIONE RENTER (per Panoramica) ---
  useEffect(() => {
    // Resetta quando cambia utente o modalità
    setNextUpcomingBooking(null);
    setLoadingNextBooking(false);
  }, [user.id, activeMode]);

  useEffect(() => {
    const loadNextUpcomingBooking = async () => {
      if (activeMode !== 'renter' || !user.id) return;
      if (loadingBookings) return; // Aspetta che le prenotazioni siano caricate
      
      // Se non ci sono prenotazioni renter, mostra "nessun noleggio"
      if (renterBookings.length === 0) {
        setNextUpcomingBooking(null);
        setLoadingNextBooking(false);
        return;
      }
      
      setLoadingNextBooking(true);
      try {
        // Trova la prossima prenotazione futura confermata/accettata
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcomingBookings = renterBookings.filter((booking) => {
          const startDate = new Date((booking as any).start_date);
          const isUpcoming = startDate >= today;
          const isActive = ['confirmed', 'accepted', 'pending'].includes(booking.status);
          return isUpcoming && isActive;
        });

        if (upcomingBookings.length > 0) {
          // Ordina per data più vicina
          upcomingBookings.sort((a, b) => {
            const dateA = new Date((a as any).start_date);
            const dateB = new Date((b as any).start_date);
            return dateA.getTime() - dateB.getTime();
          });

          const next = upcomingBookings[0];
          const startDate = new Date((next as any).start_date);
          const daysUntil = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          // Genera codice ritiro (prime 5 caratteri dell'ID in maiuscolo)
          const pickupCode = next.id.replace(/-/g, '').slice(0, 5).toUpperCase();

          // Carica dettagli listing per indirizzo (se disponibile)
          let pickupAddress = '';
          let pickupCity = '';
          
          try {
            const listingId = (next as any).listingId || (next as any).listing_id;
            if (listingId) {
              const { data: listing } = await supabase
                .from('listings')
                .select('pickup_address, pickup_city, location')
                .eq('id', listingId)
                .single();
              
              if (listing) {
                pickupAddress = listing.pickup_address || '';
                pickupCity = listing.pickup_city || listing.location || '';
              }
            }
          } catch (e) {
            console.warn('Errore caricamento indirizzo listing:', e);
          }

          // Carica nome hubber
          let hubberName = 'Hubber';
          try {
            const hubberId = (next as any).hostId || (next as any).hubber_id;
            if (hubberId) {
              const { data: hubber } = await supabase
                .from('users')
                .select('first_name, last_name')
                .eq('id', hubberId)
                .single();
              
              if (hubber) {
                hubberName = `${hubber.first_name || ''} ${(hubber.last_name || '').charAt(0)}.`.trim();
              }
            }
          } catch (e) {
            console.warn('Errore caricamento nome hubber:', e);
          }

          setNextUpcomingBooking({
            id: next.id,
            listingTitle: next.listingTitle || 'Prenotazione',
            listingImage: next.listingImage || '',
            hubberName,
            startDate: (next as any).start_date,
            endDate: (next as any).end_date,
            pickupAddress,
            pickupCity,
            pickupCode: `#${pickupCode}`,
            status: next.status,
            daysUntilStart: daysUntil,
          });
        } else {
          setNextUpcomingBooking(null);
        }
      } catch (err) {
        console.error('Errore caricamento prossima prenotazione:', err);
        setNextUpcomingBooking(null);
      } finally {
        setLoadingNextBooking(false);
      }
    };

    // Carica quando le prenotazioni sono pronte
    loadNextUpcomingBooking();
  }, [activeMode, user.id, loadingBookings, renterBookings.length]);

  // ✅ CARICA ANNUNCI VISTI DI RECENTE - DATABASE
useEffect(() => {
  if (activeMode !== 'renter' || !user.id) return;
  
  const loadRecentlyViewed = async () => {
    try {
      const data = await api.recentlyViewed.getByUser(user.id);
      
      // Mappa i dati nel formato che il componente si aspetta
      const formatted = data.map((item: any) => ({
        id: item.listing.id,
        title: item.listing.title,
        image: item.listing.images?.[0] || '',
        price: item.listing.price,
        priceUnit: item.listing.price_unit || 'giorno',
        viewedAt: item.viewed_at
      }));
      
      setRecentlyViewed(formatted);
      console.log('✅ Caricati annunci visti di recente:', formatted.length);
    } catch (err) {
      console.error('Errore caricamento annunci visti:', err);
      setRecentlyViewed([]);
    }
  };
  
  loadRecentlyViewed();
}, [activeMode, user.id]);

  // Inizializza prenotazione selezionata per l'hubber
  useEffect(() => {
    if (hubberBookings.length > 0 && !selectedHubberBookingId) {
      setSelectedHubberBookingId(hubberBookings[0].id);
    }
  }, [hubberBookings, selectedHubberBookingId]);

// ✅ CARICA FATTURE UTENTE
useEffect(() => {
  const loadUserInvoices = async () => {
    if (!user?.id) return;
    
    setLoadingInvoices(true);
    try {
      const invoiceType = activeMode === 'hubber' ? 'hubber' : 'renter';
      const invoices = await api.admin.getInvoicesForUser(user.id, invoiceType);
      setUserInvoices(invoices);
      console.log("📄 Fatture caricate per", invoiceType, ":", invoices.length);
    } catch (err) {
      console.error("Errore caricamento fatture:", err);
      setUserInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  loadUserInvoices();
}, [user.id, activeMode]);

  // ✅ CARICA DATI CALENDARIO HUBBER
useEffect(() => {
  const loadCalendarData = async () => {
    if (activeMode !== 'hubber' || !user.id) return;
    
    setLoadingCalendar(true);
    try {
      const calBookings: CalendarBooking[] = hubberBookings.map((b) => ({
        id: b.id,
        listingId: b.listingId || '',
        listingTitle: b.listingTitle || 'Prenotazione',
        listingImage: b.listingImage,
        startDate: (b as any).start_date || '',
        endDate: (b as any).end_date || '',
        status: b.status,
        renterName: b.renterName,
        renterAvatar: b.renterAvatar,
        renterId: (b as any).renterId,
        totalPrice: b.totalPrice,
        netEarnings: b.netEarnings,
      }));
      
      setCalendarBookings(calBookings);
      
      const token = btoa(`${user.id}-export`).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
      const exportUrl = `${window.location.origin}/api/ical/${user.id}/${token}.ics`;
      setICalExportUrl(exportUrl);
      
    } catch (err) {
      console.error('Errore caricamento dati calendario:', err);
    } finally {
      setLoadingCalendar(false);
    }
  };
  
  if (!loadingBookings && hubberBookings.length >= 0) {
    loadCalendarData();
  }
}, [activeMode, user.id, loadingBookings, hubberBookings.length]);

const handleRequestAction = (id: string, action: 'accepted' | 'rejected') => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: action } : req))
    );
  };
  
// ✅ HANDLER RECENSIONE
  const openReviewModal = (booking: BookingRequest, type: 'renter_to_hubber' | 'hubber_to_renter') => {
    setBookingToReview(booking);
    setReviewType(type);
    setReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setReviewModalOpen(false);
    setBookingToReview(null);
  };

  const handleReviewSuccess = () => {
    if (bookingToReview) {
      setRequests((prev) =>
        prev.map((req) =>
          req.id === bookingToReview.id 
            ? { 
                ...req, 
                // Se è una recensione hubber → renter, setta hasReviewedByHubber
                // Se è una recensione renter → hubber, setta hasReviewed
                ...(reviewType === 'hubber_to_renter' 
                  ? { hasReviewedByHubber: true } 
                  : { hasReviewed: true }
                )
              } as any
            : req
        )
      );
    }
    console.log('✅ Recensione inviata con successo');
    closeReviewModal();
  };

  // ========== HANDLER CALENDARIO iCAL ==========
  const handleImportCalendar = (url: string, name: string) => {
    const newCalendar: ImportedCalendar = {
      id: `cal-${Date.now()}`,
      name,
      url,
      lastSync: new Date().toISOString(),
      eventsCount: 0,
      status: 'active'
    };
    setImportedCalendars(prev => [...prev, newCalendar]);
  };

  const handleSyncCalendar = (calendarId: string) => {
    setImportedCalendars(prev =>
      prev.map(cal =>
        cal.id === calendarId
          ? { ...cal, status: 'syncing' as const }
          : cal
      )
    );
    setTimeout(() => {
      setImportedCalendars(prev =>
        prev.map(cal =>
          cal.id === calendarId
            ? { ...cal, status: 'active' as const, lastSync: new Date().toISOString() }
            : cal
        )
      );
    }, 2000);
  };

  const handleRemoveCalendar = (calendarId: string) => {
    setImportedCalendars(prev => prev.filter(cal => cal.id !== calendarId));
  };
  // --- HANDLER CANCELLAZIONE PRENOTAZIONE RENTER ---
  const openCancelModal = (booking: BookingRequest) => {
    setBookingToCancel(booking);
    setCancelError(null);
    setCancelSuccess(null);
    setRefundMethod('wallet'); // Default: wallet (immediato)
    setCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    if (!isCancelling) {
      setCancelModalOpen(false);
      setBookingToCancel(null);
      setCancelError(null);
      setRefundMethod('wallet');
    }
  };

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;

    setIsCancelling(true);
    setCancelError(null);
    setCancelSuccess(null);

    try {
      // Verifica se api.bookings.cancel esiste
      if ((api as any).bookings?.cancel) {
        const result = await (api as any).bookings.cancel(
          bookingToCancel.id, 
          user.id,
          refundMethod // Passa il metodo di rimborso scelto
        );
        
        if (result.error) {
          setCancelError(result.error);
          setIsCancelling(false);
          return;
        }

        // Messaggio di successo in base al metodo scelto
        let successMsg = "Prenotazione cancellata con successo.";
        
        if (result.refundPercentage === 0) {
          successMsg += " Nessun rimborso previsto dalla politica di cancellazione.";
        } else if (refundMethod === 'wallet') {
          // Tutto su wallet
          if (result.totalRefunded && result.totalRefunded > 0) {
            successMsg += ` €${result.totalRefunded.toFixed(2)} accreditati immediatamente sul tuo Wallet Renthubber.`;
          }
        } else {
          // Rimborso su carta
          if (result.walletRefunded && result.walletRefunded > 0) {
            successMsg += ` €${result.walletRefunded.toFixed(2)} rimborsati sul wallet (parte già pagata con wallet).`;
          }
          if (result.cardRefundPending) {
            successMsg += ` €${result.cardRefundAmount?.toFixed(2) || '0.00'} saranno rimborsati sulla carta entro 5-10 giorni lavorativi.`;
          }
        }

        setCancelSuccess(successMsg);

        // Aggiorna la lista locale
        setRequests((prev) =>
          prev.map((req) =>
            req.id === bookingToCancel.id ? { ...req, status: 'cancelled' } : req
          )
        );

        // Chiudi modale dopo 2.5 secondi
        setTimeout(() => {
          closeCancelModal();
        }, 2500);

      } else {
        // Fallback: aggiorna solo localmente se l'API non esiste
        console.warn("api.bookings.cancel non disponibile, aggiornamento solo locale");
        setRequests((prev) =>
          prev.map((req) =>
            req.id === bookingToCancel.id ? { ...req, status: 'cancelled' } : req
          )
        );
        setCancelSuccess("Prenotazione cancellata.");
        setTimeout(() => {
          closeCancelModal();
        }, 1500);
      }
    } catch (err) {
      console.error("Errore cancellazione prenotazione:", err);
      setCancelError("Si è verificato un errore. Riprova più tardi.");
    } finally {
      setIsCancelling(false);
    }
  };

  // ✅ CANCELLAZIONE PRENOTAZIONE DA PARTE DELL'HUBBER
  const openHubberCancelModal = (booking: BookingRequest) => {
    setHubberBookingToCancel(booking);
    setHubberCancelModalOpen(true);
    setHubberCancelReason("");
    setHubberCancelError(null);
    setHubberCancelSuccess(null);
  };

  const closeHubberCancelModal = () => {
    if (!isHubberCancelling) {
      setHubberCancelModalOpen(false);
      setHubberBookingToCancel(null);
      setHubberCancelReason("");
      setHubberCancelError(null);
      setHubberCancelSuccess(null);
    }
  };

  const handleHubberCancelBooking = async () => {
    if (!hubberBookingToCancel) return;

    setIsHubberCancelling(true);
    setHubberCancelError(null);
    setHubberCancelSuccess(null);

    try {
      if ((api as any).bookings?.cancelByHubber) {
        const result = await (api as any).bookings.cancelByHubber(
          hubberBookingToCancel.id,
          user.id,
          hubberCancelReason || undefined
        );

        if (result.error) {
          setHubberCancelError(result.error);
          setIsHubberCancelling(false);
          return;
        }

        let successMsg = "Prenotazione cancellata con successo.";
        if (result.refundedToRenter && result.refundedToRenter > 0) {
          successMsg += ` €${result.refundedToRenter.toFixed(2)} rimborsati al Renter.`;
        }

        setHubberCancelSuccess(successMsg);

        // Aggiorna la lista locale
        setRequests((prev) =>
          prev.map((req) =>
            req.id === hubberBookingToCancel.id ? { ...req, status: 'cancelled' } : req
          )
        );

        // Chiudi modale dopo 2 secondi
        setTimeout(() => {
          closeHubberCancelModal();
        }, 2000);

      } else {
        console.warn("api.bookings.cancelByHubber non disponibile");
        setHubberCancelError("Funzione non disponibile.");
      }
    } catch (err) {
      console.error("Errore cancellazione prenotazione hubber:", err);
      setHubberCancelError("Si è verificato un errore. Riprova più tardi.");
    } finally {
      setIsHubberCancelling(false);
    }
  };

  // Verifica se una prenotazione può essere cancellata
  const canCancelBooking = (status: string): boolean => {
    return status === 'pending' || status === 'confirmed' || status === 'accepted';
  };

  // Verifica se una prenotazione può essere modificata
  const canModifyBooking = (status: string): boolean => {
    return status === 'pending' || status === 'confirmed' || status === 'accepted';
  };

  // --- HANDLER MODIFICA PRENOTAZIONE RENTER ---
  const openModifyModal = async (booking: BookingRequest) => {
    setBookingToModify(booking);
    setModifyError(null);
    setModifySuccess(null);
    setPriceDifference(0);
    setShowPaymentForModify(false);
    setModifyDisabledDates([]);
    
    // Parsa le date attuali dalla stringa "dates"
    // Formato atteso: "01 dic 2024 - 05 dic 2024"
    let currentBookingStart: Date | null = null;
    let currentBookingEnd: Date | null = null;
    
    try {
      const rawBooking = requests.find(r => r.id === booking.id);
      if (rawBooking) {
        // Prova a recuperare le date originali dal booking raw
        const startStr = (rawBooking as any).start_date || (rawBooking as any).startDate;
        const endStr = (rawBooking as any).end_date || (rawBooking as any).endDate;
        
        if (startStr) {
          currentBookingStart = new Date(startStr);
          setNewStartDate(currentBookingStart);
        }
        if (endStr) {
          currentBookingEnd = new Date(endStr);
          setNewEndDate(currentBookingEnd);
        }
      }
    } catch (e) {
      console.warn("Impossibile parsare date prenotazione:", e);
    }

    // Carica le date già prenotate per questo annuncio (escludendo la prenotazione corrente)
    try {
      const listingId = (booking as any).listingId || (booking as any).listing_id;
      if (listingId && (api as any).bookings?.getByListingId) {
        const bookings = await (api as any).bookings.getByListingId(listingId);
        
        const allDisabledDates: Date[] = [];
        
        bookings.forEach((b: { startDate: string; endDate: string }) => {
          const start = new Date(b.startDate);
          const end = new Date(b.endDate);
          
          // Escludi le date della prenotazione corrente (che l'utente sta modificando)
          if (currentBookingStart && currentBookingEnd) {
            const isCurrentBooking = 
              start.getTime() === currentBookingStart.getTime() &&
              end.getTime() === currentBookingEnd.getTime();
            if (isCurrentBooking) return;
          }
          
          // Aggiungi tutte le date tra start e end
          const current = new Date(start);
          while (current <= end) {
            allDisabledDates.push(new Date(current));
            current.setDate(current.getDate() + 1);
          }
        });
        
        setModifyDisabledDates(allDisabledDates);
        console.log("📅 Date disabilitate per modifica:", allDisabledDates.length);
      }
    } catch (err) {
      console.error("Errore caricamento date prenotate:", err);
    }
    
    setModifyModalOpen(true);
  };

  const closeModifyModal = () => {
    if (!isModifying) {
      setModifyModalOpen(false);
      setBookingToModify(null);
      setNewStartDate(undefined);
      setNewEndDate(undefined);
      setModifyError(null);
      setPriceDifference(0);
      setShowPaymentForModify(false);
    }
  };

  // Calcola la differenza di prezzo quando cambiano le date
  useEffect(() => {
    if (!bookingToModify || !newStartDate) {
      setPriceDifference(0);
      return;
    }

    const calculatePriceDiff = () => {
      try {
        // Recupera prezzo listing direttamente dal booking (già caricato dal JOIN)
        const listingPrice = (bookingToModify as any).listingPrice || 0;
        const priceUnit = (bookingToModify as any).priceUnit || 'giorno';

        if (!listingPrice) {
          console.warn("Prezzo listing non disponibile nel booking");
          setPriceDifference(0);
          return;
        }

        // Calcola giorni originali
        const originalStartStr = (bookingToModify as any).start_date;
        const originalEndStr = (bookingToModify as any).end_date;
        
        let originalDays = 1;
        if (originalStartStr && originalEndStr) {
          const origStart = new Date(originalStartStr);
          const origEnd = new Date(originalEndStr);
          const origDiff = Math.abs(origEnd.getTime() - origStart.getTime());
          originalDays = Math.max(Math.ceil(origDiff / (1000 * 60 * 60 * 24)), 1);
        }

        // Calcola nuovi giorni
        const start = newStartDate;
        const end = newEndDate || newStartDate;
        const diffTime = Math.abs(end.getTime() - start.getTime());
        let newDays = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);

        // Adatta per unità diverse
        if (priceUnit === 'settimana') {
          originalDays = Math.max(Math.ceil(originalDays / 7), 1);
          newDays = Math.max(Math.ceil(newDays / 7), 1);
        } else if (priceUnit === 'mese') {
          originalDays = Math.max(Math.ceil(originalDays / 30), 1);
          newDays = Math.max(Math.ceil(newDays / 30), 1);
        }

        // Calcola prezzi base
        const originalBasePrice = originalDays * listingPrice;
        const newBasePrice = newDays * listingPrice;
        const basePriceDiff = newBasePrice - originalBasePrice;

        // Calcola commissioni 10% (fee fissa NON si tocca)
        const originalCommission = (originalBasePrice * 10) / 100;
        const newCommission = (newBasePrice * 10) / 100;
        const commissionDiff = newCommission - originalCommission;

        // Differenza totale = prezzo base + commissione (NO fee fissa)
        const totalDiff = basePriceDiff + commissionDiff;
        
        setPriceDifference(totalDiff);
      } catch (err) {
        console.error("Errore calcolo differenza prezzo:", err);
        setPriceDifference(0);
      }
    };

    calculatePriceDiff();
  }, [bookingToModify, newStartDate, newEndDate]);

  const handleModifyBooking = async () => {
    if (!bookingToModify || !newStartDate) return;

    // Se deve pagare di più, mostra conferma prima di procedere
    if (priceDifference > 0 && !showPaymentForModify) {
      setShowPaymentForModify(true);
      return;
    }

    setIsModifying(true);
    setModifyError(null);
    setModifySuccess(null);

    try {
      const endDateToUse = newEndDate || newStartDate;

      if ((api as any).bookings?.modify) {
        const result = await (api as any).bookings.modify({
          bookingId: bookingToModify.id,
          renterId: user.id,
          newStartDate: newStartDate.toISOString(),
          newEndDate: endDateToUse.toISOString(),
        });

        if (result.error) {
          setModifyError(result.error);
          setIsModifying(false);
          return;
        }

        // Messaggio di successo
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

        // Aggiorna la lista locale
        const formatDateLocal = (d: Date) => {
          return d.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
        };

        const newDates = `${formatDateLocal(newStartDate)} - ${formatDateLocal(endDateToUse)}`;
        const newTotalPrice = result.newTotal || (bookingToModify.totalPrice + (result.priceDifference || 0));

        setRequests((prev) =>
          prev.map((req) =>
            req.id === bookingToModify.id
              ? { 
                  ...req, 
                  dates: newDates, 
                  totalPrice: newTotalPrice,
                  start_date: newStartDate.toISOString(),
                  end_date: endDateToUse.toISOString(),
                }
              : req
          )
        );

        // Chiudi modale dopo 2.5 secondi
        setTimeout(() => {
          closeModifyModal();
        }, 2500);

      } else {
        // Fallback se l'API non esiste
        console.warn("api.bookings.modify non disponibile");
        setModifyError("Funzionalità non ancora disponibile.");
      }
    } catch (err) {
      console.error("Errore modifica prenotazione:", err);
      setModifyError("Si è verificato un errore. Riprova più tardi.");
    } finally {
      setIsModifying(false);
    }
  };

  const handleModifyCalendarChange = (start: Date | undefined, end: Date | undefined) => {
    setNewStartDate(start);
    setNewEndDate(end);
  };

  // Chiudi calendario modifica al click fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modifyCalendarRef.current &&
        !modifyCalendarRef.current.contains(event.target as Node)
      ) {
        setModifyCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- HANDLER DETTAGLIO PRENOTAZIONE RENTER ---
  const loadBookingDetail = async (booking: BookingRequest) => {
    setSelectedRenterBooking(booking);
    setLoadingBookingDetail(true);
    setBookingDetailData(null);

    try {
      // Recupera prezzo listing direttamente dal booking (già caricato dal JOIN)
      const listingPrice = (booking as any).listingPrice || 0;
      const priceUnit = (booking as any).priceUnit || 'giorno';
      const cancellationPolicy = (booking as any).cancellationPolicy || 'flexible';

      // Calcola giorni
      const startStr = (booking as any).start_date;
      const endStr = (booking as any).end_date;
      let days = 1;
      
      if (startStr && endStr) {
        const start = new Date(startStr);
        const end = new Date(endStr);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        days = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);
      }

      // Calcola breakdown
      const basePrice = days * listingPrice;
      const cleaningFee = (booking as any).cleaningFee || 0;
      const commission = ((basePrice + cleaningFee) * 10) / 100;
      const fixedFee = 2;
      
      // Usa il totale reale pagato dal renter (da Supabase)
      const renterTotalPaid = (booking as any).renterTotalPaid || (basePrice + cleaningFee + commission + fixedFee);
      
      // Recupera wallet usato dal booking
      const walletUsedCents = (booking as any).walletUsedCents || 0;
      const walletUsed = walletUsedCents / 100;
      const cardPaid = Math.max(renterTotalPaid - walletUsed, 0);

      // Calcola rimborso previsto
      const refundInfo = calculateRefundPreview(booking);

      // Carica indirizzo di ritiro dal listing (solo se confermata/accettata)
      let pickupAddress = '';
      let pickupCity = '';
      let pickupInstructions = '';
      
      if (booking.status === 'confirmed' || booking.status === 'accepted') {
        try {
          const listingId = (booking as any).listingId || (booking as any).listing_id;
          if (listingId) {
            const { data: listing } = await supabase
              .from('listings')
              .select('pickup_address, pickup_city, pickup_instructions, location')
              .eq('id', listingId)
              .single();
            
            if (listing) {
              pickupAddress = listing.pickup_address || '';
              pickupCity = listing.pickup_city || listing.location || '';
              pickupInstructions = listing.pickup_instructions || '';
            }
          }
        } catch (e) {
          console.warn('Errore caricamento indirizzo listing:', e);
        }
      }

      setBookingDetailData({
        listingPrice,
        priceUnit,
        days,
        basePrice,
        cleaningFee,
        commission,
        fixedFee,
        total: renterTotalPaid,
        walletUsed,
        cardPaid,
        cancellationPolicy,
        refundInfo,
        // Aggiungi indirizzo
        pickupAddress,
        pickupCity,
        pickupInstructions,
      } as any);
    } catch (err) {
      console.error("Errore caricamento dettaglio prenotazione:", err);
    } finally {
      setLoadingBookingDetail(false);
    }
  };

  const closeBookingDetail = () => {
    setSelectedRenterBooking(null);
    setBookingDetailData(null);
  };

  // --- HANDLER PROFILO ---
const openProfileModal = () => {
  setEditProfileForm({
    email: profileData.email,
    phoneNumber: profileData.phoneNumber,
    userType: profileData.userType,
    dateOfBirth: profileData.dateOfBirth,
    bio: profileData.bio,
  });
  setIsProfileModalOpen(true);
};

const handleAvatarClick = () => {
  avatarInputRef.current?.click();
};

const handleAvatarChange: React.ChangeEventHandler<HTMLInputElement> = async (
  e
) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Mostra anteprima immediata
  const previewUrl = URL.createObjectURL(file);
  setAvatarPreview(previewUrl);

  try {
    // 1. Carica immagine su Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Errore upload avatar:', uploadError);
      alert('Errore nel caricamento dell\'immagine. Verifica che il bucket "avatars" esista su Supabase.');
      return;
    }

    // 2. Ottieni URL pubblico
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // 3. Aggiorna il profilo utente nel database
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('Errore aggiornamento profilo:', updateError);
      alert('Errore nel salvataggio. Riprova.');
      return;
    }

    // 4. Aggiorna l'anteprima con l'URL definitivo
    setAvatarPreview(publicUrl);
    console.log('✅ Avatar aggiornato con successo:', publicUrl);

  } catch (err) {
    console.error('Errore durante upload avatar:', err);
    alert('Si è verificato un errore. Riprova.');
  }
};

const handleProfileSave = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSavingProfile(true);
  try {
    const emailChanged = editProfileForm.email !== user.email;
    const phoneChanged =
      (editProfileForm.phoneNumber || '') !== (user.phoneNumber || '');

    // update UI locale
    setProfileData((prev) => ({
      ...prev,
      email: editProfileForm.email,
      phoneNumber: editProfileForm.phoneNumber,
      userType: editProfileForm.userType,
      dateOfBirth: editProfileForm.dateOfBirth,
      bio: editProfileForm.bio,
    }));

    // Salva dati profilo su Supabase
    const { error } = await supabase
      .from('users')
      .update({ 
        bio: editProfileForm.bio,
        user_type: editProfileForm.userType,
        date_of_birth: editProfileForm.dateOfBirth || null,
      })
      .eq('id', user.id);
      
    if (error) {
      console.error('❌ Errore UPDATE users:', error);
    } else {
      console.log('✅ Profilo salvato su Supabase! Bio:', editProfileForm.bio);
    }

    if (onUpdateProfile) {
      await onUpdateProfile({
        email: editProfileForm.email,
        phoneNumber: editProfileForm.phoneNumber,
        userType: editProfileForm.userType,
        dateOfBirth: editProfileForm.dateOfBirth,
        bio: editProfileForm.bio,
        resetEmailVerification: emailChanged,
        resetPhoneVerification: phoneChanged,
      });
    }

    setIsProfileModalOpen(false);
  } catch (err) {
    console.error('Errore aggiornamento profilo:', err);
  } finally {
    setIsSavingProfile(false);
  }
};

// --- HANDLER DOCUMENTO IDENTITÀ (VERSIONE CORRETTA CON UPLOAD REALE) ---
const handleIdFileChange =
  (side: 'front' | 'back'): React.ChangeEventHandler<HTMLInputElement> =>
  async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validazione dimensione file (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Il file è troppo grande. Dimensione massima: 5MB');
      return;
    }

    // Validazione tipo file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Formato file non supportato. Usa JPG, PNG o PDF');
      return;
    }

    // Mostra loader e aggiorna UI con nome file
    if (side === 'front') {
      setIdFrontFileName(file.name);
      setIsUploadingFront(true);
    } else {
      setIdBackFileName(file.name);
      setIsUploadingBack(true);
    }

    try {
      // 1️⃣ Genera nome file unico
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${side}_${Date.now()}.${fileExt}`;
      const filePath = `id-documents/${fileName}`;

      // 2️⃣ Upload su Supabase Storage
      console.log(`🔄 Uploading ${side} documento...`);
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('❌ Errore upload Storage:', uploadError);
        throw uploadError;
      }

      // 3️⃣ Ottieni URL pubblico del file
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log(`✅ File caricato: ${publicUrl}`);

      // 4️⃣ Aggiorna database con URL del documento
      const updateField = side === 'front' ? 'document_front_url' : 'document_back_url';
      
      const { error: dbError } = await supabase
        .from('users')
        .update({ 
          [updateField]: publicUrl,
          id_document_verified: false,
        })
        .eq('id', user.id);

      if (dbError) {
        console.error('❌ Errore aggiornamento database:', dbError);
        throw dbError;
      }

      // 5️⃣ Aggiorna stato locale dell'app
      if (onUpdateProfile) {
        await onUpdateProfile({
          [updateField]: publicUrl,
          idDocumentVerified: false,
          resetIdDocumentVerification: true,
        });
      }

      console.log(`✅ ${side === 'front' ? 'Fronte' : 'Retro'} documento caricato con successo!`);
      alert(`✅ ${side === 'front' ? 'Fronte' : 'Retro'} caricato con successo!`);

    } catch (err: any) {
      console.error(`❌ Errore upload documento ${side}:`, err);
      alert(`❌ Errore durante il caricamento. Riprova.`);
      
      if (side === 'front') {
        setIdFrontFileName(null);
      } else {
        setIdBackFileName(null);
      }
    } finally {
      if (side === 'front') {
        setIsUploadingFront(false);
      } else {
        setIsUploadingBack(false);
      }
    }
  };

  // ✅ GESTIONE VERIFICA TELEFONO
  const openPhoneModal = () => {
    setPhoneModalOpen(true);
    setPhoneStep('input');
    setPhoneInput(profileData.phoneNumber || '');
    setOtpCode('');
    setPhoneError(null);
  };

  const closePhoneModal = () => {
    if (!isSendingOtp && !isVerifyingOtp) {
      setPhoneModalOpen(false);
      setPhoneStep('input');
      setPhoneError(null);
      setOtpCode('');
    }
  };

  const handleSendOtp = async () => {
    // Valida numero di telefono
    const cleanPhone = phoneInput.replace(/\s/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setPhoneError('Inserisci un numero di telefono valido');
      return;
    }

    setIsSendingOtp(true);
    setPhoneError(null);

    try {
      // Simula invio OTP (in produzione: chiamata API reale)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Salva il numero di telefono nel profilo
      if (onUpdateProfile) {
        await onUpdateProfile({
          phoneNumber: cleanPhone,
          resetPhoneVerification: false,
        });
      }

      // Aggiorna profileData locale
      setProfileData(prev => ({ ...prev, phoneNumber: cleanPhone }));
      setOtpSentTo(cleanPhone);
      setPhoneStep('otp');
      
      console.log('📱 OTP inviato a:', cleanPhone);
    } catch (err) {
      console.error('Errore invio OTP:', err);
      setPhoneError('Errore nell\'invio del codice. Riprova.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setPhoneError('Inserisci il codice a 6 cifre');
      return;
    }

    setIsVerifyingOtp(true);
    setPhoneError(null);

    try {
      // Simula verifica OTP (in produzione: chiamata API reale)
      // Per demo: accetta qualsiasi codice di 6 cifre
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Aggiorna stato verifica nel database
      if (onUpdateProfile) {
        await onUpdateProfile({
          phoneVerified: true,
        });
      }

      // Aggiorna anche su Supabase
      await supabase
        .from('users')
        .update({ 
          phone_number: otpSentTo,
          phone_verified: true 
        })
        .eq('id', user.id);

      setPhoneStep('success');
      
      console.log('✅ Telefono verificato:', otpSentTo);

      // Chiudi modale dopo 2 secondi
      setTimeout(() => {
        closePhoneModal();
        // Forza refresh della pagina per vedere lo stato aggiornato
        window.location.reload();
      }, 2000);

    } catch (err) {
      console.error('Errore verifica OTP:', err);
      setPhoneError('Codice non valido. Riprova.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    setPhoneError(null);
    setOtpCode('');
    await handleSendOtp();
  };

  // ✅ GESTIONE VERIFICA EMAIL
  const openEmailModal = () => {
    setEmailModalOpen(true);
    setEmailStep('input');
    setEmailInput(profileData.email || '');
    setEmailOtpCode('');
    setEmailError(null);
  };

  const closeEmailModal = () => {
    if (!isSendingEmailOtp && !isVerifyingEmailOtp) {
      setEmailModalOpen(false);
      setEmailStep('input');
      setEmailError(null);
      setEmailOtpCode('');
    }
  };

  const handleSendEmailOtp = async () => {
    // Valida email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput || !emailRegex.test(emailInput)) {
      setEmailError('Inserisci un indirizzo email valido');
      return;
    }

    setIsSendingEmailOtp(true);
    setEmailError(null);

    try {
      // Simula invio OTP via email (in produzione: chiamata API reale)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Salva la nuova email nel profilo (ma non ancora verificata)
      if (onUpdateProfile) {
        await onUpdateProfile({
          email: emailInput,
          resetEmailVerification: true,
        });
      }

      // Aggiorna profileData locale
      setProfileData(prev => ({ ...prev, email: emailInput }));
      setEmailOtpSentTo(emailInput);
      setEmailStep('otp');
      
      console.log('📧 OTP inviato a:', emailInput);
    } catch (err) {
      console.error('Errore invio OTP email:', err);
      setEmailError('Errore nell\'invio del codice. Riprova.');
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtpCode || emailOtpCode.length !== 6) {
      setEmailError('Inserisci il codice a 6 cifre');
      return;
    }

    setIsVerifyingEmailOtp(true);
    setEmailError(null);

    try {
      // Simula verifica OTP (in produzione: chiamata API reale)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Aggiorna stato verifica nel database
      if (onUpdateProfile) {
        await onUpdateProfile({
          emailVerified: true,
        });
      }

      // Aggiorna anche su Supabase
      await supabase
        .from('users')
        .update({ 
          email: emailOtpSentTo,
          email_verified: true 
        })
        .eq('id', user.id);

      setEmailStep('success');
      
      console.log('✅ Email verificata:', emailOtpSentTo);

      // Chiudi modale dopo 2 secondi
      setTimeout(() => {
        closeEmailModal();
        window.location.reload();
      }, 2000);

    } catch (err) {
      console.error('Errore verifica OTP email:', err);
      setEmailError('Codice non valido. Riprova.');
    } finally {
      setIsVerifyingEmailOtp(false);
    }
  };

  const handleResendEmailOtp = async () => {
    setEmailError(null);
    setEmailOtpCode('');
    await handleSendEmailOtp();
  };

  // ✅ GESTIONE ELIMINAZIONE ACCOUNT
  const handleDeleteAccount = async () => {
    // Verifica che l'utente abbia digitato "DELETE"
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Devi digitare DELETE per confermare');
      return;
    }

    setIsDeletingAccount(true);
    setDeleteError(null);

    try {
      // Chiama API per eliminare account
      await api.users.deleteMyAccount(user.id);

      // Logout e redirect
      await api.auth.logout();
      
      // Reindirizza alla home
      window.location.href = '/';
    } catch (err: any) {
      console.error('Errore eliminazione account:', err);
      setDeleteError(err.message || 'Errore durante l\'eliminazione. Riprova.');
      setIsDeletingAccount(false);
    }
  };

  // ✅ GESTIONE CAMBIO PASSWORD
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errori
    setPasswordError(null);
    setPasswordSuccess(false);

    // Validazione
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Compila tutti i campi');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('La nuova password deve contenere almeno 8 caratteri');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Le password non coincidono');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('La nuova password deve essere diversa da quella attuale');
      return;
    }

    setIsChangingPassword(true);

    try {
      // Chiama API Supabase per cambiare password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // Successo!
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Chiudi il modale dopo 2 secondi
      setTimeout(() => {
        setChangePasswordModalOpen(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error('Errore cambio password:', err);
      setPasswordError(err.message || 'Errore durante il cambio password. Riprova.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // --- HELPER: BADGE STATO PRENOTAZIONE ---
  const renderBookingStatusBadge = (status: string) => {
    let label = status;
    let classes =
      'px-2 py-1 rounded text-xs font-bold uppercase bg-gray-100 text-gray-600';

    if (status === 'completed') {
      label = 'Completata';
      classes =
        'px-2 py-1 rounded text-xs font-bold uppercase bg-green-100 text-green-700';
    } else if (status === 'accepted') {
      label = 'Accettata';
      classes =
        'px-2 py-1 rounded text-xs font-bold uppercase bg-blue-100 text-blue-700';
    } else if (status === 'pending') {
      label = 'In attesa';
      classes =
        'px-2 py-1 rounded text-xs font-bold uppercase bg-yellow-100 text-yellow-700';
    } else if (status === 'rejected') {
      label = 'Rifiutata';
      classes =
        'px-2 py-1 rounded text-xs font-bold uppercase bg-red-100 text-red-700';
    } else if (status === 'confirmed') {
      label = 'Confermata';
      classes =
        'px-2 py-1 rounded text-xs font-bold uppercase bg-green-100 text-green-700';
    } else if (status === 'cancelled') {
      label = 'Cancellata';
      classes =
        'px-2 py-1 rounded text-xs font-bold uppercase bg-gray-100 text-gray-500';
    }

    return <span className={classes}>{label}</span>;
  };

  // --- SEZIONE SICUREZZA & VERIFICA (shared) ---
  const renderSecurity = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-2 flex items-center">
          <ShieldCheck className="w-6 h-6 text-brand mr-2" /> Stato Verifiche
          Account
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          Per garantire la sicurezza della piattaforma, completiamo diverse
          verifiche.
        </p>

        <div className="space-y-4">
          {/* EMAIL */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                  user.emailVerified
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {user.emailVerified ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className="font-bold text-gray-900">Indirizzo Email</p>
                <p className="text-xs text-gray-500">{profileData.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-11 md:ml-0">
              <button
                onClick={openEmailModal}
                className="text-xs font-semibold text-brand hover:text-brand-dark transition-colors px-3 py-1.5 rounded-lg hover:bg-brand/5"
              >
                {user.emailVerified ? 'Modifica' : 'Verifica'}
              </button>
              <span
                className={`text-xs font-bold px-2 py-1 rounded ${
                  user.emailVerified
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {user.emailVerified ? 'Verificato' : 'Non Verificato'}
              </span>
            </div>
          </div>

          {/* TELEFONO */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                  user.phoneVerified
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {user.phoneVerified ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className="font-bold text-gray-900">Numero di Telefono</p>
                <p className="text-xs text-gray-500">
                  {profileData.phoneNumber || 'Non inserito'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-11 md:ml-0">
              <button
                onClick={openPhoneModal}
                className="text-xs font-semibold text-brand hover:text-brand-dark transition-colors px-3 py-1.5 rounded-lg hover:bg-brand/5"
              >
                {!profileData.phoneNumber ? 'Inserisci' : user.phoneVerified ? 'Modifica' : 'Verifica'}
              </button>
              <span
                className={`text-xs font-bold px-2 py-1 rounded ${
                  user.phoneVerified
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {user.phoneVerified ? 'Verificato' : 'Non Verificato'}
              </span>
            </div>
          </div>

          {/* DOCUMENTO IDENTITÀ */}
          <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    user.idDocumentVerified
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {user.idDocumentVerified ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-900">
                    Documento d&apos;Identità
                  </p>
                  <p className="text-xs text-gray-500">
                    Richiesto per noleggiare e ospitare
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-11 md:ml-0">
                {user.idDocumentVerified && (
                  <button
                    onClick={() => {
                      setIdFrontFileName(null);
                      setIdBackFileName(null);
                      if (onUpdateProfile) {
                        onUpdateProfile({ resetIdDocumentVerification: true });
                      }
                    }}
                    className="text-xs font-semibold text-brand hover:text-brand-dark transition-colors px-3 py-1.5 rounded-lg hover:bg-brand/5"
                  >
                    Modifica
                  </button>
                )}
                <span
                  className={`text-xs font-bold px-2 py-1 rounded ${
                    user.idDocumentVerified
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {user.idDocumentVerified ? 'Verificato' : 'In Attesa / Mancante'}
                </span>
              </div>
            </div>

            {/* Caricamento fronte/retro - mostra sempre se non verificato, o dopo click su Modifica */}
{(!user.idDocumentVerified || idFrontFileName !== null || idBackFileName !== null) && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Fronte */}
    <label className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors flex flex-col items-center justify-center ${
      isUploadingFront 
        ? 'border-brand bg-brand/5 cursor-not-allowed' 
        : 'border-gray-300 hover:bg-gray-100 cursor-pointer'
    }`}>
      {isUploadingFront ? (
        <>
          <svg className="animate-spin w-8 h-8 text-brand mb-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-brand font-medium text-sm">Caricamento in corso...</p>
        </>
      ) : (
        <>
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-gray-600 font-medium text-sm">
            Carica fronte documento
          </p>
          <p className="text-xs text-gray-400 mt-1">
            PDF, JPG o PNG (Max 5MB)
          </p>
          {idFrontFileName && (
            <p className="mt-2 text-xs text-green-600 truncate max-w-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {idFrontFileName}
            </p>
          )}
        </>
      )}
      <input
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={handleIdFileChange('front')}
        disabled={isUploadingFront}
      />
    </label>

    {/* Retro */}
    <label className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors flex flex-col items-center justify-center ${
      isUploadingBack 
        ? 'border-brand bg-brand/5 cursor-not-allowed' 
        : 'border-gray-300 hover:bg-gray-100 cursor-pointer'
    }`}>
      {isUploadingBack ? (
        <>
          <svg className="animate-spin w-8 h-8 text-brand mb-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-brand font-medium text-sm">Caricamento in corso...</p>
        </>
      ) : (
        <>
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-gray-600 font-medium text-sm">
            Carica retro documento
          </p>
          <p className="text-xs text-gray-400 mt-1">
            PDF, JPG o PNG (Max 5MB)
          </p>
          {idBackFileName && (
            <p className="mt-2 text-xs text-green-600 truncate max-w-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {idBackFileName}
            </p>
          )}
        </>
      )}
      <input
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={handleIdFileChange('back')}
        disabled={isUploadingBack}
      />
    </label>
  </div>
)}
            
            {/* Messaggio se documento verificato e non in modifica */}
            {user.idDocumentVerified && idFrontFileName === null && idBackFileName === null && (
              <p className="text-xs text-gray-500 text-center">
                Il tuo documento è stato verificato. Clicca su "Modifica" per caricarne uno nuovo.
              </p>
            )}

            <p className="text-[11px] text-gray-400">
              Dopo aver caricato il documento, il team Renthubber effettuerà una
              verifica manuale. In caso di modifica del documento è necessario
              rifare la verifica.
            </p>
          </div>
        </div>
      </div>

      {/* 🔴 DANGER ZONE - Elimina Account */}
      <div className="bg-white rounded-2xl border-2 border-red-200 shadow-sm p-6">
        <h3 className="font-bold text-red-600 mb-2 flex items-center">
          <AlertTriangle className="w-6 h-6 mr-2" /> Zona Pericolosa
        </h3>
        <p className="text-gray-600 text-sm mb-6">
          Azioni irreversibili sul tuo account
        </p>

        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Trash2 className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-red-900 mb-1">
                Elimina il mio account
              </h4>
              <p className="text-sm text-red-700 mb-3">
                Questa azione è permanente e cancellerà tutti i tuoi dati:
                prenotazioni, recensioni, messaggi e informazioni personali.
              </p>
              <button
                onClick={() => {
                  setDeleteAccountModalOpen(true);
                  setDeleteConfirmText('');
                  setDeleteError(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                Elimina Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  // --- SEZIONE PROFILO (shared) ---
  const renderProfile = () => (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300 pb-20 md:pb-0">
      {/* CARD PROFILO PRINCIPALE */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6">
        {/* AVATAR + UPLOAD */}
        <div className="flex-shrink-0 mx-auto md:mx-0">
          <div
            className="relative w-24 h-24 rounded-full overflow-hidden bg-brand text-white flex items-center justify-center text-2xl font-bold cursor-pointer group"
            onClick={handleAvatarClick}
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={profileData.firstName || user.email}
                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
              />
            ) : (
              <>
                {(
                  profileData.firstName ||
                  user.name ||
                  user.email ||
                  'U'
                )
                  .charAt(0)
                  .toUpperCase()}
              </>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-semibold transition-opacity">
              Cambia foto
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={avatarInputRef}
            onChange={handleAvatarChange}
          />
        </div>

        {/* INFO PROFILO */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-wrap items-center gap-2 mb-2 justify-center md:justify-start">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center md:text-left">
              {profileData.firstName || profileData.lastName
                ? `${profileData.firstName} ${profileData.lastName}`.trim()
                : 'Nuovo utente Renthubber'}
            </h2>

            {user.isSuperHubber && (
              <span className="px-2 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700">
                Super Hubber
              </span>
            )}

            {user.status && (
              <span
                className={`px-2 py-1 text-xs font-bold rounded-full text-center ${
                  user.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {user.status === 'active' ? 'Account attivo' : user.status}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Gestisci le informazioni principali del tuo profilo Renthubber.
            Questi dati sono visibili agli altri utenti quando interagiscono con
            te.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs uppercase font-semibold mb-1">
                Nome
              </p>
              <p className="font-medium text-gray-800">
                {profileData.firstName || '—'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase font-semibold mb-1">
                Cognome
              </p>
              <p className="font-medium text-gray-800">
                {profileData.lastName || '—'}
              </p>
            </div>

            <div>
              <p className="text-gray-400 text-xs uppercase font-semibold mb-1">
                Email
              </p>
              <p className="font-medium text-gray-800">{profileData.email}</p>
            </div>

            <div>
              <p className="text-gray-400 text-xs uppercase font-semibold mb-1">
                Ruolo
              </p>
              <p className="font-medium text-gray-800">
                {user.roles && user.roles.length
                  ? user.roles.join(' · ')
                  : (user as any).role || 'Renter'}
              </p>
            </div>

            <div>
              <p className="text-gray-400 text-xs uppercase font-semibold mb-1">
                Valutazione
              </p>
              <p className="font-medium text-gray-800">
                {typeof user.rating === 'number' && user.rating > 0
                  ? `${user.rating.toFixed(1)} / 5`
                  : 'Nessuna recensione'}
              </p>
            </div>

            <div>
              <p className="text-gray-400 text-xs uppercase font-semibold mb-1">
                Telefono
              </p>
              <p className="font-medium text-gray-800">
                {profileData.phoneNumber || 'Non inserito'}
              </p>
            </div>

            <div>
              <p className="text-gray-400 text-xs uppercase font-semibold mb-1">
                Tipo utente
              </p>
              <p className="font-medium text-gray-800">
                {profileData.userType === 'privato' && 'Privato'}
                {profileData.userType === 'ditta_individuale' &&
                  'Ditta individuale'}
                {profileData.userType === 'societa' && 'Società'}
                {profileData.userType === 'associazione' && 'Associazione'}
              </p>
            </div>

            <div>
              <p className="text-gray-400 text-xs uppercase font-semibold mb-1">
                Data di nascita
              </p>
              <p className="font-medium text-gray-800">
                {profileData.dateOfBirth || 'Non impostata'}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={openProfileModal}
              className="w-full md:w-auto px-4 py-2 rounded-lg border border-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              Modifica dati profilo
            </button>
          </div>
        </div>
      </div>

       {/* DATI DI FATTURAZIONE */}
      <BillingDataSection user={user} userType={profileData.userType} />

      {/* PREFERENZE ACCOUNT */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-2">Preferenze account</h3>
        <p className="text-sm text-gray-500 mb-4">
          Gestisci alcune impostazioni di base del tuo account Renthubber.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          {/* Lingua */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">
              Lingua
            </p>
            <select
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand bg-white"
              value={preferences.language}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  language: e.target.value as 'it' | 'en',
                }))
              }
            >
              <option value="it">Italiano</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Notifiche email */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">
              Notifiche email
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-medium text-gray-800">
                {preferences.emailNotifications ? 'Attive' : 'Disattive'}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPreferences((prev) => ({
                    ...prev,
                    emailNotifications: !prev.emailNotifications,
                  }))
                }
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  preferences.emailNotifications
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {preferences.emailNotifications ? 'Disattiva' : 'Attiva'}
              </button>
            </div>
          </div>

          {/* Privacy profilo */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">
              Privacy profilo
            </p>
            <select
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand bg-white"
              value={preferences.profilePrivacy}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  profilePrivacy: e.target.value as
                    | 'standard'
                    | 'private'
                    | 'public',
                }))
              }
            >
              <option value="standard">Standard</option>
              <option value="private">Profilo più riservato</option>
              <option value="public">Maggiore visibilità</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  // --- PANORAMICA HUBBER ---
  const renderHubberOverview = () => {
    // Dati per il grafico (usa storico reale o fallback)
    const chartData = hubberStats.earningsHistory.length > 0 
      ? hubberStats.earningsHistory 
      : [{ name: 'Nessun dato', value: 0 }];

    // Mese corrente
    const currentMonthName = new Date().toLocaleDateString('it-IT', { month: 'long' });

    // Calcola variazione percentuale rispetto al mese precedente
    let percentChange = 0;
    if (hubberStats.earningsHistory.length >= 2) {
      const current = hubberStats.earningsHistory[hubberStats.earningsHistory.length - 1]?.value || 0;
      const previous = hubberStats.earningsHistory[hubberStats.earningsHistory.length - 2]?.value || 0;
      if (previous > 0) {
        percentChange = Math.round(((current - previous) / previous) * 100);
      }
    }

    // Formatta tempo di risposta
    const formatResponseTime = (minutes: number) => {
      if (minutes < 60) return `${minutes} min`;
      const hours = Math.round(minutes / 60 * 10) / 10;
      return `${hours} ore`;
    };

    return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <style dangerouslySetInnerHTML={{__html: `
        * {
          scrollbar-width: none !important;
        }
        
        *::-webkit-scrollbar {
          width: 0px !important;
          height: 0px !important;
          display: none !important;
        }
        
        *::-webkit-scrollbar-track {
          display: none !important;
        }
        
        *::-webkit-scrollbar-thumb {
          display: none !important;
        }
        
        .overflow-y-auto,
        .overflow-x-auto,
        .overflow-auto {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}} />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Guadagni del mese */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-2 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            {percentChange !== 0 && (
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                percentChange > 0 
                  ? 'text-green-600 bg-green-50' 
                  : 'text-red-600 bg-red-50'
              }`}>
                {percentChange > 0 ? '+' : ''}{percentChange}%
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 capitalize">Guadagni {currentMonthName}</p>
          <h3 className="text-2xl font-bold text-gray-900">
            €{hubberStats.monthlyEarnings.toFixed(2)}
          </h3>
        </div>

        {/* Prenotazioni Attive */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            {hubberStats.pendingBookings > 0 && (
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                {hubberStats.pendingBookings} in attesa
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">Prenotazioni Attive</p>
          <h3 className="text-2xl font-bold text-gray-900">{hubberStats.activeBookings}</h3>
        </div>

        {/* Prenotazioni Completate */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 p-2 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Prenotazioni Completate</p>
          <h3 className="text-2xl font-bold text-gray-900">{hubberStats.completedBookings}</h3>
        </div>

        {/* Saldo Hubber */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-100 p-2 rounded-lg">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Saldo Disponibile</p>
          <h3 className="text-2xl font-bold text-gray-900">€{realHubberBalance.toFixed(2)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Earnings Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">Andamento Guadagni</h3>
          <div className="h-72">
            {hubberStats.isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full"></div>
              </div>
            ) : chartData.length > 0 && chartData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0D414B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0D414B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `€${v}`} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value: number) => [`€${value.toFixed(2)}`, 'Guadagni']}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#0D414B"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <TrendingUp className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">Nessun dato disponibile</p>
                <p className="text-xs mt-1">I guadagni appariranno qui quando avrai prenotazioni</p>
              </div>
            )}
          </div>
        </div>

        {/* Booking Requests */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900">
              Richieste ({hubberStats.pendingBookings})
            </h3>
            <button 
              onClick={() => setActiveTab('hubber_bookings')}
              className="text-sm text-brand font-medium hover:underline"
            >
              Vedi tutte
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 max-h-80">
            {hubberBookings.filter(r => r.status === 'pending').slice(0, 5).map((req) => (
              <div
                key={req.id}
                className="border border-gray-200 rounded-xl p-4 transition-all hover:border-brand/30"
              >
                <div className="flex gap-3 mb-3">
                  <img
                    src={req.listingImage}
                    alt="listing"
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm line-clamp-1">
                      {req.listingTitle}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {req.dates}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg mb-3">
                  <div 
                    className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onViewRenterProfile && (req as any).renterId) {
                        onViewRenterProfile({
                          id: (req as any).renterId,
                          name: req.renterName,
                          avatar: req.renterAvatar,
                        });
                      }
                    }}
                  >
                    <img
                      src={req.renterAvatar}
                      alt="user"
                      className="w-6 h-6 rounded-full mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700 hover:text-brand hover:underline">
                      {req.renterName}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    €{req.totalPrice.toFixed(2)}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleRequestAction(req.id, 'rejected')}
                    className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-bold hover:bg-gray-50"
                  >
                    Rifiuta
                  </button>
                  <button
                    onClick={() => handleRequestAction(req.id, 'accepted')}
                    className="flex-1 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-dark"
                  >
                    Accetta
                  </button>
                </div>
              </div>
            ))}
            
            {hubberBookings.filter(r => r.status === 'pending').length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nessuna richiesta in attesa</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  };

  // --- PAGAMENTI HUBBER ---
  const renderHubberPayments = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Filtra prenotazioni pagate/completate
    let paidHubberBookings = hubberBookings.filter((b) =>
      ['confirmed', 'accepted', 'completed', 'active', 'paid'].includes(b.status)
    );

    // ✅ Applico filtro temporale
    if (hubberPaymentsTimeFilter === 'current') {
      // "Mese corrente"
      paidHubberBookings = paidHubberBookings.filter(b => {
        const bookingDate = new Date(b.start_date || b.startDate || '');
        return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
      });
    }

    // ✅ Raggruppa per anno/mese se "Storico"
    const groupedPayments: Record<string, typeof paidHubberBookings> = {};
    const groupedByYear: Record<string, Record<string, typeof paidHubberBookings>> = {};
    
    if (hubberPaymentsTimeFilter === 'historical') {
      paidHubberBookings.forEach(b => {
        const bookingDate = new Date(b.start_date || b.startDate || '');
        const year = bookingDate.getFullYear();
        const monthKey = `${year}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}`;
        
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
      const sortedGrouped: Record<string, typeof paidHubberBookings> = {};
      sortedKeys.forEach(key => {
        sortedGrouped[key] = groupedPayments[key];
      });
      Object.assign(groupedPayments, sortedGrouped);
    }

    // Verifica se ci sono più anni
    const hasMultipleYears = Object.keys(groupedByYear).length > 1;

    // Toggle espansione mese
    const togglePaymentMonth = (monthKey: string) => {
      const newExpanded = new Set(expandedHubberPaymentsMonths);
      if (newExpanded.has(monthKey)) {
        newExpanded.delete(monthKey);
      } else {
        newExpanded.add(monthKey);
      }
      setExpandedHubberPaymentsMonths(newExpanded);
    };

    // ✅ Filtro fatture per mese corrente o storico
    let filteredInvoices = userInvoices;
    if (hubberInvoicesTimeFilter === 'current') {
      // Mese corrente
      filteredInvoices = userInvoices.filter(inv => {
        const invoiceDate = new Date(inv.created_at);
        return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
      });
    }

    // ✅ Raggruppa fatture per anno/mese se "Storico"
    const groupedInvoices: Record<string, typeof filteredInvoices> = {};
    const groupedInvoicesByYear: Record<string, Record<string, typeof filteredInvoices>> = {};
    
    if (hubberInvoicesTimeFilter === 'historical') {
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
      const newExpanded = new Set(expandedHubberInvoicesMonths);
      if (newExpanded.has(monthKey)) {
        newExpanded.delete(monthKey);
      } else {
        newExpanded.add(monthKey);
      }
      setExpandedHubberInvoicesMonths(newExpanded);
    };

    return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h3 className="font-bold text-gray-900 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-brand" /> Dettaglio
                Prenotazioni & Guadagni
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Lista delle prenotazioni completate o accettate con dettaglio
                commissioni.
              </p>
            </div>
            
            {/* ✅ Toggle temporale */}
            <div className="inline-flex bg-white rounded-xl border border-gray-200 p-1 text-xs justify-center sm:justify-start">
              <button
                onClick={() => setHubberPaymentsTimeFilter('current')}
                className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
                  hubberPaymentsTimeFilter === 'current'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🔵 Mese corrente
              </button>
              <button
                onClick={() => setHubberPaymentsTimeFilter('historical')}
                className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
                  hubberPaymentsTimeFilter === 'historical'
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
                <th className="p-4">N° Transazione</th>
                <th className="p-4">Annuncio</th>
                <th className="p-4">Renter</th>
                <th className="p-4">Stato</th>
                <th className="p-4">Prezzo base</th>
                <th className="p-4 text-red-500">Commissione</th>
                <th className="p-4 text-green-600 text-right">Netto Hubber</th>
              </tr>
            </thead>
            <tbody>
              {/* ✅ Modalità "Mese corrente" - Lista normale */}
              {hubberPaymentsTimeFilter === 'current' && paidHubberBookings.map((booking) => {
                const bookingDate = booking.start_date || booking.startDate || '';
                const transactionNumber = getTransactionNumber(booking.id, true); // ✅ USA HELPER GLOBALE
                
                return (
                  <tr
                    key={booking.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="p-4 text-xs whitespace-nowrap">
                      {booking.dates}
                    </td>
                    <td className="p-4 font-mono text-xs text-gray-600">
                      {transactionNumber}
                    </td>
                    <td className="p-4 font-medium text-gray-900">
                      {booking.listingTitle}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => {
                          if (onViewRenterProfile && (booking as any).renterId) {
                            onViewRenterProfile({
                              id: (booking as any).renterId,
                              name: booking.renterName,
                              avatar: booking.renterAvatar,
                            });
                          }
                        }}
                        className="text-gray-600 hover:text-brand hover:underline"
                      >
                        {booking.renterName}
                      </button>
                    </td>
                    <td className="p-4">
                      {renderBookingStatusBadge(booking.status)}
                    </td>
                    <td className="p-4 font-bold">
                      €{booking.totalPrice.toFixed(2)}
                    </td>
                    <td className="p-4 text-red-500">
                      - €{booking.commission?.toFixed(2) || '0.00'}
                    </td>
                    <td className="p-4 font-bold text-green-600 text-right">
                      €
                      {booking.netEarnings?.toFixed(2) ||
                        booking.totalPrice.toFixed(2)}
                    </td>
                  </tr>
                );
              })}

              {/* ✅ Modalità "Storico" - Raggruppato per anno/mese */}
              {hubberPaymentsTimeFilter === 'historical' && (() => {
                const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                                   'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
                
                if (hasMultipleYears) {
                  return Object.keys(groupedByYear).sort().reverse().map(year => (
                    <React.Fragment key={year}>
                      <tr className="bg-gray-100 border-b-2 border-gray-300">
                        <td colSpan={8} className="p-4">
                          <span className="text-base font-bold text-gray-900">
                            📆 {year}
                          </span>
                        </td>
                      </tr>
                      
                      {Object.keys(groupedByYear[year]).sort().reverse().map(monthKey => {
                        const monthPayments = groupedByYear[year][monthKey];
                        const [, month] = monthKey.split('-');
                        const monthName = monthNames[parseInt(month) - 1];
                        const isExpanded = expandedHubberPaymentsMonths.has(monthKey);
                        
                        return (
                          <React.Fragment key={monthKey}>
                            <tr 
                              className="bg-gray-50 border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
                              onClick={() => togglePaymentMonth(monthKey)}
                            >
                              <td colSpan={8} className="p-3">
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
                            
                            {isExpanded && monthPayments.map((booking) => {
                              const bookingDate = booking.start_date || booking.startDate || '';
                              const transactionNumber = getTransactionNumber(booking.id, true); // ✅ USA HELPER GLOBALE
                              
                              return (
                                <tr
                                  key={booking.id}
                                  onClick={(e) => e.stopPropagation()}
                                  className="border-b border-gray-50 hover:bg-gray-50"
                                >
                                  <td className="p-4 text-xs whitespace-nowrap">
                                    {booking.dates}
                                  </td>
                                  <td className="p-4 font-mono text-xs text-gray-600">
                                    {transactionNumber}
                                  </td>
                                  <td className="p-4 font-medium text-gray-900">
                                    {booking.listingTitle}
                                  </td>
                                  <td className="p-4">
                                    <button
                                      onClick={() => {
                                        if (onViewRenterProfile && (booking as any).renterId) {
                                          onViewRenterProfile({
                                            id: (booking as any).renterId,
                                            name: booking.renterName,
                                            avatar: booking.renterAvatar,
                                          });
                                        }
                                      }}
                                      className="text-gray-600 hover:text-brand hover:underline"
                                    >
                                      {booking.renterName}
                                    </button>
                                  </td>
                                  <td className="p-4">
                                    {renderBookingStatusBadge(booking.status)}
                                  </td>
                                  <td className="p-4 font-bold">
                                    €{booking.totalPrice.toFixed(2)}
                                  </td>
                                  <td className="p-4 text-red-500">
                                    - €{booking.commission?.toFixed(2) || '0.00'}
                                  </td>
                                  <td className="p-4 font-bold text-green-600 text-right">
                                    €
                                    {booking.netEarnings?.toFixed(2) ||
                                      booking.totalPrice.toFixed(2)}
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
                    const isExpanded = expandedHubberPaymentsMonths.has(monthKey);
                    
                    return (
                      <React.Fragment key={monthKey}>
                        <tr 
                          className="bg-gray-50 border-b-2 border-gray-200 hover:bg-gray-100 cursor-pointer"
                          onClick={() => togglePaymentMonth(monthKey)}
                        >
                          <td colSpan={8} className="p-3">
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
                        
                        {isExpanded && monthPayments.map((booking) => {
                          const bookingDate = booking.start_date || booking.startDate || '';
                          const transactionNumber = getTransactionNumber(booking.id, true); // ✅ USA HELPER GLOBALE
                          
                          return (
                            <tr
                              key={booking.id}
                              onClick={(e) => e.stopPropagation()}
                              className="border-b border-gray-50 hover:bg-gray-50"
                            >
                              <td className="p-4 text-xs whitespace-nowrap">
                                {booking.dates}
                              </td>
                              <td className="p-4 font-mono text-xs text-gray-600">
                                {transactionNumber}
                              </td>
                              <td className="p-4 font-medium text-gray-900">
                                {booking.listingTitle}
                              </td>
                              <td className="p-4">
                                <button
                                  onClick={() => {
                                    if (onViewRenterProfile && (booking as any).renterId) {
                                      onViewRenterProfile({
                                        id: (booking as any).renterId,
                                        name: booking.renterName,
                                        avatar: booking.renterAvatar,
                                      });
                                    }
                                  }}
                                  className="text-gray-600 hover:text-brand hover:underline"
                                >
                                  {booking.renterName}
                                </button>
                              </td>
                              <td className="p-4">
                                {renderBookingStatusBadge(booking.status)}
                              </td>
                              <td className="p-4 font-bold">
                                €{booking.totalPrice.toFixed(2)}
                              </td>
                              <td className="p-4 text-red-500">
                                - €{booking.commission?.toFixed(2) || '0.00'}
                              </td>
                              <td className="p-4 font-bold text-green-600 text-right">
                                €
                                {booking.netEarnings?.toFixed(2) ||
                                  booking.totalPrice.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  });
                }
              })()}

              {paidHubberBookings.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    Nessuna prenotazione registrata.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fatture */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h3 className="font-bold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-brand" /> Fatture da
                Renthubber
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Le fatture per le commissioni del servizio trattenute dalla
                piattaforma.
              </p>
            </div>
            
            {/* ✅ Toggle temporale */}
            <div className="inline-flex bg-white rounded-xl border border-gray-200 p-1 text-xs justify-center sm:justify-start">
              <button
                onClick={() => setHubberInvoicesTimeFilter('current')}
                className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
                  hubberInvoicesTimeFilter === 'current'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🔵 Mese corrente
              </button>
              <button
                onClick={() => setHubberInvoicesTimeFilter('historical')}
                className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
                  hubberInvoicesTimeFilter === 'historical'
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
                <th className="p-4">Numero Fattura</th>
                <th className="p-4">Periodo di Riferimento</th>
                <th className="p-4">Totale Servizio</th>
                <th className="p-4">Stato</th>
                <th className="p-4 text-right">Download</th>
              </tr>
            </thead>
            <tbody>
             {/* ✅ Modalità "Mese corrente" - Lista normale */}
             {hubberInvoicesTimeFilter === 'current' && filteredInvoices.map((inv) => (
                <tr
                  key={inv.id}
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

              {/* ✅ Modalità "Storico" - Raggruppato per anno/mese */}
              {hubberInvoicesTimeFilter === 'historical' && (() => {
                const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                                   'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
                
                if (hasMultipleInvoiceYears) {
                  return Object.keys(groupedInvoicesByYear).sort().reverse().map(year => (
                    <React.Fragment key={year}>
                      <tr className="bg-gray-100 border-b-2 border-gray-300">
                        <td colSpan={6} className="p-4">
                          <span className="text-base font-bold text-gray-900">
                            📆 {year}
                          </span>
                        </td>
                      </tr>
                      
                      {Object.keys(groupedInvoicesByYear[year]).sort().reverse().map(monthKey => {
                        const monthInvoices = groupedInvoicesByYear[year][monthKey];
                        const [, month] = monthKey.split('-');
                        const monthName = monthNames[parseInt(month) - 1];
                        const isExpanded = expandedHubberInvoicesMonths.has(monthKey);
                        
                        return (
                          <React.Fragment key={monthKey}>
                            <tr 
                              className="bg-gray-50 border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
                              onClick={() => toggleInvoiceMonth(monthKey)}
                            >
                              <td colSpan={6} className="p-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="text-sm font-bold text-gray-800">
                                      {isExpanded ? '▼' : '▶'} {monthName}
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
                    const isExpanded = expandedHubberInvoicesMonths.has(monthKey);
                    
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
    </div>
    );
  };
  
  // --- PRENOTAZIONI RENTER ---
  const renderRenterBookings = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Applico filtro temporale
    let filteredRenterBookings = renterBookings.filter((b) => {
      if (renterTimeFilter === 'current') {
        // "In corso" = prenotazioni attive, future o correnti
        const endDate = new Date(b.end_date || b.endDate || '');
        const activeStatuses = ['pending', 'accepted', 'confirmed', 'paid', 'active'];
        
        // Mostra se: (1) stato attivo E (2) data fine >= oggi
        return activeStatuses.includes(b.status) && endDate >= today;
      }
      
      // "Storico" = tutte le prenotazioni
      return true;
    });

    // ✅ Raggruppa per mese se "Storico"
    const groupedBookings: Record<string, typeof filteredRenterBookings> = {};
    const groupedByYear: Record<string, Record<string, typeof filteredRenterBookings>> = {};
    
    if (renterTimeFilter === 'historical') {
      filteredRenterBookings.forEach(b => {
        const startDate = new Date(b.start_date || b.startDate || '');
        const year = startDate.getFullYear();
        const monthKey = `${year}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!groupedBookings[monthKey]) {
          groupedBookings[monthKey] = [];
        }
        groupedBookings[monthKey].push(b);
        
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
      const sortedKeys = Object.keys(groupedBookings).sort().reverse();
      const sortedGrouped: Record<string, typeof filteredRenterBookings> = {};
      sortedKeys.forEach(key => {
        sortedGrouped[key] = groupedBookings[key];
      });
      Object.assign(groupedBookings, sortedGrouped);
    }

    // Verifica se ci sono più anni
    const hasMultipleYears = Object.keys(groupedByYear).length > 1;

    // Toggle espansione mese
    const toggleRenterMonth = (monthKey: string) => {
      const newExpanded = new Set(expandedRenterMonths);
      if (newExpanded.has(monthKey)) {
        newExpanded.delete(monthKey);
      } else {
        newExpanded.add(monthKey);
      }
      setExpandedRenterMonths(newExpanded);
    };

    return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ✅ NUOVO: Header con toggle temporale */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center md:text-left">
            Le mie prenotazioni
          </h2>
          <p className="text-sm text-gray-500">
            Tutte le prenotazioni che hai effettuato su Renthubber.
          </p>
        </div>

        {/* Toggle temporale */}
        <div className="inline-flex bg-white rounded-xl border border-gray-200 p-1 text-xs justify-center sm:justify-start">
          <button
            onClick={() => setRenterTimeFilter('current')}
            className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
              renterTimeFilter === 'current'
                ? 'bg-brand text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🔵 In corso
          </button>
          <button
            onClick={() => setRenterTimeFilter('historical')}
            className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
              renterTimeFilter === 'historical'
                ? 'bg-brand text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📅 Storico
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LISTA PRENOTAZIONI */}
        <div className={`${selectedRenterBooking ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden`}>
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-brand" /> {filteredRenterBookings.length} prenotazioni
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              Clicca su una prenotazione per vedere i dettagli.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-100">
                <tr>
                  <th className="p-4">Periodo</th>
                  <th className="p-4">Annuncio</th>
                  <th className="p-4">Stato</th>
                  <th className="p-4 text-right">Totale</th>
                  <th className="p-4 text-center">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {/* ✅ Modalità "In corso" - Lista normale */}
                {renterTimeFilter === 'current' && filteredRenterBookings.map((booking) => {
                  const isSelected = selectedRenterBooking?.id === booking.id;
                  // Usa renterTotalPaid se disponibile, altrimenti fallback
                  const displayTotal = (booking as any).renterTotalPaid || booking.totalPrice;
                  
                  return (
                    <tr
                      key={booking.id}
                      onClick={() => loadBookingDetail(booking)}
                      className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50 hover:bg-blue-50' : ''
                      }`}
                    >
                      <td className="p-4 text-xs whitespace-nowrap">
                        {booking.dates}
                      </td>
                      <td className="p-4 font-medium text-gray-900">
                        {booking.listingTitle}
                      </td>
                      <td className="p-4">
                        {renderBookingStatusBadge(booking.status)}
                      </td>
                      <td className="p-4 font-bold text-right">
                        €{displayTotal.toFixed(2)}
                      </td>
                     <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
  {booking.status === 'completed' ? (
    (booking as any).hasReviewed ? (
      <span className="px-3 py-1.5 rounded-lg text-xs font-bold text-green-600 bg-green-50 inline-flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" /> Recensito
      </span>
    ) : (
      <button
        onClick={() => openReviewModal(booking, 'renter_to_hubber')}
        className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors inline-flex items-center gap-1"
      >
        <Star className="w-3 h-3" /> Recensione
      </button>
    )
  ) : canCancelBooking(booking.status) ? (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => openModifyModal(booking)}
        className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1"
      >
        <Edit3 className="w-3 h-3" />
        Modifica
      </button>
      <button
        onClick={() => openCancelModal(booking)}
        className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
      >
        Cancella
      </button>
    </div>
  ) : (
    <span className="text-xs text-gray-400">—</span>
  )}
</td>
                    </tr>
                  );
                })}

                {/* ✅ Modalità "Storico" - Raggruppato per anno/mese */}
                {renterTimeFilter === 'historical' && (() => {
                  const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                                     'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
                  
                  if (hasMultipleYears) {
                    // Mostra anni separati
                    return Object.keys(groupedByYear).sort().reverse().map(year => (
                      <React.Fragment key={year}>
                        {/* Header Anno */}
                        <tr className="bg-gray-100 border-b-2 border-gray-300">
                          <td colSpan={5} className="p-4">
                            <span className="text-base font-bold text-gray-900">
                              📆 {year}
                            </span>
                          </td>
                        </tr>
                        
                        {/* Mesi dell'anno */}
                        {Object.keys(groupedByYear[year]).sort().reverse().map(monthKey => {
                          const monthBookings = groupedByYear[year][monthKey];
                          const [, month] = monthKey.split('-');
                          const monthName = monthNames[parseInt(month) - 1];
                          const isExpanded = expandedRenterMonths.has(monthKey);
                          
                          return (
                            <React.Fragment key={monthKey}>
                              {/* Header mese espandibile */}
                              <tr 
                                className="bg-gray-50 border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
                                onClick={() => toggleRenterMonth(monthKey)}
                              >
                                <td colSpan={5} className="p-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="text-sm font-bold text-gray-800">
                                        {isExpanded ? '▼' : '▶'} {monthName}
                                      </span>
                                      <span className="ml-2 text-xs text-gray-500">
                                        ({monthBookings.length} prenotazioni)
                                      </span>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                      {isExpanded ? 'Clicca per chiudere' : 'Clicca per aprire'}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                              
                              {/* Prenotazioni del mese (solo se espanso) */}
                              {isExpanded && monthBookings.map((booking) => {
                                const isSelected = selectedRenterBooking?.id === booking.id;
                                const displayTotal = (booking as any).renterTotalPaid || booking.totalPrice;
                                
                                return (
                                  <tr
                                    key={booking.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      loadBookingDetail(booking);
                                    }}
                                    className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                                      isSelected ? 'bg-blue-50 hover:bg-blue-50' : ''
                                    }`}
                                  >
                                    <td className="p-4 text-xs whitespace-nowrap">
                                      {booking.dates}
                                    </td>
                                    <td className="p-4 font-medium text-gray-900">
                                      {booking.listingTitle}
                                    </td>
                                    <td className="p-4">
                                      {renderBookingStatusBadge(booking.status)}
                                    </td>
                                    <td className="p-4 font-bold text-right">
                                      €{displayTotal.toFixed(2)}
                                    </td>
                                   <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
  {booking.status === 'completed' ? (
    (booking as any).hasReviewed ? (
      <span className="px-3 py-1.5 rounded-lg text-xs font-bold text-green-600 bg-green-50 inline-flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" /> Recensito
      </span>
    ) : (
      <button
        onClick={() => openReviewModal(booking, 'renter_to_hubber')}
        className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors inline-flex items-center gap-1"
      >
        <Star className="w-3 h-3" /> Recensione
      </button>
    )
  ) : canCancelBooking(booking.status) ? (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => openModifyModal(booking)}
        className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1"
      >
        <Edit3 className="w-3 h-3" />
        Modifica
      </button>
      <button
        onClick={() => openCancelModal(booking)}
        className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
      >
        Cancella
      </button>
    </div>
  ) : (
    <span className="text-xs text-gray-400">—</span>
  )}
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
                    return Object.keys(groupedBookings).map((monthKey) => {
                      const monthBookings = groupedBookings[monthKey];
                      const [year, month] = monthKey.split('-');
                      const monthName = monthNames[parseInt(month) - 1];
                      const isExpanded = expandedRenterMonths.has(monthKey);
                      
                      return (
                        <React.Fragment key={monthKey}>
                          {/* Header mese espandibile */}
                          <tr 
                            className="bg-gray-50 border-b-2 border-gray-200 hover:bg-gray-100 cursor-pointer"
                            onClick={() => toggleRenterMonth(monthKey)}
                          >
                            <td colSpan={5} className="p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-sm font-bold text-gray-800">
                                    {isExpanded ? '▼' : '▶'} {monthName} {year}
                                  </span>
                                  <span className="ml-2 text-xs text-gray-500">
                                    ({monthBookings.length} prenotazioni)
                                  </span>
                                </div>
                                <span className="text-xs text-gray-400">
                                  {isExpanded ? 'Clicca per chiudere' : 'Clicca per aprire'}
                                </span>
                              </div>
                            </td>
                          </tr>
                          
                          {/* Prenotazioni del mese (solo se espanso) */}
                          {isExpanded && monthBookings.map((booking) => {
                            const isSelected = selectedRenterBooking?.id === booking.id;
                            const displayTotal = (booking as any).renterTotalPaid || booking.totalPrice;
                            
                            return (
                              <tr
                                key={booking.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  loadBookingDetail(booking);
                                }}
                                className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                                  isSelected ? 'bg-blue-50 hover:bg-blue-50' : ''
                                }`}
                              >
                                <td className="p-4 text-xs whitespace-nowrap">
                                  {booking.dates}
                                </td>
                                <td className="p-4 font-medium text-gray-900">
                                  {booking.listingTitle}
                                </td>
                                <td className="p-4">
                                  {renderBookingStatusBadge(booking.status)}
                                </td>
                                <td className="p-4 font-bold text-right">
                                  €{displayTotal.toFixed(2)}
                                </td>
                               <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
  {booking.status === 'completed' ? (
    (booking as any).hasReviewed ? (
      <span className="px-3 py-1.5 rounded-lg text-xs font-bold text-green-600 bg-green-50 inline-flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" /> Recensito
      </span>
    ) : (
      <button
        onClick={() => openReviewModal(booking, 'renter_to_hubber')}
        className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors inline-flex items-center gap-1"
      >
        <Star className="w-3 h-3" /> Recensione
      </button>
    )
  ) : canCancelBooking(booking.status) ? (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => openModifyModal(booking)}
        className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1"
      >
        <Edit3 className="w-3 h-3" />
        Modifica
      </button>
      <button
        onClick={() => openCancelModal(booking)}
        className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
      >
        Cancella
      </button>
    </div>
  ) : (
    <span className="text-xs text-gray-400">—</span>
  )}
</td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    });
                  }
                })()}

                {filteredRenterBookings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400">
                      Non hai ancora effettuato nessuna prenotazione.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* DETTAGLIO PRENOTAZIONE */}
        {selectedRenterBooking && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Dettaglio prenotazione</h3>
              <button
                onClick={closeBookingDetail}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Info prenotazione */}
            <div className="flex items-start gap-3 mb-4 pb-4 border-b border-gray-100">
              <div className="w-16 h-16 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                {selectedRenterBooking.listingImage && (
                  <img
                    src={selectedRenterBooking.listingImage}
                    alt={selectedRenterBooking.listingTitle}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-sm">
                  {selectedRenterBooking.listingTitle}
                </h4>
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {selectedRenterBooking.dates}
                </p>
                <div className="mt-2">
                  {renderBookingStatusBadge(selectedRenterBooking.status)}
                </div>
             </div>
          </div>

{/* Proprietario/Hubber */}
<div className="mb-4 pb-4 border-b border-gray-100">
  <p className="text-xs text-gray-400 uppercase font-semibold mb-2">
    Hubber
  </p>
  <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
      {selectedRenterBooking.hubberAvatar ? (
        <img
          src={selectedRenterBooking.hubberAvatar}
          alt={selectedRenterBooking.hubberName || 'Proprietario'}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">
          {(selectedRenterBooking.hubberName || 'H')[0].toUpperCase()}
        </div>
      )}
    </div>
    <div className="flex-1">
      <p className="font-semibold text-gray-900 text-sm">
        {selectedRenterBooking.hubberName || 'Proprietario'}
      </p>
      <p className="text-xs text-gray-500"></p>
    </div>
  </div>
</div>

            {/* Codice prenotazione */}
            <div className="bg-gray-50 rounded-xl p-3 mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Codice Prenotazione</p>
                <p className="text-lg font-mono font-bold text-brand tracking-wider">
                  #{selectedRenterBooking.id.replace(/-/g, '').slice(0, 6).toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => {
                  const code = selectedRenterBooking.id.replace(/-/g, '').slice(0, 6).toUpperCase();
                  navigator.clipboard.writeText(code);
                }}
                className="text-xs text-brand hover:underline"
              >
                Copia
              </button>
            </div>

            {/* Indirizzo ritiro - solo se confermata/accettata */}
            {(selectedRenterBooking.status === 'confirmed' || selectedRenterBooking.status === 'accepted') && bookingDetailData && (
              <div className="bg-brand/5 border border-brand/20 rounded-xl p-4 mb-4">
                <p className="text-xs text-brand uppercase font-semibold mb-2 flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  Indirizzo di ritiro
                </p>
                {(bookingDetailData as any).pickupAddress ? (
                  <>
                    <p className="font-bold text-gray-900 text-sm">
                      {(bookingDetailData as any).pickupAddress}
                    </p>
                    {(bookingDetailData as any).pickupCity && (
                      <p className="text-sm text-gray-600">{(bookingDetailData as any).pickupCity}</p>
                    )}
                    {(bookingDetailData as any).pickupInstructions && (
                      <p className="text-xs text-gray-500 mt-2 italic">
                        "{(bookingDetailData as any).pickupInstructions}"
                      </p>
                    )}
                    <button
                      onClick={() => {
                        const address = encodeURIComponent(
                          `${(bookingDetailData as any).pickupAddress}, ${(bookingDetailData as any).pickupCity || ''}`
                        );
                        window.open(
                          `https://www.google.com/maps/search/?api=1&query=${address}`,
                          '_blank'
                        );
                      }}
                      className="mt-3 w-full bg-brand text-white font-bold py-2 px-4 rounded-lg text-sm hover:bg-brand-dark transition-colors flex items-center justify-center gap-2"
                    >
                      <MapPin className="w-4 h-4" />
                      Apri in Google Maps
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">
                    L'hubber non ha ancora inserito l'indirizzo. Contattalo per maggiori informazioni.
                  </p>
                )}
              </div>
            )}

            {/* Messaggio se in attesa di conferma */}
            {selectedRenterBooking.status === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                <p className="text-xs text-yellow-700 font-semibold mb-1 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  In attesa di conferma
                </p>
                <p className="text-sm text-yellow-600">
                  L'indirizzo di ritiro sarà visibile dopo la conferma dell'hubber.
                </p>
              </div>
            )}

            {/* Breakdown costi */}
            {loadingBookingDetail ? (
              <div className="text-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-brand border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Caricamento dettagli...</p>
              </div>
            ) : bookingDetailData ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-2">
                    Riepilogo costi
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        €{bookingDetailData.listingPrice.toFixed(2)} × {bookingDetailData.days} {bookingDetailData.days === 1 ? bookingDetailData.priceUnit : bookingDetailData.priceUnit === 'giorno' ? 'giorni' : bookingDetailData.priceUnit}
                      </span>
                      <span className="font-medium text-gray-900">
                        €{bookingDetailData.basePrice.toFixed(2)}
                      </span>
                    </div>
                    {bookingDetailData.cleaningFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Costo pulizia
                        </span>
                        <span className="font-medium text-gray-900">
                          €{bookingDetailData.cleaningFee.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Commissione servizio (10%)
                      </span>
                      <span className="font-medium text-gray-900">
                        €{bookingDetailData.commission.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Fee fissa piattaforma
                      </span>
                      <span className="font-medium text-gray-900">
                        €{bookingDetailData.fixedFee.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <div className="flex justify-between text-base font-bold">
                    <span className="text-gray-900">Totale pagato</span>
                    <span className="text-brand">€{bookingDetailData.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Metodo di pagamento */}
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-2">
                    Metodo di pagamento
                  </p>
                  <div className="space-y-1 text-sm">
                    {bookingDetailData.walletUsed > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Wallet</span>
                        <span className="font-medium text-gray-900">
                          €{bookingDetailData.walletUsed.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {bookingDetailData.cardPaid > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Carta</span>
                        <span className="font-medium text-gray-900">
                          €{bookingDetailData.cardPaid.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Politica di cancellazione */}
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-2">
                    Politica di cancellazione
                  </p>
                  {(() => {
                    const policyInfo = formatCancellationPolicy(bookingDetailData.cancellationPolicy);
                    return (
                      <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ${policyInfo.color}`}>
                        {policyInfo.label}
                      </div>
                    );
                  })()}
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCancellationPolicy(bookingDetailData.cancellationPolicy).description}
                  </p>
                  
                  {/* Anteprima rimborso se cancelli ora */}
                  {canCancelBooking(selectedRenterBooking.status) && (
                    <div className={`mt-2 p-2 rounded-lg text-xs ${
                      bookingDetailData.refundInfo.percentage === 100 
                        ? 'bg-green-50 text-green-700'
                        : bookingDetailData.refundInfo.percentage > 0
                          ? 'bg-yellow-50 text-yellow-700'
                          : 'bg-red-50 text-red-700'
                    }`}>
                      <p className="font-medium">Se cancelli ora:</p>
                      <p>{bookingDetailData.refundInfo.message}</p>
                      {bookingDetailData.refundInfo.amount > 0 && (
                        <p className="font-bold mt-1">
                          Rimborso: €{bookingDetailData.refundInfo.amount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Azioni */}
                {canCancelBooking(selectedRenterBooking.status) && (
                  <div className="border-t border-gray-100 pt-4 mt-4 space-y-2">
                    <button
                      onClick={() => openModifyModal(selectedRenterBooking)}
                      className="w-full py-2.5 rounded-xl border border-blue-200 text-blue-600 font-bold text-sm hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Modifica date
                    </button>
                    <button
                      onClick={() => openCancelModal(selectedRenterBooking)}
                      className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors"
                    >
                      Cancella prenotazione
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                <p>Seleziona una prenotazione per vedere i dettagli</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    );
  };

  // --- PRENOTAZIONI HUBBER: LISTA + DETTAGLIO ---
  const renderHubberBookingsList = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Applico il filtro scelto
    let filteredHubberBookings = hubberBookings.filter((b) => {
      // Filtro per stato
      if (hubberBookingFilter !== 'all') {
        // Considero anche 'confirmed' come stato valido per 'accepted'
        if (hubberBookingFilter === 'accepted' && b.status === 'confirmed') {
          // continua
        } else if (b.status !== hubberBookingFilter) {
          return false;
        }
      }

      // ✅ NUOVO: Filtro temporale
      if (hubberTimeFilter === 'current') {
        // "In corso" = prenotazioni attive, future o correnti
        const endDate = new Date(b.end_date || b.endDate || '');
        const activeStatuses = ['pending', 'accepted', 'confirmed', 'paid', 'active'];
        
        // Mostra se: (1) stato attivo E (2) data fine >= oggi
        return activeStatuses.includes(b.status) && endDate >= today;
      }
      
      // "Storico" = tutte le prenotazioni (già filtrate per stato sopra)
      return true;
    });

    // ✅ NUOVO: Raggruppa per mese se "Storico"
    const groupedBookings: Record<string, typeof filteredHubberBookings> = {};
    const groupedByYear: Record<string, Record<string, typeof filteredHubberBookings>> = {};
    
    if (hubberTimeFilter === 'historical') {
      filteredHubberBookings.forEach(b => {
        const startDate = new Date(b.start_date || b.startDate || '');
        const year = startDate.getFullYear();
        const monthKey = `${year}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!groupedBookings[monthKey]) {
          groupedBookings[monthKey] = [];
        }
        groupedBookings[monthKey].push(b);
        
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
      const sortedKeys = Object.keys(groupedBookings).sort().reverse();
      const sortedGrouped: Record<string, typeof filteredHubberBookings> = {};
      sortedKeys.forEach(key => {
        sortedGrouped[key] = groupedBookings[key];
      });
      Object.assign(groupedBookings, sortedGrouped);
    }

    // Verifica se ci sono più anni
    const hasMultipleYears = Object.keys(groupedByYear).length > 1;

    // Toggle espansione mese
    const toggleMonth = (monthKey: string) => {
      const newExpanded = new Set(expandedMonths);
      if (newExpanded.has(monthKey)) {
        newExpanded.delete(monthKey);
      } else {
        newExpanded.add(monthKey);
      }
      setExpandedMonths(newExpanded);
    };

    const selectedBooking =
      filteredHubberBookings.find((b) => b.id === selectedHubberBookingId) ||
      filteredHubberBookings[0] ||
      null;

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center md:text-left">
              Prenotazioni ricevute
            </h2>
            <p className="text-sm text-gray-500">
              Gestisci tutte le prenotazioni dei tuoi annunci come Hubber.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {/* ✅ NUOVO: Toggle temporale */}
            <div className="inline-flex bg-white rounded-xl border border-gray-200 p-1 text-xs justify-center sm:justify-start">
              <button
                onClick={() => setHubberTimeFilter('current')}
                className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
                  hubberTimeFilter === 'current'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🔵 In corso
              </button>
              <button
                onClick={() => setHubberTimeFilter('historical')}
                className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
                  hubberTimeFilter === 'historical'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📅 Storico
              </button>
            </div>

            {/* Filtri stato */}
            <div className="inline-flex bg-white rounded-xl border border-gray-200 p-1 text-xs flex-wrap justify-center sm:justify-start">
              {(
                [
                  { key: 'all', label: 'Tutte' },
                  { key: 'pending', label: 'In attesa' },
                  { key: 'accepted', label: 'Accettate' },
                  { key: 'completed', label: 'Completate' },
                  { key: 'cancelled', label: 'Cancellate' },
                  { key: 'rejected', label: 'Rifiutate' },
                ] as { key: HubberBookingFilter; label: string }[]
              ).map((item) => (
                <button
                  key={item.key}
                  onClick={() => setHubberBookingFilter(item.key)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    hubberBookingFilter === item.key
                      ? 'bg-gray-100 text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LISTA PRENOTAZIONI */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50 flex justify-between items-center">
              <span className="font-bold text-gray-800 text-sm">
                {filteredHubberBookings.length} prenotazioni
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="p-3">Periodo</th>
                    <th className="p-3">Annuncio</th>
                    <th className="p-3">Renter</th>
                    <th className="p-3">Stato</th>
                    <th className="p-3 text-right">Prezzo base</th>
                    <th className="p-3 text-center">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {/* ✅ Modalità "In corso" - Lista normale */}
                  {hubberTimeFilter === 'current' && filteredHubberBookings.map((booking) => {
  
                    const isSelected = booking.id === selectedHubberBookingId;
                    return (
                      <tr
                        key={booking.id}
                        onClick={() => setSelectedHubberBookingId(booking.id)}
                        className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                          isSelected ? 'bg-gray-50' : ''
                        }`}
                      >
                        <td className="p-3 text-xs whitespace-nowrap">
                          {booking.dates}
                        </td>
                        <td className="p-3 font-medium text-gray-900">
                          {booking.listingTitle}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onViewRenterProfile && (booking as any).renterId) {
                                onViewRenterProfile({
                                  id: (booking as any).renterId,
                                  name: booking.renterName,
                                  avatar: booking.renterAvatar,
                                });
                              }
                            }}
                            className="text-gray-600 hover:text-brand hover:underline"
                          >
                            {booking.renterName}
                          </button>
                        </td>
                        <td className="p-3">
                          {renderBookingStatusBadge(booking.status)}
                        </td>
                        <td className="p-3 text-right">
  {booking.status === 'cancelled' ? (
    <div className="space-y-0.5">
      <div className="text-gray-400 line-through text-xs">
        €{booking.totalPrice.toFixed(2)}
      </div>
      <div className="font-bold text-red-600 text-sm">
        €0.00
      </div>
    </div>
  ) : (
    <span className="font-bold">
      €{booking.totalPrice.toFixed(2)}
    </span>
  )}
</td>
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          {booking.status === 'completed' ? (
                            (booking as any).hasReviewedByHubber ? (
                              <span className="px-3 py-1.5 rounded-lg text-xs font-bold text-green-600 bg-green-50 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Recensito
                              </span>
                            ) : (
                              <button
                                onClick={() => openReviewModal(booking, 'hubber_to_renter')}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors inline-flex items-center gap-1"
                              >
                                <Star className="w-3 h-3" /> Recensione
                              </button>
                            )
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* ✅ Modalità "Storico" - Raggruppato per anno/mese */}
                  {hubberTimeFilter === 'historical' && (() => {
                    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                                       'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
                    
                    if (hasMultipleYears) {
                      // Mostra anni separati
                      return Object.keys(groupedByYear).sort().reverse().map(year => (
                        <React.Fragment key={year}>
                          {/* Header Anno */}
                          <tr className="bg-gray-100 border-b-2 border-gray-300">
                            <td colSpan={6} className="p-4">
                              <span className="text-base font-bold text-gray-900">
                                📆 {year}
                              </span>
                            </td>
                          </tr>
                          
                          {/* Mesi dell'anno */}
                          {Object.keys(groupedByYear[year]).sort().reverse().map(monthKey => {
                            const monthBookings = groupedByYear[year][monthKey];
                            const [, month] = monthKey.split('-');
                            const monthName = monthNames[parseInt(month) - 1];
                            const isExpanded = expandedMonths.has(monthKey);
                            
                            return (
                              <React.Fragment key={monthKey}>
                                {/* Header mese espandibile */}
                                <tr 
                                  className="bg-gray-50 border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
                                  onClick={() => toggleMonth(monthKey)}
                                >
                                  <td colSpan={6} className="p-3">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <span className="text-sm font-bold text-gray-800">
                                          {isExpanded ? '▼' : '▶'} {monthName}
                                        </span>
                                        <span className="ml-2 text-xs text-gray-500">
                                          ({monthBookings.length} prenotazioni)
                                        </span>
                                      </div>
                                      <span className="text-xs text-gray-400">
                                        {isExpanded ? 'Clicca per chiudere' : 'Clicca per aprire'}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                                
                                {/* Prenotazioni del mese (solo se espanso) */}
                                {isExpanded && monthBookings.map((booking) => {
                                  const isSelected = booking.id === selectedHubberBookingId;
                                  return (
                                    <tr
                                      key={booking.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedHubberBookingId(booking.id);
                                      }}
                                      className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                                        isSelected ? 'bg-gray-50' : ''
                                      }`}
                                    >
                                      <td className="p-3 text-xs whitespace-nowrap">
                                        {booking.dates}
                                      </td>
                                      <td className="p-3 font-medium text-gray-900">
                                        {booking.listingTitle}
                                      </td>
                                      <td className="p-3">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (onViewRenterProfile && (booking as any).renterId) {
                                              onViewRenterProfile({
                                                id: (booking as any).renterId,
                                                name: booking.renterName,
                                                avatar: booking.renterAvatar,
                                              });
                                            }
                                          }}
                                          className="text-gray-600 hover:text-brand hover:underline"
                                        >
                                          {booking.renterName}
                                        </button>
                                      </td>
                                      <td className="p-3">
                                        {renderBookingStatusBadge(booking.status)}
                                      </td>
                                      <td className="p-3 font-bold text-right">
                                        €{booking.totalPrice.toFixed(2)}
                                      </td>
                                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                        {booking.status === 'completed' ? (
                                          (booking as any).hasReviewedByHubber ? (
                                            <span className="px-3 py-1.5 rounded-lg text-xs font-bold text-green-600 bg-green-50 inline-flex items-center gap-1">
                                              <CheckCircle2 className="w-3 h-3" /> Recensito
                                            </span>
                                          ) : (
                                            <button
                                              onClick={() => openReviewModal(booking, 'hubber_to_renter')}
                                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors inline-flex items-center gap-1"
                                            >
                                              <Star className="w-3 h-3" /> Recensione
                                            </button>
                                          )
                                        ) : (
                                          <span className="text-xs text-gray-400">—</span>
                                        )}
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
                      return Object.keys(groupedBookings).map((monthKey) => {
                        const monthBookings = groupedBookings[monthKey];
                        const [year, month] = monthKey.split('-');
                        const monthName = monthNames[parseInt(month) - 1];
                        const isExpanded = expandedMonths.has(monthKey);
                        
                        return (
                          <React.Fragment key={monthKey}>
                            {/* Header mese espandibile */}
                            <tr 
                              className="bg-gray-50 border-b-2 border-gray-200 hover:bg-gray-100 cursor-pointer"
                              onClick={() => toggleMonth(monthKey)}
                            >
                              <td colSpan={6} className="p-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="text-sm font-bold text-gray-800">
                                      {isExpanded ? '▼' : '▶'} {monthName} {year}
                                    </span>
                                    <span className="ml-2 text-xs text-gray-500">
                                      ({monthBookings.length} prenotazioni)
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-400">
                                    {isExpanded ? 'Clicca per chiudere' : 'Clicca per aprire'}
                                  </span>
                                </div>
                              </td>
                            </tr>
                            
                            {/* Prenotazioni del mese (solo se espanso) */}
                            {isExpanded && monthBookings.map((booking) => {
                              const isSelected = booking.id === selectedHubberBookingId;
                              return (
                                <tr
                                  key={booking.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedHubberBookingId(booking.id);
                                  }}
                                  className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                                    isSelected ? 'bg-gray-50' : ''
                                  }`}
                                >
                                  <td className="p-3 text-xs whitespace-nowrap">
                                    {booking.dates}
                                  </td>
                                  <td className="p-3 font-medium text-gray-900">
                                    {booking.listingTitle}
                                  </td>
                                  <td className="p-3">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (onViewRenterProfile && (booking as any).renterId) {
                                          onViewRenterProfile({
                                            id: (booking as any).renterId,
                                            name: booking.renterName,
                                            avatar: booking.renterAvatar,
                                          });
                                        }
                                      }}
                                      className="text-gray-600 hover:text-brand hover:underline"
                                    >
                                      {booking.renterName}
                                    </button>
                                  </td>
                                  <td className="p-3">
                                    {renderBookingStatusBadge(booking.status)}
                                  </td>
                                  <td className="p-3 font-bold text-right">
                                    €{booking.totalPrice.toFixed(2)}
                                  </td>
                                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                    {booking.status === 'completed' ? (
                                      (booking as any).hasReviewedByHubber ? (
                                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold text-green-600 bg-green-50 inline-flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3" /> Recensito
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() => openReviewModal(booking, 'hubber_to_renter')}
                                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors inline-flex items-center gap-1"
                                        >
                                          <Star className="w-3 h-3" /> Recensione
                                        </button>
                                      )
                                    ) : (
                                      <span className="text-xs text-gray-400">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      });
                    }
                  })()}

                  {filteredHubberBookings.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-gray-400 text-sm"
                      >
                        Nessuna prenotazione trovata per il filtro selezionato.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* DETTAGLIO PRENOTAZIONE */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {selectedBooking ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden">
                      {selectedBooking.listingImage && (
                        <img
                          src={selectedBooking.listingImage}
                          alt={selectedBooking.listingTitle}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-semibold">
                        Prenotazione
                      </p>
                      <h3 className="font-bold text-gray-900 text-sm">
                        {selectedBooking.listingTitle}
                      </h3>
                      {/* ✅ Numero prenotazione */}
                      <p className="text-xs text-gray-500 mt-0.5">
                        #{selectedBooking.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                  {renderBookingStatusBadge(selectedBooking.status)}
                </div>

                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-semibold mb-1">
                        Periodo
                      </p>
                      <p className="font-medium text-gray-800">
                        {selectedBooking.dates}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Package className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-semibold mb-1">
                        Renter
                      </p>
                      <div 
                        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          if (onViewRenterProfile && (selectedBooking as any).renterId) {
                            onViewRenterProfile({
                              id: (selectedBooking as any).renterId,
                              name: selectedBooking.renterName,
                              avatar: selectedBooking.renterAvatar,
                            });
                          }
                        }}
                      >
                        {selectedBooking.renterAvatar && (
                          <img
                            src={selectedBooking.renterAvatar}
                            alt={selectedBooking.renterName}
                            className="w-7 h-7 rounded-full"
                          />
                        )}
                        <p className="font-medium text-gray-800 hover:text-brand hover:underline">
                          {selectedBooking.renterName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ✅ SEZIONE 1: IL RENTER HA PAGATO */}
<div className="border-t border-gray-100 pt-4 mt-2 space-y-2">
  <p className="text-xs text-gray-400 uppercase font-semibold">
    Il renter ha pagato
  </p>
  {/* ✅ Prezzo base senza pulizia */}
  <div className="flex justify-between text-sm">
    <span className="text-gray-600">
      Noleggio
    </span>
    <span className="font-medium text-gray-900">
      €{(selectedBooking.totalPrice - ((selectedBooking as any).cleaningFee || 0)).toFixed(2)}
    </span>
  </div>
  {/* ✅ Costo pulizia (se presente) */}
  {((selectedBooking as any).cleaningFee || 0) > 0 && (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">
        Costo pulizia
      </span>
      <span className="font-medium text-gray-900">
        €{((selectedBooking as any).cleaningFee || 0).toFixed(2)}
      </span>
    </div>
  )}
  {/* ✅ Commissione servizio (SOLO commissioni, senza cauzione) */}
  <div className="flex justify-between text-sm">
    <span className="text-gray-600">
      Commissioni Renthubber
    </span>
    <span className="font-medium text-gray-900">
      €{(((selectedBooking as any).renterTotalPaid || 0) - selectedBooking.totalPrice - ((selectedBooking as any).deposit || 0)).toFixed(2)}
    </span>
  </div>
  {/* ✅ Cauzione (se presente) */}
  {((selectedBooking as any).deposit || 0) > 0 && (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">
        Cauzione (rimborsabile)
      </span>
      <span className="font-medium text-amber-600">
        €{((selectedBooking as any).deposit || 0).toFixed(2)}
      </span>
    </div>
  )}
  <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
    <span className="text-gray-800 font-semibold">
      Totale (EUR)
    </span>
    <span className="font-bold text-gray-900">
      €{((selectedBooking as any).renterTotalPaid || 0).toFixed(2)}
    </span>
  </div>
</div>

                  {/* ✅ SEZIONE 2: COMPENSO DELL'HUBBER */}
<div className="border-t border-gray-100 pt-4 mt-4 space-y-2">
  <p className="text-xs text-gray-400 uppercase font-semibold">
    Compenso dell'hubber
  </p>
  
  {selectedBooking.status === 'cancelled' ? (
    <>
      {/* ⚠️ PRENOTAZIONE CANCELLATA - Importi azzerati */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
          Prenotazione Cancellata
        </p>
        <p className="text-xs text-gray-400">
          Nessun compenso
        </p>
      </div>
      
      {/* Importo noleggio */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">
          Importo noleggio
        </span>
        <span className="font-medium text-gray-400">€0.00</span>
      </div>
      
      {/* Costo pulizia (se presente) */}
      {((selectedBooking as any).cleaningFee || 0) > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">
            Costo pulizia
          </span>
          <span className="font-medium text-gray-400">€0.00</span>
        </div>
      )}
      
      {/* Commissione piattaforma */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">
          Commissione piattaforma
        </span>
        <span className="font-medium text-gray-400">€0.00</span>
      </div>
      
      {/* Totale */}
      <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
        <span className="text-gray-500 font-semibold">
          Totale (EUR)
        </span>
        <span className="font-bold text-gray-400">€0.00</span>
      </div>
    </>
  ) : (
    <>
      {/* ✅ PRENOTAZIONE NORMALE - Tutto come prima */}
      
      {/* ✅ Importo base senza pulizia */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">
          Importo noleggio
        </span>
        <span className="font-medium text-gray-900">
          €{(selectedBooking.totalPrice - ((selectedBooking as any).cleaningFee || 0)).toFixed(2)}
        </span>
      </div>
      
      {/* ✅ Costo pulizia (se presente) */}
      {((selectedBooking as any).cleaningFee || 0) > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            Costo pulizia
          </span>
          <span className="font-medium text-gray-900">
            €{((selectedBooking as any).cleaningFee || 0).toFixed(2)}
          </span>
        </div>
      )}
      
      {/* Commissione piattaforma */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">
          Commissione piattaforma
        </span>
        <span className="font-medium text-red-500">
          -€{(selectedBooking.commission || 0).toFixed(2)}
        </span>
      </div>
      
      {/* Totale */}
      <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
        <span className="text-gray-800 font-semibold">
          Totale (EUR)
        </span>
        <span className="font-bold text-green-600">
          €{(selectedBooking.netEarnings ?? (selectedBooking.totalPrice - (selectedBooking.commission || 0))).toFixed(2)}
        </span>
      </div>
    </>
  )}
</div>

{selectedBooking.status === 'pending' && (
  <div className="pt-4 border-t border-gray-100 mt-2 space-y-2">
    <p className="text-xs text-gray-400 uppercase font-semibold">
      Azioni
    </p>
    <div className="flex gap-2">
      <button
        onClick={() =>
          handleRequestAction(
            selectedBooking.id,
            'rejected'
          )
        }
        className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-bold hover:bg-gray-50"
      >
        Rifiuta
      </button>
      <button
        onClick={() =>
          handleRequestAction(
            selectedBooking.id,
            'accepted'
          )
        }
        className="flex-1 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-dark"
      >
        Accetta
      </button>
    </div>
  </div>
)}

                  {/* ✅ PULSANTE CANCELLA PER PRENOTAZIONI CONFERMATE/ATTIVE */}
                  {['confirmed', 'accepted', 'active'].includes(selectedBooking.status) && (
                    <div className="pt-4 border-t border-gray-100 mt-2">
                      <button
                        onClick={() => openHubberCancelModal(selectedBooking)}
                        className="w-full py-2.5 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
                      >
                        Cancella prenotazione
                      </button>
                      <p className="text-xs text-gray-400 mt-2 text-center">
                        Il Renter riceverà un rimborso completo
                      </p>
                    </div>
                  )}

                  {/* ✅ PULSANTE RECENSIONE PER PRENOTAZIONI COMPLETATE */}
                  {selectedBooking.status === 'completed' && (
                    <div className="pt-4 border-t border-gray-100 mt-2">
                      {(selectedBooking as any).hasReviewedByHubber ? (
                        <div className="w-full py-2.5 rounded-lg bg-green-50 text-green-600 text-sm font-semibold text-center flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Hai già lasciato una recensione
                        </div>
                      ) : (
                        <button
                          onClick={() => openReviewModal(selectedBooking, 'hubber_to_renter')}
                          className="w-full py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
                        >
                          <Star className="w-4 h-4" />
                          Lascia una recensione al Renter
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 text-sm">
                <Calendar className="w-8 h-8 mb-3" />
                <p>Seleziona una prenotazione dalla lista per vedere i dettagli.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- CALENDARIO HUBBER ---
const renderHubberCalendar = () => (
  <div className="space-y-8 animate-in fade-in duration-300">
    <div>
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center md:text-left">Calendario Prenotazioni</h2>
      <p className="text-sm text-gray-500 mt-1">
        Visualizza tutte le tue prenotazioni e sincronizza con calendari esterni.
      </p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        {loadingCalendar ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Caricamento calendario...</p>
          </div>
        ) : (
          <HubberCalendar
            bookings={calendarBookings}
            onBookingClick={(booking) => {
              const fullBooking = hubberBookings.find((b) => b.id === booking.id);
              if (fullBooking) {
                setSelectedHubberBookingId(fullBooking.id);
                setActiveTab('hubber_bookings');
              }
            }}
            onViewRenterProfile={(renter) => {
              if (onViewRenterProfile && renter.id) {
                onViewRenterProfile(renter);
              }
            }}
          />
        )}
      </div>

      <div>
        <ICalManager
          userId={user.id}
          userName={user.name}
          exportUrl={icalExportUrl}
          importedCalendars={importedCalendars}
          onExportUrl={(url) => setICalExportUrl(url)}
          onImportCalendar={handleImportCalendar}
          onSyncCalendar={handleSyncCalendar}
          onRemoveCalendar={handleRemoveCalendar}
        />
      </div>
    </div>

    <div className="bg-gradient-to-r from-brand/5 to-brand/10 border border-brand/20 rounded-xl p-5">
      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
        <span className="text-xl">💡</span> Come funziona
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="bg-white/60 rounded-lg p-3">
          <p className="font-semibold text-gray-800 mb-1">📅 Calendario</p>
          <p className="text-gray-600">Vedi tutte le prenotazioni in un'unica vista mensile.</p>
        </div>
        <div className="bg-white/60 rounded-lg p-3">
          <p className="font-semibold text-gray-800 mb-1">📤 Esporta iCal</p>
          <p className="text-gray-600">Sincronizza con Google Calendar, Apple o Outlook.</p>
        </div>
        <div className="bg-white/60 rounded-lg p-3">
          <p className="font-semibold text-gray-800 mb-1">📥 Importa</p>
          <p className="text-gray-600">Importa calendari esterni per bloccare date.</p>
        </div>
      </div>
    </div>
  </div>
);

  // --- DASHBOARD HUBBER ---
  const renderHubberDashboard = () => (
    <div className="animate-in fade-in duration-500">
      {/* Header & Tab Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Hubber
          </h1>
          <p className="text-gray-500">
            Monitora i tuoi guadagni e le richieste.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <button
            onClick={() => onManageListings()}
            className="bg-brand text-white px-6 py-2.5 rounded-xl font-bold hover:bg-brand-dark transition-colors shadow-md"
          >
            Gestisci Annunci
          </button>
        </div>
      </div>

      {/* Custom Tabs */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 bg-white p-3 rounded-xl border border-gray-200 mb-8 w-full sm:w-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all text-center ${
            activeTab === 'overview'
              ? 'bg-gray-100 text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
           Panoramica
        </button>
        
        {/* ✅ NUOVO TAB CALENDARIO */}
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all text-center ${
            activeTab === 'calendar'
              ? 'bg-gray-100 text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
           Calendario
        </button>
        
        <button
          onClick={() => setActiveTab('hubber_bookings')}
          className={`px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all text-center ${
            activeTab === 'hubber_bookings'
              ? 'bg-gray-100 text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Prenotazioni
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all text-center ${
            activeTab === 'profile'
              ? 'bg-gray-100 text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Il mio profilo
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all text-center ${
            activeTab === 'payments'
              ? 'bg-gray-100 text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Pagamenti & Fatture
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all text-center ${
            activeTab === 'security'
              ? 'bg-gray-100 text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Sicurezza & Verifica
        </button>
      </div>

      {activeTab === 'overview' && renderHubberOverview()}
      {activeTab === 'calendar' && renderHubberCalendar()} 
      {activeTab === 'hubber_bookings' && renderHubberBookingsList()}
      {activeTab === 'payments' && renderHubberPayments()}
      {activeTab === 'security' && renderSecurity()}
      {activeTab === 'profile' && renderProfile()}
    </div>
  );

// --- PAGAMENTI & FATTURE RENTER ---
const renderRenterPayments = () => {
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
    const newExpanded = new Set(expandedRenterPaymentsMonths);
    if (newExpanded.has(monthKey)) {
      newExpanded.delete(monthKey);
    } else {
      newExpanded.add(monthKey);
    }
    setExpandedRenterPaymentsMonths(newExpanded);
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
                onClick={() => setRenterPaymentsTimeFilter('current')}
                className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
                  renterPaymentsTimeFilter === 'current'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🔵 Mese corrente
              </button>
              <button
                onClick={() => setRenterPaymentsTimeFilter('historical')}
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
                onClick={() => setRenterPaymentsTimeFilter('current')}
                className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
                  renterPaymentsTimeFilter === 'current'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🔵 Mese corrente
              </button>
              <button
                onClick={() => setRenterPaymentsTimeFilter('historical')}
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

  // --- DASHBOARD RENTER ---
  const renderRenterDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome & Status */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard Renter
        </h1>
        <p className="text-gray-500">Pronto per il tuo prossimo noleggio?</p>
      </div>

      {/* Custom Tabs for Renter */}
<div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 bg-white p-3 rounded-xl border border-gray-200 mb-8 w-full sm:w-auto">
  <button
    onClick={() => setActiveTab('overview')}
    className={`px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all text-center ${
      activeTab === 'overview'
        ? 'bg-gray-100 text-gray-900 shadow-sm'
        : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    Panoramica
  </button>
  <button
    onClick={() => setActiveTab('bookings')}
    className={`px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all text-center ${
      activeTab === 'bookings'
        ? 'bg-gray-100 text-gray-900 shadow-sm'
        : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    Prenotazioni
  </button>
  <button
    onClick={() => setActiveTab('profile')}
    className={`px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all text-center ${
      activeTab === 'profile'
        ? 'bg-gray-100 text-gray-900 shadow-sm'
        : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    Il mio profilo
  </button>
  <button
    onClick={() => setActiveTab('payments')}
    className={`px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all text-center ${
      activeTab === 'payments'
        ? 'bg-gray-100 text-gray-900 shadow-sm'
        : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    Pagamenti & Fatture
  </button>
  <button
    onClick={() => setActiveTab('security')}
    className={`px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all text-center ${
      activeTab === 'security'
        ? 'bg-gray-100 text-gray-900 shadow-sm'
        : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    Sicurezza & Verifica
  </button>
  <button
    onClick={() => setActiveTab('favorites')}
    className={`px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all text-center ${
      activeTab === 'favorites'
        ? 'bg-gray-100 text-gray-900 shadow-sm'
        : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    Preferiti
  </button>
</div>

     {activeTab === 'security' && renderSecurity()}
      {activeTab === 'profile' && renderProfile()}
      {activeTab === 'payments' && renderRenterPayments()}
      {activeTab === 'bookings' && renderRenterBookings()}
      {activeTab === 'favorites' && (
        <RenterFavorites
          currentUser={user}
          onListingClick={(listing) => {
            if (onViewListing) {
              onViewListing(listing);
            }
          }}
          onExploreClick={onManageListings}
        />
      )}

      {activeTab === 'overview' && (
        <>
          {/* Active Rentals Highlight */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-brand" /> Noleggi
                Attivi & In Arrivo
              </h3>

              {/* Upcoming Rental Card - DATI REALI */}
              {loadingNextBooking ? (
                <div className="bg-gradient-to-br from-brand to-brand-light rounded-2xl p-6 text-white shadow-lg mb-6 flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : nextUpcomingBooking ? (
                <div className="bg-gradient-to-br from-brand to-brand-light rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10">
                    <Package className="w-64 h-64" />
                  </div>

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                          {nextUpcomingBooking.daysUntilStart === 0 
                            ? 'Ritiro Oggi' 
                            : nextUpcomingBooking.daysUntilStart === 1 
                              ? 'Ritiro Domani' 
                              : `Ritiro tra ${nextUpcomingBooking.daysUntilStart} giorni`}
                        </span>
                        <h2 className="text-2xl font-bold mt-3">
                          {nextUpcomingBooking.listingTitle}
                        </h2>
                        <p className="text-brand-light/80 text-sm">
                          Da {nextUpcomingBooking.hubberName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-brand-light/80 uppercase">
                          Codice Ritiro
                        </p>
                        <p className="text-2xl font-mono font-bold tracking-widest">
                          {nextUpcomingBooking.pickupCode}
                        </p>
                      </div>
                    </div>

                    {/* Indirizzo - mostrato solo se confermato/accettato */}
                    {(nextUpcomingBooking.status === 'confirmed' || nextUpcomingBooking.status === 'accepted') && nextUpcomingBooking.pickupAddress ? (
                      <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm flex justify-between items-center">
                        <div className="flex items-center">
                          <MapPin className="w-5 h-5 mr-3 text-brand-accent" />
                          <div>
                            <p className="font-bold text-sm">
                              {nextUpcomingBooking.pickupAddress}
                              {nextUpcomingBooking.pickupCity && `, ${nextUpcomingBooking.pickupCity}`}
                            </p>
                            <p className="text-xs text-brand-light/80">
                              {new Date(nextUpcomingBooking.startDate).toLocaleDateString('it-IT', { 
                                weekday: 'long', 
                                day: 'numeric', 
                                month: 'long' 
                              })}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const address = encodeURIComponent(
                              `${nextUpcomingBooking.pickupAddress}, ${nextUpcomingBooking.pickupCity}`
                            );
                            window.open(
                              `https://www.google.com/maps/search/?api=1&query=${address}`,
                              '_blank'
                            );
                          }}
                          className="bg-white text-brand font-bold px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                        >
                          Indicazioni
                        </button>
                      </div>
                    ) : nextUpcomingBooking.status === 'pending' ? (
                      <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                        <div className="flex items-center">
                          <Clock className="w-5 h-5 mr-3 text-yellow-300" />
                          <div>
                            <p className="font-bold text-sm">In attesa di conferma</p>
                            <p className="text-xs text-brand-light/80">
                              L'indirizzo sarà visibile dopo la conferma dell'hubber
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                        <div className="flex items-center">
                          <MapPin className="w-5 h-5 mr-3 text-brand-accent" />
                          <div>
                            <p className="font-bold text-sm">
                              {nextUpcomingBooking.pickupCity || 'Indirizzo non disponibile'}
                            </p>
                            <p className="text-xs text-brand-light/80">
                              {new Date(nextUpcomingBooking.startDate).toLocaleDateString('it-IT', { 
                                weekday: 'long', 
                                day: 'numeric', 
                                month: 'long' 
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Nessuna prenotazione futura */
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-6 shadow-sm mb-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 opacity-5 transform translate-x-10 -translate-y-10">
                    <Package className="w-64 h-64" />
                  </div>
                  <div className="relative z-10 text-center py-8">
                    <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-bold text-gray-700 mb-2">
                      Nessun noleggio in programma
                    </h3>
                    <p className="text-gray-500 text-sm mb-4">
                      Esplora gli annunci e prenota il tuo prossimo oggetto!
                    </p>
                    <button
                      onClick={() => window.location.href = '/'}
                      className="bg-brand text-white font-bold px-6 py-2 rounded-lg text-sm hover:bg-brand-dark transition-colors"
                    >
                      Esplora annunci
                    </button>
                  </div>
                </div>
              )}

              {/* Other Rentals List - DATI REALI */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex justify-between">
                  <span className="font-bold text-gray-700">
                    Storico Recente
                  </span>
                  <button 
                    onClick={() => setActiveTab('bookings')}
                    className="text-sm text-brand cursor-pointer hover:underline"
                  >
                    Vedi tutti
                  </button>
                </div>
                {renterBookings.length > 0 ? (
                  renterBookings
                    .filter((b) => {
                      // Mostra prenotazioni passate o cancellate
                      const endDate = new Date((b as any).end_date);
                      const isPast = endDate < new Date();
                      return isPast || b.status === 'cancelled' || b.status === 'completed';
                    })
                    .slice(0, 3)
                    .map((booking) => (
                      <div
                        key={booking.id}
                        className="p-4 flex items-center hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setActiveTab('bookings')}
                      >
                        <div className="w-12 h-12 bg-gray-200 rounded-lg mr-4 overflow-hidden">
                          {booking.listingImage && (
                            <img 
                              src={booking.listingImage} 
                              alt={booking.listingTitle}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-sm">
                            {booking.listingTitle}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {new Date((booking as any).end_date).toLocaleDateString('it-IT', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          booking.status === 'cancelled'
                            ? 'bg-red-100 text-red-600'
                            : booking.status === 'completed'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-600'
                        }`}>
                          {booking.status === 'cancelled' ? 'Cancellata' : 
                           booking.status === 'completed' ? 'Completata' : 'Terminato'}
                        </span>
                      </div>
                    ))
                ) : (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    Nessun noleggio recente
                  </div>
                )}
                {renterBookings.filter((b) => {
                  const endDate = new Date((b as any).end_date);
                  return endDate < new Date() || b.status === 'cancelled';
                }).length === 0 && renterBookings.length > 0 && (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    I tuoi noleggi appariranno qui una volta conclusi
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions & Stats */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">
                  Spese questo mese
                </h3>
                {(() => {
                  // Calcola spese del mese corrente
                  const now = new Date();
                  const currentMonth = now.getMonth();
                  const currentYear = now.getFullYear();
                  
                  const thisMonthExpenses = renterBookings
                    .filter((b) => {
                      const startDate = new Date((b as any).start_date);
                      return startDate.getMonth() === currentMonth && 
                             startDate.getFullYear() === currentYear &&
                             b.status !== 'cancelled';
                    })
                    .reduce((sum, b) => sum + ((b as any).renterTotalPaid || b.totalPrice || 0), 0);
                  
                  return (
                    <>
                      <div className="flex items-end mb-2">
                        <span className="text-3xl font-bold text-brand-dark">
                          € {thisMonthExpenses.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500 mb-1 ml-2">
                          / € {user.renterBalance.toFixed(2)} Credito
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-brand h-2 rounded-full transition-all"
                          style={{ width: `${Math.min((thisMonthExpenses / Math.max(thisMonthExpenses + user.renterBalance, 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">
                  Ultimi Visti
                </h3>
                <div className="space-y-4">
                  {recentlyViewed.length > 0 ? (
                    recentlyViewed.slice(0, 4).map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => window.location.href = `/listing/${item.id}`}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <div className="w-16 h-12 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                              alt={item.title}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <Package className="w-6 h-6 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-gray-900 group-hover:text-brand truncate">
                            {item.title}
                          </h4>
                          <p className="text-xs text-gray-500">
                            €{item.price.toFixed(2)} / {item.priceUnit}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <Package className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                      <p className="text-xs text-gray-400">
                        Nessun annuncio visualizzato
                      </p>
                      <button
                        onClick={() => window.location.href = '/'}
                        className="text-xs text-brand hover:underline mt-2"
                      >
                        Esplora annunci
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

         {/* Become Hubber Promo o Referral Badge */}
          <div className="space-y-6">
            {/* ✅ Diventa Hubber - SOLO se NON sei già hubber */}
            {!user?.roles?.includes('hubber') && (
              <div className="bg-gray-900 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-2">
                    Hai oggetti che non usi?
                  </h3>
                  <p className="text-gray-400 mb-6 max-w-md">
                    Diventa Hubber e inizia a guadagnare noleggiando le tue
                    attrezzature o i tuoi spazi inutilizzati. È facile e sicuro.
                  </p>
                  <button
                    onClick={onBecomeHubber}
                    className="bg-brand-accent text-brand-dark font-bold py-3 px-6 rounded-xl hover:bg-amber-400 transition-colors shadow-lg"
                  >
                    Inizia a guadagnare
                  </button>
                </div>
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                  <Package className="w-64 h-64 transform translate-x-10 translate-y-10" />
                </div>
              </div>
            )}

            {/* ✅ Invita un amico - SEMPRE visibile nella dashboard renter */}
            <div 
              onClick={() => onNavigateToWallet && onNavigateToWallet()}
              className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between relative overflow-hidden cursor-pointer hover:shadow-xl transition-all"
            >
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-2">
                  Invita un amico e guadagna
                </h3>
                <p className="text-green-100 mb-6 max-w-md">
                  Invita i tuoi amici su Renthubber e ricevi €5 di credito per ogni amico che completa la prima prenotazione.
                </p>
                <div className="inline-flex items-center gap-2 bg-white text-green-600 font-bold py-3 px-6 rounded-xl hover:bg-green-50 transition-colors shadow-lg">
                  Vai al Wallet
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
              <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                <Gift className="w-64 h-64 transform translate-x-10 translate-y-10" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // --- MODALE CONFERMA CANCELLAZIONE PRENOTAZIONE ---
  const renderCancelBookingModal = () => {
    if (!cancelModalOpen || !bookingToCancel) return null;

    // Calcola il rimborso previsto
    const refundPreview = calculateRefundPreview(bookingToCancel);
    const policyInfo = formatCancellationPolicy((bookingToCancel as any).cancellationPolicy || 'flexible');
    const totalPaid = (bookingToCancel as any).renterTotalPaid || bookingToCancel.totalPrice || 0;

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative mx-4">
          <button
            onClick={closeCancelModal}
            disabled={isCancelling}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Cancellare questa prenotazione?
            </h2>
            <p className="text-sm text-gray-500">
              Stai per cancellare la prenotazione per:
            </p>
          </div>

          {/* Dettagli prenotazione */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                {bookingToCancel.listingImage && (
                  <img
                    src={bookingToCancel.listingImage}
                    alt={bookingToCancel.listingTitle}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-sm truncate">
                  {bookingToCancel.listingTitle}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  {bookingToCancel.dates}
                </p>
                <p className="text-sm font-bold text-brand mt-1">
                  Pagato: €{totalPaid.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Politica di cancellazione */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-500 uppercase font-semibold">Politica:</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${policyInfo.color}`}>
                {policyInfo.label}
              </span>
            </div>
            <p className="text-xs text-gray-500">{policyInfo.description}</p>
          </div>

          {/* Info rimborso calcolato */}
          <div className={`rounded-xl p-4 mb-4 ${
            refundPreview.percentage === 100 
              ? 'bg-green-50 border border-green-100'
              : refundPreview.percentage > 0
                ? 'bg-yellow-50 border border-yellow-100'
                : 'bg-red-50 border border-red-100'
          }`}>
            <p className={`text-sm font-bold mb-1 ${
              refundPreview.percentage === 100 
                ? 'text-green-800'
                : refundPreview.percentage > 0
                  ? 'text-yellow-800'
                  : 'text-red-800'
            }`}>
              {refundPreview.message}
            </p>
            {refundPreview.amount > 0 ? (
              <p className={`text-lg font-bold ${
                refundPreview.percentage === 100 
                  ? 'text-green-700'
                  : 'text-yellow-700'
              }`}>
                Rimborso: €{refundPreview.amount.toFixed(2)}
              </p>
            ) : (
              <p className="text-sm text-red-700">
                Cancellando ora non riceverai alcun rimborso.
              </p>
            )}
          </div>

          {/* Scelta metodo di rimborso - solo se c'è un rimborso */}
          {refundPreview.amount > 0 && !cancelSuccess && (() => {
            // Calcola metodi di pagamento usati
            const walletUsedCents = (bookingToCancel as any).walletUsedCents || 0;
            const walletUsed = walletUsedCents / 100;
            const renterTotalPaid = (bookingToCancel as any).renterTotalPaid || bookingToCancel.totalPrice || 0;
            const cardPaid = Math.max(renterTotalPaid - walletUsed, 0);
            
            // Se pagato SOLO con wallet → nessuna scelta, rimborso automatico su wallet
            if (cardPaid === 0) {
              return (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Rimborso:</strong> €{refundPreview.amount.toFixed(2)} sarà accreditato sul tuo Wallet Renthubber immediatamente.
                  </p>
                </div>
              );
            }
            
            // Se pagato con carta (solo o mix) → mostra scelta
            const hasMixPayment = walletUsed > 0 && cardPaid > 0;
            
            return (
              <div className="mb-6">
                <p className="text-sm font-bold text-gray-700 mb-3">
                  Come vuoi ricevere il rimborso?
                </p>
                <div className="space-y-2">
                  {/* Opzione Wallet */}
                  <button
                    type="button"
                    onClick={() => setRefundMethod('wallet')}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      refundMethod === 'wallet'
                        ? 'border-brand bg-brand/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          refundMethod === 'wallet' ? 'bg-brand text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <div>
                          <p className={`font-bold ${refundMethod === 'wallet' ? 'text-brand' : 'text-gray-900'}`}>
                            {hasMixPayment ? 'Tutto su Wallet' : 'Wallet Renthubber'}
                          </p>
                          <p className="text-xs text-gray-500">Accredito immediato</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${refundMethod === 'wallet' ? 'text-brand' : 'text-gray-900'}`}>
                          €{refundPreview.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-green-600 font-medium">Istantaneo</p>
                      </div>
                    </div>
                    {refundMethod === 'wallet' && (
                      <p className="text-xs text-gray-500 mt-2 pl-13">
                        Usalo subito per nuove prenotazioni su Renthubber
                      </p>
                    )}
                  </button>

                  {/* Opzione Carta/Originale */}
                  <button
                    type="button"
                    onClick={() => setRefundMethod('card')}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      refundMethod === 'card'
                        ? 'border-brand bg-brand/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          refundMethod === 'card' ? 'bg-brand text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <div>
                          <p className={`font-bold ${refundMethod === 'card' ? 'text-brand' : 'text-gray-900'}`}>
                            {hasMixPayment ? 'Sul metodo originale' : 'Carta originale'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {hasMixPayment ? 'Proporzionale wallet + carta' : 'Rimborso sulla carta usata'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${refundMethod === 'card' ? 'text-brand' : 'text-gray-900'}`}>
                          €{refundPreview.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-yellow-600 font-medium">5-10 giorni</p>
                      </div>
                    </div>
                    {refundMethod === 'card' && (
                      <p className="text-xs text-gray-500 mt-2 pl-13">
                        {hasMixPayment 
                          ? `€${walletUsed.toFixed(2)} su wallet + €${cardPaid.toFixed(2)} su carta (via Stripe)`
                          : 'Il rimborso verrà processato tramite Stripe'
                        }
                      </p>
                    )}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Messaggi errore/successo */}
          {cancelError && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
              <p className="text-sm text-red-700">{cancelError}</p>
            </div>
          )}

          {cancelSuccess && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-4">
              <p className="text-sm text-green-700">{cancelSuccess}</p>
            </div>
          )}

          {/* Pulsanti azione */}
          {!cancelSuccess && (
            <div className="flex gap-3">
              <button
                onClick={closeCancelModal}
                disabled={isCancelling}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={isCancelling}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {isCancelling ? 'Cancellazione...' : 'Conferma cancellazione'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- MODALE CANCELLAZIONE PRENOTAZIONE (HUBBER) ---
  const renderHubberCancelModal = () => {
    if (!hubberCancelModalOpen || !hubberBookingToCancel) return null;

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative mx-4">
          <button
            onClick={closeHubberCancelModal}
            disabled={isHubberCancelling}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Cancella prenotazione
            </h2>
            <p className="text-sm text-gray-500">
              Stai per cancellare questa prenotazione. Il Renter riceverà un rimborso completo.
            </p>
          </div>

          {/* Dettagli prenotazione */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                {hubberBookingToCancel.listingImage && (
                  <img
                    src={hubberBookingToCancel.listingImage}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">
                  {hubberBookingToCancel.listingTitle}
                </p>
                <p className="text-xs text-gray-500">{hubberBookingToCancel.dates}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Renter: {hubberBookingToCancel.renterName}
                </p>
              </div>
            </div>
          </div>

          {/* Info rimborso */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Rimborso al Renter:</strong> €{hubberBookingToCancel.renterTotalPaid?.toFixed(2) || hubberBookingToCancel.totalPrice?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-blue-600 mt-1">
            L'importo sarà rimborsato sul metodo di pagamento originale (wallet e/o carta).
            </p>
          </div>

          {/* Motivo cancellazione (opzionale) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo della cancellazione (opzionale)
            </label>
            <textarea
              value={hubberCancelReason}
              onChange={(e) => setHubberCancelReason(e.target.value)}
              placeholder="Es: Oggetto non più disponibile, imprevisto personale..."
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>

          {/* Messaggi errore/successo */}
          {hubberCancelError && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
              <p className="text-sm text-red-700">{hubberCancelError}</p>
            </div>
          )}

          {hubberCancelSuccess && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-4">
              <p className="text-sm text-green-700">{hubberCancelSuccess}</p>
            </div>
          )}

          {/* Pulsanti azione */}
          {!hubberCancelSuccess && (
            <div className="flex gap-3">
              <button
                onClick={closeHubberCancelModal}
                disabled={isHubberCancelling}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                onClick={handleHubberCancelBooking}
                disabled={isHubberCancelling}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {isHubberCancelling ? 'Cancellazione...' : 'Conferma cancellazione'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- MODALE MODIFICA PRENOTAZIONE ---
  const renderModifyBookingModal = () => {
    if (!modifyModalOpen || !bookingToModify) return null;

    const formatDateDisplay = (date: Date | undefined) => {
      if (!date) return "Seleziona data";
      return date.toLocaleDateString("it-IT", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 relative mx-4 my-auto max-h-[95vh] overflow-y-auto">
          <button
            onClick={closeModifyModal}
            disabled={isModifying}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 z-10"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <div className="text-center mb-6">
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

          {/* Dettagli prenotazione attuale */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                {bookingToModify.listingImage && (
                  <img
                    src={bookingToModify.listingImage}
                    alt={bookingToModify.listingTitle}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-sm truncate">
                  {bookingToModify.listingTitle}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Date attuali: {bookingToModify.dates}
                </p>
                <p className="text-sm font-bold text-brand mt-1">
                  Totale attuale: €{((bookingToModify as any).renterTotalPaid || bookingToModify.totalPrice).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Selezione nuove date */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Seleziona le nuove date
            </label>
            
            {/* Date selezionate */}
            <div 
              className="border border-gray-300 rounded-xl bg-white cursor-pointer mb-3"
              onClick={() => setModifyCalendarOpen(!modifyCalendarOpen)}
            >
              <div className="grid grid-cols-2">
                <div className="p-3 border-r border-gray-300 hover:bg-gray-50 transition-colors rounded-l-xl">
                  <p className="text-[10px] font-bold uppercase text-gray-600">
                    Check-in
                  </p>
                  <p className={`text-sm ${newStartDate ? "text-gray-900" : "text-gray-400"}`}>
                    {formatDateDisplay(newStartDate)}
                  </p>
                </div>
                <div className="p-3 hover:bg-gray-50 transition-colors rounded-r-xl">
                  <p className="text-[10px] font-bold uppercase text-gray-600">
                    Check-out
                  </p>
                  <p className={`text-sm ${newEndDate ? "text-gray-900" : "text-gray-400"}`}>
                    {formatDateDisplay(newEndDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Calendario inline */}
            {modifyCalendarOpen && (
              <div 
                ref={modifyCalendarRef}
                className="border border-gray-200 rounded-xl bg-white overflow-hidden flex justify-center"
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

          {/* Riepilogo differenza prezzo */}
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
              {priceDifference > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Potrai pagare con wallet o carta nella schermata successiva.
                </p>
              )}
            </div>
          )}

          {/* Messaggi errore/successo */}
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

          {/* Pulsanti azione */}
          {!modifySuccess && (
            <div className="flex gap-3">
              <button
                onClick={closeModifyModal}
                disabled={isModifying}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleModifyBooking}
                disabled={isModifying || !newStartDate}
                className={`flex-1 py-3 rounded-xl font-bold text-sm disabled:opacity-50 transition-colors ${
                  priceDifference > 0
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isModifying 
                  ? 'Elaborazione...' 
                  : priceDifference > 0 
                    ? `Procedi al pagamento (€${priceDifference.toFixed(2)})`
                    : 'Conferma modifica'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- MODALE VERIFICA TELEFONO ---
  const renderPhoneVerificationModal = () => {
    if (!phoneModalOpen) return null;

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative mx-4">
          <button
            onClick={closePhoneModal}
            disabled={isSendingOtp || isVerifyingOtp}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {/* Step: INPUT TELEFONO */}
          {phoneStep === 'input' && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Verifica numero di telefono
                </h2>
                <p className="text-sm text-gray-500">
                  Inserisci il tuo numero di telefono per ricevere un codice di verifica via SMS.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numero di telefono
                </label>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+39 333 1234567"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Includi il prefisso internazionale (es. +39 per l'Italia)
                </p>
              </div>

              {phoneError && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
                  <p className="text-sm text-red-700">{phoneError}</p>
                </div>
              )}

              <button
                onClick={handleSendOtp}
                disabled={isSendingOtp || !phoneInput.trim()}
                className="w-full py-3 rounded-xl bg-brand text-white font-semibold hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSendingOtp ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Invio in corso...
                  </span>
                ) : (
                  'Invia codice SMS'
                )}
              </button>
            </>
          )}

          {/* Step: INSERIMENTO OTP */}
          {phoneStep === 'otp' && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Inserisci il codice
                </h2>
                <p className="text-sm text-gray-500">
                  Abbiamo inviato un codice a 6 cifre al numero <strong>{otpSentTo}</strong>
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Codice di verifica
                </label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                />
              </div>

              {phoneError && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
                  <p className="text-sm text-red-700">{phoneError}</p>
                </div>
              )}

              <button
                onClick={handleVerifyOtp}
                disabled={isVerifyingOtp || otpCode.length !== 6}
                className="w-full py-3 rounded-xl bg-brand text-white font-semibold hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-3"
              >
                {isVerifyingOtp ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifica in corso...
                  </span>
                ) : (
                  'Verifica codice'
                )}
              </button>

              <button
                onClick={handleResendOtp}
                disabled={isSendingOtp}
                className="w-full py-2 text-sm text-gray-500 hover:text-brand transition-colors"
              >
                Non hai ricevuto il codice? <span className="font-semibold">Invia di nuovo</span>
              </button>

              <button
                onClick={() => setPhoneStep('input')}
                className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors mt-2"
              >
                ← Modifica numero
              </button>
            </>
          )}

          {/* Step: SUCCESSO */}
          {phoneStep === 'success' && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Telefono verificato!
              </h2>
              <p className="text-sm text-gray-500">
                Il tuo numero di telefono è stato verificato con successo.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- MODALE VERIFICA EMAIL ---
  const renderEmailVerificationModal = () => {
    if (!emailModalOpen) return null;

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative mx-4">
          <button
            onClick={closeEmailModal}
            disabled={isSendingEmailOtp || isVerifyingEmailOtp}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {/* Step: INPUT EMAIL */}
          {emailStep === 'input' && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {user.emailVerified ? 'Modifica email' : 'Verifica email'}
                </h2>
                <p className="text-sm text-gray-500">
                  {user.emailVerified 
                    ? 'Inserisci il nuovo indirizzo email. Dovrai verificarlo con un codice.'
                    : 'Inserisci la tua email per ricevere un codice di verifica.'
                  }
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Indirizzo email
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="esempio@email.com"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                />
              </div>

              {emailError && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
                  <p className="text-sm text-red-700">{emailError}</p>
                </div>
              )}

              <button
                onClick={handleSendEmailOtp}
                disabled={isSendingEmailOtp || !emailInput.trim()}
                className="w-full py-3 rounded-xl bg-brand text-white font-semibold hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSendingEmailOtp ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Invio in corso...
                  </span>
                ) : (
                  'Invia codice email'
                )}
              </button>
            </>
          )}

          {/* Step: INSERIMENTO OTP */}
          {emailStep === 'otp' && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Controlla la tua email
                </h2>
                <p className="text-sm text-gray-500">
                  Abbiamo inviato un codice a 6 cifre a <strong>{emailOtpSentTo}</strong>
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Codice di verifica
                </label>
                <input
                  type="text"
                  value={emailOtpCode}
                  onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                />
              </div>

              {emailError && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
                  <p className="text-sm text-red-700">{emailError}</p>
                </div>
              )}

              <button
                onClick={handleVerifyEmailOtp}
                disabled={isVerifyingEmailOtp || emailOtpCode.length !== 6}
                className="w-full py-3 rounded-xl bg-brand text-white font-semibold hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-3"
              >
                {isVerifyingEmailOtp ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifica in corso...
                  </span>
                ) : (
                  'Verifica codice'
                )}
              </button>

              <button
                onClick={handleResendEmailOtp}
                disabled={isSendingEmailOtp}
                className="w-full py-2 text-sm text-gray-500 hover:text-brand transition-colors"
              >
                Non hai ricevuto il codice? <span className="font-semibold">Invia di nuovo</span>
              </button>

              <button
                onClick={() => setEmailStep('input')}
                className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors mt-2"
              >
                ← Modifica email
              </button>
            </>
          )}

          {/* Step: SUCCESSO */}
          {emailStep === 'success' && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Email verificata!
              </h2>
              <p className="text-sm text-gray-500">
                Il tuo indirizzo email è stato verificato con successo.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- MODALE MODIFICA PROFILO ---
  const renderProfileModal = () => {
    if (!isProfileModalOpen) return null;
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative max-h-[85vh] md:max-h-[90vh] overflow-y-auto">
          <button
            onClick={() => !isSavingProfile && setIsProfileModalOpen(false)}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Modifica dati profilo
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Puoi aggiornare email, numero di telefono e alcune informazioni di
            base. Il nome e il cognome derivano dal flusso di iscrizione.
          </p>

          <form onSubmit={handleProfileSave} className="space-y-4">
            {/* Nome/Cognome solo in lettura */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  disabled
                  value={profileData.firstName}
                  className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Cognome
                </label>
                <input
                  type="text"
                  disabled
                  value={profileData.lastName}
                  className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Email modificabile */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Email
              </label>
              <input
                type="email"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                value={editProfileForm.email}
                onChange={(e) =>
                  setEditProfileForm((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Se cambi email, dovrai completare nuovamente la verifica.
              </p>
            </div>

            {/* Telefono */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Numero di telefono
              </label>
              <input
                type="tel"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                value={editProfileForm.phoneNumber}
                onChange={(e) =>
                  setEditProfileForm((prev) => ({
                    ...prev,
                    phoneNumber: e.target.value,
                  }))
                }
                placeholder="+39 ..."
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Se cambi numero, la verifica del telefono verrà ripetuta.
              </p>
            </div>

{/* Bio / Presentazione */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Bio / Presentazione
              </label>
              <textarea
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand resize-none"
                rows={3}
                maxLength={500}
                placeholder="Ciao! Sono un membro della community Renthubber..."
                value={editProfileForm.bio}
                onChange={(e) =>
                  setEditProfileForm((prev) => ({
                    ...prev,
                    bio: e.target.value,
                  }))
                }
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Questa descrizione sarà visibile sul tuo profilo pubblico. Max 500 caratteri.
              </p>
            </div>
            {/* Tipo utente + Data di nascita */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Tipo utente
                </label>
                <select
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand bg-white"
                  value={editProfileForm.userType}
                  onChange={(e) =>
                    setEditProfileForm((prev) => ({
                      ...prev,
                      userType: e.target.value as UserTypeOption,
                    }))
                  }
                >
                  <option value="privato">Privato</option>
                  <option value="ditta_individuale">
                    Ditta individuale
                  </option>
                  <option value="societa">Società</option>
                  <option value="associazione">Associazione</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Data di nascita
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                  value={editProfileForm.dateOfBirth}
                  onChange={(e) =>
                    setEditProfileForm((prev) => ({
                      ...prev,
                      dateOfBirth: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* ✅ SEPARATORE SICUREZZA */}
            <div className="border-t border-gray-200 pt-4 mt-6">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Sicurezza</h3>
              <button
                type="button"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  setChangePasswordModalOpen(true);
                }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 border-gray-200 hover:border-brand hover:bg-brand/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-gray-400 group-hover:text-brand" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-brand">
                    Cambia Password
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand" />
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => !isSavingProfile && setIsProfileModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                disabled={isSavingProfile}
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-brand hover:bg-brand-dark disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isSavingProfile}
              >
                {isSavingProfile ? 'Salvataggio...' : 'Salva modifiche'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // --- MODALE CAMBIO PASSWORD ---
  const renderChangePasswordModal = () => {
    if (!changePasswordModalOpen) return null;

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
          <button
            onClick={() => !isChangingPassword && setChangePasswordModalOpen(false)}
            disabled={isChangingPassword}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-brand" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Cambia Password</h2>
            <p className="text-sm text-gray-500 mt-2">
              Scegli una nuova password per il tuo account
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Password attuale */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password Attuale
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isChangingPassword || passwordSuccess}
                placeholder="••••••••"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-brand disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Nuova password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nuova Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isChangingPassword || passwordSuccess}
                placeholder="••••••••"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-brand disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Minimo 8 caratteri</p>
            </div>

            {/* Conferma password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Conferma Nuova Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isChangingPassword || passwordSuccess}
                placeholder="••••••••"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-brand disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Errore */}
            {passwordError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-sm text-red-700">{passwordError}</p>
              </div>
            )}

            {/* Successo */}
            {passwordSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <p className="text-sm text-green-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Password cambiata con successo!
                </p>
              </div>
            )}

            {/* Pulsanti */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setChangePasswordModalOpen(false)}
                disabled={isChangingPassword || passwordSuccess}
                className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isChangingPassword || passwordSuccess}
                className="flex-1 py-3 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cambio in corso...
                  </>
                ) : (
                  'Cambia Password'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // --- MODALE ELIMINA ACCOUNT ---
  const renderDeleteAccountModal = () => {
    if (!deleteAccountModalOpen) return null;

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
          <button
            onClick={() => !isDeletingAccount && setDeleteAccountModalOpen(false)}
            disabled={isDeletingAccount}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Elimina Account
            </h3>
            <p className="text-sm text-gray-600">
              Questa azione è <strong>permanente e irreversibile</strong>
            </p>
          </div>

          {/* Informazioni su cosa verrà eliminato */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-900 font-semibold mb-2">
              Verranno eliminati:
            </p>
            <ul className="text-sm text-red-800 space-y-1 ml-4 list-disc">
              <li>Tutti i tuoi dati personali</li>
              <li>Le tue prenotazioni e cronologia</li>
              <li>Le recensioni ricevute e scritte</li>
              <li>I messaggi e le conversazioni</li>
              <li>Il saldo wallet (se presente)</li>
            </ul>
          </div>

          {/* Input conferma */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Per confermare, digita <span className="text-red-600 font-mono">DELETE</span>
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              disabled={isDeletingAccount}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono"
            />
          </div>

          {/* Errore */}
          {deleteError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-sm text-red-700">{deleteError}</p>
            </div>
          )}

          {/* Pulsanti */}
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteAccountModalOpen(false)}
              disabled={isDeletingAccount}
              className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount || deleteConfirmText !== 'DELETE'}
              className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isDeletingAccount ? 'Eliminazione...' : 'Elimina Definitivamente'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- RENDER FINALE ---
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {activeMode === 'hubber'
          ? renderHubberDashboard()
          : renderRenterDashboard()}
      </div>
      {renderProfileModal()}
      {renderCancelBookingModal()}
      {renderModifyBookingModal()}
      {renderHubberCancelModal()}
      {renderPhoneVerificationModal()}
      {renderEmailVerificationModal()}
      {renderChangePasswordModal()}
      {renderDeleteAccountModal()}
      {/* ✅ MODALE RECENSIONI */}
      {reviewModalOpen && bookingToReview && (
        <WriteReviewModal
          isOpen={reviewModalOpen}
          onClose={closeReviewModal}
          onSuccess={handleReviewSuccess}
          bookingId={bookingToReview.id}
          listingId={(bookingToReview as any).listingId}
          listingTitle={bookingToReview.listingTitle}
          reviewerId={user.id}
          revieweeId={reviewType === 'renter_to_hubber' ? bookingToReview.hostId : (bookingToReview as any).renterId}
          revieweeName={reviewType === 'renter_to_hubber' ? ((bookingToReview as any).hubberName || 'Hubber') : bookingToReview.renterName}
          revieweeAvatar={reviewType === 'renter_to_hubber' ? (bookingToReview as any).hubberAvatar : bookingToReview.renterAvatar}
          reviewType={reviewType}
          listingCategory={(bookingToReview as any).listingCategory}
        />
      )}
    </div>
  );
};