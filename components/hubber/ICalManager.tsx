import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Download,
  Upload,
  Link2,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  ExternalLink,
  AlertCircle,
  Info,
  X,
  Plus,
} from 'lucide-react';
 import { supabase } from '../../lib/supabase';
 import { getOrCreateExportUrl } from '../../services/ical';

// Tipo per calendario importato
interface ImportedCalendar {
  id: string;
  name: string;
  url: string;
  lastSync?: string;
  eventsCount?: number;
  status: 'active' | 'error' | 'syncing';
  errorMessage?: string;
}

interface ICalManagerProps {
  userId: string;
  userName?: string;
  listingId?: string;
  onExportUrl?: (url: string) => void;
  onImportCalendar?: (url: string, name: string) => Promise<void>;
  onRemoveCalendar?: (calendarId: string) => Promise<void>;
  onSyncCalendar?: (calendarId: string) => Promise<void>;
  importedCalendars?: ImportedCalendar[];
  exportUrl?: string;
}

export const ICalManager: React.FC<ICalManagerProps> = ({
  userId,
  userName,
  listingId,
  onExportUrl,
  onImportCalendar,
  onRemoveCalendar,
  onSyncCalendar,
  importedCalendars = [],
  exportUrl: initialExportUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState(false);
  const [exportUrl, setExportUrl] = useState(initialExportUrl || '');
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);
  
  // Import state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importName, setImportName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  
  // Sync state
  const [syncingId, setSyncingId] = useState<string | null>(null);

  console.log('🎨 ICalManager MOUNTED - userId:', userId, 'exportUrl:', exportUrl);

// Genera URL export se non esiste
useEffect(() => {
  console.log('🔍 ICalManager useEffect - exportUrl:', exportUrl, 'userId:', userId);
  
  if (!exportUrl && userId && listingId) {
  getOrCreateExportUrl(userId, listingId).then(({ url }) => {
    setExportUrl(url);
    if (onExportUrl) {
      onExportUrl(url);
    }
  }).catch(err => {
    console.error('Errore generazione URL iCal:', err);
  });
}
}, [userId, listingId, exportUrl, onExportUrl]);

  // Copia URL negli appunti
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Errore copia negli appunti:', err);
    }
  };

 // Rigenera URL export
