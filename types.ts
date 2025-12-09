// TYPES - RENTHUBBER APP (VERSIONE COMPLETA 2025)

// CATEGORIE E STATI
export type ListingCategory = "oggetto" | "spazio";
export type ListingStatus = "draft" | "published" | "hidden" | "suspended";
export type Condition = "nuovo" | "come_nuovo" | "buono" | "usato" | "molto_usato";
export type CancellationPolicyType = "flexible" | "moderate" | "strict";
export type ActiveMode = "renter" | "hubber";

// --- SYSTEM CONFIGURATION ---
export interface FeeConfig {
  platformPercentage: number;
  renterPercentage: number;
  hubberPercentage: number;
  superHubberPercentage: number;
  fixedFeeEur: number;
}

export interface ReferralConfig {
  isActive: boolean;
  bonusAmount: number;
}

export interface PolicyRule {
  id: CancellationPolicyType;
  label: string;
  description: string;
  refundPercentage: number;
  cutoffHours: number;
  color: string;
}

export interface SuperHubberConfig {
  minRating: number;
  minResponseRate: number;
  maxCancellationRate: number;
  minHostingDays: number;
  requiredCriteriaCount: number;
}

export interface PageContent {
  id: string;
  slug: string;
  title: string;
  content: string;
  lastUpdated: string;
  position?: "header" | "footer_col1" | "footer_col2" | "legal";
  isHtml?: boolean;
}

export interface SiteBranding {
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  siteName: string;
}

export interface CmsConfig {
  branding: SiteBranding;
  pages: PageContent[];
}

export interface SystemConfig {
  fees: FeeConfig;
  referral: ReferralConfig;
  cancellationPolicies: PolicyRule[];
  completenessThreshold: number;
  superHubber: SuperHubberConfig;
  cms: CmsConfig;
}

// --- USER & BANK ---
export interface BankDetails {
  accountHolderName: string;
  accountHolderSurname: string;
  iban: string;
  bankName: string;
  bicSwift: string;
}

export type VerificationStatus = "unverified" | "partially_verified" | "verified";

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  rating: number;
  reviewCount?: number;
  isSuperHubber: boolean;
  role?: "renter" | "hubber" | "admin";
  roles: string[];
  hubberSince?: string;
  status?: "active" | "suspended" | "pending_verification";
  isSuspended?: boolean;
  
  // ✅ Commissione personalizzata per singolo utente
  customFeePercentage?: number;
  // Legacy field (manteniamo per retrocompatibilità)
  customCommissionRate?: number;
  
  address?: string;
  phoneNumber?: string;
  renterBalance: number;
  hubberBalance: number;
  referralCode: string;
  bankDetails?: BankDetails;

  bio?: string;
  languages?: string[];
  responseTime?: string;
  responseRate?: number;

  verifications?: {
    email: boolean;
    phone: boolean;
    identity: boolean;
  };

  emailVerified?: boolean;
  phoneVerified?: boolean;
  idDocumentVerified?: boolean;
  verificationStatus?: VerificationStatus;
  idDocumentUrl?: string;
  
  // ✅ Campi per nome/cognome separati e publicName
  firstName?: string;
  lastName?: string;
  publicName?: string;

  // ✅ Dati profilo fiscale
  userType?: 'privato' | 'ditta_individuale' | 'societa' | 'associazione';
  dateOfBirth?: string;
  
  // ✅ NUOVO: Campi per rating e statistiche Renter
  renterRating?: number;              // Rating come renter (da hubber)
  renterReviewCount?: number;         // Numero recensioni ricevute come renter
  completedBookingsCount?: number;    // Prenotazioni completate
  location?: string;                  // "Vive a..." per profilo pubblico
}

// =====================================================
// --- RECENSIONI (SISTEMA COMPLETO 2025) ---
// =====================================================

