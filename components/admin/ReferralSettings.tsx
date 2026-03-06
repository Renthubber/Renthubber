import React, { useState, useEffect } from "react";
import { 
  Gift, 
  Users, 
  Percent, 
  Euro, 
  Save, 
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  CheckCircle,
  UserX,
  Clock,
  TrendingUp
} from "lucide-react";
import { referralApi, ReferralSettings as ReferralSettingsType, ReferralTracking } from "../../services/referralApi";

export const ReferralSettings: React.FC = () => {
  // Settings state
  const [settings, setSettings] = useState<ReferralSettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state
  const [inviterBonus, setInviterBonus] = useState("5.00");
  const [inviteeBonus, setInviteeBonus] = useState("5.00");
  const [maxUsagePercent, setMaxUsagePercent] = useState("30");
  const [maxInvites, setMaxInvites] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Referrals list
  const [referrals, setReferrals] = useState<ReferralTracking[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<"settings" | "tracking">("settings");

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    loadReferrals();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const data = await referralApi.getSettings();
    if (data) {
      setSettings(data);
      setInviterBonus((data.inviterBonusCents / 100).toFixed(2));
      setInviteeBonus((data.inviteeBonusCents / 100).toFixed(2));
      setMaxUsagePercent(data.maxCreditUsagePercent.toString());
      setMaxInvites(data.maxInvitesPerUser?.toString() || "");
      setIsActive(data.isActive);
    }
    setLoading(false);
  };

  const loadReferrals = async () => {
    setLoadingReferrals(true);
    const data = await referralApi.getAllReferrals();
    setReferrals(data);
    setLoadingReferrals(false);
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setSaveSuccess(false);

    const success = await referralApi.updateSettings({
      id: settings.id,
      inviterBonusCents: Math.round(parseFloat(inviterBonus) * 100),
      inviteeBonusCents: Math.round(parseFloat(inviteeBonus) * 100),
      maxCreditUsagePercent: parseInt(maxUsagePercent),
      maxInvitesPerUser: maxInvites ? parseInt(maxInvites) : null,
      isActive,
    });

    setSaving(false);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleMarkFraud = async (referralId: string) => {
    const notes = prompt("Motivo della segnalazione frode:");
    if (notes) {
      await referralApi.markAsFraud(referralId, notes);
      loadReferrals();
    }
  };

  const handleCancelReferral = async (referralId: string) => {
    if (confirm("Sei sicuro di voler annullare questo referral?")) {
      await referralApi.cancelReferral(referralId);
      loadReferrals();
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      registered: { color: "bg-blue-100 text-blue-800", label: "Registrato" },
      booking_pending: { color: "bg-yellow-100 text-yellow-800", label: "In attesa" },
      completed: { color: "bg-green-100 text-green-800", label: "Completato" },
      bonus_paid: { color: "bg-emerald-100 text-emerald-800", label: "Bonus Pagato" },
      cancelled: { color: "bg-gray-100 text-gray-800", label: "Annullato" },
      fraud_suspected: { color: "bg-red-100 text-red-800", label: "Sospetto Frode" },
    };
    const badge = badges[status] || { color: "bg-gray-100 text-gray-800", label: status };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  // Stats
  const stats = {
    total: referrals.length,
    registered: referrals.filter(r => r.status === "registered").length,
    completed: referrals.filter(r => ["completed", "bonus_paid"].includes(r.status)).length,
    bonusPaid: referrals.filter(r => r.status === "bonus_paid").length,
    totalBonusPaid: referrals
      .filter(r => r.status === "bonus_paid")
      .reduce((sum, r) => sum + (r.inviterBonusCents || 0) + (r.inviteeBonusCents || 0), 0) / 100,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-brand" />
        <span className="ml-2">Caricamento impostazioni...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand/10 rounded-lg">
            <Gift className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Programma Invita un Amico</h2>
            <p className="text-sm text-gray-500">Gestisci le regole e monitora i referral</p>
          </div>
        </div>
        
        {/* Status Toggle */}
        <button
          onClick={() => setIsActive(!isActive)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isActive 
              ? "bg-green-100 text-green-800 hover:bg-green-200" 
              : "bg-red-100 text-red-800 hover:bg-red-200"
          }`}
        >
          {isActive ? (
            <>
              <ToggleRight className="w-5 h-5" />
              Programma Attivo
            </>
          ) : (
            <>
              <ToggleLeft className="w-5 h-5" />
              Programma Disattivo
            </>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Totale Inviti</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.registered}</p>
              <p className="text-sm text-gray-500">In Attesa</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-sm text-gray-500">Completati</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">€{stats.totalBonusPaid.toFixed(2)}</p>
              <p className="text-sm text-gray-500">Bonus Erogati</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "settings"
              ? "border-brand text-brand"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          ⚙️ Impostazioni
        </button>
        <button
          onClick={() => setActiveTab("tracking")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "tracking"
              ? "border-brand text-brand"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          📊 Tracciamento ({referrals.length})
        </button>
      </div>

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bonus Inviter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Euro className="w-4 h-4 inline mr-1" />
                Bonus per chi invita
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  value={inviterBonus}
                  onChange={(e) => setInviterBonus(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Accreditato quando l'amico completa la prima prenotazione</p>
            </div>

            {/* Bonus Invitee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Euro className="w-4 h-4 inline mr-1" />
                Bonus per chi viene invitato
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  value={inviteeBonus}
                  onChange={(e) => setInviteeBonus(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Accreditato al nuovo utente alla prima prenotazione</p>
            </div>

            {/* Max Usage Percent */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Percent className="w-4 h-4 inline mr-1" />
                Max % credito utilizzabile
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={maxUsagePercent}
                  onChange={(e) => setMaxUsagePercent(e.target.value)}
                  className="w-full pr-8 pl-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Limite massimo del credito per ogni prenotazione</p>
            </div>

            {/* Max Invites */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Limite inviti per utente
              </label>
              <input
                type="number"
                min="0"
                placeholder="Illimitato"
                value={maxInvites}
                onChange={(e) => setMaxInvites(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
              <p className="text-xs text-gray-500 mt-1">Lascia vuoto per nessun limite</p>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Come funziona:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Solo i Renter possono invitare amici</li>
                  <li>Il bonus viene accreditato quando l'amico completa la prima prenotazione</li>
                  <li>Il credito è utilizzabile solo per prenotazioni su RentHubber</li>
                  <li>Il credito non è prelevabile né trasferibile</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6 flex items-center justify-end gap-4">
            {saveSuccess && (
              <span className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                Impostazioni salvate!
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Salvataggio..." : "Salva Impostazioni"}
            </button>
          </div>
        </div>
      )}

      {/* Tracking Tab */}
      {activeTab === "tracking" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loadingReferrals ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="w-6 h-6 animate-spin text-brand" />
            </div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nessun referral ancora</p>
              <p className="text-sm text-gray-400">I referral appariranno qui quando gli utenti inizieranno ad invitare amici</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Invitante</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Invitato</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Stato</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Bonus</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Data</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {referrals.map((referral) => (
                    <tr key={referral.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {referral.inviter?.public_name || referral.inviter?.first_name || "N/A"}
                        </p>
                        <p className="text-xs text-gray-500">{referral.inviter?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {referral.invitee?.public_name || referral.invitee?.first_name || "N/A"}
                        </p>
                        <p className="text-xs text-gray-500">{referral.invitee?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(referral.status)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">
                          €{((referral.inviterBonusCents || 0) / 100).toFixed(2)} + €{((referral.inviteeBonusCents || 0) / 100).toFixed(2)}
                        </p>
                        {referral.inviterBonusPaidAt && (
                          <p className="text-xs text-green-600">Pagato ✓</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(referral.createdAt).toLocaleDateString("it-IT")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!["bonus_paid", "cancelled", "fraud_suspected"].includes(referral.status) && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleMarkFraud(referral.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Segnala frode"
                            >
                              <AlertCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCancelReferral(referral.id)}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Annulla"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Refresh Button */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
            <button
              onClick={loadReferrals}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <RefreshCw className="w-4 h-4" />
              Aggiorna lista
            </button>
          </div>
        </div>
      )}
    </div>
  );
};