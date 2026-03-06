import React, { useState, useEffect, useRef } from 'react';
import {
  Ticket,
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
  Users,
  Calendar,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { generateListingDescription, suggestPrice } from '../services/geminiService';
import { Listing, User } from '../types';
import { CityAutocomplete } from '../components/CityAutocomplete';
import { ListingMapStatic } from '../components/ListingMap';
import { CitySuggestion } from '../services/geocodingService';
import { processImageSingle } from '../utils/imageProcessing';
import { supabase } from '../services/supabaseClient';
import { AirbnbCalendar } from '../components/AirbnbCalendar';

// --- WIZARD STEPS ---
const STEPS = [
  { id: 1, title: 'Categoria', icon: Ticket },
  { id: 2, title: 'Info Base', icon: FileText },
  { id: 3, title: 'Dettagli', icon: Zap },
  { id: 4, title: 'Slot & Date', icon: Calendar },
  { id: 5, title: 'Prezzi & Regole', icon: DollarSign },
  { id: 6, title: 'Media', icon: Upload },
  { id: 7, title: 'Riepilogo', icon: CheckCircle2 },
];

// --- TIPI ---
interface ExperienceSlot {
  id: string;
  startDate: string;      // YYYY-MM-DD sempre presente
  endDate: string;        // YYYY-MM-DD solo per esperienze multi-giorno, altrimenti uguale a startDate
  startTime: string;      // HH:MM solo per esperienze orarie
  endTime: string;        // HH:MM solo per esperienze orarie
  maxParticipants: number;
}

interface ExperienceDraft {
  title: string;
  subCategory: string;
  description: string;
  features: string;
  rules: string;
  // Dettagli
  maxParticipants: number;
  durationValue: string;
  durationUnit: 'ore' | 'giorni' | 'settimane';
  languages: string;
  difficulty: string;
  minAge: string;
  included: string;
  notIncluded: string;
  // Slot
  slots: ExperienceSlot[];
  // Prezzi
  pricePerPerson: string;
  priceType: 'persona' | 'gruppo';
  extraCost: string;
  cancellationPolicy: 'flexible' | 'moderate' | 'strict';
  // Posizione
  location: string;
  meetingAddress: string;
  meetingCity: string;
  meetingInstructions: string;
  zoneDescription: string;
  // Media
  images: string[];
  manualBadges: string[];
}

interface PublishEsperienzaProps {
  onPublish: (listing: Listing) => Promise<any> | void;
  onBack: () => void; // Per tornare alla scelta categoria in Publish.tsx
  currentUser: User;
}

export const PublishEsperienza: React.FC<PublishEsperienzaProps> = ({ onPublish, onBack, currentUser }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [completeness, setCompleteness] = useState(0);
  const [selectedCityCoords, setSelectedCityCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [calendarStart, setCalendarStart] = useState<Date | undefined>(undefined);
  const [calendarEnd, setCalendarEnd] = useState<Date | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [genFrequency, setGenFrequency] = useState<'daily' | 'weekly'>('weekly');
  const [genDays, setGenDays] = useState<number[]>([6]);
  const [genStartDate, setGenStartDate] = useState('');
  const [genEndDate, setGenEndDate] = useState('');
  const [genStartTime, setGenStartTime] = useState('');
  const [genEndTime, setGenEndTime] = useState('');
  const [genMaxParticipants, setGenMaxParticipants] = useState(10);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- DRAFT STATE ---
  const [draft, setDraft] = useState<ExperienceDraft>({
    title: '',
    subCategory: '',
    description: '',
    features: '',
    rules: '',
    maxParticipants: 10,
    durationValue: '',
    durationUnit: 'ore',
    languages: 'Italiano',
    difficulty: '',
    minAge: '',
    included: '',
    notIncluded: '',
    slots: [],
    pricePerPerson: '',
    priceType: 'persona',
    extraCost: '',
    cancellationPolicy: 'flexible',
    location: '',
    meetingAddress: '',
    meetingCity: '',
    meetingInstructions: '',
    zoneDescription: '',
    images: [],
    manualBadges: [],
  });

  // --- AUTOSAVE ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    }, 5000);
    return () => clearTimeout(timer);
  }, [draft]);

  // --- COMPLETENESS ---
  useEffect(() => {
    let score = 0;
    if (draft.title.length > 5) score += 10;
    if (draft.description.length > 50) score += 15;
    if (draft.pricePerPerson) score += 10;
    if (draft.location) score += 5;
    if (draft.meetingAddress) score += 5;
    if (draft.meetingCity) score += 5;
    if (draft.images.length >= 1) score += 15;
    if (draft.images.length >= 3) score += 10;
    if (draft.cancellationPolicy) score += 5;
    if (draft.slots.length >= 1) score += 15;
    if (draft.durationValue) score += 5;
    setCompleteness(Math.min(score, 100));
  }, [draft]);

  // --- HANDLERS GENERALI ---
  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  const handleBack = () => {
    if (currentStep === 1) {
      onBack();
    } else {
      setCurrentStep(prev => Math.max(prev - 1, 1));
    }
  };

  const handleCitySelect = (value: string, suggestion?: CitySuggestion) => {
    setDraft(d => ({ ...d, location: value }));
    if (suggestion) {
      setSelectedCityCoords({ lat: suggestion.lat, lng: suggestion.lng });
    }
  };

  const toggleBadge = (badge: string) => {
    const badges = draft.manualBadges || [];
    if (badges.includes(badge)) {
      setDraft(d => ({ ...d, manualBadges: badges.filter(b => b !== badge) }));
    } else {
      setDraft(d => ({ ...d, manualBadges: [...badges, badge] }));
    }
  };

  // --- AI GENERA DESCRIZIONE ---
  const handleAiGenerate = async () => {
    if (!draft.title) {
      alert('Inserisci almeno il titolo per generare la descrizione.');
      return;
    }
    setIsGenerating(true);
    const context = `Durata: ${draft.durationValue} ${draft.durationUnit}, Max partecipanti: ${draft.maxParticipants}, Lingue: ${draft.languages}`;
    const [descResult, priceResult] = await Promise.all([
      generateListingDescription(draft.title, `${draft.features}. ${context}`, 'esperienza'),
      suggestPrice(draft.title, 'esperienza'),
    ]);
    setDraft(d => ({
      ...d,
      description: descResult,
      pricePerPerson: (!d.pricePerPerson && priceResult) ? priceResult : d.pricePerPerson,
    }));
    setIsGenerating(false);
  };

  // --- UPLOAD IMMAGINI ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsProcessingImages(true);
    const files = Array.from(e.target.files);
    const tempId = `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const processedBase64 = await processImageSingle(file, {
            thumbnailWidth: 800,
            thumbnailHeight: 600,
            quality: 0.85,
            aspectRatio: 4 / 3,
          });
          const base64Data = processedBase64.replace(/^data:image\/\w+;base64,/, '');
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let j = 0; j < byteCharacters.length; j++) {
            byteNumbers[j] = byteCharacters.charCodeAt(j);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: file.type });
          const fileName = `${tempId}/${draft.images.length + i}.${file.type.split('/')[1]}`;
          const { error: uploadError } = await supabase.storage
            .from('listing-images')
            .upload(fileName, blob, { contentType: file.type, cacheControl: '31536000', upsert: true });
          if (uploadError) { console.error('Errore upload:', uploadError); continue; }
          const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(fileName);
          uploadedUrls.push(urlData.publicUrl);
        } catch (error) {
          console.error('Errore processing immagine:', error);
        }
      }
      if (uploadedUrls.length > 0) {
        setDraft(d => ({ ...d, images: [...d.images, ...uploadedUrls] }));
      }
    } finally {
      setIsProcessingImages(false);
    }
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setDraft(d => ({ ...d, images: d.images.filter((_, i) => i !== index) }));
  };

  const moveImageLeft = (index: number) => {
    if (index === 0) return;
    const newImages = [...draft.images];
    [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
    setDraft(d => ({ ...d, images: newImages }));
  };

  const moveImageRight = (index: number) => {
    if (index === draft.images.length - 1) return;
    const newImages = [...draft.images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    setDraft(d => ({ ...d, images: newImages }));
  };

 const handleCalendarChange = (start: Date | undefined, end: Date | undefined) => {
    setCalendarStart(start);
    setCalendarEnd(end);
    if (start && end) {
      const toYMD = (d: Date) => d.toISOString().split('T')[0];
      addSlot(toYMD(start), toYMD(end));
      setCalendarStart(undefined);
      setCalendarEnd(undefined);
      setShowCalendar(false);
    } else if (start && draft.durationUnit === 'ore') {
      // Per esperienze orarie basta una data
      const toYMD = (d: Date) => d.toISOString().split('T')[0];
      addSlot(toYMD(start), toYMD(start));
      setCalendarStart(undefined);
      setShowCalendar(false);
    }
  };

  // --- GESTIONE SLOT ---
  const addSlot = (startDate?: string, endDate?: string) => {
    const newSlot: ExperienceSlot = {
      id: `slot-${Date.now()}`,
      startDate: startDate || '',
      endDate: endDate || startDate || '',
      startTime: '',
      endTime: '',
      maxParticipants: draft.maxParticipants,
    };
    setDraft(d => ({ ...d, slots: [...d.slots, newSlot] }));
  };

  const updateSlot = (id: string, field: keyof ExperienceSlot, value: string | number) => {
    setDraft(d => ({
      ...d,
      slots: d.slots.map(s => s.id === id ? { ...s, [field]: value } : s),
    }));
  };

  const removeSlot = (id: string) => {
    setDraft(d => ({ ...d, slots: d.slots.filter(s => s.id !== id) }));
  };

  // Duplica slot (utile per aggiungere rapidamente stessa exp in più date)
  const duplicateSlot = (slot: ExperienceSlot) => {
    const newSlot: ExperienceSlot = {
      ...slot,
      id: `slot-${Date.now()}`,
      startDate: '',
      endDate: '',
    };
    setDraft(d => ({ ...d, slots: [...d.slots, newSlot] }));
  };

  // --- PUBLISH ---
  const handlePublish = async () => {
    const missingFields: string[] = [];
    if (!draft.title) missingFields.push('Titolo');
    if (!draft.description) missingFields.push('Descrizione');
    if (!draft.pricePerPerson) missingFields.push('Prezzo');
    if (!draft.location && !draft.meetingCity) missingFields.push('Città / Zona');
    if (draft.images.length === 0) missingFields.push('Almeno una foto');
    if (draft.slots.length === 0) missingFields.push('Almeno uno slot');

    if (missingFields.length > 0) {
      alert('Per pubblicare devi compilare:\n- ' + missingFields.join('\n- '));
      return;
    }
    if (completeness < 70) {
      alert('Completa meglio il tuo annuncio fino ad almeno il 70% di qualità prima di pubblicare.');
      return;
    }

    setIsPublishing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newListing: Listing = {
        id: '',
        hostId: currentUser.id,
        owner_id: currentUser.id,
        title: draft.title,
        category: 'esperienza',
        subCategory: draft.subCategory,
        description: draft.description,
        price: parseFloat(draft.pricePerPerson) || 0,
        priceUnit: 'persona' as any,
        images: draft.images,
        location: draft.location || draft.meetingCity,
        coordinates: selectedCityCoords || { lat: 0, lng: 0 },
        rating: 0,
        reviewCount: 0,
        reviews: [],
        owner: currentUser,
        features: draft.features.split(',').map(s => s.trim()).filter(s => s),
        rules: draft.rules.split(',').map(s => s.trim()).filter(s => s),
        deposit: 0,
        cleaningFee: parseFloat(draft.extraCost) || 0,
        status: 'published',
        cancellationPolicy: draft.cancellationPolicy,
        completenessScore: completeness,
        pickupAddress: draft.meetingAddress,
        pickupCity: draft.meetingCity,
        pickupInstructions: draft.meetingInstructions,
        zoneDescription: draft.zoneDescription,
        maxGuests: draft.maxParticipants,
        manualBadges: draft.manualBadges,
        store_id: null,
        // experience-specific
        priceType: draft.priceType,
        durationValue: draft.durationValue,
        durationUnit: draft.durationUnit,
        languages: draft.languages,
        difficulty: draft.difficulty,
        minAge: draft.minAge ? parseInt(draft.minAge) : undefined,
        included: draft.included.split(',').map(s => s.trim()).filter(s => s),
        notIncluded: draft.notIncluded.split(',').map(s => s.trim()).filter(s => s),
      };

      console.log('DEBUG PublishEsperienza – newListing:', newListing);

      // Pubblica il listing
      const savedListing = await onPublish(newListing) as any;

      // Salva gli slot su experience_slots
      if (savedListing?.id && draft.slots.length > 0) {
        const slotsToInsert = draft.slots
          .filter(s => s.startDate)
          .map(s => ({
            listing_id: savedListing.id,
            date: s.startDate,
            end_date: s.endDate || s.startDate,
            start_time: s.startTime || null,
            end_time: s.endTime || null,
            max_participants: s.maxParticipants,
            booked_count: 0,
            status: 'active',
          }));

        const { error } = await supabase
          .from('experience_slots')
          .insert(slotsToInsert);

        if (error) {
          console.error('Errore salvataggio slot:', error);
        }
      }

    } catch (error) {
      console.error('Errore durante handlePublish:', error);
      alert('Errore durante la pubblicazione. Riprova tra qualche istante.');
    } finally {
      setIsPublishing(false);
    }
  };

  // =====================
  // --- RENDER STEPS ---
  // =====================

  // STEP 1 — CATEGORIA
  const renderStepCategory = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      <div className="flex items-center mb-2">
        <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center mr-3">
          <Ticket className="w-5 h-5 text-brand" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Crea un'Esperienza</h2>
          <p className="text-sm text-gray-500">Tour, corsi, workshop, degustazioni, attività guidate...</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Categoria Esperienza</label>
        <select
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand focus:border-transparent bg-white"
          value={draft.subCategory}
          onChange={(e) => setDraft(d => ({ ...d, subCategory: e.target.value }))}
        >
          <option value="">Seleziona...</option>
          <optgroup label="🌊 MARE & NATURA ACQUATICA">
            <option value="escursione-barca">Escursione in Barca</option>
            <option value="gita-barca">Gita in Barca</option>
            <option value="crociera-giornaliera">Crociera Giornaliera</option>
            <option value="snorkeling-guidato">Snorkeling Guidato</option>
            <option value="pesca-sportiva">Pesca Sportiva</option>
            <option value="kayak-mare">Kayak da Mare</option>
            <option value="sup">SUP - Stand Up Paddle</option>
            <option value="windsurf">Windsurf</option>
            <option value="immersioni-guidate">Immersioni Guidate</option>
            <option value="vela-esperienza">Esperienza in Vela</option>
            <option value="whale-watching">Whale Watching</option>
          </optgroup>
          <optgroup label="🏄 SPORT & AVVENTURA">
            <option value="surf">Surf & Kitesurf</option>
            <option value="kayak">Kayak & Canoa</option>
            <option value="vela">Vela & Sailing</option>
            <option value="immersioni">Immersioni & Snorkeling</option>
            <option value="arrampicata">Arrampicata</option>
            <option value="escursioni">Escursioni & Trekking</option>
            <option value="mountain-bike">Mountain Bike</option>
            <option value="parapendio">Parapendio</option>
            <option value="equitazione">Equitazione</option>
            <option value="sci">Sci & Snowboard</option>
            <option value="golf">Golf</option>
            <option value="padel">Padel & Tennis</option>
            <option value="fitness-outdoor">Fitness Outdoor</option>
          </optgroup>
          <optgroup label="🌿 NATURA & AMBIENTE">
            <option value="birdwatching">Birdwatching</option>
            <option value="orto-giardino">Orto & Giardinaggio</option>
            <option value="foraging">Foraging & Erbe Selvatiche</option>
            <option value="astronomia">Astronomia & Stargazing</option>
            <option value="agriturismo">Agriturismo & Fattoria</option>
            <option value="eco-tour">Eco Tour</option>
            <option value="safari-fotografico">Safari Fotografico</option>
          </optgroup>
          <optgroup label="🍽️ FOOD & DRINK">
            <option value="degustazioni-vino">Degustazioni Vino</option>
            <option value="degustazioni-olio">Degustazioni Olio</option>
            <option value="degustazioni-birra">Degustazioni Birra Artigianale</option>
            <option value="corsi-cucina">Corsi di Cucina</option>
            <option value="cooking-class">Cooking Class</option>
            <option value="street-food-tour">Street Food Tour</option>
            <option value="cena-chef">Cena con Chef Privato</option>
            <option value="aperitivo-esperienziale">Aperitivo Esperienziale</option>
            <option value="wine-pairing">Wine Pairing</option>
            <option value="barista-experience">Barista Experience</option>
            <option value="pasticceria">Corso Pasticceria</option>
            <option value="pizza-making">Pizza Making</option>
          </optgroup>
          <optgroup label="✈️ TRAVEL & LOCALE">
            <option value="tour-in-bici">Tour in Bici</option>
            <option value="tour-in-vespa">Tour in Vespa</option>
            <option value="tour-a-piedi">Tour a Piedi</option>
            <option value="local-experience">Local Experience</option>
            <option value="homestay">Homestay & Cultura Locale</option>
          </optgroup>
          <optgroup label="👶 FAMIGLIA & BAMBINI">
            <option value="laboratori-bambini">Laboratori per Bambini</option>
            <option value="fattoria-didattica">Fattoria Didattica</option>
            <option value="animazione">Animazione & Feste</option>
            <option value="magia-bambini">Magia per Bambini</option>
          </optgroup>
          <optgroup label="🐾 ANIMALI & PET">
            <option value="pet-sitting">Pet Sitting</option>
            <option value="dog-walking">Dog Walking</option>
            <option value="addestramento">Addestramento Cani</option>
            <option value="toelettatura">Toelettatura</option>
            <option value="equitazione-esperienza">Equitazione & Cavalli</option>
          </optgroup>
          <optgroup label="🎨 ARTE & CULTURA">
            <option value="tour-guidati">Tour Guidati</option>
            <option value="visite-musei">Visite Musei & Gallerie</option>
            <option value="tour-storici">Tour Storici & Archeologici</option>
            <option value="tour-street-art">Tour Street Art</option>
            <option value="spettacoli">Spettacoli & Teatro</option>
            <option value="concerti">Concerti & Musica Live</option>
            <option value="cinema-all-aperto">Cinema all'Aperto</option>
          </optgroup>
          <optgroup label="🎭 SPETTACOLO & PERFORMATIVO">
            <option value="cabaret">Cabaret</option>
            <option value="burlesque">Burlesque</option>
            <option value="improvvisazione">Teatro di Improvvisazione</option>
            <option value="storytelling">Storytelling</option>
            <option value="spoken-word">Spoken Word & Poetry</option>
          </optgroup>
          <optgroup label="🎉 EVENTI & INTRATTENIMENTO">
            <option value="escape-room">Escape Room</option>
            <option value="caccia-tesoro">Caccia al Tesoro</option>
            <option value="quiz-trivia">Quiz & Trivia Night</option>
            <option value="giochi-ruolo">Giochi di Ruolo</option>
            <option value="stand-up-comedy">Stand-up Comedy</option>
            <option value="karaoke">Karaoke</option>
            <option value="magia">Spettacolo di Magia</option>
            <option value="team-building">Team Building</option>
          </optgroup>
          <optgroup label="🧘 BENESSERE & MINDFULNESS">
            <option value="yoga">Lezioni di Yoga</option>
            <option value="meditazione">Meditazione & Mindfulness</option>
            <option value="pilates">Pilates</option>
            <option value="massaggi">Massaggi & Trattamenti</option>
            <option value="spa-experience">Spa Experience</option>
            <option value="bagno-suono">Bagno nel Suono</option>
            <option value="reiki">Reiki & Energie</option>
            <option value="ritiro-benessere">Ritiro Benessere</option>
          </optgroup>
          <optgroup label="💊 SALUTE & TERAPIE">
            <option value="fisioterapia">Fisioterapia</option>
            <option value="osteopatia">Osteopatia</option>
            <option value="agopuntura">Agopuntura</option>
            <option value="naturopatia">Naturopatia</option>
            <option value="psicologia">Psicologia & Coaching</option>
          </optgroup>
          <optgroup label="🎓 CORSI & WORKSHOP">
            <option value="fotografia">Fotografia</option>
            <option value="pittura">Pittura & Disegno</option>
            <option value="ceramica">Ceramica & Scultura</option>
            <option value="mosaico">Mosaico</option>
            <option value="gioielleria">Gioielleria & Bigiotteria</option>
            <option value="cucito">Cucito & Sartoria</option>
            <option value="calligrafia">Calligrafia</option>
            <option value="musica">Lezioni di Musica</option>
            <option value="danza">Danza & Ballo</option>
            <option value="recitazione">Recitazione</option>
            <option value="lingue">Corsi di Lingua</option>
            <option value="coding">Coding & Tecnologia</option>
            <option value="marketing">Marketing & Business</option>
            <option value="artigianato">Artigianato Locale</option>
          </optgroup>
          <optgroup label="💼 BUSINESS & NETWORKING">
            <option value="networking">Networking Events</option>
            <option value="masterclass">Masterclass</option>
            <option value="mentoring">Mentoring Session</option>
            <option value="workshop-professionali">Workshop Professionali</option>
          </optgroup>
          <optgroup label="📚 ALTRO">
            <option value="altro">Altro</option>
          </optgroup>
        </select>
      </div>

      <div className="bg-brand/5 border border-brand/10 rounded-2xl p-4">
        <h4 className="text-sm font-bold text-brand mb-1">💡 Come funziona per le esperienze?</h4>
        <p className="text-xs text-gray-600">
          Crei un annuncio con slot di disponibilità (date e orari). I partecipanti prenotano uno slot e pagano a persona o per gruppo.
          Puoi avere più slot attivi contemporaneamente con capacità differenti.
        </p>
      </div>
    </div>
  );

  // STEP 2 — INFO BASE
  const renderStepInfo = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Titolo Esperienza *</label>
        <input
          type="text"
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand focus:border-transparent"
          placeholder="Es. Tour del Centro Storico al Tramonto"
          value={draft.title}
          onChange={(e) => setDraft(d => ({ ...d, title: e.target.value }))}
        />
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
          placeholder="Descrivi l'esperienza, cosa include e perché è unica..."
          value={draft.description}
          onChange={(e) => setDraft(d => ({ ...d, description: e.target.value }))}
        />
      </div>
    </div>
  );

  // STEP 3 — DETTAGLI
  const renderStepDetails = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      <h2 className="text-xl font-bold text-gray-900">Dettagli Esperienza</h2>

      {/* Durata + Partecipanti */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Durata</label>
          <div className="flex gap-2">
            <input
              type="number"
              className="w-full px-4 py-3 rounded-xl border border-gray-300"
              placeholder="Es. 3"
              value={draft.durationValue}
              onChange={(e) => setDraft(d => ({ ...d, durationValue: e.target.value }))}
            />
            <select
              className="px-3 py-3 rounded-xl border border-gray-300 bg-white"
              value={draft.durationUnit}
              onChange={(e) => setDraft(d => ({ ...d, durationUnit: e.target.value as any }))}
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
            className="w-full px-4 py-3 rounded-xl border border-gray-300"
            placeholder="Es. 10"
            value={draft.maxParticipants}
            onChange={(e) => setDraft(d => ({ ...d, maxParticipants: parseInt(e.target.value) || 1 }))}
          />
        </div>
      </div>

      {/* Lingua + Difficoltà */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lingua</label>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-gray-300"
            placeholder="Es. Italiano, Inglese"
            value={draft.languages}
            onChange={(e) => setDraft(d => ({ ...d, languages: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Difficoltà</label>
          <select
            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white"
            value={draft.difficulty}
            onChange={(e) => setDraft(d => ({ ...d, difficulty: e.target.value }))}
          >
            <option value="">Seleziona...</option>
            <option value="facile">🟢 Facile — per tutti</option>
            <option value="media">🟡 Media — buona forma fisica</option>
            <option value="difficile">🔴 Difficile — esperienza richiesta</option>
          </select>
        </div>
      </div>

      {/* Età minima */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Età Minima</label>
          <input
            type="number"
            className="w-full px-4 py-3 rounded-xl border border-gray-300"
            placeholder="Es. 18 (lascia vuoto se nessun limite)"
            value={draft.minAge}
            onChange={(e) => setDraft(d => ({ ...d, minAge: e.target.value }))}
          />
        </div>
      </div>

      {/* Caratteristiche */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Caratteristiche</label>
        <input
          type="text"
          className="w-full px-4 py-3 rounded-xl border border-gray-300"
          placeholder="Es. Attrezzatura inclusa, Guida certificata, Piccoli gruppi..."
          value={draft.features}
          onChange={(e) => setDraft(d => ({ ...d, features: e.target.value }))}
        />
        <p className="text-xs text-gray-400 mt-1">Separa con una virgola</p>
      </div>

      {/* Incluso / Non incluso */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">✅ Cosa è incluso</label>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-gray-300"
            placeholder="Es. Attrezzatura, Guida, Trasferimento, Pranzo..."
            value={draft.included}
            onChange={(e) => setDraft(d => ({ ...d, included: e.target.value }))}
          />
          <p className="text-xs text-gray-400 mt-1">Separa con una virgola</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">❌ Non incluso</label>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-gray-300"
            placeholder="Es. Volo, Alloggio, Assicurazione personale..."
            value={draft.notIncluded}
            onChange={(e) => setDraft(d => ({ ...d, notIncluded: e.target.value }))}
          />
          <p className="text-xs text-gray-400 mt-1">Separa con una virgola</p>
        </div>
      </div>

      {/* Regole */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">📋 Regole & Requisiti (opzionali)</label>
        <textarea
          className="w-full px-4 py-3 rounded-xl border border-gray-300 min-h-[100px]"
          placeholder="Es: Età minima 18 anni, Abbigliamento comodo, Prenotazione obbligatoria 48h prima..."
          value={draft.rules}
          onChange={(e) => setDraft(d => ({ ...d, rules: e.target.value }))}
        />
        <p className="text-xs text-gray-400 mt-1">Separa con una virgola</p>
      </div>
    </div>
  );

  // STEP 4 — SLOT & DATE

  const previewSlotCount = () => {
    if (!genStartDate || !genEndDate) return 0;
    const start = new Date(genStartDate + 'T00:00:00');
    const end = new Date(genEndDate + 'T00:00:00');
    let count = 0;
    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (genFrequency === 'daily' || genDays.includes(dayOfWeek)) count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const generateSlots = () => {
    if (!genStartDate || !genEndDate) {
      alert('Inserisci data inizio e fine.');
      return;
    }
    setIsGenerating(true);
    const start = new Date(genStartDate + 'T00:00:00');
    const end = new Date(genEndDate + 'T00:00:00');
    const newSlots: any[] = [];
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (genFrequency === 'daily' || genDays.includes(dayOfWeek)) {
        newSlots.push({
          id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          startDate: current.toISOString().split('T')[0],
          endDate: current.toISOString().split('T')[0],
          startTime: genStartTime || '',
          endTime: genEndTime || '',
          maxParticipants: genMaxParticipants,
        });
      }
      current.setDate(current.getDate() + 1);
    }

    if (newSlots.length === 0) {
      alert('Nessuno slot da generare con i parametri selezionati.');
      setIsGenerating(false);
      return;
    }

    setDraft(prev => ({ ...prev, slots: [...prev.slots, ...newSlots] }));
    setShowGenerator(false);
    setIsGenerating(false);
    alert(`✅ Generati ${newSlots.length} slot!`);
  };
  const renderStepSlots = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Slot & Disponibilità</h2>
          <p className="text-sm text-gray-500 mt-1">
            {draft.durationUnit === 'ore' ? 'Seleziona le date in cui offri questa esperienza' : 'Seleziona inizio e fine di ogni slot'}
          </p>
        </div>
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
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-gray-900">⚡ Genera Slot Automaticamente</h4>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Frequenza</label>
            <div className="flex gap-2">
              {[{ id: 'daily', label: 'Ogni giorno' }, { id: 'weekly', label: 'Giorni specifici' }].map(f => (
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

          {genFrequency !== 'daily' && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-xs font-medium text-gray-700">Giorni della settimana</label>
                <div className="relative group">
                  <div className="w-4 h-4 rounded-full bg-gray-300 text-white text-[10px] flex items-center justify-center cursor-pointer font-bold">i</div>
                  <div className="absolute left-0 bottom-6 w-64 bg-gray-800 text-white text-xs rounded-xl p-3 hidden group-hover:block z-50 shadow-lg">
                    📆 Seleziona i giorni della settimana in cui l'esperienza sarà disponibile.
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map((day, idx) => (
                  <button
                    key={idx}
                    onClick={() => setGenDays(prev => prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx])}
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

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="block text-xs font-medium text-gray-700">Periodo disponibilità</label>
              <div className="relative group">
                <div className="w-4 h-4 rounded-full bg-gray-300 text-white text-[10px] flex items-center justify-center cursor-pointer font-bold">i</div>
                <div className="absolute left-0 bottom-6 w-64 bg-gray-800 text-white text-xs rounded-xl p-3 hidden group-hover:block z-50 shadow-lg">
                  📅 Indica il periodo in cui vuoi rendere disponibile l'esperienza.
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Data Inizio</label>
                <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  value={genStartDate} min={new Date().toISOString().split('T')[0]}
                  onChange={e => setGenStartDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Data Fine</label>
                <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  value={genEndDate} min={genStartDate || new Date().toISOString().split('T')[0]}
                  onChange={e => setGenEndDate(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Orario Inizio</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white"
                value={genStartTime} onChange={e => setGenStartTime(e.target.value)}>
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
              <select className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white"
                value={genEndTime} onChange={e => setGenEndTime(e.target.value)}>
                <option value="">-- Nessuno --</option>
                {Array.from({ length: 48 }, (_, i) => {
                  const h = Math.floor(i / 2).toString().padStart(2, '0');
                  const m = i % 2 === 0 ? '00' : '30';
                  return <option key={`${h}:${m}`} value={`${h}:${m}`}>{`${h}:${m}`}</option>;
                })}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Max Partecipanti per Slot</label>
            <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
              value={genMaxParticipants} min={1}
              onChange={e => setGenMaxParticipants(parseInt(e.target.value) || 1)} />
          </div>

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
        <div className="flex justify-center overflow-x-auto">
          <AirbnbCalendar
            selectedStart={calendarStart}
            selectedEnd={calendarEnd}
            onChange={handleCalendarChange}
            onClose={() => setShowCalendar(false)}
            compact={true}
          />
        </div>
      )}

      {draft.slots.length === 0 && !showCalendar ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-gray-500 font-medium mb-1">Nessuno slot aggiunto</h3>
          <p className="text-sm text-gray-400 mb-4">Clicca "Aggiungi Slot" per inserire le date disponibili</p>
          <button
            onClick={() => setShowCalendar(true)}
            className="bg-brand text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-brand-dark"
          >
            + Aggiungi il primo slot
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {draft.slots.map((slot, idx) => (
            <div key={slot.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-700">
                  Slot #{idx + 1}
                  {slot.startDate && (
                    <span className="ml-2 text-brand font-normal">
                      {new Date(slot.startDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {slot.endDate && slot.endDate !== slot.startDate && (
                        ` → ${new Date(slot.endDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      )}
                    </span>
                  )}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => duplicateSlot(slot)}
                    className="text-xs text-brand font-medium hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Duplica
                  </button>
                  <button
                    onClick={() => removeSlot(slot.id)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max Partecipanti</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm"
                    value={slot.maxParticipants}
                    min={1}
                    onChange={(e) => updateSlot(slot.id, 'maxParticipants', parseInt(e.target.value) || 1)}
                  />
                </div>
                  <>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Orario Inizio</label>
                      <select
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm"
                        value={slot.startTime}
                        onChange={(e) => updateSlot(slot.id, 'startTime', e.target.value)}
                      >
                        <option value="">Seleziona</option>
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
                        value={slot.endTime}
                        onChange={(e) => updateSlot(slot.id, 'endTime', e.target.value)}
                      >
                        <option value="">Seleziona</option>
                        {Array.from({ length: 48 }, (_, i) => {
                          const hour = Math.floor(i / 2);
                          const minute = i % 2 === 0 ? '00' : '30';
                          const time = `${hour.toString().padStart(2, '0')}:${minute}`;
                          return <option key={time} value={time}>{time}</option>;
                        })}
                      </select>
                    </div>
                  </>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <Calendar className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-bold text-blue-900">💡 Consiglio</h4>
          <p className="text-xs text-blue-700 mt-1">
            Aggiungi più slot per aumentare le prenotazioni. Usa "Duplica" per copiare rapidamente lo stesso orario in date diverse.
            Puoi aggiungere nuovi slot in qualsiasi momento anche dopo la pubblicazione.
          </p>
        </div>
      </div>
    </div>
  );

  // STEP 5 — PREZZI & REGOLE
  const renderStepPricing = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">

      {/* Prezzo */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prezzo (€) *</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-bold">€</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="w-full pl-8 px-4 py-3 rounded-xl border border-gray-300 font-bold text-lg"
              placeholder="0.00"
              value={draft.pricePerPerson}
              onChange={(e) => setDraft(d => ({ ...d, pricePerPerson: e.target.value }))}
              onBlur={(e) => {
                const value = parseFloat(e.target.value);
                if (isNaN(value) || value < 0.01) setDraft(d => ({ ...d, pricePerPerson: '' }));
              }}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Prezzo</label>
          <select
            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white"
            value={draft.priceType}
            onChange={(e) => setDraft(d => ({ ...d, priceType: e.target.value as any }))}
          >
            <option value="persona">A persona</option>
            <option value="gruppo">Per il gruppo intero</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            {draft.priceType === 'persona'
              ? 'Es. €30 × 4 persone = €120 totale'
              : 'Es. €200 per il gruppo (qualunque sia il numero)'}
          </p>
        </div>
      </div>

      {/* Costo Extra */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Costi Aggiuntivi (Opzionali)</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Costo Extra (€)</label>
          <input
            type="number"
            className="w-full px-4 py-3 rounded-xl border border-gray-300"
            placeholder="0.00"
            value={draft.extraCost}
            onChange={(e) => setDraft(d => ({ ...d, extraCost: e.target.value }))}
          />
          <p className="text-xs text-gray-400 mt-1">Es. Biglietto ingresso museo, tassa turistica, materiali...</p>
        </div>
      </div>

      {/* Posizione */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-brand" />
          Luogo dell'Esperienza
        </h3>
        <div className="space-y-4">
          <CityAutocomplete
            value={draft.location}
            onChange={handleCitySelect}
            label="Città / Zona"
            required
            placeholder="Cerca una città italiana..."
            helperText="Questa informazione sarà visibile nell'annuncio pubblico."
          />

          {draft.location && draft.location.length > 2 && (
            <ListingMapStatic
              location={draft.location}
              category="spazio"
              height="150px"
              className="mt-2"
            />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione Zona</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm"
              rows={2}
              placeholder="Descrivi i dintorni, come arrivare, parcheggi..."
              value={draft.zoneDescription}
              onChange={(e) => setDraft(d => ({ ...d, zoneDescription: e.target.value }))}
            />
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-start mb-3">
              <Home className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-blue-900">Punto di Ritrovo</h4>
                <p className="text-xs text-blue-700">Visibile al partecipante solo dopo la conferma della prenotazione.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Via e Numero Civico</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white"
                  placeholder="Es. Piazza del Duomo 1"
                  value={draft.meetingAddress}
                  onChange={(e) => setDraft(d => ({ ...d, meetingAddress: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Città</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white"
                  placeholder="Es. Milano"
                  value={draft.meetingCity}
                  onChange={(e) => setDraft(d => ({ ...d, meetingCity: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Indicazioni di Ritrovo (opzionale)</label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm"
                rows={2}
                placeholder="Es. Ritrovo davanti alla fontana centrale. Parcheggio nelle vicinanze."
                value={draft.meetingInstructions}
                onChange={(e) => setDraft(d => ({ ...d, meetingInstructions: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Policy cancellazione */}
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-3">Politica di Cancellazione</label>
        <div className="space-y-3">
          {[
            { id: 'flexible', label: 'Flessibile', desc: 'Rimborso 100% fino a 24h prima.', color: 'green' },
            { id: 'moderate', label: 'Moderata', desc: 'Rimborso 100% fino a 5gg prima.', color: 'yellow' },
            { id: 'strict', label: 'Rigida', desc: 'Rimborso 50% fino a 7gg prima.', color: 'red' },
          ].map(policy => (
            <div
              key={policy.id}
              onClick={() => setDraft(d => ({ ...d, cancellationPolicy: policy.id as any }))}
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
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${draft.cancellationPolicy === policy.id ? 'border-brand' : 'border-gray-300'}`}>
                {draft.cancellationPolicy === policy.id && <div className="w-2.5 h-2.5 bg-brand rounded-full"></div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Badge */}
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

  // STEP 6 — MEDIA
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
        onClick={!isProcessingImages ? () => fileInputRef.current?.click() : undefined}
        className={`border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center transition-colors ${
          isProcessingImages ? 'bg-gray-50 cursor-wait' : 'hover:bg-gray-50 cursor-pointer'
        }`}
      >
        {isProcessingImages ? (
          <>
            <Loader2 className="w-12 h-12 text-brand mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-bold text-gray-900">Ottimizzazione immagini...</h3>
            <p className="text-gray-500 text-sm">Ridimensionamento e upload in corso</p>
          </>
        ) : (
          <>
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">Trascina qui le tue foto</h3>
            <p className="text-gray-500 text-sm mb-4">o clicca per caricare dal dispositivo</p>
            <button type="button" className="bg-white border border-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg text-sm hover:bg-gray-50">
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
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all">
                {idx > 0 && (
                  <button onClick={(e) => { e.stopPropagation(); moveImageLeft(idx); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/95 p-2 rounded-full text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {idx < draft.images.length - 1 && (
                  <button onClick={(e) => { e.stopPropagation(); moveImageRight(idx); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/95 p-2 rounded-full text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                  className="absolute top-2 right-2 bg-white/95 p-1.5 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110"
                >
                  <X className="w-4 h-4" />
                </button>
                {idx === 0 && (
                  <div className="absolute bottom-0 left-0 w-full bg-black/60 text-white text-xs font-medium text-center py-1.5">
                    Copertina
                  </div>
                )}
              </div>
            </div>
          ))}
          <div
            onClick={!isProcessingImages ? () => fileInputRef.current?.click() : undefined}
            className={`aspect-[4/3] bg-gray-50 rounded-xl border border-gray-200 border-dashed flex items-center justify-center text-gray-300 ${
              isProcessingImages ? 'cursor-wait' : 'cursor-pointer hover:bg-gray-100 hover:text-brand hover:border-brand/30'
            }`}
          >
            {isProcessingImages ? <Loader2 className="w-8 h-8 animate-spin" /> : <Plus className="w-8 h-8" />}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 opacity-40 pointer-events-none grayscale">
          <div className="aspect-[4/3] bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 text-xs">Copertina</div>
          <div className="aspect-[4/3] bg-gray-50 rounded-xl border border-gray-200 border-dashed flex items-center justify-center text-gray-300">+</div>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-xl flex items-start">
        <Shield className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-blue-900">Foto di qualità = Più prenotazioni</h4>
          <p className="text-xs text-blue-700 mt-1">
            Mostra le persone in azione durante l'esperienza. Foto reali aumentano la fiducia e le prenotazioni del 40%.
          </p>
        </div>
      </div>
    </div>
  );

  // STEP 7 — RIEPILOGO
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
            <p>Aggiungi foto, slot, descrizione completa e la città per migliorare il punteggio.</p>
          </div>
        )}
      </div>

      {/* Anteprima */}
      <div className="border border-gray-200 rounded-2xl p-4 flex bg-white shadow-sm">
        {draft.images.length > 0 ? (
          <img src={draft.images[0]} className="w-24 h-24 rounded-lg object-cover flex-shrink-0" alt="cover" />
        ) : (
          <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
            <Ticket className="w-8 h-8 text-gray-400" />
          </div>
        )}
        <div className="ml-4 flex-1">
          <div className="flex justify-between">
            <h4 className="font-bold text-gray-900">{draft.title || 'Titolo Esperienza'}</h4>
            <span className="text-brand font-bold">
              €{draft.pricePerPerson || '--'} {draft.priceType === 'persona' ? '/ pers.' : '/ gruppo'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{draft.description || 'Nessuna descrizione...'}</p>
          <div className="mt-3 flex gap-2 flex-wrap">
            <span className="text-xs bg-purple-100 px-2 py-1 rounded text-purple-700">Esperienza</span>
            {draft.durationValue && (
              <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                <Clock className="w-3 h-3 inline mr-1" />{draft.durationValue} {draft.durationUnit}
              </span>
            )}
            {draft.maxParticipants && (
              <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                <Users className="w-3 h-3 inline mr-1" />Max {draft.maxParticipants} pers.
              </span>
            )}
            {draft.meetingCity && (
              <span className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-700 flex items-center">
                <MapPin className="w-3 h-3 mr-1" />{draft.meetingCity}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Riepilogo slot */}
      {draft.slots.length > 0 && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <h4 className="text-sm font-bold text-green-900 flex items-center mb-2">
            <Calendar className="w-4 h-4 mr-2" />
            {draft.slots.length} Slot Programmati
          </h4>
          <div className="space-y-1">
            {draft.slots.slice(0, 3).map((slot, idx) => (
              <p key={slot.id} className="text-sm text-green-800">
                {slot.startDate ? new Date(slot.startDate).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'long' }) : `Slot #${idx + 1} — data da impostare`}
                {slot.startTime && slot.endTime && ` · ${slot.startTime}–${slot.endTime}`}
                {` · max ${slot.maxParticipants} pers.`}
              </p>
            ))}
            {draft.slots.length > 3 && (
              <p className="text-xs text-green-600">+{draft.slots.length - 3} altri slot...</p>
            )}
          </div>
        </div>
      )}

      {/* Riepilogo punto ritrovo */}
      {(draft.meetingAddress || draft.meetingCity) && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <h4 className="text-sm font-bold text-blue-900 flex items-center mb-2">
            <Home className="w-4 h-4 mr-2" />
            Punto di Ritrovo (privato)
          </h4>
          <p className="text-sm text-blue-800">
            {draft.meetingAddress && <span>{draft.meetingAddress}, </span>}
            {draft.meetingCity}
          </p>
          {draft.meetingInstructions && (
            <p className="text-xs text-blue-700 mt-1 italic">"{draft.meetingInstructions}"</p>
          )}
          <p className="text-xs text-blue-600 mt-2">✓ Visibile al partecipante solo dopo la conferma</p>
        </div>
      )}
    </div>
  );

  // =====================
  // --- RENDER ROOT ---
  // =====================
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl sm:max-w-full lg:max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="font-bold text-gray-900 flex items-center">
            <Ticket className="w-5 h-5 mr-2 text-brand" /> Nuova Esperienza
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

      <div className="flex-1 max-w-4xl sm:max-w-full lg:max-w-6xl mx-auto w-full px-4 sm:px-2 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar steps */}
        <div className="hidden lg:block lg:col-span-3 space-y-2">
          {STEPS.map(step => (
            <div
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`flex items-center p-3 rounded-xl transition-colors cursor-pointer ${
                currentStep === step.id
                  ? 'bg-brand text-white shadow-md'
                  : currentStep > step.id
                    ? 'text-brand font-medium hover:bg-brand/10'
                    : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <step.icon className={`w-5 h-5 mr-3 ${currentStep === step.id ? 'text-brand-accent' : ''}`} />
              <span className="text-sm font-medium">{step.title}</span>
              {currentStep > step.id && <CheckCircle2 className="w-4 h-4 ml-auto" />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-9">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[400px] flex flex-col">
            <div className="flex-1">
              {currentStep === 1 && renderStepCategory()}
              {currentStep === 2 && renderStepInfo()}
              {currentStep === 3 && renderStepDetails()}
              {currentStep === 4 && renderStepSlots()}
              {currentStep === 5 && renderStepPricing()}
              {currentStep === 6 && renderStepMedia()}
              {currentStep === 7 && renderStepSummary()}
            </div>

            <div className="mt-10 pt-6 border-t border-gray-100 flex justify-between items-center">
              <button
                onClick={handleBack}
                disabled={isPublishing}
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
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Pubblicazione...</>
                  ) : (
                    'Pubblica Esperienza'
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
