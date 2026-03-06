import React, { useState } from 'react';
import { User } from '../types';
import { 
  ShieldCheck, Check, Briefcase, ChevronRight, ChevronLeft, 
  CreditCard, MapPin, Camera, Upload, FileText, AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

interface BecomeHubberWizardProps {
  user: User;
  onComplete: (updatedUser: User) => void;
  onCancel: () => void;
}

export const BecomeHubberWizard: React.FC<BecomeHubberWizardProps> = ({ user, onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Hubber Profile Data State
  const [formData, setFormData] = useState({
    address: user.address || '',
    city: '',
    zip: '',
    phone: user.phoneNumber || '',
    iban: user.bankDetails?.iban || ''
  });

  // --- STEPS RENDERERS ---

  const Step1_Intro = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
      <div className="text-center space-y-4">
         <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
            <Briefcase className="w-10 h-10 text-orange-600" />
         </div>
         <h2 className="text-3xl font-bold text-gray-900">Diventa Hubber</h2>
         <p className="text-gray-500 max-w-md mx-auto">
            Inizia a guadagnare noleggiando gli oggetti che non usi o i tuoi spazi liberi. 
            È sicuro, flessibile e gestisci tutto dall'app.
         </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-2">💰 Guadagna Extra</h3>
            <p className="text-sm text-gray-600">Trasforma i tuoi beni in una rendita passiva. Decidi tu i prezzi.</p>
         </div>
         <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-2">🛡️ Copertura Totale</h3>
            <p className="text-sm text-gray-600">Ogni noleggio è protetto da cauzione e verifica identità.</p>
         </div>
         <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-2">🚀 Zero Costi Fissi</h3>
            <p className="text-sm text-gray-600">Pubblicare è gratis. Paghi una piccola commissione solo se guadagni.</p>
         </div>
      </div>
    </div>
  );

  const Step2_Terms = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 text-center">Prima di iniziare...</h2>
      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
         <FileText className="w-8 h-8 text-blue-600 mb-4" />
         <h3 className="font-bold text-blue-900 mb-2">Termini e Condizioni Hubber</h3>
         <p className="text-sm text-blue-800 mb-4">
            Per diventare Hubber devi accettare le regole della community. Questo include le responsabilità sugli oggetti, la gestione delle prenotazioni e le politiche di cancellazione.
         </p>
         <ul className="text-sm text-blue-800 list-disc list-inside space-y-1 mb-4">
            <li>Rispondi alle richieste entro 24 ore</li>
            <li>Gli oggetti devono corrispondere alla descrizione</li>
            <li>Non cancellare prenotazioni confermate senza motivo</li>
         </ul>
      </div>

      <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
         <input 
            type="checkbox" 
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 w-5 h-5 text-brand rounded border-gray-300 focus:ring-brand" 
         />
         <span className="text-sm text-gray-700">
            Ho letto e accetto i <a href="#" className="text-brand font-bold hover:underline">Termini e Condizioni Hubber</a> e confermo di aver preso visione dell'<a href="#" className="text-brand font-bold hover:underline">Informativa Privacy</a>.
         </span>
      </label>
    </div>
  );

  const Step3_Kyc = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 max-w-md mx-auto text-center">
       <div>
         <ShieldCheck className="w-16 h-16 text-brand mx-auto mb-4" />
         <h2 className="text-2xl font-bold text-gray-900">Verifica Identità</h2>
         <p className="text-gray-500 mt-2">
            Per la sicurezza della community, verifichiamo l'identità di tutti gli Hubber.
         </p>
       </div>

       <div className="space-y-4">
          <button className="w-full flex items-center justify-between p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-brand hover:bg-brand/5 hover:text-brand transition-all">
             <span className="flex items-center font-medium"><Camera className="w-5 h-5 mr-3" /> Carica Documento</span>
             <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">Fronte</span>
          </button>
          <button className="w-full flex items-center justify-between p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-brand hover:bg-brand/5 hover:text-brand transition-all">
             <span className="flex items-center font-medium"><Upload className="w-5 h-5 mr-3" /> Carica Documento</span>
             <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">Retro</span>
          </button>
       </div>
       
       <p className="text-xs text-gray-400">
          I tuoi documenti sono criptati e gestiti in conformità con il GDPR.
       </p>
    </div>
  );

  const Step4_Info = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 max-w-lg mx-auto">
       <div className="text-center mb-6">
         <h2 className="text-2xl font-bold text-gray-900">Completa il tuo profilo</h2>
         <p className="text-gray-500 text-sm">Questi dati servono per i pagamenti e la fatturazione.</p>
       </div>

       <div className="space-y-4">
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo Residenza / Sede</label>
             <div className="relative">
               <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
               <input 
                 type="text" 
                 value={formData.address}
                 onChange={(e) => setFormData({...formData, address: e.target.value})}
                 className="w-full pl-10 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand outline-none"
                 placeholder="Via Roma 10"
               />
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Città</label>
                <input 
                  type="text" 
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand outline-none"
                  placeholder="Milano"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CAP</label>
                <input 
                  type="text" 
                  value={formData.zip}
                  onChange={(e) => setFormData({...formData, zip: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand outline-none"
                  placeholder="20100"
                />
             </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">IBAN (per i pagamenti)</label>
             <div className="relative">
               <CreditCard className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
               <input 
                 type="text" 
                 value={formData.iban}
                 onChange={(e) => setFormData({...formData, iban: e.target.value.toUpperCase()})}
                 className="w-full pl-10 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand outline-none font-mono uppercase"
                 placeholder="IT00..."
               />
             </div>
             <p className="text-xs text-gray-400 mt-1">Puoi aggiungerlo anche dopo dalla Dashboard.</p>
          </div>
       </div>

       {/* Error message */}
       {error && (
         <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
           <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
           <p className="text-sm text-red-700">{error}</p>
         </div>
       )}
    </div>
  );

  const Step5_Success = () => (
    <div className="text-center space-y-6 animate-in zoom-in duration-500 py-10">
       <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-12 h-12 text-green-600" />
       </div>
       <div>
          <h2 className="text-3xl font-bold text-gray-900">Benvenuto Hubber!</h2>
          <p className="text-gray-600 mt-2 max-w-md mx-auto">
             Il tuo profilo è stato aggiornato. Ora hai accesso alla Dashboard Hubber e puoi iniziare a pubblicare annunci.
          </p>
       </div>
       
       <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl max-w-md mx-auto text-left">
          <p className="text-sm font-bold text-orange-800 mb-2">🚀 Prossimi passi:</p>
          <ul className="text-sm text-orange-700 space-y-1 list-disc list-inside">
             <li>Completa il tuo profilo pubblico</li>
             <li>Pubblica il tuo primo oggetto o spazio</li>
             <li>Condividi il tuo annuncio per ricevere prenotazioni</li>
          </ul>
       </div>
    </div>
  );

  // --- LOGIC HANDLERS ---

  const handleNext = async () => {
     if (step === 2 && !termsAccepted) return;
     
     if (step === 4) {
        setIsLoading(true);
        setError(null);
        
        try {
          // ✅ Costruisci l'indirizzo completo
          const fullAddress = [formData.address, formData.city, formData.zip]
            .filter(Boolean)
            .join(', ');
          
          // ✅ Prima aggiorna i dati del profilo (indirizzo, telefono, IBAN)
          const userWithProfileData: User = {
            ...user,
            address: fullAddress || user.address,
            phoneNumber: formData.phone || user.phoneNumber,
            bankDetails: formData.iban ? {
              ...user.bankDetails,
              iban: formData.iban,
              accountHolderName: user.name?.split(' ')[0] || '',
              accountHolderSurname: user.name?.split(' ').slice(1).join(' ') || '',
              bankName: user.bankDetails?.bankName || '',
              bicSwift: user.bankDetails?.bicSwift || ''
            } : user.bankDetails
          };
          
          // Salva i dati del profilo
          await api.users.update(userWithProfileData);
          
          console.log("🚀 Upgrade a Hubber per utente:", user.id);
          
          // ✅ Usa la funzione dedicata per l'upgrade a Hubber
          const upgradedUser = await api.users.upgradeToHubber(userWithProfileData);
          
          if (!upgradedUser) {
            throw new Error("Errore nel salvataggio. Riprova.");
          }
          
          setIsLoading(false);
          setStep(5);
          
          // Chiama onComplete dopo un breve delay per mostrare il successo
          setTimeout(() => {
            onComplete(upgradedUser);
          }, 3000);
          
        } catch (err) {
          console.error("❌ Errore upgrade a Hubber:", err);
          setError(err instanceof Error ? err.message : "Si è verificato un errore. Riprova.");
          setIsLoading(false);
        }
        
        return;
     }
     
     setStep(prev => prev + 1);
  };

  const handleBack = () => {
     setStep(prev => prev - 1);
     setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-12 pb-8 px-4">
       
       {/* Top Nav */}
       <div className="w-full max-w-3xl flex items-center justify-between mb-8">
          <div className="flex items-center text-brand font-bold text-xl">
             <span className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center mr-2 text-sm">H</span>
             Renthubber
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 font-medium text-sm">
             Esci
          </button>
       </div>

       {/* Wizard Card */}
       <div className="bg-white w-full max-w-3xl rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
          
          {/* Progress Bar */}
          {step < 5 && (
             <div className="h-1.5 bg-gray-100 w-full">
                <div 
                   className="h-full bg-brand-accent transition-all duration-500 ease-out"
                   style={{ width: `${(step / 4) * 100}%` }}
                ></div>
             </div>
          )}

          {/* Content */}
          <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
             {step === 1 && <Step1_Intro />}
             {step === 2 && <Step2_Terms />}
             {step === 3 && <Step3_Kyc />}
             {step === 4 && <Step4_Info />}
             {step === 5 && <Step5_Success />}
          </div>

          {/* Footer Actions */}
          {step < 5 && (
             <div className="p-6 md:px-12 md:py-8 border-t border-gray-50 bg-white flex justify-between items-center">
                {step > 1 ? (
                   <button 
                     onClick={handleBack}
                     disabled={isLoading}
                     className="flex items-center text-gray-500 hover:text-gray-800 font-medium transition-colors disabled:opacity-50"
                   >
                      <ChevronLeft className="w-5 h-5 mr-1" /> Indietro
                   </button>
                ) : (
                   <div></div> // Spacer
                )}

                <button 
                  onClick={handleNext}
                  disabled={isLoading || (step === 2 && !termsAccepted)}
                  className={`px-8 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center ${
                     (step === 2 && !termsAccepted) 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-brand hover:bg-brand-dark text-white hover:shadow-xl disabled:opacity-70'
                  }`}
                >
                   {isLoading ? (
                     <>
                       <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                       </svg>
                       Salvataggio...
                     </>
                   ) : (
                     <>
                       {step === 4 ? 'Conferma e Attiva' : 'Continua'}
                       <ChevronRight className="w-5 h-5 ml-2" />
                     </>
                   )}
                </button>
             </div>
          )}
       </div>
    </div>
  );
};