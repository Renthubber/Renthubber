import React from 'react';
import { TrendingUp, Star, MapPin, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { Listing } from '../types';

interface FeaturedListingsProps {
  listings: Listing[];
  userCity?: string;
  onListingClick: (listing: Listing) => void;
}

export const FeaturedListings: React.FC<FeaturedListingsProps> = ({
  listings,
  userCity,
  onListingClick,
}) => {
  
  // ========== SEZIONE 1: PIÙ POPOLARI (per visualizzazioni) ==========
  const popularListings = [...listings]
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, 12);

  // ========== SEZIONE 2: TOP RECENSIONI (per rating) ==========
  const topRatedListings = [...listings]
    .filter(l => (l.rating || 0) >= 4.5 && (l.reviewCount || 0) >= 3)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 12);

  // ========== SEZIONE 3: VICINO A TE (per città) ==========
  const nearbyListings = userCity
    ? [...listings]
        .filter(l => l.location?.toLowerCase().includes(userCity.toLowerCase()))
        .slice(0, 12)
    : [];

  // ========== SEZIONE 4: NUOVI ARRIVI (per data creazione) ==========
  const recentListings = [...listings]
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 12);

  // ========== SEZIONE 5: PER TE (mix casuale/AI-powered) ==========
  const forYouListings = [...listings]
    .sort(() => Math.random() - 0.5) // Shuffle casuale (può essere migliorato con AI)
    .slice(0, 12);

  // ========== RENDER SINGOLA CARD ==========
  const renderCard = (listing: Listing) => {
    // Check se superhubber (adatta in base alla tua struttura dati)
    const isSuperHubber = (listing as any).owner?.isSuperHubber || (listing as any).isSuperHubber || false;
    
    return (
      <div
        key={listing.id}
        onClick={() => onListingClick(listing)}
        className="flex-shrink-0 w-[160px] sm:w-[200px] md:w-[220px] bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
      >
        {/* Immagine */}
        <div className="relative h-[140px] sm:h-[160px] overflow-hidden">
          <img
            src={listing.images?.[0] || '/placeholder.jpg'}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          {/* Badge categoria */}
          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-gray-700">
            {listing.category === 'oggetto' ? '📦 Oggetto' : '🏠 Spazio'}
          </div>
          {/* Cuore preferiti */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implementare logica salva preferiti
              console.log('Salva preferito:', listing.id);
            }}
            className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full hover:bg-white transition-colors"
          >
            <svg className="w-4 h-4 text-gray-700 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          {/* Badge SuperHubber */}
          {isSuperHubber && (
            <div className="absolute bottom-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 shadow-md">
              <Star className="w-2.5 h-2.5 fill-current" />
              SUPER
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-2.5 sm:p-3">
          <h3 className="font-bold text-gray-900 text-xs sm:text-sm mb-1 truncate">
            {listing.title}
          </h3>
          <p className="text-[10px] sm:text-xs text-gray-500 mb-1.5 flex items-center gap-0.5 truncate">
            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
            {listing.location}
          </p>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm sm:text-base font-bold text-brand">€{listing.price}</span>
              <span className="text-[10px] sm:text-xs text-gray-500">/{listing.priceUnit}</span>
            </div>
            {/* Rating stelle */}
            {listing.rating && listing.rating > 0 && (
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <span className="text-[10px] sm:text-xs font-semibold text-gray-700">{listing.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ========== RENDER SEZIONE CAROUSEL ==========
  const renderSection = (
    title: string,
    listings: Listing[],
    icon: React.ReactNode,
    gradient: string
  ) => {
    // Non mostrare se 0 annunci
    if (listings.length === 0) return null;

    return (
      <div className="mb-12">
        {/* Header sezione */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* Badge carino */}
            <span className={`inline-flex items-center gap-2 px-4 py-2 ${gradient} text-white rounded-full font-bold text-sm shadow-md`}>
              {icon}
              {title}
            </span>
            <span className="text-gray-400 text-sm">
              {listings.length} {listings.length === 1 ? 'annuncio' : 'annunci'}
            </span>
          </div>
          {/* Vedi tutti button */}
          <button className="flex items-center gap-2 text-brand hover:text-brand-dark font-semibold text-sm transition-colors">
            Vedi tutti
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Carousel scorrevole */}
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
            {listings.map(listing => renderCard(listing))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* 🔥 PIÙ POPOLARI */}
      {renderSection(
        'Più Popolari',
        popularListings,
        <TrendingUp className="w-4 h-4" />,
        'bg-gradient-to-r from-orange-500 to-red-500'
      )}

      {/* ⭐ TOP RECENSIONI */}
      {renderSection(
        'Top Recensioni',
        topRatedListings,
        <Star className="w-4 h-4" />,
        'bg-gradient-to-r from-yellow-400 to-orange-400'
      )}

      {/* 📍 VICINO A TE */}
      {renderSection(
        'Vicino a Te',
        nearbyListings,
        <MapPin className="w-4 h-4" />,
        'bg-gradient-to-r from-blue-500 to-cyan-500'
      )}

      {/* 🆕 NUOVI ARRIVI */}
      {renderSection(
        'Nuovi Arrivi',
        recentListings,
        <Clock className="w-4 h-4" />,
        'bg-gradient-to-r from-green-500 to-emerald-500'
      )}

      {/* ✨ PER TE */}
      {renderSection(
        'Per Te',
        forYouListings,
        <Sparkles className="w-4 h-4" />,
        'bg-gradient-to-r from-purple-500 to-pink-500'
      )}

      {/* Messaggio se nessun annuncio */}
      {listings.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Nessun annuncio disponibile
          </h3>
          <p className="text-gray-500">
            Prova a modificare i filtri di ricerca o torna più tardi.
          </p>
        </div>
      )}
    </div>
  );
};