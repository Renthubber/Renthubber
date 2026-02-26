import React, { useState, useEffect } from 'react';
import { Listing, CancellationPolicyType, ListingCategory } from '../types';
import { 
  Save, ArrowLeft, Camera, Upload, MapPin, DollarSign, 
  FileText, Shield, Plus, X, Clock, Users, Home, Loader2, Search, ChevronLeft, ChevronRight
} from 'lucide-react';
import { searchItalianCities, CitySuggestion } from '../services/geocodingService';
import { processImageSingle } from '../utils/imageProcessing';
import { supabase } from "../services/supabaseClient";
import { CityAutocomplete } from '../components/CityAutocomplete';

const ALLOGGIO_SUBCATEGORIES = [
  'stanza-singola', 'stanza-doppia', 'posto-letto',
  'monolocale', 'bilocale', 'trilocale',
  'appartamento-condiviso'
];

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

const handleSave = async () => {
  setIsSaving(true);
  
  // Validazione prezzo
  const price = typeof formData.price === 'string' ? parseFloat(formData.price) : formData.price;
  if (!price || price <= 0) {
    alert('Il prezzo deve essere maggiore di 0€');
    setIsSaving(false);
    return;
  }
  
// Validazione foto
if (!formData.images || formData.images.length === 0) {
  alert('Devi caricare almeno una foto per salvare l\'annuncio');
  setIsSaving(false);
  return;
}

// Validazione coordinate (località selezionata dal dropdown)
  if (!formData.coordinates?.lat || !formData.coordinates?.lng) {
    alert('Seleziona una città dal menu a tendina per aggiornare la posizione.');
    setIsSaving(false);
    return;
  }

  try {
    const dataToSave = {
      ...formData,
      price: typeof formData.price === 'string' ? parseFloat(formData.price) || 0 : formData.price,
      deposit: typeof formData.deposit === 'string' ? parseFloat(formData.deposit as any) || 0 : formData.deposit,
      cleaningFee: typeof (formData as any).cleaningFee === 'string' ? parseFloat((formData as any).cleaningFee) || 0 : (formData as any).cleaningFee
    };

    console.log('💾 Salvando listing su Supabase:', dataToSave.id);

    const { error } = await supabase
      .from('listings')
      .update({
        title: dataToSave.title,
        description: dataToSave.description,
        category: dataToSave.category,
        sub_category: dataToSave.subCategory,
        price: dataToSave.price,
        price_unit: dataToSave.priceUnit,
        deposit: dataToSave.deposit,
        location: dataToSave.location,
        lat: dataToSave.coordinates?.lat ?? null,
        lng: dataToSave.coordinates?.lng ?? null,
        images: dataToSave.images,
        features: dataToSave.features,
        rules: dataToSave.rules,
        cancellation_policy: dataToSave.cancellationPolicy,
        cleaning_fee: dataToSave.cleaningFee,
        pickup_address: dataToSave.pickupAddress,
        pickup_city: dataToSave.pickupCity,
        pickup_instructions: dataToSave.pickupInstructions,
        zone_description: dataToSave.zoneDescription,
        max_guests: dataToSave.maxGuests,
        opening_hours: dataToSave.openingHours,
        closing_hours: dataToSave.closingHours,
        bedrooms: (dataToSave as any).alloggioSpecs?.bedrooms ?? null,
        bathrooms: (dataToSave as any).alloggioSpecs?.bathrooms ?? null,
        furnished: (dataToSave as any).alloggioSpecs?.furnished || null,
        utilities_included: (dataToSave as any).alloggioSpecs?.utilitiesIncluded || null,
        min_stay_months: (dataToSave as any).alloggioSpecs?.minStayMonths ?? null
      })
      .eq('id', dataToSave.id);

    if (error) {
      console.error('❌ Errore aggiornamento listing:', error);
      alert('Errore nel salvataggio. Riprova.');
      setIsSaving(false);
      return;
    }
    
    onSave(dataToSave);
    
    setIsSaving(false);
  } catch (err) {
    console.error('❌ Errore salvataggio:', err);
    alert('Errore nel salvataggio. Riprova.');
    setIsSaving(false);
  }
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

  // 🔄 Funzioni per spostare foto con frecce
  const moveImageLeft = (index: number) => {
    if (index === 0) return; // Già alla prima posizione
    
    const newImages = [...formData.images];
    const temp = newImages[index];
    newImages[index] = newImages[index - 1];
    newImages[index - 1] = temp;
    
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const moveImageRight = (index: number) => {
    if (index === formData.images.length - 1) return; // Già all'ultima posizione
    
    const newImages = [...formData.images];
    const temp = newImages[index];
    newImages[index] = newImages[index + 1];
    newImages[index + 1] = temp;
    
    setFormData(prev => ({
      ...prev,
      images: newImages
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
                  <select
                    value={formData.subCategory}
                    onChange={e => setFormData({...formData, subCategory: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none bg-white"
                  >
                    <option value="">Seleziona...</option>
                    {formData.category === 'oggetto' ? (
                      <>
                        <optgroup label="🏠 CASA & AMBIENTE">
                          <option value="casa">Casa & Arredamento</option>
                          <option value="cucina">Cucina & Elettrodomestici</option>
                          <option value="giardino">Giardino & Esterni</option>
                          <option value="pulizia">Pulizia & Igiene</option>
                          <option value="riscaldamento">Riscaldamento</option>
                          <option value="raffrescamento">Raffrescamento & Climatizzazione</option>
                          <option value="illuminazione">Illuminazione</option>
                          <option value="sicurezza">Sicurezza & Antifurti</option>
                        </optgroup>
                        <optgroup label="🔧 FAI DA TE & LAVORO">
                          <option value="fai-da-te">Fai da te & Bricolage</option>
                          <option value="attrezzature">Attrezzature Professionali</option>
                          <option value="strumenti">Strumenti & Utensili</option>
                          <option value="edilizia">Edilizia & Ristrutturazione</option>
                          <option value="carpenteria">Carpenteria & Falegnameria</option>
                          <option value="pittura">Pittura & Decorazione</option>
                          <option value="ufficio">Ufficio & Coworking</option>
                        </optgroup>
                        <optgroup label="💻 ELETTRONICA & MULTIMEDIA">
                          <option value="elettronica">Elettronica & Tecnologia</option>
                          <option value="fotografia">Fotografia</option>
                          <option value="video">Video & Riprese</option>
                          <option value="audio">Audio & Registrazione</option>
                          <option value="musica">Musica & Strumenti</option>
                          <option value="gaming">Gaming & Console</option>
                          <option value="droni">Droni & Modellismo</option>
                        </optgroup>
                        <optgroup label="⚽ SPORT & TEMPO LIBERO">
                          <option value="sport">Sport & Fitness</option>
                          <option value="fitness">Palestra & Attrezzi</option>
                          <option value="ciclismo">Bici & Ciclismo</option>
                          <option value="sport-acquatici">Sport Acquatici</option>
                          <option value="sport-invernali">Sport Invernali</option>
                          <option value="campeggio">Campeggio & Outdoor</option>
                          <option value="pesca">Pesca & Caccia</option>
                          <option value="tempo-libero">Tempo Libero</option>
                          <option value="hobby">Hobby & Creatività</option>
                        </optgroup>
                        <optgroup label="🎉 EVENTI & INTRATTENIMENTO">
                          <option value="party">Party & Feste</option>
                          <option value="decorazioni">Decorazioni & Allestimenti</option>
                          <option value="matrimoni">Matrimoni & Cerimonie</option>
                          <option value="gonfiabili">Gonfiabili & Giochi</option>
                          <option value="costumi">Costumi & Carnevale</option>
                          <option value="teatro">Teatro & Spettacoli</option>
                        </optgroup>
                        <optgroup label="👔 ABBIGLIAMENTO & ACCESSORI">
                          <option value="abbigliamento">Abbigliamento & Moda</option>
                          <option value="abbigliamento-formale">Abiti Eleganti & Formali</option>
                          <option value="abbigliamento-sportivo">Abbigliamento Sportivo</option>
                          <option value="scarpe">Scarpe & Calzature</option>
                          <option value="borse">Borse & Valigie</option>
                          <option value="gioielli">Gioielli & Accessori</option>
                        </optgroup>
                        <optgroup label="🍽️ RISTORAZIONE & CATERING">
                          <option value="ristorazione">Ristorazione & Catering</option>
                          <option value="attrezzature-cucina">Attrezzature da Cucina Pro</option>
                          <option value="servizio-tavola">Servizio Tavola & Bicchieri</option>
                          <option value="bar">Bar & Cocktail</option>
                        </optgroup>
                        <optgroup label="👶 FAMIGLIA & BAMBINI">
                          <option value="pre-maman">Gravidanza & Pre-maman</option>
                          <option value="neonati">Neonati (0-12 mesi)</option>
                          <option value="bimbi">Bambini (1-12 anni)</option>
                          <option value="giocattoli">Giocattoli & Giochi</option>
                          <option value="passeggini">Passeggini & Seggiolini</option>
                        </optgroup>
                        <optgroup label="🚗 TRASPORTI & VEICOLI">
                          <option value="auto">Auto & Veicoli</option>
                          <option value="moto">Moto & Scooter</option>
                          <option value="furgoni">Furgoni & Van</option>
                          <option value="rimorchi">Rimorchi & Carrelli</option>
                          <option value="barche">Barche & Nautica</option>
                          <option value="camper">Camper & Roulotte</option>
                          <option value="bici-elettriche">Bici Elettriche & Monopattini</option>
                        </optgroup>
                        <optgroup label="🚜 AGRICOLTURA & GIARDINAGGIO">
                          <option value="agricoltura">Agricoltura & Farming</option>
                          <option value="trattori">Trattori & Macchine Agricole</option>
                          <option value="irrigazione">Irrigazione & Pompe</option>
                          <option value="serre">Serre & Colture</option>
                        </optgroup>
                        <optgroup label="🐕 ANIMALI">
                          <option value="animali">Animali & Pet Care</option>
                          <option value="trasporto-animali">Trasporto Animali</option>
                        </optgroup>
                        <optgroup label="💊 SALUTE & BENESSERE">
                          <option value="medicale">Medicale & Sanitario</option>
                          <option value="riabilitazione">Riabilitazione & Ortopedia</option>
                          <option value="benessere">Benessere & Spa</option>
                        </optgroup>
                        <optgroup label="📚 ALTRO">
                          <option value="libri">Libri & Materiale Didattico</option>
                          <option value="arte">Arte & Design</option>
                          <option value="vintage">Vintage & Collezioni</option>
                          <option value="altro">Altro</option>
                        </optgroup>
                      </>
                    ) : (
                      <>
                        <optgroup label="🏢 LAVORO & UFFICI">
                          <option value="ufficio">Uffici</option>
                          <option value="coworking">Coworking</option>
                          <option value="sale-riunioni">Sale Riunioni</option>
                          <option value="postazioni">Postazioni Lavoro</option>
                        </optgroup>
                        <optgroup label="🎉 EVENTI & FESTE">
                          <option value="sale-feste">Sale Feste</option>
                          <option value="location-matrimoni">Location Matrimoni</option>
                          <option value="spazi-eventi">Spazi Eventi</option>
                          <option value="disco-club">Disco Club</option>
                          <option value="villa">Villa</option>
                          <option value="sale-conferenze">Sale Conferenze</option>
                        </optgroup>
                        <optgroup label="📦 STORAGE & DEPOSITI">
                          <option value="magazzino">Magazzini</option>
                          <option value="box">Box</option>
                          <option value="depositi">Depositi</option>
                          <option value="garage">Garage</option>
                        </optgroup>
                        <optgroup label="🎬 CREATIVI & PRODUZIONE">
                          <option value="studi-fotografici">Studi Fotografici</option>
                          <option value="sale-prove">Sale Prove Musicali</option>
                          <option value="sale-registrazione">Sale Registrazione</option>
                          <option value="set-video">Set Video & Cinema</option>
                          <option value="green-screen">Green Screen Studios</option>
                        </optgroup>
                        <optgroup label="🏋️ SPORT & FITNESS">
                          <option value="palestre">Palestre</option>
                          <option value="sale-fitness">Sale Fitness</option>
                          <option value="campi-sportivi">Campi Sportivi</option>
                          <option value="piscine">Piscine</option>
                        </optgroup>
                        <optgroup label="🍽️ RISTORAZIONE">
                          <option value="cucine-professionali">Cucine Professionali</option>
                          <option value="sale-ristoranti">Sale Ristoranti</option>
                          <option value="bar-locali">Bar & Locali</option>
                          <option value="rooftop">Rooftop</option>
                          <option value="cantine">Cantine</option>
                          <option value="sale-degustazione">Sale Degustazione</option>
                        </optgroup>
                        <optgroup label="🏪 COMMERCIALI">
                          <option value="negozi">Negozi</option>
                          <option value="popup-store">Pop-up Store</option>
                          <option value="showroom">Showroom</option>
                          <option value="stand-fieristici">Stand Fieristici</option>
                        </optgroup>
                        <optgroup label="🎓 DIDATTICI & FORMATIVI">
                          <option value="aule">Aule</option>
                          <option value="sale-formazione">Sale Formazione</option>
                          <option value="laboratori">Laboratori</option>
                          <option value="biblioteche">Biblioteche & Sale Lettura</option>
                        </optgroup>
                        <optgroup label="🏥 SANITARI & BENESSERE">
                          <option value="studi-medici">Studi Medici</option>
                          <option value="sale-massaggi">Sale Massaggi</option>
                          <option value="sale-terapia">Sale Terapia</option>
                          <option value="centri-estetici">Centri Estetici</option>
                          <option value="spa">SPA</option>
                          <option value="saune">Saune</option>
                        </optgroup>
                        <optgroup label="🎨 ARTE & CULTURA">
                          <option value="gallerie">Gallerie d'Arte</option>
                          <option value="spazi-espositivi">Spazi Espositivi</option>
                          <option value="sale-teatro">Sale Teatro</option>
                          <option value="cinema">Sale Cinema</option>
                        </optgroup>
                        <optgroup label="🏭 INDUSTRIALI & PRODUTTIVI">
                          <option value="capannoni">Capannoni</option>
                          <option value="laboratori-artigianali">Laboratori Artigianali</option>
                          <option value="spazi-produzione">Spazi Produzione</option>
                        </optgroup>
                        <optgroup label="🚗 PARCHEGGI & AUTO">
                          <option value="posti-auto">Posti Auto</option>
                          <option value="box-auto">Box Auto</option>
                          <option value="garage-privati">Garage Privati</option>
                        </optgroup>
                        <optgroup label="🌳 ESTERNI">
                          <option value="giardini">Giardini</option>
                          <option value="terrazze">Terrazze</option>
                          <option value="cortili">Cortili</option>
                          <option value="spazi-outdoor">Spazi All'aperto</option>
                          <option value="gazebo">Gazebo</option>
                        </optgroup>
                        <optgroup label="⛪ CERIMONIE">
                          <option value="sale-cerimonie">Sale Cerimonie</option>
                          <option value="spazi-rituali">Spazi Rituali</option>
                        </optgroup>
                        <optgroup label="🏕️ CAMPING & OUTDOOR">
                          <option value="piazzole-campeggio">Piazzole Campeggio</option>
                          <option value="aree-camper">Aree Camper</option>
                          <option value="glamping">Glamping</option>
                        </optgroup>
                        <optgroup label="🎮 GAMING & INTRATTENIMENTO">
                          <option value="sale-giochi">Sale Giochi</option>
                          <option value="sale-gaming">Sale Gaming</option>
                          <option value="escape-room">Escape Room</option>
                          <option value="simulatori">Simulatori</option>
                        </optgroup>
                        <optgroup label="🚢 TRASPORTI & MOBILITÀ">
                          <option value="posti-barca">Posti Barca/Ormeggi</option>
                          <option value="hangar">Hangar</option>
                          <option value="rimesse">Rimesse</option>
                        </optgroup>
                        <optgroup label="🐾 PET & ANIMALI">
                          <option value="pensioni-animali">Pensioni Animali</option>
                          <option value="aree-cani">Aree Sgambamento Cani</option>
                          <option value="maneggi">Maneggi</option>
                          <option value="scuderie">Scuderie</option>
                        </optgroup>
                        <optgroup label="🧘 YOGA & MEDITAZIONE">
                          <option value="sale-yoga">Sale Yoga</option>
                          <option value="spazi-meditazione">Spazi Meditazione</option>
                          <option value="centri-olistici">Centri Olistici</option>
                        </optgroup>
                        <optgroup label="🏠 ALLOGGI (Medio-Lungo Termine)">
                          <option value="stanza-singola">Stanza Singola</option>
                          <option value="stanza-doppia">Stanza Doppia</option>
                          <option value="posto-letto">Posto Letto</option>
                          <option value="monolocale">Monolocale</option>
                          <option value="bilocale">Bilocale</option>
                          <option value="trilocale">Trilocale+</option>
                          <option value="appartamento-condiviso">Appartamento Condiviso</option>
                        </optgroup>
                      </>
                    )}
                  </select>
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
  min="0.01"
  step="0.01"
  value={formData.price}
  onChange={e => {
  const value = e.target.value;
  // Permetti di digitare mentre l'utente scrive
  setFormData({...formData, price: value as any});
}}
  onBlur={e => {
    const value = parseFloat(e.target.value);
    if (isNaN(value) || value < 0.01) {
      setFormData({...formData, price: '' as any});
    }
  }}
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
                   <div key={idx} className="relative aspect-[4/3] group rounded-xl overflow-hidden border-2 border-gray-200">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      
                      {/* Bottoni controlli */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all">
                        {/* Freccia Sinistra */}
                        {idx > 0 && (
                          <button 
                            onClick={() => moveImageLeft(idx)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/95 p-2 rounded-full text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-white hover:scale-110"
                            title="Sposta a sinistra"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                        )}
                        
                        {/* Freccia Destra */}
                        {idx < formData.images.length - 1 && (
                          <button 
                            onClick={() => moveImageRight(idx)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/95 p-2 rounded-full text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-white hover:scale-110"
                            title="Sposta a destra"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        )}
                        
                        {/* Bottone Elimina */}
                        <button 
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 bg-white/95 p-1.5 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-white hover:scale-110"
                          title="Elimina foto"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Etichetta Copertina */}
                      {idx === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-brand text-white text-xs py-1.5 text-center font-semibold">
                          📸 Foto Copertina
                        </div>
                      )}
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
             <p className="text-xs text-gray-500">💡 Passa il mouse sulle foto per riordinarle con le frecce ← →. La prima foto è la copertina. Le immagini vengono ottimizzate automaticamente.</p>
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
               <h3 className="text-lg font-bold text-gray-900">Regole dell'Hubber</h3>
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
                 {/* DEPOSITO TEMPORANEAMENTE NASCOSTO */}
  <div></div>
  
</div>

               {/* Costo Pulizia */}
               <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costo Pulizia (€)</label>
                  <input
                    type="number"
                    value={formData.cleaningFee || ''}
                    onChange={(e) => setFormData({...formData, cleaningFee: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-400 mt-1">Addebito una tantum per pulizia finale (opzionale)</p>
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
  
<CityAutocomplete
  value={formData.location}
  onChange={(value, suggestion) => {
    const formattedLocation = suggestion 
      ? `${suggestion.city}, ${suggestion.region}`
      : value;
    setFormData({
      ...formData, 
      location: formattedLocation,
      ...(suggestion ? { coordinates: { lat: suggestion.lat, lng: suggestion.lng } } : {})
    });
  }}
  placeholder="Cerca una città italiana..."
  label="Città / Zona"
  required={true}
/>
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
      </div>
   </div>

)}

{/* Dettagli Alloggio - solo per sottocategorie alloggio */}
{formData.category === 'spazio' && ALLOGGIO_SUBCATEGORIES.includes(formData.subCategory) && (
   <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
      <h3 className="text-lg font-bold text-gray-900 flex items-center">
        <Home className="w-5 h-5 mr-2 text-brand" />
        Dettagli Alloggio
      </h3>
      <div className="grid grid-cols-2 gap-6">
         <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Camere da Letto</label>
            <input 
              type="number" 
              value={(formData as any).alloggioSpecs?.bedrooms || ''}
              onChange={(e) => setFormData({...formData, alloggioSpecs: { ...(formData as any).alloggioSpecs, bedrooms: parseInt(e.target.value) || 0 }} as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
              placeholder="Es. 2"
            />
         </div>
         <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bagni</label>
            <input 
              type="number" 
              value={(formData as any).alloggioSpecs?.bathrooms || ''}
              onChange={(e) => setFormData({...formData, alloggioSpecs: { ...(formData as any).alloggioSpecs, bathrooms: parseInt(e.target.value) || 0 }} as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
              placeholder="Es. 1"
            />
         </div>
         <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Arredato</label>
            <select
              value={(formData as any).alloggioSpecs?.furnished || ''}
              onChange={(e) => setFormData({...formData, alloggioSpecs: { ...(formData as any).alloggioSpecs, furnished: e.target.value }} as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-brand outline-none"
            >
              <option value="">Seleziona...</option>
              <option value="si">Sì, completamente</option>
              <option value="parziale">Parzialmente</option>
              <option value="no">No, vuoto</option>
            </select>
         </div>
         <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Spese Incluse</label>
            <select
              value={(formData as any).alloggioSpecs?.utilitiesIncluded || ''}
              onChange={(e) => setFormData({...formData, alloggioSpecs: { ...(formData as any).alloggioSpecs, utilitiesIncluded: e.target.value }} as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-brand outline-none"
            >
              <option value="">Seleziona...</option>
              <option value="si">Sì, tutte incluse</option>
              <option value="parziale">Parzialmente (solo alcune)</option>
              <option value="no">No, escluse</option>
            </select>
         </div>
         <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durata Minima</label>
            <select
              value={(formData as any).alloggioSpecs?.minStayMonths || '1'}
              onChange={(e) => setFormData({...formData, alloggioSpecs: { ...(formData as any).alloggioSpecs, minStayMonths: parseInt(e.target.value) }} as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-brand outline-none"
            >
              <option value="1">1 mese</option>
              <option value="3">3 mesi</option>
              <option value="6">6 mesi</option>
              <option value="12">12 mesi</option>
            </select>
         </div>
      </div>
   </div>
)}


{/* Orari - per TUTTI */}
<div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
   <h3 className="text-lg font-bold text-gray-900">Orari</h3>
   
   {/* Check-in/Ritiro */}
   <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Check-in / Ritiro</label>
      <div className="grid grid-cols-2 gap-4">
         <div>
            <label className="block text-xs text-gray-500 mb-1">Da</label>
            <div className="relative">
               <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
               <select
                 className="w-full pl-9 px-4 py-2 border border-gray-300 rounded-lg bg-white appearance-none cursor-pointer focus:ring-2 focus:ring-brand outline-none"
                 value={(formData as any).openingHours?.split('-')[0]?.trim() || ''}
                 onChange={(e) => {
                   const endTime = (formData as any).openingHours?.split('-')[1]?.trim() || '';
                   setFormData({...formData, openingHours: endTime ? `${e.target.value} - ${endTime}` : e.target.value} as any);
                 }}
               >
                 <option value="">Seleziona</option>
                 {Array.from({ length: 48 }, (_, i) => {
                   const hour = Math.floor(i / 2);
                   const minute = i % 2 === 0 ? '00' : '30';
                   const time = `${hour.toString().padStart(2, '0')}:${minute}`;
                   return <option key={time} value={time}>{time}</option>;
                 })}
               </select>
               <div className="absolute right-3 top-2.5 pointer-events-none">
                 <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                 </svg>
               </div>
            </div>
         </div>
         <div>
            <label className="block text-xs text-gray-500 mb-1">A</label>
            <div className="relative">
               <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
               <select
                 className="w-full pl-9 px-4 py-2 border border-gray-300 rounded-lg bg-white appearance-none cursor-pointer focus:ring-2 focus:ring-brand outline-none"
                 value={(formData as any).openingHours?.split('-')[1]?.trim() || ''}
                 onChange={(e) => {
                   const startTime = (formData as any).openingHours?.split('-')[0]?.trim() || '';
                   setFormData({...formData, openingHours: startTime ? `${startTime} - ${e.target.value}` : e.target.value} as any);
                 }}
               >
                 <option value="">Seleziona</option>
                 {Array.from({ length: 48 }, (_, i) => {
                   const hour = Math.floor(i / 2);
                   const minute = i % 2 === 0 ? '00' : '30';
                   const time = `${hour.toString().padStart(2, '0')}:${minute}`;
                   return <option key={time} value={time}>{time}</option>;
                 })}
               </select>
               <div className="absolute right-3 top-2.5 pointer-events-none">
                 <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                 </svg>
               </div>
            </div>
         </div>
      </div>
   </div>

   {/* Check-out/Riconsegna */}
   <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Check-out / Riconsegna</label>
      <div className="grid grid-cols-2 gap-4">
         <div>
            <label className="block text-xs text-gray-500 mb-1">Da</label>
            <div className="relative">
               <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
               <select
                 className="w-full pl-9 px-4 py-2 border border-gray-300 rounded-lg bg-white appearance-none cursor-pointer focus:ring-2 focus:ring-brand outline-none"
                 value={(formData as any).closingHours?.split('-')[0]?.trim() || ''}
                 onChange={(e) => {
                   const endTime = (formData as any).closingHours?.split('-')[1]?.trim() || '';
                   setFormData({...formData, closingHours: endTime ? `${e.target.value} - ${endTime}` : e.target.value} as any);
                 }}
               >
                 <option value="">Seleziona</option>
                 {Array.from({ length: 48 }, (_, i) => {
                   const hour = Math.floor(i / 2);
                   const minute = i % 2 === 0 ? '00' : '30';
                   const time = `${hour.toString().padStart(2, '0')}:${minute}`;
                   return <option key={time} value={time}>{time}</option>;
                 })}
               </select>
               <div className="absolute right-3 top-2.5 pointer-events-none">
                 <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                 </svg>
               </div>
            </div>
         </div>
         <div>
            <label className="block text-xs text-gray-500 mb-1">A</label>
            <div className="relative">
               <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
               <select
                 className="w-full pl-9 px-4 py-2 border border-gray-300 rounded-lg bg-white appearance-none cursor-pointer focus:ring-2 focus:ring-brand outline-none"
                 value={(formData as any).closingHours?.split('-')[1]?.trim() || ''}
                 onChange={(e) => {
                   const startTime = (formData as any).closingHours?.split('-')[0]?.trim() || '';
                   setFormData({...formData, closingHours: startTime ? `${startTime} - ${e.target.value}` : e.target.value} as any);
                 }}
               >
                 <option value="">Seleziona</option>
                 {Array.from({ length: 48 }, (_, i) => {
                   const hour = Math.floor(i / 2);
                   const minute = i % 2 === 0 ? '00' : '30';
                   const time = `${hour.toString().padStart(2, '0')}:${minute}`;
                   return <option key={time} value={time}>{time}</option>;
                 })}
               </select>
               <div className="absolute right-3 top-2.5 pointer-events-none">
                 <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                 </svg>
               </div>
            </div>
         </div>
      </div>
   </div>
</div>

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