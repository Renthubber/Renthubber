import React, { useState } from 'react';
import { Listing, User } from '../types';
import { Plus, Edit, Trash2, Eye, Star, Package, ExternalLink, PauseCircle, Play, X, QrCode, Download } from 'lucide-react';
import { supabase } from "../services/supabaseClient";
import { api } from '../services/api';

interface MyListingsProps {
  currentUser: User;
  listings: Listing[];
  onCreateNew: () => void;
  onEditListing?: (listing: Listing) => void;
  onListingUpdated?: () => void; // Callback per ricaricare i listings dopo modifica
}

export const MyListings: React.FC<MyListingsProps> = ({
  currentUser,
  listings,
  onCreateNew,
  onEditListing,
  onListingUpdated,
}) => {
  const [previewListing, setPreviewListing] = useState<Listing | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSuspending, setIsSuspending] = useState(false);
  const [qrListing, setQrListing] = useState<Listing | null>(null);

  // 🔹 Filtra per hostId se presente, altrimenti usa owner.id (compatibilità vecchi dati)
  const myListings = listings.filter((l) =>
    l.hostId ? l.hostId === currentUser.id : l.owner?.id === currentUser.id
  );

  // 🔹 SOSPENDI/RIATTIVA ANNUNCIO
  const handleToggleSuspend = async (listing: Listing, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const newStatus = listing.status === 'suspended' ? 'published' : 'suspended';
    const confirmMessage = listing.status === 'suspended' 
      ? 'Vuoi riattivare questo annuncio?' 
      : 'Vuoi sospendere questo annuncio? Non sarà più visibile ai renter.';
    
    if (!confirm(confirmMessage)) return;
    
    setIsSuspending(true);
    
    try {
      const { error } = await supabase
        .from('listings')
        .update({ status: newStatus })
        .eq('id', listing.id);
      
      if (error) throw error;
      
      alert(listing.status === 'suspended' ? 'Annuncio riattivato!' : 'Annuncio sospeso!');
      onListingUpdated?.();
    } catch (error) {
      console.error('Errore sospensione:', error);
      alert('Errore durante l\'operazione');
    } finally {
      setIsSuspending(false);
    }
  };

 const generateQRContent = (listingId: string) => {
    return `RENTHUBBER_LISTING:${listingId}`;
  };

  const handleDownloadQR = (listing: Listing) => {
    const canvas = document.createElement('canvas');
    const size = 300;
    canvas.width = size;
    canvas.height = size + 60;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generateQRContent(listing.id))}`;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(listing.title.slice(0, 30), size / 2, size + 20);
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px sans-serif';
      ctx.fillText(`ID: ${listing.id.slice(0, 8)}...`, size / 2, size + 40);
      ctx.fillText('RentHubber Store', size / 2, size + 55);

      const link = document.createElement('a');
      link.download = `qr_${listing.title.replace(/\s+/g, '_').slice(0, 20)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = qrUrl;
  };

  // 🔹 ELIMINA ANNUNCIO (con logica intelligente soft/hard delete)
  const handleDelete = async (listing: Listing, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(`Sei sicuro di voler eliminare "${listing.title}"?`)) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const result = await api.listings.delete(listing.id);
      
      if (result.success) {
        alert(`✅ ${result.message}`);
        onListingUpdated?.();
      }
    } catch (error: any) {
      console.error('Errore eliminazione:', error);
      alert(`❌ Errore: ${error.message || 'Errore durante l\'eliminazione'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderListingCard = (listing: Listing) => (
    <div
      onClick={() => setPreviewListing(listing)}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col group hover:shadow-md transition-shadow text-sm cursor-pointer"
    >
      <div className="relative h-40 bg-gray-200">
        <img
          src={listing.images?.[0]}
          alt={listing.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 left-2 flex gap-2">
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
              listing.status === 'draft'
                ? 'bg-yellow-500 text-white'
                : listing.status === 'suspended'
                ? 'bg-red-500 text-white'
                : 'bg-green-500 text-white'
            }`}
          >
            {listing.status === 'draft'
              ? 'Bozza'
              : listing.status === 'suspended'
              ? 'Sospeso'
              : 'Pubblicato'}
          </span>
        </div>
        
        {/* Badge Preview */}
        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink className="w-4 h-4 text-white" />
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1.5">
          <h3 className="font-bold text-gray-900 line-clamp-1 text-sm">
            {listing.title}
          </h3>
          <span className="font-bold text-brand text-sm whitespace-nowrap">
            €{listing.price}
            <span className="text-gray-400 text-[11px] font-normal">
              /{listing.priceUnit}
            </span>
          </span>
        </div>

        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
          {listing.description}
        </p>

        <div className="mt-auto pt-3 border-t border-gray-100">
          <div className="flex items-center text-[11px] text-gray-500 mb-2">
            <Eye className="w-4 h-4 mr-1" /> {listing.view_count || 0}
            <span className="mx-2">•</span>
            <Star className="w-4 h-4 mr-1 text-yellow-400 fill-current" /> {listing.rating || 0}
          </div>

          <div className="flex space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditListing && onEditListing(listing);
              }}
              className="flex-1 p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors flex items-center justify-center"
              title="Modifica"
            >
              <Edit className="w-4 h-4" />
            </button>

            <button
              onClick={(e) => handleToggleSuspend(listing, e)}
              disabled={isSuspending}
              className={`flex-1 p-2 rounded-lg transition-colors flex items-center justify-center ${
                listing.status === "suspended"
                  ? "hover:bg-green-50 text-green-600"
                  : "hover:bg-orange-50 text-orange-600"
              }`}
              title={listing.status === "suspended" ? "Riattiva" : "Sospendi"}
            >
              {listing.status === "suspended" ? (
                <Play className="w-4 h-4" />
              ) : (
                <PauseCircle className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={(e) => handleDelete(listing, e)}
              disabled={isDeleting}
              className="flex-1 p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors flex items-center justify-center"
              title="Elimina"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* 🔲 Sezione Store QR */}
          {listing.store_id && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={(e) => { e.stopPropagation(); setQrListing(listing); }}
                className="w-full flex items-center justify-center gap-2 bg-brand/5 hover:bg-brand/10 text-brand text-xs font-bold py-2.5 rounded-xl transition-colors"
              >
                <QrCode className="w-4 h-4" /> Mostra QR Code Store
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">I miei Annunci</h1>
              <p className="text-gray-500 text-sm">
                Gestisci i tuoi oggetti e spazi pubblicati.
              </p>
            </div>
            <button
              onClick={onCreateNew}
              className="bg-brand hover:bg-brand-dark text-white font-bold py-2 px-5 rounded-xl flex items-center shadow-md transition-all text-sm"
            >
              <Plus className="w-5 h-5 mr-2" /> Crea Nuovo
            </button>
          </div>

          {myListings.length > 0 ? (
            <>
              {/* 📱 MOBILE: SCROLL ORIZZONTALE, 2 CARD VISIBILI */}
              <div className="block sm:hidden">
                <div className="flex overflow-x-auto space-x-3 -mx-1 px-1 pb-2 no-scrollbar">
                  {myListings.map((listing) => (
                    <div
                      key={listing.id}
                      className="flex-shrink-0 w-[48%]"
                    >
                      {renderListingCard(listing)}
                    </div>
                  ))}
                </div>
              </div>

              {/* 📲 / 💻 / 🖥 TABLET & DESKTOP: GRIGLIA 4 / 4 / 5 CARD */}
              <div className="hidden sm:grid grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {myListings.map((listing) => (
                  <div key={listing.id}>{renderListingCard(listing)}</div>
                ))}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Nessun annuncio presente
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto text-sm">
                Non hai ancora pubblicato nulla. Inizia a guadagnare noleggiando i
                tuoi oggetti o spazi inutilizzati.
              </p>
              <button
                onClick={onCreateNew}
                className="text-brand font-bold hover:underline text-sm"
              >
                Pubblica il tuo primo annuncio
              </button>
            </div>
          )}
        </div>
      </div>

     {/* 🔲 QR CODE MODAL */}
      {qrListing && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">QR Code Store</h3>
                <p className="text-xs text-gray-500 mt-0.5">{qrListing.title}</p>
              </div>
              <button onClick={() => setQrListing(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center">
              <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 mb-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`RENTHUBBER:${(qrListing as any).short_code || qrListing.id}`)}`}
                  alt="QR Code"
                  className="w-56 h-56"
                />
              </div>
              
              <p className="text-xs text-gray-500 text-center mb-1">
                Mostra questo QR allo Store Autorizzato
              </p>
              <div className="text-center mb-4">
                <p className="text-2xl font-bold tracking-widest text-gray-900 mb-1">
                  {(qrListing as any).short_code || qrListing.id.slice(0, 6).toUpperCase()}
                </p>
                <p 
                  className="text-xs text-gray-400 font-mono cursor-pointer hover:text-brand"
                  onClick={() => { navigator.clipboard.writeText((qrListing as any).short_code || qrListing.id.slice(0, 6)); alert('Codice copiato!'); }}
                >
                  📋 Tocca per copiare il codice
                </p>
              </div>

              <div className="w-full bg-brand/5 border border-brand/20 rounded-xl p-3 mb-4">
                <p className="text-xs text-brand font-medium text-center">
                  📦 Porta l'oggetto allo store e fai scansionare questo codice per il deposito
                </p>
              </div>

              <button
                onClick={() => handleDownloadQR(qrListing)}
                className="w-full flex items-center justify-center gap-2 bg-brand text-white font-bold py-3 rounded-xl hover:bg-brand-dark transition-colors"
              >
                <Download className="w-4 h-4" /> Scarica QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    
      {/* 🔍 MODAL PREVIEW ANNUNCIO */}
      {previewListing && (
       <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] sm:flex sm:items-center sm:justify-center sm:p-4">
  <div className="bg-white sm:rounded-2xl max-w-4xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Preview Annuncio</h2>
                <p className="text-sm text-gray-500">Come lo vedono i renter</p>
              </div>
              <button
                onClick={() => setPreviewListing(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Contenuto Preview */}
            <div className="p-6">
             {/* Galleria Immagini */}
<div className="mb-6 -mx-6 sm:mx-0">
  {previewListing.images && previewListing.images.length > 0 && (
    <>
      {/* MOBILE: Carosello immagini scorrevole */}
<div className="sm:hidden overflow-x-auto snap-x snap-mandatory flex">
  {previewListing.images.map((img, idx) => (
    <div key={idx} className="flex-shrink-0 w-full snap-center">
      <img
        src={img}
        alt={`${previewListing.title} - ${idx + 1}`}
        className="w-full h-[400px] object-cover"
      />
    </div>
  ))}
</div>
      
      {/* DESKTOP: Grid che hai già (funziona) */}
      <div className="hidden sm:grid grid-cols-4 grid-rows-2 gap-2 h-[500px]">
        <div className="col-span-2 row-span-2">
          <img
            src={previewListing.images[0]}
            alt={`${previewListing.title} - 1`}
            className="w-full h-full object-cover"
          />
        </div>
        
        {previewListing.images.slice(1, 5).map((img, idx) => (
          <div key={idx} className="col-span-1 row-span-1">
            <img
              src={img}
              alt={`${previewListing.title} - ${idx + 2}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        
        {Array.from({ length: Math.max(0, 5 - (previewListing.images?.length || 0)) }).map((_, idx) => (
          <div key={`empty-${idx}`} className="col-span-1 row-span-1 bg-gray-100"></div>
        ))}
      </div>
    </>
  )}
