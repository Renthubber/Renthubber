import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { api } from '../services/api';

/* ------------------------------------------------------
   🖼️ HELPER: Verifica se l'avatar è reale (non generato)
-------------------------------------------------------*/
const hasRealAvatarUrl = (avatarUrl: string | null | undefined): boolean => {
  if (!avatarUrl) return false;
  // Considera "reale" qualsiasi URL che non sia ui-avatars.com
  return !avatarUrl.includes('ui-avatars.com');
};

interface ReviewsSectionProps {
  listingId: string;
  onRenterClick?: (renter: { id: string; name: string; avatar?: string; created_at?: string }) => void;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ listingId, onRenterClick }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);
        const data = await api.reviews.getForListing(listingId);
        setReviews(data);

        // Calcola rating medio
        if (data.length > 0) {
          const avg = data.reduce((sum: number, r: any) => sum + Number(r.rating || 0), 0) / data.length;
          setAverageRating(Math.round(avg * 10) / 10);
        }
      } catch (err) {
        console.error("Errore caricamento recensioni:", err);
      } finally {
        setLoading(false);
      }
    };

    if (listingId) {
      loadReviews();
    }
  }, [listingId]);

  if (loading) {
    return (
      <div className="py-8">
        <div className="animate-pulse flex items-center mb-8">
          <div className="w-6 h-6 bg-gray-200 rounded mr-2"></div>
          <div className="h-6 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex items-center mb-8">
        <Star className="w-6 h-6 text-gray-900 fill-current mr-2" />
        <h2 className="text-2xl font-bold text-gray-900">
          {reviews.length > 0 
            ? `${averageRating} · ${reviews.length} recension${reviews.length === 1 ? 'e' : 'i'}` 
            : 'Nessuna recensione'}
        </h2>
      </div>

      {reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {reviews.slice(0, 6).map((review) => {
            // Estrai dati reviewer
            const reviewer = review.reviewer;
            const reviewerId = review.reviewer_id || reviewer?.id;
            const reviewerName = reviewer?.public_name || 
              [reviewer?.first_name, reviewer?.last_name].filter(Boolean).join(' ') || 
              'Utente';
            
            // ✅ Avatar reale dal DB (solo se esiste e non è ui-avatars)
            const rawAvatar = reviewer?.avatar_url;
            const hasRealAvatar = hasRealAvatarUrl(rawAvatar);
            const reviewerAvatar = rawAvatar || null;
            const reviewerInitial = reviewerName.charAt(0).toUpperCase();

            return (
              <div key={review.id}>
                <div 
                  className={`flex items-center mb-3 ${onRenterClick && reviewerId ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                  onClick={() => {
                    if (onRenterClick && reviewerId) {
                      onRenterClick({
                        id: reviewerId,
                        name: reviewerName,
                        avatar: reviewerAvatar || undefined,
                        created_at: reviewer?.created_at,
                      });
                    }
                  }}
                >
                  {/* ✅ Mostra avatar reale se esiste, altrimenti gradiente con iniziale */}
                  {hasRealAvatar ? (
                    <img 
                      src={reviewerAvatar!} 
                      alt={reviewerName} 
                      className="w-10 h-10 rounded-full mr-3 bg-gray-200 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm mr-3">
                      {reviewerInitial}
                    </div>
                  )}
                  <div>
                    <h4 className={`font-bold text-gray-900 text-sm ${onRenterClick && reviewerId ? 'hover:text-brand hover:underline' : ''}`}>
                      {reviewerName}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {new Date(review.created_at).toLocaleDateString('it-IT', {
                        month: 'long', 
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center mb-2 text-xs">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-3 h-3 ${
                        i < (review.rating || 0) 
                          ? 'text-gray-900 fill-current' 
                          : 'text-gray-300'
                      }`} 
                    />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                  {review.comment || 'Nessun commento'}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500 italic">
          Questo annuncio non ha ancora ricevuto recensioni. Sii il primo!
        </p>
      )}
      
      {reviews.length > 6 && (
        <button className="mt-8 border border-black text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
          Mostra tutte le {reviews.length} recensioni
        </button>
      )}
    </div>
  );
};