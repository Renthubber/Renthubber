import { 
  Listing, 
  Transaction, 
  ChatContact, 
  User, 
  SystemConfig, 
  AuditLog, 
  Dispute, 
  Review, 
  BookingRequest, 
  Invoice 
} from './types';

// --- SYSTEM CONFIGURATION DEFAULTS ---
export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  fees: {
    platformPercentage: 10, 
    renterPercentage: 10,   
    hubberPercentage: 10,   
    superHubberPercentage: 5, 
    fixedFeeEur: 2.00,
  },
  referral: {
    isActive: true,
    bonusAmount: 10.00, 
  },
  cancellationPolicies: [
    { 
      id: 'flexible', 
      label: 'Flessibile', 
      description: 'Rimborso 100% fino a 24 ore prima.', 
      refundPercentage: 100, 
      cutoffHours: 24,
      color: 'green'
    },
    { 
      id: 'moderate', 
      label: 'Moderata', 
      description: 'Rimborso 100% fino a 5 giorni prima.', 
      refundPercentage: 100, 
      cutoffHours: 120,
      color: 'yellow'
    },
    { 
      id: 'strict', 
      label: 'Rigida', 
      description: 'Rimborso 50% fino a 7 giorni prima.', 
      refundPercentage: 50, 
      cutoffHours: 168,
      color: 'red'
    }
  ],
  completenessThreshold: 70,
  superHubber: {
    minRating: 4.7,
    minResponseRate: 90,       
    maxCancellationRate: 1.0,  
    minHostingDays: 90,        
    requiredCriteriaCount: 3   
  },
  cms: {
    branding: {
      siteName: 'Renthubber',
      logoUrl: '',
      faviconUrl: '',
      primaryColor: '#0D414B'
    },
    pages: [
      { id: 'p1', slug: 'about', title: 'Chi Siamo', content: 'Siamo la piattaforma leader nel noleggio...', lastUpdated: '2023-10-01', position: 'footer_col1', isHtml: false },
      { id: 'p2', slug: 'terms', title: 'Termini e Condizioni', content: 'L\'uso della piattaforma implica l\'accettazione...', lastUpdated: '2023-09-15', position: 'legal', isHtml: false },
      { id: 'p3', slug: 'privacy', title: 'Privacy Policy', content: 'I tuoi dati sono al sicuro con noi...', lastUpdated: '2023-09-15', position: 'legal', isHtml: false },
      { id: 'p4', slug: 'help', title: 'Centro Assistenza', content: 'Come possiamo aiutarti oggi?', lastUpdated: '2023-10-20', position: 'header', isHtml: false }
    ]
  }
};

// --- USERS ---

export const DEMO_RENTER: User = {
  id: 'renter1',
  name: 'Mario Rossi',
  email: 'mario.renter@demo.com',
  avatar: 'https://ui-avatars.com/api/?name=Mario+Rossi&background=random',
  rating: 4.5,
  isSuperHubber: false,
  role: 'renter',
  roles: ['renter'], 
  status: 'active',
  isSuspended: false,
  renterBalance: 45.50, 
  hubberBalance: 0, 
  referralCode: 'MARIO24',
  emailVerified: true,
  phoneVerified: true,
  idDocumentVerified: false,
  verificationStatus: 'partially_verified'
};

