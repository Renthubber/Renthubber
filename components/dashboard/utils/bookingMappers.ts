 import { BookingRequest } from '../../../types';

/* ------------------------------------------------------
   HELPER: mapping booking DB -> BookingRequest (UI)
   Usa i dati di Supabase e li adatta alla struttura
   che la dashboard già si aspetta (dates, totalPrice, ecc.)
   
   CALCOLO CORRETTO:
   - amount_total = quanto paga il renter (prezzo + commissioni renter)
   - platform_fee = commissione trattenuta all'hubber
   - hubber_net_amount = netto che riceve l'hubber
   - Prezzo base = hubber_net_amount + platform_fee
-------------------------------------------------------*/
export const mapDbBookingToUiBooking = (raw: any): BookingRequest => {

  const formatDate = (dStr?: string) => {
    if (!dStr) return '';
    const d = new Date(dStr);
    if (Number.isNaN(d.getTime())) return dStr;
    return d.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const start = raw.startDate || raw.start_date;
  const end = raw.endDate || raw.end_date;
  const dates =
    start && end
      ? `${formatDate(start)} - ${formatDate(end)}`
      : start
      ? formatDate(start)
      : '';

  // amount_total = quanto paga il renter (prezzo base + commissioni renter)
  const renterTotalPaid =
    typeof raw.amountTotal === 'number'
      ? raw.amountTotal
      : typeof raw.amount_total === 'number'
      ? raw.amount_total
      : raw.totalPrice || 0;

  // platform_fee = commissione trattenuta all'hubber (es. €2.50)
  const hubberCommission =
    typeof raw.platformFee === 'number'
      ? raw.platformFee
      : typeof raw.platform_fee === 'number'
      ? raw.platform_fee
      : raw.commission || 0;

  // hubber_net_amount = netto che riceve l'hubber (es. €2.50)
  const netEarnings =
    typeof raw.hubberNetAmount === 'number'
      ? raw.hubberNetAmount
      : typeof raw.hubber_net_amount === 'number'
      ? raw.hubber_net_amount
      : raw.netEarnings || 0;

  // ✅ cleaning_fee = costo pulizia (es. €5.00)
  const cleaningFee =
    typeof raw.cleaningFee === 'number'
      ? raw.cleaningFee
      : typeof raw.cleaning_fee === 'number'
      ? raw.cleaning_fee
      : 0;

      // ✅ deposit = cauzione (es. €100.00)
const deposit =
  typeof raw.deposit === 'number'
    ? raw.deposit
    : 0;

// ✅ extra guests
const extraGuestsCount =
  typeof raw.extraGuestsCount === 'number'
    ? raw.extraGuestsCount
    : typeof raw.extra_guests_count === 'number'
    ? raw.extra_guests_count
    : 0;

const extraGuestsFee =
  typeof raw.extraGuestsFee === 'number'
    ? raw.extraGuestsFee
    : typeof raw.extra_guests_fee === 'number'
    ? raw.extra_guests_fee
    : 0;

console.log('🔍 MAPPER RAW KEYS:', Object.keys(raw).join(', '));

// ✅ service_fee = commissione totale hubber (10% + fee fissa)
const hubberTotalFee =
  typeof raw.serviceFee === 'number'
    ? raw.serviceFee
    : typeof raw.service_fee === 'number'
    ? raw.service_fee
    : 0;

// ✅ platform_fee = commissione totale renter (10% + fee fissa)  
const renterTotalFee =
  typeof raw.platformFee === 'number'
    ? raw.platformFee
    : typeof raw.platform_fee === 'number'
    ? raw.platform_fee
    : 0;

  // ✅ Prezzo base dell'oggetto = netto hubber + commissione hubber
  // Esempio: €2.50 (netto) + €2.50 (comm) = €5.00 (prezzo base)
  const baseRentalPrice = renterTotalPaid - renterTotalFee;

  return {
    // campi "core" della richiesta già usati dalla UI
    id: raw.id,
    hostId: raw.hubberId || raw.hostId || raw.hubber_id || '',
    renterId: raw.renterId || raw.renter_id || (raw as any).renterId,
    listingId: raw.listingId || raw.listing_id || '',
    dates,
    // ✅ NUOVO: date originali per modifica prenotazione
    start_date: start,
    end_date: end,
    listingTitle:
      (raw as any).listingTitle ||
      `Prenotazione #${String(raw.id || '').slice(0, 6)}`,
    listingImage:
      (raw as any).listingImage ||
      'https://picsum.photos/seed/renthubber-booking/160/120',
    renterName: (raw as any).renterName || 'Renter',
    renterAvatar:
      (raw as any).renterAvatar ||
      'https://ui-avatars.com/api/?name=Renter&background=random',
      // ✅ NUOVO: Info Hubber
    hubberName: (raw as any).hubberName || 'Proprietario',
    hubberAvatar:
      (raw as any).hubberAvatar ||
      'https://ui-avatars.com/api/?name=Hubber&background=random',
    timeLeft: (raw as any).timeLeft || '',

    // ✅ Per l'hubber: mostriamo il prezzo base (€5), non il totale pagato dal renter (€7.50)
    totalPrice: baseRentalPrice,      // Prezzo base dell'oggetto (per hubber)
    
    // ✅ NUOVO: Totale pagato dal renter (per modale modifica e dettaglio)
    renterTotalPaid: renterTotalPaid, // Totale effettivo pagato dal renter
    
    // ✅ NUOVO: Wallet usato
    walletUsedCents: raw.walletUsedCents || raw.wallet_used_cents || 0,
    
    // ✅ NUOVO: Prezzo listing per calcoli dettaglio
    listingPrice: raw.listingPrice || 0,
    priceUnit: raw.priceUnit || 'giorno',
    
    // ✅ NUOVO: Politica di cancellazione
    cancellationPolicy: raw.cancellationPolicy || 'flexible',
    
    commission: hubberCommission,     // Commissione trattenuta all'hubber
    netEarnings,                      // Netto che riceve l'hubber
    status: raw.status || 'pending',
    cleaningFee,                      // ✅ NUOVO: Costo pulizia
    extraGuestsCount,                 // ✅ NUOVO: Ospiti extra
    extraGuestsFee,                   // ✅ NUOVO: Fee ospiti extra
    deposit,                          // ✅ NUOVO: Cauzione
    hubberTotalFee,                   // ✅ AGGIUNGI QUESTA
    renterTotalFee,                   // ✅ AGGIUNGI QUESTA
  } as BookingRequest & { 
    start_date?: string; 
    end_date?: string; 
    renterTotalPaid?: number; 
    walletUsedCents?: number;
    listingPrice?: number;
    priceUnit?: string;
    cancellationPolicy?: string;
    cleaningFee?: number;           // ✅ NUOVO
    extraGuestsCount?: number;      // ✅ NUOVO
    extraGuestsFee?: number;        // ✅ NUOVO
    deposit?: number;
    hubberName?: string;        // ✅ AGGIUNGI QUESTA
    hubberAvatar?: string;
    hubberTotalFee?: number;        // ✅ NUOVO
    renterTotalFee?: number;        // ✅ NUOVO
  };
};
