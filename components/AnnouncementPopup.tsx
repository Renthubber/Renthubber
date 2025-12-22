import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Sparkles } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface Announcement {
  id: string;
  title: string;
  message: string | null;
  image_url: string | null;
  cta_text: string | null;
  cta_link: string | null;
  type: 'promo' | 'news' | 'alert' | 'feature';
  priority: number;
  primary_color: string;
  show_on_first_login: boolean;
}

interface AnnouncementPopupProps {
  userId: string;
  userRole?: 'renter' | 'hubber' | null;
  userCreatedAt?: string; // Data registrazione utente (ISO string)
}

export const AnnouncementPopup: React.FC<AnnouncementPopupProps> = ({ userId, userRole, userCreatedAt }) => {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    loadAnnouncement();
  }, [userId, userRole, userCreatedAt]);

  const loadAnnouncement = async () => {
    if (!userId) return;

    try {
      // 1. Carica annunci attivi e validi per questo utente
      const { data: announcements, error } = await supabase
        .from('admin_announcements')
        .select('*')
        .eq('active', true)
        .lte('valid_from', new Date().toISOString())
        .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!announcements || announcements.length === 0) return;

      // 2. Filtra per target audience
      let filtered = announcements.filter(ann => {
        if (ann.target_audience === 'all') return true;
        if (ann.target_audience === 'renter' && userRole === 'renter') return true;
        if (ann.target_audience === 'hubber' && userRole === 'hubber') return true;
        if (ann.target_audience === 'specific' && ann.specific_user_ids?.includes(userId)) return true;
        return false;
      });

      if (filtered.length === 0) return;

      // 3. Filtra annunci "benvenuto" - mostrati solo se utente registrato nelle ultime 24h
      const isNewUser = userCreatedAt ? 
        (Date.now() - new Date(userCreatedAt).getTime()) < 24 * 60 * 60 * 1000 : 
        false;

      filtered = filtered.filter(ann => {
        // Se è un annuncio benvenuto, mostralo solo ai nuovi utenti
        if (ann.show_on_first_login) {
          return isNewUser;
        }
        // Altrimenti mostralo sempre (se non già visto)
        return true;
      });

      if (filtered.length === 0) return;

      // 4. Verifica quali sono già stati visti dall'utente
      const { data: viewedAnnouncements } = await supabase
        .from('announcement_views')
        .select('announcement_id')
        .eq('user_id', userId);

      const viewedIds = new Set(viewedAnnouncements?.map(v => v.announcement_id) || []);

      // 5. Trova primo annuncio non visto
      const unseenAnnouncement = filtered.find(ann => !viewedIds.has(ann.id));

      if (unseenAnnouncement) {
        setAnnouncement(unseenAnnouncement);
        setIsVisible(true);

        // 6. Traccia visualizzazione
        await trackView(unseenAnnouncement.id);
      }
    } catch (error) {
      console.error('Errore caricamento annuncio:', error);
    }
  };

  const trackView = async (announcementId: string) => {
    try {
      // Inserisci view (UNIQUE constraint impedisce duplicati)
      await supabase
        .from('announcement_views')
        .insert({
          announcement_id: announcementId,
          user_id: userId,
          viewed_at: new Date().toISOString(),
        });

      // Incrementa view_count
      await supabase.rpc('increment_announcement_views', {
        announcement_id: announcementId,
      });
    } catch (error) {
      // Ignora errore se già visto (UNIQUE constraint)
      console.log('View già tracciata o errore:', error);
    }
  };

  const trackClick = async () => {
    if (!announcement) return;

    try {
      // Marca come cliccato
      await supabase
        .from('announcement_views')
        .update({ clicked: true })
        .eq('announcement_id', announcement.id)
        .eq('user_id', userId);

      // Incrementa click_count
      await supabase.rpc('increment_announcement_clicks', {
        announcement_id: announcement.id,
      });
    } catch (error) {
      console.error('Errore tracking click:', error);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setAnnouncement(null);
    }, 300);
  };

  const handleCtaClick = () => {
    trackClick();
    if (announcement?.cta_link) {
      window.open(announcement.cta_link, '_blank');
    }
    handleClose();
  };

  if (!isVisible || !announcement) return null;

  // Usa colore personalizzato
  const primaryColor = announcement.primary_color || '#0A4D68';
  
  // Genera gradient dal colore
  const lightenColor = (hex: string, percent: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
  };

  const gradientStart = primaryColor;
  const gradientEnd = lightenColor(primaryColor, 20);

  // Badge e icona per tipo
  const typeStyles = {
    promo: { icon: '🎁', label: 'PROMOZIONE', badgeBg: 'bg-purple-100 text-purple-700' },
    news: { icon: '📰', label: 'NOVITÀ', badgeBg: 'bg-blue-100 text-blue-700' },
    alert: { icon: '⚠️', label: 'AVVISO', badgeBg: 'bg-red-100 text-red-700' },
    feature: { icon: '✨', label: 'NUOVA FUNZIONE', badgeBg: 'bg-green-100 text-green-700' },
  };

  const style = typeStyles[announcement.type];

  return (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden transform transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con gradiente personalizzato */}
        <div 
          className="relative p-6 text-white"
          style={{
            background: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`
          }}
        >
          {/* Decorazioni */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
          
          {/* Bottone chiudi */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors backdrop-blur-sm z-10"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Badge tipo */}
          <div className="relative z-10 mb-3">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${style.badgeBg}`}>
              <span>{style.icon}</span>
              <span>{style.label}</span>
            </span>
          </div>

          {/* Titolo */}
          <h2 className="relative z-10 text-2xl font-bold leading-tight mb-2">
            {announcement.title}
          </h2>

          {/* Icona decorativa */}
          <Sparkles className="absolute bottom-4 right-4 w-16 h-16 text-white/20" />
        </div>

        {/* Immagine pubblicitaria */}
        {announcement.image_url && (
          <div className="w-full h-64 bg-gray-100 overflow-hidden">
            <img
              src={announcement.image_url}
              alt={announcement.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Contenuto */}
        <div className="p-6">
          {announcement.message && (
            <p className="text-gray-700 text-base leading-relaxed mb-6">
              {announcement.message}
            </p>
          )}

          {/* CTA Button con colore personalizzato */}
          {announcement.cta_text && (
            <button
              onClick={handleCtaClick}
              className="w-full text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`
              }}
            >
              <span>{announcement.cta_text}</span>
              {announcement.cta_link && <ExternalLink className="w-4 h-4" />}
            </button>
          )}

          {/* Bottone chiudi alternativo */}
          {!announcement.cta_text && (
            <button
              onClick={handleClose}
              className="w-full bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Chiudi
            </button>
          )}

          {/* Link chiudi testuale se c'è CTA */}
          {announcement.cta_text && (
            <button
              onClick={handleClose}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-3 transition-colors"
            >
              Chiudi annuncio
            </button>
          )}
        </div>
      </div>
    </div>
  );
};