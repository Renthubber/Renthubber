import React, { useMemo, useState, useEffect } from "react";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { stripePromise } from "../lib/stripe";
import { api } from "../services/api";
import { Listing, User } from "../types";
import { supabase } from "../lib/supabase";

// ✅ Funzione per creare conversazione dopo prenotazione
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
  
  console.log("📧 createBookingConversation chiamata con:", params);
  
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
  const systemMessage = 
    `Grazie per aver prenotato "${listingTitle}" per il periodo dal ${startFormatted} al ${endFormatted}.\n\n` +
    `Questa chat è stata creata per la prenotazione #${bookingId.slice(0, 8).toUpperCase()} e potrà essere utilizzata per condividere maggiori informazioni.`;

  // Crea conversazione
  const conversation = {
    id: conversationId,
    renterId,
    hubberId,
    listingId,
    bookingId,
    isSupport: false,
    lastMessagePreview: "Nuova prenotazione",
    lastMessageAt: now,
    unreadForRenter: false,
    unreadForHubber: true,
  };

  // Messaggio iniziale (dal sistema)
  const message = {
    id: `msg-system-${bookingId}`,
    conversationId,
    fromUserId: "system",
    toUserId: hubberId,
    text: systemMessage,
    createdAt: now,
    isSystemMessage: true,
    hasConfirmedBooking: true,
    isSupport: false,
  };

  // Salva in localStorage (per compatibilità)
  const convRaw = localStorage.getItem("conversations");
  let conversations = convRaw ? JSON.parse(convRaw) : [];
  
  const existingIndex = conversations.findIndex((c: any) => c.id === conversationId);
  if (existingIndex >= 0) {
    conversations[existingIndex] = conversation;
  } else {
    conversations = [conversation, ...conversations];
  }
  localStorage.setItem("conversations", JSON.stringify(conversations));

  const msgRaw = localStorage.getItem("messages");
  let messages = msgRaw ? JSON.parse(msgRaw) : [];
  
  if (!messages.find((m: any) => m.id === message.id)) {
    messages = [message, ...messages];
  }
  localStorage.setItem("messages", JSON.stringify(messages));

  // ✅ Salva anche su Supabase
  try {
    console.log("📝 Inserisco conversazione su Supabase:", conversationId);
    
    const { data: convData, error: convError } = await supabase.from("conversations").upsert(
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
    ).select();

    if (convError) {
      console.error("❌ Errore inserimento conversazione:", convError);
    } else {
      console.log("✅ Conversazione inserita:", convData);
    }

    console.log("📝 Inserisco messaggio su Supabase:", message.id);
    
    // Per i messaggi di sistema, usiamo l'hubber come from_user_id ma con flag is_system_message
    const { data: msgData, error: msgError } = await supabase.from("messages").upsert(
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
    ).select();
    
    if (msgError) {
      console.error("❌ Errore inserimento messaggio:", msgError);
    } else {
      console.log("✅ Messaggio inserito:", msgData);
    }
    
    console.log("✅ Conversazione prenotazione creata:", conversationId);
  } catch (e) {
    console.warn("⚠️ Errore sync conversazione Supabase:", e);
  }
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  renter: User;
  listing: Listing;
  startDate: string;
  endDate: string;
  totalAmountEur: number;
  rentalAmountEur: number;
  platformFeeEur: number;
  depositEur?: number;
  cleaningFeeEur?: number;
  walletUsedEur?: number;
  generalBalance?: number;  // ✅ AGGIUNTO: Wallet generale
  onSuccess?: (booking: any) => void;
}

