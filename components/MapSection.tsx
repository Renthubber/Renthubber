import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Box, LayoutGrid, Loader2 } from 'lucide-react';
import { geocodeAddress } from '../services/geocodingService';
import L from 'leaflet';

interface MapSectionProps {
  location: string;
  coordinates?: { lat: number; lng: number } | null;
  category?: 'oggetto' | 'spazio';
  zoneDescription?: string;
}

export const MapSection: React.FC<MapSectionProps> = ({ 
  location, 
  coordinates,
  category = 'oggetto',
  zoneDescription
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapCoordinates, setMapCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // ✅ Carica coordinate - SEMPRE da geocoding (ignora coordinate DB che potrebbero essere sbagliate)
  useEffect(() => {
    const loadCoordinates = async () => {
      setIsLoading(true);
      
      // ✅ IGNORA le coordinate salvate nel DB (spesso sono sbagliate - es. Milano per tutti)
      // Geocodifica SEMPRE dalla location testuale per avere coordinate corrette
      if (location && location.trim()) {
        console.log("🔍 Geocodifica location:", location);
        try {
          const result = await geocodeAddress(location);
          
          if (result && result.lat && result.lng) {
            console.log("✅ Coordinate da geocoding:", result.lat, result.lng);
            setMapCoordinates({ lat: result.lat, lng: result.lng });
          } else {
            console.warn("⚠️ Geocoding fallito per:", location);
            setMapCoordinates(null);
          }
        } catch (error) {
          console.error('❌ Errore geocoding:', error);
          setMapCoordinates(null);
        }
      } else {
        console.warn("⚠️ Location vuota o non valida");
        setMapCoordinates(null);
      }
      
      setIsLoading(false);
    };

    loadCoordinates();
  }, [location]);

  // ✅ Inizializza mappa Leaflet
  useEffect(() => {
    if (!mapCoordinates || !mapContainerRef.current || isLoading) {
      return;
    }

    console.log("🗺️ Inizializzazione mappa con coordinate:", mapCoordinates);

    // Pulisci mappa esistente
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Crea mappa
    const map = L.map(mapContainerRef.current, {
      center: [mapCoordinates.lat, mapCoordinates.lng],
      zoom: 14,
      zoomControl: true,
      scrollWheelZoom: false,
      dragging: true,
    });

    // Aggiungi layer OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Crea icona SVG in base alla categoria
    const iconSvg = category === 'oggetto' 
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="14" rx="1"></rect><rect width="7" height="7" x="3" y="14" rx="1"></rect></svg>`;

    // Crea marker personalizzato
    const customIcon = L.divIcon({
      html: `
        <div style="
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #0D414B 0%, #1A5E6B 100%);
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          border: 3px solid white;
        ">
          <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
            ${iconSvg}
          </div>
        </div>
      `,
      className: 'custom-marker',
      iconSize: [44, 44],
      iconAnchor: [22, 44],
      popupAnchor: [0, -44],
    });

    // Aggiungi cerchio sfumato per posizione approssimativa
    L.circle([mapCoordinates.lat, mapCoordinates.lng], {
      color: '#0D414B',
      fillColor: '#0D414B',
      fillOpacity: 0.1,
      radius: 600,
      weight: 2,
      dashArray: '8, 8',
    }).addTo(map);

    // Aggiungi marker
    L.marker([mapCoordinates.lat, mapCoordinates.lng], { icon: customIcon })
      .addTo(map);

    mapRef.current = map;

    // Forza un refresh della mappa dopo il render
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapCoordinates, category, isLoading]);

  return (
    <div className="py-8 border-b border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-2">Dove ti troverai</h3>
      <p className="text-gray-500 mb-6 text-sm flex items-center">
        <MapPin className="w-4 h-4 mr-1" />
        {location || "Posizione non specificata"}
        <span className="text-gray-400 ml-1">(La posizione esatta verrà fornita dopo la prenotazione)</span>
      </p>
      
      {/* Mappa Leaflet */}
      <div className="w-full h-80 bg-gray-100 rounded-2xl relative overflow-hidden border border-gray-200">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto mb-2" />
              <p className="text-sm text-gray-500">Caricamento mappa...</p>
            </div>
          </div>
        ) : mapCoordinates ? (
          <div 
            ref={mapContainerRef} 
            className="w-full h-full"
            style={{ zIndex: 1 }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="bg-brand/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-3">
                <div className="bg-brand text-white p-3 rounded-full shadow-lg">
                  {category === 'oggetto' ? (
                    <Box className="w-6 h-6" />
                  ) : (
                    <LayoutGrid className="w-6 h-6" />
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-500">{location || "Posizione non disponibile"}</p>
              <p className="text-xs text-gray-400 mt-1">Posizione approssimativa</p>
            </div>
          </div>
        )}
      </div>
      
      
      {/* Descrizione zona */}
      {zoneDescription && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            {zoneDescription}
          </p>
        </div>
      )}
    </div>
  );
};