export type ReviewType = 'renter_to_hubber' | 'hubber_to_renter';
export type ReviewStatus = 'pending' | 'published' | 'hidden' | 'flagged';

export interface Review {
  
  // ✅ STRIPE CONNECT
  stripe_account_id?: string;
  stripe_onboarding_completed?: boolean;
  stripe_charges_enabled?: boolean;
  stripe_payouts_enabled?: boolean;
  id: string;
  bookingId: string;
  listingId?: string;
  
  // Chi scrive e chi riceve
  reviewerId: string;
  revieweeId: string;
  
  // Tipo
  reviewType: ReviewType;
  
  // Rating generale (1-5) - OBBLIGATORIO
  overallRating: number;
  
  // Rating specifici Renter → Hubber
  ratingAsDescribed?: number;      // Oggetto/Spazio come descritto
  ratingCommunication?: number;    // Comunicazione
  ratingPunctuality?: number;      // Puntualità (consegna/ritiro o check-in/out)
  ratingValue?: number;            // Rapporto qualità/prezzo
  
  // Rating specifici Hubber → Renter
  ratingRulesRespect?: number;     // Rispetto delle regole
  ratingItemCare?: number;         // Cura dell'oggetto/spazio
  
  // Contenuto
  comment: string;
  privateNote?: string;            // Nota privata (solo destinatario + admin)
  
  // Sistema blind Airbnb-style
  isPublic: boolean;
  publishedAt?: string;
  
  // Moderazione
  status: ReviewStatus;
  isFlagged: boolean;
  flagReason?: string;
  moderatedBy?: string;
  moderatedAt?: string;
  adminResponse?: string;
  
  // Timestamp
  createdAt: string;
  updatedAt?: string;
  
  // Dati aggiunti per UI (popolati dal JOIN)
  reviewerName?: string;
  reviewerAvatar?: string;
  revieweeName?: string;
  revieweeAvatar?: string;
  listingTitle?: string;
  
  // ✅ LEGACY: Campi per retrocompatibilità con vecchio sistema
  authorId?: string;      // Alias per reviewerId
  targetId?: string;      // Alias per revieweeId
  userName?: string;      // Alias per reviewerName
  rating?: number;        // Alias per overallRating
  date?: string;          // Alias per createdAt
  type?: ReviewType;      // Alias per reviewType
}

// Per la creazione di una nuova recensione
export interface CreateReviewInput {
  bookingId: string;
  listingId?: string;
  revieweeId: string;
  reviewType: ReviewType;
  
  overallRating: number;
  
  // Rating specifici (opzionali in base al tipo)
  ratingAsDescribed?: number;
  ratingCommunication?: number;
  ratingPunctuality?: number;
  ratingValue?: number;
  ratingRulesRespect?: number;
  ratingItemCare?: number;
  
  comment: string;
  privateNote?: string;
}

// Stato di eligibilità per recensire
export interface ReviewEligibility {
  bookingId: string;
  renterId: string;
  hubberId: string;
  endDate: string;
  bookingStatus: string;
  canReviewFrom: string;
  canReviewUntil: string;
  eligibilityStatus: 'too_early' | 'eligible' | 'expired' | 'invalid_status';
  renterReviewId?: string;
  hubberReviewId?: string;
}

// Review pair per sistema blind
export interface ReviewPair {
  id: string;
  bookingId: string;
  renterReviewId?: string;
  hubberReviewId?: string;
  renterSubmittedAt?: string;
  hubberSubmittedAt?: string;
  bothSubmitted: boolean;
  blindExpiresAt?: string;
  publishedAt?: string;
}

// Prenotazione eleggibile per recensione (per UI)
export interface EligibleBookingForReview {
  bookingId: string;
  listingId: string;
  listingTitle: string;
  listingImage?: string;
  otherUserId: string;
  otherUserName: string;
  reviewType: ReviewType;
  endDate: string;
  canReviewUntil: string;
}

