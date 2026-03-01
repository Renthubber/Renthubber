// ============================================================
// RENTHUBBER - Admin Store Detail
// Path: components/admin/AdminStoreDetail.tsx
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  Loader2, Package, Users, Euro, TrendingUp, BarChart3,
  CheckCircle, Clock, XCircle, Ban, Play, Pause,
  ChevronDown, ChevronUp, Mail, Phone, Star, Receipt,
  Shield, FileText, Box, ArrowDownToLine, ArrowUpFromLine
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

// ============================================================
// TYPES
// ============================================================
interface Props {
  storeId: string;
  storeStatus: string;
  onToggleStatus: () => void;
  onTerminate: () => void;
}

interface StoreDetail {
  id: string;
  business_name: string;
  email: string;
  phone: string;
  city: string;
  province: string;
  vat_number: string | null;
  pec: string | null;
  sdi_code: string | null;
  legal_representative: string | null;
  average_rating: number;
  total_reviews: number;
  is_early_adopter: boolean;
  completed_pickups: number;
  welcome_pack_limit: number;
  subscription_status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_current_period_end: string | null;
  activated_at: string | null;
  created_at: string;
}

interface HubberItem {
  hubber_id: string;
  hubber_name: string;
  hubber_email: string;
  total_items: number;
  active_items: number;
  last_operation: string | null;
}

interface InventoryStats {
  in_custody: number;
  rented_out: number;
  returned: number;
  grace_period: number;
  paid_custody: number;
  completed: number;
  total: number;
}

interface OperationStats {
  checkin_deposit: number;
  checkout_renter: number;
  checkin_return: number;
  checkout_hubber: number;
  total: number;
}

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  vat_amount: number;
  status: string;
  period_start: string | null;
  period_end: string | null;
  description: string | null;
  stripe_invoice_id: string | null;
  created_at: string;
}

// ============================================================
// HELPERS
// ============================================================
const formatDate = (d: string) => new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
const formatCents = (cents: number) => `€${(cents / 100).toFixed(2)}`;

const SUB_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  welcome_pack: { label: 'Welcome Pack', color: 'text-blue-700' },
  active: { label: 'Attivo', color: 'text-green-700' },
  inactive: { label: 'Inattivo', color: 'text-gray-500' },
  pending: { label: 'In attesa', color: 'text-amber-700' },
  past_due: { label: 'Pagamento scaduto', color: 'text-red-700' },
  cancelled: { label: 'Cancellato', color: 'text-red-700' },
};

const MiniKPI: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color = 'text-gray-900' }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
    <p className={`text-lg font-bold ${color}`}>{value}</p>
    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
  </div>
);

