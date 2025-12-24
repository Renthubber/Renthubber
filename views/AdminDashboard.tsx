import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Users, Package, Shield, Settings, FileText, 
  TrendingUp, AlertTriangle, Search, Ban, DollarSign, CheckCircle, XCircle, 
  Activity, Save, X, Edit, Globe, Image as ImageIcon,
  LogOut, Download, KeyRound, Trash2, FileCheck, Landmark, CheckCircle2,
  CalendarCheck, ShoppingBag, Plus, Eye, EyeOff, MapPin, Clock, Tag,
  MessageSquare, Send, AlertCircle, Headphones, UserCheck, Lock, CreditCard, Percent, Wallet,
  ChevronFirst, ChevronLeft, ChevronRight, ChevronLast, Gift, Star, Mail,Megaphone,
} from 'lucide-react';

import { 
  User, 
  Listing, 
  SystemConfig, 
  AuditLog, 
  PayoutRequest, 
  PageContent, 
  Dispute, 
  Review, 
  Invoice,
  BookingRequest
} from '../types';

import { 
  MOCK_AUDIT_LOGS, 
  MOCK_REQUESTS, 
} from '../constants';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

import { api } from '../services/api';
import { ReferralSettings } from "../components/admin/ReferralSettings";
import { downloadInvoicePDF } from '../services/invoicePdfGenerator';
import { AdminEmailSection } from './AdminEmailSection';
import { AdminCMSBranding } from "../components/admin//AdminCMSBranding";
import { AdminNotificationBell } from '../components/admin/AdminNotificationBell';
import { markAsViewed } from '../hooks/useAdminNotifications';
import { AdminRefundsOverview } from "../components/admin/AdminRefundsOverview";
import { AdminAnnouncements } from "../components/admin/AdminAnnouncements";
import { EditUserComplete } from "../components/admin/EditUserComplete";
import { useNavigate } from 'react-router-dom';
import { InvoiceXmlExport } from '../components/InvoiceXmlExport';

