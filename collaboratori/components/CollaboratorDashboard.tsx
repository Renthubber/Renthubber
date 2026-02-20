// ============================================================
// RENTHUBBER - MODULO COLLABORATORI - Dashboard Completa
// Path: collaboratori/components/CollaboratorDashboard.tsx
// ============================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, TrendingUp, MapPin, UserPlus, LogOut,
  Plus, Search, Phone, Mail, Building, Link2, Copy, Check,
  ChevronRight, Award, Euro, Target, BarChart3, Clock, CheckCircle,
  XCircle, Loader2, Tag, CreditCard, Calendar, FileText, HelpCircle,
  Shield, User, Share2, MessageSquare, Zap, RefreshCw,
  ChevronDown, ChevronUp, Clipboard, Send, Info, AlertTriangle,
  Wallet, Receipt, Star, Activity, Eye
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, Legend
} from 'recharts';
import { useCollaboratorAuth } from '../context/CollaboratorAuthContext';
import { supabase } from '../../services/supabaseClient';
import {
  CollaboratorLead, CollaboratorZone, CollaboratorCommission, CollaboratorKPI
} from '../types/collaborator.types';

type Tab = 'overview' | 'hubbers' | 'earnings' | 'invite' | 'performance' | 'payments' | 'support' | 'profile';

const LEAD_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  contattato: { label: 'Contattato', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: <Phone className="w-3 h-3" /> },
  interessato: { label: 'Interessato', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: <Target className="w-3 h-3" /> },
  registrato: { label: 'Registrato', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: <UserPlus className="w-3 h-3" /> },
  attivo: { label: 'Attivo', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: <CheckCircle className="w-3 h-3" /> },
  perso: { label: 'Perso', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: <XCircle className="w-3 h-3" /> },
};

const BADGE_CONFIG: Record<string, { label: string; emoji: string; next: string; target: number }> = {
  none: { label: 'Starter', emoji: '🔰', next: 'Bronze', target: 10 },
  bronze: { label: 'Bronze', emoji: '🥉', next: 'Silver', target: 25 },
  silver: { label: 'Silver', emoji: '🥈', next: 'Gold', target: 50 },
  gold: { label: 'Gold', emoji: '🥇', next: '', target: 0 },
};

const TABS: { id: Tab; label: string; icon: React.ReactNode; short: string }[] = [
  { id: 'overview', label: 'Panoramica', icon: <LayoutDashboard className="w-4 h-4" />, short: 'Home' },
  { id: 'hubbers', label: 'Hubber Portati', icon: <Users className="w-4 h-4" />, short: 'Hubber' },
  { id: 'earnings', label: 'Guadagni', icon: <Euro className="w-4 h-4" />, short: 'Guadagni' },
  { id: 'invite', label: 'Invita', icon: <Share2 className="w-4 h-4" />, short: 'Invita' },
  { id: 'performance', label: 'Performance', icon: <Activity className="w-4 h-4" />, short: 'Stats' },
  { id: 'payments', label: 'Pagamenti', icon: <Wallet className="w-4 h-4" />, short: 'Paga' },
  { id: 'support', label: 'Supporto', icon: <HelpCircle className="w-4 h-4" />, short: 'Help' },
  { id: 'profile', label: 'Profilo', icon: <User className="w-4 h-4" />, short: 'Profilo' },
];

const FAQ_DATA = [
  { q: 'Come funziona il guadagno?', a: 'Guadagni un bonus per ogni Hubber che si registra e pubblica almeno un annuncio, più una commissione ricorrente sulle prenotazioni per i primi 12 mesi.' },
  { q: 'Quando vengo pagato?', a: 'Pagamenti mensili. Commissioni maturate nel mese corrente pagate entro il 15 del mese successivo via bonifico.' },
  { q: 'Come porto un nuovo Hubber?', a: 'Condividi il tuo link referral. Chi si registra tramite il tuo link viene associato al tuo account automaticamente.' },
  { q: 'Posso operare in più zone?', a: 'Sì! Puoi richiedere nuove zone. L\'admin valuterà e approverà.' },
  { q: 'Cosa significa zona esclusiva?', a: 'Sei l\'unico collaboratore in quell\'area. Riconoscimento per i più performanti.' },
  { q: 'Se un Hubber smette di noleggiare?', a: 'Commissioni ricorrenti solo su prenotazioni effettive. Niente prenotazioni = niente commissioni.' },
  { q: 'Come migliorare le performance?', a: 'Qualità > quantità. Un Hubber attivo con prenotazioni vale più di 10 inattivi.' },
];

