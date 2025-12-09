import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  LayoutGrid,
  Sparkles,
  Upload,
  DollarSign,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Shield,
  Clock,
  Zap,
  FileText,
  X,
  Plus,
  Loader2,
  Home,
  Users
} from 'lucide-react';
import { generateListingDescription, suggestPrice } from '../services/geminiService';
import { ListingDraft, Condition, CancellationPolicyType, Listing, User } from '../types';
import { CityAutocomplete } from '../components/CityAutocomplete';
import { ListingMapStatic } from '../components/ListingMap';
import { CitySuggestion } from '../services/geocodingService';
import { processImageSingle } from '../utils/imageProcessing';
import { supabase } from '../lib/supabase';

// --- WIZARD STEPS CONSTANTS ---
const STEPS = [
  { id: 1, title: 'Categoria', icon: Box },
  { id: 2, title: 'Info Base', icon: FileText },
  { id: 3, title: 'Dettagli', icon: Zap },
  { id: 4, title: 'Prezzi & Regole', icon: DollarSign },
  { id: 5, title: 'Media', icon: Upload },
  { id: 6, title: 'Riepilogo', icon: CheckCircle2 },
];

interface PublishProps {
  // 👇 permettiamo anche async (handleAddListing è async)
  onPublish: (listing: Listing) => Promise<void> | void;
  currentUser: User;
}

