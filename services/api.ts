import {
  User,
  Listing,
  BookingRequest,
  Booking,
  Transaction,
  PayoutRequest,
  Invoice,
  Review,
  Dispute,
  PageContent,
} from "../types";
import {
  MOCK_LISTINGS,
  MOCK_REQUESTS,
  MOCK_TRANSACTIONS,
  MOCK_INVOICES,
  MOCK_REVIEWS,
  MOCK_DISPUTES,
} from "../constants";
import { supabase } from "../lib/supabase";

/* ------------------------------------------------------
   HELPER: conversione centesimi <-> euro (NUOVO)
-------------------------------------------------------*/
const toCents = (amount: number) => Math.round(amount * 100);
const fromCents = (amountCents: number | null | undefined) =>
  (amountCents ?? 0) / 100;

/* ------------------------------------------------------
   HELPER: mapping Supabase (users) -> User (per utente loggato)
-------------------------------------------------------*/
const mapSupabaseUserToAppUser = (sbUser: any, authUser: any): User => {

  // 1) Ricavo nome e cognome dalle colonne che usi sul DB
  const rawName: string | undefined = sbUser.name || undefined;
  const firstNameFromDb: string | undefined = sbUser.first_name || sbUser.firstName;
  const lastNameFromDb: string | undefined = sbUser.last_name || sbUser.lastName;

  let firstName = firstNameFromDb || "";
  let lastName = lastNameFromDb || "";

  // Se non ho first/last separati ma solo "name", provo a splittare
  if (!firstName && rawName) {
    const parts = rawName.trim().split(" ");
    firstName = parts[0] || "";
    lastName = parts.slice(1).join(" ") || "";
  }

  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const fallbackName = authUser.email?.split("@")[0] || "Utente";
  const finalName = fullName || rawName || fallbackName;

  // ✅ public_name dal DB (generato dal trigger)
  const publicName = sbUser.public_name || 
    (firstName ? `${firstName} ${lastName ? lastName.charAt(0) + '.' : ''}`.trim() : finalName);

 return {
    id: sbUser.id || authUser.id,
    email: sbUser.email || authUser.email,
    name: finalName,
    firstName,      // ✅ AGGIUNTO
    lastName,       // ✅ AGGIUNTO
    publicName,     // ✅ AGGIUNTO

    avatar:
      sbUser.avatar_url ||
      `https://ui-avatars.com/api/?name=${
        encodeURIComponent(finalName || "User")
      }&background=random`,

    role: sbUser.role || "renter",
    roles: sbUser.roles || [sbUser.role || "renter"],

    rating: sbUser.rating || 0,
    isSuperHubber: sbUser.is_super_hubber || false,
    status: sbUser.status || "active",
    isSuspended: sbUser.is_suspended || false,
    renterBalance: sbUser.renter_balance || 0,
    hubberBalance: sbUser.hubber_balance || 0,
    referralCode: sbUser.referral_code || "",

    hubberSince: sbUser.hubber_since,

    emailVerified: !!authUser.email_confirmed_at || sbUser.email_verified,
    phoneVerified: sbUser.phone_verified || false,
    idDocumentVerified: sbUser.id_document_verified || false,
    verificationStatus: sbUser.verification_status || "unverified",

    address: sbUser.address,
    phoneNumber: sbUser.phone_number,
    bio: sbUser.bio,
    bankDetails: sbUser.bank_details,

    idDocumentUrl: sbUser.document_front_url,
    
    // ✅ DATI PROFILO
    userType: sbUser.user_type || 'privato',
    dateOfBirth: sbUser.date_of_birth || undefined,
  };
};

/* ------------------------------------------------------
   HELPER: mapping riga "users" -> User (per PANNELLO ADMIN)
-------------------------------------------------------*/
const mapDbUserToAppUser = (row: any): User => {
  // 🔹 Ricavo nome e cognome in modo "intelligente"
  const rawFirstName =
    row.first_name ||
    (row.name ? String(row.name).split(" ")[0] : "") ||
    "";

  const rawLastName =
    row.last_name ||
    (row.name ? String(row.name).split(" ").slice(1).join(" ") : "") ||
    "";

  const fallbackFromEmail = row.email?.split("@")[0] || "Utente";

  // Nome visualizzato interno all'app (Dashboard, Admin, ecc.)
  const displayName =
    (rawFirstName || rawLastName)
      ? `${rawFirstName} ${rawLastName}`.trim()
      : row.name || fallbackFromEmail;

  // Nome usato per generare l'avatar di default
  const avatarBaseName =
    rawFirstName ||
    row.name ||
    row.email ||
    "User";

  // ✅ public_name dal DB (generato dal trigger)
  const publicName = row.public_name || 
    (rawFirstName ? `${rawFirstName} ${rawLastName ? rawLastName.charAt(0) + '.' : ''}`.trim() : displayName);

  return {
    id: row.id,
    email: row.email,
    name: displayName,
    firstName: rawFirstName,   // ✅ AGGIUNTO
    lastName: rawLastName,     // ✅ AGGIUNTO
    publicName,                // ✅ AGGIUNTO
    avatar:
      row.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        avatarBaseName
      )}&background=random`,

    role: row.role || "renter",
    roles: row.roles || [row.role || "renter"],

    rating: row.rating || 0,
    isSuperHubber: row.is_super_hubber || false,
    status: row.status || "active",
    isSuspended: row.is_suspended || false,
    renterBalance: row.renter_balance || 0,
    hubberBalance: row.hubber_balance || 0,
    referralCode: row.referral_code || "",

    hubberSince: row.hubber_since || undefined,

    emailVerified: !!row.email_verified,
    phoneVerified: !!row.phone_verified,
    idDocumentVerified: !!row.id_document_verified,
    verificationStatus: row.verification_status || "unverified",

    address: row.address || undefined,
    phoneNumber: row.phone_number || undefined,
    bio: row.bio || undefined,
    bankDetails: row.bank_details || undefined,

    idDocumentUrl: row.document_front_url || undefined,
    
    // ✅ DATI PROFILO
    userType: row.user_type || 'privato',
    dateOfBirth: row.date_of_birth || undefined,
  };
};

/* ------------------------------------------------------
   HELPER: mapping Supabase (booking_requests) -> BookingRequest
-------------------------------------------------------*/

const mapBookingRowToRequest = (row: any): BookingRequest => {
  return {
    id: row.id,
    listingId: row.listing_id,
    renterId: row.renter_id,
    hubberId: row.hubber_id,
    startDate: row.start_date,
    endDate: row.end_date,
    totalAmountCents: row.total_amount_cents,
    status: row.status,
    paymentStatus: row.payment_status,
    stripePaymentIntentId: row.stripe_payment_intent_id || undefined,
    createdAt: row.created_at,
  };
};

/* ------------------------------------------------------
   CREA PRENOTAZIONE DOPO PAGAMENTO + CONVERSAZIONE
-------------------------------------------------------*/
async function createBookingAfterPayment(params: {
  listingId: string;
  renterId: string;
  hubberId: string;
  startDate: string;
  endDate: string;
  totalAmountCents: number;
  stripePaymentIntentId?: string;
  listingTitle?: string;
}): Promise<BookingRequest> {
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      listing_id: params.listingId,
      renter_id: params.renterId,
      hubber_id: params.hubberId,
      start_date: params.startDate,
      end_date: params.endDate,
      total_amount_cents: params.totalAmountCents,
      status: "confirmed",
      payment_status: "paid",
      stripe_payment_intent_id: params.stripePaymentIntentId ?? null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Errore createBookingAfterPayment", error);
    throw error;
  }

  const booking = mapBookingRowToRequest(data);

  // ✅ CREA CONVERSAZIONE AUTOMATICA TRA RENTER E HUBBER
  try {
    await createBookingConversation({
      bookingId: booking.id,
      renterId: params.renterId,
      hubberId: params.hubberId,
      listingId: params.listingId,
      listingTitle: params.listingTitle || "il tuo annuncio",
      startDate: params.startDate,
      endDate: params.endDate,
    });
    console.log("✅ Conversazione prenotazione creata");
  } catch (convError) {
    console.warn("⚠️ Errore creazione conversazione (non bloccante):", convError);
  }

  return booking;
}

/* ------------------------------------------------------
   CREA CONVERSAZIONE PER PRENOTAZIONE
-------------------------------------------------------*/
async function createBookingConversation(params: {
  bookingId: string;
  renterId: string;
  hubberId: string;
  listingId: string;
  listingTitle: string;
  startDate: string;
  endDate: string;
}): Promise<void> {
  const { bookingId, renterId, hubberId, listingId, listingTitle, startDate, endDate } = params;
  
  const now = new Date().toISOString();
  const conversationId = `conv-booking-${bookingId}`;
  
  // Formatta le date per il messaggio
  const startFormatted = new Date(startDate).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const endFormatted = new Date(endDate).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Messaggio di sistema per la prenotazione
  const systemMessage = `🎉 Prenotazione confermata!\n\n` +
    `Oggetto: ${listingTitle}\n` +
    `📅 Dal ${startFormatted} al ${endFormatted}\n\n` +
    `Questa chat è dedicata alla vostra prenotazione. ` +
    `Potete usarla per coordinarvi su ritiro, consegna e qualsiasi altra informazione.\n\n` +
    `⚠️ Ricorda: i contatti personali (telefono, email, social) possono essere scambiati solo dopo la conferma della prenotazione.`;

  // Crea conversazione
  const conversation = {
    id: conversationId,
    renterId,
    hubberId,
    listingId,
    bookingId,
    isSupport: false,
    lastMessagePreview: "🎉 Prenotazione confermata!",
    lastMessageAt: now,
    unreadForRenter: false,
    unreadForHubber: true,
  };

  // Messaggio iniziale (dal sistema)
  const message = {
    id: `msg-system-${bookingId}`,
    conversationId,
    fromUserId: "system",
    toUserId: hubberId, // Il messaggio è "per" l'hubber ma visibile a entrambi
    text: systemMessage,
    createdAt: now,
    isSystemMessage: true,
    hasConfirmedBooking: true,
    isSupport: false,
  };

  // Salva in localStorage (per compatibilità)
  const convRaw = localStorage.getItem("conversations");
  let conversations = convRaw ? JSON.parse(convRaw) : [];
  
  // Evita duplicati
  const existingIndex = conversations.findIndex((c: any) => c.id === conversationId);
  if (existingIndex >= 0) {
    conversations[existingIndex] = conversation;
  } else {
    conversations = [conversation, ...conversations];
  }
  localStorage.setItem("conversations", JSON.stringify(conversations));

  const msgRaw = localStorage.getItem("messages");
  let messages = msgRaw ? JSON.parse(msgRaw) : [];
  
  // Evita duplicati
  if (!messages.find((m: any) => m.id === message.id)) {
    messages = [message, ...messages];
  }
  localStorage.setItem("messages", JSON.stringify(messages));

  // ✅ Salva anche su Supabase (sync)
  try {
    await supabase.from("conversations").upsert(
      {
        id: conversationId,
        renter_id: renterId,
        hubber_id: hubberId,
        listing_id: listingId,
        booking_id: bookingId,
        is_support: false,
        last_message_preview: "🎉 Prenotazione confermata!",
        last_message_at: now,
      },
      { onConflict: "id" }
    );

    // Per i messaggi di sistema, usiamo l'hubber come from_user_id ma con flag is_system_message
    await supabase.from("messages").upsert(
      {
        id: message.id,
        conversation_id: conversationId,
        from_user_id: hubberId, // Usiamo hubberId come "mittente" tecnico
        to_user_id: renterId,   // Destinatario è il renter
        text: systemMessage,
        created_at: now,
        is_system_message: true,
        read: false,
      },
      { onConflict: "id" }
    );
  } catch (e) {
    console.warn("Errore sync conversazione Supabase (ignoro):", e);
  }
}

/**
 * ✅ INVIA MESSAGGIO DI SISTEMA A UNA CONVERSAZIONE ESISTENTE
 * Usato per notificare cancellazioni, modifiche, ecc.
 */
async function sendBookingSystemMessage(params: {
  bookingId: string;
  messageText: string;
}): Promise<void> {
  const { bookingId, messageText } = params;
  const conversationId = `conv-booking-${bookingId}`;
  const now = new Date().toISOString();
  const messageId = `msg-system-${Date.now()}`;

  // Aggiorna localStorage
  const msgRaw = localStorage.getItem("messages");
  let messages = msgRaw ? JSON.parse(msgRaw) : [];
  
  const newMessage = {
    id: messageId,
    conversationId,
    fromUserId: "system",
    text: messageText,
    createdAt: now,
    isSystemMessage: true,
    hasConfirmedBooking: true,
    isSupport: false,
  };
  
  messages.push(newMessage);
  localStorage.setItem("messages", JSON.stringify(messages));

  // Aggiorna preview conversazione
  const convRaw = localStorage.getItem("conversations");
  let conversations = convRaw ? JSON.parse(convRaw) : [];
  conversations = conversations.map((c: any) => {
    if (c.id === conversationId) {
      return {
        ...c,
        lastMessagePreview: messageText.slice(0, 60),
        lastMessageAt: now,
        unreadForRenter: true,
        unreadForHubber: true,
      };
    }
    return c;
  });
  localStorage.setItem("conversations", JSON.stringify(conversations));

  // Sync su Supabase
  try {
    // ✅ FIX: Recupera renter e hubber dalla conversazione
    const { data: conv } = await supabase
      .from("conversations")
      .select("renter_id, hubber_id")
      .eq("id", conversationId)
      .single();

    await supabase.from("messages").insert({
      id: messageId,
      conversation_id: conversationId,
      from_user_id: conv?.hubber_id || conv?.renter_id || "system",
      to_user_id: conv?.renter_id || conv?.hubber_id || "system",
      text: messageText,
      created_at: now,
      is_system_message: true,
    });

    await supabase
      .from("conversations")
      .update({
        last_message_preview: messageText.slice(0, 60),
        last_message_at: now,
        unread_for_renter: true,
        unread_for_hubber: true,
      })
      .eq("id", conversationId);
  } catch (e) {
    console.warn("Errore sync messaggio sistema Supabase:", e);
  }

  console.log("📩 Messaggio di sistema inviato:", messageText.slice(0, 50));
}

/**
 * 🔒 RIOSCURA CONTATTI dopo cancellazione prenotazione
 * Aggiorna tutti i messaggi della conversazione con hasConfirmedBooking: false
 */
async function hideContactsAfterCancellation(bookingId: string): Promise<void> {
  const conversationId = `conv-booking-${bookingId}`;
  
  try {
    // Aggiorna Supabase
    await supabase
      .from("messages")
      .update({ has_confirmed_booking: false })
      .eq("conversation_id", conversationId);
    
    console.log("🔒 Contatti rioscurati per conversazione:", conversationId);
  } catch (e) {
    console.warn("Errore rioscuramento contatti:", e);
  }
}

/* ------------------------------------------------------
   PRENOTAZIONI (bookings) – RENTER
-------------------------------------------------------*/
async function getRenterBookings(userId: string): Promise<BookingRequest[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("renter_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Errore getRenterBookings:", error);
    return [];
  }

  if (!data) return [];
  return data.map(mapBookingRowToRequest);
}

/* ------------------------------------------------------
   PRENOTAZIONI (bookings) – HUBBER
-------------------------------------------------------*/
async function getHubberBookings(userId: string): Promise<BookingRequest[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("hubber_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Errore getHubberBookings:", error);
    return [];
  }

  if (!data) return [];
  return data.map(mapBookingRowToRequest);
}

/* ------------------------------------------------------
   HELPER: normalizza categoria annunci
-------------------------------------------------------*/
const normalizeCategory = (
  raw: string | null | undefined
): "oggetto" | "spazio" => {
  const v = (raw || "").toLowerCase().trim();

  if (v.startsWith("spaz") || v.startsWith("space")) {
    return "spazio";
  }

  return "oggetto";
};

/* ------------------------------------------------------
   HELPER: mapping riga "listings" -> Listing (App)
-------------------------------------------------------*/
const mapDbListingToAppListing = (row: any): Listing => {
  const lat =
    (row.coordinates && typeof row.coordinates.lat === "number"
      ? row.coordinates.lat
      : undefined) ??
    (typeof row.lat === "number" ? row.lat : 0);

  const lng =
    (row.coordinates && typeof row.coordinates.lng === "number"
      ? row.coordinates.lng
      : undefined) ??
    (typeof row.lng === "number" ? row.lng : 0);

  // 👇 SE abbiamo fatto il join con "owner: users(...)" qui arriva l'utente host
  const owner = row.owner ? mapDbUserToAppUser(row.owner) : undefined;

  return {
    id: row.id,
    hostId: row.host_id || row.owner_id || "",
    title: row.title,
    category: normalizeCategory(row.category),
    subCategory: row.sub_category || "",
    description: row.description || "",
    price: row.price ?? 0,
    priceUnit: row.price_unit || "giorno",
    location: row.location || "",
    rating: row.rating ?? 0,
    reviewCount: row.review_count ?? 0,
    deposit: row.deposit ?? 0,
    cleaningFee: row.cleaning_fee ?? 0,
    status: row.status || "published",
    cancellationPolicy: row.cancellation_policy || "flexible",
    minDuration: row.min_duration ?? undefined,
    maxDuration: row.max_duration ?? undefined,
    completenessScore: row.completeness_score ?? undefined,

    images: row.images || [],
    features: row.features || [],
    rules: row.rules || [],
    reviews: row.reviews || [],

    coordinates: { lat, lng },

    // 👇 questo è quello che serve al componente <HostInfo />
    owner,
    
    // 👇 NUOVI CAMPI INDIRIZZO E ZONA
    pickupAddress: row.pickup_address || "",
    pickupCity: row.pickup_city || "",
    pickupInstructions: row.pickup_instructions || "",
    zoneDescription: row.zone_description || "",
    
    // 👇 CAMPI SPAZIO
    maxGuests: row.max_guests ?? undefined,
    openingHours: row.opening_hours || "",
    manualBadges: row.manual_badges || [],

    // 👇 CONTEGGIO VISUALIZZAZIONI
view_count: row.view_count ?? 0,
  };
};

/* ------------------------------------------------------
   HELPER: mapping riga "bookings" -> oggetto JS per Dashboard
   ✅ AGGIORNATO: include dati renter e listing dal JOIN
-------------------------------------------------------*/
const mapDbBookingToAppBooking = (row: any) => {
  // 🔹 Estrai dati renter dal JOIN (se presente)
  const renterData = row.renter;
  let renterName = "Renter";
  let renterAvatar = "https://ui-avatars.com/api/?name=Renter&background=random";

  if (renterData) {
    // Costruisci il nome dal renter
    const firstName = renterData.first_name || "";
    const lastName = renterData.last_name || "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ");
    renterName = fullName || renterData.name || renterData.email?.split("@")[0] || "Renter";
    
    // Avatar
    renterAvatar = renterData.avatar_url || 
      `https://ui-avatars.com/api/?name=${encodeURIComponent(renterName)}&background=random`;
  }

  // 🔹 Estrai dati listing dal JOIN (se presente)
  const listingData = row.listing;
  let listingTitle = `Prenotazione #${String(row.id || "").slice(0, 6)}`;
  let listingImage = "https://picsum.photos/seed/renthubber-booking/160/120";
  let listingPrice = 0;
  let priceUnit = "giorno";
  let cancellationPolicy = "flexible";

  if (listingData) {
    listingTitle = listingData.title || listingTitle;
    
    // Prendi la prima immagine se disponibile (gestisci vari formati)
    const images = listingData.images;
    if (images) {
      if (Array.isArray(images) && images.length > 0) {
        // Array di stringhe
        listingImage = images[0];
      } else if (typeof images === 'string') {
        // Stringa singola o JSON stringificato
        try {
          const parsed = JSON.parse(images);
          if (Array.isArray(parsed) && parsed.length > 0) {
            listingImage = parsed[0];
          }
        } catch {
          // È una stringa singola URL
          listingImage = images;
        }
      } else if (typeof images === 'object' && images !== null) {
        // Oggetto con chiavi numeriche o altra struttura
        const vals = Object.values(images);
        if (vals.length > 0 && typeof vals[0] === 'string') {
          listingImage = vals[0] as string;
        }
      }
    }
    
    // Prezzo e unità
    listingPrice = listingData.price || 0;
    priceUnit = listingData.price_unit || "giorno";
    cancellationPolicy = listingData.cancellation_policy || "flexible";
  }

  return {
    id: row.id,
    renterId: row.renter_id,
    hubberId: row.hubber_id,
    listingId: row.listing_id,
    startDate: row.start_date,
    endDate: row.end_date,
    amountTotal: Number(row.amount_total || 0),
    platformFee: Number(row.platform_fee || 0),
    hubberNetAmount: Number(row.hubber_net_amount || 0),
    walletUsedCents: row.wallet_used_cents || 0,
    status: row.status,
    paymentId: row.payment_id,
    createdAt: row.created_at,
    // ✅ Dati renter e listing
    renterName,
    renterAvatar,
    listingTitle,
    listingImage,
    // ✅ Prezzo listing per calcoli
    listingPrice,
    priceUnit,
    // ✅ NUOVO: Politica di cancellazione
    cancellationPolicy,
  };
};

/* ------------------------------------------------------
   HELPER: mapping riga "page_contents" -> PageContent
-------------------------------------------------------*/
const mapDbPageToAppPage = (row: any): PageContent =>
  ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    content: row.content,
  } as PageContent);

/* ------------------------------------------------------
   PLATFORM FEES — Lettura e scrittura su Supabase
-------------------------------------------------------*/

const getFeesFromDb = async () => {
  const { data, error } = await supabase
    .from("platform_fees")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Errore caricando platform_fees:", error);
    return null;
  }

  if (!data) return null;

  return {
    renterPercentage: Number(data.renter_percentage ?? 10),
    hubberPercentage: Number(data.hubber_percentage ?? 10),
    superHubberPercentage: Number(data.super_hubber_percentage ?? 5),
    fixedFeeEur: Number(data.fixed_fee_eur ?? 2),
  };
};

const saveFeesToDb = async (fees: {
  renterPercentage: number;
  hubberPercentage: number;
  superHubberPercentage: number;
  fixedFeeEur: number;
}) => {
  const { data: existing } = await supabase
    .from("platform_fees")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const payload = {
    id: existing?.id,
    renter_percentage: fees.renterPercentage,
    hubber_percentage: fees.hubberPercentage,
    super_hubber_percentage: fees.superHubberPercentage,
    fixed_fee_eur: fees.fixedFeeEur,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("platform_fees")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    console.error("Errore salvando platform_fees:", error);
    throw error;
  }
};

