// Servizio di Geocoding usando Nominatim (OpenStreetMap) - GRATUITO
// Converte indirizzi in coordinate e viceversa

export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  city?: string;
  province?: string;
  region?: string;
}

export interface CitySuggestion {
  displayName: string;
  city: string;
  province?: string;
  region?: string;
  lat: number;
  lng: number;
}

// Cache per evitare chiamate ripetute
const geocodeCache = new Map<string, GeocodingResult>();
const searchCache = new Map<string, CitySuggestion[]>();

/**
 * Cerca città italiane con autocomplete usando Nominatim
 * @param query - Testo da cercare (es. "Mila" → "Milano, MI")
 * @returns Lista di suggerimenti città
 */
export const searchItalianCities = async (query: string): Promise<CitySuggestion[]> => {
  if (query.length < 2) return [];
  
  // Controlla cache
  const cacheKey = query.toLowerCase();
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }

  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: '8',
      countrycodes: 'it', // Solo Italia
      featuretype: 'city,town,village,municipality', // Solo città/comuni
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          'Accept-Language': 'it',
          'User-Agent': 'RentHubber/1.0', // Richiesto da Nominatim
        },
      }
    );

    if (!response.ok) {
      throw new Error('Errore ricerca città');
    }

    const data = await response.json();
    
    const suggestions: CitySuggestion[] = data
      .filter((item: any) => {
        // Filtra solo risultati con città/comune
        return item.address && (item.address.city || item.address.town || item.address.village || item.address.municipality);
      })
      .map((item: any) => {
        const addr = item.address;
        const cityName = addr.city || addr.town || addr.village || addr.municipality || '';
        const province = addr.county || addr.province || '';
        const region = addr.state || '';
        
        // Formato: "Città, Provincia" o "Città, Regione"
        let displayName = cityName;
        if (province && province !== cityName) {
          // Estrai sigla provincia se possibile
          displayName = `${cityName}, ${province}`;
        } else if (region) {
          displayName = `${cityName}, ${region}`;
        }

        return {
          displayName,
          city: cityName,
          province,
          region,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        };
      })
      // Rimuovi duplicati
      .filter((item: CitySuggestion, index: number, self: CitySuggestion[]) => 
        index === self.findIndex(t => t.city.toLowerCase() === item.city.toLowerCase())
      );

    // Salva in cache
    searchCache.set(cacheKey, suggestions);
    
    return suggestions;
  } catch (error) {
    console.error('Errore ricerca città:', error);
    return [];
  }
};

/**
 * Converte un indirizzo in coordinate (geocoding)
 * @param address - Indirizzo completo (es. "Via Roma 24, Milano")
 * @returns Coordinate lat/lng
 */
export const geocodeAddress = async (address: string): Promise<GeocodingResult | null> => {
  if (!address || address.length < 3) return null;

  // Controlla cache
  const cacheKey = address.toLowerCase();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  try {
    const params = new URLSearchParams({
      q: address + ', Italia',
      format: 'json',
      addressdetails: '1',
      limit: '1',
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          'Accept-Language': 'it',
          'User-Agent': 'RentHubber/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Errore geocoding');
    }

    const data = await response.json();
    
    if (data.length === 0) {
      return null;
    }

    const item = data[0];
    const addr = item.address || {};
    
    const result: GeocodingResult = {
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name,
      city: addr.city || addr.town || addr.village || addr.municipality,
      province: addr.county || addr.province,
      region: addr.state,
    };

    // Salva in cache
    geocodeCache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('Errore geocoding:', error);
    return null;
  }
};

/**
 * Geocoding inverso: coordinate → indirizzo
 * @param lat - Latitudine
 * @param lng - Longitudine
 * @returns Indirizzo
 */
export const reverseGeocode = async (lat: number, lng: number): Promise<GeocodingResult | null> => {
  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
      addressdetails: '1',
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params}`,
      {
        headers: {
          'Accept-Language': 'it',
          'User-Agent': 'RentHubber/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Errore reverse geocoding');
    }

    const item = await response.json();
    const addr = item.address || {};
    
    return {
      lat,
      lng,
      displayName: item.display_name,
      city: addr.city || addr.town || addr.village || addr.municipality,
      province: addr.county || addr.province,
      region: addr.state,
    };
  } catch (error) {
    console.error('Errore reverse geocoding:', error);
    return null;
  }
};

/**
 * Ottieni coordinate del centro città (per mappa approssimativa)
 * @param cityName - Nome città (es. "Milano")
 * @returns Coordinate del centro città
 */
export const getCityCenter = async (cityName: string): Promise<{ lat: number; lng: number } | null> => {
  const result = await geocodeAddress(cityName);
  if (result) {
    return { lat: result.lat, lng: result.lng };
  }
  return null;
};