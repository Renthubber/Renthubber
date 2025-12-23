import React, { useState } from 'react';
import { 
  X, Edit, Mail, Phone, MapPin, Shield, DollarSign, Building2, 
  Settings, User, Calendar, AlertTriangle, CheckCircle, Ban, 
  KeyRound, Trash2, Save, FileCheck, FileText, Eye, Download, ImageIcon,
  AlertCircle, Landmark, TrendingUp, Star
} from 'lucide-react';

interface EditUserForm {
  // Anagrafica
  first_name: string;
  last_name: string;
  name: string; // Nome completo legacy
  public_name: string;
  date_of_birth: string;
  bio: string;
  user_type: 'privato' | 'ditta_individuale' | 'societa' | 'associazione';
  avatar_url: string;
  
  // Contatti
  email: string;
  phone_number: string;
  address: string;
  public_location: string;
  
  // Verifiche
  email_verified: boolean;
  phone_verified: boolean;
  id_document_verified: boolean;
  verification_status: 'unverified' | 'partially_verified' | 'verified';
  
  // Finanza
  renter_balance: number;
  hubber_balance: number;
  refund_balance_cents: number;
  referral_balance_cents: number;
  custom_fee_percentage: string;
  stripe_account_id: string;
  stripe_onboarding_completed: boolean;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  
  // Azienda
  company_name: string;
  fiscal_code: string;
  vat_number: string;
  pec: string;
  sdi_code: string;
  billing_address: string;
  billing_city: string;
  billing_zip: string;
  billing_province: string;
  billing_country: string;
  
  // Account
  role: 'renter' | 'hubber' | 'admin';
  is_super_hubber: boolean;
  is_super_admin: boolean;
  referral_code: string;
  hubber_since: string;
  status: string;
}

interface EditUserCompleteProps {
  user: any; // Full user object
  onClose: () => void;
  onSave: (updatedData: Partial<EditUserForm>) => Promise<void>;
  onToggleSuspend: () => void;
  onResetPassword: () => void;
  onDelete: () => void;
  onDeleteBankDetails: () => void;
  isSaving: boolean;
}

