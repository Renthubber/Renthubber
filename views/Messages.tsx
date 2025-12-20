import React, { useState, useEffect, useCallback, useRef } from "react";
import { Send, MoreVertical, Phone, Image as ImageIcon, Loader2, Archive, Trash2, RotateCcw, ChevronDown } from "lucide-react";
import { api } from "../services/api";
import { User, Dispute } from "../types";
import { useRealtimeMessages } from "../hooks/useRealtimeMessages";



interface MessagesProps {
  currentUser: User | null;
  onCreateDispute: (dispute: Dispute) => void;
}

type ChatMessage = {
  id: string;
  from: "me" | "contact" | "system";
  text?: string;
  imageUrl?: string;
  time: string;
  isSystemMessage?: boolean;
  isAdminMessage?: boolean;  // ✅ AGGIUNTO per messaggi admin
  senderName?: string;       // ✅ AGGIUNTO per nome mittente
};

// ✅ TIPO CONVERSAZIONE REALE
type RealConversation = {
  id: string;
  renterId: string;
  hubberId: string;
  listingId?: string;
  bookingId?: string;
  isSupport: boolean;
  lastMessagePreview: string;
  lastMessageAt: string;
  unreadForRenter: boolean;
  unreadForHubber: boolean;
};

// ✅ HELPER: verifica se avatar è reale (non generato da ui-avatars.com)
const hasRealAvatarUrl = (avatarUrl: string | null | undefined): boolean => {
  if (!avatarUrl) return false;
  return !avatarUrl.includes('ui-avatars.com');
};
// --- UTIL PER BLOCCARE / RIPULIRE NUMERI DI TELEFONO "SPEZZETTATI" ---
const maskObfuscatedPhones = (text: string): string => {
  let result = text;

  const spacedDigitsPattern = /(?:^|\D)((?:\d\s+){5,}\d)(?=\D|$)/g;
  result = result.replace(spacedDigitsPattern, () => {
    return " [numero nascosto] ";
  });

  const digitWords =
    "(zero|uno|una|due|tre|quattro|cinque|sei|sette|otto|nove)";
  const spacedWordsPattern = new RegExp(
    `(?:^|\\W)((?:${digitWords}\\s+){3,}${digitWords})(?=\\W|$)`,
    "gi"
  );

  result = result.replace(spacedWordsPattern, () => {
    return " [numero nascosto] ";
  });

  return result;
};

// --- TIPI MOTIVI CONTESTAZIONE ---
type DisputeReasonConfig = {
  value: string;
  label: string;
  for: "renter" | "hubber" | "both";
  scope: "object" | "space" | "both";
};

// --- MOTIVI CONTESTAZIONE DISTINTI PER RENTER / HUBBER E OGGETTI / SPAZI ---
const DISPUTE_REASONS: DisputeReasonConfig[] = [
  // HUBBER – OGGETTI
  {
    value: "danni_oggetto",
    label: "Danni all'oggetto",
    for: "hubber",
    scope: "object",
  },
  {
    value: "ritardo_restituzione_oggetto",
    label: "Oggetto restituito in ritardo",
    for: "hubber",
    scope: "object",
  },
  {
    value: "oggetto_incompleto_mancante",
    label: "Oggetto restituito incompleto o con parti mancanti",
    for: "hubber",
    scope: "object",
  },
  {
    value: "oggetto_sporco_non_funzionante",
    label: "Oggetto restituito sporco o non funzionante",
    for: "hubber",
    scope: "object",
  },
  {
    value: "uso_improprio_oggetto",
    label: "Uso improprio dell'oggetto",
    for: "hubber",
    scope: "object",
  },
  {
    value: "mancata_restituzione_oggetto",
    label: "Mancata restituzione dell'oggetto",
    for: "hubber",
    scope: "object",
  },
  {
    value: "tentata_truffa_renter",
    label: "Tentata truffa o comportamento sospetto del Renter",
    for: "hubber",
    scope: "both",
  },

  // RENTER – OGGETTI
  {
    value: "oggetto_diverso_descrizione",
    label: "Oggetto diverso dalla descrizione",
    for: "renter",
    scope: "object",
  },
  {
    value: "oggetto_guasto_all_arrivo",
    label: "Oggetto guasto o non funzionante all'arrivo",
    for: "renter",
    scope: "object",
  },
  {
    value: "oggetto_sporco_incompleto_consegna",
    label: "Oggetto consegnato sporco o incompleto",
    for: "renter",
    scope: "object",
  },
  {
    value: "hubber_assente_consegna",
    label: "Hubber non si è presentato alla consegna",
    for: "renter",
    scope: "object",
  },
  {
    value: "hubber_assente_ritiro",
    label: "Hubber non si è presentato al ritiro",
    for: "renter",
    scope: "object",
  },
  {
    value: "prezzo_condizioni_diverse",
    label: "Prezzo o condizioni diverse da quelle indicate",
    for: "renter",
    scope: "object",
  },
  {
    value: "comportamento_scorretto_hubber",
    label: "Comportamento scorretto dell'Hubber",
    for: "renter",
    scope: "both",
  },

  // HUBBER – SPAZI
  {
    value: "danni_spazio",
    label: "Danni allo spazio",
    for: "hubber",
    scope: "space",
  },
  {
    value: "uso_non_autorizzato_spazio",
    label: "Uso non autorizzato dello spazio",
    for: "hubber",
    scope: "space",
  },
  {
    value: "ritardo_uscita_spazio",
    label: "Ritardo nell'uscita dallo spazio",
    for: "hubber",
    scope: "space",
  },
  {
    value: "ospiti_non_autorizzati",
    label: "Renter ha ospitato persone non autorizzate",
    for: "hubber",
    scope: "space",
  },
  {
    value: "violazione_regole_spazio",
    label: "Violazione delle regole dello spazio",
    for: "hubber",
    scope: "space",
  },
  {
    value: "rifiuto_lasciare_spazio",
    label: "Rifiuto di lasciare lo spazio",
    for: "hubber",
    scope: "space",
  },

  // RENTER – SPAZI
  {
    value: "spazio_diverso_descrizione",
    label: "Spazio diverso dalla descrizione",
    for: "renter",
    scope: "space",
  },
  {
    value: "spazio_sporco_non_utilizzabile",
    label: "Spazio sporco o non utilizzabile",
    for: "renter",
    scope: "space",
  },
  {
    value: "spazio_non_accessibile_arrivo",
    label: "Spazio non accessibile all'arrivo",
    for: "renter",
    scope: "space",
  },
  {
    value: "problemi_sicurezza_spazio",
    label: "Problemi di sicurezza nello spazio",
    for: "renter",
    scope: "space",
  },
  {
    value: "hubber_assente_chiavi",
    label: "Hubber non si è presentato per consegna/chiavi",
    for: "renter",
    scope: "space",
  },
  {
    value: "rumori_lavori_non_segnalati",
    label: "Rumori, condizioni o lavori non segnalati",
    for: "renter",
    scope: "space",
  },
  {
    value: "violazioni_privacy",
    label: "Violazioni della privacy",
    for: "renter",
    scope: "space",
  },

  // MOTIVI GENERALI
  {
    value: "pagamenti_cauzione",
    label: "Problemi con pagamento o cauzione",
    for: "both",
    scope: "both",
  },
  {
    value: "pagamento_fuori_piattaforma",
    label: "Richiesta di pagare fuori piattaforma",
    for: "both",
    scope: "both",
  },
  {
    value: "comunicazioni_offensive",
    label: "Comunicazioni offensive o minacciose",
    for: "both",
    scope: "both",
  },
  {
    value: "altro",
    label: "Altro",
    for: "both",
    scope: "both",
  },
];

const generateDisputeId = () => {
  return `RH-DSP-${Date.now()}`;
};

