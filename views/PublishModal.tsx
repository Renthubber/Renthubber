import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Publish } from './Publish';
import { Listing, User } from '../types';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (listing: Listing) => Promise<void> | void;
  currentUser: User;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
  onPublish,
  currentUser,
}) => {
  // 🔒 Blocca scroll del body quando il modale è aperto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ❌ Se chiuso, non renderizzare nulla
  if (!isOpen) return null;

  // 🎯 Handler per chiudere con conferma (se il componente Publish ha dati)
  const handleClose = () => {
    // Il componente Publish gestirà internamente la conferma tramite onPublish
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* 🌑 Overlay scuro */}
<div
  className="hidden md:block absolute inset-0 bg-black/30 backdrop-blur-sm"
  onClick={handleClose}
/>

      {/* 📦 Container modale */}
      <div className="w-full h-full bg-gray-50 md:max-w-6xl md:max-h-[95vh] md:absolute md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* ❌ Pulsante chiudi - Mobile in alto a destra */}
        <button
          onClick={handleClose}
          className="md:hidden fixed top-4 right-4 z-[110] w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
          aria-label="Chiudi"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>

        {/* ❌ Pulsante chiudi Desktop - posizionato fuori dal modale */}
        <button
          onClick={handleClose}
          className="hidden md:block absolute -top-12 right-0 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
          aria-label="Chiudi"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>

        {/* 📄 Contenuto: Componente Publish normale */}
        <div className="flex-1 overflow-y-auto h-full">
          <Publish onPublish={onPublish} currentUser={currentUser} />
        </div>
      </div>
    </div>
  );
};