export const DEMO_HUBBER: User = {
  id: 'hubber1',
  name: 'Giulia Bianchi',
  email: 'giulia.hubber@demo.com',
  avatar: 'https://ui-avatars.com/api/?name=Giulia+Bianchi&background=random',
  rating: 5.0,
  reviewCount: 156,
  isSuperHubber: true,
  role: 'hubber',
  roles: ['renter', 'hubber'], 
  status: 'active',
  isSuspended: false,
  renterBalance: 10.00, 
  hubberBalance: 1240.50, 
  referralCode: 'GIULIAVIP',
  hubberSince: '2021-05-15T10:00:00Z',
  bio: "Ciao! Sono Giulia, architetto e appassionata di fotografia. Amo condividere i miei spazi e la mia attrezzatura con creativi e professionisti. Sono precisa, puntuale e tengo molto alla cura dei miei oggetti.",
  languages: ['Italiano', 'Inglese', 'Spagnolo'],
  responseTime: 'entro un\'ora',
  responseRate: 98,
  verifications: {
    email: true,
    phone: true,
    identity: true
  },
  emailVerified: true,
  phoneVerified: true,
  idDocumentVerified: true,
  verificationStatus: 'verified',
  idDocumentUrl: 'https://via.placeholder.com/600x400?text=Carta+Identita+Giulia',
  bankDetails: {
    accountHolderName: 'Giulia',
    accountHolderSurname: 'Bianchi',
    iban: 'IT60X0542811101000000123456',
    bankName: 'Intesa Sanpaolo',
    bicSwift: 'BCITITMM'
  }
};

export const DEMO_ADMIN: User = {
  id: 'admin1',
  name: 'Admin System',
  email: 'admin@renthubber.com',
  avatar: 'https://ui-avatars.com/api/?name=Admin+System&background=000&color=fff',
  rating: 5.0,
  isSuperHubber: false,
  role: 'admin',
  roles: ['admin', 'renter', 'hubber'], 
  status: 'active',
  isSuspended: false,
  renterBalance: 0,
  hubberBalance: 0,
  referralCode: 'ADMIN',
  emailVerified: true,
  phoneVerified: true,
  idDocumentVerified: true,
  verificationStatus: 'verified'
};

// 👇 AGGIUNTA IMPORTANTE PER IL PANNELLO ADMIN
export const MOCK_USERS: User[] = [DEMO_ADMIN, DEMO_HUBBER, DEMO_RENTER];

// --- MOCK DATA ---

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 'log1', adminName: 'Admin System', action: 'Update Fee', target: 'Global', timestamp: '2023-10-25 10:30', details: 'Commissioni portate al 10%' },
  { id: 'log2', adminName: 'Admin System', action: 'Ban User', target: 'user_x99', timestamp: '2023-10-24 14:15', details: 'Violazione termini ripetuta' },
  { id: 'log3', adminName: 'Moderator A', action: 'Suspend Listing', target: 'listing_3', timestamp: '2023-10-23 09:00', details: 'Foto non conformi' },
];

export const MOCK_DISPUTES: Dispute[] = [
];

export const MOCK_REVIEWS: Review[] = [
  { id: 'r1', authorId: 'renter1', targetId: 'hubber1', bookingId: 'br3', userName: 'Mario Rossi', rating: 5, comment: 'Tutto perfetto!', date: '2023-10-15', status: 'published', type: 'renter_to_hubber' },
  { id: 'r2', authorId: 'hubber1', targetId: 'renter1', bookingId: 'br3', userName: 'Giulia Bianchi', rating: 4, comment: 'Ottimo renter.', date: '2023-10-15', status: 'published', type: 'hubber_to_renter' },
];

export const MOCK_LISTINGS: Listing[] = [
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', date: '2023-10-24', amount: 45.00, description: 'Noleggio Sony Alpha', type: 'debit', walletType: 'renter' },
  { id: 't2', date: '2023-10-20', amount: 120.00, description: 'Incasso Loft Eventi', type: 'credit', walletType: 'hubber' },
  { id: 't3', date: '2023-10-15', amount: 10.00, description: 'Bonus Invito Amico', type: 'credit', walletType: 'renter' },
  { id: 't4', date: '2023-10-10', amount: 250.00, description: 'Prelievo su IBAN', type: 'debit', walletType: 'hubber' },
];

