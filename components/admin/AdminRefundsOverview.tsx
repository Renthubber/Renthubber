import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Wallet, RefreshCw, DollarSign, TrendingUp, 
  Calendar, Search, Filter, ExternalLink, CheckCircle, XCircle,
  Clock, AlertCircle, Download
} from 'lucide-react';
import { api } from '../../services/api';
import { supabase } from '../../services/supabaseClient';

interface RefundStats {
  totalRefunded: number;
  walletRefunded: number;
  cardRefunded: number;
  autoRefundsCount: number;
  manualRefundsCount: number;
  pendingManualCount: number;
}

interface AutoRefund {
  id: string;
  booking_id: string;
  booking_number: string;
  renter_id: string;
  renter_name: string;
  hubber_name: string;
  listing_title: string;
  cancelled_at: string;
  cancelled_by: 'renter' | 'hubber';
  refund_amount: number;
  refunded_wallet_cents: number;
  refunded_card_cents: number;
  stripe_refund_id: string | null;
  cancellation_reason: string | null;
}

interface ManualRefund {
  id: string;
  booking_id: string;
  renter_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'processed' | 'rejected';
  reason: string;
  requested_at: string;
  processed_at: string | null;
  renter?: any;
  hubber?: any;
}

interface AdminRefundsOverviewProps {
  currentUser?: any;
}