// ============================================================
// MAIN COMPONENT
// ============================================================
export const CollaboratorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { collaborator, logout, updateProfile } = useCollaboratorAuth();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [leads, setLeads] = useState<CollaboratorLead[]>([]);
  const [zones, setZones] = useState<CollaboratorZone[]>([]);
  const [commissions, setCommissions] = useState<CollaboratorCommission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [leadFilter, setLeadFilter] = useState('all');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showNewLeadForm, setShowNewLeadForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newLead, setNewLead] = useState({ contact_name: '', contact_email: '', contact_phone: '', business_name: '', category: '', notes: '', zone_id: '', lead_type: 'privato', fiscal_code: '', vat_number: '', pec: '', sdi_code: '' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ phone: '', tax_id: '', bio: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState({ iban: '', intestatario: '' });
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ZONE & CRM STATES
  const [availableZones, setAvailableZones] = useState<any[]>([]);
  const [zoneSuggestions, setZoneSuggestions] = useState<any[]>([]);
  const [showZoneRequestModal, setShowZoneRequestModal] = useState(false);
  const [requestingZone, setRequestingZone] = useState(false);
  const [leadNotes, setLeadNotes] = useState<Record<string, any[]>>({});
  const [expandedLeadNotes, setExpandedLeadNotes] = useState<string | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteType, setNewNoteType] = useState('generale');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [registeredHubbers, setRegisteredHubbers] = useState<any[]>([]);
  const [settingsLevels, setSettingsLevels] = useState<any[]>([]);

  // DATA LOADING
  useEffect(() => {
    if (collaborator) {
      loadAllData();
      setProfileForm({ phone: collaborator.phone || '', tax_id: collaborator.tax_id || '', bio: collaborator.bio || '' });
    }
  }, [collaborator]);

  const loadAllData = async () => {
    if (!collaborator) return;
    setIsLoading(true);
    try {
      const [lr, zr, cr, azr, szr, rhr, slr] = await Promise.all([
        supabase.from('collaborator_leads').select('*').eq('collaborator_id', collaborator.id).order('created_at', { ascending: false }),
        supabase.from('collaborator_zones').select('*').eq('collaborator_id', collaborator.id),
        supabase.from('collaborator_commissions').select('*').eq('collaborator_id', collaborator.id).order('created_at', { ascending: false }),
        supabase.from('collaborator_available_zones').select('*').eq('is_active', true).order('region').order('province').order('city'),
        supabase.from('collaborator_zone_suggestions').select('*'),
        supabase.from('collaborator_hubbers_view').select('*').eq('collaborator_id', collaborator.id).order('registered_at', { ascending: false }),
        supabase.from('collaborator_settings').select('*').order('min_active_hubbers', { ascending: true }),
      ]);
      setLeads(lr.data || []);
      setZones(zr.data || []);
      setCommissions(cr.data || []);
      setAvailableZones(azr.data || []);
      setZoneSuggestions(szr.data || []);
      setRegisteredHubbers(rhr.data || []);
      setSettingsLevels(slr.data || []);
    } catch (err) { console.error('Errore:', err); }
    finally { setIsLoading(false); }
  };

  // COMPUTED
  const referralLink = `${window.location.origin}/partner/${collaborator?.referral_code || ''}`;
  const approvedZones = zones.filter(z => z.status === 'approvata');
  const badge = BADGE_CONFIG[collaborator?.badge || 'none'];

  const kpi: CollaboratorKPI = useMemo(() => {
    const totalLeads = leads.length;
    const activeHubbers = leads.filter(l => l.status === 'attivo').length;
    const totalEarnings = commissions.reduce((s, c) => c.status !== 'annullata' ? s + Number(c.amount) : s, 0);
    const pendingCommissions = commissions.filter(c => c.status === 'maturata').reduce((s, c) => s + Number(c.amount), 0);
    const paidCommissions = commissions.filter(c => c.status === 'pagata').reduce((s, c) => s + Number(c.amount), 0);
    const conversionRate = totalLeads > 0 ? (activeHubbers / totalLeads) * 100 : 0;
    return { totalLeads, activeHubbers, totalEarnings, conversionRate, pendingCommissions, paidCommissions };
  }, [leads, commissions]);

  const monthlyEarnings = useMemo(() => {
    const m = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    return commissions.filter(c => c.status !== 'annullata' && c.created_at.startsWith(m)).reduce((s, c) => s + Number(c.amount), 0);
  }, [commissions]);

  const chartData = useMemo(() => {
    const months: Record<string, { month: string; bonus: number; ricorrenti: number; milestone: number; totale: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = { month: d.toLocaleDateString('it-IT', { month: 'short' }), bonus: 0, ricorrenti: 0, milestone: 0, totale: 0 };
    }
    commissions.forEach(c => {
      if (c.status === 'annullata') return;
      const key = c.created_at.slice(0, 7);
      if (months[key]) {
        const a = Number(c.amount);
        if (c.type === 'acquisition_bonus') months[key].bonus += a;
        else if (c.type === 'recurring') months[key].ricorrenti += a;
        else months[key].milestone += a;
        months[key].totale += a;
      }
    });
    return Object.values(months);
  }, [commissions]);

  const monthlyPerf = useMemo(() => {
    const m = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    return {
      newLeads: leads.filter(l => l.created_at.startsWith(m)).length,
      activated: leads.filter(l => l.activated_at && l.activated_at.startsWith(m)).length,
      registered: leads.filter(l => l.registered_at && l.registered_at.startsWith(m)).length,
    };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    let r = [...leads];
    if (leadFilter !== 'all') r = r.filter(l => l.status === leadFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      r = r.filter(l => l.contact_name.toLowerCase().includes(q) || l.business_name?.toLowerCase().includes(q) || l.contact_email?.toLowerCase().includes(q));
    }
    return r;
  }, [leads, leadFilter, searchQuery]);

  // ACTIONS
  const copyText = async (text: string, type: 'link' | 'script') => {
    try { await navigator.clipboard.writeText(text); } catch { /* */ }
    if (type === 'link') { setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); }
    else { setCopiedScript(true); setTimeout(() => setCopiedScript(false), 2000); }
  };

  const handleAddLead = async () => {
    if (!collaborator || !newLead.contact_name || !newLead.zone_id) return;
    setIsSaving(true);
    try {
      const { data, error } = await supabase.from('collaborator_leads').insert({
        collaborator_id: collaborator.id, zone_id: newLead.zone_id,
        contact_name: newLead.contact_name.trim(), contact_email: newLead.contact_email.trim() || null,
        contact_phone: newLead.contact_phone.trim() || null, business_name: newLead.business_name.trim() || null,
        category: newLead.category.trim() || null, notes: newLead.notes.trim() || null, lead_type: newLead.lead_type, status: 'contattato',
      }).select('*').single();
      if (error) throw error;
      setLeads(prev => [data, ...prev]);
      setNewLead({ contact_name: '', contact_email: '', contact_phone: '', business_name: '', category: '', notes: '', zone_id: '', lead_type: 'privato', fiscal_code: '', vat_number: '', pec: '', sdi_code: '' });
      setShowNewLeadForm(false);
    } catch (err) { console.error(err); alert('Errore inserimento.'); }
    finally { setIsSaving(false); }
  };

  const handleUpdateLeadStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === 'registrato') updates.registered_at = new Date().toISOString();
    if (status === 'attivo') updates.activated_at = new Date().toISOString();
    const { error } = await supabase.from('collaborator_leads').update(updates).eq('id', id);
    if (!error) setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const handleSaveProfile = async () => {
    if (!collaborator) return;
    setIsSavingProfile(true);
    try {
      await updateProfile({ phone: profileForm.phone || null, tax_id: profileForm.tax_id || null, bio: profileForm.bio || null } as any);
      setIsEditingProfile(false);
    } catch (err) { console.error(err); }
    finally { setIsSavingProfile(false); }
  };
  
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!collaborator || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) { alert('Immagine troppo grande (max 2MB)'); return; }
    setIsUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `collaborators/${collaborator.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase.from('collaborators').update({ avatar_url: avatarUrl }).eq('id', collaborator.id);
    } catch (err) { console.error(err); alert('Errore upload foto.'); }
    finally { setIsUploadingAvatar(false); }
  };

  const handleLogout = () => { logout(); navigate('/collaboratori/login'); };
  // ZONE REQUEST
  const requestableZones = useMemo(() => {
    return availableZones.filter(az => {
      if (!az.is_active) return false;
      const alreadyHas = zones.some(z =>
        z.region === az.region &&
        (!az.province || z.province === az.province) &&
        (!az.city || z.city === az.city) &&
        ['approvata', 'richiesta'].includes(z.status)
      );
      if (alreadyHas) return false;
      return true;
    }).map(az => {
      const currentCount = zones.filter(z =>
        z.status === 'approvata' &&
        z.region === az.region &&
        (!az.province || z.province === az.province) &&
        (!az.city || z.city === az.city)
      ).length;
      return { ...az, currentCount, isFull: currentCount >= (az.max_collaborators || 5) };
    }).filter(az => !az.isFull);
  }, [availableZones, zones]);

  const handleRequestZone = async (az: any) => {
    if (!collaborator) return;
    setRequestingZone(true);
    try {
      const { data, error } = await supabase.from('collaborator_zones').insert({
        collaborator_id: collaborator.id,
        zone_level: ({ region: 'regione', province: 'provincia', city: 'citta' }[az.zone_level] || az.zone_level || 'citta'),
        region: az.region,
        province: az.province || null,
        city: az.city || null,
        is_exclusive: false,
        status: 'richiesta',
      }).select('*').single();
      if (error) throw error;
      setZones(prev => [...prev, data]);
      setShowZoneRequestModal(false);
    } catch (err) { console.error(err); alert('Errore nella richiesta zona.'); }
    finally { setRequestingZone(false); }
  };

  // CRM NOTES
  const loadLeadNotes = async (leadId: string) => {
    const { data } = await supabase
      .from('collaborator_lead_notes')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });
    setLeadNotes(prev => ({ ...prev, [leadId]: data || [] }));
  };

  const handleToggleNotes = async (leadId: string) => {
    if (expandedLeadNotes === leadId) {
      setExpandedLeadNotes(null);
    } else {
      setExpandedLeadNotes(leadId);
      if (!leadNotes[leadId]) await loadLeadNotes(leadId);
    }
    setNewNoteText('');
    setNewNoteType('generale');
  };

  const handleAddNote = async (leadId: string) => {
    if (!collaborator || !newNoteText.trim()) return;
    setIsSavingNote(true);
    try {
      const { data, error } = await supabase.from('collaborator_lead_notes').insert({
        lead_id: leadId,
        collaborator_id: collaborator.id,
        note: newNoteText.trim(),
        note_type: newNoteType,
      }).select('*').single();
      if (error) throw error;
      setLeadNotes(prev => ({ ...prev, [leadId]: [data, ...(prev[leadId] || [])] }));
      setNewNoteText('');
      setNewNoteType('generale');
    } catch (err) { console.error(err); alert('Errore salvataggio nota.'); }
    finally { setIsSavingNote(false); }
  };

  const handleDeleteNote = async (noteId: string, leadId: string) => {
    const { error } = await supabase.from('collaborator_lead_notes').delete().eq('id', noteId);
    if (!error) setLeadNotes(prev => ({ ...prev, [leadId]: (prev[leadId] || []).filter(n => n.id !== noteId) }));
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo contatto?')) return;
    const { error } = await supabase.from('collaborator_leads').delete().eq('id', leadId);
    if (!error) setLeads(prev => prev.filter(l => l.id !== leadId));
  };

  if (!collaborator) return null;

  // RENDER SHELL
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/R-logo.png" alt="Renthubber" className="w-8 h-8" />
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900">Area Collaboratori</h1>
              <p className="text-xs text-gray-500">{collaborator.first_name} {collaborator.last_name} · {badge.emoji} {badge.label}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => copyText(referralLink, 'link')} className="hidden sm:flex items-center text-xs bg-brand/10 text-brand px-3 py-1.5 rounded-full font-medium hover:bg-brand/20">
              <Link2 className="w-3 h-3 mr-1" />{copiedLink ? 'Copiato!' : collaborator.referral_code}
            </button>
            <button onClick={loadAllData} className="text-gray-400 hover:text-brand"><RefreshCw className="w-4 h-4" /></button>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex space-x-1 bg-white rounded-xl p-1 border border-gray-200 mb-6 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${activeTab === t.id ? 'bg-brand text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
              {t.icon}<span className="hidden sm:inline">{t.label}</span><span className="sm:hidden">{t.short}</span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-brand animate-spin" /></div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'hubbers' && renderHubbers()}
            {activeTab === 'earnings' && renderEarnings()}
            {activeTab === 'invite' && renderInvite()}
            {activeTab === 'performance' && renderPerformance()}
            {activeTab === 'payments' && renderPayments()}
            {activeTab === 'support' && renderSupport()}
            {activeTab === 'profile' && renderProfile()}
          </>
        )}
      </div>
    </div>
  );

  // ============================================================
  // 1️⃣ PANORAMICA
  // ============================================================
  function renderOverview() {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-brand to-brand-dark rounded-2xl p-6 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Ciao {collaborator!.first_name}! 👋</h2>
              <p className="text-white/80 text-sm mt-1">La tua situazione in tempo reale.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 w-full sm:w-auto">
              <p className="text-xs text-white/70 mb-1">Il tuo link personale</p>
              <div className="flex items-center space-x-2">
                <code className="text-xs bg-white/10 px-2 py-1 rounded font-mono truncate max-w-[200px] sm:max-w-[300px]">{referralLink}</code>
                <button onClick={() => copyText(referralLink, 'link')} className="bg-white/20 hover:bg-white/30 p-1.5 rounded-lg flex-shrink-0">
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <KPICard icon={<Euro className="w-5 h-5" />} label="Guadagni Mese" value={`€${monthlyEarnings.toFixed(2)}`} color="brand" />
          <KPICard icon={<TrendingUp className="w-5 h-5" />} label="Guadagni Totali" value={`€${kpi.totalEarnings.toFixed(2)}`} color="green" />
          <KPICard icon={<Clock className="w-5 h-5" />} label="In Attesa" value={`€${kpi.pendingCommissions.toFixed(2)}`} color="amber" />
          <KPICard icon={<Users className="w-5 h-5" />} label="Hubber Attivi" value={kpi.activeHubbers} color="blue" />
          <KPICard icon={<Target className="w-5 h-5" />} label="Conversione" value={`${kpi.conversionRate.toFixed(0)}%`} color="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-brand" /> Andamento Guadagni
            </h3>
            <div className="h-64" style={{ minHeight: '256px' }}>
              {chartData.some(d => d.totale > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} formatter={(v: number) => [`€${Number(v).toFixed(2)}`]} />
                    <Legend />
                    <Bar dataKey="bonus" name="Bonus" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ricorrenti" name="Ricorrenti" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="milestone" name="Milestone" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <BarChart3 className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">I guadagni appariranno qui</p>
                  <button onClick={() => setActiveTab('invite')} className="mt-3 text-brand text-sm font-medium hover:underline">Inizia ad invitare →</button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Azioni Rapide</h3>
              <div className="space-y-2">
                <button onClick={() => { setActiveTab('hubbers'); setShowNewLeadForm(true); }} className="w-full flex items-center justify-between p-3 rounded-xl bg-brand/5 hover:bg-brand/10 text-brand text-sm font-medium">
                  <span className="flex items-center"><UserPlus className="w-4 h-4 mr-2" /> Aggiungi Hubber</span><ChevronRight className="w-4 h-4" />
                </button>
                <button onClick={() => copyText(referralLink, 'link')} className="w-full flex items-center justify-between p-3 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium">
                  <span className="flex items-center"><Link2 className="w-4 h-4 mr-2" /> Copia Link</span>{copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <button onClick={() => setActiveTab('invite')} className="w-full flex items-center justify-between p-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-medium">
                  <span className="flex items-center"><FileText className="w-4 h-4 mr-2" /> Materiale</span><ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 text-sm">Ultimi Hubber</h3>
                <button onClick={() => setActiveTab('hubbers')} className="text-brand text-xs hover:underline">Tutti <ChevronRight className="w-3 h-3 inline" /></button>
              </div>
              {leads.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Nessun hubber ancora</p>
              ) : (
                <div className="space-y-2">
                  {leads.slice(0, 4).map(l => {
                    const s = LEAD_STATUS_CONFIG[l.status];
                    return (
                      <div key={l.id} className="flex items-center justify-between py-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{l.contact_name}</p>
                          <p className="text-xs text-gray-400">{l.business_name || '-'}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${s.bg} ${s.color} flex-shrink-0`}>{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SEZIONE ZONE */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 flex items-center text-sm"><MapPin className="w-4 h-4 mr-2 text-brand" /> Le tue Zone</h3>
            <button onClick={() => setShowZoneRequestModal(true)} className="text-brand text-xs font-medium hover:underline flex items-center">
              <Plus className="w-3 h-3 mr-1" /> Richiedi zona
            </button>
          </div>
          {zones.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {zones.map(z => (
                <span key={z.id} className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${z.status === 'approvata' ? 'bg-green-50 border-green-200 text-green-700' : z.status === 'richiesta' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  <MapPin className="w-3 h-3 mr-1" />{z.city || z.province || z.region}
                  {z.status === 'richiesta' && <Clock className="w-3 h-3 ml-1" />}
                  {z.is_exclusive && <Star className="w-3 h-3 ml-1 text-yellow-500" />}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Nessuna zona assegnata</p>
              <button onClick={() => setShowZoneRequestModal(true)} className="mt-2 text-brand text-xs font-medium hover:underline">Richiedi la tua prima zona</button>
            </div>
          )}

          {/* Suggerimenti tipologie per le zone approvate */}
          {approvedZones.length > 0 && (() => {
            const approvedZoneSuggestions = zoneSuggestions.filter(s =>
              availableZones.some(az =>
                az.id === s.zone_id &&
                approvedZones.some(z => z.region === az.region && (!az.province || z.province === az.province) && (!az.city || z.city === az.city))
              )
            );
            return approvedZoneSuggestions.length > 0 ? (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2 flex items-center"><Zap className="w-3 h-3 mr-1 text-amber-500" /> Tipologie consigliate nella tua zona</p>
                <div className="flex flex-wrap gap-1.5">
                  {approvedZoneSuggestions.map(s => (
                    <span key={s.id} className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${s.priority === 'alta' ? 'bg-red-50 border-red-200 text-red-700' : s.priority === 'bassa' ? 'bg-gray-50 border-gray-200 text-gray-600' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                      <Tag className="w-3 h-3 mr-1" />{s.category}
                      <span className="ml-1 opacity-60">· {(() => { const az = availableZones.find(a => a.id === s.zone_id); return az ? (az.city || az.province || az.region) : ''; })()}</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
        </div>

        {/* MODALE RICHIESTA ZONA */}
        {showZoneRequestModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowZoneRequestModal(false)}>
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 flex items-center"><MapPin className="w-5 h-5 mr-2 text-brand" /> Richiedi Nuova Zona</h3>
                  <button onClick={() => setShowZoneRequestModal(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-5 h-5" /></button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Seleziona una zona disponibile. La richiesta verrà valutata dall'admin.</p>
              </div>
              <div className="p-6 overflow-y-auto max-h-[55vh]">
                {requestableZones.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">Nessuna zona disponibile</p>
                    <p className="text-xs text-gray-400 mt-1">Tutte le zone sono già assegnate o le hai già richieste.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {requestableZones.map(az => {
                      const suggestions = zoneSuggestions.filter(s => s.zone_id === az.id);
                      return (
                        <div key={az.id} className="border border-gray-200 rounded-xl p-4 hover:border-brand/30 hover:bg-brand/5 transition-all">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 text-sm">{az.name}</h4>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {[az.city, az.province, az.region].filter(Boolean).join(', ')}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                <Users className="w-3 h-3 inline mr-1" />{az.currentCount}/{az.max_collaborators || 5} collaboratori
                              </p>
                              {az.description && <p className="text-xs text-gray-400 mt-1 italic">{az.description}</p>}
                              {suggestions.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {suggestions.map(s => (
                                    <span key={s.id} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">{s.category}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleRequestZone(az)}
                              disabled={requestingZone}
                              className="ml-3 bg-brand hover:bg-brand-dark text-white text-xs font-medium px-3 py-2 rounded-lg disabled:opacity-50 flex items-center flex-shrink-0"
                            >
                              {requestingZone ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Plus className="w-3 h-3 mr-1" /> Richiedi</>}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Kit Promozionale */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-1 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-brand" /> Kit Promozionale
          </h3>
          <p className="text-xs text-gray-500 mb-5">Tutto il materiale per presentare Renthubber ai tuoi contatti.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Presentazione PDF */}
            <div className="border border-gray-200 rounded-xl p-4 hover:border-brand/30 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-red-500" />
              </div>
              <h4 className="font-semibold text-gray-900 text-sm mb-1">Presentazione PDF</h4>
              <p className="text-xs text-gray-500 mb-3">Slide deck ufficiale da mostrare o inviare ai potenziali Hubber.</p>
              <span className="inline-flex items-center text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                <Clock className="w-3 h-3 mr-1" /> In arrivo
              </span>
            </div>

            {/* Video Presentazione */}
            <div className="border border-gray-200 rounded-xl p-4 hover:border-brand/30 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center mb-3">
                <Eye className="w-5 h-5 text-purple-500" />
              </div>
              <h4 className="font-semibold text-gray-900 text-sm mb-1">Video Presentazione</h4>
              <p className="text-xs text-gray-500 mb-3">Video ufficiale che spiega cos'è Renthubber e come funziona.</p>
              <span className="inline-flex items-center text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                <Clock className="w-3 h-3 mr-1" /> In arrivo
              </span>
            </div>

            {/* Logo e Assets */}
            <div className="border border-brand/30 bg-brand/5 rounded-xl p-4 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center mb-3">
                <Award className="w-5 h-5 text-brand" />
              </div>
              <h4 className="font-semibold text-gray-900 text-sm mb-1">Logo & Assets</h4>
              <p className="text-xs text-gray-500 mb-3">Logo Renthubber in vari formati per i tuoi materiali.</p>
              <button
                onClick={() => {
                  const w = window.open('', '_blank', 'width=500,height=600');
                  if (!w) return;
                  w.document.write(`<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>Logo & Assets - RentHubber</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#e5e7eb;display:flex;flex-direction:column;align-items:center;min-height:100vh;padding:30px}
.card{background:white;border-radius:16px;padding:32px;box-shadow:0 8px 30px rgba(0,0,0,0.12);max-width:420px;width:100%}
.title{font-size:16px;font-weight:700;color:#0D414B;margin-bottom:4px;text-align:center}
.subtitle{font-size:12px;color:#6B7280;margin-bottom:24px;text-align:center}
.asset{background:#F7FAFA;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:12px;text-align:center}
.asset-dark{background:#0D414B}
.asset img{height:50px;width:auto;margin-bottom:10px}
.asset-label{font-size:11px;color:#6B7280;font-weight:600;margin-bottom:8px}
.asset-dark .asset-label{color:#B0EDE8}
.btn-dl{display:inline-block;padding:6px 16px;background:#3DD9D0;color:#0D414B;border:none;border-radius:6px;font-family:'Inter',sans-serif;font-size:12px;font-weight:600;cursor:pointer;text-decoration:none;transition:all 0.2s}
.btn-dl:hover{background:#2CC5BC}
.colors{display:flex;gap:10px;justify-content:center;margin-bottom:12px}
.swatch{width:50px;height:50px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:600;color:white;text-shadow:0 1px 2px rgba(0,0,0,0.3)}
.font-info{background:#F7FAFA;border:1px solid #e5e7eb;border-radius:12px;padding:16px;text-align:center}
.font-name{font-size:18px;font-weight:700;color:#0D414B;margin-bottom:4px}
.font-detail{font-size:11px;color:#6B7280}
.no-print{margin-top:20px;text-align:center}
.no-print button{padding:10px 24px;border:none;border-radius:8px;font-family:'Inter',sans-serif;font-weight:600;font-size:14px;cursor:pointer;background:#e5e7eb;color:#374151}
@media print{body{background:none;padding:0}.card{box-shadow:none}.no-print{display:none!important}}
</style>
</head>
<body>
<div class="card">
<div class="title">Logo & Assets RentHubber</div>
<div class="subtitle">Scarica i materiali per le tue comunicazioni</div>
<div class="asset">
<div class="asset-label">Logo su sfondo chiaro</div>
<img src="https://upyznglekmynztmydtxi.supabase.co/storage/v1/object/public/images/logo-renthubber.png.png" alt="Logo"><br>
<a class="btn-dl" href="https://upyznglekmynztmydtxi.supabase.co/storage/v1/object/public/images/logo-renthubber.png.png" download="RentHubber_Logo.png">⬇️ Scarica PNG</a>
</div>
<div class="asset asset-dark">
<div class="asset-label">Logo su sfondo scuro</div>
<img src="https://upyznglekmynztmydtxi.supabase.co/storage/v1/object/public/images/logo-renthubber.png.png" alt="Logo" style="filter:brightness(0) invert(1)"><br>
<a class="btn-dl" href="https://upyznglekmynztmydtxi.supabase.co/storage/v1/object/public/images/logo-renthubber.png.png" download="RentHubber_Logo_White.png">⬇️ Scarica PNG</a>
</div>
<div style="margin-top:20px;margin-bottom:8px;font-size:13px;font-weight:700;color:#0D414B;text-align:center">Colori Brand</div>
<div class="colors">
<div class="swatch" style="background:#0D414B">#0D414B</div>
<div class="swatch" style="background:#3DD9D0;color:#0D414B;text-shadow:none">#3DD9D0</div>
<div class="swatch" style="background:#1F2937">#1F2937</div>
<div class="swatch" style="background:#F7FAFA;color:#6B7280;text-shadow:none">#F7FAFA</div>
</div>
<div class="font-info">
<div class="font-name">Inter</div>
<div class="font-detail">Font ufficiale RentHubber · Pesi: 400, 600, 700, 800</div>
</div>
</div>
<div class="no-print">
<button onclick="window.close()">Chiudi</button>
</div>
</body></html>`);
                  w.document.close();
                }}
                className="inline-flex items-center text-xs text-brand font-semibold bg-brand/10 hover:bg-brand/20 px-3 py-1.5 rounded-full transition-all"
              >
                <Award className="w-3 h-3 mr-1" /> Apri Assets
              </button>
            </div>

            {/* Volantino / Flyer */}
            <div className="border border-brand/30 bg-brand/5 rounded-xl p-4 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
                <Clipboard className="w-5 h-5 text-amber-500" />
              </div>
              <h4 className="font-semibold text-gray-900 text-sm mb-1">Volantino Stampabile</h4>
              <p className="text-xs text-gray-500 mb-3">Flyer A5 pronto da stampare con il tuo codice referral.</p>
              <button
                onClick={() => {
                  const code = collaborator?.referral_code || 'CODICE';
                  const link = `https://renthubber.com/partner/${code}`;
                  const w = window.open('', '_blank', 'width=700,height=900');
                  if (!w) return;
                  w.document.write(`<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>Volantino RentHubber</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--brand:#0D414B;--teal:#3DD9D0;--teal-light:#E6FAF8;--teal-mid:#B0EDE8;--bg:#F7FAFA;--white:#FFFFFF;--dark:#1F2937;--gray:#6B7280;--gray-light:#D1D5DB}
body{font-family:'Inter',sans-serif;background:#e5e7eb;display:flex;flex-direction:column;align-items:center;min-height:100vh;padding:20px}
.flyer{width:148mm;height:210mm;background:var(--bg);position:relative;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.15);display:flex;flex-direction:column}
.logo-bar{background:var(--white);padding:6mm 10mm;text-align:center;border-bottom:1px solid #e5e7eb}
.logo-bar img{height:12mm;width:auto;object-fit:contain}
.header{background:var(--brand);padding:6mm 10mm;text-align:center;position:relative;overflow:hidden}
.header::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2mm;background:var(--teal)}
.header::before{content:'';position:absolute;top:-15mm;left:-10mm;width:50mm;height:50mm;border-radius:50%;background:rgba(255,255,255,0.03)}
.header-deco{position:absolute;bottom:-8mm;right:-5mm;width:35mm;height:35mm;border-radius:50%;background:rgba(255,255,255,0.03)}
.header-sub{font-size:7pt;color:var(--teal-mid);letter-spacing:0.5px;margin-bottom:3mm}
.tagline{font-size:11.5pt;font-weight:700;color:var(--white);line-height:1.45}
.content{padding:5mm 8mm 0;flex:1;display:flex;flex-direction:column}
.section-title{font-size:9pt;font-weight:700;color:var(--brand);text-align:center;margin-bottom:1.5mm;position:relative}
.section-title::after{content:'';display:block;width:18mm;height:1.5px;background:var(--teal);margin:1.5mm auto 0;border-radius:1px}
.categories{margin-top:3mm;display:grid;grid-template-columns:repeat(3,1fr);gap:2mm;margin-bottom:5mm}
.cat-card{background:var(--white);border-radius:2.5mm;padding:2.5mm 2mm;display:flex;align-items:center;gap:2mm;box-shadow:0 0.5px 2px rgba(0,0,0,0.06)}
.cat-emoji{font-size:10pt;flex-shrink:0;width:6mm;text-align:center}
.cat-label{font-size:6pt;font-weight:600;color:var(--dark);line-height:1.2}
.steps-section{margin-bottom:4mm}
.steps{display:flex;align-items:flex-start;justify-content:center;gap:0;margin-top:3mm;position:relative}
.step{flex:1;text-align:center;position:relative}
.step-num{width:8mm;height:8mm;border-radius:50%;background:var(--teal);color:var(--brand);font-size:9pt;font-weight:800;display:flex;align-items:center;justify-content:center;margin:0 auto 2mm}
.step-title{font-size:7pt;font-weight:700;color:var(--brand);margin-bottom:0.5mm}
.step-desc{font-size:5.5pt;color:var(--gray)}
.step:not(:last-child)::after{content:'';position:absolute;top:4mm;right:-3mm;width:6mm;height:1px;background:var(--teal)}
.step:not(:last-child)::before{content:'';position:absolute;top:2.8mm;right:-3mm;width:0;height:0;border-top:1.5mm solid transparent;border-bottom:1.5mm solid transparent;border-left:2mm solid var(--teal)}
.benefits{background:var(--teal-light);border-radius:3mm;padding:3mm;display:flex;justify-content:space-around;margin-bottom:auto}
.benefit{text-align:center;font-size:5.5pt;color:var(--brand);font-weight:500;display:flex;align-items:center;gap:1mm}
.benefit-check{color:var(--teal);font-weight:800;font-size:7pt}
.referral-section{margin-top:auto;padding-bottom:12mm}
.referral-box{background:var(--white);border:1.5px solid var(--teal);border-radius:4mm;padding:4mm 5mm;display:flex;align-items:center;gap:5mm}
.qr-wrapper{flex-shrink:0;width:26mm;height:26mm;border:1px solid var(--gray-light);border-radius:2mm;overflow:hidden;padding:1mm;background:white;display:flex;align-items:center;justify-content:center}
.qr-wrapper canvas,.qr-wrapper img{max-width:24mm!important;max-height:24mm!important;width:24mm!important;height:24mm!important;display:block}
.referral-info{flex:1}
.referral-label{font-size:7.5pt;font-weight:700;color:var(--brand);margin-bottom:2mm}
.referral-sublabel{font-size:6pt;color:var(--gray);margin-bottom:1.5mm}
.referral-code{font-size:16pt;font-weight:800;color:var(--teal);letter-spacing:1.5px;margin-bottom:2mm}
.referral-hint{font-size:5.5pt;color:var(--gray);line-height:1.4}
.referral-url{font-size:6.5pt;font-weight:700;color:var(--brand);margin-top:1mm}
.footer{background:var(--brand);padding:2.5mm 8mm;text-align:center;position:relative}
.footer::before{content:'';position:absolute;top:0;left:0;right:0;height:1.2px;background:var(--teal)}
.footer-text{font-size:5pt;color:var(--teal-mid);letter-spacing:0.3px}
.no-print{text-align:center;margin-top:15px;display:flex;gap:10px;justify-content:center}
.no-print button{padding:10px 24px;border:none;border-radius:8px;font-family:'Inter',sans-serif;font-weight:600;font-size:14px;cursor:pointer;transition:all 0.2s}
.btn-print{background:#0D414B;color:white}
.btn-print:hover{background:#092F36}
.btn-close{background:#e5e7eb;color:#374151}
.btn-close:hover{background:#d1d5db}
@media print{body{background:none;padding:0;margin:0}.flyer{box-shadow:none;margin:0}.no-print{display:none!important}@page{size:148mm 210mm;margin:0}}
</style>
</head>
<body>
<div class="flyer">
<div class="logo-bar">
<img src="https://upyznglekmynztmydtxi.supabase.co/storage/v1/object/public/images/logo-renthubber.png.png" alt="RentHubber">
</div>
<div class="header">
<div class="header-deco"></div>
<div class="header-sub">La piattafomra di noleggio oggetti e spazi vicino a te</div>
<div class="tagline">Noleggia ciò che ti serve.<br>Guadagna da ciò che non usi.</div>
</div>
<div class="content">
<div class="section-title">Cosa puoi noleggiare?</div>
<div class="categories">
<div class="cat-card"><span class="cat-emoji">🚲</span><span class="cat-label">Bici & Sport</span></div>
<div class="cat-card"><span class="cat-emoji">📷</span><span class="cat-label">Elettronica</span></div>
<div class="cat-card"><span class="cat-emoji">🔧</span><span class="cat-label">Attrezzi</span></div>
<div class="cat-card"><span class="cat-emoji">🛵</span><span class="cat-label">Veicoli</span></div>
<div class="cat-card"><span class="cat-emoji">🏠</span><span class="cat-label">Spazi</span></div>
<div class="cat-card"><span class="cat-emoji">🎸</span><span class="cat-label">E molto altro</span></div>
</div>
<div class="steps-section">
<div class="section-title">Come funziona</div>
<div class="steps">
<div class="step"><div class="step-num">1</div><div class="step-title">Registrati</div><div class="step-desc">Gratis in 2 minuti</div></div>
<div class="step"><div class="step-num">2</div><div class="step-title">Pubblica</div><div class="step-desc">Il tuo annuncio</div></div>
<div class="step"><div class="step-num">3</div><div class="step-title">Guadagna</div><div class="step-desc">Ad ogni noleggio</div></div>
</div>
</div>
<div class="benefits">
<div class="benefit"><span class="benefit-check">✓</span> Pagamenti sicuri</div>
<div class="benefit"><span class="benefit-check">✓</span> Zero costi fissi</div>
<div class="benefit"><span class="benefit-check">✓</span> Utenti verificati</div>
<div class="benefit"><span class="benefit-check">✓</span> Assistenza dedicata</div>
</div>
<div class="referral-section">
<div class="referral-box">
<div class="qr-wrapper" id="qrContainer"></div>
<div class="referral-info">
<div class="referral-label">Registrati con il mio codice!</div>
<div class="referral-sublabel">Il tuo codice invito:</div>
<div class="referral-code">${code}</div>
<div class="referral-hint">Inquadra il QR code o vai su:</div>
<div class="referral-url">renthubber.com/partner/${code}</div>
</div>
</div>
</div>
</div>
<div class="footer">
<div class="footer-text">renthubber.com · info@renthubber.com · La piattaforma per oggetti e spazi vicino a te</div>
</div>
</div>
<div class="no-print">
<button class="btn-print" onclick="window.print()">🖨️ Stampa / Salva PDF</button>
<button class="btn-close" onclick="window.close()">Chiudi</button>
</div>
<script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"><\/script>
<script>
new QRCode(document.getElementById('qrContainer'),{text:'${link}',width:90,height:90,colorDark:'#0D414B',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.H});
<\/script>
</body></html>`);
                  w.document.close();
                }}
                className="inline-flex items-center text-xs text-brand font-semibold bg-brand/10 hover:bg-brand/20 px-3 py-1.5 rounded-full transition-all"
              >
                <Clipboard className="w-3 h-3 mr-1" /> Genera Volantino
              </button>
            </div>

            {/* QR Code Personale */}
            <div className="border border-brand/30 bg-brand/5 rounded-xl p-4 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mb-3">
                <Share2 className="w-5 h-5 text-green-500" />
              </div>
              <h4 className="font-semibold text-gray-900 text-sm mb-1">QR Code Personale</h4>
              <p className="text-xs text-gray-500 mb-3">QR code collegato al tuo link referral, da stampare o condividere.</p>
              <button
                onClick={() => {
                  const code = collaborator?.referral_code || 'CODICE';
                  const link = `https://renthubber.com/partner/${code}`;
                  const w = window.open('', '_blank', 'width=500,height=600');
                  if (!w) return;
                  w.document.write(`<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>QR Code - RentHubber</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#e5e7eb;display:flex;flex-direction:column;align-items:center;min-height:100vh;padding:30px}
.card{background:white;border-radius:16px;padding:32px;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,0.12);max-width:360px;width:100%}
.logo{height:40px;width:auto;margin-bottom:16px}
.title{font-size:14px;font-weight:700;color:#0D414B;margin-bottom:4px}
.subtitle{font-size:11px;color:#6B7280;margin-bottom:20px}
.qr-box{background:#F7FAFA;border:2px solid #3DD9D0;border-radius:12px;padding:20px;display:inline-block;margin-bottom:16px}
#qrContainer{display:flex;align-items:center;justify-content:center}
#qrContainer canvas,#qrContainer img{width:200px!important;height:200px!important}
.code-label{font-size:11px;color:#6B7280;margin-bottom:4px}
.code{font-size:22px;font-weight:800;color:#3DD9D0;letter-spacing:2px;margin-bottom:8px}
.link{font-size:10px;color:#0D414B;font-weight:600;word-break:break-all}
.no-print{margin-top:20px;display:flex;gap:10px}
.no-print button{padding:10px 24px;border:none;border-radius:8px;font-family:'Inter',sans-serif;font-weight:600;font-size:14px;cursor:pointer}
.btn-print{background:#0D414B;color:white}
.btn-download{background:#3DD9D0;color:#0D414B}
.btn-close{background:#e5e7eb;color:#374151}
@media print{body{background:none;padding:0}.card{box-shadow:none}.no-print{display:none!important}@page{margin:10mm}}
</style>
</head>
<body>
<div class="card">
<img class="logo" src="https://upyznglekmynztmydtxi.supabase.co/storage/v1/object/public/images/logo-renthubber.png.png" alt="RentHubber">
<div class="title">Il tuo QR Code Personale</div>
<div class="subtitle">Condividilo per invitare nuovi Hubber</div>
<div class="qr-box"><div id="qrContainer"></div></div>
<div class="code-label">Il tuo codice:</div>
<div class="code">${code}</div>
<div class="link">renthubber.com/partner/${code}</div>
</div>
<div class="no-print">
<button class="btn-download" onclick="var c=document.querySelector('#qrContainer canvas');if(c){var a=document.createElement('a');a.download='QR_RentHubber_${code}.png';a.href=c.toDataURL('image/png');a.click()}">⬇️ Scarica QR</button>
<button class="btn-print" onclick="window.print()">🖨️ Stampa</button>
<button class="btn-close" onclick="window.close()">Chiudi</button>
</div>
<script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"><\/script>
<script>
new QRCode(document.getElementById('qrContainer'),{text:'${link}',width:200,height:200,colorDark:'#0D414B',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.H});
<\/script>
</body></html>`);
                  w.document.close();
                }}
                className="inline-flex items-center text-xs text-brand font-semibold bg-brand/10 hover:bg-brand/20 px-3 py-1.5 rounded-full transition-all"
              >
                <Share2 className="w-3 h-3 mr-1" /> Genera QR Code
              </button>
            </div>

            {/* Badge Collaboratore - questo è già pronto */}
            <div className="border border-brand/30 rounded-xl p-4 bg-brand/5">
              <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center mb-3">
                <Award className="w-5 h-5 text-brand" />
              </div>
              <h4 className="font-semibold text-gray-900 text-sm mb-1">Badge Collaboratore</h4>
              <p className="text-xs text-gray-500 mb-3">Il tuo tesserino ufficiale formato porta-badge.</p>
              <button onClick={() => setActiveTab('profile')} className="inline-flex items-center text-xs text-brand font-medium hover:underline">
                Vai al Profilo <ChevronRight className="w-3 h-3 ml-1" />
              </button>
            </div>
          </div>
        </div>

      </div>
    );
  }

  // ============================================================
  // 2️⃣ HUBBER PORTATI
  // ============================================================
  function renderHubbers() {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Cerca hubber..." className="pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand outline-none w-full sm:w-64"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <select className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand outline-none" value={leadFilter} onChange={e => setLeadFilter(e.target.value)}>
              <option value="all">Tutti ({leads.length})</option>
              {Object.entries(LEAD_STATUS_CONFIG).map(([k, c]) => <option key={k} value={k}>{c.label} ({leads.filter(l => l.status === k).length})</option>)}
            </select>
          </div>
          <button onClick={() => setShowNewLeadForm(true)} className="bg-brand hover:bg-brand-dark text-white font-medium px-4 py-2 rounded-lg text-sm flex items-center shadow-sm">
            <Plus className="w-4 h-4 mr-1" /> Aggiungi Contatto
          </button>
        </div>
        
        {/* HUBBER REGISTRATI */}
        {(
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-green-50/50">
              <h3 className="font-bold text-gray-900 text-sm flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-600" /> Hubber Registrati tramite il tuo link
                <span className="ml-2 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">{registeredHubbers.length}</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Utenti che si sono registrati tramite il tuo codice referral</p>
            </div>
            <div className="divide-y divide-gray-50">
              {registeredHubbers.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 font-medium">Nessun hubber registrato ancora</p>
                  <p className="text-xs text-gray-400 mt-1">Condividi il tuo link referral per iniziare!</p>
                </div>
              ) : registeredHubbers.map(h => (
                <div key={h.lead_id} className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {h.avatar_url ? (
                        <img src={h.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-brand">{(h.first_name || '?').charAt(0)}{(h.last_name || '?').charAt(0)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">{h.first_name} {h.last_name}</p>
                        {h.is_super_hubber && <Star className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
                        <span>{h.email}</span>
                        {h.registered_at && <span>Registrato: {new Date(h.registered_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-900">{h.active_listings_count || 0}</p>
                      <p className="text-[10px] text-gray-400">Annunci</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-900">{h.completed_bookings_90d || 0}</p>
                      <p className="text-[10px] text-gray-400">Prenotazioni</p>
                    </div>
                    {h.rating > 0 && (
                      <div className="text-center">
                        <p className="text-sm font-bold text-amber-600">⭐ {Number(h.rating).toFixed(1)}</p>
                        <p className="text-[10px] text-gray-400">Rating</p>
                      </div>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium border ${h.lead_status === 'attivo' ? 'bg-green-50 border-green-200 text-green-700' : h.lead_status === 'registrato' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                      {h.lead_status === 'attivo' ? '✓ Attivo' : h.lead_status === 'registrato' ? 'Registrato' : h.lead_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showNewLeadForm && (
          <div className="bg-white p-6 rounded-2xl border-2 border-brand/20 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center"><UserPlus className="w-5 h-5 mr-2 text-brand" /> Nuovo Contatto</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Tipo *</label>
                <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand outline-none" value={newLead.lead_type} onChange={e => setNewLead({ ...newLead, lead_type: e.target.value })}>
                  <option value="privato">👤 Privato</option>
                  <option value="ditta_individuale">🏪 Ditta Individuale</option>
                  <option value="societa">🏢 Società</option>
                  <option value="associazione">🤝 Associazione</option>
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">{newLead.lead_type === 'privato' || newLead.lead_type === 'ditta_individuale' ? 'Nome e Cognome *' : newLead.lead_type === 'associazione' ? 'Denominazione *' : 'Ragione Sociale *'}</label><input type="text" placeholder={newLead.lead_type === 'privato' || newLead.lead_type === 'ditta_individuale' ? 'Mario Rossi' : newLead.lead_type === 'associazione' ? 'Associazione XYZ' : 'Azienda S.r.l.'} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand outline-none" value={newLead.contact_name} onChange={e => setNewLead({ ...newLead, contact_name: e.target.value })} /></div>
              {(newLead.lead_type !== 'privato') && <div><label className="block text-xs font-medium text-gray-600 mb-1">{newLead.lead_type === 'associazione' ? 'Referente' : 'Attività / Nome Commerciale'}</label><input type="text" placeholder={newLead.lead_type === 'associazione' ? 'Nome referente' : 'Nome attività'} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand outline-none" value={newLead.business_name} onChange={e => setNewLead({ ...newLead, business_name: e.target.value })} /></div>}
              {newLead.lead_type === 'privato' && <div><label className="block text-xs font-medium text-gray-600 mb-1">Attività</label><input type="text" placeholder="Nome attività (opzionale)" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand outline-none" value={newLead.business_name} onChange={e => setNewLead({ ...newLead, business_name: e.target.value })} /></div>}
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Email</label><input type="email" placeholder="email@example.com" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand outline-none" value={newLead.contact_email} onChange={e => setNewLead({ ...newLead, contact_email: e.target.value })} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Telefono</label><input type="tel" placeholder="+39 333 1234567" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand outline-none" value={newLead.contact_phone} onChange={e => setNewLead({ ...newLead, contact_phone: e.target.value })} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Codice Fiscale</label><input type="text" placeholder="RSSMRA85M01H501Z" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand outline-none uppercase" value={newLead.fiscal_code} onChange={e => setNewLead({ ...newLead, fiscal_code: e.target.value })} /></div>
              {(newLead.lead_type === 'ditta_individuale' || newLead.lead_type === 'societa') && <div><label className="block text-xs font-medium text-gray-600 mb-1">Partita IVA *</label><input type="text" placeholder="IT12345678901" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand outline-none uppercase" value={newLead.vat_number} onChange={e => setNewLead({ ...newLead, vat_number: e.target.value })} /></div>}
              {(newLead.lead_type !== 'privato') && <div><label className="block text-xs font-medium text-gray-600 mb-1">PEC</label><input type="email" placeholder="azienda@pec.it" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand outline-none" value={newLead.pec} onChange={e => setNewLead({ ...newLead, pec: e.target.value })} /></div>}
              {(newLead.lead_type !== 'privato') && <div><label className="block text-xs font-medium text-gray-600 mb-1">Codice SDI</label><input type="text" placeholder="0000000" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand outline-none uppercase" maxLength={7} value={newLead.sdi_code} onChange={e => setNewLead({ ...newLead, sdi_code: e.target.value })} /></div>}
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label><input type="text" placeholder="Es. Noleggio bici..." className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand outline-none" value={newLead.category} onChange={e => setNewLead({ ...newLead, category: e.target.value })} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Zona *</label>
                <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand outline-none" value={newLead.zone_id} onChange={e => setNewLead({ ...newLead, zone_id: e.target.value })}>
                  <option value="">Seleziona...</option>
                  {approvedZones.map(z => <option key={z.id} value={z.id}>{z.city || z.province || z.region}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Note</label><textarea placeholder="Note..." className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand outline-none resize-none" rows={2} value={newLead.notes} onChange={e => setNewLead({ ...newLead, notes: e.target.value })} /></div>
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button onClick={() => setShowNewLeadForm(false)} className="px-4 py-2 text-sm text-gray-600">Annulla</button>
              <button onClick={handleAddLead} disabled={isSaving || !newLead.contact_name || !newLead.zone_id} className="bg-brand hover:bg-brand-dark text-white font-medium px-4 py-2 rounded-lg text-sm disabled:opacity-50 flex items-center">
                {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />} Salva
              </button>
            </div>
          </div>
        )}

        {filteredLeads.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">{searchQuery || leadFilter !== 'all' ? 'Nessun risultato' : 'Nessun hubber inserito'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeads.map(lead => {
              const st = LEAD_STATUS_CONFIG[lead.status];
              const zone = zones.find(z => z.id === lead.zone_id);
              const lc = commissions.filter(c => c.lead_id === lead.id && c.status !== 'annullata');
              const le = lc.reduce((s, c) => s + Number(c.amount), 0);
              const isNotesExpanded = expandedLeadNotes === lead.id;
              const notes = leadNotes[lead.id] || [];

              const NOTE_TYPE_CONFIG: Record<string, { label: string; emoji: string }> = {
                generale: { label: 'Generale', emoji: '📝' },
                chiamata: { label: 'Chiamata', emoji: '📞' },
                incontro: { label: 'Incontro', emoji: '🤝' },
                followup: { label: 'Follow-up', emoji: '🔄' },
                obiezione: { label: 'Obiezione', emoji: '⚠️' },
              };

              return (
                <div key={lead.id} className="bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-shadow overflow-hidden">
                  <div className="p-4 cursor-pointer" onClick={() => setExpandedLeadId(expandedLeadId === lead.id ? null : lead.id)}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-gray-900 text-sm truncate">{lead.contact_name}</h4>
                          {registeredHubbers.some(h => h.email && lead.contact_email && h.email.toLowerCase() === lead.contact_email.toLowerCase()) && (
                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">✓ Registrato</span>
                          )}
                          <select value={lead.status} onChange={e => handleUpdateLeadStatus(lead.id, e.target.value)}
                            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${st.bg} ${st.color} outline-none cursor-pointer`}>
                            {Object.entries(LEAD_STATUS_CONFIG).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
                          </select>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                          {lead.business_name && <span className="flex items-center"><Building className="w-3 h-3 mr-1" />{lead.business_name}</span>}
                          {lead.contact_email && <span className="flex items-center"><Mail className="w-3 h-3 mr-1" />{lead.contact_email}</span>}
                          {lead.contact_phone && <span className="flex items-center"><Phone className="w-3 h-3 mr-1" />{lead.contact_phone}</span>}
                          {zone && <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" />{zone.city || zone.province || zone.region}</span>}
                          {lead.category && <span className="flex items-center"><Tag className="w-3 h-3 mr-1" />{lead.category}</span>}
                        </div>
                        {lead.notes && <p className="text-xs text-gray-400 mt-1 italic">"{lead.notes}"</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => handleToggleNotes(lead.id)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center transition-colors ${isNotesExpanded ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          <FileText className="w-3 h-3 mr-1" /> Note {notes.length > 0 && `(${notes.length})`}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteLead(lead.id); }}
                          className="text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center bg-gray-100 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                          <XCircle className="w-3 h-3" />
                        </button>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">{new Date(lead.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          {le > 0 && <p className="text-xs font-semibold text-green-600">€{le.toFixed(2)}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
       
                 {/* DETTAGLI LEAD ESPANDIBILE */}
                  {/* DETTAGLI LEAD ESPANDIBILE */}
                  {expandedLeadId === lead.id && (
                    <div className="border-t border-gray-100 bg-blue-50/30 p-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-medium mb-0.5">Tipo</p>
                          <p className="text-xs font-medium text-gray-800">
                            {lead.lead_type === 'privato' ? '👤 Privato' : lead.lead_type === 'ditta_individuale' ? '🏪 Ditta Individuale' : lead.lead_type === 'societa' ? '🏢 Società' : lead.lead_type === 'associazione' ? '🤝 Associazione' : lead.lead_type || '-'}
                          </p>
                        </div>
                        {lead.contact_email && <div>
                          <p className="text-[10px] text-gray-400 uppercase font-medium mb-0.5">Email</p>
                          <p className="text-xs text-gray-800">{lead.contact_email}</p>
                        </div>}
                        {lead.contact_phone && <div>
                          <p className="text-[10px] text-gray-400 uppercase font-medium mb-0.5">Telefono</p>
                          <p className="text-xs text-gray-800">{lead.contact_phone}</p>
                        </div>}
                        {lead.business_name && <div>
                          <p className="text-[10px] text-gray-400 uppercase font-medium mb-0.5">Attività</p>
                          <p className="text-xs text-gray-800">{lead.business_name}</p>
                        </div>}
                        {lead.fiscal_code && <div>
                          <p className="text-[10px] text-gray-400 uppercase font-medium mb-0.5">Codice Fiscale</p>
                          <p className="text-xs text-gray-800 font-mono">{lead.fiscal_code}</p>
                        </div>}
                        {lead.vat_number && <div>
                          <p className="text-[10px] text-gray-400 uppercase font-medium mb-0.5">Partita IVA</p>
                          <p className="text-xs text-gray-800 font-mono">{lead.vat_number}</p>
                        </div>}
                        {lead.pec && <div>
                          <p className="text-[10px] text-gray-400 uppercase font-medium mb-0.5">PEC</p>
                          <p className="text-xs text-gray-800">{lead.pec}</p>
                        </div>}
                        {lead.sdi_code && <div>
                          <p className="text-[10px] text-gray-400 uppercase font-medium mb-0.5">Codice SDI</p>
                          <p className="text-xs text-gray-800 font-mono">{lead.sdi_code}</p>
                        </div>}
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-medium mb-0.5">Zona</p>
                          <p className="text-xs text-gray-800">{zone ? (zone.city || zone.province || zone.region) : '-'}</p>
                        </div>
                        {lead.category && <div>
                          <p className="text-[10px] text-gray-400 uppercase font-medium mb-0.5">Categoria</p>
                          <p className="text-xs text-gray-800">{lead.category}</p>
                        </div>}
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-medium mb-0.5">Inserito il</p>
                          <p className="text-xs text-gray-800">{new Date(lead.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                        {lead.registered_at && <div>
                          <p className="text-[10px] text-gray-400 uppercase font-medium mb-0.5">Registrato il</p>
                          <p className="text-xs text-gray-800">{new Date(lead.registered_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>}
                        {lead.activated_at && <div>
                          <p className="text-[10px] text-gray-400 uppercase font-medium mb-0.5">Attivato il</p>
                          <p className="text-xs text-gray-800">{new Date(lead.activated_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>}
                        {le > 0 && <div>
                          <p className="text-[10px] text-gray-400 uppercase font-medium mb-0.5">Guadagni Totali</p>
                          <p className="text-xs font-bold text-green-600">€{le.toFixed(2)}</p>
                        </div>}
                      </div>
                      {lead.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-200/50">
                          <p className="text-[10px] text-gray-400 uppercase font-medium mb-0.5">Note</p>
                          <p className="text-xs text-gray-700 italic">"{lead.notes}"</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SEZIONE NOTE ESPANDIBILE */}
                  {isNotesExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                      {/* Form nuova nota */}
                      <div className="flex gap-2 mb-3">
                        <select value={newNoteType} onChange={e => setNewNoteType(e.target.value)}
                          className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-brand outline-none bg-white">
                          {Object.entries(NOTE_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                        </select>
                        <input type="text" placeholder="Scrivi una nota..." value={newNoteText} onChange={e => setNewNoteText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && newNoteText.trim()) handleAddNote(lead.id); }}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-brand outline-none bg-white" />
                        <button onClick={() => handleAddNote(lead.id)} disabled={isSavingNote || !newNoteText.trim()}
                          className="bg-brand hover:bg-brand-dark text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 flex items-center flex-shrink-0">
                          {isSavingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                        </button>
                      </div>

                      {/* Lista note */}
                      {notes.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-3">Nessuna nota. Aggiungi la prima!</p>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {notes.map((n: any) => {
                            const nt = NOTE_TYPE_CONFIG[n.note_type] || NOTE_TYPE_CONFIG.generale;
                            return (
                              <div key={n.id} className="bg-white rounded-lg p-3 border border-gray-100 group">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <span className="text-xs">{nt.emoji}</span>
                                      <span className="text-[10px] font-medium text-gray-500 uppercase">{nt.label}</span>
                                      <span className="text-[10px] text-gray-300">·</span>
                                      <span className="text-[10px] text-gray-400">{new Date(n.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-xs text-gray-700">{n.note}</p>
                                  </div>
                                  <button onClick={() => handleDeleteNote(n.id, lead.id)}
                                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
  // ============================================================
  // 3️⃣ GUADAGNI & COMMISSIONI
  // ============================================================
  function renderEarnings() {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Commissioni Maturate</p>
              <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Euro className="w-4 h-4 text-brand" /></div>
            </div>
            <p className="text-3xl font-bold text-gray-900">€{kpi.totalEarnings.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">Totale da sempre</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">In Attesa Pagamento</p>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center"><Clock className="w-4 h-4 text-amber-600" /></div>
            </div>
            <p className="text-3xl font-bold text-amber-600">€{kpi.pendingCommissions.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">Pagate entro il 15 del prossimo mese</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Già Pagato</p>
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-green-600" /></div>
            </div>
            <p className="text-3xl font-bold text-green-600">€{kpi.paidCommissions.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">Accreditato sul tuo conto</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Guadagni Ultimi 6 Mesi</h3>
          <div className="h-72" style={{ minHeight: '288px' }}>
            {chartData.some(d => d.totale > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="cB" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3B82F6" stopOpacity={0} /></linearGradient>
                    <linearGradient id="cR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} formatter={(v: number) => [`€${Number(v).toFixed(2)}`]} />
                  <Legend />
                  <Area type="monotone" dataKey="bonus" name="Bonus Acquisizione" stroke="#3B82F6" fill="url(#cB)" strokeWidth={2} />
                  <Area type="monotone" dataKey="ricorrenti" name="Ricorrenti" stroke="#10B981" fill="url(#cR)" strokeWidth={2} />
                  <Area type="monotone" dataKey="milestone" name="Milestone" stroke="#F59E0B" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <TrendingUp className="w-12 h-12 mb-3 opacity-30" /><p className="text-sm">Nessun guadagno ancora</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-900">Dettaglio Commissioni</h3></div>
          {commissions.length === 0 ? (
            <div className="p-8 text-center text-gray-400"><Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">Le commissioni appariranno qui</p></div>
          ) : (
            <div className="divide-y divide-gray-50">
              {commissions.map(c => {
                const lead = leads.find(l => l.id === c.lead_id);
                return (
                  <div key={c.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {c.type === 'acquisition_bonus' ? '🎯 Bonus Acquisizione' : c.type === 'recurring' ? '🔄 Ricorrente' : '🏆 Milestone'}
                      </p>
                      {lead && <p className="text-xs text-gray-500">Hubber: {lead.contact_name}</p>}
                      <p className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">€{Number(c.amount).toFixed(2)}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.status === 'pagata' ? 'bg-green-50 text-green-700' : c.status === 'maturata' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                        {c.status === 'pagata' ? '✓ Pagata' : c.status === 'maturata' ? '⏳ In attesa' : '✗ Annullata'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <h4 className="font-semibold text-blue-900 text-sm mb-2 flex items-center"><Info className="w-4 h-4 mr-2" /> Come funzionano i guadagni</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-blue-800">
            <div className="bg-white/60 rounded-xl p-3"><p className="font-semibold mb-1">🎯 Bonus Acquisizione</p><p>Una tantum per Hubber registrato + 1 annuncio</p></div>
            <div className="bg-white/60 rounded-xl p-3"><p className="font-semibold mb-1">🔄 Ricorrente</p><p>% sulle commissioni RH per 12 mesi</p></div>
            <div className="bg-white/60 rounded-xl p-3"><p className="font-semibold mb-1">🏆 Milestone</p><p>Premi a 10, 25, 50 Hubber attivi</p></div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // 4️⃣ STRUMENTI DI INVITO
  // ============================================================
  function renderInvite() {
    const script = `Ciao! Ti scrivo perché conosco una piattaforma che potrebbe farti guadagnare: si chiama Renthubber.

È un marketplace dove puoi mettere a noleggio oggetti, attrezzature, spazi — qualsiasi cosa tu abbia.

La registrazione è gratuita:
${referralLink}

Se vuoi ne parliamo!`;
    const wa = encodeURIComponent(`Ciao! Conosci Renthubber? Puoi mettere a noleggio le tue cose e guadagnare. Registrati qui: ${referralLink}`);

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-brand to-brand-dark rounded-2xl p-6 text-white">
          <h3 className="font-bold text-lg mb-2">🔗 Il tuo Link Personale</h3>
          <p className="text-white/80 text-sm mb-4">Ogni registrazione tramite questo link viene associata a te.</p>
          <div className="flex items-center space-x-2 bg-white/10 rounded-xl p-3">
            <code className="text-sm font-mono flex-1 truncate">{referralLink}</code>
            <button onClick={() => copyText(referralLink, 'link')} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium flex items-center flex-shrink-0">
              {copiedLink ? <><Check className="w-4 h-4 mr-1" /> Copiato!</> : <><Copy className="w-4 h-4 mr-1" /> Copia</>}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <a href={`https://wa.me/?text=${wa}`} target="_blank" rel="noopener noreferrer" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center"><Send className="w-4 h-4 mr-1" /> WhatsApp</a>
            <a href={`mailto:?subject=Scopri Renthubber&body=${encodeURIComponent(script)}`} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center"><Mail className="w-4 h-4 mr-1" /> Email</a>
            <button onClick={() => { if (navigator.share) navigator.share({ title: 'Renthubber', text: 'Scopri Renthubber!', url: referralLink }); else copyText(referralLink, 'link'); }} className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center"><Share2 className="w-4 h-4 mr-1" /> Condividi</button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-2 flex items-center"><FileText className="w-5 h-5 mr-2 text-brand" /> Script di Presentazione</h3>
          <p className="text-xs text-gray-500 mb-4">Copia e personalizza questo messaggio</p>
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-line border border-gray-200">{script}</div>
          <button onClick={() => copyText(script, 'script')} className="mt-3 bg-brand/10 hover:bg-brand/20 text-brand px-4 py-2 rounded-lg text-sm font-medium flex items-center">
            {copiedScript ? <><Check className="w-4 h-4 mr-1" /> Copiato!</> : <><Clipboard className="w-4 h-4 mr-1" /> Copia Script</>}
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center"><Zap className="w-5 h-5 mr-2 text-amber-500" /> Consigli per Convincere</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              ['Parla dei vantaggi concreti', '"Puoi guadagnare da cose che hai già"'],
              ['Mostra esempi reali', '"C\'è chi noleggia il trapano, chi il garage"'],
              ['Enfatizza la semplicità', '"Ti registri in 2 minuti e pubblichi"'],
              ['Rassicura sulla sicurezza', '"Utenti verificati, pagamenti protetti"'],
              ['Offri il tuo aiuto', '"Ti aiuto io col primo annuncio"'],
              ['Usa la leva sociale', '"Ci sono già hubber nella tua zona"'],
            ].map(([t, d], i) => (
              <div key={i} className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                <p className="text-sm font-semibold text-gray-900">💡 {t}</p>
                <p className="text-xs text-gray-600 mt-1 italic">{d}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-brand/5 border border-brand/20 rounded-2xl p-5 text-center">
          <p className="text-sm text-gray-600 mb-2">La frase che chiude il 70% delle obiezioni:</p>
          <p className="text-lg font-bold text-brand">"Hai una dashboard dove vedi in tempo reale hubber, noleggi e guadagni. Tutto tracciato e automatico."</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // 5️⃣ PERFORMANCE
  // ============================================================
  function renderPerformance() {
    const active = leads.filter(l => l.status === 'attivo').length;
    const reg = leads.filter(l => ['registrato', 'attivo'].includes(l.status)).length;
    const conv = leads.length > 0 ? (active / leads.length) * 100 : 0;

    const light = (v: number, t: [number, number]) =>
      v >= t[1] ? { c: 'bg-green-500', l: 'Ottimo', t: 'text-green-700' } :
      v >= t[0] ? { c: 'bg-amber-500', l: 'Buono', t: 'text-amber-700' } :
      { c: 'bg-red-500', l: 'Da migliorare', t: 'text-red-700' };

    const cl = light(conv, [20, 40]);
    const ml = light(monthlyPerf.activated, [2, 5]);
    const ll = light(monthlyPerf.newLeads, [5, 10]);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: 'Nuovi Lead (mese)', val: monthlyPerf.newLeads, sem: ll },
            { title: 'Attivati (mese)', val: monthlyPerf.activated, sem: ml },
            { title: 'Conversione', val: `${conv.toFixed(0)}%`, sem: cl },
          ].map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">{item.title}</p>
                <div className={`w-4 h-4 rounded-full ${item.sem.c}`}></div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{item.val}</p>
              <p className={`text-xs mt-1 font-medium ${item.sem.t}`}>{item.sem.l}</p>
            </div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Funnel di Conversione</h3>
          <div className="space-y-3">
            {[
              { l: 'Contattati', n: leads.filter(x => x.status !== 'perso').length, c: 'bg-blue-500' },
              { l: 'Interessati', n: leads.filter(x => ['interessato', 'registrato', 'attivo'].includes(x.status)).length, c: 'bg-amber-500' },
              { l: 'Registrati', n: reg, c: 'bg-purple-500' },
              { l: 'Attivi', n: active, c: 'bg-green-500' },
            ].map((s, i) => {
              const pct = leads.length > 0 ? (s.n / leads.length) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{s.l}</span>
                    <span className="text-gray-500">{s.n} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${s.c} rounded-full transition-all duration-500`} style={{ width: `${Math.max(pct, 2)}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center"><Award className="w-5 h-5 mr-2 text-brand" /> Progressione Badge</h3>
          <div className="flex items-center space-x-4 mb-4">
            <span className="text-4xl">{badge.emoji}</span>
            <div>
              <p className="font-bold text-gray-900">{badge.label}</p>
              {badge.next && <p className="text-sm text-gray-500">Prossimo: {badge.next} — mancano <strong>{Math.max(0, badge.target - active)}</strong> Hubber attivi</p>}
            </div>
          </div>
          {badge.target > 0 && (
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${Math.min((active / badge.target) * 100, 100)}%` }}></div>
            </div>
          )}
        </div>

        {/* Roadmap Livelli e Guadagni */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-2 flex items-center"><Euro className="w-5 h-5 mr-2 text-brand" /> Piano Guadagni per Livello</h3>
          <p className="text-xs text-gray-500 mb-6">Più Hubber attivi porti, più guadagni. I premi milestone scattano solo quando i tuoi Hubber hanno prenotazioni completate.</p>

          <hr className="border-gray-100 my-4" />

          <div className="space-y-3">
            {(settingsLevels.length > 0 ? settingsLevels.map(s => ({
              emoji: s.badge_level === 'starter' ? '🔰' : s.badge_level === 'bronze' ? '🥉' : s.badge_level === 'silver' ? '🥈' : '🥇',
              label: s.badge_level === 'starter' ? 'Starter' : s.badge_level === 'bronze' ? 'Bronze' : s.badge_level === 'silver' ? 'Silver' : 'Gold',
              range: s.max_active_hubbers ? `${s.min_active_hubbers}-${s.max_active_hubbers} Hubber` : `${s.min_active_hubbers}+ Hubber`,
              bonus: `€${Number(s.acquisition_bonus_amount).toFixed(0)}`,
              percent: `${Number(s.recurring_commission_pct).toFixed(0)}%`,
              milestone: s.milestone_bonus > 0 ? `€${Number(s.milestone_bonus).toFixed(0)} quando ${s.milestone_hubbers_required} Hubber con almeno 1 prenotazione` : null,
              current: (collaborator?.badge || 'none') === (s.badge_level === 'starter' ? 'none' : s.badge_level),
              color: s.badge_level === 'starter' ? 'border-gray-200 bg-gray-50' : s.badge_level === 'bronze' ? 'border-amber-200 bg-amber-50/30' : s.badge_level === 'silver' ? 'border-slate-300 bg-slate-50/30' : 'border-yellow-300 bg-yellow-50/30',
            })) : [
              { emoji: '🔰', label: 'Starter', range: '0-9 Hubber', bonus: '€5', percent: '5%', milestone: null, current: true, color: 'border-gray-200 bg-gray-50' },
            ]).map((level, i) => (
              <div key={i} className={`relative rounded-xl border-2 p-4 transition-all ${level.current ? 'border-brand bg-brand/5 ring-2 ring-brand/20' : level.color}`}>
                {level.current && (
                  <span className="absolute -top-2.5 right-3 bg-brand text-white text-[10px] font-bold px-2 py-0.5 rounded-full">IL TUO LIVELLO</span>
                )}
                <div className="flex items-start gap-4">
                  <span className="text-3xl flex-shrink-0">{level.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-gray-900">{level.label}</h4>
                        <p className="text-xs text-gray-500">{level.range} attivi</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                        <p className="text-[10px] text-gray-400 uppercase font-medium">Bonus / Hubber</p>
                        <p className="text-sm font-bold text-brand">{level.bonus}</p>
                        <p className="text-[10px] text-gray-400">per ogni registrato con annuncio</p>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                        <p className="text-[10px] text-gray-400 uppercase font-medium">Ricorrente 12 mesi</p>
                        <p className="text-sm font-bold text-green-600">{level.percent}</p>
                        <p className="text-[10px] text-gray-400">sulle commissioni Renthubber</p>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                        <p className="text-[10px] text-gray-400 uppercase font-medium">Premio Milestone</p>
                        {level.milestone ? (
                          <>
                            <p className="text-sm font-bold text-amber-600">{level.milestone.split(' quando')[0]}</p>
                            <p className="text-[10px] text-gray-400">quando{level.milestone.split('quando')[1]}</p>
                          </>
                        ) : (
                          <p className="text-xs text-gray-400 italic">—</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs text-blue-800 flex items-start gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span><strong>Come funziona:</strong> Il bonus acquisizione si ottiene per ogni Hubber che si registra e pubblica almeno 1 annuncio. La commissione ricorrente è una % su ogni prenotazione completata dai tuoi Hubber per 12 mesi. I premi milestone scattano solo quando i tuoi Hubber hanno prenotazioni reali completate.</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // 6️⃣ PAGAMENTI
  // ============================================================
  function renderPayments() {
    const paid = commissions.filter(c => c.status === 'pagata');
    const pending = commissions.filter(c => c.status === 'maturata').reduce((s, c) => s + Number(c.amount), 0);
    const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center"><CreditCard className="w-5 h-5 mr-2 text-brand" /> Prossimo Pagamento</h3>
          {pending > 0 ? (
            <div className="bg-brand/5 border border-brand/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div><p className="text-sm text-gray-600">Importo</p><p className="text-2xl font-bold text-brand">€{pending.toFixed(2)}</p></div>
              <div className="sm:text-right"><p className="text-sm text-gray-600">Data prevista</p><p className="text-sm font-semibold text-gray-900">Entro il 15 {nextMonth}</p></div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400"><Wallet className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">Nessun pagamento in attesa</p></div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center"><CreditCard className="w-5 h-5 mr-2 text-brand" /> Metodo di Pagamento</h3>
            <button onClick={() => setIsEditingPayment(!isEditingPayment)} className="text-brand text-sm hover:underline">{isEditingPayment ? 'Annulla' : 'Modifica'}</button>
          </div>
          {isEditingPayment ? (
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">IBAN</label><input type="text" placeholder="IT60 X054 2811 1010 0000 0123 456" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand outline-none uppercase" value={paymentMethod.iban} onChange={e => setPaymentMethod({ ...paymentMethod, iban: e.target.value })} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Intestatario</label><input type="text" placeholder="Nome e Cognome" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand outline-none" value={paymentMethod.intestatario} onChange={e => setPaymentMethod({ ...paymentMethod, intestatario: e.target.value })} /></div>
              <button onClick={() => setIsEditingPayment(false)} className="bg-brand hover:bg-brand-dark text-white font-medium px-4 py-2 rounded-lg text-sm">Salva</button>
            </div>
          ) : paymentMethod.iban ? (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-600">IBAN: <span className="font-mono font-medium text-gray-900">{paymentMethod.iban}</span></p>
              <p className="text-sm text-gray-600 mt-1">Intestatario: <span className="font-medium text-gray-900">{paymentMethod.intestatario}</span></p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <AlertTriangle className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <p className="text-sm text-amber-800 font-medium">Nessun metodo configurato</p>
              <button onClick={() => setIsEditingPayment(true)} className="mt-2 text-brand text-sm font-medium hover:underline">+ Aggiungi IBAN</button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-900">Storico Pagamenti</h3></div>
          {paid.length === 0 ? (
            <div className="p-8 text-center text-gray-400"><Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">Nessun pagamento ancora</p></div>
          ) : (
            <div className="divide-y divide-gray-50">
              {paid.map(c => (
                <div key={c.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Pagamento commissione</p>
                    <p className="text-xs text-gray-400">{c.paid_at ? new Date(c.paid_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}</p>
                  </div>
                  <p className="text-sm font-bold text-green-600">€{Number(c.amount).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  // ============================================================
  // 7️⃣ SUPPORTO & REGOLE
  // ============================================================
  function renderSupport() {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 flex items-center"><HelpCircle className="w-5 h-5 mr-2 text-brand" /> Domande Frequenti</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {FAQ_DATA.map((f, i) => (
              <div key={i} className="px-6">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between py-4 text-left">
                  <span className="text-sm font-medium text-gray-900 pr-4">{f.q}</span>
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </button>
                {openFaq === i && <div className="pb-4 text-sm text-gray-600">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center"><Shield className="w-5 h-5 mr-2 text-brand" /> Regole del Programma</h3>
          <div className="space-y-3 text-sm text-gray-700">
            {[
              ['Trasparenza', 'Presenta Renthubber in modo onesto. No promesse irrealistiche.'],
              ['Qualità', 'Porta Hubber con qualcosa da offrire. Qualità > quantità.'],
              ['Zone', 'Opera solo nelle zone approvate.'],
              ['Esclusività', 'Non rappresentare concorrenti nella stessa zona.'],
            ].map(([t, d], i) => (
              <div key={i} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p><strong>{t}:</strong> {d}</p>
              </div>
            ))}
            <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-xl">
              <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p><strong>Vietato:</strong> Registrazioni fake, spam, promesse di guadagni garantiti, uso improprio del brand.</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center"><MessageSquare className="w-5 h-5 mr-2 text-brand" /> Contatta il Supporto</h3>
          <p className="text-sm text-gray-600 mb-4">Per qualsiasi domanda, non esitare a contattarci.</p>
          <div className="flex flex-wrap gap-3">
            <a href="mailto:collaboratori@renthubber.com" className="flex items-center bg-brand/10 text-brand px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand/20">
              <Mail className="w-4 h-4 mr-2" /> collaboratori@renthubber.com
            </a>
            <a href="https://wa.me/393331234567" target="_blank" rel="noopener noreferrer" className="flex items-center bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-100">
              <Send className="w-4 h-4 mr-2" /> WhatsApp Supporto
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // 8️⃣ PROFILO
  // ============================================================
  function renderProfile() {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 flex items-center"><User className="w-5 h-5 mr-2 text-brand" /> Il tuo Profilo</h3>
            {!isEditingProfile && <button onClick={() => setIsEditingProfile(true)} className="text-brand text-sm hover:underline">Modifica</button>}
          </div>

          <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
          <div className="flex items-center space-x-4 mb-6">
           <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
              {(collaborator as any)?.avatar_url ? (
                <img src={(collaborator as any).avatar_url} alt="Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-brand/20" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center text-2xl font-bold text-brand">
                  {collaborator!.first_name.charAt(0)}{collaborator!.last_name.charAt(0)}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploadingAvatar ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <span className="text-white text-xs font-medium">Cambia</span>}
              </div>
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900">{collaborator!.first_name} {collaborator!.last_name}</h4>
              <p className="text-sm text-gray-500">{collaborator!.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm">{badge.emoji} {badge.label}</span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-500">Membro da {new Date(collaborator!.created_at).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {isEditingProfile ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Telefono</label>
                <input type="tel" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand outline-none"
                  value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">P.IVA / Codice Fiscale</label>
                <input type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand outline-none uppercase"
                  value={profileForm.tax_id} onChange={e => setProfileForm({ ...profileForm, tax_id: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bio</label>
                <textarea className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand outline-none resize-none" rows={3}
                  value={profileForm.bio} onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })} />
              </div>
              <div className="flex space-x-3">
                <button onClick={() => setIsEditingProfile(false)} className="px-4 py-2 text-sm text-gray-600">Annulla</button>
                <button onClick={handleSaveProfile} disabled={isSavingProfile}
                  className="bg-brand hover:bg-brand-dark text-white font-medium px-4 py-2 rounded-lg text-sm disabled:opacity-50 flex items-center">
                  {isSavingProfile ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />} Salva
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={<User className="w-4 h-4" />} label="Nome" value={`${collaborator!.first_name} ${collaborator!.last_name}`} />
              <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={collaborator!.email} />
              <InfoRow icon={<Phone className="w-4 h-4" />} label="Telefono" value={collaborator!.phone || 'Non impostato'} />
              <InfoRow icon={<FileText className="w-4 h-4" />} label="P.IVA / CF" value={collaborator!.tax_id || 'Non impostato'} />
              <InfoRow icon={<Link2 className="w-4 h-4" />} label="Codice Referral" value={collaborator!.referral_code} />
              <InfoRow icon={<Shield className="w-4 h-4" />} label="Stato" value={collaborator!.status === 'approvato' ? '✓ Attivo' : collaborator!.status} />
              <InfoRow icon={<MapPin className="w-4 h-4" />} label="Zone Attive" value={`${approvedZones.length} zone`} />
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="Iscritto dal" value={new Date(collaborator!.created_at).toLocaleDateString('it-IT')} />
            </div>
          )}
        </div>

        {collaborator!.bio && !isEditingProfile && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h4 className="font-bold text-gray-900 text-sm mb-2">La tua presentazione</h4>
            <p className="text-sm text-gray-600">{collaborator!.bio}</p>
          </div>
        )}
        
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center"><Award className="w-4 h-4 mr-2 text-brand" /> Il tuo Badge Collaboratore</h4>
          <p className="text-xs text-gray-500 mb-4">Formato A6 verticale — stampabile per porta-badge.</p>
          <canvas id="collab-badge-canvas" className="hidden" width="630" height="892" />
          <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-center min-h-[320px]">
            <img id="collab-badge-preview" alt="Clicca Genera per vedere l'anteprima" className="rounded-lg shadow-md" style={{ maxHeight: 320 }} />
          </div>
          <button onClick={() => {
            const canvas = document.getElementById('collab-badge-canvas') as HTMLCanvasElement;
            if (!canvas) return;
            const w = 630, ht = 892;
            canvas.width = w;
            canvas.height = ht;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const drawBadge = (avatarImg?: HTMLImageElement, logoImg?: HTMLImageElement) => {
              ctx.clearRect(0, 0, w, ht);

              // Sfondo bianco
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, w, ht);

              // Banda superiore blu petrolio
              ctx.fillStyle = '#0D414B';
              ctx.fillRect(0, 0, w, 8);

              // Logo centrato
              if (logoImg) {
                const lh = 48;
                const lw = logoImg.width * (lh / logoImg.height);
                ctx.drawImage(logoImg, (w - lw) / 2, 40, lw, lh);
              }

              // Linea turchese sotto logo
              ctx.strokeStyle = '#3DD9D0';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(160, 110);
              ctx.lineTo(w - 160, 110);
              ctx.stroke();

              // Titolo
              const isAgente = (collaborator as any)?.collaborator_type === 'agente';
              ctx.fillStyle = '#0D414B';
              ctx.textAlign = 'center';
              ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
              ctx.fillText(isAgente ? 'AGENTE UFFICIALE' : 'COLLABORATORE INDIPENDENTE', w / 2, 140);

              // Avatar grande
              const cx = w / 2, cy = 280, r = 90;
              // Cerchio bordo
              ctx.beginPath();
              ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
              ctx.fillStyle = '#0D414B';
              ctx.fill();
              // Cerchio interno turchese
              ctx.beginPath();
              ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
              ctx.fillStyle = '#3DD9D0';
              ctx.fill();

              if (avatarImg) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(avatarImg, cx - r, cy - r, r * 2, r * 2);
                ctx.restore();
              } else {
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fillStyle = '#E0F7F5';
                ctx.fill();
                ctx.fillStyle = '#0D414B';
                ctx.font = 'bold 56px system-ui, -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${collaborator!.first_name.charAt(0)}${collaborator!.last_name.charAt(0)}`, cx, cy);
                ctx.textBaseline = 'alphabetic';
              }

              // Nome grande
              ctx.fillStyle = '#0D414B';
              ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(collaborator!.first_name, w / 2, 420);
              ctx.fillText(collaborator!.last_name, w / 2, 458);

              // Badge livello
              ctx.fillStyle = '#6b7280';
              ctx.font = '16px system-ui, -apple-system, sans-serif';
              ctx.fillText(`${badge.emoji} ${badge.label}`, w / 2, 495);

              // Disclaimer per occasionale
              if (!isAgente) {
                ctx.fillStyle = '#6b7280';
                ctx.font = '10px system-ui, -apple-system, sans-serif';
                ctx.fillText('Attività di segnalazione occasionale.', w / 2, 525);
                ctx.fillText('Non dipendente né agente della piattaforma.', w / 2, 540);
              }

              // Separatore
              ctx.strokeStyle = '#3DD9D0';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(80, 565);
              ctx.lineTo(w - 80, 565);
              ctx.stroke();

              // Box codice invito
              ctx.fillStyle = '#F0FDFA';
              ctx.beginPath();
              ctx.roundRect(60, 585, w - 120, 100, 12);
              ctx.fill();
              ctx.strokeStyle = '#3DD9D0';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.roundRect(60, 585, w - 120, 100, 12);
              ctx.stroke();

              ctx.fillStyle = '#6b7280';
              ctx.font = '11px system-ui, -apple-system, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('CODICE INVITO PERSONALE', w / 2, 615);
              ctx.fillStyle = '#0D414B';
              ctx.font = 'bold 28px monospace';
              ctx.fillText(collaborator!.referral_code, w / 2, 655);

              // Link
              ctx.fillStyle = '#0D414B';
              ctx.font = '12px system-ui, -apple-system, sans-serif';
              ctx.fillText('renthubber.com/partner/' + collaborator!.referral_code, w / 2, 720);

              // Footer
              ctx.fillStyle = '#0D414B';
              ctx.font = '12px system-ui, -apple-system, sans-serif';
              ctx.fillText('Noleggio oggetti e spazi vicino a te', w / 2, 810);
              ctx.fillStyle = '#3DD9D0';
              ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
              ctx.fillText('renthubber.com', w / 2, 832);

              // Banda inferiore turchese
              ctx.fillStyle = '#3DD9D0';
              ctx.fillRect(0, ht - 8, w, 8);

              // Bordo esterno
              ctx.strokeStyle = '#e5e7eb';
              ctx.lineWidth = 1;
              ctx.strokeRect(0, 0, w, ht);

              // Mostra anteprima
              const preview = document.getElementById('collab-badge-preview') as HTMLImageElement;
              if (preview) preview.src = canvas.toDataURL('image/png');
            };

            // Carica logo e avatar
            let logoLoaded: HTMLImageElement | undefined;
            let avatarLoaded: HTMLImageElement | undefined;
            let loadCount = 0;
            const totalLoads = 2;
            const checkDone = () => { loadCount++; if (loadCount >= totalLoads) drawBadge(avatarLoaded, logoLoaded); };

            const logo = new Image();
            logo.crossOrigin = 'anonymous';
            logo.onload = () => { logoLoaded = logo; checkDone(); };
            logo.onerror = () => checkDone();
            logo.src = 'https://upyznglekmynztmydtxi.supabase.co/storage/v1/object/public/images/logo-renthubber.png.png';

            if ((collaborator as any)?.avatar_url) {
              const avatar = new Image();
              avatar.crossOrigin = 'anonymous';
              avatar.onload = () => { avatarLoaded = avatar; checkDone(); };
              avatar.onerror = () => checkDone();
              avatar.src = (collaborator as any).avatar_url;
            } else {
              checkDone();
            }
          }} className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg text-sm flex items-center justify-center">
            <Eye className="w-4 h-4 mr-2" /> Genera Anteprima
          </button>
          <button onClick={() => {
            const canvas = document.getElementById('collab-badge-canvas') as HTMLCanvasElement;
            if (!canvas || !canvas.toDataURL('image/png').includes('data:image')) { alert('Genera prima l\'anteprima!'); return; }
            const link = document.createElement('a');
            link.download = `badge-renthubber-${collaborator!.referral_code}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
          }} className="mt-2 w-full bg-brand hover:bg-brand-dark text-white font-medium py-2.5 rounded-lg text-sm flex items-center justify-center">
            <Award className="w-4 h-4 mr-2" /> Scarica Badge PNG
          </button>
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
};

// ============================================================
// HELPER COMPONENTS
// ============================================================
const KPICard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color: string }> = ({ icon, label, value, color }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600',
    brand: 'bg-brand/10 text-brand', purple: 'bg-purple-50 text-purple-600', amber: 'bg-amber-50 text-amber-600',
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
