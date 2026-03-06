import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Clock, CheckCircle2, User } from 'lucide-react';
import { WriteReviewModal } from './WriteReviewModal';
import { api } from '../services/api';
import { getAvatarUrl } from '../utils/avatarUtils';
import { supabase } from '../services/supabaseClient';

interface DashboardReviewsSectionProps {
  userId: string;
  userType: 'renter' | 'hubber';
  onViewProfile?: (user: { id: string; name: string; avatar?: string }) => void;
onPendingCountChange?: (count: number) => void;
}

type TabType = 'pending' | 'received' | 'given' | 'store';

interface Review {
  id: string;
  booking_id: string;
  listing_id?: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment?: string;
  status: string;
  created_at: string;
  review_type: string;
  reviewer?: any;
  reviewee?: any;
  listing?: any;
}

interface PendingReview {
  bookingId: string;
  listingTitle: string;
  listingImage?: string;
  otherUserName: string;
  otherUserId: string;
  otherUserAvatar?: string;
  endDate: string;
}

interface PendingStoreReview {
  inventoryId: string;
  bookingId: string;
  storeId: string;
  storeName: string;
  listingTitle: string;
  completedAt: string;
}

export const DashboardReviewsSection: React.FC<DashboardReviewsSectionProps> = ({
  userId,
  userType,
  onViewProfile,
  onPendingCountChange,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [receivedReviews, setReceivedReviews] = useState<Review[]>([]);
  const [givenReviews, setGivenReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingStoreReviews, setPendingStoreReviews] = useState<PendingStoreReview[]>([]);
  const [showStoreTab, setShowStoreTab] = useState(false);
  const [storeReviewRating, setStoreReviewRating] = useState(0);
  const [storeReviewComment, setStoreReviewComment] = useState('');
  const [storeReviewCourtesy, setStoreReviewCourtesy] = useState(0);
  const [storeReviewCare, setStoreReviewCare] = useState(0);
  const [storeReviewPunctuality, setStoreReviewPunctuality] = useState(0);
  const [submittingStoreReview, setSubmittingStoreReview] = useState(false);
  const [selectedStoreReview, setSelectedStoreReview] = useState<PendingStoreReview | null>(null);

  // Modal recensione
const [showReviewModal, setShowReviewModal] = useState(false);
const [selectedBooking, setSelectedBooking] = useState<PendingReview | null>(null);

// Funzione per calcolare tempo rimanente per recensione
const getTimeRemaining = (endDate: string) => {
  const completed = new Date(endDate);
  const deadline = new Date(completed.getTime() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const timeLeft = deadline.getTime() - now.getTime();
  
  if (timeLeft <= 0) return null;
  
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  return { days, hours };
};

  useEffect(() => {
    loadReviews();
  }, [userId, userType, activeTab]);

  useEffect(() => {
    loadPendingStoreReviews();
  }, [userId, userType]);

  // Comunica il conteggio al Dashboard
useEffect(() => {
  if (onPendingCountChange) {
    // Conta solo quelle NON scadute
    const validCount = pendingReviews.filter(review => {
      const endDate = new Date(review.endDate);
      const deadline = new Date(endDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      return new Date() <= deadline;
    }).length;
    
    onPendingCountChange(validCount);
  }
}, [pendingReviews, onPendingCountChange]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      if (activeTab === 'pending') {
        await loadPendingReviews();
      } else if (activeTab === 'received') {
        await loadReceivedReviews();
      } else if (activeTab === 'given') {
        await loadGivenReviews();
      } else if (activeTab === 'store') {
        await loadPendingStoreReviews();
      }
    } catch (err) {
      console.error('Errore caricamento recensioni:', err);
    } finally {
      setLoading(false);
    }
  };
  const loadPendingReviews = async () => {
  try {
    // Query diretta a Supabase con JOIN per avere i dati completi
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        renter:renter_id(id, first_name, last_name, public_name, avatar_url),
        hubber:hubber_id(id, first_name, last_name, public_name, avatar_url),
        listing:listing_id(id, title, images)
      `)
      .eq(userType === 'hubber' ? 'hubber_id' : 'renter_id', userId)
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('end_date', { ascending: false });

    if (error) throw error;

    const pending: PendingReview[] = [];

    for (const booking of bookings || []) {
    
      // Verifica se ha già recensito
      const alreadyReviewed = await api.reviews.existsForBooking(booking.id, userId);
      if (alreadyReviewed) continue;

      // Verifica se è scaduto il tempo (7 giorni)
      const endDate = new Date(booking.end_date);
      const deadline = new Date(endDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (new Date() > deadline) continue;

      // Prendi i dati dell'altra persona
      const otherUser = userType === 'hubber' ? booking.renter : booking.hubber;
      const otherUserName = otherUser?.public_name || 
        [otherUser?.first_name, otherUser?.last_name].filter(Boolean).join(' ') || 
        'Utente';

      pending.push({
        bookingId: booking.id,
        listingTitle: booking.listing?.title || 'Annuncio',
        listingImage: booking.listing?.images?.[0],
        otherUserName: otherUserName,
        otherUserId: otherUser?.id || '',
        otherUserAvatar: getAvatarUrl(otherUser),
        endDate: booking.end_date,
      });
    }

    setPendingReviews(pending);
  } catch (err) {
    console.error('Errore caricamento recensioni da lasciare:', err);
  }
};

  const loadPendingStoreReviews = async () => {
    try {
      const field = userType === 'hubber' ? 'hubber_id' : 'renter_id';
      const completedField = userType === 'hubber' ? 'hubber_pickup_at' : 'renter_return_at';

      const { data: inventories, error } = await supabase
        .from('store_inventory')
        .select('id, store_id, booking_id, listing_id, hubber_pickup_at, renter_return_at')
        .eq(field, userId)
        .not(completedField, 'is', null);

      if (error) throw error;

      const pending: PendingStoreReview[] = [];

      for (const inv of inventories || []) {
        if (!inv.booking_id || !inv.store_id) continue;

        // Verifica se ha già recensito questo store per questa prenotazione
        const { data: existing } = await supabase
          .from('store_reviews')
          .select('id')
          .eq('reviewer_id', userId)
          .eq('booking_id', inv.booking_id)
          .maybeSingle();

        if (existing) continue;

        // Carica nome store e titolo listing
        const { data: store } = await supabase
          .from('stores')
          .select('business_name')
          .eq('id', inv.store_id)
          .single();

        const { data: listing } = await supabase
          .from('listings')
          .select('title')
          .eq('id', inv.listing_id)
          .single();

        pending.push({
          inventoryId: inv.id,
          bookingId: inv.booking_id,
          storeId: inv.store_id,
          storeName: store?.business_name || 'Store',
          listingTitle: listing?.title || 'Annuncio',
          completedAt: userType === 'hubber' ? inv.hubber_pickup_at : inv.renter_return_at,
        });
      }

      setPendingStoreReviews(pending);
      setShowStoreTab(pending.length > 0);
    } catch (err) {
      console.error('Errore caricamento recensioni store:', err);
    }
  };

  const loadReceivedReviews = async () => {
    try {
      const reviews = userType === 'hubber'
        ? await api.reviews.getForHubber(userId)
        : await api.reviews.getForRenter(userId);
      
      setReceivedReviews(reviews);
    } catch (err) {
      console.error('Errore caricamento recensioni ricevute:', err);
    }
  };

  const loadGivenReviews = async () => {
    try {
      // Carica recensioni lasciate dall'utente
      const { data } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewee:reviewee_id(id, first_name, last_name, public_name, avatar_url),
          listing:listing_id(id, title, images)
        `)
        .eq('reviewer_id', userId)
        .order('created_at', { ascending: false });

      setGivenReviews(data || []);
    } catch (err) {
      console.error('Errore caricamento recensioni lasciate:', err);
    }
  };

 const submitStoreReview = async (item: PendingStoreReview) => {
    if (storeReviewRating === 0) return;
    setSubmittingStoreReview(true);
    try {
      await supabase.from('store_reviews').insert({
        store_id: item.storeId,
        reviewer_id: userId,
        booking_id: item.bookingId,
        inventory_id: item.inventoryId,
        reviewer_role: userType,
        rating: storeReviewRating,
        rating_courtesy: storeReviewCourtesy || null,
        rating_care: storeReviewCare || null,
        rating_punctuality: storeReviewPunctuality || null,
        comment: storeReviewComment.trim() || null,
        is_visible: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Rimuovi dalla lista
      setPendingStoreReviews(prev => prev.filter(r => r.bookingId !== item.bookingId));
      setSelectedStoreReview(null);
      setStoreReviewRating(0);
      setStoreReviewComment('');
      setStoreReviewCourtesy(0);
      setStoreReviewCare(0);
      setStoreReviewPunctuality(0);

      // Nascondi tab se non ci sono più recensioni pending
      if (pendingStoreReviews.length <= 1) {
        setShowStoreTab(false);
        setActiveTab('pending');
      }
    } catch (err) {
      console.error('Errore invio recensione store:', err);
    } finally {
      setSubmittingStoreReview(false);
    }
  };

  const renderStoreTab = () => {
    if (pendingStoreReviews.length === 0) {
      return (
        <div className="text-center py-12">
          <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nessuna recensione store da lasciare</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {pendingStoreReviews.map(item => (
          <div key={item.bookingId} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-900">{item.storeName}</p>
                <p className="text-xs text-gray-500">{item.listingTitle}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(item.completedAt).toLocaleDateString('it-IT')}
                </p>
              </div>
              <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-medium">
                Da recensire
              </span>
            </div>

            {selectedStoreReview?.bookingId === item.bookingId ? (
              <div className="space-y-3">
                {/* Valutazione globale */}
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Valutazione generale</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setStoreReviewRating(n)}>
                        <Star className={`w-7 h-7 transition-colors ${n <= storeReviewRating ? 'text-amber-400 fill-current' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Criteri */}
                {[
                  { key: 'courtesy', label: '😊 Cortesia', value: storeReviewCourtesy, setter: setStoreReviewCourtesy },
                  { key: 'care', label: '📦 Cura dell\'oggetto', value: storeReviewCare, setter: setStoreReviewCare },
                  { key: 'punctuality', label: '⏱️ Puntualità', value: storeReviewPunctuality, setter: setStoreReviewPunctuality },
                ].map(criterion => (
                  <div key={criterion.key}>
                    <p className="text-xs font-medium text-gray-700 mb-1">{criterion.label}</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => criterion.setter(n)}>
                          <Star className={`w-5 h-5 transition-colors ${n <= criterion.value ? 'text-amber-400 fill-current' : 'text-gray-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {/* Commento */}
                <textarea
                  value={storeReviewComment}
                  onChange={e => setStoreReviewComment(e.target.value)}
                  placeholder="Lascia un commento (opzionale)..."
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-brand outline-none"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => submitStoreReview(item)}
                    disabled={storeReviewRating === 0 || submittingStoreReview}
                    className="flex-1 bg-brand text-white py-2 rounded-lg text-sm font-medium hover:bg-brand-dark disabled:opacity-50 transition-colors"
                  >
                    {submittingStoreReview ? 'Invio...' : 'Invia recensione'}
                  </button>
                  <button
                    onClick={() => { setSelectedStoreReview(null); setStoreReviewRating(0); setStoreReviewComment(''); setStoreReviewCourtesy(0); setStoreReviewCare(0); setStoreReviewPunctuality(0); }}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setSelectedStoreReview(item)}
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Scrivi recensione
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderPendingTab = () => {
    if (pendingReviews.length === 0) {
      return (
        <div className="text-center py-12">
          <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            Non hai recensioni da lasciare al momento
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Completa delle prenotazioni per poter lasciare recensioni
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pendingReviews.map((pending) => (
          <div
            key={pending.bookingId}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4 mb-4">
              <img
                src={pending.listingImage || '/placeholder.jpg'}
                alt={pending.listingTitle}
                className="w-20 h-20 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {pending.listingTitle}
                </h3>
               <p className="text-sm text-gray-500">
  Prenotazione terminata il{' '}
  {new Date(pending.endDate).toLocaleDateString('it-IT')}
</p>
{(() => {
  const timeLeft = getTimeRemaining(pending.endDate);
  if (!timeLeft) return null;
  return (
    <p className={`text-xs mt-1 flex items-center gap-1 ${
      timeLeft.days <= 1 ? 'text-red-500' : 'text-amber-600'
    }`}>
      <Clock className="w-3 h-3" />
      {timeLeft.days > 0 
        ? `${timeLeft.days}g ${timeLeft.hours}h rimanenti`
        : `${timeLeft.hours}h rimanenti`
      }
    </p>
  );
})()}
              </div>
            </div>

<div className="flex items-center gap-3 mb-4">
            <img
  src={pending.otherUserAvatar}
  alt={pending.otherUserName}
  className="w-10 h-10 rounded-full object-cover"
/>
              <div>
                <p className="font-medium text-gray-900">
                  {pending.otherUserName}
                </p>
                <p className="text-xs text-gray-500">
                  {userType === 'hubber' ? 'Renter' : 'Hubber'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedBooking(pending);
                setShowReviewModal(true);
              }}
              className="w-full bg-[#0D414B] text-white py-2 px-4 rounded-lg hover:bg-[#0D414B]/90 transition-colors font-medium"
            >
              Lascia recensione
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderReceivedTab = () => {
    if (receivedReviews.length === 0) {
      return (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            Non hai ancora ricevuto recensioni
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {receivedReviews.map((review) => {
          const reviewer = review.reviewer;
          const reviewerName = reviewer?.public_name ||
            [reviewer?.first_name, reviewer?.last_name].filter(Boolean).join(' ') ||
            'Utente';
          const reviewerAvatar = getAvatarUrl(reviewer);

          return (
            <div
              key={review.id}
              className="bg-white border border-gray-200 rounded-xl p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={reviewerAvatar}
                  alt={reviewerName}
                  className="w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-80"
                  onClick={() =>
                    onViewProfile &&
                    onViewProfile({
                      id: review.reviewer_id,
                      name: reviewerName,
                      avatar: reviewerAvatar,
                    })
                  }
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    {reviewerName}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {new Date(review.created_at).toLocaleDateString('it-IT', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex gap-1">
  {[1, 2, 3, 4, 5].map((star) => (
    <Star
      key={star}
      className={`w-5 h-5 ${
        star <= review.rating
          ? 'text-[#0D414B] fill-current'
          : 'text-gray-300'
      }`}
    />
  ))}
</div>
              </div>

              {review.listing && (
                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Annuncio:</span>{' '}
                  {review.listing.title}
                </div>
              )}

              {review.comment && (
                <p className="text-gray-700 text-sm leading-relaxed">
                  {review.comment}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderGivenTab = () => {
    if (givenReviews.length === 0) {
      return (
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            Non hai ancora lasciato recensioni
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {givenReviews.map((review) => {
          const reviewee = review.reviewee;
          const revieweeName = reviewee?.public_name ||
            [reviewee?.first_name, reviewee?.last_name].filter(Boolean).join(' ') ||
            'Utente';
          const revieweeAvatar = getAvatarUrl(reviewee);

          return (
            <div
              key={review.id}
              className="bg-white border border-gray-200 rounded-xl p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={revieweeAvatar}
                  alt={revieweeName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    {revieweeName}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {new Date(review.created_at).toLocaleDateString('it-IT', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex gap-1">
  {[1, 2, 3, 4, 5].map((star) => (
    <Star
      key={star}
      className={`w-5 h-5 ${
        star <= review.rating
          ? 'text-[#0D414B] fill-current'
          : 'text-gray-300'
      }`}
    />
  ))}
</div>
              </div>

              {review.listing && (
                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Annuncio:</span>{' '}
                  {review.listing.title}
                </div>
              )}

              {review.comment && (
                <p className="text-gray-700 text-sm leading-relaxed">
                  {review.comment}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Recensioni</h2>
        <p className="text-sm text-gray-500 mt-1">
          Gestisci le tue recensioni
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-4 px-1 relative ${
              activeTab === 'pending'
                ? 'text-[#0D414B] font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Da lasciare
              {pendingReviews.length > 0 && (
                <span className="bg-[#0D414B] text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingReviews.length}
                </span>
              )}
            </div>
            {activeTab === 'pending' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0D414B]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('received')}
            className={`pb-4 px-1 relative ${
              activeTab === 'received'
                ? 'text-[#0D414B] font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Ricevute
            </div>
            {activeTab === 'received' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0D414B]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('given')}
            className={`pb-4 px-1 relative ${
              activeTab === 'given'
                ? 'text-[#0D414B] font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Lasciate
            </div>
            {activeTab === 'given' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0D414B]" />
            )}
          </button>
        {showStoreTab && (
            <button
              onClick={() => setActiveTab('store')}
              className={`pb-4 px-1 relative ${
                activeTab === 'store'
                  ? 'text-[#0D414B] font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Store
                {pendingStoreReviews.length > 0 && (
                  <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {pendingStoreReviews.length}
                  </span>
                )}
              </div>
              {activeTab === 'store' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0D414B]" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D414B]"></div>
        </div>
      ) : (
        <>
          {activeTab === 'pending' && renderPendingTab()}
          {activeTab === 'received' && renderReceivedTab()}
          {activeTab === 'given' && renderGivenTab()}
          {activeTab === 'store' && renderStoreTab()}
        </>
      )}

      {/* Modal Recensione */}
{showReviewModal && selectedBooking && (
  <WriteReviewModal
    isOpen={showReviewModal}
    onClose={() => {
      setShowReviewModal(false);
      setSelectedBooking(null);
    }}
    onSuccess={async () => {
      setShowReviewModal(false);
      setSelectedBooking(null);
      await loadPendingReviews();
    }}
    bookingId={selectedBooking.bookingId}
    listingTitle={selectedBooking.listingTitle}
    reviewerId={userId}
    revieweeId={selectedBooking.otherUserId}
    revieweeName={selectedBooking.otherUserName}
    revieweeAvatar={selectedBooking.otherUserAvatar}
    reviewType={userType === 'hubber' ? 'hubber_to_renter' : 'renter_to_hubber'}
  />
)}
    </div>
  );
};