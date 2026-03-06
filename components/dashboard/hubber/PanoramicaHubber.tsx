import React from 'react';
import { DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HubberStats {
  monthlyEarnings: number;
  activeBookings: number;
  completedBookings: number;
  pendingBookings: number;
  earningsHistory: Array<{ name: string; value: number }>;
  isLoading: boolean;
}

interface PanoramicaHubberProps {
  hubberStats: HubberStats;
  realHubberBalance: number;
  hubberBookings: any[];
  onRequestAction: (id: string, action: 'accepted' | 'rejected') => void;
  onNavigateToBookings: () => void;
  onViewRenterProfile?: (renter: { id: string; name: string; avatar: string }) => void;
}

export const PanoramicaHubber: React.FC<PanoramicaHubberProps> = ({
  hubberStats,
  realHubberBalance,
  hubberBookings,
  onRequestAction,
  onNavigateToBookings,
  onViewRenterProfile,
}) => {

     // Dati per il grafico (usa storico reale o fallback)
        const chartData = hubberStats.earningsHistory.length > 0 
          ? hubberStats.earningsHistory 
          : [{ name: 'Nessun dato', value: 0 }];
    
        // Mese corrente
        const currentMonthName = new Date().toLocaleDateString('it-IT', { month: 'long' });
    
        // Calcola variazione percentuale rispetto al mese precedente
        let percentChange = 0;
        if (hubberStats.earningsHistory.length >= 2) {
          const current = hubberStats.earningsHistory[hubberStats.earningsHistory.length - 1]?.value || 0;
          const previous = hubberStats.earningsHistory[hubberStats.earningsHistory.length - 2]?.value || 0;
          if (previous > 0) {
            percentChange = Math.round(((current - previous) / previous) * 100);
          }
        }
    
        // Formatta tempo di risposta
        const formatResponseTime = (minutes: number) => {
          if (minutes < 60) return `${minutes} min`;
          const hours = Math.round(minutes / 60 * 10) / 10;
          return `${hours} ore`;
        };
    
       return (
        <div className="space-y-8 animate-in fade-in duration-300">
          <style dangerouslySetInnerHTML={{__html: `
            * {
              scrollbar-width: none !important;
            }
            
            *::-webkit-scrollbar {
              width: 0px !important;
              height: 0px !important;
              display: none !important;
            }
            
            *::-webkit-scrollbar-track {
              display: none !important;
            }
            
            *::-webkit-scrollbar-thumb {
              display: none !important;
            }
            
            .overflow-y-auto,
            .overflow-x-auto,
            .overflow-auto {
              -ms-overflow-style: none !important;
              scrollbar-width: none !important;
            }
          `}} />
    
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Guadagni del mese */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-100 p-2 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                {percentChange !== 0 && (
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    percentChange > 0 
                      ? 'text-green-600 bg-green-50' 
                      : 'text-red-600 bg-red-50'
                  }`}>
                    {percentChange > 0 ? '+' : ''}{percentChange}%
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 capitalize">Guadagni {currentMonthName}</p>
              <h3 className="text-2xl font-bold text-gray-900">
                €{hubberStats.monthlyEarnings.toFixed(2)}
              </h3>
            </div>
    
            {/* Prenotazioni Attive */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                {hubberStats.pendingBookings > 0 && (
                  <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                    {hubberStats.pendingBookings} in attesa
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">Prenotazioni Attive</p>
              <h3 className="text-2xl font-bold text-gray-900">{hubberStats.activeBookings}</h3>
            </div>
    
            {/* Prenotazioni Completate */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500">Prenotazioni Completate</p>
              <h3 className="text-2xl font-bold text-gray-900">{hubberStats.completedBookings}</h3>
            </div>
    
            {/* Saldo Hubber */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500">Saldo Disponibile</p>
              <h3 className="text-2xl font-bold text-gray-900">€{realHubberBalance.toFixed(2)}</h3>
            </div>
          </div>
    
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Earnings Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-6">Andamento Guadagni</h3>
              <div className="h-72" style={{ minHeight: '288px' }}>
                {hubberStats.isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full"></div>
                  </div>
                ) : chartData.length > 0 && chartData.some(d => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0D414B" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#0D414B" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `€${v}`} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        }}
                        formatter={(value: number) => [`€${value.toFixed(2)}`, 'Guadagni']}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#0D414B"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <TrendingUp className="w-12 h-12 mb-3 opacity-30" />
                    <p className="text-sm">Nessun dato disponibile</p>
                    <p className="text-xs mt-1">I guadagni appariranno qui quando avrai prenotazioni</p>
                  </div>
                )}
              </div>
            </div>
    
            {/* Booking Requests */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900">
                  Richieste ({hubberStats.pendingBookings})
                </h3>
                <button 
                  onClick={onNavigateToBookings}
                  className="text-sm text-brand font-medium hover:underline"
                >
                  Vedi tutte
                </button>
              </div>
    
              <div className="flex-1 overflow-y-auto space-y-4 max-h-80">
                {hubberBookings.filter(r => r.status === 'pending').slice(0, 5).map((req) => (
                  <div
                    key={req.id}
                    className="border border-gray-200 rounded-xl p-4 transition-all hover:border-brand/30"
                  >
                    <div className="flex gap-3 mb-3">
                      <img
                        src={req.listingImage}
                        alt="listing"
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm line-clamp-1">
                          {req.listingTitle}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {req.dates}
                        </p>
                      </div>
                    </div>
    
                    <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg mb-3">
                      <div 
                        className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onViewRenterProfile && (req as any).renterId) {
                            onViewRenterProfile({
                              id: (req as any).renterId,
                              name: req.renterName,
                              avatar: req.renterAvatar,
                            });
                          }
                        }}
                      >
                        <img
                          src={req.renterAvatar}
                          alt="user"
                          className="w-6 h-6 rounded-full mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700 hover:text-brand hover:underline">
                          {req.renterName}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        €{req.totalPrice.toFixed(2)}
                      </span>
                    </div>
    
                    <div className="flex gap-2">
                      <button
                        onClick={() => onRequestAction(req.id, 'rejected')}
                        className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-bold hover:bg-gray-50"
                      >
                        Rifiuta
                      </button>
                      <button
                        onClick={() => onRequestAction(req.id, 'accepted')}
                        className="flex-1 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-dark"
                      >
                        Accetta
                      </button>
                    </div>
                  </div>
                ))}
                
                {hubberBookings.filter(r => r.status === 'pending').length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Nessuna richiesta in attesa</p>
                  </div>
                  )}
              </div>
          </div>
        </div>
      </div>
    );
};
  