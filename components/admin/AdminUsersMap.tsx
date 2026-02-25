import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Users, TrendingUp, Search, ChevronDown, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

// Coordinate città italiane principali (fallback per geocoding)
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "Roma": { lat: 41.9028, lng: 12.4964 },
  "Milano": { lat: 45.4642, lng: 9.1900 },
  "Napoli": { lat: 40.8518, lng: 14.2681 },
  "Torino": { lat: 45.0703, lng: 7.6869 },
  "Palermo": { lat: 38.1157, lng: 13.3615 },
  "Genova": { lat: 44.4056, lng: 8.9463 },
  "Bologna": { lat: 44.4949, lng: 11.3426 },
  "Firenze": { lat: 43.7696, lng: 11.2558 },
  "Bari": { lat: 41.1171, lng: 16.8719 },
  "Catania": { lat: 37.5079, lng: 15.0830 },
  "Venezia": { lat: 45.4408, lng: 12.3155 },
  "Verona": { lat: 45.4384, lng: 10.9916 },
  "Messina": { lat: 38.1938, lng: 15.5540 },
  "Padova": { lat: 45.4064, lng: 11.8768 },
  "Trieste": { lat: 45.6495, lng: 13.7768 },
  "Brescia": { lat: 45.5416, lng: 10.2118 },
  "Parma": { lat: 44.8015, lng: 10.3279 },
  "Taranto": { lat: 40.4644, lng: 17.2470 },
  "Prato": { lat: 43.8777, lng: 11.1020 },
  "Modena": { lat: 44.6471, lng: 10.9252 },
  "Reggio Calabria": { lat: 38.1113, lng: 15.6474 },
  "Reggio Emilia": { lat: 44.6989, lng: 10.6297 },
  "Perugia": { lat: 43.1107, lng: 12.3908 },
  "Livorno": { lat: 43.5485, lng: 10.3106 },
  "Ravenna": { lat: 44.4184, lng: 12.2035 },
  "Cagliari": { lat: 39.2238, lng: 9.1217 },
  "Foggia": { lat: 41.4622, lng: 15.5446 },
  "Rimini": { lat: 44.0678, lng: 12.5695 },
  "Salerno": { lat: 40.6824, lng: 14.7681 },
  "Ferrara": { lat: 44.8381, lng: 11.6198 },
  "Sassari": { lat: 40.7259, lng: 8.5592 },
  "Latina": { lat: 41.4676, lng: 12.9037 },
  "Monza": { lat: 45.5845, lng: 9.2744 },
  "Siracusa": { lat: 37.0755, lng: 15.2866 },
  "Bergamo": { lat: 45.6983, lng: 9.6773 },
  "Pescara": { lat: 42.4618, lng: 14.2161 },
  "Trento": { lat: 46.0748, lng: 11.1217 },
  "Lecce": { lat: 40.3516, lng: 18.1750 },
  "Vicenza": { lat: 45.5455, lng: 11.5354 },
  "Terni": { lat: 42.5636, lng: 12.6427 },
  "Bolzano": { lat: 46.4983, lng: 11.3548 },
  "Novara": { lat: 45.4468, lng: 8.6219 },
  "Piacenza": { lat: 45.0526, lng: 9.6930 },
  "Ancona": { lat: 43.6158, lng: 13.5189 },
  "Catanzaro": { lat: 38.9101, lng: 16.5874 },
  "Cosenza": { lat: 39.3009, lng: 16.2534 },
  "Como": { lat: 45.8081, lng: 9.0852 },
  "Potenza": { lat: 40.6395, lng: 15.8056 },
  "Campobasso": { lat: 41.5603, lng: 14.6625 },
  "Aosta": { lat: 45.7375, lng: 7.3208 },
  "L'Aquila": { lat: 42.3498, lng: 13.3995 },
  "Vittoria": { lat: 36.9538, lng: 14.5322 },
  "Misterbianco": { lat: 37.5186, lng: 15.0098 },
  "Camporotondo Etneo": { lat: 37.5575, lng: 15.0625 },
};

interface CityData {
  city: string;
  count: number;
  lat: number;
  lng: number;
}