// =====================================================
// --- FINE SISTEMA RECENSIONI ---
// =====================================================

// --- SPECIFICHE OGGETTI / SPAZI ---
export interface TechSpecs {
  brand?: string;
  model?: string;
  year?: string;
  condition?: Condition;
  wattage?: string;
  dimensions?: string;
  accessories?: string[];
  manualUrl?: string;
}

export interface SpaceSpecs {
  sqm?: number;
  floor?: number;
  capacity?: number;
  accessibility?: boolean;
  bathrooms?: number;
  layoutTypes?: string[];
}

// --- LISTING MODEL COMPLETO ---
export interface Listing {
  id: string;
  hostId: string; // 🔥 NECESSARIO per assegnare l'annuncio
  title: string;
  category: ListingCategory;
  subCategory: string;
  description: string;
  price: number;
  priceUnit: "ora" | "giorno" | "settimana" | "mese";
  images: string[];
  location: string;
  coordinates: { lat: number; lng: number };
  rating: number;
  reviewCount: number;
  reviews: Review[];
  owner?: User; // 🔥 RESO OPZIONALE per compatibilità
  features: string[];
  rules: string[];
  deposit?: number;
  status?: ListingStatus;
  cancellationPolicy?: CancellationPolicyType;
  techSpecs?: TechSpecs;
  spaceSpecs?: SpaceSpecs;
  minDuration?: number;
  maxDuration?: number;
  completenessScore?: number;
  privateAddress?: string;

  zoneDescription?: string;
  openingHours?: string;
  maxGuests?: number;
  manualBadges?: string[];
  hostRules?: string[];

  createdAt?: string; // 🔥 AGGIUNTO per ordinamento e compatibilità
  view_count?: number; // 🔥 CONTEGGIO VISUALIZZAZIONI REALI
}

// --- TRANSAZIONI ---
export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  type: "credit" | "debit";
  walletType?: "renter" | "hubber";
}

// --- PAGAMENTI HUBBER ---
export interface PayoutRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  iban: string;
  status: "pending" | "approved" | "rejected";
  date: string;
}

// --- MESSAGGI ---
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  read: boolean;
  imageUrl?: string;
}

export interface ChatContact {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  unreadCount: number;
  lastMessageTime: string;
  isSupport?: boolean;

  // extra usati nella Chat / Messages.tsx
  isOnline?: boolean;
  avgResponseMinutes?: number;
  phoneNumber?: string;
  phone?: string;
  bookingId?: string;
  bookingCode?: string;
}

// --- BOZZA ANNUNCIO ---
export interface ListingDraft {
  step: number;
  category: ListingCategory;
  title: string;
  subCategory: string;
  description: string;
  features: string;
  brand: string;
  model: string;
  condition: Condition;
  sqm: string;
  capacity: string;
  price: string;
  priceUnit: "ora" | "giorno";
  deposit: string;
  cancellationPolicy: CancellationPolicyType;
  location: string;
  images: string[];
}

// --- BOOKING REQUEST (UI / MOCK DASHBOARD) ---
export interface BookingRequest {
  // 🔹 campi core (DB / API) – già esistenti
  id: string;

  listingId: string;     // ID dell'annuncio
  renterId: string;      // chi prenota (renter)
  hubberId: string;      // proprietario annuncio (hubber)

  startDate: string;     // date ISO
  endDate: string;

  totalAmountCents: number;   // prezzo totale in centesimi

  status:
    | "pending"
    | "accepted"
    | "rejected"
    | "completed"
    | "confirmed"
    | "cancelled";

  paymentStatus: "paid" | "refunded" | "failed";

  stripePaymentIntentId?: string;

  createdAt: string;

  // 🔹 campi AGGIUNTIVI usati dalla UI dashboard (tutti opzionali)
  hostId?: string;          // alias per hubberId usato nella UI
  dates?: string;           // es. "10–12 Ott"

