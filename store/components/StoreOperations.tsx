// ============================================================
// RENTHUBBER STORE - Scanner QR & Operazioni
// Componente da integrare nella StoreDashboard (tab Operazioni)
// ============================================================
//
// INTEGRAZIONE IN StoreDashboard.tsx:
//
// 1. Importa il componente:
//    import { StoreOperations } from './StoreOperations';
//
// 2. Aggiungi tab 'operations' alla lista TABS (dopo 'inventory'):
//    { id: 'operations', label: 'Operazioni', short: 'Scan', icon: <QrCode className="w-4 h-4" /> }
//
// 3. Nel render dei tab, aggiungi:
//    {activeTab === 'operations' && <StoreOperations store={store!} />}
//
// 4. Aggiungi QrCode all'import di lucide-react in StoreDashboard
//
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  QrCode, Camera, X, Check, Package, AlertCircle,
  Upload, Trash2, ChevronRight, Clock, User, ArrowRight,
  Loader2, Search, CheckCircle2, XCircle, Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

// ============================================================
// TYPES
// ============================================================
interface Store {
  id: string;
  business_name: string;
  [key: string]: any;
}

interface ScannedListing {
  id: string;
  title: string;
  category: string;
  images: string[];
  host_id: string;
  host_name: string;
  store_id: string;
  status: string;
}

interface Operation {
  id: string;
  listing_id: string;
  listing_title: string;
  operation_type: string;
  photos: string[];
  notes: string;
  item_condition: string;
  created_at: string;
}

type OperationType = 'checkin_hubber' | 'checkout_renter' | 'checkin_renter' | 'checkout_hubber';

const OPERATION_LABELS: Record<OperationType, { label: string; description: string; color: string; icon: string }> = {
  checkin_hubber: { label: 'Deposito Hubber', description: "L'Hubber deposita l'oggetto nello store", color: 'blue', icon: '📦' },
  checkout_renter: { label: 'Ritiro Renter', description: 'Il Renter ritira l\'oggetto dallo store', color: 'green', icon: '🤝' },
  checkin_renter: { label: 'Riconsegna Renter', description: 'Il Renter restituisce l\'oggetto allo store', color: 'orange', icon: '🔄' },
  checkout_hubber: { label: 'Ritiro Hubber', description: "L'Hubber riprende il suo oggetto dallo store", color: 'purple', icon: '✅' },
};

// ============================================================
// MAIN COMPONENT
// ============================================================
interface StoreOperationsProps {
  store: Store;
}

