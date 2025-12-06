import React, { useState, useEffect } from 'react';
import { Listing, CancellationPolicyType, ListingCategory } from '../types';
import { 
  Save, ArrowLeft, Camera, Upload, MapPin, DollarSign, 
  FileText, Shield, Plus, X, Clock, Users, Home, Loader2, Search
} from 'lucide-react';
import { searchItalianCities, CitySuggestion } from '../services/geocodingService';
import { processImageSingle } from '../utils/imageProcessing';
import { supabase } from '../lib/supabase';

interface HubberListingEditorProps {
  listing: Listing;
  onSave: (updatedListing: Listing) => void;
  onCancel: () => void;
}

type Tab = 'general' | 'media' | 'rules' | 'location';

export const HubberListingEditor: React.FC<HubberListingEditorProps> = ({ listing, onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [formData, setFormData] = useState<Listing>({ ...listing });
  const [isSaving, setIsSaving] = useState(false);
  
  // 🖼️ Stato per il processing delle immagini
  const [isProcessingImages, setIsProcessingImages] = useState(false);

  // --- AUTOCOMPLETE CITTÀ ---
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleCityInput = (value: string) => {
    setFormData({ ...formData, location: value });
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length < 2) {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      return;
    }

    setIsSearchingCity(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchItalianCities(value);
        setCitySuggestions(results);
        setShowCitySuggestions(results.length > 0);
      } catch (error) {
        console.error('Errore ricerca città:', error);
        setCitySuggestions([]);
      } finally {
        setIsSearchingCity(false);
      }
    }, 300);
  };

  const selectCity = (suggestion: CitySuggestion) => {
    setFormData({ ...formData, location: suggestion.displayName });
    setShowCitySuggestions(false);
    setCitySuggestions([]);
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      onSave(formData);
      setIsSaving(false);
    }, 1000);
  };

  // --- 🖼️ UPLOAD IMMAGINI SU SUPABASE STORAGE ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsProcessingImages(true);
    const files = Array.from(e.target.files);

    // Genera ID temporaneo o usa l'ID del listing esistente
    const listingId = formData.id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          // 1. Processa l'immagine (ridimensiona, croppa, comprimi)
          const processedBase64 = await processImageSingle(file, {
            thumbnailWidth: 800,
            thumbnailHeight: 600,
            quality: 0.85,
            aspectRatio: 4 / 3,
          });

          // 2. Converti base64 in Blob
          const base64Data = processedBase64.replace(/^data:image\/\w+;base64,/, '');
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let j = 0; j < byteCharacters.length; j++) {
            byteNumbers[j] = byteCharacters.charCodeAt(j);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: file.type });

          // 3. Upload su Storage
          const fileName = `${listingId}/${formData.images.length + i}.${file.type.split('/')[1]}`;
          const { error: uploadError } = await supabase.storage
            .from('listing-images')
            .upload(fileName, blob, {
              contentType: file.type,
              cacheControl: '31536000',
              upsert: true
            });

          if (uploadError) {
            console.error('Errore upload immagine:', uploadError);
            continue;
          }

          // 4. Ottieni URL pubblico
          const { data: urlData } = supabase.storage
            .from('listing-images')
            .getPublicUrl(fileName);

          uploadedUrls.push(urlData.publicUrl);
        } catch (error) {
          console.error('Errore processing immagine:', error);
        }
      }

      // Aggiungi gli URL delle immagini allo stato
      if (uploadedUrls.length > 0) {
        setFormData(prev => ({ 
          ...prev, 
          images: [...prev.images, ...uploadedUrls] 
        }));
      }
    } finally {
      setIsProcessingImages(false);
    }
    
    // Reset input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addFeature = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ""] }));
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
  };

  const addRule = () => {
    setFormData(prev => ({ ...prev, rules: [...prev.rules, ""] }));
  };

  const updateRule = (index: number, value: string) => {
    const newRules = [...formData.rules];
    newRules[index] = value;
    setFormData(prev => ({ ...prev, rules: newRules }));
  };

  const removeRule = (index: number) => {
    setFormData(prev => ({ ...prev, rules: prev.rules.filter((_, i) => i !== index) }));
  };

  // --- BADGE MANUALI ---
  const toggleBadge = (badge: string) => {
    const badges = (formData as any).manualBadges || [];
    if (badges.includes(badge)) {
      setFormData({ ...formData, manualBadges: badges.filter((b: string) => b !== badge) } as any);
    } else {
      setFormData({ ...formData, manualBadges: [...badges, badge] } as any);
    }
  };

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
              <h1 className="text-xl font-bold text-gray-900">Modifica Annuncio</h1>
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
            { id: 'media', label: 'Galleria Foto', icon: Camera },
            { id: 'rules', label: 'Regole & Policy', icon: Shield },
            { id: 'location', label: 'Posizione & Dettagli', icon: MapPin },
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
        
        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Informazioni Principali</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
                  <input 
                    type="text" 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value as ListingCategory})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none bg-white"
                  >
                    <option value="oggetto">Oggetto</option>
                    <option value="spazio">Spazio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sottocategoria</label>
                  <input 
                    type="text" 
                    value={formData.subCategory}
                    onChange={e => setFormData({...formData, subCategory: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                  <textarea 
                    rows={5}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Prezzi</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prezzo (€)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input 
                      type="number" 
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                      className="w-full pl-9 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Per unità</label>
                  <select 
                    value={formData.priceUnit}
                    onChange={e => setFormData({...formData, priceUnit: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none bg-white"
                  >
                    <option value="ora">Ora</option>
                    <option value="giorno">Giorno</option>
                    <option value="settimana">Settimana</option>
                    <option value="mese">Mese</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MEDIA TAB */}
        {activeTab === 'media' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6 animate-in fade-in">
             <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Galleria Fotografica</h3>
                <label className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors ${
                  isProcessingImages 
                    ? 'bg-gray-100 text-gray-400 cursor-wait' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}>
                   {isProcessingImages ? (
                     <>
                       <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Ottimizzazione...
                     </>
                   ) : (
                     <>
                       <Upload className="w-4 h-4 mr-2" /> Carica Foto
                     </>
                   )}
                   <input 
                     type="file" 
                     multiple 
                     className="hidden" 
                     onChange={handleImageUpload} 
                     accept="image/*" 
                     disabled={isProcessingImages}
                   />
                </label>
             </div>

             {/* Loader durante il processing */}
             {isProcessingImages && (
               <div className="flex items-center justify-center py-4 text-brand bg-brand/5 rounded-xl">
                 <Loader2 className="w-5 h-5 animate-spin mr-2" />
                 <span className="text-sm font-medium">Ottimizzazione immagini in corso...</span>
               </div>
             )}

             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((img, idx) => (
                   <div key={idx} className="relative aspect-[4/3] group rounded-xl overflow-hidden border border-gray-200">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {idx === 0 && <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 text-center">Copertina</div>}
                   </div>
                ))}
                <label className={`aspect-[4/3] rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center transition-all ${
                  isProcessingImages 
                    ? 'text-gray-300 cursor-wait' 
                    : 'text-gray-400 hover:border-brand hover:text-brand hover:bg-brand/5 cursor-pointer'
                }`}>
                   {isProcessingImages ? (
                     <Loader2 className="w-8 h-8 animate-spin" />
                   ) : (
                     <>
                       <Plus className="w-8 h-8 mb-2" />
                       <span className="text-xs font-bold">Aggiungi</span>
                     </>
                   )}
                   <input 
                     type="file" 
                     multiple 
                     className="hidden" 
                     onChange={handleImageUpload} 
                     accept="image/*" 
                     disabled={isProcessingImages}
                   />
                </label>
             </div>
             <p className="text-xs text-gray-500">Le foto vengono ottimizzate automaticamente per una visualizzazione perfetta.</p>
          </div>
        )}

        {/* RULES TAB */}
        {activeTab === 'rules' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
               <h3 className="text-lg font-bold text-gray-900">Cosa troverai (Dotazioni)</h3>
               <div className="space-y-3">
                  {formData.features.map((feat, i) => (
                     <div key={i} className="flex gap-2">
                        <input 
                          type="text" 
                          value={feat}
                          onChange={(e) => updateFeature(i, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                          placeholder="Es. WiFi, Parcheggio..."
                        />
                        <button onClick={() => removeFeature(i)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                           <X className="w-5 h-5" />
                        </button>
                     </div>
                  ))}
                  <button onClick={addFeature} className="text-brand font-bold text-sm flex items-center mt-2">
                     <Plus className="w-4 h-4 mr-1" /> Aggiungi dotazione
                  </button>
               </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
               <h3 className="text-lg font-bold text-gray-900">Regole dell'Host</h3>
               <div className="space-y-3">
                  {formData.rules.map((rule, i) => (
                     <div key={i} className="flex gap-2">
                        <input 
                          type="text" 
                          value={rule}
                          onChange={(e) => updateRule(i, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                          placeholder="Es. Vietato fumare..."
                        />
                        <button onClick={() => removeRule(i)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                           <X className="w-5 h-5" />
                        </button>
                     </div>
                  ))}
                  <button onClick={addRule} className="text-brand font-bold text-sm flex items-center mt-2">
                     <Plus className="w-4 h-4 mr-1" /> Aggiungi regola
                  </button>
               </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
               <h3 className="text-lg font-bold text-gray-900">Politiche</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Cancellazione</label>
                     <select 
                       value={formData.cancellationPolicy}
                       onChange={(e) => setFormData({...formData, cancellationPolicy: e.target.value as CancellationPolicyType})}
                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none bg-white"
                     >
                        <option value="flexible">Flessibile (24h)</option>
                        <option value="moderate">Moderata (5gg)</option>
                        <option value="strict">Rigida (7gg)</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Cauzione (€)</label>
                     <input 
                       type="number" 
                       value={formData.deposit || ''}
                       onChange={(e) => setFormData({...formData, deposit: parseFloat(e.target.value)})}
                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                       placeholder="0"
                     />
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* LOCATION & DETAILS TAB */}
        {activeTab === 'location' && (
           <div className="space-y-6 animate-in fade-in">
              {/* Posizione pubblica */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                 <h3 className="text-lg font-bold text-gray-900">Posizione Pubblica</h3>
                 <p className="text-xs text-gray-500 -mt-2">Questa informazione sarà visibile nell'annuncio.</p>
                 
                 <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Città / Zona *</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {isSearchingCity ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </div>
                      <input 
                        type="text" 
                        value={formData.location}
                        onChange={(e) => handleCityInput(e.target.value)}
                        onFocus={() => citySuggestions.length > 0 && setShowCitySuggestions(true)}
                        onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                        placeholder="Cerca una città italiana..."
                        className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                        autoComplete="off"
                      />
                    </div>
                    
                    {/* Dropdown suggerimenti */}
                    {showCitySuggestions && citySuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {citySuggestions.map((suggestion, idx) => (
                          <button
                            key={`${suggestion.city}-${idx}`}
                            type="button"
                            onMouseDown={() => selectCity(suggestion)}
                            className={`w-full px-4 py-3 text-left flex items-center text-sm transition-colors hover:bg-gray-50 ${
                              idx === 0 ? 'rounded-t-xl' : ''
                            } ${idx === citySuggestions.length - 1 ? 'rounded-b-xl' : ''}`}
                          >
                            <MapPin className="w-4 h-4 mr-3 text-gray-400" />
                            <div>
                              <span className="font-medium">{suggestion.city}</span>
                              {suggestion.province && (
                                <span className="text-gray-500 ml-1">({suggestion.province})</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione Zona / Quartiere</label>
                    <textarea 
                       rows={3}
                       value={(formData as any).zoneDescription || ''}
                       onChange={(e) => setFormData({...formData, zoneDescription: e.target.value} as any)}
                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                       placeholder="Descrivi i dintorni, i parcheggi, i mezzi pubblici..."
                    />
                 </div>
              </div>

              {/* Indirizzo privato (ritiro/spazio) */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 space-y-4">
                <div className="flex items-start mb-2">
                  <Home className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-bold text-blue-900">
                      {formData.category === 'spazio' ? 'Indirizzo dello Spazio' : 'Indirizzo di Ritiro'}
                    </h3>
                    <p className="text-xs text-blue-700">Sarà visibile al renter solo dopo la conferma della prenotazione.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Via e Numero Civico</label>
                    <input 
                      type="text" 
                      value={(formData as any).pickupAddress || ''}
                      onChange={(e) => setFormData({...formData, pickupAddress: e.target.value} as any)}
                      placeholder="Es. Via Roma 24"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Città</label>
                    <input 
                      type="text" 
                      value={(formData as any).pickupCity || ''}
                      onChange={(e) => setFormData({...formData, pickupCity: e.target.value} as any)}
                      placeholder="Es. Milano"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.category === 'spazio' ? 'Indicazioni per raggiungere lo spazio' : 'Istruzioni per il Ritiro'}
                  </label>
                  <textarea 
                    rows={2}
                    value={(formData as any).pickupInstructions || ''}
                    onChange={(e) => setFormData({...formData, pickupInstructions: e.target.value} as any)}
                    placeholder={formData.category === 'spazio' 
                      ? "Es. Ingresso dal cortile interno, citofono 'Sala Eventi'. Parcheggio disponibile."
                      : "Es. Citofono Rossi, 2° piano. Parcheggio disponibile nel cortile."
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none bg-white"
                  />
                </div>
              </div>

              {/* Extra Details based on Category */}
              {formData.category === 'spazio' && (
                 <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="text-lg font-bold text-gray-900">Dettagli Spazio</h3>
                    <div className="grid grid-cols-2 gap-6">
                       <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Ospiti Massimi</label>
                          <div className="relative">
                             <Users className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                             <input 
                               type="number" 
                               value={(formData as any).maxGuests || ''}
                               onChange={(e) => setFormData({...formData, maxGuests: parseInt(e.target.value)} as any)}
                               className="w-full pl-9 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                               placeholder="Es. 50"
                             />
                          </div>
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Orari Apertura</label>
                          <div className="relative">
                             <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                             <input 
                               type="text" 
                               value={(formData as any).openingHours || ''}
                               onChange={(e) => setFormData({...formData, openingHours: e.target.value} as any)}
                               className="w-full pl-9 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                               placeholder="Es. 09:00 - 23:00"
                             />
                          </div>
                       </div>
                    </div>
                 </div>
              )}

              {/* Badge Manuali */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                 <h3 className="text-lg font-bold text-gray-900">Badge Speciali</h3>
                 <p className="text-xs text-gray-500 -mt-2">Seleziona badge per evidenziare il tuo annuncio.</p>
                 <div className="flex flex-wrap gap-3">
                    {['Offerta', 'Last Minute', 'Premium', 'Novità'].map(badge => (
                       <button
                          key={badge}
                          type="button"
                          onClick={() => toggleBadge(badge)}
                          className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
                             (formData as any).manualBadges?.includes(badge) 
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

      </div>
    </div>
  );
};