// ============================================================
// MAIN COMPONENT
// ============================================================
export const AdminStoreDetail: React.FC<Props> = ({ storeId, storeStatus, onToggleStatus, onTerminate }) => {
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<StoreDetail | null>(null);
  const [hubbers, setHubbers] = useState<HubberItem[]>([]);
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(null);
  const [operationStats, setOperationStats] = useState<OperationStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'hubbers' | 'inventory' | 'payments'>('overview');

  useEffect(() => {
    loadAll();
  }, [storeId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStoreDetail(),
        loadHubbers(),
        loadInventoryStats(),
        loadOperationStats(),
        loadTransactions(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadStoreDetail = async () => {
    const { data } = await supabase
      .from('stores')
      .select('id, business_name, email, phone, city, province, vat_number, pec, sdi_code, legal_representative, average_rating, total_reviews, is_early_adopter, completed_pickups, welcome_pack_limit, subscription_status, stripe_customer_id, stripe_subscription_id, subscription_current_period_end, activated_at, created_at')
      .eq('id', storeId)
      .single();
    if (data) setStore(data as StoreDetail);
  };

  const loadHubbers = async () => {
    const { data: inventory } = await supabase
      .from('store_inventory')
      .select('hubber_id, status, created_at')
      .eq('store_id', storeId);

    if (!inventory || inventory.length === 0) return;

    const hubberMap: Record<string, { total: number; active: number; last: string }> = {};
    for (const item of inventory) {
      if (!hubberMap[item.hubber_id]) {
        hubberMap[item.hubber_id] = { total: 0, active: 0, last: item.created_at };
      }
      hubberMap[item.hubber_id].total++;
      if (['in_custody', 'rented_out', 'grace_period', 'paid_custody'].includes(item.status)) {
        hubberMap[item.hubber_id].active++;
      }
      if (item.created_at > hubberMap[item.hubber_id].last) {
        hubberMap[item.hubber_id].last = item.created_at;
      }
    }

    const hubberIds = Object.keys(hubberMap);
    const { data: users } = await supabase
      .from('users')
      .select('id, first_name, last_name, public_name, email')
      .in('id', hubberIds);

    const result: HubberItem[] = hubberIds.map(id => {
      const user = users?.find(u => u.id === id);
      const name = user?.public_name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Utente';
      return {
        hubber_id: id,
        hubber_name: name,
        hubber_email: user?.email || '',
        total_items: hubberMap[id].total,
        active_items: hubberMap[id].active,
        last_operation: hubberMap[id].last,
      };
    });

    setHubbers(result);
  };

  const loadInventoryStats = async () => {
    const { data } = await supabase
      .from('store_inventory')
      .select('status')
      .eq('store_id', storeId);

    if (!data) return;

    const stats: InventoryStats = {
      in_custody: 0, rented_out: 0, returned: 0,
      grace_period: 0, paid_custody: 0, completed: 0, total: data.length,
    };

    for (const item of data) {
      if (item.status in stats) (stats as any)[item.status]++;
    }

    setInventoryStats(stats);
  };

  const loadOperationStats = async () => {
    const { data } = await supabase
      .from('store_operations')
      .select('operation_type')
      .eq('store_id', storeId);

    if (!data) return;

    const stats: OperationStats = {
      checkin_deposit: 0, checkout_renter: 0,
      checkin_return: 0, checkout_hubber: 0, total: data.length,
    };

    for (const op of data) {
      if (op.operation_type in stats) (stats as any)[op.operation_type]++;
    }

    setOperationStats(stats);
  };

  const loadTransactions = async () => {
    const { data } = await supabase
      .from('store_transactions')
      .select('id, transaction_type, amount, vat_amount, status, period_start, period_end, description, stripe_invoice_id, created_at')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    setTransactions(data || []);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!store) return null;

  const subStatus = SUB_STATUS_LABELS[store.subscription_status] || { label: store.subscription_status, color: 'text-gray-500' };
  const welcomePackProgress = Math.min((store.completed_pickups / store.welcome_pack_limit) * 100, 100);
  const totalPaid = transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="bg-gray-50 p-4">

      {/* TABS */}
      <div className="flex gap-1 bg-white rounded-lg border border-gray-200 p-1 mb-4">
        {[
          { id: 'overview', label: 'Panoramica', icon: <BarChart3 className="w-3.5 h-3.5" /> },
          { id: 'hubbers', label: `Hubber (${hubbers.length})`, icon: <Users className="w-3.5 h-3.5" /> },
          { id: 'inventory', label: 'Inventario', icon: <Package className="w-3.5 h-3.5" /> },
          { id: 'payments', label: 'Pagamenti', icon: <Euro className="w-3.5 h-3.5" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex-1 justify-center ${
              activeTab === tab.id ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* PANORAMICA */}
      {activeTab === 'overview' && (
        <div className="space-y-4">

          {/* KPI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MiniKPI label="Rating" value={store.average_rating > 0 ? `${store.average_rating.toFixed(1)} ⭐` : 'N/A'} />
            <MiniKPI label="Recensioni" value={store.total_reviews} />
            <MiniKPI label="Hubber attivi" value={hubbers.length} color="text-blue-700" />
            <MiniKPI label="Operazioni totali" value={operationStats?.total || 0} color="text-brand" />
          </div>

          {/* Welcome Pack / Abbonamento */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900">Abbonamento</h4>
              <span className={`text-xs font-medium ${subStatus.color}`}>{subStatus.label}</span>
            </div>

            {store.subscription_status === 'welcome_pack' && (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Welcome Pack: {store.completed_pickups}/{store.welcome_pack_limit} ritiri</span>
                  <span>{welcomePackProgress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 rounded-full h-2 transition-all" style={{ width: `${welcomePackProgress}%` }} />
                </div>
              </div>
            )}

            {store.subscription_current_period_end && (
              <p className="text-xs text-gray-500 mt-2">
                Prossimo rinnovo: <strong>{formatDate(store.subscription_current_period_end)}</strong>
              </p>
            )}

            {store.activated_at && (
              <p className="text-xs text-gray-500 mt-1">
                Attivato il: <strong>{formatDate(store.activated_at)}</strong>
              </p>
            )}

            {store.stripe_subscription_id && (
              <p className="text-xs text-gray-400 mt-1 font-mono">{store.stripe_subscription_id}</p>
            )}
          </div>

          {/* Info fiscali */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Dati fiscali</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {store.vat_number && <div><span className="text-gray-500">P.IVA: </span><strong>{store.vat_number}</strong></div>}
              {store.pec && <div><span className="text-gray-500">PEC: </span><strong>{store.pec}</strong></div>}
              {store.sdi_code && <div><span className="text-gray-500">SDI: </span><strong>{store.sdi_code}</strong></div>}
              {store.legal_representative && <div><span className="text-gray-500">Rappresentante: </span><strong>{store.legal_representative}</strong></div>}
            </div>
          </div>

          {/* Azioni */}
          {storeStatus !== 'terminated' && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={onToggleStatus}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  storeStatus === 'active' ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                {storeStatus === 'active' ? <><Pause className="w-3 h-3" /> Sospendi</> : <><Play className="w-3 h-3" /> Riattiva</>}
              </button>
              <button
                onClick={onTerminate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <Ban className="w-3 h-3" /> Termina
              </button>
            </div>
          )}
        </div>
      )}

      {/* HUBBER */}
      {activeTab === 'hubbers' && (
        <div className="space-y-3">
          {hubbers.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Nessun hubber ha ancora usato questo store</p>
            </div>
          ) : (
            hubbers.map(h => (
              <div key={h.hubber_id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{h.hubber_name}</p>
                    <p className="text-xs text-gray-500">{h.hubber_email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Totale oggetti: <strong>{h.total_items}</strong></p>
                    <p className="text-xs text-gray-500">Attivi: <strong className="text-blue-700">{h.active_items}</strong></p>
                    {h.last_operation && <p className="text-xs text-gray-400">Ultima op: {formatDate(h.last_operation)}</p>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* INVENTARIO */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {inventoryStats && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <MiniKPI label="Totale articoli" value={inventoryStats.total} />
                <MiniKPI label="In custodia" value={inventoryStats.in_custody} color="text-blue-700" />
                <MiniKPI label="Noleggiati" value={inventoryStats.rented_out} color="text-purple-700" />
                <MiniKPI label="Restituiti" value={inventoryStats.returned} color="text-amber-700" />
                <MiniKPI label="Periodo grazia" value={inventoryStats.grace_period} color="text-orange-700" />
                <MiniKPI label="Completati" value={inventoryStats.completed} color="text-green-700" />
              </div>

              {operationStats && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Operazioni</h4>
                  <div className="space-y-2">
                    {[
                      { label: '📦 Depositi Hubber', value: operationStats.checkin_deposit },
                      { label: '🤝 Ritiri Renter', value: operationStats.checkout_renter },
                      { label: '↩️ Riconsegne Renter', value: operationStats.checkin_return },
                      { label: '✅ Ritiri Hubber', value: operationStats.checkout_hubber },
                    ].map((op, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">{op.label}</span>
                        <span className="text-xs font-bold text-gray-900">{op.value}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">Totale operazioni</span>
                      <span className="text-xs font-bold text-gray-900">{operationStats.total}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* PAGAMENTI */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <MiniKPI label="Totale pagato" value={formatCents(totalPaid)} color="text-green-700" />
            <MiniKPI label="Transazioni" value={transactions.length} />
          </div>

          {transactions.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Nessun pagamento registrato</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
              {transactions.map(tx => (
                <div key={tx.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {tx.transaction_type === 'subscription' ? '🔄 Abbonamento' : tx.description || tx.transaction_type}
                    </p>
                    {tx.period_start && tx.period_end && (
                      <p className="text-xs text-gray-500">
                        {formatDate(tx.period_start)} → {formatDate(tx.period_end)}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">{formatDate(tx.created_at)}</p>
                    {tx.stripe_invoice_id && (
                      <p className="text-xs text-gray-300 font-mono">{tx.stripe_invoice_id}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatCents(tx.amount)}</p>
                    {tx.vat_amount > 0 && <p className="text-xs text-gray-400">IVA: {formatCents(tx.vat_amount)}</p>}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      tx.status === 'completed' ? 'bg-green-50 text-green-700' :
                      tx.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {tx.status === 'completed' ? 'Pagato' : tx.status === 'pending' ? 'In attesa' : tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
