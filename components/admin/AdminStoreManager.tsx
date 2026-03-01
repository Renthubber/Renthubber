// ============================================================
// RENTHUBBER - Admin Store Manager
// Path: components/admin/AdminStoreManager.tsx
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Filter, CheckCircle, XCircle, Clock, Eye,
  Loader2, ChevronDown, ChevronUp, Mail, Phone, MapPin,
  Building, FileText, Calendar, Shield, AlertTriangle,
  Key, Copy, Check, RefreshCw, Ban, Play, Pause,
  Star, Package, Euro, TrendingUp, ExternalLink,
  Store as StoreIcon
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { AdminStoreDetail } from './AdminStoreDetail';

// ============================================================
// TYPES
// ============================================================
interface StoreApplication {
  id: string;
  business_name: string;
  vat_number: string;
  legal_representative: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  business_type: string;
  square_meters: number | null;
  has_shelving: boolean;
  has_camera_device: boolean;
  opening_hours: Record<string, any>;
  google_maps_url: string | null;
  motivation: string | null;
  status: string;
  admin_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
}

interface StoreRecord {
  id: string;
  business_name: string;
  email: string;
  phone: string;
  city: string;
  province: string;
  status: string;
  subscription_status: string;
  completed_pickups: number;
  welcome_pack_limit: number;
  average_rating: number;
  total_reviews: number;
  is_early_adopter: boolean;
  activated_at: string | null;
  created_at: string;
  vat_number: string | null;
  legal_representative: string | null;
  pec: string | null;
  sdi_code: string | null;
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  poste_private: 'Poste Private / Cityposte',
  cartoleria: 'Cartoleria / Copisteria',
  tabaccheria: 'Tabaccheria',
  edicola: 'Edicola',
  ferramenta: 'Ferramenta',
  negozio: 'Negozio / Attività commerciale',
  altro: 'Altro',
};

const STATUS_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: 'In attesa', bg: 'bg-amber-50', color: 'text-amber-700' },
  approved: { label: 'Approvata', bg: 'bg-green-50', color: 'text-green-700' },
  rejected: { label: 'Rifiutata', bg: 'bg-red-50', color: 'text-red-700' },
  active: { label: 'Attivo', bg: 'bg-green-50', color: 'text-green-700' },
  inactive: { label: 'Inattivo', bg: 'bg-gray-50', color: 'text-gray-700' },
  suspended: { label: 'Sospeso', bg: 'bg-red-50', color: 'text-red-700' },
  terminated: { label: 'Chiuso', bg: 'bg-gray-50', color: 'text-gray-500' },
  welcome_pack: { label: 'Welcome Pack', bg: 'bg-blue-50', color: 'text-blue-700' },
};

const DAYS_LABELS: Record<string, string> = {
  mon: 'Lun', tue: 'Mar', wed: 'Mer', thu: 'Gio', fri: 'Ven', sat: 'Sab', sun: 'Dom',
};

