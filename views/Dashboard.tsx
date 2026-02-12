import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useParams, Navigate, useLocation } from 'react-router-dom';
import { User, BookingRequest, ActiveMode, Invoice, Listing } from '../types';
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
  Eye,        
  EyeOff,
  AlertTriangle,
  Star,
  Heart,
  Gift,
  ArrowRight,
  Loader2,
  Trash2,
  Wallet,
  CreditCard,
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
import { supabase } from '../services/supabaseClient';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { AirbnbCalendar } from '../components/AirbnbCalendar';
import { WriteReviewModal } from '../components/WriteReviewModal';
import { ModifyStripeForm } from '../components/ModifyStripeForm';
import { HubberCalendar } from '../components/hubber/HubberCalendar';
import { ICalManager } from '../components/hubber/ICalManager';
import { BillingDataSection } from '../components/BillingDataSection';
import { calculateHubberFixedFee, calculateRenterFixedFee } from '../utils/feeUtils';
import { CalendarListingSelector } from '../components/hubber/CalendarListingSelector';
import { DashboardReviewsSection } from '../components/DashboardReviewsSection';
import { mapDbBookingToUiBooking } from '../components/dashboard/utils/bookingMappers';
import { SicurezzaVerifica } from '../components/dashboard/shared/SicurezzaVerifica';
import { ProfileSection } from '../components/dashboard/shared/ProfileSection';
import { PanoramicaHubber } from '../components/dashboard/hubber/PanoramicaHubber';
import { PrenotazioniRicevute } from '../components/dashboard/hubber/PrenotazioniRicevute';
import { PagamentiFattureHubber } from '../components/dashboard/hubber/PagamentiFattureHubber';
import { PrenotazioniRenter } from '../components/dashboard/renter/PrenotazioniRenter';
import { PanoramicaRenter } from '../components/dashboard/renter/PanoramicaRenter';
import { PagamentiFattureRenter } from '../components/dashboard/renter/PagamentiFattureRenter';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

// Mock Data for Charts (rimane fittizio per ora)
type UserTypeOption =
  | 'privato'
  | 'ditta_individuale'
  | 'societa'
  | 'associazione';

type HubberBookingFilter = 'all' | 'pending' | 'accepted' | 'completed' | 'rejected' | 'cancelled';

export type DashboardTab =
  | 'bookings' 
  | 'reviews' 
  | 'overview' 
  | 'payments' 
  | 'security' 
  | 'profile' 
  | 'hubber_bookings' 
  | 'calendar' 
  | 'favorites';

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

interface DashboardProps {
  user: User;
  activeMode: ActiveMode;
  onManageListings: () => void;
  onBackToHome?: () => void;
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
 // ✅ NUOVE CALLBACK CALENDARIO
onImportCalendar?: (listingId: string, calendarUrl: string, calendarName: string) => Promise<void>;
onSyncCalendar?: (calendarId: string) => Promise<void>;
onRemoveCalendar?: (calendarId: string) => Promise<void>;
onChangeMode?: (mode: ActiveMode) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  activeMode,
  onManageListings,
  onBackToHome,
  onBecomeHubber,  // ✅ AGGIUNTO
  onNavigateToWallet,  // ✅ NUOVO
  onViewListing, // ✅ NUOVO
  invoices = [],
  onUpdateProfile,
  onViewRenterProfile,
  onChangeMode,
}) => {

   // Hooks di routing
  const navigate = useNavigate();
  const location = useLocation();

  // Stati esistenti...
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Sincronizza activeTab con URL
  useEffect(() => {
    const path = location.pathname.replace('/dashboard/', '').replace('/dashboard', '');
    if (path && path !== 'dashboard') {
      setActiveTab(path);
    }
  }, [location.pathname]);

  // Redirect da /dashboard a /dashboard/overview
  useEffect(() => {
    if (location.pathname === '/dashboard' || location.pathname === '/dashboard/') {
      navigate('/dashboard/overview', { replace: true });
    }
  }, [location.pathname, navigate]);

// Leggi parametro mode dall'URL (solo al primo caricamento)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const modeParam = params.get('mode');
    
    if ((modeParam === 'hubber' || modeParam === 'renter') && modeParam !== activeMode && onChangeMode) {
      onChangeMode(modeParam);
    }
  }, [location.search]);

  // Mappa activeTab quando cambia activeMode
useEffect(() => {
  // Hubber → Renter
  if (activeMode === 'renter') {
    if (activeTab === 'hubber_bookings') changeTab('bookings'); // Prenotazioni Hubber → Prenotazioni Renter
    if (activeTab === 'calendar') changeTab('overview'); // Calendario non esiste in Renter
  }
  
  // Renter → Hubber
  if (activeMode === 'hubber') {
    if (activeTab === 'bookings') changeTab('hubber_bookings'); // Prenotazioni Renter → Prenotazioni Hubber
    if (activeTab === 'favorites') changeTab('overview'); // Preferiti non esiste in Hubber
  }
}, [activeMode]);

  // Funzione helper per cambiare tab e navigare
  const changeTab = (tab: string) => {
    setActiveTab(tab);
    navigate(`/dashboard/${tab}`);
  };

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
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);

