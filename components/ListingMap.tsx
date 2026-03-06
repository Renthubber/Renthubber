import React, { useEffect, useRef, useState } from 'react';
import { Box, LayoutGrid, MapPin } from 'lucide-react';
import { geocodeAddress, getCityCenter } from '../services/geocodingService';

// Tipi
interface ListingMapProps {
  location: string;           // Città/zona (es. "Milano, MI")
  category: 'oggetto' | 'spazio';
  exactAddress?: string;      // Indirizzo esatto (solo dopo prenotazione)
  showExactLocation?: boolean; // Se true, mostra posizione esatta
  height?: string;            // Altezza mappa (default: 200px)
  className?: string;
}

// Nota: Leaflet CSS deve essere importato nel file principale (index.html o App.tsx)
// <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

export const ListingMap: React.FC<ListingMapProps> = ({
  location,
  category,
  exactAddress,
  showExactLocation = false,
  height = '200px',
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // Carica coordinate
  useEffect(() => {
    const loadCoordinates = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let result;
        
        if (showExactLocation && exactAddress) {
          // Mostra posizione esatta
          result = await geocodeAddress(exactAddress);
        } else {
          // Mostra solo centro città (approssimativo)
          result = await getCityCenter(location);
        }

        if (result) {
          setCoordinates({ lat: result.lat, lng: result.lng });
        } else {
          setError('Posizione non trovata');
        }
      } catch (err) {
        console.error('Errore caricamento mappa:', err);
        setError('Errore caricamento mappa');
      } finally {
        setIsLoading(false);
      }
    };

    if (location) {
      loadCoordinates();
    }
  }, [location, exactAddress, showExactLocation]);

  // Inizializza mappa Leaflet
  useEffect(() => {
    if (!coordinates || !mapContainerRef.current) return;

    // Carica Leaflet dinamicamente
    const initMap = async () => {
      // @ts-ignore
      const L = await import('leaflet');

      // Pulisci mappa esistente
      if (mapRef.current) {
        mapRef.current.remove();
      }

      // Crea mappa
      const map = L.map(mapContainerRef.current!, {
        center: [coordinates.lat, coordinates.lng],
        zoom: showExactLocation ? 16 : 13, // Zoom più vicino se posizione esatta
        zoomControl: true,
        scrollWheelZoom: false, // Disabilita zoom con scroll
        dragging: true,
      });

      // Aggiungi layer OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Crea icona personalizzata in base alla categoria
      const iconSvg = category === 'oggetto' 
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="14" rx="1"></rect><rect width="7" height="7" x="3" y="14" rx="1"></rect></svg>`;

      const customIcon = L.divIcon({
        html: `
          <div style="
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 3px solid white;
          ">
            <div style="transform: rotate(45deg);">
              ${iconSvg}
            </div>
          </div>
        `,
        className: 'custom-marker',
        iconSize: [48, 48],
        iconAnchor: [24, 48],
        popupAnchor: [0, -48],
      });

      if (showExactLocation) {
        // Marker preciso
        L.marker([coordinates.lat, coordinates.lng], { icon: customIcon })
          .addTo(map)
          .bindPopup(`<strong>${exactAddress || location}</strong>`)
          .openPopup();
      } else {
        // Cerchio sfumato per posizione approssimativa
        L.circle([coordinates.lat, coordinates.lng], {
          color: '#1e3a5f',
          fillColor: '#1e3a5f',
          fillOpacity: 0.15,
          radius: 800, // 800 metri di raggio
          weight: 2,
          dashArray: '5, 10',
        }).addTo(map);

        // Marker al centro del cerchio
        L.marker([coordinates.lat, coordinates.lng], { icon: customIcon })
          .addTo(map);
      }

      mapRef.current = map;
    };

    initMap();

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [coordinates, category, showExactLocation, exactAddress, location]);

  // Loading state
  if (isLoading) {
    return (
      <div 
        className={`bg-gray-100 rounded-xl flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Caricamento mappa...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !coordinates) {
    return (
      <div 
        className={`bg-gray-100 rounded-xl flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center text-gray-400">
          <MapPin className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">{error || 'Posizione non disponibile'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Mappa */}
      <div 
        ref={mapContainerRef} 
        className="rounded-xl overflow-hidden"
        style={{ height, width: '100%' }}
      />
      
      {/* Didascalia */}
      <div className="mt-2 flex items-center text-xs text-gray-500">
        <MapPin className="w-3 h-3 mr-1" />
        {showExactLocation ? (
          <span>{exactAddress || location}</span>
        ) : (
          <span>Posizione approssimativa • L'indirizzo esatto verrà comunicato dopo la prenotazione</span>
        )}
      </div>
    </div>
  );
};

// Versione semplificata per preview (senza Leaflet, usa immagine statica)
export const ListingMapStatic: React.FC<ListingMapProps> = ({
  location,
  category,
  height = '200px',
  className = '',
}) => {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const result = await getCityCenter(location);
      if (result) {
        setCoordinates(result);
      }
      setIsLoading(false);
    };
    if (location) load();
  }, [location]);

  if (isLoading) {
    return (
      <div 
        className={`bg-gray-100 rounded-xl flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="animate-spin w-6 h-6 border-2 border-brand border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!coordinates) {
    return (
      <div 
        className={`bg-gray-100 rounded-xl flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <MapPin className="w-8 h-8 text-gray-300" />
      </div>
    );
  }

  // Usa immagine statica OpenStreetMap
  const staticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${coordinates.lat},${coordinates.lng}&zoom=13&size=600x300&maptype=osmarenderer`;

  return (
    <div className={className}>
      <div 
        className="rounded-xl overflow-hidden relative bg-gray-100"
        style={{ height }}
      >
        <img 
          src={staticMapUrl}
          alt={`Mappa ${location}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        
        {/* Overlay con cerchio approssimativo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-32 h-32 rounded-full border-2 border-brand border-dashed bg-brand/10"></div>
          <div className="absolute">
            <div className="w-12 h-12 bg-brand rounded-full flex items-center justify-center shadow-lg">
              {category === 'oggetto' ? (
                <Box className="w-6 h-6 text-white" />
              ) : (
                <LayoutGrid className="w-6 h-6 text-white" />
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-2 flex items-center text-xs text-gray-500">
        <MapPin className="w-3 h-3 mr-1" />
        <span>Posizione approssimativa • {location}</span>
      </div>
    </div>
  );
};

export default ListingMap;