/* ------------------------------------------------------
                    API SERVICE
-------------------------------------------------------*/
export const api = {
  storage: {
    uploadAvatar: async (userId: string, file: File) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: buckets } = await supabase.storage.listBuckets();
      const avatarBucket = buckets?.find((b) => b.name === "avatars");
      if (!avatarBucket)
        await supabase.storage.createBucket("avatars", { public: true });

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      await supabase
        .from("users")
        .update({ avatar_url: data.publicUrl })
        .eq("id", userId);

      return data.publicUrl;
    },

    uploadDocument: async (
      userId: string,
      file: File,
      side: "front" | "back"
    ) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${side}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (
        uploadError &&
        (uploadError.message.includes("not found") ||
          (uploadError as any).statusCode === "404")
      ) {
        await supabase.storage.createBucket("documents", { public: false });
        const retry = await supabase.storage
          .from("documents")
          .upload(filePath, file);
        uploadError = retry.error;
      }

      if (uploadError) {
        console.error("Upload failed:", uploadError);
        return undefined;
      }

      const { data } = await supabase.storage
        .from("documents")
        .createSignedUrl(filePath, 31536000);
      if (!data?.signedUrl) return undefined;

      const column =
        side === "front" ? "document_front_url" : "document_back_url";
      await supabase
        .from("users")
        .update({ [column]: data.signedUrl })
        .eq("id", userId);

      return data.signedUrl;
    },
  },

  auth: {
    login: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw new Error(error.message || "Login fallito");

      return api.users.get(data.session.user.id);
    },

    register: async (
      email: string,
      password: string,
      userData: Partial<User>
    ) => {
      // ✅ Splitta il nome in first_name e last_name PRIMA della registrazione
      const fullName = userData.name || "";
      const nameParts = fullName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      console.log("📝 Registrazione - Dati ricevuti:", { 
        fullName, 
        firstName, 
        lastName, 
        email,
        userData 
      });

      // ✅ Registra con metadata per salvare nome in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            first_name: firstName,
            last_name: lastName,
          }
        }
      });
      
      if (authError) {
        console.error("❌ Auth signup error:", authError);
        throw new Error(authError.message || "Errore registrazione");
      }

      const session = authData.session;
      const userId = session?.user?.id || authData.user?.id;

      if (!userId) throw new Error("ID utente non recuperabile.");

      const userRole = userData.role || "renter";
      const userRoles = userData.roles || [userRole];

      console.log("✅ Auth creato, userId:", userId);

      // ✅ STEP 1: Prova INSERT
      // NOTA: hubber_balance deve essere NULL per evitare che il trigger sync_wallet_from_user
      // cerchi di creare il wallet prima che l'utente sia completamente inserito
      const insertData = {
        id: userId,
        email: email,
        name: fullName || email.split("@")[0],
        first_name: firstName,
        last_name: lastName,
        role: userRole,
        roles: userRoles,
        referral_code: userData.referralCode || null,
        renter_balance: userData.renterBalance || 0,
        hubber_balance: null,  // ✅ NULL per evitare trigger wallet
        status: "active",
        created_at: new Date().toISOString(),
      };

      console.log("📝 Tentativo INSERT con dati:", insertData);

      const { error: insertError } = await supabase
        .from("users")
        .insert(insertData);

      if (insertError) {
        console.warn("⚠️ INSERT fallito (probabilmente utente già esiste):", insertError.message);
        
        // ✅ STEP 2: Se INSERT fallisce, fai UPDATE
        console.log("📝 Tentativo UPDATE...");
        
        const { error: updateError } = await supabase
          .from("users")
          .update({
            name: fullName || email.split("@")[0],
            first_name: firstName,
            last_name: lastName,
            role: userRole,
            roles: userRoles,
            referral_code: userData.referralCode || null,
            renter_balance: userData.renterBalance || 0,
          })
          .eq("id", userId);

        if (updateError) {
          console.error("❌ UPDATE fallito:", updateError);
        } else {
          console.log("✅ UPDATE completato con successo");
        }
      } else {
        console.log("✅ INSERT completato con successo");
      }

      // ✅ Verifica finale - leggi l'utente dal DB
      const { data: verifyUser } = await supabase
        .from("users")
        .select("id, email, name, first_name, last_name")
        .eq("id", userId)
        .single();
      
      console.log("🔍 Verifica utente nel DB:", verifyUser);

      return api.users.get(userId);
    },

    logout: async () => {
      await supabase.auth.signOut();
    },

    getCurrentSession: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  },

  users: {
    get: async (userId: string): Promise<User | null> => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      const { data: userRow, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error || !userRow) {
        if (authUser && authUser.id === userId) {
          console.log(
            "Auto-healing: Creating missing user row in public.users..."
          );
          
          // ✅ Prova a recuperare nome da user_metadata di Supabase Auth
          const authMetadata = authUser.user_metadata || {};
          const fullNameFromAuth = authMetadata.full_name || authMetadata.name || "";
          const firstNameFromAuth = authMetadata.first_name || "";
          const lastNameFromAuth = authMetadata.last_name || "";
          
          // Usa i dati da metadata, oppure fallback all'email
          let finalFirstName = firstNameFromAuth;
          let finalLastName = lastNameFromAuth;
          let finalFullName = fullNameFromAuth;
          
          if (!finalFirstName && fullNameFromAuth) {
            const parts = fullNameFromAuth.trim().split(" ");
            finalFirstName = parts[0] || "";
            finalLastName = parts.slice(1).join(" ") || "";
          }
          
          if (!finalFullName) {
            finalFullName = [finalFirstName, finalLastName].filter(Boolean).join(" ") 
              || authUser.email?.split("@")[0] 
              || "User";
          }
          
          const { data: newUserRow } = await supabase
            .from("users")
            .insert({
              id: userId,
              email: authUser.email,
              name: finalFullName,
              first_name: finalFirstName || finalFullName.split(" ")[0] || "",
              last_name: finalLastName || finalFullName.split(" ").slice(1).join(" ") || "",
              role: "renter",
              roles: ["renter"],
              avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(finalFullName)}&background=random`,
            })
            .select()
            .single();

          if (newUserRow)
            return mapSupabaseUserToAppUser(newUserRow, authUser);
        }
        return null;
      }

      return mapSupabaseUserToAppUser(
        userRow,
        authUser || { id: userId, email: userRow.email }
      );
    },

    update: async (user: User) => {
      // ✅ Splitta il nome in first_name e last_name
      const fullName = user.name || "";
      const nameParts = fullName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const updateData = {
        name: user.name,
        first_name: firstName,  // ✅ NUOVO
        last_name: lastName,    // ✅ NUOVO
        role: user.role,
        roles: user.roles,
        avatar_url: user.avatar,
        bio: user.bio,
        phone_number: user.phoneNumber,
        address: user.address,
        bank_details: user.bankDetails,

        phone_verified: user.phoneVerified,
        id_document_verified: user.idDocumentVerified,
        verification_status: user.verificationStatus,
        is_suspended: user.isSuspended,

        renter_balance: user.renterBalance,
        hubber_balance: user.hubberBalance,
      };

      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", user.id);
      if (error) throw error;
      return user;
    },

    upgradeToHubber: async (user: User) => {
      const newRoles = Array.from(new Set([...(user.roles || []), "hubber"]));

      const { error } = await supabase
        .from("users")
        .update({
          role: "hubber",
          roles: newRoles,
          hubber_since: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;
      return { ...user, roles: newRoles, role: "hubber" };
    },

    getAll: async (): Promise<User[]> => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .order("created_at", { ascending: false });

        console.log("DEBUG raw users from Supabase (users.getAll):", data, error);

        if (error) {
          console.error("Errore caricamento utenti da Supabase:", error);
          return [];
        }

        if (!data) return [];

        const mapped = data.map(mapDbUserToAppUser);
        console.log("DEBUG mapped users (users.getAll):", mapped);

        return mapped;
      } catch (err) {
        console.error("Errore inatteso users.getAll:", err);
        return [];
      }
    },
  },

  // 🔗 funzioni prenotazioni da booking_requests
  createBookingAfterPayment,
  getRenterBookings,
  getHubberBookings,

  // =========================
  // LISTINGS (ANNUNCI)
  // =========================
  listings: {
    // Cache in memoria per evitare ricaricamenti
    _cache: null as Listing[] | null,
    _cacheTimestamp: 0,
    _cacheDuration: 60000, // 1 minuto

    /**
     * 🚀 VERSIONE LIGHT - Per Home e liste (VELOCE)
     * Carica solo i campi essenziali, NO JOIN con users
     */
    getAllLight: async (): Promise<Listing[]> => {
      try {
        console.log("⚡ listings.getAllLight – query ottimizzata...");

        const { data, error } = await supabase
          .from("listings")
          .select(`
            id,
            host_id,
            title,
            category,
            sub_category,
            price,
            price_unit,
            location,
            images,
            rating,
            review_count,
            status,
            deposit,
            cancellation_policy
          `)
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          console.error("Errore listings.getAllLight:", error);
          return [];
        }

        if (!data || data.length === 0) return [];

        // Mapping leggero
        return data.map((row: any) => ({
          id: row.id,
          hostId: row.host_id,
          title: row.title,
          category: normalizeCategory(row.category),
          subCategory: row.sub_category || "",
          price: row.price ?? 0,
          priceUnit: row.price_unit || "giorno",
          location: row.location || "",
          images: row.images || [],
          rating: row.rating ?? 0,
          reviewCount: row.review_count ?? 0,
          status: row.status || "published",
          deposit: row.deposit ?? 0,
          cancellationPolicy: row.cancellation_policy || "flexible",
          // Campi vuoti per compatibilità
          description: "",
          features: [],
          rules: [],
          reviews: [],
          coordinates: { lat: 0, lng: 0 },
        })) as Listing[];
      } catch (e) {
        console.error("Errore inatteso getAllLight:", e);
        return [];
      }
    },

    /**
 * 🔍 VERSIONE COMPLETA - Per dettaglio annuncio (con owner)
 */
getById: async (listingId: string): Promise<Listing | null> => {
  try {
    console.log("📄 listings.getById –", listingId);

    const { data, error } = await supabase
      .from("listings")
      .select(`
        *,
        owner:host_id(
          id,
          email,
          name,
          first_name,
          last_name,
          avatar_url,
          rating,
          is_super_hubber,
          hubber_since,
          user_type,
          bio,
          public_name,
          id_document_verified
        )
      `)
      .eq("id", listingId)
      .single();

    console.log("🔍 RAW DATA FROM DB:", data);        // ← AGGIUNGI
    console.log("🔍 OWNER FROM DB:", data?.owner);   // ← AGGIUNGI

    if (error || !data) {
      console.error("Errore listings.getById:", error);
      return null;
    }

    return mapDbListingToAppListing(data);
  } catch (e) {
    console.error("Errore inatteso getById:", e);
    return null;
  }
},

    /**
     * 📋 VERSIONE STANDARD - Per admin e casi dove serve tutto
     * Con cache per evitare ricaricamenti
     */
    getAll: async (): Promise<Listing[]> => {
      try {
        // Controlla cache
        const now = Date.now();
        if (
          api.listings._cache &&
          now - api.listings._cacheTimestamp < api.listings._cacheDuration
        ) {
          console.log("📦 listings.getAll – uso cache");
          return api.listings._cache;
        }

        console.log("📥 listings.getAll – chiamo Supabase...");

        // Query semplificata senza JOIN complesso
        const { data, error } = await supabase
          .from("listings")
          .select("*, view_count")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Errore fetch listings da Supabase:", error);
          return [];
        }

        if (!data || data.length === 0) {
          console.log("📭 listings.getAll – nessun annuncio trovato in DB");
          return [];
        }

       // Carica owner separatamente se necessario
const ownerIds = [...new Set(data.map(l => l.host_id).filter(Boolean))];  // ← host_id invece di owner_id
let owners: any[] = [];

if (ownerIds.length > 0) {
  const { data: ownersData } = await supabase
    .from("users")
    .select("id, email, first_name, last_name, public_name, avatar_url, role, rating, is_super_hubber, user_type, bio, id_document_verified, hubber_since")  // ← Aggiungi bio, id_document_verified, hubber_since
    .in("id", ownerIds);
  owners = ownersData || [];
}

        // Associa owner ai listings
        const dataWithOwners = data.map(listing => ({
          ...listing,
          owner: owners.find(o => o.id === listing.host_id) || null
        }));

        const mapped = dataWithOwners.map(mapDbListingToAppListing);
        
        // Salva in cache
        api.listings._cache = mapped;
        api.listings._cacheTimestamp = now;

        console.log("✅ listings.getAll – caricati:", mapped.length);
        return mapped;
      } catch (e) {
        console.error("Errore inatteso getAll listings:", e);
        return [];
      }
    },

    /**
     * 🗑️ Invalida cache (da chiamare dopo create/update/delete)
     */
    invalidateCache: () => {
      api.listings._cache = null;
      api.listings._cacheTimestamp = 0;
      console.log("🗑️ Cache listings invalidata");
    },

    create: async (listing: Listing): Promise<Listing> => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.warn("Auth error durante create listing:", authError);
      }

      const hostId = listing.hostId || user?.id || null;

      const payload: any = {
        owner_id: hostId,
        host_id: hostId,
        title: listing.title,
        category: listing.category,
        sub_category: (listing as any).subCategory || null,
        description: listing.description,
        price: listing.price ?? 0,
        price_unit: (listing as any).priceUnit || "giorno",
        location: listing.location || "",
        lat: listing.coordinates?.lat ?? null,
        lng: listing.coordinates?.lng ?? null,
        rating: listing.rating ?? 0,
        review_count: listing.reviewCount ?? 0,
        deposit: listing.deposit ?? 0,
        cleaning_fee: (listing as any).cleaningFee ?? 0,
        status: listing.status || "published",
        cancellation_policy: listing.cancellationPolicy || "flexible",
        min_duration: (listing as any).minDuration ?? null,
        max_duration: (listing as any).maxDuration ?? null,
        completeness_score:
          (listing as any).completenessScore ??
          (listing as any).completeness ??
          null,
        images: (listing as any).images ?? [],
        features: (listing as any).features ?? [],
        rules: (listing as any).rules ?? [],
        reviews: (listing as any).reviews ?? [],
        // Campi indirizzo ritiro/spazio
        pickup_address: (listing as any).pickupAddress || null,
        pickup_city: (listing as any).pickupCity || null,
        pickup_instructions: (listing as any).pickupInstructions || null,
        // Descrizione zona
        zone_description: (listing as any).zoneDescription || null,
        // Campi spazio
        max_guests: (listing as any).maxGuests || null,
        opening_hours: (listing as any).openingHours || null,
        manual_badges: (listing as any).manualBadges || [],
      };

      const { data, error } = await supabase
        .from("listings")
        .insert(payload)
        .select("*")
        .single();

      if (error) {
        console.error("Errore insert listing Supabase:", error);
        throw new Error(error.message || "Errore salvataggio annuncio.");
      }

      const mapped = mapDbListingToAppListing(data);
      console.log("DEBUG listings.create mapped:", mapped);
      
      // Invalida cache
      api.listings.invalidateCache();
      
      return mapped;
    },

    update: async (listing: Listing): Promise<Listing> => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.warn("Auth error durante update listing:", authError);
      }

      const hostId = listing.hostId || user?.id || null;

      const payload: any = {
        owner_id: hostId,
        host_id: hostId,
        title: listing.title,
        category: listing.category,
        sub_category: (listing as any).subCategory || null,
        description: listing.description,
        price: listing.price ?? 0,
        price_unit: (listing as any).priceUnit || "giorno",
        location: listing.location || "",
        lat: listing.coordinates?.lat ?? null,
        lng: listing.coordinates?.lng ?? null,
        rating: listing.rating ?? 0,
        review_count: listing.reviewCount ?? 0,
        deposit: listing.deposit ?? 0,
        cleaning_fee: (listing as any).cleaningFee ?? 0,
        status: listing.status || "published",
        cancellation_policy: listing.cancellationPolicy || "flexible",
        min_duration: (listing as any).minDuration ?? null,
        max_duration: (listing as any).maxDuration ?? null,
        completeness_score:
          (listing as any).completenessScore ??
          (listing as any).completeness ??
          null,
        images: (listing as any).images ?? [],
        features: (listing as any).features ?? [],
        rules: (listing as any).rules ?? [],
        reviews: (listing as any).reviews ?? [],
        // Campi indirizzo ritiro/spazio
        pickup_address: (listing as any).pickupAddress || null,
        pickup_city: (listing as any).pickupCity || null,
        pickup_instructions: (listing as any).pickupInstructions || null,
        // Descrizione zona
        zone_description: (listing as any).zoneDescription || null,
        // Campi spazio
        max_guests: (listing as any).maxGuests || null,
        opening_hours: (listing as any).openingHours || null,
        manual_badges: (listing as any).manualBadges || [],
      };

      const { data, error } = await supabase
        .from("listings")
        .update(payload)
        .eq("id", listing.id)
        .select("*")
        .single();

      if (error) {
        console.error("Errore update listing Supabase:", error);
        throw new Error(error.message || "Errore aggiornamento annuncio.");
      }

      const mapped = mapDbListingToAppListing(data);
      console.log("DEBUG listings.update mapped:", mapped);
      
      // Invalida cache
      api.listings.invalidateCache();
      
      return mapped;
    },

    /**
     * 🗑️ Elimina un annuncio
     */
    delete: async (listingId: string): Promise<boolean> => {
      try {
        console.log("🗑️ listings.delete –", listingId);

        const { error } = await supabase
          .from("listings")
          .delete()
          .eq("id", listingId);

        if (error) {
          console.error("Errore delete listing:", error);
          throw new Error(error.message || "Errore eliminazione annuncio.");
        }

        // Invalida cache
        api.listings.invalidateCache();
        
        console.log("✅ Annuncio eliminato:", listingId);
        return true;
      } catch (e) {
        console.error("Errore inatteso delete listing:", e);
        throw e;
      }
    },

    /**
     * 🔄 Aggiorna solo lo stato di un annuncio (suspend/publish/hide)
     */
    updateStatus: async (listingId: string, status: string): Promise<boolean> => {
      try {
        console.log("🔄 listings.updateStatus –", listingId, status);

        const { error } = await supabase
          .from("listings")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", listingId);

        if (error) {
          console.error("Errore updateStatus listing:", error);
          throw new Error(error.message || "Errore aggiornamento stato.");
        }

        // Invalida cache
        api.listings.invalidateCache();
        
        console.log("✅ Stato annuncio aggiornato:", listingId, "→", status);
        return true;
      } catch (e) {
        console.error("Errore inatteso updateStatus listing:", e);
        throw e;
      }
    },
  },

  // =========================
  // BOOKINGS
  // =========================
  bookings: {
    /**
     * 🔹 VERSIONE LEGACY (per non rompere niente):
     * usa ancora localStorage + MOCK_REQUESTS dove già usato (es. richieste),
     * così tutto continua a funzionare.
     */
    getAll: async (): Promise<BookingRequest[]> => {
      const stored = localStorage.getItem("bookings");
      return stored ? JSON.parse(stored) : MOCK_REQUESTS;
    },

    create: async (booking: BookingRequest) => {
      const bookings = await api.bookings.getAll();
      const newBookings = [booking, ...bookings];
      localStorage.setItem("bookings", JSON.stringify(newBookings));
      return booking;
    },

    /**
     * 🔹 PRENOTAZIONI REALI da Supabase per HUBBER
     * ✅ OTTIMIZZATO: include verifica se già recensito
     */
    getForHubberFromDb: async (hubberId: string) => {
      try {
        console.log("⚡ bookings.getForHubberFromDb – query ottimizzata...");
        
        const { data, error } = await supabase
          .from("bookings")
          .select(`
            id,
            renter_id,
            hubber_id,
            listing_id,
            start_date,
            end_date,
            amount_total,
            platform_fee,
            hubber_net_amount,
            wallet_used_cents,
            status,
            payment_id,
            created_at,
            renter:renter_id(
              id,
              name,
              first_name,
              last_name,
              public_name,
              avatar_url
            ),
            listing:listing_id(
              id,
              title,
              images,
              price,
              price_unit,
              cancellation_policy,
              category
            )
          `)
          .eq("hubber_id", hubberId)
          .order("start_date", { ascending: true })
          .limit(100);

        if (error) {
          console.error("Errore fetch bookings hubber:", error);
          return [];
        }

        if (!data) return [];

        // ✅ Verifica quali prenotazioni sono già state recensite dall'hubber
        const bookingIds = data.map((b: any) => b.id);

        const { data: reviewsData, error: reviewsError } = await supabase
          .from("reviews")
          .select("booking_id")
          .eq("reviewer_id", hubberId)
          .in("booking_id", bookingIds);

        if (reviewsError) console.error("❌ Errore query recensioni:", reviewsError);

        const reviewedBookingIds = new Set(
          (reviewsData || []).map((r: any) => r.booking_id)
        );

        return data.map((row: any) => {
          const mapped = mapDbBookingToAppBooking(row);
          // ✅ Aggiungi categoria listing
          if (row.listing?.category) {
            mapped.listingCategory = row.listing.category;
          }

          // ✅ Verifica se già recensito dall'hubber
          const isReviewed = reviewedBookingIds.has(row.id);
          mapped.hasReviewedByHubber = isReviewed;
          
          return mapped;
        });
      } catch (e) {
        console.error("Errore inatteso getForHubberFromDb:", e);
        return [];
      }
    },
    /**
     * 🔹 PRENOTAZIONI REALI da Supabase per RENTER
     * ✅ OTTIMIZZATO: include verifica se già recensito
     */
    getForRenterFromDb: async (renterId: string) => {
      try {
        console.log("⚡ bookings.getForRenterFromDb – query ottimizzata...");
        
        const { data, error } = await supabase
          .from("bookings")
          .select(`
            id,
            renter_id,
            hubber_id,
            listing_id,
            start_date,
            end_date,
            amount_total,
            platform_fee,
            hubber_net_amount,
            wallet_used_cents,
            status,
            payment_id,
            created_at,
            listing:listing_id(
              id,
              title,
              images,
              price,
              price_unit,
              cancellation_policy,
              pickup_address,
              pickup_city,
              pickup_instructions,
              location,
              category
            ),
            hubber:hubber_id(
              id,
              first_name,
              last_name,
              public_name,
              avatar_url
            )
          `)
          .eq("renter_id", renterId)
          .order("start_date", { ascending: true })
          .limit(100);

        if (error) {
          console.error("Errore fetch bookings renter:", error);
          return [];
        }

        if (!data) return [];

        // ✅ Verifica quali prenotazioni sono già state recensite
        const bookingIds = data.map((b: any) => b.id);
        const { data: reviewsData } = await supabase
          .from("reviews")
          .select("booking_id")
          .eq("reviewer_id", renterId)
          .in("booking_id", bookingIds);

        const reviewedBookingIds = new Set(
          (reviewsData || []).map((r: any) => r.booking_id)
        );

        return data.map((row: any) => {
          const mapped = mapDbBookingToAppBooking(row);
          
          // ✅ Aggiungi dati hubber
          const hubberData = row.hubber;
          if (hubberData) {
            const firstName = hubberData.first_name || "";
            const lastName = hubberData.last_name || "";
            const fullName = [firstName, lastName].filter(Boolean).join(" ");
            mapped.hubberName = hubberData.public_name || fullName || "Hubber";
            mapped.hubberAvatar = hubberData.avatar_url || 
              `https://ui-avatars.com/api/?name=${encodeURIComponent(mapped.hubberName)}&background=random`;
          }

          // ✅ Aggiungi categoria listing
          if (row.listing?.category) {
            mapped.listingCategory = row.listing.category;
          }

          // ✅ Verifica se già recensito dall'hubber
          mapped.hasReviewedByHubber = reviewedBookingIds.has(row.id);

          return mapped;
        });
      } catch (e) {
        console.error("Errore inatteso getForRenterFromDb:", e);
        return [];
      }
    },
    /**
     * Conta le prenotazioni completate di un renter
     */
    getCompletedCountForRenter: async (renterId: string): Promise<number> => {
      const { count, error } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("renter_id", renterId)
        .eq("status", "completed");

      if (error) {
        console.error("Errore conteggio prenotazioni renter:", error);
        return 0;
      }

      return count || 0;
    },

    /**
     * 🔹 PRENOTAZIONI PER UN ANNUNCIO SPECIFICO
     * Usato per mostrare date già prenotate nel calendario
     * Ritorna solo prenotazioni confermate/in corso
     */
    getByListingId: async (listingId: string): Promise<{ startDate: string; endDate: string }[]> => {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("start_date, end_date, status")
          .eq("listing_id", listingId)
          .in("status", ["confirmed", "pending", "active"])
          .gte("end_date", new Date().toISOString());

        if (error) {
          console.error("Errore fetch bookings per listing:", error);
          return [];
        }

        if (!data) return [];

        return data.map((b) => ({
          startDate: b.start_date,
          endDate: b.end_date,
        }));
      } catch (e) {
        console.error("Errore inatteso getByListingId:", e);
        return [];
      }
    },

    /**
     * 🔹 CANCELLA PRENOTAZIONE (per Renter)
     * - Aggiorna lo stato a 'cancelled'
     * - Calcola rimborso in base alla politica di cancellazione
     * - Rimborsa su wallet o carta in base alla scelta dell'utente
     * 
     * POLITICHE:
     * - Flessibile (flexible): 100% rimborso fino a 24h prima
     * - Moderata (moderate): 100% rimborso fino a 5gg prima
     * - Rigida (strict): 50% rimborso fino a 7gg prima, dopo 0%
     * 
     * METODI RIMBORSO:
     * - wallet: accredito immediato su renter_balance
     * - card: rimborso Stripe sulla carta originale (5-10 giorni)
     */
    cancel: async (
      bookingId: string, 
      renterId: string,
      refundMethod: 'wallet' | 'card' = 'wallet'
    ): Promise<{
      success: boolean;
      error?: string;
      walletRefunded?: number;
      cardRefundPending?: boolean;
      cardRefundAmount?: number;
      totalRefunded?: number;
      refundPercentage?: number;
      policyApplied?: string;
      refundMethod?: 'wallet' | 'card';
    }> => {
      try {
        // 1. Recupera i dettagli della prenotazione con la politica di cancellazione
        const { data: booking, error: fetchError } = await supabase
          .from("bookings")
          .select(`
            *,
            listing:listing_id(
              cancellation_policy,
              title
            )
          `)
          .eq("id", bookingId)
          .eq("renter_id", renterId)
          .single();

        if (fetchError || !booking) {
          console.error("Errore recupero prenotazione:", fetchError);
          return { success: false, error: "Prenotazione non trovata." };
        }

        // ✅ Definisci listingTitle e bookingNumber per usarli dopo
        const listingTitle = booking.listing?.title || "l'annuncio";
        const bookingNumber = bookingId.substring(0, 8).toUpperCase();

        // 2. Verifica che la prenotazione sia cancellabile
        const cancellableStatuses = ['pending', 'confirmed', 'accepted'];
        if (!cancellableStatuses.includes(booking.status)) {
          return { 
            success: false, 
            error: `Non puoi cancellare una prenotazione con stato "${booking.status}".` 
          };
        }

        // 3. Calcola i giorni/ore rimanenti fino all'inizio della prenotazione
        const startDate = new Date(booking.start_date);
        const now = new Date();
        const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        const daysUntilStart = hoursUntilStart / 24;

        // 4. Determina la percentuale di rimborso in base alla politica
        const policy = booking.listing?.cancellation_policy || 'flexible';
        let refundPercentage = 0;
        let policyMessage = '';

        if (policy === 'flexible') {
          // Flessibile: 100% fino a 24h prima
          if (hoursUntilStart >= 24) {
            refundPercentage = 100;
            policyMessage = 'Rimborso completo (politica flessibile)';
          } else {
            refundPercentage = 0;
            policyMessage = 'Nessun rimborso (meno di 24h prima dell\'inizio)';
          }
        } else if (policy === 'moderate') {
          // Moderata: 100% fino a 5gg prima
          if (daysUntilStart >= 5) {
            refundPercentage = 100;
            policyMessage = 'Rimborso completo (politica moderata)';
          } else {
            refundPercentage = 0;
            policyMessage = 'Nessun rimborso (meno di 5 giorni prima dell\'inizio)';
          }
        } else if (policy === 'strict') {
          // Rigida: 50% fino a 7gg prima, poi 0%
          if (daysUntilStart >= 7) {
            refundPercentage = 50;
            policyMessage = 'Rimborso 50% (politica rigida)';
          } else {
            refundPercentage = 0;
            policyMessage = 'Nessun rimborso (meno di 7 giorni prima dell\'inizio)';
          }
        } else {
          // Default: flessibile
          if (hoursUntilStart >= 24) {
            refundPercentage = 100;
            policyMessage = 'Rimborso completo';
          } else {
            refundPercentage = 0;
            policyMessage = 'Nessun rimborso';
          }
        }

        // 5. Calcola i rimborsi
        const totalPaid = Number(booking.amount_total) || 0;
        const refundAmount = (totalPaid * refundPercentage) / 100;
        
        const walletUsedCents = booking.wallet_used_cents || 0;
        const walletUsedEur = walletUsedCents / 100;
        const cardPaidOriginal = totalPaid - walletUsedEur;

        let walletRefunded = 0;
        let cardRefunded = 0;
        let totalRefunded = refundAmount;

        // 6. Aggiorna stato prenotazione
        const { error: updateError } = await supabase
          .from("bookings")
          .update({ 
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            refund_method: refundMethod, // Salva il metodo scelto
            refund_amount: refundAmount,
          })
          .eq("id", bookingId);

        if (updateError) {
          console.error("Errore aggiornamento stato:", updateError);
          return { success: false, error: "Errore durante la cancellazione." };
        }

        // 7. Gestisci rimborso in base al metodo scelto
        if (refundAmount > 0) {
          if (refundMethod === 'wallet') {
            // TUTTO su wallet - accredito immediato
            walletRefunded = refundAmount;
            
            const { data: userData } = await supabase
              .from("users")
              .select("renter_balance")
              .eq("id", renterId)
              .single();

            if (userData) {
              const newBalance = (userData.renter_balance || 0) + walletRefunded;
              await supabase
                .from("users")
                .update({ renter_balance: newBalance })
                .eq("id", renterId);
              
              // ✅ Crea record in wallet_transactions
              await supabase.from("wallet_transactions").insert({
                user_id: renterId,
                amount_cents: Math.round(walletRefunded * 100),
                balance_after_cents: Math.round(newBalance * 100),
                type: 'credit',
                source: 'booking_refund',
                description: `Rimborso per prenotazione #${bookingNumber} (${listingTitle})`,
                related_booking_id: bookingId,
              });
            }
          } else {
            // CARTA - rimborso proporzionale al metodo di pagamento originale
            // La parte pagata con wallet viene comunque rimborsata su wallet
            if (walletUsedEur > 0) {
              const walletRefundProportion = (walletUsedEur / totalPaid) * refundAmount;
              walletRefunded = Math.min(walletRefundProportion, walletUsedEur);
              
              const { data: userData } = await supabase
                .from("users")
                .select("renter_balance")
                .eq("id", renterId)
                .single();

              if (userData) {
                const newBalance = (userData.renter_balance || 0) + walletRefunded;
                await supabase
                  .from("users")
                  .update({ renter_balance: newBalance })
                  .eq("id", renterId);
                
                // ✅ Crea record in wallet_transactions
                await supabase.from("wallet_transactions").insert({
                  user_id: renterId,
                  amount_cents: Math.round(walletRefunded * 100),
                  balance_after_cents: Math.round(newBalance * 100),
                  type: 'credit',
                  source: 'booking_refund',
                  description: `Rimborso per prenotazione #${bookingNumber} (${listingTitle})`,
                  related_booking_id: bookingId,
                });
              }
            }
            
            // La parte pagata con carta viene segnata come "pending"
            if (cardPaidOriginal > 0) {
              const cardRefundProportion = (cardPaidOriginal / totalPaid) * refundAmount;
              cardRefunded = Math.min(cardRefundProportion, cardPaidOriginal);
              
              // TODO: Quando Stripe sarà integrato, chiamare:
              // await stripe.refunds.create({
              //   payment_intent: booking.payment_id,
              //   amount: Math.round(cardRefunded * 100), // in centesimi
              // });
            }
          }
        }

        console.log("✅ Prenotazione cancellata:", {
          policy,
          refundPercentage,
          refundMethod,
          totalPaid,
          refundAmount,
          walletRefunded,
          cardRefunded,
        });

        // ✅ Invia messaggio di sistema nella chat
        let cancelMessage = `La prenotazione per "${listingTitle}" è stata cancellata dal Renter.`;
        if (refundAmount > 0) {
          cancelMessage += ` Rimborso: €${refundAmount.toFixed(2)}.`;
        }
        
        await sendBookingSystemMessage({
          bookingId,
          messageText: cancelMessage,
        });

        // 🔒 Rioscura contatti dopo cancellazione
        await hideContactsAfterCancellation(bookingId);

        return {
          success: true,
          walletRefunded: walletRefunded > 0 ? walletRefunded : undefined,
          cardRefundPending: cardRefunded > 0,
          cardRefundAmount: cardRefunded > 0 ? cardRefunded : undefined,
          totalRefunded: refundAmount > 0 ? refundAmount : undefined,
          refundPercentage,
          policyApplied: policyMessage,
          refundMethod,
        };

      } catch (e) {
        console.error("Errore inatteso cancel booking:", e);
        return { success: false, error: "Errore imprevisto. Riprova più tardi." };
      }
    },

    /**
     * 🔹 CANCELLA PRENOTAZIONE (per Hubber)
     * - L'hubber può cancellare per qualsiasi motivo
     * - Il renter riceve SEMPRE rimborso completo (100%)
     * - Il rimborso va sul wallet del renter
     */
    cancelByHubber: async (
      bookingId: string,
      hubberId: string,
      reason?: string
    ): Promise<{
      success: boolean;
      error?: string;
      refundedToRenter?: number;
    }> => {
      try {
        // 1. Recupera la prenotazione verificando che appartenga all'hubber
        const { data: booking, error: fetchError } = await supabase
          .from("bookings")
          .select(`
            *,
            listing:listing_id(title)
          `)
          .eq("id", bookingId)
          .eq("hubber_id", hubberId)
          .single();

        if (fetchError || !booking) {
          console.error("Errore recupero prenotazione:", fetchError);
          return { success: false, error: "Prenotazione non trovata." };
        }

        // ✅ Definisci listingTitle e bookingNumber per usarli dopo
        const listingTitle = booking.listing?.title || "l'annuncio";
        const bookingNumber = bookingId.substring(0, 8).toUpperCase();

        // 2. Verifica che sia cancellabile
        const cancellableStatuses = ['pending', 'confirmed', 'accepted', 'active'];
        if (!cancellableStatuses.includes(booking.status)) {
          return {
            success: false,
            error: `Non puoi cancellare una prenotazione con stato "${booking.status}".`,
          };
        }

        // 3. Calcola rimborso completo per il renter
        const totalPaid = booking.amount_total || 0;
        const refundAmount = totalPaid; // 100% rimborso

        // 4. Aggiorna stato prenotazione
        const { error: updateError } = await supabase
          .from("bookings")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            cancelled_by: "hubber",
            cancellation_reason: reason || "Cancellata dall'Hubber",
            refund_amount: refundAmount,
          })
          .eq("id", bookingId);

        if (updateError) {
          console.error("Errore aggiornamento stato:", updateError);
          return { success: false, error: "Errore durante la cancellazione." };
        }

        // 5. Accredita rimborso sul wallet del renter
        if (refundAmount > 0) {
          const { data: userData } = await supabase
            .from("users")
            .select("renter_balance")
            .eq("id", booking.renter_id)
            .single();

          if (userData) {
            const newBalance = (userData.renter_balance || 0) + refundAmount;
            await supabase
              .from("users")
              .update({ renter_balance: newBalance })
              .eq("id", booking.renter_id);
            
            // ✅ Crea record in wallet_transactions
            await supabase.from("wallet_transactions").insert({
              user_id: booking.renter_id,
              amount_cents: Math.round(refundAmount * 100),
              balance_after_cents: Math.round(newBalance * 100),
              type: 'credit',
              source: 'booking_refund',
              description: `Rimborso per prenotazione #${bookingNumber} (${listingTitle}) - Cancellata dall'Hubber`,
              related_booking_id: bookingId,
            });
          }
        }

        console.log("✅ Prenotazione cancellata dall'Hubber:", {
          bookingId,
          hubberId,
          refundAmount,
          reason,
        });

        // ✅ Invia messaggio di sistema nella chat
        let cancelMessage = `La prenotazione per "${listingTitle}" è stata cancellata dall'Hubber.`;
        if (reason) {
          cancelMessage += ` Motivo: ${reason}`;
        }
        if (refundAmount > 0) {
          cancelMessage += ` Rimborso completo di €${refundAmount.toFixed(2)} accreditato sul tuo Wallet.`;
        }
        
        await sendBookingSystemMessage({
          bookingId,
          messageText: cancelMessage,
        });

        // 🔒 Rioscura contatti dopo cancellazione
        await hideContactsAfterCancellation(bookingId);

        return {
          success: true,
          refundedToRenter: refundAmount,
        };

      } catch (e) {
        console.error("Errore inatteso cancelByHubber:", e);
        return { success: false, error: "Errore imprevisto. Riprova più tardi." };
      }
    },

    /**
     * 🔹 MODIFICA PRENOTAZIONE (per Renter)
     * - Aggiorna le date
     * - Se accorcia: rimborso (prezzo base + commissione 10%, NO fee fissa)
     * - Se allunga: pagamento extra (prezzo base + commissione 10%, NO fee fissa)
     * 
     * LOGICA COMMISSIONI:
     * - Fee fissa €2: pagata UNA SOLA VOLTA, mai rimborsata in modifica
     * - Commissione 10%: ricalcolata sul nuovo prezzo base
     */
    modify: async (params: {
      bookingId: string;
      renterId: string;
      newStartDate: string;
      newEndDate: string;
    }): Promise<{
      success: boolean;
      error?: string;
      refundedWallet?: number;
      refundedCard?: number;
      chargedExtra?: number;
      newTotal?: number;
      priceDifference?: number;
    }> => {
      try {
        const { bookingId, renterId, newStartDate, newEndDate } = params;

        // 1. Recupera i dettagli della prenotazione CON il prezzo del listing
        const { data: booking, error: fetchError } = await supabase
          .from("bookings")
          .select(`
            *,
            listing:listings!bookings_listing_id_fkey(
              price,
              price_unit,
              title
            )
          `)
          .eq("id", bookingId)
          .eq("renter_id", renterId)
          .single();

        if (fetchError || !booking) {
          console.error("Errore recupero prenotazione:", fetchError);
          return { success: false, error: "Prenotazione non trovata." };
        }

        // 2. Verifica che la prenotazione sia modificabile
        const modifiableStatuses = ['pending', 'confirmed', 'accepted'];
        if (!modifiableStatuses.includes(booking.status)) {
          return { 
            success: false, 
            error: `Non puoi modificare una prenotazione con stato "${booking.status}".` 
          };
        }

        // 3. Recupera il prezzo unitario del listing
        const listingPrice = booking.listing?.price || 0;
        const priceUnit = booking.listing?.price_unit || 'giorno';
        
        if (!listingPrice) {
          return { success: false, error: "Impossibile recuperare il prezzo dell'oggetto." };
        }

        // 4. Calcola giorni originali
        const origStart = new Date(booking.start_date);
        const origEnd = new Date(booking.end_date);
        const origDiffTime = Math.abs(origEnd.getTime() - origStart.getTime());
        let originalDays = Math.max(Math.ceil(origDiffTime / (1000 * 60 * 60 * 24)), 1);

        // 5. Calcola nuovi giorni
        const newStart = new Date(newStartDate);
        const newEnd = new Date(newEndDate);
        const newDiffTime = Math.abs(newEnd.getTime() - newStart.getTime());
        let newDays = Math.max(Math.ceil(newDiffTime / (1000 * 60 * 60 * 24)), 1);

        // Adatta per unità diverse (settimana, mese, ora)
        if (priceUnit === 'settimana') {
          originalDays = Math.max(Math.ceil(originalDays / 7), 1);
          newDays = Math.max(Math.ceil(newDays / 7), 1);
        } else if (priceUnit === 'mese') {
          originalDays = Math.max(Math.ceil(originalDays / 30), 1);
          newDays = Math.max(Math.ceil(newDays / 30), 1);
        }

        // 6. Calcola prezzi base
        const originalBasePrice = originalDays * listingPrice;
        const newBasePrice = newDays * listingPrice;
        const basePriceDiff = newBasePrice - originalBasePrice;

        // 7. Calcola commissioni 10% (la fee fissa NON si tocca)
        const originalCommission = (originalBasePrice * 10) / 100;
        const newCommission = (newBasePrice * 10) / 100;
        const commissionDiff = newCommission - originalCommission;

        // 8. Differenza totale (prezzo base + commissione, NO fee fissa)
        const totalDifference = basePriceDiff + commissionDiff;

        // 9. Calcola nuovi totali per aggiornare il DB
        const fixedFee = 2; // Fee fissa già pagata, non cambia
        const newTotal = newBasePrice + newCommission + fixedFee;
        const newPlatformFee = newCommission + fixedFee; // Per l'hubber
        const newHubberNet = newBasePrice - newCommission - fixedFee;

        // 10. Wallet usato originariamente
        const walletUsedCents = booking.wallet_used_cents || 0;
        const walletUsedEur = walletUsedCents / 100;
        const oldTotal = Number(booking.amount_total) || 0;
        const cardPaidOriginal = oldTotal - walletUsedEur;

        let refundedWallet = 0;
        let refundedCard = 0;
        let chargedExtra = 0;

        // 11. CASO RIMBORSO (accorciamento)
        if (totalDifference < 0) {
          const refundAmount = Math.abs(totalDifference);
          
          // Rimborsa proporzionalmente: prima carta, poi wallet
          if (cardPaidOriginal >= refundAmount) {
            refundedCard = refundAmount;
          } else {
            refundedCard = Math.max(cardPaidOriginal, 0);
            refundedWallet = refundAmount - refundedCard;
          }

          // Aggiorna wallet se necessario
          if (refundedWallet > 0) {
            const { data: userData } = await supabase
              .from("users")
              .select("renter_balance")
              .eq("id", renterId)
              .single();

            if (userData) {
              const newBalance = (userData.renter_balance || 0) + refundedWallet;
              await supabase
                .from("users")
                .update({ renter_balance: newBalance })
                .eq("id", renterId);
            }
          }

          // TODO: Quando Stripe sarà integrato, chiamare refund API per refundedCard
        }

        // 12. CASO PAGAMENTO EXTRA (allungamento)
        if (totalDifference > 0) {
          // TODO: Integrare con Stripe per il pagamento extra
          // Per ora assumiamo che il pagamento venga fatto
          chargedExtra = totalDifference;
        }

        // 13. Aggiorna la prenotazione su Supabase
        const { error: updateError } = await supabase
          .from("bookings")
          .update({
            start_date: newStartDate.split('T')[0],
            end_date: newEndDate.split('T')[0],
            amount_total: newTotal,
            platform_fee: newPlatformFee,
            hubber_net_amount: newHubberNet,
            updated_at: new Date().toISOString(),
          })
          .eq("id", bookingId);

        if (updateError) {
          console.error("Errore aggiornamento prenotazione:", updateError);
          return { success: false, error: "Errore durante la modifica." };
        }

        console.log("✅ Prenotazione modificata:", {
          originalDays,
          newDays,
          originalBasePrice,
          newBasePrice,
          basePriceDiff,
          commissionDiff,
          totalDifference,
          newTotal,
          refundedWallet,
          refundedCard,
          chargedExtra,
        });

        // ✅ Invia messaggio di sistema nella chat
        const listingTitle = booking.listing?.title || "l'annuncio";
        const newStartFormatted = new Date(newStartDate).toLocaleDateString("it-IT", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const newEndFormatted = new Date(newEndDate).toLocaleDateString("it-IT", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        
        let modifyMessage = `La prenotazione per "${listingTitle}" è stata modificata.\nNuove date: ${newStartFormatted} - ${newEndFormatted}.`;
        
        if (totalDifference < 0) {
          modifyMessage += ` Rimborso di €${Math.abs(totalDifference).toFixed(2)} effettuato.`;
        } else if (totalDifference > 0) {
          modifyMessage += ` Importo aggiuntivo di €${totalDifference.toFixed(2)} addebitato.`;
        }
        
        await sendBookingSystemMessage({
          bookingId,
          messageText: modifyMessage,
        });

        return {
          success: true,
          priceDifference: totalDifference,
          newTotal,
          refundedWallet: refundedWallet > 0 ? refundedWallet : undefined,
          refundedCard: refundedCard > 0 ? refundedCard : undefined,
          chargedExtra: chargedExtra > 0 ? chargedExtra : undefined,
        };

      } catch (e) {
        console.error("Errore inatteso modify booking:", e);
        return { success: false, error: "Errore imprevisto. Riprova più tardi." };
      }
    },

    /**
     * 🔹 NUOVO: STATISTICHE GUADAGNI HUBBER per MESE
     */
    getHubberEarningsByMonth: async (
      hubberId: string,
      year: number,
      month: number
    ) => {
      try {
        const start = new Date(Date.UTC(year, month - 1, 1));
        const end = new Date(Date.UTC(year, month, 1));

        const { data, error } = await supabase
          .from("bookings")
          .select(
            "start_date, amount_total, platform_fee, hubber_net_amount, status"
          )
          .eq("hubber_id", hubberId)
          .eq("status", "completed")
          .gte("start_date", start.toISOString())
          .lt("start_date", end.toISOString());

        if (error) {
          console.error("Errore getHubberEarningsByMonth:", error);
          return {
            totalNet: 0,
            totalGross: 0,
            totalPlatformFees: 0,
            completedCount: 0,
            points: [] as { label: string; value: number }[],
          };
        }

        const rows = data || [];

        let totalNet = 0;
        let totalGross = 0;
        let totalPlatformFees = 0;

        const perDay: Record<string, number> = {};

        rows.forEach((row: any) => {
          const net = Number(row.hubber_net_amount || 0);
          const gross = Number(row.amount_total || 0);
          const fee = Number(row.platform_fee || 0);
          totalNet += net;
          totalGross += gross;
          totalPlatformFees += fee;

          const d = new Date(row.start_date);
          const day = d.getUTCDate();
          const key = String(day).padStart(2, "0");
          perDay[key] = (perDay[key] || 0) + net;
        });

        const points = Object.keys(perDay)
          .sort()
          .map((day) => ({
            label: day,
            value: perDay[day],
          }));

        return {
          totalNet,
          totalGross,
          totalPlatformFees,
          completedCount: rows.length,
          points,
        };
      } catch (e) {
        console.error("Errore inatteso getHubberEarningsByMonth:", e);
        return {
          totalNet: 0,
          totalGross: 0,
          totalPlatformFees: 0,
          completedCount: 0,
          points: [] as { label: string; value: number }[],
        };
      }
    },

    /**
     * 🔹 NUOVO: STATISTICHE GUADAGNI HUBBER per ANNO
     */
    getHubberEarningsByYear: async (hubberId: string, year: number) => {
      try {
        const start = new Date(Date.UTC(year, 0, 1));
        const end = new Date(Date.UTC(year + 1, 0, 1));

        const { data, error } = await supabase
          .from("bookings")
          .select("start_date, hubber_net_amount, status")
          .eq("hubber_id", hubberId)
          .eq("status", "completed")
          .gte("start_date", start.toISOString())
          .lt("start_date", end.toISOString());

        if (error) {
          console.error("Errore getHubberEarningsByYear:", error);
          return {
            totalNet: 0,
            perMonth: [] as { month: number; totalNet: number }[],
          };
        }

        const rows = data || [];
        let totalNet = 0;
        const perMonth: Record<number, number> = {};

        rows.forEach((row: any) => {
          const net = Number(row.hubber_net_amount || 0);
          totalNet += net;
          const d = new Date(row.start_date);
          const monthIdx = d.getUTCMonth() + 1; // 1..12
          perMonth[monthIdx] = (perMonth[monthIdx] || 0) + net;
        });

        const result = Object.keys(perMonth)
          .map((m) => Number(m))
          .sort((a, b) => a - b)
          .map((m) => ({
            month: m,
            totalNet: perMonth[m],
          }));

        return { totalNet, perMonth: result };
      } catch (e) {
        console.error("Errore inatteso getHubberEarningsByYear:", e);
        return {
          totalNet: 0,
          perMonth: [] as { month: number; totalNet: number }[],
        };
      }
    },

    /**
     * 🔹 CARICA TUTTI I BOOKINGS DAL DATABASE SUPABASE
     * ✅ Usato nella Home per filtrare annunci disponibili per date
     */
    getAllFromDb: async (): Promise<BookingRequest[]> => {
      try {
        console.log("⚡ bookings.getAllFromDb – carico tutti i bookings dal database...");
        
        const { data, error } = await supabase
          .from("bookings")
          .select(`
            id,
            renter_id,
            hubber_id,
            listing_id,
            start_date,
            end_date,
            amount_total,
            platform_fee,
            hubber_net_amount,
            wallet_used_cents,
            status,
            payment_id,
            created_at
          `)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("❌ Errore fetch tutti i bookings:", error);
          return [];
        }

        if (!data) return [];

        console.log(`✅ Caricati ${data.length} bookings dal database`);

        // Mappa i dati dal database al formato app
        return data.map((row: any) => ({
          id: row.id,
          listingId: row.listing_id,
          renterId: row.renter_id,
          hubberId: row.hubber_id,
          startDate: row.start_date,
          endDate: row.end_date,
          status: row.status,
          totalPrice: row.amount_total ? row.amount_total / 100 : 0,
          createdAt: row.created_at,
          paymentStatus: row.payment_id ? 'paid' : 'pending',
        }));
      } catch (e) {
        console.error("❌ Errore inatteso getAllFromDb:", e);
        return [];
      }
    },
  },

  // =============================
  // 💳 PAYMENTS (Pagamenti reali)
  // =============================
  payments: {
    /**
     * Carica i pagamenti per un RENTER
     * Ritorna tutti i pagamenti dove renter_id = userId
     */
    getRenterPayments: async (renterId: string) => {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select(`
            *,
            booking:booking_id (
              id,
              start_date,
              end_date,
              listing:listing_id (
                title
              )
            )
          `)
          .eq('renter_id', renterId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Errore caricamento pagamenti renter:', error);
          return [];
        }

        return data || [];
      } catch (e) {
        console.error('❌ Errore inatteso getRenterPayments:', e);
        return [];
      }
    },

    /**
     * Carica i pagamenti per un HUBBER
     * Ritorna tutti i pagamenti dove hubber_id = userId
     */
    getHubberPayments: async (hubberId: string) => {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select(`
            *,
            booking:booking_id (
              id,
              start_date,
              end_date,
              renter:renter_id (
                id,
                first_name,
                last_name,
                email,
                avatar_url
              ),
              listing:listing_id (
                title
              )
            )
          `)
          .eq('hubber_id', hubberId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Errore caricamento pagamenti hubber:', error);
          return [];
        }

        return data || [];
      } catch (e) {
        console.error('❌ Errore inatteso getHubberPayments:', e);
        return [];
      }
    },
  },

  wallet: {
    // =========================
    // LEGACY: LOCAL STORAGE
    // =========================
    getTransactions: async () => {
      const stored = localStorage.getItem("transactions");
      return stored ? JSON.parse(stored) : MOCK_TRANSACTIONS;
    },

    addTransaction: async (tx: Transaction) => {
      const txs = await api.wallet.getTransactions();
      localStorage.setItem("transactions", JSON.stringify([tx, ...txs]));
    },

    // =========================
    // NUOVO: WALLET REALE SU SUPABASE
    // =========================

    /**
     * Ottiene (o crea) il saldo wallet reale da Supabase (in EURO)
     */
    getBalanceFromDb: async (userId: string, walletType: 'hubber' | 'renter' = 'hubber'): Promise<number> => {
      if (!userId) throw new Error("Missing userId for wallet");

      // 💰 Leggi da users.hubber_balance o users.renter_balance
      const balanceField = walletType === 'hubber' ? 'hubber_balance' : 'renter_balance';
      
      const { data, error } = await supabase
        .from("users")
        .select(balanceField)
        .eq("id", userId)
        .single();

      if (error) {
        console.error(`Errore getBalanceFromDb (${walletType}):`, error);
        return 0;
      }

      return data?.[balanceField] || 0;
    },

    /**
     * Restituisce lo storico movimenti reale da Supabase
     */
    getTransactionsFromDb: async (userId: string, walletType: 'hubber' | 'renter' = 'hubber'): Promise<any[]> => {
      if (!userId) throw new Error("Missing userId for wallet tx");

      // 💰 Filtra transazioni in base al tipo wallet
      const hubberSources = ['booking_payout', 'payout_request', 'adjustment'];
      const renterSources = ['booking_payment', 'refund', 'adjustment'];
      const sources = walletType === 'hubber' ? hubberSources : renterSources;

      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", userId)
        .in("source", sources)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Errore getTransactionsFromDb:", error);
        throw error;
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        amount: fromCents(row.amount_cents),
        balanceAfter: row.balance_after_cents
          ? fromCents(row.balance_after_cents)
          : null,
        type: row.type,
        source: row.source,
        description: row.description || "",
        relatedBookingId: row.related_booking_id || null,
        createdAt: row.created_at,
      }));
    },

    /**
     * Ricarica il wallet (top-up) su Supabase
     */
    topupFromDb: async (
      userId: string,
      amount: number,
      description: string = "Ricarica wallet"
    ): Promise<{ newBalance: number }> => {
      if (!userId) throw new Error("Missing userId for wallet topup");
      if (amount <= 0) throw new Error("Amount must be > 0");

      const currentBalance = await api.wallet.getBalanceFromDb(userId);
      const currentCents = toCents(currentBalance);
      const deltaCents = toCents(amount);
      const newBalanceCents = currentCents + deltaCents;

      const { error: txError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: userId,
          amount_cents: deltaCents,
          balance_after_cents: newBalanceCents,
          type: "credit",
          source: "topup",
          description,
          related_booking_id: null,
        });

      if (txError) {
        console.error("Errore insert wallet topup tx:", txError);
        throw txError;
      }

      const { error: updateError } = await supabase
        .from("wallets")
        .update({
          balance_cents: newBalanceCents,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Errore update wallet balance:", updateError);
        throw updateError;
      }

      return { newBalance: fromCents(newBalanceCents) };
    },

    /**
     * Addebita il wallet per una prenotazione (booking_payment)
     */
    chargeForBookingFromDb: async (
      userId: string,
      amount: number,
      bookingId?: string,
      description: string = "Pagamento prenotazione"
    ): Promise<{ newBalance: number }> => {
      if (!userId) throw new Error("Missing userId for wallet charge");
      if (amount <= 0) throw new Error("Amount must be > 0");

      const currentBalance = await api.wallet.getBalanceFromDb(userId);
      const currentCents = toCents(currentBalance);
      const deltaCents = toCents(amount);

      if (deltaCents > currentCents) {
        throw new Error("Saldo insufficiente nel wallet");
      }

      const newBalanceCents = currentCents - deltaCents;

      const { error: txError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: userId,
          amount_cents: -deltaCents,
          balance_after_cents: newBalanceCents,
          type: "debit",
          source: "booking_payment",
          description,
          related_booking_id: bookingId || null,
        });

      if (txError) {
        console.error("Errore insert wallet charge tx:", txError);
        throw txError;
      }

      const { error: updateError } = await supabase
        .from("wallets")
        .update({
          balance_cents: newBalanceCents,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Errore update wallet balance (charge):", updateError);
        throw updateError;
      }

      return { newBalance: fromCents(newBalanceCents) };
    },

    /**
     * ADMIN: Aggiunge fondi manualmente a un wallet (con motivazione)
     */
    adminCredit: async (
      userId: string,
      amount: number,
      reason: string,
      adminNote: string = "",
      walletType: 'hubber' | 'renter' = 'hubber'
    ): Promise<{ newBalance: number }> => {
      if (!userId) throw new Error("Missing userId");
      if (amount <= 0) throw new Error("Amount must be > 0");
      if (!reason) throw new Error("Reason is required");

      // Leggi saldo da users.hubber_balance o users.renter_balance
      const balanceField = walletType === 'hubber' ? 'hubber_balance' : 'renter_balance';
      
      const { data: userData, error: readError } = await supabase
        .from('users')
        .select(balanceField)
        .eq('id', userId)
        .single();

      if (readError) {
        console.error('Errore lettura saldo:', readError);
        throw readError;
      }

      const currentBalance = userData?.[balanceField] || 0;
      const newBalance = currentBalance + amount;

      const description = adminNote 
        ? `${reason}: ${adminNote}`
        : `${reason}`;

      // 1. Crea transazione
      const { error: txError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: userId,
          amount_cents: toCents(amount),
          balance_after_cents: toCents(newBalance),
          type: "credit",
          source: "adjustment",
          wallet_type: walletType, // ✨ NUOVO
          description,
          related_booking_id: null,
        });

      if (txError) {
        console.error("Errore admin credit transazione:", txError);
        throw txError;
      }

      // 2. Aggiorna users.hubber_balance o users.renter_balance
      const { error: updateError } = await supabase
        .from("users")
        .update({ [balanceField]: newBalance })
        .eq("id", userId);

      if (updateError) {
        console.error("Errore update users (admin credit):", updateError);
        throw updateError;
      }

      console.log(`✅ Admin credit: ${walletType} wallet +€${amount} → €${newBalance}`);
      return { newBalance };
    },

    /**
     * ADMIN: Rimuove fondi manualmente da un wallet (con motivazione)
     */
    adminDebit: async (
      userId: string,
      amount: number,
      reason: string,
      adminNote: string = "",
      walletType: 'hubber' | 'renter' = 'hubber'
    ): Promise<{ newBalance: number }> => {
      if (!userId) throw new Error("Missing userId");
      if (amount <= 0) throw new Error("Amount must be > 0");
      if (!reason) throw new Error("Reason is required");

      // Leggi saldo da users.hubber_balance o users.renter_balance
      const balanceField = walletType === 'hubber' ? 'hubber_balance' : 'renter_balance';
      
      const { data: userData, error: readError } = await supabase
        .from('users')
        .select(balanceField)
        .eq('id', userId)
        .single();

      if (readError) {
        console.error('Errore lettura saldo:', readError);
        throw readError;
      }

      const currentBalance = userData?.[balanceField] || 0;

      if (amount > currentBalance) {
        throw new Error(`Saldo insufficiente nel wallet ${walletType}`);
      }

      const newBalance = currentBalance - amount;

      const description = adminNote 
        ? `${reason}: ${adminNote}`
        : `${reason}`;

      // 1. Crea transazione
      const { error: txError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: userId,
          amount_cents: -toCents(amount),
          balance_after_cents: toCents(newBalance),
          type: "debit",
          source: "adjustment",
          wallet_type: walletType, // ✨ NUOVO
          description,
          related_booking_id: null,
        });

      if (txError) {
        console.error("Errore admin debit transazione:", txError);
        throw txError;
      }

      // 2. Aggiorna users.hubber_balance o users.renter_balance
      const { error: updateError } = await supabase
        .from("users")
        .update({ [balanceField]: newBalance })
        .eq("id", userId);

      if (updateError) {
        console.error("Errore update users (admin debit):", updateError);
        throw updateError;
      }

      console.log(`✅ Admin debit: ${walletType} wallet -€${amount} → €${newBalance}`);
      return { newBalance };
    },

    /**
     * Accredita l'hubber al completamento di una prenotazione
     */
    creditHubberForBooking: async (
      hubberId: string,
      netAmount: number,
      bookingId: string,
      listingTitle: string = ""
    ): Promise<{ newBalance: number }> => {
      if (!hubberId) throw new Error("Missing hubberId");
      if (netAmount <= 0) throw new Error("Amount must be > 0");

      const currentBalance = await api.wallet.getBalanceFromDb(hubberId);
      const currentCents = toCents(currentBalance);
      const deltaCents = toCents(netAmount);
      const newBalanceCents = currentCents + deltaCents;

      const description = listingTitle 
        ? `Guadagno prenotazione: ${listingTitle}`
        : `Guadagno prenotazione completata`;

      const { error: txError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: hubberId,
          amount_cents: deltaCents,
          balance_after_cents: newBalanceCents,
          type: "credit",
          source: "booking_earning",
          description,
          related_booking_id: bookingId,
        });

      if (txError) {
        console.error("Errore credit hubber:", txError);
        throw txError;
      }

      const { error: updateError } = await supabase
        .from("wallets")
        .update({
          balance_cents: newBalanceCents,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", hubberId);

      if (updateError) {
        console.error("Errore update wallet (hubber earning):", updateError);
        throw updateError;
      }

      return { newBalance: fromCents(newBalanceCents) };
    },

    /**
     * Rimborsa il renter per una prenotazione cancellata
     * ✅ Accredita su refund_balance_cents (100% utilizzabile sulle commissioni)
     */
    refundRenter: async (
      renterId: string,
      amount: number,
      bookingId: string,
      reason: string = "Rimborso prenotazione cancellata"
    ): Promise<{ newBalance: number }> => {
      if (!renterId) throw new Error("Missing renterId");
      if (amount <= 0) throw new Error("Amount must be > 0");

      // Ottieni il wallet corrente
      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", renterId)
        .single();

      const currentRefundCents = wallet?.refund_balance_cents || 0;
      const deltaCents = toCents(amount);
      const newRefundBalanceCents = currentRefundCents + deltaCents;

      const { error: txError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: renterId,
          amount_cents: deltaCents,
          balance_after_cents: newRefundBalanceCents,
          type: "credit",
          source: "refund",
          description: reason,
          related_booking_id: bookingId,
        });

      if (txError) {
        console.error("Errore refund renter:", txError);
        throw txError;
      }

      // ✅ Aggiorna refund_balance_cents invece di balance_cents
      const { error: updateError } = await supabase
        .from("wallets")
        .update({
          refund_balance_cents: newRefundBalanceCents,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", renterId);

      if (updateError) {
        console.error("Errore update wallet (refund):", updateError);
        throw updateError;
      }

      return { newBalance: fromCents(newRefundBalanceCents) };
    },

    /**
     * Bonus "Invita un amico" per il renter
     */
    creditReferralBonus: async (
      renterId: string,
      amount: number,
      referredUserName: string = ""
    ): Promise<{ newBalance: number }> => {
      if (!renterId) throw new Error("Missing renterId");
      if (amount <= 0) throw new Error("Amount must be > 0");

      const currentBalance = await api.wallet.getBalanceFromDb(renterId);
      const currentCents = toCents(currentBalance);
      const deltaCents = toCents(amount);
      const newBalanceCents = currentCents + deltaCents;

      const description = referredUserName 
        ? `Bonus Invita un Amico: ${referredUserName} si è iscritto!`
        : `Bonus Invita un Amico`;

      const { error: txError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: renterId,
          amount_cents: deltaCents,
          balance_after_cents: newBalanceCents,
          type: "credit",
          source: "referral_bonus",
          description,
          related_booking_id: null,
        });

      if (txError) {
        console.error("Errore referral bonus:", txError);
        throw txError;
      }

      const { error: updateError } = await supabase
        .from("wallets")
        .update({
          balance_cents: newBalanceCents,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", renterId);

      if (updateError) {
        console.error("Errore update wallet (referral):", updateError);
        throw updateError;
      }

      return { newBalance: fromCents(newBalanceCents) };
    },
  },

  payouts: {
    getAll: async () => {
      const stored = localStorage.getItem("payouts");
      return stored ? JSON.parse(stored) : [];
    },

    request: async (req: PayoutRequest) => {
      const payouts = await api.payouts.getAll();
      localStorage.setItem("payouts", JSON.stringify([req, ...payouts]));
    },
  },

  /* =======================================================
     PAGINE SITO (CMS SEMPLICE)
     ======================================================= */
  pages: {
    // tutte le pagine (per dashboard admin)
    fetchAll: async (): Promise<PageContent[]> => {
      const { data, error } = await supabase
        .from("page_contents")
        .select("*")
        .order("slug", { ascending: true });

      if (error) {
        console.error("pages.fetchAll error:", error);
        return [];
      }

      return (data || []).map(mapDbPageToAppPage);
    },

    // singola pagina per slug (per il sito pubblico)
    fetchBySlug: async (slug: string): Promise<PageContent | null> => {
      const { data, error } = await supabase
        .from("page_contents")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error || !data) {
        console.error("pages.fetchBySlug error:", error);
        return null;
      }

      return mapDbPageToAppPage(data);
    },

    // update pagina (usato dall'admin)
    update: async (
      id: string,
      payload: Partial<{ title: string; content: string; status?: string }>
    ): Promise<PageContent | null> => {
      const { data, error } = await supabase
        .from("page_contents")
        .update({
          ...(payload.title !== undefined && { title: payload.title }),
          ...(payload.content !== undefined && { content: payload.content }),
          ...(payload.status !== undefined && { status: payload.status }),
        })
        .eq("id", id)
        .select("*")
        .maybeSingle();

      if (error || !data) {
        console.error("pages.update error:", error);
        return null;
      }

      return mapDbPageToAppPage(data);
    },

    // crea nuova pagina (se vuoi poter aggiungere pagine dall'admin)
    create: async (payload: {
      slug: string;
      title: string;
      content: string;
      status?: string;
    }): Promise<PageContent | null> => {
      const { data, error } = await supabase
        .from("page_contents")
        .insert({
          slug: payload.slug,
          title: payload.title,
          content: payload.content,
          status: payload.status ?? "draft",
        })
        .select("*")
        .maybeSingle();

      if (error || !data) {
        console.error("pages.create error:", error);
        return null;
      }

      return mapDbPageToAppPage(data);
    },
  },

 admin: {
    getDisputes: async (): Promise<Dispute[]> => MOCK_DISPUTES,
    getReviews: async (): Promise<Review[]> => MOCK_REVIEWS,
    getInvoices: async (): Promise<Invoice[]> => MOCK_INVOICES,

    // ==========================================
// WALLET TRANSACTIONS (per Admin Dashboard)
// ==========================================
getAllWalletTransactions: async (): Promise<any[]> => {
  console.log('👑 admin.getAllWalletTransactions – inizio');
  try {
    const { data: txData, error: txError } = await supabase
      .from('wallet_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (txError) {
      console.error('❌ admin.getAllWalletTransactions – errore:', txError);
      return [];
    }

    if (!txData || txData.length === 0) {
      console.log('👑 admin.getAllWalletTransactions – nessuna transazione');
      return [];
    }

    // Prendi gli utenti dalla tabella USERS
    const userIds = [...new Set(txData.map(tx => tx.user_id))];
    const { data: usersData } = await supabase
      .from('users')
      .select('id, first_name, last_name, name, email, avatar_url, role, roles')
      .in('id', userIds);

    const usersMap = new Map((usersData || []).map(u => [u.id, u]));

    const result = txData.map((tx: any) => ({
      ...tx,
      user: usersMap.get(tx.user_id) || null,
      amountEur: tx.amount_cents ? tx.amount_cents / 100 : 0,
      balanceAfterEur: tx.balance_after_cents ? tx.balance_after_cents / 100 : 0,
    }));

    console.log('✅ admin.getAllWalletTransactions – trovate:', result.length);
    return result;
  } catch (e) {
    console.error('❌ admin.getAllWalletTransactions – eccezione:', e);
    return [];
  }
},

// ==========================================
// GET ALL WALLETS (per Admin Dashboard)
// ==========================================
getAllWallets: async (): Promise<any[]> => {
  console.log('👑 admin.getAllWallets – inizio');
  try {
    // 💰 Leggi DIRETTAMENTE da users invece che da wallets
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, last_name, name, email, avatar_url, role, roles, hubber_balance, renter_balance, updated_at')
      .order('updated_at', { ascending: false });

    if (usersError) {
      console.error('❌ admin.getAllWallets – errore:', usersError);
      return [];
    }

    if (!usersData || usersData.length === 0) {
      console.log('👑 admin.getAllWallets – nessun wallet');
      return [];
    }

    const result = usersData.map((u: any) => ({
      user_id: u.id,
      user: {
        id: u.id,
        first_name: u.first_name,
        last_name: u.last_name,
        name: u.name,
        email: u.email,
        avatar_url: u.avatar_url,
        role: u.role,
        roles: u.roles,
      },
      hubberBalanceEur: u.hubber_balance || 0, // ✨ Saldo hubber separato
      renterBalanceEur: u.renter_balance || 0, // ✨ Saldo renter separato
      balanceEur: (u.hubber_balance || 0) + (u.renter_balance || 0), // Totale per compatibilità
      currency: 'EUR',
      updated_at: u.updated_at,
    }));

    console.log('✅ admin.getAllWallets – trovati:', result.length);
    console.log('🔍 PRIMO WALLET DEBUG:', JSON.stringify(result[0], null, 2)); // ← DEBUG
    return result;
  } catch (e) {
    console.error('❌ admin.getAllWallets – eccezione:', e);
    return [];
  }
},
  // ==========================================
// GENERA FATTURE AL CHECKOUT (AUTOMATICO)
// ==========================================
generateInvoicesOnCheckout: async (bookingId: string): Promise<{
  renterInvoiceId?: string;
  hubberInvoiceId?: string;
  errors: string[];
}> => {
  const errors: string[] = [];
  let renterInvoiceId: string | undefined;
  let hubberInvoiceId: string | undefined;

  try {
    console.log("🧾 generateInvoicesOnCheckout – inizio per booking:", bookingId);

    // 1. Recupera le regole di fatturazione
    const rules = await api.admin.getInvoiceRules();
    const renterOnCheckout = rules.find((r: any) => r.rule_type === 'renter_on_checkout');
    const hubberOnCheckout = rules.find((r: any) => r.rule_type === 'hubber_on_checkout');

    console.log("🧾 Regole trovate:", {
      renterOnCheckout: renterOnCheckout?.enabled,
      hubberOnCheckout: hubberOnCheckout?.enabled
    });

    // Se nessuna regola è attiva, esci
    if (!renterOnCheckout?.enabled && !hubberOnCheckout?.enabled) {
      console.log("🧾 Nessuna regola checkout attiva, skip fatturazione");
      return { errors: [] };
    }

    // 2. Recupera le commissioni da platform_fees
    const platformFees = await api.admin.getFees();
    const renterCommissionPct = platformFees?.renter_percentage || 10;
    const hubberCommissionPct = platformFees?.hubber_percentage || 10;
    const superHubberCommissionPct = platformFees?.super_hubber_percentage || 5;
    const fixedFee = platformFees?.fixed_fee_eur || 2;

    console.log("🧾 Commissioni:", { renterCommissionPct, hubberCommissionPct, superHubberCommissionPct, fixedFee });

    // 3. Recupera i dati della prenotazione con renter, hubber e listing
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        *,
        renter:renter_id(id, first_name, last_name, public_name, email, address, phone_number),
        hubber:hubber_id(id, first_name, last_name, public_name, email, address, phone_number, is_super_hubber),
        listing:listing_id(id, title, price, price_unit)
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error("❌ Errore recupero prenotazione:", bookingError);
      errors.push("Impossibile recuperare i dati della prenotazione");
      return { errors };
    }

    console.log("🧾 Prenotazione recuperata:", {
      id: booking.id,
      renterId: booking.renter_id,
      hubberId: booking.hubber_id,
      amountTotal: booking.amount_total,
      hubberNetAmount: booking.hubber_net_amount
    });

    // Determina % commissione hubber (SuperHubber o normale)
    const isSuperHubber = booking.hubber?.is_super_hubber || false;
    const actualHubberCommissionPct = isSuperHubber ? superHubberCommissionPct : hubberCommissionPct;

    // Calcola prezzo base dal netto hubber
    const hubberNet = Number(booking.hubber_net_amount) || 0;
    const prezzoBase = hubberNet / (1 - actualHubberCommissionPct / 100);

    console.log("🧾 Calcoli:", { prezzoBase, hubberNet, isSuperHubber, actualHubberCommissionPct });

    // Ottieni settings fattura
    const settings = await api.admin.getInvoiceSettings();
    const vatRate = settings?.default_vat_rate || 22;

    // 4. FATTURA RENTER (se regola attiva)
    if (renterOnCheckout?.enabled && booking.renter) {
      try {
        console.log("🧾 Generazione fattura RENTER...");
        
        const renterName = booking.renter.public_name || 
          `${booking.renter.first_name || ''} ${booking.renter.last_name || ''}`.trim() ||
          booking.renter.email?.split('@')[0] || 'Renter';

        const listingTitle = booking.listing?.title || 'Noleggio';
        const startDate = new Date(booking.start_date).toLocaleDateString('it-IT');
        const endDate = new Date(booking.end_date).toLocaleDateString('it-IT');

        // ✅ Commissione renter = % variabile + fee fissa (TOTALE IVA INCLUSA)
        const renterCommissionVar = prezzoBase * renterCommissionPct / 100;
        const renterCommissionTotal = renterCommissionVar + fixedFee;
        
        // ✅ CORRETTO: L'IVA è già inclusa nella commissione, la scorporiamo
        const total = renterCommissionTotal;
        const subtotal = total / (1 + vatRate / 100); // Imponibile
        const vatAmount = total - subtotal; // IVA scorporata
        const invoice = await api.admin.createInvoice({
          invoiceType: 'renter',
          recipientId: booking.renter_id,
          recipientName: renterName,
          recipientEmail: booking.renter.email || '',
          recipientAddress: booking.renter.address || '',
          bookingId: bookingId,
          periodStart: booking.start_date,
          periodEnd: booking.end_date,
          subtotal: Math.round(subtotal * 100) / 100,
          vatRate: vatRate,
          description: `Commissione servizio RentHubber - Noleggio "${listingTitle}" - ${startDate} / ${endDate}`,
          lineItems: [
            { description: `Commissione variabile (${renterCommissionPct}%)`, quantity: 1, unitPrice: Math.round(renterCommissionVar * 100) / 100, total: Math.round(renterCommissionVar * 100) / 100 },
            { description: 'Fee fissa servizio', quantity: 1, unitPrice: fixedFee, total: fixedFee }
          ],
          notes: `Prenotazione #${bookingId.slice(0, 8)}`
        });

        renterInvoiceId = invoice?.id;
        console.log("✅ Fattura RENTER creata:", renterInvoiceId, "- Imponibile:", subtotal, "+ IVA:", vatAmount, "= Totale:", total);
      } catch (err: any) {
        console.error("❌ Errore fattura renter:", err);
        errors.push(`Fattura renter: ${err.message || 'errore sconosciuto'}`);
      }
    }

    // 5. FATTURA HUBBER (se regola attiva)
    if (hubberOnCheckout?.enabled && booking.hubber) {
      try {
        console.log("🧾 Generazione fattura HUBBER...");
        
        const hubberName = booking.hubber.public_name || 
          `${booking.hubber.first_name || ''} ${booking.hubber.last_name || ''}`.trim() ||
          booking.hubber.email?.split('@')[0] || 'Hubber';

        const listingTitle = booking.listing?.title || 'Noleggio';
        const startDate = new Date(booking.start_date).toLocaleDateString('it-IT');
        const endDate = new Date(booking.end_date).toLocaleDateString('it-IT');

        // ✅ Commissione hubber = % variabile + fee fissa (TOTALE IVA INCLUSA)
        const hubberCommissionVar = prezzoBase * actualHubberCommissionPct / 100;
        const hubberCommissionTotal = hubberCommissionVar + fixedFee;
        
        // ✅ CORRETTO: L'IVA è già inclusa nella commissione, la scorporiamo
        const total = hubberCommissionTotal;
        const subtotal = total / (1 + vatRate / 100); // Imponibile
        const vatAmount = total - subtotal; // IVA scorporata

        const invoice = await api.admin.createInvoice({
          invoiceType: 'hubber',
          recipientId: booking.hubber_id,
          recipientName: hubberName,
          recipientEmail: booking.hubber.email || '',
          recipientAddress: booking.hubber.address || '',
          bookingId: bookingId,
          periodStart: booking.start_date,
          periodEnd: booking.end_date,
          subtotal: Math.round(subtotal * 100) / 100,
          vatRate: vatRate,
          description: `Commissione RentHubber trattenuta - Noleggio "${listingTitle}" - ${startDate} / ${endDate}`,
          lineItems: [
            { description: `Commissione variabile (${actualHubberCommissionPct}%)`, quantity: 1, unitPrice: Math.round(hubberCommissionVar * 100) / 100, total: Math.round(hubberCommissionVar * 100) / 100 },
            { description: 'Fee fissa servizio', quantity: 1, unitPrice: fixedFee, total: fixedFee }
          ],
          notes: `Prenotazione #${bookingId.slice(0, 8)} - Netto accreditato: €${hubberNet.toFixed(2)}`
        });

        hubberInvoiceId = invoice?.id;
        console.log("✅ Fattura HUBBER creata:", hubberInvoiceId, "- Imponibile:", subtotal, "+ IVA:", vatAmount, "= Totale:", total);
      } catch (err: any) {
        console.error("❌ Errore fattura hubber:", err);
        errors.push(`Fattura hubber: ${err.message || 'errore sconosciuto'}`);
      }
    }

    console.log("🧾 generateInvoicesOnCheckout – completato");
    return { renterInvoiceId, hubberInvoiceId, errors };

  } catch (err: any) {
    console.error("❌ Errore generale generateInvoicesOnCheckout:", err);
    errors.push(err.message || 'Errore imprevisto');
    return { errors };
  }
},

// 🔹 UTENTI REALI per Admin (nessun mock)
    getAllUsers: async (): Promise<User[]> => {
      try {
        console.log("👑 admin.getAllUsers – inizio");

        const { data, error } = await supabase
          .from("users")
          .select("*")
          .order("created_at", { ascending: false });

        console.log("👑 admin.getAllUsers – raw:", data, error);

        if (error) {
          console.error("❌ admin.getAllUsers – errore Supabase:", error);
          return [];
        }

        if (!data || data.length === 0) {
          console.log("📭 admin.getAllUsers – nessun utente trovato in DB");
          return [];
        }

        const mapped = data.map(mapDbUserToAppUser);
        console.log(
          "✅ admin.getAllUsers – utenti mappati:",
          mapped.length,
          mapped
        );

        return mapped;
      } catch (err) {
        console.error("❌ admin.getAllUsers – errore inatteso:", err);
        return [];
      }
    },

    // 🔹 ANNUNCI REALI per la Dashboard Admin (nessun mock)
    getAllListings: async (): Promise<Listing[]> => {
      try {
        console.log("👑 admin.getAllListings – chiamo api.listings.getAll()");
        const listings = await api.listings.getAll();
        console.log(
          "✅ admin.getAllListings – annunci ricevuti:",
          listings.length
        );
        return listings;
      } catch (err) {
        console.error("❌ admin.getAllListings – errore inatteso:", err);
        return [];
      }
    },

    // 🔹 PRENOTAZIONI REALI per Admin Dashboard
    getAllBookings: async (): Promise<BookingRequest[]> => {
      try {
        console.log("👑 admin.getAllBookings – inizio");

        // 1. Recupera tutte le prenotazioni con listing
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select("*, listings(title, images)")
          .order("created_at", { ascending: false });

        if (bookingsError) {
          console.error("❌ admin.getAllBookings – errore Supabase:", bookingsError);
          return [];
        }

        if (!bookingsData || bookingsData.length === 0) {
          console.log("📭 admin.getAllBookings – nessuna prenotazione trovata");
          return [];
        }

        // 2. Estrai tutti gli ID unici di renter e hubber
        const renterIds = [...new Set(bookingsData.map((b: any) => b.renter_id).filter(Boolean))];
        const hubberIds = [...new Set(bookingsData.map((b: any) => b.hubber_id).filter(Boolean))];
        const allUserIds = [...new Set([...renterIds, ...hubberIds])];

        // 3. Recupera i profili degli utenti
        let usersMap: Record<string, any> = {};
        if (allUserIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from("users")
            .select("id, first_name, last_name, email, public_name, is_super_hubber")
            .in("id", allUserIds);

          if (usersError) {
            console.warn("⚠️ admin.getAllBookings – errore recupero utenti:", usersError);
          } else if (usersData) {
            usersData.forEach((user: any) => {
              usersMap[user.id] = user;
            });
          }
        }

        // 4. Mappa i dati con i nomi degli utenti
        const mapped: BookingRequest[] = bookingsData.map((row: any) => {
          const renter = usersMap[row.renter_id] || {};
          const hubber = usersMap[row.hubber_id] || {};

          // Costruisci nome renter
          const renterFirstName = renter.first_name || '';
          const renterLastName = renter.last_name || '';
          const renterPublicName = renter.public_name || '';
          const renterName = renterPublicName || `${renterFirstName} ${renterLastName}`.trim() || 'Renter sconosciuto';
          
          // Costruisci nome hubber
          const hubberFirstName = hubber.first_name || '';
          const hubberLastName = hubber.last_name || '';
          const hubberPublicName = hubber.public_name || '';
          const hubberName = hubberPublicName || `${hubberFirstName} ${hubberLastName}`.trim() || 'Hubber sconosciuto';

          return {
            id: row.id,
            listingId: row.listing_id,
            listingTitle: row.listings?.title || row.listing_title || 'Annuncio',
            listingImage: row.listings?.images?.[0] || row.listing_image || '',
            renterId: row.renter_id,
            renterName: renterName,
            renterEmail: renter.email || '',
            renterAvatar: row.renter_avatar || '',
            hostId: row.host_id || row.hubber_id,
            hubberId: row.hubber_id,
            hostName: hubberName,
            hubberName: hubberName,
            hubberEmail: hubber.email || '',
            dates: row.dates || `${row.start_date || ''} - ${row.end_date || ''}`,
            startDate: row.start_date,
            endDate: row.end_date,
            totalPrice: row.amount_total || row.total_price || 0,
            hubberNetAmount: row.hubber_net_amount || 0,
            status: row.status || 'pending',
            commission: row.platform_fee || 0,
            createdAt: row.created_at,
          };
        });

        console.log("✅ admin.getAllBookings – prenotazioni mappate:", mapped.length);
        return mapped;
      } catch (err) {
        console.error("❌ admin.getAllBookings – errore inatteso:", err);
        return [];
      }
    },

    // 🔹 AGGIORNA UTENTE (Admin)
    updateUser: async (userId: string, updates: Partial<User>): Promise<void> => {
      try {
        console.log("👑 admin.updateUser – userId:", userId, "updates:", updates);
        
        // Mappa i campi dall'app al DB
        const dbUpdates: any = {};
        
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.role !== undefined) dbUpdates.role = updates.role;
        if (updates.roles !== undefined) dbUpdates.roles = updates.roles;
        if (updates.isSuspended !== undefined) dbUpdates.is_suspended = updates.isSuspended;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.isSuperHubber !== undefined) dbUpdates.is_super_hubber = updates.isSuperHubber;
        if (updates.customFeePercentage !== undefined) dbUpdates.custom_fee_percentage = updates.customFeePercentage;
        if (updates.phoneNumber !== undefined) dbUpdates.phone_number = updates.phoneNumber;
        if (updates.emailVerified !== undefined) dbUpdates.email_verified = updates.emailVerified;
        if (updates.phoneVerified !== undefined) dbUpdates.phone_verified = updates.phoneVerified;
        if (updates.idDocumentVerified !== undefined) dbUpdates.id_document_verified = updates.idDocumentVerified;
        if (updates.verificationStatus !== undefined) dbUpdates.verification_status = updates.verificationStatus;
        if (updates.bankDetails === null) dbUpdates.bank_details = null;
        
        dbUpdates.updated_at = new Date().toISOString();
        
        const { error } = await supabase
          .from("users")
          .update(dbUpdates)
          .eq("id", userId);
          
        if (error) {
          console.error("❌ admin.updateUser – errore Supabase:", error);
          throw error;
        }
        
        console.log("✅ admin.updateUser – utente aggiornato con successo");
      } catch (err) {
        console.error("❌ admin.updateUser – errore inatteso:", err);
        throw err;
      }
    },

    // 🔹 ELIMINA UTENTE (Admin)
    deleteUser: async (userId: string): Promise<void> => {
      try {
        console.log("👑 admin.deleteUser – userId:", userId);
        
        // Prima elimina dalla tabella users
        const { error: dbError } = await supabase
          .from("users")
          .delete()
          .eq("id", userId);
          
        if (dbError) {
          console.error("❌ admin.deleteUser – errore eliminazione DB:", dbError);
          throw dbError;
        }
        
        // Nota: L'eliminazione da Supabase Auth richiede una funzione server-side
        // Per ora eliminiamo solo dal DB users
        console.log("✅ admin.deleteUser – utente eliminato dal DB");
      } catch (err) {
        console.error("❌ admin.deleteUser – errore inatteso:", err);
        throw err;
      }
    },

    // 🔹 CREA UTENTE (Admin)
    createUser: async (userData: {
      email: string;
      password: string;
      name: string;
      firstName?: string;
      lastName?: string;
      role: string;
      roles: string[];
      isSuperHubber?: boolean;
      customFeePercentage?: number;
    }): Promise<User | null> => {
      try {
        console.log("👑 admin.createUser – creazione utente:", userData.email);
        
        // 1. Crea utente in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              name: userData.name,
              first_name: userData.firstName,
              last_name: userData.lastName,
            }
          }
        });
        
        if (authError) {
          console.error("❌ admin.createUser – errore Auth:", authError);
          throw new Error(authError.message);
        }
        
        if (!authData.user) {
          throw new Error("Errore durante la creazione dell'utente");
        }
        
        const userId = authData.user.id;
        
        // 2. Crea profilo nella tabella users
        const { error: dbError } = await supabase
          .from("users")
          .insert({
            id: userId,
            email: userData.email,
            name: userData.name,
            first_name: userData.firstName || '',
            last_name: userData.lastName || '',
            public_name: userData.firstName ? `${userData.firstName} ${userData.lastName?.charAt(0) || ''}.`.trim() : userData.name,
            role: userData.role,
            roles: userData.roles,
            is_super_hubber: userData.isSuperHubber || false,
            custom_fee_percentage: userData.customFeePercentage || null,
            hubber_since: new Date().toISOString(),
            created_at: new Date().toISOString(),
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`,
          });
          
        if (dbError) {
          console.error("❌ admin.createUser – errore inserimento DB:", dbError);
          // Prova a eliminare l'utente Auth se l'inserimento DB fallisce
          throw new Error("Errore durante la creazione del profilo utente");
        }
        
        console.log("✅ admin.createUser – utente creato con successo:", userId);
        
        // Ritorna l'utente appena creato
        return {
          id: userId,
          email: userData.email,
          name: userData.name,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role as 'renter' | 'hubber' | 'admin',
          roles: userData.roles as ('renter' | 'hubber' | 'admin')[],
          isSuperHubber: userData.isSuperHubber || false,
          customFeePercentage: userData.customFeePercentage,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`,
          hubberSince: new Date().toISOString(),
          verificationStatus: 'unverified',
          emailVerified: false,
          phoneVerified: false,
          idDocumentVerified: false,
        };
      } catch (err: any) {
        console.error("❌ admin.createUser – errore inatteso:", err);
        throw err;
      }
    },

    // 🔹 RESET PASSWORD UTENTE (Admin)
    resetUserPassword: async (email: string): Promise<void> => {
      try {
        console.log("👑 admin.resetUserPassword – email:", email);
        
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        
        if (error) {
          console.error("❌ admin.resetUserPassword – errore:", error);
          throw error;
        }
        
        console.log("✅ admin.resetUserPassword – email inviata");
      } catch (err) {
        console.error("❌ admin.resetUserPassword – errore inatteso:", err);
        throw err;
      }
    },

    // 🔹 PAYMENTS (Transazioni) per Admin
    getAllPayments: async () => {
      try {
        console.log("👑 admin.getAllPayments – inizio");
        
        const { data: paymentsData, error: paymentsError } = await supabase
          .from("payments")
          .select("*")
          .order("created_at", { ascending: false });

        if (paymentsError) {
          console.error("❌ admin.getAllPayments – errore:", paymentsError);
          return [];
        }

        if (!paymentsData || paymentsData.length === 0) {
          console.log("👑 admin.getAllPayments – nessun pagamento");
          return [];
        }

        const renterIds = [...new Set(paymentsData.map(p => p.renter_id).filter(Boolean))];
        const hubberIds = [...new Set(paymentsData.map(p => p.hubber_id).filter(Boolean))];
        const allUserIds = [...new Set([...renterIds, ...hubberIds])];
        const bookingIds = [...new Set(paymentsData.map(p => p.booking_id).filter(Boolean))];

        const { data: usersData } = await supabase
          .from('users')
          .select('id, first_name, last_name, public_name, email, avatar_url')
          .in('id', allUserIds);

        const usersMap = new Map((usersData || []).map(u => [u.id, u]));

        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('id, start_date, end_date, status')
          .in('id', bookingIds);

        const bookingsMap = new Map((bookingsData || []).map(b => [b.id, b]));

        const result = paymentsData.map((p: any) => ({
          ...p,
          renter: usersMap.get(p.renter_id) || null,
          hubber: usersMap.get(p.hubber_id) || null,
          booking: bookingsMap.get(p.booking_id) || null,
        }));

        console.log("✅ admin.getAllPayments – trovati:", result.length);
        return result;
      } catch (err) {
        console.error("❌ admin.getAllPayments – errore inatteso:", err);
        return [];
      }
    },

    // 🔹 WALLETS per Admin (tutti i saldi utenti)
    getAllWallets: async () => {
      try {
        console.log("👑 admin.getAllWallets – inizio");
        
        // 💰 Leggi DIRETTAMENTE da users invece che da wallets
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, first_name, last_name, name, email, avatar_url, role, roles, hubber_balance, renter_balance, updated_at')
          .order('updated_at', { ascending: false });

        if (usersError) {
          console.error("❌ admin.getAllWallets – errore:", usersError);
          return [];
        }

        if (!usersData || usersData.length === 0) {
          console.log("👑 admin.getAllWallets – nessun wallet");
          return [];
        }

        const result = usersData.map((u: any) => ({
          user_id: u.id,
          user: {
            id: u.id,
            first_name: u.first_name,
            last_name: u.last_name,
            name: u.name,
            email: u.email,
            avatar_url: u.avatar_url,
            role: u.role,
            roles: u.roles,
          },
          hubberBalanceEur: u.hubber_balance || 0, // ✨ Saldo hubber separato
          renterBalanceEur: u.renter_balance || 0, // ✨ Saldo renter separato
          balanceEur: (u.hubber_balance || 0) + (u.renter_balance || 0), // Totale per compatibilità
          currency: 'EUR',
          updated_at: u.updated_at,
        }));

        console.log("✅ admin.getAllWallets – trovati:", result.length);
        console.log("🔍 PRIMO WALLET DEBUG:", JSON.stringify(result[0], null, 2)); // ← DEBUG
        return result;
      } catch (err) {
        console.error("❌ admin.getAllWallets – errore inatteso:", err);
        return [];
      }
    },

    // 🔹 WALLET TRANSACTIONS per Admin (tutti i movimenti)
    getAllWalletTransactions: async () => {
      try {
        console.log("👑 admin.getAllWalletTransactions – inizio");
        
        const { data: txData, error: txError } = await supabase
          .from("wallet_transactions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200);

        if (txError) {
          console.error("❌ admin.getAllWalletTransactions – errore:", txError);
          return [];
        }

        if (!txData || txData.length === 0) {
          console.log("👑 admin.getAllWalletTransactions – nessuna transazione");
          return [];
        }

        const userIds = [...new Set(txData.map(t => t.user_id).filter(Boolean))];
        const { data: usersData } = await supabase
          .from('users')
          .select('id, first_name, last_name, public_name, email, avatar_url')
          .in('id', userIds);

        const usersMap = new Map((usersData || []).map(u => [u.id, u]));

        const result = txData.map((t: any) => ({
          ...t,
          user: usersMap.get(t.user_id) || null,
          amountEur: (t.amount_cents || 0) / 100,
          balanceAfterEur: t.balance_after_cents ? t.balance_after_cents / 100 : null,
        }));

        console.log("✅ admin.getAllWalletTransactions – trovati:", result.length);
        return result;
      } catch (err) {
        console.error("❌ admin.getAllWalletTransactions – errore inatteso:", err);
        return [];
      }
    },

   // 🔹 PAYOUT REQUESTS per Admin
getAllPayouts: async () => {
  try {
    console.log("👑 admin.getAllPayouts – inizio");
    
    const { data: payoutsData, error: payoutsError } = await supabase
      .from("payout_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (payoutsError) {
      console.error("❌ admin.getAllPayouts – errore:", payoutsError);
      return [];
    }

    if (!payoutsData || payoutsData.length === 0) {
      console.log("👑 admin.getAllPayouts – nessun payout");
      return [];
    }

    const userIds = [...new Set(payoutsData.map(p => p.user_id).filter(Boolean))];
    
    // Carica utenti
    const { data: usersData } = await supabase
      .from('users')
      .select('id, first_name, last_name, public_name, email, avatar_url')
      .in('id', userIds);

    // ✅ Carica dati bancari dalla tabella separata
    const { data: bankData } = await supabase
      .from('bank_details')
      .select('user_id, account_holder_name, account_holder_surname, iban, bank_name, bic_swift')
      .in('user_id', userIds);

    const usersMap = new Map((usersData || []).map(u => [u.id, u]));
    const bankMap = new Map((bankData || []).map(b => [b.user_id, b]));

    const result = payoutsData.map((p: any) => {
      const user = usersMap.get(p.user_id) || null;
      const bank = bankMap.get(p.user_id) || null;
      
      return {
        ...p,
        user: user ? {
          ...user,
          bank_details: bank ? {
            iban: bank.iban,
            accountHolderName: bank.account_holder_name,
            accountHolderSurname: bank.account_holder_surname,
            bankName: bank.bank_name,
            bicSwift: bank.bic_swift,
          } : null
        } : null,
        amountEur: (p.amount_cents || 0) / 100,
      };
    });

    console.log("✅ admin.getAllPayouts – trovati:", result.length);
    return result;
  } catch (err) {
    console.error("❌ admin.getAllPayouts – errore inatteso:", err);
    return [];
  }
},

    // 🔹 Approva Payout
    approvePayout: async (payoutId: string, adminNotes?: string) => {
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from("payout_requests")
        .update({
          status: "approved",
          approved_at: now,
          admin_notes: adminNotes || null,
          updated_at: now,
        })
        .eq("id", payoutId);

      if (error) {
        console.error("❌ admin.approvePayout – errore:", error);
        throw error;
      }

      console.log("✅ Payout approvato:", payoutId);
      return true;
    },

    // 🔹 Rifiuta Payout (con rimborso automatico)
rejectPayout: async (payoutId: string, reason: string) => {
  const now = new Date().toISOString();
  
  // 1. Recupera i dati del payout
  const { data: payout, error: fetchError } = await supabase
    .from("payout_requests")
    .select("user_id, amount_cents")
    .eq("id", payoutId)
    .single();

  if (fetchError || !payout) {
    console.error("❌ admin.rejectPayout – payout non trovato:", fetchError);
    throw new Error("Payout non trovato");
  }

  // 2. Aggiorna stato a rejected
  const { error } = await supabase
    .from("payout_requests")
    .update({
      status: "rejected",
      rejected_at: now,
      rejection_reason: reason,
      updated_at: now,
    })
    .eq("id", payoutId);

  if (error) {
    console.error("❌ admin.rejectPayout – errore:", error);
    throw error;
  }

  // 3. Rimborsa l'importo sul wallet
  const { data: wallet } = await supabase
    .from("wallets")
    .select("balance_cents")
    .eq("user_id", payout.user_id)
    .single();

  const currentBalance = wallet?.balance_cents || 0;
  const newBalance = currentBalance + payout.amount_cents;

  await supabase
    .from("wallets")
    .update({ 
      balance_cents: newBalance,
      updated_at: now 
    })
    .eq("user_id", payout.user_id);

  // 4. Crea transazione di rimborso
  await supabase
    .from("wallet_transactions")
    .insert({
      user_id: payout.user_id,
      amount_cents: payout.amount_cents,
      balance_after_cents: newBalance,
      type: "credit",
      source: "refund",
      description: `Rimborso prelievo rifiutato: ${reason}`,
      related_payout_id: payoutId,
    });

  console.log("✅ Payout rifiutato e rimborsato:", payoutId);
  return true;
},

    // 🔹 Segna Payout come Processato (bonifico effettuato)
    processPayout: async (payoutId: string, transferReference: string) => {
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from("payout_requests")
        .update({
          status: "processed",
          processed_at: now,
          transfer_reference: transferReference,
          updated_at: now,
        })
        .eq("id", payoutId);

      if (error) {
        console.error("❌ admin.processPayout – errore:", error);
        throw error;
      }

      console.log("✅ Payout processato:", payoutId);
      return true;
    },

    // 🔹 PLATFORM FEES (leggi e salva su Supabase)
    getFees: async () => {
      const { data, error } = await supabase
        .from('platform_fees')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        console.error('Errore caricamento fees:', error);
        return null;
      }
      
      return data;
    },
    updateFees: async (fees: {
      renterPercentage: number;
      hubberPercentage: number;
      superHubberPercentage: number;
      fixedFeeEur: number;
    }) => {
      // Prima prova a fare update del record esistente
      const { data: existing } = await supabase
        .from('platform_fees')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existing?.id) {
        // Update record esistente
        const { data, error } = await supabase
          .from('platform_fees')
          .update({
            renter_percentage: fees.renterPercentage,
            hubber_percentage: fees.hubberPercentage,
            super_hubber_percentage: fees.superHubberPercentage,
            fixed_fee_eur: fees.fixedFeeEur,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          console.error('Errore aggiornamento fees:', error);
          throw error;
        }
        return data;
      } else {
        // Crea nuovo record se non esiste
        const { data, error } = await supabase
          .from('platform_fees')
          .insert({
            renter_percentage: fees.renterPercentage,
            hubber_percentage: fees.hubberPercentage,
            super_hubber_percentage: fees.superHubberPercentage,
            fixed_fee_eur: fees.fixedFeeEur
          })
          .select()
          .single();

        if (error) {
          console.error('Errore creazione fees:', error);
          throw error;
        }
        return data;
      }
    },

    // =============================================
    // 🔹 REFUNDS (Rimborsi) - Admin Functions
    // =============================================

   // Lista tutti i rimborsi
