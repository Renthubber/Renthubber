import React, { useState, useEffect } from 'react';
import { MOCK_TRANSACTIONS } from '../constants';
import {
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Wallet as WalletIcon,
  Share2,
  Copy,
  CheckCircle,
  X,
  Landmark,
  Save,
  Send,
  Gift,
  RefreshCw,
  Clock,
  Calendar,
  Users,
} from 'lucide-react';
import { User, ActiveMode, SystemConfig, BankDetails } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { api } from '../services/api';
import { referralApi } from '../services/referralApi';
import { supabase } from '../lib/supabase';
import { StripeStatusBanner } from '../components/StripeStatusBanner'; 
import { PayoutRequestButton } from '../components/PayoutRequestButton'; 

interface WalletProps {
  currentUser: User;
  activeMode: ActiveMode;
  systemConfig: SystemConfig;
  onUpdateUser: (user: User) => void;
  onRequestPayout?: (amount: number) => void;
}

// Mock chart data
const data = [
  { name: 'Lun', importo: 20 },
  { name: 'Mar', importo: 45 },
  { name: 'Mer', importo: 10 },
  { name: 'Gio', importo: 80 },
  { name: 'Ven', importo: 50 },
  { name: 'Sab', importo: 120 },
  { name: 'Dom', importo: 90 },
];

