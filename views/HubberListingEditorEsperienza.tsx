import React, { useState, useEffect, useRef } from 'react';
import { Listing, CancellationPolicyType } from '../types';
import {
  Save, ArrowLeft, Camera, Upload, MapPin, DollarSign,
  FileText, Shield, Plus, X, Clock, Users, Home, Loader2,
  ChevronLeft, ChevronRight, Calendar, Trash2, Ticket, Globe, AlertCircle
} from 'lucide-react';
import { processImageSingle } from '../utils/imageProcessing';
import { supabase } from '../services/supabaseClient';
import { CityAutocomplete } from '../components/CityAutocomplete';
import { CitySuggestion } from '../services/geocodingService';
import { AirbnbCalendar } from '../components/AirbnbCalendar';

interface ExperienceSlot {
  id: string;
  listing_id: string;
  date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  max_participants: number;
  booked_count: number;
  status: string;
}

interface HubberListingEditorEsperienzaProps {
  listing: Listing;
  onSave: (updatedListing: Listing) => void;
  onCancel: () => void;
}

type Tab = 'general' | 'slots' | 'media' | 'rules' | 'location';

export const HubberListingEditorEsperienza: React.FC<HubberListingEditorEsperienzaProps> = ({ listing, onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [formData, setFormData] = useState<Listing>({ ...listing });
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Slot
  const [slots, setSlots] = useState<ExperienceSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarStart, setCalendarStart] = useState<Date | undefined>(undefined);
  const [calendarEnd, setCalendarEnd] = useState<Date | undefined>(undefined);

  // Generatore automatico slot
  const [showGenerator, setShowGenerator] = useState(false);
  const [genFrequency, setGenFrequency] = useState<'daily' | 'weekly' | 'custom'>('weekly');
  const [genDays, setGenDays] = useState<number[]>([6]); // 0=Dom, 1=Lun... 6=Sab
  const [genStartDate, setGenStartDate] = useState('');
  const [genEndDate, setGenEndDate] = useState('');
  const [genStartTime, setGenStartTime] = useState('');
  const [genEndTime, setGenEndTime] = useState('');
  const [genMaxParticipants, setGenMaxParticipants] = useState(formData.maxGuests || 10);
  const [isGenerating, setIsGenerating] = useState(false);

  // Carica slot esistenti
  useEffect(() => {
    const loadSlots = async () => {
      setIsLoadingSlots(true);
      try {
        const { data, error } = await supabase
          .from('experience_slots')
          .select('*')
          .eq('listing_id', listing.id)
          .order('date', { ascending: true });
        if (!error && data) setSlots(data);
      } catch (err) {
        console.error('Errore caricamento slot:', err);
      } finally {
        setIsLoadingSlots(false);
      }
    };
    if (listing.id) loadSlots();
  }, [listing.id]);

  // --- SAVE ---
  const handleSave = async () => {
    setIsSaving(true);

    if (!formData.title) {
      alert('Il titolo è obbligatorio.');
      setIsSaving(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('listings')
        .update({
          title: formData.title,
          description: formData.description,
          sub_category: formData.subCategory,
          price: typeof formData.price === 'string' ? parseFloat(formData.price) || 0 : formData.price,
          price_type: (formData as any).priceType || 'persona',
          cancellation_policy: formData.cancellationPolicy,
          cleaning_fee: (formData as any).cleaningFee ?? 0,
          images: formData.images,
          features: formData.features,
          rules: formData.rules,
          location: formData.location,
          lat: formData.coordinates?.lat ?? null,
          lng: formData.coordinates?.lng ?? null,
          pickup_address: formData.pickupAddress,
          pickup_city: formData.pickupCity,
          pickup_instructions: formData.pickupInstructions,
          zone_description: formData.zoneDescription,
          manual_badges: (formData as any).manualBadges || [],
          // Campi esperienza
          duration_value: (formData as any).durationValue || null,
          duration_unit: (formData as any).durationUnit || null,
          languages: (formData as any).languages || null,
          difficulty: (formData as any).difficulty || null,
          min_age: (formData as any).minAge || null,
          included: (formData as any).included || [],
          not_included: (formData as any).notIncluded || [],
          max_guests: formData.maxGuests || null,
        })
        .eq('id', formData.id);

      if (error) {
        console.error('❌ Errore aggiornamento:', error);
        alert('Errore nel salvataggio. Riprova.');
        setIsSaving(false);
        return;
      }

      onSave(formData);
      setIsSaving(false);
    } catch (err) {
      console.error('❌ Errore salvataggio:', err);
      alert('Errore nel salvataggio. Riprova.');
      setIsSaving(false);
    }
  };

  // --- IMMAGINI ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsProcessingImages(true);
    const files = Array.from(e.target.files);
    const listingId = formData.id || `temp-${Date.now()}`;
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const processedBase64 = await processImageSingle(file, {
            thumbnailWidth: 800, thumbnailHeight: 600, quality: 0.85, aspectRatio: 4 / 3,
          });
          const base64Data = processedBase64.replace(/^data:image\/\w+;base64,/, '');
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let j = 0; j < byteCharacters.length; j++) byteNumbers[j] = byteCharacters.charCodeAt(j);
          const blob = new Blob([new Uint8Array(byteNumbers)], { type: file.type });
          const fileName = `${listingId}/${formData.images.length + i}.${file.type.split('/')[1]}`;
          const { error: uploadError } = await supabase.storage.from('listing-images').upload(fileName, blob, {
            contentType: file.type, cacheControl: '31536000', upsert: true,
          });
          if (uploadError) { console.error('Errore upload:', uploadError); continue; }
          const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(fileName);
          uploadedUrls.push(urlData.publicUrl);
        } catch (error) {
          console.error('Errore processing:', error);
        }
      }
      if (uploadedUrls.length > 0) {
        setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
      }
    } finally {
      setIsProcessingImages(false);
    }
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const moveImageLeft = (index: number) => {
    if (index === 0) return;
    const newImages = [...formData.images];
    [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const moveImageRight = (index: number) => {
    if (index === formData.images.length - 1) return;
    const newImages = [...formData.images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  // --- FEATURES / RULES ---
  const addFeature = () => setFormData(prev => ({ ...prev, features: [...prev.features, ''] }));
  const updateFeature = (index: number, value: string) => {
    const f = [...formData.features]; f[index] = value;
    setFormData(prev => ({ ...prev, features: f }));
  };
  const removeFeature = (index: number) => setFormData(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));

  const addRule = () => setFormData(prev => ({ ...prev, rules: [...prev.rules, ''] }));
  const updateRule = (index: number, value: string) => {
    const r = [...formData.rules]; r[index] = value;
    setFormData(prev => ({ ...prev, rules: r }));
  };
  const removeRule = (index: number) => setFormData(prev => ({ ...prev, rules: prev.rules.filter((_, i) => i !== index) }));

  const generateSlots = async () => {
    if (!genStartDate || !genEndDate) {
      alert('Inserisci data inizio e fine.');
      return;
    }
    setIsGenerating(true);
    try {
      const start = new Date(genStartDate + 'T00:00:00');
      const end = new Date(genEndDate + 'T00:00:00');
      const slotsToInsert: any[] = [];
      const current = new Date(start);

      while (current <= end) {
        const dayOfWeek = current.getDay(); // 0=Dom, 6=Sab
        const shouldAdd =
          genFrequency === 'daily' ||
          (genFrequency === 'weekly' && genDays.includes(dayOfWeek)) ||
          (genFrequency === 'custom' && genDays.includes(dayOfWeek));

        if (shouldAdd) {
          slotsToInsert.push({
            listing_id: listing.id,
            date: current.toISOString().split('T')[0],
            end_date: current.toISOString().split('T')[0],
            start_time: genStartTime || null,
            end_time: genEndTime || null,
            max_participants: genMaxParticipants,
            booked_count: 0,
            status: 'active',
          });
        }
        current.setDate(current.getDate() + 1);
      }

      if (slotsToInsert.length === 0) {
        alert('Nessuno slot da generare con i parametri selezionati.');
        setIsGenerating(false);
        return;
      }

      const { data, error } = await supabase
        .from('experience_slots')
        .insert(slotsToInsert)
        .select('*');

      if (error) {
        console.error('Errore generazione slot:', error);
        alert('Errore nella generazione degli slot.');
      } else {
        setSlots(prev => [...prev, ...(data || [])]);
        setShowGenerator(false);
        alert(`✅ Generati ${slotsToInsert.length} slot con successo!`);
      }
    } catch (err) {
      console.error('Errore:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const previewSlotCount = () => {
    if (!genStartDate || !genEndDate) return 0;
    const start = new Date(genStartDate + 'T00:00:00');
    const end = new Date(genEndDate + 'T00:00:00');
    let count = 0;
    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (
        genFrequency === 'daily' ||
        ((genFrequency === 'weekly' || genFrequency === 'custom') && genDays.includes(dayOfWeek))
      ) count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  // --- SLOT MANAGEMENT ---
  const handleCalendarChange = async (start: Date | undefined, end: Date | undefined) => {
    setCalendarStart(start);
    setCalendarEnd(end);

    const toYMD = (d: Date) => d.toISOString().split('T')[0];
    const durationUnit = (formData as any).durationUnit;

    if (start && (end || durationUnit === 'ore')) {
      const startDate = toYMD(start);
      const endDate = end ? toYMD(end) : startDate;

      try {
        const { data, error } = await supabase
          .from('experience_slots')
          .insert({
            listing_id: listing.id,
            date: startDate,
            end_date: endDate,
            start_time: null,
            end_time: null,
            max_participants: formData.maxGuests || 10,
            booked_count: 0,
            status: 'active',
          })
          .select('*')
          .single();

        if (!error && data) {
          setSlots(prev => [...prev, data]);
        } else {
          console.error('Errore inserimento slot:', error);
        }
      } catch (err) {
        console.error('Errore inserimento slot:', err);
      }

      setCalendarStart(undefined);
      setCalendarEnd(undefined);
      setShowCalendar(false);
    }
  };

  const updateSlot = async (slotId: string, field: string, value: string | number | null) => {
    setSlots(prev => prev.map(s => s.id === slotId ? { ...s, [field]: value } : s));
    try {
      await supabase.from('experience_slots').update({ [field]: value }).eq('id', slotId);
    } catch (err) {
      console.error('Errore aggiornamento slot:', err);
    }
  };

  const deleteSlot = async (slotId: string) => {
    if (!confirm('Eliminare questo slot?')) return;
    try {
      await supabase.from('experience_slots').delete().eq('id', slotId);
      setSlots(prev => prev.filter(s => s.id !== slotId));
    } catch (err) {
      console.error('Errore eliminazione slot:', err);
    }
  };

  const toggleBadge = (badge: string) => {
    const badges = (formData as any).manualBadges || [];
    if (badges.includes(badge)) {
      setFormData({ ...formData, manualBadges: badges.filter((b: string) => b !== badge) } as any);
    } else {
      setFormData({ ...formData, manualBadges: [...badges, badge] } as any);
    }
  };

  const handleCitySelect = (value: string, suggestion?: CitySuggestion) => {
    setFormData(prev => ({
      ...prev,
      location: value,
      ...(suggestion ? { coordinates: { lat: suggestion.lat, lng: suggestion.lng } } : {}),
    }));
  };

  // =====================
  // RENDER
  // =====================
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={onCancel} className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-brand" /> Modifica Esperienza
              </h1>
              <p className="text-xs text-gray-500">{formData.title}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg text-sm">
              Annulla
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-brand hover:bg-brand-dark text-white font-bold rounded-lg shadow-md flex items-center text-sm"
            >
              {isSaving ? 'Salvataggio...' : 'Salva Modifiche'}
              {!isSaving && <Save className="w-4 h-4 ml-2" />}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex space-x-1 overflow-x-auto">
          {[
            { id: 'general', label: 'Info & Prezzi', icon: FileText },
            { id: 'slots', label: 'Slot & Date', icon: Calendar },
            { id: 'media', label: 'Galleria Foto', icon: Camera },
            { id: 'rules', label: 'Regole & Policy', icon: Shield },
            { id: 'location', label: 'Posizione', icon: MapPin },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center px-6 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* ===== TAB: GENERAL ===== */}
        {activeTab === 'general' && (
          <div className="space-y-6 animate-in fade-in">

            {/* Info principali */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Informazioni Principali</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none resize-none"
                />
              </div>
            </div>

            {/* Dettagli esperienza */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-brand" /> Dettagli Esperienza
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durata</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                      placeholder="Es. 3"
                      value={(formData as any).durationValue || ''}
                      onChange={e => setFormData({ ...formData, durationValue: e.target.value } as any)}
                    />
                    <select
                      className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-brand outline-none"
                      value={(formData as any).durationUnit || 'ore'}
                      onChange={e => setFormData({ ...formData, durationUnit: e.target.value } as any)}
                    >
                      <option value="ore">ore</option>
                      <option value="giorni">giorni</option>
                      <option value="settimane">settimane</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Partecipanti per Slot</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                    placeholder="Es. 10"
                    value={formData.maxGuests || ''}
                    onChange={e => setFormData({ ...formData, maxGuests: parseInt(e.target.value) || undefined })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lingua</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                    placeholder="Es. Italiano, Inglese"
                    value={(formData as any).languages || ''}
                    onChange={e => setFormData({ ...formData, languages: e.target.value } as any)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficoltà</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-brand outline-none"
                    value={(formData as any).difficulty || ''}
                    onChange={e => setFormData({ ...formData, difficulty: e.target.value } as any)}
                  >
                    <option value="">Seleziona...</option>
                    <option value="facile">🟢 Facile</option>
                    <option value="media">🟡 Media</option>
                    <option value="difficile">🔴 Difficile</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Età Minima</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                    placeholder="Es. 18"
                    value={(formData as any).minAge || ''}
                    onChange={e => setFormData({ ...formData, minAge: parseInt(e.target.value) || undefined } as any)}
                  />
                </div>
              </div>

              {/* Incluso / Non incluso */}
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">✅ Cosa è incluso</label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none resize-none"
                    rows={3}
                    placeholder="Es. Attrezzatura, Guida, Trasferimento..."
                    value={((formData as any).included || []).join(', ')}
                    onChange={e => setFormData({ ...formData, included: e.target.value.split(',').map((s: string) => s.trim()).filter((s: string) => s) } as any)}
                  />
                  <p className="text-xs text-gray-400 mt-1">Separa con una virgola</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">❌ Non incluso</label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none resize-none"
                    rows={3}
                    placeholder="Es. Volo, Alloggio, Assicurazione..."
                    value={((formData as any).notIncluded || []).join(', ')}
                    onChange={e => setFormData({ ...formData, notIncluded: e.target.value.split(',').map((s: string) => s.trim()).filter((s: string) => s) } as any)}
                  />
                  <p className="text-xs text-gray-400 mt-1">Separa con una virgola</p>
                </div>
              </div>
            </div>

            {/* Prezzi */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-brand" /> Prezzi
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prezzo (€)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-bold">€</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      className="w-full pl-8 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none font-bold"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Prezzo</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-brand outline-none"
                    value={(formData as any).priceType || 'persona'}
                    onChange={e => setFormData({ ...formData, priceType: e.target.value } as any)}
                  >
                    <option value="persona">A persona</option>
                    <option value="gruppo">Per il gruppo intero</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costo Extra (€)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-bold">€</span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full pl-8 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                      placeholder="0.00"
                      value={(formData as any).cleaningFee || ''}
                      onChange={e => setFormData({ ...formData, cleaningFee: parseFloat(e.target.value) || 0 } as any)}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Es. Biglietto ingresso, materiali...</p>
                </div>
              </div>
            </div>

            {/* Caratteristiche */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Caratteristiche</h3>
                <button onClick={addFeature} className="flex items-center text-sm text-brand font-medium hover:underline">
                  <Plus className="w-4 h-4 mr-1" /> Aggiungi
                </button>
              </div>
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={e => updateFeature(index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none text-sm"
                      placeholder="Es. Guida certificata"
                    />
                    <button onClick={() => removeFeature(index)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {formData.features.length === 0 && (
                  <p className="text-sm text-gray-400 italic">Nessuna caratteristica aggiunta</p>
                )}
              </div>
            </div>

            {/* Badge */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Badge Speciali</h3>
              <div className="flex flex-wrap gap-3">
                {['Offerta', 'Last Minute', 'Premium', 'Novità'].map(badge => (
                  <button
                    key={badge}
                    onClick={() => toggleBadge(badge)}
                    className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
                      ((formData as any).manualBadges || []).includes(badge)
                        ? 'bg-brand text-white border-brand'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {badge}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB: SLOTS ===== */}
        {activeTab === 'slots' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand" /> Slot Disponibili
                </h3>
                <div className="flex gap-2">
                <button
                  onClick={() => { setShowGenerator(!showGenerator); setShowCalendar(false); }}
                  className="flex items-center bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
                >
                  ⚡ Genera Automaticamente
                </button>
                <button
                  onClick={() => { setShowCalendar(!showCalendar); setShowGenerator(false); }}
                  className="flex items-center bg-brand text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-dark transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" /> Aggiungi Slot
                </button>
              </div>
              </div>

              {/* Generatore Automatico */}
              {showGenerator && (
                <div className="mb-6 bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    ⚡ Genera Slot Automaticamente
                  </h4>

                  {/* Frequenza */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Frequenza</label>
                    <div className="flex gap-2">
                      {[
                        { id: 'daily', label: 'Ogni giorno' },
                        { id: 'weekly', label: 'Giorni specifici' },
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setGenFrequency(f.id as any)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                            genFrequency === f.id ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-gray-200'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Giorni settimana */}
                  {genFrequency !== 'daily' && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-xs font-medium text-gray-700">Giorni della settimana</label>
                        <div className="relative group">
                          <div className="w-4 h-4 rounded-full bg-gray-300 text-white text-[10px] flex items-center justify-center cursor-pointer font-bold">i</div>
                          <div className="absolute left-0 bottom-6 w-64 bg-gray-800 text-white text-xs rounded-xl p-3 hidden group-hover:block z-50 shadow-lg">
                            Seleziona i giorni della settimana in cui l'esperienza sarà disponibile. Verranno generati slot solo per i giorni selezionati nel periodo indicato.
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map((day, idx) => (
                          <button
                            key={idx}
                            onClick={() => setGenDays(prev =>
                              prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]
                            )}
                            className={`w-10 h-10 rounded-full text-xs font-bold border transition-colors ${
                              genDays.includes(idx) ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-gray-200'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Date */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="block text-xs font-medium text-gray-700">Periodo disponibilità</label>
                      <div className="relative group">
                        <div className="w-4 h-4 rounded-full bg-gray-300 text-white text-[10px] flex items-center justify-center cursor-pointer font-bold">i</div>
                        <div className="absolute left-0 bottom-6 w-64 bg-gray-800 text-white text-xs rounded-xl p-3 hidden group-hover:block z-50 shadow-lg">
                          Indica il periodo in cui vuoi rendere disponibile l'esperienza. Gli slot verranno generati automaticamente nei giorni selezionati all'interno di questo intervallo.
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Data Inizio</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                        value={genStartDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => setGenStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Data Fine</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                        value={genEndDate}
                        min={genStartDate || new Date().toISOString().split('T')[0]}
                        onChange={e => setGenEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                  </div>

                  {/* Orari */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Orario Inizio</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white"
                        value={genStartTime}
                        onChange={e => setGenStartTime(e.target.value)}
                      >
                        <option value="">-- Nessuno --</option>
                        {Array.from({ length: 48 }, (_, i) => {
                          const h = Math.floor(i / 2).toString().padStart(2, '0');
                          const m = i % 2 === 0 ? '00' : '30';
                          return <option key={`${h}:${m}`} value={`${h}:${m}`}>{`${h}:${m}`}</option>;
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Orario Fine</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white"
                        value={genEndTime}
                        onChange={e => setGenEndTime(e.target.value)}
                      >
                        <option value="">-- Nessuno --</option>
                        {Array.from({ length: 48 }, (_, i) => {
                          const h = Math.floor(i / 2).toString().padStart(2, '0');
                          const m = i % 2 === 0 ? '00' : '30';
                          return <option key={`${h}:${m}`} value={`${h}:${m}`}>{`${h}:${m}`}</option>;
                        })}
                      </select>
                    </div>
                  </div>

                  {/* Max partecipanti */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Max Partecipanti per Slot</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                      value={genMaxParticipants}
                      min={1}
                      onChange={e => setGenMaxParticipants(parseInt(e.target.value) || 1)}
                    />
                  </div>

                  {/* Preview + Genera */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    {genStartDate && genEndDate && (
                      <p className="text-sm text-gray-600">
                        Genererà <span className="font-bold text-brand">{previewSlotCount()} slot</span>
                      </p>
                    )}
                    <button
                      onClick={generateSlots}
                      disabled={isGenerating || !genStartDate || !genEndDate}
                      className="ml-auto flex items-center bg-brand text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-brand-dark transition-colors disabled:opacity-50"
                    >
                      {isGenerating ? 'Generando...' : '⚡ Genera Slot'}
                    </button>
                  </div>
                </div>
              )}

              {/* Calendario */}
              {showCalendar && (
                <div className="flex justify-center mb-6 overflow-x-auto">
                  <AirbnbCalendar
                    selectedStart={calendarStart}
                    selectedEnd={calendarEnd}
                    onChange={handleCalendarChange}
                    onClose={() => setShowCalendar(false)}
                    compact={true}
                  />
                </div>
              )}

              {isLoadingSlots ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 text-brand animate-spin" />
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
                  <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Nessuno slot. Clicca "Aggiungi Slot" per iniziare.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {slots.map((slot, idx) => {
                    const available = slot.max_participants - slot.booked_count;
                    const startDate = new Date(slot.date + 'T00:00:00');
                    const dateStr = startDate.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
                    const endDateStr = slot.end_date && slot.end_date !== slot.date
                      ? ` → ${new Date(slot.end_date + 'T00:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}`
                      : '';

                    return (
                      <div key={slot.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-sm font-bold text-gray-900">Slot #{idx + 1}</span>
                            <span className="text-sm text-brand ml-2">{dateStr}{endDateStr}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                              slot.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                              available === 0 ? 'bg-orange-100 text-orange-600' :
                              'bg-green-100 text-green-600'
                            }`}>
                              {slot.status === 'cancelled' ? 'Annullato' : `${available} posti liberi`}
                            </span>
                            <button
                              onClick={() => deleteSlot(slot.id)}
                              className="text-red-400 hover:text-red-600 transition-colors p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Orario Inizio</label>
                            <select
                              className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm"
                              value={slot.start_time || ''}
                              onChange={e => updateSlot(slot.id, 'start_time', e.target.value || null)}
                            >
                              <option value="">--</option>
                              {Array.from({ length: 48 }, (_, i) => {
                                const hour = Math.floor(i / 2);
                                const minute = i % 2 === 0 ? '00' : '30';
                                const time = `${hour.toString().padStart(2, '0')}:${minute}`;
                                return <option key={time} value={time}>{time}</option>;
                              })}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Orario Fine</label>
                            <select
                              className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm"
                              value={slot.end_time || ''}
                              onChange={e => updateSlot(slot.id, 'end_time', e.target.value || null)}
                            >
                              <option value="">--</option>
                              {Array.from({ length: 48 }, (_, i) => {
                                const hour = Math.floor(i / 2);
                                const minute = i % 2 === 0 ? '00' : '30';
                                const time = `${hour.toString().padStart(2, '0')}:${minute}`;
                                return <option key={time} value={time}>{time}</option>;
                              })}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Max Partecipanti</label>
                            <input
                              type="number"
                              className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm"
                              value={slot.max_participants}
                              min={slot.booked_count}
                              onChange={e => updateSlot(slot.id, 'max_participants', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Stato</label>
                            <select
                              className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm"
                              value={slot.status}
                              onChange={e => updateSlot(slot.id, 'status', e.target.value)}
                            >
                              <option value="active">Attivo</option>
                              <option value="cancelled">Annullato</option>
                            </select>
                          </div>
                        </div>
                        {slot.booked_count > 0 && (
                          <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                            <Users className="w-3 h-3" /> {slot.booked_count} prenotazioni confermate
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== TAB: MEDIA ===== */}
        {activeTab === 'media' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Galleria Foto</h3>
              <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleImageUpload} disabled={isProcessingImages} />
              <div
                onClick={!isProcessingImages ? () => fileInputRef.current?.click() : undefined}
                className={`border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center mb-6 ${isProcessingImages ? 'cursor-wait bg-gray-50' : 'cursor-pointer hover:bg-gray-50'}`}
              >
                {isProcessingImages ? (
                  <><Loader2 className="w-10 h-10 text-brand mx-auto mb-3 animate-spin" /><p className="text-gray-500 text-sm">Ottimizzazione...</p></>
                ) : (
                  <><Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" /><p className="font-medium text-gray-700">Clicca per caricare foto</p><p className="text-xs text-gray-400 mt-1">Le foto vengono ottimizzate automaticamente</p></>
                )}
              </div>
              {formData.images.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden group">
                      <img src={img} alt={`Foto ${idx}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all">
                        {idx > 0 && (
                          <button onClick={() => moveImageLeft(idx)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/95 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow">
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                        )}
                        {idx < formData.images.length - 1 && (
                          <button onClick={() => moveImageRight(idx)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/95 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => removeImage(idx)} className="absolute top-2 right-2 bg-white/95 p-1.5 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow">
                          <X className="w-4 h-4" />
                        </button>
                        {idx === 0 && (
                          <div className="absolute bottom-0 left-0 w-full bg-black/60 text-white text-xs text-center py-1">Copertina</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center italic">Nessuna foto caricata</p>
              )}
            </div>
          </div>
        )}

        {/* ===== TAB: RULES ===== */}
        {activeTab === 'rules' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Regole & Requisiti</h3>
                <button onClick={addRule} className="flex items-center text-sm text-brand font-medium hover:underline">
                  <Plus className="w-4 h-4 mr-1" /> Aggiungi
                </button>
              </div>
              <div className="space-y-2">
                {formData.rules.map((rule, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={rule}
                      onChange={e => updateRule(index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none text-sm"
                      placeholder="Es. Età minima 18 anni"
                    />
                    <button onClick={() => removeRule(index)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {formData.rules.length === 0 && (
                  <p className="text-sm text-gray-400 italic">Nessuna regola aggiunta</p>
                )}
              </div>
            </div>

            {/* Policy cancellazione */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Politica di Cancellazione</h3>
              <div className="space-y-3">
                {[
                  { id: 'flexible', label: 'Flessibile', desc: 'Rimborso 100% fino a 24h prima.', color: 'green' },
                  { id: 'moderate', label: 'Moderata', desc: 'Rimborso 100% fino a 5gg prima.', color: 'yellow' },
                  { id: 'strict', label: 'Rigida', desc: 'Rimborso 50% fino a 7gg prima.', color: 'red' },
                ].map(policy => (
                  <div
                    key={policy.id}
                    onClick={() => setFormData({ ...formData, cancellationPolicy: policy.id as CancellationPolicyType })}
                    className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                      formData.cancellationPolicy === policy.id ? 'border-brand bg-brand/5' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 bg-${policy.color}-500`}></span>
                        <h4 className="font-bold text-gray-900">{policy.label}</h4>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 pl-4">{policy.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.cancellationPolicy === policy.id ? 'border-brand' : 'border-gray-300'}`}>
                      {formData.cancellationPolicy === policy.id && <div className="w-2.5 h-2.5 bg-brand rounded-full"></div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB: LOCATION ===== */}
        {activeTab === 'location' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand" /> Posizione Pubblica
              </h3>
              <CityAutocomplete
                value={formData.location}
                onChange={handleCitySelect}
                label="Città / Zona"
                required
                placeholder="Cerca una città italiana..."
                helperText="Visibile nell'annuncio pubblico."
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione Zona</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none resize-none"
                  rows={2}
                  placeholder="Descrivi i dintorni, come arrivare..."
                  value={formData.zoneDescription || ''}
                  onChange={e => setFormData({ ...formData, zoneDescription: e.target.value })}
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 space-y-4">
              <div className="flex items-start">
                <Home className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-blue-900">Punto di Ritrovo (Privato)</h4>
                  <p className="text-xs text-blue-700">Visibile solo dopo la conferma della prenotazione.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Via e Numero Civico</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-brand outline-none"
                    placeholder="Es. Piazza del Duomo 1"
                    value={formData.pickupAddress || ''}
                    onChange={e => setFormData({ ...formData, pickupAddress: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Città</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-brand outline-none"
                    placeholder="Es. Milano"
                    value={formData.pickupCity || ''}
                    onChange={e => setFormData({ ...formData, pickupCity: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Indicazioni di Ritrovo</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-brand outline-none resize-none"
                  rows={2}
                  placeholder="Es. Ritrovo davanti alla fontana. Parcheggio nelle vicinanze."
                  value={formData.pickupInstructions || ''}
                  onChange={e => setFormData({ ...formData, pickupInstructions: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
