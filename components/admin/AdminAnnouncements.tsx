import React, { useState, useEffect } from 'react';
import {
  Megaphone, Plus, Edit, Trash2, Eye, EyeOff, Users, Calendar,
  Search, Filter, X, Upload, ExternalLink, BarChart3, RefreshCw
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { SimpleDateTimePicker } from '../SimpleDateTimePicker';
import { ImageUploader } from '../ImageUploader';

interface Announcement {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  message: string | null;
  image_url: string | null;
  cta_text: string | null;
  cta_link: string | null;
  type: 'promo' | 'news' | 'alert' | 'feature';
  priority: number;
  target_audience: 'all' | 'renter' | 'hubber' | 'specific';
  specific_user_ids: string[] | null;
  active: boolean;
  valid_from: string;
  valid_until: string | null;
  view_count: number;
  click_count: number;
  primary_color: string;
  show_on_first_login: boolean;
}

interface AdminAnnouncementsProps {
  currentUser?: any;
}

export const AdminAnnouncements: React.FC<AdminAnnouncementsProps> = ({ currentUser }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'promo' | 'news' | 'alert' | 'feature'>('all');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    image_url: '',
    cta_text: '',
    cta_link: '',
    type: 'news' as 'promo' | 'news' | 'alert' | 'feature',
    priority: 0,
    target_audience: 'all' as 'all' | 'renter' | 'hubber' | 'specific',
    active: true,
    valid_from: new Date(),
    valid_until: null as Date | null,
    primary_color: '#0A4D68',
    show_on_first_login: false,
  });

  // Carica annunci
  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_announcements')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Errore caricamento annunci:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  // Filtra annunci
  const filteredAnnouncements = announcements.filter(ann => {
    // Filtro ricerca
    if (searchTerm && !ann.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    // Filtro tipo
    if (filterType !== 'all' && ann.type !== filterType) {
      return false;
    }
    // Filtro attivo
    if (filterActive === 'active' && !ann.active) return false;
    if (filterActive === 'inactive' && ann.active) return false;

    return true;
  });

  // Salva annuncio
  const handleSave = async () => {
    try {
      const dataToSave = {
        ...formData,
        valid_from: formData.valid_from.toISOString(),
        valid_until: formData.valid_until ? formData.valid_until.toISOString() : null,
      };

      if (editingAnnouncement) {
        // Update
        const { error } = await supabase
          .from('admin_announcements')
          .update({
            ...dataToSave,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingAnnouncement.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('admin_announcements')
          .insert(dataToSave);

        if (error) throw error;
      }

      await loadAnnouncements();
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Errore salvataggio annuncio:', error);
      alert('Errore durante il salvataggio');
    }
  };

  // Elimina annuncio
  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo annuncio?')) return;

    try {
      const { error } = await supabase
        .from('admin_announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadAnnouncements();
    } catch (error) {
      console.error('Errore eliminazione annuncio:', error);
      alert('Errore durante l\'eliminazione');
    }
  };

  // Toggle attivo
  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_announcements')
        .update({ active: !currentActive })
        .eq('id', id);

      if (error) throw error;
      await loadAnnouncements();
    } catch (error) {
      console.error('Errore toggle attivo:', error);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      image_url: '',
      cta_text: '',
      cta_link: '',
      type: 'news',
      priority: 0,
      target_audience: 'all',
      active: true,
      valid_from: new Date(),
      valid_until: null,
      primary_color: '#0A4D68',
      show_on_first_login: false,
    });
    setEditingAnnouncement(null);
  };

  // Apri modal per edit
  const openEditModal = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      message: announcement.message || '',
      image_url: announcement.image_url || '',
      cta_text: announcement.cta_text || '',
      cta_link: announcement.cta_link || '',
      type: announcement.type,
      priority: announcement.priority,
      target_audience: announcement.target_audience,
      active: announcement.active,
      valid_from: new Date(announcement.valid_from),
      valid_until: announcement.valid_until ? new Date(announcement.valid_until) : null,
      primary_color: announcement.primary_color || '#0A4D68',
      show_on_first_login: announcement.show_on_first_login || false,
    });
    setShowModal(true);
  };

  // Badge tipo
  const getTypeBadge = (type: string) => {
    const styles = {
      promo: 'bg-purple-100 text-purple-700',
      news: 'bg-blue-100 text-blue-700',
      alert: 'bg-red-100 text-red-700',
      feature: 'bg-green-100 text-green-700',
    };
    const labels = {
      promo: '🎁 Promo',
      news: '📰 News',
      alert: '⚠️ Alert',
      feature: '✨ Feature',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type as keyof typeof styles]}`}>
        {labels[type as keyof typeof labels]}
      </span>
    );
  };

  // Badge target
  const getTargetBadge = (target: string) => {
    const labels = {
      all: '👥 Tutti',
      renter: '🔵 Renter',
      hubber: '🟢 Hubber',
      specific: '🎯 Specifici',
    };
    return (
      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
        {labels[target as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-blue-500" />
            Annunci Pubblicitari
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Gestisci popup e comunicazioni per gli utenti
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuovo Annuncio
        </button>
      </div>

      {/* Filtri */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Ricerca */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cerca</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Titolo annuncio..."
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filtro Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tutti i tipi</option>
              <option value="promo">Promo</option>
              <option value="news">News</option>
              <option value="alert">Alert</option>
              <option value="feature">Feature</option>
            </select>
          </div>

          {/* Filtro Stato */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stato</label>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tutti</option>
              <option value="active">Attivi</option>
              <option value="inactive">Disattivati</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista Annunci */}
      <div className="grid grid-cols-1 gap-4">
        {filteredAnnouncements.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nessun annuncio trovato</p>
          </div>
        ) : (
          filteredAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Immagine preview */}
                {ann.image_url && (
                  <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    <img
                      src={ann.image_url}
                      alt={ann.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Contenuto */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{ann.title}</h3>
                      {ann.message && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ann.message}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {getTypeBadge(ann.type)}
                      {getTargetBadge(ann.target_audience)}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(ann.valid_from).toLocaleDateString('it-IT')}
                      {ann.valid_until && ` - ${new Date(ann.valid_until).toLocaleDateString('it-IT')}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {ann.view_count} visualizzazioni
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      {ann.click_count} click
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      ann.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {ann.active ? '● Attivo' : '○ Disattivato'}
                    </span>
                  </div>

                  {/* Azioni */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(ann)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-3 h-3" />
                      Modifica
                    </button>
                    <button
                      onClick={() => toggleActive(ann.id, ann.active)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      {ann.active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {ann.active ? 'Disattiva' : 'Attiva'}
                    </button>
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Elimina
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Crea/Modifica */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-900">
                {editingAnnouncement ? 'Modifica Annuncio' : 'Nuovo Annuncio'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Titolo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titolo *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Es: Sconto 20% per nuovi utenti!"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Messaggio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Messaggio
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Descrizione dell'annuncio..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Immagine Upload */}
              <ImageUploader
                label="Immagine Pubblicitaria"
                value={formData.image_url}
                onChange={(url) => setFormData({ ...formData, image_url: url || '' })}
                maxSizeMB={10}
              />

              {/* CTA */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Testo Bottone
                  </label>
                  <input
                    type="text"
                    value={formData.cta_text}
                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    placeholder="Es: Scopri di più"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link Bottone
                  </label>
                  <input
                    type="url"
                    value={formData.cta_link}
                    onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Tipo e Priorità */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="promo">🎁 Promo</option>
                    <option value="news">📰 News</option>
                    <option value="alert">⚠️ Alert</option>
                    <option value="feature">✨ Feature</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priorità (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mostra a
                </label>
                <select
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">👥 Tutti gli utenti</option>
                  <option value="renter">🔵 Solo Renter</option>
                  <option value="hubber">🟢 Solo Hubber</option>
                  <option value="specific">🎯 Utenti specifici</option>
                </select>
              </div>

              {/* Colore Popup */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Colore Popup
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-16 h-10 rounded-lg border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    placeholder="#0A4D68"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                  <div 
                    className="w-10 h-10 rounded-lg border border-gray-200"
                    style={{ backgroundColor: formData.primary_color }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Colore del gradient e degli elementi del popup
                </p>
              </div>

              {/* Checkbox Benvenuto */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <input
                  type="checkbox"
                  id="welcome"
                  checked={formData.show_on_first_login}
                  onChange={(e) => setFormData({ ...formData, show_on_first_login: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mt-0.5"
                />
                <div className="flex-1">
                  <label htmlFor="welcome" className="text-sm font-medium text-gray-900 cursor-pointer">
                    🎉 Messaggio di Benvenuto
                  </label>
                  <p className="text-xs text-gray-600 mt-1">
                    Se attivo, questo annuncio verrà mostrato <strong>solo la prima volta</strong> dopo l'iscrizione dell'utente (entro 24h dalla registrazione)
                  </p>
                </div>
              </div>

              {/* Date validità - Stile moderno Airbnb */}
              <div className="space-y-4">
                <SimpleDateTimePicker
                  label="Valido da"
                  value={formData.valid_from}
                  onChange={(date) => setFormData({ ...formData, valid_from: date || new Date() })}
                  minDate={new Date()}
                  placeholder="Seleziona data e ora di inizio"
                  inline={true}
                />
                <SimpleDateTimePicker
                  label="Valido fino a (opzionale)"
                  value={formData.valid_until}
                  onChange={(date) => setFormData({ ...formData, valid_until: date })}
                  minDate={formData.valid_from}
                  placeholder="Nessuna scadenza"
                  inline={true}
                />
              </div>

              {/* Attivo */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                  Annuncio attivo
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.title}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editingAnnouncement ? 'Salva Modifiche' : 'Crea Annuncio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};