getAllRefunds: async () => {
  try {
    console.log("👑 admin.getAllRefunds – inizio");
    
    // Prima prendi i refunds
    const { data: refundsData, error: refundsError } = await supabase
      .from("refunds")
      .select("*")
      .order("requested_at", { ascending: false });

    if (refundsError) {
      console.error("❌ admin.getAllRefunds – errore:", refundsError);
      return [];
    }

    if (!refundsData || refundsData.length === 0) {
      console.log("👑 admin.getAllRefunds – nessun rimborso");
      return [];
    }

    // Prendi tutti gli user IDs (renter e hubber)
    const renterIds = [...new Set(refundsData.map(r => r.renter_id).filter(Boolean))];
    const hubberIds = [...new Set(refundsData.map(r => r.hubber_id).filter(Boolean))];
    const allUserIds = [...new Set([...renterIds, ...hubberIds])];
    const bookingIds = [...new Set(refundsData.map(r => r.booking_id).filter(Boolean))];

    // Prendi utenti
    const { data: usersData } = await supabase
      .from('users')
      .select('id, first_name, last_name, public_name, email, avatar_url')
      .in('id', allUserIds);

    const usersMap = new Map((usersData || []).map(u => [u.id, u]));

    // Prendi bookings
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('id, start_date, end_date, total_price, status, listing_id')
      .in('id', bookingIds);

    const bookingsMap = new Map((bookingsData || []).map(b => [b.id, b]));

    // Combina i dati
    const result = refundsData.map((r: any) => ({
      ...r,
      renter: usersMap.get(r.renter_id) || null,
      hubber: usersMap.get(r.hubber_id) || null,
      booking: bookingsMap.get(r.booking_id) || null,
    }));

    console.log("✅ admin.getAllRefunds – trovati:", result.length);
    return result;
  } catch (err) {
    console.error("❌ admin.getAllRefunds – errore inatteso:", err);
    return [];
  }
},

    // Statistiche rimborsi
    getRefundStats: async () => {
      try {
        const { data, error } = await supabase
          .from("refunds")
          .select("status, refund_amount");

        if (error) {
          console.error("❌ admin.getRefundStats – errore:", error);
          return { total: 0, pending: 0, approved: 0, rejected: 0, processed: 0, totalAmount: 0, pendingAmount: 0 };
        }

        const stats = {
          total: data?.length || 0,
          pending: data?.filter(r => r.status === 'pending').length || 0,
          approved: data?.filter(r => r.status === 'approved').length || 0,
          rejected: data?.filter(r => r.status === 'rejected').length || 0,
          processed: data?.filter(r => r.status === 'processed').length || 0,
          totalAmount: data?.reduce((sum, r) => sum + Number(r.refund_amount || 0), 0) || 0,
          pendingAmount: data?.filter(r => r.status === 'pending').reduce((sum, r) => sum + Number(r.refund_amount || 0), 0) || 0,
        };

        return stats;
      } catch (err) {
        console.error("❌ admin.getRefundStats – errore inatteso:", err);
        return { total: 0, pending: 0, approved: 0, rejected: 0, processed: 0, totalAmount: 0, pendingAmount: 0 };
      }
    },

    // Approva rimborso
    approveRefund: async (refundId: string, adminId: string, adminNotes?: string) => {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from("refunds")
        .update({
          status: "approved",
          approved_at: now,
          approved_by: adminId,
          admin_notes: adminNotes || null,
          updated_at: now,
        })
        .eq("id", refundId)
        .select()
        .single();

      if (error) {
        console.error("❌ admin.approveRefund – errore:", error);
        throw error;
      }

      console.log("✅ Rimborso approvato:", refundId);
      return data;
    },

    // Rifiuta rimborso
    rejectRefund: async (refundId: string, adminId: string, reason: string) => {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from("refunds")
        .update({
          status: "rejected",
          approved_by: adminId,
          rejection_reason: reason,
          updated_at: now,
        })
        .eq("id", refundId)
        .select()
        .single();

      if (error) {
        console.error("❌ admin.rejectRefund – errore:", error);
        throw error;
      }

      console.log("✅ Rimborso rifiutato:", refundId);
      return data;
    },

    // Processa rimborso (esegui il rimborso effettivo)
    processRefund: async (refundId: string, adminId: string, method: 'wallet' | 'stripe' | 'manual', stripeRefundId?: string) => {
      const now = new Date().toISOString();
      
      // Prima recupera i dati del rimborso
      const { data: refund, error: fetchError } = await supabase
        .from("refunds")
        .select("*, renter_id, refund_amount, booking_id")
        .eq("id", refundId)
        .single();

      if (fetchError || !refund) {
        console.error("❌ admin.processRefund – rimborso non trovato:", fetchError);
        throw new Error("Rimborso non trovato");
      }

      // Se il metodo è wallet, accredita sul wallet del renter
      if (method === 'wallet' && refund.renter_id && refund.refund_amount > 0) {
        const { data: currentWallet } = await supabase
          .from("wallets")
          .select("balance_eur")
          .eq("user_id", refund.renter_id)
          .single();

        const newBalance = (currentWallet?.balance_eur || 0) + refund.refund_amount;

        await supabase
          .from("wallets")
          .upsert({
            user_id: refund.renter_id,
            balance_eur: newBalance,
            updated_at: now
          }, { onConflict: 'user_id' });

        // Registra transazione wallet
        await supabase
          .from("wallet_transactions")
          .insert({
            user_id: refund.renter_id,
            type: 'credit',
            amount_eur: refund.refund_amount,
            balance_after_eur: newBalance,
            description: `Rimborso prenotazione #${refund.booking_id?.slice(0, 8) || 'N/A'}`,
            source: 'refund',
            reference_id: refundId
          });
      }

      // Aggiorna lo stato del rimborso
      const { data, error } = await supabase
        .from("refunds")
        .update({
          status: "processed",
          processed_at: now,
          processed_by: adminId,
          refund_method: method,
          stripe_refund_id: stripeRefundId || null,
          updated_at: now,
        })
        .eq("id", refundId)
        .select()
        .single();

      if (error) {
        console.error("❌ admin.processRefund – errore:", error);
        throw error;
      }

      console.log("✅ Rimborso processato:", refundId, "metodo:", method);
      return data;
    },

    // Crea rimborso manuale (admin)
    createRefund: async (refundData: {
      bookingId: string;
      renterId: string;
      hubberId: string;
      originalAmount: number;
      refundAmount: number;
      cancellationPolicy?: string;
      cancellationReason?: string;
      cancelledBy: 'renter' | 'hubber' | 'admin' | 'system';
      adminNotes?: string;
    }) => {
      const { data, error } = await supabase
        .from("refunds")
        .insert({
          booking_id: refundData.bookingId,
          renter_id: refundData.renterId,
          hubber_id: refundData.hubberId,
          original_amount: refundData.originalAmount,
          refund_amount: refundData.refundAmount,
          cancellation_policy: refundData.cancellationPolicy || null,
          cancellation_reason: refundData.cancellationReason || null,
          cancelled_by: refundData.cancelledBy,
          admin_notes: refundData.adminNotes || null,
          status: 'pending',
          requested_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("❌ admin.createRefund – errore:", error);
        throw error;
      }

      console.log("✅ Rimborso creato:", data.id);
      return data;
    },

    // ==========================================
    // INVOICES (Fatture)
    // ==========================================

    // Ottieni tutte le fatture
    async getAllInvoices() {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          recipient:users!recipient_id(id, first_name, last_name, public_name, email, avatar_url),
          booking:bookings(id, start_date, end_date, status)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Errore caricamento fatture:', error);
        return [];
      }
      return data || [];
    },

    // Ottieni fatture per tipo
    async getInvoicesByType(type: 'renter' | 'hubber') {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          recipient:users!recipient_id(id, first_name, last_name, public_name, email, avatar_url),
          booking:bookings(id, start_date, end_date, status)
        `)
        .eq('invoice_type', type)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Errore caricamento fatture:', error);
        return [];
      }
      return data || [];
    },

    // Ottieni statistiche fatture
    async getInvoiceStats() {
      const { data: invoices } = await supabase.from('invoices').select('*');
      const { data: creditNotes } = await supabase.from('credit_notes').select('*');
      
      const inv = invoices || [];
      const cn = creditNotes || [];
      
      const renterInvoices = inv.filter((i: any) => i.invoice_type === 'renter');
      const hubberInvoices = inv.filter((i: any) => i.invoice_type === 'hubber');
      
      return {
        totalInvoices: inv.length,
        renterInvoices: renterInvoices.length,
        hubberInvoices: hubberInvoices.length,
        totalCreditNotes: cn.length,
        totalInvoiced: inv.filter((i: any) => i.status !== 'cancelled').reduce((sum: number, i: any) => sum + Number(i.total || 0), 0),
        renterTotal: renterInvoices.filter((i: any) => i.status !== 'cancelled').reduce((sum: number, i: any) => sum + Number(i.total || 0), 0),
        hubberTotal: hubberInvoices.filter((i: any) => i.status !== 'cancelled').reduce((sum: number, i: any) => sum + Number(i.total || 0), 0),
        draftCount: inv.filter((i: any) => i.status === 'draft').length,
        issuedCount: inv.filter((i: any) => i.status === 'issued').length,
        sentCount: inv.filter((i: any) => i.status === 'sent').length,
        paidCount: inv.filter((i: any) => i.status === 'paid').length,
        cancelledCount: inv.filter((i: any) => i.status === 'cancelled').length,
      };
    },

    // Crea fattura
    async createInvoice(invoiceData: {
      invoiceType: 'renter' | 'hubber';
      recipientId: string;
      recipientName: string;
      recipientEmail: string;
      recipientVatNumber?: string;
      recipientFiscalCode?: string;
      recipientAddress?: string;
      recipientCity?: string;
      recipientZip?: string;
      recipientCountry?: string;
      bookingId?: string;
      payoutId?: string;
      periodStart?: string;
      periodEnd?: string;
      subtotal: number;
      vatRate?: number;
      description?: string;
      lineItems?: any[];
      notes?: string;
    }) {
      // Ottieni impostazioni per numero fattura
      const { data: settings } = await supabase
        .from('invoice_settings')
        .select('*')
        .single();
      
      const s = settings || { 
        renter_series_prefix: 'R', 
        hubber_series_prefix: 'H', 
        current_year: new Date().getFullYear(),
        renter_next_number: 1,
        hubber_next_number: 1,
        default_vat_rate: 22
      };
      
      const prefix = invoiceData.invoiceType === 'renter' ? s.renter_series_prefix : s.hubber_series_prefix;
      const nextNum = invoiceData.invoiceType === 'renter' ? s.renter_next_number : s.hubber_next_number;
      const invoiceNumber = `${prefix}-${s.current_year}-${String(nextNum).padStart(4, '0')}`;
      
      const vatRate = invoiceData.vatRate || s.default_vat_rate || 22;
      const vatAmount = (invoiceData.subtotal * vatRate) / 100;
      const total = invoiceData.subtotal + vatAmount;
      
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          invoice_type: invoiceData.invoiceType,
          recipient_id: invoiceData.recipientId,
          recipient_name: invoiceData.recipientName,
          recipient_email: invoiceData.recipientEmail,
          recipient_vat_number: invoiceData.recipientVatNumber || null,
          recipient_fiscal_code: invoiceData.recipientFiscalCode || null,
          recipient_address: invoiceData.recipientAddress || null,
          recipient_city: invoiceData.recipientCity || null,
          recipient_zip: invoiceData.recipientZip || null,
          recipient_country: invoiceData.recipientCountry || 'Italia',
          booking_id: invoiceData.bookingId || null,
          payout_id: invoiceData.payoutId || null,
          period_start: invoiceData.periodStart || null,
          period_end: invoiceData.periodEnd || null,
          subtotal: invoiceData.subtotal,
          vat_rate: vatRate,
          vat_amount: vatAmount,
          total: total,
          description: invoiceData.description || null,
          line_items: invoiceData.lineItems || [],
          notes: invoiceData.notes || null,
          status: 'issued',
issued_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Errore creazione fattura:', error);
        throw error;
      }
      
      // Aggiorna contatore
      const updateField = invoiceData.invoiceType === 'renter' ? 'renter_next_number' : 'hubber_next_number';
      await supabase
        .from('invoice_settings')
        .update({ [updateField]: nextNum + 1 })
        .eq('id', s.id);
      
      return data;
    },

    // Aggiorna stato fattura
    async updateInvoiceStatus(invoiceId: string, status: 'draft' | 'issued' | 'sent' | 'paid' | 'cancelled') {
      const updates: any = { status };
      
      if (status === 'issued') updates.issued_at = new Date().toISOString();
      if (status === 'sent') updates.sent_at = new Date().toISOString();
      if (status === 'paid') updates.paid_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', invoiceId)
        .select()
        .single();
      
      if (error) {
        console.error('Errore aggiornamento fattura:', error);
        throw error;
      }
      return data;
    },

    // Aggiorna fattura
    async updateInvoice(invoiceId: string, updates: any) {
      const { data, error } = await supabase
        .from('invoices')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .select()
        .single();
      
      if (error) {
        console.error('Errore aggiornamento fattura:', error);
        throw error;
      }
      return data;
    },

    // Elimina fattura (solo draft)
    async deleteInvoice(invoiceId: string) {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId)
        .eq('status', 'draft');
      
      if (error) {
        console.error('Errore eliminazione fattura:', error);
        throw error;
      }
      return true;
    },

    // ==========================================
    // CREDIT NOTES (Note di Credito)
    // ==========================================

    async getAllCreditNotes() {
      const { data, error } = await supabase
        .from('credit_notes')
        .select(`
          *,
          recipient:users!recipient_id(id, first_name, last_name, public_name, email, avatar_url),
          invoice:invoices(id, invoice_number, total)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Errore caricamento note di credito:', error);
        return [];
      }
      return data || [];
    },

    async createCreditNote(creditNoteData: {
      invoiceId: string;
      reason: string;
      subtotal?: number;
    }) {
      // Ottieni fattura originale
      const { data: invoice } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', creditNoteData.invoiceId)
        .single();
      
      if (!invoice) throw new Error('Fattura non trovata');
      
      // Ottieni impostazioni per numero
      const { data: settings } = await supabase
        .from('invoice_settings')
        .select('*')
        .single();
      
      const s = settings || { credit_note_prefix: 'NC', current_year: new Date().getFullYear(), credit_note_next_number: 1 };
      const creditNoteNumber = `${s.credit_note_prefix}-${s.current_year}-${String(s.credit_note_next_number).padStart(4, '0')}`;
      
      const subtotal = creditNoteData.subtotal || invoice.subtotal;
      const vatAmount = (subtotal * invoice.vat_rate) / 100;
      const total = subtotal + vatAmount;
      
      const { data, error } = await supabase
        .from('credit_notes')
        .insert({
          credit_note_number: creditNoteNumber,
          note_type: invoice.invoice_type,
          invoice_id: invoice.id,
          recipient_id: invoice.recipient_id,
          recipient_name: invoice.recipient_name,
          recipient_email: invoice.recipient_email,
          subtotal: subtotal,
          vat_rate: invoice.vat_rate,
          vat_amount: vatAmount,
          total: total,
          reason: creditNoteData.reason,
          status: 'issued',
          issued_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Errore creazione nota di credito:', error);
        throw error;
      }
      
      // Aggiorna contatore
      await supabase
        .from('invoice_settings')
        .update({ credit_note_next_number: s.credit_note_next_number + 1 })
        .eq('id', s.id);
      
      return data;
    },

    async updateCreditNoteStatus(creditNoteId: string, status: 'draft' | 'issued' | 'sent') {
      const updates: any = { status };
      if (status === 'sent') updates.sent_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('credit_notes')
        .update(updates)
        .eq('id', creditNoteId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    // ==========================================
    // INVOICE SETTINGS (Impostazioni)
    // ==========================================

    async getInvoiceSettings() {
      const { data, error } = await supabase
        .from('invoice_settings')
        .select('*')
        .single();
      
      if (error) {
        console.error('Errore caricamento impostazioni fatture:', error);
        return null;
      }
      return data;
    },

    async updateInvoiceSettings(settings: any) {
      // Prima ottieni l'ID del record esistente
      const { data: existing } = await supabase
        .from('invoice_settings')
        .select('id')
        .single();
      
      if (!existing) {
        // Crea se non esiste
        const { data, error } = await supabase
          .from('invoice_settings')
          .insert(settings)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      
      const { data, error } = await supabase
        .from('invoice_settings')
        .update(settings)
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) {
        console.error('Errore aggiornamento impostazioni:', error);
        throw error;
      }
      return data;
    },

// ==========================================
    // LOCAL INVOICE SETTINGS (Alias)
    // ==========================================

    getLocalInvoiceSettings: async () => {
      const { data, error } = await supabase
        .from('invoice_settings')
        .select('*')
        .single();
      
      if (error) {
        console.error('Errore caricamento invoice settings:', error);
        return null;
      }
      return data;
    },

    updateLocalInvoiceSettings: async (settings: any) => {
      const { data: existing } = await supabase
        .from('invoice_settings')
        .select('id')
        .single();
      
      if (!existing) {
        const { data, error } = await supabase
          .from('invoice_settings')
          .insert(settings)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      
      const { data, error } = await supabase
        .from('invoice_settings')
        .update(settings)
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) {
        console.error('Errore aggiornamento invoice settings:', error);
        throw error;
      }
      return data;
    },

// ==========================================
    // FATTURE UTENTE (per Dashboard Renter/Hubber)
    // ==========================================

    /**
     * Ottieni le fatture per un utente specifico (renter o hubber)
     * Usato nella Dashboard per mostrare le fatture all'utente
     */
    getInvoicesForUser: async (userId: string, userType?: 'renter' | 'hubber') => {
      try {
        console.log("📄 getInvoicesForUser –", userId, userType);

        let query = supabase
          .from("invoices")
          .select(`
            *,
            booking:booking_id(id, start_date, end_date, listing_id)
          `)
          .eq("recipient_id", userId)
          .order("created_at", { ascending: false });

        // Se specificato, filtra per tipo
        if (userType) {
          query = query.eq("invoice_type", userType);
        }

        const { data, error } = await query;

        if (error) {
          console.error("❌ Errore caricamento fatture utente:", error);
          return [];
        }

        console.log("✅ Fatture utente caricate:", data?.length || 0);
        return data || [];
      } catch (err) {
        console.error("❌ Errore inatteso getInvoicesForUser:", err);
        return [];
      }
    },

    // ==========================================
    // INVOICE RULES (Regole Automatiche)
    // ==========================================

    async getInvoiceRules() {
      const { data, error } = await supabase
        .from('invoice_rules')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Errore caricamento regole fatture:', error);
        return [];
      }
      return data || [];
    },

    async updateInvoiceRule(ruleId: string, updates: { enabled?: boolean; combine_monthly?: boolean }) {
      const { data, error } = await supabase
        .from('invoice_rules')
        .update(updates)
        .eq('id', ruleId)
        .select()
        .single();
      
      if (error) {
        console.error('Errore aggiornamento regola:', error);
        throw error;
      }
      return data;
    },

    // ==========================================
    // AGGIORNA STATO PRENOTAZIONE (con fatturazione automatica)
    // ==========================================
    updateBookingStatus: async (bookingId: string, status: string): Promise<boolean> => {
      try {
        console.log("👑 admin.updateBookingStatus –", bookingId, status);

        const { error } = await supabase.from("bookings").update({ status }).eq("id", bookingId);

        if (error) {
          console.error("❌ admin.updateBookingStatus – errore:", error);
          return false;
        }

        console.log("✅ admin.updateBookingStatus – stato aggiornato");

        // ✅ Se lo stato diventa 'completed', genera fatture automatiche
        if (status === 'completed') {
          console.log("🧾 Stato = completed, avvio generazione fatture...");
          
          try {
            const result = await api.admin.generateInvoicesOnCheckout(bookingId);
            
            if (result.errors.length > 0) {
              console.warn("⚠️ Errori durante generazione fatture:", result.errors);
            } else {
              console.log("✅ Fatture generate:", {
                renter: result.renterInvoiceId,
                hubber: result.hubberInvoiceId
              });
            }
          } catch (invoiceErr) {
            // Non bloccare il cambio stato se la fatturazione fallisce
            console.error("⚠️ Errore fatturazione (non bloccante):", invoiceErr);
          }
        }

        return true;
      } catch (err) {
        console.error("❌ admin.updateBookingStatus – errore inatteso:", err);
        return false;
      }
    },
},
  /* =======================================================
     DISPUTES (CONTESTAZIONI)
     ======================================================= */
  disputes: {
    create: async (payload: any) => {
      // Helper: converte stringhe vuote in null per campi UUID
      const toUuidOrNull = (value: any) => {
        if (!value || value === '') return null;
        return value;
      };

      // 🐛 DEBUG: Vediamo cosa arriva
      console.log('🔍 DISPUTES.CREATE - Payload ricevuto:', payload);
      console.log('🔍 booking_id tipo:', typeof payload.bookingId, 'valore:', payload.bookingId);
      console.log('🔍 contact_id tipo:', typeof payload.contactId, 'valore:', payload.contactId);
      console.log('🔍 dispute_id tipo:', typeof payload.disputeId, 'valore:', payload.disputeId);

      const insertData = {
        dispute_id: toUuidOrNull(payload.disputeId),
        contact_id: toUuidOrNull(payload.contactId),
        booking_id: toUuidOrNull(payload.bookingId),
        against_user_id: toUuidOrNull(payload.againstUserId),
        against_user_name: payload.againstUserName,
        opened_by_user_id: toUuidOrNull(payload.openedByUserId),
        opened_by_role: payload.openedByRole || null,
        role: payload.role,
        scope: payload.scope,
        reason: payload.reason,
        details: payload.details,
        refund_amount: payload.refundAmount
          ? Number(payload.refundAmount)
          : null,
        refund_currency: payload.refundCurrency || "EUR",
        refund_document_name: payload.refundDocumentName || null,
        evidence_images: payload.evidenceImages || [],
        status: payload.status || "open",
        created_at: payload.createdAt || new Date().toISOString(),
      };

      console.log('🔍 DISPUTES.CREATE - Dati da inserire:', insertData);

      const { data, error } = await supabase
        .from("disputes")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("❌ Errore salvataggio contestazione Supabase:", error);
        console.error("❌ Dati che hanno causato errore:", insertData);
        throw error;
      }

      return data;
    },
  },

  /* =======================================================
     MESSAGGI & CONVERSAZIONI (Supabase - fonte primaria)
     ======================================================= */
  messages: {
    // Ottieni tutte le conversazioni per un utente (escluse archiviate/eliminate)
    getConversationsForUser: async (userId: string, includeArchived: boolean = false) => {
      // Query semplice senza JOIN (le foreign key potrebbero non esistere)
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`renter_id.eq.${userId},hubber_id.eq.${userId}`)
        .order("last_message_at", { ascending: false });

      if (error) {
        console.error("Errore caricamento conversazioni:", error);
        return [];
      }

      // Filtra in base al ruolo dell'utente (renter o hubber)
      const filtered = (data || []).filter((c: any) => {
        const isRenter = c.renter_id === userId;
        // Usa false come default se il campo è null/undefined
        const isArchived = isRenter ? (c.archived_by_renter === true) : (c.archived_by_hubber === true);
        const isDeleted = isRenter ? (c.deleted_by_renter === true) : (c.deleted_by_hubber === true);
        
        // Se eliminata, non mostrare mai
        if (isDeleted) return false;
        
        // Se includeArchived è true, mostra solo archiviate
        // Altrimenti mostra solo non archiviate
        return includeArchived ? isArchived : !isArchived;
      });

      // Raccogli tutti gli user ID da caricare
      const userIds = new Set<string>();
      const listingIds = new Set<string>();
      filtered.forEach((c: any) => {
        if (c.renter_id) userIds.add(c.renter_id);
        if (c.hubber_id) userIds.add(c.hubber_id);
        if (c.listing_id) listingIds.add(c.listing_id);
      });

      // Carica utenti
      let usersMap: Record<string, any> = {};
      if (userIds.size > 0) {
        const { data: usersData } = await supabase
          .from("users")
          .select("id, first_name, last_name, public_name, avatar_url, email, phone_number")
          .in("id", Array.from(userIds));
        
        if (usersData) {
          usersData.forEach((u: any) => { usersMap[u.id] = u; });
        }
      }

      // Carica listings
      let listingsMap: Record<string, any> = {};
      if (listingIds.size > 0) {
        const { data: listingsData } = await supabase
          .from("listings")
          .select("id, title, images")
          .in("id", Array.from(listingIds));
        
        if (listingsData) {
          listingsData.forEach((l: any) => { listingsMap[l.id] = l; });
        }
      }

      // Conta messaggi non letti per ogni conversazione
      const conversationsWithUnread = await Promise.all(filtered.map(async (c: any) => {
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", c.id)
          .neq("from_user_id", userId)
          .eq("read", false);

        const isRenter = c.renter_id === userId;

        return {
          id: c.id,
          renterId: c.renter_id,
          hubberId: c.hubber_id,
          listingId: c.listing_id,
          bookingId: c.booking_id,
          isSupport: c.is_support,
          status: c.status || 'open',
          lastMessagePreview: c.last_message_preview,
          lastMessageAt: c.last_message_at,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
          renter: usersMap[c.renter_id] || null,
          hubber: usersMap[c.hubber_id] || null,
          listing: listingsMap[c.listing_id] || null,
          unreadCount: count || 0,
          unreadForRenter: c.unread_for_renter || false,
          unreadForHubber: c.unread_for_hubber || false,
          isArchived: isRenter ? c.archived_by_renter : c.archived_by_hubber,
        };
      }));

      return conversationsWithUnread;
    },

    // Archivia conversazione
    archiveConversation: async (conversationId: string, userId: string) => {
      // Prima determina se l'utente è renter o hubber
      const { data: conv } = await supabase
        .from("conversations")
        .select("renter_id, hubber_id")
        .eq("id", conversationId)
        .single();

      if (!conv) return false;

      const isRenter = conv.renter_id === userId;
      const field = isRenter ? "archived_by_renter" : "archived_by_hubber";

      const { error } = await supabase
        .from("conversations")
        .update({ [field]: true })
        .eq("id", conversationId);

      if (error) {
        console.error("Errore archiviazione:", error);
        return false;
      }
      return true;
    },

    // Ripristina conversazione dall'archivio
    unarchiveConversation: async (conversationId: string, userId: string) => {
      const { data: conv } = await supabase
        .from("conversations")
        .select("renter_id, hubber_id")
        .eq("id", conversationId)
        .single();

      if (!conv) return false;

      const isRenter = conv.renter_id === userId;
      const field = isRenter ? "archived_by_renter" : "archived_by_hubber";

      const { error } = await supabase
        .from("conversations")
        .update({ [field]: false })
        .eq("id", conversationId);

      if (error) {
        console.error("Errore ripristino:", error);
        return false;
      }
      return true;
    },

    // Elimina conversazione (soft delete)
    deleteConversation: async (conversationId: string, userId: string) => {
      const { data: conv } = await supabase
        .from("conversations")
        .select("renter_id, hubber_id")
        .eq("id", conversationId)
        .single();

      if (!conv) return false;

      const isRenter = conv.renter_id === userId;
      const field = isRenter ? "deleted_by_renter" : "deleted_by_hubber";

      const { error } = await supabase
        .from("conversations")
        .update({ [field]: true })
        .eq("id", conversationId);

      if (error) {
        console.error("Errore eliminazione:", error);
        return false;
      }
      return true;
    },

    // Ottieni TUTTE le conversazioni (per admin)
    getAllConversations: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("last_message_at", { ascending: false });

      if (error) {
        console.error("Errore caricamento conversazioni admin:", error);
        return [];
      }

      // Carica utenti e listings separatamente
      const userIds = new Set<string>();
      const listingIds = new Set<string>();
      (data || []).forEach((c: any) => {
        if (c.renter_id) userIds.add(c.renter_id);
        if (c.hubber_id) userIds.add(c.hubber_id);
        if (c.listing_id) listingIds.add(c.listing_id);
      });

      let usersMap: Record<string, any> = {};
      if (userIds.size > 0) {
        const { data: usersData } = await supabase
          .from("users")
          .select("id, first_name, last_name, public_name, avatar_url, email, status, is_super_hubber")
          .in("id", Array.from(userIds));
        if (usersData) usersData.forEach((u: any) => { usersMap[u.id] = u; });
      }

      let listingsMap: Record<string, any> = {};
      if (listingIds.size > 0) {
        const { data: listingsData } = await supabase
          .from("listings")
          .select("id, title, images, status")
          .in("id", Array.from(listingIds));
        if (listingsData) listingsData.forEach((l: any) => { listingsMap[l.id] = l; });
      }

      return (data || []).map((c: any) => ({
        id: c.id,
        renterId: c.renter_id,
        hubberId: c.hubber_id,
        listingId: c.listing_id,
        bookingId: c.booking_id,
        isSupport: c.is_support,
        status: c.status || 'open',
        lastMessagePreview: c.last_message_preview,
        lastMessageAt: c.last_message_at,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        renter: usersMap[c.renter_id] || null,
        hubber: usersMap[c.hubber_id] || null,
        listing: listingsMap[c.listing_id] || null,
      }));
    },

    // Ottieni messaggi di una conversazione
    getMessagesForConversation: async (conversationId: string) => {
      // 1. Carica messaggi
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Errore caricamento messaggi:", error);
        return [];
      }

      // 2. Controlla se è una conversazione di booking e lo stato
      let shouldHideContacts = false;
      if (conversationId.startsWith("conv-booking-")) {
        const bookingId = conversationId.replace("conv-booking-", "");
        
        const { data: booking } = await supabase
          .from("bookings")
          .select("status, completed_at, cancelled_at")
          .eq("id", bookingId)
          .single();

        if (booking) {
          // 🔒 Oscura contatti se cancellato
          if (booking.status === "cancelled") {
            shouldHideContacts = true;
          }
          
          // 🔒 Oscura contatti se completato da più di 48 ore
          if (booking.status === "completed" && booking.completed_at) {
            const completedDate = new Date(booking.completed_at);
            const now = new Date();
            const hoursPassed = (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60);
            
            if (hoursPassed >= 48) {
              shouldHideContacts = true;
              console.log(`🔒 Booking ${bookingId} completato da ${Math.floor(hoursPassed)} ore - Contatti oscurati`);
            }
          }
        }
      }

      // 3. Restituisci messaggi con hasConfirmedBooking aggiornato
      return (data || []).map((m: any) => ({
        id: m.id,
        conversationId: m.conversation_id,
        fromUserId: m.from_user_id,
        toUserId: m.to_user_id,
        text: m.text,
        createdAt: m.created_at,
        read: m.read,
        flagged: m.flagged,
        flagReason: m.flag_reason,
        isAdminMessage: m.is_admin_message,
        adminId: m.admin_id,
        hasConfirmedBooking: shouldHideContacts ? false : m.has_confirmed_booking,
        isSupport: m.is_support,
        isSystemMessage: m.is_system_message,
      }));
    },

    // Conta messaggi non letti
    getUnreadCount: async (userId: string) => {
      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("to_user_id", userId)
        .eq("read", false);

      if (error) {
        console.error("Errore conteggio non letti:", error);
        return 0;
      }
      return count || 0;
    },

    // Segna messaggi come letti
    markAsRead: async (conversationId: string, userId: string) => {
      // Segna come letti i messaggi ricevuti (non inviati da me)
      const { error } = await supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", conversationId)
        .neq("from_user_id", userId)
        .eq("read", false);

      if (error) {
        console.error("Errore marcatura letti:", error);
        return false;
      }
      return true;
    },

    // Rileva contenuti vietati
    detectForbiddenContent: (text: string): { hasForbidden: boolean; reasons: string[] } => {
      const reasons: string[] = [];

      const phoneRegex = /(\+?\d[\d\s\-]{6,}\d)/gi;
      const spacedPhoneRegex = /(\d{2}\s\d{2}\s\d{2}\s\d{2,})/gi;
      const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
      const urlRegex = /(https?:\/\/[^\s]+)/gi;
      const handleRegex = /@[a-z0-9_.]{3,}/gi;

      if (phoneRegex.test(text) || spacedPhoneRegex.test(text)) {
        reasons.push("telefono");
      }
      if (emailRegex.test(text)) {
        reasons.push("email");
      }
      if (urlRegex.test(text)) {
        reasons.push("link");
      }
      if (handleRegex.test(text)) {
        reasons.push("social");
      }

      const forbiddenWords = ["facebook", "instagram", "whatsapp", "telegram", "tiktok", "snapchat", "messenger"];
      const lowerText = text.toLowerCase();
      forbiddenWords.forEach((word) => {
        if (lowerText.includes(word) && !reasons.includes("social")) {
          reasons.push("social");
        }
      });

      return { hasForbidden: reasons.length > 0, reasons };
    },

    // Sanitizza contenuto (rimuovi contatti)
    sanitizeContent: (text: string, allowContacts: boolean) => {
      if (allowContacts) {
        return { ok: true, cleaned: text, blockedContacts: false };
      }

      const forbiddenWords = [
        "facebook", "instagram", "whatsapp", "telegram",
        "tiktok", "snapchat", "messenger",
      ];

      const forbiddenPhrases = [
        "ti mando il numero", "ti do il numero", "ti scrivo il numero",
        "ti scrivo su whatsapp", "ti scrivo su instagram", "ti scrivo su telegram",
        "ti cerco su whatsapp", "ti cerco su instagram", "ti cerco su telegram",
        "ti chiamo su whatsapp", "ti chiamo su instagram", "ti chiamo su telegram",
      ];

      const phoneRegex = /(\+?\d[\d\s\-]{6,}\d)/gi;
      const spacedPhoneRegex = /(\d{2}\s\d{2}\s\d{2}\s\d{2,})/gi;
      const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
      const urlRegex = /(https?:\/\/[^\s]+)/gi;
      const handleRegex = /@[a-z0-9_.]{3,}/gi;

      let cleaned = text;
      cleaned = cleaned.replace(phoneRegex, "***");
      cleaned = cleaned.replace(spacedPhoneRegex, "***");
      cleaned = cleaned.replace(emailRegex, "***");
      cleaned = cleaned.replace(urlRegex, "***");
      cleaned = cleaned.replace(handleRegex, "***");

      forbiddenWords.forEach((word) => {
        const regex = new RegExp(word, "gi");
        cleaned = cleaned.replace(regex, "***");
      });

      forbiddenPhrases.forEach((phrase) => {
        const regex = new RegExp(phrase, "gi");
        cleaned = cleaned.replace(regex, "***");
      });

      const blocked = cleaned !== text;
      return { ok: true, cleaned, blockedContacts: blocked };
    },

    // Invia messaggio (user normale)
    sendMessage: async (params: {
      fromUserId: string;
      toUserId: string;
      text: string;
      listingId?: string;
      bookingId?: string;
      isSupport?: boolean;
      hasConfirmedBooking?: boolean;
    }) => {
      const { fromUserId, toUserId, text, listingId, bookingId, isSupport, hasConfirmedBooking } = params;

      // Rileva contenuti vietati
      const { hasForbidden, reasons } = api.messages.detectForbiddenContent(text);
      const { cleaned, blockedContacts } = api.messages.sanitizeContent(text, !!hasConfirmedBooking);

      const now = new Date().toISOString();

      // Cerca conversazione esistente
      let query = supabase
        .from("conversations")
        .select("id")
        .eq("is_support", !!isSupport)
        .or(`and(renter_id.eq.${fromUserId},hubber_id.eq.${toUserId}),and(renter_id.eq.${toUserId},hubber_id.eq.${fromUserId})`);
      
      // ✅ Se c'è bookingId, cerca per quello specifico
      if (bookingId) {
        query = query.eq("booking_id", bookingId);
      }
      
      const { data: existingConv } = await query.maybeSingle();

      let conversationId = existingConv?.id;

      if (!conversationId) {
        // Crea nuova conversazione
        const newConvId = `conv-${Date.now()}`;
        const { error: convError } = await supabase.from("conversations").insert({
          id: newConvId,
          renter_id: fromUserId,
          hubber_id: toUserId,
          listing_id: listingId || null,
          booking_id: bookingId || null,
          is_support: !!isSupport,
          status: 'open',
          last_message_preview: cleaned.slice(0, 80),
          last_message_at: now,
          created_at: now,
          updated_at: now,
        });

        if (convError) {
          console.error("Errore creazione conversazione:", convError);
          throw convError;
        }
        conversationId = newConvId;
      } else {
        // Aggiorna conversazione esistente
        await supabase.from("conversations").update({
          last_message_preview: cleaned.slice(0, 80),
          last_message_at: now,
          updated_at: now,
        }).eq("id", conversationId);
      }

      // Inserisci messaggio
      const msgId = `msg-${Date.now()}`;
      const { error: msgError } = await supabase.from("messages").insert({
        id: msgId,
        conversation_id: conversationId,
        from_user_id: fromUserId,
        to_user_id: toUserId,
        text: cleaned,
        created_at: now,
        read: false,
        flagged: hasForbidden,
        flag_reason: hasForbidden ? reasons.join(", ") : null,
        has_confirmed_booking: !!hasConfirmedBooking,
        is_support: !!isSupport,
        is_admin_message: false,
      });

      if (msgError) {
        console.error("Errore invio messaggio:", msgError);
        throw msgError;
      }

      return {
        message: { id: msgId, conversationId, fromUserId, toUserId, text: cleaned, createdAt: now },
        conversationId,
        blockedContacts,
        flagged: hasForbidden,
      };
    },

    // Invia messaggio come admin
    sendAdminMessage: async (params: {
      conversationId: string;
      adminId: string;
      toUserId: string;
      text: string;
    }) => {
      const { conversationId, adminId, toUserId, text } = params;
      const now = new Date().toISOString();
      const msgId = `msg-admin-${Date.now()}`;

      const { error: msgError } = await supabase.from("messages").insert({
        id: msgId,
        conversation_id: conversationId,
        from_user_id: adminId,
        to_user_id: toUserId,
        text: text,
        created_at: now,
        read: false,
        flagged: false,
        is_admin_message: true,
        admin_id: adminId,
        is_support: true,
      });

      if (msgError) {
        console.error("Errore invio messaggio admin:", msgError);
        throw msgError;
      }

      // Aggiorna conversazione
      await supabase.from("conversations").update({
        last_message_preview: `Support: ${text.slice(0, 60)}`,
        last_message_at: now,
        updated_at: now,
      }).eq("id", conversationId);

      // Log azione admin
      await api.messages.logAdminAction(adminId, "send_message", "conversation", conversationId, { toUserId, textPreview: text.slice(0, 50) });

      return { id: msgId, conversationId, text, createdAt: now };
    },

    // Aggiorna stato conversazione
    updateConversationStatus: async (conversationId: string, status: string, adminId?: string) => {
      const { error } = await supabase
        .from("conversations")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      if (error) {
        console.error("Errore aggiornamento stato conversazione:", error);
        return false;
      }

      if (adminId) {
        await api.messages.logAdminAction(adminId, "update_status", "conversation", conversationId, { newStatus: status });
      }

      return true;
    },

    // Segnala/rimuovi segnalazione messaggio
    toggleMessageFlag: async (messageId: string, flagged: boolean, reason?: string, adminId?: string) => {
      const { error } = await supabase
        .from("messages")
        .update({ 
          flagged, 
          flag_reason: flagged ? reason : null 
        })
        .eq("id", messageId);

      if (error) {
        console.error("Errore toggle flag messaggio:", error);
        return false;
      }

      if (adminId) {
        await api.messages.logAdminAction(adminId, flagged ? "flag_message" : "unflag_message", "message", messageId, { reason });
      }

      return true;
    },

    // Elimina messaggio (admin)
    deleteMessage: async (messageId: string, adminId: string) => {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId);

      if (error) {
        console.error("Errore eliminazione messaggio:", error);
        return false;
      }

      await api.messages.logAdminAction(adminId, "delete_message", "message", messageId, {});
      return true;
    },

    // Log azione admin
    logAdminAction: async (adminId: string, actionType: string, targetType: string, targetId: string, details: any) => {
      const { error } = await supabase.from("admin_actions_log").insert({
        admin_id: adminId,
        action_type: actionType,
        target_type: targetType,
        target_id: targetId,
        details: details,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.warn("Errore log azione admin:", error);
      }
    },

    // Ottieni log azioni admin
    getAdminActionsLog: async (limit: number = 50) => {
      const { data, error } = await supabase
        .from("admin_actions_log")
        .select(`
          *,
          admin:users!admin_actions_log_admin_id_fkey(id, first_name, last_name, public_name)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Errore caricamento log admin:", error);
        return [];
      }

      return data || [];
    },

    // Conta conversazioni per stato (per KPI admin)
    getConversationStats: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("status");

      if (error) {
        console.error("Errore stats conversazioni:", error);
        return { total: 0, open: 0, closed: 0, flagged: 0, priority: 0 };
      }

      const stats = {
        total: data?.length || 0,
        open: data?.filter((c: any) => c.status === 'open').length || 0,
        closed: data?.filter((c: any) => c.status === 'closed').length || 0,
        flagged: data?.filter((c: any) => c.status === 'flagged').length || 0,
        priority: data?.filter((c: any) => c.status === 'priority').length || 0,
        resolved: data?.filter((c: any) => c.status === 'resolved').length || 0,
      };

      return stats;
    },

    // Conta messaggi segnalati
    getFlaggedMessagesCount: async () => {
      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("flagged", true);

      return count || 0;
    },
  },

  /* =======================================================
     SUPPORTO TICKET SYSTEM
     ======================================================= */
  support: {
    // Ottieni tutti i ticket (per admin/support)
    getAllTickets: async () => {
      console.log("🎫 [ADMIN] Caricamento tutti i ticket...");
      
      // Query semplice senza JOIN
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("updated_at", { ascending: false });

      console.log("🎫 [ADMIN] Query result - data:", data, "error:", error);

      if (error) {
        console.error("❌ [ADMIN] Errore caricamento ticket:", error);
        return [];
      }

      if (!data || data.length === 0) {
        console.log("🎫 [ADMIN] Nessun ticket trovato");
        return [];
      }

      console.log("✅ [ADMIN] Ticket caricati:", data.length, data);

      // Carica utenti separatamente
      const userIds = [...new Set(data.map(t => t.user_id).filter(Boolean))];
      const assignedIds = [...new Set(data.map(t => t.assigned_to).filter(Boolean))];
      const allUserIds = [...new Set([...userIds, ...assignedIds])];

      let users: any[] = [];
      if (allUserIds.length > 0) {
        const { data: usersData } = await supabase
          .from("users")
          .select("id, first_name, last_name, public_name, avatar_url, email")
          .in("id", allUserIds);
        users = usersData || [];
      }

      // Associa utenti ai ticket
      return data.map(ticket => ({
        ...ticket,
        user: users.find(u => u.id === ticket.user_id) || null,
        assigned: users.find(u => u.id === ticket.assigned_to) || null,
      }));
    },

    // Ottieni ticket per utente specifico
    getTicketsForUser: async (userId: string) => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Errore caricamento ticket utente:", error);
        return [];
      }

      return data || [];
    },

    // Ottieni singolo ticket con messaggi
    getTicketWithMessages: async (ticketId: string) => {
      const { data: ticket, error: ticketError } = await supabase
        .from("support_tickets")
        .select(`
          *,
          user:users!support_tickets_user_id_fkey(id, first_name, last_name, public_name, avatar_url, email),
          assigned:users!support_tickets_assigned_to_fkey(id, first_name, last_name, public_name, avatar_url)
        `)
        .eq("id", ticketId)
        .single();

      if (ticketError) {
        console.error("Errore caricamento ticket:", ticketError);
        return null;
      }

      const { data: messages, error: msgError } = await supabase
        .from("support_messages")
        .select(`
          *,
          sender:users!support_messages_sender_id_fkey(id, first_name, last_name, public_name, avatar_url)
        `)
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (msgError) {
        console.error("Errore caricamento messaggi ticket:", msgError);
      }

      return { ticket, messages: messages || [] };
    },

    // Crea nuovo ticket (utente)
    createTicket: async (params: {
      userId: string;
      subject?: string;
      category?: string;
      initialMessage: string;
      relatedBookingId?: string;
      relatedListingId?: string;
    }) => {
      const { userId, subject, category, initialMessage, relatedBookingId, relatedListingId } = params;
      const now = new Date().toISOString();
      const timestamp = Date.now();
      const ticketId = `ticket-${timestamp}`;
      const ticketNumber = `TK-${timestamp.toString().slice(-8)}`; // Es: TK-12345678

      // Crea ticket
      const { error: ticketError } = await supabase.from("support_tickets").insert({
        id: ticketId,
        ticket_number: ticketNumber,
        user_id: userId,
        subject: subject || "Richiesta supporto",
        category: category || "other",
        status: "open",
        priority: "medium",
        related_booking_id: relatedBookingId || null,
        related_listing_id: relatedListingId || null,
        created_at: now,
        updated_at: now,
        last_message_at: now,
        last_message_preview: initialMessage.slice(0, 100),
        unread_by_support: true,
        unread_by_user: false,
      });

      if (ticketError) {
        console.error("Errore creazione ticket:", ticketError);
        throw ticketError;
      }

      // Aggiungi primo messaggio
      const { error: msgError } = await supabase.from("support_messages").insert({
        id: `smsg-${timestamp}`,
        ticket_id: ticketId,
        sender_id: userId,
        sender_type: "user",
        message: initialMessage,
        is_internal: false,
        created_at: now,
      });

      if (msgError) {
        console.error("Errore creazione messaggio iniziale:", msgError);
      }

      return ticketId;
    },

// Crea ticket da disputa (admin)
    createTicketFromDispute: async (dispute: any) => {
      const now = new Date().toISOString();
      const timestamp = Date.now();
      const ticketId = `ticket-dsp-${timestamp}`;
      const ticketNumber = `TK-DSP-${timestamp.toString().slice(-8)}`;

      // Crea ticket collegato alla disputa
      const { error: ticketError } = await supabase.from("support_tickets").insert({
        id: ticketId,
        ticket_number: ticketNumber,
        user_id: dispute.opened_by_user_id,
        subject: `Controversia: ${dispute.reason?.replace(/_/g, ' ') || 'Disputa'}`,
        category: "dispute",
        status: "open",
        priority: "high",
        related_dispute_id: dispute.id,
        created_at: now,
        updated_at: now,
        last_message_at: now,
        last_message_preview: dispute.details?.slice(0, 100) || 'Nuova controversia',
        unread_by_support: true,
        unread_by_user: false,
      });

      if (ticketError) {
        console.error("Errore creazione ticket da disputa:", ticketError);
        throw ticketError;
      }

      // Aggiungi messaggio iniziale con dettagli disputa
      const bookingCode = dispute.booking_id ? `#${dispute.booking_id.slice(0, 6).toUpperCase()}` : 'N/A';
      const initialMessage = `🚨 CONTROVERSIA APERTA

📋 ID Disputa: ${dispute.dispute_id || dispute.id}
🎫 Prenotazione: ${bookingCode}
👤 Aperta da: ${dispute.opened_by_role === 'hubber' ? 'Hubber' : 'Renter'}
📝 Motivo: ${dispute.reason?.replace(/_/g, ' ')}
💬 Dettagli: ${dispute.details || 'N/A'}
💰 Importo richiesto: ${dispute.refund_amount ? `€${dispute.refund_amount}` : 'N/A'}
📅 Data apertura: ${new Date(dispute.created_at).toLocaleDateString('it-IT')}
${new Date(dispute.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;

      await supabase.from("support_messages").insert({
        id: `smsg-dsp-${timestamp}`,
        ticket_id: ticketId,
        sender_id: dispute.opened_by_user_id,
        sender_type: "user",
        message: initialMessage,
        is_internal: false,
        created_at: now,
      });

      return ticketId;
    },

    // Invia messaggio a ticket (utente)
    sendUserMessage: async (ticketId: string, userId: string, text: string) => {
      const now = new Date().toISOString();

      // Inserisci messaggio
      const { error: msgError } = await supabase.from("support_messages").insert({
        id: `smsg-${Date.now()}`,
        ticket_id: ticketId,
        sender_id: userId,
        sender_type: "user",
        message: text,
        is_internal: false,
        created_at: now,
      });

      if (msgError) {
        console.error("Errore invio messaggio:", msgError);
        throw msgError;
      }

      // Aggiorna ticket
      await supabase.from("support_tickets").update({
        last_message_at: now,
        last_message_preview: text.slice(0, 100),
        updated_at: now,
        unread_by_support: true,
        status: "open", // Riapri se era chiuso
      }).eq("id", ticketId);

      return true;
    },

    // Invia messaggio da supporto/admin
    sendSupportMessage: async (params: {
      ticketId: string;
      senderId: string;
      senderType: "support" | "admin";
      text: string;
      isInternal?: boolean;
    }) => {
      const { ticketId, senderId, senderType, text, isInternal } = params;
      const now = new Date().toISOString();

      // Inserisci messaggio
      const { error: msgError } = await supabase.from("support_messages").insert({
        id: `smsg-${Date.now()}`,
        ticket_id: ticketId,
        sender_id: senderId,
        sender_type: senderType,
        message: text,
        is_internal: isInternal || false,
        created_at: now,
      });

      if (msgError) {
        console.error("Errore invio messaggio supporto:", msgError);
        throw msgError;
      }

      // Aggiorna ticket (solo se non è nota interna)
      if (!isInternal) {
        await supabase.from("support_tickets").update({
          last_message_at: now,
          last_message_preview: `[${senderType.toUpperCase()}] ${text.slice(0, 80)}`,
          updated_at: now,
          unread_by_user: true,
          status: "in_progress",
          first_response_at: now, // Solo se è la prima risposta
        }).eq("id", ticketId);
      } else {
        // Nota interna: aggiorna solo updated_at
        await supabase.from("support_tickets").update({
          updated_at: now,
        }).eq("id", ticketId);
      }

      // Log azione
      await api.messages.logAdminAction(senderId, "support_reply", "ticket", ticketId, { isInternal, textPreview: text.slice(0, 50) });

      return true;
    },

    // Assegna ticket
    assignTicket: async (ticketId: string, assignToId: string, adminId: string) => {
      const { error } = await supabase.from("support_tickets").update({
        assigned_to: assignToId,
        status: "in_progress",
        updated_at: new Date().toISOString(),
      }).eq("id", ticketId);

      if (error) {
        console.error("Errore assegnazione ticket:", error);
        return false;
      }

      await api.messages.logAdminAction(adminId, "assign_ticket", "ticket", ticketId, { assignedTo: assignToId });
      return true;
    },

    // Aggiorna stato ticket
    updateTicketStatus: async (ticketId: string, status: string, adminId: string) => {
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === "resolved" || status === "closed") {
        updates.resolved_at = new Date().toISOString();
        updates.resolved_by = adminId;

        // 🔄 CHIUDI ANCHE LA DISPUTA COLLEGATA (se esiste)
        try {
          // Recupera il ticket per vedere se ha una disputa collegata
          const { data: ticket } = await supabase
            .from("support_tickets")
            .select("related_dispute_id")
            .eq("id", ticketId)
            .single();

          if (ticket?.related_dispute_id) {
            // Chiudi la disputa
            await supabase
              .from("disputes")
              .update({ 
                status: "resolved",
                updated_at: new Date().toISOString()
              })
              .eq("id", ticket.related_dispute_id);
            
            console.log('✅ Disputa collegata chiusa:', ticket.related_dispute_id);
          }
        } catch (error) {
          console.error('⚠️ Errore chiusura disputa collegata:', error);
          // Non bloccare l'operazione se la chiusura della disputa fallisce
        }
      }

      const { error } = await supabase.from("support_tickets").update(updates).eq("id", ticketId);

      if (error) {
        console.error("Errore aggiornamento stato ticket:", error);
        return false;
      }

      await api.messages.logAdminAction(adminId, "update_ticket_status", "ticket", ticketId, { newStatus: status });
      return true;
    },

    // Aggiorna priorità ticket
    updateTicketPriority: async (ticketId: string, priority: string, adminId: string) => {
      const { error } = await supabase.from("support_tickets").update({
        priority,
        updated_at: new Date().toISOString(),
      }).eq("id", ticketId);

      if (error) {
        console.error("Errore aggiornamento priorità:", error);
        return false;
      }

      await api.messages.logAdminAction(adminId, "update_ticket_priority", "ticket", ticketId, { newPriority: priority });
      return true;
    },

    // Segna come letto (per supporto)
    markAsReadBySupport: async (ticketId: string) => {
      await supabase.from("support_tickets").update({
        unread_by_support: false,
      }).eq("id", ticketId);
    },

    // Segna come letto (per utente)
    markAsReadByUser: async (ticketId: string) => {
      await supabase.from("support_tickets").update({
        unread_by_user: false,
      }).eq("id", ticketId);
    },

    // Statistiche ticket
    getTicketStats: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("status, priority, unread_by_support");

      if (error) {
        console.error("Errore stats ticket:", error);
        return { total: 0, new: 0, assigned: 0, inProgress: 0, resolved: 0, closed: 0, unread: 0, urgent: 0 };
      }

      return {
        total: data?.length || 0,
        new: data?.filter((t: any) => t.status === "open" && !t.assigned_to).length || 0,
        assigned: data?.filter((t: any) => t.status === "open" && t.assigned_to).length || 0,
        inProgress: data?.filter((t: any) => t.status === "in_progress").length || 0,
        waitingUser: data?.filter((t: any) => t.status === "waiting_user").length || 0,
        resolved: data?.filter((t: any) => t.status === "resolved").length || 0,
        closed: data?.filter((t: any) => t.status === "closed").length || 0,
        unread: data?.filter((t: any) => t.unread_by_support).length || 0,
        urgent: data?.filter((t: any) => t.priority === "urgent").length || 0,
      };
    },

    // Ottieni operatori supporto disponibili
    getSupportOperators: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, public_name, avatar_url, role")
        .in("role", ["admin", "support"]);

      if (error) {
        console.error("Errore caricamento operatori:", error);
        return [];
      }

      return data || [];
    },
  },
// ============================================
  // REVIEWS (RECENSIONI)
  // ============================================
  reviews: {
    /**
     * Crea una nuova recensione
     */
   create: async (reviewData: {
      booking_id?: string;
      bookingId?: string;
      listing_id?: string;
      listingId?: string;
      reviewer_id?: string;
      reviewerId?: string;
      reviewee_id?: string;
      revieweeId?: string;
      review_type?: 'renter_to_hubber' | 'hubber_to_renter';
      reviewType?: 'renter_to_hubber' | 'hubber_to_renter';
      overall_rating?: number;
      overallRating?: number;
      category_ratings?: Record<string, number>;
      categoryRatings?: Record<string, number>;
      comment?: string;
    }) => {
      console.log("📝 reviews.create – dati:", reviewData);

      // ✅ Supporta sia camelCase che snake_case
      const bookingId = reviewData.booking_id || reviewData.bookingId;
      const listingId = reviewData.listing_id || reviewData.listingId;
      const reviewerId = reviewData.reviewer_id || reviewData.reviewerId;
      const revieweeId = reviewData.reviewee_id || reviewData.revieweeId;
      const reviewType = reviewData.review_type || reviewData.reviewType;
      const overallRating = reviewData.overall_rating || reviewData.overallRating;
      const categoryRatings = reviewData.category_ratings || reviewData.categoryRatings || {};

      console.log("📝 reviews.create – valori estratti:", {
        bookingId, listingId, reviewerId, revieweeId, reviewType, overallRating
      });

      if (!reviewerId) {
        throw new Error("reviewer_id è obbligatorio");
      }
      if (!revieweeId) {
        throw new Error("reviewee_id è obbligatorio");
      }

      const { data, error } = await supabase
        .from("reviews")
        .insert({
          booking_id: bookingId,
          listing_id: listingId || null,
          reviewer_id: reviewerId,
          reviewee_id: revieweeId,
          rating: overallRating,
          category_ratings: categoryRatings,
          comment: reviewData.comment || "",
          status: "approved",
          is_verified_booking: true,
          review_type: reviewType,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("❌ Errore creazione recensione:", error);
        throw error;
      }

      console.log("✅ Recensione creata:", data);

// Aggiorna rating medio del reviewee (utente)
await api.reviews.updateUserRating(revieweeId);

// ✅ NUOVO: Aggiorna rating e review_count del listing
if (listingId) {
  await api.reviews.updateListingRating(listingId);
}

return data;
    },

    /**
 * Ottieni recensioni ricevute da un utente
 */
getForUser: async (userId: string) => {
  const { data, error } = await supabase
    .from("reviews")
    .select(`
      *,
      reviewer:reviewer_id(id, first_name, last_name, public_name, avatar_url),
      listing:listing_id(id, title, images)
    `)
    .eq("reviewee_id", userId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Errore caricamento recensioni utente:", error);
    return [];
  }

  return data || [];
},

/**
 * Ottieni recensioni ricevute da un hubber (recensioni fatte dai renter)
 */
getForHubber: async (userId: string) => {
  const { data, error } = await supabase
    .from("reviews")
    .select(`
      *,
      reviewer:reviewer_id(id, first_name, last_name, public_name, avatar_url),
      listing:listing_id(id, title, images)
    `)
    .eq("reviewee_id", userId)
    .eq("review_type", "renter_to_hubber")
    .in("status", ["approved", "published"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Errore caricamento recensioni hubber:", error);
    return [];
  }

  return data || [];
},

/**
 * Ottieni recensioni ricevute da un renter (recensioni fatte dagli hubber)
 */
getForRenter: async (userId: string) => {
  console.log("🔍 getForRenter chiamata con userId:", userId);

  const { data, error } = await supabase
    .from("reviews")
    .select(`
      *,
      reviewer:reviewer_id(id, first_name, last_name, public_name, avatar_url),
      listing:listing_id(id, title, images)
    `)
    .eq("reviewee_id", userId)
    .eq("review_type", "hubber_to_renter")
    .in("status", ["approved", "published"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Errore caricamento recensioni renter:", error);
    return [];
  }

  return data || [];
},

    /**
 * Ottieni recensioni per un listing (solo quelle fatte dai renter)
 */
getForListing: async (listingId: string) => {
  const { data, error } = await supabase
    .from("reviews")
    .select(`
      *,
      reviewer:reviewer_id(id, first_name, last_name, public_name, avatar_url)
    `)
    .eq("listing_id", listingId)
    .eq("review_type", "renter_to_hubber")
    .in("status", ["approved", "published"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Errore caricamento recensioni listing:", error);
    return [];
  }

  return data || [];
},

/**
 * Verifica se esiste già una recensione per una prenotazione
 */
existsForBooking: async (bookingId: string, reviewerId: string) => {
  const { data, error } = await supabase
    .from("reviews")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("reviewer_id", reviewerId)
    .maybeSingle();

  if (error) {
    console.error("Errore verifica recensione esistente:", error);
    return false;
  }

  return !!data;
},
   /**
 * Aggiorna il rating medio di un utente
 */
updateUserRating: async (userId: string) => {
  const { data, error } = await supabase
    .from("reviews")
    .select("rating")  // ✅ CORRETTO: usa "rating"
    .eq("reviewee_id", userId)
    .eq("status", "published");

  if (error || !data || data.length === 0) {
    return;
  }

  const avg = data.reduce((sum, r) => sum + Number(r.rating), 0) / data.length;
  const roundedAvg = Math.round(avg * 10) / 10;

  await supabase
    .from("users")
    .update({ rating: roundedAvg })
    .eq("id", userId);

  console.log(`✅ Rating utente ${userId} aggiornato a ${roundedAvg}`);
},

/**
 * Aggiorna il rating medio e il conteggio recensioni di un listing
 */
updateListingRating: async (listingId: string) => {
  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("listing_id", listingId)
    .eq("status", "approved");

  if (error) {
    console.error("Errore caricamento recensioni listing:", error);
    return;
  }

  const reviews = data || [];
  const reviewCount = reviews.length;
  
  let avgRating = 0;
  if (reviewCount > 0) {
    avgRating = reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviewCount;
    avgRating = Math.round(avgRating * 10) / 10;
  }

  const { error: updateError } = await supabase
    .from("listings")
    .update({ 
      rating: avgRating, 
      review_count: reviewCount,
      updated_at: new Date().toISOString()
    })
    .eq("id", listingId);

  if (updateError) {
    console.error("Errore aggiornamento rating listing:", updateError);
    return;
  }

  api.listings.invalidateCache();
  console.log(`✅ Listing ${listingId} aggiornato: rating=${avgRating}, review_count=${reviewCount}`);
},

/**
 * Aggiorna stato recensione (admin) - per sospendere/riattivare
 */
updateStatus: async (reviewId: string, status: 'approved' | 'suspended' | 'rejected') => {
  const { data, error } = await supabase
    .from("reviews")
    .update({ 
      status,
      moderated_at: new Date().toISOString()
    })
    .eq("id", reviewId)
    .select()
    .single();

  if (error) {
    console.error("Errore aggiornamento stato recensione:", error);
    throw error;
  }

  return data;
},

/**
 * Aggiorna contenuto recensione (admin)
 */
update: async (reviewId: string, updates: { comment?: string; rating?: number }) => {
  const { data, error } = await supabase
    .from("reviews")
    .update({ 
      ...updates,
      moderated_at: new Date().toISOString()
    })
    .eq("id", reviewId)
    .select()
    .single();

  if (error) {
    console.error("Errore aggiornamento recensione:", error);
    throw error;
  }

  return data;
},

    /**
     * Elimina recensione (admin)
     */
    delete: async (reviewId: string) => {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId);

      if (error) {
        console.error("Errore eliminazione recensione:", error);
        throw error;
      }

      return true;
    },

    /**
     * Ottieni tutte le recensioni (admin)
     */
    getAll: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          reviewer:reviewer_id(id, first_name, last_name, public_name, avatar_url),
          reviewee:reviewee_id(id, first_name, last_name, public_name, avatar_url),
          listing:listing_id(id, title)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Errore caricamento tutte recensioni:", error);
        return [];
      }

      return data || [];
    },
  },

recentlyViewed: {
    /**
     * Salva un annuncio visto (o aggiorna il timestamp se già visto)
     */
    add: async (userId: string, listingId: string): Promise<void> => {
      try {
        await supabase.rpc('update_recently_viewed', {
          p_user_id: userId,
          p_listing_id: listingId
        });
        console.log('✅ Annuncio aggiunto ai visti di recente');
      } catch (e) {
        console.error('Errore add recently viewed:', e);
      }
    },

    /**
     * Carica gli ultimi 5 annunci visti dall'utente
     */
    getByUser: async (userId: string): Promise<any[]> => {
      try {
        const { data, error } = await supabase
          .from('recently_viewed')
          .select(`
            viewed_at,
            listing:listings(
              id,
              title,
              images,
              price,
              price_unit
            )
          `)
          .eq('user_id', userId)
          .order('viewed_at', { ascending: false })
          .limit(5);

        if (error) {
          console.error('Errore get recently viewed:', error);
          return [];
        }

        return data || [];
      } catch (e) {
        console.error('Errore get recently viewed:', e);
        return [];
      }
    }
  },

  init: async () => {
    localStorage.removeItem("listings");
    return;
  },
};

// ---------------------------------------------
// BOOKINGS + PAYMENTS + WALLET (Stripe + Wallet)
// ---------------------------------------------

/**
 * Crea una prenotazione dopo pagamento Stripe + eventuale uso del wallet.
 * Usa la funzione RPC: public.create_booking_with_payment
 */
export async function createBookingWithPaymentApi(params: {
  renterId: string;
  listingId: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  amountTotalCents: number;
  platformFeeCents: number;
  hubberNetAmountCents: number;
  walletUsedCents: number;
  provider: string; // es: "stripe"
  providerPaymentId: string; // es: paymentIntent.id
}): Promise<Booking> {
  const {
    renterId,
    listingId,
    startDate,
    endDate,
    amountTotalCents,
    platformFeeCents,
    hubberNetAmountCents,
    walletUsedCents,
    provider,
    providerPaymentId,
  } = params;

  const { data, error } = await supabase.rpc("create_booking_with_payment", {
    p_renter_id: renterId,
    p_listing_id: listingId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_amount_total_cents: amountTotalCents,
    p_platform_fee_cents: platformFeeCents,
    p_hubber_net_amount_cents: hubberNetAmountCents,
    p_wallet_used_cents: walletUsedCents,
    p_provider: provider,
    p_provider_payment_id: providerPaymentId,
  });

  if (error) {
    console.error("Errore create_booking_with_payment:", error);
    throw error;
  }

  return data as Booking;
}

/**
 * Cancella una prenotazione e rimborsa eventuale quota wallet.
 * Usa la funzione RPC: public.cancel_booking_and_refund
 */
export async function cancelBookingAndRefundApi(
  bookingId: string,
  requesterId: string
): Promise<Booking> {
  const { data, error } = await supabase.rpc("cancel_booking_and_refund", {
    p_booking_id: bookingId,
    p_requester_id: requesterId,
  });

  if (error) {
    console.error("Errore cancel_booking_and_refund:", error);
    throw error;
  }

  return data as Booking;
}