</div>

              {/* Info Principale */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full mb-2">
                      {previewListing.category === 'oggetto' ? '📦 Oggetto' : '🏠 Spazio'}
                    </span>
                    <h3 className="text-2xl font-bold text-gray-900">{previewListing.title}</h3>
                    <p className="text-gray-600 mt-1">
                      📍 {previewListing.location}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-brand">€{previewListing.price}</div>
                    <div className="text-sm text-gray-500">per {previewListing.priceUnit}</div>
                  </div>
                </div>

                {/* Rating e Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-4">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    {previewListing.rating || 0} ({previewListing.reviewCount || 0} recensioni)
                  </div>
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {previewListing.view_count || 0} visualizzazioni
                  </div>
                </div>
              </div>

              {/* Descrizione */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-900 mb-2">Descrizione</h4>
                <p className="text-gray-700 whitespace-pre-line">{previewListing.description}</p>
              </div>

              {/* Caratteristiche */}
              {previewListing.features && previewListing.features.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 mb-2">Caratteristiche</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {previewListing.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-700">
                        <span className="w-1.5 h-1.5 bg-brand rounded-full mr-2"></span>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Regole */}
              {previewListing.rules && previewListing.rules.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 mb-2">Regole</h4>
                  <div className="space-y-1">
                    {previewListing.rules.map((rule, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-700">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                        {rule}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deposito e Politica */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                {previewListing.deposit && previewListing.deposit > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Deposito cauzionale</div>
                    <div className="font-bold text-gray-900">€{previewListing.deposit}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-gray-500 mb-1">Cancellazione</div>
                  <div className="font-bold text-gray-900 capitalize">
                    {previewListing.cancellationPolicy === 'flexible' && 'Flessibile'}
                    {previewListing.cancellationPolicy === 'moderate' && 'Moderata'}
                    {previewListing.cancellationPolicy === 'strict' && 'Rigida'}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Modal con Azioni */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
              <button
                onClick={() => {
                  setPreviewListing(null);
                  onEditListing && onEditListing(previewListing);
                }}
                className="flex-1 bg-brand hover:bg-brand-dark text-white font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifica Annuncio
              </button>
              <button
                onClick={() => setPreviewListing(null)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};