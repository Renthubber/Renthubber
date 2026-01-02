import React, { useEffect, useState, useRef } from "react";
import { User, Review } from "../types";
import { 
  Star, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2, 
  MapPin,
  Calendar,
  ShoppingBag,
  Building2
} from "lucide-react";
import { api } from "../services/api";

/* ------------------------------------------------------
   🔒 HELPER: Formatta nome per privacy ("Francesco M.")
-------------------------------------------------------*/
const formatPrivacyName = (fullName: string | undefined): string => {
  if (!fullName) return "Utente RentHubber";
  
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return parts[0];
  
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  
  return `${firstName} ${lastInitial}.`;
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
   🏷️ HELPER: Formatta tipo utente per badge
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
   COMPONENTE: Card singola recensione
-------------------------------------------------------*/
interface ReviewCardProps {
  review: Review | any;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  // Supporta sia camelCase che snake_case
  const reviewerName = (review as any).reviewerName || 
    (review as any).reviewer?.public_name ||
    [(review as any).reviewer?.first_name, (review as any).reviewer?.last_name].filter(Boolean).join(' ') ||
    "Utente";
  
  // ✅ Avatar reale dal DB (solo se esiste e non è ui-avatars)
  const rawAvatar = (review as any).reviewer?.avatar_url;
  const hasRealAvatar = hasRealAvatarUrl(rawAvatar);
  const reviewerAvatar = rawAvatar || null;
  const reviewerInitial = reviewerName.charAt(0).toUpperCase();
  const rating = (review as any).overallRating || (review as any).rating || 5;
  const comment = review.comment || "";
  const date = (review as any).createdAt || (review as any).created_at || "";
  
  return (
    <div className="flex-shrink-0 w-72 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      {/* Header con avatar e nome */}
      <div className="flex items-center mb-3">
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
          <h4 className="font-semibold text-gray-900 text-sm">
            {reviewerName}
          </h4>
          <p className="text-xs text-gray-500">
            {date ? formatReviewDate(date) : ""}
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
interface ReviewsSectionProps {
  reviews: (Review | any)[];
  totalCount: number;
  onShowAll: () => void;
}

const ReviewsScrollSection: React.FC<ReviewsSectionProps> = ({ 
  reviews, 
  totalCount,
  onShowAll 
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
      return () => ref.removeEventListener('scroll', checkScroll);
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
          <Star className="w-5 h-5 text-gray-400 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">
            Nessuna recensione
          </h2>
        </div>
        <p className="text-gray-500 italic">
          Questo utente non ha ancora ricevuto recensioni.
        </p>
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Star className="w-5 h-5 text-gray-900 fill-current mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">
            {totalCount} {totalCount === 1 ? 'recensione' : 'recensioni'}
          </h2>
        </div>
        
        {/* Frecce navigazione */}
        {reviews.length > 2 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`p-2 rounded-full border ${
                canScrollLeft 
                  ? 'border-gray-300 hover:border-gray-900 text-gray-700' 
                  : 'border-gray-200 text-gray-300 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`p-2 rounded-full border ${
                canScrollRight 
                  ? 'border-gray-300 hover:border-gray-900 text-gray-700' 
                  : 'border-gray-200 text-gray-300 cursor-not-allowed'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Scroll container */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {reviews.slice(0, 6).map((review, idx) => (
          <ReviewCard key={review.id || idx} review={review} />
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
}

const AllReviewsModal: React.FC<AllReviewsModalProps> = ({
  isOpen,
  onClose,
  reviews,
  userName
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
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            ✕
          </button>
        </div>
        
        {/* Lista recensioni */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          {reviews.map((review, idx) => {
            const reviewerName = (review as any).reviewerName || 
              (review as any).reviewer?.public_name ||
              [(review as any).reviewer?.first_name, (review as any).reviewer?.last_name].filter(Boolean).join(' ') ||
              "Utente";
            
            // ✅ Avatar reale dal DB
            const rawAvatar = (review as any).reviewer?.avatar_url;
            const hasRealAvatar = hasRealAvatarUrl(rawAvatar);
            const reviewerAvatar = rawAvatar || null;
            const reviewerInitial = reviewerName.charAt(0).toUpperCase();
            const rating = (review as any).overallRating || (review as any).rating || 5;
            const date = (review as any).createdAt || (review as any).created_at || "";
            
            return (
              <div key={review.id || idx} className="border-b border-gray-100 pb-6 last:border-0">
                <div className="flex items-center mb-3">
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
                    <h4 className="font-semibold text-gray-900">
                      {reviewerName}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {date ? formatReviewDate(date) : ""}
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
                  {review.comment}
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
   COMPONENTE PRINCIPALE: PublicRenterProfile
-------------------------------------------------------*/
interface PublicRenterProfileProps {
  renter: User;
  onBack: () => void;
}

export const PublicRenterProfile: React.FC<PublicRenterProfileProps> = ({
  renter,
  onBack,
}) => {
  
  const [reviews, setReviews] = useState<(Review | any)[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [completedBookingsCount, setCompletedBookingsCount] = useState(0);

  // Carica recensioni e prenotazioni
useEffect(() => {
  
  const loadData = async () => {
    setLoading(true);
    try {
      // Carica recensioni
      const reviewsData = await api.reviews.getForRenter(renter.id);
      setReviews(reviewsData);
      
      // Carica conteggio prenotazioni completate
      const bookingsCount = await api.bookings.getCompletedCountForRenter(renter.id);
      setCompletedBookingsCount(bookingsCount);
    } catch (e) {
      console.error("Errore caricamento dati:", e);
    } finally {
      setLoading(false);
    }
  };

  if (renter.id) {
    loadData();
  }
}, [renter.id]);

  // Calcola rating medio dalle recensioni caricate (o usa quello dal DB)
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? Number((reviews.reduce((sum, r) => sum + ((r as any).overallRating || (r as any).rating || 0), 0) / totalReviews).toFixed(1))
    : (renter as any).renterRating || 0;

 const joinYear = renter.hubberSince
  ? new Date(renter.hubberSince).getFullYear()
  : (renter as any).created_at 
    ? new Date((renter as any).created_at).getFullYear()
    : new Date().getFullYear();

    // ✅ DEBUG
console.log('🔍 DEBUG joinYear:', {
  hubberSince: renter.hubberSince,
  created_at: (renter as any).created_at,
  joinYear: joinYear
});

  // Nome privacy
  const privacyName = 
    (renter as any).publicName ||
    ((renter as any).firstName && (renter as any).lastName 
      ? `${(renter as any).firstName} ${(renter as any).lastName.charAt(0)}.`
      : formatPrivacyName(renter.name));

  // Nome per messaggi
  const firstName = (renter as any).firstName || renter.name?.split(" ")[0] || "questo utente";

  // ✅ Verifica se il renter ha un avatar reale
  const hasRealAvatar = hasRealAvatarUrl(renter.avatar);
  const avatarUrl = renter.avatar;

  // Iniziale per avatar
  const initial = privacyName?.charAt(0).toUpperCase() || "U";

  // Prenotazioni completate
  const completedBookings = completedBookingsCount;

  // Località
  const location = (renter as any).location || renter.address || "Italia";

  return (
    <div className="min-h-screen bg-white-50 pb-20">
      {/* Navbar */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" /> Indietro
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* =====================================================
              COLONNA SINISTRA: Card Profilo
          ===================================================== */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sticky top-8">
              
              {/* Avatar */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-4">
                  {/* ✅ Mostra avatar reale se esiste, altrimenti gradiente con iniziale */}
                  {hasRealAvatar ? (
                    <img
                      src={avatarUrl}
                      alt={privacyName}
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-5xl font-bold shadow-lg">
                      {initial}
                    </div>
                  )}
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  {privacyName}
                </h1>
                
                <div className="flex items-center text-gray-500 text-sm mb-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full ${
                    (renter as any).userType && (renter as any).userType !== 'privato'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {(renter as any).userType && (renter as any).userType !== 'privato' && (
                      <Building2 className="w-3 h-3" />
                    )}
                    {formatUserType((renter as any).userType)}
                  </span>
                </div>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">

                {/* Recensioni */}
                <div className="bg-gray-50 p-3 rounded-xl text-center">
                  <p className="text-lg font-bold text-gray-900 flex items-center justify-center">
                    {totalReviews} <Star className="w-3 h-3 ml-1" />
                  </p>
                  <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wide">
                    Recensioni
                  </p>
                </div>
                
                {/* Rating */}
                <div className="bg-gray-50 p-3 rounded-xl text-center">
                  <p className="text-lg font-bold text-gray-900">
                    {avgRating > 0 ? avgRating : "—"}
                  </p>
                  <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wide">
                    Rating
                  </p>
                </div>
                
                {/* Anno iscrizione */}
                <div className="bg-gray-50 p-3 rounded-xl text-center">
                  <p className="text-lg font-bold text-gray-900">
                    {joinYear}
                  </p>
                  <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wide">
                    Iscritto dal
                  </p>
                </div>
                
                {/* Prenotazioni */}
                <div className="bg-gray-50 p-3 rounded-xl text-center">
                  <p className="text-lg font-bold text-gray-900">
                    {completedBookings}
                  </p>
                  <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wide">
                    Prenotazioni
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-semibold text-gray-900 mb-4 text-sm">
                  Informazioni verificate
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <CheckCircle2 className={`w-5 h-5 mr-3 flex-shrink-0 ${
                      renter.idDocumentVerified 
                        ? 'text-green-500' 
                        : 'text-gray-300'
                    }`} />
                    <span className={renter.idDocumentVerified ? 'text-gray-900' : 'text-gray-400'}>
                      Identità
                    </span>
                    {renter.idDocumentVerified && (
                      <span className="ml-auto text-xs text-gray-400">Verificato</span>
                    )}
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <CheckCircle2 className={`w-5 h-5 mr-3 flex-shrink-0 ${
                      renter.emailVerified 
                        ? 'text-green-500' 
                        : 'text-gray-300'
                    }`} />
                    <span className={renter.emailVerified ? 'text-gray-900' : 'text-gray-400'}>
                      Indirizzo Email
                    </span>
                    {renter.emailVerified && (
                      <span className="ml-auto text-xs text-gray-400">Verificato</span>
                    )}
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <CheckCircle2 className={`w-5 h-5 mr-3 flex-shrink-0 ${
                      renter.phoneVerified 
                        ? 'text-green-500' 
                        : 'text-gray-300'
                    }`} />
                    <span className={renter.phoneVerified ? 'text-gray-900' : 'text-gray-400'}>
                      Numero di telefono
                    </span>
                    {renter.phoneVerified && (
                      <span className="ml-auto text-xs text-gray-400">Verificato</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================
              COLONNA DESTRA: Info + Recensioni
          ===================================================== */}
          <div className="lg:col-span-8">
            
            {/* Sezione Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Informazioni su {firstName}
              </h2>
              
              {/* Bio */}
              <p className="text-gray-600 leading-relaxed mb-6">
                {renter.bio || `Ciao! Sono un membro della community RentHubber dal ${joinYear}.`}
              </p>
              
              {/* Località */}
              <div className="flex items-center text-gray-600">
                <MapPin className="w-5 h-5 mr-2 text-gray-400" />
                <div>
                  <span className="text-sm text-gray-500">Vive a</span>
                  <p className="font-medium text-gray-900">{location}</p>
                </div>
              </div>
            </div>

            {/* Sezione Recensioni */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              {loading ? (
                <div className="py-12 text-center text-gray-500">
                  Caricamento recensioni...
                </div>
              ) : (
                <ReviewsScrollSection
                  reviews={reviews}
                  totalCount={totalReviews}
                  onShowAll={() => setShowAllReviews(true)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal tutte le recensioni */}
      <AllReviewsModal
        isOpen={showAllReviews}
        onClose={() => setShowAllReviews(false)}
        reviews={reviews}
        userName={firstName}
      />
    </div>
  );
};

export default PublicRenterProfile;