// Funzione per caricare conteggio recensioni
const loadPendingReviewsCount = async () => {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, end_date')  // ✅ Aggiungi end_date
      .eq(activeMode === 'hubber' ? 'hubber_id' : 'renter_id', user.id)
      .eq('status', 'completed')
      .not('completed_at', 'is', null);  // ✅ Aggiungi questo

    if (error) throw error;

    let count = 0;
    for (const booking of bookings || []) {
      const alreadyReviewed = await api.reviews.existsForBooking(booking.id, user.id);
      if (alreadyReviewed) continue;

      // ✅ CONTROLLO SCADENZA
      const endDate = new Date(booking.end_date);
      const deadline = new Date(endDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (new Date() > deadline) continue;

      count++;
    }

     console.log('🔢 Count finale recensioni valide:', count);
    setPendingReviewsCount(count);
  } catch (err) {
    console.error('Errore caricamento conteggio recensioni:', err);
  }
};

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
    phoneVerified: (user as any).phoneVerified || false,
    userType:
      ((user as any).userType as UserTypeOption | undefined) || 'privato',
    dateOfBirth: (user as any).dateOfBirth || '',
    bio: (user as any).bio || '',
  };
});

// ✅ Sincronizza profileData quando user cambia
  useEffect(() => {
    
   setProfileData({
  firstName: (user as any).firstName || (user.name ? user.name.split(' ')[0] : '') || '',
  lastName: (user as any).lastName || (user.name ? user.name.split(' ').slice(1).join(' ') : '') || '',
  email: user.email || '',
  phoneNumber: user.phoneNumber || '',
  phoneVerified: (user as any).phoneVerified || false,
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
  const [modifyPaymentMethod, setModifyPaymentMethod] = useState<'wallet' | 'card' | null>(null);
  const [renterWalletBalance, setRenterWalletBalance] = useState(0);
  const [modifyStripeClientSecret, setModifyStripeClientSecret] = useState<string | null>(null);

  // DETTAGLIO PRENOTAZIONE RENTER
  const [selectedRenterBooking, setSelectedRenterBooking] = useState<BookingRequest | null>(null);
  const [renterTimeFilter, setRenterTimeFilter] = useState<'current' | 'historical'>('current'); // ✅ NUOVO: filtro temporale renter
  const [expandedRenterMonths, setExpandedRenterMonths] = useState<Set<string>>(new Set()); // ✅ NUOVO: mesi espansi renter
  
  // ✅ NUOVO: filtri temporali pagamenti renter
  const [renterPaymentsTimeFilter, setRenterPaymentsTimeFilter] = useState<'current' | 'historical'>('current');
  const [expandedRenterPaymentsMonths, setExpandedRenterPaymentsMonths] = useState<Set<string>>(new Set());
  const [renterInvoicesTimeFilter, setRenterInvoicesTimeFilter] = useState<'current' | 'historical'>('current');
  const [expandedRenterInvoicesMonths, setExpandedRenterInvoicesMonths] = useState<Set<string>>(new Set());
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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);  
  const [showNewPassword, setShowNewPassword] = useState(false);          
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
const [hubberListings, setHubberListings] = useState<Listing[]>([]); 
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
      phoneVerified: (user as any).phoneVerified || false,
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

   // 🆕 CARICA GLI ANNUNCI DELL'HUBBER
  try {
    const listings = await api.listings.getByUserId(user.id);
    setHubberListings(listings);
  } catch (err) {
    console.error('Errore caricamento annunci hubber:', err);
    setHubberListings([]);
  }

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
      
      if (activeMode !== 'hubber' || !user.id) {
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
        const { supabase } = await import('../services/supabaseClient');
        const { data, error } = await supabase
          .from('users')
          .select('hubber_balance')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setRealHubberBalance(data.hubber_balance || 0);
          
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

// --- REALTIME: Canali separati per evitare limiti ---
useEffect(() => {
  // CANALE 1: Bookings & Reviews
  const channel1 = supabase
    .channel('dashboard-bookings-reviews')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'bookings',
        filter: activeMode === 'hubber' ? `hubber_id=eq.${user.id}` : `renter_id=eq.${user.id}`
      },
      () => {
        loadPendingReviewsCount();
      }
    )
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'reviews'
      },
      () => {
        loadPendingReviewsCount();
      }
    )
    .subscribe();

  // CANALE 2: Finanze
  const channel2 = supabase
    .channel('dashboard-finances')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'payments',
        filter: `user_id=eq.${user.id}`
      },
      () => {
        // Payment aggiornato - nessuna azione per ora
      }
    )
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'invoices',
        filter: `user_id=eq.${user.id}`
      },
      () => {
        // Invoice aggiornata - nessuna azione per ora
      }
    )
    .subscribe();

  // CANALE 3: Listings & Altro
  const channel3 = supabase
    .channel('dashboard-misc')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'calendar_blocks'
      },
      () => {
        // Calendar block aggiornato - il calendario si aggiorna già automaticamente
      }
    )
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'favorites',
        filter: `user_id=eq.${user.id}`
      },
      () => {
        // Favorito aggiornato - nessuna azione per ora
      }
    )
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'disputes'
      },
      () => {
        // Dispute aggiornata - nessuna azione per ora
      }
    )
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'refunds',
        filter: `user_id=eq.${user.id}`
      },
      () => {
        // Refund aggiornato - nessuna azione per ora
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel1);
    supabase.removeChannel(channel2);
    supabase.removeChannel(channel3);
  };
}, [user.id, activeMode]);