const BookingPaymentInner: React.FC<Props> = (props) => {
  const {
    isOpen,
    onClose,
    renter,
    listing,
    startDate,
    endDate,
    totalAmountEur,
    rentalAmountEur,
    platformFeeEur,
    depositEur = 0,
    cleaningFeeEur = 0,
    walletUsedEur = 0,
    onSuccess,
  } = props;

  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ✅ Saldi wallet
  const [generalBalance, setGeneralBalance] = useState(0);  // Wallet generale
  const [refundBalance, setRefundBalance] = useState(0);    // Credito rimborsi
  const [referralBalance, setReferralBalance] = useState(0); // Bonus referral
  const [walletType, setWalletType] = useState<'referral' | 'refund'>('referral');
  const [loadingBalances, setLoadingBalances] = useState(false);

  // ✅ Carica le fee dal database per calcolare correttamente il netto hubber
  const [platformFees, setPlatformFees] = useState<{
    renterPercentage: number;
    hubberPercentage: number;
    superHubberPercentage: number;
    fixedFeeEur: number;
  } | null>(null);

  const [feesLoaded, setFeesLoaded] = useState(false);

  useEffect(() => {
    const loadFees = async () => {
      try {
        const fees = await api.admin.getFees();
        if (fees) {
          setPlatformFees(fees);
          console.log("✅ Fee caricate nel modal:", fees);
        }
      } catch (err) {
        console.error("Errore caricamento fee:", err);
      } finally {
        setFeesLoaded(true);
      }
    };
    loadFees();
  }, []);

  // ✅ Carica saldi wallet all'apertura del modal
  useEffect(() => {
    const loadWalletBalances = async () => {
      if (!isOpen || !renter.id) return;
      
      setLoadingBalances(true);
      try {
        const { data: wallet, error } = await supabase
          .from('wallets')
          .select('balance_cents, referral_balance_cents, refund_balance_cents')
          .eq('user_id', renter.id)
          .single();
        
        if (!error && wallet) {
          setGeneralBalance((wallet.balance_cents || 0) / 100);
          setReferralBalance((wallet.referral_balance_cents || 0) / 100);
          setRefundBalance((wallet.refund_balance_cents || 0) / 100);
          console.log('✅ Saldi wallet modal:', {
            general: (wallet.balance_cents || 0) / 100,
            referral: (wallet.referral_balance_cents || 0) / 100,
            refund: (wallet.refund_balance_cents || 0) / 100
          });
        }
      } catch (err) {
        console.error('Errore caricamento saldi wallet:', err);
      } finally {
        setLoadingBalances(false);
      }
    };

   loadWalletBalances();
  }, [isOpen, renter.id]);

  // ✅ Calcola quanto wallet può essere usato in base alla scelta
  const actualWalletUsable = useMemo(() => {
    // Se non c'è nessun saldo disponibile, ritorna 0
    if (walletUsedEur === 0 || (generalBalance === 0 && referralBalance === 0 && refundBalance === 0)) return 0;
    
    if (walletType === 'referral') {
      // Referral: max 30% delle commissioni
      const maxReferralUsable = platformFeeEur * 0.30;
      return Math.min(referralBalance, maxReferralUsable);
    } else {
      // Refund: max 100% del totale (somma general + refund!)
      const totalRefundableCredit = generalBalance + refundBalance;
      return Math.min(totalRefundableCredit, totalAmountEur);
    }
  }, [walletType, generalBalance, referralBalance, refundBalance, platformFeeEur, totalAmountEur]);

  const amounts = useMemo(() => {
    // Usa le fee dal database, con fallback a valori default
    const hubberFeePercentage = platformFees?.hubberPercentage ?? 10;
    const fixedFee = platformFees?.fixedFeeEur ?? 2;

    // ✅ TUTTI I CALCOLI IN EURO PRIMA, POI CONVERTI IN CENTESIMI
    
    // Totale pagato dal renter (già calcolato da ListingDetail)
    const totalCents = Math.round(totalAmountEur * 100);
    
    // Prezzo base del noleggio (senza commissioni)
    const rentalCents = Math.round(rentalAmountEur * 100);
    
    // Commissione renter (quella mostrata all'utente)
    const platformFeeCents = Math.round(platformFeeEur * 100);
    
    // Deposito
    const depositCents = Math.round(depositEur * 100);

    // Wallet (usa il valore calcolato in base alla scelta)
    const walletCents = Math.round(actualWalletUsable * 100);
    const cardCents = Math.max(totalCents - walletCents, 0);

    // ✅ CALCOLO CORRETTO COMMISSIONE HUBBER (include pulizia!)
    // Subtotale completo = prezzo base + pulizia
    const completeSubtotalEur = rentalAmountEur + cleaningFeeEur;
    
    // Commissione hubber = (subtotale completo × % hubber) + fee fissa
    const hubberVariableFeeEur = (completeSubtotalEur * hubberFeePercentage) / 100;
    const hubberTotalFeeEur = hubberVariableFeeEur + fixedFee;
    const hubberTotalFeeCents = Math.round(hubberTotalFeeEur * 100);
    
    // ✅ NETTO HUBBER = subtotale completo - commissione hubber
    const hubberNetEur = completeSubtotalEur - hubberTotalFeeEur;
    const hubberNetCents = Math.round(hubberNetEur * 100);

    return {
      totalCents,
      rentalCents,
      platformFeeCents,
      depositCents,
      walletCents,
      cardCents,
      hubberNetCents,
      hubberTotalFeeCents,
    };
  }, [totalAmountEur, rentalAmountEur, platformFeeEur, depositEur, actualWalletUsable, platformFees, cleaningFeeEur]);

  if (!isOpen) return null;

  // 💳 PAGAMENTO STRIPE REALE
  const handleConfirm = async () => {
    // Aspetta che le fee siano caricate
    if (!feesLoaded) {
      setErrorMsg("Caricamento in corso, riprova tra un momento...");
      return;
    }

   if (!stripe || !elements) {
      setErrorMsg("Stripe non è ancora pronto. Riprova tra un momento.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      // ✅ Validazione saldo wallet
      if (actualWalletUsable > 0) {
        const maxUsable = walletType === 'referral' 
          ? Math.min(referralBalance, platformFeeEur * 0.30)
          : (generalBalance + refundBalance);  // ✅ Somma general + refund
        
        if (actualWalletUsable > maxUsable) {
          setErrorMsg(`Saldo insufficiente. Disponibile: €${maxUsable.toFixed(2)}`);
          setLoading(false);
          return;
        }
      }

      // ✅ Calcola quanto serve pagare con carta
      const cardToPayEur = amounts.cardCents / 100;

      // ✅ Valida CardElement SOLO se serve pagare con carta
      let cardElement = null;
      if (cardToPayEur > 0) {
        cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          setErrorMsg("Elemento carta non trovato.");
          setLoading(false);
          return;
        }
      }

      console.log("💳 Creazione Payment Intent...");

      // ✅ CHIAMATA ALLA NETLIFY FUNCTION
      const response = await fetch("/.netlify/functions/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          listingTitle: listing.title,
          renterId: renter.id,
          hubberId: listing.hostId,
          startDate,
          endDate,
          basePrice: rentalAmountEur,
          renterFee: platformFeeEur,
          hubberFee: amounts.hubberTotalFeeCents / 100,
          deposit: depositEur,
          cleaningFee: cleaningFeeEur,
          totalAmount: totalAmountEur,
          useWallet: actualWalletUsable > 0,
          // ✅ Quando usa "Credito Rimborsi", scala da general + refund
          generalBalanceToUse: walletType === 'refund' ? Math.min(generalBalance, actualWalletUsable) : 0,
          refundBalanceToUse: walletType === 'refund' ? Math.min(refundBalance, Math.max(0, actualWalletUsable - generalBalance)) : 0,
          referralBalanceToUse: walletType === 'referral' ? actualWalletUsable : 0,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Errore creazione Payment Intent");
      }

      const { clientSecret, paidWithWallet, bookingId } = await response.json();

      // Se pagato completamente con wallet
      if (paidWithWallet) {
        console.log("✅ Prenotazione pagata con wallet:", bookingId);
        
        // Crea conversazione
        try {
          await createBookingConversation({
            bookingId,
            renterId: renter.id,
            hubberId: listing.hostId,
            listingId: listing.id,
            listingTitle: listing.title,
            startDate,
            endDate,
          });
        } catch (convError) {
          console.warn("⚠️ Errore creazione conversazione:", convError);
        }

        // 📧 INVIA EMAIL CONFERMA PRENOTAZIONE
try {
  console.log("📧 Inserimento email in queue...");
  
  const renterName = `${renter.firstName || ''} ${renter.lastName || ''}`.trim() || 'Utente';
  const hubberName = listing.owner?.name || 'Hubber';
  const hubberEmail = listing.owner?.email || '';
  const startDateFormatted = new Date(startDate).toLocaleDateString('it-IT');
  const endDateFormatted = new Date(endDate).toLocaleDateString('it-IT');
  const totalAmount = (amounts.totalCents / 100).toFixed(2);
  const hubberAmount = (amounts.hubberNetCents / 100).toFixed(2);
  
  // Template basato su categoria
  const isSpace = listing.category?.toLowerCase() === 'spazi';
  const renterTemplate = isSpace ? 'tpl-booking-confirmed-space-renter' : 'tpl-booking-confirmed-object-renter';
  const hubberTemplate = isSpace ? 'tpl-booking-confirmed-space-hubber' : 'tpl-booking-confirmed-object-hubber';
  
  console.log("📧 Dati email renter:", {
    template: renterTemplate,
    email: renter.email,
    name: renterName
  });
  
  // Email al RENTER
  const { data: renterEmailData, error: renterEmailError } = await supabase.from('email_queue').insert({
    template_id: renterTemplate,
    recipient_email: renter.email,
    recipient_name: renterName,
    recipient_user_id: renter.id,
    subject: `Prenotazione confermata per ${listing.title}! 🎊`,
    body_html: `<p>Prenotazione confermata per ${listing.title}</p>`,
    body_text: `Prenotazione confermata per ${listing.title}`,
    variables: {
      name: renterName,
      listing: listing.title,
      start_date: startDateFormatted,
      end_date: endDateFormatted,
      amount: totalAmount
    },
    status: 'pending',
    scheduled_at: new Date().toISOString()
    }).select();
  
  if (renterEmailError) {
    console.error("❌ Errore insert email renter:", renterEmailError);
  } else {
    console.log("✅ Email renter inserita:", renterEmailData);
  }
  
  console.log("📧 Dati email hubber:", {
    template: hubberTemplate,
    email: hubberEmail,
    name: hubberName
  });
  
  // Email all'HUBBER
  const { data: hubberEmailData, error: hubberEmailError } = await supabase.from('email_queue').insert({
    template_id: hubberTemplate,
    recipient_email: hubberEmail,
    recipient_name: hubberName,
    recipient_user_id: listing.hostId,
    subject: `Hai una nuova prenotazione per ${listing.title}! 💰`,
    body_html: `<p>Nuova prenotazione per ${listing.title}</p>`,
    body_text: `Nuova prenotazione per ${listing.title}`,
    variables: {
      name: hubberName,
      listing: listing.title,
      renter: renterName,
      start_date: startDateFormatted,
      end_date: endDateFormatted,
      hubber_amount: hubberAmount
    },
    status: 'pending',
    scheduled_at: new Date().toISOString()
  }).select();
  
  if (hubberEmailError) {
    console.error("❌ Errore insert email hubber:", hubberEmailError);
  } else {
    console.log("✅ Email hubber inserita:", hubberEmailData);
  }
  
  console.log("✅ Email inserite nella queue");
} catch (emailError: any) {
  console.error("⚠️ ERRORE EMAIL COMPLETO:", emailError);
}

        if (onSuccess) onSuccess({ id: bookingId });
        setLoading(false);
        onClose();
        return;
      }

      // ✅ CONFERMA PAGAMENTO CON STRIPE
      console.log("🔐 Conferma pagamento...");

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: renter.name || renter.email,
              email: renter.email,
            },
          },
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message || "Pagamento fallito");
      }

      if (paymentIntent?.status === "succeeded") {
        console.log("✅ Pagamento confermato:", paymentIntent.id);
        
        // ✅ POLLING: Aspetta che il webhook crei la prenotazione (max 10 tentativi)
        let booking = null;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts && !booking) {
          attempts++;
          console.log(`🔄 Tentativo ${attempts}/${maxAttempts} - Cerco prenotazione creata dal webhook...`);
          
          const { data, error } = await supabase
            .from("bookings")
            .select("*")
            .eq("stripe_payment_intent_id", paymentIntent.id)
            .maybeSingle();

          if (data) {
            booking = data;
            console.log("✅ Prenotazione trovata:", booking.id);
            break;
          }
          
          if (error) {
            console.error("❌ Errore ricerca prenotazione:", error);
          }
          
          // Aspetta 1 secondo prima del prossimo tentativo
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (!booking) {
          throw new Error("Il webhook non ha creato la prenotazione. Riprova tra qualche istante o contatta il supporto.");
        }

        // Crea conversazione
        try {
          await createBookingConversation({
            bookingId: booking.id,
            renterId: renter.id,
            hubberId: listing.hostId,
            listingId: listing.id,
            listingTitle: listing.title,
            startDate,
            endDate,
          });
        } catch (convError) {
          console.warn("⚠️ Errore creazione conversazione:", convError);
        }

        if (onSuccess) onSuccess(booking);
        setLoading(false);
        onClose();
      }

    } catch (err: any) {
      console.error("❌ Errore pagamento:", err);
      setErrorMsg(err.message || "Errore imprevisto durante il pagamento");
      setLoading(false);
    }
  };

  const cardToPayEur = amounts.cardCents / 100;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md relative shadow-2xl">
        <button className="absolute top-3 right-3" onClick={onClose}>
          ✕
        </button>

        <h2 className="text-xl font-semibold mb-2">Conferma il pagamento</h2>

        <p className="text-sm text-gray-600 mb-4">
          {listing.title}
          <br />
          Dal <b>{new Date(startDate).toLocaleDateString("it-IT")}</b> al{" "}
          <b>{new Date(endDate).toLocaleDateString("it-IT")}</b>
        </p>

        <div className="space-y-1 text-sm mb-4">
          <div className="flex justify-between">
            <span>Noleggio</span>
            <span>{rentalAmountEur.toFixed(2)} €</span>
          </div>
          {cleaningFeeEur > 0 && (
            <div className="flex justify-between">
              <span>Costo pulizia</span>
              <span>{cleaningFeeEur.toFixed(2)} €</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Commissioni Renthubber</span>
            <span>{platformFeeEur.toFixed(2)} €</span>
          </div>
          {depositEur > 0 && (
            <div className="flex justify-between">
              <span>Cauzione (rimborsabile)</span>
              <span>{depositEur.toFixed(2)} €</span>
            </div>
          )}
          <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-semibold">
            <span>Totale prenotazione</span>
            <span>{totalAmountEur.toFixed(2)} €</span>
          </div>

{/* ✅ Scelta tipo wallet */}
          {walletUsedEur > 0 && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <p className="text-sm font-medium text-gray-900 mb-3">
                Seleziona quale credito usare:
              </p>
              
              {loadingBalances ? (
                <div className="text-sm text-gray-500">Caricamento saldi...</div>
              ) : (
                <div className="space-y-2">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="walletType"
                      value="referral"
                      checked={walletType === 'referral'}
                      onChange={(e) => setWalletType('referral')}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Bonus</div>
                      <div className="text-xs text-gray-500">
                        Disponibile: €{referralBalance.toFixed(2)} - Max 30% commissioni
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="walletType"
                      value="refund"
                      checked={walletType === 'refund'}
                      onChange={(e) => setWalletType('refund')}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Credito Rimborsi</div>
                      <div className="text-xs text-gray-500">
                        Disponibile: €{(generalBalance + refundBalance).toFixed(2)} - Utilizzo illimitato
                      </div>
                    </div>
                  </label>
                </div>
              )}
            </div>
          )}

         {actualWalletUsable > 0 && (
            <div className="flex justify-between text-emerald-700 text-xs">
              <span>Pagato con wallet</span>
              <span>-{actualWalletUsable.toFixed(2)} €</span>
            </div>
          )}

          <div className="flex justify-between text-xs text-gray-500">
            <span>Da pagare ora con carta</span>
            <span>{cardToPayEur.toFixed(2)} €</span>
          </div>
        </div>

        {/* 💳 CARTA DI CREDITO */}
        {cardToPayEur > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dettagli carta
            </label>
            <div className="border border-gray-300 rounded-md p-3">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: "16px",
                      color: "#424770",
                      "::placeholder": {
                        color: "#aab7c4",
                      },
                    },
                    invalid: {
                      color: "#9e2146",
                    },
                  },
                }}
              />
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="text-red-600 text-sm mb-3">{errorMsg}</div>
        )}

        <button
          className="w-full bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700 disabled:opacity-50"
          onClick={handleConfirm}
          disabled={loading || !feesLoaded || !stripe}
        >
          {loading ? "Elaborazione..." : !feesLoaded ? "Caricamento..." : `Paga ${cardToPayEur.toFixed(2)} €`}
        </button>

        <p className="text-xs text-gray-500 mt-3 text-center">
          🔒 Pagamento sicuro elaborato da Stripe
        </p>
      </div>
    </div>
  );
};

export const BookingPaymentModal = (props: Props) => {
  if (!props.isOpen) return null;

  return (
    <Elements stripe={stripePromise}>
      <BookingPaymentInner {...props} />
    </Elements>
  );
};