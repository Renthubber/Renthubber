import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Users, TrendingUp, Search, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Coordinate città italiane
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "Acireale": { lat: 37.6128, lng: 15.1653 },
  "Agrigento": { lat: 37.3111, lng: 13.5766 },
  "Alessandria": { lat: 44.9125, lng: 8.6153 },
  "Ancona": { lat: 43.6158, lng: 13.5189 },
  "Andria": { lat: 41.2316, lng: 16.2971 },
  "Aosta": { lat: 45.7375, lng: 7.3208 },
  "Arezzo": { lat: 43.4633, lng: 11.8798 },
  "Asti": { lat: 44.9007, lng: 8.2064 },
  "Avellino": { lat: 40.9146, lng: 14.7906 },
  "Bari": { lat: 41.1171, lng: 16.8719 },
  "Barletta": { lat: 41.3186, lng: 16.2825 },
  "Benevento": { lat: 41.1298, lng: 14.7826 },
  "Bergamo": { lat: 45.6983, lng: 9.6773 },
  "Biella": { lat: 45.5628, lng: 8.0583 },
  "Bologna": { lat: 44.4949, lng: 11.3426 },
  "Bolzano": { lat: 46.4983, lng: 11.3548 },
  "Brescia": { lat: 45.5416, lng: 10.2118 },
  "Brindisi": { lat: 40.6327, lng: 17.9419 },
  "Busto Arsizio": { lat: 45.6120, lng: 8.8491 },
  "Cagliari": { lat: 39.2238, lng: 9.1217 },
  "Caltanissetta": { lat: 37.4901, lng: 14.0629 },
  "Campobasso": { lat: 41.5603, lng: 14.6625 },
  "Camporotondo Etneo": { lat: 37.5575, lng: 15.0625 },
  "Carrara": { lat: 44.0793, lng: 10.0982 },
  "Caserta": { lat: 41.0742, lng: 14.3331 },
  "Casoria": { lat: 40.9064, lng: 14.2903 },
  "Catania": { lat: 37.5079, lng: 15.0830 },
  "Catanzaro": { lat: 38.9101, lng: 16.5874 },
  "Cesena": { lat: 44.1396, lng: 12.2432 },
  "Chieti": { lat: 42.3510, lng: 14.1676 },
  "Cinisello Balsamo": { lat: 45.5583, lng: 9.2125 },
  "Como": { lat: 45.8081, lng: 9.0852 },
  "Cosenza": { lat: 39.3009, lng: 16.2534 },
  "Cremona": { lat: 45.1336, lng: 10.0231 },
  "Crotone": { lat: 39.0809, lng: 17.1268 },
  "Cuneo": { lat: 44.3845, lng: 7.5427 },
  "Enna": { lat: 37.5636, lng: 14.2750 },
  "Fano": { lat: 43.8396, lng: 13.0202 },
  "Ferrara": { lat: 44.8381, lng: 11.6198 },
  "Firenze": { lat: 43.7696, lng: 11.2558 },
  "Foggia": { lat: 41.4622, lng: 15.5446 },
  "Forlì": { lat: 44.2227, lng: 12.0407 },
  "Frosinone": { lat: 41.6400, lng: 13.3499 },
  "Genova": { lat: 44.4056, lng: 8.9463 },
  "Giugliano In Campania": { lat: 40.9258, lng: 14.1953 },
  "Grosseto": { lat: 42.7635, lng: 11.1124 },
  "Guidonia Montecelio": { lat: 42.0000, lng: 12.7231 },
  "Imperia": { lat: 43.8890, lng: 8.0396 },
  "Isernia": { lat: 41.5960, lng: 14.2303 },
  "L'Aquila": { lat: 42.3498, lng: 13.3995 },
  "La Spezia": { lat: 44.1025, lng: 9.8240 },
  "Latina": { lat: 41.4676, lng: 12.9037 },
  "Lecce": { lat: 40.3516, lng: 18.1750 },
  "Lecco": { lat: 45.8566, lng: 9.3977 },
  "Livorno": { lat: 43.5485, lng: 10.3106 },
  "Lodi": { lat: 45.3138, lng: 9.5015 },
  "Lucca": { lat: 43.8429, lng: 10.5027 },
  "Macerata": { lat: 43.2987, lng: 13.4538 },
  "Mantova": { lat: 45.1564, lng: 10.7914 },
  "Marsala": { lat: 37.7986, lng: 12.4340 },
  "Massa": { lat: 44.0369, lng: 10.1398 },
  "Matera": { lat: 40.6664, lng: 16.6044 },
  "Messina": { lat: 38.1938, lng: 15.5540 },
  "Milano": { lat: 45.4642, lng: 9.1900 },
  "Misterbianco": { lat: 37.5186, lng: 15.0098 },
  "Modena": { lat: 44.6471, lng: 10.9252 },
  "Modica": { lat: 36.8440, lng: 14.7740 },
  "Molfetta": { lat: 41.2010, lng: 16.5978 },
  "Monza": { lat: 45.5845, lng: 9.2744 },
  "Napoli": { lat: 40.8518, lng: 14.2681 },
  "Novara": { lat: 45.4468, lng: 8.6219 },
  "Nuoro": { lat: 40.3210, lng: 9.3318 },
  "Olbia": { lat: 40.9234, lng: 9.4970 },
  "Oristano": { lat: 39.9062, lng: 8.5886 },
  "Padova": { lat: 45.4064, lng: 11.8768 },
  "Palermo": { lat: 38.1157, lng: 13.3615 },
  "Parma": { lat: 44.8015, lng: 10.3279 },
  "Pavia": { lat: 45.1847, lng: 9.1582 },
  "Perugia": { lat: 43.1107, lng: 12.3908 },
  "Pesaro": { lat: 43.9098, lng: 12.9131 },
  "Pescara": { lat: 42.4618, lng: 14.2161 },
  "Piacenza": { lat: 45.0526, lng: 9.6930 },
  "Pisa": { lat: 43.7228, lng: 10.4017 },
  "Pistoia": { lat: 43.9302, lng: 10.9076 },
  "Pordenone": { lat: 45.9563, lng: 12.6603 },
  "Potenza": { lat: 40.6395, lng: 15.8056 },
  "Prato": { lat: 43.8777, lng: 11.1020 },
  "Ragusa": { lat: 36.9269, lng: 14.7255 },
  "Ravenna": { lat: 44.4184, lng: 12.2035 },
  "Reggio Calabria": { lat: 38.1113, lng: 15.6474 },
  "Reggio Emilia": { lat: 44.6989, lng: 10.6297 },
  "Rieti": { lat: 42.4025, lng: 12.8566 },
  "Rimini": { lat: 44.0678, lng: 12.5695 },
  "Roma": { lat: 41.9028, lng: 12.4964 },
  "Rovigo": { lat: 45.0701, lng: 11.7898 },
  "Salerno": { lat: 40.6824, lng: 14.7681 },
  "Sassari": { lat: 40.7259, lng: 8.5592 },
  "Savona": { lat: 44.3091, lng: 8.4772 },
  "Sesto San Giovanni": { lat: 45.5333, lng: 9.2333 },
  "Siena": { lat: 43.3188, lng: 11.3307 },
  "Siracusa": { lat: 37.0755, lng: 15.2866 },
  "Sondrio": { lat: 46.1699, lng: 9.8715 },
  "Taranto": { lat: 40.4644, lng: 17.2470 },
  "Teramo": { lat: 42.6594, lng: 13.7042 },
  "Terni": { lat: 42.5636, lng: 12.6427 },
  "Torino": { lat: 45.0703, lng: 7.6869 },
  "Torre Del Greco": { lat: 40.7862, lng: 14.3685 },
  "Trani": { lat: 41.2764, lng: 16.4172 },
  "Trapani": { lat: 38.0174, lng: 12.5140 },
  "Trento": { lat: 46.0748, lng: 11.1217 },
  "Treviso": { lat: 45.6669, lng: 12.2430 },
  "Trieste": { lat: 45.6495, lng: 13.7768 },
  "Udine": { lat: 46.0711, lng: 13.2346 },
  "Varese": { lat: 45.8206, lng: 8.8257 },
  "Venezia": { lat: 45.4408, lng: 12.3155 },
  "Verbania": { lat: 45.9217, lng: 8.5514 },
  "Vercelli": { lat: 45.3220, lng: 8.4186 },
  "Verona": { lat: 45.4384, lng: 10.9916 },
  "Vibo Valentia": { lat: 38.6726, lng: 16.1004 },
  "Vicenza": { lat: 45.5455, lng: 11.5354 },
  "Viterbo": { lat: 42.4173, lng: 12.1046 },
  "Vittoria": { lat: 36.9538, lng: 14.5322 },
};