export const Messages: React.FC<MessagesProps> = ({
  currentUser,
  onCreateDispute,
}) => {
  // 🔒 Controlla se i contatti possono essere condivisi
  const [isBookingConfirmed, setIsBookingConfirmed] = useState(true);

  // ✅ STATO PER LOADING CONVERSAZIONI REALI
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [realConversationsCount, setRealConversationsCount] = useState(0);

  const [contacts, setContacts] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null); // Default al supporto

  // 📜 REF PER AUTO-SCROLL (riferimento al CONTENITORE messaggi)
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // ✅ CONTATTO SUPPORTO
  const [supportUnreadCount, setSupportUnreadCount] = useState(0);
  
  const supportContact = {
    id: "support",
    name: "Supporto RentHubber",
    avatar: "https://upyznglekmynztmydtxi.supabase.co/storage/v1/object/public/avatars/avatars/avatar__Renthubber.png",
    isSupport: true,
    lastMessage: "Come possiamo aiutarti?",
    lastMessageTime: "",
    unreadCount: supportUnreadCount,
  };

  const activeContact = activeChatId === "support" 
    ? supportContact 
    : (contacts.find((c) => c.id === activeChatId) || supportContact);

  // 🔒 Controlla stato booking quando cambia conversazione attiva
  useEffect(() => {
    const checkBookingStatus = async () => {
      if (!activeContact?.bookingId) {
        setIsBookingConfirmed(true); // Chat normale o senza booking
        return;
      }

      try {
        const { supabase } = await import('../lib/supabase');
        const { data: booking } = await supabase
          .from('bookings')
          .select('status, completed_at, cancelled_at')
          .eq('id', activeContact.bookingId)
          .single();

        if (!booking) {
          setIsBookingConfirmed(true);
          return;
        }

        // 🔒 Oscura se cancellato
        if (booking.status === 'cancelled') {
          setIsBookingConfirmed(false);
          return;
        }

        // 🔒 Oscura se completato da più di 48 ore
        if (booking.status === 'completed' && booking.completed_at) {
          const completedDate = new Date(booking.completed_at);
          const now = new Date();
          const hoursPassed = (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60);

          if (hoursPassed >= 48) {
            setIsBookingConfirmed(false);
            console.log(`🔒 Booking completato da ${Math.floor(hoursPassed)} ore - Contatti bloccati`);
            return;
          }
        }

        // Altrimenti permetti contatti
        setIsBookingConfirmed(true);
      } catch (err) {
        console.error('Errore controllo stato booking:', err);
        setIsBookingConfirmed(true);
      }
    };

    checkBookingStatus();
  }, [activeContact?.bookingId, activeChatId]);

  const [messageInput, setMessageInput] = useState("");
  const [showMobileList, setShowMobileList] = useState(true); // Default: mostra lista // Mobile: mostra lista o chat


  // ✅ FORMATTA DATE STILE AIRBNB
  const formatBookingDates = (startDate: string | null, endDate: string | null): string => {
    if (!startDate || !endDate) return "";
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const startDay = start.getDate();
    const endDay = end.getDate();
    const startMonth = start.toLocaleDateString('it-IT', { month: 'short' });
    const endMonth = end.toLocaleDateString('it-IT', { month: 'short' });
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    
    if (startMonth === endMonth && startYear === endYear) {
      return `${startDay}-${endDay} ${startMonth}`;
    }
    
    if (startYear === endYear) {
      return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
    }
    
    return `${startDay} ${startMonth} ${startYear.toString().slice(-2)} - ${endDay} ${endMonth} ${endYear.toString().slice(-2)}`;
  };

  const formatBookingNumber = (bookingId: string | null): string => {
    if (!bookingId) return "";
    return `#RH-${bookingId.slice(0, 8).toUpperCase()}`;
  };

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [supportMessages, setSupportMessages] = useState<ChatMessage[]>([
    {
      id: "support-welcome",
      from: "contact",
      text: "Ciao! 👋 Benvenuto nel supporto RentHubber.\n\nCome possiamo aiutarti oggi? Siamo qui per rispondere a qualsiasi domanda su:\n\n• Prenotazioni e pagamenti\n• Problemi con annunci\n• Contestazioni e rimborsi\n• Funzionalità della piattaforma\n\nScrivici pure!",
      time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
    }
  ]);
  const [showMenu, setShowMenu] = useState(false);
  const [showPhoneInfo, setShowPhoneInfo] = useState(false);
  
  // ✅ STATI PER ARCHIVIAZIONE
  const [showArchived, setShowArchived] = useState(false);
  const [archivedContacts, setArchivedContacts] = useState<any[]>([]);
  const [contextMenuContactId, setContextMenuContactId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // ✅ STATI PER SISTEMA TICKET SUPPORTO
  const [supportView, setSupportView] = useState<'list' | 'chat' | 'new'>('list');
  const [allUserTickets, setAllUserTickets] = useState<any[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketFilterStatus, setTicketFilterStatus] = useState<'all' | 'open' | 'closed'>('all');
  const [newTicketCategory, setNewTicketCategory] = useState('');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  // Categorie/Reparti supporto
  const SUPPORT_CATEGORIES = [
    { id: 'payment', label: '💳 Pagamenti e Rimborsi', icon: '💳' },
    { id: 'booking', label: '📅 Prenotazioni', icon: '📅' },
    { id: 'listing', label: '📢 Annunci e Listing', icon: '📢' },
    { id: 'account', label: '👤 Account e Profilo', icon: '👤' },
    { id: 'technical', label: '🔧 Problemi Tecnici', icon: '🔧' },
    { id: 'dispute', label: '📦 Contestazioni', icon: '📦' },
    { id: 'other', label: '❓ Altro', icon: '❓' },
  ];

  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeStep, setDisputeStep] = useState<number>(1);
  const [disputeReason, setDisputeReason] = useState<string>("");
  const [disputeDetails, setDisputeDetails] = useState<string>("");
  const [disputeImages, setDisputeImages] = useState<string[]>([]);
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundDocumentName, setRefundDocumentName] = useState<string>("");
  const [disputeId, setDisputeId] = useState<string | null>(null);
  const [disputeRole, setDisputeRole] = useState<"renter" | "hubber">("renter");
  const [disputeScope, setDisputeScope] = useState<"object" | "space">("object");

  // 🔔 REALTIME: Subscribe a nuovi messaggi
  // 🔄 Funzione per ricaricare conversazioni (estratta per poterla chiamare da realtime)
  const loadRealConversations = useCallback(async () => {
    setIsLoadingConversations(true);

    try {
      if (!currentUser) {
        setIsLoadingConversations(false);
        return;
      }

      // Carica conversazioni da Supabase
      const supabaseConversations = await api.messages.getConversationsForUser(currentUser.id);

      // Converti in formato "contact" per l'UI
      const realContactsPromises = supabaseConversations
        .filter((conv: any) => !conv.isSupport) // Escludi supporto dalla lista contatti
        .map(async (conv: any) => {
          const isRenter = conv.renterId === currentUser.id;
          const contactId = isRenter ? conv.hubberId : conv.renterId;
          const contactData = isRenter ? conv.hubber : conv.renter;

          const contactName = contactData?.public_name || 
            `${contactData?.first_name || ''} ${contactData?.last_name || ''}`.trim() || 
            (isRenter ? "Hubber" : "Renter");
          const contactAvatar = contactData?.avatar_url || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(contactName)}&background=0D414B&color=fff`;

          const bookingData = conv.booking || {};
          const listingTitle = conv.listing?.title || conv.listing?.name || "Annuncio";
          const bookingDates = formatBookingDates(
            bookingData.startDate || bookingData.start_date,
            bookingData.endDate || bookingData.end_date
          );
          const bookingNumber = formatBookingNumber(conv.bookingId);
          
          // 🔔 Determina se ha messaggi non letti
          const hasUnread = isRenter 
            ? (conv.unreadForRenter === true) 
            : (conv.unreadForHubber === true);
          
          return {
            id: conv.id,
            name: contactName,
            avatar: contactAvatar,
            lastMessage: conv.lastMessagePreview || "Nuova conversazione",
            lastMessageTime: conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString("it-IT", {
              day: "numeric",
              month: "short",
            }) : "",
            unreadCount: conv.unreadCount || 0,
            hasUnread, // 🔔 Nuovo campo
            isOnline: false,
            avgResponseMinutes: 60,
            phoneNumber: contactData?.phone_number || contactData?.phoneNumber || "",
            bookingId: conv.bookingId,
            listingId: conv.listingId,
            isRealConversation: true,
            renterId: conv.renterId,
            hubberId: conv.hubberId,
            contactId,
            listing: conv.listing,
            listingTitle,
            bookingDates,
            bookingNumber,
            booking: bookingData,
          };
        });

      const realContacts = await Promise.all(realContactsPromises);

      // Ordina per data (più recente prima)
      realContacts.sort((a, b) => {
        const convA = supabaseConversations.find((c: any) => c.id === a.id);
        const convB = supabaseConversations.find((c: any) => c.id === b.id);
        return new Date(convB?.lastMessageAt || 0).getTime() - new Date(convA?.lastMessageAt || 0).getTime();
      });

      setRealConversationsCount(realContacts.length);

      // Usa solo conversazioni reali
      setContacts(realContacts);

      console.log("✅ Conversazioni reali caricate da Supabase:", realContacts.length);
    } catch (err) {
      console.error("Errore caricamento conversazioni:", err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [currentUser]);

  const handleNewMessage = useCallback((message: any) => {
    console.log('🆕 Nuovo messaggio in tempo reale!', message);
    // Ricarica conversazioni per aggiornare lista
    loadRealConversations();
  }, [loadRealConversations]);

const { unreadCount: realtimeUnreadCount } = useRealtimeMessages({
  userId: currentUser?.id || null,
  onNewMessage: handleNewMessage
});

  const getDisputeReasonsForContext = () => {
    const role = disputeRole;
    const scope = disputeScope;

    const filtered = DISPUTE_REASONS.filter((r) => {
      const roleMatch = r.for === "both" || r.for === role;
      const scopeMatch = r.scope === "both" || r.scope === scope;
      return roleMatch && scopeMatch;
    });

    return filtered.length > 0 ? filtered : DISPUTE_REASONS;
  };

  const disputeReasons = getDisputeReasonsForContext();

  // ✅ HANDLERS ARCHIVIAZIONE/ELIMINAZIONE
  const handleArchiveConversation = async (contactId: string) => {
    if (!currentUser) return;
    
    const success = await api.messages.archiveConversation(contactId, currentUser.id);
    if (success) {
      // Sposta dalla lista principale all'archivio
      const archivedContact = contacts.find(c => c.id === contactId);
      if (archivedContact) {
        setContacts(prev => prev.filter(c => c.id !== contactId));
        setArchivedContacts(prev => [...prev, { ...archivedContact, isArchived: true }]);
      }
      setContextMenuContactId(null);
      
      // Se era la chat attiva, seleziona la prima disponibile
      if (activeChatId === contactId) {
        const remaining = contacts.filter(c => c.id !== contactId);
        if (remaining.length > 0) {
          setActiveChatId(remaining[0].id);
          setShowMobileList(false); // Mobile: apri chat
        } else {
          setActiveChatId("support");
          setShowMobileList(false); // Mobile: apri chat
        }
      }
    }
  };

  const handleUnarchiveConversation = async (contactId: string) => {
    if (!currentUser) return;
    
    const success = await api.messages.unarchiveConversation(contactId, currentUser.id);
    if (success) {
      // Sposta dall'archivio alla lista principale
      const unarchivedContact = archivedContacts.find(c => c.id === contactId);
      if (unarchivedContact) {
        setArchivedContacts(prev => prev.filter(c => c.id !== contactId));
        setContacts(prev => [{ ...unarchivedContact, isArchived: false }, ...prev]);
      }
    }
  };

  const handleDeleteConversation = async (contactId: string) => {
    if (!currentUser) return;
    
    const success = await api.messages.deleteConversation(contactId, currentUser.id);
    if (success) {
      // Rimuovi dalla lista (sia principale che archivio)
      setContacts(prev => prev.filter(c => c.id !== contactId));
      setArchivedContacts(prev => prev.filter(c => c.id !== contactId));
      setShowDeleteConfirm(null);
      setContextMenuContactId(null);
      
      // Se era la chat attiva, seleziona la prima disponibile
      if (activeChatId === contactId) {
        const remaining = contacts.filter(c => c.id !== contactId);
        if (remaining.length > 0) {
          setActiveChatId(remaining[0].id);
          setShowMobileList(false); // Mobile: apri chat
        } else {
          setActiveChatId("support");
          setShowMobileList(false); // Mobile: apri chat
        }
      }
    }
  };

  // ✅ CARICA CONVERSAZIONI ARCHIVIATE
  const loadArchivedConversations = async () => {
    if (!currentUser) return;
    
    try {
      const archived = await api.messages.getConversationsForUser(currentUser.id, true);
      
      const archivedContactsData = archived.map((conv: any) => {
        const isRenter = conv.renterId === currentUser.id;
        const contactId = isRenter ? conv.hubberId : conv.renterId;
        const contactData = isRenter ? conv.hubber : conv.renter;
        
        const contactName = contactData?.public_name || 
          `${contactData?.first_name || ''} ${contactData?.last_name || ''}`.trim() || 
          'Utente';
        const contactAvatar = contactData?.avatar_url || 
          `https://ui-avatars.com/api/?name=${encodeURIComponent(contactName)}&background=0D414B&color=fff`;

        return {
          id: conv.id,
          name: contactName,
          avatar: contactAvatar,
          lastMessage: conv.lastMessagePreview || "Conversazione archiviata",
          lastMessageTime: conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString("it-IT", {
            day: "numeric",
            month: "short",
          }) : "",
          unreadCount: 0,
          isRealConversation: true,
          isArchived: true,
          contactId,
        };
      });
      
      setArchivedContacts(archivedContactsData);
    } catch (e) {
      console.warn('Errore caricamento archiviate:', e);
    }
  };

  // Carica archiviate quando si attiva la visualizzazione
  useEffect(() => {
    if (showArchived && archivedContacts.length === 0) {
      loadArchivedConversations();
    }
  }, [showArchived]);

  // ✅ POLLING PER MESSAGGI NON LETTI DAL SUPPORTO
  useEffect(() => {
    const checkUnreadSupport = async () => {
      if (!currentUser) return;
      
      try {
        const tickets = await api.support.getTicketsForUser(currentUser.id);
        const unreadTicket = tickets.find((t: any) => t.unread_by_user);
        setSupportUnreadCount(unreadTicket ? 1 : 0);
        
        // Salva tutti i ticket per la lista
        setAllUserTickets(tickets);
        
        // Aggiorna anche l'ultimo messaggio del supporto
        if (tickets.length > 0) {
          const latestTicket = tickets[0];
          if (latestTicket.last_message_preview) {
            supportContact.lastMessage = latestTicket.last_message_preview;
          }
        }
      } catch (e) {
        console.warn('Errore controllo messaggi supporto:', e);
      }
    };

    // Controlla subito
    checkUnreadSupport();
    
    // Poi ogni 30 secondi
    const interval = setInterval(checkUnreadSupport, 30000);
    
    return () => clearInterval(interval);
  }, [currentUser]);

  // ✅ CARICA TUTTI I TICKET QUANDO SI APRE IL SUPPORTO
  const loadAllUserTickets = async () => {
    if (!currentUser) return;
    try {
      const tickets = await api.support.getTicketsForUser(currentUser.id);
      setAllUserTickets(tickets);
    } catch (e) {
      console.warn('Errore caricamento ticket:', e);
    }
  };

  // ✅ CREA NUOVO TICKET
  const handleCreateTicket = async () => {
    if (!currentUser || !newTicketCategory || !newTicketSubject.trim() || !newTicketMessage.trim()) return;
    
    setIsCreatingTicket(true);
    try {
      const result = await api.support.createTicket({
        userId: currentUser.id,
        subject: newTicketSubject,
        category: newTicketCategory,
        initialMessage: newTicketMessage,
      });
      
      if (result) {
        // Reset form
        setNewTicketCategory('');
        setNewTicketSubject('');
        setNewTicketMessage('');
        
        // Ricarica ticket e vai alla chat
        await loadAllUserTickets();
        setSelectedTicketId((result as any).id);
        setSupportView('chat');
      }
    } catch (e) {
      console.error('Errore creazione ticket:', e);
    } finally {
      setIsCreatingTicket(false);
    }
  };

  // ✅ APRI TICKET ESISTENTE
  const handleOpenTicket = async (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setSupportView('chat');
    
    // Carica messaggi del ticket
    if (currentUser) {
      try {
        const ticketData = await api.support.getTicketWithMessages(ticketId);
        if (ticketData && ticketData.messages) {
          const formattedMsgs = ticketData.messages
            .filter((m: any) => !m.is_internal)
            .map((m: any) => ({
              id: m.id,
              from: m.sender_type === 'user' ? 'me' : 'contact',
              text: m.message,
              time: new Date(m.created_at).toLocaleTimeString("it-IT", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            }));
          setChatMessages(formattedMsgs);
          
          // Segna come letto
          await api.support.markAsReadByUser(ticketId);
          setSupportUnreadCount(0);
        }
      } catch (e) {
        console.warn('Errore caricamento messaggi ticket:', e);
      }
    }
  };

  // ✅ POLLING PER MESSAGGI NON LETTI NELLE CONVERSAZIONI
  useEffect(() => {
    const checkUnreadConversations = async () => {
      if (!currentUser) return;
      
      try {
        const conversations = await api.messages.getConversationsForUser(currentUser.id);
        
        // Aggiorna i contatti con i nuovi contatori
        setContacts(prev => prev.map(contact => {
          if (!contact.isRealConversation) return contact;
          
          const conv = conversations.find((c: any) => c.id === contact.id);
          if (conv) {
            return {
              ...contact,
              unreadCount: conv.unreadCount || 0,
              lastMessage: conv.lastMessagePreview || contact.lastMessage,
            };
          }
          return contact;
        }));
      } catch (e) {
        console.warn('Errore controllo messaggi non letti:', e);
      }
    };

    // Controlla ogni 30 secondi (non subito, perché già caricato all'init)
    const interval = setInterval(checkUnreadConversations, 30000);
    
    return () => clearInterval(interval);
  }, [currentUser]);

  // ✅ CARICA CONVERSAZIONI REALI DA SUPABASE
  useEffect(() => {
    loadRealConversations();
  }, [loadRealConversations]);

  // ✅ CARICA MESSAGGI - REALI O MOCK
  useEffect(() => {
    if (!activeContact) return;

    // ✅ Se è la chat supporto, carica da Supabase
    if (activeChatId === "support") {
      const loadSupportMessages = async () => {
        if (!currentUser) {
          setChatMessages(supportMessages);
          return;
        }

        try {
          // Cerca ticket supporto esistente per questo utente
          const tickets = await api.support.getTicketsForUser(currentUser.id);
          const openTicket = tickets.find((t: any) => 
            t.status !== 'closed' && t.status !== 'resolved'
          ) || tickets[0]; // Prendi il più recente se non ce n'è uno aperto

          if (openTicket) {
            // Carica messaggi dal ticket
            const ticketData = await api.support.getTicketWithMessages(openTicket.id);
            
            if (ticketData && ticketData.messages.length > 0) {
              const formattedMsgs: ChatMessage[] = ticketData.messages
                .filter((m: any) => !m.is_internal) // Nascondi note interne all'utente
                .map((m: any) => ({
                  id: m.id,
                  from: m.sender_type === 'user' ? 'me' : 'contact',
                  text: m.message,
                  time: new Date(m.created_at).toLocaleTimeString("it-IT", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  senderType: m.sender_type,
                }));

              // Aggiungi welcome all'inizio
              const welcomeMsg: ChatMessage = {
                id: "support-welcome",
                from: "contact",
                text: "Ciao! 👋 Benvenuto nel supporto RentHubber.\n\nCome possiamo aiutarti oggi? Siamo qui per rispondere a qualsiasi domanda su:\n\n• Prenotazioni e pagamenti\n• Problemi con annunci\n• Contestazioni e rimborsi\n• Funzionalità della piattaforma\n\nScrivici pure!",
                time: "09:00",
              };
              setChatMessages([welcomeMsg, ...formattedMsgs]);
              
              // Segna come letto dall'utente
              await api.support.markAsReadByUser(openTicket.id);
              setSupportUnreadCount(0); // Reset badge
            } else {
              setChatMessages(supportMessages);
            }
          } else {
            // Nessun ticket, mostra welcome
            setChatMessages(supportMessages);
          }
        } catch (e) {
          console.warn('Errore caricamento messaggi supporto:', e);
          setChatMessages(supportMessages);
        }
      };

      loadSupportMessages();
      return;
    }

    // Se è una conversazione reale, carica messaggi da Supabase
    if (activeContact.isRealConversation) {
      const loadConversationMessages = async () => {
        try {
          const msgs = await api.messages.getMessagesForConversation(activeChatId, currentUser?.id);
          
          const conversationMessages = msgs.map((m: any) => {
  const isFromMe = m.fromUserId === currentUser?.id;
  const isSystem = m.fromUserId === "system" || m.isSystemMessage;
  const isAdmin = m.fromUserId === "admin" || m.isAdminMessage || m.senderType === "admin";

  return {
    id: m.id,
    from: isSystem ? "system" : (isFromMe ? "me" : "contact"),
    text: m.text,
    imageUrl: m.imageUrl,
    time: new Date(m.createdAt).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    isSystemMessage: isSystem,
    isAdminMessage: isAdmin,  // ✅ AGGIUNTO
    senderName: m.senderName || (isAdmin ? "Supporto RentHubber" : null),  // ✅ AGGIUNTO
  } as ChatMessage;
});

          setChatMessages(conversationMessages);
          
          // Segna messaggi come letti
          if (currentUser) {
            await api.messages.markAsRead(activeChatId, currentUser.id);
            // Aggiorna il contatore nella lista contatti
            setContacts(prev => prev.map(c => 
              c.id === activeChatId ? { ...c, unreadCount: 0 } : c
            ));
          }
        } catch (e) {
          console.warn('Errore caricamento messaggi:', e);
          setChatMessages([]);
        }
      };

      loadConversationMessages();
    } else {
      // Nessuna conversazione selezionata o contatto non trovato
      setChatMessages([]);
    }
  }, [activeChatId, currentUser, supportMessages]);

  // 📜 AUTO-SCROLL ai nuovi messaggi (scrolla il CONTENITORE, non la pagina)
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = async () => {
        if (!messageInput.trim()) {
            return;
    }

        try {
      const { cleaned, blockedContacts } = api.messages.sanitizeContent(
        messageInput,
        isBookingConfirmed
      ) as any;
      
            const rawText = cleaned || messageInput;
      const safeText = maskObfuscatedPhones(rawText);
      
            const now = new Date();
      const time = now.toLocaleTimeString("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const newMessage: ChatMessage = {
        id: `local-${now.getTime()}`,
        from: "me",
        text: safeText,
        time,
      };
      
            // ✅ Se è chat supporto, usa il sistema TICKET
            if (activeChatId === "support" && supportView === 'chat' && selectedTicketId) {
                setChatMessages(prev => [...prev, newMessage]);
        setMessageInput("");
        
        // Salva su Supabase tramite sistema ticket
        if (currentUser) {
          try {
            await api.support.sendUserMessage(selectedTicketId, currentUser.id, safeText);
            console.log('📧 Messaggio aggiunto al ticket:', selectedTicketId);
            
            // Ricarica ticket per aggiornare la lista
            await loadAllUserTickets();
          } catch (e) {
            console.error('❌ [SUPPORT] Errore salvataggio messaggio supporto:', e);
          }
        }
        
        return;
      }

            setChatMessages((prev) => [
        ...prev,
        newMessage,
      ]);
      
            // ✅ Se è conversazione reale, salva su Supabase
            if (activeContact?.isRealConversation && currentUser) {
                try {
                    const result = await api.messages.sendMessage({
            fromUserId: currentUser.id,
            toUserId: activeContact.contactId,
            text: safeText,
            listingId: activeContact.listingId,
            bookingId: activeContact.bookingId, // ✅ AGGIUNGO bookingId!
            hasConfirmedBooking: isBookingConfirmed, // ✅ Usa valore dinamico
            isSupport: false,
          });
          
                  } catch (e) {
                            }

        // Aggiorna preview conversazione locale (per UI immediata)
        const convRaw = localStorage.getItem("conversations");
        let convs = convRaw ? JSON.parse(convRaw) : [];
        convs = convs.map((c: any) => {
          if (c.id === activeChatId) {
            return {
              ...c,
              lastMessagePreview: safeText.slice(0, 80),
              lastMessageAt: now.toISOString(),
            };
          }
          return c;
        });
        localStorage.setItem("conversations", JSON.stringify(convs));

        // Aggiorna UI
        setContacts(prev => prev.map(c => {
          if (c.id === activeChatId) {
            return { ...c, lastMessage: safeText.slice(0, 80), lastMessageTime: "Ora" };
          }
          return c;
        }));
      }

      if (blockedContacts) {
        console.warn("Contatti bloccati nel messaggio, testo ripulito.");
      }

      setMessageInput("");
    } catch (err) {
      console.error("Errore durante l'invio del messaggio (UI locale):", err);
    }
  };

  const handleImageAttach = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    if (!isBookingConfirmed) return;

    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file as File);
    const now = new Date();
    const time = now.toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const tempId = `img-${now.getTime()}`;

    // 1) Mostra immagine locale immediatamente (UX veloce)
    setChatMessages((prev) => [
      ...prev,
      {
        id: tempId,
        from: "me",
        imageUrl: localUrl,
        time,
      },
    ]);

    e.target.value = "";

    // 2) Carica immagine su Supabase Storage e salva messaggio
    try {
      const { supabase } = await import('../lib/supabase');
      
      // Verifica/crea bucket images
      const { data: buckets } = await supabase.storage.listBuckets();
      const imagesBucket = buckets?.find((b) => b.name === 'images');
      if (!imagesBucket) {
        await supabase.storage.createBucket('images', { public: true });
      }
      
      // Crea nome file unico
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser?.id || 'user'}_${Date.now()}.${fileExt}`;
      const filePath = `chat-images/${fileName}`;

      // Upload su Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Errore upload immagine:', uploadError);
        return;
      }

      // Ottieni URL pubblico
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Salva messaggio nel database con immagine
      if (activeContact?.isRealConversation && currentUser) {
        const msgId = `msg-img-${Date.now()}`;
        await supabase.from("messages").insert({
          id: msgId,
          conversation_id: activeContact.id,
          from_user_id: currentUser.id,
          to_user_id: activeContact.contactId || null,
          text: '', // Messaggio vuoto, solo immagine
          image_url: publicUrl,
          created_at: now.toISOString(),
          read: false,
          flagged: false,
          is_support: false,
          is_admin_message: false,
        });

        // Aggiorna messaggio locale con URL reale
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? { ...msg, imageUrl: publicUrl, id: msgId }
              : msg
          )
        );
      }
    } catch (err) {
      console.error('Errore salvataggio immagine:', err);
      // L'immagine rimane visibile localmente anche se il salvataggio fallisce
    }
  };

  const handleDisputeImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const urls: string[] = Array.from(files).map((f: File) =>
      URL.createObjectURL(f)
    );

    setDisputeImages((prev) => [...prev, ...urls]);
    e.target.value = "";
  };

  const handleRefundDocumentUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRefundDocumentName(file.name);
    e.target.value = "";
  };

  const getStatusLabel = () => {
    const contact: any = activeContact;
    const isOnline = !!contact?.isOnline;
    const minutes = contact?.avgResponseMinutes as number | undefined;

    if (isOnline) {
      return {
        label: "Online",
        isOnline: true,
      };
    }

    if (!minutes || typeof minutes !== "number") {
      return {
        label: "Di solito risponde entro qualche ora",
        isOnline: false,
      };
    }

    if (minutes <= 60) {
      return {
        label: "Di solito risponde entro 1 ora",
        isOnline: false,
      };
    } else if (minutes <= 180) {
      return {
        label: "Di solito risponde entro 3 ore",
        isOnline: false,
      };
    } else if (minutes <= 1440) {
      return {
        label: "Di solito risponde entro 24 ore",
        isOnline: false,
      };
    } else {
      return {
        label: "Di solito risponde nell'arco di qualche giorno",
        isOnline: false,
      };
    }
  };

  const status = getStatusLabel();

  const phoneNumber =
    (activeContact as any)?.phoneNumber ||
    (activeContact as any)?.phone ||
    "";

  const activeBookingId =
    (activeContact as any)?.bookingId ||
    (activeContact as any)?.bookingCode ||
    null;

  const isSupportContact =
    (activeContact as any)?.isSupport ||
    /supporto\s*renthubber/i.test(activeContact.name || "");

  const resetDisputeState = () => {
    setDisputeStep(1);
    setDisputeReason("");
    setDisputeDetails("");
    setDisputeImages([]);
    setRefundAmount("");
    setRefundDocumentName("");
    setDisputeId(null);
    setDisputeRole("renter");
    setDisputeScope("object");
  };

  // 🔥 SALVATAGGIO DELLA CONTESTAZIONE (locale + Supabase)
  const handleConfirmDispute = async () => {
    if (!isBookingConfirmed) return;

    if (!refundAmount.trim()) {
      return;
    }

    try {
      const finalDisputeId = disputeId || generateDisputeId();
      const createdAtIso = new Date().toISOString();

      // 1) Prova a salvare su Supabase (non blocca l'utente se fallisce)
      try {
        await api.disputes.create({
          disputeId: finalDisputeId,
          contactId: activeContact.id,
          bookingId: activeBookingId,
          againstUserId: activeContact.contactId || activeContact.id,
          againstUserName: activeContact.name,
          openedByUserId: currentUser?.id || null,
          openedByRole: disputeRole,
          role: disputeRole,
          scope: disputeScope,
          reason: disputeReason || "Altro",
          details: disputeDetails,
          refundAmount,
          refundCurrency: "EUR",
          refundDocumentName,
          evidenceImages: disputeImages,
          status: "open",
          createdAt: createdAtIso,
        });
      } catch (err) {
        console.error("Errore Supabase durante salvataggio contestazione:", err);
        // Non blocchiamo: la contestazione esiste comunque nell'app
      }

      // 2) Salva messaggio PRIVATO della contestazione nel database
      try {
        const { supabase } = await import('../lib/supabase');
        const msgId = `msg-dispute-${Date.now()}`;
        const messageText = "Hai avviato una contestazione per questa prenotazione. Il team di supporto di Renthubber valuterà la situazione e proverà a trovare una soluzione tra le parti.";
        
        await supabase.from("messages").insert({
          id: msgId,
          conversation_id: activeContact.id,
          from_user_id: currentUser?.id || null,
          to_user_id: activeContact.contactId || null,
          text: messageText,
          created_at: createdAtIso,
          read: false,
          flagged: false,
          is_support: false,
          is_admin_message: false,
          private_to_sender: true, // ✅ Flag: visibile SOLO al mittente
        });
      } catch (err) {
        console.error("Errore salvataggio messaggio contestazione:", err);
        // Non blocchiamo: il messaggio verrà mostrato comunque localmente
      }

      // 3) Crea oggetto locale per la dashboard / stato interno
      const dispute = {
        id: finalDisputeId,
      } as Dispute;

      (dispute as any).disputeId = finalDisputeId;
      (dispute as any).contactId = activeContact.id;
      (dispute as any).createdAt = createdAtIso;
      (dispute as any).status = "open";
      (dispute as any).reason = disputeReason || "Altro";
      (dispute as any).details = disputeDetails;
      (dispute as any).evidenceImages = disputeImages;
      (dispute as any).refundAmount = refundAmount;
      (dispute as any).refundCurrency = "EUR";
      (dispute as any).refundDocumentName = refundDocumentName;
      (dispute as any).bookingId = activeBookingId;
      (dispute as any).againstUserId = activeContact.contactId || activeContact.id;
      (dispute as any).againstUserName = activeContact.name;
      (dispute as any).role = disputeRole;
      (dispute as any).scope = disputeScope;
      (dispute as any).openedByUserId = currentUser?.id ?? null;
      (dispute as any).openedByRole = disputeRole;

      onCreateDispute(dispute);

      // 4) Messaggio di conferma nella chat (locale per UI immediata)
      const now = new Date();
      const time = now.toLocaleTimeString("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
      });

      setChatMessages((prev) => [
        ...prev,
        {
          id: `dispute-${now.getTime()}`,
          from: "me",
          text:
            "Hai avviato una contestazione per questa prenotazione. " +
            "Il team di supporto di Renthubber valuterà la situazione e proverà a trovare una soluzione tra le parti.",
          time,
        },
      ]);

      setShowDisputeModal(false);
      resetDisputeState();
    } catch (err) {
      console.error("Errore durante conferma contestazione:", err);
    }
  };

  const steps = [
    { id: 1, label: "Motivo" },
    { id: 2, label: "Dettagli" },
    { id: 3, label: "Immagini" },
    { id: 4, label: "Rimborso" },
  ];

  // ✅ LOADING STATE
  if (isLoadingConversations) {
    return (
      <div className="h-[calc(100vh-64px)] bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto mb-3" />
          <p className="text-gray-500">Caricamento messaggi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] bg-white flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Contacts */}
<div className={`w-full md:w-80 lg:w-96 h-full border-r border-gray-200 bg-white flex flex-col ${ 
  showMobileList ? '' : 'hidden md:flex'
}`}>
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Messaggi</h2>
          {/* ✅ CONTATORE CONVERSAZIONI REALI */}
          {realConversationsCount > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {realConversationsCount} conversazion{realConversationsCount === 1 ? 'e' : 'i'} attiv{realConversationsCount === 1 ? 'a' : 'e'}
            </p>
          )}
        </div>
        
        {/* ✅ CARD SUPPORTO */}
        <div className="p-3 border-b border-gray-100">
          <div
            onClick={() => {
              setActiveChatId("support");
              setShowMobileList(false); // Mobile: apri chat
              setShowMenu(false);
              setShowPhoneInfo(false);
              setShowDisputeModal(false);
              resetDisputeState();
              // Segna come letto quando si apre la chat
              setSupportUnreadCount(0);
            }}
            className={`flex items-center p-3 rounded-xl cursor-pointer transition-all ${
              activeChatId === "support"
                ? "bg-brand text-white shadow-md"
                : "bg-gray-50 hover:bg-gray-100 text-gray-900"
            }`}
          >
            <div className="relative">
  <img 
    src={supportContact.avatar}
    alt="Supporto RentHubber"
    className="w-10 h-10 rounded-full object-cover"
  />
  {/* Badge messaggi non letti */}
  {supportUnreadCount > 0 && activeChatId !== "support" && (
    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
      {supportUnreadCount}
    </span>
  )}
            </div>
            <div className="ml-3 flex-1">
              <h4 className={`font-semibold text-sm ${activeChatId === "support" ? "text-white" : "text-gray-900"}`}>
                Supporto RentHubber
              </h4>
              <p className={`text-xs ${activeChatId === "support" ? "text-white/70" : "text-gray-500"}`}>
                Hai bisogno di aiuto? Scrivici!
              </p>
            </div>
          </div>
        </div>
        
        {/* ✅ TOGGLE ARCHIVIATE */}
        <div className="px-3 py-2 border-b border-gray-100">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Archive className="w-4 h-4" />
              {showArchived ? "Conversazioni archiviate" : "Tutte le conversazioni"}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showArchived ? "rotate-180" : ""}`} />
          </button>
          {showArchived && archivedContacts.length === 0 && (
            <p className="text-xs text-gray-400 mt-2 text-center">Nessuna conversazione archiviata</p>
          )}
        </div>
        
        <div className="overflow-y-auto flex-1">
          {/* Messaggio se non ci sono conversazioni */}
          {!showArchived && contacts.length === 0 && (
            <div className="p-4 text-center">
              <p className="text-gray-500 text-sm">Nessuna conversazione</p>
              <p className="text-gray-400 text-xs mt-1">Le conversazioni appariranno qui quando prenoterai o riceverai messaggi</p>
            </div>
          )}
          
          {(showArchived ? archivedContacts : contacts).map((contact) => (
            <div
              key={contact.id}
              onClick={async () => {
                console.log('🖱️ CLICK CONTATTO:', contact.name, contact.id);
                console.log('📱 showMobileList PRIMA:', showMobileList);
                setActiveChatId(contact.id);
                setShowMobileList(false);
                console.log('📱 showMobileList DOPO:', false);
                setTimeout(() => console.log('📱 showMobileList dopo 100ms:', showMobileList), 100);
                setShowMenu(false);
                setShowPhoneInfo(false);
                setShowDisputeModal(false);
                resetDisputeState();
                setContextMenuContactId(null);
                if (!showArchived) {
                  setContacts((prev) =>
                    prev.map((c) =>
                      c.id === contact.id ? { ...c, unreadCount: 0 } : c
                    )
                  );
                }

                // 🔔 Segna conversazione come letta nel DB
                if (contact.isRealConversation && currentUser) {
                  try {
                    const { supabase } = await import('../lib/supabase');
                    const field = currentUser.role === 'renter' || !currentUser.roles?.includes('hubber')
                      ? 'unread_for_renter'
                      : 'unread_for_hubber';
                    
                    await supabase
                      .from('conversations')
                      .update({ [field]: false })
                      .eq('id', contact.id);
                    
                    console.log('✅ Conversazione segnata come letta');
                    
                    // 🔔 Emetti evento per aggiornare badge immediatamente
                    window.dispatchEvent(new Event('unread-changed'));
                  } catch (err) {
                    console.error('Errore segnando come letta:', err);
                  }
                }
              }}
              className={`relative flex items-center p-4 cursor-pointer transition-colors ${
                activeChatId === contact.id
                  ? "bg-brand/5 border-l-4 border-brand"
                  : (contact as any).hasUnread 
                    ? "bg-gray-100 hover:bg-gray-150"  // Sfondo più scuro se non letta
                    : "hover:bg-gray-50"
              }`}
            >
              {/* Area contenuto */}
              <div className="flex items-center flex-1">
              <div className="relative">
                {hasRealAvatarUrl(contact.avatar) ? (
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                    {contact.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                {contact.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                    {contact.unreadCount}
                  </div>
                )}
                {/* ✅ BADGE VERDE PER CONVERSAZIONI REALI */}
                {contact.isRealConversation && !showArchived && (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white" title="Conversazione attiva"></div>
                )}
              </div>
              <div className="ml-3 flex-1 overflow-hidden">
                {/* ✅ LAYOUT AIRBNB: Nome persona + data */}
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-semibold text-gray-900 text-base">
                    {contact.name}
                  </h4>
                  <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                    {contact.lastMessageTime}
                  </span>
                </div>
                
                {/* Ultimo messaggio (preview) */}
                <p className="text-sm text-gray-600 line-clamp-2 mb-1 leading-tight">
                  {contact.lastMessage}
                </p>
                
                {/* ✅ Date + Nome annuncio (stile Airbnb) */}
                <p className="text-xs text-gray-500 truncate">
                  {(contact as any).bookingDates ? (
                    <>
                      {(contact as any).bookingDates}
                      {' • '}
                      {(contact as any).listingTitle || 'Annuncio'}
                    </>
                  ) : (
                    <>
                      {(contact as any).bookingNumber || 'Nuova prenotazione'}
                      {(contact as any).listingTitle && ` • ${(contact as any).listingTitle}`}
                    </>
                  )}
                </p>
              </div>
              </div>
              
              {/* ✅ MENU CONTESTUALE (solo per conversazioni reali) */}
              {contact.isRealConversation && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setContextMenuContactId(contextMenuContactId === contact.id ? null : contact.id);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                  
                  {contextMenuContactId === contact.id && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[160px]">
                      {showArchived ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnarchiveConversation(contact.id);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Ripristina
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchiveConversation(contact.id);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Archive className="w-4 h-4" />
                          Archivia
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(contact.id);
                          setContextMenuContactId(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Elimina
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ✅ MODAL CONFERMA ELIMINAZIONE */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminare conversazione?</h3>
            <p className="text-gray-600 text-sm mb-4">
              La conversazione verrà rimossa dalla tua lista. L'altro utente potrà ancora vederla.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={() => handleDeleteConversation(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div 
        className={`flex flex-1 flex-col bg-gray-50 relative ${
          showMobileList ? 'hidden md:flex' : 'flex'
        }`}
        onClick={() => setContextMenuContactId(null)}
      >
        {/* ✅ AREA SUPPORTO CON SISTEMA TICKET */}
        {activeChatId === "support" ? (
          <div className="flex flex-col h-full min-h-0">
            {/* Header Supporto */}
            <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center shadow-sm">
              {/* Bottone BACK mobile */}
              <button
                onClick={() => setShowMobileList(true)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors -ml-2 mr-2"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Supporto RentHubber</h3>
                  <p className="text-xs text-gray-500">
                    {supportView === 'list' && 'I tuoi ticket'}
                    {supportView === 'new' && 'Nuovo ticket'}
                    {supportView === 'chat' && 'Conversazione'}
                  </p>
                </div>
              </div>
              {supportView !== 'list' && (
                <button
                  onClick={() => {
                    setSupportView('list');
                    setSelectedTicketId(null);
                  }}
                  className="text-sm text-brand hover:underline"
                >
                  ← Torna alla lista
                </button>
              )}
            </div>

            {/* ✅ VISTA LISTA TICKET */}
            {supportView === 'list' && (
              <div className="flex-1 overflow-y-auto p-4">
                {/* Pulsante Nuovo Ticket */}
                <button
                  onClick={() => setSupportView('new')}
                  className="w-full mb-4 py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand/90 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="text-lg">+</span> Nuovo Ticket
                </button>

                {/* Filtri */}
                <div className="flex gap-2 mb-4">
                  {['all', 'open', 'closed'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTicketFilterStatus(filter as any)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        ticketFilterStatus === filter
                          ? 'bg-brand text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {filter === 'all' && 'Tutti'}
                      {filter === 'open' && 'Aperti'}
                      {filter === 'closed' && 'Chiusi'}
                    </button>
                  ))}
                </div>

                {/* Lista Ticket */}
                {allUserTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nessun ticket</p>
                    <p className="text-sm text-gray-400 mt-1">Crea un nuovo ticket per contattare il supporto</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allUserTickets
                      .filter(ticket => {
                        if (ticketFilterStatus === 'all') return true;
                        if (ticketFilterStatus === 'open') return !['closed', 'resolved'].includes(ticket.status);
                        return ['closed', 'resolved'].includes(ticket.status);
                      })
                      .map((ticket) => {
                        const category = SUPPORT_CATEGORIES.find(c => c.id === ticket.category);
                        const isOpen = !['closed', 'resolved'].includes(ticket.status);
                        const isWaiting = ticket.status === 'waiting_user';
                        
                        return (
                          <div
                            key={ticket.id}
                            onClick={() => handleOpenTicket(ticket.id)}
                            className={`p-4 bg-white rounded-xl border cursor-pointer hover:shadow-md transition-all ${
                              ticket.unread_by_user ? 'border-brand bg-brand/5' : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{category?.icon || '❓'}</span>
                                <span className="text-sm font-medium text-gray-600">{category?.label?.replace(category.icon + ' ', '') || 'Altro'}</span>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                isOpen 
                                  ? isWaiting 
                                    ? 'bg-yellow-100 text-yellow-700' 
                                    : 'bg-blue-100 text-blue-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {isOpen ? (isWaiting ? '🟡 In attesa' : '🔵 Aperto') : '🟢 Risolto'}
                              </span>
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-1">{ticket.subject}</h4>
                            {ticket.last_message_preview && (
                              <p className="text-sm text-gray-500 truncate">{ticket.last_message_preview}</p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-400">
                                #{ticket.ticket_number}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(ticket.updated_at || ticket.created_at).toLocaleDateString('it-IT', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </span>
                            </div>
                            {ticket.unread_by_user && (
                              <div className="mt-2 text-xs text-brand font-medium">● Nuova risposta</div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* ✅ VISTA NUOVO TICKET */}
            {supportView === 'new' && (
              <div className="flex-1 overflow-y-auto p-4 pb-32">
                <div className="max-w-lg mx-auto mb-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Crea un nuovo ticket</h3>
                  
                  {/* Seleziona Reparto */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Seleziona reparto *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {SUPPORT_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setNewTicketCategory(cat.id)}
                          className={`p-2 md:p-3 rounded-lg md:rounded-xl border text-left transition-all ${
                            newTicketCategory === cat.id
                              ? 'border-brand bg-brand/5 text-brand'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-base md:text-lg mr-1 md:mr-2">{cat.icon}</span>
                          <span className="text-xs md:text-sm">{cat.label.replace(cat.icon + ' ', '')}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Oggetto */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Oggetto *</label>
                    <input
                      type="text"
                      value={newTicketSubject}
                      onChange={(e) => setNewTicketSubject(e.target.value)}
                      placeholder="es. Problema con rimborso prenotazione #123"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand"
                      maxLength={100}
                    />
                  </div>

                  {/* Messaggio */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descrivi il problema *</label>
                    <textarea
                      value={newTicketMessage}
                      onChange={(e) => setNewTicketMessage(e.target.value)}
                      placeholder="Spiega nel dettaglio il problema o la tua richiesta..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand resize-none"
                    />
                  </div>

                  {/* Pulsante Invio */}
                  <button
                    onClick={handleCreateTicket}
                    disabled={!newTicketCategory || !newTicketSubject.trim() || !newTicketMessage.trim() || isCreatingTicket}
                    className="w-full py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isCreatingTicket ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Invio in corso...
                      </>
                    ) : (
                      'Invia Ticket'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ✅ VISTA CHAT TICKET */}
            {supportView === 'chat' && selectedTicketId && (
              <>
                {/* Info Ticket */}
                {(() => {
                  const ticket = allUserTickets.find(t => t.id === selectedTicketId);
                  const category = SUPPORT_CATEGORIES.find(c => c.id === ticket?.category);
                  return ticket ? (
                    <div className="bg-gray-100 px-4 py-2 border-b flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{category?.icon || '❓'}</span>
                        <span className="font-medium text-sm">{ticket.subject}</span>
                      </div>
                      <span className="text-xs text-gray-500">#{ticket.ticket_number}</span>
                    </div>
                  ) : null;
                })()}

                {/* Messaggi */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 pb-40 md:pb-4 space-y-4">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.from === "me" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                          message.from === "me"
                            ? "bg-brand text-white rounded-br-md"
                            : "bg-white border border-gray-200 rounded-bl-md"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                        <p className={`text-xs mt-1 ${message.from === "me" ? "text-white/70" : "text-gray-400"}`}>
                          {message.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input Messaggio (solo se ticket aperto) */}
                {(() => {
                  const ticket = allUserTickets.find(t => t.id === selectedTicketId);
                  const isClosed = ['closed', 'resolved'].includes(ticket?.status);
                  
                  if (isClosed) {
                    return (
                      <div className="p-4 bg-gray-100 text-center">
                        <p className="text-sm text-gray-500">Questo ticket è stato chiuso</p>
                        <button
                          onClick={() => setSupportView('new')}
                          className="mt-2 text-sm text-brand hover:underline"
                        >
                          Apri un nuovo ticket
                        </button>
                      </div>
                    );
                  }
                  
                  return (
                   <div className="fixed md:sticky bottom-16 md:bottom-0 left-0 right-0 md:left-auto md:right-auto p-4 bg-white border-t border-gray-200 z-10">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                          placeholder="Scrivi un messaggio..."
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand"
                        />
                        <button
                          onClick={handleSend}
                          disabled={!messageInput.trim()}
                          className="px-4 py-3 bg-brand text-white rounded-xl hover:bg-brand/90 disabled:opacity-50"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        ) : (
          /* ✅ CHAT NORMALE (NON SUPPORTO) */
          <div className="flex flex-col h-full min-h-0">
        {/* Chat Header */}
        <div className="sticky top-0 md:static bg-white p-4 border-b border-gray-200 flex justify-between items-center shadow-sm z-20">
          {/* Bottone BACK mobile */}
          <button
            onClick={() => setShowMobileList(true)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors -ml-2 mr-2"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex items-center">
            {hasRealAvatarUrl(activeContact.avatar) ? (
              <img
                src={activeContact.avatar}
                alt={activeContact.name}
                className="w-10 h-10 rounded-full object-cover mr-3"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm mr-3">
                {activeContact.name?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
            <div>
              <h3 className="font-bold text-gray-900">{activeContact.name}</h3>
              {activeContact?.isRealConversation && activeContact?.bookingId ? (
                <span className="text-xs text-gray-500">
                  Prenotazione #{activeContact.bookingId.slice(0, 8)}
                </span>
              ) : (
                <span
                  className={`text-xs flex items-center ${
                    status.isOnline ? "text-green-500" : "text-gray-500"
                  }`}
                >
                  <span
                    className={`mr-1 text-[10px] ${
                      status.isOnline ? "text-green-500" : "text-gray-400"
                    }`}
                  >
                    ●
                  </span>
                  {status.label}
                </span>
              )}
            </div>
          </div>
          
          {/* Menu azioni chat */}
          <div className="relative flex items-center space-x-4 text-gray-500">
            <button
              type="button"
              onClick={() => {
                setShowPhoneInfo((prev) => !prev);
                setShowMenu(false);
                setShowDisputeModal(false);
              }}
              className="relative"
            >
              <Phone className="w-5 h-5 cursor-pointer hover:text-brand" />
            </button>

            {showPhoneInfo && (
              <div className="absolute right-10 top-7 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 z-20 min-w-[200px]">
                {phoneNumber && isBookingConfirmed ? (
                  <a
                    href={`tel:${phoneNumber}`}
                    className="text-xs text-gray-800 hover:text-brand"
                  >
                    {phoneNumber}
                  </a>
                ) : (
                  <span className="text-xs text-gray-500">
                    Telefono non disponibile
                  </span>
                )}
              </div>
            )}

            <button
              type="button"
              className="relative"
              onClick={() => {
                setShowMenu((prev) => !prev);
                setShowPhoneInfo(false);
              }}
            >
              <MoreVertical className="w-5 h-5 cursor-pointer hover:text-brand" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-7 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-56 z-20">
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600"
                  onClick={() => {
                    setShowMenu(false);
                    setShowPhoneInfo(false);
                    setShowDisputeModal(true);
                    setDisputeStep(1);
                    setDisputeId(generateDisputeId());
                  }}
                >
                  Avvia una Contestazione
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Messages Feed */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 pt-0 pb-40 md:pb-6 space-y-4">
          {chatMessages.map((msg) =>
            // ✅ MESSAGGI DI SISTEMA (centrati, sfondo blu)
            msg.from === "system" || msg.isSystemMessage ? (
  <div key={msg.id} className="flex justify-center">
    <div className="px-4 py-1">
      <p className="text-xs text-gray-600 text-center whitespace-pre-line leading-tight">
        {msg.text}
      </p>
    </div>
  </div>
) : msg.from === "contact" ? (
              <div key={msg.id} className="flex items-end">
                {msg.isAdminMessage ? (
                  <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center mb-1 mr-2" title="Supporto RentHubber">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                ) : hasRealAvatarUrl(activeContact.avatar) ? (
                  <img
                    src={activeContact.avatar}
                    className="w-8 h-8 rounded-full object-cover mb-1 mr-2"
                    alt="avatar"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs mb-1 mr-2">
                    {activeContact.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-2 shadow-sm max-w-md">
                  {msg.isAdminMessage && (
                    <p className="text-xs font-semibold text-brand mb-1">Supporto RentHubber</p>
                  )}
                  {msg.imageUrl ? (
                    <img
                      src={msg.imageUrl}
                      alt="allegato"
                      className="max-w-[200px] rounded-2xl shadow-sm"
                    />
                  ) : (
                    <p className="text-sm text-gray-800">{msg.text}</p>
                  )}
                  <span className="text-[10px] text-gray-400 block text-right mt-1">
                    {msg.time}
                  </span>
                </div>
              </div>
            ) : (
              <div key={msg.id} className="flex items-end justify-end">
                <div className="bg-brand text-white rounded-2xl rounded-br-none px-4 py-2 shadow-md max-w-md">
                  {msg.imageUrl ? (
                    <img
                      src={msg.imageUrl}
                      alt="allegato"
                      className="max-w-[200px] rounded-2xl shadow-sm"
                    />
                  ) : (
                    <p className="text-sm">{msg.text}</p>
                  )}
                  <span className="text-[10px] text-brand-light block text-right mt-1">
                    {msg.time}
                  </span>
                </div>
              </div>
            )
          )}
        </div>

        {/* Input Area */}
        <div className="fixed md:sticky bottom-16 md:bottom-0 left-0 right-0 md:left-auto md:right-auto p-3 md:p-4 bg-white border-t border-gray-200 z-10">
          <div className="flex items-center bg-gray-100 rounded-full px-3 md:px-4 py-2">
            <label className="mr-2 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageAttach}
              />
              <ImageIcon className="w-5 h-5 text-gray-500 hover:text-brand" />
            </label>

            <input
              type="text"
              placeholder="Scrivi un messaggio..."
              className="flex-1 bg-transparent border-none text-sm py-2 focus:outline-none focus:ring-0 focus:border-none"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              onClick={handleSend}
              className="bg-brand text-white p-2 rounded-full hover:bg-brand-dark transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MODAL "Avvia una Contestazione" a STEP */}
        {showDisputeModal && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-30">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-4 md:p-6 mx-3 md:mx-0">
              {/* Header contestazione */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Avvia una Contestazione
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Prenotazione:{" "}
                    {activeBookingId ? `#${typeof activeBookingId === 'string' ? activeBookingId.slice(0, 8) : activeBookingId}` : "Non disponibile"}{" "}
                    ·{" "}
                    {isSupportContact ? (
                      <>
                        Gestita dal team di supporto{" "}
                        <span className="font-medium">Renthubber</span>
                      </>
                    ) : (
                      <>
                        Contro:{" "}
                        <span className="font-medium">
                          {activeContact.name}
                        </span>
                      </>
                    )}
                  </p>
                </div>
                {disputeId && (
                  <span className="text-[11px] text-gray-400 ml-4">
                    ID: {disputeId}
                  </span>
                )}
              </div>

              {/* Barra di avanzamento */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  {steps.map((step) => (
                    <div
                      key={step.id}
                      className="flex-1 flex flex-col items-center"
                    >
                      <div
                        className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold ${
                          disputeStep === step.id
                            ? "bg-brand text-white"
                            : disputeStep > step.id
                            ? "bg-brand/80 text-white"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {step.id}
                      </div>
                      <span className="mt-1 text-[10px] text-gray-500 uppercase tracking-wide">
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-1 bg-brand transition-all"
                    style={{ width: `${(disputeStep / steps.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* STEP 1 */}
              {disputeStep === 1 && (
                <>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Seleziona un motivo
                  </h4>

                  {/* Domande a sinistra, opzioni a destra */}
                  <div className="mb-3 grid grid-cols-1 md:grid-cols-2 gap-y-3 md:gap-x-4 items-center">
                    {/* Riga 1: domanda 1 + opzioni 1 */}
                    <div>
                      <span className="text-xs font-medium text-gray-700 block">
                        Stai inviando la contestazione come
                      </span>
                    </div>
                    <div className="flex md:justify-end">
                      <div className="inline-flex rounded-full bg-gray-100 p-1 text-xs gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setDisputeRole("renter");
                            setDisputeReason("");
                          }}
                          className={`px-3 py-1 rounded-full transition ${
                            disputeRole === "renter"
                              ? "bg-white text-brand shadow-sm"
                              : "text-gray-500"
                          }`}
                        >
                          Renter
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDisputeRole("hubber");
                            setDisputeReason("");
                          }}
                          className={`px-3 py-1 rounded-full transition ${
                            disputeRole === "hubber"
                              ? "bg-white text-brand shadow-sm"
                              : "text-gray-500"
                          }`}
                        >
                          Hubber
                        </button>
                      </div>
                    </div>

                    {/* Riga 2: domanda 2 + opzioni 2 */}
                    <div>
                      <span className="text-xs font-medium text-gray-700 block">
                        La contestazione riguarda
                      </span>
                    </div>
                    <div className="flex md:justify-end">
                      <div className="inline-flex rounded-full bg-gray-100 p-1 text-xs gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setDisputeScope("object");
                            setDisputeReason("");
                          }}
                          className={`px-3 py-1 rounded-full transition ${
                            disputeScope === "object"
                              ? "bg-white text-brand shadow-sm"
                              : "text-gray-500"
                          }`}
                        >
                          Oggetto
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDisputeScope("space");
                            setDisputeReason("");
                          }}
                          className={`px-3 py-1 rounded-full transition ${
                            disputeScope === "space"
                              ? "bg-white text-brand shadow-sm"
                              : "text-gray-500"
                          }`}
                        >
                          Spazio
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mb-4">
                    Scegli il motivo principale della contestazione. I motivi
                    cambiano automaticamente in base al tuo ruolo
                    (Renter/Hubber) e a ciò che stai contestando
                    (Oggetto/Spazio).
                  </p>

                  <label className="block mb-3">
                    <span className="text-xs font-medium text-gray-700">
                      Motivo principale
                    </span>
                    <select
                      className="mt-1 block w-full border border-gray-200 rounded-xl text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                    >
                      <option value="">Seleziona un motivo</option>
                      {disputeReasons.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}

              {/* STEP 2 */}
              {disputeStep === 2 && (
                <>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Aggiungi dettagli
                  </h4>
                  <p className="text-xs text-gray-500 mb-4">
                    Spiegaci cosa è successo. Più dettagli inserisci, più
                    semplice sarà per il team di supporto aiutarti.
                  </p>
                  <label className="block mb-4">
                    <span className="text-xs font-medium text-gray-700">
                      Descrivi l&apos;accaduto
                    </span>
                    <textarea
                      className="mt-1 block w-full border border-gray-200 rounded-xl text-sm px-3 py-2 h-32 resize-none focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
                      placeholder="Esempio: il trapano consegnato era diverso da quello in foto, mancavano alcuni accessori, l'orario di consegna non è stato rispettato..."
                      value={disputeDetails}
                      onChange={(e) => setDisputeDetails(e.target.value)}
                    />
                  </label>
                </>
              )}

              {/* STEP 3 */}
              {disputeStep === 3 && (
                <>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Allegare immagini (opzionale)
                  </h4>
                  <p className="text-xs text-gray-500 mb-4">
                    Puoi caricare foto che dimostrano il problema: condizioni
                    dell&apos;oggetto, stato dello spazio, ricevute, ecc.
                  </p>

                  <div className="mb-3">
                    <label className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-full text-xs cursor-pointer hover:bg-gray-50">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      <span>Carica immagini</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleDisputeImageUpload}
                      />
                    </label>
                  </div>

                  {disputeImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto mb-2">
                      {disputeImages.map((src, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={src}
                            alt={`evidenza-${idx}`}
                            className="w-full h-16 object-cover rounded-lg border border-gray-200"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {disputeImages.length === 0 && (
                    <p className="text-[11px] text-gray-400">
                      Nessuna immagine caricata. Puoi comunque procedere allo
                      step successivo.
                    </p>
                  )}
                </>
              )}

              {/* STEP 4 */}
              {disputeStep === 4 && (
                <>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Importo rimborso richiesto
                  </h4>
                  <p className="text-xs text-gray-500 mb-4">
                    Indica l&apos;importo che ritieni corretto come rimborso.
                    Se possibile, allega una fattura o uno scontrino collegato
                    al danno o al costo sostenuto.
                  </p>

                  <label className="block mb-3">
                    <span className="text-xs font-medium text-gray-700">
                      Importo rimborso richiesto (€)
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full border border-gray-200 rounded-xl text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
                      placeholder="Es. 50,00"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                    />
                  </label>

                  <div className="mb-1">
                    <span className="text-xs font-medium text-gray-700">
                      Allegare fattura o scontrino (opzionale)
                    </span>
                    <div className="mt-1 flex items-center justify-between">
                      <label className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-full text-xs cursor-pointer hover:bg-gray-50">
                        <span>Carica documento</span>
                        <input
                          type="file"
                          accept="application/pdf,image/*"
                          className="hidden"
                          onChange={handleRefundDocumentUpload}
                        />
                      </label>
                      {refundDocumentName && (
                        <span className="text-[11px] text-gray-500 ml-2 truncate max-w-[180px]">
                          {refundDocumentName}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Bottoni step */}
              <div className="flex justify-between items-center mt-5">
                <button
                  type="button"
                  className="text-sm px-4 py-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                  onClick={() => {
                    setShowDisputeModal(false);
                    resetDisputeState();
                  }}
                >
                  Annulla
                </button>

                <div className="flex space-x-2">
                  {disputeStep > 1 && (
                    <button
                      type="button"
                      className="text-sm px-4 py-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                      onClick={() =>
                        setDisputeStep((prev) => Math.max(1, prev - 1))
                      }
                    >
                      Indietro
                    </button>
                  )}

                  {disputeStep < 4 && (
                    <button
                      type="button"
                      className={`text-sm px-4 py-2 rounded-full ${
                        disputeStep === 1 && !disputeReason
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-red-600 text-white hover:bg-red-700"
                      }`}
                      disabled={disputeStep === 1 && !disputeReason}
                      onClick={() =>
                        setDisputeStep((prev) => Math.min(4, prev + 1))
                      }
                    >
                      Avanti
                    </button>
                  )}

                  {disputeStep === 4 && (
                    <button
                      type="button"
                      className={`text-sm px-4 py-2 rounded-full ${
                        !refundAmount.trim()
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-red-600 text-white hover:bg-red-700"
                      }`}
                      disabled={!refundAmount.trim()}
                      onClick={handleConfirmDispute}
                    >
                      Invia contestazione
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
          </div>
        )}
      </div>
    </div>
  );
};