export const Wallet: React.FC<WalletProps> = ({
  currentUser,
  activeMode,
  systemConfig,
  onUpdateUser,
  onRequestPayout,
}) => {
  const [copied, setCopied] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');

  const [bankForm, setBankForm] = useState<BankDetails>({
    accountHolderName: currentUser.bankDetails?.accountHolderName || '',
    accountHolderSurname: currentUser.bankDetails?.accountHolderSurname || '',
    iban: currentUser.bankDetails?.iban || '',
    bankName: currentUser.bankDetails?.bankName || '',
    bicSwift: currentUser.bankDetails?.bicSwift || '',
  });

  // IBAN effettivo: prima quello nel form (aggiornato dal DB), poi quello in currentUser
  const effectiveIban = bankForm.iban || currentUser.bankDetails?.iban || '';

  // ✅ SALDI SEPARATI PER RENTER
  const [generalBalance, setGeneralBalance] = useState(0);    // Wallet generale (100% utilizzo)
  const [referralBalance, setReferralBalance] = useState(0);  // Credito Invita Amico (max 30% comm.)
  const [refundBalance, setRefundBalance] = useState(0);      // Credito Rimborsi (100% flessibile)
  const [renterWalletLoading, setRenterWalletLoading] = useState(false);
  const [renterTransactions, setRenterTransactions] = useState<any[]>([]);
  const [renterTxLoading, setRenterTxLoading] = useState(false);

  // ✅ BONUS IN ATTESA (referral registrati ma non ancora completati)
  const [pendingBonus, setPendingBonus] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  // ✅ BONUS REFERRAL DINAMICO (caricato da database)
  const [referralBonus, setReferralBonus] = useState(5.00);

  // ✅ DRAWER INVITI
  const [showReferralDrawer, setShowReferralDrawer] = useState(false);
  const [referralsList, setReferralsList] = useState<any[]>([]);
  const [referralsLoading, setReferralsLoading] = useState(false);

  // 🔹 Saldo e movimenti REALI per HUBBER (wallets + wallet_transactions)
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [hubberTransactions, setHubberTransactions] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  // ✅ SALDO IN ATTESA HUBBER (prenotazioni confirmed non ancora completate)
  const [pendingEarnings, setPendingEarnings] = useState(0);
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);

  // 📋 Modal dettaglio prenotazione
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [loadingBookingDetails, setLoadingBookingDetails] = useState(false);

  // Totale credito renter = wallet generale + referral + rimborsi
  const totalRenterCredit = generalBalance + referralBalance + refundBalance;

  // ===========================
  //   REFERRAL CODE: CREAZIONE AUTOMATICA
  // ===========================
  useEffect(() => {
    const generateUniqueCode = async (): Promise<string> => {
      // Prima parola del nome, maiuscolo, solo lettere/numeri, max 10 caratteri
      const rawName = (currentUser.name || 'USER')
        .split(' ')[0]
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 10) || 'USER';

      // Genera 4 caratteri alfanumerici random
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // escludo 0, O, I, 1 per evitare confusione
      let randomPart = '';
      for (let i = 0; i < 4; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      return `${rawName}_${randomPart}`;
    };

    const ensureReferralCode = async () => {
      // Se abbiamo già un referralCode, non facciamo nulla
      if (currentUser.referralCode) return;

      let attempts = 0;
      const maxAttempts = 5;
      let newCode = '';
      let isUnique = false;

      while (!isUnique && attempts < maxAttempts) {
        newCode = await generateUniqueCode();
        
        // Verifica unicità nel DB
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('referral_code', newCode)
          .single();
        
        if (!existing) {
          isUnique = true;
        } else {
          attempts++;
          console.log(`⚠️ Codice ${newCode} già esistente, tentativo ${attempts}/${maxAttempts}`);
        }
      }

      if (!isUnique) {
        // Fallback: aggiungi timestamp
        newCode = `${newCode}${Date.now().toString(36).slice(-2).toUpperCase()}`;
      }

      try {
        const { error } = await supabase
          .from('users')
          .update({ referral_code: newCode })
          .eq('id', currentUser.id);

        if (!error) {
          onUpdateUser({
            ...currentUser,
            referralCode: newCode,
          });
          console.log('✅ Referral code generato:', newCode);
        } else {
          console.error('Errore aggiornando referral_code:', error);
        }
      } catch (err) {
        console.error('Errore inatteso aggiornando referral_code:', err);
      }
    };

    if (currentUser.id) {
      ensureReferralCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.id]);

  // ===========================
  //   CARICA DATI BANCARI DAL DB
  // ===========================
  useEffect(() => {
    const loadBankDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('bank_details')
          .select('*')
          .eq('user_id', currentUser.id)
          .limit(1)
          .single();

        if (!error && data) {
          const loaded: BankDetails = {
            accountHolderName: data.account_holder_name || '',
            accountHolderSurname: data.account_holder_surname || '',
            iban: data.iban || '',
            bankName: data.bank_name || '',
            bicSwift: data.bic_swift || '',
          };

          // aggiorno il form con i dati dal DB
          setBankForm(loaded);

          // sincronizzo anche nello User in memoria
          onUpdateUser({
            ...currentUser,
            bankDetails: loaded,
          });
        }
      } catch (err) {
        // se non esiste ancora nessuna riga per quell'utente, nessun problema
        console.error('Errore caricando bank_details:', err);
      }
    };

    loadBankDetails();
    // vogliamo ricaricare solo quando cambia l'utente
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.id]);

  // ===========================
  //   CARICA SALDI SEPARATI RENTER + BONUS IN ATTESA
  // ===========================
  useEffect(() => {
    const loadRenterWallet = async () => {
      if (!currentUser.id) return;
      
      setRenterWalletLoading(true);
      try {
        const { data: wallet, error } = await supabase
          .from('wallets')
          .select('balance_cents, referral_balance_cents, refund_balance_cents')
          .eq('user_id', currentUser.id)
          .single();
        
        if (!error && wallet) {
          setGeneralBalance((wallet.balance_cents || 0) / 100);
          setReferralBalance((wallet.referral_balance_cents || 0) / 100);
          setRefundBalance((wallet.refund_balance_cents || 0) / 100);
          console.log('✅ Saldi renter caricati:', {
            general: (wallet.balance_cents || 0) / 100,
            referral: (wallet.referral_balance_cents || 0) / 100,
            refund: (wallet.refund_balance_cents || 0) / 100
          });
        }
      } catch (err) {
        console.error('Errore caricando saldi renter:', err);
      } finally {
        setRenterWalletLoading(false);
      }
    };

    // ✅ TRANSAZIONI RENTER: bonus referral, rimborsi, pagamenti prenotazioni
    const loadRenterTransactions = async () => {
      if (!currentUser.id) return;
      
      setRenterTxLoading(true);
      try {
        const { data: txs, error } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('wallet_type', 'renter') // ✨ Filtra per wallet_type renter
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (!error && txs) {
          setRenterTransactions(txs.map(t => ({
            id: t.id,
            amount: (t.amount_cents || 0) / 100,
            type: t.type,
            source: t.source,
            description: t.description,
            createdAt: t.created_at,
          })));
        }
      } catch (err) {
        console.error('Errore caricando transazioni renter:', err);
      } finally {
        setRenterTxLoading(false);
      }
    };

    // ✅ CARICA REFERRAL IN ATTESA
    const loadPendingReferrals = async () => {
      if (!currentUser.id) return;
      
      try {
        const { data: pending, error } = await supabase
          .from('referral_tracking')
          .select('inviter_bonus_cents')
          .eq('inviter_id', currentUser.id)
          .in('status', ['registered', 'booking_pending']);
        
        if (!error && pending) {
          const totalPending = pending.reduce((sum, r) => sum + (r.inviter_bonus_cents || 0), 0) / 100;
          setPendingBonus(totalPending);
          setPendingCount(pending.length);
          console.log('✅ Referral in attesa:', { totalPending, count: pending.length });
        }
      } catch (err) {
        console.error('Errore caricando referral in attesa:', err);
      }
    };

    loadRenterWallet();
    loadRenterTransactions();
    loadPendingReferrals();
  }, [currentUser.id]);

  // ✅ CARICA IMPOSTAZIONI REFERRAL DAL DATABASE
  useEffect(() => {
    const loadReferralSettings = async () => {
      try {
        const settings = await referralApi.getSettings();
        if (settings) {
          // Usa il bonus per chi invita (inviter)
          setReferralBonus(settings.inviterBonusCents / 100);
        }
      } catch (err) {
        console.error('Errore caricando impostazioni referral:', err);
      }
    };
    
    loadReferralSettings();
  }, []); // Solo al mount

  // 📋 Gestione modal dettaglio prenotazione
  const handleBookingClick = async (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setLoadingBookingDetails(true);
    setBookingDetails(null);

    try {
      // Query per ottenere tutti i dettagli della prenotazione
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          start_date,
          end_date,
          amount_total,
          platform_fee,
          hubber_net_amount,
          status,
          created_at,
          listing:listing_id(
            id,
            title,
            images,
            price,
            price_unit,
            pickup_address,
            pickup_city,
            pickup_instructions
          ),
          renter:renter_id(
            id,
            first_name,
            last_name,
            public_name,
            avatar_url
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error) {
        console.error('Errore caricamento dettagli prenotazione:', error);
        return;
      }

      setBookingDetails(data);
    } catch (err) {
      console.error('Errore:', err);
    } finally {
      setLoadingBookingDetails(false);
    }
  };

  const closeBookingModal = () => {
    setSelectedBookingId(null);
    setBookingDetails(null);
  };

  // ===========================
  //   CARICA WALLET REALE (HUBBER)
  // ===========================
  useEffect(() => {
    const loadWallet = async () => {
      setWalletLoading(true);
      console.log('🟢 [WALLET] Carico saldo - activeMode:', activeMode, 'userId:', currentUser.id);
      try {
        const balance = await api.wallet.getBalanceFromDb(currentUser.id, activeMode);
        console.log('🟢 [WALLET] Saldo ricevuto:', balance, 'per mode:', activeMode);
        setWalletBalance(balance);
      } catch (err) {
        console.error('❌ [WALLET] Errore caricando saldo wallet:', err);
        const fallback = activeMode === 'hubber' ? (currentUser.hubberBalance ?? 0) : (currentUser.renterBalance ?? 0);
        console.log('⚠️ [WALLET] Uso fallback:', fallback, 'per mode:', activeMode);
        setWalletBalance(fallback);
      } finally {
        setWalletLoading(false);
      }
    };

    // ✅ TRANSAZIONI HUBBER: incassi prenotazioni, prelievi
    const loadTransactions = async () => {
      setTxLoading(true);
      try {
        const { data: txs, error } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('wallet_type', activeMode) // ✨ Filtra per wallet_type invece di source
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (!error && txs) {
          setHubberTransactions(txs.map(t => ({
            id: t.id,
            amount: (t.amount_cents || 0) / 100,
            type: t.type,
            source: t.source,
            description: t.description,
            createdAt: t.created_at,
            relatedBookingId: t.related_booking_id,
          })));
        }
      } catch (err) {
        console.error('Errore caricando transazioni:', err);
      } finally {
        setTxLoading(false);
      }
    };

    // ✅ CARICA GUADAGNI IN ATTESA (prenotazioni confirmed)
    const loadPendingEarnings = async () => {
      if (!currentUser.id) return;
      
      try {
        const { data: pendingBookings, error } = await supabase
          .from('bookings')
          .select('hubber_net_amount')
          .eq('hubber_id', currentUser.id)
          .eq('status', 'confirmed');
        
        if (!error && pendingBookings) {
          const totalPending = pendingBookings.reduce((sum, b) => sum + (b.hubber_net_amount || 0), 0);
          setPendingEarnings(totalPending);
          setPendingBookingsCount(pendingBookings.length);
          console.log('✅ Guadagni in attesa hubber:', { totalPending, count: pendingBookings.length });
        }
      } catch (err) {
        console.error('Errore caricando guadagni in attesa:', err);
      }
    };

    loadWallet();
    loadTransactions();
    loadPendingEarnings();
  }, [currentUser.id, activeMode]); // Rimosso currentUser.hubberBalance che causava loop

  const handleCopyReferral = () => {
    if (!currentUser.referralCode) return;
    navigator.clipboard.writeText(
      `https://renthubber.com/invito/${currentUser.referralCode}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ✅ CARICA LISTA REFERRAL DELL'UTENTE
  const loadReferralsList = async () => {
    setReferralsLoading(true);
    try {
      const { data, error } = await supabase
        .from('referral_tracking')
        .select(`
          *,
          invitee:invitee_id(first_name, last_name)
        `)
        .eq('inviter_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setReferralsList(data);
      }
    } catch (err) {
      console.error('Errore caricamento referral:', err);
    } finally {
      setReferralsLoading(false);
    }
  };

  // Handler per aprire drawer e caricare lista
  const handleOpenReferralDrawer = () => {
    setShowReferralDrawer(true);
    loadReferralsList();
  };

  // SALVATAGGIO DATI BANCARI → bank_details + sync in currentUser
  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankForm.iban || !bankForm.accountHolderName) {
      alert('Compila tutti i campi obbligatori');
      return;
    }

    try {
      const { error } = await supabase.from('bank_details').upsert(
        {
          user_id: currentUser.id,
          account_holder_name: bankForm.accountHolderName,
          account_holder_surname: bankForm.accountHolderSurname,
          iban: bankForm.iban,
          bank_name: bankForm.bankName,
          bic_swift: bankForm.bicSwift,
        },
        { onConflict: 'user_id' }
      );

      if (error) {
        console.error('Errore salvataggio bank_details:', error);
        alert('Errore nel salvataggio dei dati bancari.');
        return;
      }

      // aggiorno anche l'utente in memoria
      onUpdateUser({
        ...currentUser,
        bankDetails: bankForm,
      });

      setShowBankModal(false);
      alert('Dati bancari aggiornati con successo!');
    } catch (err) {
      console.error('Errore inatteso salvaggio bank_details:', err);
      alert('Errore imprevisto nel salvataggio dei dati bancari.');
    }
  };

 const handlePayoutSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const amount = parseFloat(payoutAmount);

  if (!amount || amount <= 0) {
    alert('Inserisci un importo valido.');
    return;
  }

  if (walletBalance == null) {
    alert('Saldo wallet non disponibile. Riprova tra qualche secondo.');
    return;
  }

  if (amount > walletBalance) {
    alert("L'importo non può superare il saldo disponibile.");
    return;
  }

  if (!effectiveIban) {
    alert('Devi prima salvare i dati bancari (Impostazioni Fiscali).');
    setShowPayoutModal(false);
    setShowBankModal(true);
    return;
  }

  try {
    const amountCents = Math.round(amount * 100);

    // 1. Salva richiesta nel DB
    const { data: payoutData, error: payoutError } = await supabase
      .from('payout_requests')
      .insert({
        user_id: currentUser.id,
        amount_cents: amountCents,
        currency: 'EUR',
        status: 'pending',
      })
      .select()
      .single();

    if (payoutError) {
      console.error('Errore richiesta payout:', payoutError);
      alert('Errore nella richiesta. Riprova.');
      return;
    }

    // 2. Sottrai dal wallet
    const newBalanceCents = Math.round((walletBalance - amount) * 100);
    
    const { error: walletError } = await supabase
      .from('wallets')
      .update({ 
        balance_cents: newBalanceCents,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', currentUser.id);

    if (walletError) {
      console.error('Errore aggiornamento wallet:', walletError);
      // Rollback: elimina la richiesta
      await supabase.from('payout_requests').delete().eq('id', payoutData.id);
      alert('Errore nella richiesta. Riprova.');
      return;
    }

    // 3. Crea transazione
    const { error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: currentUser.id,
        amount_cents: -amountCents,
        balance_after_cents: newBalanceCents,
        type: 'debit',
        source: 'booking_payout',
        description: 'Richiesta prelievo bonifico',
        related_payout_id: payoutData.id,
      });

    if (txError) {
      console.error('Errore creazione transazione:', txError);
      // Non blocchiamo, la richiesta è già stata creata
    }

    // 4. Aggiorna UI
    setWalletBalance(walletBalance - amount);
    setShowPayoutModal(false);
    setPayoutAmount('');
    
    // Ricarica transazioni filtrate per wallet_type
    const { data: txs } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('wallet_type', activeMode) // ✨ Filtra per wallet_type
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (txs) {
      setHubberTransactions(txs.map(t => ({
        id: t.id,
        amount: (t.amount_cents || 0) / 100,
        type: t.type,
        source: t.source,
        description: t.description,
        createdAt: t.created_at,
      })));
    }

    alert("✅ Richiesta inviata! L'importo è stato riservato per il bonifico.");

  } catch (err) {
    console.error('Errore inatteso payout:', err);
    alert('Errore imprevisto. Riprova.');
  }
};

  // ===========================
  //        RENTER VIEW
  // ===========================
  if (activeMode === 'renter') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="bg-blue-100 text-blue-700 p-2 rounded-lg mr-3">
              <WalletIcon className="w-6 h-6" />
            </span>
            Wallet Renter
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* ✅ SALDI SEPARATI - Card principale */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg md:col-span-2 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-blue-200 text-sm font-medium mb-1">
                  Credito Totale Disponibile
                </p>
                <h2 className="text-4xl font-bold mb-4">
                  {(renterWalletLoading || walletLoading) ? (
                    <span className="flex items-center">
                      <RefreshCw className="w-6 h-6 animate-spin mr-2" /> ...
                    </span>
                  ) : (
                    `€ ${totalRenterCredit.toFixed(2)}`
                  )}
                </h2>
                
                {/* ✅ DETTAGLIO SALDI SEPARATI */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  {/* Box Wallet (credito admin) */}
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <WalletIcon className="w-4 h-4 text-blue-300" />
                      <span className="text-xs text-blue-200">Wallet</span>
                    </div>
                    <p className="text-xl font-bold">€ {generalBalance.toFixed(2)}</p>
                    <p className="text-[10px] text-blue-300 mt-1">Utilizzo al 100%</p>
                  </div>
                
                  {/* Box Invita Amico con pending */}
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Gift className="w-4 h-4 text-yellow-300" />
                      <span className="text-xs text-blue-200">Invita Amico</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-xl font-bold">€ {referralBalance.toFixed(2)}</p>
                      {pendingCount > 0 && (
                        <span className="text-[10px] text-yellow-300 flex items-center">
                          <Clock className="w-3 h-3 mr-0.5" />
                          € {pendingBonus.toFixed(2)} ({pendingCount} {pendingCount === 1 ? 'amico' : 'amici'})
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-blue-300 mt-1">Max 30% commissioni</p>
                  </div>
                  
                  {/* Box Rimborsi */}
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <RefreshCw className="w-4 h-4 text-green-300" />
                      <span className="text-xs text-blue-200">Rimborsi</span>
                    </div>
                    <p className="text-xl font-bold">€ {refundBalance.toFixed(2)}</p>
                    <p className="text-[10px] text-blue-300 mt-1">Utilizzo al 100%</p>
                  </div>
                </div>

                <p className="text-xs text-blue-200">
                  * Credito utilizzabile solo per prenotazioni su Renthubber.
                </p>
              </div>
              <div className="absolute -right-10 -bottom-10 text-white/10">
                <WalletIcon className="w-48 h-48" />
              </div>
            </div>

            {/* Referral Card – sempre visibile, compatta */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
              <div className="mb-4">
                <div className="bg-yellow-100 w-10 h-10 rounded-full flex items-center justify-center mb-3">
                  <Share2 className="w-5 h-5 text-yellow-600" />
                </div>
                <h3 className="font-bold text-gray-900">
                  Guadagna €{referralBonus.toFixed(2)}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Invita un amico su Renthubber e ricevi credito gratis.
                </p>
              </div>

              <div className="mt-auto">
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                  Il tuo codice
                </p>
                <div
                  onClick={currentUser.referralCode ? handleCopyReferral : undefined}
                  className={`bg-gray-100 border border-gray-200 rounded-lg p-3 flex justify-between items-center transition-colors ${
                    currentUser.referralCode
                      ? 'cursor-pointer hover:bg-gray-200'
                      : 'opacity-60 cursor-not-allowed'
                  }`}
                >
                  <span className="font-mono font-bold text-gray-800">
                    {currentUser.referralCode || '...'}
                  </span>
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                
                {/* Bottone per vedere lista inviti */}
                <button
                  onClick={handleOpenReferralDrawer}
                  className="mt-3 w-full text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1 py-2 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Users className="w-3 h-3" />
                  Vedi i tuoi inviti
                </button>
              </div>
            </div>
          </div>

          {/* Transaction History RENTER */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Movimenti Credito</h3>
              {renterTxLoading && (
                <span className="text-xs text-gray-400 flex items-center">
                  <RefreshCw className="w-3 h-3 animate-spin mr-1" /> Caricamento...
                </span>
              )}
            </div>
            <div className="divide-y divide-gray-50">
              {renterTransactions.length > 0 ? (
                renterTransactions.map((t) => (
                  <div
                    key={t.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                          t.type === 'credit'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {t.type === 'credit' ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {t.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t.createdAt ? new Date(t.createdAt).toLocaleString('it-IT') : t.date || ''}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-bold ${
                        t.type === 'credit'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {t.type === 'credit' ? '+' : '-'}€{Math.abs(Number(t.amount || 0)).toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 text-sm">
                  {renterTxLoading ? 'Caricamento movimenti...' : 'Nessun movimento recente.'}
                </div>
              )}
            </div>
          </div>

          {/* ✅ DRAWER LISTA INVITI */}
          {showReferralDrawer && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-end md:items-center md:justify-center"
              onClick={() => setShowReferralDrawer(false)}
            >
              <div 
                className="bg-white w-full md:w-[500px] rounded-t-3xl md:rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">I Tuoi Inviti</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {referralsList.length} {referralsList.length === 1 ? 'invito' : 'inviti'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowReferralDrawer(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Lista Inviti */}
                <div className="flex-1 overflow-y-auto p-6">
                  {referralsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : referralsList.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">
                        Non hai ancora invitato nessuno.
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Condividi il tuo codice per iniziare!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {referralsList.map((ref) => {
                        const invitee = ref.invitee as any;
                        const firstName = invitee?.first_name || 'Utente';
                        const lastNameInitial = invitee?.last_name?.[0] || '';
                        const displayName = `${firstName} ${lastNameInitial}.`;
                        
                        // Determina stato e colore pallino
                        let statusColor = 'bg-yellow-400'; // Default: in attesa
                        let statusText = 'In attesa prima prenotazione';
                        let statusDate = new Date(ref.created_at).toLocaleDateString('it-IT');
                        
                        if (ref.status === 'completed' || ref.status === 'bonus_paid') {
                          statusColor = 'bg-green-500';
                          statusText = 'Bonus completato';
                          statusDate = ref.booking_completed_at 
                            ? new Date(ref.booking_completed_at).toLocaleDateString('it-IT')
                            : statusDate;
                        } else if (ref.status === 'expired') {
                          statusColor = 'bg-red-500';
                          statusText = 'Invito scaduto';
                        }

                        return (
                          <div 
                            key={ref.id}
                            className="bg-gray-50 rounded-lg p-4 flex items-start gap-3"
                          >
                            {/* Pallino colorato */}
                            <div className={`w-3 h-3 rounded-full ${statusColor} mt-1 flex-shrink-0`} />
                            
                            {/* Contenuto */}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900">{displayName}</p>
                              <p className="text-sm text-gray-600">{statusText}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {statusDate}
                                </p>
                                {(ref.status === 'completed' || ref.status === 'bonus_paid') && (
                                  <p className="text-xs font-semibold text-green-600">
                                    €{(ref.inviter_bonus_cents / 100).toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer con statistiche */}
                {referralsList.length > 0 && (
                  <div className="border-t border-gray-100 p-6 bg-gray-50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Totale Inviti</p>
                        <p className="text-2xl font-bold text-gray-900">{referralsList.length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Bonus Guadagnati</p>
                        <p className="text-2xl font-bold text-green-600">
                          €{referralsList
                            .filter(r => r.status === 'completed' || r.status === 'bonus_paid')
                            .reduce((sum, r) => sum + (r.inviter_bonus_cents / 100), 0)
                            .toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===========================
  //        HUBBER VIEW
  // ===========================
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="bg-orange-100 text-orange-700 p-2 rounded-lg mr-3">
            <WalletIcon className="w-6 h-6" />
          </span>
          Wallet Hubber
        </h1>

        {/* ✅ STRIPE STATUS BANNER */}
        <StripeStatusBanner
          userId={currentUser.id}
          email={currentUser.email || ''}
          firstName={currentUser.firstName}
          lastName={currentUser.lastName}
          stripeAccountId={(currentUser as any).stripe_account_id}
          stripeOnboardingCompleted={(currentUser as any).stripe_onboarding_completed}
          stripeChargesEnabled={(currentUser as any).stripe_charges_enabled}
          stripePayoutsEnabled={(currentUser as any).stripe_payouts_enabled}
          onRefresh={() => window.location.reload()}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Balance Card HUBBER */}
          <div className="bg-gradient-to-br from-brand to-brand-dark rounded-2xl p-6 text-white shadow-lg md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/10 p-2 rounded-lg">
                <WalletIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs bg-brand-accent text-brand-dark font-bold px-2 py-1 rounded-md">
                PRELEVABILE
              </span>
            </div>
            
            <div className="mb-4">
              <p className="text-white/80 text-sm mb-1">Saldo Disponibile</p>
              <h2 className="text-4xl font-bold">
                € {walletLoading ? '...' : (walletBalance ?? 0).toFixed(2)}
              </h2>
            </div>

            {/* ✅ SALDO IN ATTESA */}
            {pendingBookingsCount > 0 && (
              <div className="bg-white/10 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-300" />
                    <span className="text-sm text-white/80">In attesa</span>
                  </div>
                  <span className="text-lg font-bold text-yellow-300">
                    € {pendingEarnings.toFixed(2)}
                  </span>
                </div>
                <p className="text-[10px] text-white/70 mt-1">
                  {pendingBookingsCount} {pendingBookingsCount === 1 ? 'prenotazione' : 'prenotazioni'} in corso
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <PayoutRequestButton
                userId={currentUser.id}
                hubberBalance={walletBalance ?? 0}
                stripeAccountId={(currentUser as any).stripe_account_id}
                stripePayoutsEnabled={(currentUser as any).stripe_payouts_enabled}
                iban={effectiveIban}
                onConfigureIban={() => setShowBankModal(true)}
                onSuccess={() => {
                  loadWalletData();
                  alert('✅ Richiesta inviata con successo!');
                }}
              />
              <button
                onClick={() => setShowBankModal(true)}
                className="w-full sm:flex-1 bg-brand-light/30 text-white border border-white/20 font-bold py-2.5 rounded-lg hover:bg-brand-light/40 transition-colors text-sm flex items-center justify-center"
              >
                <Landmark className="w-4 h-4 mr-2" /> Impostazioni Fiscali
              </button>
            </div>
          </div>

          {/* Earnings Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Andamento</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar
                    dataKey="importo"
                    fill="#0D414B"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Transactions List HUBBER */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Storico Incassi</h3>
            <div className="flex items-center gap-3">
              {txLoading && (
                <span className="text-xs text-gray-400">Caricamento...</span>
              )}
              <button className="text-sm text-brand hover:underline">
                Esporta CSV
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {hubberTransactions.length > 0 ? (
              hubberTransactions.map((t) => (
                <div
                  key={t.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                        t.type === 'credit'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {t.type === 'credit' ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {(() => {
                          const bookingCodePattern = /(#[A-Z0-9]{6})/g;
                          const parts = t.description.split(bookingCodePattern);
                          
                          return parts.map((part, index) => {
                            if (part.match(bookingCodePattern) && t.relatedBookingId) {
                              return (
                                <button
                                  key={index}
                                  onClick={() => handleBookingClick(t.relatedBookingId)}
                                  className="text-brand hover:text-brand-dark font-semibold underline cursor-pointer"
                                >
                                  {part}
                                </button>
                              );
                            }
                            return <span key={index}>{part}</span>;
                          });
                        })()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t.createdAt
                          ? new Date(t.createdAt).toLocaleString('it-IT')
                          : ''}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-bold ${
                      t.type === 'credit'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {t.type === 'credit' ? '+' : '-'}€
                    {Math.abs(Number(t.amount || 0)).toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500 text-sm">
                {txLoading
                  ? 'Caricamento movimenti...'
                  : 'Nessun movimento recente.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FISCAL SETTINGS MODAL */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 flex items-center">
                <Landmark className="w-5 h-5 mr-2 text-brand" /> Dati Bancari
                per Bonifici
              </h3>
              <button
                onClick={() => setShowBankModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBankDetails} className="p-6 space-y-4">
              <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-xs mb-2">
                Questi dati verranno utilizzati per inviarti i guadagni (Payout)
                direttamente sul tuo conto corrente.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Intestatario
                  </label>
                  <input
                    type="text"
                    value={bankForm.accountHolderName}
                    onChange={(e) =>
                      setBankForm({
                        ...bankForm,
                        accountHolderName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                    placeholder="Mario"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cognome Intestatario
                  </label>
                  <input
                    type="text"
                    value={bankForm.accountHolderSurname}
                    onChange={(e) =>
                      setBankForm({
                        ...bankForm,
                        accountHolderSurname: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                    placeholder="Rossi"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IBAN
                </label>
                <input
                  type="text"
                  value={bankForm.iban}
                  onChange={(e) =>
                    setBankForm({
                      ...bankForm,
                      iban: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none font-mono uppercase"
                  placeholder="IT60X..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Banca
                  </label>
                  <input
                    type="text"
                    value={bankForm.bankName}
                    onChange={(e) =>
                      setBankForm({
                        ...bankForm,
                        bankName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                    placeholder="Es. Intesa Sanpaolo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    BIC / SWIFT
                  </label>
                  <input
                    type="text"
                    value={bankForm.bicSwift}
                    onChange={(e) =>
                      setBankForm({
                        ...bankForm,
                        bicSwift: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none font-mono uppercase"
                    placeholder="XXXXXXXX"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-brand text-white rounded-lg font-bold hover:bg-brand-dark shadow-md flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" /> Salva Dati
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYOUT REQUEST MODAL */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-brand text-white">
              <h3 className="font-bold flex items-center">
                <Send className="w-5 h-5 mr-2" /> Richiedi Bonifico
              </h3>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="text-white/80 hover:text-white p-1 hover:bg-white/20 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayoutSubmit} className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-gray-500 text-sm mb-2">Saldo Disponibile</p>
                <p className="text-3xl font-bold text-brand">
                  € {walletLoading ? '...' : (walletBalance ?? 0).toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Importo da prelevare (€)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={walletBalance ?? 0}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand focus:ring-0 outline-none text-xl font-bold text-gray-900"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Verrà inviato all&apos;IBAN:{' '}
                  <span className="font-mono font-medium text-gray-600">
                    {effectiveIban || 'N/A'}
                  </span>
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-brand text-white rounded-xl font-bold hover:bg-brand-dark shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
                >
                  Invia Richiesta
                </button>
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="w-full mt-3 py-3 text-gray-500 font-medium hover:text-gray-800 transition-colors"
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOOKING DETAIL MODAL */}
      {selectedBookingId && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex justify-between items-center z-10">
              <h3 className="font-bold text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-brand" /> Dettaglio Prenotazione
              </h3>
              <button
                onClick={closeBookingModal}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Codice prenotazione */}
              <div className="bg-brand/5 border border-brand/20 rounded-xl p-4 mb-6">
                <p className="text-xs text-brand uppercase font-semibold mb-2">
                  Codice Prenotazione
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-mono font-bold text-brand tracking-wider">
                    #{selectedBookingId.slice(0, 6).toUpperCase()}
                  </p>
                  <button
                    onClick={() => {
                      const code = selectedBookingId.slice(0, 6).toUpperCase();
                      navigator.clipboard.writeText(code);
                    }}
                    className="text-sm text-brand hover:text-brand-dark font-medium hover:underline"
                  >
                    Copia
                  </button>
                </div>
              </div>

              {/* Contenuto prenotazione */}
              {loadingBookingDetails ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-3 border-brand border-t-transparent rounded-full mx-auto mb-3"></div>
                  <p className="text-sm text-gray-500">Caricamento dettagli...</p>
                </div>
              ) : bookingDetails ? (
                <div className="space-y-4">
                  {/* Info listing con immagine */}
                  <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
                    <div className="w-20 h-20 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0">
                      {bookingDetails.listing?.images?.[0] && (
                        <img
                          src={bookingDetails.listing.images[0]}
                          alt={bookingDetails.listing.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-base mb-1">
                        {bookingDetails.listing?.title || 'N/A'}
                      </h4>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(bookingDetails.start_date).toLocaleDateString('it-IT')} - {new Date(bookingDetails.end_date).toLocaleDateString('it-IT')}
                      </p>
                      <div className="mt-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          bookingDetails.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          bookingDetails.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          bookingDetails.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {bookingDetails.status === 'confirmed' ? 'Confermata' :
                           bookingDetails.status === 'completed' ? 'Completata' :
                           bookingDetails.status === 'cancelled' ? 'Cancellata' :
                           bookingDetails.status === 'pending' ? 'In Attesa' : bookingDetails.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Indirizzo ritiro (solo se confermata/completata) */}
                  {(bookingDetails.status === 'confirmed' || bookingDetails.status === 'completed') && (
                    <div className="bg-brand/5 border border-brand/20 rounded-xl p-4">
                      <p className="text-xs text-brand uppercase font-semibold mb-2 flex items-center">
                        <Landmark className="w-3 h-3 mr-1" />
                        Indirizzo di ritiro
                      </p>
                      {bookingDetails.listing?.pickup_address ? (
                        <>
                          <p className="font-bold text-gray-900 text-sm">
                            {bookingDetails.listing.pickup_address}
                          </p>
                          {bookingDetails.listing.pickup_city && (
                            <p className="text-sm text-gray-600">{bookingDetails.listing.pickup_city}</p>
                          )}
                          {bookingDetails.listing.pickup_instructions && (
                            <p className="text-xs text-gray-500 mt-2 italic">
                              "{bookingDetails.listing.pickup_instructions}"
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">Indirizzo non ancora disponibile</p>
                      )}
                    </div>
                  )}

                  {/* Info renter */}
                  {bookingDetails.renter && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Cliente</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                          {bookingDetails.renter.avatar_url ? (
                            <img
                              src={bookingDetails.renter.avatar_url}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm bg-brand">
                              {(bookingDetails.renter.first_name?.[0] || '?').toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {bookingDetails.renter.public_name || `${bookingDetails.renter.first_name || ''} ${bookingDetails.renter.last_name || ''}`.trim() || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Riepilogo costi */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Riepilogo Finanziario</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Importo totale</span>
                        <span className="font-medium text-gray-900">€{(bookingDetails.amount_total || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Commissione piattaforma</span>
                        <span className="font-medium text-red-600">-€{(bookingDetails.platform_fee || 0).toFixed(2)}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-200 flex justify-between">
                        <span className="font-bold text-gray-900">Netto Hubber</span>
                        <span className="font-bold text-green-600 text-lg">€{(bookingDetails.hubber_net_amount || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-sm text-red-800">Errore nel caricamento dei dettagli</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};