// Funzione per formattare data in italiano
const formatDateIT = (isoDate: string | null | undefined): string => {
  if (!isoDate) return '-';
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

interface AdminDashboardProps {
  systemConfig: SystemConfig;
  onUpdateConfig: (newConfig: SystemConfig) => void;
  allListings: Listing[];
  allUsers: User[];
  payoutRequests?: PayoutRequest[];
  onProcessPayout?: (requestId: string, approved: boolean) => void;
  onLogout?: () => void;
  disputes?: Dispute[];
  onDisputeAction?: (id: string, action: 'resolve' | 'dismiss', note?: string) => void;
  reviews?: Review[];
  invoices?: Invoice[];
  currentUser?: User;
  bookings?: BookingRequest[];
}

// --- SUB-COMPONENTS ---

const KpiCard: React.FC<{
  title: string;
  value: string | number;
  subtext?: string;
  icon: React.ElementType;
  color: string;
}> = ({ title, value, subtext, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        {subtext && (
          <p
            className={`text-xs mt-2 font-semibold ${
              subtext.startsWith('+') ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            {subtext}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

// --- MAIN DASHBOARD ---

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  systemConfig,
  onUpdateConfig,
  allListings,
  allUsers,
  payoutRequests = [],
  onProcessPayout,
  onLogout,
  disputes = [],
  onDisputeAction,
  reviews = [],
  invoices = [],
  bookings = [],
  currentUser,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
  'overview' | 'users' | 'listings' | 'bookings' | 'messages' | 'support' | 'finance' | 'invoices' | 'cms' | 'disputes' | 'reviews' | 'email' | 'config' | 'referral'
>('overview');
  // Sotto-tab per Finanza & Wallet
const [financeSubTab, setFinanceSubTab] = useState <
  'overview' | 'transactions' | 'wallets' | 'payouts' | 'fees' | 'refunds' | 'reports' | 'settings'
>('overview');

  // Filtro periodo per Panoramica Finanziaria
const [financePeriod, setFinancePeriod] = useState<'today' | '7days' | '30days' | 'year'>('30days');

  // Stato locale che parte dagli utenti reali
  const [localUsers, setLocalUsers] = useState<User[]>(allUsers || []);
  const [localBookings, setLocalBookings] = useState<BookingRequest[]>(bookings || []);
  // ✅ STATI RECENSIONI ADMIN
  const [localReviews, setLocalReviews] = useState<any[]>([]);
  // ✅ STATI CONTROVERSIE ADMIN
  const [localDisputes, setLocalDisputes] = useState<any[]>([]);
  const [reviewsSearch, setReviewsSearch] = useState('');
  const [reviewsStatusFilter, setReviewsStatusFilter] = useState<'all' | 'approved' | 'suspended'>('all');
  const [reviewsTypeFilter, setReviewsTypeFilter] = useState<'all' | 'renter_to_hubber' | 'hubber_to_renter'>('all');
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewActionLoading, setReviewActionLoading] = useState(false);
  const [localPayments, setLocalPayments] = useState<any[]>([]);
  const [paymentsSearch, setPaymentsSearch] = useState('');
  const [paymentsStatusFilter, setPaymentsStatusFilter] = useState<string>('all');
  const [paymentsDateFrom, setPaymentsDateFrom] = useState('');
  const [paymentsDateTo, setPaymentsDateTo] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [localWallets, setLocalWallets] = useState<any[]>([]);
  const [localWalletTransactions, setLocalWalletTransactions] = useState<any[]>([]);
  const [walletsSearch, setWalletsSearch] = useState('');
  const [walletsRoleFilter, setWalletsRoleFilter] = useState<string>('all');
  const [localPayouts, setLocalPayouts] = useState<any[]>([]);
  const [payoutsSearch, setPayoutsSearch] = useState('');
  const [payoutsStatusFilter, setPayoutsStatusFilter] = useState<string>('all');
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutActionLoading, setPayoutActionLoading] = useState(false);;
// Stati per sezione Prenotazioni
const [bookingSearch, setBookingSearch] = useState('');
const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);

// ========== REFUNDS (Rimborsi) STATES ==========
const [localRefunds, setLocalRefunds] = useState<any[]>([]);
const [refundStats, setRefundStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, processed: 0, totalAmount: 0, pendingAmount: 0 });
const [refundsSearch, setRefundsSearch] = useState('');
const [refundsStatusFilter, setRefundsStatusFilter] = useState<string>('all');
const [refundsDateFrom, setRefundsDateFrom] = useState('');
const [refundsDateTo, setRefundsDateTo] = useState('');
const [selectedRefund, setSelectedRefund] = useState<any>(null);
const [showRefundModal, setShowRefundModal] = useState(false);
const [showCreateRefundModal, setShowCreateRefundModal] = useState(false);
const [refundActionLoading, setRefundActionLoading] = useState(false);

// ========== REPORTS STATES ==========
const [reportType, setReportType] = useState<'transactions' | 'bookings' | 'users' | 'refunds' | 'earnings'>('transactions');
const [reportDateFrom, setReportDateFrom] = useState('');
const [reportDateTo, setReportDateTo] = useState('');
const [reportGenerating, setReportGenerating] = useState(false);

// ========== FINANCE SETTINGS STATES ==========
const [financeSettings, setFinanceSettings] = useState({
  minPayoutAmount: 50,
  defaultCurrency: 'EUR',
  autoApproveRefunds: false,
  autoApproveRefundsMaxAmount: 50,
  payoutSchedule: 'manual', // 'manual' | 'weekly' | 'monthly'
  stripeEnabled: false,
  walletEnabled: true,
});
const [settingsSaving, setSettingsSaving] = useState(false);

// ========== INVOICES (FATTURE) STATES ==========
const [invoicesSubTab, setInvoicesSubTab] = useState<'overview' | 'renter' | 'hubber' | 'credit-notes' | 'rules' | 'settings' | 'reports'>('overview');
const [localInvoices, setLocalInvoices] = useState<any[]>([]);
const [localCreditNotes, setLocalCreditNotes] = useState<any[]>([]);
const [invoiceStats, setInvoiceStats] = useState({
  totalInvoices: 0,
  renterInvoices: 0,
  hubberInvoices: 0,
  totalCreditNotes: 0,
  totalInvoiced: 0,
  renterTotal: 0,
  hubberTotal: 0,
  draftCount: 0,
  issuedCount: 0,
  sentCount: 0,
  paidCount: 0,
  cancelledCount: 0,
});
const [localInvoiceSettings, setLocallocalInvoiceSettings] = useState<any>({
  company_name: 'RentHubber SRL',
  vat_number: '',
  fiscal_code: '',
  email: '',
  address: '',
  city: '',
  zip_code: '',
  country: 'IT',
  renter_series_prefix: 'R',
  hubber_series_prefix: 'H',
  credit_note_prefix: 'NC',
  current_year: new Date().getFullYear(),
  renter_next_number: 1,
  hubber_next_number: 1,
  credit_note_next_number: 1,
  default_vat_rate: 22,
  iban: '',
  bank_name: '',
  bic_swift: '',
  regime_fiscale: 'RF01',
  pec_email: '',
});
// === FILTRI E PAGINAZIONE FATTURE ===
const [invoiceFilters, setInvoiceFilters] = useState({
  month: new Date().getMonth() + 1, // 1-12
  year: new Date().getFullYear(),
  showAll: true // true = mostra tutte, false = filtra per mese/anno
});
const [invoicePage, setInvoicePage] = useState(1);
const INVOICES_PER_PAGE = 20;
const [invoiceRules, setInvoiceRules] = useState<any[]>([
  {
    id: 'rule_renter_on_payment',
    rule_type: 'renter_on_payment',
    rule_name: 'Fattura Renter su Pagamento',
    description: 'Genera automaticamente fattura al renter quando effettua il pagamento',
    enabled: false,
    series_prefix: 'R',
  },
  {
    id: 'rule_renter_on_checkout',
    rule_type: 'renter_on_checkout',
    rule_name: 'Fattura Renter su Checkout',
    description: 'Genera automaticamente fattura al renter al termine del noleggio',
    enabled: false,
    series_prefix: 'R',
  },
  {
    id: 'rule_hubber_on_checkout',
    rule_type: 'hubber_on_checkout',
    rule_name: 'Fattura Hubber su Checkout',
    description: 'Genera automaticamente fattura all\'hubber al termine del noleggio',
    enabled: false,
    series_prefix: 'H',
  },
  {
    id: 'rule_hubber_on_payout',
    rule_type: 'hubber_on_payout',
    rule_name: 'Fattura Hubber su Payout',
    description: 'Genera automaticamente fattura all\'hubber quando richiede un payout',
    enabled: false,
    series_prefix: 'H',
  },
  {
    id: 'rule_hubber_monthly',
    rule_type: 'hubber_monthly',
    rule_name: 'Fattura Hubber Mensile',
    description: 'Genera automaticamente fattura riepilogativa mensile per ogni hubber',
    enabled: false,
    series_prefix: 'H',
  },
]);
const [invoicesSearch, setInvoicesSearch] = useState('');
const [invoicesStatusFilter, setInvoicesStatusFilter] = useState<string>('all');
const [invoicesDateFrom, setInvoicesDateFrom] = useState('');
const [invoicesDateTo, setInvoicesDateTo] = useState('');
const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
const [showInvoiceModal, setShowInvoiceModal] = useState(false);
const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
const [invoiceActionLoading, setInvoiceActionLoading] = useState(false);
const [localInvoiceSettingsSaving, setlocalInvoiceSettingsSaving] = useState(false);

// ========== WALLET ADMIN STATES ==========
const [selectedWalletUser, setSelectedWalletUser] = useState<any>(null);
const [showWalletModal, setShowWalletModal] = useState(false);
const [walletModalMode, setWalletModalMode] = useState<'credit' | 'debit'>('credit');
const [walletType, setWalletType] = useState<'hubber' | 'renter'>('hubber'); // ✨ NUOVO
const [walletAmount, setWalletAmount] = useState('');
const [walletReason, setWalletReason] = useState('');
const [walletNote, setWalletNote] = useState('');
const [walletSaving, setWalletSaving] = useState(false);


// ✅ Carica recensioni per admin
useEffect(() => {
  if (activeTab === 'reviews') {
    const loadReviews = async () => {
      try {
        const data = await api.reviews.getAll();
        setLocalReviews(data || []);
      } catch (error) {
        console.error('Errore caricamento recensioni:', error);
      }
    };
    loadReviews();
  }
}, [activeTab]);

// ✅ Carica controversie per admin
useEffect(() => {
  if (activeTab === 'disputes') {
    const loadDisputes = async () => {
      try {
        const { data, error } = await (await import('../lib/supabase')).supabase
          .from('disputes')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          setLocalDisputes(data);
        }
      } catch (error) {
        console.error('Errore caricamento dispute:', error);
      }
    };
    loadDisputes();
  }
}, [activeTab]);

  // Sync utenti da Supabase se necessario
  useEffect(() => {
    console.log('DEBUG: useEffect syncUsers AVVIATO');
    const syncUsers = async () => {
      try {
        console.log('DEBUG: syncUsers chiamato, allUsers.length:', allUsers?.length);
        if (allUsers && allUsers.length > 0) {
          setLocalUsers(allUsers);
          console.log('👑 ADMIN DASHBOARD – uso utenti passati dal parent:', allUsers);
          return;
        }

        console.log('👑 ADMIN DASHBOARD – nessun utente nel prop, carico da api.admin.getAllUsers()...');
        const usersFromApi = await api.admin.getAllUsers();
        console.log('👑 ADMIN DASHBOARD – utenti caricati da api.admin.getAllUsers():', usersFromApi);
        setLocalUsers(usersFromApi || []);
      } catch (error) {
        console.error('Errore caricando utenti in AdminDashboard:', error);
      }
    };

    syncUsers();
  }, [allUsers]);

// Carica financeSettings da localStorage
useEffect(() => {
  const saved = localStorage.getItem('financeSettings');
  if (saved) {
    try {
      setFinanceSettings(JSON.parse(saved));
    } catch (e) {
      console.warn('Errore parsing financeSettings:', e);
    }
  }
}, []);

 // Sync bookings
  useEffect(() => {
    const syncBookings = async () => {
      try {
        // ✅ Carica fees da Supabase SEMPRE (prima di tutto)
        const feesFromApi = await api.admin.getFees();
        console.log('👑 ADMIN DASHBOARD – fees caricate:', feesFromApi);
        if (feesFromApi) {
          console.log('🔄 Applico fees allo state:', feesFromApi.renter_percentage);
          setRenterFee(feesFromApi.renter_percentage ?? 10);
          setHubberFee(feesFromApi.hubber_percentage ?? 10);
          setSuperHubberFee(feesFromApi.super_hubber_percentage ?? 5);
          setFixedFee(feesFromApi.fixed_fee_eur ?? 2);
        }

        if (bookings && bookings.length > 0) {
          setLocalBookings(bookings);
        }
        // Fallback: carica tutte le prenotazioni da Supabase
        const bookingsFromApi = await api.admin.getAllBookings();
        console.log('👑 ADMIN DASHBOARD – prenotazioni caricate:', bookingsFromApi);
        setLocalBookings(bookingsFromApi || []);

        // Carica tutti i payments per la sezione Transazioni
        const paymentsFromApi = await api.admin.getAllPayments();
        console.log('👑 ADMIN DASHBOARD – payments caricati:', paymentsFromApi);
        setLocalPayments(paymentsFromApi || []);

        // Carica wallets e transazioni wallet
        const walletsFromApi = await api.admin.getAllWallets();
        console.log('👑 ADMIN DASHBOARD – wallets caricati:', walletsFromApi);
        setLocalWallets(walletsFromApi || []);

        const walletTxFromApi = await api.admin.getAllWalletTransactions();
        console.log('👑 ADMIN DASHBOARD – wallet transactions caricate:', walletTxFromApi);
        setLocalWalletTransactions(walletTxFromApi || []);

        // Carica payout requests
        const payoutsFromApi = await api.admin.getAllPayouts();
        console.log('👑 ADMIN DASHBOARD – payouts caricati:', payoutsFromApi);
        setLocalPayouts(payoutsFromApi || []);

        // Carica refunds (rimborsi)
        const refundsFromApi = await api.admin.getAllRefunds();
        console.log('👑 ADMIN DASHBOARD – refunds caricati:', refundsFromApi);
        setLocalRefunds(refundsFromApi || []);

        // Carica stats rimborsi
        const refundStatsFromApi = await api.admin.getRefundStats();
        setRefundStats(refundStatsFromApi);

// ========== CARICA FATTURE ==========
        try {
          const invoicesFromApi = await api.admin.getAllInvoices();
          console.log('👑 ADMIN DASHBOARD – fatture caricate:', invoicesFromApi);
          setLocalInvoices(invoicesFromApi || []);

          const creditNotesFromApi = await api.admin.getAllCreditNotes();
          console.log('👑 ADMIN DASHBOARD – note credito caricate:', creditNotesFromApi);
          setLocalCreditNotes(creditNotesFromApi || []);

          const invoiceStatsFromApi = await api.admin.getInvoiceStats();
          if (invoiceStatsFromApi) {
            setInvoiceStats(invoiceStatsFromApi);
          }

          const localInvoiceSettingsFromApi = await api.admin.getLocalInvoiceSettings();
          if (localInvoiceSettingsFromApi) {
            setLocallocalInvoiceSettings(localInvoiceSettingsFromApi);
          }

         const invoiceRulesFromApi = await api.admin.getInvoiceRules();
          console.log('👑 ADMIN DASHBOARD – regole fatture caricate:', invoiceRulesFromApi);
          if (invoiceRulesFromApi && invoiceRulesFromApi.length > 0) {
            setInvoiceRules(invoiceRulesFromApi);
          } else {
            console.log('⚠️ Nessuna regola dal DB, uso i default');
          }
        } catch (invoiceError) {
          console.warn('⚠️ Errore caricamento fatture (tabelle potrebbero non esistere):', invoiceError);
        }

      } catch (error) {
        console.error('Errore caricando prenotazioni in AdminDashboard:', error);
      }
    };
    syncBookings();
  }, [bookings]);

  // FEES State
  const [renterFee, setRenterFee] = useState(systemConfig.fees.renterPercentage || 10);
  const [hubberFee, setHubberFee] = useState(systemConfig.fees.hubberPercentage || 10);
  const [superHubberFee, setSuperHubberFee] = useState(systemConfig.fees.superHubberPercentage || 5);
  const [fixedFee, setFixedFee] = useState(systemConfig.fees.fixedFeeEur);

  // SUPERHUBBER CONFIG State
  const [shConfig, setShConfig] = useState(systemConfig.superHubber || {
    minRating: 4.7,
    minResponseRate: 90,
    maxCancellationRate: 1,
    minHostingDays: 90,
    requiredCriteriaCount: 3
  });

  // COMPLETENESS State
  const [completenessThresh, setCompletenessThresh] = useState(systemConfig.completenessThreshold);

  // CMS State
  const [editingPage, setEditingPage] = useState<PageContent | null>(null);
  const [brandingForm, setBrandingForm] = useState(systemConfig.cms.branding);

  // Listings State
  const [localListings, setLocalListings] = useState<Listing[]>(allListings || []);

  useEffect(() => {
    setLocalListings(allListings || []);
    console.log('👑 ADMIN DASHBOARD – sync da allListings:', allListings);
  }, [allListings]);

  // Invoice Generation State (legacy form per modale generazione singola)
  const [invoiceForm, setInvoiceForm] = useState({
    hubberId: '',
    month: '',
    year: new Date().getFullYear().toString(),
  });
  // User Management States
 const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
const [userSearch, setUserSearch] = useState('');
const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'renter' | 'hubber' | 'admin'>('all');
const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
const [userDocumentFilter, setUserDocumentFilter] = useState<'all' | 'to_verify' | 'verified' | 'none'>('all');
  
  // NEW: Stati per gestione avanzata utenti
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [isUserSaving, setIsUserSaving] = useState(false);
  const [userSaveError, setUserSaveError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // NEW: Form per nuovo utente
  const [newUserForm, setNewUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'renter' as 'renter' | 'hubber' | 'admin',
    isSuperHubber: false,
    customFeePercentage: '',
  });
  
  // NEW: Form per modifica utente (editable fields)
  const [editUserForm, setEditUserForm] = useState<{
    name: string;
    email: string;
    role: string;
    isSuperHubber: boolean;
    customFeePercentage: string;
    phoneNumber: string;
  } | null>(null);
  
  // Initialize edit form when user is selected
  useEffect(() => {
    if (selectedUserForEdit) {
      setEditUserForm({
        name: selectedUserForEdit.name || '',
        email: selectedUserForEdit.email || '',
        role: selectedUserForEdit.role || 'renter',
        isSuperHubber: selectedUserForEdit.isSuperHubber || false,
        customFeePercentage: selectedUserForEdit.customFeePercentage?.toString() || '',
        phoneNumber: selectedUserForEdit.phoneNumber || '',
      });
      setUserSaveError(null);
    } else {
      setEditUserForm(null);
    }
  }, [selectedUserForEdit]);

  // ========== LISTING MANAGEMENT STATES ==========
  const [listingSearch, setListingSearch] = useState('');
  const [listingStatusFilter, setListingStatusFilter] = useState<'all' | 'published' | 'draft' | 'suspended' | 'hidden'>('all');
  const [listingCategoryFilter, setListingCategoryFilter] = useState<'all' | 'oggetto' | 'spazio'>('all');
  const [selectedListingForEdit, setSelectedListingForEdit] = useState<Listing | null>(null);
  const [showCreateListingModal, setShowCreateListingModal] = useState(false);
  const [isListingSaving, setIsListingSaving] = useState(false);
  const [listingSaveError, setListingSaveError] = useState<string | null>(null);
  const [showListingDeleteConfirm, setShowListingDeleteConfirm] = useState(false);
  const [adminActionNote, setAdminActionNote] = useState('');
  
  // Form per modifica annuncio
  const [editListingForm, setEditListingForm] = useState<{
    title: string;
    description: string;
    category: 'oggetto' | 'spazio';
    subCategory: string;
    price: number;
    priceUnit: 'ora' | 'giorno' | 'settimana' | 'mese';
    deposit: number;
    location: string;
    status: string;
    cancellationPolicy: 'flexible' | 'moderate' | 'strict';
    features: string[];
    rules: string[];
    minDuration: number;
    maxDuration: number;
  } | null>(null);

  // Form per nuovo annuncio
  const [newListingForm, setNewListingForm] = useState({
    title: '',
    description: '',
    category: 'oggetto' as 'oggetto' | 'spazio',
    subCategory: '',
    price: 0,
    priceUnit: 'giorno' as 'ora' | 'giorno' | 'settimana' | 'mese',
    deposit: 0,
    location: '',
    hostId: '',
    cancellationPolicy: 'flexible' as 'flexible' | 'moderate' | 'strict',
  });

  // Initialize edit form when listing is selected
  useEffect(() => {
    if (selectedListingForEdit) {
      setEditListingForm({
        title: selectedListingForEdit.title || '',
        description: selectedListingForEdit.description || '',
        category: selectedListingForEdit.category || 'oggetto',
        subCategory: selectedListingForEdit.subCategory || '',
        price: selectedListingForEdit.price || 0,
        priceUnit: selectedListingForEdit.priceUnit || 'giorno',
        deposit: selectedListingForEdit.deposit || 0,
        location: selectedListingForEdit.location || '',
        status: selectedListingForEdit.status || 'published',
        cancellationPolicy: selectedListingForEdit.cancellationPolicy || 'flexible',
        features: selectedListingForEdit.features || [],
        rules: selectedListingForEdit.rules || [],
        minDuration: selectedListingForEdit.minDuration || 1,
        maxDuration: selectedListingForEdit.maxDuration || 30,
      });
      setListingSaveError(null);
      setAdminActionNote('');
    } else {
      setEditListingForm(null);
    }
  }, [selectedListingForEdit]);
  
  // ========== MESSAGES MANAGEMENT STATES ==========
  const [allConversations, setAllConversations] = useState<any[]>([]);
  const [conversationStats, setConversationStats] = useState({ total: 0, open: 0, closed: 0, flagged: 0, priority: 0, resolved: 0 });
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [msgSearch, setMsgSearch] = useState('');
  const [msgStatusFilter, setMsgStatusFilter] = useState<'all' | 'open' | 'closed' | 'flagged' | 'priority' | 'resolved'>('all');
  const [msgTypeFilter, setMsgTypeFilter] = useState<'all' | 'with_booking' | 'without_booking' | 'support'>('all');
  const [adminReplyText, setAdminReplyText] = useState('');
  const [isSendingAdminReply, setIsSendingAdminReply] = useState(false);

  // Carica conversazioni all'avvio e quando cambia tab
  useEffect(() => {
    if (activeTab === 'messages') {
      loadAllConversations();
    }
  }, [activeTab]);

  const loadAllConversations = async () => {
    setMessagesLoading(true);
    try {
      const [convs, stats] = await Promise.all([
        api.messages.getAllConversations(),
        api.messages.getConversationStats(),
      ]);
      setAllConversations(convs);
      setConversationStats(stats);
    } catch (e) {
      console.error('Errore caricamento conversazioni:', e);
    } finally {
      setMessagesLoading(false);
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    try {
      const msgs = await api.messages.getMessagesForConversation(conversationId);
      setConversationMessages(msgs);
    } catch (e) {
      console.error('Errore caricamento messaggi:', e);
    }
  };

  const handleSelectConversation = async (conv: any) => {
    setSelectedConversation(conv);
    await loadConversationMessages(conv.id);
  };

  const handleSendAdminReply = async () => {
    if (!adminReplyText.trim() || !selectedConversation) return;
    
    setIsSendingAdminReply(true);
    try {
      // Determina a chi inviare (se renter o hubber è l'ultimo che ha scritto, rispondi a lui)
      const lastMsg = conversationMessages[conversationMessages.length - 1];
      const toUserId = lastMsg?.fromUserId === selectedConversation.renterId 
        ? selectedConversation.renterId 
        : selectedConversation.hubberId;

      await api.messages.sendAdminMessage({
        conversationId: selectedConversation.id,
        adminId: currentUser?.id || '', // Usa ID admin loggato
        toUserId,
        text: adminReplyText,
      });

      setAdminReplyText('');
      await loadConversationMessages(selectedConversation.id);
      await loadAllConversations(); // Aggiorna preview
    } catch (e) {
      console.error('Errore invio risposta admin:', e);
    } finally {
      setIsSendingAdminReply(false);
    }
  };

  const handleUpdateConversationStatus = async (convId: string, newStatus: string) => {
    try {
      await api.messages.updateConversationStatus(convId, newStatus, currentUser?.id || '');
      await loadAllConversations();
      if (selectedConversation?.id === convId) {
        setSelectedConversation({ ...selectedConversation, status: newStatus });
      }
    } catch (e) {
      console.error('Errore aggiornamento stato:', e);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo messaggio?')) return;
    try {
      await api.messages.deleteMessage(msgId, currentUser?.id || '');
      await loadConversationMessages(selectedConversation.id);
    } catch (e) {
      console.error('Errore eliminazione messaggio:', e);
    }
  };

  // ========== SUPPORT TICKET STATES ==========
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [supportStats, setSupportStats] = useState({ total: 0, new: 0, assigned: 0, inProgress: 0, waitingUser: 0, resolved: 0, closed: 0, unread: 0, urgent: 0 });
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed'>('all');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');
  const [supportReplyText, setSupportReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSendingSupportReply, setIsSendingSupportReply] = useState(false);
  const [supportOperators, setSupportOperators] = useState<any[]>([]);
  const [supportSubTab, setSupportSubTab] = useState<'active' | 'archive'>('active');

  // Carica ticket quando si apre la tab supporto
  useEffect(() => {
    if (activeTab === 'support') {
      loadAllTickets();
    }
  }, [activeTab]);

  const loadAllTickets = async () => {
    console.log("🎫 [DASHBOARD] Inizio caricamento ticket...");
    setTicketsLoading(true);
    try {
      const [tickets, stats, operators] = await Promise.all([
        api.support.getAllTickets(),
        api.support.getTicketStats(),
        api.support.getSupportOperators(),
      ]);
      console.log("🎫 [DASHBOARD] Ticket ricevuti:", tickets);
      console.log("🎫 [DASHBOARD] Stats:", stats);
      console.log("🎫 [DASHBOARD] Operatori:", operators);
      setAllTickets(tickets);
      setSupportStats(stats);
      setSupportOperators(operators);
    } catch (e) {
      console.error('❌ [DASHBOARD] Errore caricamento ticket:', e);
    } finally {
      setTicketsLoading(false);
    }
  };

  const loadTicketMessages = async (ticketId: string) => {
    try {
      const data = await api.support.getTicketWithMessages(ticketId);
      if (data) {
        setTicketMessages(data.messages);
      }
    } catch (e) {
      console.error('Errore caricamento messaggi ticket:', e);
    }
  };

  const handleSelectTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
    await loadTicketMessages(ticket.id);
    // Segna come letto
    await api.support.markAsReadBySupport(ticket.id);
    // Aggiorna stats
    const stats = await api.support.getTicketStats();
    setSupportStats(stats);
  };

  const handleSendSupportReply = async () => {
    if (!supportReplyText.trim() || !selectedTicket) return;
    
    setIsSendingSupportReply(true);
    try {
      await api.support.sendSupportMessage({
        ticketId: selectedTicket.id,
        senderId: currentUser?.id || '', // Usa ID utente loggato
        senderType: currentUser?.role === 'admin' ? 'admin' : 'support',
        text: supportReplyText,
        isInternal: isInternalNote,
      });

      setSupportReplyText('');
      setIsInternalNote(false);
      await loadTicketMessages(selectedTicket.id);
      await loadAllTickets();
    } catch (e) {
      console.error('Errore invio risposta:', e);
    } finally {
      setIsSendingSupportReply(false);
    }
  };

 const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
  try {
    await api.support.updateTicketStatus(ticketId, newStatus, currentUser?.id || '');
    await loadAllTickets();
    
    // ✨ RICARICA DISPUTE quando il ticket cambia stato
    if (newStatus === 'resolved' || newStatus === 'closed') {
      const { data: disputes } = await (await import('../lib/supabase')).supabase
        .from('disputes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (disputes) {
        setLocalDisputes(disputes);
      }
    }
    
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status: newStatus });
    }
  } catch (e) {
    console.error('Errore aggiornamento stato ticket:', e);
  }
};

  const handleUpdateTicketPriority = async (ticketId: string, newPriority: string) => {
    try {
      await api.support.updateTicketPriority(ticketId, newPriority, currentUser?.id || '');
      await loadAllTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, priority: newPriority });
      }
    } catch (e) {
      console.error('Errore aggiornamento priorità:', e);
    }
  };

  const handleAssignTicket = async (ticketId: string, operatorId: string) => {
    try {
      await api.support.assignTicket(ticketId, operatorId, currentUser?.id || '');
      await loadAllTickets();
      if (selectedTicket?.id === ticketId) {
        const operator = supportOperators.find(o => o.id === operatorId);
        setSelectedTicket({ ...selectedTicket, assigned_to: operatorId, assigned: operator });
      }
    } catch (e) {
      console.error('Errore assegnazione ticket:', e);
    }
  };

// ========== FILTRI E PAGINAZIONE FATTURE ==========
  const MONTHS = [
    { value: 1, label: 'Gennaio' }, { value: 2, label: 'Febbraio' }, { value: 3, label: 'Marzo' },
    { value: 4, label: 'Aprile' }, { value: 5, label: 'Maggio' }, { value: 6, label: 'Giugno' },
    { value: 7, label: 'Luglio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Settembre' },
    { value: 10, label: 'Ottobre' }, { value: 11, label: 'Novembre' }, { value: 12, label: 'Dicembre' }
  ];
  
  const YEARS = Array.from({ length: new Date().getFullYear() - 2024 + 2 }, (_, i) => 2024 + i);

  const filteredInvoices = useMemo(() => {
    if (invoiceFilters.showAll) return localInvoices;
    return localInvoices.filter(inv => {
      const invDate = new Date(inv.created_at || inv.issue_date);
      return invDate.getMonth() + 1 === invoiceFilters.month && invDate.getFullYear() === invoiceFilters.year;
    });
  }, [localInvoices, invoiceFilters]);

  const totalInvoicePages = Math.ceil(filteredInvoices.length / INVOICES_PER_PAGE);

  const paginatedInvoices = useMemo(() => {
    const start = (invoicePage - 1) * INVOICES_PER_PAGE;
    return filteredInvoices.slice(start, start + INVOICES_PER_PAGE);
  }, [filteredInvoices, invoicePage]);

  useEffect(() => {
    setInvoicePage(1);
  }, [invoiceFilters]);

  const exportInvoicesCSV = () => {
    const headers = ["Numero", "Tipo", "Cliente", "Data", "Importo", "Stato"];
    const rows = filteredInvoices.map(inv => [
      inv.invoice_number,
      inv.invoice_type === 'renter' ? 'Renter' : 'Hubber',
      inv.customer_name || 'N/A',
      new Date(inv.issue_date).toLocaleDateString('it-IT'),
      `€${(inv.total_amount || 0).toFixed(2)}`,
      inv.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `fatture_${invoiceFilters.month}_${invoiceFilters.year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ========== CALCOLO KPI REALI ==========
  
  // Utenti totali
  const totalUsers = localUsers.length;
  
  // Annunci attivi (status = published)
  const activeListings = localListings.filter(l => l.status === 'published').length;
  
  // Prenotazioni totali e per stato
  const totalBookings = localBookings.length;
  const pendingBookings = localBookings.filter(b => b.status === 'pending').length;
  const completedBookings = localBookings.filter(b => b.status === 'completed').length;
  const confirmedBookings = localBookings.filter(b => b.status === 'confirmed' || b.status === 'accepted').length;
  
  // Controversie aperte
  const openDisputes = disputes.filter(d => d.status === 'open').length;
  
  // Fatturato totale (somma delle commissioni dalle prenotazioni completate)
  const totalRevenue = localBookings
    .filter(b => b.status === 'completed')
    .reduce((acc, b) => acc + (b.commission || 0), 0);

  // Mock data for charts (TODO: usare dati reali)
  const chartData = [
    { name: 'Lun', users: 12, revenue: 150 },
    { name: 'Mar', users: 19, revenue: 230 },
    { name: 'Mer', users: 3, revenue: 45 },
    { name: 'Gio', users: 25, revenue: 320 },
    { name: 'Ven', users: 40, revenue: 500 },
    { name: 'Sab', users: 55, revenue: 650 },
    { name: 'Dom', users: 48, revenue: 580 },
  ];

  const handleSaveConfig = async () => {
    try {
      // Salva fees su Supabase
      await api.admin.updateFees({
        renterPercentage: parseFloat(renterFee.toString()),
        hubberPercentage: parseFloat(hubberFee.toString()),
        superHubberPercentage: parseFloat(superHubberFee.toString()),
        fixedFeeEur: parseFloat(fixedFee.toString())
      });
      console.log('✅ Fees salvate su Supabase');

      // Aggiorna anche lo state locale per compatibilità
      const newConfig: SystemConfig = {
        ...systemConfig,
        fees: {
          ...systemConfig.fees,
          renterPercentage: parseFloat(renterFee.toString()),
          hubberPercentage: parseFloat(hubberFee.toString()),
          superHubberPercentage: parseFloat(superHubberFee.toString()),
          fixedFeeEur: parseFloat(fixedFee.toString())
        },
        completenessThreshold: parseFloat(completenessThresh.toString()),
        superHubber: shConfig
      };
      onUpdateConfig(newConfig);
      
      alert("✅ Configurazione salvata su database! Le modifiche sono ora attive su tutta la piattaforma.");
    } catch (error) {
      console.error('❌ Errore salvataggio configurazione:', error);
      alert("❌ Errore durante il salvataggio. Riprova.");
    }
  };

  const handleSaveBranding = () => {
    const newConfig: SystemConfig = {
      ...systemConfig,
      cms: {
        ...systemConfig.cms,
        branding: brandingForm
      }
    };
    onUpdateConfig(newConfig);
    alert("Branding aggiornato.");
  };

  const handleSavePage = () => {
    if (!editingPage) return;
    const updatedPages = systemConfig.cms.pages.map(p => p.id === editingPage.id ? editingPage : p);
    const newConfig: SystemConfig = {
      ...systemConfig,
      cms: {
        ...systemConfig.cms,
        pages: updatedPages
      }
    };
    onUpdateConfig(newConfig);
    setEditingPage(null);
    alert("Pagina aggiornata.");
  };

  // ========== LISTING MANAGEMENT ACTIONS ==========

  // Sospendi/Attiva annuncio (con salvataggio su Supabase)
  const handleListingStatusChange = async (listingId: string, newStatus: 'published' | 'suspended' | 'hidden' | 'draft') => {
    setIsListingSaving(true);
    try {
      await api.listings.updateStatus(listingId, newStatus);
      
      // Aggiorna stato locale
      setLocalListings(prev => prev.map(l => 
        l.id === listingId ? { ...l, status: newStatus } : l
      ));
      
      // Se c'è una nota, invia notifica all'hubber
      if (adminActionNote.trim() && selectedListingForEdit) {
        await sendAdminNotificationToHubber(
          selectedListingForEdit.hostId,
          selectedListingForEdit.title,
          newStatus === 'suspended' ? 'sospeso' : newStatus === 'published' ? 'riattivato' : newStatus,
          adminActionNote
        );
      }
      
      alert(`✅ Annuncio ${newStatus === 'suspended' ? 'sospeso' : newStatus === 'published' ? 'pubblicato' : newStatus}!`);
      setAdminActionNote('');
    } catch (error: any) {
      console.error('Errore cambio stato annuncio:', error);
      setListingSaveError(error.message || 'Errore durante il cambio stato');
    } finally {
      setIsListingSaving(false);
    }
  };

  // Funzione legacy per compatibilità
  const handleListingAction = (id: string, action: 'suspend' | 'activate') => {
    handleListingStatusChange(id, action === 'suspend' ? 'suspended' : 'published');
  };

  // Salva modifiche annuncio su Supabase
  const handleSaveListing = async () => {
    if (!selectedListingForEdit || !editListingForm) return;
    
    setIsListingSaving(true);
    setListingSaveError(null);
    
    try {
      const updatedListing: Listing = {
        ...selectedListingForEdit,
        title: editListingForm.title,
        description: editListingForm.description,
        category: editListingForm.category,
        subCategory: editListingForm.subCategory,
        price: editListingForm.price,
        priceUnit: editListingForm.priceUnit,
        deposit: editListingForm.deposit,
        location: editListingForm.location,
        status: editListingForm.status as any,
        cancellationPolicy: editListingForm.cancellationPolicy,
        features: editListingForm.features,
        rules: editListingForm.rules,
        minDuration: editListingForm.minDuration,
        maxDuration: editListingForm.maxDuration,
      };
      
      await api.listings.update(updatedListing);
      
      // Aggiorna stato locale
      setLocalListings(prev => prev.map(l => 
        l.id === selectedListingForEdit.id ? updatedListing : l
      ));
      
      // Notifica hubber se c'è una nota
      if (adminActionNote.trim()) {
        await sendAdminNotificationToHubber(
          selectedListingForEdit.hostId,
          selectedListingForEdit.title,
          'modificato dall\'amministrazione',
          adminActionNote
        );
      }
      
      alert('✅ Annuncio aggiornato con successo!');
      setSelectedListingForEdit(null);
      setAdminActionNote('');
    } catch (error: any) {
      console.error('Errore salvataggio annuncio:', error);
      setListingSaveError(error.message || 'Errore durante il salvataggio');
    } finally {
      setIsListingSaving(false);
    }
  };

  // Elimina annuncio
  const handleDeleteListing = async () => {
    if (!selectedListingForEdit) return;
    
    setIsListingSaving(true);
    try {
      await api.listings.delete(selectedListingForEdit.id);
      
      // Notifica hubber
      if (adminActionNote.trim()) {
        await sendAdminNotificationToHubber(
          selectedListingForEdit.hostId,
          selectedListingForEdit.title,
          'eliminato',
          adminActionNote
        );
      }
      
      // Rimuovi da stato locale
      setLocalListings(prev => prev.filter(l => l.id !== selectedListingForEdit.id));
      
      setShowListingDeleteConfirm(false);
      setSelectedListingForEdit(null);
      alert('🗑️ Annuncio eliminato con successo');
    } catch (error: any) {
      console.error('Errore eliminazione annuncio:', error);
      alert('Errore: ' + (error.message || 'Impossibile eliminare l\'annuncio'));
    } finally {
      setIsListingSaving(false);
    }
  };

  // Crea nuovo annuncio (admin)
  const handleCreateListing = async () => {
    if (!newListingForm.title || !newListingForm.hostId) {
      setListingSaveError('Titolo e Hubber sono obbligatori');
      return;
    }
    
    setIsListingSaving(true);
    setListingSaveError(null);
    
    try {
      const newListing: Listing = {
        id: '', // Sarà generato da Supabase
        hostId: newListingForm.hostId,
        title: newListingForm.title,
        description: newListingForm.description,
        category: newListingForm.category,
        subCategory: newListingForm.subCategory,
        price: newListingForm.price,
        priceUnit: newListingForm.priceUnit,
        deposit: newListingForm.deposit,
        location: newListingForm.location,
        cancellationPolicy: newListingForm.cancellationPolicy,
        status: 'published',
        images: [],
        features: [],
        rules: [],
        reviews: [],
        rating: 0,
        reviewCount: 0,
        coordinates: { lat: 0, lng: 0 },
      };
      
      const created = await api.listings.create(newListing);
      
      // Aggiungi a stato locale
      setLocalListings(prev => [created, ...prev]);
      
      // Reset form
      setNewListingForm({
        title: '',
        description: '',
        category: 'oggetto',
        subCategory: '',
        price: 0,
        priceUnit: 'giorno',
        deposit: 0,
        location: '',
        hostId: '',
        cancellationPolicy: 'flexible',
      });
      
      setShowCreateListingModal(false);
      alert('✅ Annuncio creato con successo!');
    } catch (error: any) {
      console.error('Errore creazione annuncio:', error);
      setListingSaveError(error.message || 'Errore durante la creazione');
    } finally {
      setIsListingSaving(false);
    }
  };

  // Invia notifica/messaggio all'hubber tramite sistema messaggi (come Supporto)
  const sendAdminNotificationToHubber = async (
    hubberId: string, 
    listingTitle: string, 
    action: string, 
    note: string
  ) => {
    try {
      const SUPPORT_ID = 'support-renthubber';
      const timestamp = new Date().toISOString();
      const conversationId = `support-${hubberId}`;
      
      // Crea/aggiorna conversazione con il supporto
      const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
      let existingConvo = conversations.find((c: any) => 
        c.id === conversationId || 
        (c.supportUserId === SUPPORT_ID && (c.renterId === hubberId || c.hubberId === hubberId))
      );
      
      if (!existingConvo) {
        // Crea nuova conversazione di supporto
        existingConvo = {
          id: conversationId,
          renterId: hubberId,
          hubberId: SUPPORT_ID,
          supportUserId: SUPPORT_ID,
          isSupport: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        conversations.push(existingConvo);
      } else {
        existingConvo.updatedAt = timestamp;
      }
      localStorage.setItem('conversations', JSON.stringify(conversations));
      
      // Aggiungi messaggio alla conversazione
      const messages = JSON.parse(localStorage.getItem('messages') || '[]');
      const fullMessage = `📋 **Notifica Amministrazione**\n\n` +
        `Il tuo annuncio "${listingTitle}" è stato **${action}**.\n\n` +
        `**Messaggio dall'amministrazione:**\n${note}\n\n` +
        `_Se hai domande, rispondi a questo messaggio._`;
      
      messages.push({
        id: `msg-${Date.now()}`,
        conversationId: existingConvo.id,
        senderId: SUPPORT_ID,
        receiverId: hubberId,
        text: fullMessage,
        timestamp: timestamp,
        read: false,
        isSupport: true,
      });
      localStorage.setItem('messages', JSON.stringify(messages));
      
      // Aggiorna anche i contatti chat per mostrare l'ultimo messaggio
      const contacts = JSON.parse(localStorage.getItem('chatContacts') || '[]');
      const existingContact = contacts.find((c: any) => c.id === SUPPORT_ID && c.recipientId === hubberId);
      if (!existingContact) {
        contacts.push({
          id: SUPPORT_ID,
          recipientId: hubberId,
          name: 'Supporto RentHubber',
          avatar: 'https://ui-avatars.com/api/?name=Support&background=FF6B35&color=fff',
          lastMessage: `Notifica: Annuncio "${listingTitle}" ${action}`,
          unreadCount: 1,
          lastMessageTime: timestamp,
          isSupport: true,
        });
      } else {
        existingContact.lastMessage = `Notifica: Annuncio "${listingTitle}" ${action}`;
        existingContact.unreadCount = (existingContact.unreadCount || 0) + 1;
        existingContact.lastMessageTime = timestamp;
      }
      localStorage.setItem('chatContacts', JSON.stringify(contacts));
      
      console.log('📧 Messaggio supporto inviato all\'hubber:', hubberId);
    } catch (e) {
      console.warn('Errore invio messaggio supporto:', e);
    }
  };

  // Export annunci CSV
  const exportListingsCSV = () => {
    const headers = ["ID", "Titolo", "Categoria", "Hubber", "Prezzo", "Stato", "Location", "Rating"];
    const rows = localListings.map(l => [
      l.id, 
      l.title, 
      l.category,
      l.owner?.name || 'N/A',
      `€${l.price}/${l.priceUnit}`,
      l.status,
      l.location,
      l.rating ?? 'N/A'
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.map(v => `"${v}"`).join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `annunci_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    const hubber = localUsers.find(u => u.id === invoiceForm.hubberId);
    if (!hubber) return;

    const hubberBookings = localBookings.filter(req => req.hostId === hubber.id && req.status === 'completed');
    const totalFees = hubberBookings.reduce((acc, curr) => acc + (curr.commission || 0), 0);

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      number: `INV-${invoiceForm.year}-${Math.floor(Math.random() * 1000)}`,
      hubberId: hubber.id,
      hubberName: hubber.name,
      period: `${invoiceForm.month} ${invoiceForm.year}`,
      date: new Date().toLocaleDateString('it-IT'),
      amount: totalFees > 0 ? totalFees : 25.00, 
      status: 'paid',
      downloadUrl: '#'
    };

    setLocalInvoices(prev => [...prev, newInvoice]);
    setShowInvoiceModal(false);
    alert("Fattura generata con successo!");
  };

  // --- USER MANAGEMENT ACTIONS (SUPABASE INTEGRATION) ---

  // Salva modifiche utente su Supabase
  const handleSaveUser = async () => {
    if (!selectedUserForEdit || !editUserForm) return;
    
    setIsUserSaving(true);
    setUserSaveError(null);
    
    try {
      const updatedData: Partial<User> = {
        ...selectedUserForEdit,
        name: editUserForm.name,
        email: editUserForm.email,
        role: editUserForm.role as 'renter' | 'hubber' | 'admin',
        roles: editUserForm.role === 'admin' 
          ? ['admin', 'hubber', 'renter'] 
          : editUserForm.role === 'hubber' 
            ? ['hubber', 'renter'] 
            : ['renter'],
        isSuperHubber: editUserForm.isSuperHubber,
        customFeePercentage: editUserForm.customFeePercentage 
          ? parseFloat(editUserForm.customFeePercentage) 
          : undefined,
        phoneNumber: editUserForm.phoneNumber,
      };
      
      // Aggiorna verificationStatus
      if (updatedData.emailVerified && updatedData.phoneVerified && updatedData.idDocumentVerified) {
        updatedData.verificationStatus = 'verified';
      } else if (updatedData.emailVerified || updatedData.phoneVerified || updatedData.idDocumentVerified) {
        updatedData.verificationStatus = 'partially_verified';
      } else {
        updatedData.verificationStatus = 'unverified';
      }
      
      await api.admin.updateUser(selectedUserForEdit.id, updatedData);
      
      // Aggiorna stato locale
      setLocalUsers(prev => prev.map(u => 
        u.id === selectedUserForEdit.id ? { ...u, ...updatedData } as User : u
      ));
      setSelectedUserForEdit({ ...selectedUserForEdit, ...updatedData } as User);
      
      alert('✅ Utente aggiornato con successo!');
    } catch (error) {
      console.error('Errore salvataggio utente:', error);
      setUserSaveError('Errore durante il salvataggio. Riprova.');
    } finally {
      setIsUserSaving(false);
    }
  };

// Salva modifiche utente COMPLETO (nuovo form a tab)
  const handleSaveUserComplete = async (updatedData: any) => {
    if (!selectedUserForEdit) return;
    
    setIsUserSaving(true);
    setUserSaveError(null);
    
    try {
      const dataToSave: any = {
        first_name: updatedData.first_name,
        last_name: updatedData.last_name,
        name: updatedData.name || `${updatedData.first_name} ${updatedData.last_name}`,
        public_name: updatedData.public_name,
        date_of_birth: updatedData.date_of_birth || null,
        bio: updatedData.bio,
        user_type: updatedData.user_type,
        avatar_url: updatedData.avatar_url,
        email: updatedData.email,
        phone_number: updatedData.phone_number,
        address: updatedData.address,
        public_location: updatedData.public_location,
        email_verified: updatedData.email_verified,
        phone_verified: updatedData.phone_verified,
        id_document_verified: updatedData.id_document_verified,
        verification_status: updatedData.verification_status,
        renter_balance: updatedData.renter_balance,
        hubber_balance: updatedData.hubber_balance,
        refund_balance_cents: updatedData.refund_balance_cents,
        referral_balance_cents: updatedData.referral_balance_cents,
        custom_fee_percentage: updatedData.custom_fee_percentage ? parseFloat(updatedData.custom_fee_percentage) : null,
        stripe_account_id: updatedData.stripe_account_id,
        stripe_onboarding_completed: updatedData.stripe_onboarding_completed,
        stripe_charges_enabled: updatedData.stripe_charges_enabled,
        stripe_payouts_enabled: updatedData.stripe_payouts_enabled,
        company_name: updatedData.company_name,
        fiscal_code: updatedData.fiscal_code,
        vat_number: updatedData.vat_number,
        pec: updatedData.pec,
        sdi_code: updatedData.sdi_code,
        billing_address: updatedData.billing_address,
        billing_city: updatedData.billing_city,
        billing_zip: updatedData.billing_zip,
        billing_province: updatedData.billing_province,
        billing_country: updatedData.billing_country,
        role: updatedData.role,
        roles: updatedData.role === 'admin' ? ['admin', 'hubber', 'renter'] : updatedData.role === 'hubber' ? ['hubber', 'renter'] : ['renter'],
        is_super_hubber: updatedData.is_super_hubber,
        is_super_admin: updatedData.is_super_admin,
        referral_code: updatedData.referral_code,
        hubber_since: updatedData.hubber_since || null,
        status: updatedData.status,
      };
      
      if (dataToSave.email_verified && dataToSave.phone_verified && dataToSave.id_document_verified) {
        dataToSave.verification_status = 'verified';
      } else if (dataToSave.email_verified || dataToSave.phone_verified || dataToSave.id_document_verified) {
        dataToSave.verification_status = 'partially_verified';
      } else {
        dataToSave.verification_status = 'unverified';
      }
      
      await api.admin.updateUser(selectedUserForEdit.id, dataToSave);
      
      const updatedUser = { ...selectedUserForEdit, ...dataToSave };
      setLocalUsers(prev => prev.map(u => u.id === selectedUserForEdit.id ? updatedUser : u));
      setSelectedUserForEdit(null);
      
      alert('✅ Utente aggiornato con successo!');
    } catch (error) {
      console.error('Errore salvataggio utente:', error);
      throw new Error('Errore durante il salvataggio. Riprova.');
    } finally {
      setIsUserSaving(false);
    }
  };

  // Sospendi/Attiva utente
  const handleToggleSuspend = async () => {
    if (!selectedUserForEdit) return;
    
    setIsUserSaving(true);
    try {
      const newSuspendedState = !selectedUserForEdit.isSuspended;
      
      await api.admin.updateUser(selectedUserForEdit.id, {
        isSuspended: newSuspendedState,
        status: newSuspendedState ? 'suspended' : 'active',
      });
      
      const updatedUser = {
        ...selectedUserForEdit,
        isSuspended: newSuspendedState,
        status: newSuspendedState ? 'suspended' : 'active',
      };
      
      setLocalUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      setSelectedUserForEdit(updatedUser);
      
      alert(newSuspendedState ? '🚫 Utente sospeso' : '✅ Utente riattivato');
    } catch (error) {
      console.error('Errore toggle sospensione:', error);
      alert('Errore durante l\'operazione. Riprova.');
    } finally {
      setIsUserSaving(false);
    }
  };

  // Elimina utente
  const handleDeleteUser = async () => {
    if (!selectedUserForEdit) return;
    
    setIsUserSaving(true);
    try {
      await api.admin.deleteUser(selectedUserForEdit.id);
      
      setLocalUsers(prev => prev.filter(u => u.id !== selectedUserForEdit.id));
      setSelectedUserForEdit(null);
      setShowDeleteConfirm(false);
      
      alert('🗑️ Utente eliminato con successo');
    } catch (error) {
      console.error('Errore eliminazione utente:', error);
      alert('Errore durante l\'eliminazione. Riprova.');
    } finally {
      setIsUserSaving(false);
    }
  };

  // Crea nuovo utente
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUserForm.email || !newUserForm.password || !newUserForm.firstName) {
      setUserSaveError('Compila tutti i campi obbligatori');
      return;
    }
    
    setIsUserSaving(true);
    setUserSaveError(null);
    
    try {
      const fullName = `${newUserForm.firstName.trim()} ${newUserForm.lastName.trim()}`.trim();
      
      const newUser = await api.admin.createUser({
        email: newUserForm.email,
        password: newUserForm.password,
        name: fullName,
        firstName: newUserForm.firstName.trim(),
        lastName: newUserForm.lastName.trim(),
        role: newUserForm.role,
        roles: newUserForm.role === 'admin' 
          ? ['admin', 'hubber', 'renter'] 
          : newUserForm.role === 'hubber' 
            ? ['hubber', 'renter'] 
            : ['renter'],
        isSuperHubber: newUserForm.isSuperHubber,
        customFeePercentage: newUserForm.customFeePercentage 
          ? parseFloat(newUserForm.customFeePercentage) 
          : undefined,
      });
      
      if (newUser) {
        setLocalUsers(prev => [newUser, ...prev]);
        setShowAddUserModal(false);
        setNewUserForm({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          role: 'renter',
          isSuperHubber: false,
          customFeePercentage: '',
        });
        alert('✅ Utente creato con successo!');
      }
    } catch (error: any) {
      console.error('Errore creazione utente:', error);
      setUserSaveError(error.message || 'Errore durante la creazione. Riprova.');
    } finally {
      setIsUserSaving(false);
    }
  };

  // Reset password
  const handleResetPassword = async () => {
    if (!selectedUserForEdit?.email) return;
    
    try {
      await api.admin.resetUserPassword(selectedUserForEdit.email);
      alert(`📧 Link di reset password inviato a ${selectedUserForEdit.email}`);
    } catch (error) {
      console.error('Errore reset password:', error);
      alert('Errore durante l\'invio del reset password. Riprova.');
    }
  };

  // Toggle SuperHubber
  const handleToggleSuperHubber = async () => {
    if (!selectedUserForEdit || !editUserForm) return;
    
    const newValue = !editUserForm.isSuperHubber;
    setEditUserForm({ ...editUserForm, isSuperHubber: newValue });
  };

  // Elimina dati bancari
  const handleDeleteBankDetails = async () => {
    if (!selectedUserForEdit) return;
    
    setIsUserSaving(true);
    try {
      await api.admin.updateUser(selectedUserForEdit.id, {
        bankDetails: null,
      });
      
      const updatedUser = { ...selectedUserForEdit, bankDetails: undefined };
      setLocalUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      setSelectedUserForEdit(updatedUser);
      
      alert('🗑️ Dati bancari eliminati');
    } catch (error) {
      console.error('Errore eliminazione dati bancari:', error);
      alert('Errore durante l\'eliminazione. Riprova.');
    } finally {
      setIsUserSaving(false);
    }
  };

  const handleUserAction = (action: 'save' | 'suspend' | 'activate' | 'reset_password' | 'delete_bank') => {
    if (!selectedUserForEdit) return;

    switch (action) {
      case 'save':
        handleSaveUser();
        break;
      case 'suspend':
      case 'activate':
        handleToggleSuspend();
        break;
      case 'reset_password':
        handleResetPassword();
        break;
      case 'delete_bank':
        handleDeleteBankDetails();
        break;
    }
  };

  const handleVerificationToggle = (field: 'emailVerified' | 'phoneVerified' | 'idDocumentVerified') => {
    if (!selectedUserForEdit) return;

    const updatedUser: User = { 
      ...selectedUserForEdit, 
      [field]: !selectedUserForEdit[field] 
    };

    if (updatedUser.emailVerified && updatedUser.phoneVerified && updatedUser.idDocumentVerified) {
      updatedUser.verificationStatus = 'verified';
    } else if (updatedUser.emailVerified || updatedUser.phoneVerified || updatedUser.idDocumentVerified) {
      updatedUser.verificationStatus = 'partially_verified';
    } else {
      updatedUser.verificationStatus = 'unverified';
    }

    setSelectedUserForEdit(updatedUser);
    setLocalUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const exportUsersCSV = () => {
    const headers = ["ID", "Name", "Email", "Role", "Status", "Rating", "Joined Date", "Verified"];
    const rows = localUsers.map(u => [
      u.id, 
      u.name, 
      u.email, 
      u.role, 
      u.isSuspended ? 'Suspended' : 'Active', 
      u.rating ?? 'N/A', 
      u.hubberSince || 'N/A',
      u.verificationStatus
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    window.open(encodedUri);
  };

  // --- VIEWS RENDERERS ---

  // ========== PANORAMICA (OVERVIEW) ==========
  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
      {/* KPI CARDS - DATI REALI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Utenti Totali" 
          value={totalUsers} 
          subtext={totalUsers > 0 ? `${localUsers.filter(u => u.role === 'hubber' || u.roles?.includes('hubber')).length} hubber` : undefined}
          icon={Users} 
          color="bg-blue-500" 
        />
        <KpiCard 
          title="Annunci Attivi" 
          value={activeListings} 
          subtext={`${localListings.length} totali`}
          icon={Package} 
          color="bg-orange-500" 
        />
        <KpiCard 
          title="Prenotazioni" 
          value={totalBookings} 
          subtext={pendingBookings > 0 ? `${pendingBookings} in attesa` : completedBookings > 0 ? `${completedBookings} completate` : undefined}
          icon={CalendarCheck} 
          color="bg-green-500" 
        />
        <KpiCard 
          title="Controversie" 
          value={openDisputes} 
          subtext={openDisputes > 0 ? "Aperte" : "Nessuna aperta"}
          icon={AlertTriangle} 
          color={openDisputes > 0 ? "bg-red-500" : "bg-gray-400"} 
        />
      </div>

      {/* SECONDA RIGA KPI - Fatturato e stats aggiuntive */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard 
          title="Fatturato (Commissioni)" 
          value={`€ ${totalRevenue.toFixed(2)}`} 
          subtext={completedBookings > 0 ? `Da ${completedBookings} noleggi completati` : "Nessun noleggio completato"}
          icon={DollarSign} 
          color="bg-emerald-500" 
        />
        <KpiCard 
          title="Prenotazioni Confermate" 
          value={confirmedBookings} 
          subtext="Attive"
          icon={ShoppingBag} 
          color="bg-purple-500" 
        />
        <KpiCard 
          title="Tasso Completamento" 
          value={totalBookings > 0 ? `${Math.round((completedBookings / totalBookings) * 100)}%` : "N/A"} 
          subtext={totalBookings > 0 ? `${completedBookings}/${totalBookings} prenotazioni` : "Nessuna prenotazione"}
          icon={TrendingUp} 
          color="bg-indigo-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">Revenue Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#10B981" fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Attività Recente</h3>
          <div className="space-y-4 overflow-y-auto max-h-80">
            {/* Mostra ultime prenotazioni */}
            {localBookings.slice(0, 5).map((booking, idx) => (
              <div key={booking.id || idx} className="flex items-start text-sm border-b border-gray-50 pb-3 last:border-0">
                <div className={`p-1.5 rounded-full mr-3 mt-0.5 ${
                  booking.status === 'completed' ? 'bg-green-100' : 
                  booking.status === 'pending' ? 'bg-yellow-100' : 'bg-blue-100'
                }`}>
                  <Activity className={`w-3 h-3 ${
                    booking.status === 'completed' ? 'text-green-500' : 
                    booking.status === 'pending' ? 'text-yellow-500' : 'text-blue-500'
                  }`} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    Prenotazione {booking.status === 'completed' ? 'completata' : 
                                  booking.status === 'pending' ? 'in attesa' : 'confermata'}
                  </p>
                  <p className="text-xs text-gray-500">{booking.listingTitle || 'Annuncio'}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    € {booking.totalPrice?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            ))}
            {localBookings.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">Nessuna prenotazione recente</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => {
    const filteredUsers = localUsers.filter(u => {
      const matchesSearch =
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole =
       userRoleFilter === 'all' ||
        u.role === userRoleFilter ||
        (u.roles && u.roles.includes(userRoleFilter));
      const matchesStatus =
        userStatusFilter === 'all' ||
        (userStatusFilter === 'suspended' && u.isSuspended) ||
        (userStatusFilter === 'active' && !u.isSuspended);
      
      const matchesDocument =
        userDocumentFilter === 'all' ||
        (userDocumentFilter === 'to_verify' && 
          ((u.document_front_url || u.document_back_url) && !u.idDocumentVerified)) ||
        (userDocumentFilter === 'verified' && u.idDocumentVerified) ||
        (userDocumentFilter === 'none' && !u.document_front_url && !u.document_back_url);
      
      return matchesSearch && matchesRole && matchesStatus && matchesDocument;
    });

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in">
        <div className="p-6 border-b border-gray-100 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-900 text-lg">Gestione Utenti</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Users className="w-4 h-4 mr-2" /> Aggiungi Utente
              </button>
              <button
                onClick={exportUsersCSV}
                className="px-4 py-2 bg-brand text-white text-sm font-bold rounded-lg hover:bg-brand-dark transition-colors flex items-center"
              >
                <Download className="w-4 h-4 mr-2" /> Esporta CSV
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca per nome o email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand outline-none"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand outline-none bg-white"
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value as any)}
            >
              <option value="all">Tutti i Ruoli</option>
              <option value="renter">Renter</option>
              <option value="hubber">Hubber</option>
              <option value="admin">Admin</option>
            </select>
            
            <select
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand outline-none bg-white"
              value={userStatusFilter}
              onChange={(e) => setUserStatusFilter(e.target.value as any)}
            >
              <option value="all">Tutti gli Stati</option>
              <option value="active">Attivi</option>
              <option value="suspended">Sospesi</option>
            </select>
            
            <select
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand outline-none bg-white"
              value={userDocumentFilter}
              onChange={(e) => setUserDocumentFilter(e.target.value as any)}
            >
              <option value="all">Tutti i Documenti</option>
              <option value="to_verify">📄 Da Verificare</option>
              <option value="verified">✅ Verificati</option>
              <option value="none">⚪ Nessun Documento</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-100">
              <tr>
                <th className="p-4">Utente</th>
                <th className="p-4">Ruolo</th>
                <th className="p-4">Stato</th>
                <th className="p-4">SuperHubber</th>
                <th className="p-4">Fee Custom</th>
                <th className="p-4">Verifica</th>
                <th className="p-4 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="p-4 flex items-center">
                    <img
                      src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                      alt={user.name}
                      className="w-8 h-8 rounded-full mr-3"
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <p className="font-bold text-gray-900">
                          {user.name}
                        </p>
                        {user.verificationStatus === 'verified' && (
                          <CheckCircle2
                            className="w-3 h-3 text-green-500"
                            title="Utente Verificato"
                          />
                        )}
                        {user.isSuperHubber && (
                          <span className="ml-1 px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold rounded-full">
                            ⭐ SUPER
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {user.email || 'No email'}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold capitalize ${
                        user.role === 'hubber'
                          ? 'bg-orange-50 text-orange-700'
                          : user.role === 'admin'
                          ? 'bg-gray-800 text-white'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {user.isSuspended ? (
                      <span className="text-red-600 text-xs font-bold flex items-center">
                        <Ban className="w-3 h-3 mr-1" /> Sospeso
                      </span>
                    ) : (
                      <span className="text-green-600 text-xs font-bold flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" /> Attivo
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {user.isSuperHubber ? (
                      <span className="text-amber-600 text-xs font-bold">⭐ Sì</span>
                    ) : (
                      <span className="text-gray-400 text-xs">No</span>
                    )}
                  </td>
                  <td className="p-4">
                    {user.customFeePercentage ? (
                      <span className="text-purple-600 text-xs font-bold">
                        {user.customFeePercentage}%
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Standard</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        user.verificationStatus === 'verified'
                          ? 'bg-green-100 text-green-800'
                          : user.verificationStatus === 'partially_verified'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {user.verificationStatus === 'verified'
                        ? 'Verificato'
                        : user.verificationStatus === 'partially_verified'
                        ? 'Parziale'
                        : 'Non Verificato'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedUserForEdit(user)}
                      className="text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                      title="Dettagli & Modifica"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-400">
                    Nessun utente trovato.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderListings = () => {
    // Filtra annunci
    const filteredListings = localListings.filter(listing => {
      const matchesSearch = 
        listing.title.toLowerCase().includes(listingSearch.toLowerCase()) ||
        listing.location?.toLowerCase().includes(listingSearch.toLowerCase()) ||
        listing.owner?.name?.toLowerCase().includes(listingSearch.toLowerCase());
      const matchesStatus = listingStatusFilter === 'all' || listing.status === listingStatusFilter;
      const matchesCategory = listingCategoryFilter === 'all' || listing.category === listingCategoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });

    return (
      <div className="space-y-6 animate-in fade-in">
        {/* Header con azioni */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-lg">Gestione Annunci</h3>
              <div className="flex gap-3">
                <button
                  onClick={exportListingsCSV}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" /> Esporta CSV
                </button>
                <button
                  onClick={() => setShowCreateListingModal(true)}
                  className="px-4 py-2 bg-brand text-white text-sm font-bold rounded-lg hover:bg-brand-dark transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" /> Crea Annuncio
                </button>
              </div>
            </div>

            {/* Filtri */}
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cerca per titolo, location o hubber..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand outline-none"
                  value={listingSearch}
                  onChange={(e) => setListingSearch(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand outline-none bg-white"
                value={listingStatusFilter}
                onChange={(e) => setListingStatusFilter(e.target.value as any)}
              >
                <option value="all">Tutti gli Stati</option>
                <option value="published">Pubblicati</option>
                <option value="draft">Bozze</option>
                <option value="suspended">Sospesi</option>
                <option value="hidden">Nascosti</option>
              </select>
              <select
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand outline-none bg-white"
                value={listingCategoryFilter}
                onChange={(e) => setListingCategoryFilter(e.target.value as any)}
              >
                <option value="all">Tutte le Categorie</option>
                <option value="oggetto">Oggetti</option>
                <option value="spazio">Spazi</option>
              </select>
            </div>
          </div>

          {/* Tabella annunci */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-100">
                <tr>
                  <th className="p-4">Annuncio</th>
                  <th className="p-4">Hubber</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4">Stato</th>
                  <th className="p-4">Prezzo</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredListings.map((listing) => (
                  <tr
                    key={listing.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center">
                        <img
                          src={listing.images?.[0] || 'https://via.placeholder.com/40'}
                          alt={listing.title}
                          className="w-12 h-12 rounded-lg object-cover mr-3"
                        />
                        <div>
                          <p className="font-bold text-gray-900 line-clamp-1">
                            {listing.title}
                          </p>
                          <p className="text-xs text-gray-400 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {listing.location || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center">
                        <img
                          src={listing.owner?.avatar || 'https://via.placeholder.com/24'}
                          className="w-6 h-6 rounded-full mr-2"
                          alt=""
                        />
                        <span className="text-sm">{listing.owner?.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        listing.category === 'oggetto' 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'bg-purple-50 text-purple-700'
                      }`}>
                        {listing.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                          listing.status === 'published'
                            ? 'bg-green-50 text-green-700'
                            : listing.status === 'suspended'
                            ? 'bg-red-50 text-red-700'
                            : listing.status === 'hidden'
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-yellow-50 text-yellow-700'
                        }`}
                      >
                        {listing.status === 'published' ? 'Attivo' : 
                         listing.status === 'suspended' ? 'Sospeso' :
                         listing.status === 'hidden' ? 'Nascosto' : 'Bozza'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-gray-900">€{listing.price}</span>
                      <span className="text-gray-400 text-xs ml-1">/{listing.priceUnit}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-yellow-500 font-bold">
                        ⭐ {listing.rating?.toFixed(1) || '0.0'}
                      </span>
                      <span className="text-gray-400 text-xs ml-1">
                        ({listing.reviewCount || 0})
                      </span>
                    </td>
                    <td className="p-4 text-right">
  <div className="flex justify-end gap-1">
    <button
      onClick={() => navigate(`/listing/${listing.id}`)}
      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
      title="Vedi annuncio"
    >
      <Eye className="w-4 h-4" />
    </button>
    <button
      onClick={() => setSelectedListingForEdit(listing)}
      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      title="Modifica"
    >
      <Edit className="w-4 h-4" />
    </button>
    {listing.status === 'published' ? (
      <button
        onClick={() => handleListingStatusChange(listing.id, 'suspended')}
        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
        title="Sospendi"
      >
        <Ban className="w-4 h-4" />
      </button>
    ) : (
      <button
        onClick={() => handleListingStatusChange(listing.id, 'published')}
        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
        title="Pubblica"
      >
        <CheckCircle className="w-4 h-4" />
      </button>
    )}
  </div>
</td>
                  </tr>
                ))}
                {filteredListings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      Nessun annuncio trovato.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer con conteggio */}
          <div className="p-4 border-t border-gray-100 bg-gray-50 text-sm text-gray-500">
            Mostrando {filteredListings.length} di {localListings.length} annunci
          </div>
        </div>
      </div>
    );
  };

// ========== PRENOTAZIONI (BOOKINGS) ==========
  const renderBookings = () => {
    const filteredBookings = localBookings.filter(booking => {
      const matchesSearch = 
        booking.listingTitle?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
        booking.renterName?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
        booking.hubberName?.toLowerCase().includes(bookingSearch.toLowerCase());
      const matchesStatus = bookingStatusFilter === 'all' || booking.status === bookingStatusFilter;
      return matchesSearch && matchesStatus;
    });

    const handleCompleteBooking = async (bookingId: string) => {
      if (!window.confirm('Sei sicuro di voler completare questa prenotazione? Verranno generate automaticamente le fatture.')) {
        return;
      }
      
      setUpdatingBookingId(bookingId);
      try {
        const success = await api.admin.updateBookingStatus(bookingId, 'completed');
        if (success) {
          setLocalBookings(prev => prev.map(b => 
            b.id === bookingId ? { ...b, status: 'completed' } : b
          ));
          
          // ✅ Ricarica i wallet per mostrare i saldi aggiornati
          try {
            const updatedWallets = await api.admin.getAllWallets();
            setLocalWallets(updatedWallets || []);
            
            const updatedWalletTx = await api.admin.getAllWalletTransactions();
            setLocalWalletTransactions(updatedWalletTx || []);
          } catch (walletError) {
            console.error('Errore ricaricamento wallet:', walletError);
            // Non bloccare il flusso se il refresh wallet fallisce
          }
          
          alert('✅ Prenotazione completata! Fatture generate automaticamente.');
        } else {
          alert('❌ Errore: Impossibile completare la prenotazione');
        }
      } catch (error) {
        console.error('Errore completamento prenotazione:', error);
        alert('❌ Errore durante il completamento della prenotazione');
      } finally {
        setUpdatingBookingId(null);
      }
    };

    const handleCancelBooking = async (bookingId: string) => {
      if (!window.confirm('Sei sicuro di voler cancellare questa prenotazione?')) {
        return;
      }
      
      setUpdatingBookingId(bookingId);
      try {
        const success = await api.admin.updateBookingStatus(bookingId, 'cancelled');
        if (success) {
          setLocalBookings(prev => prev.map(b => 
            b.id === bookingId ? { ...b, status: 'cancelled' } : b
          ));
          alert('✅ Prenotazione cancellata.');
        } else {
          alert('❌ Errore: Impossibile cancellare la prenotazione');
        }
      } catch (error) {
        console.error('Errore cancellazione prenotazione:', error);
        alert('❌ Errore durante la cancellazione della prenotazione');
      } finally {
        setUpdatingBookingId(null);
      }
    };

    const getStatusBadge = (status: string) => {
      switch (status) {
        case 'pending':
          return <span className="px-2 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-700">In Attesa</span>;
        case 'confirmed':
          return <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700">Confermata</span>;
        case 'completed':
          return <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700">Completata</span>;
        case 'cancelled':
          return <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700">Cancellata</span>;
        default:
          return <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700">{status}</span>;
      }
    };

    const formatDate = (dateString: string) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
      <div className="space-y-6 animate-in fade-in">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-lg">Gestione Prenotazioni</h3>
              <div className="flex gap-4 text-sm">
                <div className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-lg">
                  <span className="font-bold">{localBookings.filter(b => b.status === 'pending').length}</span> In Attesa
                </div>
                <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg">
                  <span className="font-bold">{localBookings.filter(b => b.status === 'confirmed').length}</span> Confermate
                </div>
                <div className="px-3 py-1 bg-green-50 text-green-700 rounded-lg">
                  <span className="font-bold">{localBookings.filter(b => b.status === 'completed').length}</span> Completate
                </div>
              </div>
            </div>

            {/* Filtri */}
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cerca per annuncio, renter o hubber..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand outline-none"
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand outline-none bg-white"
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value as any)}
              >
                <option value="all">Tutti gli Stati</option>
                <option value="pending">In Attesa</option>
                <option value="confirmed">Confermate</option>
                <option value="completed">Completate</option>
                <option value="cancelled">Cancellate</option>
              </select>
            </div>
          </div>

          {/* Tabella */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase">Annuncio</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase">Renter</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase">Hubber</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase">Date</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase">Totale</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase">Stato</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      Nessuna prenotazione trovata
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{booking.listingTitle || 'N/A'}</div>
                        <div className="text-xs text-gray-500">Codice: <span className="font-mono font-bold text-brand">#{booking.id?.slice(0, 6).toUpperCase()}</span></div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-900">{booking.renterName || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{booking.renterEmail || ''}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-900">{booking.hubberName || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{booking.hubberEmail || ''}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-900">{formatDate(booking.startDate)}</div>
                        <div className="text-xs text-gray-500">→ {formatDate(booking.endDate)}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-gray-900">€ {booking.totalPrice?.toFixed(2) || '0.00'}</div>
                        <div className="text-xs text-gray-500">Netto: € {booking.hubberNetAmount?.toFixed(2) || '0.00'}</div>
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(booking.status)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          {booking.status === 'confirmed' && (
                            <button
                              onClick={() => handleCompleteBooking(booking.id)}
                              disabled={updatingBookingId === booking.id}
                              className="px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center"
                            >
                              {updatingBookingId === booking.id ? (
                                <span className="animate-spin mr-1">⏳</span>
                              ) : (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              )}
                              Completa
                            </button>
                          )}
                          {(booking.status === 'pending' || booking.status === 'confirmed') && (
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              disabled={updatingBookingId === booking.id}
                              className="px-3 py-1.5 bg-red-100 text-red-600 text-xs font-bold rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 flex items-center"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Annulla
                            </button>
                          )}
                          {booking.status === 'completed' && (
                            <span className="text-xs text-gray-400 italic">Fatturata</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ========== RENDER MESSAGES ==========
  const renderMessages = () => {
    // Filtri conversazioni
    const filteredConversations = allConversations.filter(conv => {
      // Filtro ricerca
      const searchLower = msgSearch.toLowerCase();
      const matchesSearch = !msgSearch || 
        conv.renter?.first_name?.toLowerCase().includes(searchLower) ||
        conv.renter?.last_name?.toLowerCase().includes(searchLower) ||
        conv.renter?.public_name?.toLowerCase().includes(searchLower) ||
        conv.hubber?.first_name?.toLowerCase().includes(searchLower) ||
        conv.hubber?.last_name?.toLowerCase().includes(searchLower) ||
        conv.hubber?.public_name?.toLowerCase().includes(searchLower) ||
        conv.listing?.title?.toLowerCase().includes(searchLower) ||
        conv.lastMessagePreview?.toLowerCase().includes(searchLower);

      // Filtro stato
      const matchesStatus = msgStatusFilter === 'all' || conv.status === msgStatusFilter;

      // Filtro tipo
      let matchesType = true;
      if (msgTypeFilter === 'with_booking') matchesType = !!conv.bookingId;
      else if (msgTypeFilter === 'without_booking') matchesType = !conv.bookingId && !conv.isSupport;
      else if (msgTypeFilter === 'support') matchesType = conv.isSupport;

      return matchesSearch && matchesStatus && matchesType;
    });

    // Helper per nome utente
    const getUserName = (user: any) => {
      if (!user) return 'N/A';
      return user.public_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Utente';
    };

    // Helper per formattare data
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);

      if (hours < 1) return 'Ora';
      if (hours < 24) return `${hours}h fa`;
      if (days < 7) return `${days}g fa`;
      return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
    };

    // Status badge colors
    const getStatusBadge = (status: string) => {
      switch (status) {
        case 'open': return { bg: 'bg-green-50', text: 'text-green-700', label: '🟢 Aperta' };
        case 'closed': return { bg: 'bg-gray-100', text: 'text-gray-600', label: '⚫ Chiusa' };
        case 'flagged': return { bg: 'bg-red-50', text: 'text-red-700', label: '🔴 Segnalata' };
        case 'priority': return { bg: 'bg-yellow-50', text: 'text-yellow-700', label: '📌 Prioritaria' };
        case 'resolved': return { bg: 'bg-blue-50', text: 'text-blue-700', label: '✅ Risolta' };
        default: return { bg: 'bg-gray-100', text: 'text-gray-600', label: status };
      }
    };

    return (
      <div className="space-y-6 animate-in fade-in">
        {/* Header con KPI */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">Totali</p>
            <p className="text-2xl font-bold text-gray-900">{conversationStats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">Aperte</p>
            <p className="text-2xl font-bold text-green-600">{conversationStats.open}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">Segnalate</p>
            <p className="text-2xl font-bold text-red-600">{conversationStats.flagged}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">Prioritarie</p>
            <p className="text-2xl font-bold text-yellow-600">{conversationStats.priority}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">Risolte</p>
            <p className="text-2xl font-bold text-blue-600">{conversationStats.resolved}</p>
          </div>
        </div>

            {/* Main content: lista + dettaglio */}
        <div className="grid grid-cols-12 gap-6">
          {/* LISTA CONVERSAZIONI */}
          <div className="col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Tab Attivi/Archivio */}
            <div className="p-3 border-b border-gray-100 flex gap-2">
              <button
                onClick={() => setSupportSubTab('active')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-colors ${
                  supportSubTab === 'active'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📬 Attivi ({allTickets.filter(t => t.status !== 'closed').length})
              </button>
              <button
                onClick={() => setSupportSubTab('archive')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-colors ${
                  supportSubTab === 'archive'
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📁 Archivio ({allTickets.filter(t => t.status === 'closed').length})
              </button>
            </div>

            {/* Filtri */}
            <div className="p-4 border-b border-gray-100 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cerca per utente, annuncio..."
                  value={msgSearch}
                  onChange={(e) => setMsgSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand outline-none"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={msgStatusFilter}
                  onChange={(e) => setMsgStatusFilter(e.target.value as any)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="all">Tutti gli stati</option>
                  <option value="open">🟢 Aperte</option>
                  <option value="flagged">🔴 Segnalate</option>
                  <option value="priority">📌 Prioritarie</option>
                  <option value="resolved">✅ Risolte</option>
                  <option value="closed">⚫ Chiuse</option>
                </select>
                <select
                  value={msgTypeFilter}
                  onChange={(e) => setMsgTypeFilter(e.target.value as any)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="all">Tutti i tipi</option>
                  <option value="with_booking">Con prenotazione</option>
                  <option value="without_booking">Senza prenotazione</option>
                  <option value="support">Supporto</option>
                </select>
              </div>
            </div>

            {/* Lista */}
            <div className="max-h-[600px] overflow-y-auto">
              {messagesLoading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full mx-auto mb-3"></div>
                  Caricamento...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  Nessuna conversazione trovata
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const statusBadge = getStatusBadge(conv.status);
                  const hasFlaggedMessages = conv.lastMessagePreview?.includes('***');
                  
                  return (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`p-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedConversation?.id === conv.id ? 'bg-blue-50 border-l-4 border-l-brand' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                            {statusBadge.label}
                          </span>
                          {conv.bookingId && (
                            <span className="text-xs text-purple-600" title="Collegata a prenotazione">📅</span>
                          )}
                          {conv.listingId && (
                            <span className="text-xs text-blue-600" title="Collegata ad annuncio">🏠</span>
                          )}
                          {hasFlaggedMessages && (
                            <span className="text-xs text-red-600" title="Contiene violazioni">⚠️</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">{formatDate(conv.lastMessageAt)}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex -space-x-2">
                          <img
                            src={conv.renter?.avatar_url || `https://ui-avatars.com/api/?name=${getUserName(conv.renter)}&background=10B981&color=fff`}
                            alt=""
                            className="w-8 h-8 rounded-full border-2 border-white"
                          />
                          <img
                            src={conv.hubber?.avatar_url || `https://ui-avatars.com/api/?name=${getUserName(conv.hubber)}&background=6366F1&color=fff`}
                            alt=""
                            className="w-8 h-8 rounded-full border-2 border-white"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {getUserName(conv.renter)} ↔ {getUserName(conv.hubber)}
                          </p>
                          {conv.listing && (
                            <p className="text-xs text-gray-500 truncate">📦 {conv.listing.title}</p>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 truncate">
                        {conv.lastMessagePreview || 'Nessun messaggio'}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="p-3 border-t border-gray-100 bg-gray-50 text-sm text-gray-500">
              {filteredConversations.length} conversazioni
            </div>
          </div>

          {/* DETTAGLIO CONVERSAZIONE */}
          <div className="col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                  <p>Seleziona una conversazione</p>
                </div>
              </div>
            ) : (
              <>
                {/* Header dettaglio */}
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        <img
                          src={selectedConversation.renter?.avatar_url || `https://ui-avatars.com/api/?name=R&background=10B981&color=fff`}
                          alt=""
                          className="w-10 h-10 rounded-full border-2 border-white"
                        />
                        <img
                          src={selectedConversation.hubber?.avatar_url || `https://ui-avatars.com/api/?name=H&background=6366F1&color=fff`}
                          alt=""
                          className="w-10 h-10 rounded-full border-2 border-white"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          {getUserName(selectedConversation.renter)} ↔ {getUserName(selectedConversation.hubber)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {selectedConversation.listing?.title || 'Conversazione diretta'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Azioni stato */}
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedConversation.status}
                        onChange={(e) => handleUpdateConversationStatus(selectedConversation.id, e.target.value)}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
                      >
                        <option value="open">🟢 Aperta</option>
                        <option value="flagged">🔴 Segnalata</option>
                        <option value="priority">📌 Prioritaria</option>
                        <option value="resolved">✅ Risolta</option>
                        <option value="closed">⚫ Chiusa</option>
                      </select>
                    </div>
                  </div>

                  {/* Info cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Renter info */}
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-xs font-bold text-gray-500 mb-2">RENTER</p>
                      <div className="flex items-center gap-2">
                        <img
                          src={selectedConversation.renter?.avatar_url || `https://ui-avatars.com/api/?name=R&background=10B981&color=fff`}
                          alt=""
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="text-sm font-medium">{getUserName(selectedConversation.renter)}</p>
                          <p className="text-xs text-gray-500">{selectedConversation.renter?.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Hubber info */}
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-xs font-bold text-gray-500 mb-2">HUBBER</p>
                      <div className="flex items-center gap-2">
                        <img
                          src={selectedConversation.hubber?.avatar_url || `https://ui-avatars.com/api/?name=H&background=6366F1&color=fff`}
                          alt=""
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="text-sm font-medium">
                            {getUserName(selectedConversation.hubber)}
                            {selectedConversation.hubber?.is_super_hubber && (
                              <span className="ml-1 text-yellow-500">⭐</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">{selectedConversation.hubber?.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Booking info */}
                    {selectedConversation.booking && (
                      <div className="col-span-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-xs font-bold text-purple-700 mb-1">📅 PRENOTAZIONE COLLEGATA</p>
                        <p className="text-sm">
                          {new Date(selectedConversation.booking.start_date).toLocaleDateString('it-IT')} - {new Date(selectedConversation.booking.end_date).toLocaleDateString('it-IT')}
                          <span className="ml-2 font-bold">€{selectedConversation.booking.total_price}</span>
                          <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                            selectedConversation.booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            selectedConversation.booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {selectedConversation.booking.status}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messaggi */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 max-h-[350px]">
                  {conversationMessages.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      Nessun messaggio in questa conversazione
                    </div>
                  ) : (
                    conversationMessages.map((msg) => {
                      const isRenter = msg.fromUserId === selectedConversation.renterId;
                      const isAdmin = msg.isAdminMessage;
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isRenter ? 'justify-start' : 'justify-end'}`}
                        >
                          <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            isAdmin 
                              ? 'bg-purple-100 border border-purple-300'
                              : isRenter 
                                ? 'bg-white border border-gray-200' 
                                : 'bg-brand text-white'
                          }`}>
                            {isAdmin && (
                              <p className="text-xs font-bold text-purple-600 mb-1"> Renthubber</p>
                            )}
                            <p className={`text-sm ${isAdmin ? 'text-purple-900' : isRenter ? 'text-gray-900' : 'text-white'}`}>
                              {msg.text}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <p className={`text-xs ${isRenter ? 'text-gray-400' : 'text-white/70'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                {msg.read && ' ✓✓'}
                              </p>
                              {msg.flagged && (
                                <span className="text-xs text-red-500 ml-2" title={msg.flagReason}>
                                  ⚠️ {msg.flagReason}
                                </span>
                              )}
                            </div>
                          </div>
                          {!isAdmin && (
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="ml-2 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                              title="Elimina messaggio"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input risposta admin */}
                <div className="p-4 border-t border-gray-100 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={adminReplyText}
                        onChange={(e) => setAdminReplyText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendAdminReply()}
                        placeholder="Scrivi come Admin..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand outline-none pr-12"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-purple-500 font-bold">
                        Support
                      </span>
                    </div>
                    <button
                      onClick={handleSendAdminReply}
                      disabled={!adminReplyText.trim() || isSendingAdminReply}
                      className="px-4 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSendingAdminReply ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Invia
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Il messaggio verrà inviato come comunicazione ufficiale del supporto RentHubber
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ========== RENDER SUPPORT TICKETS ==========
  const renderSupport = () => {
    // Filtri ticket
    const filteredTickets = allTickets.filter(ticket => {
      // Prima filtra per sub-tab (attivi vs archivio)
      const isArchived = ticket.status === 'closed';
      if (supportSubTab === 'active' && isArchived) return false;
      if (supportSubTab === 'archive' && !isArchived) return false;

      const searchLower = ticketSearch.toLowerCase();
      const matchesSearch = !ticketSearch || 
        ticket.user?.first_name?.toLowerCase().includes(searchLower) ||
        ticket.user?.last_name?.toLowerCase().includes(searchLower) ||
        ticket.user?.email?.toLowerCase().includes(searchLower) ||
        ticket.subject?.toLowerCase().includes(searchLower) ||
        ticket.last_message_preview?.toLowerCase().includes(searchLower) ||
        ticket.ticket_number?.toLowerCase().includes(searchLower);

      const matchesStatus = ticketStatusFilter === 'all' || ticket.status === ticketStatusFilter;
      const matchesPriority = ticketPriorityFilter === 'all' || ticket.priority === ticketPriorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });

    // Helper nome utente
    const getUserName = (user: any) => {
      if (!user) return 'Utente';
      return user.public_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Utente';
    };

    // Helper data
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);

      if (hours < 1) return 'Ora';
      if (hours < 24) return `${hours}h fa`;
      if (days < 7) return `${days}g fa`;
      return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
    };

    // Status badge
    const getStatusBadge = (status: string) => {
      switch (status) {
        case 'open': return { bg: 'bg-blue-50', text: 'text-blue-700', label: '🆕 Nuovo' };
        case 'in_progress': return { bg: 'bg-yellow-50', text: 'text-yellow-700', label: '⏳ In corso' };
        case 'waiting_user': return { bg: 'bg-purple-50', text: 'text-purple-700', label: '👤 Attesa utente' };
        case 'resolved': return { bg: 'bg-green-50', text: 'text-green-700', label: '✅ Risolto' };
        case 'closed': return { bg: 'bg-gray-100', text: 'text-gray-600', label: '🔒 Chiuso' };
        default: return { bg: 'bg-gray-100', text: 'text-gray-600', label: status };
      }
    };

    // Priority badge
    const getPriorityBadge = (priority: string) => {
      switch (priority) {
        case 'low': return { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Bassa' };
        case 'medium': return { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Media' };
        case 'high': return { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Alta' };
        case 'urgent': return { bg: 'bg-red-50', text: 'text-red-700', label: '🔥 Urgente' };
        default: return { bg: 'bg-gray-100', text: 'text-gray-600', label: priority };
      }
    };

    return (
      <div className="space-y-6 animate-in fade-in">
        {/* Header con KPI */}
        <div className="grid grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">Totali</p>
            <p className="text-2xl font-bold text-gray-900">{supportStats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
            <p className="text-sm text-blue-600">Nuovi</p>
            <p className="text-2xl font-bold text-blue-600">{supportStats.new}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-yellow-200 shadow-sm">
            <p className="text-sm text-yellow-600">In corso</p>
            <p className="text-2xl font-bold text-yellow-600">{supportStats.inProgress}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-orange-200 shadow-sm">
            <p className="text-sm text-orange-600">Non letti</p>
            <p className="text-2xl font-bold text-orange-600">{supportStats.unread}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm">
            <p className="text-sm text-red-600">Urgenti</p>
            <p className="text-2xl font-bold text-red-600">{supportStats.urgent}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm">
            <p className="text-sm text-green-600">Risolti</p>
            <p className="text-2xl font-bold text-green-600">{supportStats.resolved}</p>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-12 gap-6">
          {/* LISTA TICKET */}
          <div className="col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Tab Attivi/Archivio */}
            <div className="p-3 border-b border-gray-100 flex gap-2">
              <button
                onClick={() => setSupportSubTab('active')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-colors ${
                  supportSubTab === 'active'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📬 Attivi ({allTickets.filter(t => t.status !== 'closed').length})
              </button>
              <button
                onClick={() => setSupportSubTab('archive')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-colors ${
                  supportSubTab === 'archive'
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📁 Archivio ({allTickets.filter(t => t.status === 'closed').length})
              </button>
            </div>

            {/* Filtri */}
            <div className="p-4 border-b border-gray-100 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cerca ticket..."

                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand outline-none"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={ticketStatusFilter}
                  onChange={(e) => setTicketStatusFilter(e.target.value as any)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="all">Tutti gli stati</option>
                  <option value="open">🆕 Nuovi</option>
                  <option value="in_progress">⏳ In corso</option>
                  <option value="waiting_user">👤 Attesa utente</option>
                  <option value="resolved">✅ Risolti</option>
                  <option value="closed">🔒 Chiusi</option>
                </select>
                <select
                  value={ticketPriorityFilter}
                  onChange={(e) => setTicketPriorityFilter(e.target.value as any)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="all">Tutte le priorità</option>
                  <option value="urgent">🔥 Urgente</option>
                  <option value="high">Alta</option>
                  <option value="medium">Media</option>
                  <option value="low">Bassa</option>
                </select>
              </div>
            </div>

            {/* Lista */}
            <div className="max-h-[550px] overflow-y-auto">
              {ticketsLoading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full mx-auto mb-3"></div>
                  Caricamento...
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Headphones className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  Nessun ticket trovato
                </div>
              ) : (
                (() => {
                  // Raggruppa per mese/anno se siamo in archivio
                  const renderTicketItem = (ticket: any) => {
                    const statusBadge = getStatusBadge(ticket.status);
                    const priorityBadge = getPriorityBadge(ticket.priority);
                    
                    return (
                      <div
                        key={ticket.id}
                        onClick={() => handleSelectTicket(ticket)}
                        className={`p-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 ${
                          selectedTicket?.id === ticket.id ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''
                        } ${ticket.unread_by_support ? 'bg-orange-50/50' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                              {statusBadge.label}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityBadge.bg} ${priorityBadge.text}`}>
                              {priorityBadge.label}
                            </span>
                            {ticket.unread_by_support && (
                              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">{formatDate(ticket.last_message_at || ticket.updated_at)}</span>
                        </div>
                        
                        <div className="flex items-center gap-3 mb-2">
                          <img
                            src={ticket.user?.avatar_url || `https://ui-avatars.com/api/?name=${getUserName(ticket.user)}&background=FF6B35&color=fff`}
                            alt=""
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {getUserName(ticket.user)}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {ticket.subject || 'Richiesta supporto'}
                            </p>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 truncate">
                          {ticket.last_message_preview || 'Nessun messaggio'}
                        </p>

                        {ticket.assigned && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-purple-600">
                            <UserCheck className="w-3 h-3" />
                            Assegnato a {getUserName(ticket.assigned)}
                          </div>
                        )}
                      </div>
                    );
                  };

                  if (supportSubTab === 'archive') {
                    // Raggruppa per mese/anno
                    const grouped: { [key: string]: any[] } = {};
                    filteredTickets.forEach(ticket => {
                      const date = new Date(ticket.closed_at || ticket.updated_at);
                      const monthYear = date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
                      if (!grouped[monthYear]) grouped[monthYear] = [];
                      grouped[monthYear].push(ticket);
                    });

                    return Object.entries(grouped).map(([monthYear, tickets]) => (
                      <div key={monthYear}>
                        <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 sticky top-0">
                          <p className="text-xs font-bold text-gray-600 uppercase">
                            📅 {monthYear} ({tickets.length})
                          </p>
                        </div>
                        {tickets.map(renderTicketItem)}
                      </div>
                    ));
                  }

                  return filteredTickets.map(renderTicketItem);
                })()
              )}
            </div>
            
            <div className="p-3 border-t border-gray-100 bg-gray-50 text-sm text-gray-500">
              {filteredTickets.length} ticket
            </div>
          </div>

          {/* DETTAGLIO TICKET */}
          <div className="col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            {!selectedTicket ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Headphones className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                  <p>Seleziona un ticket</p>
                </div>
              </div>
            ) : (
              <>
                {/* Header ticket */}
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedTicket.user?.avatar_url || `https://ui-avatars.com/api/?name=U&background=FF6B35&color=fff`}
                        alt=""
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <p className="font-bold text-gray-900">{getUserName(selectedTicket.user)}</p>
                        <p className="text-sm text-gray-500">{selectedTicket.user?.email}</p>
                        <p className="text-xs text-gray-400">#{selectedTicket.ticket_number || selectedTicket.id}</p>
                      </div>
                    </div>
                  </div>

                  {/* Controlli */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-1 block">Stato</label>
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleUpdateTicketStatus(selectedTicket.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                      >
                        <option value="open">🆕 Nuovo</option>
                        <option value="in_progress">⏳ In corso</option>
                        <option value="waiting_user">👤 Attesa utente</option>
                        <option value="resolved">✅ Risolto</option>
                        <option value="closed">🔒 Chiuso</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-1 block">Priorità</label>
                      <select
                        value={selectedTicket.priority}
                        onChange={(e) => handleUpdateTicketPriority(selectedTicket.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                      >
                        <option value="low">Bassa</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                        <option value="urgent">🔥 Urgente</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-1 block">Assegna a</label>
                      <select
                        value={selectedTicket.assigned_to || ''}
                        onChange={(e) => handleAssignTicket(selectedTicket.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                      >
                        <option value="">Non assegnato</option>
                        {supportOperators.map(op => (
                          <option key={op.id} value={op.id}>
                            {getUserName(op)} ({op.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Messaggi */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 max-h-[320px]">
                  {ticketMessages.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      Nessun messaggio
                    </div>
                  ) : (
                    ticketMessages.map((msg) => {
                      const isUser = msg.sender_type === 'user';
                      const isInternal = msg.is_internal;
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}
                        >
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                            isInternal 
                              ? 'bg-yellow-100 border-2 border-dashed border-yellow-400'
                              : isUser 
                                ? 'bg-white border border-gray-200' 
                                : 'bg-orange-500 text-white'
                          }`}>
                            {isInternal && (
                              <p className="text-xs font-bold text-yellow-700 mb-1 flex items-center">
                                <Lock className="w-3 h-3 mr-1" /> NOTA INTERNA
                              </p>
                            )}
                            {!isUser && !isInternal && (
                              <p className="text-xs font-bold text-white/80 mb-1">
                                {msg.sender_type === 'admin' ? '👑 Admin' : '💬 Supporto'}: {getUserName(msg.sender)}
                              </p>
                            )}
                            <p className={`text-sm ${isInternal ? 'text-yellow-900' : isUser ? 'text-gray-900' : 'text-white'}`}>
                              {msg.message}
                            </p>
                            <p className={`text-xs mt-1 ${isInternal ? 'text-yellow-600' : isUser ? 'text-gray-400' : 'text-white/70'}`}>
                              {new Date(msg.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input risposta */}
                <div className="p-4 border-t border-gray-100 bg-white">
                  {/* Toggle nota interna */}
                  <div className="mb-3 flex items-center gap-2">
                    <button
                      onClick={() => setIsInternalNote(false)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        !isInternalNote 
                          ? 'bg-orange-500 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      💬 Risposta utente
                    </button>
                    <button
                      onClick={() => setIsInternalNote(true)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isInternalNote 
                          ? 'bg-yellow-500 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      🔒 Nota interna
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <textarea
                        value={supportReplyText}
                        onChange={(e) => setSupportReplyText(e.target.value)}
                        placeholder={isInternalNote ? "Scrivi una nota interna (non visibile all'utente)..." : "Scrivi la risposta all'utente..."}
                        rows={2}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 outline-none resize-none ${
                          isInternalNote 
                            ? 'border-yellow-300 focus:ring-yellow-500 bg-yellow-50' 
                            : 'border-gray-200 focus:ring-orange-500'
                        }`}
                      />
                    </div>
                    <button
                      onClick={handleSendSupportReply}
                      disabled={!supportReplyText.trim() || isSendingSupportReply}
                      className={`px-4 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                        isInternalNote
                          ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                          : 'bg-orange-500 text-white hover:bg-orange-600'
                      }`}
                    >
                      {isSendingSupportReply ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Invia
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {isInternalNote 
                      ? '⚠️ Questa nota sarà visibile solo al team di supporto'
                      : 'Il messaggio sarà visibile all\'utente nella sua chat di supporto'
                    }
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderFinance = () => {
  const financeTabs = [
    { id: 'overview', label: '📊 Panoramica' },
    { id: 'transactions', label: '💳 Transazioni' },
    { id: 'wallets', label: '👛 Wallet Utenti' },
    { id: 'payouts', label: '🏦 Payout Hubber' },
    { id: 'fees', label: '⚙️ Commissioni' },
    { id: 'refunds', label: '↩️ Rimborsi' },
    { id: 'reports', label: '📈 Report' },
    { id: 'settings', label: '🔧 Impostazioni' },
  ];

  const renderFinanceOverview = () => {
  // Calcola date in base al periodo selezionato
  const now = new Date();
  const getStartDate = () => {
    switch (financePeriod) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case '7days':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30days':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  };

  const startDate = getStartDate();

  // Filtra prenotazioni per periodo
  const filteredBookings = localBookings.filter(b => {
    const bookingDate = new Date(b.createdAt || b.startDate || now);
    return bookingDate >= startDate;
  });

  const periodCompleted = filteredBookings.filter(b => b.status === 'completed').length;
  const periodConfirmed = filteredBookings.filter(b => b.status === 'confirmed' || b.status === 'accepted').length;
  const periodPending = filteredBookings.filter(b => b.status === 'pending').length;
  
  // Calcola entrate del periodo
  const periodRevenue = filteredBookings
    .filter(b => b.status === 'completed')
    .reduce((acc, b) => acc + (b.totalPrice || 0), 0);

  // Calcola commissioni (usa la fee configurata)
  const periodCommissions = filteredBookings
    .filter(b => b.status === 'completed')
    .reduce((acc, b) => acc + (b.commission || (b.totalPrice || 0) * (renterFee / 100)), 0);

  // Payout in attesa
  const pendingPayouts = payoutRequests
    .filter(p => p.status === 'pending')
    .reduce((acc, p) => acc + p.amount, 0);
  const pendingPayoutsCount = payoutRequests.filter(p => p.status === 'pending').length;

  // Genera dati per il grafico
  const generateChartData = () => {
    const data: { name: string; entrate: number; commissioni: number }[] = [];
    
    if (financePeriod === 'today') {
      // Ore del giorno
      for (let i = 0; i < 24; i += 4) {
        const hourBookings = filteredBookings.filter(b => {
          const d = new Date(b.createdAt || b.startDate || now);
          return d.getHours() >= i && d.getHours() < i + 4;
        });
        const hourRevenue = hourBookings.filter(b => b.status === 'completed').reduce((acc, b) => acc + (b.totalPrice || 0), 0);
        data.push({
          name: `${i}:00`,
          entrate: hourRevenue,
          commissioni: hourRevenue * (renterFee / 100)
        });
      }
    } else if (financePeriod === '7days') {
      // Ultimi 7 giorni
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayName = date.toLocaleDateString('it-IT', { weekday: 'short' });
        const dayBookings = filteredBookings.filter(b => {
          const d = new Date(b.createdAt || b.startDate || now);
          return d.toDateString() === date.toDateString();
        });
        const dayRevenue = dayBookings.filter(b => b.status === 'completed').reduce((acc, b) => acc + (b.totalPrice || 0), 0);
        data.push({
          name: dayName,
          entrate: dayRevenue,
          commissioni: dayRevenue * (renterFee / 100)
        });
      }
    } else if (financePeriod === '30days') {
      // Ultime 4 settimane
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const weekBookings = filteredBookings.filter(b => {
          const d = new Date(b.createdAt || b.startDate || now);
          return d >= weekStart && d < weekEnd;
        });
        const weekRevenue = weekBookings.filter(b => b.status === 'completed').reduce((acc, b) => acc + (b.totalPrice || 0), 0);
        data.push({
          name: `Sett ${4 - i}`,
          entrate: weekRevenue,
          commissioni: weekRevenue * (renterFee / 100)
        });
      }
    } else {
      // Anno - ultimi 12 mesi
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = monthDate.toLocaleDateString('it-IT', { month: 'short' });
        const monthBookings = filteredBookings.filter(b => {
          const d = new Date(b.createdAt || b.startDate || now);
          return d.getMonth() === monthDate.getMonth() && d.getFullYear() === monthDate.getFullYear();
        });
        const monthRevenue = monthBookings.filter(b => b.status === 'completed').reduce((acc, b) => acc + (b.totalPrice || 0), 0);
        data.push({
          name: monthName,
          entrate: monthRevenue,
          commissioni: monthRevenue * (renterFee / 100)
        });
      }
    }
    
    return data;
  };

  const chartData = generateChartData();
  const periodLabel = financePeriod === 'today' ? 'Oggi' : 
                      financePeriod === '7days' ? '7 giorni' : 
                      financePeriod === '30days' ? '30 giorni' : 'Anno';

  return (
    <div className="space-y-6">
      {/* Filtro Periodo */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Panoramica Finanziaria</h3>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          {[
            { id: 'today', label: 'Oggi' },
            { id: '7days', label: '7 giorni' },
            { id: '30days', label: '30 giorni' },
            { id: 'year', label: 'Anno' },
          ].map((period) => (
            <button
              key={period.id}
              onClick={() => setFinancePeriod(period.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                financePeriod === period.id
                  ? 'bg-white text-brand shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title={`Entrate (${periodLabel})`}
          value={`€ ${periodRevenue.toFixed(2)}`}
          subtext={periodCompleted > 0 ? `${periodCompleted} noleggi completati` : 'Nessun noleggio'}
          icon={TrendingUp}
          color="bg-green-500"
        />
        <KpiCard
          title="Commissioni RentHubber"
          value={`€ ${periodCommissions.toFixed(2)}`}
          subtext={`${renterFee}% + €${fixedFee} fisso`}
          icon={DollarSign}
          color="bg-blue-500"
        />
        <KpiCard
          title="Da Pagare (Hubber)"
          value={`€ ${pendingPayouts.toFixed(2)}`}
          subtext={`${pendingPayoutsCount} richieste in attesa`}
          icon={Landmark}
          color="bg-orange-500"
        />
        <KpiCard
          title="Prenotazioni Attive"
          value={periodConfirmed + periodPending}
          subtext={`${periodConfirmed} confermate, ${periodPending} in attesa`}
          icon={CalendarCheck}
          color="bg-purple-500"
        />
      </div>

      {/* Grafico Entrate */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-900">📈 Andamento Entrate</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600">Entrate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-600">Commissioni</span>
            </div>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorEntrate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCommissioni" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(v) => `€${v}`} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => [`€ ${value.toFixed(2)}`, '']}
              />
              <Area type="monotone" dataKey="entrate" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorEntrate)" name="Entrate" />
              <Area type="monotone" dataKey="commissioni" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorCommissioni)" name="Commissioni" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats aggiuntive */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Tasso Completamento</span>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {filteredBookings.length > 0 
              ? `${Math.round((periodCompleted / filteredBookings.length) * 100)}%`
              : 'N/A'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {periodCompleted} su {filteredBookings.length} prenotazioni
          </p>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Valore Medio Ordine</span>
            <ShoppingBag className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            € {periodCompleted > 0 ? (periodRevenue / periodCompleted).toFixed(2) : '0.00'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Per noleggio completato</p>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Hubber Attivi</span>
            <Users className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {localUsers.filter(u => u.role === 'hubber' || u.roles?.includes('hubber')).length}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {localUsers.filter(u => u.isSuperHubber).length} SuperHubber
          </p>
        </div>
      </div>
    </div>
  );
};

const renderFinanceTransactions = () => {
  // Filtra transazioni
  const filteredPayments = localPayments.filter(p => {
    // Filtro stato
    if (paymentsStatusFilter !== 'all' && p.status !== paymentsStatusFilter) return false;
    
    // Filtro data
    if (paymentsDateFrom) {
      const paymentDate = new Date(p.created_at);
      const fromDate = new Date(paymentsDateFrom);
      if (paymentDate < fromDate) return false;
    }
    if (paymentsDateTo) {
      const paymentDate = new Date(p.created_at);
      const toDate = new Date(paymentsDateTo);
      toDate.setHours(23, 59, 59, 999);
      if (paymentDate > toDate) return false;
    }
    
    // Filtro ricerca
    if (paymentsSearch) {
      const search = paymentsSearch.toLowerCase();
      const renterName = `${p.renter?.first_name || ''} ${p.renter?.last_name || ''}`.toLowerCase();
      const hubberName = `${p.hubber?.first_name || ''} ${p.hubber?.last_name || ''}`.toLowerCase();
      const paymentId = (p.provider_payment_id || '').toLowerCase();
      
      return renterName.includes(search) || 
             hubberName.includes(search) || 
             paymentId.includes(search) ||
             p.id?.toLowerCase().includes(search);
    }
    
    return true;
  });

  // Calcola totali
  const totalAmount = filteredPayments.reduce((sum, p) => sum + Number(p.amount_total || 0), 0);
  const totalFees = filteredPayments.reduce((sum, p) => sum + Number(p.platform_fee || 0), 0);
  const totalHubberNet = filteredPayments.reduce((sum, p) => sum + Number(p.hubber_net_amount || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'succeeded':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Completato</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">In attesa</span>;
      case 'failed':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Fallito</span>;
      case 'refunded':
        return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Rimborsato</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{status || 'N/A'}</span>;
    }
  };

  // Export CSV
  const exportToCSV = () => {
    const headers = ['Data', 'ID Pagamento', 'Renter', 'Email Renter', 'Hubber', 'Email Hubber', 'Totale', 'Commissione', 'Netto Hubber', 'Provider', 'Stato'];
    const rows = filteredPayments.map(p => [
      p.created_at ? new Date(p.created_at).toLocaleDateString('it-IT') : '',
      p.provider_payment_id || p.id || '',
      `${p.renter?.first_name || ''} ${p.renter?.last_name || ''}`.trim(),
      p.renter?.email || '',
      `${p.hubber?.first_name || ''} ${p.hubber?.last_name || ''}`.trim(),
      p.hubber?.email || '',
      Number(p.amount_total || 0).toFixed(2),
      Number(p.platform_fee || 0).toFixed(2),
      Number(p.hubber_net_amount || 0).toFixed(2),
      p.provider || '',
      p.status || ''
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transazioni_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Reset filtri
  const resetFilters = () => {
    setPaymentsSearch('');
    setPaymentsStatusFilter('all');
    setPaymentsDateFrom('');
    setPaymentsDateTo('');
  };

  return (
    <div className="space-y-6">
      {/* Header con KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Transazioni</p>
              <p className="text-xl font-bold text-gray-900">{filteredPayments.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Volume Totale</p>
              <p className="text-xl font-bold text-gray-900">€ {totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center">
              <Percent className="w-5 h-5 text-brand" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Commissioni</p>
              <p className="text-xl font-bold text-gray-900">€ {totalFees.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Netto Hubber</p>
              <p className="text-xl font-bold text-gray-900">€ {totalHubberNet.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Ricerca */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca per nome, ID pagamento..."
                value={paymentsSearch}
                onChange={(e) => setPaymentsSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
          </div>
          
          {/* Data Da */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Da:</span>
            <input
              type="date"
              value={paymentsDateFrom}
              onChange={(e) => setPaymentsDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
          
          {/* Data A */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">A:</span>
            <input
              type="date"
              value={paymentsDateTo}
              onChange={(e) => setPaymentsDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
          
          {/* Filtro stato */}
          <select
            value={paymentsStatusFilter}
            onChange={(e) => setPaymentsStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          >
            <option value="all">Tutti gli stati</option>
            <option value="completed">Completati</option>
            <option value="succeeded">Succeeded</option>
            <option value="pending">In attesa</option>
            <option value="failed">Falliti</option>
            <option value="refunded">Rimborsati</option>
          </select>

          {/* Reset filtri */}
          {(paymentsSearch || paymentsStatusFilter !== 'all' || paymentsDateFrom || paymentsDateTo) && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Reset filtri
            </button>
          )}
          
          {/* Export CSV */}
          <button
            onClick={exportToCSV}
            disabled={filteredPayments.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Esporta CSV
          </button>
        </div>
      </div>

      {/* Tabella */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">ID Pagamento</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Renter</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Hubber</th>
                <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">Totale</th>
                <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">Commissione</th>
                <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">Netto Hubber</th>
                <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Provider</th>
                <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Stato</th>
                <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-500">
                    <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">Nessuna transazione trovata</p>
                    <p className="text-sm">Le transazioni appariranno qui dopo i primi pagamenti</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const renterName = payment.renter 
                    ? `${payment.renter.first_name || ''} ${payment.renter.last_name || ''}`.trim() || payment.renter.email
                    : 'N/A';
                  const hubberName = payment.hubber 
                    ? `${payment.hubber.first_name || ''} ${payment.hubber.last_name || ''}`.trim() || payment.hubber.email
                    : 'N/A';
                  
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.created_at ? new Date(payment.created_at).toLocaleDateString('it-IT') : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {payment.created_at ? new Date(payment.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </td>
                      <td className="p-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                          {payment.provider_payment_id?.slice(0, 16) || payment.id?.slice(0, 8)}...
                        </code>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <img 
                            src={payment.renter?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(renterName)}&background=random`}
                            alt={renterName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-900 block">{renterName}</span>
                            <span className="text-xs text-gray-500">{payment.renter?.email || ''}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <img 
                            src={payment.hubber?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(hubberName)}&background=random`}
                            alt={hubberName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-900 block">{hubberName}</span>
                            <span className="text-xs text-gray-500">{payment.hubber?.email || ''}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm font-bold text-gray-900">
                          € {Number(payment.amount_total || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm text-brand font-medium">
                          € {Number(payment.platform_fee || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm text-green-600 font-medium">
                          € {Number(payment.hubber_net_amount || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full font-medium uppercase">
                          {payment.provider || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowPaymentModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors"
                          title="Dettagli"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dettaglio Transazione */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Dettaglio Transazione</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedPayment(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-6 space-y-6">
              {/* Info Generali */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">ID Transazione</p>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono block break-all">
                    {selectedPayment.id}
                  </code>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">ID Provider</p>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono block break-all">
                    {selectedPayment.provider_payment_id || 'N/A'}
                  </code>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Data Pagamento</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedPayment.created_at 
                      ? new Date(selectedPayment.created_at).toLocaleString('it-IT')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Data Accredito</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedPayment.paid_at 
                      ? new Date(selectedPayment.paid_at).toLocaleString('it-IT')
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Utenti */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-3">Renter (Pagante)</p>
                  <div className="flex items-center gap-3">
                    <img 
                      src={selectedPayment.renter?.avatar_url || `https://ui-avatars.com/api/?name=Renter&background=random`}
                      alt="Renter"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {`${selectedPayment.renter?.first_name || ''} ${selectedPayment.renter?.last_name || ''}`.trim() || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">{selectedPayment.renter?.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-3">Hubber (Ricevente)</p>
                  <div className="flex items-center gap-3">
                    <img 
                      src={selectedPayment.hubber?.avatar_url || `https://ui-avatars.com/api/?name=Hubber&background=random`}
                      alt="Hubber"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {`${selectedPayment.hubber?.first_name || ''} ${selectedPayment.hubber?.last_name || ''}`.trim() || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">{selectedPayment.hubber?.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Importi */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl">
                <p className="text-xs text-gray-500 uppercase font-medium mb-4">Riepilogo Importi</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Totale Pagato</span>
                    <span className="text-lg font-bold text-gray-900">€ {Number(selectedPayment.amount_total || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Commissione Piattaforma</span>
                    <span className="text-sm font-medium text-brand">- € {Number(selectedPayment.platform_fee || 0).toFixed(2)}</span>
                  </div>
                  <hr className="border-gray-200" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">Netto Hubber</span>
                    <span className="text-lg font-bold text-green-600">€ {Number(selectedPayment.hubber_net_amount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Info Aggiuntive */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Provider</p>
                  <p className="text-sm font-bold uppercase">{selectedPayment.provider || 'N/A'}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Stato</p>
                  {getStatusBadge(selectedPayment.status)}
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Codice Prenotazione</p>
                  <code className="text-xs font-mono font-bold text-brand">#{selectedPayment.booking_id?.slice(0, 6).toUpperCase() || 'N/A'}</code>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedPayment(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const renderFinanceWallets = () => {
  // Filtra wallets
  const filteredWallets = localWallets.filter(w => {
    // Filtro ruolo
    if (walletsRoleFilter !== 'all') {
      const userRole = w.user?.role || '';
      const userRoles = w.user?.roles || [];
      if (walletsRoleFilter === 'hubber' && userRole !== 'hubber' && !userRoles.includes('hubber')) return false;
      if (walletsRoleFilter === 'renter' && userRole !== 'renter' && !userRoles.includes('renter')) return false;
    }
    
    // Filtro ricerca
    if (walletsSearch) {
      const search = walletsSearch.toLowerCase();
      const userName = `${w.user?.first_name || ''} ${w.user?.last_name || ''}`.toLowerCase();
      const email = (w.user?.email || '').toLowerCase();
      return userName.includes(search) || email.includes(search);
    }
    
    return true;
  });

  // Calcola totali
  const totalBalance = filteredWallets.reduce((sum, w) => sum + (w.balanceEur || 0), 0);
  const walletsWithBalance = filteredWallets.filter(w => (w.balanceEur || 0) > 0).length;
  const avgBalance = filteredWallets.length > 0 ? totalBalance / filteredWallets.length : 0;

  // Export CSV
  const exportWalletsCSV = () => {
    const headers = ['Utente', 'Email', 'Ruolo', 'Saldo (€)', 'Ultimo Aggiornamento'];
    const rows = filteredWallets.map(w => [
      `${w.user?.first_name || ''} ${w.user?.last_name || ''}`.trim(),
      w.user?.email || '',
      w.user?.role || '',
      (w.balanceEur || 0).toFixed(2),
      w.updated_at ? new Date(w.updated_at).toLocaleDateString('it-IT') : ''
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `wallets_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Wallet Totali</p>
              <p className="text-xl font-bold text-gray-900">{filteredWallets.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Saldo Totale</p>
              <p className="text-xl font-bold text-gray-900">€ {totalBalance.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Saldo Medio</p>
              <p className="text-xl font-bold text-gray-900">€ {avgBalance.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Con Saldo</p>
              <p className="text-xl font-bold text-gray-900">{walletsWithBalance}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca per nome o email..."
                value={walletsSearch}
                onChange={(e) => setWalletsSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
          </div>
          
          <select
            value={walletsRoleFilter}
            onChange={(e) => setWalletsRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          >
            <option value="all">Tutti i ruoli</option>
            <option value="renter">Renter</option>
            <option value="hubber">Hubber</option>
          </select>

          {(walletsSearch || walletsRoleFilter !== 'all') && (
            <button
              onClick={() => {
                setWalletsSearch('');
                setWalletsRoleFilter('all');
              }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Reset filtri
            </button>
          )}
          
          <button
            onClick={exportWalletsCSV}
            disabled={filteredWallets.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Esporta CSV
          </button>
        </div>
      </div>

      {/* Tabella Wallets */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Utente</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Ruolo</th>
                <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">💰 Saldo Hubber</th>
                <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">👤 Saldo Renter</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Ultimo Aggiornamento</th>
                 <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredWallets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">Nessun wallet trovato</p>
                    <p className="text-sm">I wallet appariranno qui quando gli utenti effettueranno transazioni</p>
                  </td>
                </tr>
              ) : (
                filteredWallets.map((wallet) => {
                  const userName = wallet.user 
                    ? `${wallet.user.first_name || ''} ${wallet.user.last_name || ''}`.trim() || wallet.user.email
                    : 'N/A';
                  
                  return (
                    <tr key={wallet.user_id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={wallet.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`}
                            alt={userName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-900 block">{userName}</span>
                            <span className="text-xs text-gray-500">ID: {wallet.user_id?.slice(0, 8)}...</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-600">{wallet.user?.email || 'N/A'}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          wallet.user?.role === 'hubber' || wallet.user?.roles?.includes('hubber')
                            ? 'bg-purple-100 text-purple-700'
                            : wallet.user?.role === 'admin'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {wallet.user?.role || 'renter'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`text-sm font-bold ${
                          (wallet.hubberBalanceEur || 0) > 0 ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          € {(wallet.hubberBalanceEur || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`text-sm font-bold ${
                          (wallet.renterBalanceEur || 0) > 0 ? 'text-blue-600' : 'text-gray-400'
                        }`}>
                          € {(wallet.renterBalanceEur || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-500">
                          {wallet.updated_at 
                            ? new Date(wallet.updated_at).toLocaleDateString('it-IT', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'N/A'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedWalletUser(wallet);
                            setWalletModalMode('credit');
                            setWalletType('hubber'); // ✨ NUOVO: reset a hubber
                            setWalletAmount('');
                            setWalletReason('');
                            setWalletNote('');
                            setShowWalletModal(true);
                          }}
                          className="px-3 py-1.5 bg-brand text-white text-xs font-bold rounded-lg hover:bg-brand/90 transition-colors"
                        >
                          Gestisci
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sezione Movimenti Recenti */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">📜 Ultimi Movimenti Wallet</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Utente</th>
                <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">Importo</th>
                <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">Saldo Dopo</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Descrizione</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {localWalletTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">Nessun movimento</p>
                    <p className="text-sm">I movimenti appariranno qui</p>
                  </td>
                </tr>
              ) : (
                localWalletTransactions.slice(0, 20).map((tx) => {
                  const userName = tx.user 
                    ? `${tx.user.first_name || ''} ${tx.user.last_name || ''}`.trim() || tx.user.email
                    : 'N/A';
                  const isCredit = tx.type === 'credit' || (tx.amountEur || 0) > 0;
                  
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="text-sm font-medium text-gray-900">
                          {tx.created_at ? new Date(tx.created_at).toLocaleDateString('it-IT') : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {tx.created_at ? new Date(tx.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <img 
                            src={tx.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`}
                            alt={userName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="text-sm font-medium text-gray-900">{userName}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isCredit 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {isCredit ? '↓ Entrata' : '↑ Uscita'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`text-sm font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                          {isCredit ? '+' : ''} € {Math.abs(tx.amountEur || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm text-gray-600">
                          € {(tx.balanceAfterEur || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-600 truncate block max-w-[200px]" title={tx.description}>
                          {tx.description || tx.source || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
  const renderFinancePayouts = () => {
  // Filtra payouts
  const filteredPayouts = localPayouts.filter(p => {
    // Filtro stato
    if (payoutsStatusFilter !== 'all' && p.status !== payoutsStatusFilter) return false;
    
    // Filtro ricerca
    if (payoutsSearch) {
      const search = payoutsSearch.toLowerCase();
      const userName = `${p.user?.first_name || ''} ${p.user?.last_name || ''}`.toLowerCase();
      const email = (p.user?.email || '').toLowerCase();
      return userName.includes(search) || email.includes(search);
    }
    
    return true;
  });

  // Calcola totali
  const totalPending = filteredPayouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amountEur || 0), 0);
  const totalApproved = filteredPayouts.filter(p => p.status === 'approved').reduce((sum, p) => sum + (p.amountEur || 0), 0);
  const totalProcessed = filteredPayouts.filter(p => p.status === 'processed').reduce((sum, p) => sum + (p.amountEur || 0), 0);
  const pendingCount = filteredPayouts.filter(p => p.status === 'pending').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">In Attesa</span>;
      case 'approved':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Approvato</span>;
      case 'processed':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Pagato</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Rifiutato</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{status || 'N/A'}</span>;
    }
  };

  // Azioni payout
  const handleApprovePayout = async (payoutId: string) => {
    if (!confirm('Sei sicuro di voler approvare questo payout?')) return;
    setPayoutActionLoading(true);
    try {
      await api.admin.approvePayout(payoutId);
      // Ricarica payouts
      const updated = await api.admin.getAllPayouts();
      setLocalPayouts(updated || []);
      setShowPayoutModal(false);
      setSelectedPayout(null);
    } catch (error) {
      console.error('Errore approvazione payout:', error);
      alert('Errore durante l\'approvazione');
    } finally {
      setPayoutActionLoading(false);
    }
  };

  const handleRejectPayout = async (payoutId: string) => {
    const reason = prompt('Motivo del rifiuto:');
    if (!reason) return;
    setPayoutActionLoading(true);
    try {
      await api.admin.rejectPayout(payoutId, reason);
      // Ricarica payouts
      const updated = await api.admin.getAllPayouts();
      setLocalPayouts(updated || []);
      setShowPayoutModal(false);
      setSelectedPayout(null);
    } catch (error) {
      console.error('Errore rifiuto payout:', error);
      alert('Errore durante il rifiuto');
    } finally {
      setPayoutActionLoading(false);
    }
  };

  const handleProcessPayout = async (payoutId: string) => {
    const reference = prompt('Riferimento bonifico (CRO/TRN):');
    if (!reference) return;
    setPayoutActionLoading(true);
    try {
      await api.admin.processPayout(payoutId, reference);
      // Ricarica payouts
      const updated = await api.admin.getAllPayouts();
      setLocalPayouts(updated || []);
      setShowPayoutModal(false);
      setSelectedPayout(null);
    } catch (error) {
      console.error('Errore processo payout:', error);
      alert('Errore durante il processo');
    } finally {
      setPayoutActionLoading(false);
    }
  };

  // Export CSV
  const exportPayoutsCSV = () => {
    const headers = ['Data Richiesta', 'Utente', 'Email', 'Importo', 'Stato', 'Data Approvazione', 'Data Pagamento', 'Riferimento'];
    const rows = filteredPayouts.map(p => [
      p.created_at ? new Date(p.created_at).toLocaleDateString('it-IT') : '',
      `${p.user?.first_name || ''} ${p.user?.last_name || ''}`.trim(),
      p.user?.email || '',
      (p.amountEur || 0).toFixed(2),
      p.status || '',
      p.approved_at ? new Date(p.approved_at).toLocaleDateString('it-IT') : '',
      p.processed_at ? new Date(p.processed_at).toLocaleDateString('it-IT') : '',
      p.transfer_reference || ''
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `payouts_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

// Genera file SEPA XML per bonifici multipli
  const generateSEPAFile = () => {
    // Prendi solo i payout approvati (pronti per il bonifico)
    const approvedPayouts = localPayouts.filter(p => p.status === 'approved');
    
    if (approvedPayouts.length === 0) {
      alert('Nessun payout approvato da processare.');
      return;
    }

    // Calcola totale
    const totalAmount = approvedPayouts.reduce((sum, p) => sum + (p.amountEur || 0), 0);
    
    // Data e ID univoci
    const now = new Date();
    const msgId = `RENTHUBBER-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Date.now()}`;
    const pmtInfId = `PMT-${Date.now()}`;
    const creationDateTime = now.toISOString();
    const executionDate = now.toISOString().split('T')[0];

    // Costruisci XML SEPA (pain.001.001.03)
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${msgId}</MsgId>
      <CreDtTm>${creationDateTime}</CreDtTm>
      <NbOfTxs>${approvedPayouts.length}</NbOfTxs>
      <CtrlSum>${totalAmount.toFixed(2)}</CtrlSum>
      <InitgPty>
        <Nm>RentHubber SRL</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${pmtInfId}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <NbOfTxs>${approvedPayouts.length}</NbOfTxs>
      <CtrlSum>${totalAmount.toFixed(2)}</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
      </PmtTpInf>
      <ReqdExctnDt>${executionDate}</ReqdExctnDt>
      <Dbtr>
        <Nm>RentHubber SRL</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>IT00X0000000000000000000000</IBAN>
        </Id>
      </DbtrAcct>
      <DbtrAgt>
        <FinInstnId>
          <BIC>XXXXXXXXXXX</BIC>
        </FinInstnId>
      </DbtrAgt>
      <ChrgBr>SLEV</ChrgBr>
`;

    // Aggiungi ogni transazione
    approvedPayouts.forEach((payout, index) => {
      const iban = payout.user?.bank_details?.iban || 'IT00X0000000000000000000000';
      const bic = payout.user?.bank_details?.bicSwift || 'XXXXXXXXXXX';
      const accountHolder = payout.user?.bank_details?.accountHolder || 
        `${payout.user?.first_name || ''} ${payout.user?.last_name || ''}`.trim() || 'N/A';
      const amount = (payout.amountEur || 0).toFixed(2);
      const endToEndId = `E2E-${payout.id?.slice(0, 8) || index}`;
      
      xml += `
      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>${endToEndId}</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="EUR">${amount}</InstdAmt>
        </Amt>
        <CdtrAgt>
          <FinInstnId>
            <BIC>${bic}</BIC>
          </FinInstnId>
        </CdtrAgt>
        <Cdtr>
          <Nm>${accountHolder}</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>${iban}</IBAN>
          </Id>
        </CdtrAcct>
        <RmtInf>
          <Ustrd>Payout RentHubber - ${payout.id?.slice(0, 8) || 'N/A'}</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>`;
    });

    xml += `
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;

    // Download file
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bonifici_sepa_${executionDate}.xml`;
    link.click();

    alert(`File SEPA generato con ${approvedPayouts.length} bonifici per un totale di €${totalAmount.toFixed(2)}.\n\n⚠️ Ricorda di aggiornare l'IBAN e BIC della tua azienda nel file prima di caricarlo in banca!`);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">In Attesa</p>
              <p className="text-xl font-bold text-gray-900">€ {totalPending.toFixed(2)}</p>
              <p className="text-xs text-gray-400">{pendingCount} richieste</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Approvati</p>
              <p className="text-xl font-bold text-gray-900">€ {totalApproved.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Landmark className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pagati</p>
              <p className="text-xl font-bold text-gray-900">€ {totalProcessed.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Totale Richieste</p>
              <p className="text-xl font-bold text-gray-900">{filteredPayouts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca per nome o email..."
                value={payoutsSearch}
                onChange={(e) => setPayoutsSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
          </div>
          
          <select
            value={payoutsStatusFilter}
            onChange={(e) => setPayoutsStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          >
            <option value="all">Tutti gli stati</option>
            <option value="pending">In Attesa</option>
            <option value="approved">Approvati</option>
            <option value="processed">Pagati</option>
            <option value="rejected">Rifiutati</option>
          </select>

          {(payoutsSearch || payoutsStatusFilter !== 'all') && (
            <button
              onClick={() => {
                setPayoutsSearch('');
                setPayoutsStatusFilter('all');
              }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Reset filtri
            </button>
          )}
          
          <button
            onClick={exportPayoutsCSV}
            disabled={filteredPayouts.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Esporta CSV
          </button>
          <button
            onClick={generateSEPAFile}
            disabled={localPayouts.filter(p => p.status === 'approved').length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Genera file SEPA XML per bonifici multipli (solo payout approvati)"
          >
            <Landmark className="w-4 h-4" />
            Genera SEPA XML
          </button>
        </div>
      </div>

      {/* Tabella */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Hubber</th>
                <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">Importo</th>
                <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Stato</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Riferimento</th>
                <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <Landmark className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">Nessuna richiesta di payout</p>
                    <p className="text-sm">Le richieste appariranno qui quando gli Hubber chiederanno un prelievo</p>
                  </td>
                </tr>
              ) : (
                filteredPayouts.map((payout) => {
                  const userName = payout.user 
                    ? `${payout.user.first_name || ''} ${payout.user.last_name || ''}`.trim() || payout.user.email
                    : 'N/A';
                  
                  return (
                    <tr key={payout.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="text-sm font-medium text-gray-900">
                          {payout.created_at ? new Date(payout.created_at).toLocaleDateString('it-IT') : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {payout.created_at ? new Date(payout.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={payout.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`}
                            alt={userName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-900 block">{userName}</span>
                            <span className="text-xs text-gray-500">{payout.user?.email || ''}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-lg font-bold text-gray-900">
                          € {(payout.amountEur || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {getStatusBadge(payout.status)}
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-600 font-mono">
                          {payout.transfer_reference || '-'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedPayout(payout);
                              setShowPayoutModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors"
                            title="Dettagli"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {payout.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprovePayout(payout.id)}
                                disabled={payoutActionLoading}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Approva"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRejectPayout(payout.id)}
                                disabled={payoutActionLoading}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Rifiuta"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {payout.status === 'approved' && (
                            <button
                              onClick={() => handleProcessPayout(payout.id)}
                              disabled={payoutActionLoading}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Segna come Pagato"
                            >
                              <Landmark className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dettaglio Payout */}
      {showPayoutModal && selectedPayout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Dettaglio Payout</h3>
              <button
                onClick={() => {
                  setShowPayoutModal(false);
                  setSelectedPayout(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Hubber Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <img 
                  src={selectedPayout.user?.avatar_url || `https://ui-avatars.com/api/?name=User&background=random`}
                  alt="User"
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div>
                  <p className="font-bold text-gray-900">
                    {`${selectedPayout.user?.first_name || ''} ${selectedPayout.user?.last_name || ''}`.trim() || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">{selectedPayout.user?.email || 'N/A'}</p>
                </div>
              </div>

              {/* Importo */}
              <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Importo Richiesto</p>
                <p className="text-4xl font-bold text-green-600">€ {(selectedPayout.amountEur || 0).toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-2">{selectedPayout.currency || 'EUR'}</p>
              </div>

              {/* Dettagli */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Stato</p>
                  {getStatusBadge(selectedPayout.status)}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Data Richiesta</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedPayout.created_at ? new Date(selectedPayout.created_at).toLocaleString('it-IT') : 'N/A'}
                  </p>
                </div>
                {selectedPayout.approved_at && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Data Approvazione</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedPayout.approved_at).toLocaleString('it-IT')}
                    </p>
                  </div>
                )}
                {selectedPayout.processed_at && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Data Pagamento</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedPayout.processed_at).toLocaleString('it-IT')}
                    </p>
                  </div>
                )}
                {selectedPayout.transfer_reference && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 uppercase mb-1">Riferimento Bonifico</p>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                      {selectedPayout.transfer_reference}
                    </code>
                  </div>
                )}
                {selectedPayout.rejection_reason && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 uppercase mb-1">Motivo Rifiuto</p>
                    <p className="text-sm text-red-600">{selectedPayout.rejection_reason}</p>
                  </div>
                )}
                {selectedPayout.admin_notes && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 uppercase mb-1">Note Admin</p>
                    <p className="text-sm text-gray-600">{selectedPayout.admin_notes}</p>
                  </div>
                )}
              </div>

              {/* Dati Bancari */}
              {selectedPayout.user?.bank_details && (
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-xs text-blue-600 uppercase font-bold mb-2">Dati Bancari</p>
                  <div className="space-y-1 text-sm">
                    <p><strong>IBAN:</strong> {selectedPayout.user.bank_details.iban || 'N/A'}</p>
                    <p><strong>Intestatario:</strong> {selectedPayout.user.bank_details.accountHolder || 'N/A'}</p>
                    <p><strong>Banca:</strong> {selectedPayout.user.bank_details.bankName || 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer con Azioni */}
            <div className="flex justify-between gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowPayoutModal(false);
                  setSelectedPayout(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors"
              >
                Chiudi
              </button>
              
              <div className="flex gap-2">
                {selectedPayout.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleRejectPayout(selectedPayout.id)}
                      disabled={payoutActionLoading}
                      className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      Rifiuta
                    </button>
                    <button
                      onClick={() => handleApprovePayout(selectedPayout.id)}
                      disabled={payoutActionLoading}
                      className="px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      Approva
                    </button>
                  </>
                )}
                {selectedPayout.status === 'approved' && (
                  <button
                    onClick={() => handleProcessPayout(selectedPayout.id)}
                    disabled={payoutActionLoading}
                    className="px-4 py-2 bg-brand text-white hover:bg-brand/90 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Segna come Pagato
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const renderFinanceSettings = () => {
  // Salva impostazioni (per ora in localStorage, poi su Supabase)
  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      // Salva in localStorage per ora
      localStorage.setItem('financeSettings', JSON.stringify(financeSettings));
      
      // TODO: Salvare su Supabase quando serve
      // await api.admin.updateFinanceSettings(financeSettings);
      
      alert('✅ Impostazioni salvate!');
    } catch (error) {
      console.error('Errore salvataggio impostazioni:', error);
      alert('❌ Errore durante il salvataggio');
    } finally {
      setSettingsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-2xl p-6 text-white">
        <h3 className="text-xl font-bold mb-2">🔧 Impostazioni Finanziarie</h3>
        <p className="text-gray-300">Configura le opzioni di pagamento, payout e rimborsi della piattaforma</p>
      </div>

      {/* Sezione Payout */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h4 className="font-bold text-gray-900 mb-4 flex items-center">
          <Landmark className="w-5 h-5 mr-2 text-brand" /> Impostazioni Payout
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Importo Minimo Payout (€)
            </label>
            <input
              type="number"
              min="0"
              step="10"
              value={financeSettings.minPayoutAmount}
              onChange={(e) => setFinanceSettings({ ...financeSettings, minPayoutAmount: Number(e.target.value) })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Gli hubber potranno richiedere payout solo sopra questa soglia</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frequenza Payout
            </label>
            <select
              value={financeSettings.payoutSchedule}
              onChange={(e) => setFinanceSettings({ ...financeSettings, payoutSchedule: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white"
            >
              <option value="manual">Manuale (su richiesta)</option>
              <option value="weekly">Automatico settimanale</option>
              <option value="monthly">Automatico mensile</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Quando processare automaticamente i payout approvati</p>
          </div>
        </div>
      </div>

      {/* Sezione Rimborsi */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h4 className="font-bold text-gray-900 mb-4 flex items-center">
          <XCircle className="w-5 h-5 mr-2 text-brand" /> Impostazioni Rimborsi
        </h4>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
            <div>
              <span className="font-medium text-gray-900">Approvazione Automatica Rimborsi</span>
              <p className="text-xs text-gray-500 mt-1">Approva automaticamente i rimborsi sotto una certa soglia</p>
            </div>
            <input
              type="checkbox"
              checked={financeSettings.autoApproveRefunds}
              onChange={(e) => setFinanceSettings({ ...financeSettings, autoApproveRefunds: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-brand focus:ring-brand cursor-pointer"
            />
          </label>
          
          {financeSettings.autoApproveRefunds && (
            <div className="ml-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <label className="block text-sm font-medium text-yellow-800 mb-2">
                Soglia Auto-Approvazione (€)
              </label>
              <input
                type="number"
                min="0"
                step="10"
                value={financeSettings.autoApproveRefundsMaxAmount}
                onChange={(e) => setFinanceSettings({ ...financeSettings, autoApproveRefundsMaxAmount: Number(e.target.value) })}
                className="w-full max-w-xs px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none bg-white"
              />
              <p className="text-xs text-yellow-700 mt-1">Rimborsi fino a €{financeSettings.autoApproveRefundsMaxAmount} verranno approvati automaticamente</p>
            </div>
          )}
        </div>
      </div>

      {/* Sezione Metodi Pagamento */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h4 className="font-bold text-gray-900 mb-4 flex items-center">
          <CreditCard className="w-5 h-5 mr-2 text-brand" /> Metodi di Pagamento
        </h4>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <span className="font-medium text-gray-900">Stripe</span>
                <p className="text-xs text-gray-500">Carte di credito/debito</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={financeSettings.stripeEnabled}
              onChange={(e) => setFinanceSettings({ ...financeSettings, stripeEnabled: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-brand focus:ring-brand cursor-pointer"
            />
          </label>
          
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <span className="font-medium text-gray-900">Wallet Interno</span>
                <p className="text-xs text-gray-500">Saldo prepagato utenti</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={financeSettings.walletEnabled}
              onChange={(e) => setFinanceSettings({ ...financeSettings, walletEnabled: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-brand focus:ring-brand cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Sezione Valuta */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h4 className="font-bold text-gray-900 mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-brand" /> Valuta
        </h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valuta Predefinita
          </label>
          <select
            value={financeSettings.defaultCurrency}
            onChange={(e) => setFinanceSettings({ ...financeSettings, defaultCurrency: e.target.value })}
            className="w-full max-w-xs px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white"
          >
            <option value="EUR">🇪🇺 Euro (EUR)</option>
            <option value="USD">🇺🇸 Dollaro USA (USD)</option>
            <option value="GBP">🇬🇧 Sterlina (GBP)</option>
            <option value="CHF">🇨🇭 Franco Svizzero (CHF)</option>
          </select>
        </div>
      </div>

      {/* Riepilogo Commissioni Attuali */}
      <div className="bg-gradient-to-r from-brand/5 to-orange-50 rounded-2xl border border-brand/20 p-6">
        <h4 className="font-bold text-gray-900 mb-4 flex items-center">
          <Percent className="w-5 h-5 mr-2 text-brand" /> Commissioni Attuali
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-xl text-center shadow-sm">
            <p className="text-2xl font-bold text-brand">{renterFee}%</p>
            <p className="text-xs text-gray-500">Fee Renter</p>
          </div>
          <div className="p-4 bg-white rounded-xl text-center shadow-sm">
            <p className="text-2xl font-bold text-orange-600">{hubberFee}%</p>
            <p className="text-xs text-gray-500">Fee Hubber</p>
          </div>
          <div className="p-4 bg-white rounded-xl text-center shadow-sm">
            <p className="text-2xl font-bold text-amber-600">{superHubberFee}%</p>
            <p className="text-xs text-gray-500">Fee SuperHubber</p>
          </div>
          <div className="p-4 bg-white rounded-xl text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-700">€{fixedFee}</p>
            <p className="text-xs text-gray-500">Fee Fissa</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-4 text-center">
          Per modificare le commissioni vai in <strong>Configurazioni → Commissioni Piattaforma</strong>
        </p>
      </div>

      {/* Salva */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={settingsSaving}
          className="flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-xl font-bold hover:bg-brand/90 transition-colors disabled:opacity-50 shadow-lg"
        >
          {settingsSaving ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              Salvataggio...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Salva Impostazioni
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const renderFinanceReports = () => {
  // Genera CSV generico
  const generateCSV = (headers: string[], rows: any[][], filename: string) => {
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  // Filtra per date
  const filterByDate = (items: any[], dateField: string) => {
    return items.filter(item => {
      const itemDate = new Date(item[dateField]);
      if (reportDateFrom) {
        const from = new Date(reportDateFrom);
        if (itemDate < from) return false;
      }
      if (reportDateTo) {
        const to = new Date(reportDateTo);
        to.setHours(23, 59, 59, 999);
        if (itemDate > to) return false;
      }
      return true;
    });
  };

  // Report Transazioni
  const generateTransactionsReport = () => {
    setReportGenerating(true);
    try {
      const filtered = filterByDate(localPayments, 'created_at');
      const headers = ['Data', 'ID Pagamento', 'Renter', 'Email Renter', 'Hubber', 'Email Hubber', 'Totale €', 'Commissione €', 'Netto Hubber €', 'Provider', 'Stato'];
      const rows = filtered.map(p => [
        p.created_at ? new Date(p.created_at).toLocaleDateString('it-IT') : '',
        p.provider_payment_id || p.id || '',
        `${p.renter?.first_name || ''} ${p.renter?.last_name || ''}`.trim(),
        p.renter?.email || '',
        `${p.hubber?.first_name || ''} ${p.hubber?.last_name || ''}`.trim(),
        p.hubber?.email || '',
        Number(p.amount_total || 0).toFixed(2),
        Number(p.platform_fee || 0).toFixed(2),
        Number(p.hubber_net_amount || 0).toFixed(2),
        p.provider || '',
        p.status || ''
      ]);
      
      const dateStr = new Date().toISOString().split('T')[0];
      generateCSV(headers, rows, `transazioni_${dateStr}.csv`);
      alert(`✅ Report generato: ${rows.length} transazioni`);
    } finally {
      setReportGenerating(false);
    }
  };

  // Report Prenotazioni
  const generateBookingsReport = () => {
    setReportGenerating(true);
    try {
      const filtered = filterByDate(localBookings, 'createdAt');
      const headers = ['Data Creazione', 'ID', 'Annuncio', 'Renter', 'Hubber', 'Check-in', 'Check-out', 'Totale €', 'Commissione €', 'Stato'];
      const rows = filtered.map(b => [
        b.createdAt ? new Date(b.createdAt).toLocaleDateString('it-IT') : '',
        b.id?.slice(0, 8) || '',
        b.listingTitle || b.listing?.title || '',
        b.renterName || '',
        b.hostName || '',
        b.startDate ? new Date(b.startDate).toLocaleDateString('it-IT') : '',
        b.endDate ? new Date(b.endDate).toLocaleDateString('it-IT') : '',
        Number(b.totalPrice || 0).toFixed(2),
        Number(b.commission || 0).toFixed(2),
        b.status || ''
      ]);
      
      const dateStr = new Date().toISOString().split('T')[0];
      generateCSV(headers, rows, `prenotazioni_${dateStr}.csv`);
      alert(`✅ Report generato: ${rows.length} prenotazioni`);
    } finally {
      setReportGenerating(false);
    }
  };

  // Report Utenti
  const generateUsersReport = () => {
    setReportGenerating(true);
    try {
      const filtered = filterByDate(localUsers, 'hubberSince');
      const headers = ['ID', 'Nome', 'Email', 'Telefono', 'Ruolo', 'SuperHubber', 'Rating', 'Stato', 'Verifica', 'Data Iscrizione'];
      const rows = filtered.map(u => [
        u.id?.slice(0, 8) || '',
        u.name || '',
        u.email || '',
        u.phoneNumber || '',
        u.role || '',
        u.isSuperHubber ? 'Sì' : 'No',
        u.rating?.toFixed(1) || 'N/A',
        u.isSuspended ? 'Sospeso' : 'Attivo',
        u.verificationStatus || '',
        u.hubberSince ? new Date(u.hubberSince).toLocaleDateString('it-IT') : ''
      ]);
      
      const dateStr = new Date().toISOString().split('T')[0];
      generateCSV(headers, rows, `utenti_${dateStr}.csv`);
      alert(`✅ Report generato: ${rows.length} utenti`);
    } finally {
      setReportGenerating(false);
    }
  };

  // Report Rimborsi
  const generateRefundsReport = () => {
    setReportGenerating(true);
    try {
      const filtered = filterByDate(localRefunds, 'requested_at');
      const headers = ['Data Richiesta', 'ID', 'Renter', 'Hubber', 'Importo Originale €', 'Rimborso €', 'Policy', 'Stato', 'Metodo', 'Motivo'];
      const rows = filtered.map(r => [
        r.requested_at ? new Date(r.requested_at).toLocaleDateString('it-IT') : '',
        r.id?.slice(0, 8) || '',
        `${r.renter?.first_name || ''} ${r.renter?.last_name || ''}`.trim(),
        `${r.hubber?.first_name || ''} ${r.hubber?.last_name || ''}`.trim(),
        Number(r.original_amount || 0).toFixed(2),
        Number(r.refund_amount || 0).toFixed(2),
        r.cancellation_policy || '',
        r.status || '',
        r.refund_method || '',
        r.cancellation_reason || ''
      ]);
      
      const dateStr = new Date().toISOString().split('T')[0];
      generateCSV(headers, rows, `rimborsi_${dateStr}.csv`);
      alert(`✅ Report generato: ${rows.length} rimborsi`);
    } finally {
      setReportGenerating(false);
    }
  };

  // Report Guadagni (aggregato per mese)
  const generateEarningsReport = () => {
    setReportGenerating(true);
    try {
      const filtered = filterByDate(localPayments.filter(p => p.status === 'completed' || p.status === 'succeeded'), 'created_at');
      
      // Aggrega per mese
      const monthlyData: { [key: string]: { revenue: number; fees: number; count: number } } = {};
      
      filtered.forEach(p => {
        const date = new Date(p.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { revenue: 0, fees: 0, count: 0 };
        }
        
        monthlyData[monthKey].revenue += Number(p.amount_total || 0);
        monthlyData[monthKey].fees += Number(p.platform_fee || 0);
        monthlyData[monthKey].count += 1;
      });
      
      const headers = ['Mese', 'Transazioni', 'Volume Totale €', 'Commissioni €', 'Media per Transazione €'];
      const rows = Object.entries(monthlyData)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, data]) => [
          month,
          data.count,
          data.revenue.toFixed(2),
          data.fees.toFixed(2),
          (data.revenue / data.count).toFixed(2)
        ]);
      
      // Aggiungi riga totale
      const totals = Object.values(monthlyData).reduce(
        (acc, curr) => ({
          revenue: acc.revenue + curr.revenue,
          fees: acc.fees + curr.fees,
          count: acc.count + curr.count
        }),
        { revenue: 0, fees: 0, count: 0 }
      );
      rows.push(['TOTALE', totals.count, totals.revenue.toFixed(2), totals.fees.toFixed(2), totals.count > 0 ? (totals.revenue / totals.count).toFixed(2) : '0.00']);
      
      const dateStr = new Date().toISOString().split('T')[0];
      generateCSV(headers, rows, `guadagni_${dateStr}.csv`);
      alert(`✅ Report generato: ${Object.keys(monthlyData).length} mesi`);
    } finally {
      setReportGenerating(false);
    }
  };

  // Genera report in base al tipo selezionato
  const handleGenerateReport = () => {
    switch (reportType) {
      case 'transactions':
        generateTransactionsReport();
        break;
      case 'bookings':
        generateBookingsReport();
        break;
      case 'users':
        generateUsersReport();
        break;
      case 'refunds':
        generateRefundsReport();
        break;
      case 'earnings':
        generateEarningsReport();
        break;
    }
  };

  // Report types configuration
  const reportTypes = [
    { id: 'transactions', label: '💳 Transazioni', description: 'Tutti i pagamenti con dettagli renter/hubber', icon: CreditCard, count: localPayments.length },
    { id: 'bookings', label: '📅 Prenotazioni', description: 'Tutte le prenotazioni con stato e importi', icon: CalendarCheck, count: localBookings.length },
    { id: 'users', label: '👥 Utenti', description: 'Lista completa utenti con ruoli e verifica', icon: Users, count: localUsers.length },
    { id: 'refunds', label: '↩️ Rimborsi', description: 'Tutti i rimborsi richiesti e processati', icon: XCircle, count: localRefunds.length },
    { id: 'earnings', label: '📊 Guadagni', description: 'Report aggregato commissioni per mese', icon: TrendingUp, count: null },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
        <h3 className="text-xl font-bold mb-2">📈 Generatore Report</h3>
        <p className="text-purple-100">Esporta i dati della piattaforma in formato CSV per analisi e contabilità</p>
      </div>

      {/* Selezione Tipo Report */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h4 className="font-bold text-gray-900 mb-4">1. Seleziona Tipo di Report</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setReportType(type.id as any)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  reportType === type.id
                    ? 'border-brand bg-brand/5'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${reportType === type.id ? 'bg-brand/10' : 'bg-gray-100'}`}>
                    <Icon className={`w-5 h-5 ${reportType === type.id ? 'text-brand' : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-bold ${reportType === type.id ? 'text-brand' : 'text-gray-900'}`}>
                      {type.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                    {type.count !== null && (
                      <p className="text-xs text-gray-400 mt-2">{type.count} record disponibili</p>
                    )}
                  </div>
                  {reportType === type.id && (
                    <CheckCircle className="w-5 h-5 text-brand" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtri Data */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h4 className="font-bold text-gray-900 mb-4">2. Filtro Periodo (opzionale)</h4>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Da:</span>
            <input
              type="date"
              value={reportDateFrom}
              onChange={(e) => setReportDateFrom(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">A:</span>
            <input
              type="date"
              value={reportDateTo}
              onChange={(e) => setReportDateTo(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
          {(reportDateFrom || reportDateTo) && (
            <button
              onClick={() => {
                setReportDateFrom('');
                setReportDateTo('');
              }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Reset date
            </button>
          )}
          
          {/* Quick filters */}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => {
                const now = new Date();
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                setReportDateFrom(firstDay.toISOString().split('T')[0]);
                setReportDateTo(now.toISOString().split('T')[0]);
              }}
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Questo mese
            </button>
            <button
              onClick={() => {
                const now = new Date();
                const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
                setReportDateFrom(firstDay.toISOString().split('T')[0]);
                setReportDateTo(lastDay.toISOString().split('T')[0]);
              }}
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Mese scorso
            </button>
            <button
              onClick={() => {
                const now = new Date();
                const firstDay = new Date(now.getFullYear(), 0, 1);
                setReportDateFrom(firstDay.toISOString().split('T')[0]);
                setReportDateTo(now.toISOString().split('T')[0]);
              }}
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Quest'anno
            </button>
          </div>
        </div>
      </div>

      {/* Genera Report */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h4 className="font-bold text-gray-900 mb-4">3. Genera Report</h4>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Tipo selezionato: <span className="font-bold text-brand">{reportTypes.find(r => r.id === reportType)?.label}</span>
            </p>
            {(reportDateFrom || reportDateTo) && (
              <p className="text-xs text-gray-500 mt-1">
                Periodo: {reportDateFrom || 'inizio'} → {reportDateTo || 'oggi'}
              </p>
            )}
          </div>
          <button
            onClick={handleGenerateReport}
            disabled={reportGenerating}
            className="flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-xl font-bold hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {reportGenerating ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                Generazione...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Genera CSV
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <h4 className="font-bold text-blue-900 mb-2 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" /> Informazioni sui Report
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• I report vengono generati in formato <strong>CSV</strong> compatibile con Excel</li>
          <li>• I dati sono filtrabili per periodo usando i campi data sopra</li>
          <li>• Il report <strong>Guadagni</strong> aggrega automaticamente i dati per mese</li>
          <li>• I file vengono scaricati automaticamente sul tuo dispositivo</li>
        </ul>
      </div>

      {/* Statistiche Rapide */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h4 className="font-bold text-gray-900 mb-4">📊 Riepilogo Dati Disponibili</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl text-center">
            <p className="text-3xl font-bold text-gray-900">{localPayments.length}</p>
            <p className="text-sm text-gray-500">Transazioni</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl text-center">
            <p className="text-3xl font-bold text-gray-900">{localBookings.length}</p>
            <p className="text-sm text-gray-500">Prenotazioni</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl text-center">
            <p className="text-3xl font-bold text-gray-900">{localUsers.length}</p>
            <p className="text-sm text-gray-500">Utenti</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl text-center">
            <p className="text-3xl font-bold text-gray-900">{localRefunds.length}</p>
            <p className="text-sm text-gray-500">Rimborsi</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const renderFinanceRefunds = () => {
  // Filtra rimborsi
  const filteredRefunds = localRefunds.filter(r => {
    // Filtro stato
    if (refundsStatusFilter !== 'all' && r.status !== refundsStatusFilter) return false;
    
    // Filtro data
    if (refundsDateFrom) {
      const refundDate = new Date(r.requested_at);
      const fromDate = new Date(refundsDateFrom);
      if (refundDate < fromDate) return false;
    }
    if (refundsDateTo) {
      const refundDate = new Date(r.requested_at);
      const toDate = new Date(refundsDateTo);
      toDate.setHours(23, 59, 59, 999);
      if (refundDate > toDate) return false;
    }
    
    // Filtro ricerca
    if (refundsSearch) {
      const search = refundsSearch.toLowerCase();
      const renterName = `${r.renter?.first_name || ''} ${r.renter?.last_name || ''}`.toLowerCase();
      const hubberName = `${r.hubber?.first_name || ''} ${r.hubber?.last_name || ''}`.toLowerCase();
      return renterName.includes(search) || hubberName.includes(search) || r.id?.toLowerCase().includes(search);
    }
    
    return true;
  });

  // Helper per badge stato
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">⏳ In Attesa</span>;
      case 'approved':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">✓ Approvato</span>;
      case 'processed':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">✅ Rimborsato</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">✗ Rifiutato</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  // Helper per policy cancellazione
  const getPolicyBadge = (policy: string) => {
    switch (policy) {
      case 'flexible':
        return <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">Flessibile</span>;
      case 'moderate':
        return <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded text-xs">Moderata</span>;
      case 'strict':
        return <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs">Rigida</span>;
      default:
        return <span className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded text-xs">{policy || 'N/A'}</span>;
    }
  };

  // Helper nome utente
  const getUserName = (user: any) => {
    if (!user) return 'N/A';
    return user.public_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Utente';
  };

  // Azioni rimborso
  const handleApproveRefund = async (refundId: string) => {
    if (!confirm('Sei sicuro di voler approvare questo rimborso?')) return;
    setRefundActionLoading(true);
    try {
      await api.admin.approveRefund(refundId, currentUser?.id || '');
      const updated = await api.admin.getAllRefunds();
      setLocalRefunds(updated || []);
      const stats = await api.admin.getRefundStats();
      setRefundStats(stats);
      setShowRefundModal(false);
      setSelectedRefund(null);
      alert('✅ Rimborso approvato!');
    } catch (error) {
      console.error('Errore approvazione rimborso:', error);
      alert('Errore durante l\'approvazione');
    } finally {
      setRefundActionLoading(false);
    }
  };

  const handleRejectRefund = async (refundId: string) => {
    const reason = prompt('Motivo del rifiuto:');
    if (!reason) return;
    setRefundActionLoading(true);
    try {
      await api.admin.rejectRefund(refundId, currentUser?.id || '', reason);
      const updated = await api.admin.getAllRefunds();
      setLocalRefunds(updated || []);
      const stats = await api.admin.getRefundStats();
      setRefundStats(stats);
      setShowRefundModal(false);
      setSelectedRefund(null);
      alert('✅ Rimborso rifiutato');
    } catch (error) {
      console.error('Errore rifiuto rimborso:', error);
      alert('Errore durante il rifiuto');
    } finally {
      setRefundActionLoading(false);
    }
  };

  const handleProcessRefund = async (refundId: string, method: 'wallet' | 'stripe' | 'manual') => {
    const methodLabel = method === 'wallet' ? 'wallet utente' : method === 'stripe' ? 'Stripe' : 'manuale';
    if (!confirm(`Processare il rimborso su ${methodLabel}?`)) return;
    
    let stripeRefundId = undefined;
    if (method === 'stripe') {
      stripeRefundId = prompt('ID Rimborso Stripe (opzionale):') || undefined;
    }
    
    setRefundActionLoading(true);
    try {
      await api.admin.processRefund(refundId, currentUser?.id || '', method, stripeRefundId);
      const updated = await api.admin.getAllRefunds();
      setLocalRefunds(updated || []);
      const stats = await api.admin.getRefundStats();
      setRefundStats(stats);
      setShowRefundModal(false);
      setSelectedRefund(null);
      alert(`✅ Rimborso processato su ${methodLabel}!`);
    } catch (error) {
      console.error('Errore processo rimborso:', error);
      alert('Errore durante il processo');
    } finally {
      setRefundActionLoading(false);
    }
  };

  // Export CSV
  const exportRefundsCSV = () => {
    const headers = ['Data', 'ID', 'Renter', 'Hubber', 'Importo Originale', 'Importo Rimborso', 'Policy', 'Stato', 'Motivo'];
    const rows = filteredRefunds.map(r => [
      r.requested_at ? new Date(r.requested_at).toLocaleDateString('it-IT') : '',
      r.id?.slice(0, 8) || '',
      getUserName(r.renter),
      getUserName(r.hubber),
      Number(r.original_amount || 0).toFixed(2),
      Number(r.refund_amount || 0).toFixed(2),
      r.cancellation_policy || '',
      r.status || '',
      r.cancellation_reason || ''
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rimborsi_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Reset filtri
  const resetFilters = () => {
    setRefundsSearch('');
    setRefundsStatusFilter('all');
    setRefundsDateFrom('');
    setRefundsDateTo('');
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <XCircle className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Totali</p>
              <p className="text-xl font-bold text-gray-900">{refundStats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-yellow-600">In Attesa</p>
              <p className="text-xl font-bold text-yellow-700">{refundStats.pending}</p>
              <p className="text-xs text-yellow-500">€ {refundStats.pendingAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600">Approvati</p>
              <p className="text-xl font-bold text-blue-700">{refundStats.approved}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600">Processati</p>
              <p className="text-xl font-bold text-green-700">{refundStats.processed}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-purple-600">Totale Rimborsato</p>
              <p className="text-xl font-bold text-purple-700">€ {refundStats.totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca per nome utente..."
                value={refundsSearch}
                onChange={(e) => setRefundsSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Da:</span>
            <input
              type="date"
              value={refundsDateFrom}
              onChange={(e) => setRefundsDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">A:</span>
            <input
              type="date"
              value={refundsDateTo}
              onChange={(e) => setRefundsDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
          
          <select
            value={refundsStatusFilter}
            onChange={(e) => setRefundsStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            <option value="all">Tutti gli stati</option>
            <option value="pending">⏳ In Attesa</option>
            <option value="approved">✓ Approvati</option>
            <option value="processed">✅ Processati</option>
            <option value="rejected">✗ Rifiutati</option>
          </select>

          {(refundsSearch || refundsStatusFilter !== 'all' || refundsDateFrom || refundsDateTo) && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Reset
            </button>
          )}
          
          <button
            onClick={exportRefundsCSV}
            disabled={filteredRefunds.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>
      </div>

      {/* Tabella */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Renter</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Hubber</th>
                <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">Originale</th>
                <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">Rimborso</th>
                <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Policy</th>
                <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Stato</th>
                <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRefunds.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    <XCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">Nessun rimborso trovato</p>
                    <p className="text-sm">I rimborsi appariranno qui quando verranno richiesti</p>
                  </td>
                </tr>
              ) : (
                filteredRefunds.map((refund) => (
                  <tr key={refund.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="text-sm font-medium text-gray-900">
                        {refund.requested_at ? new Date(refund.requested_at).toLocaleDateString('it-IT') : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {refund.requested_at ? new Date(refund.requested_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <img 
                          src={refund.renter?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(getUserName(refund.renter))}&background=10B981&color=fff`}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900 block">{getUserName(refund.renter)}</span>
                          <span className="text-xs text-gray-500">{refund.renter?.email || ''}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <img 
                          src={refund.hubber?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(getUserName(refund.hubber))}&background=6366F1&color=fff`}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900 block">{getUserName(refund.hubber)}</span>
                          <span className="text-xs text-gray-500">{refund.hubber?.email || ''}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-sm text-gray-600">€ {Number(refund.original_amount || 0).toFixed(2)}</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-sm font-bold text-green-600">€ {Number(refund.refund_amount || 0).toFixed(2)}</span>
                    </td>
                    <td className="p-4 text-center">
                      {getPolicyBadge(refund.cancellation_policy)}
                    </td>
                    <td className="p-4 text-center">
                      {getStatusBadge(refund.status)}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedRefund(refund);
                            setShowRefundModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors"
                          title="Dettagli"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {refund.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveRefund(refund.id)}
                              disabled={refundActionLoading}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Approva"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectRefund(refund.id)}
                              disabled={refundActionLoading}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Rifiuta"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {refund.status === 'approved' && (
                          <button
                            onClick={() => handleProcessRefund(refund.id, 'wallet')}
                            disabled={refundActionLoading}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Processa su Wallet"
                          >
                            <Wallet className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50 text-sm text-gray-500">
          {filteredRefunds.length} rimborsi
        </div>
      </div>

      {/* Modal Dettaglio Rimborso */}
      {showRefundModal && selectedRefund && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Dettaglio Rimborso</h3>
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setSelectedRefund(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Stato */}
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Stato:</span>
                {getStatusBadge(selectedRefund.status)}
              </div>

              {/* Utenti */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-xl">
                  <p className="text-xs font-bold text-green-600 uppercase mb-2">Renter (riceve rimborso)</p>
                  <div className="flex items-center gap-3">
                    <img 
                      src={selectedRefund.renter?.avatar_url || `https://ui-avatars.com/api/?name=R&background=10B981&color=fff`}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="text-sm font-medium">{getUserName(selectedRefund.renter)}</p>
                      <p className="text-xs text-gray-500">{selectedRefund.renter?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl">
                  <p className="text-xs font-bold text-purple-600 uppercase mb-2">Hubber</p>
                  <div className="flex items-center gap-3">
                    <img 
                      src={selectedRefund.hubber?.avatar_url || `https://ui-avatars.com/api/?name=H&background=6366F1&color=fff`}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="text-sm font-medium">{getUserName(selectedRefund.hubber)}</p>
                      <p className="text-xs text-gray-500">{selectedRefund.hubber?.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Importi */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs font-bold text-gray-500 uppercase mb-3">Importi</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Importo Originale:</span>
                    <span className="font-medium">€ {Number(selectedRefund.original_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Importo Rimborso:</span>
                    <span className="font-bold text-green-600">€ {Number(selectedRefund.refund_amount || 0).toFixed(2)}</span>
                  </div>
                  {selectedRefund.platform_fee_refund > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fee Piattaforma Rimborsata:</span>
                      <span className="text-sm">€ {Number(selectedRefund.platform_fee_refund || 0).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Info aggiuntive */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Policy Cancellazione</p>
                  {getPolicyBadge(selectedRefund.cancellation_policy)}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Cancellato da</p>
                  <span className="text-sm font-medium capitalize">{selectedRefund.cancelled_by || 'N/A'}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Data Richiesta</p>
                  <span className="text-sm">{selectedRefund.requested_at ? new Date(selectedRefund.requested_at).toLocaleString('it-IT') : 'N/A'}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Metodo Rimborso</p>
                  <span className="text-sm font-medium capitalize">{selectedRefund.refund_method || 'Da definire'}</span>
                </div>
              </div>

              {/* Motivo cancellazione */}
              {selectedRefund.cancellation_reason && (
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Motivo Cancellazione</p>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedRefund.cancellation_reason}</p>
                </div>
              )}

              {/* Note admin */}
              {selectedRefund.admin_notes && (
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Note Admin</p>
                  <p className="text-sm bg-blue-50 p-3 rounded-lg text-blue-800">{selectedRefund.admin_notes}</p>
                </div>
              )}

              {/* Motivo rifiuto */}
              {selectedRefund.rejection_reason && (
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Motivo Rifiuto</p>
                  <p className="text-sm bg-red-50 p-3 rounded-lg text-red-800">{selectedRefund.rejection_reason}</p>
                </div>
              )}
            </div>

            {/* Footer con Azioni */}
            <div className="flex justify-between gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setSelectedRefund(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors"
              >
                Chiudi
              </button>
              
              <div className="flex gap-2">
                {selectedRefund.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleRejectRefund(selectedRefund.id)}
                      disabled={refundActionLoading}
                      className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      Rifiuta
                    </button>
                    <button
                      onClick={() => handleApproveRefund(selectedRefund.id)}
                      disabled={refundActionLoading}
                      className="px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      Approva
                    </button>
                  </>
                )}
                {selectedRefund.status === 'approved' && (
                  <>
                    <button
                      onClick={() => handleProcessRefund(selectedRefund.id, 'wallet')}
                      disabled={refundActionLoading}
                      className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <Wallet className="w-4 h-4" /> Su Wallet
                    </button>
                    <button
                      onClick={() => handleProcessRefund(selectedRefund.id, 'manual')}
                      disabled={refundActionLoading}
                      className="px-4 py-2 bg-gray-500 text-white hover:bg-gray-600 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      Manuale
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

  const renderFinanceFees = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="font-bold text-gray-900 text-lg mb-4">Commissioni & Tariffe</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-xs font-bold text-blue-600 uppercase mb-1">Fee Renter</p>
          <p className="text-2xl font-bold text-blue-700">{renterFee}%</p>
        </div>
        <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
          <p className="text-xs font-bold text-orange-600 uppercase mb-1">Fee Hubber</p>
          <p className="text-2xl font-bold text-orange-700">{hubberFee}%</p>
        </div>
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
          <p className="text-xs font-bold text-amber-600 uppercase mb-1">Fee SuperHubber</p>
          <p className="text-2xl font-bold text-amber-700">{superHubberFee}%</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-xs font-bold text-gray-600 uppercase mb-1">Fee Fissa</p>
          <p className="text-2xl font-bold text-gray-700">€{fixedFee}</p>
        </div>
      </div>
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
        <p>⚠️ Per modificare le commissioni vai in <strong>Configurazioni → Commissioni Piattaforma</strong></p>
      </div>
    </div>
  );

  const renderPlaceholder = (title: string, icon: React.ReactNode, description: string) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
      <div className="text-gray-300 mb-4">{icon}</div>
      <p className="font-bold text-gray-900 mb-2">{title}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2">
        <div className="flex flex-wrap gap-1">
          {financeTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFinanceSubTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                financeSubTab === tab.id
                  ? 'bg-brand text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {financeSubTab === 'overview' && renderFinanceOverview()}
     {financeSubTab === 'transactions' && renderFinanceTransactions()}
      {financeSubTab === 'wallets' && renderFinanceWallets()}
      {financeSubTab === 'payouts' && renderFinancePayouts()}
      {financeSubTab === 'fees' && renderFinanceFees()}
      {financeSubTab === 'refunds' && (
  <AdminRefundsOverview currentUser={currentUser} />
)}
     {financeSubTab === 'reports' && renderFinanceReports()}
      {financeSubTab === 'settings' && renderFinanceSettings()}
    </div>
  );
};

  const renderInvoices = () => {
    const invoicesTabs = [
      { id: 'overview', label: '📊 Panoramica' },
      { id: 'renter', label: '👤 Fatture Renter' },
      { id: 'hubber', label: '🏠 Fatture Hubber' },
      { id: 'credit-notes', label: '↩️ Note di Credito' },
      { id: 'rules', label: '⚙️ Regole Automatiche' },
      { id: 'settings', label: '🔧 Impostazioni' },
      { id: 'reports', label: '📈 Report & Export' },
    ];

    // Helper per badge stato fattura
    const getInvoiceStatusBadge = (status: string) => {
      switch (status) {
        case 'draft':
          return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">📝 Bozza</span>;
        case 'issued':
          return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">📄 Emessa</span>;
        case 'sent':
          return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">📧 Inviata</span>;
        case 'paid':
          return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">✅ Pagata</span>;
        case 'cancelled':
          return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">❌ Annullata</span>;
        default:
          return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{status}</span>;
      }
    };

    // Helper nome utente
    const getUserName = (user: any) => {
      if (!user) return 'N/A';
      return user.public_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Utente';
    };

    // ========== PANORAMICA ==========
    const renderInvoicesOverview = () => (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Fatture Totali</p>
                <p className="text-2xl font-bold text-gray-900">{invoiceStats.totalInvoices}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Totale Fatturato</p>
                <p className="text-2xl font-bold text-gray-900">€ {invoiceStats.totalInvoiced.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Fatture Renter</p>
                <p className="text-2xl font-bold text-gray-900">{invoiceStats.renterInvoices}</p>
                <p className="text-xs text-gray-400">€ {invoiceStats.renterTotal.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Fatture Hubber</p>
                <p className="text-2xl font-bold text-gray-900">{invoiceStats.hubberInvoices}</p>
                <p className="text-xs text-gray-400">€ {invoiceStats.hubberTotal.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Seconda riga KPI - Stati */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-50 p-4 rounded-xl text-center">
            <p className="text-2xl font-bold text-gray-600">{invoiceStats.draftCount}</p>
            <p className="text-xs text-gray-500">📝 Bozze</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl text-center">
            <p className="text-2xl font-bold text-blue-600">{invoiceStats.issuedCount}</p>
            <p className="text-xs text-blue-600">📄 Emesse</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl text-center">
            <p className="text-2xl font-bold text-purple-600">{invoiceStats.sentCount}</p>
            <p className="text-xs text-purple-600">📧 Inviate</p>
          </div>
          <div className="bg-green-50 p-4 rounded-xl text-center">
            <p className="text-2xl font-bold text-green-600">{invoiceStats.paidCount}</p>
            <p className="text-xs text-green-600">✅ Pagate</p>
          </div>
          <div className="bg-red-50 p-4 rounded-xl text-center">
            <p className="text-2xl font-bold text-red-600">{invoiceStats.cancelledCount}</p>
            <p className="text-xs text-red-600">❌ Annullate</p>
          </div>
        </div>

        {/* Note di Credito */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Note di Credito</p>
                <p className="text-sm text-gray-500">Stornamenti emessi</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-red-600">{invoiceStats.totalCreditNotes}</p>
          </div>
        </div>

        {/* Ultime Fatture */}
<div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
  {/* Header con Filtri */}
  <div className="p-4 border-b border-gray-100">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <h3 className="font-bold text-gray-900">📄 Fatture Emesse</h3>
      
      {/* Filtri e Azioni */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Toggle Tutte/Filtrate */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!invoiceFilters.showAll}
            onChange={(e) => setInvoiceFilters(prev => ({ ...prev, showAll: !e.target.checked }))}
            className="w-4 h-4 text-brand rounded border-gray-300 focus:ring-brand"
          />
          <span className="text-gray-600">Filtra per periodo</span>
        </label>

        {/* Selettori Mese/Anno (visibili solo se filtro attivo) */}
        {!invoiceFilters.showAll && (
          <>
            <select
              value={invoiceFilters.month}
              onChange={(e) => setInvoiceFilters(prev => ({ ...prev, month: Number(e.target.value) }))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              value={invoiceFilters.year}
              onChange={(e) => setInvoiceFilters(prev => ({ ...prev, year: Number(e.target.value) }))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              {YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </>
        )}

        {/* Contatore */}
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
          {filteredInvoices.length} fattur{filteredInvoices.length === 1 ? 'a' : 'e'}
        </span>

        {/* Export CSV */}
        <button
          onClick={exportInvoicesCSV}
          disabled={filteredInvoices.length === 0}
          className="px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" /> CSV
        </button>

        {/* Nuova Fattura */}
        <button
          onClick={() => setShowCreateInvoiceModal(true)}
          className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand/90 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" /> Nuova Fattura
        </button>
      </div>
    </div>
  </div>

  {/* Tabella */}
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-100">
        <tr>
          <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Numero</th>
          <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
          <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Destinatario</th>
          <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">Totale</th>
          <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Stato</th>
          <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
          <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Azioni</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {paginatedInvoices.map((invoice: any) => (
          <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
            <td className="p-4">
              <code className="text-sm font-mono font-bold text-brand">{invoice.invoice_number}</code>
            </td>
            <td className="p-4">
              <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                invoice.invoice_type === 'renter' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
              }`}>
                {invoice.invoice_type}
              </span>
            </td>
            <td className="p-4">
              <div className="flex items-center gap-2">
                <img 
                  src={invoice.recipient?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(invoice.recipient_name || 'U')}&background=random`}
                  alt=""
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{invoice.recipient_name || getUserName(invoice.recipient)}</p>
                  <p className="text-xs text-gray-500">{invoice.recipient_email}</p>
                </div>
              </div>
            </td>
            <td className="p-4 text-right">
              <span className="text-sm font-bold text-gray-900">€ {Number(invoice.total || 0).toFixed(2)}</span>
            </td>
            <td className="p-4 text-center">
              {getInvoiceStatusBadge(invoice.status)}
            </td>
            <td className="p-4">
              <span className="text-sm text-gray-600">
                {new Date(invoice.issued_at || invoice.created_at).toLocaleDateString('it-IT')}
              </span>
            </td>
            <td className="p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                {/* Bottone Scarica PDF */}
                <button
                  onClick={async () => {
                    try {
                      await downloadInvoicePDF(invoice);
                    } catch (err) {
                      console.error('Errore download PDF:', err);
                      alert('Errore durante la generazione del PDF');
                    }
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Scarica PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
                
                {/* Dropdown cambio stato */}
                <select
                  value={invoice.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value as 'draft' | 'issued' | 'sent' | 'paid' | 'cancelled';
                    try {
                      await api.admin.updateInvoiceStatus(invoice.id, newStatus);
                      setLocalInvoices(prev => prev.map(inv => 
                        inv.id === invoice.id ? { ...inv, status: newStatus } : inv
                      ));
                      const newStats = await api.admin.getInvoiceStats();
                      if (newStats) setInvoiceStats(newStats);
                    } catch (err) {
                      console.error('Errore aggiornamento stato fattura:', err);
                      alert('Errore durante l\'aggiornamento dello stato');
                    }
                  }}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white hover:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 cursor-pointer"
                >
                  <option value="draft">📝 Bozza</option>
                  <option value="issued">✅ Emessa</option>
                  <option value="sent">📧 Inviata</option>
                  <option value="paid">💰 Pagata</option>
                  <option value="cancelled">❌ Annullata</option>
                </select>
              </div>
            </td>
          </tr>
        ))}
        {paginatedInvoices.length === 0 && (
          <tr>
            <td colSpan={7} className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">Nessuna fattura</p>
              <p className="text-sm">
                {invoiceFilters.showAll 
                  ? 'Le fatture appariranno qui quando verranno create'
                  : `Nessuna fattura per ${MONTHS.find(m => m.value === invoiceFilters.month)?.label} ${invoiceFilters.year}`
                }
              </p>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

  {/* Paginazione */}
  {totalInvoicePages > 1 && (
    <div className="p-4 border-t border-gray-100 flex items-center justify-between">
      <p className="text-sm text-gray-500">
        Pagina {invoicePage} di {totalInvoicePages} • 
        Mostrando {((invoicePage - 1) * INVOICES_PER_PAGE) + 1}-{Math.min(invoicePage * INVOICES_PER_PAGE, filteredInvoices.length)} di {filteredInvoices.length}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setInvoicePage(1)}
          disabled={invoicePage === 1}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Prima pagina"
        >
          <ChevronFirst className="w-4 h-4" />
        </button>
        <button
          onClick={() => setInvoicePage(p => Math.max(1, p - 1))}
          disabled={invoicePage === 1}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Pagina precedente"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        {/* Numeri pagina */}
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalInvoicePages) }, (_, i) => {
            let pageNum;
            if (totalInvoicePages <= 5) {
              pageNum = i + 1;
            } else if (invoicePage <= 3) {
              pageNum = i + 1;
            } else if (invoicePage >= totalInvoicePages - 2) {
              pageNum = totalInvoicePages - 4 + i;
            } else {
              pageNum = invoicePage - 2 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => setInvoicePage(pageNum)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  invoicePage === pageNum 
                    ? 'bg-brand text-white' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setInvoicePage(p => Math.min(totalInvoicePages, p + 1))}
          disabled={invoicePage === totalInvoicePages}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Pagina successiva"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => setInvoicePage(totalInvoicePages)}
          disabled={invoicePage === totalInvoicePages}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Ultima pagina"
        >
          <ChevronLast className="w-4 h-4" />
        </button>
      </div>
    </div>
  )}
</div>
      </div>
    );

    // ========== FATTURE RENTER ==========
    const renderRenterInvoices = () => {
      const renterInvoices = localInvoices.filter((inv: any) => inv.invoice_type === 'renter');
      
      return (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <p className="text-blue-800">
              <strong>ℹ️ Fatture Renter:</strong> Fatture emesse ai renter per le commissioni di servizio applicate sulle prenotazioni.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">👤 Fatture Renter ({renterInvoices.length})</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCreateInvoiceModal(true);
                    // Pre-seleziona tipo renter
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" /> Nuova Fattura Renter
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Numero</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Renter</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Prenotazione</th>
                    <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">Imponibile</th>
                    <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">IVA</th>
                    <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">Totale</th>
                    <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Stato</th>
                    <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {renterInvoices.map((invoice: any) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <code className="text-sm font-mono font-bold text-blue-600">{invoice.invoice_number}</code>
                        <p className="text-xs text-gray-400 mt-1">
                          {invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString('it-IT') : 'Bozza'}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <img 
                            src={invoice.recipient?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(invoice.recipient_name || 'R')}&background=10B981&color=fff`}
                            alt=""
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{invoice.recipient_name}</p>
                            <p className="text-xs text-gray-500">{invoice.recipient_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {invoice.booking_id ? (
                          <code className="text-xs bg-brand/10 text-brand px-2 py-1 rounded font-mono font-bold">#{invoice.booking_id.slice(0, 6).toUpperCase()}</code>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm text-gray-600">€ {Number(invoice.subtotal || 0).toFixed(2)}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm text-gray-600">€ {Number(invoice.vat_amount || 0).toFixed(2)}</span>
                        <p className="text-xs text-gray-400">{invoice.vat_rate}%</p>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm font-bold text-gray-900">€ {Number(invoice.total || 0).toFixed(2)}</span>
                      </td>
                      <td className="p-4 text-center">
                        {getInvoiceStatusBadge(invoice.status)}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowInvoiceModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors"
                            title="Dettagli"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {invoice.pdf_url && (
                            <a
                             href={invoice.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Scarica PDF"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {renterInvoices.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">Nessuna fattura renter</p>
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

    // ========== FATTURE HUBBER ==========
    const renderHubberInvoices = () => {
      const hubberInvoices = localInvoices.filter((inv: any) => inv.invoice_type === 'hubber');
      
      return (
        <div className="space-y-6">
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
            <p className="text-purple-800">
              <strong>ℹ️ Fatture Hubber:</strong> Fatture emesse agli hubber per le commissioni trattenute dalla piattaforma sui loro guadagni.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">🏠 Fatture Hubber ({hubberInvoices.length})</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateInvoiceModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" /> Nuova Fattura Hubber
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Numero</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Hubber</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Periodo/Payout</th>
                    <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">Imponibile</th>
                    <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">IVA</th>
                    <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">Totale</th>
                    <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Stato</th>
                    <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {hubberInvoices.map((invoice: any) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <code className="text-sm font-mono font-bold text-purple-600">{invoice.invoice_number}</code>
                        <p className="text-xs text-gray-400 mt-1">
                          {invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString('it-IT') : 'Bozza'}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <img 
                            src={invoice.recipient?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(invoice.recipient_name || 'H')}&background=6366F1&color=fff`}
                            alt=""
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{invoice.recipient_name}</p>
                            <p className="text-xs text-gray-500">{invoice.recipient_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {invoice.period_start && invoice.period_end ? (
                          <span className="text-xs text-gray-600">
                            {new Date(invoice.period_start).toLocaleDateString('it-IT')} - {new Date(invoice.period_end).toLocaleDateString('it-IT')}
                          </span>
                        ) : invoice.payout_id ? (
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">Payout #{invoice.payout_id.slice(0, 8)}</code>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm text-gray-600">€ {Number(invoice.subtotal || 0).toFixed(2)}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm text-gray-600">€ {Number(invoice.vat_amount || 0).toFixed(2)}</span>
                        <p className="text-xs text-gray-400">{invoice.vat_rate}%</p>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm font-bold text-gray-900">€ {Number(invoice.total || 0).toFixed(2)}</span>
                      </td>
                      <td className="p-4 text-center">
                        {getInvoiceStatusBadge(invoice.status)}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowInvoiceModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors"
                            title="Dettagli"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {invoice.pdf_url && (
                            <a
                               href={invoice.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Scarica PDF"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {hubberInvoices.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">Nessuna fattura hubber</p>
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

    // ========== NOTE DI CREDITO ==========
    const renderCreditNotes = () => (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-red-800">
            <strong>ℹ️ Note di Credito:</strong> Documenti emessi per stornare parzialmente o totalmente fatture già emesse (rimborsi, errori, ecc.)
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">↩️ Note di Credito ({localCreditNotes.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Numero NC</th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Fattura Orig.</th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Destinatario</th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Motivo</th>
                  <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">Totale</th>
                  <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Stato</th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {localCreditNotes.map((cn: any) => (
                  <tr key={cn.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <code className="text-sm font-mono font-bold text-red-600">{cn.credit_note_number}</code>
                    </td>
                    <td className="p-4">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{cn.invoice?.invoice_number || 'N/A'}</code>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-gray-900">{cn.recipient_name}</p>
                      <p className="text-xs text-gray-500">{cn.recipient_email}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-gray-600 truncate max-w-[200px]" title={cn.reason}>{cn.reason}</p>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-sm font-bold text-red-600">- € {Number(cn.total || 0).toFixed(2)}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        cn.status === 'issued' ? 'bg-blue-100 text-blue-700' :
                        cn.status === 'sent' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {cn.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-gray-600">
                        {cn.issued_at ? new Date(cn.issued_at).toLocaleDateString('it-IT') : 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
                {localCreditNotes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      <XCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">Nessuna nota di credito</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );

    // ========== REGOLE AUTOMATICHE ==========
    const renderInvoiceRules = () => (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <p className="text-yellow-800">
            <strong>⚙️ Regole Automatiche:</strong> Configura quando generare automaticamente le fatture. Attiva solo le regole che ti servono.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Regole Generazione Fatture</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {invoiceRules.map((rule: any) => (
              <div key={rule.id} className="p-5 flex items-center justify-between hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${rule.enabled ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    <h4 className="font-bold text-gray-900">{rule.rule_name}</h4>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">{rule.rule_type}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 ml-6">{rule.description}</p>
                  {rule.series_prefix && (
                    <p className="text-xs text-gray-400 mt-1 ml-6">Prefisso serie: <code className="bg-gray-100 px-1 rounded">{rule.series_prefix}</code></p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={async () => {
                        try {
                          // Aggiorna subito lo stato locale (UI reattiva)
                        const updatedRules = invoiceRules.map(r => 
                          r.id === rule.id ? { ...r, enabled: !r.enabled } : r
                        );
                        setInvoiceRules(updatedRules);
                        
                        // Prova a salvare nel DB
                        await api.admin.updateInvoiceRule(rule.id, { enabled: !rule.enabled });
                          console.log('✅ Regola aggiornata nel DB');
                        } catch (e) {
                          console.warn('⚠️ Regola salvata solo localmente:', e);
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                  </label>
                </div>
              </div>
            ))}
            {invoiceRules.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Settings className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Nessuna regola configurata</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );

    // ========== IMPOSTAZIONI FATTURE ==========
    const renderlocalInvoiceSettings = () => (
      <div className="space-y-6">
        {localInvoiceSettings ? (
          <>
            {/* Dati Aziendali */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                <Landmark className="w-5 h-5 mr-2 text-brand" /> Dati Aziendali
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ragione Sociale</label>
                  <input
                    type="text"
                    value={localInvoiceSettings.company_name || ''}
                    onChange={(e) => setLocallocalInvoiceSettings({ ...localInvoiceSettings, company_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">P.IVA</label>
                  <input
                    type="text"
                    value={localInvoiceSettings.vat_number || ''}
                    onChange={(e) => setLocallocalInvoiceSettings({ ...localInvoiceSettings, vat_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Codice Fiscale</label>
                  <input
                    type="text"
                    value={localInvoiceSettings.fiscal_code || ''}
                    onChange={(e) => setLocallocalInvoiceSettings({ ...localInvoiceSettings, fiscal_code: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={localInvoiceSettings.email || ''}
                    onChange={(e) => setLocallocalInvoiceSettings({ ...localInvoiceSettings, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Regime Fiscale</label>
                  <select
                    value={localInvoiceSettings.regime_fiscale || 'RF01'}
                    onChange={(e) => setLocallocalInvoiceSettings({ ...localInvoiceSettings, regime_fiscale: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  >
                    <option value="RF01">RF01 - Regime ordinario</option>
                    <option value="RF02">RF02 - Contribuenti minimi</option>
                    <option value="RF19">RF19 - Regime forfettario</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PEC (per SDI)</label>
                  <input
                    type="email"
                    value={localInvoiceSettings.pec_email || ''}
                    onChange={(e) => setLocallocalInvoiceSettings({ ...localInvoiceSettings, pec_email: e.target.value })}
                    placeholder="esempio@pec.it"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo</label>
                  <input
                    type="text"
                    value={localInvoiceSettings.address || ''}
                    onChange={(e) => setLocallocalInvoiceSettings({ ...localInvoiceSettings, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Città</label>
                  <input
                    type="text"
                    value={localInvoiceSettings.city || ''}
                    onChange={(e) => setLocallocalInvoiceSettings({ ...localInvoiceSettings, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CAP</label>
                  <input
                    type="text"
                    value={localInvoiceSettings.zip_code || ''}
                    onChange={(e) => setLocallocalInvoiceSettings({ ...localInvoiceSettings, zip_code: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Numerazione */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-brand" /> Numerazione Fatture
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prefisso Renter</label>
                  <input
                    type="text"
                    value={localInvoiceSettings.renter_series_prefix || 'R'}
                    onChange={(e) => setLocallocalInvoiceSettings({ ...localInvoiceSettings, renter_series_prefix: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prefisso Hubber</label>
                  <input
                    type="text"
                    value={localInvoiceSettings.hubber_series_prefix || 'H'}
                    onChange={(e) => setLocallocalInvoiceSettings({ ...localInvoiceSettings, hubber_series_prefix: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prefisso Note Credito</label>
                  <input
                    type="text"
                    value={localInvoiceSettings.credit_note_prefix || 'NC'}
                    onChange={(e) => setLocallocalInvoiceSettings({ ...localInvoiceSettings, credit_note_prefix: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Prossimi numeri:</strong> Renter: <code>{localInvoiceSettings.renter_series_prefix}-{localInvoiceSettings.current_year}-{String(localInvoiceSettings.renter_next_number).padStart(4, '0')}</code> | 
                  Hubber: <code>{localInvoiceSettings.hubber_series_prefix}-{localInvoiceSettings.current_year}-{String(localInvoiceSettings.hubber_next_number).padStart(4, '0')}</code> | 
                  NC: <code>{localInvoiceSettings.credit_note_prefix}-{localInvoiceSettings.current_year}-{String(localInvoiceSettings.credit_note_next_number).padStart(4, '0')}</code>
                </p>
              </div>
            </div>

            {/* IVA e Pagamenti */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                <Percent className="w-5 h-5 mr-2 text-brand" /> IVA e Pagamenti
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aliquota IVA Default (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={localInvoiceSettings.default_vat_rate || 22}
                    onChange={(e) => setLocallocalInvoiceSettings({ ...localInvoiceSettings, default_vat_rate: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
                  <input
                    type="text"
                    value={localInvoiceSettings.iban || ''}
                    onChange={(e) => setLocallocalInvoiceSettings({ ...localInvoiceSettings, iban: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banca</label>
                  <input
                    type="text"
                    value={localInvoiceSettings.bank_name || ''}
                    onChange={(e) => setLocallocalInvoiceSettings({ ...localInvoiceSettings, bank_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">BIC/SWIFT</label>
                  <input
                    type="text"
                    value={localInvoiceSettings.bic_swift || ''}
                    onChange={(e) => setLocallocalInvoiceSettings({ ...localInvoiceSettings, bic_swift: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Salva */}
            <div className="flex justify-end">
              <button
                onClick={async () => {
                  setlocalInvoiceSettingsSaving(true);
                  try {
                    await api.admin.updateLocalInvoiceSettings(localInvoiceSettings);
                    alert('✅ Impostazioni salvate!');
                  } catch (e) {
                    console.error('Errore salvataggio:', e);
                    alert('❌ Errore durante il salvataggio');
                  } finally {
                    setlocalInvoiceSettingsSaving(false);
                  }
                }}
                disabled={localInvoiceSettingsSaving}
                className="px-6 py-3 bg-brand text-white rounded-xl font-bold hover:bg-brand/90 transition-colors disabled:opacity-50 flex items-center"
              >
                {localInvoiceSettingsSaving ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> Salva Impostazioni
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <Settings className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">Caricamento impostazioni...</p>
          </div>
        )}
      </div>
    );

    // ========== REPORT & EXPORT ==========
    const renderInvoiceReports = () => (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
          <h3 className="text-xl font-bold mb-2">📈 Report Fatture</h3>
          <p className="text-green-100">Esporta i dati di fatturazione per la contabilità</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export XML FatturaPA */}
<InvoiceXmlExport invoices={localInvoices} />
          {/* Export Fatture */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-brand" /> Export Fatture
            </h4>
            <p className="text-sm text-gray-500 mb-4">Esporta tutte le fatture in formato CSV per importazione nel gestionale.</p>
            <button
              onClick={() => {
                const headers = ['Numero', 'Tipo', 'Destinatario', 'Email', 'P.IVA', 'Imponibile', 'IVA', 'Totale', 'Stato', 'Data Emissione'];
                const rows = localInvoices.map((inv: any) => [
                  inv.invoice_number,
                  inv.invoice_type,
                  inv.recipient_name,
                  inv.recipient_email,
                  inv.recipient_vat_number || '',
                  Number(inv.subtotal || 0).toFixed(2),
                  Number(inv.vat_amount || 0).toFixed(2),
                  Number(inv.total || 0).toFixed(2),
                  inv.status,
                  inv.issued_at ? new Date(inv.issued_at).toLocaleDateString('it-IT') : ''
                ]);
                
                const csvContent = [headers, ...rows]
                  .map(row => row.map(cell => `"${cell}"`).join(','))
                  .join('\n');
                
                const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `fatture_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
              }}
              className="w-full px-4 py-3 bg-brand text-white rounded-xl font-bold hover:bg-brand/90 transition-colors flex items-center justify-center"
            >
              <Download className="w-4 h-4 mr-2" /> Scarica CSV Fatture
            </button>
          </div>

          {/* Export Note di Credito */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center">
              <XCircle className="w-5 h-5 mr-2 text-red-500" /> Export Note di Credito
            </h4>
            <p className="text-sm text-gray-500 mb-4">Esporta tutte le note di credito emesse.</p>
            <button
              onClick={() => {
                const headers = ['Numero NC', 'Fattura Orig.', 'Destinatario', 'Motivo', 'Totale', 'Stato', 'Data'];
                const rows = localCreditNotes.map((cn: any) => [
                  cn.credit_note_number,
                  cn.invoice?.invoice_number || '',
                  cn.recipient_name,
                  cn.reason,
                  Number(cn.total || 0).toFixed(2),
                  cn.status,
                  cn.issued_at ? new Date(cn.issued_at).toLocaleDateString('it-IT') : ''
                ]);
                
                const csvContent = [headers, ...rows]
                  .map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
                  .join('\n');
                
                const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `note_credito_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
              }}
              className="w-full px-4 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors flex items-center justify-center"
            >
              <Download className="w-4 h-4 mr-2" /> Scarica CSV Note Credito
            </button>
          </div>
        </div>

        {/* Riepilogo per Periodo */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h4 className="font-bold text-gray-900 mb-4">📊 Riepilogo Mensile</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-xs font-semibold text-gray-500">Mese</th>
                  <th className="text-right p-3 text-xs font-semibold text-gray-500">N. Fatture</th>
                  <th className="text-right p-3 text-xs font-semibold text-gray-500">Imponibile</th>
                  <th className="text-right p-3 text-xs font-semibold text-gray-500">IVA</th>
                  <th className="text-right p-3 text-xs font-semibold text-gray-500">Totale</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const monthlyData: { [key: string]: { count: number; subtotal: number; vat: number; total: number } } = {};
                  localInvoices.forEach((inv: any) => {
                    if (inv.issued_at) {
                      const date = new Date(inv.issued_at);
                      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                      if (!monthlyData[key]) {
                        monthlyData[key] = { count: 0, subtotal: 0, vat: 0, total: 0 };
                      }
                      monthlyData[key].count++;
                      monthlyData[key].subtotal += Number(inv.subtotal || 0);
                      monthlyData[key].vat += Number(inv.vat_amount || 0);
                      monthlyData[key].total += Number(inv.total || 0);
                    }
                  });
                  
                  return Object.entries(monthlyData)
                    .sort((a, b) => b[0].localeCompare(a[0]))
                    .slice(0, 12)
                    .map(([month, data]) => (
                      <tr key={month} className="border-b border-gray-50">
                        <td className="p-3 font-medium">{month}</td>
                        <td className="p-3 text-right">{data.count}</td>
                        <td className="p-3 text-right">€ {data.subtotal.toFixed(2)}</td>
                        <td className="p-3 text-right">€ {data.vat.toFixed(2)}</td>
                        <td className="p-3 text-right font-bold">€ {data.total.toFixed(2)}</td>
                      </tr>
                    ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );

    // ========== RENDER PRINCIPALE ==========
    return (
      <div className="space-y-6 animate-in fade-in">
        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2">
          <div className="flex flex-wrap gap-1">
            {invoicesTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setInvoicesSubTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  invoicesSubTab === tab.id
                    ? 'bg-brand text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {invoicesSubTab === 'overview' && renderInvoicesOverview()}
        {invoicesSubTab === 'renter' && renderRenterInvoices()}
        {invoicesSubTab === 'hubber' && renderHubberInvoices()}
        {invoicesSubTab === 'credit-notes' && renderCreditNotes()}
        {invoicesSubTab === 'rules' && renderInvoiceRules()}
        {invoicesSubTab === 'settings' && renderlocalInvoiceSettings()}
        {invoicesSubTab === 'reports' && renderInvoiceReports()}
      </div>
    );
  };

  const renderCMS = () => <AdminCMSBranding />;

  const renderDisputes = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-gray-900 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-red-500" /> Gestione Controversie
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full font-medium">
            {localDisputes.filter(d => d.status === 'open').length} Aperte
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
            {localDisputes.filter(d => d.status === 'resolved').length} Risolte
          </span>
        </div>
      </div>
      <table className="w-full text-left text-sm text-gray-600">
        <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-100">
          <tr>
            <th className="p-4">ID</th>
            <th className="p-4">Prenotazione</th>
            <th className="p-4">Data</th>
            <th className="p-4">Aperta da</th>
            <th className="p-4">Motivo</th>
            <th className="p-4">Importo</th>
            <th className="p-4">Stato</th>
            <th className="p-4 text-right">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {localDisputes.map((d) => (
            <tr
              key={d.id}
              className="border-b border-gray-50 hover:bg-gray-50"
            >
              <td className="p-4 text-xs font-mono">{d.dispute_id || d.id.slice(0,8)}</td>
              <td className="p-4">
                {d.booking_id ? (
                  <code className="text-xs bg-brand/10 text-brand px-2 py-1 rounded font-mono font-bold">
                    #{d.booking_id.slice(0, 6).toUpperCase()}
                  </code>
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </td>
              <td className="p-4 text-xs">{new Date(d.created_at).toLocaleDateString('it-IT')}</td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  d.opened_by_role === 'hubber' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {d.opened_by_role === 'hubber' ? 'Hubber' : 'Renter'}
                </span>
              </td>
              <td className="p-4">
                <span className="block text-xs uppercase font-bold text-gray-500 mb-1">
                  {d.reason?.replace(/_/g, ' ')}
                </span>
                <p className="text-gray-900 line-clamp-1">{d.details}</p>
              </td>
              <td className="p-4 font-medium">
                {d.refund_amount ? `€${d.refund_amount}` : '-'}
              </td>
              <td className="p-4">
                <span
                  className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    d.status === 'open'
                      ? 'bg-red-100 text-red-700'
                      : d.status === 'resolved'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {d.status === 'open' ? 'Aperta' : d.status === 'resolved' ? 'Risolta' : d.status}
                </span>
              </td>
              <td className="p-4 text-right">
                <button
                  onClick={async () => {
                    try {
                      // ✨ MARCA COME VISTA
                     await markAsViewed('dispute', d.id);
      
                      // Verifica se esiste già un ticket per questa disputa
                      const { data: existingTicket } = await (await import('../lib/supabase')).supabase
                        .from('support_tickets')
                        .select('id')
                        .eq('related_dispute_id', d.id)
                        .maybeSingle();

                      let ticketId;
                      if (existingTicket) {
                        ticketId = existingTicket.id;
                      } else {
                        // Crea nuovo ticket dalla disputa
                        ticketId = await api.support.createTicketFromDispute(d);
                      }

                      // Vai alla sezione supporto
                      setActiveTab('support');
                      
                      // Aspetta che i ticket si carichino e seleziona quello giusto
                      setTimeout(async () => {
                        const { data: tickets } = await (await import('../lib/supabase')).supabase
                          .from('support_tickets')
                          .select(`
                            *,
                            user:users!support_tickets_user_id_fkey(id, first_name, last_name, public_name, avatar_url, email),
                            assigned:users!support_tickets_assigned_to_fkey(id, first_name, last_name, public_name, avatar_url)
                          `)
                          .eq('id', ticketId)
                          .single();
                        
                        if (tickets) {
                          handleSelectTicket(tickets);
                        }
                      }, 500);
                    } catch (error) {
                      console.error('Errore gestione disputa:', error);
                      alert('Errore nell\'apertura del ticket');
                    }
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  Gestisci →
                </button>
              </td>
            </tr>
          ))}
          {localDisputes.length === 0 && (
            <tr>
              <td colSpan={8} className="p-8 text-center text-gray-400">
                Nessuna controversia trovata.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  // ✅ RENDER RECENSIONI ADMIN
const renderReviews = () => {
  // Filtra recensioni
  const filteredReviews = localReviews.filter((review) => {
    const matchesSearch = reviewsSearch === '' || 
      review.comment?.toLowerCase().includes(reviewsSearch.toLowerCase()) ||
      review.reviewer?.public_name?.toLowerCase().includes(reviewsSearch.toLowerCase()) ||
      review.reviewee?.public_name?.toLowerCase().includes(reviewsSearch.toLowerCase());
    
    const matchesStatus = reviewsStatusFilter === 'all' || review.status === reviewsStatusFilter;
    const matchesType = reviewsTypeFilter === 'all' || review.review_type === reviewsTypeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestione Recensioni</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
            {localReviews.filter(r => r.status === 'approved').length} Approvate
          </span>
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full font-medium">
            {localReviews.filter(r => r.status === 'suspended').length} Sospese
          </span>
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca per testo, autore..."
                value={reviewsSearch}
                onChange={(e) => setReviewsSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <select
            value={reviewsStatusFilter}
            onChange={(e) => setReviewsStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Tutti gli stati</option>
            <option value="approved">Approvate</option>
            <option value="suspended">Sospese</option>
          </select>
          <select
            value={reviewsTypeFilter}
            onChange={(e) => setReviewsTypeFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Tutti i tipi</option>
            <option value="renter_to_hubber">Renter → Hubber</option>
            <option value="hubber_to_renter">Hubber → Renter</option>
          </select>
        </div>
      </div>

      {/* Tabella */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-100">
            <tr>
              <th className="p-4">Data</th>
              <th className="p-4">Autore</th>
              <th className="p-4">Destinatario</th>
              <th className="p-4">Tipo</th>
              <th className="p-4">Rating</th>
              <th className="p-4">Commento</th>
              <th className="p-4">Stato</th>
              <th className="p-4 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filteredReviews.map((review) => (
              <tr key={review.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-4 text-xs">
                  {new Date(review.created_at).toLocaleDateString('it-IT')}
                </td>
                <td className="p-4 font-medium">
                  {review.reviewer?.public_name || 'N/A'}
                </td>
                <td className="p-4">
                  {review.reviewee?.public_name || 'N/A'}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    review.review_type === 'renter_to_hubber' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {review.review_type === 'renter_to_hubber' ? 'R→H' : 'H→R'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold">{review.rating}</span>
                  </div>
                </td>
                <td className="p-4 max-w-xs">
                  <p className="line-clamp-2 text-gray-700">{review.comment || '-'}</p>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    review.status === 'approved' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {review.status === 'approved' ? 'Attiva' : 'Sospesa'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => {
                        setSelectedReview(review);
                        setShowReviewModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Modifica"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {review.status === 'approved' ? (
                      <button
                        onClick={async () => {
                          if (confirm('Vuoi sospendere questa recensione?')) {
                            setReviewActionLoading(true);
                            try {
                              await api.reviews.updateStatus(review.id, 'suspended');
                              setLocalReviews(prev => prev.map(r => 
                                r.id === review.id ? { ...r, status: 'suspended' } : r
                              ));
                            } catch (error) {
                              alert('Errore nella sospensione');
                            } finally {
                              setReviewActionLoading(false);
                            }
                          }
                        }}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                        title="Sospendi"
                      >
                        <EyeOff className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          setReviewActionLoading(true);
                          try {
                            await api.reviews.updateStatus(review.id, 'approved');
                            setLocalReviews(prev => prev.map(r => 
                              r.id === review.id ? { ...r, status: 'approved' } : r
                            ));
                          } catch (error) {
                            alert('Errore nella riattivazione');
                          } finally {
                            setReviewActionLoading(false);
                          }
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Riattiva"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        if (confirm('Vuoi eliminare definitivamente questa recensione?')) {
                          setReviewActionLoading(true);
                          try {
                            await api.reviews.delete(review.id);
                            setLocalReviews(prev => prev.filter(r => r.id !== review.id));
                          } catch (error) {
                            alert('Errore nella eliminazione');
                          } finally {
                            setReviewActionLoading(false);
                          }
                        }
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Elimina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredReviews.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-400">
                  Nessuna recensione trovata.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Modifica */}
      {showReviewModal && selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">Modifica Recensione</h3>
              <button onClick={() => setShowReviewModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <select
                  value={selectedReview.rating}
                  onChange={(e) => setSelectedReview({ ...selectedReview, rating: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n} stelle</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commento</label>
                <textarea
                  value={selectedReview.comment || ''}
                  onChange={(e) => setSelectedReview({ ...selectedReview, comment: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg resize-none"
                />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Annulla
              </button>
              <button
                onClick={async () => {
                  setReviewActionLoading(true);
                  try {
                    await api.reviews.update(selectedReview.id, {
                      comment: selectedReview.comment,
                      rating: selectedReview.rating
                    });
                    setLocalReviews(prev => prev.map(r => 
                      r.id === selectedReview.id ? selectedReview : r
                    ));
                    setShowReviewModal(false);
                    alert('Recensione aggiornata!');
                  } catch (error) {
                    alert('Errore nel salvataggio');
                  } finally {
                    setReviewActionLoading(false);
                  }
                }}
                disabled={reviewActionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {reviewActionLoading ? 'Salvataggio...' : 'Salva modifiche'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

  const renderConfig = () => (
    <div className="max-w-5xl animate-in fade-in slide-in-from-right-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <div className="mb-8 border-b border-gray-100 pb-6">
          <h2 className="text-2xl font-bold text-gray-900">Configurazioni Globali</h2>
          <p className="text-gray-500 mt-1">
            Le modifiche qui si riflettono istantaneamente su tutta la
            piattaforma.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12">
          {/* FEES */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-brand" /> Commissioni
              Piattaforma
            </h3>
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="grid grid-cols-3 gap-6 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fee Renter (%)
                  </label>
                  <input
                    type="number"
                    value={renterFee}
                    onChange={(e) => setRenterFee(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fee Hubber (%)
                  </label>
                  <input
                    type="number"
                    value={hubberFee}
                    onChange={(e) => setHubberFee(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fee SuperHubber (%)
                  </label>
                  <input
                    type="number"
                    value={superHubberFee}
                    onChange={(e) => setSuperHubberFee(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Costo Fisso Transazione (€)
                </label>
                <input
                  type="number"
                  value={fixedFee}
                  onChange={(e) => setFixedFee(Number(e.target.value))}
                  className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                />
              </div>
            </div>
          </div>

          {/* RULES & QUALITY */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-brand" /> Regole & Qualità
            </h3>
            <div className="space-y-6">
              {/* Soglia Pubblicazione */}
              <div className="p-5 border border-gray-200 rounded-xl bg-white shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-900">
                      Soglia Pubblicazione
                    </p>
                    <p className="text-xs text-gray-500">
                      Punteggio qualità minimo per pubblicare un annuncio.
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={completenessThresh}
                      onChange={(e) =>
                        setCompletenessThresh(Number(e.target.value))
                      }
                      className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-center font-bold"
                    />
                    <span className="ml-2 font-bold text-gray-500">%</span>
                  </div>
                </div>
              </div>

              {/* SuperHubber Logic */}
              <div className="p-6 border border-gray-200 rounded-xl bg-gray-50">
                <h4 className="font-bold text-gray-900 mb-4">
                  Requisiti SuperHubber
                </h4>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Rating Minimo
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={shConfig.minRating}
                      onChange={(e) =>
                        setShConfig({
                          ...shConfig,
                          minRating: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Risposta (%)
                    </label>
                    <input
                      type="number"
                      value={shConfig.minResponseRate}
                      onChange={(e) =>
                        setShConfig({
                          ...shConfig,
                          minResponseRate: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Cancellazioni Max (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={shConfig.maxCancellationRate}
                      onChange={(e) =>
                        setShConfig({
                          ...shConfig,
                          maxCancellationRate: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Anzianità (giorni)
                    </label>
                    <input
                      type="number"
                      value={shConfig.minHostingDays}
                      onChange={(e) =>
                        setShConfig({
                          ...shConfig,
                          minHostingDays: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-sm font-bold text-gray-800">
                    Criteri minimi da soddisfare:
                  </span>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-bold text-brand">
                      {shConfig.requiredCriteriaCount} su 4
                    </span>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      value={shConfig.requiredCriteriaCount}
                      onChange={(e) =>
                        setShConfig({
                          ...shConfig,
                          requiredCriteriaCount: Number(e.target.value),
                        })
                      }
                      className="w-32 accent-brand cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
          <button
            onClick={handleSaveConfig}
            className="bg-brand text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-brand-dark transition-all flex items-center"
          >
            <Save className="w-5 h-5 mr-2" /> Salva Configurazioni
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0F172A] text-white flex flex-col fixed h-full z-20">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <span className="font-bold text-xl tracking-tight text-white">
            Renthubber{' '}
            <span className="text-brand-light text-xs align-top">ADMIN</span>
          </span>
        </div>

        <nav className="flex-1 py-6 space-y-1 px-3 overflow-y-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" /> Panoramica
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Users className="w-5 h-5 mr-3" /> Utenti
          </button>
          <button
            onClick={() => setActiveTab('listings')}
            className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${
              activeTab === 'listings'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Package className="w-5 h-5 mr-3" /> Annunci
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${
              activeTab === 'bookings'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <CalendarCheck className="w-5 h-5 mr-3" /> Prenotazioni
            {localBookings.filter(b => b.status === 'pending').length > 0 && (
              <span className="ml-auto bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                {localBookings.filter(b => b.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('disputes')}
            className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${
              activeTab === 'disputes'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-5 h-5 mr-3" /> Controversie
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${
              activeTab === 'reviews'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Star className="w-5 h-5 mr-3" /> Recensioni
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${
              activeTab === 'messages'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <MessageSquare className="w-5 h-5 mr-3" /> Messaggi
            {conversationStats.flagged > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {conversationStats.flagged}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${
              activeTab === 'support'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Headphones className="w-5 h-5 mr-3" /> Supporto Ticket
            {supportStats.unread > 0 && (
              <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                {supportStats.unread}
              </span>
            )}
          </button>
          <div className="pt-4 pb-2 px-3 text-xs font-bold text-gray-600 uppercase">
            Sistema
          </div>
          <button
            onClick={() => setActiveTab('finance')}
            className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${
              activeTab === 'finance'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <DollarSign className="w-5 h-5 mr-3" /> Finanza & Wallet
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${
              activeTab === 'invoices'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <FileText className="w-5 h-5 mr-3" /> Fatture
            {invoiceStats.draftCount > 0 && (
              <span className="ml-auto bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                {invoiceStats.draftCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('cms')}
            className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${
              activeTab === 'cms'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
                     <Globe className="w-5 h-5 mr-3" /> CMS & Branding
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${
              activeTab === 'email'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
                     <Mail className="w-5 h-5 mr-3" /> Email
          </button>
          <button
  onClick={() => setActiveTab('announcements')}
  className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${
    activeTab === 'announcements'
      ? 'bg-blue-600 text-white'
      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
  }`}
>
  <Megaphone className="w-5 h-5 mr-3" /> Annunci
</button>
          <button
            onClick={() => setActiveTab('referral')}
            className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${
              activeTab === 'referral'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Gift className="w-5 h-5 mr-3" /> Invita Amico
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${
              activeTab === 'config'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
            >
            <Settings className="w-5 h-5 mr-3" /> Configurazioni
          </button>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={() => {
              if (window.confirm('Sei sicuro di voler uscire?')) {
                try {
                  Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
                      localStorage.removeItem(key);
                    }
                  });
                  sessionStorage.clear();
                } catch (e) {}
                window.location.replace('/');
              }
            }}
            className="w-full flex items-center px-3 py-2 rounded-lg text-red-400 hover:bg-red-900/30 transition-colors mb-4"
          >
            <LogOut className="w-5 h-5 mr-3" /> Logout
          </button>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gray-600 mr-3"></div>
            <div>
              <p className="text-sm font-bold text-white">Admin System</p>
              <p className="text-xs text-gray-400">Super Admin</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-64 overflow-y-auto">
  {/* ⬇️ QUESTO È NUOVO - HEADER con campanella */}
  <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm px-8 py-4">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-gray-900">
        {activeTab === 'overview' && '📊 Panoramica'}
        {/* ... titoli dinamici */}
      </h2>
      <AdminNotificationBell onNavigate={(tab) => setActiveTab(tab as any)} />
    </div>
  </div>

  {/* ⬇️ QUESTO È IL TUO CONTENUTO ESISTENTE - IDENTICO */}
  <div className="p-8">
    {activeTab === 'overview' && renderOverview()}
    {activeTab === 'users' && renderUsers()}
    {activeTab === 'listings' && renderListings()}
    {activeTab === 'bookings' && renderBookings()}
    {activeTab === 'messages' && renderMessages()}
    {activeTab === 'support' && renderSupport()}
    {activeTab === 'finance' && renderFinance()}
    {activeTab === 'invoices' && renderInvoices()}
    {activeTab === 'cms' && renderCMS()}
    {activeTab === 'disputes' && renderDisputes()}
    {activeTab === 'reviews' && renderReviews()}
    {activeTab === 'email' && <AdminEmailSection allUsers={allUsers} currentUser={currentUser} />}
    {activeTab === 'announcements' && (<AdminAnnouncements currentUser={currentUser} />)}
    {activeTab === 'referral' && <ReferralSettings />}
    {activeTab === 'config' && renderConfig()}
  </div>
</main>

      {/* INVOICE GENERATION MODAL */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-brand text-white">
              <h3 className="font-bold flex items-center">
                <FileText className="w-5 h-5 mr-2" /> Genera Fattura Hubber
              </h3>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="text-white/80 hover:text-white p-1 hover:bg-white/20 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleGenerateInvoice}
              className="p-6 space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleziona Hubber
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  value={invoiceForm.hubberId}
                  onChange={(e) =>
                    setInvoiceForm({
                      ...invoiceForm,
                      hubberId: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">-- Seleziona --</option>
                  {localUsers
                    .filter((u) => u.roles?.includes('hubber') || u.role === 'hubber')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mese
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                    value={invoiceForm.month}
                    onChange={(e) =>
                      setInvoiceForm({
                        ...invoiceForm,
                        month: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">--</option>
                    {[
                      'Gennaio',
                      'Febbraio',
                      'Marzo',
                      'Aprile',
                      'Maggio',
                      'Giugno',
                      'Luglio',
                      'Agosto',
                      'Settembre',
                      'Ottobre',
                      'Novembre',
                      'Dicembre',
                    ].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anno
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                    value={invoiceForm.year}
                    onChange={(e) =>
                      setInvoiceForm({
                        ...invoiceForm,
                        year: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg text-xs text-yellow-800">
                Il sistema calcolerà automaticamente il totale delle commissioni
                per le prenotazioni completate nel periodo selezionato.
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-brand text-white rounded-lg font-bold shadow-md hover:bg-brand-dark"
                >
                  Genera e Salva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAGE EDITOR MODAL (CMS) */}
{editingPage && (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
      <div className="p-5 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-gray-900">
          Modifica Pagina: {editingPage.title}
        </h3>
        <button
          onClick={() => setEditingPage(null)}
          className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-6 flex-1 overflow-y-auto space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titolo Pagina
            </label>
            <input
              type="text"
              value={editingPage.title}
              onChange={(e) =>
                setEditingPage({
                  ...editingPage,
                  title: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Posizione
            </label>
            <select
              value={editingPage.position || 'footer_col1'}
              onChange={(e) =>
                setEditingPage({
                  ...editingPage,
                  position: e.target.value as any,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none bg-white"
            >
              <option value="header">Header Menu</option>
              <option value="footer_col1">Footer (Renthubber)</option>
              <option value="footer_col2">Footer (Supporto)</option>
              <option value="legal">Footer (Legale)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2 py-2">
          <input
            type="checkbox"
            id="isHtml"
            checked={editingPage.isHtml}
            onChange={(e) =>
              setEditingPage({
                ...editingPage,
                isHtml: e.target.checked,
              })
            }
            className="rounded border-gray-300 text-brand focus:ring-brand"
          />
          <label
            htmlFor="isHtml"
            className="text-sm text-gray-700 font-medium"
          >
            Abilita HTML Editor
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contenuto
          </label>
          <textarea
            value={editingPage.content}
            onChange={(e) =>
              setEditingPage({
                ...editingPage,
                content: e.target.value,
              })
            }
            className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none font-mono text-sm leading-relaxed"
            placeholder={
              editingPage.isHtml
                ? '<div>Inserisci codice HTML qui...</div>'
                : 'Scrivi il testo semplice...'
            }
          />
        </div>
      </div>
      <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
        <button
          onClick={() => setEditingPage(null)}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          Annulla
        </button>
        <button
          onClick={handleSavePage}
          className="px-6 py-2 bg-brand text-white rounded-lg font-bold shadow-md hover:bg-brand-dark"
        >
          Salva Modifiche
        </button>
      </div>
    </div>
  </div>
)}

{/* EDIT USER MODAL - COMPLETE */}
{selectedUserForEdit && (
  <EditUserComplete
    user={selectedUserForEdit}
    onClose={() => setSelectedUserForEdit(null)}
    onSave={handleSaveUserComplete}
    onToggleSuspend={handleToggleSuspend}
    onResetPassword={handleResetPassword}
    onDelete={() => setShowDeleteConfirm(true)}
    onDeleteBankDetails={handleDeleteBankDetails}
    isSaving={isUserSaving}
  />
)}

{/* DELETE CONFIRMATION MODAL */}
{showDeleteConfirm && selectedUserForEdit && (
  <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Eliminare questo utente?</h3>
        <p className="text-gray-500 mb-6">
          Stai per eliminare <span className="font-bold">{selectedUserForEdit.name}</span>. 
          Questa azione è irreversibile e cancellerà tutti i dati associati.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
          >
            Annulla
          </button>
          <button
            onClick={handleDeleteUser}
            disabled={isUserSaving}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
          >
            {isUserSaving ? 'Eliminazione...' : 'Sì, Elimina'}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{/* ADD USER MODAL */}
{showAddUserModal && (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-green-600 text-white">
        <h3 className="font-bold flex items-center">
          <Users className="w-5 h-5 mr-2" /> Aggiungi Nuovo Utente
        </h3>
        <button
          onClick={() => {
            setShowAddUserModal(false);
            setUserSaveError(null);
          }}
          className="text-white/80 hover:text-white p-1 hover:bg-white/20 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleCreateUser} className="p-6 space-y-5">
        {userSaveError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
            {userSaveError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <input
              type="text"
              required
              value={newUserForm.firstName}
              onChange={(e) => setNewUserForm({ ...newUserForm, firstName: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
              placeholder="Mario"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cognome
            </label>
            <input
              type="text"
              value={newUserForm.lastName}
              onChange={(e) => setNewUserForm({ ...newUserForm, lastName: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
              placeholder="Rossi"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            required
            value={newUserForm.email}
            onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
            placeholder="mario.rossi@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={newUserForm.password}
            onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
            placeholder="Minimo 6 caratteri"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ruolo
            </label>
            <select
              value={newUserForm.role}
              onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as any })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-brand outline-none"
            >
              <option value="renter">Renter</option>
              <option value="hubber">Hubber</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fee Personalizzata (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={newUserForm.customFeePercentage}
              onChange={(e) => setNewUserForm({ ...newUserForm, customFeePercentage: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
              placeholder="Vuoto = standard"
            />
          </div>
        </div>

        <label className="flex items-center p-3 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer">
          <input
            type="checkbox"
            checked={newUserForm.isSuperHubber}
            onChange={(e) => setNewUserForm({ ...newUserForm, isSuperHubber: e.target.checked })}
            className="w-5 h-5 rounded border-amber-300 text-amber-500 focus:ring-amber-500 mr-3"
          />
          <div>
            <span className="font-bold text-amber-700">⭐ SuperHubber</span>
            <p className="text-xs text-amber-600">Attiva lo status SuperHubber per questo utente</p>
          </div>
        </label>

        <div className="pt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setShowAddUserModal(false);
              setUserSaveError(null);
            }}
            className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg font-medium"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={isUserSaving}
            className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-bold shadow-md hover:bg-green-700 disabled:opacity-50 flex items-center"
          >
            {isUserSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creazione...
              </>
            ) : (
              'Crea Utente'
            )}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
      {/* ========== LISTING EDIT MODAL ========== */}
      {selectedListingForEdit && editListingForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
              <div className="flex items-center">
                <img
                  src={selectedListingForEdit.images?.[0] || 'https://via.placeholder.com/48'}
                  alt={selectedListingForEdit.title}
                  className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow mr-4"
                />
                <div>
                  <h3 className="font-bold text-xl text-gray-900">
                    {selectedListingForEdit.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    ID: {selectedListingForEdit.id}
                  </p>
                  <a
                    href={`/listing/${selectedListingForEdit.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mt-1"
                  >
                    <Eye className="w-3 h-3 mr-1" /> Vedi pagina pubblica
                  </a>
                </div>
              </div>
              <button
                onClick={() => setSelectedListingForEdit(null)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              {/* Error banner */}
              {listingSaveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  {listingSaveError}
                </div>
              )}

              {/* Informazioni Base */}
              <div>
                <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-brand" /> Informazioni Base
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
                    <input
                      type="text"
                      value={editListingForm.title}
                      onChange={(e) => setEditListingForm({ ...editListingForm, title: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                    <textarea
                      value={editListingForm.description}
                      onChange={(e) => setEditListingForm({ ...editListingForm, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <select
                      value={editListingForm.category}
                      onChange={(e) => setEditListingForm({ ...editListingForm, category: e.target.value as any })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none bg-white"
                    >
                      <option value="oggetto">Oggetto</option>
                      <option value="spazio">Spazio</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sottocategoria</label>
                    <input
                      type="text"
                      value={editListingForm.subCategory}
                      onChange={(e) => setEditListingForm({ ...editListingForm, subCategory: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Prezzo e Durata */}
              <div>
                <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-brand" /> Prezzo e Durata
                </h4>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prezzo (€)</label>
                    <input
                      type="number"
                      value={editListingForm.price}
                      onChange={(e) => setEditListingForm({ ...editListingForm, price: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unità</label>
                    <select
                      value={editListingForm.priceUnit}
                      onChange={(e) => setEditListingForm({ ...editListingForm, priceUnit: e.target.value as any })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none bg-white"
                    >
                      <option value="ora">Ora</option>
                      <option value="giorno">Giorno</option>
                      <option value="settimana">Settimana</option>
                      <option value="mese">Mese</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deposito (€)</label>
                    <input
                      type="number"
                      value={editListingForm.deposit}
                      onChange={(e) => setEditListingForm({ ...editListingForm, deposit: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cancellazione</label>
                    <select
                      value={editListingForm.cancellationPolicy}
                      onChange={(e) => setEditListingForm({ ...editListingForm, cancellationPolicy: e.target.value as any })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none bg-white"
                    >
                      <option value="flexible">Flessibile</option>
                      <option value="moderate">Moderata</option>
                      <option value="strict">Rigida</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-brand" /> Location
                </h4>
                <input
                  type="text"
                  value={editListingForm.location}
                  onChange={(e) => setEditListingForm({ ...editListingForm, location: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  placeholder="es. Milano, Italia"
                />
              </div>

              {/* Stato Annuncio */}
              <div>
                <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-brand" /> Stato Annuncio
                </h4>
                <div className="flex gap-3">
                  {['published', 'draft', 'suspended', 'hidden'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setEditListingForm({ ...editListingForm, status })}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                        editListingForm.status === status
                          ? status === 'published' ? 'bg-green-500 text-white' :
                            status === 'suspended' ? 'bg-red-500 text-white' :
                            status === 'hidden' ? 'bg-gray-500 text-white' :
                            'bg-yellow-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {status === 'published' ? '✓ Pubblicato' :
                       status === 'suspended' ? '⛔ Sospeso' :
                       status === 'hidden' ? '👁 Nascosto' : '📝 Bozza'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hubber Info */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-bold text-gray-900 mb-3">Proprietario (Hubber)</h4>
                <div className="flex items-center">
                  <img
                    src={selectedListingForEdit.owner?.avatar || 'https://via.placeholder.com/40'}
                    className="w-10 h-10 rounded-full mr-3"
                    alt=""
                  />
                  <div>
                    <p className="font-bold text-gray-900">{selectedListingForEdit.owner?.name || 'N/A'}</p>
                    <p className="text-sm text-gray-500">{selectedListingForEdit.owner?.email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Nota Admin per notifica Hubber */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="font-bold text-blue-900 mb-2 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" /> Messaggio all'Hubber
                </h4>
                <p className="text-sm text-blue-700 mb-3">
                  Se inserisci un messaggio, verrà inviato all'hubber nella sezione <strong>Messaggi</strong> come comunicazione dal Supporto RentHubber.
                </p>
                <textarea
                  value={adminActionNote}
                  onChange={(e) => setAdminActionNote(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="es. Abbiamo sospeso il tuo annuncio perché mancano le immagini..."
                />
              </div>

              {/* Zona Pericolo */}
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <h4 className="font-bold text-red-900 mb-3 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" /> Zona Pericolo
                </h4>
                <button
                  type="button"
                  onClick={() => setShowListingDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-colors flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Elimina Annuncio
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => setSelectedListingForEdit(null)}
                className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
              >
                Annulla
              </button>
              <button
                onClick={handleSaveListing}
                disabled={isListingSaving}
                className="px-6 py-2.5 bg-brand text-white rounded-lg font-bold shadow-md hover:bg-brand-dark disabled:opacity-50 flex items-center"
              >
                {isListingSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> Salva Modifiche
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== LISTING DELETE CONFIRM MODAL ========== */}
      {showListingDeleteConfirm && selectedListingForEdit && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Eliminare questo annuncio?
              </h3>
              <p className="text-gray-500 mb-6">
                Stai per eliminare <strong>"{selectedListingForEdit.title}"</strong>. 
                Questa azione è irreversibile e l'annuncio non potrà essere recuperato.
              </p>
              
              {/* Nota per l'hubber */}
              <div className="text-left mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo (opzionale, verrà notificato all'hubber)
                </label>
                <textarea
                  value={adminActionNote}
                  onChange={(e) => setAdminActionNote(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none"
                  placeholder="es. L'annuncio viola le nostre policy..."
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowListingDeleteConfirm(false);
                    setAdminActionNote('');
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleDeleteListing}
                  disabled={isListingSaving}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isListingSaving ? 'Eliminazione...' : 'Sì, Elimina'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== CREATE LISTING MODAL ========== */}
      {showCreateListingModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-brand text-white">
              <h3 className="font-bold flex items-center">
                <Plus className="w-5 h-5 mr-2" /> Crea Nuovo Annuncio
              </h3>
              <button
                onClick={() => {
                  setShowCreateListingModal(false);
                  setListingSaveError(null);
                }}
                className="text-white/80 hover:text-white p-1 hover:bg-white/20 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {listingSaveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  {listingSaveError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titolo *</label>
                <input
                  type="text"
                  value={newListingForm.title}
                  onChange={(e) => setNewListingForm({ ...newListingForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  placeholder="es. Fotocamera Canon EOS R5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assegna a Hubber *</label>
                <select
                  value={newListingForm.hostId}
                  onChange={(e) => setNewListingForm({ ...newListingForm, hostId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none bg-white"
                >
                  <option value="">-- Seleziona Hubber --</option>
                  {localUsers
                    .filter(u => u.roles?.includes('hubber') || u.role === 'hubber')
                    .map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                <textarea
                  value={newListingForm.description}
                  onChange={(e) => setNewListingForm({ ...newListingForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none resize-none"
                  placeholder="Descrizione dettagliata..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select
                    value={newListingForm.category}
                    onChange={(e) => setNewListingForm({ ...newListingForm, category: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none bg-white"
                  >
                    <option value="oggetto">Oggetto</option>
                    <option value="spazio">Spazio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sottocategoria</label>
                  <input
                    type="text"
                    value={newListingForm.subCategory}
                    onChange={(e) => setNewListingForm({ ...newListingForm, subCategory: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                    placeholder="es. Fotografia"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prezzo (€)</label>
                  <input
                    type="number"
                    value={newListingForm.price}
                    onChange={(e) => setNewListingForm({ ...newListingForm, price: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unità</label>
                  <select
                    value={newListingForm.priceUnit}
                    onChange={(e) => setNewListingForm({ ...newListingForm, priceUnit: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none bg-white"
                  >
                    <option value="ora">Ora</option>
                    <option value="giorno">Giorno</option>
                    <option value="settimana">Settimana</option>
                    <option value="mese">Mese</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deposito (€)</label>
                  <input
                    type="number"
                    value={newListingForm.deposit}
                    onChange={(e) => setNewListingForm({ ...newListingForm, deposit: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={newListingForm.location}
                  onChange={(e) => setNewListingForm({ ...newListingForm, location: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  placeholder="es. Milano, Italia"
                />
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => {
                  setShowCreateListingModal(false);
                  setListingSaveError(null);
                }}
                className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
              >
                Annulla
              </button>
              <button
                onClick={handleCreateListing}
                disabled={isListingSaving}
                className="px-6 py-2.5 bg-brand text-white rounded-lg font-bold shadow-md hover:bg-brand-dark disabled:opacity-50 flex items-center"
              >
                {isListingSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creazione...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" /> Crea Annuncio
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== WALLET MANAGEMENT MODAL ========== */}
      {showWalletModal && selectedWalletUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className={`p-5 border-b border-gray-100 flex justify-between items-center ${
              walletModalMode === 'credit' ? 'bg-green-600' : 'bg-red-600'
            } text-white`}>
              <h3 className="font-bold flex items-center">
                <Wallet className="w-5 h-5 mr-2" /> 
                {walletModalMode === 'credit' ? 'Aggiungi Fondi' : 'Rimuovi Fondi'}
              </h3>
              <button
                onClick={() => {
                  setShowWalletModal(false);
                  setSelectedWalletUser(null);
                }}
                className="text-white/80 hover:text-white p-1 hover:bg-white/20 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Info Utente */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <img 
                  src={selectedWalletUser.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedWalletUser.user?.first_name || 'U')}&background=random`}
                  alt=""
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-bold text-gray-900">
                    {selectedWalletUser.user?.first_name} {selectedWalletUser.user?.last_name}
                  </p>
                  <p className="text-sm text-gray-500">{selectedWalletUser.user?.email}</p>
                  <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                    <p>💰 Wallet Hubber: <span className="font-bold text-green-600">€ {(selectedWalletUser.hubberBalanceEur || 0).toFixed(2)}</span></p>
                    <p>👤 Wallet Renter: <span className="font-bold text-blue-600">€ {(selectedWalletUser.renterBalanceEur || 0).toFixed(2)}</span></p>
                  </div>
                </div>
              </div>

              {/* Toggle Aggiungi/Rimuovi */}
              <div className="flex gap-2">
                <button
                  onClick={() => setWalletModalMode('credit')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    walletModalMode === 'credit'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ➕ Aggiungi
                </button>
                <button
                  onClick={() => setWalletModalMode('debit')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    walletModalMode === 'debit'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ➖ Rimuovi
                </button>
              </div>

              {/* ✨ NUOVO: Selezione Tipo Wallet */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💼 Wallet di destinazione *
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setWalletType('hubber')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                      walletType === 'hubber'
                        ? 'bg-brand text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    🏠 Wallet Hubber
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalletType('renter')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                      walletType === 'renter'
                        ? 'bg-brand text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    👤 Wallet Renter
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Scegli quale wallet modificare per questo utente
                </p>
              </div>

              {/* Importo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Importo (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={walletAmount}
                  onChange={(e) => setWalletAmount(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  placeholder="0.00"
                />
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo *
                </label>
                <select
                  value={walletReason}
                  onChange={(e) => setWalletReason(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none bg-white"
                >
                  <option value="">-- Seleziona motivo --</option>
                  {walletModalMode === 'credit' ? (
                    <>
                      <option value="Bonus promozionale">Bonus promozionale</option>
                      <option value="Rimborso">Rimborso</option>
                      <option value="Bonus invita amico">Bonus invita amico</option>
                      <option value="Compensazione">Compensazione</option>
                      <option value="Correzione errore">Correzione errore</option>
                      <option value="Altro">Altro</option>
                    </>
                  ) : (
                    <>
                      <option value="Storno">Storno</option>
                      <option value="Penale">Penale</option>
                      <option value="Correzione errore">Correzione errore</option>
                      <option value="Addebito manuale">Addebito manuale</option>
                      <option value="Altro">Altro</option>
                    </>
                  )}
                </select>
              </div>

              {/* Note aggiuntive */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note aggiuntive
                </label>
                <textarea
                  value={walletNote}
                  onChange={(e) => setWalletNote(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none resize-none"
                  placeholder="Dettagli opzionali..."
                />
              </div>

              {/* Warning per rimozione */}
              {walletModalMode === 'debit' && (() => {
                const currentBalance = walletType === 'hubber' 
                  ? (selectedWalletUser.hubberBalanceEur || 0)
                  : (selectedWalletUser.renterBalanceEur || 0);
                const amount = parseFloat(walletAmount);
                
                return amount > currentBalance && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    ⚠️ L'importo supera il saldo disponibile nel wallet {walletType === 'hubber' ? 'Hubber' : 'Renter'} (€{currentBalance.toFixed(2)})!
                  </div>
                );
              })()}
            </div>

            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => {
                  setShowWalletModal(false);
                  setSelectedWalletUser(null);
                }}
                className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
              >
                Annulla
              </button>
              <button
                onClick={async () => {
                  if (!walletAmount || !walletReason) {
                    alert('Compila importo e motivo');
                    return;
                  }
                  
                  const amount = parseFloat(walletAmount);
                  if (amount <= 0) {
                    alert('L\'importo deve essere maggiore di 0');
                    return;
                  }

                  // Validazione saldo per debit - controlla il wallet giusto
                  if (walletModalMode === 'debit') {
                    const currentBalance = walletType === 'hubber' 
                      ? (selectedWalletUser.hubberBalanceEur || 0)
                      : (selectedWalletUser.renterBalanceEur || 0);
                    
                    if (amount > currentBalance) {
                      alert(`Saldo insufficiente nel wallet ${walletType === 'hubber' ? 'Hubber' : 'Renter'} (disponibile: €${currentBalance.toFixed(2)})`);
                      return;
                    }
                  }

                  setWalletSaving(true);
                  try {
                    if (walletModalMode === 'credit') {
                      await api.wallet.adminCredit(
                        selectedWalletUser.user_id,
                        amount,
                        walletReason,
                        walletNote,
                        walletType // ✨ NUOVO
                      );
                    } else {
                      await api.wallet.adminDebit(
                        selectedWalletUser.user_id,
                        amount,
                        walletReason,
                        walletNote,
                        walletType // ✨ NUOVO
                      );
                    }

                    // Aggiorna stato locale - aggiorna il wallet specifico
                    setLocalWallets(prev => prev.map(w => {
                      if (w.user_id !== selectedWalletUser.user_id) return w;
                      
                      const delta = walletModalMode === 'credit' ? amount : -amount;
                      
                      if (walletType === 'hubber') {
                        const newHubberBalance = (w.hubberBalanceEur || 0) + delta;
                        return { 
                          ...w, 
                          hubberBalanceEur: newHubberBalance,
                          balanceEur: newHubberBalance + (w.renterBalanceEur || 0)
                        };
                      } else {
                        const newRenterBalance = (w.renterBalanceEur || 0) + delta;
                        return { 
                          ...w, 
                          renterBalanceEur: newRenterBalance,
                          balanceEur: (w.hubberBalanceEur || 0) + newRenterBalance
                        };
                      }
                    }));

                    // Ricarica transazioni
                    const txData = await api.admin.getAllWalletTransactions();
                    if (txData) setLocalWalletTransactions(txData);

                    alert(`✅ ${walletModalMode === 'credit' ? 'Fondi aggiunti' : 'Fondi rimossi'} con successo!`);
                    setShowWalletModal(false);
                    setSelectedWalletUser(null);
                  } catch (error: any) {
                    console.error('Errore gestione wallet:', error);
                    alert('❌ Errore: ' + (error.message || 'Operazione fallita'));
                  } finally {
                    setWalletSaving(false);
                  }
                }}
                disabled={walletSaving || !walletAmount || !walletReason}
                className={`px-6 py-2.5 text-white rounded-lg font-bold shadow-md disabled:opacity-50 flex items-center ${
                  walletModalMode === 'credit' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {walletSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Elaborazione...
                  </>
                ) : (
                  <>
                    {walletModalMode === 'credit' ? '➕ Aggiungi Fondi' : '➖ Rimuovi Fondi'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};