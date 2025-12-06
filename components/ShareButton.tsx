import React, { useState, useRef, useEffect } from 'react';
import { Share2, Facebook, Twitter, Link2, MessageCircle } from 'lucide-react';

interface ShareButtonProps {
  listingId: string;
  listingTitle: string;
  className?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  listingId,
  listingTitle,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const listingUrl = `${window.location.origin}/listing/${listingId}`;

  // Chiudi menu quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(listingUrl);
      alert('Link copiato negli appunti!');
      setIsOpen(false);
    } catch (error) {
      alert('Errore nella copia del link');
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Guarda questo annuncio su RentHubber: ${listingTitle}`);
    const url = encodeURIComponent(listingUrl);
    window.open(`https://wa.me/?text=${text}%0A${url}`, '_blank');
    setIsOpen(false);
  };

  const handleShareFacebook = () => {
    const url = encodeURIComponent(listingUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    setIsOpen(false);
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`Guarda questo annuncio: ${listingTitle}`);
    const url = encodeURIComponent(listingUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    setIsOpen(false);
  };

  const shareOptions = [
    {
      name: 'Copia link',
      icon: Link2,
      onClick: handleCopyLink,
      color: 'text-gray-700',
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      onClick: handleShareWhatsApp,
      color: 'text-green-600',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      onClick: handleShareFacebook,
      color: 'text-blue-600',
    },
    {
      name: 'Twitter',
      icon: Twitter,
      onClick: handleShareTwitter,
      color: 'text-sky-500',
    },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2
                   px-4 py-2 rounded-lg
                   border border-gray-300 hover:border-gray-400
                   bg-white hover:bg-gray-50
                   transition-all duration-200
                   text-sm font-medium
                   ${className}`}
        aria-label="Condividi annuncio"
      >
        <Share2 className="w-4 h-4 text-gray-700" />
        <span className="text-gray-700">Condividi</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 z-20 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2">
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Condividi</h3>
          </div>

          {shareOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.name}
                onClick={option.onClick}
                className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <Icon className={`w-5 h-5 ${option.color}`} />
                <span className="text-sm text-gray-700">{option.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};