interface CityData {
  city: string;
  count: number;
  lat: number;
  lng: number;
}

export const AdminUsersMap: React.FC = () => {
  const [cityData, setCityData] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [totalUsersWithCity, setTotalUsersWithCity] = useState(0);
  const [totalUsersWithoutCity, setTotalUsersWithoutCity] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('city')
        .not('city', 'is', null)
        .neq('city', '');

      if (error) throw error;

      const { count: totalCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const cityMap: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        const city = row.city?.trim();
        if (city) {
          const normalized = city.replace(/\b\w/g, (c: string) => c.toUpperCase());
          cityMap[normalized] = (cityMap[normalized] || 0) + 1;
        }
      });

      const usersWithCity = Object.values(cityMap).reduce((sum, c) => sum + c, 0);
      setTotalUsersWithCity(usersWithCity);
      setTotalUsersWithoutCity((totalCount || 0) - usersWithCity);

      const cities: CityData[] = Object.entries(cityMap).map(([city, count]) => {
        const coords = CITY_COORDS[city] || null;
        return { city, count, lat: coords?.lat || 0, lng: coords?.lng || 0 };
      });

      cities.sort((a, b) => b.count - a.count);
      setCityData(cities);
    } catch (err) {
      console.error('Errore caricamento dati mappa:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const maxUsers = useMemo(() => Math.max(...cityData.map(c => c.count), 1), [cityData]);

  const filteredCities = useMemo(() => {
    if (!searchTerm) return cityData;
    return cityData.filter(c => c.city.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [cityData, searchTerm]);

  const citiesWithCoords = useMemo(() => filteredCities.filter(c => c.lat !== 0), [filteredCities]);
  const citiesWithoutCoords = useMemo(() => filteredCities.filter(c => c.lat === 0), [filteredCities]);

  const getRadius = (count: number) => {
    const min = 8, max = 35;
    return min + (count / maxUsers) * (max - min);
  };

  const getColor = (count: number) => {
    const ratio = count / maxUsers;
    if (ratio > 0.6) return '#0D414B';
    if (ratio > 0.3) return '#0891b2';
    if (ratio > 0.1) return '#14b8a6';
    return '#3DD9D0';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <span className="ml-3 text-gray-500">Caricamento mappa utenti...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Città con utenti</p>
              <h3 className="text-3xl font-bold text-gray-900">{cityData.length}</h3>
            </div>
            <div className="p-3 rounded-xl bg-teal-500"><MapPin className="w-6 h-6 text-white" /></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Utenti geolocalizzati</p>
              <h3 className="text-3xl font-bold text-gray-900">{totalUsersWithCity}</h3>
            </div>
            <div className="p-3 rounded-xl bg-cyan-600"><Users className="w-6 h-6 text-white" /></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Senza città</p>
              <h3 className="text-3xl font-bold text-gray-900">{totalUsersWithoutCity}</h3>
              <p className="text-xs mt-1 text-gray-400">Iscritti prima del campo città</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-400"><Users className="w-6 h-6 text-white" /></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Top Città</p>
              <h3 className="text-2xl font-bold text-gray-900">{cityData[0]?.city || '—'}</h3>
              {cityData[0] && <p className="text-xs mt-1 font-semibold text-teal-600">{cityData[0].count} utenti</p>}
            </div>
            <div className="p-3 rounded-xl bg-emerald-500"><TrendingUp className="w-6 h-6 text-white" /></div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca città..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none text-sm"
          />
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" /> Aggiorna
        </button>
      </div>

      {/* Main: Map + List */}
      <div className="grid grid-cols-3 gap-6">
        {/* Leaflet Map */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-brand" /> Distribuzione Utenti
            </h3>
          </div>
          <div style={{ height: '560px' }}>
            <MapContainer
              center={[41.9, 12.5]}
              zoom={6}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {citiesWithCoords.map((city) => {
                const radius = getRadius(city.count);
                const color = getColor(city.count);
                const isHovered = hoveredCity === city.city;

                return (
                  <CircleMarker
                    key={city.city}
                    center={[city.lat, city.lng]}
                    radius={isHovered ? radius * 1.3 : radius}
                    pathOptions={{
                      fillColor: color,
                      fillOpacity: isHovered ? 0.9 : 0.7,
                      color: isHovered ? '#0D414B' : '#fff',
                      weight: isHovered ? 3 : 2,
                    }}
                    eventHandlers={{
                      mouseover: () => setHoveredCity(city.city),
                      mouseout: () => setHoveredCity(null),
                    }}
                  >
                    <LeafletTooltip direction="top" offset={[0, -radius]} opacity={0.95}>
                      <div className="text-center">
                        <div className="font-bold text-sm">{city.city}</div>
                        <div className="text-xs text-teal-700 font-semibold">
                          {city.count} {city.count === 1 ? 'utente' : 'utenti'}
                        </div>
                      </div>
                    </LeafletTooltip>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>

          {/* Legenda + Warning */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-5">
              <span className="text-xs font-semibold text-gray-400 uppercase">Densità:</span>
              {[
                { color: '#3DD9D0', label: 'Bassa' },
                { color: '#14b8a6', label: 'Media' },
                { color: '#0891b2', label: 'Alta' },
                { color: '#0D414B', label: 'Top' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
                  <span className="text-xs text-gray-500">{l.label}</span>
                </div>
              ))}
            </div>
            {citiesWithoutCoords.length > 0 && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-700">
                    {citiesWithoutCoords.length} città senza coordinate:
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    {citiesWithoutCoords.map(c => `${c.city} (${c.count})`).join(', ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Classifica laterale */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col" style={{ maxHeight: '680px' }}>
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-brand" /> Classifica Città
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {filteredCities.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                {searchTerm ? 'Nessuna città trovata' : 'Nessun dato disponibile'}
              </p>
            ) : (
              filteredCities.map((city, i) => {
                const barWidth = (city.count / maxUsers) * 100;
                const color = getColor(city.count);
                const isHovered = hoveredCity === city.city;

                return (
                  <div
                    key={city.city}
                    onMouseEnter={() => setHoveredCity(city.city)}
                    onMouseLeave={() => setHoveredCity(null)}
                    className={`p-3 rounded-xl transition-all cursor-pointer ${
                      isHovered ? 'bg-teal-50 border border-teal-200' : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-400 w-6 text-right">#{i + 1}</span>
                        <span className="text-sm font-semibold text-gray-900">{city.city}</span>
                        {city.lat === 0 && (
                          <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">?</span>
                        )}
                      </div>
                      <span className="text-sm font-bold" style={{ color }}>
                        {city.count}
                      </span>
                    </div>
                    <div className="ml-8 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Totale geolocalizzati</span>
              <span className="font-bold text-brand">{totalUsersWithCity}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};