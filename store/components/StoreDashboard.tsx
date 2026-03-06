// ============================================================
// RENTHUBBER STORE - Dashboard Completa
// Path: store/components/StoreDashboard.tsx
// ============================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ScanLine, Calendar, Euro, MessageSquare,
  User, LogOut, Loader2, RefreshCw, AlertTriangle, CheckCircle,
  Clock, Eye, Camera, QrCode, ChevronDown, ChevronUp, Star,
  TrendingUp, Box, ArrowRight, Search, Filter, Send, FileText,
  Shield, XCircle, Info, Receipt, CreditCard, Wallet, BarChart3,
  MapPin, Phone, Mail, Building, Award,  Save, Pencil, Trash2, X
} from 'lucide-react';
import { useStoreAuth } from '../context/StoreAuthContext';
import { supabase } from '../../services/supabaseClient';
import {
  StoreInventoryItem, StoreOperation, StoreTransaction,
  StoreBalance, StoreMessage, StoreReview, StoreReport
} from '../types/store.types';
import { StoreChangePasswordModal } from './StoreChangePasswordModal';
import { StoreSubscriptionModal } from './StoreSubscriptionModal';
import { StoreOperations } from './StoreOperations';


// ============================================================
// TYPES & CONFIG
// ============================================================
type Tab = 'overview' | 'inventory' | 'operations' | 'bookings' | 'accounting' | 'reviews' | 'messages' | 'profile' | 'subscription';

