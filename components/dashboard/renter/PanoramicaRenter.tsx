// PanoramicaRenter.tsx
// Sezione Panoramica per utenti in modalità RENTER
// Ottimizzata per mobile e desktop

import React from 'react';
import { User } from '../../../types';
import { DashboardTab } from '../../../views/Dashboard';
import { 
  Package, 
  MapPin, 
  Clock, 
  ArrowRight, 
  Gift 
} from 'lucide-react';

interface RecentlyViewedItem {
  id: string;
  title: string;
  image?: string;
  price: number;
  priceUnit: string;
}

interface PanoramicaRenterProps {
  // User data
  user: User;
  
  // Bookings
  renterBookings: any[];
  nextUpcomingBooking: any | null;
  loadingNextBooking: boolean;
  
  // Recently viewed
  recentlyViewed: RecentlyViewedItem[];
  
  // Callbacks
  onBecomeHubber?: () => void;
  onNavigateToWallet?: () => void;
  setActiveTab: (tab: DashboardTab) => void;
}

export const PanoramicaRenter: React.FC<PanoramicaRenterProps> = ({
  user,
  renterBookings,
  nextUpcomingBooking,
  loadingNextBooking,
  recentlyViewed,
  onBecomeHubber,
  onNavigateToWallet,
  setActiveTab,
}) => {
  
  return (
  <>

                {/* Active Rentals Highlight */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                      <Package className="w-5 h-5 mr-2 text-brand" /> Noleggi
                      Attivi & In Arrivo
                    </h3>
      
                    {/* Upcoming Rental Card - DATI REALI */}
                    {loadingNextBooking ? (
                      <div className="bg-gradient-to-br from-brand to-brand-light rounded-2xl p-6 text-white shadow-lg mb-6 flex items-center justify-center h-48">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      </div>
                    ) : nextUpcomingBooking ? (
                      <div className="bg-gradient-to-br from-brand to-brand-light rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10">
                          <Package className="w-64 h-64" />
                        </div>
      
                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                {nextUpcomingBooking.daysUntilStart === 0 
                                  ? 'Ritiro Oggi' 
                                  : nextUpcomingBooking.daysUntilStart === 1 
                                    ? 'Ritiro Domani' 
                                    : `Ritiro tra ${nextUpcomingBooking.daysUntilStart} giorni`}
                              </span>
                              <h2 className="text-2xl font-bold mt-3">
                                {nextUpcomingBooking.listingTitle}
                              </h2>
                              <p className="text-brand-light/80 text-sm">
                                Da {nextUpcomingBooking.hubberName}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-brand-light/80 uppercase">
                                Codice Ritiro
                              </p>
                              <p className="text-2xl font-mono font-bold tracking-widest">
                                {nextUpcomingBooking.pickupCode}
                              </p>
                            </div>
                          </div>
      
                          {/* Indirizzo - mostrato solo se confermato/accettato */}
                          {(nextUpcomingBooking.status === 'confirmed' || nextUpcomingBooking.status === 'accepted') && nextUpcomingBooking.pickupAddress ? (
                            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm flex justify-between items-center">
                              <div className="flex items-center">
                                <MapPin className="w-5 h-5 mr-3 text-brand-accent" />
                                <div>
                                  <p className="font-bold text-sm">
                                    {nextUpcomingBooking.pickupAddress}
                                    {nextUpcomingBooking.pickupCity && `, ${nextUpcomingBooking.pickupCity}`}
                                  </p>
                                  <p className="text-xs text-brand-light/80">
                                    {new Date(nextUpcomingBooking.startDate).toLocaleDateString('it-IT', { 
                                      weekday: 'long', 
                                      day: 'numeric', 
                                      month: 'long' 
                                    })}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  const address = encodeURIComponent(
                                    `${nextUpcomingBooking.pickupAddress}, ${nextUpcomingBooking.pickupCity}`
                                  );
                                  window.open(
                                    `https://www.google.com/maps/search/?api=1&query=${address}`,
                                    '_blank'
                                  );
                                }}
                                className="bg-white text-brand font-bold px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                              >
                                Indicazioni
                              </button>
                            </div>
                          ) : nextUpcomingBooking.status === 'pending' ? (
                            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                              <div className="flex items-center">
                                <Clock className="w-5 h-5 mr-3 text-yellow-300" />
                                <div>
                                  <p className="font-bold text-sm">In attesa di conferma</p>
                                  <p className="text-xs text-brand-light/80">
                                    L'indirizzo sarà visibile dopo la conferma dell'hubber
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                              <div className="flex items-center">
                                <MapPin className="w-5 h-5 mr-3 text-brand-accent" />
                                <div>
                                  <p className="font-bold text-sm">
                                    {nextUpcomingBooking.pickupCity || 'Indirizzo non disponibile'}
                                  </p>
                                  <p className="text-xs text-brand-light/80">
                                    {new Date(nextUpcomingBooking.startDate).toLocaleDateString('it-IT', { 
                                      weekday: 'long', 
                                      day: 'numeric', 
                                      month: 'long' 
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Nessuna prenotazione futura */
                      <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-6 shadow-sm mb-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 opacity-5 transform translate-x-10 -translate-y-10">
                          <Package className="w-64 h-64" />
                        </div>
                        <div className="relative z-10 text-center py-8">
                          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                          <h3 className="text-xl font-bold text-gray-700 mb-2">
                            Nessun noleggio in programma
                          </h3>
                          <p className="text-gray-500 text-sm mb-4">
                            Esplora gli annunci e prenota il tuo prossimo oggetto!
                          </p>
                          <button
                            onClick={() => window.location.href = '/'}
                            className="bg-brand text-white font-bold px-6 py-2 rounded-lg text-sm hover:bg-brand-dark transition-colors"
                          >
                            Esplora annunci
                          </button>
                        </div>
                      </div>
                    )}
      
                    {/* Other Rentals List - DATI REALI */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-gray-50 flex justify-between">
                        <span className="font-bold text-gray-700">
                          Storico Recente
                        </span>
                        <button 
                          onClick={() => setActiveTab('bookings')}
                          className="text-sm text-brand cursor-pointer hover:underline"
                        >
                          Vedi tutti
                        </button>
                      </div>
                      {renterBookings.length > 0 ? (
                        renterBookings
                          .filter((b) => {
                            // Mostra prenotazioni passate o cancellate
                            const endDate = new Date((b as any).end_date);
                            const isPast = endDate < new Date();
                            return isPast || b.status === 'cancelled' || b.status === 'completed';
                          })
                          .slice(0, 3)
                          .map((booking) => (
                            <div
                              key={booking.id}
                              className="p-4 flex items-center hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => setActiveTab('bookings')}
                            >
                              <div className="w-12 h-12 bg-gray-200 rounded-lg mr-4 overflow-hidden">
                                {booking.listingImage && (
                                  <img 
                                    src={booking.listingImage} 
                                    alt={booking.listingTitle}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-900 text-sm">
                                  {booking.listingTitle}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {new Date((booking as any).end_date).toLocaleDateString('it-IT', {
                                    day: 'numeric',
                                    month: 'short'
                                  })}
                                </p>
                              </div>
                              <span className={`text-xs font-bold px-2 py-1 rounded ${
                                booking.status === 'cancelled'
                                  ? 'bg-red-100 text-red-600'
                                  : booking.status === 'completed'
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-gray-100 text-gray-600'
                              }`}>
                                {booking.status === 'cancelled' ? 'Cancellata' : 
                                 booking.status === 'completed' ? 'Completata' : 'Terminato'}
                              </span>
                            </div>
                          ))
                      ) : (
                        <div className="p-8 text-center text-gray-400 text-sm">
                          Nessun noleggio recente
                        </div>
                      )}
                      {renterBookings.filter((b) => {
                        const endDate = new Date((b as any).end_date);
                        return endDate < new Date() || b.status === 'cancelled';
                      }).length === 0 && renterBookings.length > 0 && (
                        <div className="p-4 text-center text-gray-400 text-sm">
                          I tuoi noleggi appariranno qui una volta conclusi
                        </div>
                      )}
                    </div>
                  </div>
      
                  {/* Quick Actions & Stats */}
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <h3 className="font-bold text-gray-900 mb-4">
                        Spese questo mese
                      </h3>
                      {(() => {
                        // Calcola spese del mese corrente
                        const now = new Date();
                        const currentMonth = now.getMonth();
                        const currentYear = now.getFullYear();
                        
                        const thisMonthExpenses = renterBookings
                          .filter((b) => {
                            const startDate = new Date((b as any).start_date);
                            return startDate.getMonth() === currentMonth && 
                                   startDate.getFullYear() === currentYear &&
                                   b.status !== 'cancelled';
                          })
                          .reduce((sum, b) => sum + ((b as any).renterTotalPaid || b.totalPrice || 0), 0);
                        
                        return (
                          <>
                            <div className="flex items-end mb-2">
                              <span className="text-3xl font-bold text-brand-dark">
                                € {thisMonthExpenses.toFixed(2)}
                              </span>
                              <span className="text-sm text-gray-500 mb-1 ml-2">
                                / € {user.renterBalance.toFixed(2)} Credito
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className="bg-brand h-2 rounded-full transition-all"
                                style={{ width: `${Math.min((thisMonthExpenses / Math.max(thisMonthExpenses + user.renterBalance, 1)) * 100, 100)}%` }}
                              />
                            </div>
                          </>
                        );
                      })()}
                    </div>
      
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <h3 className="font-bold text-gray-900 mb-4">
                        Ultimi Visti
                      </h3>
                      <div className="space-y-4">
                        {recentlyViewed.length > 0 ? (
                          recentlyViewed.slice(0, 4).map((item) => (
                            <div 
                              key={item.id}
                              onClick={() => window.location.href = `/listing/${item.id}`}
                              className="flex items-center gap-3 cursor-pointer group"
                            >
                              <div className="w-16 h-12 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                    alt={item.title}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                    <Package className="w-6 h-6 text-gray-300" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm text-gray-900 group-hover:text-brand truncate">
                                  {item.title}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  €{item.price.toFixed(2)} / {item.priceUnit}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4">
                            <Package className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                            <p className="text-xs text-gray-400">
                              Nessun annuncio visualizzato
                            </p>
                            <button
                              onClick={() => window.location.href = '/'}
                              className="text-xs text-brand hover:underline mt-2"
                            >
                              Esplora annunci
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
      
               {/* Become Hubber Promo o Referral Badge */}
                <div className="space-y-6">
                  {/* ✅ Diventa Hubber - SOLO se NON sei già hubber */}
                  {!user?.roles?.includes('hubber') && (
                    <div className="bg-gray-900 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
                      <div className="relative z-10">
                        <h3 className="text-2xl font-bold mb-2">
                          Hai oggetti che non usi?
                        </h3>
                        <p className="text-gray-400 mb-6 max-w-md">
                          Diventa Hubber e inizia a guadagnare noleggiando le tue
                          attrezzature o i tuoi spazi inutilizzati. È facile e sicuro.
                        </p>
                        <button
                          onClick={onBecomeHubber}
                          className="bg-brand-accent text-brand-dark font-bold py-3 px-6 rounded-xl hover:bg-amber-400 transition-colors shadow-lg"
                        >
                          Inizia a guadagnare
                        </button>
                      </div>
                      <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                        <Package className="w-64 h-64 transform translate-x-10 translate-y-10" />
                      </div>
                    </div>
                  )}
      
                  {/* ✅ Invita un amico - SEMPRE visibile nella dashboard renter */}
                  <div 
                    onClick={() => onNavigateToWallet && onNavigateToWallet()}
                    className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between relative overflow-hidden cursor-pointer hover:shadow-xl transition-all"
                  >
                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold mb-2">
                        Invita un amico e guadagna
                      </h3>
                      <p className="text-green-100 mb-6 max-w-md">
                        Invita i tuoi amici su Renthubber e ricevi €5 di credito per ogni amico che completa la prima prenotazione.
                      </p>
                      <div className="inline-flex items-center gap-2 bg-white text-green-600 font-bold py-3 px-6 rounded-xl hover:bg-green-50 transition-colors shadow-lg">
                        Vai al Wallet
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                      <Gift className="w-64 h-64 transform translate-x-10 translate-y-10" />
                    </div>
                  </div>
                </div>
              </>
        );
        };