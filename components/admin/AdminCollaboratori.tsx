// ============================================================
// RENTHUBBER - ADMIN COLLABORATORI
// Path: components/admin/AdminCollaboratori.tsx
// Gestione completa collaboratori dal pannello admin
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, UserPlus, Search, CheckCircle, XCircle, Clock, Euro,
  MapPin, Eye, ChevronDown, ChevronUp, Mail, Phone, Star,
  Award, TrendingUp, AlertTriangle, FileText, CreditCard,
  Loader2, RefreshCw, Check, X, Shield, Activity, Target,
  Building, Tag, Link2, Wallet, Receipt, Filter, MoreVertical,
  Plus, Trash2, Edit3, Zap
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

// Types
interface Collaborator {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  tax_id: string | null;
  bio: string | null;
  status: 'in_attesa' | 'approvato' | 'sospeso' | 'rifiutato';
  badge: string | null;
  referral_code: string;
  total_earnings: number;
  created_at: string;
}

interface CollabZone {
  id: string;
  collaborator_id: string;
  region: string;
  province: string | null;
  city: string | null;
  level: string;
  status: string;
  is_exclusive: boolean;
}

interface CollabLead {
  id: string;
  collaborator_id: string;
  zone_id: string;
  contact_name: string;
  business_name: string | null;
  status: string;
  lead_type: string | null;
  created_at: string;
}

interface CollabCommission {
  id: string;
  collaborator_id: string;
  lead_id: string | null;
  type: string;
  amount: number;
  status: 'maturata' | 'pagata' | 'annullata';
  paid_at: string | null;
  created_at: string;
}

