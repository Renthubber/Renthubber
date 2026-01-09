import React, { useState } from "react";
import { Star, ChevronLeft, ChevronRight, X, AlertCircle, CheckCircle } from "lucide-react";
import { api } from "../services/api";

/* ------------------------------------------------------
   TIPI
-------------------------------------------------------*/
type ReviewType = 'renter_to_hubber' | 'hubber_to_renter';

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  
  // Dati necessari
  bookingId: string;
  listingId?: string;
  listingTitle: string;
  reviewerId: string;
  revieweeId: string;
  revieweeName: string;
  revieweeAvatar?: string;
  reviewType: ReviewType;
  listingCategory?: 'oggetto' | 'spazio';
}

/* ------------------------------------------------------
   COMPONENTE: Selettore stelle
-------------------------------------------------------*/
interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const StarRating: React.FC<StarRatingProps> = ({ 
  value, 
  onChange, 
  size = 'md',
  label 
}) => {
  const [hover, setHover] = useState(0);
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  return (
    <div>
      {label && (
        <p className="text-sm text-gray-600 mb-2">{label}</p>
      )}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`${sizeClasses[size]} ${
                star <= (hover || value)
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              } transition-colors`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------
   COMPONENTE PRINCIPALE: WriteReviewModal
-------------------------------------------------------*/
export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  bookingId,
  listingId,
  listingTitle,
  reviewerId,
  revieweeId,
  revieweeName,
  revieweeAvatar,
  reviewType,
  listingCategory = 'oggetto'
}) => {
  // Step corrente (1-4)
  const [step, setStep] = useState(1);
  
  // Stato form
  const [overallRating, setOverallRating] = useState(0);
  const [initialRating, setInitialRating] = useState(0);
  const [ratingAsDescribed, setRatingAsDescribed] = useState(0);
  const [ratingCommunication, setRatingCommunication] = useState(0);
  const [ratingPunctuality, setRatingPunctuality] = useState(0);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingRulesRespect, setRatingRulesRespect] = useState(0);
  const [ratingItemCare, setRatingItemCare] = useState(0);
  const [comment, setComment] = useState("");
  const [privateNote, setPrivateNote] = useState("");
  
  // Stato UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Labels in base al tipo di recensione
  const isRenterReview = reviewType === 'renter_to_hubber';
  
  const punctualityLabel = isRenterReview
    ? (listingCategory === 'spazio' ? 'Check-in / Check-out' : 'Consegna / Ritiro')
    : 'Puntualità';

  // Reset form
  const resetForm = () => {
    setStep(1);
    setOverallRating(0);
    setRatingAsDescribed(0);
    setRatingCommunication(0);
    setRatingPunctuality(0);
    setRatingValue(0);
    setRatingRulesRespect(0);
    setRatingItemCare(0);
    setComment("");
    setPrivateNote("");
    setError(null);
    setSuccess(false);
  };

  // Chiudi e reset
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Validazione step
  const canProceed = () => {
    switch (step) {
      case 1:
        return overallRating > 0;
      case 2:
        if (isRenterReview) {
          return ratingAsDescribed > 0 && ratingCommunication > 0 && 
                 ratingPunctuality > 0 && ratingValue > 0;
        } else {
          return ratingCommunication > 0 && ratingRulesRespect > 0 && 
                 ratingPunctuality > 0 && ratingItemCare > 0;
        }
      case 3:
        return comment.length >= 50 && comment.length <= 1000;
      case 4:
        return true; // Conferma sempre possibile
      default:
        return false;
    }
  };

  // Submit recensione
  const handleSubmit = async () => {
  setLoading(true);
  setError(null);

  try {
    const result = await api.reviews.create({
      bookingId,
      listingId,
      reviewerId,
      revieweeId,
      reviewType,
      overallRating,
      comment,
    });

    // ✅ Se arriviamo qui senza errori, la recensione è stata creata
    console.log("✅ Recensione salvata:", result);
    setSuccess(true);
    
    setTimeout(() => {
      handleClose();
      onSuccess();
    }, 2000);
    
  } catch (e: any) {
    console.error("Errore submit review:", e);
    setError(e?.message || "Si è verificato un errore. Riprova.");
  } finally {
    setLoading(false);
  }
};

  // Iniziale reviewee per avatar fallback
  const revieweeInitial = revieweeName?.charAt(0).toUpperCase() || "U";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-xl">
        
        {/* =====================================================
            HEADER
        ===================================================== */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            {step > 1 && !success && (
              <button
                onClick={() => setStep(step - 1)}
                className="mr-3 p-1 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-xl font-bold">
              {success ? "Grazie!" : `Lascia una recensione`}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        {!success && (
          <div className="px-6 pt-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    s <= step ? 'bg-gray-900' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Step {step} di 4
            </p>
          </div>
        )}

        {/* =====================================================
            CONTENUTO
        ===================================================== */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          
          {/* SUCCESS STATE */}
          {success && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Recensione inviata!
              </h3>
              <p className="text-gray-600">
                La tua recensione sarà visibile quando anche {revieweeName} avrà recensito, 
                oppure dopo 7 giorni.
              </p>
            </div>
          )}

          {/* STEP 1: Rating generale */}
          {!success && step === 1 && (
            <div className="text-center">
              {/* Avatar */}
              <div className="mb-6">
                {revieweeAvatar ? (
                  <img
                    src={revieweeAvatar}
                    alt={revieweeName}
                    className="w-20 h-20 rounded-full mx-auto object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-3xl font-bold mx-auto">
                    {revieweeInitial}
                  </div>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Come è stata la tua esperienza con {revieweeName}?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {listingTitle}
              </p>
              
              <div className="flex justify-center">
                <StarRating
                  value={overallRating}
                  onChange={setOverallRating}
                  size="lg"
                />
              </div>
              
              {overallRating > 0 && (
                <p className="mt-4 text-sm text-gray-600">
                  {overallRating === 1 && "Pessima esperienza"}
                  {overallRating === 2 && "Esperienza negativa"}
                  {overallRating === 3 && "Nella media"}
                  {overallRating === 4 && "Buona esperienza"}
                  {overallRating === 5 && "Esperienza eccellente!"}
                </p>
              )}
            </div>
          )}

          {/* STEP 2: Rating specifici */}
          {!success && step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Valuta i dettagli
              </h3>
              
              {isRenterReview ? (
                // Rating per Renter → Hubber
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">
                      {listingCategory === 'spazio' ? 'Spazio come descritto' : 'Oggetto come descritto'}
                    </span>
                    <StarRating
                      value={ratingAsDescribed}
                      onChange={setRatingAsDescribed}
                      size="sm"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Comunicazione</span>
                    <StarRating
                      value={ratingCommunication}
                      onChange={setRatingCommunication}
                      size="sm"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">{punctualityLabel}</span>
                    <StarRating
                      value={ratingPunctuality}
                      onChange={setRatingPunctuality}
                      size="sm"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Rapporto qualità/prezzo</span>
                    <StarRating
                      value={ratingValue}
                      onChange={setRatingValue}
                      size="sm"
                    />
                  </div>
                </>
              ) : (
                // Rating per Hubber → Renter
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Comunicazione</span>
                    <StarRating
                      value={ratingCommunication}
                      onChange={setRatingCommunication}
                      size="sm"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Rispetto delle regole</span>
                    <StarRating
                      value={ratingRulesRespect}
                      onChange={setRatingRulesRespect}
                      size="sm"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Puntualità</span>
                    <StarRating
                      value={ratingPunctuality}
                      onChange={setRatingPunctuality}
                      size="sm"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">
                      Cura {listingCategory === 'spazio' ? 'dello spazio' : "dell'oggetto"}
                    </span>
                    <StarRating
                      value={ratingItemCare}
                      onChange={setRatingItemCare}
                      size="sm"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 3: Commento */}
          {!success && step === 3 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Racconta la tua esperienza
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Scrivi un commento che aiuterà altri utenti. 
                Minimo 50 caratteri, massimo 1000.
              </p>
              
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={isRenterReview 
                  ? "Descrivi la tua esperienza con questo hubber: l'oggetto/spazio era come descritto? La comunicazione è stata buona?"
                  : "Descrivi la tua esperienza con questo renter: ha rispettato le regole? È stato puntuale?"}
                className="w-full h-40 p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                maxLength={1000}
              />
              
              <div className="flex justify-between mt-2 text-sm">
                <span className={comment.length < 50 ? 'text-red-500' : 'text-gray-500'}>
                  {comment.length < 50 
                    ? `Ancora ${50 - comment.length} caratteri richiesti`
                    : '✓ Minimo raggiunto'}
                </span>
                <span className="text-gray-500">
                  {comment.length}/1000
                </span>
              </div>

              {/* Nota privata */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Nota privata (opzionale)
                </h4>
                <p className="text-xs text-gray-500 mb-3">
                  Visibile solo a {revieweeName} e agli admin. Non sarà pubblica.
                </p>
                <textarea
                  value={privateNote}
                  onChange={(e) => setPrivateNote(e.target.value)}
                  placeholder="Es: Per la prossima volta potresti..."
                  className="w-full h-20 p-3 border border-gray-300 rounded-xl resize-none text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  maxLength={500}
                />
              </div>
            </div>
          )}

          {/* STEP 4: Conferma */}
          {!success && step === 4 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Conferma la tua recensione
              </h3>
              
              {/* Anteprima */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                {/* Rating */}
                <div className="flex items-center mb-3">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= overallRating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 font-semibold">{overallRating}/5</span>
                </div>
                
                {/* Commento */}
                <p className="text-gray-700 text-sm leading-relaxed">
                  "{comment}"
                </p>
                
                {privateNote && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      <span className="font-semibold">Nota privata:</span> {privateNote}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Avviso blind */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  La tua recensione sarà visibile quando anche {revieweeName} avrà 
                  lasciato la sua, oppure automaticamente dopo 7 giorni.
                </p>
              </div>

              {/* Errore */}
              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* =====================================================
            FOOTER
        ===================================================== */}
        {!success && (
          <div className="p-6 border-t bg-gray-50">
            <div className="flex gap-3">
              {step < 4 ? (
                <button
                onClick={() => {
  // Salva il rating iniziale quando esci dallo Step 1
  if (step === 1) {
    setInitialRating(overallRating);
  }
  
  // Calcola la media pesata quando esci dallo Step 2
  if (step === 2) {
    const ratings = isRenterReview
      ? [ratingAsDescribed, ratingCommunication, ratingPunctuality, ratingValue]
      : [ratingCommunication, ratingRulesRespect, ratingPunctuality, ratingItemCare];
    
    // Formula: 40% step 1 (RATING INIZIALE) + 15% per ogni categoria
    const finalRating = (initialRating * 0.4) + (ratings[0] * 0.15) + (ratings[1] * 0.15) + (ratings[2] * 0.15) + (ratings[3] * 0.15);
    setOverallRating(Math.round(finalRating * 10) / 10);
  }
  
  setStep(step + 1);
}}
                  disabled={!canProceed()}
                  className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center transition-colors ${
                    canProceed()
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Continua
                  <ChevronRight className="w-5 h-5 ml-1" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                    loading
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {loading ? 'Invio in corso...' : 'Invia recensione'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WriteReviewModal;