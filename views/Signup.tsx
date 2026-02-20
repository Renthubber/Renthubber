import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Briefcase, Check, Upload, ShieldCheck, ArrowRight, ChevronLeft, Camera, LogIn, Gift, Loader2, Eye, EyeOff } from 'lucide-react';
import { User as UserType } from '../types';
import { api } from '../services/api';
import { referralApi } from '../services/referralApi';
import { supabase } from '../services/supabaseClient';

interface SignupProps {
  onComplete: (user: UserType) => void;
  onLoginRedirect: () => void;
  initialStep?: 'role' | 'login';  // ✅ AGGIUNTO: permette di aprire direttamente il login
  onForgotPassword?: () => void; // ✅ NUOVO: callback per password dimenticata
}

type Step = 'role' | 'info' | 'kyc' | 'success' | 'login';
type Role = 'renter' | 'hubber' | null;

export const Signup: React.FC<SignupProps> = ({ onComplete, initialStep = 'role', onForgotPassword }) => {
  const [step, setStep] = useState<Step>(initialStep);
  const [role, setRole] = useState<Role>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [registeredUser, setRegisteredUser] = useState<UserType | null>(null);
  
  // ✅ NUOVO: Stati per toggle password
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  
  // KYC Files State
  const [kycFiles, setKycFiles] = useState<{front: File | null, back: File | null}>({ front: null, back: null });
  const frontInputRef = React.useRef<HTMLInputElement>(null);
  const backInputRef = React.useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    referralCode: '',
  });

  // ✅ NUOVO: Leggi il codice referral dall'URL
  const [searchParams] = useSearchParams();
  
  const [inviterName, setInviterName] = useState<string | null>(null);
  const [inviterType, setInviterType] = useState<'user' | 'collaborator' | null>(null);

  useEffect(() => {
    const refCode = searchParams.get('ref');
    const openSignup = searchParams.get('openSignup');
    
    if (refCode) {
      setFormData(prev => ({
        ...prev,
        referralCode: refCode.toUpperCase()
      }));

      // Cerca chi ha questo codice referral (collaboratore o utente)
      const lookupInviter = async () => {
        try {
          // Prima cerca tra i collaboratori
          const { data: collab } = await supabase
            .from('collaborators')
            .select('first_name, last_name')
            .eq('referral_code', refCode.toUpperCase())
            .eq('status', 'approvato')
            .single();
          if (collab) {
            setInviterName(`${collab.first_name} ${collab.last_name.charAt(0)}.`);
            setInviterType('collaborator');
            return;
          }
          // Poi cerca tra gli utenti normali
          const { data: user } = await supabase
            .from('users')
            .select('first_name, last_name')
            .eq('referral_code', refCode.toUpperCase())
            .single();
          if (user) {
            setInviterName(`${user.first_name} ${user.last_name?.charAt(0) || ''}.`);
            setInviterType('user');
          }
        } catch (e) { /* silenzioso */ }
      };
      lookupInviter();
    }
    
    if (openSignup === 'true' && step === 'role') {
    }
  }, [searchParams]);

  const handleRoleSelect = (selectedRole: Role) => {
    setRole(selectedRole);
    setStep('info');
  };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
       setErrorMsg("Compila tutti i campi obbligatori.");
       return;
    }
    setErrorMsg('');
    setStep('kyc');
  };

  const handleFileSelect = (side: 'front' | 'back', e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setKycFiles(prev => ({ ...prev, [side]: e.target.files![0] }));
    }
  };

  const handleKycSubmit = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
       const selectedRole = role || 'renter';
       
       // ✅ COSTRUZIONE NOME COMPLETO
       const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

       // 2. REGISTRAZIONE UTENTE (Auth + DB Profile)
       // ✅ MODIFICATO: rimosso renterBalance e referralCode - il bonus arriva dopo la prima prenotazione
       const user = await api.auth.register(formData.email, formData.password, {
          name: fullName,
          firstName: formData.firstName.trim(),  // ✅ AGGIUNGO firstName
          lastName: formData.lastName.trim(),    // ✅ AGGIUNGO lastName
          role: selectedRole,
          roles: selectedRole === 'hubber' ? ['hubber', 'renter'] : ['renter'],
       });

       // ✅ REGISTRA IL REFERRAL SE C'È UN CODICE INVITO
       if (formData.referralCode && user) {
         try {
           const referralRegistered = await referralApi.registerReferral(user.id, formData.referralCode);
           if (referralRegistered) {
             
           } else {
             console.warn("⚠️ Codice referral non valido o già utilizzato");
           }
         } catch (refErr) {
           console.warn("⚠️ Errore registrazione referral (non bloccante):", refErr);
         }

         // ✅ COLLABORATORI: Se il codice referral è di un collaboratore, crea il lead
         try {
           const { data: collab } = await supabase
             .from('collaborators')
             .select('id')
             .eq('referral_code', formData.referralCode.toUpperCase())
             .eq('status', 'approvato')
             .single();
           if (collab) {
             const { data: collabZone } = await supabase
               .from('collaborator_zones')
               .select('id')
               .eq('collaborator_id', collab.id)
               .eq('status', 'approvata')
               .limit(1)
               .single();
             await supabase.from('collaborator_leads').insert({
               collaborator_id: collab.id,
               zone_id: collabZone?.id || null,
               contact_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
               contact_email: formData.email,
               lead_type: 'privato',
               status: 'registrato',
               registered_at: new Date().toISOString(),
               linked_user_id: user.id,
             });
             
           }
         } catch (collabErr) {
           console.warn("⚠️ Errore lead collaboratore (non bloccante):", collabErr);
         }
       }
       
       // 3. UPLOAD DOCUMENTI (Sequenziale)
       try {
         if (kycFiles.front) {
            await api.storage.uploadDocument(user.id, kycFiles.front, 'front');
         }
         if (kycFiles.back) {
            await api.storage.uploadDocument(user.id, kycFiles.back, 'back');
         }
       } catch (uploadErr) {
         console.warn("Document upload issue (non-blocking):", uploadErr);
       }

       // Salviamo l'utente nello stato locale per il passaggio successivo
       setRegisteredUser(user);

       setIsLoading(false);
       setStep('success');
       
    } catch (err: any) {
       console.error("Signup Error:", err);
       setIsLoading(false);
       
       let message = "Errore durante la registrazione. Riprova.";
       if (typeof err === 'string') {
           message = err;
       } else if (err instanceof Error) {
           message = err.message;
       } else if (err && typeof err === 'object') {
           message = err.message || err.error_description || JSON.stringify(err);
       }
       
       setErrorMsg(message);
    }
  };

  const handleFinalizeSignup = async () => {
     // Se abbiamo l'utente salvato dallo step precedente, usiamolo direttamente
     if (registeredUser) {
        onComplete(registeredUser);
        return;
     }

     // Fallback: proviamo a recuperare la sessione
     const session = await api.auth.getCurrentSession();
     if (session) {
        const user = await api.users.get(session.user.id);
        if (user) onComplete(user);
     }
  };

  const handleLoginSubmit = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const user = await api.auth.login(formData.email, formData.password);
      setIsLoading(false);
      if (user) {
         onComplete(user);
      } else {
         setErrorMsg("Utente non trovato o credenziali errate.");
      }
    } catch (err: any) {
      setIsLoading(false);
      let message = "Login fallito. Controlla email e password.";
      if (err instanceof Error) message = err.message;
      setErrorMsg(message);
    }
  };

  // --- RENDER STEPS ---

  // STEP LOGIN
  const renderLogin = () => (
    <div className="max-w-md mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
       <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-brand-dark mb-2">Bentornato!</h2>
        <p className="text-gray-500">Accedi al tuo account Renthubber.</p>
      </div>

      {errorMsg && (
         <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center border border-red-200 break-words">
            {errorMsg}
         </div>
      )}

      <div className="space-y-4">
         <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              onKeyDown={(e) => e.key === 'Enter' && handleLoginSubmit()}
            />
         </div>
         <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input 
                type={showLoginPassword ? 'text' : 'password'}
                className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                onKeyDown={(e) => e.key === 'Enter' && handleLoginSubmit()}
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                aria-label={showLoginPassword ? 'Nascondi password' : 'Mostra password'}
              >
                {showLoginPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            
            <div className="flex justify-end mt-1">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-xs text-brand hover:text-brand-dark font-medium transition-colors"
              >
                Password dimenticata?
              </button>
            </div>
         </div>
         <button 
            onClick={handleLoginSubmit}
            disabled={isLoading}
            className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center disabled:opacity-70"
         >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Accedi <LogIn className="w-4 h-4 ml-2" /></>}
         </button>
      </div>

      <div className="text-center mt-8 pt-6 border-t border-gray-100">
         <p className="text-sm text-gray-500">
            Non hai ancora un account? 
            <button onClick={() => setStep('role')} className="ml-1 font-bold text-brand hover:underline">
               Registrati
            </button>
         </p>
      </div>
    </div>
  );

  // STEP 1: ROLE SELECTION
  const renderRoleSelection = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center">
        {inviterName ? (
          <>
            <div className="inline-flex items-center bg-green-50 border border-green-200 rounded-full px-4 py-2 mb-4">
              <Gift className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">
                {inviterType === 'collaborator' ? `${inviterName} ti invita a scoprire RentHubber!` : `${inviterName} ti ha invitato su RentHubber!`}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-brand-dark mb-2">Benvenuto su Renthubber</h2>
            <p className="text-gray-500">Registrati e inizia subito — {inviterType === 'collaborator' ? 'un esperto della piattaforma ti ha scelto!' : 'il tuo amico ti ha riservato un bonus!'}</p>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-brand-dark mb-2">Benvenuto su Renthubber</h2>
            <p className="text-gray-500">Come vuoi utilizzare la piattaforma oggi?</p>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card RENTER */}
        <div 
          onClick={() => handleRoleSelect('renter')}
          className="group cursor-pointer relative bg-white border-2 border-gray-100 rounded-2xl p-8 hover:border-brand hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center"
        >
          <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full">
            Noleggia
          </div>
          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6 group-hover:bg-brand group-hover:text-white transition-colors">
            <User className="w-10 h-10 text-brand group-hover:text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Renter</h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            Voglio noleggiare oggetti e spazi.<br/>
            Risparmio, evito sprechi e trovo ciò che mi serve, quando serve.
          </p>
          <div className="mt-6 flex items-center text-brand font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
            Inizia a noleggiare <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </div>

        {/* Card HUBBER */}
        <div 
          onClick={() => handleRoleSelect('hubber')}
          className="group cursor-pointer relative bg-white border-2 border-gray-100 rounded-2xl p-8 hover:border-brand-accent hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center"
        >
          <div className="absolute top-4 right-4 bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
            Guadagna
          </div>
          <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mb-6 group-hover:bg-brand-accent group-hover:text-white transition-colors">
            <Briefcase className="w-10 h-10 text-brand-accent group-hover:text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Hubber/Renter</h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            Voglio pubblicare annunci.<br/>
           Trasformo i miei oggetti e i miei spazi in un guadagno sicuro e risparmio grazie al noleggio.
          </p>
          <div className="mt-6 flex items-center text-brand-accent font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
            Inizia a guadagnare <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </div>
      </div>

      <div className="text-center mt-8 text-sm text-gray-500">
         Hai già un account? 
         <button onClick={() => setStep('login')} className="ml-1 font-bold text-brand hover:underline">
            Accedi qui
         </button>
      </div>
    </div>
  );

  // STEP 2: PERSONAL INFO
  const renderInfoForm = () => (
    <div className="max-w-md mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
      <button onClick={() => setStep('role')} className="text-gray-400 hover:text-gray-600 mb-6 flex items-center text-sm">
        <ChevronLeft className="w-4 h-4 mr-1" /> Indietro
      </button>
      
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-brand-dark">
          Crea il tuo account {role === 'hubber' ? 'Hubber' : 'Renter'}
        </h2>
        <p className="text-gray-500 text-sm mt-2">
          Inserisci i tuoi dati per accedere a Renthubber.
        </p>
      </div>

      {errorMsg && (
         <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center border border-red-200">
            {errorMsg}
         </div>
      )}

      <form onSubmit={handleInfoSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input 
              type="text" required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
              placeholder="Mario"
              value={formData.firstName}
              onChange={e => setFormData({...formData, firstName: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cognome</label>
            <input 
              type="text" required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
              placeholder="Rossi"
              value={formData.lastName}
              onChange={e => setFormData({...formData, lastName: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input 
            type="email" required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
            placeholder="mario.rossi@example.com"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <div className="relative">
            <input 
              type={showRegisterPassword ? 'text' : 'password'}
              required
              className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
            <button
              type="button"
              onClick={() => setShowRegisterPassword(!showRegisterPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
              aria-label={showRegisterPassword ? 'Nascondi password' : 'Mostra password'}
            >
              {showRegisterPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Minimo 8 caratteri.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Codice Invito (Opzionale)</label>
          <div className="relative">
             <div className="absolute left-3 top-3 text-brand-accent pointer-events-none">
                <Gift className="w-5 h-5" />
             </div>
             <input 
               type="text"
               className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all uppercase font-medium tracking-wider"
               placeholder="Es. MARIO_AB"
               value={formData.referralCode}
               onChange={e => setFormData({...formData, referralCode: e.target.value.toUpperCase()})}
             />
          </div>
          <p className="text-xs text-gray-500 mt-1">Hai un codice amico? Inseriscilo per ricevere un bonus dopo la prima prenotazione.</p>
        </div>

        <div className="pt-4">
          <button type="submit" className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center">
            Continua <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
        
        <div className="text-center mt-4 text-sm text-gray-500">
         Già registrato?
         <button type="button" onClick={() => setStep('login')} className="ml-1 font-bold text-brand hover:underline">
            Accedi
         </button>
      </div>
      </form>
    </div>
  );

  // STEP 3: KYC VERIFICATION
  const renderKyc = () => (
    <div className="max-w-md mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8 text-brand" />
        </div>
        <h2 className="text-2xl font-bold text-brand-dark">Verifica la tua identità</h2>
        <p className="text-gray-500 text-sm mt-2">
          Per garantire la sicurezza della community, richiediamo un documento di identità valido.
        </p>
      </div>

      {errorMsg && (
         <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center border border-red-200 break-words">
            {errorMsg}
         </div>
      )}

      <div className="space-y-6">
        {/* HIDDEN INPUTS */}
        <input type="file" ref={frontInputRef} className="hidden" accept="image/*,.pdf" onChange={(e) => handleFileSelect('front', e)} />
        <input type="file" ref={backInputRef} className="hidden" accept="image/*,.pdf" onChange={(e) => handleFileSelect('back', e)} />

        {/* FRONT BUTTON */}
        <div 
          onClick={() => frontInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer group ${kycFiles.front ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}
        >
          <div className={`w-12 h-12 rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-110 ${kycFiles.front ? 'bg-green-100' : 'bg-white'}`}>
            {kycFiles.front ? <Check className="w-6 h-6 text-green-600" /> : <Camera className="w-6 h-6 text-brand" />}
          </div>
          <h4 className="font-semibold text-gray-900">Fronte Documento</h4>
          <p className="text-xs text-gray-400">
             {kycFiles.front ? kycFiles.front.name : "Carta d'identità, Patente o Passaporto"}
          </p>
        </div>

        {/* BACK BUTTON */}
        <div 
          onClick={() => backInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer group ${kycFiles.back ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}
        >
          <div className={`w-12 h-12 rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-110 ${kycFiles.back ? 'bg-green-100' : 'bg-white'}`}>
            {kycFiles.back ? <Check className="w-6 h-6 text-green-600" /> : <Upload className="w-6 h-6 text-brand" />}
          </div>
          <h4 className="font-semibold text-gray-900">Retro Documento</h4>
          <p className="text-xs text-gray-400">
             {kycFiles.back ? kycFiles.back.name : "Assicurati che sia leggibile"}
          </p>
        </div>

        <button 
          onClick={handleKycSubmit}
          disabled={isLoading}
          className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center disabled:opacity-70"
        >
          {isLoading ? (
            <span className="flex items-center">
               <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Registrazione in corso...
            </span>
          ) : (
            <>Completa Registrazione <ShieldCheck className="w-4 h-4 ml-2" /></>
          )}
        </button>
        
        <button onClick={() => setStep('info')} className="w-full text-gray-500 text-sm py-2 hover:text-brand">
          Torna indietro
        </button>
      </div>
    </div>
  );

  // STEP 4: SUCCESS
  const renderSuccess = () => (
    <div className="text-center max-w-md mx-auto animate-in zoom-in duration-500 py-12">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check className="w-12 h-12 text-green-600" />
      </div>
      <h2 className="text-3xl font-bold text-brand-dark mb-4">Benvenuto a bordo, {formData.firstName}!</h2>
      <p className="text-gray-600 mb-8">
        Il tuo account {role === 'hubber' ? 'Hubber' : 'Renter'} è stato creato con successo.
        {role === 'hubber' 
          ? ' Puoi iniziare subito a pubblicare i tuoi primi annunci.'
          : ' Inizia subito a cercare l\'oggetto o lo spazio perfetto.'}
        {formData.referralCode && (
           <span className="block mt-2 font-semibold text-brand-accent">
              🎁 Bonus in attesa! Completa la tua prima prenotazione per ottenerlo.
           </span>
        )}
      </p>
      
      <button 
        onClick={handleFinalizeSignup}
        className="bg-brand text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
      >
        Entra nella Dashboard
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-4xl">
        {/* Header */}
       <div className="text-center mb-3">
  <div className="inline-flex items-center justify-center">
    <img 
      src="/R-logo.png" 
      alt="Renthubber Logo" 
      className="w-16 h-16"
    />
  </div>
</div>

        {/* Progress Bar */}
        {step !== 'role' && step !== 'success' && step !== 'login' && (
           <div className="max-w-md mx-auto mb-8">
             <div className="flex justify-between mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
               <span className={step === 'info' || step === 'kyc' ? 'text-brand' : ''}>Dati</span>
               <span className={step === 'kyc' ? 'text-brand' : ''}>Verifica</span>
               <span>Fatto</span>
             </div>
             <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-brand transition-all duration-500 ease-out"
                 style={{ width: step === 'info' ? '33%' : step === 'kyc' ? '66%' : '100%' }}
               ></div>
             </div>
           </div>
        )}

        {/* Content Area */}
        {step === 'role' && renderRoleSelection()}
        {step === 'login' && renderLogin()}
        {step === 'info' && renderInfoForm()}
        {step === 'kyc' && renderKyc()}
        {step === 'success' && renderSuccess()}

      </div>
    </div>
  );
};