export const AdminRefundsOverview: React.FC<AdminRefundsOverviewProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto');
  const [loading, setLoading] = useState(true);
  
  // Dati
  const [autoRefunds, setAutoRefunds] = useState<AutoRefund[]>([]);
  const [manualRefunds, setManualRefunds] = useState<ManualRefund[]>([]);
  const [stats, setStats] = useState<RefundStats>({
    totalRefunded: 0,
    walletRefunded: 0,
    cardRefunded: 0,
    autoRefundsCount: 0,
    manualRefundsCount: 0,
    pendingManualCount: 0,
  });
  
  // Filtri
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [cancelledByFilter, setCancelledByFilter] = useState<'all' | 'renter' | 'hubber'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'processed' | 'rejected'>('all');

  // Carica dati
  useEffect(() => {
    loadRefundsData();
  }, []);

  const loadRefundsData = async () => {
    setLoading(true);
    try {
      // 1. Carica rimborsi automatici (bookings cancellati)
      const { data: cancelledBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          renter_id,
          hubber_id,
          listing_id,
          cancelled_at,
          cancelled_by,
          cancellation_reason,
          refund_amount,
          refunded_wallet_cents,
          refunded_card_cents,
          stripe_refund_id,
          listing:listing_id(title),
          renter:renter_id(id, first_name, last_name, public_name),
          hubber:hubber_id(id, first_name, last_name, public_name)
        `)
        .eq('status', 'cancelled')
        .not('refund_amount', 'is', null)
        .order('cancelled_at', { ascending: false });


      if (!bookingsError && cancelledBookings) {
        const formattedAutoRefunds: AutoRefund[] = cancelledBookings.map((b: any) => ({
          id: b.id,
          booking_id: b.id,
          booking_number: `#${b.id.substring(0, 8).toUpperCase()}`,
          renter_id: b.renter_id,
          renter_name: b.renter?.public_name || `${b.renter?.first_name || ''} ${b.renter?.last_name || ''}`.trim() || 'N/A',
          hubber_name: b.hubber?.public_name || `${b.hubber?.first_name || ''} ${b.hubber?.last_name || ''}`.trim() || 'N/A',
          listing_title: b.listing?.title || 'N/A',
          cancelled_at: b.cancelled_at,
          cancelled_by: b.cancelled_by,
          refund_amount: b.refund_amount || 0,
          refunded_wallet_cents: b.refunded_wallet_cents || 0,
          refunded_card_cents: b.refunded_card_cents || 0,
          stripe_refund_id: b.stripe_refund_id,
          cancellation_reason: b.cancellation_reason,
        }));
        setAutoRefunds(formattedAutoRefunds);
      }

      // 2. Carica rimborsi manuali (dalla tabella refunds se esiste)
      try {
        const manualRefundsData = await api.admin?.getAllRefunds?.();
        if (manualRefundsData) {
          setManualRefunds(manualRefundsData);
        }
      } catch (e) {
        console.log('Tabella refunds non disponibile o errore:', e);
      }

      // 3. Calcola statistiche
      const walletTotal = cancelledBookings?.reduce((sum: number, b: any) => 
        sum + (b.refunded_wallet_cents || 0), 0) || 0;
      const cardTotal = cancelledBookings?.reduce((sum: number, b: any) => 
        sum + (b.refunded_card_cents || 0), 0) || 0;
      const autoTotal = cancelledBookings?.reduce((sum: number, b: any) => 
        sum + (b.refund_amount || 0), 0) || 0;
      
      const manualTotal = manualRefunds.reduce((sum, r) => 
        r.status === 'processed' ? sum + r.amount : sum, 0);
      
      const pendingCount = manualRefunds.filter(r => r.status === 'pending').length;

      setStats({
        totalRefunded: autoTotal + manualTotal,
        walletRefunded: walletTotal / 100,
        cardRefunded: cardTotal / 100,
        autoRefundsCount: cancelledBookings?.length || 0,
        manualRefundsCount: manualRefunds.length,
        pendingManualCount: pendingCount,
      });

    } catch (error) {
      console.error('Errore caricamento rimborsi:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtra rimborsi automatici
  const filteredAutoRefunds = autoRefunds.filter(refund => {
    // Filtro ricerca
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (!refund.renter_name.toLowerCase().includes(search) &&
          !refund.listing_title.toLowerCase().includes(search) &&
          !refund.booking_number.toLowerCase().includes(search)) {
        return false;
      }
    }

    // Filtro data
    if (dateFrom && new Date(refund.cancelled_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(refund.cancelled_at) > new Date(dateTo + 'T23:59:59')) return false;

    // Filtro cancelled_by
    if (cancelledByFilter !== 'all' && refund.cancelled_by !== cancelledByFilter) return false;

    return true;
  });

  // Filtra rimborsi manuali
  const filteredManualRefunds = manualRefunds.filter(refund => {
    // Filtro ricerca
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const renterName = `${refund.renter?.first_name || ''} ${refund.renter?.last_name || ''}`.toLowerCase();
      if (!renterName.includes(search) && !refund.id.toLowerCase().includes(search)) {
        return false;
      }
    }

    // Filtro stato
    if (statusFilter !== 'all' && refund.status !== statusFilter) return false;

    // Filtro data
    if (dateFrom && new Date(refund.requested_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(refund.requested_at) > new Date(dateTo + 'T23:59:59')) return false;

    return true;
  });

  // Helper per formattare data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render statistiche
  const renderStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-500 font-medium">Totale Rimborsato</p>
          <DollarSign className="w-5 h-5 text-blue-500" />
        </div>
        <p className="text-2xl font-bold text-gray-900">€{stats.totalRefunded.toFixed(2)}</p>
        <p className="text-xs text-gray-400 mt-1">Auto + Manuale</p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-500 font-medium">Su Wallet</p>
          <Wallet className="w-5 h-5 text-green-500" />
        </div>
        <p className="text-2xl font-bold text-gray-900">€{stats.walletRefunded.toFixed(2)}</p>
        <p className="text-xs text-gray-400 mt-1">Immediato</p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-500 font-medium">Su Carta</p>
          <CreditCard className="w-5 h-5 text-purple-500" />
        </div>
        <p className="text-2xl font-bold text-gray-900">€{stats.cardRefunded.toFixed(2)}</p>
        <p className="text-xs text-gray-400 mt-1">Via Stripe</p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-500 font-medium">Rimborsi Auto</p>
          <RefreshCw className="w-5 h-5 text-blue-500" />
        </div>
        <p className="text-2xl font-bold text-gray-900">{stats.autoRefundsCount}</p>
        <p className="text-xs text-gray-400 mt-1">Da cancellazioni</p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-500 font-medium">Rimborsi Manuali</p>
          <Clock className="w-5 h-5 text-orange-500" />
        </div>
        <p className="text-2xl font-bold text-gray-900">{stats.manualRefundsCount}</p>
        <p className="text-xs text-gray-400 mt-1">
          {stats.pendingManualCount > 0 ? `${stats.pendingManualCount} in attesa` : 'Gestiti da admin'}
        </p>
      </div>
    </div>
  );

  // Render filtri
  const renderFilters = () => (
    <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ricerca */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cerca
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Renter, prenotazione..."
              className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Data Da */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Da
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Data A */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            A
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filtri specifici per tab */}
        {activeTab === 'auto' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cancellato da
            </label>
            <select
              value={cancelledByFilter}
              onChange={(e) => setCancelledByFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tutti</option>
              <option value="renter">Renter</option>
              <option value="hubber">Hubber</option>
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stato
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tutti</option>
              <option value="pending">In Attesa</option>
              <option value="approved">Approvato</option>
              <option value="processed">Processato</option>
              <option value="rejected">Rifiutato</option>
            </select>
          </div>
        )}
      </div>

      {/* Reset filtri */}
      {(searchTerm || dateFrom || dateTo || cancelledByFilter !== 'all' || statusFilter !== 'all') && (
        <button
          onClick={() => {
            setSearchTerm('');
            setDateFrom('');
            setDateTo('');
            setCancelledByFilter('all');
            setStatusFilter('all');
          }}
          className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Reset filtri
        </button>
      )}
    </div>
  );

  // Render tab rimborsi automatici
  const renderAutoRefundsTab = () => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prenotazione
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Renter
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Listing
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data Cancellazione
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cancellato da
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Wallet
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Carta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Totale
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stripe
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAutoRefunds.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-sm text-gray-500">
                  Nessun rimborso automatico trovato
                </td>
              </tr>
            ) : (
              filteredAutoRefunds.map((refund) => (
                <tr key={refund.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{refund.booking_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{refund.renter_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{refund.listing_title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{formatDate(refund.cancelled_at)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      refund.cancelled_by === 'renter' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {refund.cancelled_by === 'renter' ? 'Renter' : 'Hubber'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {refund.refunded_wallet_cents > 0 ? (
                      <div className="flex items-center text-sm">
                        <Wallet className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-gray-900">€{(refund.refunded_wallet_cents / 100).toFixed(2)}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {refund.refunded_card_cents > 0 ? (
                      <div className="flex items-center text-sm">
                        <CreditCard className="w-4 h-4 text-purple-500 mr-1" />
                        <span className="text-gray-900">€{(refund.refunded_card_cents / 100).toFixed(2)}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      €{refund.refund_amount.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {refund.stripe_refund_id ? (
                      <a
                        href={`https://dashboard.stripe.com/test/refunds/${refund.stripe_refund_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                      >
                        <span className="mr-1">Vedi</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render tab rimborsi manuali
  const renderManualRefundsTab = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 mb-2">Sezione rimborsi manuali</p>
        <p className="text-sm text-gray-400">
          Questa sezione gestisce i rimborsi manuali creati dall'admin
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Trovati {filteredManualRefunds.length} rimborsi manuali
        </p>
      </div>
      {/* TODO: Implementare la tabella dei rimborsi manuali */}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rimborsi</h2>
          <p className="text-sm text-gray-500 mt-1">
            Gestisci tutti i rimborsi automatici e manuali
          </p>
        </div>
        <button
          onClick={loadRefundsData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Aggiorna
        </button>
      </div>

      {/* Statistiche */}
      {renderStats()}

      {/* Tab */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('auto')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'auto'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            <span>Rimborsi Automatici ({stats.autoRefundsCount})</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'manual'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Rimborsi Manuali ({stats.manualRefundsCount})</span>
            {stats.pendingManualCount > 0 && (
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                {stats.pendingManualCount}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Filtri */}
      {renderFilters()}

      {/* Contenuto */}
      {activeTab === 'auto' ? renderAutoRefundsTab() : renderManualRefundsTab()}
    </div>
  );
};