export const StoreOperations: React.FC<StoreOperationsProps> = ({ store }) => {
  // Scanner state
  const [scanMode, setScanMode] = useState<'idle' | 'camera' | 'manual'>('idle');
  const [manualCode, setManualCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Scanned listing
  const [scannedListing, setScannedListing] = useState<ScannedListing | null>(null);

  // Operation flow
  const [selectedOperation, setSelectedOperation] = useState<OperationType | null>(null);
  const [operationPhotos, setOperationPhotos] = useState<string[]>([]);
  const [operationPhotoFiles, setOperationPhotoFiles] = useState<File[]>([]);
  const [operationNotes, setOperationNotes] = useState('');
  const [itemCondition, setItemCondition] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [operationSuccess, setOperationSuccess] = useState(false);

  // Recent operations
  const [recentOps, setRecentOps] = useState<Operation[]>([]);
  const [loadingOps, setLoadingOps] = useState(true);

  // Refs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load recent operations
  useEffect(() => {
    loadRecentOperations();
  }, [store.id]);

  const loadRecentOperations = async () => {
    setLoadingOps(true);
    try {
      const { data } = await supabase
        .from('store_operations')
        .select('*, listings(title)')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setRecentOps(data.map((op: any) => ({
          ...op,
          listing_title: op.listings?.title || 'Annuncio'
        })));
      }
    } catch (e) {
      console.error('Errore caricamento operazioni:', e);
    } finally {
      setLoadingOps(false);
    }
  };

  // ============================================================
  // QR SCANNER (Camera)
  // ============================================================
  const startCamera = async () => {
    setScanMode('camera');
    setSearchError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      // Poll for QR code using canvas
      pollForQR();
    } catch (err) {
      console.error('Errore accesso fotocamera:', err);
      setSearchError('Impossibile accedere alla fotocamera. Usa l\'inserimento manuale.');
      setScanMode('manual');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScanMode('idle');
  };

  const pollForQR = () => {
    const interval = setInterval(() => {
      if (!videoRef.current || !streamRef.current) {
        clearInterval(interval);
        return;
      }

      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0);

      // Usa BarcodeDetector se disponibile
      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        detector.detect(canvas).then((barcodes: any[]) => {
          if (barcodes.length > 0) {
            clearInterval(interval);
            const value = barcodes[0].rawValue;
            handleQRResult(value);
          }
        }).catch(() => {});
      }
    }, 500);

    // Stop after 30 seconds
    setTimeout(() => {
      clearInterval(interval);
    }, 30000);
  };

  // ============================================================
  // SEARCH LISTING
  // ============================================================
  const handleQRResult = (value: string) => {
    stopCamera();
    const code = value.replace('RENTHUBBER:', '').replace('RENTHUBBER_LISTING:', '').trim();
    if (code) {
      searchListing(code);
    } else {
      setSearchError('QR Code non valido');
    }
  };

  const handleManualSearch = () => {
    const code = manualCode.trim();
    if (!code) return;
    const cleaned = code.replace('RENTHUBBER:', '').replace('RENTHUBBER_LISTING:', '').trim();
    searchListing(cleaned);
  };

  const searchListing = async (code: string) => {
    setIsSearching(true);
    setSearchError('');
    try {
      // Cerca per short_code o per UUID completo
      const isUUID = code.length > 10;
      const { data, error } = await supabase
        .from('listings')
        .select('id, title, category, images, host_id, store_id, status, short_code')
        .eq(isUUID ? 'id' : 'short_code', isUUID ? code : code.toUpperCase())
        .single();

      if (error || !data) {
        setSearchError('Annuncio non trovato. Verifica il codice.');
        return;
      }

      if (data.store_id !== store.id) {
        setSearchError('Questo annuncio non è assegnato al tuo store.');
        return;
      }

      // Get host name
      const { data: hostData } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', data.host_id)
        .single();

      setScannedListing({
        ...data,
        host_name: hostData ? `${hostData.first_name} ${hostData.last_name}` : 'Hubber',
      });
      setScanMode('idle');
    } catch (e) {
      console.error('Errore ricerca listing:', e);
      setSearchError('Errore durante la ricerca. Riprova.');
    } finally {
      setIsSearching(false);
    }
  };

  // ============================================================
  // OPERATION FLOW
  // ============================================================
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
      setOperationPhotoFiles(prev => [...prev, file]);
      const reader = new FileReader();
      reader.onload = () => setOperationPhotos(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setOperationPhotos(prev => prev.filter((_, i) => i !== index));
    setOperationPhotoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveOperation = async () => {
    if (!scannedListing || !selectedOperation) return;

    if (operationPhotos.length === 0) {
      alert('Devi scattare almeno una foto dell\'oggetto.');
      return;
    }

    setIsSaving(true);
    try {
      // Upload photos
      const uploadedUrls: string[] = [];
      for (const file of operationPhotoFiles) {
        const ext = file.name.split('.').pop();
        const fileName = `op_${store.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('images')
          .upload(`store-operations/${fileName}`, file, { upsert: true });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('images').getPublicUrl(`store-operations/${fileName}`);
          uploadedUrls.push(urlData.publicUrl);
        }
      }

      // Insert operation
      const { error } = await supabase
        .from('store_operations')
        .insert({
          store_id: store.id,
          listing_id: scannedListing.id,
          operation_type: selectedOperation,
          performed_by: 'store',
          photos: uploadedUrls,
          notes: operationNotes || null,
          item_condition: itemCondition || null,
        });

      if (error) throw error;

      // 📦 Aggiorna inventario in base all'operazione
      if (selectedOperation === 'checkin_hubber') {
        // Deposito: crea record inventario
        // Crea item code usando lo short_code del listing
        const { data: listingCode } = await supabase
          .from('listings')
          .select('short_code')
          .eq('id', scannedListing.id)
          .single();

        const { data: itemCodeData, error: codeError } = await supabase
          .from('store_item_codes')
          .insert({
            listing_id: scannedListing.id,
            hubber_id: scannedListing.host_id,
            store_id: store.id,
            code: listingCode?.short_code || scannedListing.id.slice(0, 6).toUpperCase(),
            code_type: 'deposit',
            is_active: true,
          })
          .select('id')
          .single();

        if (codeError) {
          console.error('❌ Errore item code:', codeError);
        }

        const { error: invError } = await supabase.from('store_inventory').insert({
          store_id: store.id,
          item_code_id: itemCodeData?.id,
          listing_id: scannedListing.id,
          hubber_id: scannedListing.host_id,
          status: 'in_custody',
          checkin_photos: uploadedUrls,
          deposited_at: new Date().toISOString(),
          notes: operationNotes || null,
        });
      } else if (selectedOperation === 'checkout_renter') {
        // Ritiro renter: aggiorna stato
        await supabase.from('store_inventory')
          .update({ 
            status: 'rented_out', 
            checkout_photos: uploadedUrls,
            renter_pickup_at: new Date().toISOString() 
          })
          .eq('store_id', store.id)
          .eq('listing_id', scannedListing.id)
          .eq('status', 'in_custody');
      } else if (selectedOperation === 'checkin_renter') {
        // Riconsegna renter: torna in custodia
        await supabase.from('store_inventory')
          .update({ 
            status: 'in_custody', 
            return_photos: uploadedUrls,
            renter_return_at: new Date().toISOString() 
          })
          .eq('store_id', store.id)
          .eq('listing_id', scannedListing.id)
          .eq('status', 'rented_out');
      } else if (selectedOperation === 'checkout_hubber') {
        // Hubber riprende: rimuovi da inventario
        await supabase.from('store_inventory')
          .update({ 
            status: 'returned',
            hubber_pickup_at: new Date().toISOString() 
          })
          .eq('store_id', store.id)
          .eq('listing_id', scannedListing.id)
          .in('status', ['in_custody']);
      }

      setOperationSuccess(true);
      await loadRecentOperations();

      // Reset after 3 seconds
      setTimeout(() => {
        resetFlow();
      }, 3000);

    } catch (err) {
      console.error('Errore salvataggio operazione:', err);
      alert('Errore durante il salvataggio. Riprova.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetFlow = () => {
    setScannedListing(null);
    setSelectedOperation(null);
    setOperationPhotos([]);
    setOperationPhotoFiles([]);
    setOperationNotes('');
    setItemCondition('');
    setOperationSuccess(false);
    setManualCode('');
    setSearchError('');
  };

  // ============================================================
  // RENDER
  // ============================================================

  // SUCCESS SCREEN
  if (operationSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Operazione Completata!</h2>
        <p className="text-gray-500 mb-1">
          {OPERATION_LABELS[selectedOperation!]?.icon} {OPERATION_LABELS[selectedOperation!]?.label}
        </p>
        <p className="text-sm text-gray-400">{scannedListing?.title}</p>
      </div>
    );
  }

  // OPERATION FLOW (after selecting operation type)
  if (scannedListing && selectedOperation) {
    const opInfo = OPERATION_LABELS[selectedOperation];
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => setSelectedOperation(null)} className="flex items-center text-gray-600 hover:text-gray-900 text-sm font-medium">
            ← Indietro
          </button>
          <span className={`px-3 py-1 rounded-full text-xs font-bold bg-${opInfo.color}-100 text-${opInfo.color}-700`}>
            {opInfo.icon} {opInfo.label}
          </span>
        </div>

        {/* Listing info mini */}
        <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
          {scannedListing.images?.[0] && (
            <img src={scannedListing.images[0]} alt="" className="w-14 h-14 rounded-lg object-cover" />
          )}
          <div>
            <p className="font-bold text-gray-900 text-sm">{scannedListing.title}</p>
            <p className="text-xs text-gray-500">Hubber: {scannedListing.host_name}</p>
          </div>
        </div>

        {/* 📸 Foto obbligatorie */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-1 flex items-center">
            <Camera className="w-5 h-5 mr-2 text-brand" /> Foto Oggetto
            <span className="ml-2 text-xs text-red-500 font-normal">* obbligatorie</span>
          </h3>
          <p className="text-xs text-gray-500 mb-4">Scatta foto dell'oggetto per documentare le condizioni attuali.</p>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
            {operationPhotos.map((photo, idx) => (
              <div key={idx} className="relative group">
                <img src={photo} alt="" className="w-full h-24 rounded-xl object-cover border border-gray-200" />
                <button onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button onClick={() => photoInputRef.current?.click()}
              className="w-full h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-brand hover:text-brand transition-colors">
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-[10px]">Scatta foto</span>
            </button>
          </div>
          <input type="file" ref={photoInputRef} accept="image/*" capture="environment" multiple className="hidden" onChange={handlePhotoCapture} />

          {operationPhotos.length === 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-600 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> Almeno una foto è obbligatoria per completare l'operazione
              </p>
            </div>
          )}
        </div>

        {/* Condizioni oggetto */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-3">Condizioni Oggetto</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {['Perfetto', 'Buono', 'Usura normale', 'Danneggiato'].map(condition => (
              <button key={condition} onClick={() => setItemCondition(condition)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  itemCondition === condition
                    ? 'bg-brand text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {condition}
              </button>
            ))}
          </div>
          <textarea
            value={operationNotes}
            onChange={(e) => setOperationNotes(e.target.value)}
            rows={2}
            placeholder="Note aggiuntive (opzionale)... Es: piccolo graffio sul lato destro"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
          />
        </div>

        {/* Conferma */}
        <button onClick={handleSaveOperation} disabled={isSaving || operationPhotos.length === 0}
          className="w-full bg-brand text-white font-bold py-4 rounded-2xl hover:bg-brand-dark transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {isSaving ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Salvataggio...</>
          ) : (
            <><Check className="w-5 h-5" /> Conferma {opInfo.label}</>
          )}
        </button>
      </div>
    );
  }

  // SELECT OPERATION TYPE (after scanning)
  if (scannedListing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Oggetto Trovato</h2>
          <button onClick={resetFlow} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Listing card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-start gap-4">
            {scannedListing.images?.[0] && (
              <img src={scannedListing.images[0]} alt="" className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">{scannedListing.title}</h3>
              <p className="text-sm text-gray-500 mt-1">Hubber: {scannedListing.host_name}</p>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">ID: {scannedListing.id.slice(0, 12)}...</p>
            </div>
          </div>
        </div>

        {/* Operation buttons */}
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900">Seleziona Operazione</h3>
          {(Object.entries(OPERATION_LABELS) as [OperationType, typeof OPERATION_LABELS[OperationType]][]).map(([type, info]) => (
            <button key={type} onClick={() => setSelectedOperation(type)}
              className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center justify-between hover:border-brand hover:shadow-md transition-all text-left">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{info.icon}</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{info.label}</p>
                  <p className="text-xs text-gray-500">{info.description}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // IDLE / SCANNER VIEW
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Operazioni Store</h2>

      {/* Scanner buttons */}
      {scanMode === 'idle' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={startCamera}
            className="bg-brand text-white rounded-2xl p-6 flex flex-col items-center gap-3 hover:bg-brand-dark transition-colors shadow-sm">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <Camera className="w-7 h-7" />
            </div>
            <div className="text-center">
              <p className="font-bold">Scansiona QR Code</p>
              <p className="text-xs text-white/70 mt-0.5">Usa la fotocamera per scansionare</p>
            </div>
          </button>

          <button onClick={() => { setScanMode('manual'); setSearchError(''); }}
            className="bg-white text-gray-900 rounded-2xl p-6 flex flex-col items-center gap-3 border border-gray-200 hover:border-brand hover:shadow-md transition-all">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-7 h-7 text-gray-600" />
            </div>
            <div className="text-center">
              <p className="font-bold">Inserisci Codice</p>
              <p className="text-xs text-gray-500 mt-0.5">Digita l'ID dell'annuncio</p>
            </div>
          </button>
        </div>
      )}

      {/* Camera view */}
      {scanMode === 'camera' && (
        <div className="relative bg-black rounded-2xl overflow-hidden">
          <video ref={videoRef} className="w-full h-64 object-cover" autoPlay playsInline muted />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-white/50 rounded-2xl" />
          </div>
          <button onClick={stopCamera}
            className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full hover:bg-black/70">
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <p className="text-white text-xs bg-black/50 inline-block px-3 py-1 rounded-full">
              Inquadra il QR Code dell'annuncio
            </p>
          </div>
        </div>
      )}

      {/* Manual input */}
      {scanMode === 'manual' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-3">Inserisci Codice Annuncio</h3>
          <p className="text-xs text-gray-500 mb-4">Inserisci l'ID dell'annuncio presente sotto il QR Code.</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
              placeholder="Es. 2838B1"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none font-mono"
            />
            <button onClick={handleManualSearch} disabled={isSearching || !manualCode.trim()}
              className="px-6 py-3 bg-brand text-white font-bold rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-50">
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </button>
          </div>
          <button onClick={() => setScanMode('idle')} className="mt-3 text-sm text-gray-500 hover:text-gray-700">
            ← Torna indietro
          </button>
        </div>
      )}

      {/* Error */}
      {searchError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">{searchError}</p>
            <button onClick={() => { setSearchError(''); setScanMode('manual'); }}
              className="text-xs text-red-600 hover:underline mt-1">
              Riprova con inserimento manuale
            </button>
          </div>
        </div>
      )}

      {/* Recent operations */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-brand" /> Operazioni Recenti
        </h3>
        {loadingOps ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-brand animate-spin" />
          </div>
        ) : recentOps.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">Nessuna operazione registrata.</p>
        ) : (
          <div className="space-y-3">
            {recentOps.map(op => {
              const info = OPERATION_LABELS[op.operation_type as OperationType];
              return (
                <div key={op.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-xl">{info?.icon || '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{op.listing_title}</p>
                    <p className="text-xs text-gray-500">{info?.label || op.operation_type}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">
                      {new Date(op.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(op.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {op.photos?.length > 0 && (
                    <div className="flex items-center text-gray-400">
                      <ImageIcon className="w-3 h-3 mr-0.5" />
                      <span className="text-[10px]">{op.photos.length}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
