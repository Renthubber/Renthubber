import React, { useState, useEffect } from 'react';
import { 
  Percent, Shield, ShieldOff, Clock, Euro, AlertTriangle, 
  Plus, X, History, CheckCircle, XCircle
} from 'lucide-react';
import { supabase } from "../../services/supabaseClient";

interface FeeOverride {
  id: string;
  user_id: string;
  fees_disabled: boolean;
  custom_renter_fee: number | null;
  custom_hubber_fee: number | null;
  valid_from: string;
  valid_until: string;
  duration_days: number;
  max_transaction_amount: number | null;
  current_transaction_amount: number;
  status: 'active' | 'expired' | 'limit_reached' | 'revoked';
  reason: string;
  notes: string;
  created_at: string;
}

interface FeeOverridePanelProps {
  userId: string;
  userName: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active: { label: 'Attivo', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  expired: { label: 'Scaduto', color: 'bg-gray-100 text-gray-600', icon: Clock },
  limit_reached: { label: 'Tetto raggiunto', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
  revoked: { label: 'Revocato', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const DURATION_OPTIONS = [
  { value: 7, label: '7 giorni' },
  { value: 14, label: '14 giorni' },
  { value: 30, label: '30 giorni' },
  { value: 60, label: '60 giorni' },
  { value: 90, label: '90 giorni' },
  { value: 180, label: '6 mesi' },
  { value: 365, label: '1 anno' },
];

export const FeeOverridePanel: React.FC<FeeOverridePanelProps> = ({ userId, userName }) => {
  const [activeOverride, setActiveOverride] = useState<FeeOverride | null>(null);
  const [history, setHistory] = useState<FeeOverride[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    feesDisabled: false,
    customRenterFee: '',
    customHubberFee: '',
    durationDays: 30,
    maxTransactionAmount: '',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: overrideData } = await supabase
        .rpc('get_active_fee_override', { p_user_id: userId });
      setActiveOverride(overrideData?.[0] || null);

      const { data: histData } = await supabase
        .from('user_fee_overrides')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setHistory(histData || []);
    } catch (err) {
      console.error('Errore caricamento fee override:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const adminId = (await supabase.auth.getUser()).data.user?.id;

      await supabase
        .from('user_fee_overrides')
        .update({ status: 'revoked', revoked_by: adminId, revoked_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('status', 'active');

      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + form.durationDays);

      const { error } = await supabase
        .from('user_fee_overrides')
        .insert({
          user_id: userId,
          fees_disabled: form.feesDisabled,
          custom_renter_fee: form.customRenterFee ? parseFloat(form.customRenterFee) : null,
          custom_hubber_fee: form.customHubberFee ? parseFloat(form.customHubberFee) : null,
          valid_from: new Date().toISOString(),
          valid_until: validUntil.toISOString(),
          duration_days: form.durationDays,
          max_transaction_amount: form.maxTransactionAmount ? parseFloat(form.maxTransactionAmount) : null,
          current_transaction_amount: 0,
          status: 'active',
          reason: form.reason,
          notes: form.notes || '',
          created_by: adminId,
        });

      if (error) throw error;

      setShowForm(false);
      setForm({
        feesDisabled: false,
        customRenterFee: '',
        customHubberFee: '',
        durationDays: 30,
        maxTransactionAmount: '',
        reason: '',
        notes: '',
      });
      await loadData();
      alert('✅ Override commissioni creato!');
    } catch (err) {
      console.error('Errore creazione override:', err);
      alert('❌ Errore nella creazione. Riprova.');
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async () => {
    if (!activeOverride) return;
    if (!confirm(`Revocare l'override commissioni per ${userName}?`)) return;
    try {
      const adminId = (await supabase.auth.getUser()).data.user?.id;
      const { error } = await supabase
        .from('user_fee_overrides')
        .update({ status: 'revoked', revoked_by: adminId, revoked_at: new Date().toISOString() })
        .eq('id', activeOverride.id);
      if (error) throw error;
      await loadData();
      alert('✅ Override revocato. Commissioni standard ripristinate.');
    } catch (err) {
      console.error('Errore revoca:', err);
      alert('❌ Errore nella revoca. Riprova.');
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const formatCurrency = (n: number) => `€${n.toFixed(2)}`;

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-400">
        <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2" />
        Caricamento...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-gray-800 flex items-center gap-2">
          <Percent className="w-5 h-5 text-purple-600" />
          Commissioni Personalizzate
        </h4>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 flex items-center gap-1"
          >
            <History className="w-3.5 h-3.5" />
            Storico
          </button>
          {!activeOverride && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuovo Override
            </button>
          )}
        </div>
      </div>

      {/* OVERRIDE ATTIVO */}
      {activeOverride ? (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <span className="font-bold text-purple-800">Override Attivo</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-800">
                ● Attivo
              </span>
            </div>
            <button
              onClick={handleRevoke}
              className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-1"
            >
              <ShieldOff className="w-3.5 h-3.5" />
              Revoca
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div className="bg-white/70 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Renter Fee</p>
              <p className="text-lg font-bold text-purple-700">
                {activeOverride.fees_disabled
                  ? '0%'
                  : activeOverride.custom_renter_fee !== null
                  ? `${activeOverride.custom_renter_fee}%`
                  : 'Standard'}
              </p>
            </div>
            <div className="bg-white/70 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Hubber Fee</p>
              <p className="text-lg font-bold text-blue-700">
                {activeOverride.fees_disabled
                  ? '0%'
                  : activeOverride.custom_hubber_fee !== null
                  ? `${activeOverride.custom_hubber_fee}%`
                  : 'Standard'}
              </p>
            </div>
            <div className="bg-white/70 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Scade il</p>
              <p className="text-sm font-bold text-gray-800">
                {formatDate(activeOverride.valid_until)}
              </p>
              <p className="text-xs text-gray-500">
                ({Math.max(0, Math.ceil((new Date(activeOverride.valid_until).getTime() - Date.now()) / 86400000))} gg)
              </p>
            </div>
            <div className="bg-white/70 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Tetto Transazioni</p>
              {activeOverride.max_transaction_amount ? (
                <>
                  <p className="text-sm font-bold text-gray-800">
                    {formatCurrency(activeOverride.current_transaction_amount)} /{' '}
                    {formatCurrency(activeOverride.max_transaction_amount)}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-purple-600 h-1.5 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          (activeOverride.current_transaction_amount / activeOverride.max_transaction_amount) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm font-bold text-gray-400">Illimitato</p>
              )}
            </div>
          </div>

          {activeOverride.reason && (
            <div className="text-xs text-gray-600 bg-white/50 rounded-lg p-2">
              <span className="font-medium">Motivo:</span> {activeOverride.reason}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-gray-500 text-sm">
          <ShieldOff className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          Nessun override attivo — Commissioni standard applicate
        </div>
      )}

      {/* FORM NUOVO OVERRIDE */}
      {showForm && (
        <div className="bg-white border-2 border-purple-300 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h5 className="font-bold text-gray-800">Nuovo Override Commissioni</h5>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Toggle disattiva */}
            <label className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={form.feesDisabled}
                onChange={(e) => setForm({ ...form, feesDisabled: e.target.checked })}
                className="w-5 h-5 rounded border-red-300 text-red-500 focus:ring-red-500 mr-3"
              />
              <div>
                <span className="font-bold text-red-700">🚫 Disattiva tutte le commissioni</span>
                <p className="text-xs text-red-600">Renter e Hubber non pagheranno nessuna commissione</p>
              </div>
            </label>

            {/* Fee personalizzate */}
            {!form.feesDisabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commissione Renter (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={form.customRenterFee}
                    onChange={(e) => setForm({ ...form, customRenterFee: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="Vuoto = standard"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commissione Hubber (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={form.customHubberFee}
                    onChange={(e) => setForm({ ...form, customHubberFee: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="Vuoto = standard"
                  />
                </div>
              </div>
            )}

            {/* Durata + Tetto */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Durata
                </label>
                <select
                  value={form.durationDays}
                  onChange={(e) => setForm({ ...form, durationDays: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  {DURATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Euro className="w-4 h-4 inline mr-1" />
                  Tetto Transazioni (€)
                </label>
                <input
                  type="number"
                  step="100"
                  min="0"
                  value={form.maxTransactionAmount}
                  onChange={(e) => setForm({ ...form, maxTransactionAmount: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Vuoto = illimitato"
                />
              </div>
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo *</label>
              <input
                type="text"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="es: Promozione lancio, Partner commerciale..."
                required
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note aggiuntive</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                rows={2}
                placeholder="Note interne opzionali..."
              />
            </div>

            {/* Riepilogo */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-sm font-bold text-purple-800 mb-1">📋 Riepilogo:</p>
              <p className="text-xs text-purple-700">
                {form.feesDisabled
                  ? '🚫 Commissioni DISATTIVATE (0%)'
                  : `Renter: ${form.customRenterFee || 'standard'}% — Hubber: ${form.customHubberFee || 'standard'}%`}
                {' • '}Durata: {DURATION_OPTIONS.find((o) => o.value === form.durationDays)?.label}
                {form.maxTransactionAmount && ` • Tetto: €${form.maxTransactionAmount}`}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                ⚠️ Al superamento del primo limite (tempo o tetto), commissioni standard ripristinate.
              </p>
            </div>

            {/* Azioni */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg font-medium"
              >
                Annulla
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !form.reason}
                className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-bold shadow-md hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Attiva Override
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STORICO */}
      {showHistory && history.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <h5 className="font-bold text-gray-700 text-sm flex items-center gap-2">
              <History className="w-4 h-4" />
              Storico Override ({history.length})
            </h5>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {history.map((item) => {
              const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.expired;
              const Icon = cfg.icon;
              return (
                <div
                  key={item.id}
                  className="p-3 border-b border-gray-100 last:border-0 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color} flex items-center gap-1`}
                      >
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(item.created_at)} → {formatDate(item.valid_until)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {item.fees_disabled
                        ? '🚫 Commissioni disattivate'
                        : `R: ${item.custom_renter_fee ?? 'std'}% — H: ${item.custom_hubber_fee ?? 'std'}%`}
                      {item.max_transaction_amount &&
                        ` • Tetto: ${formatCurrency(item.current_transaction_amount)}/${formatCurrency(
                          item.max_transaction_amount
                        )}`}
                    </p>
                    {item.reason && <p className="text-xs text-gray-400 mt-0.5">{item.reason}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showHistory && history.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-gray-400 text-sm">
          Nessuno storico disponibile
        </div>
      )}
    </div>
  );
};