// Proiezione Mercator semplificata per Italia
function geoToSvg(lat: number, lng: number, width: number, height: number) {
  const minLat = 35.5, maxLat = 47.5;
  const minLng = 6.3, maxLng = 18.8;
  const pad = 30;
  const x = pad + ((lng - minLng) / (maxLng - minLng)) * (width - pad * 2);
  const y = pad + ((maxLat - lat) / (maxLat - minLat)) * (height - pad * 2);
  return { x, y };
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
      // Query: conta utenti per città
      const { data, error } = await supabase
        .from('users')
        .select('city')
        .not('city', 'is', null)
        .neq('city', '');

      if (error) throw error;

      // Conta utenti senza città
      const { count: totalCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Raggruppa per città
      const cityMap: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        const city = row.city?.trim();
        if (city) {
          // Normalizza: prima lettera maiuscola
          const normalized = city.replace(/\b\w/g, (c: string) => c.toUpperCase());
          cityMap[normalized] = (cityMap[normalized] || 0) + 1;
        }
      });

      const usersWithCity = Object.values(cityMap).reduce((sum, c) => sum + c, 0);
      setTotalUsersWithCity(usersWithCity);
      setTotalUsersWithoutCity((totalCount || 0) - usersWithCity);

      // Converte in array con coordinate
      const cities: CityData[] = Object.entries(cityMap).map(([city, count]) => {
        const coords = CITY_COORDS[city] || null;
        return {
          city,
          count,
          lat: coords?.lat || 0,
          lng: coords?.lng || 0,
        };
      });

      // Ordina per numero utenti
      cities.sort((a, b) => b.count - a.count);
      setCityData(cities);
    } catch (err) {
      console.error('Errore caricamento dati mappa:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const maxUsers = useMemo(() => Math.max(...cityData.map(c => c.count), 1), [cityData]);

  const filteredCities = useMemo(() => {
    if (!searchTerm) return cityData;
    return cityData.filter(c => c.city.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [cityData, searchTerm]);

  const citiesWithCoords = useMemo(() => filteredCities.filter(c => c.lat !== 0), [filteredCities]);
  const citiesWithoutCoords = useMemo(() => filteredCities.filter(c => c.lat === 0), [filteredCities]);

  const getMarkerSize = (count: number) => {
    const minR = 6, maxR = 30;
    return minR + (count / maxUsers) * (maxR - minR);
  };

  const getColor = (count: number) => {
    const ratio = count / maxUsers;
    if (ratio > 0.6) return '#3DD9D0'; // turchese brand
    if (ratio > 0.3) return '#0891b2'; // cyan
    if (ratio > 0.1) return '#14b8a6'; // teal
    return '#10b981'; // emerald
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
            <div className="p-3 rounded-xl bg-teal-500">
              <MapPin className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Utenti con città</p>
              <h3 className="text-3xl font-bold text-gray-900">{totalUsersWithCity}</h3>
            </div>
            <div className="p-3 rounded-xl bg-cyan-600">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Senza città</p>
              <h3 className="text-3xl font-bold text-gray-900">{totalUsersWithoutCity}</h3>
              <p className="text-xs mt-1 text-gray-400">Iscritti prima del campo città</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-400">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Top Città</p>
              <h3 className="text-2xl font-bold text-gray-900">{cityData[0]?.city || '—'}</h3>
              {cityData[0] && (
                <p className="text-xs mt-1 font-semibold text-teal-600">{cityData[0].count} utenti</p>
              )}
            </div>
            <div className="p-3 rounded-xl bg-emerald-500">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
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
        {/* SVG Map */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-brand" /> Distribuzione Utenti
          </h3>

          <svg viewBox="0 0 500 620" className="w-full" style={{ maxHeight: '60vh' }}>
            {/* Italia outline semplificata */}
            <path
              d="M 245,35 L 260,32 275,38 285,45 290,40 305,42 318,50 330,48 345,52 
                355,58 362,65 368,72 358,78 348,75 335,80 325,85 315,82 308,88 
                300,95 295,102 288,108 282,115 278,122 285,128 292,135 298,142 
                305,148 310,155 315,165 320,175 328,182 335,190 338,200 335,210 
                330,218 325,225 320,235 315,245 310,252 305,260 300,268 295,275 
                290,285 285,295 280,305 275,315 270,325 265,335 262,345 258,355 
                255,365 252,375 248,385 245,395 250,405 255,415 260,425 265,432 
                270,438 278,445 285,452 290,460 288,470 282,478 275,485 268,492 
                262,500 258,508 255,515 260,520 268,525 275,530 270,538 262,545 
                255,550 248,555 242,548 235,540 230,532 225,525 220,518 215,510 
                218,500 222,492 225,485 220,478 215,470 210,462 205,455 200,448 
                195,440 190,432 185,425 180,418 175,410 172,402 175,395 180,388 
                185,380 188,372 185,365 180,358 175,350 170,342 168,335 172,328 
                178,320 182,312 185,305 182,298 178,290 175,282 178,275 182,268 
                188,260 192,252 195,245 198,238 195,230 190,222 185,215 182,208 
                185,200 190,192 195,185 200,178 205,170 210,162 215,155 218,145 
                222,138 225,130 228,122 230,115 225,108 220,100 218,92 222,85 
                228,78 232,70 235,62 238,55 240,48 242,40 245,35 Z"
              fill="#f0fdfa"
              stroke="#99f6e4"
              strokeWidth="1.5"
            />
            {/* Sardegna */}
            <path
              d="M 115,330 L 125,325 135,330 140,340 145,350 148,362 145,375 
                142,385 140,398 138,408 132,415 125,410 118,402 112,395 108,385 
                105,375 102,365 100,355 102,345 108,338 115,330 Z"
              fill="#f0fdfa"
              stroke="#99f6e4"
              strokeWidth="1.5"
            />
            {/* Sicilia */}
            <path
              d="M 225,520 L 235,515 248,512 260,515 272,518 285,520 295,525 
                305,530 310,538 305,545 295,550 282,552 270,548 258,545 245,542 
                235,535 228,528 225,520 Z"
              fill="#f0fdfa"
              stroke="#99f6e4"
              strokeWidth="1.5"
            />

            {/* Markers */}
            {citiesWithCoords.map((city) => {
              const pos = geoToSvg(city.lat, city.lng, 500, 620);
              const r = getMarkerSize(city.count);
              const color = getColor(city.count);
              const isHovered = hoveredCity === city.city;

              return (
                <g
                  key={city.city}
                  onMouseEnter={() => setHoveredCity(city.city)}
                  onMouseLeave={() => setHoveredCity(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Glow */}
                  <circle
                    cx={pos.x} cy={pos.y} r={r * 1.8}
                    fill={color}
                    opacity={isHovered ? 0.25 : 0.12}
                    style={{ transition: 'all 0.2s' }}
                  />
                  {/* Pulse */}
                  {isHovered && (
                    <circle cx={pos.x} cy={pos.y} r={r * 2.5} fill="none" stroke={color} strokeWidth="1" opacity="0.4">
                      <animate attributeName="r" from={`${r * 1.5}`} to={`${r * 3}`} dur="1.2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.5" to="0" dur="1.2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {/* Cerchio principale */}
                  <circle
                    cx={pos.x} cy={pos.y}
                    r={isHovered ? r * 1.15 : r}
                    fill={color}
                    fillOpacity={isHovered ? 0.95 : 0.8}
                    stroke={isHovered ? '#0D414B' : '#fff'}
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    style={{ transition: 'all 0.2s' }}
                  />
                  {/* Numero dentro cerchi grandi */}
                  {r > 14 && (
                    <text
                      x={pos.x} y={pos.y + 1}
                      textAnchor="middle" dominantBaseline="middle"
                      fill="#fff" fontSize={r > 20 ? 11 : 9} fontWeight="700"
                      fontFamily="system-ui, sans-serif"
                      style={{ pointerEvents: 'none' }}
                    >
                      {city.count}
                    </text>
                  )}
                  {/* Tooltip */}
                  {isHovered && (
                    <g>
                      <rect
                        x={pos.x - 65} y={pos.y - r - 48}
                        width={130} height={40}
                        rx={8}
                        fill="#0D414B"
                        fillOpacity="0.95"
                        stroke="#3DD9D0"
                        strokeWidth="1"
                        strokeOpacity="0.4"
                      />
                      <text
                        x={pos.x} y={pos.y - r - 34}
                        textAnchor="middle"
                        fill="#fff" fontSize="12" fontWeight="700"
                        fontFamily="system-ui, sans-serif"
                      >
                        {city.city}
                      </text>
                      <text
                        x={pos.x} y={pos.y - r - 18}
                        textAnchor="middle"
                        fill="#3DD9D0" fontSize="10" fontWeight="600"
                        fontFamily="system-ui, sans-serif"
                      >
                        {city.count} {city.count === 1 ? 'utente' : 'utenti'}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Legenda */}
          <div className="flex items-center gap-5 mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-400 uppercase">Densità:</span>
            {[
              { color: '#10b981', label: 'Bassa' },
              { color: '#14b8a6', label: 'Media' },
              { color: '#0891b2', label: 'Alta' },
              { color: '#3DD9D0', label: 'Top' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
                <span className="text-xs text-gray-500">{l.label}</span>
              </div>
            ))}
          </div>

          {/* Città senza coordinate */}
          {citiesWithoutCoords.length > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-700 mb-1">
                ⚠️ {citiesWithoutCoords.length} città senza coordinate (non visualizzate sulla mappa):
              </p>
              <p className="text-xs text-amber-600">
                {citiesWithoutCoords.map(c => `${c.city} (${c.count})`).join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Classifica laterale */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col" style={{ maxHeight: '70vh' }}>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-brand" /> Classifica Città
          </h3>

          <div className="flex-1 overflow-y-auto space-y-1.5">
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

          {/* Totale */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Totale utenti geolocalizzati</span>
              <span className="font-bold text-brand">{totalUsersWithCity}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};