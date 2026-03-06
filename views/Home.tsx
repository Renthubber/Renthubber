import React, { useState, useRef, useEffect } from 'react';
import { Listing, ListingCategory } from '../types';
import { ListingCard } from '../components/ListingCard';
import { Search, SlidersHorizontal, Box, LayoutGrid, MapPin, Euro, Calendar, X, Sparkles, SearchX } from 'lucide-react';
import { CityAutocomplete } from '../components/CityAutocomplete';
import { CitySuggestion, searchItalianCities } from '../services/geocodingService';
import { AirbnbCalendar } from '../components/AirbnbCalendar';
import { FeaturedListings } from '../components/FeaturedListings';
import { findRelatedKeywords, getSearchExamples } from '../services/searchKeywords';

// ========== HAVERSINE DISTANCE (km) ==========
const haversineDistance = (
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number => {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ========== NORMALIZZA TESTO (rimuovi accenti, lowercase) ==========
const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

// ========== LEVENSHTEIN DISTANCE ==========
const levenshteinDistance = (a: string, b: string): number => {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  if (Math.abs(a.length - b.length) > 3) return Math.abs(a.length - b.length);
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) matrix[i] = [i];
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
};

// ========== FUZZY MATCH ==========
const fuzzyMatch = (text: string, query: string): boolean => {
  const nt = normalizeText(text);
  const nq = normalizeText(query);
  if (nt.includes(nq)) return true;
  const queryWords = nq.split(/\s+/).filter(w => w.length >= 2);
  if (queryWords.length > 1) {
    const matchCount = queryWords.filter(w => nt.includes(w)).length;
    if (matchCount >= Math.ceil(queryWords.length * 0.6)) return true;
  }
  const textWords = nt.split(/\s+/);
  const words = queryWords.length > 0 ? queryWords : [nq];
  for (const qw of words) {
    const tolerance = qw.length < 5 ? 1 : 2;
    for (const tw of textWords) {
      if (tw.startsWith(qw) || qw.startsWith(tw)) return true;
      if (levenshteinDistance(qw, tw) <= tolerance) return true;
    }
  }
  return false;
};


interface HomeProps {
  onListingClick: (listing: Listing) => void;
  listings: Listing[];
  bookings?: any[]; // ✅ NUOVO: array prenotazioni dal DB
  currentUser?: any;
}

export const Home: React.FC<HomeProps> = ({ onListingClick, listings, bookings = [], currentUser }) => {
  const [activeTab, setActiveTab] = useState<ListingCategory>('oggetto');
  
  // ========== SEARCH BAR STATE ==========
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [selectedCitySuggestion, setSelectedCitySuggestion] = useState<CitySuggestion | null>(null);
  const [searchDateStart, setSearchDateStart] = useState<Date | undefined>(undefined);
  const [searchDateEnd, setSearchDateEnd] = useState<Date | undefined>(undefined);
  
 // Dropdown state
const [activeDropdown, setActiveDropdown] = useState<'search' | 'where' | 'dates' | null>(null);

// Mobile search modal
const [showMobileSearch, setShowMobileSearch] = useState(false);

const searchBarRef = useRef<HTMLDivElement>(null);
  
  // AI suggestions
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  
  // City suggestions
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  
  // Filtri avanzati (esistenti)
  const [showFilters, setShowFilters] = useState(false);
  const [filterRadius, setFilterRadius] = useState(50);
  const [filterPriceMin, setFilterPriceMin] = useState<number | ''>('');
  const [filterPriceMax, setFilterPriceMax] = useState<number | ''>('');

  // ========== CLICK OUTSIDE HANDLER ==========
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    // Non chiudere se il modale mobile è aperto
    if (showMobileSearch) return;
    
    if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
      setActiveDropdown(null);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [showMobileSearch]);

  // ========== AI SEARCH HANDLER ==========
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const related = findRelatedKeywords(searchQuery);
      setAiSuggestions(related.slice(0, 8)); // Max 8 suggerimenti
    } else {
      setAiSuggestions([]);
    }
  }, [searchQuery]);

  // ========== CITY SEARCH HANDLER ==========
  useEffect(() => {
    if (searchCity.length < 2) {
      setCitySuggestions([]);
      return;
    }

    const debounce = setTimeout(async () => {
      setLoadingCities(true);
      try {
        const results = await searchItalianCities(searchCity);
        setCitySuggestions(results);
      } catch (error) {
        console.error('Errore ricerca città:', error);
        setCitySuggestions([]);
      } finally {
        setLoadingCities(false);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchCity]);

  // ========== HANDLERS ==========
  const handleCityChange = (value: string, suggestion?: CitySuggestion) => {
    setSearchCity(value);
    if (suggestion) {
      setSelectedCitySuggestion(suggestion);
    } else {
      setSelectedCitySuggestion(null);
    }
  };

  const handleDateChange = (start: Date | undefined, end: Date | undefined) => {
    setSearchDateStart(start);
    setSearchDateEnd(end);
    if (start && end) {
      setActiveDropdown(null); // Chiudi calendario quando selezione completa
    }
  };

  const handleSearch = () => {
    setActiveDropdown(null);
  };

  // ========== CONTROLLO DISPONIBILITÀ DATE ==========
  const isListingAvailable = (listingId: string): boolean => {
    // Se non ci sono date selezionate, mostra tutti gli annunci
    if (!searchDateStart || !searchDateEnd) {
      return true;
    }

    // Trova tutte le prenotazioni confermate/attive per questo listing
    const listingBookings = bookings.filter(b => {
      // Filtra per listing
      if (b.listing_id !== listingId && b.listingId !== listingId) {
        return false;
      }

      // Filtra solo prenotazioni attive (non cancellate/rifiutate)
      const activeStatuses = ['pending', 'accepted', 'confirmed', 'paid', 'active', 'completed'];
      return activeStatuses.includes(b.status);
    });

    // Controlla sovrapposizioni con le date di ricerca
    const searchStart = searchDateStart.toISOString().split('T')[0];
    const searchEnd = searchDateEnd.toISOString().split('T')[0];

    for (const booking of listingBookings) {
      const bookingStart = (booking.start_date || booking.startDate || '').split('T')[0];
      const bookingEnd = (booking.end_date || booking.endDate || '').split('T')[0];

      // Controlla sovrapposizione: booking si sovrappone se:
      // start_booking <= end_ricerca AND end_booking >= start_ricerca
      if (bookingStart <= searchEnd && bookingEnd >= searchStart) {
        return false; // ❌ Occupato in quel periodo
      }
    }

    return true; // ✅ Disponibile
  };

  // ========== FILTRO LISTINGS CON AI + FUZZY + DISTANZA ==========
  const filteredListings = listings.filter((l) => {
    if (l.status !== 'published') return false;
    if (l.category !== activeTab) return false;
    
    // Filtro ricerca testuale con fuzzy match + AI
    if (searchQuery) {
      const titleMatch = fuzzyMatch(l.title, searchQuery);
      const descMatch = l.description ? fuzzyMatch(l.description, searchQuery) : false;
      const featuresMatch = l.features?.some(f => fuzzyMatch(f, searchQuery)) || false;
      
      // AI: controlla keywords correlate con fuzzy
      const aiMatch = aiSuggestions.some(keyword => 
        fuzzyMatch(l.title, keyword) ||
        (l.description ? fuzzyMatch(l.description, keyword) : false)
      );
      
      if (!titleMatch && !descMatch && !featuresMatch && !aiMatch) return false;
    }
    
    // Filtro città/location con coordinate reali
    if (selectedCitySuggestion && l.coordinates?.lat && l.coordinates?.lng) {
      // Usa distanza reale Haversine
      const distance = haversineDistance(
        selectedCitySuggestion.lat, selectedCitySuggestion.lng,
        l.coordinates.lat, l.coordinates.lng
      );
      if (distance > filterRadius) return false;
    } else if (searchCity) {
      // Fallback: match testuale su location, città, provincia, regione
      const normalizedCity = normalizeText(searchCity);
      const locationMatch = l.location ? fuzzyMatch(l.location, searchCity) : false;
      if (!locationMatch) return false;
    }
    
    // Filtro disponibilità per date
    if (!isListingAvailable(l.id)) return false;
    
    // Filtro prezzo
    if (filterPriceMin !== '' && l.price < filterPriceMin) return false;
    if (filterPriceMax !== '' && l.price > filterPriceMax) return false;
    
    return true;
  });

  const resetFilters = () => {
    setSearchQuery('');
    setSearchCity('');
    setSelectedCitySuggestion(null);
    setSearchDateStart(undefined);
    setSearchDateEnd(undefined);
    setFilterRadius(50);
    setFilterPriceMin('');
    setFilterPriceMax('');
    setAiSuggestions([]);
  };

  const hasActiveFilters = searchQuery !== '' || searchCity !== '' || searchDateStart !== undefined || filterPriceMin !== '' || filterPriceMax !== '';

  // Format date per display
  const formatDateRange = () => {
    if (searchDateStart && searchDateEnd) {
      return `${searchDateStart.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} - ${searchDateEnd.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}`;
    }
    if (searchDateStart) {
      return `${searchDateStart.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} - ?`;
    }
    return 'Aggiungi date';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero / Search Section */}
      <div className="bg-brand text-white pt-12 pb-24 px-4 relative" style={{ overflow: 'visible' }}>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
        <div className="max-w-4xl mx-auto text-center relative" style={{ zIndex: 100 }}>
          <h1 className="text-3xl md:text-5xl font-bold mb-8">
            Noleggia qualsiasi cosa, <br /> ovunque tu sia.
          </h1>

         {/* ========== SEARCH BAR COMPATTA MOBILE ========== */}
<div 
  className="md:hidden bg-white rounded-full shadow-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:shadow-2xl transition-shadow"
  onClick={() => setShowMobileSearch(true)}
>
  <Search className="w-5 h-5 text-gray-500" />
  <div className="flex-1">
    <p className="text-sm font-medium text-gray-800">
      {searchQuery || 'Cosa cerchi?'}
    </p>
    <p className="text-xs text-gray-400">
      {searchCity || 'Ovunque'} • {searchDateStart ? formatDateRange() : 'Qualsiasi data'}
    </p>
  </div>
</div>

{/* ========== SEARCH BAR DESKTOP ========== */}
<div ref={searchBarRef} className="relative max-w-3xl mx-auto z-50 hidden md:block">
            
            {/* Barra principale */}
            <div className={`bg-white rounded-2xl md:rounded-full shadow-2xl flex flex-col md:flex-row md:items-center transition-all ${activeDropdown ? 'shadow-3xl' : ''}`}>
              
              {/* 1️⃣ COSA CERCHI (con AI) */}
              <div 
                className={`flex-1 px-6 py-4 cursor-pointer rounded-t-2xl md:rounded-l-full md:rounded-tr-none transition-colors ${activeDropdown === 'search' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                onClick={() => setActiveDropdown(activeDropdown === 'search' ? null : 'search')}
              >
                <div className="text-left">
                  <p className="text-[11px] font-bold text-gray-800 uppercase tracking-wide">Cosa cerchi?</p>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdown('search');
                    }}
                    placeholder="Cerca o descrivi..."
                    className="w-full text-sm text-gray-800 placeholder-gray-400 bg-transparent border-none outline-none"
                  />
                </div>
              </div>
              
              {/* Separatore */}
              <div className="h-px md:h-8 w-full md:w-px bg-gray-200"></div>
              
              {/* 2️⃣ DOVE */}
              <div 
                className={`flex-1 px-6 py-4 cursor-pointer transition-colors ${activeDropdown === 'where' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                onClick={() => setActiveDropdown(activeDropdown === 'where' ? null : 'where')}
              >
                <div className="text-left">
                  <p className="text-[11px] font-bold text-gray-800 uppercase tracking-wide">Dove</p>
                  <input
                    type="text"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdown('where');
                    }}
                    placeholder="Ovunque"
                    className="w-full text-sm text-gray-800 placeholder-gray-400 bg-transparent border-none outline-none"
                  />
                </div>
              </div>
              
              {/* Separatore */}
              <div className="h-px md:h-8 w-full md:w-px bg-gray-200"></div>
              
              {/* Wrapper per DATE + BOTTONE - su stessa riga mobile */}
              <div className="flex items-center rounded-b-2xl md:rounded-none md:rounded-r-full overflow-hidden">
                {/* 3️⃣ DATE */}
                <div 
                  className={`flex-1 px-6 py-4 cursor-pointer transition-colors ${activeDropdown === 'dates' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                  onClick={() => setActiveDropdown(activeDropdown === 'dates' ? null : 'dates')}
                >
                  <div className="text-left">
                    <p className="text-[11px] font-bold text-gray-800 uppercase tracking-wide">Date</p>
                    <p className={`text-sm ${searchDateStart ? 'text-gray-800' : 'text-gray-400'}`}>
                      {formatDateRange()}
                    </p>
                  </div>
                </div>
                
                {/* 4️⃣ BOTTONE CERCA */}
                <div className="pr-2 py-2">
                  <button 
                    onClick={handleSearch}
                    className="flex items-center gap-2 text-gray-800 font-bold py-3 px-6 rounded-full transition-all hover:shadow-lg hover:scale-105"
                    style={{ backgroundColor: '#FFD93D' }}
                  >
                    <Search className="w-5 h-5" />
                    <span className="hidden sm:inline">Cerca</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ========== DROPDOWN: RICERCA AI ========== */}
            {activeDropdown === 'search' && (
              <div className="absolute top-full left-0 mt-3 w-full md:w-[400px] bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-brand" />
                  <p className="text-sm font-semibold text-gray-800">Ricerca intelligente</p>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Descrivi cosa ti serve e troveremo gli oggetti e spazi giusti per te.
                </p>
                
                {/* Suggerimenti AI */}
                {aiSuggestions.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Potrebbe interessarti:</p>
                    <div className="flex flex-wrap gap-2">
                      {aiSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSearchQuery(suggestion)}
                          className="px-3 py-1.5 text-xs font-medium bg-brand/10 text-brand rounded-full hover:bg-brand/20 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Esempi */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Prova a cercare:</p>
                  <div className="space-y-2">
                    {getSearchExamples().map((example) => (
                      <button
                        key={example}
                        onClick={() => {
                          setSearchQuery(example);
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        🔍 {example}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========== DROPDOWN: DOVE (Suggerimenti Città) ========== */}
            {activeDropdown === 'where' && (
              <div className="absolute top-full left-0 md:left-1/4 mt-3 w-full md:w-[350px] bg-white rounded-3xl shadow-2xl border border-gray-100 p-4 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                
                {/* Opzione "Ovunque" */}
                <button
                  onClick={() => {
                    setSearchCity('');
                    setSelectedCitySuggestion(null);
                    setCitySuggestions([]);
                    setActiveDropdown(null);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Ovunque</p>
                    <p className="text-xs text-gray-500">Cerca in tutta Italia</p>
                  </div>
                </button>

                {/* Loading */}
                {loadingCities && (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}

                {/* Suggerimenti città */}
                {citySuggestions.length > 0 && !loadingCities && (
                  <div className="mt-2 border-t border-gray-100 pt-2 max-h-60 overflow-y-auto">
                    {citySuggestions.map((suggestion, idx) => (
                      <button
                        key={`${suggestion.city}-${idx}`}
                        onClick={() => {
                          setSearchCity(suggestion.displayName);
                          setSelectedCitySuggestion(suggestion);
                          setCitySuggestions([]);
                          setActiveDropdown(null);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-gray-50 rounded-xl transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div>
                          <span className="text-sm font-medium text-gray-800">{suggestion.city}</span>
                          {suggestion.province && (
                            <span className="text-sm text-gray-500 ml-1">({suggestion.province})</span>
                          )}
                          {suggestion.region && (
                            <span className="text-xs text-gray-400 ml-2">{suggestion.region}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Nessun risultato */}
                {searchCity.length >= 2 && citySuggestions.length === 0 && !loadingCities && (
                  <div className="text-center py-4 text-sm text-gray-500">
                    Nessuna città trovata per "{searchCity}"
                  </div>
                )}
              </div>
            )}

            {/* ========== DROPDOWN: DATE (Calendario Airbnb) ========== */}
            {activeDropdown === 'dates' && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 md:left-auto md:right-0 md:translate-x-0 mt-3 z-[100]">
                <AirbnbCalendar
                  selectedStart={searchDateStart}
                  selectedEnd={searchDateEnd}
                  onChange={handleDateChange}
                  location={searchCity || 'la tua destinazione'}
                />
              </div>
            )}
          </div>

         {/* ========== MODALE RICERCA MOBILE ========== */}
{showMobileSearch && (
  <div className="fixed inset-0 bg-white z-[200] md:hidden overflow-y-auto pt-16">
    <div className="p-4" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => setShowMobileSearch(false)}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>
        <h2 className="font-bold text-gray-900">Cerca</h2>
        <button 
          onClick={resetFilters}
          className="text-sm text-brand font-medium"
        >
          Reset
        </button>
      </div>

     {/* Cosa cerchi */}
<div className="mb-4">
  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">
    Cosa cerchi?
  </label>
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Cerca o descrivi..."
      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none text-gray-800"
    />
  </div>
  {/* Suggerimenti AI */}
  {aiSuggestions.length > 0 && (
    <div className="mt-3">
      <p className="text-xs font-semibold text-gray-600 mb-2">Potrebbe interessarti:</p>
      <div className="flex flex-wrap gap-2">
        {aiSuggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => setSearchQuery(suggestion)}
            className="px-3 py-1.5 text-xs font-medium bg-brand/10 text-brand rounded-full hover:bg-brand/20 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )}
</div>

      {/* Dove */}
      <div className="mb-4">
        <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">
          Dove
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
  type="text"
  value={searchCity}
  onChange={(e) => setSearchCity(e.target.value)}
  placeholder="Ovunque"
  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none text-gray-800"
/>
        </div>
        {/* Suggerimenti città */}
        {citySuggestions.length > 0 && (
          <div className="mt-2 bg-white border border-gray-200 rounded-xl max-h-40 overflow-y-auto">
            {citySuggestions.map((suggestion, idx) => (
              <button
                key={`mobile-${suggestion.city}-${idx}`}
                onClick={() => {
                  setSearchCity(suggestion.displayName);
                  setSelectedCitySuggestion(suggestion);
                  setCitySuggestions([]);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"
              >
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-800">{suggestion.city}</span>
                {suggestion.province && (
                  <span className="text-xs text-gray-500">({suggestion.province})</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Date */}
<div className="mb-6">
  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">
    Date
  </label>
  <div 
    onClick={() => setActiveDropdown(activeDropdown === 'dates' ? null : 'dates')}
    className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl cursor-pointer hover:border-brand"
  >
    <Calendar className="w-5 h-5 text-gray-400" />
    <span className={`text-sm ${searchDateStart ? 'text-gray-800' : 'text-gray-400'}`}>
      {formatDateRange()}
    </span>
  </div>
  {activeDropdown === 'dates' && (
    <div className="mt-3" onClick={(e) => e.stopPropagation()}>
      <AirbnbCalendar
        selectedStart={searchDateStart}
        selectedEnd={searchDateEnd}
        onChange={(start, end) => {
          handleDateChange(start, end);
          if (start && end) setActiveDropdown(null);
        }}
        location={searchCity || 'la tua destinazione'}
      />
    </div>
  )}
</div>

      {/* Bottone Cerca */}
      <button
        onClick={() => {
          setShowMobileSearch(false);
          handleSearch();
        }}
        className="w-full py-4 rounded-xl font-bold text-gray-800 flex items-center justify-center gap-2"
        style={{ backgroundColor: '#FFD93D' }}
      >
        <Search className="w-5 h-5" />
        Cerca
      </button>
    </div>
  </div>
)}

        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 flex justify-center">
        <div className="bg-white rounded-xl shadow-lg p-2 inline-flex space-x-2">
          <button
            onClick={() => setActiveTab('oggetto')}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'oggetto'
                ? 'bg-brand text-white shadow-md'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Box className="w-4 h-4 mr-2" />
            Oggetti
          </button>
          <button
            onClick={() => setActiveTab('spazio')}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'spazio'
                ? 'bg-brand text-white shadow-md'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Spazi
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          {activeTab === 'oggetto' ? 'Oggetti consigliati' : 'Spazi disponibili'}
        </h2>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center border px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
            hasActiveFilters 
              ? 'bg-brand text-white border-brand' 
              : 'text-gray-600 hover:text-brand border-gray-300 hover:border-brand'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filtri
          {hasActiveFilters && <span className="ml-2 bg-white text-brand text-xs px-2 py-0.5 rounded-full">Attivi</span>}
        </button>
      </div>

      {/* Pannello Filtri Avanzati */}
      {showFilters && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Filtri avanzati</h3>
              <button 
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Prezzo */}
              <div className="space-y-3">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <Euro className="w-4 h-4 mr-2 text-brand" />
                  Fascia di prezzo
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={filterPriceMin}
                      onChange={(e) => setFilterPriceMin(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <span className="text-gray-400">—</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filterPriceMax}
                      onChange={(e) => setFilterPriceMax(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
                {/* Fasce rapide */}
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => { setFilterPriceMin(''); setFilterPriceMax(20); }}
                    className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-brand hover:text-white rounded-full transition-colors"
                  >
                    Economico (&lt;€20)
                  </button>
                  <button 
                    onClick={() => { setFilterPriceMin(20); setFilterPriceMax(50); }}
                    className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-brand hover:text-white rounded-full transition-colors"
                  >
                    Medio (€20-50)
                  </button>
                  <button 
                    onClick={() => { setFilterPriceMin(50); setFilterPriceMax(''); }}
                    className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-brand hover:text-white rounded-full transition-colors"
                  >
                    Premium (&gt;€50)
                  </button>
                </div>
              </div>

              {/* Raggio */}
              <div className="space-y-3">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <MapPin className="w-4 h-4 mr-2 text-brand" />
                  Raggio di ricerca
                </label>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Distanza massima</span>
                    <span className="font-semibold text-brand">{filterRadius} km</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="200"
                    step="5"
                    value={filterRadius}
                    onChange={(e) => setFilterRadius(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>5 km</span>
                    <span>200 km</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Azioni */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
              <button
                onClick={resetFilters}
                className="text-sm text-gray-500 hover:text-brand font-medium"
              >
                Resetta filtri
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors shadow-md"
                style={{ backgroundColor: '#FFD93D', color: '#333' }}
              >
                Applica filtri
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Listing Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">

        {filteredListings.length > 0 ? (
          <FeaturedListings
            listings={filteredListings}
            userCity={currentUser?.city}
            onListingClick={onListingClick}
            currentUser={currentUser}
          />
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <SearchX className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Nessun risultato trovato
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              {searchQuery && searchCity
                ? `Non abbiamo trovato "${searchQuery}" vicino a ${searchCity}. Prova a cambiare i filtri o ampliare il raggio.`
                : searchQuery
                ? `Non abbiamo trovato risultati per "${searchQuery}". Prova con un termine diverso.`
                : searchCity
                ? `Non ci sono ancora annunci vicino a ${searchCity}. Prova ad ampliare il raggio di ricerca.`
                : 'Prova a modificare i filtri di ricerca.'}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={resetFilters}
                className="px-6 py-2.5 text-sm font-semibold text-white rounded-full transition-colors bg-brand hover:bg-brand/90"
              >
                Resetta filtri
              </button>
              {filterRadius < 100 && selectedCitySuggestion && (
                <button
                  onClick={() => setFilterRadius(Math.min(filterRadius + 50, 200))}
                  className="px-6 py-2.5 text-sm font-semibold text-brand border-2 border-brand rounded-full hover:bg-brand/5 transition-colors"
                >
                  Amplia raggio a {Math.min(filterRadius + 50, 200)} km
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};