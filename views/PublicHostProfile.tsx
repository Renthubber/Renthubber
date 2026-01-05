import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User, Listing, Review } from "../types";
import { 
  Star, 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2,
  Building2,
  Award 
} from "lucide-react";
import { ListingCard } from "../components/ListingCard";
import { api } from "../services/api";

/* ------------------------------------------------------
   🔒 HELPER: Formatta nome per privacy ("Davide P.")
-------------------------------------------------------*/
const formatPrivacyName = (fullName: string | undefined): string => {
  if (!fullName) return "Hubber Renthubber";
  
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return parts[0]; // Solo nome
  
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  
  return `${firstName} ${lastInitial}.`;
};

/* ------------------------------------------------------
   🏢 HELPER: Formatta tipo utente per visualizzazione
-------------------------------------------------------*/
const formatUserType = (userType: string | undefined): string => {
  switch (userType) {
    case 'ditta_individuale': return 'Ditta Individuale';
    case 'societa': return 'Società';
    case 'associazione': return 'Associazione';
    default: return 'Privato';
  }
};

/* ------------------------------------------------------
   📅 HELPER: Formatta data recensione ("dicembre 2025")
-------------------------------------------------------*/
const formatReviewDate = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', { 
    month: 'long', 
    year: 'numeric' 
  });
};

/* ------------------------------------------------------
   🖼️ HELPER: Verifica se l'avatar è reale (non generato)
-------------------------------------------------------*/
const hasRealAvatarUrl = (avatarUrl: string | null | undefined): boolean => {
  if (!avatarUrl) return false;
  // Considera "reale" qualsiasi URL che non sia ui-avatars.com
  return !avatarUrl.includes('ui-avatars.com');
};