// ============================================================
// HELPER: Hash password (stessa logica del frontend store)
// ============================================================
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '_renthubber_store_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pw = '';
  for (let i = 0; i < 10; i++) {
    pw += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pw + '!';
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export const AdminStoreManager: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'applications' | 'stores'>('applications');
  const [applications, setApplications] = useState<StoreApplication[]>([]);
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [expandedStore, setExpandedStore] = useState<string | null>(null);

  // Approval modal
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<StoreApplication | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState(false);

  // Rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [appRes, storeRes] = await Promise.all([
        supabase.from('store_applications').select('*').neq('status', 'approved').order('created_at', { ascending: false }),
        supabase.from('stores').select('*').order('created_at', { ascending: false }),
      ]);
      setApplications(appRes.data || []);
      setStores(storeRes.data || []);
    } catch (err) {
      console.error('Errore caricamento dati store admin:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // FILTERED DATA
  const filteredApplications = useMemo(() => {
    let items = [...applications];
    if (statusFilter !== 'all') items = items.filter(a => a.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(a =>
        a.business_name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.legal_representative.toLowerCase().includes(q)
      );
    }
    return items;
  }, [applications, statusFilter, searchQuery]);

  const filteredStores = useMemo(() => {
    let items = [...stores];
    if (statusFilter !== 'all') items = items.filter(s => s.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(s =>
        s.business_name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q)
      );
    }
    return items;
  }, [stores, statusFilter, searchQuery]);

  const pendingCount = applications.filter(a => a.status === 'pending').length;

  // ACTIONS
  const openApprovalModal = (app: StoreApplication) => {
    setSelectedApp(app);
    setAdminNotes('');
    setGeneratedPassword(generatePassword());
    setApprovalSuccess(false);
    setCopiedPassword(false);
    setShowApprovalModal(true);
  };

  const openRejectModal = (app: StoreApplication) => {
    setSelectedApp(app);
    setRejectNotes('');
    setShowRejectModal(true);
  };

  const handleApprove = async () => {
    if (!selectedApp || !generatedPassword) return;
    setIsProcessing(true);

    try {
      console.log('Step 1: hash password');
      const password_hash = await hashPassword(generatedPassword);

      console.log('Step 2: aggiorna candidatura');
      const { error: appError } = await supabase
        .from('store_applications')
        .update({
          status: 'approved',
          admin_notes: adminNotes.trim() || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedApp.id);
      if (appError) throw appError;

      console.log('Step 3: verifica duplicato');
      const { data: existingStores } = await supabase
        .from('stores')
        .select('id')
        .eq('application_id', selectedApp.id);

      if (existingStores && existingStores.length > 0) {
        alert('Store già approvato.');
        setIsProcessing(false);
        setShowApprovalModal(false);
        return;
      }

      console.log('Step 4: crea store');
      const { data: newStore, error: storeError } = await supabase
        .from('stores')
        .insert({
          application_id: selectedApp.id,
          business_name: selectedApp.business_name,
          vat_number: selectedApp.vat_number,
          legal_representative: selectedApp.legal_representative,
          email: selectedApp.email,
          phone: selectedApp.phone,
          address: selectedApp.address,
          city: selectedApp.city,
          province: selectedApp.province,
          postal_code: selectedApp.postal_code,
          opening_hours: selectedApp.opening_hours,
          password_hash,
          status: 'active',
          subscription_status: 'welcome_pack',
          commission_rate: 5.00,
          is_early_adopter: true,
          activated_at: new Date().toISOString(),
          grace_period_hours: 48,
          custody_rate_small: 150,
          custody_rate_medium: 250,
          custody_rate_large: 400,
          latitude: 0,
          longitude: 0,
        })
        .select('*')
        .single();
      if (storeError) throw storeError;

      console.log('Step 5: invia email');
      try {
        const { data: template } = await supabase
          .from('email_templates')
          .select('body_html, body_text')
          .eq('id', 'tpl-store-credentials')
          .single();

        const { error: emailError } = await supabase.from('email_queue').insert({
          template_id: 'tpl-store-credentials',
          recipient_email: selectedApp.email,
          recipient_name: selectedApp.business_name,
          subject: 'Benvenuto su RentHubber Store - Le tue credenziali di accesso',
          body_html: template?.body_html || '',
          body_text: template?.body_text || '',
          variables: {
            business_name: selectedApp.business_name,
            legal_representative: selectedApp.legal_representative,
            email: selectedApp.email,
            password: generatedPassword,
          },
          status: 'pending',
          scheduled_at: new Date().toISOString(),
          sender_account_id: 'a4ddd183-2943-4679-b6a3-d8455645a011',
        });
        if (emailError) console.error('Errore insert email_queue:', emailError);
        else console.log('✅ Email inserita in queue');
      } catch (emailErr) {
        console.warn('Email non inviata:', emailErr);
      }

      console.log('Step 6: aggiorna UI');
      setApplications(prev => prev.map(a =>
        a.id === selectedApp.id ? { ...a, status: 'approved', admin_notes: adminNotes.trim() || null, reviewed_at: new Date().toISOString() } : a
      ));
      if (newStore) setStores(prev => [newStore, ...prev]);
      console.log('✅ Approvazione completata');
      setApprovalSuccess(true);

    } catch (err: any) {
      console.error('Errore approvazione:', err);
      alert('Errore durante l\'approvazione. Riprova.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    setIsProcessing(true);

    try {
      await supabase
        .from('store_applications')
        .update({
          status: 'rejected',
          admin_notes: rejectNotes.trim() || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedApp.id);

      setApplications(prev => prev.map(a =>
        a.id === selectedApp.id ? { ...a, status: 'rejected', admin_notes: rejectNotes.trim() || null, reviewed_at: new Date().toISOString() } : a
      ));
      setShowRejectModal(false);
    } catch (err) {
      console.error('Errore rifiuto:', err);
      alert('Errore durante il rifiuto. Riprova.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTerminateStore = async (storeId: string) => {
    if (!confirm('Sei sicuro di voler terminare definitivamente questo store? L\'azione è irreversibile.')) return;

    const { error } = await supabase
      .from('stores')
      .update({ status: 'terminated' })
      .eq('id', storeId);

    if (!error) {
      setStores(prev => prev.map(s => s.id === storeId ? { ...s, status: 'terminated' } : s));

      try {
        const store = stores.find(s => s.id === storeId);
        const { data: template } = await supabase
          .from('email_templates')
          .select('body_html, body_text')
          .eq('id', 'tpl-store-terminated')
          .single();

        await supabase.from('email_queue').insert({
          template_id: 'tpl-store-terminated',
          recipient_email: store?.email,
          recipient_name: store?.business_name,
          subject: 'Collaborazione con RentHubber terminata',
          body_html: template?.body_html || '',
          body_text: template?.body_text || '',
          variables: { business_name: store?.business_name },
          status: 'pending',
          scheduled_at: new Date().toISOString(),
          sender_account_id: 'a4ddd183-2943-4679-b6a3-d8455645a011',
        });
      } catch (emailErr) {
        console.warn('Email terminazione non inviata:', emailErr);
      }
    }
  };

  const handleToggleStoreStatus = async (storeId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const { error } = await supabase
      .from('stores')
      .update({ status: newStatus })
      .eq('id', storeId);

    if (!error) {
      setStores(prev => prev.map(s => s.id === storeId ? { ...s, status: newStatus } : s));

      if (newStatus === 'suspended') {
        try {
          const store = stores.find(s => s.id === storeId);
          const { data: template } = await supabase
            .from('email_templates')
            .select('body_html, body_text')
            .eq('id', 'tpl-store-suspended')
            .single();

          await supabase.from('email_queue').insert({
            template_id: 'tpl-store-suspended',
            recipient_email: store?.email,
            recipient_name: store?.business_name,
            subject: 'Il tuo store è stato sospeso',
            body_html: template?.body_html || '',
            body_text: template?.body_text || '',
            variables: { business_name: store?.business_name },
            status: 'pending',
            scheduled_at: new Date().toISOString(),
            sender_account_id: 'a4ddd183-2943-4679-b6a3-d8455645a011',
          });
        } catch (emailErr) {
          console.warn('Email sospensione non inviata:', emailErr);
        }
      }
    }
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 3000);
    } catch { /* */ }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });

  // ============================================================
  // RENDER
  // ============================================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestione Store</h2>
          <p className="text-gray-500 text-sm mt-1">
            {pendingCount > 0 ? (
              <span className="text-amber-600 font-medium">{pendingCount} candidatura/e in attesa</span>
            ) : (
              'Gestisci candidature e store attivi'
            )}
          </p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors">
          <RefreshCw className="w-4 h-4" /> Aggiorna
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        <button
          onClick={() => { setActiveSubTab('applications'); setStatusFilter('all'); setSearchQuery(''); }}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeSubTab === 'applications'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Candidature
          {pendingCount > 0 && (
            <span className="ml-2 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveSubTab('stores'); setStatusFilter('all'); setSearchQuery(''); }}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeSubTab === 'stores'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Store Attivi ({stores.length})
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca per nome, email, città..."
            className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">Tutti gli stati</option>
          {activeSubTab === 'applications' ? (
            <>
              <option value="pending">In attesa</option>
              <option value="approved">Approvate</option>
              <option value="rejected">Rifiutate</option>
            </>
          ) : (
            <>
              <option value="active">Attivi</option>
              <option value="suspended">Sospesi</option>
              <option value="inactive">Inattivi</option>
            </>
          )}
        </select>
      </div>

      {/* CONTENT */}
      {activeSubTab === 'applications' ? renderApplications() : renderStores()}

      {/* MODALS */}
      {showApprovalModal && selectedApp && renderApprovalModal()}
      {showRejectModal && selectedApp && renderRejectModal()}
    </div>
  );

  // ============================================================
  // RENDER: Candidature
  // ============================================================
  function renderApplications() {
    if (filteredApplications.length === 0) {
      return (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nessuna candidatura trovata</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {filteredApplications.map(app => {
          const badge = STATUS_BADGES[app.status] || STATUS_BADGES.pending;
          const isExpanded = expandedApp === app.id;

          return (
            <div key={app.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Header row */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedApp(isExpanded ? null : app.id)}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Building className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{app.business_name}</p>
                    <p className="text-xs text-gray-500">{app.city} ({app.province}) · {formatDate(app.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.bg} ${badge.color}`}>
                    {badge.label}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <InfoItem icon={<Building className="w-4 h-4" />} label="Tipo" value={BUSINESS_TYPE_LABELS[app.business_type] || app.business_type} />
                      <InfoItem icon={<FileText className="w-4 h-4" />} label="P.IVA" value={app.vat_number} />
                      <InfoItem icon={<Shield className="w-4 h-4" />} label="Rappresentante" value={app.legal_representative} />
                      <InfoItem icon={<Mail className="w-4 h-4" />} label="Email" value={app.email} />
                      <InfoItem icon={<Phone className="w-4 h-4" />} label="Telefono" value={app.phone} />
                    </div>
                    <div className="space-y-2">
                      <InfoItem icon={<MapPin className="w-4 h-4" />} label="Indirizzo" value={`${app.address}, ${app.city} (${app.province}) ${app.postal_code}`} />
                      {app.square_meters && <InfoItem icon={<StoreIcon className="w-4 h-4" />} label="Metratura" value={`${app.square_meters} mq`} />}
                      <InfoItem icon={<Package className="w-4 h-4" />} label="Scaffalature" value={app.has_shelving ? '✅ Sì' : '❌ No'} />
                      <InfoItem icon={<Eye className="w-4 h-4" />} label="Fotocamera" value={app.has_camera_device ? '✅ Sì' : '❌ No'} />
                      {app.google_maps_url && (
                        <a href={app.google_maps_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                          <ExternalLink className="w-4 h-4" /> Apri su Google Maps
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Orari */}
                  {app.opening_hours && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-2">ORARI DI APERTURA</p>
                      <div className="flex flex-wrap gap-2">
                        {['mon','tue','wed','thu','fri','sat','sun'].map(day => {
  const hours = app.opening_hours[day];
  return (
    <span key={day} className={`text-xs px-2 py-1 rounded-lg ${hours ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
      {DAYS_LABELS[day]}: {hours ? `${(hours as any).open}-${(hours as any).close}` : 'Chiuso'}
    </span>
  );
})}
                      </div>
                    </div>
                  )}

                  {/* Motivazione */}
                  {app.motivation && (
                    <div className="mb-4 bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs font-medium text-gray-500 mb-1">MOTIVAZIONE</p>
                      <p className="text-sm text-gray-700">{app.motivation}</p>
                    </div>
                  )}

                  {/* Admin notes (if already reviewed) */}
                  {app.admin_notes && (
                    <div className="mb-4 bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-xs font-medium text-blue-600 mb-1">NOTE ADMIN</p>
                      <p className="text-sm text-blue-800">{app.admin_notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {app.status === 'pending' && (
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openApprovalModal(app); }}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" /> Approva e Crea Store
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); openRejectModal(app); }}
                        className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <XCircle className="w-4 h-4" /> Rifiuta
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ============================================================
  // RENDER: Store Attivi
  // ============================================================
  function renderStores() {
    if (filteredStores.length === 0) {
      return (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <StoreIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nessuno store trovato</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {filteredStores.map(store => {
          const statusBadge = STATUS_BADGES[store.status] || STATUS_BADGES.active;
          const subBadge = STATUS_BADGES[store.subscription_status] || STATUS_BADGES.welcome_pack;
          const isExpanded = expandedStore === store.id;

          return (
            <div key={store.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedStore(isExpanded ? null : store.id)}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    store.status === 'active' ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <StoreIcon className={`w-5 h-5 ${store.status === 'active' ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{store.business_name}</p>
                    <p className="text-xs text-gray-500">
                      {store.city} ({store.province}) · {store.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusBadge.bg} ${statusBadge.color}`}>
                    {statusBadge.label}
                  </span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${subBadge.bg} ${subBadge.color}`}>
                    {subBadge.label}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100">
                  <AdminStoreDetail
                    storeId={store.id}
                    storeStatus={store.status}
                    onToggleStatus={() => handleToggleStoreStatus(store.id, store.status)}
                    onTerminate={() => handleTerminateStore(store.id)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ============================================================
  // MODAL: Approvazione
  // ============================================================
  function renderApprovalModal() {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Approva Candidatura</h3>
            <p className="text-sm text-gray-500 mt-1">{selectedApp!.business_name} — {selectedApp!.city}</p>
          </div>

          <div className="p-6 space-y-4">
            {approvalSuccess ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Store Creato!</h4>
                <p className="text-sm text-gray-600 mb-4">Email con credenziali inviata automaticamente. Ecco un riepilogo:</p>
                <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2">
                  <p className="text-sm"><span className="text-gray-500">Email:</span> <strong>{selectedApp!.email}</strong></p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm"><span className="text-gray-500">Password:</span> <strong className="font-mono">{generatedPassword}</strong></p>
                    <button onClick={copyPassword} className="text-blue-600 hover:text-blue-700">
                      {copiedPassword ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-sm"><span className="text-gray-500">URL:</span> <strong>/store/login</strong></p>
                </div>
                <p className="text-xs text-amber-600 mt-3">⚠️ Copia la password adesso — non sarà più visibile!</p>
              </div>
            ) : (
              <>
                {/* Password generata */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password generata</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={generatedPassword}
                      readOnly
                      className="flex-1 font-mono bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    />
                    <button onClick={copyPassword} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                      {copiedPassword ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
                    </button>
                    <button onClick={() => setGeneratedPassword(generatePassword())} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                      <RefreshCw className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Note admin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note admin (opzionale)</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                    rows={3}
                    placeholder="Note interne..."
                  />
                </div>

                <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                  <p className="font-medium mb-1">Cosa succede:</p>
                  <ul className="list-disc list-inside text-xs space-y-1">
                    <li>La candidatura viene approvata</li>
                    <li>Viene creato lo store con Welcome Pack (100 ritiri)</li>
                    <li>Lo store potrà loggarsi su /store/login</li>
                    <li>Dovrai inviare le credenziali manualmente</li>
                  </ul>
                </div>
              </>
            )}
          </div>

          <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
            <button
              onClick={() => setShowApprovalModal(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {approvalSuccess ? 'Chiudi' : 'Annulla'}
            </button>
            {!approvalSuccess && (
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Approva e Crea Store
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // MODAL: Rifiuto
  // ============================================================
  function renderRejectModal() {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Rifiuta Candidatura</h3>
            <p className="text-sm text-gray-500 mt-1">{selectedApp!.business_name}</p>
          </div>

          <div className="p-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo del rifiuto</label>
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-red-500 outline-none"
              rows={4}
              placeholder="Spiega il motivo del rifiuto..."
            />
          </div>

          <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
            <button
              onClick={() => setShowRejectModal(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Rifiuta
            </button>
          </div>
        </div>
      </div>
    );
  }
};

// ============================================================
// HELPER COMPONENTS
// ============================================================
const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-2">
    <div className="text-gray-400 mt-0.5">{icon}</div>
    <div>
      <p className="text-[10px] uppercase text-gray-400 font-medium">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  </div>
);

const MiniKPI: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
    <p className="text-lg font-bold text-gray-900">{value}</p>
    <p className="text-[10px] text-gray-500 uppercase">{label}</p>
  </div>
);