const regenerateUrl = async () => {
  setIsGeneratingUrl(true);
  const token = btoa(`${userId}-${Date.now()}-regen`).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
  const newUrl = `${window.location.origin}/api/ical/${userId}/${token}.ics`;
  
  try {
    // ✅ Salva il nuovo token nel database
    const { error } = await supabase
      .from('users')
      .update({ ical_token: token })
      .eq('id', userId);
    
    if (error) {
      console.error('Errore salvataggio nuovo token:', error);
      setIsGeneratingUrl(false);
      return;
    }
    
    setExportUrl(newUrl);
    if (onExportUrl) {
      onExportUrl(newUrl);
    }
  } catch (err) {
    console.error('Errore rigenerazione URL:', err);
  } finally {
    setIsGeneratingUrl(false);
  }
};

  // Gestione import
  const handleImport = async () => {
    if (!importUrl.trim()) {
      setImportError('Inserisci un URL valido');
      return;
    }

    // Valida URL
    try {
      new URL(importUrl);
    } catch {
      setImportError('URL non valido');
      return;
    }

    // Verifica estensione o formato
    if (!importUrl.includes('.ics') && !importUrl.includes('ical') && !importUrl.includes('calendar')) {
      setImportError('L\'URL non sembra essere un feed iCal valido. Assicurati che termini con .ics');
      return;
    }

    setIsImporting(true);
    setImportError(null);

    try {
      if (onImportCalendar) {
        await onImportCalendar(importUrl, importName || 'Calendario importato');
      }
      
      // Reset e chiudi
      setImportUrl('');
      setImportName('');
      setImportModalOpen(false);
    } catch (err: any) {
      setImportError(err.message || 'Errore durante l\'importazione');
    } finally {
      setIsImporting(false);
    }
  };

  // Sincronizza calendario
  const handleSync = async (calendarId: string) => {
    setSyncingId(calendarId);
    try {
      if (onSyncCalendar) {
        await onSyncCalendar(calendarId);
      }
    } catch (err) {
      console.error('Errore sincronizzazione:', err);
    } finally {
      setSyncingId(null);
    }
  };

  // Rimuovi calendario
  const handleRemove = async (calendarId: string) => {
    if (!confirm('Sei sicuro di voler rimuovere questo calendario?')) return;
    
    try {
      if (onRemoveCalendar) {
        await onRemoveCalendar(calendarId);
      }
    } catch (err) {
      console.error('Errore rimozione:', err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header con tabs */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-brand" />
            <h3 className="font-bold text-gray-900 text-lg">
              Sincronizzazione Calendario
            </h3>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'export'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Download className="w-4 h-4" />
            Esporta iCal
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'import'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Upload className="w-4 h-4" />
            Importa Calendario
          </button>
        </div>
      </div>

      {/* Contenuto Export */}
      {activeTab === 'export' && (
        <div className="p-4 space-y-4">
          {/* Info box */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Sincronizza le tue prenotazioni</p>
                <p className="text-blue-600">
                  Copia questo URL e aggiungilo a Google Calendar, Apple Calendar, Outlook o qualsiasi 
                  app calendario che supporta iCal. Le tue prenotazioni saranno sempre aggiornate automaticamente.
                </p>
              </div>
            </div>
          </div>

         {/* URL Box */}
<div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
  <label className="block text-xs font-semibold text-gray-500 uppercase mb-3">
    Il tuo URL iCal personale
  </label>
  
  {/* Mobile layout: horizontal */}
  <div className="flex md:hidden gap-2">
    <div className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-3 overflow-x-auto">
      <div className="flex items-center gap-2">
        <Link2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <span className="text-sm text-gray-700 font-mono whitespace-nowrap">
          {exportUrl || 'Generazione in corso...'}
        </span>
      </div>
    </div>
    <button
      onClick={copyToClipboard}
      disabled={!exportUrl}
      className={`px-3 py-3 rounded-lg font-medium transition-all flex items-center justify-center flex-shrink-0 ${
        copied
          ? 'bg-green-500 text-white'
          : 'bg-brand text-white hover:bg-brand-dark active:bg-brand-dark'
      } disabled:opacity-50`}
    >
      {copied ? (
        <Check className="w-5 h-5" />
      ) : (
        <Copy className="w-5 h-5" />
      )}
    </button>
  </div>

  {/* Desktop layout: side by side */}
  <div className="hidden md:flex gap-2">
    <div className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center overflow-x-auto">
      <Link2 className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
      <span className="text-sm text-gray-700 font-mono whitespace-nowrap">
        {exportUrl || 'Generazione in corso...'}
      </span>
    </div>
    <button
      onClick={copyToClipboard}
      disabled={!exportUrl}
      className={`px-3 py-2 rounded-lg font-medium text-xs transition-all flex items-center gap-1.5 flex-shrink-0 ${
        copied
          ? 'bg-green-500 text-white'
          : 'bg-brand text-white hover:bg-brand-dark'
      } disabled:opacity-50`}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          Copiato
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          Copia
        </>
      )}
    </button>
  </div>
</div>

          {/* Istruzioni per app specifiche */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Come aggiungere:</p>
            
            {/* Google Calendar */}
            <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#EA4335">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Google Calendar</p>
                  <p className="text-xs text-gray-500">Impostazioni → Aggiungi calendario → Da URL</p>
                </div>
              </div>
              <a
                href="https://calendar.google.com/calendar/r/settings/addbyurl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:text-brand-dark text-sm font-medium flex items-center gap-1"
              >
                Apri
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Apple Calendar */}
            <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#333">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Apple Calendar</p>
                  <p className="text-xs text-gray-500">File → Nuova sottoscrizione calendario</p>
                </div>
              </div>
            </div>

            {/* Outlook */}
            <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0078D4">
                    <path d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.1-.87q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.31.77.1.43.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.5V2.55q0-.44.3-.75.3-.3.75-.3h12.9q.44 0 .75.3.3.3.3.75V12zm-6-8.25v3h3v-3h-3zm0 4.5v3h3v-3h-3zm0 4.5v1.83l3.05-1.83H18zm-5.25-9v3h3.75v-3h-3.75zm0 4.5v3h3.75v-3h-3.75zm0 4.5v2.03l2.41 1.5 1.34-.8v-2.73h-3.75zM9 3.75V6h2l.13.01.12.04v-2.3H9zM3.38 7l.06.03.04.04 5.02 4.96V7H3.38zm1.05 10.24l7.07 4.5V10.77L3.78 6.73l-.58.52v9.99h1.23z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Outlook</p>
                  <p className="text-xs text-gray-500">Aggiungi calendario → Sottoscrivi dal web</p>
                </div>
              </div>
            </div>
          </div>

          {/* Rigenera URL */}
          <div className="border-t border-gray-100 pt-4">
            <button
              onClick={regenerateUrl}
              disabled={isGeneratingUrl}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isGeneratingUrl ? 'animate-spin' : ''}`} />
              Genera nuovo URL (invalida il precedente)
            </button>
          </div>
        </div>
      )}

      {/* Contenuto Import */}
      {activeTab === 'import' && (
        <div className="p-4 space-y-4">
          {/* Info box */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Blocca le date occupate</p>
                <p className="text-amber-600">
                  Importa il tuo calendario personale (Google Calendar, Airbnb, ecc.) per bloccare 
                  automaticamente le date in cui non sei disponibile sui tuoi annunci.
                </p>
              </div>
            </div>
          </div>

          {/* Pulsante aggiungi */}
          <button
            onClick={() => setImportModalOpen(true)}
            className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-600 font-medium hover:border-brand hover:text-brand hover:bg-brand/5 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Aggiungi calendario esterno
          </button>

          {/* Lista calendari importati */}
          {importedCalendars.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Calendari collegati:</p>
              
              {importedCalendars.map((cal) => (
                <div
                  key={cal.id}
                  className={`bg-white border rounded-xl p-3 ${
                    cal.status === 'error' ? 'border-red-200' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        cal.status === 'error' 
                          ? 'bg-red-100' 
                          : cal.status === 'syncing'
                            ? 'bg-blue-100'
                            : 'bg-green-100'
                      }`}>
                        {cal.status === 'error' ? (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        ) : cal.status === 'syncing' ? (
                          <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                        ) : (
                          <Calendar className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{cal.name}</p>
                        <p className="text-xs text-gray-500">
                          {cal.status === 'error' 
                            ? cal.errorMessage || 'Errore sincronizzazione'
                            : cal.lastSync
                              ? `Sincronizzato: ${new Date(cal.lastSync).toLocaleString('it-IT')}`
                              : 'In attesa di sincronizzazione'
                          }
                        </p>
                        {cal.eventsCount !== undefined && cal.status === 'active' && (
                          <p className="text-xs text-green-600 font-medium">
                            {cal.eventsCount} eventi importati
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSync(cal.id)}
                        disabled={syncingId === cal.id}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-brand transition-colors"
                        title="Sincronizza"
                      >
                        <RefreshCw className={`w-4 h-4 ${syncingId === cal.id ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleRemove(cal.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
                        title="Rimuovi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Placeholder se nessun calendario */}
          {importedCalendars.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nessun calendario esterno collegato</p>
              <p className="text-xs mt-1">
                Aggiungi un calendario per sincronizzare automaticamente le date occupate
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modale Import */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative mx-4">
            <button
              onClick={() => {
                setImportModalOpen(false);
                setImportUrl('');
                setImportName('');
                setImportError(null);
              }}
              disabled={isImporting}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-brand" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Importa Calendario
              </h2>
              <p className="text-sm text-gray-500">
                Inserisci l'URL iCal del calendario che vuoi importare
              </p>
            </div>

            <div className="space-y-4">
              {/* Nome calendario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome (opzionale)
                </label>
                <input
                  type="text"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  placeholder="Es: Google Calendar personale"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL iCal *
                </label>
                <input
                  type="url"
                  value={importUrl}
                  onChange={(e) => {
                    setImportUrl(e.target.value);
                    setImportError(null);
                  }}
                  placeholder="https://calendar.google.com/calendar/ical/..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Deve terminare con .ics o essere un feed iCal valido
                </p>
              </div>

              {/* Errore */}
              {importError && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-sm text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {importError}
                  </p>
                </div>
              )}

              {/* Dove trovare URL */}
              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600">
                <p className="font-medium mb-1">Dove trovo l'URL iCal?</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li><strong>Google Calendar:</strong> Impostazioni calendario → Integra calendario → Indirizzo segreto in formato iCal</li>
                  <li><strong>Airbnb:</strong> Calendario → Esporta calendario</li>
                  <li><strong>Booking.com:</strong> Calendario → Sincronizza calendari</li>
                </ul>
              </div>
            </div>

            {/* Azioni */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setImportModalOpen(false);
                  setImportUrl('');
                  setImportName('');
                  setImportError(null);
                }}
                disabled={isImporting}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting || !importUrl.trim()}
                className="flex-1 py-2.5 rounded-xl bg-brand text-white font-semibold hover:bg-brand-dark disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Importazione...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Importa
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

export default ICalManager;