export const EditUserComplete: React.FC<EditUserCompleteProps> = ({
  user,
  onClose,
  onSave,
  onToggleSuspend,
  onResetPassword,
  onDelete,
  onDeleteBankDetails,
  isSaving
}) => {
  const [activeTab, setActiveTab] = useState<'anagrafica' | 'contatti' | 'verifiche' | 'finanza' | 'azienda' | 'account'>('anagrafica');
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<EditUserForm>({
    // Anagrafica - prova sia snake_case che camelCase
    first_name: user.first_name || user.firstName || '',
    last_name: user.last_name || user.lastName || '',
    name: user.name || `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.trim() || '',
    public_name: user.public_name || user.publicName || '',
    date_of_birth: user.date_of_birth || user.dateOfBirth || '',
    bio: user.bio || '',
    user_type: user.user_type || user.userType || 'privato',
    avatar_url: user.avatar_url || user.avatarUrl || user.avatar || '',
    
    // Contatti
    email: user.email || '',
    phone_number: user.phone_number || user.phoneNumber || user.phone || '',
    address: user.address || '',
    public_location: user.public_location || user.publicLocation || '',
    
    // Verifiche
    email_verified: user.email_verified || user.emailVerified || false,
    phone_verified: user.phone_verified || user.phoneVerified || false,
    id_document_verified: user.id_document_verified || user.idDocumentVerified || false,
    verification_status: user.verification_status || user.verificationStatus || 'unverified',
    
    // Finanza
    renter_balance: user.renter_balance || user.renterBalance || 0,
    hubber_balance: user.hubber_balance || user.hubberBalance || 0,
    refund_balance_cents: user.refund_balance_cents || user.refundBalanceCents || 0,
    referral_balance_cents: user.referral_balance_cents || user.referralBalanceCents || 0,
    custom_fee_percentage: user.custom_fee_percentage?.toString() || user.customFeePercentage?.toString() || '',
    stripe_account_id: user.stripe_account_id || user.stripeAccountId || '',
    stripe_onboarding_completed: user.stripe_onboarding_completed || user.stripeOnboardingCompleted || false,
    stripe_charges_enabled: user.stripe_charges_enabled || user.stripeChargesEnabled || false,
    stripe_payouts_enabled: user.stripe_payouts_enabled || user.stripePayoutsEnabled || false,
    
    // Azienda
    company_name: user.company_name || user.companyName || '',
    fiscal_code: user.fiscal_code || user.fiscalCode || '',
    vat_number: user.vat_number || user.vatNumber || '',
    pec: user.pec || '',
    sdi_code: user.sdi_code || user.sdiCode || '',
    billing_address: user.billing_address || user.billingAddress || '',
    billing_city: user.billing_city || user.billingCity || '',
    billing_zip: user.billing_zip || user.billingZip || '',
    billing_province: user.billing_province || user.billingProvince || '',
    billing_country: user.billing_country || user.billingCountry || 'Italia',
    
    // Account
    role: user.role || 'renter',
    is_super_hubber: user.is_super_hubber || user.isSuperHubber || false,
    is_super_admin: user.is_super_admin || user.isSuperAdmin || false,
    referral_code: user.referral_code || user.referralCode || '',
    hubber_since: user.hubber_since || user.hubberSince || '',
    status: user.status || 'active',
  });

  const handleSave = async () => {
    setError(null);
    try {
      await onSave(formData);
    } catch (err: any) {
      setError(err.message || 'Errore durante il salvataggio');
    }
  };

  const tabs = [
    { id: 'anagrafica', icon: User, label: 'Anagrafica' },
    { id: 'contatti', icon: Mail, label: 'Contatti' },
    { id: 'verifiche', icon: Shield, label: 'Verifiche' },
    { id: 'finanza', icon: DollarSign, label: 'Finanza' },
    { id: 'azienda', icon: FileText, label: 'Dati Fiscali' },
    { id: 'account', icon: Settings, label: 'Account' },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Modifica Utente</h2>
            <p className="text-sm text-gray-500 mt-1">{user.email}</p>
            <p className="text-xs text-gray-400">ID: {user.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-gray-200">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-brand text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB: ANAGRAFICA */}
          {activeTab === 'anagrafica' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cognome</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Pubblico <span className="text-gray-400">(visibile agli altri utenti)</span>
                </label>
                <input
                  type="text"
                  value={formData.public_name}
                  onChange={(e) => setFormData({ ...formData, public_name: e.target.value })}
                  placeholder="Es: Mario R."
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data di Nascita</label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Utente</label>
                <select
                  value={formData.user_type}
                  onChange={(e) => setFormData({ ...formData, user_type: e.target.value as any })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-brand outline-none"
                >
                  <option value="privato">👤 Privato</option>
                  <option value="ditta_individuale">🏪 Ditta Individuale</option>
                  <option value="societa">🏢 Società</option>
                  <option value="associazione">🤝 Associazione</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                  placeholder="Presentazione dell'utente..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Avatar</label>
                <input
                  type="url"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                />
                {formData.avatar_url && (
                  <img
                    src={formData.avatar_url}
                    alt="Avatar"
                    className="mt-2 w-20 h-20 rounded-full object-cover border border-gray-200"
                  />
                )}
              </div>
            </div>
          )}

          {/* TAB: CONTATTI */}
          {activeTab === 'contatti' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="+39 333 1234567"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo Completo</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  placeholder="Via, Numero Civico, CAP, Città"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location Pubblica <span className="text-gray-400">(visibile nel profilo)</span>
                </label>
                <input
                  type="text"
                  value={formData.public_location}
                  onChange={(e) => setFormData({ ...formData, public_location: e.target.value })}
                  placeholder="Es: Milano, Italia"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB: VERIFICHE */}
          {activeTab === 'verifiche' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <span className="text-sm text-gray-700 font-medium">Email Verificata</span>
                  <input
                    type="checkbox"
                    checked={formData.email_verified}
                    onChange={(e) => setFormData({ ...formData, email_verified: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-brand focus:ring-brand cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <span className="text-sm text-gray-700 font-medium">Telefono Verificato</span>
                  <input
                    type="checkbox"
                    checked={formData.phone_verified}
                    onChange={(e) => setFormData({ ...formData, phone_verified: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-brand focus:ring-brand cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <span className="text-sm text-gray-700 font-medium">Documento Identità Verificato</span>
                  <input
                    type="checkbox"
                    checked={formData.id_document_verified}
                    onChange={(e) => setFormData({ ...formData, id_document_verified: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-brand focus:ring-brand cursor-pointer"
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status Verifica</label>
                <select
                  value={formData.verification_status}
                  onChange={(e) => setFormData({ ...formData, verification_status: e.target.value as any })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-brand outline-none"
                >
                  <option value="unverified">Non Verificato</option>
                  <option value="partially_verified">Parzialmente Verificato</option>
                  <option value="verified">Verificato</option>
                </select>
              </div>

              {/* Documenti */}
              {(user.document_front_url || user.document_back_url) && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                    <FileCheck className="w-4 h-4 mr-2 text-blue-600" /> Documenti Caricati
                  </h5>
                  
                  <div className="space-y-2">
                    {user.document_front_url && (
                      <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700 font-medium">Fronte Documento</span>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={user.document_front_url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-dark transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> Visualizza
                          </a>
                          <a
                            href={user.document_front_url}
                            download
                            className="px-3 py-1.5 bg-gray-600 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" /> Scarica
                          </a>
                        </div>
                      </div>
                    )}

                    {user.document_back_url && (
                      <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700 font-medium">Retro Documento</span>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={user.document_back_url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-dark transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> Visualizza
                          </a>
                          <a
                            href={user.document_back_url}
                            download
                            className="px-3 py-1.5 bg-gray-600 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" /> Scarica
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: FINANZA */}
          {activeTab === 'finanza' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Renter (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.renter_balance}
                    onChange={(e) => setFormData({ ...formData, renter_balance: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Hubber (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.hubber_balance}
                    onChange={(e) => setFormData({ ...formData, hubber_balance: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Rimborsi (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={(formData.refund_balance_cents / 100).toFixed(2)}
                    onChange={(e) => setFormData({ ...formData, refund_balance_cents: Math.round(parseFloat(e.target.value) * 100) || 0 })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Referral (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={(formData.referral_balance_cents / 100).toFixed(2)}
                    onChange={(e) => setFormData({ ...formData, referral_balance_cents: Math.round(parseFloat(e.target.value) * 100) || 0 })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commissione Personalizzata (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.custom_fee_percentage}
                  onChange={(e) => setFormData({ ...formData, custom_fee_percentage: e.target.value })}
                  placeholder="Lascia vuoto per fee standard"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                />
              </div>

              {/* Stripe Info */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h5 className="font-bold text-gray-900 mb-3 flex items-center">
                  <DollarSign className="w-4 h-4 mr-2 text-purple-600" /> Stripe Account
                </h5>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stripe Account ID</label>
                    <input
                      type="text"
                      value={formData.stripe_account_id}
                      onChange={(e) => setFormData({ ...formData, stripe_account_id: e.target.value })}
                      placeholder="acct_..."
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center justify-between p-2 bg-white rounded-lg">
                      <span className="text-sm text-gray-700">Onboarding Completato</span>
                      <input
                        type="checkbox"
                        checked={formData.stripe_onboarding_completed}
                        onChange={(e) => setFormData({ ...formData, stripe_onboarding_completed: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 bg-white rounded-lg">
                      <span className="text-sm text-gray-700">Charges Abilitati</span>
                      <input
                        type="checkbox"
                        checked={formData.stripe_charges_enabled}
                        onChange={(e) => setFormData({ ...formData, stripe_charges_enabled: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 bg-white rounded-lg">
                      <span className="text-sm text-gray-700">Payouts Abilitati</span>
                      <input
                        type="checkbox"
                        checked={formData.stripe_payouts_enabled}
                        onChange={(e) => setFormData({ ...formData, stripe_payouts_enabled: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Bank Details (Read Only) */}
              {user.bank_details && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-bold text-gray-900 flex items-center">
                      <Landmark className="w-4 h-4 mr-2 text-blue-600" /> Dati Bancari
                    </h5>
                    <button
                      onClick={onDeleteBankDetails}
                      className="text-red-500 hover:bg-red-100 px-3 py-1 rounded-lg text-xs font-bold flex items-center"
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Rimuovi
                    </button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium text-gray-600">Intestatario:</span> <span className="font-bold">{user.bank_details.accountHolderName} {user.bank_details.accountHolderSurname}</span></p>
                    <p><span className="font-medium text-gray-600">IBAN:</span> <span className="font-mono font-bold">{user.bank_details.iban}</span></p>
                    <p><span className="font-medium text-gray-600">Banca:</span> <span className="font-bold">{user.bank_details.bankName}</span></p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: DATI FISCALI - Logica dinamica per tipo utente */}
          {activeTab === 'azienda' && (() => {
            // Helper per determinare quali campi mostrare (identico a BillingDataSection)
            const config = {
              showCompanyName: formData.user_type === 'societa' || formData.user_type === 'associazione',
              showFiscalCode: true,
              showVatNumber: formData.user_type !== 'privato',
              showPec: formData.user_type !== 'privato',
              showSdiCode: formData.user_type !== 'privato',
              companyNameLabel: formData.user_type === 'associazione' ? 'Denominazione' : 'Ragione Sociale',
              fiscalCodeLabel:
                formData.user_type === 'privato' || formData.user_type === 'ditta_individuale'
                  ? 'Codice Fiscale'
                  : 'Codice Fiscale Azienda',
              vatRequired: formData.user_type === 'ditta_individuale' || formData.user_type === 'societa',
              pecRequired: formData.user_type === 'ditta_individuale' || formData.user_type === 'societa',
              sdiRequired: formData.user_type === 'ditta_individuale' || formData.user_type === 'societa',
            };

            return (
              <div className="space-y-4">
                {/* Badge tipo utente */}
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Tipo utente selezionato:</p>
                  <p className="font-semibold text-gray-800">
                    {formData.user_type === 'privato' && '👤 Privato'}
                    {formData.user_type === 'ditta_individuale' && '🏪 Ditta Individuale'}
                    {formData.user_type === 'societa' && '🏢 Società (SRL, SNC, SPA, ecc.)'}
                    {formData.user_type === 'associazione' && '🤝 Associazione'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.user_type === 'privato' && 'Come privato, serve solo il Codice Fiscale.'}
                    {formData.user_type !== 'privato' && 'Puoi cambiare il tipo utente nel tab Anagrafica.'}
                  </p>
                </div>

                {/* Ragione Sociale / Denominazione - solo per Società e Associazioni */}
                {config.showCompanyName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {config.companyNameLabel} *
                    </label>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder={formData.user_type === 'associazione' ? 'Es: ASD Sport Club' : 'Es: Mario Rossi SRL'}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                    />
                  </div>
                )}

                {/* Codice Fiscale - per tutti */}
                {config.showFiscalCode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {config.fiscalCodeLabel} *
                    </label>
                    <input
                      type="text"
                      value={formData.fiscal_code}
                      onChange={(e) => setFormData({ ...formData, fiscal_code: e.target.value.toUpperCase() })}
                      maxLength={16}
                      placeholder={formData.user_type === 'privato' ? 'RSSMRA80A01H501U' : '12345678901'}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none font-mono uppercase"
                    />
                  </div>
                )}

                {/* Partita IVA - per tutti tranne privati */}
                {config.showVatNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Partita IVA {config.vatRequired && '*'}
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        IT
                      </span>
                      <input
                        type="text"
                        value={formData.vat_number ? formData.vat_number.replace(/^IT/, '') : ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                          setFormData({ ...formData, vat_number: val ? `IT${val}` : '' });
                        }}
                        maxLength={11}
                        placeholder="12345678901"
                        className="w-full rounded-r-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-brand outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* PEC - per tutti tranne privati */}
                {config.showPec && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PEC {config.pecRequired && '*'}
                    </label>
                    <input
                      type="email"
                      value={formData.pec}
                      onChange={(e) => setFormData({ ...formData, pec: e.target.value.toLowerCase() })}
                      placeholder="azienda@pec.it"
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none lowercase"
                    />
                  </div>
                )}

                {/* Codice SDI - per tutti tranne privati */}
                {config.showSdiCode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Codice SDI {config.sdiRequired && '*'}
                    </label>
                    <input
                      type="text"
                      value={formData.sdi_code}
                      onChange={(e) => setFormData({ ...formData, sdi_code: e.target.value.toUpperCase() })}
                      maxLength={7}
                      placeholder="XXXXXXX oppure 0000000"
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none font-mono uppercase"
                    />
                    <p className="text-xs text-gray-400 mt-1">Usa 0000000 se ricevi fatture via PEC</p>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Indirizzo di fatturazione
                  </p>
                </div>

                {/* Indirizzo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Via e numero civico *
                  </label>
                  <input
                    type="text"
                    value={formData.billing_address}
                    onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                    placeholder="Via Roma, 1"
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>

                {/* CAP + Città + Provincia */}
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CAP *</label>
                    <input
                      type="text"
                      value={formData.billing_zip}
                      onChange={(e) => setFormData({ ...formData, billing_zip: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                      maxLength={5}
                      placeholder="00100"
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Città *</label>
                    <input
                      type="text"
                      value={formData.billing_city}
                      onChange={(e) => setFormData({ ...formData, billing_city: e.target.value })}
                      placeholder="Roma"
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provincia *</label>
                    <input
                      type="text"
                      value={formData.billing_province}
                      onChange={(e) => setFormData({ ...formData, billing_province: e.target.value.toUpperCase() })}
                      maxLength={2}
                      placeholder="RM"
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Nazione */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nazione *</label>
                  <input
                    type="text"
                    value={formData.billing_country}
                    onChange={(e) => setFormData({ ...formData, billing_country: e.target.value })}
                    placeholder="Italia"
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
              </div>
            );
          })()}

          {/* TAB: ACCOUNT */}
          {activeTab === 'account' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ruolo</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-brand outline-none"
                >
                  <option value="renter">🔵 Renter</option>
                  <option value="hubber">🟢 Hubber</option>
                  <option value="admin">🔴 Admin</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-sm font-bold text-gray-900 flex items-center">
                        <Star className="w-4 h-4 mr-2 text-amber-600" /> Super Hubber
                      </span>
                      <p className="text-xs text-gray-600 mt-1">Commissioni ridotte e badge speciale</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.is_super_hubber}
                      onChange={(e) => setFormData({ ...formData, is_super_hubber: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-600 cursor-pointer"
                    />
                  </label>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-sm font-bold text-gray-900 flex items-center">
                        <Shield className="w-4 h-4 mr-2 text-red-600" /> Super Admin
                      </span>
                      <p className="text-xs text-gray-600 mt-1">Accesso completo alla piattaforma</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.is_super_admin}
                      onChange={(e) => setFormData({ ...formData, is_super_admin: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-600 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Codice Referral</label>
                <input
                  type="text"
                  value={formData.referral_code}
                  onChange={(e) => setFormData({ ...formData, referral_code: e.target.value })}
                  placeholder="ABC123XYZ"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hubber Dal</label>
                <input
                  type="datetime-local"
                  value={formData.hubber_since ? new Date(formData.hubber_since).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData({ ...formData, hubber_since: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status Account</label>
                <div className={`p-4 rounded-lg border ${
                  user.is_suspended
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-green-50 border-green-200 text-green-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {user.is_suspended ? (
                        <Ban className="w-5 h-5 mr-2" />
                      ) : (
                        <CheckCircle className="w-5 h-5 mr-2" />
                      )}
                      <span className="font-bold">
                        {user.is_suspended ? 'SOSPESO' : 'ATTIVO'}
                      </span>
                    </div>
                    <button
                      onClick={onToggleSuspend}
                      disabled={isSaving}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                        user.is_suspended
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {user.is_suspended ? 'Riattiva' : 'Sospendi'}
                    </button>
                  </div>
                </div>
              </div>

              {/* ZONA PERICOLO */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h5 className="font-bold text-red-700 mb-3 text-sm uppercase tracking-wide flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" /> Zona Pericolo
                </h5>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={onResetPassword}
                    disabled={isSaving}
                    className="flex flex-col items-center justify-center p-3 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <KeyRound className="w-5 h-5 text-gray-500 mb-1" />
                    <span className="text-xs font-medium text-gray-700">Reset Password</span>
                  </button>

                  <button
                    onClick={onDelete}
                    disabled={isSaving}
                    className="flex flex-col items-center justify-center p-3 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50"
                  >
                    <Trash2 className="w-5 h-5 text-red-600 mb-1" />
                    <span className="text-xs font-bold text-red-700">Elimina Account</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-between">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-2.5 bg-brand text-white rounded-lg hover:bg-brand-dark font-bold flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salva Modifiche
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};