export const MOCK_CONTACTS: ChatContact[] = [
  { id: 'support', name: 'Supporto Renthubber', avatar: 'https://ui-avatars.com/api/?name=Renthubber&background=0D414B&color=fff', lastMessage: 'Come possiamo aiutarti oggi?', unreadCount: 0, lastMessageTime: 'Adesso', isSupport: true },
  { id: 'c1', name: 'Marco Rossi', avatar: 'https://ui-avatars.com/api/?name=Marco+Rossi', lastMessage: 'Ciao, il trapano è disponibile per domani?', unreadCount: 1, lastMessageTime: '10:30' },
  { id: 'c2', name: 'Giulia Bianchi', avatar: 'https://ui-avatars.com/api/?name=Giulia+Bianchi', lastMessage: 'Grazie per aver lasciato il loft in ordine!', unreadCount: 0, lastMessageTime: 'Ieri' },
];

// --- BOOKING REQUESTS (Enriched) ---
export const MOCK_REQUESTS: BookingRequest[] = [
  {
    id: 'br1',

    // campi core richiesti da BookingRequest
    listingId: 'listing1',
    renterId: 'renter99',
    hubberId: 'hubber1',
    startDate: '2023-10-24',
    endDate: '2023-10-26',
    totalAmountCents: 4500,
    status: 'pending',
    paymentStatus: 'paid',
    stripePaymentIntentId: 'pi_mock_br1',
    createdAt: '2023-10-20T10:00:00Z',

    // campi UI extra
    hostId: 'hubber1',
    listingTitle: 'Trapano Bosch Professional',
    listingImage: 'https://picsum.photos/200/200?random=1',
    renterName: 'Luca Bianchi',
    renterAvatar: 'https://i.pravatar.cc/150?u=luca',
    dates: '24 Ott - 26 Ott',
    totalPrice: 45,
    commission: 4.5,
    netEarnings: 40.5,
    timeLeft: '3 ore'
  },
  {
    id: 'br2',

    listingId: 'listing2',
    renterId: 'renter98',
    hubberId: 'hubber1',
    startDate: '2023-11-10',
    endDate: '2023-11-10',
    totalAmountCents: 35000,
    status: 'pending',
    paymentStatus: 'paid',
    stripePaymentIntentId: 'pi_mock_br2',
    createdAt: '2023-10-25T09:00:00Z',

    hostId: 'hubber1',
    listingTitle: 'Loft Open Space',
    listingImage: 'https://picsum.photos/200/200?random=3',
    renterName: 'Anna Verdi',
    renterAvatar: 'https://i.pravatar.cc/150?u=anna',
    dates: '10 Nov',
    totalPrice: 350,
    commission: 35,
    netEarnings: 315,
    timeLeft: '12 ore'
  },
  {
    id: 'br3',

    listingId: 'listing1',
    renterId: 'renter1',
    hubberId: 'hubber1',
    startDate: '2023-10-12',
    endDate: '2023-10-14',
    totalAmountCents: 3000,
    status: 'completed',
    paymentStatus: 'paid',
    stripePaymentIntentId: 'pi_mock_br3',
    createdAt: '2023-10-12T08:00:00Z',

    hostId: 'hubber1',
    listingTitle: 'Trapano Bosch Professional',
    listingImage: 'https://picsum.photos/200/200?random=1',
    renterName: 'Marco Rossi',
    renterAvatar: 'https://i.pravatar.cc/150?u=marco',
    dates: '12 Ott - 14 Ott',
    totalPrice: 30,
    commission: 3,
    netEarnings: 27,
    timeLeft: '-'
  }
];

// --- NEW: MOCK INVOICES ---
export const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv1',
    number: 'INV-2023-001',
    hubberId: 'hubber1',
    hubberName: 'Giulia Bianchi',
    period: 'Settembre 2023',
    date: '2023-10-01',
    amount: 125.50,
    status: 'paid',
    downloadUrl: '#'
  },
  {
    id: 'inv2',
    number: 'INV-2023-002',
    hubberId: 'hubber1',
    hubberName: 'Giulia Bianchi',
    period: 'Ottobre 2023',
    date: '2023-11-01',
    amount: 84.00,
    status: 'paid',
    downloadUrl: '#'
  }
];
