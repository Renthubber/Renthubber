// ============================================================
// RENTHUBBER - Profilo Pubblico Store Autorizzato
// Path: views/PublicStoreProfile.tsx
// ============================================================

import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star, MapPin, ChevronLeft, ChevronRight, CheckCircle2,
  Clock, Phone, Mail, Building, Award, Package, Shield,
  Store as StoreIcon
} from "lucide-react";
import { supabase } from "../services/supabaseClient";

// ============================================================
// TYPES
// ============================================================
interface StorePublic {
  id: string;
  business_name: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  description: string | null;
  profile_photo_url: string | null;
  opening_hours: Record<string, { open: string; close: string } | null>;
  average_rating: number;
  total_reviews: number;
  is_early_adopter: boolean;
  activated_at: string | null;
  completed_pickups: number;
}

interface StoreReviewPublic {
  id: string;
  reviewer_role: 'hubber' | 'renter';
  rating: number;
  rating_courtesy: number | null;
  rating_care: number | null;
  rating_punctuality: number | null;
  comment: string | null;
  store_reply: string | null;
  created_at: string;
}

// ============================================================
// HELPERS
// ============================================================
const DAYS = [
  { key: 'mon', label: 'Lunedì' },
  { key: 'tue', label: 'Martedì' },
  { key: 'wed', label: 'Mercoledì' },
  { key: 'thu', label: 'Giovedì' },
  { key: 'fri', label: 'Venerdì' },
  { key: 'sat', label: 'Sabato' },
  { key: 'sun', label: 'Domenica' },
];

const formatReviewDate = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
};

const isOpenNow = (openingHours: Record<string, any>): { open: boolean; closes?: string } => {
  const now = new Date();
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const todayKey = dayKeys[now.getDay()];
  const todayHours = openingHours?.[todayKey];

  if (!todayHours) return { open: false };

  const [openH, openM] = todayHours.open.split(':').map(Number);
  const [closeH, closeM] = todayHours.close.split(':').map(Number);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (nowMinutes >= openMinutes && nowMinutes < closeMinutes) {
    return { open: true, closes: todayHours.close };
  }
  return { open: false };
};