/* ------------------------------------------------------
   COMPONENTE: Card singola recensione
-------------------------------------------------------*/
interface ReviewCardProps {
  review: Review | any;
  onRenterClick?: (renter: { id: string; name: string; avatar?: string }) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, onRenterClick }) => {
  const reviewerId = review.reviewer_id || (review as any).reviewer?.id;
  const reviewerName = (review as any).reviewerName || 
    (review as any).reviewer?.public_name ||
    [(review as any).reviewer?.first_name, (review as any).reviewer?.last_name].filter(Boolean).join(' ') ||
    (review as any).userName || 
    "Utente";
  
  // ✅ Avatar reale dal DB (solo se esiste e non è un URL ui-avatars)
  const rawAvatar = (review as any).reviewer?.avatar_url;
  const hasRealAvatar = hasRealAvatarUrl(rawAvatar);
  const reviewerAvatar = rawAvatar || null;
  const reviewerInitial = reviewerName.charAt(0).toUpperCase();
  const rating = review.overallRating || review.rating || 5;
  const comment = review.comment || "";
  const date = review.createdAt || review.created_at || review.date || "";
  
  const isClickable = onRenterClick && reviewerId;
  
  return (
    <div className="flex-shrink-0 w-72 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header con avatar e nome */}
      <div 
        className={`flex items-center mb-3 ${isClickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
        onClick={() => {
          if (isClickable) {
            onRenterClick({
              id: reviewerId,
              name: reviewerName,
              avatar: reviewerAvatar || undefined,
            });
          }
        }}
      >
        {/* ✅ Mostra avatar reale se esiste, altrimenti gradiente con iniziale */}
        {hasRealAvatar ? (
          <img 
            src={reviewerAvatar!} 
            alt={reviewerName}
            className="w-10 h-10 rounded-full object-cover mr-3 bg-gray-200"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm mr-3">
            {reviewerInitial}
          </div>
        )}
        <div>
          <h4 className={`font-semibold text-gray-900 text-sm ${isClickable ? 'hover:text-brand hover:underline' : ''}`}>
            {reviewerName}
          </h4>
          <p className="text-xs text-gray-500">
            {formatReviewDate(date)}
          </p>
        </div>
      </div>
      
      {/* Stelle */}
      <div className="flex items-center mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star 
            key={i} 
            className={`w-4 h-4 ${
              i < rating 
                ? 'text-gray-900 fill-current' 
                : 'text-gray-300'
            }`} 
          />
        ))}
      </div>
      
      {/* Commento */}
      <p className="text-gray-600 text-sm leading-relaxed line-clamp-4">
        {comment}
      </p>
    </div>
  );
};

/* ------------------------------------------------------
   COMPONENTE: Sezione recensioni con scroll orizzontale
-------------------------------------------------------*/
interface ReviewsScrollSectionProps {
  reviews: (Review | any)[];
  totalCount: number;
  onShowAll: () => void;
  onRenterClick?: (renter: { id: string; name: string; avatar?: string }) => void;
}

const ReviewsScrollSection: React.FC<ReviewsScrollSectionProps> = ({ 
  reviews, 
  totalCount,
  onShowAll,
  onRenterClick 
}) => {
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
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (reviews.length === 0) {
    return (
      <div className="py-8">
        <div className="flex items-center mb-6">
          <Star className="w-6 h-6 text-gray-400 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">
            Nessuna recensione
          </h2>
        </div>
        <p className="text-gray-500 italic">
          Questo hubber non ha ancora ricevuto recensioni.
        </p>
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Star className="w-6 h-6 text-gray-900 fill-current mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">
            {totalCount} {totalCount === 1 ? 'recensione' : 'recensioni'}
          </h2>
        </div>
        
        {/* Frecce navigazione */}
        {reviews.length > 2 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`p-2 rounded-full border transition-colors ${
                canScrollLeft 
                  ? 'border-gray-300 hover:border-gray-900 text-gray-700 hover:text-gray-900' 
                  : 'border-gray-200 text-gray-300 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`p-2 rounded-full border transition-colors ${
                canScrollRight 
                  ? 'border-gray-300 hover:border-gray-900 text-gray-700 hover:text-gray-900' 
                  : 'border-gray-200 text-gray-300 cursor-not-allowed'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Scroll container */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <style>{`
          div::-webkit-scrollbar { display: none; }
        `}</style>
        {reviews.slice(0, 6).map((review, idx) => (
          <ReviewCard 
            key={review.id || idx} 
            review={review} 
            onRenterClick={onRenterClick}
          />
        ))}
      </div>

      {/* Pulsante mostra tutte */}
      {totalCount > 6 && (
        <button
          onClick={onShowAll}
          className="mt-6 px-6 py-3 border border-gray-900 text-gray-900 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          Mostra tutte le {totalCount} recensioni
        </button>
      )}
    </div>
  );
};

/* ------------------------------------------------------
   COMPONENTE: Modal tutte le recensioni
-------------------------------------------------------*/
interface AllReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviews: (Review | any)[];
  userName: string;
  onRenterClick?: (renter: { id: string; name: string; avatar?: string }) => void;
}

const AllReviewsModal: React.FC<AllReviewsModalProps> = ({
  isOpen,
  onClose,
  reviews,
  userName,
  onRenterClick
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">
            Tutte le recensioni di {userName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            ✕
          </button>
        </div>
        
        {/* Lista recensioni */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          {reviews.map((review, idx) => {
            const reviewerId = review.reviewer_id || review.reviewer?.id;
            const reviewerName = review.reviewerName || 
              review.reviewer?.public_name ||
              [review.reviewer?.first_name, review.reviewer?.last_name].filter(Boolean).join(' ') ||
              review.userName || "Utente";
            
            // ✅ Avatar reale dal DB
            const rawAvatar = review.reviewer?.avatar_url;
            const hasRealAvatar = hasRealAvatarUrl(rawAvatar);
            const reviewerAvatar = rawAvatar || null;
            const reviewerInitial = reviewerName.charAt(0).toUpperCase();
            const rating = review.overallRating || review.rating || 5;
            const comment = review.comment || "";
            const date = review.createdAt || review.created_at || review.date || "";
            
            const isClickable = onRenterClick && reviewerId;
            
            return (
              <div key={review.id || idx} className="border-b border-gray-100 pb-6 last:border-0">
                <div 
                  className={`flex items-center mb-3 ${isClickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                  onClick={() => {
                    if (isClickable) {
                      onRenterClick({
                        id: reviewerId,
                        name: reviewerName,
                        avatar: reviewerAvatar || undefined,
                      });
                      onClose(); // Chiudi modal quando si clicca
                    }
                  }}
                >
                  {/* ✅ Mostra avatar reale se esiste, altrimenti gradiente con iniziale */}
                  {hasRealAvatar ? (
                    <img 
                      src={reviewerAvatar!} 
                      alt={reviewerName}
                      className="w-12 h-12 rounded-full object-cover mr-4 bg-gray-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold mr-4">
                      {reviewerInitial}
                    </div>
                  )}
                  <div>
                    <h4 className={`font-semibold text-gray-900 ${isClickable ? 'hover:text-brand hover:underline' : ''}`}>
                      {reviewerName}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {formatReviewDate(date)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${
                        i < rating 
                          ? 'text-gray-900 fill-current' 
                          : 'text-gray-300'
                      }`} 
                    />
                  ))}
                </div>
                
                <p className="text-gray-600 leading-relaxed">
                  {comment}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------
   COMPONENTE PRESENTAZIONALE — PROFILO PUBBLICO HUBBER
-------------------------------------------------------*/

interface PublicHostProfileProps {
  host: User;
  listings: Listing[]; // Annunci di questo hubber
  onBack: () => void;
  onListingClick: (listing: Listing) => void;
  onRenterClick?: (renter: { id: string; name: string; avatar?: string }) => void;
  currentUser?: User | null;
}

export const PublicHostProfile: React.FC<PublicHostProfileProps> = ({
  host,
  listings,
  onBack,
  onListingClick,
  onRenterClick,
  currentUser,
}) => {
  // 🔍 DEBUG
  console.log("🔍 PublicHostProfile - host:", host);
  console.log("🔍 PublicHostProfile - host.userType:", (host as any).userType);
  // ✅ Recensioni caricate da Supabase
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Carica recensioni da Supabase
  useEffect(() => {
    const loadReviews = async () => {
      setLoadingReviews(true);
      try {
        const data = await api.reviews.getForHubber(host.id,);
        setReviews(data);
      } catch (e) {
        console.error("Errore caricamento recensioni hubber:", e);
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };

    if (host.id) {
      loadReviews();
    }
  }, [host.id]);

  // Calcola rating medio
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
  ? Number((reviews.reduce((sum, r) => sum + ((r as any).overallRating || (r as any).rating || 0), 0) / totalReviews).toFixed(1))
  : host.rating || 0;

  const joinYear = host.hubberSince
    ? new Date(host.hubberSince).getFullYear()
    : new Date().getFullYear();

  // ✅ Usa publicName dal DB se disponibile, altrimenti genera da firstName/lastName o name
  const privacyName = 
    (host as any).publicName ||
    ((host as any).firstName && (host as any).lastName 
      ? `${(host as any).firstName} ${(host as any).lastName.charAt(0)}.`
      : formatPrivacyName(host.name));

  // ✅ Estrai il primo nome per i messaggi personalizzati
  const firstName = (host as any).firstName || host.name?.split(" ")[0] || "questo hubber";

  // ✅ Verifica se l'hubber ha un avatar reale
  const hasRealAvatar = hasRealAvatarUrl(host.avatar);
  const avatarUrl = host.avatar;

  // Iniziale per avatar fallback
  const initial = privacyName?.charAt(0).toUpperCase() || "H";

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Nav Placeholder */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" /> Indietro
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* LEFT COLUMN: PROFILE CARD */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm sticky top-24">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative mb-4">
                {/* ✅ Mostra avatar reale se esiste, altrimenti gradiente con iniziale */}
                {hasRealAvatar ? (
                  <img
                    src={avatarUrl}
                    alt={privacyName}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-5xl font-bold shadow-lg">
                    {initial}
                  </div>
                )}
                {host.isSuperHubber && (
                  <div
                    className="absolute bottom-0 right-0 bg-brand text-white p-2 rounded-full border-4 border-white shadow-sm"
                    title="SuperHubber"
                  >
                    <Award className="w-6 h-6" />
                  </div>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {privacyName}
              </h1>
              <div className="flex items-center text-gray-500 text-sm mb-4">
                {host.isSuperHubber && (
                  <span className="text-xs font-bold text-white bg-brand px-2 py-0.5 rounded-full mr-2">
                    SuperHubber
                  </span>
                )}

                {/* BADGE TIPO UTENTE - sempre visibile */}
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full ${
                  (host as any).userType && (host as any).userType !== 'privato' 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {(host as any).userType && (host as any).userType !== 'privato' && (
                    <Building2 className="w-3 h-3" />
                  )}
                  {formatUserType((host as any).userType)}
                </span>
              </div>
              </div>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 p-3 rounded-xl text-center">
                <p className="text-lg font-bold text-gray-900 flex items-center justify-center">
                  {totalReviews} <Star className="w-3 h-3 ml-1" />
                </p>
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wide">
                  Recensioni
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl text-center">
                <p className="text-lg font-bold text-gray-900">
                  {avgRating > 0 ? avgRating : "—"}
                </p>
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wide">
                  Rating
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl text-center">
                <p className="text-lg font-bold text-gray-900">{joinYear}</p>
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wide">
                  Iscritto dal
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl text-center">
                <p className="text-lg font-bold text-gray-900">
                  {listings.length}
                </p>
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wide">
                  Annunci
                </p>
              </div>
            </div>

            {/* Verifiche — mappate sui campi reali di User */}
            <div className="border-t border-gray-100 pt-6 space-y-4">
              <h3 className="font-bold text-gray-900 mb-2">
                Informazioni verificate
              </h3>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Identità</span>
                {host.idDocumentVerified ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <span className="text-gray-300 text-xs">Non verificata</span>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Indirizzo Email</span>
                {host.emailVerified ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <span className="text-gray-300 text-xs">Non verificata</span>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Numero di telefono</span>
                {host.phoneVerified ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <span className="text-gray-300 text-xs">Non verificata</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILS */}
        <div className="lg:col-span-8 space-y-12 py-4">
          {/* About */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Informazioni su {firstName}
            </h2>
            <div className="prose text-gray-600 leading-relaxed">
              <p>
                {host.bio ||
                  `Ciao! Sono un membro della community Renthubber dal ${joinYear}.`}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900 text-sm">Vive a</p>
                  <p className="text-sm text-gray-600">
                    {host.address || "Italia"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Listings */}
          <section className="border-t border-gray-100 pt-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Gli annunci di {firstName}
            </h2>
            {listings.length > 0 ? (
              <>
                {/* MOBILE: SCORRIMENTO ORIZZONTALE CON ALMENO 2 CARD VISIBILI */}
                <div className="block sm:hidden">
                  <div className="flex overflow-x-auto space-x-3 -mx-1 px-1 pb-2">
                    {listings.map((listing) => (
                      <div
                        key={listing.id}
                        className="flex-shrink-0 w-[48%]"
                      >
                        <ListingCard
                          listing={listing}
                          onClick={onListingClick}
                          currentUser={currentUser}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* DESKTOP/TABLET: GRIGLIA CLASSICA */}
                <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
                  {listings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      onClick={onListingClick}
                      currentUser={currentUser}
                    />
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-500">
                Nessun annuncio attivo al momento.
              </p>
            )}
          </section>

          {/* Reviews - AGGIORNATO con scroll orizzontale e renter cliccabile */}
          <section className="border-t border-gray-100 pt-10">
            {loadingReviews ? (
              <div className="py-8 text-center text-gray-500">
                Caricamento recensioni...
              </div>
            ) : (
              <ReviewsScrollSection
                reviews={reviews}
                totalCount={totalReviews}
                onShowAll={() => setShowAllReviews(true)}
                onRenterClick={onRenterClick}
              />
            )}
          </section>
        </div>
      </div>

      {/* Modal tutte le recensioni */}
      <AllReviewsModal
        isOpen={showAllReviews}
        onClose={() => setShowAllReviews(false)}
        reviews={reviews}
        userName={firstName}
        onRenterClick={onRenterClick}
      />
    </div>
  );
};

/* ------------------------------------------------------
   WRAPPER PAGE: CARICA HUBBER + ANNUNCI DA API (SUPABASE)
   URL: /hubber/:userId
-------------------------------------------------------*/

export const PublicHostProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [host, setHost] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;
      setLoading(true);

      try {
        // 1) Dati utente tramite API (mappa già la row di Supabase in User)
        const user = await api.users.get(userId);
        setHost(user);

        // 2) Annunci: prendiamo tutti e filtriamo per hostId
        const allListings = await api.listings.getAll();
        const hostListings = allListings.filter(
          (l) => l.hostId === userId && l.status === "published"
        );
        setListings(hostListings);
      } catch (e) {
        console.error("Errore caricamento profilo pubblico hubber:", e);
        setHost(null);
        setListings([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  if (!userId) {
    return <div className="p-4">ID utente non valido.</div>;
  }

  if (loading) {
    return <div className="p-4">Caricamento profilo hubber...</div>;
  }

  if (!host) {
    return <div className="p-4">Hubber non trovato.</div>;
  }

  return (
    <PublicHostProfile
      host={host}
      listings={listings}
      onBack={() => navigate(-1)}
      onListingClick={(listing) => navigate(`/listing/${listing.id}`)}
    />
  );
};