// Carica conteggio iniziale recensioni
useEffect(() => {
  if (user.id) {
    loadPendingReviewsCount();
  }
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

          const hubberName = (next as any).hubberName || 'Hubber';

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
   
    closeReviewModal();
  };

  // ========== HANDLER CALENDARIO iCAL ==========
const handleImportCalendar = async (url: string, name: string): Promise<void> => {
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

const handleSyncCalendar = async (calendarId: string): Promise<void> => {
  setImportedCalendars(prev =>
    prev.map(cal =>
      cal.id === calendarId
        ? { ...cal, status: 'syncing' as const }
        : cal
    )
  );
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  setImportedCalendars(prev =>
    prev.map(cal =>
      cal.id === calendarId
        ? { ...cal, status: 'active' as const, lastSync: new Date().toISOString() }
        : cal
    )
  );
};

const handleRemoveCalendar = async (calendarId: string): Promise<void> => {
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
  // Forza UTC a mezzogiorno per evitare problemi timezone
  currentBookingStart = new Date(startStr + 'T12:00:00Z');
  setNewStartDate(currentBookingStart);
}
if (endStr) {
  // Forza UTC a mezzogiorno per evitare problemi timezone
  currentBookingEnd = new Date(endStr + 'T12:00:00Z');
  setNewEndDate(currentBookingEnd);
}
      }
    } catch (e) {
      console.warn("Impossibile parsare date prenotazione:", e);
    }

  // Carica le date già prenotate per questo annuncio (escludendo la prenotazione corrente)