// ============================================================
// REVIEW CARD
// ============================================================
const ReviewCard: React.FC<{ review: StoreReviewPublic }> = ({ review }) => {
  return (
    <div className="flex-shrink-0 w-72 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center mb-3">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
          <span className="text-sm font-bold text-gray-500">
            {review.reviewer_role === 'hubber' ? 'H' : 'R'}
          </span>
        </div>
        <div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            review.reviewer_role === 'hubber' ? 'bg-brand/10 text-brand' : 'bg-purple-50 text-purple-700'
          }`}>
            {review.reviewer_role === 'hubber' ? 'Hubber' : 'Renter'}
          </span>
          <p className="text-xs text-gray-500 mt-0.5">{formatReviewDate(review.created_at)}</p>
        </div>
      </div>

      <div className="flex items-center mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-gray-900 fill-current' : 'text-gray-300'}`} />
        ))}
      </div>

      {(review.rating_courtesy || review.rating_care || review.rating_punctuality) && (
        <div className="space-y-1 mb-3">
          {review.rating_courtesy && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">😊 Cortesia</span>
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-3 h-3 ${i < review.rating_courtesy! ? 'text-amber-400 fill-current' : 'text-gray-200'}`} />
                ))}
              </div>
            </div>
          )}
          {review.rating_care && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">📦 Cura oggetto</span>
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-3 h-3 ${i < review.rating_care! ? 'text-amber-400 fill-current' : 'text-gray-200'}`} />
                ))}
              </div>
            </div>
          )}
          {review.rating_punctuality && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">⏱️ Puntualità</span>
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-3 h-3 ${i < review.rating_punctuality! ? 'text-amber-400 fill-current' : 'text-gray-200'}`} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {review.comment && (
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-4">{review.comment}</p>
      )}

      {review.store_reply && (
        <div className="mt-3 pl-3 border-l-2 border-brand/30">
          <p className="text-xs text-gray-500 font-medium">Risposta dello store:</p>
          <p className="text-xs text-gray-600 mt-0.5">{review.store_reply}</p>
        </div>
      )}
    </div>
  );
};

// ============================================================
// REVIEWS SCROLL SECTION
// ============================================================
const ReviewsScrollSection: React.FC<{ reviews: StoreReviewPublic[]; totalCount: number }> = ({ reviews, totalCount }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        ref.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [reviews]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
    }
  };

  if (reviews.length === 0) {
    return (
      <div className="py-8">
        <div className="flex items-center mb-6">
          <Star className="w-6 h-6 text-gray-400 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">Nessuna recensione</h2>
        </div>
        <p className="text-gray-500 italic">Questo store non ha ancora ricevuto recensioni.</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Star className="w-6 h-6 text-gray-900 fill-current mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">
            {totalCount} {totalCount === 1 ? 'recensione' : 'recensioni'}
          </h2>
        </div>
        {reviews.length > 2 && (
          <div className="flex items-center gap-2">
            <button onClick={() => scroll('left')} disabled={!canScrollLeft}
              className={`p-2 rounded-full border transition-colors ${canScrollLeft ? 'border-gray-300 hover:border-gray-900 text-gray-700' : 'border-gray-200 text-gray-300 cursor-not-allowed'}`}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => scroll('right')} disabled={!canScrollRight}
              className={`p-2 rounded-full border transition-colors ${canScrollRight ? 'border-gray-300 hover:border-gray-900 text-gray-700' : 'border-gray-200 text-gray-300 cursor-not-allowed'}`}>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2" style={{ scrollbarWidth: 'none' }}>
        {reviews.map(review => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT - PRESENTATIONAL
// ============================================================
interface PublicStoreProfileProps {
  store: StorePublic;
  reviews: StoreReviewPublic[];
  onBack: () => void;
}

export const PublicStoreProfile: React.FC<PublicStoreProfileProps> = ({ store, reviews, onBack }) => {
  const avgRating = store.average_rating > 0 ? store.average_rating.toFixed(1) : '—';
  const activeSince = store.activated_at
    ? new Date(store.activated_at).getFullYear()
    : new Date().getFullYear();
  const openStatus = isOpenNow(store.opening_hours);

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Nav */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" /> Indietro
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* LEFT: PROFILE CARD */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm sticky top-24">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative mb-4">
                {store.profile_photo_url ? (
                  <img src={store.profile_photo_url} alt={store.business_name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-brand/10 flex items-center justify-center border-4 border-white shadow-md">
                    <StoreIcon className="w-16 h-16 text-brand" />
                  </div>
                )}
                {store.is_early_adopter && (
                  <div className="absolute bottom-0 right-0 bg-brand text-white p-2 rounded-full border-4 border-white shadow-sm" title="Early Adopter">
                    <Award className="w-6 h-6" />
                  </div>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{store.business_name}</h1>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full bg-brand/10 text-brand">
                  <Shield className="w-3 h-3" /> Store Autorizzato
                </span>
                {store.is_early_adopter && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700">
                    <Award className="w-3 h-3" /> Early Adopter
                  </span>
                )}
              </div>

              {/* Open/Closed badge */}
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                openStatus.open ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
              }`}>
                <div className={`w-2 h-2 rounded-full ${openStatus.open ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
                {openStatus.open ? `Aperto ora · chiude alle ${openStatus.closes}` : 'Chiuso ora'}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 p-3 rounded-xl text-center">
                <p className="text-lg font-bold text-gray-900 flex items-center justify-center">
                  {store.total_reviews} <Star className="w-3 h-3 ml-1" />
                </p>
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wide">Recensioni</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl text-center">
                <p className="text-lg font-bold text-gray-900">{avgRating}</p>
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wide">Rating</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl text-center">
                <p className="text-lg font-bold text-gray-900">{activeSince}</p>
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wide">Attivo dal</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl text-center">
                <p className="text-lg font-bold text-gray-900">{store.completed_pickups}</p>
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wide">Ritiri</p>
              </div>
            </div>

            {/* Verified info */}
            <div className="border-t border-gray-100 pt-6 space-y-4">
              <h3 className="font-bold text-gray-900 mb-2">Informazioni verificate</h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Attività commerciale</span>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Indirizzo verificato</span>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Autorizzato Renthubber</span>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: DETAILS */}
        <div className="lg:col-span-8 space-y-12 py-4">
          {/* About */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Informazioni sullo store</h2>
            <div className="prose text-gray-600 leading-relaxed">
              <p>{store.description || `${store.business_name} è uno Store Autorizzato Renthubber a ${store.city}. Deposita e ritira i tuoi oggetti in tutta sicurezza.`}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900 text-sm">Indirizzo</p>
                  <p className="text-sm text-gray-600">{store.address}, {store.city} ({store.province}) {store.postal_code}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Package className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900 text-sm">Servizio</p>
                  <p className="text-sm text-gray-600">Deposito, custodia e ritiro oggetti</p>
                </div>
              </div>
            </div>
          </section>

          {/* Opening Hours */}
          <section className="border-t border-gray-100 pt-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Clock className="w-6 h-6 mr-3 text-brand" /> Orari di Apertura
            </h2>
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="space-y-3">
                {DAYS.map(day => {
                  const hours = store.opening_hours?.[day.key];
                  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                  const isToday = dayKeys[new Date().getDay()] === day.key;

                  return (
                    <div key={day.key} className={`flex items-center justify-between py-2 px-3 rounded-lg ${isToday ? 'bg-brand/5 border border-brand/20' : ''}`}>
                      <span className={`text-sm ${isToday ? 'font-bold text-brand' : hours ? 'font-medium text-gray-900' : 'text-gray-400'}`}>
                        {day.label} {isToday && <span className="text-xs">(oggi)</span>}
                      </span>
                      <span className={`text-sm ${hours ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                        {hours ? `${hours.open} — ${hours.close}` : 'Chiuso'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Reviews */}
          <section className="border-t border-gray-100 pt-10">
            <ReviewsScrollSection reviews={reviews} totalCount={store.total_reviews} />
          </section>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// WRAPPER PAGE: CARICA STORE DA SUPABASE
// URL: /store/:storeId
// ============================================================
export const PublicStoreProfilePage: React.FC = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();

  const [store, setStore] = useState<StorePublic | null>(null);
  const [reviews, setReviews] = useState<StoreReviewPublic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!storeId) return;
      setLoading(true);

      try {
        // Carica store (solo campi pubblici)
        const { data: storeData } = await supabase
          .from('stores')
          .select('id, business_name, address, city, province, postal_code, description, profile_photo_url, opening_hours, average_rating, total_reviews, is_early_adopter, activated_at, completed_pickups')
          .eq('id', storeId)
          .eq('status', 'active')
          .single();

        if (storeData) {
          setStore(storeData as StorePublic);

          // Carica recensioni
          const { data: reviewsData } = await supabase
            .from('store_reviews')
            .select('id, reviewer_role, rating, rating_courtesy, rating_care, rating_punctuality, comment, store_reply, created_at')
            .eq('store_id', storeId)
            .eq('is_visible', true)
            .order('created_at', { ascending: false });

          setReviews(reviewsData || []);
        }
      } catch (e) {
        console.error("Errore caricamento profilo store:", e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [storeId]);

  if (!storeId) return <div className="p-4">ID store non valido.</div>;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand mx-auto mb-4" />
          <p className="text-gray-500">Caricamento profilo store...</p>
        </div>
      </div>
    );
  }

  if (!store) return <div className="p-4 text-center text-gray-500">Store non trovato.</div>;

  return (
    <PublicStoreProfile
      store={store}
      reviews={reviews}
      onBack={() => navigate(-1)}
    />
  );
};