  listingTitle?: string;
  listingImage?: string;

  renterName?: string;
  renterAvatar?: string;

  timeLeft?: string;        // es. "2h 30m"

  totalPrice?: number;      // in euro (per tabelle UI)
  commission?: number;      // in euro
  netEarnings?: number;     // in euro

  // ✅ Flag recensioni
  renterHasReviewed?: boolean;
  hubberHasReviewed?: boolean;
  
  // ✅ NUOVO: Info per bottone recensione
  canReview?: boolean;
  canReviewUntil?: string;
}

// --- BOOKING (DB REALE - TABELLA bookings) ---
export interface Booking {
  id: string;
  renter_id: string;
  hubber_id: string;
  listing_id: string;
  start_date: string;          // ISO "YYYY-MM-DD"
  end_date: string;            // ISO "YYYY-MM-DD"
  amount_total: number;        // in euro (numeric)
  platform_fee: number;        // in euro
  hubber_net_amount: number;   // in euro
  wallet_used_cents: number;   // parte pagata con wallet (centesimi)
  status: string;              // es. "paid" | "cancelled"
  payment_id: string | null;
  created_at: string;
}

// --- FATTURE ---
export interface Invoice {
  id: string;
  number: string;
  hubberId: string;
  hubberName: string;
  period: string;
  date: string;
  amount: number;
  status: "paid" | "pending";
  downloadUrl: string;
}

// --- STATISTICHE ---
export interface DashboardStats {
  earningsMonth: number;
  activeBookings: number;
  views: number;
  responseRate: number;
}

// --- AUDIT LOG ---
export interface AuditLog {
  id: string;
  adminName: string;
  action: string;
  target: string;
  timestamp: string;
  details: string;
}

// --- DISPUTE (CONTESTAZIONI) ---
export type DisputeRole = "renter" | "hubber";
export type DisputeScope = "object" | "space";
export type DisputeStatus = "open" | "in_review" | "resolved" | "rejected";

export interface Dispute {
  // ID interni / pubblici
  id: string;           // ID interno (DB)
  disputeId: string;    // ID visibile (es. RH-DSP-...)

  // Collegamenti
  bookingId: string | null;
  listingId?: string | null;

  // Chi apre e contro chi
  openedByUserId?: string;       // lo popoli lato backend o nel parent
  openedByRole?: DisputeRole;    // ruolo di chi apre (renter / hubber)

  againstUserId: string;
  againstUserName?: string;

  // Contesto
  role: DisputeRole;             // ruolo nel contesto UI (renter/hubber)
  scope: DisputeScope;           // object | space

  // Contenuto contestazione (nuovo modello)
  reason: string;                // es. "danni_oggetto"
  details: string;
  evidenceImages: string[];      // URL (anche temporanei) immagini allegate

  refundAmount: string;          // es. "50.00" (string per UI)
  refundCurrency?: string;       // default "EUR"
  refundDocumentName?: string;
  refundDocumentUrl?: string;

  // Stato e gestione
  status: DisputeStatus;
  resolutionNotes?: string | null;

  // Tracking temporale
  createdAt: string;             // ISO
  updatedAt?: string;            // ISO

  // Eventuale history messaggi legata alla contestazione
  messages?: Message[];

  // 🔥 CAMPI LEGACY USATI NELLA UI ADMIN (OPTIONAL, PER NON ROMPERE NULLA)
  reporterName?: string;   // nome di chi segnala (per tabella admin)
  targetName?: string;     // nome dell'altro utente / spazio
  type?: string;           // es. "damage", "scam" (vecchio campo generico)
  description?: string;    // descrizione breve mostrata in lista
  date?: string;           // data leggibile "2023-10-26"
}

// --- REPORT ---
export interface Report {
  id: string;
  type: "listing" | "user" | "review";
  targetId: string;
  reporterName: string;
  reason: string;
  status: "open" | "resolved";
  date: string;
}