try {
  const listingId = (booking as any).listingId || (booking as any).listing_id;
  if (listingId) {
    // Usa Supabase direttamente come nel BookingModifyModal
    const { supabase } = await import('../services/supabaseClient');
    
    const { data: bookings } = await supabase
      .from('bookings')
      .select('start_date, end_date, id')
      .eq('listing_id', listingId)
      .eq('status', 'confirmed');
  
    if (bookings) {
    }
    
    // Filtra manualmente
    const filteredBookings = bookings?.filter(b => b.id !== booking.id) || [];
    
    if (!filteredBookings || filteredBookings.length === 0) {
      setModifyDisabledDates([]);
    }
    
    const allDisabledDates: Date[] = [];
    
    filteredBookings.forEach((b: { start_date: string; end_date: string }) => {
  const start = new Date(b.start_date);
  const end = new Date(b.end_date);
  
  
  // Aggiungi tutte le date tra start e end
  const current = new Date(start);
  while (current < end) {
    allDisabledDates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
});

// ✅ AGGIUNGI QUESTO BLOCCO QUI
// Carica anche i blocchi del calendario
const { data: blocks } = await supabase
  .from('calendar_blocks')
  .select('start_date, end_date')
  .eq('listing_id', listingId);


if (blocks) {
  blocks.forEach((block: { start_date: string; end_date: string }) => {
    const start = new Date(block.start_date);
    const end = new Date(block.end_date);
    
    const current = new Date(start);
    while (current < end) {
      allDisabledDates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
  });
}

setModifyDisabledDates(allDisabledDates);
  }
} catch (err) {
  console.error("Errore caricamento date prenotate:", err);
}
    
     // Carica saldo wallet renter
    try {
      const { data: wallet, error } = await supabase
        .from('wallets')
        .select('balance_cents')
        .eq('user_id', user.id)
        .single();
      
      if (!error && wallet) {
        setRenterWalletBalance((wallet.balance_cents || 0) / 100);
      }
    } catch (err) {
      console.error('Errore caricamento saldo wallet:', err);
      setRenterWalletBalance(0);
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

        // Calcola commissioni 10%
const originalCommission = (originalBasePrice * 10) / 100;
const newCommission = (newBasePrice * 10) / 100;
const commissionDiff = newCommission - originalCommission;

// Calcola fee fissa
const originalFixedFee = calculateRenterFixedFee(originalBasePrice);
const newFixedFee = calculateRenterFixedFee(newBasePrice);
const fixedFeeDiff = newFixedFee - originalFixedFee;

// Differenza totale = prezzo base + commissione + fee fissa
const totalDiff = basePriceDiff + commissionDiff + fixedFeeDiff;
        
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

    // FASE 1: Se deve pagare di più e non ha scelto metodo, mostra selettore
    if (priceDifference > 0 && !showPaymentForModify) {
      setShowPaymentForModify(true);
      return;
    }

    // FASE 2: Validazione se deve pagare
    if (priceDifference > 0 && showPaymentForModify) {
      if (!modifyPaymentMethod) {
        setModifyError('Seleziona un metodo di pagamento');
        return;
      }

      if (modifyPaymentMethod === 'wallet' && renterWalletBalance < priceDifference) {
        setModifyError(`Saldo wallet insufficiente. Disponibile: €${renterWalletBalance.toFixed(2)}, Richiesto: €${priceDifference.toFixed(2)}`);
        return;
      }
    }

    setIsModifying(true);
    setModifyError(null);
    setModifySuccess(null);

    try {
      const endDateToUse = newEndDate || newStartDate;

      if ((api as any).bookings?.modify) {
  // Chiama la nuova Netlify Function
const response = await fetch('/.netlify/functions/modify-booking-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    bookingId: bookingToModify.id,
    renterId: user.id,
    newStartDate: `${newStartDate.getFullYear()}-${String(newStartDate.getMonth() + 1).padStart(2, '0')}-${String(newStartDate.getDate()).padStart(2, '0')}`,
    newEndDate: `${endDateToUse.getFullYear()}-${String(endDateToUse.getMonth() + 1).padStart(2, '0')}-${String(endDateToUse.getDate()).padStart(2, '0')}`,
    paymentMethod: priceDifference > 0 ? modifyPaymentMethod : undefined,
  }),
});

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Errore durante la modifica');
  }

  const result = await response.json();

// Se richiede pagamento con carta
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
        setTimeout(async () => {
          closeModifyModal();
          // Ricarica solo le prenotazioni
          try {
            const dbBookings = await api.bookings.getForRenterFromDb(user.id);
            if (dbBookings.length > 0) {
              const mapped = dbBookings.map((b: any) => ({
                ...mapDbBookingToUiBooking(b),
                hasReviewed: b.hasReviewed || false,
              }));
              setRequests(mapped);
            }
          } catch (e) {
            console.error('Errore ricaricamento prenotazioni:', e);
          }
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
    const scrollPosition = window.scrollY;
    setSelectedRenterBooking(booking);

    // Blocca scroll immediatamente
  document.documentElement.style.scrollBehavior = 'auto';
  document.body.style.overflow = 'hidden';
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
      const fixedFee = calculateRenterFixedFee(basePrice + cleaningFee);
      const deposit = (booking as any).deposit || 0;

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
        deposit,
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
  // Sblocca scroll e ripristina posizione
  document.body.style.overflow = '';
  window.scrollTo(0, scrollPosition);
  setTimeout(() => {
    window.scrollTo(0, scrollPosition);
  }, 0);
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
        phone_number: editProfileForm.phoneNumber || null,
      })
      .eq('id', user.id);
      
    if (error) {
      console.error('❌ Errore UPDATE users:', error);
    } else

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

    // Assicurati che inizi con +39
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : '+39' + cleanPhone.replace(/^0/, '');

    setIsSendingOtp(true);
    setPhoneError(null);

    try {
      // Chiama la funzione Supabase per inviare OTP via WhatsApp
      const { data, error } = await supabase.functions.invoke('whatsapp-verification', {
        body: {
          action: 'send',
          phoneNumber: formattedPhone,
          userId: user.id
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Errore invio codice');

      // Salva il numero di telefono nel profilo
      if (onUpdateProfile) {
        await onUpdateProfile({
          phoneNumber: formattedPhone,
          resetPhoneVerification: false,
        });
      }

      // Aggiorna profileData locale
      setProfileData(prev => ({ ...prev, phoneNumber: formattedPhone }));
      setOtpSentTo(formattedPhone);
      setPhoneStep('otp');
      
    } catch (err: any) {
      console.error('Errore invio OTP:', err);
      setPhoneError(err.message || 'Errore nell\'invio del codice. Riprova.');
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
      // Chiama la funzione Supabase per verificare il codice
      const { data, error } = await supabase.functions.invoke('whatsapp-verification', {
        body: {
          action: 'verify',
          phoneNumber: otpSentTo,
          code: otpCode,
          userId: user.id
        }
      });

      if (error) throw error;
      if (!data.success) {
        // Mostra tentativi rimasti se disponibili
        if (data.attemptsLeft !== undefined) {
          throw new Error(`${data.error} (${data.attemptsLeft} tentativi rimasti)`);
        }
        throw new Error(data.error || 'Codice non valido');
      }

      // Aggiorna stato verifica nel database locale
if (onUpdateProfile) {
  await onUpdateProfile({
    phoneVerified: true,
  });
}

// Aggiorna lo stato locale per riflettere immediatamente la verifica
setProfileData(prev => ({ 
  ...prev, 
  phoneVerified: true,
  phoneNumber: otpSentTo 
}));

setPhoneStep('success');

// Chiudi modale dopo 2 secondi SENZA ricaricare la pagina
setTimeout(() => {
  closePhoneModal();
  setPhoneStep('input');
}, 2000);

    } catch (err: any) {
      console.error('Errore verifica OTP:', err);
      setPhoneError(err.message || 'Codice non valido. Riprova.');
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

  // Funzione per validare password sicura
const validatePasswordStrength = (password: string) => {
  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const strength = [minLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;
  
  return {
    isValid: minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
    strength, // 0-5
    requirements: {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
    }
  };
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

  // Validazione password sicura
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    const missing = [];
    if (!passwordValidation.requirements.minLength) missing.push('almeno 8 caratteri');
    if (!passwordValidation.requirements.hasUpperCase) missing.push('una maiuscola');
    if (!passwordValidation.requirements.hasLowerCase) missing.push('una minuscola');
    if (!passwordValidation.requirements.hasNumber) missing.push('un numero');
    if (!passwordValidation.requirements.hasSpecialChar) missing.push('un carattere speciale (!@#$%^&*...)');
    
    setPasswordError(`La password deve contenere: ${missing.join(', ')}`);
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
const renderSecurityNew = () => (
  <SicurezzaVerifica
    user={user}
    profileData={profileData}
    onUpdateProfile={onUpdateProfile}
    onOpenPhoneModal={openPhoneModal}
    onOpenEmailModal={openEmailModal}
    onOpenDeleteAccountModal={() => {
      setDeleteAccountModalOpen(true);
      setDeleteConfirmText('');
      setDeleteError(null);
    }}
  />
);

// --- SEZIONE PROFILO NUOVO (shared) ---
  const renderProfile = () => (
    <ProfileSection
      user={user}
      profileData={profileData}
      avatarPreview={avatarPreview}
      preferences={preferences}
      avatarInputRef={avatarInputRef}
      onAvatarClick={handleAvatarClick}
      onAvatarChange={handleAvatarChange}
      onOpenProfileModal={openProfileModal}
      onPreferencesChange={setPreferences}
    />
  );

  // --- PANORAMICA HUBBER ---
    const renderHubberOverview = () => (
    <PanoramicaHubber
      hubberStats={hubberStats}
      realHubberBalance={realHubberBalance}
      hubberBookings={hubberBookings}
      onRequestAction={handleRequestAction}
      onNavigateToBookings={() => changeTab('hubber_bookings')}
      onViewRenterProfile={onViewRenterProfile}
    />
     );

   const renderHubberPayments = () => (
    <PagamentiFattureHubber
      hubberBookings={hubberBookings}
      userInvoices={userInvoices}
      hubberPaymentsTimeFilter={hubberPaymentsTimeFilter}
      hubberInvoicesTimeFilter={hubberInvoicesTimeFilter}
      expandedHubberPaymentsMonths={expandedHubberPaymentsMonths}
      expandedHubberInvoicesMonths={expandedHubberInvoicesMonths}
      onPaymentsTimeFilterChange={setHubberPaymentsTimeFilter}
      onInvoicesTimeFilterChange={setHubberInvoicesTimeFilter}
      onTogglePaymentMonth={(monthKey) => {
        const newExpanded = new Set(expandedHubberPaymentsMonths);
        if (newExpanded.has(monthKey)) {
          newExpanded.delete(monthKey);
        } else {
          newExpanded.add(monthKey);
        }
        setExpandedHubberPaymentsMonths(newExpanded);
      }}
      onToggleInvoiceMonth={(monthKey) => {
        const newExpanded = new Set(expandedHubberInvoicesMonths);
        if (newExpanded.has(monthKey)) {
          newExpanded.delete(monthKey);
        } else {
          newExpanded.add(monthKey);
        }
        setExpandedHubberInvoicesMonths(newExpanded);
      }}
      onDownloadInvoice={(invoiceId) => {
      }}
      getTransactionNumber={getTransactionNumber}
      onViewRenterProfile={onViewRenterProfile}
      renderBookingStatusBadge={renderBookingStatusBadge}
      loadingInvoices={loadingInvoices}
    />
  );

  const renderRenterBookings = () => (
    <PrenotazioniRenter
      renterBookings={renterBookings}
      renterTimeFilter={renterTimeFilter}
      expandedRenterMonths={expandedRenterMonths}
      selectedRenterBooking={selectedRenterBooking}
      onTimeFilterChange={setRenterTimeFilter}
      onToggleMonth={(monthKey) => {
        const newExpanded = new Set(expandedRenterMonths);
        if (newExpanded.has(monthKey)) {
          newExpanded.delete(monthKey);
        } else {
          newExpanded.add(monthKey);
        }
        setExpandedRenterMonths(newExpanded);
      }}
      onSelectBooking={setSelectedRenterBooking}
      onViewHubberProfile={onViewRenterProfile}
      onCancelBooking={openCancelModal}
      onOpenReviewModal={openReviewModal}
      renderBookingStatusBadge={renderBookingStatusBadge}
      loadBookingDetail={loadBookingDetail}
      closeBookingDetail={closeBookingDetail}
      bookingDetailData={bookingDetailData}
      loadingBookingDetail={loadingBookingDetail}
      canCancelBooking={canCancelBooking}
      openModifyModal={openModifyModal}
      openCancelModal={openCancelModal}
      formatCancellationPolicy={formatCancellationPolicy}
    />
  );

const renderHubberBookingsList = () => (
    <PrenotazioniRicevute
      hubberBookings={hubberBookings}
      hubberBookingFilter={hubberBookingFilter}
      hubberTimeFilter={hubberTimeFilter}
      expandedMonths={expandedMonths}
      selectedHubberBookingId={selectedHubberBookingId}
      onFilterChange={setHubberBookingFilter}
      onTimeFilterChange={setHubberTimeFilter}
      onToggleMonth={(monthKey) => {
        const newExpanded = new Set(expandedMonths);
        if (newExpanded.has(monthKey)) {
          newExpanded.delete(monthKey);
        } else {
          newExpanded.add(monthKey);
        }
        setExpandedMonths(newExpanded);
      }}
      onSelectBooking={setSelectedHubberBookingId}
      onRequestAction={handleRequestAction}
      onViewRenterProfile={onViewRenterProfile}
      renderBookingStatusBadge={renderBookingStatusBadge}
      onOpenReviewModal={openReviewModal}
      onOpenCancelModal={openHubberCancelModal}
    />
  );

 // --- CALENDARIO HUBBER ---
const renderHubberCalendar = () => {
  
  return (
    <CalendarListingSelector
      userId={user.id}
      userName={user.name}
      listings={hubberListings} // 🆕 NON user.listings!
      onViewRenterProfile={onViewRenterProfile}
      onImportCalendar={handleImportCalendar}
      onSyncCalendar={handleSyncCalendar}
      onRemoveCalendar={handleRemoveCalendar}
    />
  );
};

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
          onClick={() => changeTab('overview')}
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
          onClick={() => changeTab('calendar')}
          className={`px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all text-center ${
            activeTab === 'calendar'
              ? 'bg-gray-100 text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
           Calendario
        </button>
        
        <button
          onClick={() => changeTab('hubber_bookings')}
          className={`px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all text-center ${
            activeTab === 'hubber_bookings'
              ? 'bg-gray-100 text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Prenotazioni
        </button>
        <button
          onClick={() => changeTab('profile')}
          className={`px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all text-center ${
            activeTab === 'profile'
              ? 'bg-gray-100 text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Il mio profilo
        </button>
        <button
          onClick={() => changeTab('payments')}
          className={`px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all text-center ${
            activeTab === 'payments'
              ? 'bg-gray-100 text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Pagamenti & Fatture
        </button>
        <button
          onClick={() => changeTab('security')}
          className={`px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all text-center ${
            activeTab === 'security'
              ? 'bg-gray-100 text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Sicurezza & Verifica
          </button>
          <button
  onClick={() => changeTab('reviews')}
  className={`px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all text-center relative ${
    activeTab === 'reviews'
      ? 'bg-gray-100 text-gray-900 shadow-sm'
      : 'text-gray-500 hover:text-gray-700'
  }`}
>
  <span>Recensioni</span>
  {pendingReviewsCount > 0 && (
    <span className="absolute -top-1 -right-1 bg-[#0D414B] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
      {pendingReviewsCount}
    </span>
  )}
</button>
      </div>

      {activeTab === 'overview' && renderHubberOverview()}
      {activeTab === 'calendar' && renderHubberCalendar()} 
      {activeTab === 'hubber_bookings' && renderHubberBookingsList()}
      {activeTab === 'payments' && renderHubberPayments()}
      {activeTab === 'security' && renderSecurityNew()}
      {activeTab === 'profile' && renderProfile()}
      {activeTab === 'reviews' && (
  <DashboardReviewsSection
    userId={user.id}
    userType={activeMode}
    onViewProfile={(profile) => {
    }}
    onPendingCountChange={(count) => {
      setPendingReviewsCount(count);
    }}
  />
)}
   </div>
  );

 const renderRenterPayments = () => (
  <PagamentiFattureRenter
    renterBookings={renterBookings}
    user={user}
    userInvoices={userInvoices}
    renterPaymentsTimeFilter={renterPaymentsTimeFilter}
    expandedRenterPaymentsMonths={expandedRenterPaymentsMonths}
    onTimeFilterChange={setRenterPaymentsTimeFilter}
    onToggleMonth={(monthKey) => {
      const newExpanded = new Set(expandedRenterPaymentsMonths);
      if (newExpanded.has(monthKey)) {
        newExpanded.delete(monthKey);
      } else {
        newExpanded.add(monthKey);
      }
      setExpandedRenterPaymentsMonths(newExpanded);
    }}
    getTransactionNumber={getTransactionNumber}
    renterInvoicesTimeFilter={renterInvoicesTimeFilter}
    expandedRenterInvoicesMonths={expandedRenterInvoicesMonths}
    onInvoicesTimeFilterChange={setRenterInvoicesTimeFilter}
    onToggleInvoiceMonth={(monthKey) => {
      const newExpanded = new Set(expandedRenterInvoicesMonths);
      if (newExpanded.has(monthKey)) {
        newExpanded.delete(monthKey);
      } else {
        newExpanded.add(monthKey);
      }
      setExpandedRenterInvoicesMonths(newExpanded);
    }}
    loadingInvoices={loadingInvoices}
  />
);

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
    onClick={() => changeTab('overview')}
    className={`px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all text-center ${
      activeTab === 'overview'
        ? 'bg-gray-100 text-gray-900 shadow-sm'
        : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    Panoramica
  </button>
  <button
    onClick={() => changeTab('bookings')}
    className={`px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all text-center ${
      activeTab === 'bookings'
        ? 'bg-gray-100 text-gray-900 shadow-sm'
        : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    Prenotazioni
  </button>
  <button
    onClick={() => changeTab('profile')}
    className={`px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all text-center ${
      activeTab === 'profile'
        ? 'bg-gray-100 text-gray-900 shadow-sm'
        : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    Il mio profilo
  </button>
  <button
    onClick={() => changeTab('payments')}
    className={`px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all text-center ${
      activeTab === 'payments'
        ? 'bg-gray-100 text-gray-900 shadow-sm'
        : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    Pagamenti & Fatture
  </button>
  <button
    onClick={() => changeTab('security')}
    className={`px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all text-center ${
      activeTab === 'security'
        ? 'bg-gray-100 text-gray-900 shadow-sm'
        : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    Sicurezza & Verifica
  </button>
  <button
    onClick={() => changeTab('favorites')}
    className={`px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all text-center ${
      activeTab === 'favorites'
        ? 'bg-gray-100 text-gray-900 shadow-sm'
        : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    Preferiti
  </button>
  <button
  onClick={() => changeTab('reviews')}
  className={`px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all text-center relative ${
    activeTab === 'reviews'
      ? 'bg-gray-100 text-gray-900 shadow-sm'
      : 'text-gray-500 hover:text-gray-700'
  }`}
>
  <span>Recensioni</span>
  {/* Badge con numero recensioni da lasciare - DA IMPLEMENTARE IL CONTEGGIO */}
  {pendingReviewsCount > 0 && (
  <span className="absolute -top-1 -right-1 bg-[#0D414B] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
    {pendingReviewsCount}
  </span>
)}
</button>
</div>

     {activeTab === 'security' && renderSecurityNew()}
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
         onExploreClick={onBackToHome}
         />
      )}
      {activeTab === 'reviews' && (
  <DashboardReviewsSection
    userId={user.id}
    userType={activeMode}
    onViewProfile={(profile) => {
    }}
    onPendingCountChange={(count) => {
      setPendingReviewsCount(count);
    }}
  />
)}

   {activeTab === 'overview' && (
  <PanoramicaRenter
    user={user}
    renterBookings={renterBookings}
    nextUpcomingBooking={nextUpcomingBooking}
    loadingNextBooking={loadingNextBooking}
    recentlyViewed={recentlyViewed}
    onBecomeHubber={onBecomeHubber}
    onNavigateToWallet={onNavigateToWallet}
    setActiveTab={changeTab}
  />
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
  <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/60 backdrop-blur-sm pt-20 pb-8 overflow-y-auto">
    <div 
      className="bg-white rounded-2xl shadow-xl w-full max-w-3xl relative mx-4 mb-20 md:mb-0 flex flex-col"
      style={{ maxHeight: 'calc(100vh - 100px)' }}
    >
        {/* Header fisso */}
        <div className="p-6 pb-4 md:pb-6 border-b border-gray-200 relative flex-shrink-0">
          <button
            onClick={closeModifyModal}
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

        {/* Contenuto scrollabile */}
        <div className="p-6 pt-4 md:pt-6 overflow-y-auto flex-1">
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

             {/* Selettore metodo di pagamento */}
{showPaymentForModify && priceDifference > 0 && (
  <div className="mb-6">
    <h3 className="text-sm font-semibold text-gray-700 mb-3">
      Scegli il metodo di pagamento
    </h3>
    
    <div className="space-y-3">
      {/* Opzione Wallet */}
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
              modifyPaymentMethod === 'wallet'
                ? 'border-blue-500'
                : 'border-gray-300'
            }`}>
              {modifyPaymentMethod === 'wallet' && (
                <div className="w-3 h-3 rounded-full bg-blue-500" />
              )}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">
                Wallet Renthubber
              </p>
              <p className="text-xs text-gray-500">
                Saldo disponibile: €{renterWalletBalance.toFixed(2)}
              </p>
            </div>
          </div>
          <Wallet className="w-5 h-5 text-gray-400" />
        </div>
        {modifyPaymentMethod === 'wallet' && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-xs text-gray-600">
              Il pagamento verrà addebitato immediatamente dal tuo wallet.
            </p>
            {renterWalletBalance < priceDifference && (
              <p className="text-xs text-red-600 mt-1 font-medium">
                ⚠️ Saldo insufficiente. Ricarica il wallet o scegli la carta.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Opzione Carta */}
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
              modifyPaymentMethod === 'card'
                ? 'border-blue-500'
                : 'border-gray-300'
            }`}>
              {modifyPaymentMethod === 'card' && (
                <div className="w-3 h-3 rounded-full bg-blue-500" />
              )}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">
                Carta di credito/debito
              </p>
              <p className="text-xs text-gray-500">
                Pagamento sicuro tramite Stripe
              </p>
            </div>
          </div>
          <CreditCard className="w-5 h-5 text-gray-400" />
        </div>
        {modifyPaymentMethod === 'card' && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-xs text-gray-600">
              Verrai reindirizzato a Stripe per completare il pagamento in modo sicuro.
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
)}


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
                onClick={() => {
                  if (showPaymentForModify) {
                    // Torna alla selezione date
                    setShowPaymentForModify(false);
                    setModifyPaymentMethod(null);
                    setModifyError(null);
                  } else {
                    closeModifyModal();
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

// --- MODALE STRIPE PAGAMENTO MODIFICA ---
const renderModifyStripeModal = () => {
  if (!modifyStripeClientSecret || !bookingToModify) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md relative mx-4 flex flex-col"
        style={{ maxHeight: 'calc(100vh - 140px)' }}
      >
        {/* Header fisso */}
        <div className="p-6 border-b border-gray-200 relative flex-shrink-0">
          <button
            onClick={() => {
              setModifyStripeClientSecret(null);
              setShowPaymentForModify(false);
              setModifyPaymentMethod(null);
            }}
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

        {/* Contenuto scrollabile */}
        <div className="p-6 overflow-y-auto flex-1">
          <Elements 
            stripe={stripePromise}
            options={{ clientSecret: modifyStripeClientSecret }}
          >
            <ModifyStripeForm
              clientSecret={modifyStripeClientSecret}
              bookingId={bookingToModify.id}
              amount={priceDifference}
              onSuccess={() => {
                setModifyStripeClientSecret(null);
                setModifySuccess('Prenotazione modificata e pagamento completato!');
                setTimeout(async () => {
                  closeModifyModal();
                  try {
                    const dbBookings = await api.bookings.getForRenterFromDb(user.id);
                    if (dbBookings.length > 0) {
                      const mapped = dbBookings.map((b: any) => ({
                        ...mapDbBookingToUiBooking(b),
                        hasReviewed: b.hasReviewed || false,
                      }));
                      setRequests(mapped);
                    }
                  } catch (e) {
                    console.error('Errore ricaricamento prenotazioni:', e);
                  }
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
                  Inserisci il tuo numero di telefono per ricevere un codice di verifica su Sms.
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
                  'Invia codice Sms'
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
  <div className="relative">
    <input
      type="tel"
      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand bg-gray-50 cursor-not-allowed"
      value={profileData.phoneNumber || ''}
      readOnly
      placeholder="Nessun numero verificato"
    />
    {!profileData.phoneVerified && (
      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          📱 Per aggiungere o modificare il numero di telefono, vai nella sezione{' '}
          <button
            onClick={() => changeTab('security')}
            className="font-semibold underline hover:text-blue-800"
          >
            Sicurezza e Verifica
          </button>
        </p>
      </div>
    )}
     {profileData.phoneVerified && profileData.phoneNumber && (
      <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Numero verificato
      </div>
    )}
  </div>
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
  <div className="relative">
    <input
      type={showCurrentPassword ? "text" : "password"}
      value={currentPassword}
      onChange={(e) => setCurrentPassword(e.target.value)}
      disabled={isChangingPassword || passwordSuccess}
      placeholder="••••••••"
      className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-brand disabled:bg-gray-100 disabled:cursor-not-allowed"
    />
    <button
      type="button"
      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
    >
      {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  </div>
</div>

            {/* Nuova password */}
<div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Nuova Password
  </label>
  <div className="relative">
    <input
      type={showNewPassword ? "text" : "password"}
      value={newPassword}
      onChange={(e) => setNewPassword(e.target.value)}
      disabled={isChangingPassword || passwordSuccess}
      placeholder="••••••••"
      className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-brand disabled:bg-gray-100 disabled:cursor-not-allowed"
    />
    <button
      type="button"
      onClick={() => setShowNewPassword(!showNewPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
    >
      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  </div>
  
  {/* Indicatori requisiti password */}
  {newPassword && (
    <div className="mt-2 space-y-1">
      {(() => {
        const validation = validatePasswordStrength(newPassword);
        const req = validation.requirements;
        
        const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
          <div className={`flex items-center gap-2 text-xs ${met ? 'text-green-600' : 'text-gray-500'}`}>
            {met ? <CheckCircle2 size={14} /> : <X size={14} />}
            <span>{text}</span>
          </div>
        );
        
        return (
          <>
            <RequirementItem met={req.minLength} text="Almeno 8 caratteri" />
            <RequirementItem met={req.hasUpperCase} text="Una lettera maiuscola" />
            <RequirementItem met={req.hasLowerCase} text="Una lettera minuscola" />
            <RequirementItem met={req.hasNumber} text="Un numero" />
            <RequirementItem met={req.hasSpecialChar} text="Un carattere speciale (!@#$%^&*...)" />
          </>
        );
      })()}
    </div>
  )}
</div>

            {/* Conferma password */}
<div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Conferma Nuova Password
  </label>
  <div className="relative">
    <input
      type={showConfirmPassword ? "text" : "password"}
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
      disabled={isChangingPassword || passwordSuccess}
      placeholder="••••••••"
      className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-brand disabled:bg-gray-100 disabled:cursor-not-allowed"
    />
    <button
      type="button"
      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
    >
      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  </div>
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
      {renderModifyStripeModal()}
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