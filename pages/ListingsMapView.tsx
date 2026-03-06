import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapPin, SlidersHorizontal, Grid3x3, Map as MapIcon, X } from 'lucide-react';
import { Listing, User } from '../types';
import { ListingCardLarge } from '../components/ListingCardLarge';
import { geocodeAddress } from '../services/geocodingService';
import L from 'leaflet';
import 'leaflet.markercluster';

interface ListingsMapViewProps {
  listings: Listing[];
  currentUser?: User | null;
  onListingClick: (listing: Listing) => void;
}

export const ListingsMapView: React.FC<ListingsMapViewProps> = ({
  listings,
  currentUser,
  onListingClick,
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Params da URL
  const section = searchParams.get('section') || 'all';
  const sectionTitle = searchParams.get('title') || 'Tutti gli annunci';
  
  // Stati
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [listingsWithCoords, setListingsWithCoords] = useState<Array<Listing & { coords?: { lat: number; lng: number } }>>([]);
  const [isLoadingCoords, setIsLoadingCoords] = useState(true);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const markerClusterGroupRef = useRef<any>(null);
  const prevHoveredIdRef = useRef<string | null>(null);
  const prevSelectedIdRef = useRef<string | null>(null);

  // Filtra listings in base alla sezione
  useEffect(() => {
    let filtered = [...listings];

    switch (section) {
      case 'popular':
        filtered = filtered.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        break;
      case 'top-rated':
        filtered = filtered
          .filter(l => (l.rating || 0) >= 4.5 && (l.reviewCount || 0) >= 3)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'nearby':
        break;
      case 'recent':
        filtered = filtered.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        break;
      case 'for-you':
        filtered = filtered.sort(() => Math.random() - 0.5);
        break;
      default:
        break;
    }

    setFilteredListings(filtered);
  }, [section, listings]);

  // Geocodifica tutti gli annunci
  useEffect(() => {
    const geocodeListings = async () => {
      setIsLoadingCoords(true);
      
      const listingsWithCoordinates = await Promise.all(
        filteredListings.map(async (listing) => {
          try {
            const coords = await geocodeAddress(listing.location);
            return { ...listing, coords };
          } catch (error) {
            console.error(`Errore geocoding per ${listing.location}:`, error);
            return { ...listing, coords: undefined };
          }
        })
      );

      setListingsWithCoords(listingsWithCoordinates);
      setIsLoadingCoords(false);
    };

    if (filteredListings.length > 0) {
      geocodeListings();
    }
  }, [filteredListings]);

  // Inizializza mappa CON CLUSTERING
  useEffect(() => {
    if (!mapContainerRef.current || listingsWithCoords.length === 0 || !showMap) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    markersRef.current.clear();
    if (markerClusterGroupRef.current) {
      markerClusterGroupRef.current = null;
    }

    const validListings = listingsWithCoords.filter(l => {
      if (!l.coords) return false;
      // Escludi coordinate 0,0 (mare) e coordinate invalide
      if (l.coords.lat === 0 && l.coords.lng === 0) return false;
      // Escludi coordinate fuori dall'Italia (ragionevole range)
      if (l.coords.lat < 35 || l.coords.lat > 47) return false;
      if (l.coords.lng < 6 || l.coords.lng > 19) return false;
      return true;
    });
    
    if (validListings.length === 0) {
      console.warn('⚠️ Nessun annuncio con coordinate valide');
      return;
    }

    const validCoords = validListings.map(l => l.coords!);
    const avgLat = validCoords.reduce((sum, coord) => sum + coord.lat, 0) / validCoords.length;
    const avgLng = validCoords.reduce((sum, coord) => sum + coord.lng, 0) / validCoords.length;

    console.log(`🗺️ Centro mappa: ${avgLat.toFixed(4)}, ${avgLng.toFixed(4)} (${validCoords.length} annunci validi)`);
    console.log(`📍 Range: lat ${Math.min(...validCoords.map(c => c.lat)).toFixed(2)}-${Math.max(...validCoords.map(c => c.lat)).toFixed(2)}, lng ${Math.min(...validCoords.map(c => c.lng)).toFixed(2)}-${Math.max(...validCoords.map(c => c.lng)).toFixed(2)}`);

    // Crea bounds da tutte le coordinate
    const bounds = L.latLngBounds(validCoords.map(c => [c.lat, c.lng]));

    const map = L.map(mapContainerRef.current, {
      center: [avgLat, avgLng],
      zoom: 6, // Zoom iniziale temporaneo
      zoomControl: true,
      scrollWheelZoom: true,
      dragging: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Crea MarkerClusterGroup
    const markerClusterGroup = (L as any).markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div style="
            background: #0A4759;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">${count}</div>`,
          className: 'custom-cluster-icon',
          iconSize: [40, 40],
        });
      },
    });

    markerClusterGroupRef.current = markerClusterGroup;

    // Crea helper function per creare l'icona
    const createMarkerIcon = (listing: Listing & { coords?: { lat: number; lng: number } }, isHovered: boolean, isSelected: boolean) => {
      const isOggetto = listing.category === 'oggetto';
      const borderColor = isOggetto ? '#3DD9D0' : '#0A4759';
      const backgroundColor = isHovered || isSelected ? (isOggetto ? '#3DD9D0' : '#0A4759') : 'white';
      const textColor = isHovered || isSelected ? 'white' : (isOggetto ? '#3DD9D0' : '#0A4759');
      const priceText = `${listing.price} €`;
      const priceLength = priceText.length;
      const minWidth = Math.max(60, priceLength * 9 + 20);

      const iconHtml = `
        <div style="
          position: relative;
          background: ${backgroundColor};
          color: ${textColor};
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 13px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          border: 2px solid ${borderColor};
          white-space: nowrap;
          transform: ${isHovered || isSelected ? 'scale(1.15)' : 'scale(1)'};
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${priceText}
        </div>
      `;

      return L.divIcon({
        html: iconHtml,
        className: 'custom-price-marker',
        iconSize: [minWidth, 32],
        iconAnchor: [minWidth / 2, 16],
      });
    };

    validListings.forEach((listing) => {
      if (!listing.coords) return;

      const customIcon = createMarkerIcon(listing, false, false);

      const marker = L.marker([listing.coords.lat, listing.coords.lng], {
        icon: customIcon,
      });

      marker.on('click', () => {
        setSelectedListingId(listing.id);
        const cardElement = document.getElementById(`listing-card-${listing.id}`);
        if (cardElement) {
          cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });

      markerClusterGroup.addLayer(marker);
      markersRef.current.set(listing.id, marker);
    });

    map.addLayer(markerClusterGroup);
    
    // Adatta la vista per mostrare tutti i marker con padding
    map.fitBounds(bounds, {
      padding: [50, 50], // Padding di 50px ai bordi
      maxZoom: 12, // Non zoomare troppo se i marker sono vicini
    });
    
    mapRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current.clear();
      if (markerClusterGroupRef.current) {
        markerClusterGroupRef.current = null;
      }
    };
  }, [listingsWithCoords, showMap]); // RIMOSSO hoveredListingId e selectedListingId

  // Aggiorna SOLO i marker che cambiano stato (evita flash grigio)
  useEffect(() => {
    if (!mapRef.current || markersRef.current.size === 0) return;

    // Helper function per creare l'icona del marker
    const createMarkerIcon = (listing: Listing & { coords?: { lat: number; lng: number } }, isHovered: boolean, isSelected: boolean) => {
      const isOggetto = listing.category === 'oggetto';
      const borderColor = isOggetto ? '#3DD9D0' : '#0A4759';
      const backgroundColor = isHovered || isSelected ? (isOggetto ? '#3DD9D0' : '#0A4759') : 'white';
      const textColor = isHovered || isSelected ? 'white' : (isOggetto ? '#3DD9D0' : '#0A4759');
      const priceText = `${listing.price} €`;
      const priceLength = priceText.length;
      const minWidth = Math.max(60, priceLength * 9 + 20);

      const iconHtml = `
        <div style="
          position: relative;
          background: ${backgroundColor};
          color: ${textColor};
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 13px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          border: 2px solid ${borderColor};
          white-space: nowrap;
          transform: ${isHovered || isSelected ? 'scale(1.15)' : 'scale(1)'};
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${priceText}
        </div>
      `;

      return L.divIcon({
        html: iconHtml,
        className: 'custom-price-marker',
        iconSize: [minWidth, 32],
        iconAnchor: [minWidth / 2, 16],
      });
    };

    // Aggiorna il marker precedentemente hovered (se esiste)
    if (prevHoveredIdRef.current && prevHoveredIdRef.current !== hoveredListingId) {
      const prevMarker = markersRef.current.get(prevHoveredIdRef.current);
      const prevListing = listingsWithCoords.find(l => l.id === prevHoveredIdRef.current);
      if (prevMarker && prevListing) {
        const isStillSelected = prevHoveredIdRef.current === selectedListingId;
        prevMarker.setIcon(createMarkerIcon(prevListing, false, isStillSelected));
        prevMarker.setZIndexOffset(isStillSelected ? 1000 : 0);
      }
    }

    // Aggiorna il marker attualmente hovered
    if (hoveredListingId) {
      const hoveredMarker = markersRef.current.get(hoveredListingId);
      const hoveredListing = listingsWithCoords.find(l => l.id === hoveredListingId);
      if (hoveredMarker && hoveredListing) {
        const isAlsoSelected = hoveredListingId === selectedListingId;
        hoveredMarker.setIcon(createMarkerIcon(hoveredListing, true, isAlsoSelected));
        hoveredMarker.setZIndexOffset(1000);
      }
    }

    // Aggiorna il marker precedentemente selected (se esiste e diverso dall'hovered)
    if (prevSelectedIdRef.current && prevSelectedIdRef.current !== selectedListingId && prevSelectedIdRef.current !== hoveredListingId) {
      const prevMarker = markersRef.current.get(prevSelectedIdRef.current);
      const prevListing = listingsWithCoords.find(l => l.id === prevSelectedIdRef.current);
      if (prevMarker && prevListing) {
        prevMarker.setIcon(createMarkerIcon(prevListing, false, false));
        prevMarker.setZIndexOffset(0);
      }
    }

    // Aggiorna il marker attualmente selected (se diverso dall'hovered)
    if (selectedListingId && selectedListingId !== hoveredListingId) {
      const selectedMarker = markersRef.current.get(selectedListingId);
      const selectedListing = listingsWithCoords.find(l => l.id === selectedListingId);
      if (selectedMarker && selectedListing) {
        selectedMarker.setIcon(createMarkerIcon(selectedListing, false, true));
        selectedMarker.setZIndexOffset(1000);
      }
    }

    // Salva gli ID correnti per il prossimo ciclo
    prevHoveredIdRef.current = hoveredListingId;
    prevSelectedIdRef.current = selectedListingId;
  }, [hoveredListingId, selectedListingId, listingsWithCoords]);

  // Chiudi il tooltip quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const infoBox = document.getElementById('sort-info-box');
      const target = event.target as HTMLElement;
      
      if (infoBox && !infoBox.classList.contains('hidden')) {
        // Controlla se il click è fuori dal tooltip e dal bottone info
        if (!infoBox.contains(target) && !target.closest('button[aria-label="Informazioni sull\'ordinamento"]')) {
          infoBox.classList.add('hidden');
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className="h-screen flex flex-col">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{sectionTitle}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMap(!showMap)}
                className="lg:hidden flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium transition-colors"
              >
                {showMap ? (
                  <>
                    <Grid3x3 className="w-4 h-4" />
                    Lista
                  </>
                ) : (
                  <>
                    <MapIcon className="w-4 h-4" />
                    Mappa
                  </>
                )}
              </button>

              <button className="hidden sm:flex items-center gap-2 px-4 py-2 border border-gray-300 hover:border-gray-400 rounded-full text-sm font-medium transition-colors">
                <SlidersHorizontal className="w-4 h-4" />
                Filtri
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={`${
          showMap ? 'hidden lg:block lg:w-1/2' : 'w-full'
        } overflow-y-auto`}>
          <div className="p-4 lg:p-6">
            {/* Barra informativa ordinamento - STILE AIRBNB */}
            <div className="mb-4 max-w-5xl mx-auto">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Come ordiniamo i risultati</span>
                <button
                  onClick={() => {
                    const infoBox = document.getElementById('sort-info-box');
                    if (infoBox) {
                      infoBox.classList.toggle('hidden');
                    }
                  }}
                  className="relative group"
                  aria-label="Informazioni sull'ordinamento"
                >
                  <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center hover:border-gray-600 transition-colors cursor-pointer">
                    <span className="text-xs font-bold text-gray-600">i</span>
                  </div>
                  
                  {/* Tooltip popup */}
                  <div
                    id="sort-info-box"
                    className="hidden absolute left-0 top-8 z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-4"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById('sort-info-box')?.classList.add('hidden');
                      }}
                      className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <p className="text-sm text-gray-700 leading-relaxed pr-4">
                      I risultati di ricerca sono classificati in base a molti fattori, tra cui la popolarità, recensioni, qualità dell'annuncio e il prezzo dell'annuncio.{' '}
                      <a 
                        href="/ordinamento-risultati" 
                        className="text-brand font-semibold underline hover:text-brand-dark"
                      >
                        Scopri di più
                      </a>
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {filteredListings.map((listing) => (
                <div
                  key={listing.id}
                  id={`listing-card-${listing.id}`}
                  onMouseEnter={() => setHoveredListingId(listing.id)}
                  onMouseLeave={() => setHoveredListingId(null)}
                  onClick={() => {
                    setSelectedListingId(listing.id);
                    onListingClick(listing);
                  }}
                  className={`transition-all ${
                    selectedListingId === listing.id
                      ? 'ring-2 ring-brand ring-offset-2 rounded-lg'
                      : ''
                  }`}
                >
                  <ListingCardLarge
                    listing={listing}
                    onClick={onListingClick}
                    currentUser={currentUser}
                  />
                </div>
              ))}
            </div>

            {filteredListings.length === 0 && (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nessun annuncio trovato
                </h3>
                <p className="text-gray-500">
                  Prova a modificare i filtri di ricerca
                </p>
              </div>
            )}
          </div>
        </div>

        <div className={`${
          showMap ? 'w-full lg:w-1/2' : 'hidden'
        } sticky top-0 h-full p-6 bg-gray-50`}>
          <div className="relative h-full bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-200">
            {isLoadingCoords ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Caricamento mappa...</p>
                </div>
              </div>
            ) : (
              <div ref={mapContainerRef} className="w-full h-full" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingsMapView;