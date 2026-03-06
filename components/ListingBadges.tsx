import React from "react";
import { Shield, Star, CheckCircle2, Zap, Sparkles, Clock, Award } from "lucide-react";
import { Listing, User } from "../types";

interface ListingBadgesProps {
  listing: Listing;
  host?: User | null;
  currentUser?: User | null;
}

export const ListingBadges: React.FC<ListingBadgesProps> = ({
  listing,
  host,
  currentUser,
}) => {
  const effectiveHost: User | null = host || currentUser || null;

  const isSuperHubber = !!effectiveHost?.isSuperHubber;
  const isVerified = effectiveHost?.verificationStatus === "verified";
  const rating = listing.rating ?? 0;

  const badges: { label: string; icon: React.ComponentType<any>; color?: string }[] = [];

  // ✅ BADGE "NOVITÀ" - annuncio creato negli ultimi 30 giorni
  const createdAt = (listing as any).createdAt || (listing as any).created_at;
  if (createdAt) {
    const createdDate = new Date(createdAt);
    const daysSinceCreation = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceCreation <= 30) {
      badges.push({
        label: "Novità",
        icon: Sparkles,
        color: "bg-green-100 text-green-700",
      });
    }
  }

  // ✅ BADGE MANUALI (impostati dall'hubber nel form pubblicazione)
  const manualBadges = (listing as any).manualBadges || (listing as any).manual_badges || [];
  manualBadges.forEach((badgeLabel: string) => {
    // Evita duplicati (es. se "Novità" è già stato aggiunto automaticamente)
    if (!badges.find(b => b.label === badgeLabel)) {
      let icon = Zap;
      let color = "bg-amber-100 text-amber-700";
      
      // Icone e colori specifici per badge
      if (badgeLabel === "Offerta") {
        icon = Zap;
        color = "bg-red-100 text-red-700";
      } else if (badgeLabel === "Last Minute") {
        icon = Clock;
        color = "bg-orange-100 text-orange-700";
      } else if (badgeLabel === "Premium") {
        icon = Award;
        color = "bg-purple-100 text-purple-700";
      } else if (badgeLabel === "Novità") {
        icon = Sparkles;
        color = "bg-green-100 text-green-700";
      }
      
      badges.push({
        label: badgeLabel,
        icon,
        color,
      });
    }
  });

  // Tipo di annuncio
  badges.push({
    label: listing.category === "spazio" ? "Spazio" : "Oggetto",
    icon: Zap,
  });

  // Super Hubber
  if (isSuperHubber) {
    badges.push({
      label: "Super Hubber",
      icon: Star,
      color: "bg-yellow-100 text-yellow-700",
    });
  }

  // Identità verificata
  if (isVerified) {
    badges.push({
      label: "Identità verificata",
      icon: Shield,
      color: "bg-blue-100 text-blue-700",
    });
  }

  // Cancellazione flessibile
  if (listing.cancellationPolicy === "flexible") {
    badges.push({
      label: "Cancellazione flessibile",
      icon: CheckCircle2,
    });
  }

  // Rating alto
  if (rating && rating >= 4.5) {
    badges.push({
      label: `Valutazione ${rating.toFixed(1)}`,
      icon: Star,
      color: "bg-yellow-100 text-yellow-700",
    });
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {badges.map((badge, idx) => {
        const Icon = badge.icon;
        return (
          <span
            key={idx}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
              badge.color || "bg-slate-100 text-slate-700"
            }`}
          >
            <Icon className="w-3 h-3" />
            {badge.label}
          </span>
        );
      })}
    </div>
  );
};