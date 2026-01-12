import React, { useState } from 'react';
import { User } from '../../../types';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Upload,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';

interface SicurezzaVerificaProps {
  user: User;
  profileData: any;
  onUpdateProfile?: (updates: any) => void | Promise<void>;
  onOpenPhoneModal: () => void;
  onOpenEmailModal: () => void;
  onOpenDeleteAccountModal: () => void;
}

export const SicurezzaVerifica: React.FC<SicurezzaVerificaProps> = ({
  user,
  profileData,
  onUpdateProfile,
  onOpenPhoneModal,
  onOpenEmailModal,
  onOpenDeleteAccountModal,
}) => {
  
  // State per upload documento
  const [idFrontFileName, setIdFrontFileName] = useState<string | null>(null);
  const [idBackFileName, setIdBackFileName] = useState<string | null>(null);
  const [isUploadingFront, setIsUploadingFront] = useState(false);
  const [isUploadingBack, setIsUploadingBack] = useState(false);
  const [isEditingDocument, setIsEditingDocument] = useState(false);
  
 // --- HANDLER DOCUMENTO IDENTITÀ (VERSIONE CORRETTA CON UPLOAD REALE) ---
 const handleIdFileChange =
   (side: 'front' | 'back'): React.ChangeEventHandler<HTMLInputElement> =>
   async (e) => {
     const file = e.target.files?.[0];
     if (!file) return;
 
     // Validazione dimensione file (max 5MB)
     const maxSize = 5 * 1024 * 1024;
     if (file.size > maxSize) {
       alert('Il file è troppo grande. Dimensione massima: 5MB');
       return;
     }
 
     // Validazione tipo file
     const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
     if (!allowedTypes.includes(file.type)) {
       alert('Formato file non supportato. Usa JPG, PNG o PDF');
       return;
     }
 
     // Mostra loader e aggiorna UI con nome file
     if (side === 'front') {
       setIdFrontFileName(file.name);
       setIsUploadingFront(true);
     } else {
       setIdBackFileName(file.name);
       setIsUploadingBack(true);
     }
 
     try {
       // 1️⃣ Genera nome file unico
       const fileExt = file.name.split('.').pop();
       const fileName = `${user.id}_${side}_${Date.now()}.${fileExt}`;
       const filePath = `id-documents/${fileName}`;
 
       // 2️⃣ Upload su Supabase Storage
       console.log(`🔄 Uploading ${side} documento...`);
       const { error: uploadError } = await supabase.storage
         .from('documents')
         .upload(filePath, file, {
           cacheControl: '3600',
           upsert: true,
         });
 
       if (uploadError) {
         console.error('❌ Errore upload Storage:', uploadError);
         throw uploadError;
       }
 
       // 3️⃣ Ottieni URL pubblico del file
       const { data: urlData } = supabase.storage
         .from('documents')
         .getPublicUrl(filePath);
 
       const publicUrl = urlData.publicUrl;
       console.log(`✅ File caricato: ${publicUrl}`);
 
       // 4️⃣ Aggiorna database con URL del documento
       const updateField = side === 'front' ? 'document_front_url' : 'document_back_url';
       
       const { error: dbError } = await supabase
         .from('users')
         .update({ 
           [updateField]: publicUrl,
           id_document_verified: false,
         })
         .eq('id', user.id);
 
       if (dbError) {
         console.error('❌ Errore aggiornamento database:', dbError);
         throw dbError;
       }
 
       // 5️⃣ Aggiorna stato locale dell'app
       if (onUpdateProfile) {
         await onUpdateProfile({
           [updateField]: publicUrl,
           idDocumentVerified: false,
           resetIdDocumentVerification: true,
         });
       }
 
       console.log(`✅ ${side === 'front' ? 'Fronte' : 'Retro'} documento caricato con successo!`);
       alert(`✅ ${side === 'front' ? 'Fronte' : 'Retro'} caricato con successo!`);
 
     } catch (err: any) {
       console.error(`❌ Errore upload documento ${side}:`, err);
       alert(`❌ Errore durante il caricamento. Riprova.`);
       
       if (side === 'front') {
         setIdFrontFileName(null);
       } else {
         setIdBackFileName(null);
       }
     } finally {
       if (side === 'front') {
         setIsUploadingFront(false);
       } else {
         setIsUploadingBack(false);
       }
     }
   };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-2 flex items-center justify-center md:justify-start">
          <ShieldCheck className="w-6 h-6 text-brand mr-2" /> Stato Verifiche
          Account
        </h3>
        <p className="text-gray-500 text-sm mb-6 text-center md:text-left">
          Per garantire la sicurezza della piattaforma, completiamo diverse
          verifiche.
        </p>

        <div className="space-y-4">
          {/* EMAIL */}
          <div className="flex flex-col items-center md:flex-row md:items-center md:justify-between gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex flex-col items-center md:flex-row md:items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 md:mb-0 md:mr-3 ${
                  user.emailVerified
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {user.emailVerified ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
              </div>
              <div className="text-center md:text-left">
                <p className="font-bold text-gray-900">Indirizzo Email</p>
                <p className="text-xs text-gray-500">{profileData.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenEmailModal}
                className="text-xs font-semibold text-brand hover:text-brand-dark transition-colors px-3 py-1.5 rounded-lg hover:bg-brand/5"
              >
                {user.emailVerified ? 'Modifica' : 'Verifica'}
              </button>
              <span
                className={`text-xs font-bold px-2 py-1 rounded ${
                  user.emailVerified
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {user.emailVerified ? 'Verificato' : 'Non Verificato'}
              </span>
            </div>
          </div>

          {/* TELEFONO */}
          <div className="flex flex-col items-center md:flex-row md:items-center md:justify-between gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex flex-col items-center md:flex-row md:items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 md:mb-0 md:mr-3 ${
                  user.phoneVerified
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {user.phoneVerified ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
              </div>
              <div className="text-center md:text-left">
                <p className="font-bold text-gray-900">Numero di Telefono</p>
                <p className="text-xs text-gray-500">
                  {profileData.phoneNumber || 'Non inserito'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenPhoneModal}
                className="text-xs font-semibold text-brand hover:text-brand-dark transition-colors px-3 py-1.5 rounded-lg hover:bg-brand/5"
              >
                {!profileData.phoneNumber ? 'Inserisci' : user.phoneVerified ? 'Modifica' : 'Verifica'}
              </button>
              <span
                className={`text-xs font-bold px-2 py-1 rounded ${
                  user.phoneVerified
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {user.phoneVerified ? 'Verificato' : 'Non Verificato'}
              </span>
            </div>
          </div>

          {/* DOCUMENTO IDENTITÀ */}
          <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex flex-col items-center md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex flex-col items-center md:flex-row md:items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 md:mb-0 md:mr-3 ${
                    user.idDocumentVerified
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {user.idDocumentVerified ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>
                <div className="text-center md:text-left">
                  <p className="font-bold text-gray-900">
                    Documento d&apos;Identità
                  </p>
                  <p className="text-xs text-gray-500">
                    Richiesto per noleggiare e ospitare
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {user.idDocumentVerified && (
                  <button
                  onClick={() => {
                   setIsEditingDocument(true);
                 setIdFrontFileName(null);
               setIdBackFileName(null);
                  }}
                    className="text-xs font-semibold text-brand hover:text-brand-dark transition-colors px-3 py-1.5 rounded-lg hover:bg-brand/5"
                  >
                    Modifica
                  </button>
                )}
                <span
                  className={`text-xs font-bold px-2 py-1 rounded ${
                    user.idDocumentVerified
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {user.idDocumentVerified ? 'Verificato' : 'In Attesa / Mancante'}
                </span>
              </div>
            </div>

            {/* Caricamento fronte/retro - mostra sempre se non verificato, o dopo click su Modifica */}
{(!user.idDocumentVerified || isEditingDocument) && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Fronte */}
    <label className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors flex flex-col items-center justify-center ${
      isUploadingFront 
        ? 'border-brand bg-brand/5 cursor-not-allowed' 
        : 'border-gray-300 hover:bg-gray-100 cursor-pointer'
    }`}>
      {isUploadingFront ? (
        <>
          <svg className="animate-spin w-8 h-8 text-brand mb-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-brand font-medium text-sm">Caricamento in corso...</p>
        </>
      ) : (
        <>
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-gray-600 font-medium text-sm">
            Carica fronte documento
          </p>
          <p className="text-xs text-gray-400 mt-1">
            PDF, JPG o PNG (Max 5MB)
          </p>
          {idFrontFileName && (
            <p className="mt-2 text-xs text-green-600 truncate max-w-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {idFrontFileName}
            </p>
          )}
        </>
      )}
      <input
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={handleIdFileChange('front')}
        disabled={isUploadingFront}
      />
    </label>

    {/* Retro */}
    <label className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors flex flex-col items-center justify-center ${
      isUploadingBack 
        ? 'border-brand bg-brand/5 cursor-not-allowed' 
        : 'border-gray-300 hover:bg-gray-100 cursor-pointer'
    }`}>
      {isUploadingBack ? (
        <>
          <svg className="animate-spin w-8 h-8 text-brand mb-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-brand font-medium text-sm">Caricamento in corso...</p>
        </>
      ) : (
        <>
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-gray-600 font-medium text-sm">
            Carica retro documento
          </p>
          <p className="text-xs text-gray-400 mt-1">
            PDF, JPG o PNG (Max 5MB)
          </p>
          {idBackFileName && (
            <p className="mt-2 text-xs text-green-600 truncate max-w-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {idBackFileName}
            </p>
          )}
        </>
      )}
      <input
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={handleIdFileChange('back')}
        disabled={isUploadingBack}
      />
    </label>
  </div>
)}
            
            {/* Messaggio se documento verificato e non in modifica */}
            {user.idDocumentVerified && idFrontFileName === null && idBackFileName === null && (
              <p className="text-xs text-gray-500 text-center">
                Il tuo documento è stato verificato. Clicca su "Modifica" per caricarne uno nuovo.
              </p>
            )}

            <p className="text-[11px] text-gray-400 text-center">
              Dopo aver caricato il documento, il team Renthubber effettuerà una
              verifica manuale. In caso di modifica del documento è necessario
              rifare la verifica.
            </p>
          </div>
        </div>
      </div>

    {/* Caricamento fronte/retro - mostra sempre se non verificato, o dopo click su Modifica */}
{(!user.idDocumentVerified || idFrontFileName !== null || idBackFileName !== null) && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Fronte */}
    <label className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors flex flex-col items-center justify-center ${
      isUploadingFront 
        ? 'border-brand bg-brand/5 cursor-not-allowed' 
        : 'border-gray-300 hover:bg-gray-100 cursor-pointer'
    }`}>
      {isUploadingFront ? (
        <>
          <svg className="animate-spin w-8 h-8 text-brand mb-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-brand font-medium text-sm">Caricamento in corso...</p>
        </>
      ) : (
        <>
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-gray-600 font-medium text-sm">
            Carica fronte documento
          </p>
          <p className="text-xs text-gray-400 mt-1">
            PDF, JPG o PNG (Max 5MB)
          </p>
          {idFrontFileName && (
            <p className="mt-2 text-xs text-green-600 truncate max-w-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {idFrontFileName}
            </p>
          )}
        </>
      )}
      <input
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={handleIdFileChange('front')}
        disabled={isUploadingFront}
      />
    </label>

    {/* Retro */}
    <label className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors flex flex-col items-center justify-center ${
      isUploadingBack 
        ? 'border-brand bg-brand/5 cursor-not-allowed' 
        : 'border-gray-300 hover:bg-gray-100 cursor-pointer'
    }`}>
      {isUploadingBack ? (
        <>
          <svg className="animate-spin w-8 h-8 text-brand mb-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-brand font-medium text-sm">Caricamento in corso...</p>
        </>
      ) : (
        <>
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-gray-600 font-medium text-sm">
            Carica retro documento
          </p>
          <p className="text-xs text-gray-400 mt-1">
            PDF, JPG o PNG (Max 5MB)
          </p>
          {idBackFileName && (
            <p className="mt-2 text-xs text-green-600 truncate max-w-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {idBackFileName}
            </p>
          )}
        </>
      )}
      <input
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={handleIdFileChange('back')}
        disabled={isUploadingBack}
      />
    </label>
  </div>
)}
            

      {/* 🔴 DANGER ZONE - Elimina Account */}
      <div className="bg-white rounded-2xl border-2 border-red-200 shadow-sm p-6">
        <h3 className="font-bold text-red-600 mb-2 flex items-center">
          <AlertTriangle className="w-6 h-6 mr-2" /> Zona Pericolosa
        </h3>
        <p className="text-gray-600 text-sm mb-6">
          Azioni irreversibili sul tuo account
        </p>

        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Trash2 className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-red-900 mb-1">
                Elimina il mio account
              </h4>
              <p className="text-sm text-red-700 mb-3">
                Questa azione è permanente e cancellerà tutti i tuoi dati:
                prenotazioni, recensioni, messaggi e informazioni personali.
              </p>
              <button
                onClick={onOpenDeleteAccountModal}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                Elimina Account
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
  );
};