const TABS: { id: Tab; label: string; icon: React.ReactNode; short: string }[] = [
  { id: 'overview', label: 'Panoramica', icon: <LayoutDashboard className="w-4 h-4" />, short: 'Home' },
  { id: 'inventory', label: 'Inventario', icon: <Package className="w-4 h-4" />, short: 'Inventario' },
  { id: 'operations', label: 'Operazioni', icon: <ScanLine className="w-4 h-4" />, short: 'Scan' },
  { id: 'bookings', label: 'Prenotazioni', icon: <Calendar className="w-4 h-4" />, short: 'Ritiri' },
  { id: 'accounting', label: 'Contabilità', icon: <Euro className="w-4 h-4" />, short: 'Conto' },
  { id: 'reviews', label: 'Recensioni', icon: <Star className="w-4 h-4" />, short: 'Review' },
  { id: 'messages', label: 'Messaggi', icon: <MessageSquare className="w-4 h-4" />, short: 'Chat' },
  { id: 'profile', label: 'Profilo', icon: <User className="w-4 h-4" />, short: 'Profilo' },
  { id: 'subscription', label: 'Abbonamento', icon: <CreditCard className="w-4 h-4" />, short: 'Sub' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  in_custody: { label: 'In custodia', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  rented_out: { label: 'Noleggiato', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  returned: { label: 'Restituito', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  grace_period: { label: 'Periodo grazia', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  paid_custody: { label: 'Custodia a pagamento', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  completed: { label: 'Completato', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  voluntarily_stored: { label: 'Custodia volontaria', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200' },
};

const OPERATION_LABELS: Record<string, string> = {
  checkin_deposit: '📦 Deposito Hubber',
  checkout_renter: '🤝 Ritiro Renter',
  checkin_return: '↩️ Riconsegna Renter',
  checkout_hubber: '✅ Ritiro Hubber',
};

const TX_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  activation_fee: { label: 'Quota Attivazione', color: 'text-blue-600' },
  subscription: { label: 'Abbonamento', color: 'text-purple-600' },
  booking_commission: { label: 'Commissione', color: 'text-green-600' },
  custody_fee: { label: 'Custodia', color: 'text-amber-600' },
  payout: { label: 'Pagamento', color: 'text-brand' },
  refund: { label: 'Rimborso', color: 'text-red-600' },
  credit_note: { label: 'Nota Credito', color: 'text-gray-600' },
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export const StoreDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { store, refreshStore, logout } = useStoreAuth();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [inventory, setInventory] = useState<StoreInventoryItem[]>([]);
  const [operations, setOperations] = useState<StoreOperation[]>([]);
  const [transactions, setTransactions] = useState<StoreTransaction[]>([]);
  const [balance, setBalance] = useState<StoreBalance | null>(null);
  const [messages, setMessages] = useState<StoreMessage[]>([]);
  const [reviews, setReviews] = useState<StoreReview[]>([]);
  const [reports, setReports] = useState<StoreReport[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Filters
  const [inventoryFilter, setInventoryFilter] = useState('all');
  const [inventorySearch, setInventorySearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [txFilter, setTxFilter] = useState('all');

  // 🖊️ PROFILO EDIT STATE
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    business_name: '',
    email: '',
    phone: '',
    description: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    vat_number: '',
    legal_representative: '',
    pec: '',
    sdi_code: '',
    opening_hours: {} as Record<string, { open: string; close: string } | null>,
  });
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const profilePhotoRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingProfile && store) {
      setProfileForm({
        business_name: store.business_name || '',
        email: store.email || '',
        phone: store.phone || '',
        description: store.description || '',
        address: store.address || '',
        city: store.city || '',
        province: store.province || '',
        postal_code: store.postal_code || '',
        vat_number: store.vat_number || '',
        legal_representative: store.legal_representative || '',
        pec: store.pec || '',
        sdi_code: store.sdi_code || '',
        opening_hours: store.opening_hours || {},
      });
      setProfilePhotoPreview(store.profile_photo_url || null);
      setGalleryPreviews(store.photos || []);
    }
  }, [isEditingProfile, store]);

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setProfilePhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setGalleryFiles(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => setGalleryPreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const handleGalleryRemove = (index: number) => {
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    const existingCount = store?.photos?.length || 0;
    if (index >= existingCount) {
      const newFileIndex = index - existingCount;
      setGalleryFiles(prev => prev.filter((_, i) => i !== newFileIndex));
    }
  };

  const updateHour = (day: string, field: 'open' | 'close', value: string) => {
    setProfileForm(prev => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: {
          open: field === 'open' ? value : (prev.opening_hours[day]?.open || '09:00'),
          close: field === 'close' ? value : (prev.opening_hours[day]?.close || '19:00'),
        }
      }
    }));
  };

  const toggleDay = (day: string) => {
    setProfileForm(prev => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: prev.opening_hours[day] ? null : { open: '09:00', close: '19:00' }
      }
    }));
  };

  const handleSaveProfile = async () => {
    if (!store) return;
    setIsSavingProfile(true);
    try {
      let profilePhotoUrl = store.profile_photo_url;
      let galleryUrls = [...(store.photos || [])];

      if (profilePhotoFile) {
        const ext = profilePhotoFile.name.split('.').pop();
        const fileName = `store_${store.id}_profile_${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('images')
          .upload(`stores/${fileName}`, profilePhotoFile, { upsert: true });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('images').getPublicUrl(`stores/${fileName}`);
          profilePhotoUrl = urlData.publicUrl;
        }
      }

      for (const file of galleryFiles) {
        const ext = file.name.split('.').pop();
        const fileName = `store_${store.id}_gallery_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('images')
          .upload(`stores/${fileName}`, file, { upsert: true });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('images').getPublicUrl(`stores/${fileName}`);
          galleryUrls.push(urlData.publicUrl);
        }
      }

      const existingPhotos = store.photos || [];
      const keptExisting = existingPhotos.filter((url: string) => galleryPreviews.includes(url));
      const newUploaded = galleryUrls.filter(url => !existingPhotos.includes(url));
      const finalGallery = [...keptExisting, ...newUploaded];

      const { error } = await supabase
        .from('stores')
        .update({
          business_name: profileForm.business_name,
          email: profileForm.email,
          phone: profileForm.phone,
          description: profileForm.description,
          address: profileForm.address,
          city: profileForm.city,
          province: profileForm.province,
          postal_code: profileForm.postal_code,
          vat_number: profileForm.vat_number,
          legal_representative: profileForm.legal_representative,
          pec: profileForm.pec,
          sdi_code: profileForm.sdi_code,
          opening_hours: profileForm.opening_hours,
          profile_photo_url: profilePhotoUrl,
          photos: finalGallery,
        })
        .eq('id', store.id);

      if (error) throw error;

      setProfilePhotoFile(null);
      setGalleryFiles([]);
      setIsEditingProfile(false);
      await refreshStore();
      await loadAllData();
      alert('Profilo aggiornato con successo!');
    } catch (err) {
      console.error('Errore salvataggio profilo:', err);
      alert('Errore durante il salvataggio. Riprova.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  useEffect(() => {
    if (store) loadAllData();
  }, [store]);

  const loadAllData = async () => {
    if (!store) return;
    setIsLoading(true);
    // Carica bookings in background senza bloccare
    loadBookings();
    try {
      const [invR, opsR, txR, balR, msgR, revR, repR, storeListingsRes] = await Promise.all([
        supabase.from('store_inventory').select('*, store_item_codes(code)').eq('store_id', store.id).order('created_at', { ascending: false }),
        supabase.from('store_operations').select('*').eq('store_id', store.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('store_transactions').select('*').eq('store_id', store.id).order('created_at', { ascending: false }),
        supabase.from('store_balances').select('*').eq('store_id', store.id).single(),
        supabase.from('store_messages').select('*').eq('store_id', store.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('store_reviews').select('*').eq('store_id', store.id).order('created_at', { ascending: false }),
        supabase.from('store_reports').select('*').eq('store_id', store.id).order('created_at', { ascending: false }),
        supabase
  .from('listings')
  .select('id')
  .eq('store_id', store.id),
      ]);

      const invItems = invR.data || [];
      // Carica dati listing e hubber separatamente
      const listingIds = [...new Set(invItems.map((i: any) => i.listing_id))];
      const hubberIds = [...new Set(invItems.map((i: any) => i.hubber_id))];
      
      const [listingsRes, hubbersRes] = await Promise.all([
        listingIds.length > 0 ? supabase.from('listings').select('id, title, images, short_code').in('id', listingIds) : { data: [] },
        hubberIds.length > 0 ? supabase.from('users').select('id, first_name, last_name, phone_number').in('id', hubberIds) : { data: [] },
      ]);
      
      const listingsMap = Object.fromEntries((listingsRes.data || []).map((l: any) => [l.id, l]));
      const hubbersMap = Object.fromEntries((hubbersRes.data || []).map((u: any) => [u.id, u]));

      setInventory(invItems.map((item: any) => {
        const listing = listingsMap[item.listing_id];
        const hubber = hubbersMap[item.hubber_id];
        return {
          ...item,
          item_code: item.store_item_codes?.code || listing?.short_code || '—',
          listing_title: listing?.title || 'Annuncio',
          listing_images: listing?.images || [],
          listing_short_code: listing?.short_code || '',
          hubber_name: hubber ? `${hubber.first_name} ${hubber.last_name}` : 'Hubber',
          hubber_phone: hubber?.phone_number || null,
        };
      }));
      setOperations(opsR.data || []);
      setTransactions(txR.data || []);
      setBalance(balR.data || null);
      setMessages(msgR.data || []);
      setReviews(revR.data || []);
      setReports(repR.data || []);
    } catch (err) {
      console.error('Errore caricamento dati store:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBookings = async () => {
    if (!store) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-store-bookings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ store_id: store.id }),
        }
      ).then(r => r.json());
      setBookings(res.data || []);
    } catch (e) {
      console.warn('Bookings non disponibili:', e);
    }
  };

  // COMPUTED

  const activeItems = useMemo(() => inventory.filter(i => i.status !== 'completed'), [inventory]);
  const todayOps = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return operations.filter(o => o.created_at.startsWith(today));
  }, [operations]);
  const unreadMessages = useMemo(() => messages.filter(m => !m.is_read && m.sender_type === 'user'), [messages]);
  const pendingReports = useMemo(() => reports.filter(r => !r.is_resolved), [reports]);
  const todayBookings = useMemo(() => {
  const today = new Date().toISOString().slice(0, 10);
  return bookings.filter(b => b.start_date === today);
}, [bookings]);

  const filteredInventory = useMemo(() => {
    let items = [...inventory];
    if (inventoryFilter !== 'all') items = items.filter(i => i.status === inventoryFilter);
    if (inventorySearch.trim()) {
      const q = inventorySearch.toLowerCase();
      items = items.filter(i =>
        i.item_code?.toLowerCase().includes(q) ||
        i.listing_id.toLowerCase().includes(q) ||
        i.notes?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [inventory, inventoryFilter, inventorySearch]);

  const filteredTransactions = useMemo(() => {
    if (txFilter === 'all') return transactions;
    return transactions.filter(t => t.transaction_type === txFilter);
  }, [transactions, txFilter]);

  const monthlyRevenue = useMemo(() => {
    const m = new Date().toISOString().slice(0, 7);
    return transactions
      .filter(t => t.created_at.startsWith(m) && t.status === 'completed' && t.store_share)
      .reduce((sum, t) => sum + (t.store_share || 0), 0);
  }, [transactions]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatCents = (cents: number) => `€${(cents / 100).toFixed(2)}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatDateTime = (d: string) => new Date(d).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  if (!store) return null;

  const pickupProgress = Math.min((store.completed_pickups / store.welcome_pack_limit) * 100, 100);

  // ============================================================
  // RENDER SHELL
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* CAMBIO PASSWORD OBBLIGATORIO AL PRIMO ACCESSO */}
      {store?.must_change_password && !passwordChanged && (
        <StoreChangePasswordModal
          storeId={store.id}
          onSuccess={() => {
            setPasswordChanged(true);
            refreshStore();
          }}
        />
      )}

      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="https://upyznglekmynztmydtxi.supabase.co/storage/v1/object/public/images/renthubberStoreAutorizzato.webp"
              alt="Store"
              className="w-10 h-10 rounded-full bg-white border-2 border-brand-accent object-contain"
            />
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900">{store.business_name}</h1>
              <p className="text-xs text-gray-500">
                Store Autorizzato · {store.city}
                {store.subscription_status === 'welcome_pack' && (
                  <span className="ml-2 text-brand-accent font-medium">
                    Welcome Pack ({store.completed_pickups}/{store.welcome_pack_limit})
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={loadAllData} className="text-gray-400 hover:text-brand transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* BANNER ABBONAMENTO */}
      {store?.subscription_status !== 'active' && store?.subscription_status !== 'welcome_pack' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CreditCard className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              {store?.subscription_status === 'past_due'
                ? '⚠️ Pagamento in sospeso — aggiorna il metodo di pagamento per continuare a operare.'
                : 'Attiva l\'abbonamento per iniziare a operare (€10 + IVA/mese).'}
            </p>
          </div>
          <button
            onClick={() => setShowSubscriptionModal(true)}
            className="flex-shrink-0 bg-amber-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors font-medium whitespace-nowrap"
          >
            {store?.subscription_status === 'past_due' ? 'Aggiorna pagamento' : 'Attiva ora'}
          </button>
        </div>
      )}

      {/* TABS + CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex space-x-1 bg-white rounded-xl p-1 border border-gray-200 mb-6 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === t.id
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.short}</span>
              {t.id === 'messages' && unreadMessages.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadMessages.length}
                </span>
              )}
              {t.id === 'bookings' && todayBookings.length > 0 && (
                <span className="bg-orange-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {todayBookings.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'inventory' && renderInventory()}
            {activeTab === 'operations' && <StoreOperations store={store!} />}
            {activeTab === 'bookings' && renderBookings()}
            {activeTab === 'accounting' && renderAccounting()}
            {activeTab === 'reviews' && renderReviews()}
            {activeTab === 'messages' && renderMessages()}
            {activeTab === 'profile' && renderProfile()}
            {activeTab === 'subscription' && renderSubscription()}
          </>
        )}
      </div>
    <StoreSubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        storeId={store.id}
        storeName={store.business_name}
        onSuccess={() => {
          setShowSubscriptionModal(false);
          refreshStore();
        }}
      />
    </div>
    );
   
   // ============================================================
  // ABBONAMENTO
  // ============================================================
  function renderSubscription() {
    const isActive = store.subscription_status === 'active';
    const isWelcomePack = store.subscription_status === 'welcome_pack';
    const isPastDue = store.subscription_status === 'past_due';
    const periodEnd = store.subscription_current_period_end
      ? new Date(store.subscription_current_period_end).toLocaleDateString('it-IT')
      : null;

    return (
      <div className="max-w-lg mx-auto space-y-4">

        {/* Stato abbonamento */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Stato abbonamento</h2>

          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">Piano</span>
            <span className="text-sm font-medium text-gray-900">
              {isWelcomePack ? 'Welcome Pack · gratuito' : 'Piano Store · €10 + IVA/mese'}
            </span>
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">Stato</span>
            {isActive || isWelcomePack ? (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                <CheckCircle className="w-3.5 h-3.5" />
                Attivo
              </span>
            ) : isPastDue ? (
              <span className="flex items-center gap-1.5 text-sm font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                <AlertTriangle className="w-3.5 h-3.5" />
                Pagamento in sospeso
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-sm font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-full">
                <XCircle className="w-3.5 h-3.5" />
                Non attivo
              </span>
            )}
          </div>

          {periodEnd && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">Prossimo rinnovo</span>
              <span className="text-sm font-medium text-gray-900">{periodEnd}</span>
            </div>
          )}

          {store.stripe_customer_id && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cliente Stripe</span>
              <span className="text-xs text-gray-400 font-mono">{store.stripe_customer_id}</span>
            </div>
          )}
        </div>

        {/* CTA se non attivo */}
        {!isActive && !isWelcomePack && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
            <p className="text-sm text-amber-800 mb-3">
              {isPastDue
                ? 'Il pagamento del rinnovo è fallito. Aggiorna il metodo di pagamento per continuare a operare.'
                : 'Attiva l\'abbonamento per iniziare a operare.'}
            </p>
            <button
              onClick={() => setShowSubscriptionModal(true)}
              className="bg-amber-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-amber-700 transition-colors font-medium"
            >
              {isPastDue ? 'Aggiorna pagamento' : 'Attiva ora · €12,20/mese'}
            </button>
          </div>
        )}

      </div>
    );
  }

  // ============================================================
  // 1️⃣ PANORAMICA
  // ============================================================
  function renderOverview() {
    return (
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-brand to-brand-dark rounded-2xl p-6 text-white">
          <h2 className="text-xl font-bold">Benvenuto, {store!.business_name}! 👋</h2>
          <p className="text-white/80 text-sm mt-1">Ecco la tua situazione in tempo reale.</p>
          {store!.subscription_status === 'welcome_pack' && (
            <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <div className="flex justify-between text-xs mb-1">
                <span>Welcome Pack: {store!.completed_pickups}/{store!.welcome_pack_limit} ritiri</span>
                <span>{pickupProgress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-brand-accent rounded-full h-2 transition-all"
                  style={{ width: `${pickupProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard icon={<Box className="w-5 h-5" />} label="Oggetti in Store" value={activeItems.length} color="blue" />
          <KPICard icon={<ScanLine className="w-5 h-5" />} label="Operazioni Oggi" value={todayOps.length} color="brand" />
          <KPICard icon={<Euro className="w-5 h-5" />} label="Guadagni Mese" value={formatCents(monthlyRevenue)} color="green" />
          <KPICard icon={<Star className="w-5 h-5" />} label="Rating" value={store!.average_rating > 0 ? `${store!.average_rating} ⭐` : 'N/A'} color="amber" />
        </div>

        {/* Quick Actions + Recent */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <ScanLine className="w-5 h-5 mr-2 text-brand" /> Azioni Rapide
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Nuovo Check-in', icon: <Package className="w-5 h-5" />, tab: 'operations' as Tab },
                { label: 'Inventario', icon: <Box className="w-5 h-5" />, tab: 'inventory' as Tab },
                { label: 'Contabilità', icon: <Wallet className="w-5 h-5" />, tab: 'accounting' as Tab },
                { label: 'Messaggi', icon: <MessageSquare className="w-5 h-5" />, tab: 'messages' as Tab },
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTab(action.tab)}
                  className="flex flex-col items-center p-4 rounded-xl border border-gray-100 hover:bg-brand/5 hover:border-brand/20 transition-all text-gray-700 hover:text-brand"
                >
                  {action.icon}
                  <span className="text-xs font-medium mt-2">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Operations */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-brand" /> Ultime Operazioni
            </h3>
            {operations.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Nessuna operazione ancora</p>
            ) : (
              <div className="space-y-3">
                {operations.slice(0, 5).map(op => (
                  <div key={op.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {OPERATION_LABELS[op.operation_type] || op.operation_type}
                      </p>
                      <p className="text-xs text-gray-500">{formatDateTime(op.created_at)}</p>
                    </div>
                    {op.photos && (op.photos as string[]).length > 0 && (
                      <Camera className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        {(pendingReports.length > 0 || unreadMessages.length > 0) && (
          <div className="space-y-3">
            {pendingReports.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-700">{pendingReports.length} segnalazione/i aperta/e</p>
                  <p className="text-xs text-red-500">Richiede la tua attenzione</p>
                </div>
              </div>
            )}
            {unreadMessages.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('messages')}>
                <MessageSquare className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-700">{unreadMessages.length} messaggio/i non letto/i</p>
                  <p className="text-xs text-blue-500">Clicca per visualizzare</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // 2️⃣ INVENTARIO
  // ============================================================
  function renderInventory() {

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900">Inventario Store</h2>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca codice o nome..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm w-full sm:w-48 focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
              />
            </div>
            <select
              value={inventoryFilter}
              onChange={(e) => setInventoryFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-brand outline-none"
            >
              <option value="all">Tutti ({inventory.length})</option>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.label} ({inventory.filter(i => i.status === key).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredInventory.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nessun oggetto in inventario</p>
            <p className="text-gray-400 text-sm mt-1">Gli oggetti appariranno qui dopo il primo deposito</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInventory.map(item => {
              const statusCfg = STATUS_CONFIG[item.status] || { label: item.status, color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' };
              return (
                <div key={item.id} onClick={() => setSelectedItem(item)}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:border-brand/30 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    {/* Foto annuncio */}
                    {item.listing_images?.[0] ? (
                      <img src={item.listing_images[0]} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-gray-200" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}

                    {/* Info principali */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-gray-900 text-sm truncate">{item.listing_title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-mono font-bold text-brand">{item.item_code}</span>
                        <span>·</span>
                        <span>{item.hubber_name}</span>
                      </div>
                      {item.deposited_at && (
                        <p className="text-[10px] text-gray-400 mt-0.5">Deposito: {formatDate(item.deposited_at)}</p>
                      )}
                    </div>

                    {/* Status badge */}
                    <span className={`text-[10px] font-medium px-2 py-1 rounded-full border ${statusCfg.bg} ${statusCfg.color} whitespace-nowrap flex-shrink-0`}>
                      {statusCfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL DETTAGLIO OGGETTO */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl overflow-hidden max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">Dettaglio Oggetto</h3>
                <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Listing info */}
                <div className="flex items-start gap-4">
                  {selectedItem.listing_images?.[0] && (
                    <img src={selectedItem.listing_images[0]} alt="" className="w-20 h-20 rounded-xl object-cover border border-gray-200" />
                  )}
                  <div>
                    <h4 className="font-bold text-gray-900">{selectedItem.listing_title}</h4>
                    <p className="text-sm font-mono text-brand font-bold mt-0.5">{selectedItem.item_code}</p>
                    <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full border ${(STATUS_CONFIG[selectedItem.status] || {}).bg} ${(STATUS_CONFIG[selectedItem.status] || {}).color}`}>
                      {(STATUS_CONFIG[selectedItem.status] || {}).label || selectedItem.status}
                    </span>
                  </div>
                </div>

                {/* Hubber info */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Hubber</h5>
                  <p className="font-medium text-gray-900">{selectedItem.hubber_name}</p>
                  {selectedItem.hubber_phone && (
                    <a href={`tel:${selectedItem.hubber_phone}`} className="text-sm text-brand hover:underline flex items-center gap-1 mt-1">
                      📞 {selectedItem.hubber_phone}
                    </a>
                  )}
                </div>

                {/* Date */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Timeline</h5>
                  <div className="space-y-1.5 text-sm">
                    {selectedItem.deposited_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">📦 Deposito</span>
                        <span className="text-gray-900 font-medium">{formatDate(selectedItem.deposited_at)}</span>
                      </div>
                    )}
                    {selectedItem.renter_pickup_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">🤝 Ritiro Renter</span>
                        <span className="text-gray-900 font-medium">{formatDate(selectedItem.renter_pickup_at)}</span>
                      </div>
                    )}
                    {selectedItem.renter_return_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">🔄 Riconsegna</span>
                        <span className="text-gray-900 font-medium">{formatDate(selectedItem.renter_return_at)}</span>
                      </div>
                    )}
                    {selectedItem.hubber_pickup_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">✅ Ritiro Hubber</span>
                        <span className="text-gray-900 font-medium">{formatDate(selectedItem.hubber_pickup_at)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tariffe */}
                {(selectedItem.custody_size || selectedItem.custody_daily_rate > 0) && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Custodia</h5>
                    <div className="space-y-1.5 text-sm">
                      {selectedItem.custody_size && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Taglia</span>
                          <span className="text-gray-900 font-medium">{selectedItem.custody_size.toUpperCase()}</span>
                        </div>
                      )}
                      {selectedItem.custody_daily_rate > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tariffa giornaliera</span>
                          <span className="text-gray-900 font-medium">{formatCents(selectedItem.custody_daily_rate)}</span>
                        </div>
                      )}
                      {selectedItem.custody_total_charged > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Totale addebitato</span>
                          <span className="text-gray-900 font-bold text-brand">{formatCents(selectedItem.custody_total_charged)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Note */}
                {selectedItem.notes && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Note</h5>
                    <p className="text-sm text-gray-700">{selectedItem.notes}</p>
                  </div>
                )}

                {/* Foto check-in */}
                {selectedItem.checkin_photos && (selectedItem.checkin_photos as string[]).length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">📸 Foto Deposito</h5>
                    <div className="grid grid-cols-3 gap-2">
                      {(selectedItem.checkin_photos as string[]).map((photo: string, idx: number) => (
                        <img key={idx} src={photo} alt="" className="w-full h-24 rounded-lg object-cover border border-gray-200" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Foto checkout */}
                {selectedItem.checkout_photos && (selectedItem.checkout_photos as string[]).length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">📸 Foto Ritiro</h5>
                    <div className="grid grid-cols-3 gap-2">
                      {(selectedItem.checkout_photos as string[]).map((photo: string, idx: number) => (
                        <img key={idx} src={photo} alt="" className="w-full h-24 rounded-lg object-cover border border-gray-200" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Foto return */}
                {selectedItem.return_photos && (selectedItem.return_photos as string[]).length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">📸 Foto Riconsegna</h5>
                    <div className="grid grid-cols-3 gap-2">
                      {(selectedItem.return_photos as string[]).map((photo: string, idx: number) => (
                        <img key={idx} src={photo} alt="" className="w-full h-24 rounded-lg object-cover border border-gray-200" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // 3️⃣ OPERAZIONI (Scan / Check-in / Check-out)
  // ============================================================
  function renderOperations() {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Operazioni</h2>
        </div>

        {/* Scan Card - Placeholder per futuro QR scanner */}
        <div className="bg-gradient-to-r from-brand to-brand-light rounded-2xl p-6 text-white text-center">
          <QrCode className="w-12 h-12 mx-auto mb-3 opacity-80" />
          <h3 className="text-lg font-bold">Scansiona Codice QR</h3>
          <p className="text-white/70 text-sm mt-1 mb-4">Scansiona il QR dell'oggetto per avviare un'operazione</p>
          <button className="bg-white text-brand font-bold px-6 py-2.5 rounded-xl hover:bg-gray-100 transition-colors">
            Avvia Scansione
          </button>
        </div>

        {/* Operations Log */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Storico Operazioni</h3>
          </div>
          {operations.length === 0 ? (
            <div className="p-8 text-center">
              <ScanLine className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Nessuna operazione registrata</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {operations.map(op => (
                <div key={op.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {OPERATION_LABELS[op.operation_type] || op.operation_type}
                      </p>
                      {op.verified_code && (
                        <p className="text-xs text-gray-500 font-mono mt-0.5">Codice: {op.verified_code}</p>
                      )}
                      {op.notes && <p className="text-xs text-gray-500 mt-0.5">{op.notes}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500">{formatDateTime(op.created_at)}</p>
                      {op.photos && (op.photos as string[]).length > 0 && (
                        <span className="text-xs text-gray-400 flex items-center justify-end mt-0.5">
                          <Camera className="w-3 h-3 mr-1" />{(op.photos as string[]).length} foto
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

 // ============================================================
  // 3️⃣ PRENOTAZIONI
  // ============================================================
  function renderBookings() {
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const monthEnd = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

    const todayB = bookings.filter(b => b.start_date === today);
    const tomorrowB = bookings.filter(b => b.start_date === tomorrow);
    const weekB = bookings.filter(b => b.start_date > tomorrow && b.start_date <= weekEnd);
    const monthB = bookings.filter(b => b.start_date > weekEnd && b.start_date <= monthEnd);

    const renderBookingCard = (b: any) => (
      <div key={b.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-3">
          {b.listings?.images?.[0] ? (
            <img src={b.listings.images[0]} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-gray-200" />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6 text-gray-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">{b.listings?.title || 'Annuncio'}</p>
            <p className="text-xs text-gray-500 font-mono">{b.listings?.short_code || ''}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatDate(b.start_date)} → {formatDate(b.end_date)}
            </p>
            {b.renter && (
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-xs text-gray-700 font-medium">
                  👤 {b.renter.first_name} {b.renter.last_name}
                </span>
                {b.renter.phone_number && (
                  <a href={`tel:${b.renter.phone_number}`} className="text-xs text-brand hover:underline">
                    📞 {b.renter.phone_number}
                  </a>
                )}
              </div>
            )}
          </div>
          <span className={`text-[10px] font-medium px-2 py-1 rounded-full border whitespace-nowrap flex-shrink-0 ${
            b.status === 'confirmed' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            {b.status === 'confirmed' ? 'Confermata' : 'Attiva'}
          </span>
        </div>
      </div>
    );

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900">Prenotazioni</h2>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nessuna prenotazione in corso</p>
            <p className="text-gray-400 text-sm mt-1">Le prenotazioni appariranno qui quando gli Hubber sceglieranno il tuo store</p>
          </div>
        ) : (
          <>
            {todayB.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> Oggi ({todayB.length})
                </h3>
                {todayB.map(renderBookingCard)}
              </div>
            )}
            {tomorrowB.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Domani ({tomorrowB.length})
                </h3>
                {tomorrowB.map(renderBookingCard)}
              </div>
            )}
            {weekB.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" /> Questa settimana ({weekB.length})
                </h3>
                {weekB.map(renderBookingCard)}
              </div>
            )}
            {monthB.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" /> Questo mese ({monthB.length})
                </h3>
                {monthB.map(renderBookingCard)}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ============================================================
  // 4️⃣ CONTABILITÀ
  // ============================================================
  function renderAccounting() {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900">Contabilità</h2>

        {/* Balance Cards */}
        {balance && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard icon={<Wallet className="w-5 h-5" />} label="Saldo Disponibile" value={formatCents(balance.available_balance)} color="green" />
            <KPICard icon={<Clock className="w-5 h-5" />} label="In Attesa" value={formatCents(balance.pending_balance)} color="amber" />
            <KPICard icon={<TrendingUp className="w-5 h-5" />} label="Totale Guadagnato" value={formatCents(balance.total_earned)} color="brand" />
            <KPICard icon={<CreditCard className="w-5 h-5" />} label="Totale Pagato" value={formatCents(balance.total_paid_out)} color="blue" />
          </div>
        )}

        {/* Filter + Transactions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h3 className="font-bold text-gray-900">Transazioni</h3>
            <select
              value={txFilter}
              onChange={(e) => setTxFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-brand outline-none"
            >
              <option value="all">Tutte</option>
              {Object.entries(TX_TYPE_LABELS).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Nessuna transazione</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredTransactions.map(tx => {
                const typeCfg = TX_TYPE_LABELS[tx.transaction_type] || { label: tx.transaction_type, color: 'text-gray-600' };
                const isIncome = ['booking_commission', 'custody_fee'].includes(tx.transaction_type);
                return (
                  <div key={tx.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${typeCfg.color}`}>{typeCfg.label}</p>
                        {tx.description && <p className="text-xs text-gray-500 mt-0.5">{tx.description}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(tx.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${isIncome ? 'text-green-600' : 'text-gray-900'}`}>
                          {isIncome ? '+' : ''}{formatCents(tx.amount)}
                        </p>
                        {tx.store_share !== null && tx.store_share !== undefined && (
                          <p className="text-xs text-gray-400">Tua quota: {formatCents(tx.store_share)}</p>
                        )}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          tx.status === 'completed' ? 'bg-green-50 text-green-600' :
                          tx.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                          'bg-red-50 text-red-600'
                        }`}>
                          {tx.status === 'completed' ? 'Completata' : tx.status === 'pending' ? 'In attesa' : tx.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // 5️⃣ RECENSIONI
  // ============================================================
  function renderReviews() {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Recensioni</h2>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {store!.average_rating > 0 ? store!.average_rating.toFixed(1) : '—'}
            </p>
            <p className="text-xs text-gray-500">{store!.total_reviews} recensioni</p>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nessuna recensione ancora</p>
            <p className="text-gray-400 text-sm mt-1">Le recensioni appariranno dopo i primi ritiri completati</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(rev => (
              <div key={rev.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star
                            key={n}
                            className={`w-4 h-4 ${n <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {rev.reviewer_role === 'hubber' ? 'Hubber' : 'Renter'}
                      </span>
                    </div>
                    {rev.comment && <p className="text-sm text-gray-700 mt-2">{rev.comment}</p>}
                    <p className="text-xs text-gray-400 mt-2">{formatDate(rev.created_at)}</p>
                  </div>
                </div>
                {rev.store_reply && (
                  <div className="mt-3 pl-4 border-l-2 border-brand/30">
                    <p className="text-xs text-gray-500 font-medium">La tua risposta:</p>
                    <p className="text-sm text-gray-700">{rev.store_reply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // 6️⃣ MESSAGGI
  // ============================================================
  function renderMessages() {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900">Messaggi</h2>

        {messages.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nessun messaggio</p>
            <p className="text-gray-400 text-sm mt-1">I messaggi con Hubber e Renter appariranno qui</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`bg-white rounded-xl border shadow-sm p-4 ${
                  !msg.is_read && msg.sender_type === 'user'
                    ? 'border-brand/30 bg-brand/5'
                    : 'border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        msg.sender_type === 'store'
                          ? 'bg-brand/10 text-brand'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {msg.sender_type === 'store' ? 'Tu' : 'Utente'}
                      </span>
                      {!msg.is_read && msg.sender_type === 'user' && (
                        <span className="w-2 h-2 rounded-full bg-brand" />
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{msg.message}</p>
                  </div>
                  <p className="text-xs text-gray-400 whitespace-nowrap">{formatDateTime(msg.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // 7️⃣ PROFILO STORE
  // ============================================================
  function renderProfile() {
    const DAYS_EDIT = [
      { key: 'mon', label: 'Lunedì', short: 'Lun' },
      { key: 'tue', label: 'Martedì', short: 'Mar' },
      { key: 'wed', label: 'Mercoledì', short: 'Mer' },
      { key: 'thu', label: 'Giovedì', short: 'Gio' },
      { key: 'fri', label: 'Venerdì', short: 'Ven' },
      { key: 'sat', label: 'Sabato', short: 'Sab' },
      { key: 'sun', label: 'Domenica', short: 'Dom' },
    ];

    if (!isEditingProfile) {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Profilo Store</h2>
            <button
              onClick={() => setIsEditingProfile(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-bold rounded-xl hover:bg-brand-dark transition-colors"
            >
              <Pencil className="w-4 h-4" /> Modifica Profilo
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center border-2 border-brand/20 overflow-hidden">
                {store!.profile_photo_url ? (
                  <img src={store!.profile_photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <Building className="w-8 h-8 text-brand" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{store!.business_name}</h3>
                <p className="text-sm text-gray-500">{store!.address}, {store!.city} ({store!.province})</p>
              </div>
            </div>

            {store!.description && (
              <p className="text-sm text-gray-600 mb-4 italic">"{store!.description}"</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={store!.email} />
              <InfoRow icon={<Phone className="w-4 h-4" />} label="Telefono" value={store!.phone} />
              <InfoRow icon={<FileText className="w-4 h-4" />} label="P.IVA" value={store!.vat_number} />
              <InfoRow icon={<User className="w-4 h-4" />} label="Rappresentante" value={store!.legal_representative} />
              <InfoRow icon={<MapPin className="w-4 h-4" />} label="CAP" value={store!.postal_code} />
              <InfoRow icon={<Award className="w-4 h-4" />} label="Status" value={
                store!.subscription_status === 'welcome_pack'
                  ? `Welcome Pack (${store!.completed_pickups}/${store!.welcome_pack_limit})`
                  : store!.subscription_status === 'active' ? 'Abbonamento Attivo' : store!.subscription_status
              } />
              {(store as any).pec && <InfoRow icon={<Mail className="w-4 h-4" />} label="PEC" value={(store as any).pec} />}
              {(store as any).sdi_code && <InfoRow icon={<FileText className="w-4 h-4" />} label="Codice SDI" value={(store as any).sdi_code} />}
            </div>
          </div>

          {store!.photos && store!.photos.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                <Camera className="w-5 h-5 mr-2 text-brand" /> Galleria Store
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {store!.photos.map((photo: string, idx: number) => (
                  <img key={idx} src={photo} alt="" className="w-full h-24 sm:h-32 rounded-xl object-cover border border-gray-200" />
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-brand" /> Orari di Apertura
            </h3>
            <div className="space-y-2">
              {DAYS_EDIT.map(day => {
                const hours = store!.opening_hours?.[day.key];
                return (
                  <div key={day.key} className="flex items-center justify-between py-1.5">
                    <span className={`text-sm ${hours ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{day.label}</span>
                    <span className="text-sm text-gray-600">
                      {hours ? `${(hours as any).open} - ${(hours as any).close}` : 'Chiuso'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <Euro className="w-5 h-5 mr-2 text-brand" /> Tariffe Custodia
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Small', rate: store!.custody_rate_small },
                { label: 'Medium', rate: store!.custody_rate_medium },
                { label: 'Large', rate: store!.custody_rate_large },
              ].map(tier => (
                <div key={tier.label} className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">{tier.label}</p>
                  <p className="text-lg font-bold text-gray-900">{tier.rate > 0 ? formatCents(tier.rate) : '—'}</p>
                  <p className="text-[10px] text-gray-400">al giorno</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Periodo di grazia: {store!.grace_period_hours} ore · Commissione: {store!.commission_rate}%
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center">
              <Eye className="w-5 h-5 mr-2 text-brand" /> Profilo Pubblico
            </h3>
            <a href={`/store/profile/${store!.id}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-brand font-medium hover:underline">
              Visualizza il tuo profilo pubblico →
            </a>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-sm">
            <h4 className="font-bold text-red-700 text-sm mb-3">Zona Pericolo</h4>
            <button onClick={handleLogout} className="flex items-center text-red-600 hover:text-red-700 text-sm font-medium">
              <LogOut className="w-4 h-4 mr-2" /> Esci dal tuo account
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Modifica Profilo</h2>
          <button
            onClick={() => { setIsEditingProfile(false); setProfilePhotoFile(null); setGalleryFiles([]); }}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-100 transition-colors"
          >
            <XCircle className="w-4 h-4" /> Annulla
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Foto Profilo</h3>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center border-2 border-brand/20 overflow-hidden">
              {profilePhotoPreview ? (
                <img src={profilePhotoPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <Building className="w-10 h-10 text-brand" />
              )}
            </div>
            <div>
              <input type="file" ref={profilePhotoRef} accept="image/*" className="hidden" onChange={handleProfilePhotoChange} />
              <button onClick={() => profilePhotoRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">
                <Camera className="w-4 h-4" /> Cambia foto
              </button>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG. Max 5MB</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Informazioni Base</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Attività</label>
              <input type="text" value={profileForm.business_name}
                onChange={(e) => setProfileForm({ ...profileForm, business_name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
              <input type="tel" value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">P.IVA</label>
                <input type="text" value={profileForm.vat_number}
                  onChange={(e) => setProfileForm({ ...profileForm, vat_number: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rappresentante Legale</label>
                <input type="text" value={profileForm.legal_representative}
                  onChange={(e) => setProfileForm({ ...profileForm, legal_representative: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PEC</label>
                <input type="email" value={profileForm.pec}
                  onChange={(e) => setProfileForm({ ...profileForm, pec: e.target.value })}
                  placeholder="es. nome@pec.it"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Codice SDI</label>
                <input type="text" value={profileForm.sdi_code}
                  onChange={(e) => setProfileForm({ ...profileForm, sdi_code: e.target.value.toUpperCase() })}
                  placeholder="es. XXXXXXX"
                  maxLength={7}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none uppercase" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
              <textarea value={profileForm.description}
                onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                placeholder="Descrivi il tuo store, i servizi offerti..." />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Indirizzo</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Via e Numero</label>
              <input type="text" value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Città</label>
              <input type="text" value={profileForm.city}
                onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                <input type="text" value={profileForm.province}
                  onChange={(e) => setProfileForm({ ...profileForm, province: e.target.value })}
                  maxLength={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none uppercase" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CAP</label>
                <input type="text" value={profileForm.postal_code}
                  onChange={(e) => setProfileForm({ ...profileForm, postal_code: e.target.value })}
                  maxLength={5} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Orari di Apertura</h3>
          <div className="space-y-3">
            {DAYS_EDIT.map(day => {
              const hours = profileForm.opening_hours[day.key];
              const isOpen = !!hours;
              return (
                <div key={day.key} className="flex items-center gap-3">
                  <button type="button" onClick={() => toggleDay(day.key)}
                    className={`w-16 text-xs font-bold py-1.5 rounded-lg transition-colors ${isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {day.short}
                  </button>
                  {isOpen ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input type="time" value={hours?.open || '09:00'}
                        onChange={(e) => updateHour(day.key, 'open', e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand outline-none" />
                      <span className="text-gray-400">—</span>
                      <input type="time" value={hours?.close || '19:00'}
                        onChange={(e) => updateHour(day.key, 'close', e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand outline-none" />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Chiuso</span>
                  )}
                </div>
              );
            })}
            <p className="text-xs text-gray-400 mt-2">Clicca sul giorno per aprire/chiudere</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Galleria Store</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
            {galleryPreviews.map((photo, idx) => (
              <div key={idx} className="relative group">
                <img src={photo} alt="" className="w-full h-24 sm:h-32 rounded-xl object-cover border border-gray-200" />
                <button onClick={() => handleGalleryRemove(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button onClick={() => galleryInputRef.current?.click()}
              className="w-full h-24 sm:h-32 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-brand hover:text-brand transition-colors">
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-xs">Aggiungi</span>
            </button>
          </div>
          <input type="file" ref={galleryInputRef} accept="image/*" multiple className="hidden" onChange={handleGalleryAdd} />
          <p className="text-xs text-gray-400">Aggiungi foto del tuo negozio, vetrina, interno, etc.</p>
        </div>

        <div className="sticky bottom-4 z-10">
          <button onClick={handleSaveProfile} disabled={isSavingProfile}
            className="w-full bg-brand text-white font-bold py-4 rounded-2xl hover:bg-brand-dark transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isSavingProfile ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Salvataggio in corso...</>
            ) : (
              <><Save className="w-5 h-5" /> Salva Modifiche</>
            )}
          </button>
        </div>
      </div>
    );
  }
};

// ============================================================
// HELPER COMPONENTS
// ============================================================
const KPICard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color: string }> = ({ icon, label, value, color }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    brand: 'bg-brand/10 text-brand',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${colors[color] || colors.blue}`}>{icon}</div>
      <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
};

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
    <div className="text-gray-400">{icon}</div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  </div>
);
