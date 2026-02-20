// ============================================================
// RENTHUBBER - MODULO COLLABORATORI - Registrazione
// Path: collaboratori/components/CollaboratorRegistration.tsx
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, FileText, MapPin, ArrowRight, ChevronLeft,
  Check, Loader2, Eye, EyeOff, Lock, Briefcase, LogIn
} from 'lucide-react';
import { useCollaboratorAuth } from '../context/CollaboratorAuthContext';
import { ZoneRequest } from '../types/collaborator.types';
import { ZoneSelector } from './ZoneSelector';

type Step = 'info' | 'zones' | 'success';

export const CollaboratorRegistration: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useCollaboratorAuth();

  const [step, setStep] = useState<Step>('info');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    tax_id: '',
    bio: '',
    privacy: false,
    collaborator_type: 'occasionale' as 'occasionale' | 'agente',
    vat_number: '',
    pec: '',
    sdi_code: '',
  });

  const [selectedZones, setSelectedZones] = useState<ZoneRequest[]>([]);

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
      setErrorMsg('Compila tutti i campi obbligatori.');
      return;
    }
    if (formData.password.length < 8) {
      setErrorMsg('La password deve avere almeno 8 caratteri.');
      return;
    }
    setErrorMsg('');
    setStep('zones');
  };

  const handleZonesSubmit = async () => {
    if (selectedZones.length === 0) {
      setErrorMsg('Seleziona almeno una zona di interesse.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      await register({
        ...formData,
        zones: selectedZones,
      });
      setStep('success');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Errore durante la registrazione. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // RENDER: Step 1 - Dati Personali
  // ============================================================

  const renderInfoForm = () => (
    <div className="max-w-md mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-8 h-8 text-brand" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Diventa Collaboratore</h2>
        <p className="text-gray-500 text-sm mt-2">
          Unisciti alla rete commerciale RentHubber e guadagna portando nuovi Hubber.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center border border-red-200">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleInfoSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-gray-400 pointer-events-none">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
                placeholder="Mario"
                value={formData.first_name}
                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cognome *</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
              placeholder="Rossi"
              value={formData.last_name}
              onChange={e => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <div className="relative">
            <div className="absolute left-3 top-3 text-gray-400 pointer-events-none">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
              placeholder="la.tua@email.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
          <div className="relative">
            <div className="absolute left-3 top-3 text-gray-400 pointer-events-none">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
              placeholder="Minimo 8 caratteri"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Minimo 8 caratteri.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
          <div className="relative">
            <div className="absolute left-3 top-3 text-gray-400 pointer-events-none">
              <Phone className="w-5 h-5" />
            </div>
            <input
              type="tel"
              className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
              placeholder="+39 333 1234567"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Collaborazione *</label>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setFormData({ ...formData, collaborator_type: 'occasionale', vat_number: '', pec: '', sdi_code: '' })}
              className={`p-3 rounded-lg border-2 text-center transition-all ${formData.collaborator_type === 'occasionale' ? 'border-brand bg-brand/5 text-brand' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
              <p className="font-semibold text-sm">👤 Occasionale</p>
              <p className="text-xs mt-0.5 opacity-75">Codice Fiscale</p>
            </button>
            <button type="button" onClick={() => setFormData({ ...formData, collaborator_type: 'agente' })}
              className={`p-3 rounded-lg border-2 text-center transition-all ${formData.collaborator_type === 'agente' ? 'border-brand bg-brand/5 text-brand' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
              <p className="font-semibold text-sm">🏢 Agente</p>
              <p className="text-xs mt-0.5 opacity-75">Partita IVA</p>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Codice Fiscale *</label>
          <div className="relative">
            <div className="absolute left-3 top-3 text-gray-400 pointer-events-none">
              <FileText className="w-5 h-5" />
            </div>
            <input
              type="text"
              className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all uppercase"
              placeholder="RSSMRA80A01H501Z"
              value={formData.tax_id}
              onChange={e => setFormData({ ...formData, tax_id: e.target.value.toUpperCase() })}
            />
          </div>
        </div>

        {formData.collaborator_type === 'agente' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Partita IVA *</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all uppercase"
                placeholder="IT12345678901"
                value={formData.vat_number}
                onChange={e => setFormData({ ...formData, vat_number: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PEC</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
                  placeholder="azienda@pec.it"
                  value={formData.pec}
                  onChange={e => setFormData({ ...formData, pec: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Codice SDI</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all uppercase"
                  placeholder="0000000"
                  maxLength={7}
                  value={formData.sdi_code}
                  onChange={e => setFormData({ ...formData, sdi_code: e.target.value.toUpperCase() })}
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Presentati brevemente</label>
          <textarea
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all resize-none"
            rows={3}
            placeholder="Descrivi la tua esperienza e perché vuoi diventare collaboratore..."
            value={formData.bio}
            onChange={e => setFormData({ ...formData, bio: e.target.value })}
          />
        </div>
 
       <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="privacy"
            checked={formData.privacy || false}
            onChange={e => setFormData({ ...formData, privacy: e.target.checked })}
            className="mt-1 h-4 w-4 text-brand border-gray-300 rounded focus:ring-brand"
            required
          />
          <label htmlFor="privacy" className="text-sm text-gray-600">
            Acconsento al trattamento dei miei dati personali ai sensi del Regolamento UE 2016/679 (GDPR) e della normativa italiana vigente. Ho letto e accettato l'<a href="/privacy-policy" target="_blank" className="text-brand underline hover:text-brand-dark">Informativa sulla Privacy</a> e i <a href="/terms" target="_blank" className="text-brand underline hover:text-brand-dark">Termini e Condizioni</a>.
          </label>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center"
          >
            Continua - Seleziona Zone <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>

        <div className="text-center mt-4 text-sm text-gray-500">
          Sei già collaboratore?
          <button
            type="button"
            onClick={() => navigate('/collaboratori/login')}
            className="ml-1 font-bold text-brand hover:underline"
          >
            Accedi
          </button>
        </div>
      </form>
    </div>
  );

  // ============================================================
  // RENDER: Step 2 - Selezione Zone
  // ============================================================

  const renderZoneSelection = () => (
    <div className="max-w-lg mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-brand" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Zone di Interesse</h2>
        <p className="text-gray-500 text-sm mt-2">
          Seleziona le aree dove vuoi operare come collaboratore. L'admin approverà le tue richieste.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center border border-red-200">
          {errorMsg}
        </div>
      )}

      <ZoneSelector
        selectedZones={selectedZones}
        onChange={setSelectedZones}
      />

      {selectedZones.length > 0 && (
        <div className="mt-4 p-4 bg-brand/5 rounded-xl border border-brand/20">
          <h4 className="text-sm font-semibold text-brand mb-2">
            {selectedZones.length} {selectedZones.length === 1 ? 'zona selezionata' : 'zone selezionate'}
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedZones.map((zone, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-brand/10 text-brand"
              >
                <MapPin className="w-3 h-3 mr-1" />
                {zone.city || zone.province || zone.region}
                <button
                  onClick={() => setSelectedZones(selectedZones.filter((_, i) => i !== idx))}
                  className="ml-2 text-brand/60 hover:text-red-500 transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        <button
          onClick={handleZonesSubmit}
          disabled={isLoading || selectedZones.length === 0}
          className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center disabled:opacity-70"
        >
          {isLoading ? (
            <span className="flex items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Invio candidatura...
            </span>
          ) : (
            <>Invia Candidatura <ArrowRight className="w-4 h-4 ml-2" /></>
          )}
        </button>

        <button
          onClick={() => { setStep('info'); setErrorMsg(''); }}
          className="w-full text-gray-500 text-sm py-2 hover:text-brand flex items-center justify-center"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Torna ai dati personali
        </button>
      </div>
    </div>
  );

  // ============================================================
  // RENDER: Step 3 - Success
  // ============================================================

  const renderSuccess = () => (
    <div className="text-center max-w-md mx-auto animate-in zoom-in duration-500 py-12">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check className="w-12 h-12 text-green-600" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Candidatura Inviata!
      </h2>
      <p className="text-gray-600 mb-3">
        Grazie <strong>{formData.first_name}</strong>! La tua candidatura come collaboratore è stata ricevuta.
      </p>
      <p className="text-gray-500 text-sm mb-8">
        Il nostro team esaminerà la tua richiesta e le zone selezionate.
        Riceverai un'email di conferma una volta approvata.
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-sm text-amber-800">
        <strong>Prossimi passi:</strong>
        <br />
        L'admin esaminerà la tua candidatura e deciderà quali zone attivare.
        Una volta approvato, potrai accedere alla dashboard collaboratore.
      </div>

      <button
        onClick={() => navigate('/collaboratori/login')}
        className="bg-brand text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all inline-flex items-center"
      >
        <LogIn className="w-4 h-4 mr-2" /> Vai al Login
      </button>
    </div>
  );

  // ============================================================
  // MAIN RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-3">
          <div className="inline-flex items-center justify-center">
            <img src="/R-logo.png" alt="Renthubber Logo" className="w-16 h-16" />
          </div>
        </div>

        {step !== 'success' && (
          <div className="max-w-md mx-auto mb-8">
            <div className="flex justify-between mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span className={step === 'info' || step === 'zones' ? 'text-brand' : ''}>Dati</span>
              <span className={step === 'zones' ? 'text-brand' : ''}>Zone</span>
              <span>Fatto</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand transition-all duration-500 ease-out"
                style={{ width: step === 'info' ? '33%' : step === 'zones' ? '66%' : '100%' }}
              ></div>
            </div>
          </div>
        )}

        {step === 'info' && renderInfoForm()}
        {step === 'zones' && renderZoneSelection()}
        {step === 'success' && renderSuccess()}
      </div>
    </div>
  );
};
