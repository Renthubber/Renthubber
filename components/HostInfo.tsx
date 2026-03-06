import React, { useState, useEffect } from "react";
import { User } from "../types";
import { Star, ShieldCheck, Award } from "lucide-react";
import { api } from "../services/api";
import { getAvatarUrl } from "../utils/avatarUtils";

interface HostInfoProps {
  owner?: User | null;
  onHostClick?: (host: User) => void;
}

// 🔒 Helper per formattare il nome in modo privacy-friendly: "Davide P."
const formatPrivacyName = (fullName: string | undefined): string => {
  if (!fullName) return "Hubber Renthubber";
  
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return parts[0]; // Solo nome
  
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  
  return `${firstName} ${lastInitial}.`;
};


export const HostInfo: React.FC<HostInfoProps> = ({ owner, onHostClick }) => {
  // ✅ State per il conteggio recensioni
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [avgRating, setAvgRating] = useState<number>(0);

  // ✅ Carica conteggio recensioni da Supabase
  useEffect(() => {
    const loadReviewCount = async () => {
      if (!owner?.id) return;
      
      try {
        const reviews = await api.reviews.getForHubber(owner.id);
        setReviewCount(reviews.length);
        
        // Calcola rating medio dalle recensioni
        if (reviews.length > 0) {
          const avg = reviews.reduce((sum: number, r: any) => 
            sum + ((r as any).rating || (r as any).overallRating || 0), 0
          ) / reviews.length;
          setAvgRating(Math.round(avg * 10) / 10);
        } else {
          // Usa il rating dal profilo se non ci sono recensioni
          setAvgRating(owner.rating || 0);
        }
      } catch (err) {
        console.error("Errore caricamento recensioni hubber:", err);
        // Fallback al rating del profilo
        setAvgRating(owner.rating || 0);
      }
    };

    loadReviewCount();
  }, [owner?.id, owner?.rating]);

  // Se non abbiamo un owner vero, NON mostriamo nulla
  if (!owner) {
    return null;
  }

  // ✅ Usa publicName dal DB se disponibile, altrimenti genera da firstName/lastName o name
  const displayName = 
    (owner as any).publicName ||  // Prima prova publicName dal DB
    ((owner as any).firstName && (owner as any).lastName 
      ? `${(owner as any).firstName} ${(owner as any).lastName.charAt(0)}.`  // Poi firstName + iniziale lastName
      : formatPrivacyName(owner.name));  // Fallback: genera da name

  // ✅ Genera avatar uniforme
const avatarUrl = getAvatarUrl(owner);

  const hubberSinceYear = owner.hubberSince
    ? new Date(owner.hubberSince).getFullYear()
    : undefined;

  const handleClick = () => {
    if (onHostClick) {
      onHostClick(owner);
    }
  };

  // ✅ Estrai il primo nome per il messaggio bio
  const firstName = (owner as any).firstName || displayName.split(" ")[0] || "questo hubber";

  return (
    <div className="border-t border-b border-gray-100 py-8 flex items-start gap-4">
      <div
        className={`relative ${onHostClick ? "cursor-pointer" : ""}`}
        onClick={handleClick}
      >
        {/* ✅ Avatar uniforme con iniziali */}
<img
  src={avatarUrl}
  alt={displayName}
  className="w-16 h-16 rounded-full object-cover border border-gray-200 hover:opacity-90 transition-opacity"
/>
        {owner.isSuperHubber && (
          <div className="absolute bottom-0 right-0 bg-brand text-white p-1 rounded-full border-2 border-white shadow-sm">
            <Award className="w-3 h-3" />
          </div>
        )}
      </div>

      <div className="flex-1">
        <h3
          className={`text-lg font-bold text-gray-900 ${
            onHostClick
              ? "cursor-pointer hover:underline decoration-2 underline-offset-2"
              : ""
          }`}
          onClick={handleClick}
        >
          Hubber: {displayName}
        </h3>

        {hubberSinceYear && (
          <p className="text-sm text-gray-500 mb-3">
            Membro dal {hubberSinceYear}
          </p>
        )}

        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center text-gray-700">
            <Star className="w-4 h-4 mr-1.5 text-gray-900 fill-current" />
            {/* ✅ Mostra rating + numero valutazioni */}
            {reviewCount > 0 ? (
              <>
                <span className="font-bold mr-1">{avgRating}</span>
                <span>({reviewCount} {reviewCount === 1 ? 'valutazione' : 'valutazioni'})</span>
              </>
            ) : (
              <span className="text-gray-500">Nessuna valutazione</span>
            )}
          </div>

          {owner.idDocumentVerified && (
            <div className="flex items-center text-gray-700">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-gray-900" />
              Identità verificata
            </div>
          )}
        </div>

        <p className="mt-4 text-gray-600 text-sm leading-relaxed max-w-lg">
          {owner.bio
            ? owner.bio
            : `Ciao, sono ${firstName}! Amo condividere le mie passioni e mettere a disposizione ciò che non uso.`}
        </p>
      </div>
    </div>
  );
};