import React, { useState, useEffect, useRef } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import { supabase } from '../services/supabaseClient';
import { getAvatarUrl } from '../utils/avatarUtils';


interface ReviewsSectionProps {
  listingId: string;
  onRenterClick?: (renter: { id: string; name: string; avatar?: string; created_at?: string }) => void;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ listingId, onRenterClick }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

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

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeft(scrollLeft > 0);
      setShowRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [reviews]);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const containerWidth = scrollRef.current.clientWidth;
      scrollRef.current.scrollBy({ left: dir === 'left' ? -containerWidth : containerWidth, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

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
        <div className="relative px-16">
          {showLeft && (
            <button onClick={() => scroll('left')} className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white border-2 border-gray-200 rounded-full p-2 shadow-lg hover:bg-gray-50">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div ref={scrollRef} onScroll={checkScroll} className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {reviews.slice(0, 6).map((review) => {
              const reviewer = review.reviewer;
              const reviewerId = review.reviewer_id || reviewer?.id;
              const reviewerName = reviewer?.public_name || 
                [reviewer?.first_name, reviewer?.last_name].filter(Boolean).join(' ') || 
                'Utente';
              
            const reviewerAvatar = getAvatarUrl(reviewer);
             
              return (
                <div key={review.id} className="flex-shrink-0 w-[calc(50%-8px)] snap-start">
                  <div 
                    className={`flex items-center mb-3 ${onRenterClick && reviewerId ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                    onClick={async () => {
                      if (onRenterClick && reviewerId) {
                        const { data, error } = await supabase
                          .from("users")
                          .select("id, name, avatar_url, created_at")
                          .eq("id", reviewerId)
                          .single();
                        
                        console.log('🔍 DEBUG data:', data);
                        
                        onRenterClick({
  id: reviewerId,
  name: reviewerName,
  avatar: reviewerAvatar || undefined,
  created_at: data?.created_at,
});
                      }
                    }}
                  >
                    <img 
                      src={reviewerAvatar} 
                      alt={reviewerName} 
                      className="w-10 h-10 rounded-full mr-3 bg-gray-200 object-cover"
                    />
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
                  <div className="flex items-center mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${
                          i < (review.rating || 0) 
                            ? 'text-gray-900 fill-current' 
                            : 'text-gray-300'
                        }`} 
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-4">
                    {review.comment || 'Nessun commento'}
                  </p>
                </div>
              );
            })}
          </div>
          {showRight && (
            <button onClick={() => scroll('right')} className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white border-2 border-gray-200 rounded-full p-2 shadow-lg hover:bg-gray-50">
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
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