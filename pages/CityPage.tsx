import React from "react";
import { useParams, Navigate } from "react-router-dom";

/**
 * CityPage
 * - Decide cosa mostrare in base allo stato della città
 * - Se la città è attiva → marketplace
 * - Se NON è attiva → redirect a /lancio
 */

// 🔧 TEMPORANEO (poi arriverà da Supabase se vorrai)
const CITIES: Record<
  string,
  {
    name: string;
    isActive: boolean;
  }
> = {
  catania: { name: "Catania", isActive: true },
  milano: { name: "Milano", isActive: false },
  roma: { name: "Roma", isActive: false },
};

function NotFound() {
  return (
    <div style={{ padding: 24 }}>
      <h1>404</h1>
      <p>Città non trovata</p>
    </div>
  );
}

function CityMarketplacePlaceholder({ cityName }: { cityName: string }) {
  return (
    <div style={{ padding: 24 }}>
      <h1>Marketplace – {cityName}</h1>
      <p>
        (Placeholder) Qui andrà la ricerca annunci, filtri, categorie, ecc.
      </p>
    </div>
  );
}

export default function CityPage() {
  const { citySlug } = useParams<{ citySlug: string }>();

  // sicurezza extra
  if (!citySlug) {
    return <NotFound />;
  }

  const city = CITIES[citySlug.toLowerCase()];

  if (!city) {
    return <NotFound />;
  }

  // 🟢 Città attiva → marketplace
  if (city.isActive) {
    return <CityMarketplacePlaceholder cityName={city.name} />;
  }

  // 🔵 Città NON attiva → redirect a landing lancio
  return <Navigate to="/lancio" replace />;
}