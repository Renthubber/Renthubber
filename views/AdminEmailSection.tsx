import React, { useState, useEffect } from 'react';
import {
  Mail, Send, FileText, Clock, History, Settings, Search,
  Plus, Edit, Trash2, Eye, EyeOff, Save, X, ChevronRight,
  Users, User, Star, Calendar, CheckCircle, XCircle, AlertCircle,
  RefreshCw, Filter, Download, Upload, Copy, MoreVertical
} from 'lucide-react';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';

interface AdminEmailSectionProps {
  allUsers: any[];
  currentUser: any;
}

export const AdminEmailSection: React.FC<AdminEmailSectionProps> = ({
  allUsers,
  currentUser
}) => {
  // ========== STATI ==========
  const [activeSubTab, setActiveSubTab] = useState<'send' | 'templates' | 'campaigns' | 'queue' | 'logs' | 'settings'>('send');
  
  // Dati dal DB
  const [templates, setTemplates] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  
  // Stati UI
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Invio email
  const [recipientType, setRecipientType] = useState<'single' | 'group'>('single');
  const [singleRecipient, setSingleRecipient] = useState('');
  const [groupFilter, setGroupFilter] = useState<'all' | 'renters' | 'hubbers' | 'superhubbers'>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [sending, setSending] = useState(false);
  
  // Modali
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  
  // Form template
  const [templateForm, setTemplateForm] = useState({
    name: '',
    slug: '',
    subject: '',
    body_html: '',
    body_text: '',
    category: 'transactional',
    trigger_event: '',
    email_type: 'transactional',
    is_disableable: true,
    is_active: true
  });
  
  // Form account SMTP
  const [accountForm, setAccountForm] = useState({
    name: '',
    email: '',
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    smtp_secure: true,
    is_default: false,
    category: 'general',
    is_active: true
  });

  // ========== CARICAMENTO DATI ==========
  useEffect(() => {
    loadData();
  }, [activeSubTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carica sempre templates e accounts
      const { data: templatesData } = await supabase
        .from('email_templates')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      setTemplates(templatesData || []);

      const { data: accountsData } = await supabase
        .from('email_accounts')
        .select('*')
        .order('is_default', { ascending: false });
      setAccounts(accountsData || []);

      if (activeSubTab === 'campaigns') {
        const { data: campaignsData } = await supabase
          .from('email_campaigns')
          .select('*')
          .order('created_at', { ascending: false });
        setCampaigns(campaignsData || []);
      }

      if (activeSubTab === 'queue') {
        const { data: queueData } = await supabase
          .from('email_queue')
          .select('*')
          .in('status', ['pending', 'scheduled'])
          .order('scheduled_at', { ascending: true })
          .limit(100);
        setQueue(queueData || []);
      }

      if (activeSubTab === 'logs') {
        const { data: logsData } = await supabase
          .from('email_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);
        setLogs(logsData || []);
      }
    } catch (error) {
      console.error('Errore caricamento dati email:', error);
    } finally {
      setLoading(false);
    }
  };

  // ========== HANDLERS ==========
  const handleSelectTemplate = (template: any) => {
  setSelectedTemplateId(template.id);
  setEmailSubject(template.subject);
  setEmailBody(template.body_html);
  
  // Auto-selezione account in base alla categoria del template
  const templateCategory = template.category;
  
  // Mappa categoria template -> categoria account
  const categoryMap: Record<string, string[]> = {
    'security': ['transactional', 'general'],
    'transactional': ['transactional', 'general'],
    'notification': ['transactional', 'general'],
    'marketing': ['marketing', 'general']
  };
  
  const preferredCategories = categoryMap[templateCategory] || ['general'];
  
  // Cerca account attivo con categoria corrispondente
  let matchedAccount = null;
  for (const cat of preferredCategories) {
    matchedAccount = accounts.find(a => a.is_active && a.category === cat);
    if (matchedAccount) break;
  }
  
  // Fallback: account default o primo attivo
  if (!matchedAccount) {
    matchedAccount = accounts.find(a => a.is_active && a.is_default) 
                  || accounts.find(a => a.is_active);
  }
  
  if (matchedAccount) {
    setSelectedAccountId(matchedAccount.id);
  }
};

  const handleSendEmail = async () => {
    if (!emailSubject || !emailBody) {
      alert('Inserisci oggetto e contenuto email');
      return;
    }

    if (recipientType === 'single' && !singleRecipient) {
      alert('Inserisci un destinatario');
      return;
    }

    setSending(true);
    try {
      // Determina destinatari
      let recipients: any[] = [];
      
      if (recipientType === 'single') {
        // Cerca utente per email
        const user = allUsers.find(u => u.email === singleRecipient);
        if (user) {
          recipients = [user];
        } else {
          recipients = [{ email: singleRecipient, name: 'Utente' }];
        }
      } else {
        // Filtra utenti per gruppo
        recipients = allUsers.filter(user => {
          if (groupFilter === 'all') return true;
          if (groupFilter === 'renters') return user.roles?.includes('renter');
          if (groupFilter === 'hubbers') return user.roles?.includes('hubber');
          if (groupFilter === 'superhubbers') return user.isSuperHubber;
          return false;
        });
      }

      if (recipients.length === 0) {
        alert('Nessun destinatario trovato');
        setSending(false);
        return;
      }

      // Crea record in email_queue
      const scheduledAt = scheduleEnabled && scheduledDate && scheduledTime
        ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
        : new Date().toISOString();

      const emailRecords = recipients.map(recipient => ({
        template_id: selectedTemplateId || null,
        recipient_email: recipient.email,
        recipient_name: recipient.name || recipient.public_name || `${recipient.first_name || ''} ${recipient.last_name || ''}`.trim(),
        recipient_user_id: recipient.id || null,
        subject: emailSubject,
        body_html: emailBody,
        status: scheduleEnabled ? 'scheduled' : 'pending',
        scheduled_at: scheduledAt,
        is_scheduled: scheduleEnabled,
        sender_account_id: selectedAccountId || null,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('email_queue')
        .insert(emailRecords);

      if (error) throw error;

      alert(`${recipients.length} email ${scheduleEnabled ? 'programmate' : 'aggiunte alla coda'}!`);
      
      // Reset form
      setSingleRecipient('');
      setEmailSubject('');
      setEmailBody('');
      setSelectedTemplateId('');
      setScheduleEnabled(false);
      setScheduledDate('');
      setScheduledTime('');
      
    } catch (error) {
      console.error('Errore invio email:', error);
      alert('Errore durante l\'invio');
    } finally {
      setSending(false);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      if (editingTemplate) {
        // Aggiorna template esistente
        const { error } = await supabase
          .from('email_templates')
          .update({
            ...templateForm,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTemplate.id);
        
        if (error) throw error;
      } else {
        // Crea nuovo template
        const { error } = await supabase
          .from('email_templates')
          .insert({
            id: `tpl-custom-${Date.now()}`,
            ...templateForm,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (error) throw error;
      }

      setShowTemplateModal(false);
      setEditingTemplate(null);
      setTemplateForm({
        name: '',
        slug: '',
        subject: '',
        body_html: '',
        body_text: '',
        category: 'transactional',
        trigger_event: '',
        email_type: 'transactional',
        is_disableable: true,
        is_active: true
      });
      loadData();
      alert('Template salvato!');
    } catch (error) {
      console.error('Errore salvataggio template:', error);
      alert('Errore nel salvataggio');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Eliminare questo template?')) return;
    
    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId);
      
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Errore eliminazione template:', error);
      alert('Errore nell\'eliminazione');
    }
  };

  const handleToggleTemplate = async (template: any) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);
      
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Errore toggle template:', error);
    }
  };

  const handleSaveAccount = async () => {
    try {
      if (editingAccount) {
        const { error } = await supabase
          .from('email_accounts')
          .update({
            ...accountForm,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAccount.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('email_accounts')
          .insert({
            ...accountForm,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (error) throw error;
      }

      setShowAccountModal(false);
      setEditingAccount(null);
      setAccountForm({
        name: '',
        email: '',
        smtp_host: '',
        smtp_port: 587,
        smtp_user: '',
        smtp_password: '',
        smtp_secure: true,
        is_default: false,
        category: 'general',
        is_active: true
      });
      loadData();
      alert('Account SMTP salvato!');
    } catch (error) {
      console.error('Errore salvataggio account:', error);
      alert('Errore nel salvataggio');
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Eliminare questo account SMTP?')) return;
    
    try {
      const { error } = await supabase
        .from('email_accounts')
        .delete()
        .eq('id', accountId);
      
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Errore eliminazione account:', error);
      alert('Errore nell\'eliminazione');
    }
  };

  const handleCancelQueueItem = async (queueId: string) => {
    try {
      const { error } = await supabase
        .from('email_queue')
        .update({ status: 'cancelled' })
        .eq('id', queueId);
      
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Errore cancellazione email:', error);
    }
  };

  // ========== FILTRI ==========
  const filteredTemplates = templates.filter(t => {
    const matchesSearch = !search || 
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.subject?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // ========== STATISTICHE ==========
  const stats = {
    totalTemplates: templates.length,
    activeTemplates: templates.filter(t => t.is_active).length,
    pendingEmails: queue.filter(q => q.status === 'pending').length,
    scheduledEmails: queue.filter(q => q.status === 'scheduled').length,
    sentToday: logs.filter(l => {
      const today = new Date().toDateString();
      return new Date(l.created_at).toDateString() === today;
    }).length
  };

  // ========== RENDER FUNCTIONS ==========
  const renderSubTabs = () => (
    <div className="flex gap-2 mb-6 border-b border-gray-200 pb-4">
      {[
        { id: 'send', label: 'Invia Email', icon: Send },
        { id: 'templates', label: 'Template', icon: FileText },
        { id: 'campaigns', label: 'Campagne', icon: Users },
        { id: 'queue', label: 'Coda', icon: Clock },
        { id: 'logs', label: 'Storico', icon: History },
        { id: 'settings', label: 'Impostazioni', icon: Settings }
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveSubTab(tab.id as any)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeSubTab === tab.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <tab.icon className="w-4 h-4" />
          {tab.label}
        </button>
      ))}
    </div>
  );

  const renderStats = () => (
    <div className="grid grid-cols-5 gap-4 mb-6">
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <p className="text-sm text-gray-500">Template Totali</p>
        <p className="text-2xl font-bold text-gray-900">{stats.totalTemplates}</p>
      </div>
      <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm">
        <p className="text-sm text-green-600">Template Attivi</p>
        <p className="text-2xl font-bold text-green-600">{stats.activeTemplates}</p>
      </div>
      <div className="bg-white p-4 rounded-xl border border-yellow-200 shadow-sm">
        <p className="text-sm text-yellow-600">In Coda</p>
        <p className="text-2xl font-bold text-yellow-600">{stats.pendingEmails}</p>
      </div>
      <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
        <p className="text-sm text-blue-600">Programmate</p>
        <p className="text-2xl font-bold text-blue-600">{stats.scheduledEmails}</p>
      </div>
      <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm">
        <p className="text-sm text-purple-600">Inviate Oggi</p>
        <p className="text-2xl font-bold text-purple-600">{stats.sentToday}</p>
      </div>
    </div>
  );

  const renderSendTab = () => (
    <div className="grid grid-cols-12 gap-6">
      {/* Colonna sinistra - Form invio */}
      <div className="col-span-8 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />
            Componi Email
          </h3>

          {/* Tipo destinatario */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo Invio</label>
            <div className="flex gap-3">
              <button
                onClick={() => setRecipientType('single')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                  recipientType === 'single'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <User className="w-5 h-5 mx-auto mb-1" />
                Singolo Utente
              </button>
              <button
                onClick={() => setRecipientType('group')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                  recipientType === 'group'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Users className="w-5 h-5 mx-auto mb-1" />
                Gruppo
              </button>
            </div>
          </div>

          {/* Destinatario singolo */}
          {recipientType === 'single' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Destinatario</label>
              <input
                type="email"
                value={singleRecipient}
                onChange={(e) => setSingleRecipient(e.target.value)}
                placeholder="email@esempio.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                list="users-emails"
              />
              <datalist id="users-emails">
                {allUsers.map(u => (
                  <option key={u.id} value={u.email}>{u.name || u.public_name}</option>
                ))}
              </datalist>
            </div>
          )}

          {/* Filtro gruppo */}
          {recipientType === 'group' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Destinatari</label>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">Tutti gli utenti ({allUsers.length})</option>
                <option value="renters">Solo Renter ({allUsers.filter(u => u.roles?.includes('renter')).length})</option>
                <option value="hubbers">Solo Hubber ({allUsers.filter(u => u.roles?.includes('hubber')).length})</option>
                <option value="superhubbers">Solo SuperHubber ({allUsers.filter(u => u.isSuperHubber).length})</option>
              </select>
            </div>
          )}

          {/* Account mittente */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Invia da</label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Seleziona account mittente...</option>
              {accounts.filter(a => a.is_active).map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.email}) {acc.is_default ? '⭐ Default' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Oggetto */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Oggetto</label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Oggetto dell'email..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Corpo */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Contenuto (HTML)</label>
            <textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder="<h1>Titolo</h1><p>Contenuto email...</p>"
              rows={10}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Variabili disponibili: {'{{name}}'}, {'{{email}}'}, {'{{listing}}'}, {'{{amount}}'}, etc.
            </p>
          </div>

          {/* Programmazione */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={scheduleEnabled}
                onChange={(e) => setScheduleEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium text-gray-700">Programma invio</span>
            </label>
            
            {scheduleEnabled && (
              <div className="flex gap-3">
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg"
                />
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Bottone invio */}
          <button
            onClick={handleSendEmail}
            disabled={sending || !emailSubject || !emailBody}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Invio in corso...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                {scheduleEnabled ? 'Programma Invio' : 'Invia Ora'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Colonna destra - Template rapidi */}
      <div className="col-span-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-4">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Template Rapidi
          </h3>
          
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {templates.filter(t => t.is_active && t.category === 'marketing').slice(0, 10).map(template => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedTemplateId === template.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <p className="font-medium text-gray-900 text-sm">{template.name}</p>
                <p className="text-xs text-gray-500 truncate">{template.subject}</p>
              </button>
            ))}
            
            {templates.filter(t => t.is_active && t.category === 'marketing').length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                Nessun template marketing disponibile
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTemplatesTab = () => (
    <div className="space-y-6">
      {/* Header con filtri */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca template..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-64"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg"
          >
            <option value="all">Tutte le categorie</option>
            <option value="security">🔒 Security</option>
            <option value="transactional">📧 Transazionali</option>
            <option value="notification">🔔 Notifiche</option>
            <option value="marketing">📢 Marketing</option>
          </select>
        </div>
        <button
          onClick={() => {
            setEditingTemplate(null);
            setTemplateForm({
              name: '',
              slug: '',
              subject: '',
              body_html: '',
              body_text: '',
              category: 'transactional',
              trigger_event: '',
              email_type: 'transactional',
              is_disableable: true,
              is_active: true
            });
            setShowTemplateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nuovo Template
        </button>
      </div>

      {/* Tabella template */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-100">
            <tr>
              <th className="p-4">Nome</th>
              <th className="p-4">Categoria</th>
              <th className="p-4">Trigger</th>
              <th className="p-4">Tipo</th>
              <th className="p-4">Stato</th>
              <th className="p-4 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filteredTemplates.map(template => (
              <tr key={template.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-4">
                  <p className="font-medium text-gray-900">{template.name}</p>
                  <p className="text-xs text-gray-500 truncate max-w-xs">{template.subject}</p>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    template.category === 'security' ? 'bg-red-100 text-red-700' :
                    template.category === 'transactional' ? 'bg-blue-100 text-blue-700' :
                    template.category === 'notification' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {template.category}
                  </span>
                </td>
                <td className="p-4 text-xs text-gray-500">
                  {template.trigger_event || '-'}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    template.is_disableable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {template.is_disableable ? 'Disattivabile' : 'Obbligatorio'}
                  </span>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => handleToggleTemplate(template)}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      template.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {template.is_active ? 'Attivo' : 'Disattivo'}
                  </button>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => {
                        setEditingTemplate(template);
                        setTemplateForm({
                          name: template.name,
                          slug: template.slug,
                          subject: template.subject,
                          body_html: template.body_html,
                          body_text: template.body_text || '',
                          category: template.category,
                          trigger_event: template.trigger_event || '',
                          email_type: template.email_type || 'transactional',
                          is_disableable: template.is_disableable,
                          is_active: template.is_active
                        });
                        setShowTemplateModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderQueueTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
  <h3 className="font-bold text-lg">Coda Email</h3>
  <div className="flex gap-2">
    <button
      onClick={async () => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-emails`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
              }
            }
          );
          const result = await response.json();
          alert(`Inviate: ${result.sent || 0}, Fallite: ${result.failed || 0}`);
          loadData();
        } catch (error) {
          console.error('Errore processo coda:', error);
          alert('Errore nel processare la coda');
        }
      }}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
    >
      <Send className="w-4 h-4" />
      Invia Coda
    </button>
    <button
      onClick={loadData}
      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
    >
      <RefreshCw className="w-4 h-4" />
      Aggiorna
    </button>
  </div>
</div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-100">
            <tr>
              <th className="p-4">Destinatario</th>
              <th className="p-4">Oggetto</th>
              <th className="p-4">Stato</th>
              <th className="p-4">Programmato</th>
              <th className="p-4 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {queue.map(item => (
              <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-4">
                  <p className="font-medium text-gray-900">{item.recipient_name || 'N/A'}</p>
                  <p className="text-xs text-gray-500">{item.recipient_email}</p>
                </td>
                <td className="p-4 max-w-xs">
                  <p className="truncate">{item.subject}</p>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    item.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                    item.status === 'sent' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="p-4 text-xs text-gray-500">
                  {item.scheduled_at ? new Date(item.scheduled_at).toLocaleString('it-IT') : '-'}
                </td>
                <td className="p-4 text-right">
                  {item.status !== 'sent' && (
                    <button
                      onClick={() => handleCancelQueueItem(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Annulla"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {queue.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">
                  Nessuna email in coda
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLogsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Storico Invii</h3>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <RefreshCw className="w-4 h-4" />
          Aggiorna
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-100">
            <tr>
              <th className="p-4">Data</th>
              <th className="p-4">Destinatario</th>
              <th className="p-4">Oggetto</th>
              <th className="p-4">Stato</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-4 text-xs text-gray-500">
                  {new Date(log.created_at).toLocaleString('it-IT')}
                </td>
                <td className="p-4">
                  <p className="text-gray-900">{log.recipient_email}</p>
                </td>
                <td className="p-4 max-w-xs">
                  <p className="truncate">{log.subject}</p>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    log.status === 'sent' ? 'bg-green-100 text-green-700' :
                    log.status === 'failed' ? 'bg-red-100 text-red-700' :
                    log.status === 'opened' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-400">
                  Nessun log disponibile
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      {/* Account SMTP */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Account SMTP
          </h3>
          <button
            onClick={() => {
              setEditingAccount(null);
              setAccountForm({
                name: '',
                email: '',
                smtp_host: '',
                smtp_port: 587,
                smtp_user: '',
                smtp_password: '',
                smtp_secure: true,
                is_default: false,
                category: 'general',
                is_active: true
              });
              setShowAccountModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Aggiungi Account
          </button>
        </div>

        <div className="space-y-3">
          {accounts.map(account => (
            <div
              key={account.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  account.is_active ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <Mail className={`w-5 h-5 ${account.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {account.name}
                    {account.is_default && (
                      <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">
                        ⭐ Default
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500">{account.email}</p>
                  <p className="text-xs text-gray-400">{account.smtp_host}:{account.smtp_port}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  account.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {account.is_active ? 'Attivo' : 'Disattivo'}
                </span>
                <button
                  onClick={() => {
                    setEditingAccount(account);
                    setAccountForm({
                      name: account.name,
                      email: account.email,
                      smtp_host: account.smtp_host,
                      smtp_port: account.smtp_port,
                      smtp_user: account.smtp_user,
                      smtp_password: account.smtp_password,
                      smtp_secure: account.smtp_secure,
                      is_default: account.is_default,
                      category: account.category,
                      is_active: account.is_active
                    });
                    setShowAccountModal(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteAccount(account.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          
          {accounts.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nessun account SMTP configurato</p>
              <p className="text-sm">Aggiungi un account per iniziare a inviare email</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCampaignsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Campagne Email</h3>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nuova Campagna
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-100">
            <tr>
              <th className="p-4">Nome</th>
              <th className="p-4">Destinatari</th>
              <th className="p-4">Stato</th>
              <th className="p-4">Inviati</th>
              <th className="p-4">Aperti</th>
              <th className="p-4">Data</th>
              <th className="p-4 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map(campaign => (
              <tr key={campaign.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-4">
                  <p className="font-medium text-gray-900">{campaign.name}</p>
                  <p className="text-xs text-gray-500 truncate max-w-xs">{campaign.subject}</p>
                </td>
                <td className="p-4">{campaign.total_recipients}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    campaign.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                    campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                    campaign.status === 'sending' ? 'bg-yellow-100 text-yellow-700' :
                    campaign.status === 'sent' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {campaign.status}
                  </span>
                </td>
                <td className="p-4">{campaign.sent_count}/{campaign.total_recipients}</td>
                <td className="p-4">{campaign.opened_count}</td>
                <td className="p-4 text-xs text-gray-500">
                  {campaign.sent_at 
                    ? new Date(campaign.sent_at).toLocaleDateString('it-IT')
                    : campaign.scheduled_at 
                      ? `Prog: ${new Date(campaign.scheduled_at).toLocaleDateString('it-IT')}`
                      : '-'
                  }
                </td>
                <td className="p-4 text-right">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">
                  Nessuna campagna creata
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ========== MODALI ==========
  const renderTemplateModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
          <h3 className="font-bold text-lg">
            {editingTemplate ? 'Modifica Template' : 'Nuovo Template'}
          </h3>
          <button onClick={() => setShowTemplateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={templateForm.slug}
                onChange={(e) => setTemplateForm({...templateForm, slug: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Oggetto</label>
            <input
              type="text"
              value={templateForm.subject}
              onChange={(e) => setTemplateForm({...templateForm, subject: e.target.value})}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                value={templateForm.category}
                onChange={(e) => setTemplateForm({...templateForm, category: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              >
                <option value="security">🔒 Security</option>
                <option value="transactional">📧 Transazionale</option>
                <option value="notification">🔔 Notifica</option>
                <option value="marketing">📢 Marketing</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Event</label>
              <input
                type="text"
                value={templateForm.trigger_event}
                onChange={(e) => setTemplateForm({...templateForm, trigger_event: e.target.value})}
                placeholder="es. booking_confirmed"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contenuto HTML</label>
            <textarea
              value={templateForm.body_html}
              onChange={(e) => setTemplateForm({...templateForm, body_html: e.target.value})}
              rows={8}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contenuto Testo (fallback)</label>
            <textarea
              value={templateForm.body_text}
              onChange={(e) => setTemplateForm({...templateForm, body_text: e.target.value})}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={templateForm.is_disableable}
                onChange={(e) => setTemplateForm({...templateForm, is_disableable: e.target.checked})}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm">Disattivabile dall'utente</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={templateForm.is_active}
                onChange={(e) => setTemplateForm({...templateForm, is_active: e.target.checked})}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm">Attivo</span>
            </label>
          </div>
        </div>
        <div className="p-5 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
          <button
            onClick={() => setShowTemplateModal(false)}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Annulla
          </button>
          <button
            onClick={handleSaveTemplate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Salva Template
          </button>
        </div>
      </div>
    </div>
  );

  const renderAccountModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-lg">
            {editingAccount ? 'Modifica Account SMTP' : 'Nuovo Account SMTP'}
          </h3>
          <button onClick={() => setShowAccountModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Account</label>
            <input
              type="text"
              value={accountForm.name}
              onChange={(e) => setAccountForm({...accountForm, name: e.target.value})}
              placeholder="es. Info, Supporto, Notifiche"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Mittente</label>
            <input
              type="email"
              value={accountForm.email}
              onChange={(e) => setAccountForm({...accountForm, email: e.target.value})}
              placeholder="info@tuodominio.it"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Server SMTP</label>
              <input
                type="text"
                value={accountForm.smtp_host}
                onChange={(e) => setAccountForm({...accountForm, smtp_host: e.target.value})}
                placeholder="smtp.tuodominio.it"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Porta</label>
              <input
                type="number"
                value={accountForm.smtp_port}
                onChange={(e) => setAccountForm({...accountForm, smtp_port: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username SMTP</label>
            <input
              type="text"
              value={accountForm.smtp_user}
              onChange={(e) => setAccountForm({...accountForm, smtp_user: e.target.value})}
              placeholder="info@tuodominio.it"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password SMTP</label>
            <input
              type="password"
              value={accountForm.smtp_password}
              onChange={(e) => setAccountForm({...accountForm, smtp_password: e.target.value})}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select
              value={accountForm.category}
              onChange={(e) => setAccountForm({...accountForm, category: e.target.value})}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg"
            >
              <option value="general">Generale</option>
              <option value="transactional">Transazionale</option>
              <option value="marketing">Marketing</option>
              <option value="support">Supporto</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={accountForm.smtp_secure}
                onChange={(e) => setAccountForm({...accountForm, smtp_secure: e.target.checked})}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm">SSL/TLS</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={accountForm.is_default}
                onChange={(e) => setAccountForm({...accountForm, is_default: e.target.checked})}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm">Account predefinito</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={accountForm.is_active}
                onChange={(e) => setAccountForm({...accountForm, is_active: e.target.checked})}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm">Attivo</span>
            </label>
          </div>
        </div>
        <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={() => setShowAccountModal(false)}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Annulla
          </button>
          <button
            onClick={handleSaveAccount}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Salva Account
          </button>
        </div>
      </div>
    </div>
  );

  // ========== RENDER PRINCIPALE ==========
  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestione Email</h2>
      </div>

      {/* Stats */}
      {renderStats()}

      {/* Sub-tabs */}
      {renderSubTabs()}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {activeSubTab === 'send' && renderSendTab()}
          {activeSubTab === 'templates' && renderTemplatesTab()}
          {activeSubTab === 'campaigns' && renderCampaignsTab()}
          {activeSubTab === 'queue' && renderQueueTab()}
          {activeSubTab === 'logs' && renderLogsTab()}
          {activeSubTab === 'settings' && renderSettingsTab()}
        </>
      )}

      {/* Modali */}
      {showTemplateModal && renderTemplateModal()}
      {showAccountModal && renderAccountModal()}
    </div>
  );
};

export default AdminEmailSection;