type AdminTab = 'candidature' | 'attivi' | 'commissioni' | 'zone' | 'impostazioni';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  in_attesa: { label: 'In Attesa', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  approvato: { label: 'Approvato', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  sospeso: { label: 'Sospeso', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  rifiutato: { label: 'Rifiutato', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export const AdminCollaboratori: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('candidature');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [zones, setZones] = useState<CollabZone[]>([]);
  const [leads, setLeads] = useState<CollabLead[]>([]);
  const [commissions, setCommissions] = useState<CollabCommission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Available Zones
  const [availableZones, setAvailableZones] = useState<any[]>([]);
  const [showAddZoneForm, setShowAddZoneForm] = useState(false);
  const [editingZone, setEditingZone] = useState<any | null>(null);
  const [zoneForm, setZoneForm] = useState({ name: '', zone_level: 'city', region: '', province: '', city: '', max_collaborators: 5, description: '' });
  const [savingZone, setSavingZone] = useState(false);
  const [zoneSuggestionForm, setZoneSuggestionForm] = useState({ zone_id: '', category: '', priority: 'normale', note: '' });
  const [zoneSuggestions, setZoneSuggestions] = useState<any[]>([]);

  // Settings
  const [settings, setSettings] = useState({
    acquisition_bonus: 25,
    recurring_percentage: 10,
    recurring_months: 12,
    milestone_10: 100,
    milestone_25: 300,
    milestone_50: 750,
    min_payout: 50,
    payout_day: 15,
  });

  // ============================================================
  // DATA LOADING
  // ============================================================
  useEffect(() => { loadAllData(); }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [collabRes, zonesRes, leadsRes, commissionsRes, settingsRes, availZonesRes, suggestionsRes] = await Promise.all([
        supabase.from('collaborators').select('*').order('created_at', { ascending: false }),
        supabase.from('collaborator_zones').select('*'),
        supabase.from('collaborator_leads').select('*').order('created_at', { ascending: false }),
        supabase.from('collaborator_commissions').select('*').order('created_at', { ascending: false }),
        supabase.from('collaborator_settings').select('*').eq('id', '00000000-0000-0000-0000-000000000001').single(),
        supabase.from('collaborator_available_zones').select('*').order('region').order('province').order('city'),
        supabase.from('collaborator_zone_suggestions').select('*'),
      ]);
      setCollaborators(collabRes.data || []);
      setZones(zonesRes.data || []);
      setLeads(leadsRes.data || []);
      setCommissions(commissionsRes.data || []);
      setAvailableZones(availZonesRes.data || []);
      setZoneSuggestions(suggestionsRes.data || []);
      if (settingsRes.data) {
        setSettings({
          acquisition_bonus: settingsRes.data.acquisition_bonus_amount || 25,
          recurring_percentage: settingsRes.data.recurring_commission_pct || 10,
          recurring_months: settingsRes.data.recurring_duration_months || 12,
          milestone_10: settingsRes.data.milestone_10_bonus || 100,
          milestone_25: settingsRes.data.milestone_25_bonus || 300,
          milestone_50: settingsRes.data.milestone_50_bonus || 750,
          min_payout: settingsRes.data.min_payout || 50,
          payout_day: settingsRes.data.payout_day || 15,
        });
      }
    } catch (err) { console.error('Errore caricamento:', err); }
    finally { setIsLoading(false); }
  };

  // ============================================================
  // COMPUTED
  // ============================================================
  const kpi = useMemo(() => {
    const pending = collaborators.filter(c => c.status === 'in_attesa').length;
    const active = collaborators.filter(c => c.status === 'approvato').length;
    const totalLeads = leads.length;
    const activeHubbers = leads.filter(l => l.status === 'attivo').length;
    const totalCommissions = commissions.reduce((s, c) => c.status !== 'annullata' ? s + Number(c.amount) : s, 0);
    const pendingPayments = commissions.filter(c => c.status === 'maturata').reduce((s, c) => s + Number(c.amount), 0);
    return { pending, active, totalLeads, activeHubbers, totalCommissions, pendingPayments };
  }, [collaborators, leads, commissions]);

  const filteredCollaborators = useMemo(() => {
    let result = [...collaborators];
    if (activeTab === 'candidature') result = result.filter(c => c.status === 'in_attesa');
    else if (activeTab === 'attivi') result = result.filter(c => c.status !== 'in_attesa');
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.first_name.toLowerCase().includes(q) || c.last_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) || c.referral_code.toLowerCase().includes(q)
      );
    }
    return result;
  }, [collaborators, activeTab, searchQuery]);

  const groupedCommissions = useMemo(() => {
    const map: Record<string, { collab: Collaborator; commissions: CollabCommission[]; pending: number; total: number }> = {};
    collaborators.filter(c => c.status === 'approvato').forEach(c => {
      const cc = commissions.filter(x => x.collaborator_id === c.id);
      const pending = cc.filter(x => x.status === 'maturata').reduce((s, x) => s + Number(x.amount), 0);
      const total = cc.filter(x => x.status !== 'annullata').reduce((s, x) => s + Number(x.amount), 0);
      if (cc.length > 0 || pending > 0) map[c.id] = { collab: c, commissions: cc, pending, total };
    });
    return Object.values(map).sort((a, b) => b.pending - a.pending);
  }, [collaborators, commissions]);

  const allZonesData = useMemo(() => {
    return zones.map(z => {
      const collab = collaborators.find(c => c.id === z.collaborator_id);
      const zoneLeads = leads.filter(l => l.zone_id === z.id);
      return { ...z, collab, leadsCount: zoneLeads.length, activeCount: zoneLeads.filter(l => l.status === 'attivo').length };
    }).sort((a, b) => {
      if (a.status === 'richiesta' && b.status !== 'richiesta') return -1;
      if (a.status !== 'richiesta' && b.status === 'richiesta') return 1;
      return 0;
    });
  }, [zones, collaborators, leads]);

  // ============================================================
  // ACTIONS
  // ============================================================
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setActionLoading(id);
    try {
      const { error } = await supabase.from('collaborators').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      setCollaborators(prev => prev.map(c => c.id === id ? { ...c, status: newStatus as any } : c));
      // Se approvato, approva anche le zone in attesa
      if (newStatus === 'approvato') {
        await supabase.from('collaborator_zones').update({ status: 'approvata' }).eq('collaborator_id', id).eq('status', 'richiesta');
        setZones(prev => prev.map(z => z.collaborator_id === id && z.status === 'richiesta' ? { ...z, status: 'approvata' } : z));
      }
    } catch (err) { console.error(err); alert('Errore aggiornamento.'); }
    finally { setActionLoading(null); }
  };

  const handleUpdateZoneStatus = async (zoneId: string, newStatus: string) => {
    setActionLoading(zoneId);
    try {
      const { error } = await supabase.from('collaborator_zones').update({ status: newStatus }).eq('id', zoneId);
      if (error) throw error;
      setZones(prev => prev.map(z => z.id === zoneId ? { ...z, status: newStatus } : z));
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  const handleToggleExclusive = async (zoneId: string, current: boolean) => {
    try {
      const { error } = await supabase.from('collaborator_zones').update({ is_exclusive: !current }).eq('id', zoneId);
      if (error) throw error;
      setZones(prev => prev.map(z => z.id === zoneId ? { ...z, is_exclusive: !current } : z));
    } catch (err) { console.error(err); }
  };

  const handlePayCommission = async (commissionId: string) => {
    setActionLoading(commissionId);
    try {
      const { error } = await supabase.from('collaborator_commissions')
        .update({ status: 'pagata', paid_at: new Date().toISOString() })
        .eq('id', commissionId);
      if (error) throw error;
      setCommissions(prev => prev.map(c => c.id === commissionId ? { ...c, status: 'pagata', paid_at: new Date().toISOString() } : c));
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  const handlePayAllPending = async (collaboratorId: string) => {
    setActionLoading(collaboratorId);
    try {
      const { error } = await supabase.from('collaborator_commissions')
        .update({ status: 'pagata', paid_at: new Date().toISOString() })
        .eq('collaborator_id', collaboratorId)
        .eq('status', 'maturata');
      if (error) throw error;
      setCommissions(prev => prev.map(c =>
        c.collaborator_id === collaboratorId && c.status === 'maturata'
          ? { ...c, status: 'pagata', paid_at: new Date().toISOString() } : c
      ));
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

 // AVAILABLE ZONES MANAGEMENT
  const handleSaveAvailableZone = async () => {
    if (!zoneForm.name || !zoneForm.region) return;
    setSavingZone(true);
    try {
      if (editingZone) {
        const { data, error } = await supabase.from('collaborator_available_zones')
          .update({ name: zoneForm.name, zone_level: zoneForm.zone_level, region: zoneForm.region, province: zoneForm.province || null, city: zoneForm.city || null, max_collaborators: zoneForm.max_collaborators, description: zoneForm.description || null, updated_at: new Date().toISOString() })
          .eq('id', editingZone.id).select('*').single();
        if (error) throw error;
        setAvailableZones(prev => prev.map(z => z.id === editingZone.id ? data : z));
      } else {
        const { data, error } = await supabase.from('collaborator_available_zones')
          .insert({ name: zoneForm.name, zone_level: zoneForm.zone_level, region: zoneForm.region, province: zoneForm.province || null, city: zoneForm.city || null, max_collaborators: zoneForm.max_collaborators, description: zoneForm.description || null })
          .select('*').single();
        if (error) throw error;
        setAvailableZones(prev => [...prev, data]);
      }
      setZoneForm({ name: '', zone_level: 'city', region: '', province: '', city: '', max_collaborators: 5, description: '' });
      setShowAddZoneForm(false);
      setEditingZone(null);
    } catch (err) { console.error(err); alert('Errore salvataggio zona.'); }
    finally { setSavingZone(false); }
  };

  const handleToggleAvailableZone = async (zoneId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase.from('collaborator_available_zones').update({ is_active: !currentActive }).eq('id', zoneId);
      if (error) throw error;
      setAvailableZones(prev => prev.map(z => z.id === zoneId ? { ...z, is_active: !currentActive } : z));
    } catch (err) { console.error(err); }
  };

  const handleDeleteAvailableZone = async (zoneId: string) => {
    if (!confirm('Eliminare questa zona disponibile?')) return;
    try {
      const { error } = await supabase.from('collaborator_available_zones').delete().eq('id', zoneId);
      if (error) throw error;
      setAvailableZones(prev => prev.filter(z => z.id !== zoneId));
    } catch (err) { console.error(err); alert('Errore eliminazione.'); }
  };

  const handleEditAvailableZone = (zone: any) => {
    setEditingZone(zone);
    setZoneForm({ name: zone.name, zone_level: zone.zone_level || 'city', region: zone.region, province: zone.province || '', city: zone.city || '', max_collaborators: zone.max_collaborators || 5, description: zone.description || '' });
    setShowAddZoneForm(true);
  };

  const handleAddZoneSuggestion = async () => {
    if (!zoneSuggestionForm.zone_id || !zoneSuggestionForm.category) return;
    try {
      const { data, error } = await supabase.from('collaborator_zone_suggestions')
        .insert({ zone_id: zoneSuggestionForm.zone_id, category: zoneSuggestionForm.category.trim(), priority: zoneSuggestionForm.priority, note: zoneSuggestionForm.note.trim() || null })
        .select('*').single();
      if (error) throw error;
      setZoneSuggestions(prev => [...prev, data]);
      setZoneSuggestionForm({ zone_id: zoneSuggestionForm.zone_id, category: '', priority: 'normale', note: '' });
    } catch (err) { console.error(err); alert('Errore aggiunta suggerimento.'); }
  };

  const handleDeleteZoneSuggestion = async (id: string) => {
    const { error } = await supabase.from('collaborator_zone_suggestions').delete().eq('id', id);
    if (!error) setZoneSuggestions(prev => prev.filter(s => s.id !== id));
  };

  const handleSaveSettings = async () => {
    setActionLoading('settings');
    try {
      const { error } = await supabase.from('collaborator_settings').upsert({
        id: '00000000-0000-0000-0000-000000000001',
        acquisition_bonus_amount: settings.acquisition_bonus,
        recurring_commission_pct: settings.recurring_percentage,
        recurring_duration_months: settings.recurring_months,
        milestone_10_bonus: settings.milestone_10,
        milestone_25_bonus: settings.milestone_25,
        milestone_50_bonus: settings.milestone_50,
        min_payout: settings.min_payout,
        payout_day: settings.payout_day,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      alert('Impostazioni salvate!');
    } catch (err) { console.error(err); alert('Errore salvataggio.'); }
    finally { setActionLoading(null); }
  };

  // ============================================================
  // RENDER
  // ============================================================
  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Candidature</p>
          <p className="text-2xl font-bold text-amber-600">{kpi.pending}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Collaboratori Attivi</p>
          <p className="text-2xl font-bold text-green-600">{kpi.active}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Lead Totali</p>
          <p className="text-2xl font-bold text-blue-600">{kpi.totalLeads}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Hubber Attivi</p>
          <p className="text-2xl font-bold text-purple-600">{kpi.activeHubbers}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Commissioni Totali</p>
          <p className="text-2xl font-bold text-gray-900">€{kpi.totalCommissions.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Da Pagare</p>
          <p className="text-2xl font-bold text-red-600">€{kpi.pendingPayments.toFixed(2)}</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {([
            { id: 'candidature' as AdminTab, label: `Candidature (${kpi.pending})`, icon: <Clock className="w-4 h-4" /> },
            { id: 'attivi' as AdminTab, label: 'Collaboratori', icon: <Users className="w-4 h-4" /> },
            { id: 'commissioni' as AdminTab, label: 'Commissioni', icon: <Euro className="w-4 h-4" /> },
            { id: 'zone' as AdminTab, label: 'Zone', icon: <MapPin className="w-4 h-4" /> },
            { id: 'impostazioni' as AdminTab, label: 'Impostazioni', icon: <Shield className="w-4 h-4" /> },
          ]).map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              {t.icon}<span>{t.label}</span>
            </button>
          ))}
        </div>
        <button onClick={loadAllData} className="text-gray-400 hover:text-blue-600"><RefreshCw className="w-5 h-5" /></button>
      </div>

      {/* SEARCH (for candidature & attivi) */}
      {(activeTab === 'candidature' || activeTab === 'attivi') && (
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Cerca per nome, email, codice referral..." className="pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full max-w-md"
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      )}

      {/* CONTENT */}
      {activeTab === 'candidature' && renderCollaboratorList()}
      {activeTab === 'attivi' && renderCollaboratorList()}
      {activeTab === 'commissioni' && renderCommissions()}
      {activeTab === 'zone' && renderZones()}
      {activeTab === 'impostazioni' && renderSettings()}
    </div>
  );

  // ============================================================
  // COLLABORATOR LIST (candidature + attivi)
  // ============================================================
  function renderCollaboratorList() {
    if (filteredCollaborators.length === 0) {
      return (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{activeTab === 'candidature' ? 'Nessuna candidatura in attesa' : 'Nessun collaboratore trovato'}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {filteredCollaborators.map(collab => {
          const st = STATUS_CONFIG[collab.status];
          const collabZones = zones.filter(z => z.collaborator_id === collab.id);
          const collabLeads = leads.filter(l => l.collaborator_id === collab.id);
          const collabCommissions = commissions.filter(c => c.collaborator_id === collab.id);
          const totalEarnings = collabCommissions.filter(c => c.status !== 'annullata').reduce((s, c) => s + Number(c.amount), 0);
          const pendingPay = collabCommissions.filter(c => c.status === 'maturata').reduce((s, c) => s + Number(c.amount), 0);
          const activeHubbers = collabLeads.filter(l => l.status === 'attivo').length;
          const isExpanded = expandedId === collab.id;

          return (
            <div key={collab.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpandedId(isExpanded ? null : collab.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                      {collab.first_name.charAt(0)}{collab.last_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-900">{collab.first_name} {collab.last_name}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${st.bg} ${st.color}`}>{st.label}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center"><Mail className="w-3 h-3 mr-1" />{collab.email}</span>
                        {collab.phone && <span className="flex items-center"><Phone className="w-3 h-3 mr-1" />{collab.phone}</span>}
                        <span className="flex items-center"><Link2 className="w-3 h-3 mr-1" />{collab.referral_code}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {collab.status === 'approvato' && (
                      <div className="hidden sm:flex items-center space-x-4 text-sm">
                        <span className="text-gray-500">{collabLeads.length} lead</span>
                        <span className="text-green-600 font-medium">{activeHubbers} attivi</span>
                        <span className="font-bold text-gray-900">€{totalEarnings.toFixed(2)}</span>
                        {pendingPay > 0 && <span className="text-amber-600 font-medium">€{pendingPay.toFixed(2)} da pagare</span>}
                      </div>
                    )}
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </div>
              </div>

              {/* Expanded */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Info */}
                    <div className="space-y-3">
                      <h5 className="font-semibold text-gray-900 text-sm">Informazioni</h5>
                      <div className="bg-white rounded-lg p-3 text-sm space-y-2">
                        <p className="text-gray-600">Registrato: <strong>{new Date(collab.created_at).toLocaleDateString('it-IT')}</strong></p>
                        {collab.tax_id && <p className="text-gray-600">P.IVA/CF: <strong>{collab.tax_id}</strong></p>}
                        {collab.bio && <p className="text-gray-600 italic">"{collab.bio}"</p>}
                        <div className="pt-2 border-t border-gray-100">
                          <p className="text-xs font-medium text-gray-500 mb-1">Zone:</p>
                          {collabZones.length === 0 ? <p className="text-xs text-gray-400">Nessuna zona</p> : (
                            <div className="flex flex-wrap gap-1">
                              {collabZones.map(z => (
                                <span key={z.id} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${z.status === 'approvata' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                                  {z.city || z.province || z.region}
                                  {z.is_exclusive && <Star className="w-3 h-3 ml-1 text-yellow-500" />}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Lead summary */}
                    <div className="space-y-3">
                      <h5 className="font-semibold text-gray-900 text-sm">Lead ({collabLeads.length})</h5>
                      <div className="bg-white rounded-lg p-3 text-sm space-y-1 max-h-48 overflow-y-auto">
                        {collabLeads.length === 0 ? <p className="text-gray-400 text-xs">Nessun lead</p> : (
                          collabLeads.slice(0, 10).map(l => (
                            <div key={l.id} className="flex items-center justify-between py-1">
                              <span className="text-gray-700">{l.contact_name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                                l.status === 'attivo' ? 'bg-green-50 border-green-200 text-green-700' :
                                l.status === 'registrato' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                                l.status === 'perso' ? 'bg-red-50 border-red-200 text-red-700' :
                                'bg-gray-50 border-gray-200 text-gray-700'
                              }`}>{l.status}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Earnings summary */}
                    <div className="space-y-3">
                      <h5 className="font-semibold text-gray-900 text-sm">Guadagni</h5>
                      <div className="bg-white rounded-lg p-3 text-sm space-y-2">
                        <div className="flex justify-between"><span className="text-gray-600">Totale maturato</span><span className="font-bold">€{totalEarnings.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Da pagare</span><span className="font-bold text-amber-600">€{pendingPay.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Già pagato</span><span className="font-bold text-green-600">€{(totalEarnings - pendingPay).toFixed(2)}</span></div>
                        {pendingPay > 0 && (
                          <button onClick={(e) => { e.stopPropagation(); handlePayAllPending(collab.id); }}
                            disabled={actionLoading === collab.id}
                            className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-2 rounded-lg flex items-center justify-center disabled:opacity-50">
                            {actionLoading === collab.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CreditCard className="w-3 h-3 mr-1" />}
                            Segna tutto come pagato
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                    {collab.status === 'in_attesa' && (
                      <>
                        <button onClick={() => handleUpdateStatus(collab.id, 'approvato')} disabled={actionLoading === collab.id}
                          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center disabled:opacity-50">
                          {actionLoading === collab.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />} Approva
                        </button>
                        <button onClick={() => handleUpdateStatus(collab.id, 'rifiutato')} disabled={actionLoading === collab.id}
                          className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center disabled:opacity-50">
                          <XCircle className="w-4 h-4 mr-1" /> Rifiuta
                        </button>
                      </>
                    )}
                    {collab.status === 'approvato' && (
                      <button onClick={() => handleUpdateStatus(collab.id, 'sospeso')} disabled={actionLoading === collab.id}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center disabled:opacity-50">
                        <AlertTriangle className="w-4 h-4 mr-1" /> Sospendi
                      </button>
                    )}
                    {collab.status === 'sospeso' && (
                      <button onClick={() => handleUpdateStatus(collab.id, 'approvato')} disabled={actionLoading === collab.id}
                        className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center disabled:opacity-50">
                        <CheckCircle className="w-4 h-4 mr-1" /> Riattiva
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
  // ============================================================
  // COMMISSIONI
  // ============================================================
  function renderCommissions() {

    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-6">
          <div><p className="text-xs text-gray-500">Totale Commissioni</p><p className="text-xl font-bold">€{kpi.totalCommissions.toFixed(2)}</p></div>
          <div><p className="text-xs text-gray-500">Da Pagare</p><p className="text-xl font-bold text-amber-600">€{kpi.pendingPayments.toFixed(2)}</p></div>
          <div><p className="text-xs text-gray-500">Commissioni</p><p className="text-xl font-bold text-gray-600">{commissions.length}</p></div>
        </div>

        {groupedCommissions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <Euro className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nessuna commissione ancora</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groupedCommissions.map(({ collab, commissions: cc, pending, total }) => (
              <div key={collab.id} className="bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedId(expandedId === `comm-${collab.id}` ? null : `comm-${collab.id}`)}>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                      {collab.first_name.charAt(0)}{collab.last_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{collab.first_name} {collab.last_name}</p>
                      <p className="text-xs text-gray-500">{cc.length} commissioni</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-bold">€{total.toFixed(2)}</p>
                      {pending > 0 && <p className="text-xs text-amber-600 font-medium">€{pending.toFixed(2)} da pagare</p>}
                    </div>
                    {pending > 0 && (
                      <button onClick={(e) => { e.stopPropagation(); handlePayAllPending(collab.id); }}
                        disabled={actionLoading === collab.id}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center disabled:opacity-50">
                        {actionLoading === collab.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />} Paga tutto
                      </button>
                    )}
                    {expandedId === `comm-${collab.id}` ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {expandedId === `comm-${collab.id}` && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {cc.map(c => {
                      const lead = leads.find(l => l.id === c.lead_id);
                      return (
                        <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-900">
                              {c.type === 'acquisition_bonus' ? '🎯 Bonus' : c.type === 'recurring' ? '🔄 Ricorrente' : '🏆 Milestone'}
                              {lead && <span className="text-gray-500 ml-2">— {lead.contact_name}</span>}
                            </p>
                            <p className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString('it-IT')}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <p className="font-bold text-sm">€{Number(c.amount).toFixed(2)}</p>
                            {c.status === 'maturata' ? (
                              <button onClick={() => handlePayCommission(c.id)} disabled={actionLoading === c.id}
                                className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full hover:bg-green-50 hover:text-green-700 hover:border-green-200 font-medium disabled:opacity-50">
                                {actionLoading === c.id ? '...' : '⏳ Da pagare'}
                              </button>
                            ) : c.status === 'pagata' ? (
                              <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">✓ Pagata</span>
                            ) : (
                              <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-medium">✗ Annullata</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
  // ZONE
  // ============================================================
  function renderZones() {
    const pendingZones = allZonesData.filter(z => z.status === 'richiesta');

    return (
      <div className="space-y-6">

        {/* ========== ZONE DISPONIBILI (CATALOGO ADMIN) ========== */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center"><Zap className="w-5 h-5 mr-2 text-blue-600" /> Zone Disponibili</h3>
              <p className="text-xs text-gray-500 mt-0.5">Zone che i collaboratori possono richiedere. Gestisci l'espansione di RentHubber da qui.</p>
            </div>
            <button onClick={() => { setEditingZone(null); setZoneForm({ name: '', zone_level: 'city', region: '', province: '', city: '', max_collaborators: 5, description: '' }); setShowAddZoneForm(!showAddZoneForm); }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center">
              <Plus className="w-4 h-4 mr-1" /> Aggiungi Zona
            </button>
          </div>

          {/* Form aggiungi/modifica zona */}
          {showAddZoneForm && (
            <div className="p-5 bg-blue-50/50 border-b border-gray-100">
              <h4 className="font-semibold text-gray-900 text-sm mb-3">{editingZone ? 'Modifica Zona' : 'Nuova Zona Disponibile'}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nome Zona *</label>
                  <input type="text" placeholder="Es. Messina Centro" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={zoneForm.name} onChange={e => setZoneForm({ ...zoneForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Regione *</label>
                  <input type="text" placeholder="Es. Sicilia" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={zoneForm.region} onChange={e => setZoneForm({ ...zoneForm, region: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Provincia</label>
                  <input type="text" placeholder="Es. ME" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={zoneForm.province} onChange={e => setZoneForm({ ...zoneForm, province: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Città</label>
                  <input type="text" placeholder="Es. Messina" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={zoneForm.city} onChange={e => setZoneForm({ ...zoneForm, city: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Livello</label>
                  <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={zoneForm.zone_level} onChange={e => setZoneForm({ ...zoneForm, zone_level: e.target.value })}>
                    <option value="city">Città</option>
                    <option value="province">Provincia</option>
                    <option value="region">Regione</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Max Collaboratori</label>
                  <input type="number" min={1} max={50} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={zoneForm.max_collaborators} onChange={e => setZoneForm({ ...zoneForm, max_collaborators: Number(e.target.value) })} />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Descrizione (opzionale)</label>
                  <input type="text" placeholder="Note sulla zona..." className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={zoneForm.description} onChange={e => setZoneForm({ ...zoneForm, description: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button onClick={() => { setShowAddZoneForm(false); setEditingZone(null); }} className="px-4 py-2 text-sm text-gray-600">Annulla</button>
                <button onClick={handleSaveAvailableZone} disabled={savingZone || !zoneForm.name || !zoneForm.region}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm disabled:opacity-50 flex items-center">
                  {savingZone ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                  {editingZone ? 'Aggiorna' : 'Salva'}
                </button>
              </div>
            </div>
          )}

          {/* Lista zone disponibili */}
          {availableZones.length === 0 ? (
            <div className="p-8 text-center">
              <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Nessuna zona disponibile. Aggiungi la prima!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {availableZones.map(az => {
                const currentCount = zones.filter(z => z.status === 'approvata' && z.region === az.region && (!az.province || z.province === az.province) && (!az.city || z.city === az.city)).length;
                const suggestions = zoneSuggestions.filter(s => s.zone_id === az.id);
                return (
                  <div key={az.id} className={`px-5 py-4 ${!az.is_active ? 'opacity-50 bg-gray-50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 text-sm">{az.name}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${az.is_active ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                            {az.is_active ? 'Attiva' : 'Disattivata'}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{az.zone_level}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{[az.city, az.province, az.region].filter(Boolean).join(', ')}</p>
                        {az.description && <p className="text-xs text-gray-400 mt-0.5 italic">{az.description}</p>}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-gray-500">
                            <Users className="w-3 h-3 inline mr-1" />{currentCount}/{az.max_collaborators} collaboratori
                          </span>
                          {suggestions.length > 0 && (
                            <div className="flex gap-1">
                              {suggestions.map(s => (
                                <span key={s.id} className="inline-flex items-center text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
                                  {s.category}
                                  <button onClick={() => handleDeleteZoneSuggestion(s.id)} className="ml-1 text-blue-400 hover:text-red-500"><X className="w-2.5 h-2.5" /></button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => handleEditAvailableZone(az)} className="text-gray-400 hover:text-blue-600 p-1"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => handleToggleAvailableZone(az.id, az.is_active)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium ${az.is_active ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                          {az.is_active ? 'Disattiva' : 'Attiva'}
                        </button>
                        <button onClick={() => handleDeleteAvailableZone(az.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>

                    {/* Aggiungi suggerimento tipologia */}
                    <div className="mt-2 flex gap-2 items-center">
                      <input type="text" placeholder="Aggiungi tipologia consigliata..." className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none flex-1 max-w-xs"
                        value={zoneSuggestionForm.zone_id === az.id ? zoneSuggestionForm.category : ''} 
                        onChange={e => setZoneSuggestionForm({ ...zoneSuggestionForm, zone_id: az.id, category: e.target.value })}
                        onKeyDown={e => { if (e.key === 'Enter' && zoneSuggestionForm.category.trim()) handleAddZoneSuggestion(); }} />
                      <select className="px-2 py-1 rounded-lg border border-gray-200 text-xs outline-none"
                        value={zoneSuggestionForm.zone_id === az.id ? zoneSuggestionForm.priority : 'normale'}
                        onChange={e => setZoneSuggestionForm({ ...zoneSuggestionForm, zone_id: az.id, priority: e.target.value })}>
                        <option value="alta">🔴 Alta</option>
                        <option value="normale">🔵 Normale</option>
                        <option value="bassa">⚪ Bassa</option>
                      </select>
                      <button onClick={() => { if (zoneSuggestionForm.zone_id === az.id && zoneSuggestionForm.category.trim()) handleAddZoneSuggestion(); else setZoneSuggestionForm({ ...zoneSuggestionForm, zone_id: az.id }); }}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded-lg text-xs font-medium">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========== ZONE ASSEGNATE AI COLLABORATORI ========== */}
        {pendingZones.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h4 className="font-semibold text-amber-900 text-sm mb-3 flex items-center">
              <Clock className="w-4 h-4 mr-2" /> Zone in Attesa di Approvazione ({pendingZones.length})
            </h4>
            <div className="space-y-2">
              {pendingZones.map(z => (
                <div key={z.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      {z.city && `${z.city}, `}{z.province && `${z.province}, `}{z.region}
                    </p>
                    <p className="text-xs text-gray-500">{z.collab ? `${z.collab.first_name} ${z.collab.last_name}` : 'N/A'} · {z.level}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => handleUpdateZoneStatus(z.id, 'approvata')} disabled={actionLoading === z.id}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center disabled:opacity-50">
                      {actionLoading === z.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />} Approva
                    </button>
                    <button onClick={() => handleUpdateZoneStatus(z.id, 'rifiutata')} disabled={actionLoading === z.id}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center disabled:opacity-50">
                      <X className="w-3 h-3 mr-1" /> Rifiuta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 flex items-center"><MapPin className="w-5 h-5 mr-2 text-blue-600" /> Zone Assegnate</h3>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase">
            <div className="col-span-3">Zona</div>
            <div className="col-span-2">Collaboratore</div>
            <div className="col-span-1">Livello</div>
            <div className="col-span-1">Stato</div>
            <div className="col-span-1">Esclusiva</div>
            <div className="col-span-1">Lead</div>
            <div className="col-span-1">Attivi</div>
            <div className="col-span-2">Azioni</div>
          </div>
          {allZonesData.filter(z => z.status !== 'richiesta').length === 0 ? (
            <div className="p-8 text-center text-gray-400"><p className="text-sm">Nessuna zona assegnata</p></div>
          ) : (
            allZonesData.filter(z => z.status !== 'richiesta').map(z => (
              <div key={z.id} className="px-4 py-3 grid grid-cols-12 gap-4 items-center border-b border-gray-50 text-sm hover:bg-gray-50">
                <div className="col-span-3 font-medium text-gray-900">{z.city && `${z.city}, `}{z.province && `${z.province}, `}{z.region}</div>
                <div className="col-span-2 text-gray-600">{z.collab ? `${z.collab.first_name} ${z.collab.last_name}` : 'N/A'}</div>
                <div className="col-span-1"><span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{z.level}</span></div>
                <div className="col-span-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${z.status === 'approvata' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {z.status}
                  </span>
                </div>
                <div className="col-span-1">
                  <button onClick={() => handleToggleExclusive(z.id, z.is_exclusive)}
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium transition-colors ${z.is_exclusive ? 'bg-yellow-50 border-yellow-300 text-yellow-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-yellow-50'}`}>
                    {z.is_exclusive ? '⭐ Sì' : 'No'}
                  </button>
                </div>
                <div className="col-span-1 text-gray-600">{z.leadsCount}</div>
                <div className="col-span-1 text-green-600 font-medium">{z.activeCount}</div>
                <div className="col-span-2">
                  {z.status === 'approvata' ? (
                    <button onClick={() => handleUpdateZoneStatus(z.id, 'rifiutata')} className="text-xs text-red-600 hover:underline">Revoca</button>
                  ) : (
                    <button onClick={() => handleUpdateZoneStatus(z.id, 'approvata')} className="text-xs text-green-600 hover:underline">Riattiva</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // IMPOSTAZIONI
  // ============================================================
  function renderSettings() {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center"><Euro className="w-5 h-5 mr-2 text-blue-600" /> Commissioni</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bonus Acquisizione (€)</label>
              <input type="number" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={settings.acquisition_bonus} onChange={e => setSettings({ ...settings, acquisition_bonus: Number(e.target.value) })} />
              <p className="text-xs text-gray-400 mt-1">Una tantum per Hubber attivo</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Commissione Ricorrente (%)</label>
              <input type="number" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={settings.recurring_percentage} onChange={e => setSettings({ ...settings, recurring_percentage: Number(e.target.value) })} />
              <p className="text-xs text-gray-400 mt-1">% sulle commissioni RH</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Durata Ricorrente (mesi)</label>
              <input type="number" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={settings.recurring_months} onChange={e => setSettings({ ...settings, recurring_months: Number(e.target.value) })} />
              <p className="text-xs text-gray-400 mt-1">Mesi di commissione ricorrente</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center"><Award className="w-5 h-5 mr-2 text-blue-600" /> Bonus Milestone</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">10 Hubber Attivi (€)</label>
              <input type="number" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={settings.milestone_10} onChange={e => setSettings({ ...settings, milestone_10: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">25 Hubber Attivi (€)</label>
              <input type="number" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={settings.milestone_25} onChange={e => setSettings({ ...settings, milestone_25: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">50 Hubber Attivi (€)</label>
              <input type="number" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={settings.milestone_50} onChange={e => setSettings({ ...settings, milestone_50: Number(e.target.value) })} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center"><CreditCard className="w-5 h-5 mr-2 text-blue-600" /> Pagamenti</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Payout Minimo (€)</label>
              <input type="number" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={settings.min_payout} onChange={e => setSettings({ ...settings, min_payout: Number(e.target.value) })} />
              <p className="text-xs text-gray-400 mt-1">Importo minimo per pagamento</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Giorno Pagamento</label>
              <input type="number" min={1} max={28} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={settings.payout_day} onChange={e => setSettings({ ...settings, payout_day: Number(e.target.value) })} />
              <p className="text-xs text-gray-400 mt-1">Giorno del mese per i pagamenti</p>
            </div>
          </div>
        </div>

        <button onClick={handleSaveSettings} disabled={actionLoading === 'settings'}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg flex items-center disabled:opacity-50">
          {actionLoading === 'settings' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
          Salva Impostazioni
        </button>
      </div>
    );
  }
};