export const Publish: React.FC<PublishProps> = ({ onPublish, currentUser }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [completeness, setCompleteness] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 🖼️ Stato per il processing delle immagini
  const [isProcessingImages, setIsProcessingImages] = useState(false);

  // --- DRAFT STATE ---
  const [draft, setDraft] = useState<ListingDraft>({
    step: 1,
    category: 'oggetto',
    title: '',
    subCategory: '',
    description: '',
    features: '',
    brand: '',
    model: '',
    condition: 'nuovo' as Condition,
    sqm: '',
    capacity: '',
    price: '',
    priceUnit: 'giorno',
    deposit: '',
    cancellationPolicy: 'flexible',
    location: '',
    images: [],
    // Campi indirizzo ritiro/spazio
    pickupAddress: '',
    pickupCity: '',
    pickupInstructions: '',
    // Campi aggiuntivi dall'editor
    zoneDescription: '',      // Descrizione zona/quartiere
    maxGuests: '',            // Ospiti massimi (per spazi)
    openingHours: '',         // Orari apertura (per spazi)
    manualBadges: [] as string[], // Badge manuali
    cleaningFee: '',
    rules: '',
    selectedFeatures: [] as string[],
  });

  // --- AUTOSAVE SIMULATION ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    }, 5000);
    return () => clearTimeout(timer);
  }, [draft]);

  // --- COMPLETENESS CALCULATOR ---
  useEffect(() => {
    let score = 0;
    if (draft.title.length > 5) score += 10;
    if (draft.description.length > 50) score += 15;
    if (draft.price) score += 10;
    if (draft.location) score += 5;
    if (draft.pickupAddress) score += 5; // Bonus per indirizzo ritiro
    if (draft.pickupCity) score += 5; // Bonus per città ritiro
    if (draft.images.length >= 1) score += 15;
    if (draft.images.length >= 3) score += 10;
    if (draft.cancellationPolicy) score += 10;

    if (draft.category === 'oggetto') {
      if (draft.brand) score += 10;
      if (draft.features.length > 5) score += 5;
    } else {
      if (draft.sqm) score += 10;
      if (draft.capacity) score += 5;
    }

    setCompleteness(Math.min(score, 100));
  }, [draft]);

  // --- HANDLERS ---
  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleAiGenerate = async () => {
    if (!draft.title) {
      alert('Inserisci almeno il titolo per generare la descrizione.');
      return;
    }
    setIsGenerating(true);

    const context =
      draft.category === 'oggetto'
        ? `Marca: ${draft.brand}, Modello: ${draft.model}, Condizioni: ${draft.condition}`
        : `Mq: ${draft.sqm}, Capienza: ${draft.capacity}`;

    const descPromise = generateListingDescription(
      draft.title,
      `${draft.features}. ${context}`,
      draft.category
    );
    const pricePromise = suggestPrice(draft.title, draft.category);

    const [descResult, priceResult] = await Promise.all([descPromise, pricePromise]);

    setDraft(prev => ({
      ...prev,
      description: descResult,
      price: (!prev.price && priceResult) ? priceResult : prev.price
    }));
    setIsGenerating(false);
  };

  // --- 🖼️ UPLOAD IMMAGINI SU SUPABASE STORAGE ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsProcessingImages(true);
    const files = Array.from(e.target.files);

    // Genera ID temporaneo univoco per questa sessione
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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
          const fileName = `${tempId}/${draft.images.length + i}.${file.type.split('/')[1]}`;
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
        setDraft(prev => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls],
        }));
      }
    } finally {
      setIsProcessingImages(false);
    }

    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setDraft(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // --- PUBLISH LOGIC ---
  const handlePublish = async () => {
    // Validazione campi base
    const missingFields: string[] = [];
    if (!draft.title) missingFields.push('Titolo');
    if (!draft.description) missingFields.push('Descrizione');
    if (!draft.price) missingFields.push('Prezzo');
    if (!draft.location && !draft.pickupCity) missingFields.push('Città / Zona');
    if (draft.images.length === 0) missingFields.push('Almeno una foto');

    if (missingFields.length > 0) {
      alert(
        'Per pubblicare devi compilare:\n- ' +
          missingFields.join('\n- ')
      );
      return;
    }

    // Controllo qualità minima
    if (completeness < 70) {
      alert(
        'Completa meglio il tuo annuncio (descrizione, foto, dettagli) fino ad almeno il 70% di qualità prima di pubblicare.'
      );
      return;
    }

    setIsPublishing(true);

    try {
      // piccolo delay per feedback utente
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newListing: Listing = {
        // 👇 lasciamo vuoto: sarà api.listings.create a generare un UUID valido per Supabase
        id: '',
        hostId: currentUser.id,
        title: draft.title,
        category: draft.category,
        subCategory: draft.subCategory,
        description: draft.description,
        price: parseFloat(draft.price) || 0,
        priceUnit: draft.priceUnit as 'ora' | 'giorno' | 'settimana' | 'mese',
        images: draft.images,
        location: draft.location || draft.pickupCity, // Usa pickupCity come fallback
        coordinates: selectedCityCoords || { lat: 0, lng: 0 },
        rating: 0,
        reviewCount: 0,
        reviews: [],
        owner: currentUser,
        features: draft.features
          .split(',')
          .map(s => s.trim())
          .filter(s => s),
        rules: draft.rules.split(',').map(s => s.trim()).filter(s => s),
        deposit: parseFloat(draft.deposit) || 0,
        cleaningFee: parseFloat(draft.cleaningFee) || 0,
        status: 'published',
        cancellationPolicy: draft.cancellationPolicy,
        // 👇 salviamo anche il punteggio di completezza
        completenessScore: completeness,
        // 👇 CAMPI INDIRIZZO RITIRO/SPAZIO
        pickupAddress: draft.pickupAddress,
        pickupCity: draft.pickupCity,
        pickupInstructions: draft.pickupInstructions,
        // 👇 CAMPI AGGIUNTIVI
        zoneDescription: draft.zoneDescription,
        maxGuests: draft.maxGuests ? parseInt(draft.maxGuests) : undefined,
        openingHours: draft.openingHours,
        manualBadges: draft.manualBadges,
        // 👇 TECH/SPACE SPECS
        techSpecs: draft.category === 'oggetto'
          ? {
              brand: draft.brand,
              model: draft.model,
              condition: draft.condition
            }
          : undefined,
        spaceSpecs: draft.category === 'spazio'
          ? {
              sqm: parseFloat(draft.sqm) || 0,
              capacity: parseInt(draft.capacity) || 0
            }
          : undefined
      };

      console.log('DEBUG Publish – newListing:', newListing);

      // chiama il callback fornito da App.tsx e aspetta che finisca
      await onPublish(newListing);
    } catch (error) {
      console.error('Errore durante handlePublish:', error);
      alert('Errore durante la pubblicazione. Riprova tra qualche istante.');
    } finally {
      setIsPublishing(false);
    }
  };

  // --- RENDER STEPS ---

  const renderStepCategory = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      <h2 className="text-2xl font-bold text-gray-900">Cosa vuoi noleggiare?</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => setDraft(d => ({ ...d, category: 'oggetto' }))}
          className={`p-8 rounded-2xl border-2 transition-all flex flex-col items-center text-center ${
            draft.category === 'oggetto'
              ? 'border-brand bg-brand/5 ring-2 ring-brand/20'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${draft.category === 'oggetto' ? 'bg-brand text-white' : 'bg-gray-100 text-gray-500'}`}>
            <Box className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Un Oggetto</h3>
          <p className="text-sm text-gray-500 mt-2">Trapano, drone, bici, borsa, trattore, attrezzatura da lavoro...</p>
        </button>

        <button
          onClick={() => setDraft(d => ({ ...d, category: 'spazio' }))}
          className={`p-8 rounded-2xl border-2 transition-all flex flex-col items-center text-center ${
            draft.category === 'spazio'
              ? 'border-brand bg-brand/5 ring-2 ring-brand/20'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${draft.category === 'spazio' ? 'bg-brand text-white' : 'bg-gray-100 text-gray-500'}`}>
            <LayoutGrid className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Uno Spazio</h3>
          <p className="text-sm text-gray-500 mt-2">Garage, ufficio, negozio temporaneo, magazzino, sale eventi...</p>
        </button>
      </div>
    </div>
  );

  const renderStepInfo = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Titolo Annuncio *</label>
        <input
          type="text"
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand focus:border-transparent"
          placeholder={draft.category === 'oggetto' ? 'Es. Sony Alpha 7 III + Obiettivo' : 'Es. Loft Industriale per Eventi'}
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
        <select
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand focus:border-transparent bg-white"
          value={draft.subCategory}
          onChange={(e) => setDraft({ ...draft, subCategory: e.target.value })}
        >
          <option value="">Seleziona...</option>
          {draft.category === 'oggetto' ? (
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

              <optgroup label="🏠 RESIDENZIALI">
                <option value="appartamenti">Appartamenti</option>
                <option value="ville">Ville</option>
                <option value="case-vacanza">Case Vacanza</option>
                <option value="b&b">B&B</option>
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
            </>
          )}
        </select>
      </div>

      <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-bold text-indigo-900">Descrizione</label>
          <button
            onClick={handleAiGenerate}
            disabled={isGenerating || !draft.title}
            className="flex items-center bg-white text-indigo-600 text-xs font-bold py-2 px-4 rounded-full shadow-sm hover:shadow-md transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 mr-2" />
            {isGenerating ? 'Scrivendo...' : 'Genera con AI'}
          </button>
        </div>
        <textarea
          className="w-full px-4 py-3 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent min-h-[150px] text-sm"
          placeholder="Descrivi il tuo oggetto, i punti di forza e perché noleggiarlo..."
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />
      </div>
    </div>
  );

  const renderStepDetails = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      <h2 className="text-xl font-bold text-gray-900">Specifiche Tecniche</h2>

      {draft.category === 'oggetto' ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-gray-300"
                placeholder="Es. Bosch"
                value={draft.brand}
                onChange={(e) => setDraft({ ...draft, brand: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modello</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-gray-300"
                placeholder="Es. GSB 18V-55"
                value={draft.model}
                onChange={(e) => setDraft({ ...draft, model: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Condizioni Oggetto</label>
            <div className="grid grid-cols-3 gap-3">
              {(['nuovo', 'come_nuovo', 'buono', 'usato', 'molto_usato'] as Condition[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setDraft({ ...draft, condition: c })}
                  className={`py-2 px-3 rounded-lg border text-sm capitalize ${
                    draft.condition === c ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {c.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Superficie (m²)</label>
            <input
              type="number"
              className="w-full px-4 py-3 rounded-xl border border-gray-300"
              placeholder="50"
              value={draft.sqm}
              onChange={(e) => setDraft({ ...draft, sqm: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capienza max (persone)</label>
            <input
              type="number"
              className="w-full px-4 py-3 rounded-xl border border-gray-300"
              placeholder="20"
              value={draft.capacity}
              onChange={(e) => setDraft({ ...draft, capacity: e.target.value })}
            />
          </div>
        </div>
      )}

    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Caratteristiche & Dotazioni</label>
        <input
          type="text"
          className="w-full px-4 py-3 rounded-xl border border-gray-300"
          placeholder={draft.category === 'oggetto' ? 'Es. Batteria extra, Valigetta, Punte...' : 'Es. WiFi, Bagno, Proiettore...'}
          value={draft.features}
          onChange={(e) => setDraft({ ...draft, features: e.target.value })}
        />
        <p className="text-xs text-gray-400 mt-1">Separa le caratteristiche con una virgola</p>

      {/* Regole personalizzate */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">📋 Regole Personalizzate (opzionali)</label>
        <textarea
          className="w-full px-4 py-3 rounded-xl border border-gray-300 min-h-[100px]"
          placeholder="Es: Vietato fumare, Animali non ammessi, Silenzio dopo le 22:00..."
          value={draft.rules}
          onChange={(e) => setDraft({ ...draft, rules: e.target.value })}
        />
        <p className="text-xs text-gray-400 mt-1">Separa le regole con una virgola. Queste si aggiungeranno alle regole standard della piattaforma.</p>
      </div>
      </div>
    </div>
  );

  // --- AUTOCOMPLETE CITTÀ ---
  const [selectedCityCoords, setSelectedCityCoords] = useState<{ lat: number; lng: number } | null>(null);

  const handleCitySelect = (value: string, suggestion?: CitySuggestion) => {
    setDraft({ ...draft, location: value });
    if (suggestion) {
      setSelectedCityCoords({ lat: suggestion.lat, lng: suggestion.lng });
    }
  };

  // --- BADGE MANUALI ---
  const toggleBadge = (badge: string) => {
    const badges = draft.manualBadges || [];
    if (badges.includes(badge)) {
      setDraft({ ...draft, manualBadges: badges.filter(b => b !== badge) });
    } else {
      setDraft({ ...draft, manualBadges: [...badges, badge] });
    }
  };

  const renderStepPricing = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prezzo (€)</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-bold">€</span>
            <input
              type="number"
              className="w-full pl-8 px-4 py-3 rounded-xl border border-gray-300 font-bold text-lg"
              placeholder="0.00"
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unità</label>
          <select
            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white"
            value={draft.priceUnit}
            onChange={(e) => setDraft({ ...draft, priceUnit: e.target.value as any })}
          >
            <option value="giorno">Per Giorno</option>
            <option value="ora">Per Ora</option>
            <option value="settimana">Per Settimana</option>
            <option value="mese">Per Mese</option>
          </select>
        </div>
      </div>

      {/* Costi Aggiuntivi */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Costi Aggiuntivi (Opzionali)</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Costo Pulizia (€)
          </label>
          <input
            type="number"
            className="w-full px-4 py-3 rounded-xl border border-gray-300"
            placeholder="0.00"
            value={draft.cleaningFee}
            onChange={(e) => setDraft({ ...draft, cleaningFee: e.target.value })}
          />
          <p className="text-xs text-gray-400 mt-1">Addebito una tantum per pulizia finale</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cauzione Richiesta (€)</label>
        <input
          type="number"
          className="w-full px-4 py-3 rounded-xl border border-gray-300"
          placeholder="Opzionale (es. 100)"
          value={draft.deposit}
          onChange={(e) => setDraft({ ...draft, deposit: e.target.value })}
        />
        <p className="text-xs text-gray-400 mt-1">Verrà bloccata sulla carta del Renter e sbloccata a fine noleggio.</p>
      </div>

      {/* Sezione Posizione e Indirizzo */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-brand" />
          Posizione
        </h3>
        
        <div className="space-y-4">
          {/* Città / Zona con Autocomplete Nominatim */}
          <CityAutocomplete
            value={draft.location}
            onChange={handleCitySelect}
            label="Città / Zona"
            required
            placeholder="Cerca una città italiana..."
            helperText="Questa informazione sarà visibile nell'annuncio pubblico."
          />

          {/* Preview Mappa */}
          {draft.location && draft.location.length > 2 && (
            <ListingMapStatic
              location={draft.location}
              category={draft.category}
              height="150px"
              className="mt-2"
            />
          )}

          {/* Descrizione Zona */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione Zona / Quartiere</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm"
              rows={2}
              placeholder="Descrivi i dintorni, i parcheggi, i mezzi pubblici..."
              value={draft.zoneDescription}
              onChange={(e) => setDraft({ ...draft, zoneDescription: e.target.value })}
            />
          </div>

          {/* Box Indirizzo - TESTO DINAMICO in base alla categoria */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-start mb-3">
              <Home className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-blue-900">
                  {draft.category === 'spazio' ? 'Indirizzo dello Spazio' : 'Indirizzo di Ritiro'}
                </h4>
                <p className="text-xs text-blue-700">
                  Sarà visibile al renter solo dopo la conferma della prenotazione.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Via e Numero Civico</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white"
                  placeholder="Es. Via Roma 24"
                  value={draft.pickupAddress}
                  onChange={(e) => setDraft({ ...draft, pickupAddress: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Città</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white"
                  placeholder="Es. Milano"
                  value={draft.pickupCity}
                  onChange={(e) => setDraft({ ...draft, pickupCity: e.target.value })}
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {draft.category === 'spazio' ? 'Indicazioni per raggiungere lo spazio (opzionale)' : 'Istruzioni per il Ritiro (opzionale)'}
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm"
                rows={2}
                placeholder={draft.category === 'spazio' 
                  ? "Es. Ingresso dal cortile interno, citofono 'Sala Eventi'. Parcheggio disponibile."
                  : "Es. Citofono Rossi, 2° piano. Parcheggio disponibile nel cortile."
                }
                value={draft.pickupInstructions}
                onChange={(e) => setDraft({ ...draft, pickupInstructions: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dettagli Spazio - solo per categoria spazio */}
      {draft.category === 'spazio' && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-brand" />
            Dettagli Spazio
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ospiti Massimi</label>
              <div className="relative">
                <Users className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  className="w-full pl-10 px-4 py-3 rounded-xl border border-gray-300"
                  placeholder="Es. 50"
                  value={draft.maxGuests}
                  onChange={(e) => setDraft({ ...draft, maxGuests: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Orari Apertura</label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 px-4 py-3 rounded-xl border border-gray-300"
                  placeholder="Es. 09:00 - 23:00"
                  value={draft.openingHours}
                  onChange={(e) => setDraft({ ...draft, openingHours: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Politica di Cancellazione */}
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-3">Politica di Cancellazione</label>
        <div className="space-y-3">
          {[
            { id: 'flexible', label: 'Flessibile', desc: 'Rimborso 100% fino a 24h prima.', color: 'green' },
            { id: 'moderate', label: 'Moderata', desc: 'Rimborso 100% fino a 5gg prima.', color: 'yellow' },
            { id: 'strict', label: 'Rigida', desc: 'Rimborso 50% fino a 7gg prima.', color: 'red' }
          ].map(policy => (
            <div
              key={policy.id}
              onClick={() => setDraft({ ...draft, cancellationPolicy: policy.id as CancellationPolicyType })}
              className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                draft.cancellationPolicy === policy.id ? 'border-brand bg-brand/5' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div>
                <div className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 bg-${policy.color}-500`}></span>
                  <h4 className="font-bold text-gray-900">{policy.label}</h4>
                </div>
                <p className="text-sm text-gray-500 mt-1 pl-4">{policy.desc}</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  draft.cancellationPolicy === policy.id ? 'border-brand' : 'border-gray-300'
                }`}
              >
                {draft.cancellationPolicy === policy.id && <div className="w-2.5 h-2.5 bg-brand rounded-full"></div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Badge Manuali */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Badge Speciali</h3>
        <p className="text-xs text-gray-500 mb-4">Seleziona badge per evidenziare il tuo annuncio.</p>
        <div className="flex flex-wrap gap-3">
          {['Offerta', 'Last Minute', 'Premium', 'Novità'].map(badge => (
            <button
              key={badge}
              type="button"
              onClick={() => toggleBadge(badge)}
              className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
                draft.manualBadges?.includes(badge) 
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
  );

  const renderStepMedia = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept="image/*"
        onChange={handleImageUpload}
        disabled={isProcessingImages}
      />

      <div
        onClick={!isProcessingImages ? triggerFileInput : undefined}
        className={`border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center transition-colors ${
          isProcessingImages ? 'bg-gray-50 cursor-wait' : 'hover:bg-gray-50 cursor-pointer'
        }`}
      >
        {isProcessingImages ? (
          <>
            <Loader2 className="w-12 h-12 text-brand mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-bold text-gray-900">Ottimizzazione immagini...</h3>
            <p className="text-gray-500 text-sm mb-4">Ridimensionamento e upload in corso</p>
          </>
        ) : (
          <>
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">Trascina qui le tue foto</h3>
            <p className="text-gray-500 text-sm mb-4">o clicca per caricare dal dispositivo</p>
            <button
              type="button"
              className="bg-white border border-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg text-sm hover:bg-gray-50"
            >
              Seleziona File
            </button>
          </>
        )}
      </div>

      {draft.images.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">
          {draft.images.map((img, idx) => (
            <div key={idx} className="relative aspect-[4/3] bg-gray-100 rounded-xl border border-gray-200 overflow-hidden group">
              <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(idx);
                }}
                className="absolute top-2 right-2 bg-white/80 hover:bg-white text-red-500 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
              {idx === 0 && (
                <div className="absolute bottom-0 left-0 w-full bg-black/60 text-white text-xs font-medium text-center py-1.5">
                  Copertina
                </div>
              )}
            </div>
          ))}
          <div
            onClick={!isProcessingImages ? triggerFileInput : undefined}
            className={`aspect-[4/3] bg-gray-50 rounded-xl border border-gray-200 border-dashed flex items-center justify-center text-gray-300 transition-all ${
              isProcessingImages ? 'cursor-wait' : 'cursor-pointer hover:bg-gray-100 hover:text-brand hover:border-brand/30'
            }`}
          >
            {isProcessingImages ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <Plus className="w-8 h-8" />
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 opacity-40 pointer-events-none grayscale">
          <div className="aspect-[4/3] bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 text-xs">
            Copertina
          </div>
          <div className="aspect-[4/3] bg-gray-50 rounded-xl border border-gray-200 border-dashed flex items-center justify-center text-gray-300">
            +
          </div>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-xl flex items-start">
        <Shield className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-blue-900">Foto di qualità = Più guadagni</h4>
          <p className="text-xs text-blue-700 mt-1">
            Gli annunci con almeno 3 foto chiare ricevono il 40% in più di prenotazioni. Le foto vengono ottimizzate automaticamente e salvate su cloud.
          </p>
        </div>
      </div>
    </div>
  );

  const renderStepSummary = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
      <div className="bg-gray-900 rounded-2xl p-6 text-white">
        <div className="flex justify-between items-end mb-2">
          <h3 className="font-bold text-lg">Qualità Annuncio</h3>
          <span className={`text-2xl font-bold ${completeness >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>
            {completeness}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full transition-all duration-1000 ${completeness >= 70 ? 'bg-green-500' : 'bg-yellow-500'}`}
            style={{ width: `${completeness}%` }}
          ></div>
        </div>
        {completeness < 70 && (
          <div className="flex items-start text-sm text-gray-300 bg-white/10 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 mr-2 mt-0.5 text-yellow-400" />
            <p>Aggiungi altre foto, una descrizione completa e la città per migliorare il punteggio dell'annuncio.</p>
          </div>
        )}
      </div>

      <div className="border border-gray-200 rounded-2xl p-4 flex bg-white shadow-sm">
        {draft.images.length > 0 ? (
          <img src={draft.images[0]} className="w-24 h-24 rounded-lg object-cover flex-shrink-0" alt="cover" />
        ) : (
          <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0"></div>
        )}
        <div className="ml-4 flex-1">
          <div className="flex justify-between">
            <h4 className="font-bold text-gray-900">{draft.title || 'Titolo Annuncio'}</h4>
            <span className="text-brand font-bold">€{draft.price || '--'}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{draft.description || 'Nessuna descrizione...'}</p>
          <div className="mt-3 flex gap-2 flex-wrap">
            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 capitalize">{draft.category}</span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{draft.cancellationPolicy}</span>
            {draft.pickupCity && (
              <span className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-700 flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                {draft.pickupCity}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Riepilogo indirizzo */}
      {(draft.pickupAddress || draft.pickupCity) && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <h4 className="text-sm font-bold text-green-900 flex items-center mb-2">
            <Home className="w-4 h-4 mr-2" />
            {draft.category === 'spazio' ? 'Indirizzo dello Spazio (privato)' : 'Indirizzo di Ritiro (privato)'}
          </h4>
          <p className="text-sm text-green-800">
            {draft.pickupAddress && <span>{draft.pickupAddress}, </span>}
            {draft.pickupCity}
          </p>
          {draft.pickupInstructions && (
            <p className="text-xs text-green-700 mt-1 italic">"{draft.pickupInstructions}"</p>
          )}
          <p className="text-xs text-green-600 mt-2">
            ✓ Visibile al renter solo dopo la conferma della prenotazione
          </p>
        </div>
      )}
    </div>
  );

  // --- RENDER ROOT ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="font-bold text-gray-900 flex items-center">
            <Box className="w-5 h-5 mr-2 text-brand" /> Nuova Inserzione
          </h1>
          <div className="flex items-center text-xs text-gray-400">
            {autoSaved && (
              <span className="flex items-center mr-4 text-green-600">
                <Save className="w-3 h-3 mr-1" /> Salvato
              </span>
            )}
            <span>Step {currentStep} di {STEPS.length}</span>
          </div>
        </div>
        <div className="h-1 bg-gray-100 w-full">
          <div
            className="h-full bg-brand transition-all duration-500"
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="hidden lg:block lg:col-span-3 space-y-2">
          {STEPS.map(step => (
            <div
              key={step.id}
              className={`flex items-center p-3 rounded-xl transition-colors ${
                currentStep === step.id
                  ? 'bg-brand text-white shadow-md'
                  : currentStep > step.id
                    ? 'text-brand font-medium'
                    : 'text-gray-400'
              }`}
            >
              <step.icon className={`w-5 h-5 mr-3 ${currentStep === step.id ? 'text-brand-accent' : ''}`} />
              <span className="text-sm font-medium">{step.title}</span>
              {currentStep > step.id && <CheckCircle2 className="w-4 h-4 ml-auto" />}
            </div>
          ))}
        </div>

        <div className="lg:col-span-9">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[400px] flex flex-col">
            <div className="flex-1">
              {currentStep === 1 && renderStepCategory()}
              {currentStep === 2 && renderStepInfo()}
              {currentStep === 3 && renderStepDetails()}
              {currentStep === 4 && renderStepPricing()}
              {currentStep === 5 && renderStepMedia()}
              {currentStep === 6 && renderStepSummary()}
            </div>

            <div className="mt-10 pt-6 border-t border-gray-100 flex justify-between items-center">
              <button
                onClick={handleBack}
                disabled={currentStep === 1 || isPublishing}
                className="px-6 py-3 rounded-xl text-gray-600 font-medium hover:bg-gray-50 disabled:opacity-30 flex items-center"
              >
                <ChevronLeft className="w-5 h-5 mr-1" /> Indietro
              </button>

              {currentStep < STEPS.length ? (
                <button
                  onClick={handleNext}
                  disabled={isPublishing}
                  className="px-8 py-3 rounded-xl bg-brand text-white font-bold hover:bg-brand-dark shadow-lg hover:shadow-xl transition-all flex items-center disabled:opacity-50"
                >
                  Continua <ChevronRight className="w-5 h-5 ml-1" />
                </button>
              ) : (
                <button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className={`px-8 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center ${
                    !isPublishing ? 'bg-brand-accent text-brand-dark hover:bg-amber-400' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Pubblicazione...
                    </>
                  ) : (
                    'Pubblica Annuncio'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};