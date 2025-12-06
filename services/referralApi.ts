import { supabase } from "../lib/supabase";

// =============================================
// TYPES
// =============================================
export interface ReferralSettings {
  id: string;
  inviterBonusCents: number;
  inviteeBonusCents: number;
  maxCreditUsagePercent: number;
  maxInvitesPerUser: number | null;
  minBookingAmountCents: number;
  requireCompletedBooking: boolean;
  isActive: boolean;
}

export interface ReferralTracking {
  id: string;
  inviterId: string;
  inviteeId: string;
  referralCode: string;
  status: 'registered' | 'booking_pending' | 'completed' | 'bonus_paid' | 'cancelled' | 'fraud_suspected';
  firstBookingId: string | null;
  bookingCompletedAt: string | null;
  inviterBonusCents: number | null;
  inviteeBonusCents: number | null;
  inviterBonusPaidAt: string | null;
  inviteeBonusPaidAt: string | null;
  createdAt: string;
  // Join data
  inviter?: {
    id: string;
    first_name: string;
    last_name: string;
    public_name: string;
    email: string;
  };
  invitee?: {
    id: string;
    first_name: string;
    last_name: string;
    public_name: string;
    email: string;
  };
}

export interface ReferralStats {
  totalInvited: number;
  registered: number;
  completed: number;
  bonusPaid: number;
  pendingBonus: number;
  totalBonusEarned: number;
  availableBonus: number;
}

// =============================================
// REFERRAL API
// =============================================
export const referralApi = {
  // ==========================================
  // SETTINGS (Admin)
  // ==========================================
  
  /**
   * Ottieni le impostazioni referral correnti
   */
  getSettings: async (): Promise<ReferralSettings | null> => {
    try {
      const { data, error } = await supabase
        .from("referral_settings")
        .select("*")
        .limit(1)
        .single();

      if (error) {
        console.error("❌ referralApi.getSettings errore:", error);
        return null;
      }

      return {
        id: data.id,
        inviterBonusCents: data.inviter_bonus_cents,
        inviteeBonusCents: data.invitee_bonus_cents,
        maxCreditUsagePercent: data.max_credit_usage_percent,
        maxInvitesPerUser: data.max_invites_per_user,
        minBookingAmountCents: data.min_booking_amount_cents,
        requireCompletedBooking: data.require_completed_booking,
        isActive: data.is_active,
      };
    } catch (e) {
      console.error("❌ referralApi.getSettings eccezione:", e);
      return null;
    }
  },

  /**
   * Aggiorna le impostazioni referral (Admin)
   */
  updateSettings: async (settings: Partial<ReferralSettings>): Promise<boolean> => {
    try {
      console.log("👑 referralApi.updateSettings:", settings);

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (settings.inviterBonusCents !== undefined) {
        updateData.inviter_bonus_cents = settings.inviterBonusCents;
      }
      if (settings.inviteeBonusCents !== undefined) {
        updateData.invitee_bonus_cents = settings.inviteeBonusCents;
      }
      if (settings.maxCreditUsagePercent !== undefined) {
        updateData.max_credit_usage_percent = settings.maxCreditUsagePercent;
      }
      if (settings.maxInvitesPerUser !== undefined) {
        updateData.max_invites_per_user = settings.maxInvitesPerUser;
      }
      if (settings.minBookingAmountCents !== undefined) {
        updateData.min_booking_amount_cents = settings.minBookingAmountCents;
      }
      if (settings.requireCompletedBooking !== undefined) {
        updateData.require_completed_booking = settings.requireCompletedBooking;
      }
      if (settings.isActive !== undefined) {
        updateData.is_active = settings.isActive;
      }

      const { error } = await supabase
        .from("referral_settings")
        .update(updateData)
        .eq("id", settings.id);

      if (error) {
        console.error("❌ referralApi.updateSettings errore:", error);
        return false;
      }

      console.log("✅ referralApi.updateSettings completato");
      return true;
    } catch (e) {
      console.error("❌ referralApi.updateSettings eccezione:", e);
      return false;
    }
  },

  // ==========================================
  // TRACKING
  // ==========================================

  /**
   * Registra un nuovo referral quando un utente si iscrive con un codice
   */
  registerReferral: async (inviteeId: string, referralCode: string): Promise<boolean> => {
    try {
      console.log("🎁 referralApi.registerReferral:", { inviteeId, referralCode });

      // Trova l'inviter dal codice referral
      const { data: inviter, error: inviterError } = await supabase
        .from("users")
        .select("id, role, roles")
        .eq("referral_code", referralCode)
        .single();

      if (inviterError || !inviter) {
        console.error("❌ Codice referral non valido:", referralCode);
        return false;
      }

      // Verifica che l'inviter sia un renter
      const inviterRoles = inviter.roles || [inviter.role];
      if (!inviterRoles.includes("renter")) {
        console.error("❌ L'inviter non è un renter");
        return false;
      }

      // Verifica che l'invitee non sia già stato invitato
      const { data: existingReferral } = await supabase
        .from("referral_tracking")
        .select("id")
        .eq("invitee_id", inviteeId)
        .single();

      if (existingReferral) {
        console.log("⚠️ Utente già invitato in precedenza");
        return false;
      }

      // Verifica limite inviti per utente
      const settings = await referralApi.getSettings();
      if (settings?.maxInvitesPerUser) {
        const { count } = await supabase
          .from("referral_tracking")
          .select("id", { count: "exact", head: true })
          .eq("inviter_id", inviter.id)
          .in("status", ["registered", "booking_pending", "completed", "bonus_paid"]);

        if (count && count >= settings.maxInvitesPerUser) {
          console.log("⚠️ Limite inviti raggiunto per l'inviter");
          return false;
        }
      }

      // Registra il referral
      const { error: insertError } = await supabase
        .from("referral_tracking")
        .insert({
          inviter_id: inviter.id,
          invitee_id: inviteeId,
          referral_code: referralCode,
          status: "registered",
          inviter_bonus_cents: settings?.inviterBonusCents || 500,
          invitee_bonus_cents: settings?.inviteeBonusCents || 500,
        });

      if (insertError) {
        console.error("❌ Errore inserimento referral:", insertError);
        return false;
      }

      console.log("✅ Referral registrato con successo");
      return true;
    } catch (e) {
      console.error("❌ referralApi.registerReferral eccezione:", e);
      return false;
    }
  },

  /**
   * Completa il referral e accredita i bonus dopo una prenotazione completata
   */
  completeReferral: async (inviteeId: string, bookingId: string): Promise<boolean> => {
    try {
      console.log("🎁 referralApi.completeReferral:", { inviteeId, bookingId });

      // Trova il referral per questo invitee
      const { data: referral, error: refError } = await supabase
        .from("referral_tracking")
        .select("*")
        .eq("invitee_id", inviteeId)
        .in("status", ["registered", "booking_pending"])
        .single();

      if (refError || !referral) {
        console.log("ℹ️ Nessun referral attivo per questo utente");
        return false;
      }

      // Verifica che sia la prima prenotazione completata
      if (referral.first_booking_id && referral.first_booking_id !== bookingId) {
        console.log("ℹ️ Non è la prima prenotazione");
        return false;
      }

      const now = new Date().toISOString();

      // Aggiorna lo stato del referral
      const { error: updateError } = await supabase
        .from("referral_tracking")
        .update({
          status: "completed",
          first_booking_id: bookingId,
          booking_completed_at: now,
          updated_at: now,
        })
        .eq("id", referral.id);

      if (updateError) {
        console.error("❌ Errore aggiornamento referral:", updateError);
        return false;
      }

      // Accredita bonus all'inviter
      await referralApi.creditBonus(
        referral.inviter_id,
        referral.inviter_bonus_cents,
        `Bonus Invita un Amico`,
        referral.id,
        "inviter"
      );

      // Accredita bonus all'invitee
      await referralApi.creditBonus(
        referral.invitee_id,
        referral.invitee_bonus_cents,
        `Bonus di Benvenuto tramite Invito`,
        referral.id,
        "invitee"
      );

      // Aggiorna stato a bonus_paid
      await supabase
        .from("referral_tracking")
        .update({
          status: "bonus_paid",
          inviter_bonus_paid_at: now,
          invitee_bonus_paid_at: now,
          updated_at: now,
        })
        .eq("id", referral.id);

      console.log("✅ Referral completato e bonus accreditati");
      return true;
    } catch (e) {
      console.error("❌ referralApi.completeReferral eccezione:", e);
      return false;
    }
  },

  /**
   * Accredita bonus sul wallet - CREDITO REFERRAL (referral_balance_cents)
   * Questo credito ha un limite di utilizzo del 30% sulle commissioni
   */
  creditBonus: async (
    userId: string,
    amountCents: number,
    description: string,
    referralId: string,
    recipientType: "inviter" | "invitee"
  ): Promise<boolean> => {
    try {
      console.log("💰 referralApi.creditBonus:", { userId, amountCents, description });

      // Ottieni o crea wallet
      let { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!wallet) {
        // Crea wallet se non esiste (con tutte le colonne per i saldi separati)
        const { data: newWallet, error: createError } = await supabase
          .from("wallets")
          .insert({
            user_id: userId,
            balance_cents: 0,
            referral_balance_cents: 0,
            refund_balance_cents: 0,
            currency: "EUR",
          })
          .select()
          .single();

        if (createError) {
          console.error("❌ Errore creazione wallet:", createError);
          return false;
        }
        wallet = newWallet;
      }

      // ✅ Accredita su referral_balance_cents (NON balance_cents)
      const newReferralBalanceCents = (wallet.referral_balance_cents || 0) + amountCents;

      // Aggiorna saldo referral
      const { error: updateError } = await supabase
        .from("wallets")
        .update({
          referral_balance_cents: newReferralBalanceCents,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("❌ Errore aggiornamento wallet:", updateError);
        return false;
      }

      // Registra transazione
      const { error: txError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: userId,
          amount_cents: amountCents,
          balance_after_cents: newReferralBalanceCents,
          type: "credit",
          source: "adjustment", // Usiamo adjustment come da vincolo DB
          description: description,
          related_booking_id: null,
        });

      if (txError) {
        console.error("❌ Errore registrazione transazione:", txError);
        return false;
      }

      console.log("✅ Bonus referral accreditato:", amountCents / 100, "€ su referral_balance_cents");
      return true;
    } catch (e) {
      console.error("❌ referralApi.creditBonus eccezione:", e);
      return false;
    }
  },

  // ==========================================
  // STATISTICHE UTENTE
  // ==========================================

  /**
   * Ottieni statistiche referral per un utente
   */
  getStatsForUser: async (userId: string): Promise<ReferralStats> => {
    try {
      const { data: referrals, error } = await supabase
        .from("referral_tracking")
        .select("*")
        .eq("inviter_id", userId);

      if (error) {
        console.error("❌ referralApi.getStatsForUser errore:", error);
        return {
          totalInvited: 0,
          registered: 0,
          completed: 0,
          bonusPaid: 0,
          pendingBonus: 0,
          totalBonusEarned: 0,
          availableBonus: 0,
        };
      }

      const stats: ReferralStats = {
        totalInvited: referrals?.length || 0,
        registered: referrals?.filter(r => r.status === "registered").length || 0,
        completed: referrals?.filter(r => r.status === "completed").length || 0,
        bonusPaid: referrals?.filter(r => r.status === "bonus_paid").length || 0,
        pendingBonus: referrals?.filter(r => r.status === "completed" && !r.inviter_bonus_paid_at).length || 0,
        totalBonusEarned: referrals
          ?.filter(r => r.inviter_bonus_paid_at)
          .reduce((sum, r) => sum + (r.inviter_bonus_cents || 0), 0) / 100 || 0,
        availableBonus: 0, // Calcolato dal wallet separatamente
      };

      return stats;
    } catch (e) {
      console.error("❌ referralApi.getStatsForUser eccezione:", e);
      return {
        totalInvited: 0,
        registered: 0,
        completed: 0,
        bonusPaid: 0,
        pendingBonus: 0,
        totalBonusEarned: 0,
        availableBonus: 0,
      };
    }
  },

  /**
   * Ottieni lista referral per un utente (per mostrare nella UI)
   */
  getReferralsForUser: async (userId: string): Promise<ReferralTracking[]> => {
    try {
      const { data: referrals, error } = await supabase
        .from("referral_tracking")
        .select("*")
        .eq("inviter_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ referralApi.getReferralsForUser errore:", error);
        return [];
      }

      if (!referrals || referrals.length === 0) return [];

      // Prendi dati invitee
      const inviteeIds = referrals.map(r => r.invitee_id);
      const { data: invitees } = await supabase
        .from("users")
        .select("id, first_name, last_name, public_name, email")
        .in("id", inviteeIds);

      const inviteeMap = new Map((invitees || []).map(u => [u.id, u]));

      return referrals.map(r => ({
        id: r.id,
        inviterId: r.inviter_id,
        inviteeId: r.invitee_id,
        referralCode: r.referral_code,
        status: r.status,
        firstBookingId: r.first_booking_id,
        bookingCompletedAt: r.booking_completed_at,
        inviterBonusCents: r.inviter_bonus_cents,
        inviteeBonusCents: r.invitee_bonus_cents,
        inviterBonusPaidAt: r.inviter_bonus_paid_at,
        inviteeBonusPaidAt: r.invitee_bonus_paid_at,
        createdAt: r.created_at,
        invitee: inviteeMap.get(r.invitee_id),
      }));
    } catch (e) {
      console.error("❌ referralApi.getReferralsForUser eccezione:", e);
      return [];
    }
  },

  // ==========================================
  // ADMIN
  // ==========================================

  /**
   * Ottieni tutti i referral (Admin)
   */
  getAllReferrals: async (): Promise<ReferralTracking[]> => {
    try {
      console.log("👑 referralApi.getAllReferrals");

      const { data: referrals, error } = await supabase
        .from("referral_tracking")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ referralApi.getAllReferrals errore:", error);
        return [];
      }

      if (!referrals || referrals.length === 0) return [];

      // Prendi dati utenti
      const inviterIds = [...new Set(referrals.map(r => r.inviter_id))];
      const inviteeIds = [...new Set(referrals.map(r => r.invitee_id))];
      const allUserIds = [...new Set([...inviterIds, ...inviteeIds])];

      const { data: users } = await supabase
        .from("users")
        .select("id, first_name, last_name, public_name, email")
        .in("id", allUserIds);

      const userMap = new Map((users || []).map(u => [u.id, u]));

      return referrals.map(r => ({
        id: r.id,
        inviterId: r.inviter_id,
        inviteeId: r.invitee_id,
        referralCode: r.referral_code,
        status: r.status,
        firstBookingId: r.first_booking_id,
        bookingCompletedAt: r.booking_completed_at,
        inviterBonusCents: r.inviter_bonus_cents,
        inviteeBonusCents: r.invitee_bonus_cents,
        inviterBonusPaidAt: r.inviter_bonus_paid_at,
        inviteeBonusPaidAt: r.invitee_bonus_paid_at,
        createdAt: r.created_at,
        inviter: userMap.get(r.inviter_id),
        invitee: userMap.get(r.invitee_id),
      }));
    } catch (e) {
      console.error("❌ referralApi.getAllReferrals eccezione:", e);
      return [];
    }
  },

  /**
   * Segna referral come sospetto frode (Admin)
   */
  markAsFraud: async (referralId: string, notes: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("referral_tracking")
        .update({
          status: "fraud_suspected",
          fraud_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", referralId);

      if (error) {
        console.error("❌ referralApi.markAsFraud errore:", error);
        return false;
      }

      return true;
    } catch (e) {
      console.error("❌ referralApi.markAsFraud eccezione:", e);
      return false;
    }
  },

  /**
   * Cancella referral (Admin)
   */
  cancelReferral: async (referralId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("referral_tracking")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", referralId);

      if (error) {
        console.error("❌ referralApi.cancelReferral errore:", error);
        return false;
      }

      return true;
    } catch (e) {
      console.error("❌ referralApi.cancelReferral eccezione:", e);
      return false;
    }
  },

  // ==========================================
  // UTILITY
  // ==========================================

  /**
   * Genera link di invito
   */
  generateInviteLink: (referralCode: string): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/?ref=${referralCode}`;
  },

  /**
   * Verifica se un codice referral è valido
   */
  validateReferralCode: async (code: string): Promise<{ valid: boolean; inviterName?: string }> => {
    try {
      const { data: user, error } = await supabase
        .from("users")
        .select("id, first_name, public_name, role, roles")
        .eq("referral_code", code)
        .single();

      if (error || !user) {
        return { valid: false };
      }

      // Verifica che sia un renter
      const roles = user.roles || [user.role];
      if (!roles.includes("renter")) {
        return { valid: false };
      }

      return {
        valid: true,
        inviterName: user.public_name || user.first_name || "Un amico",
      };
    } catch (e) {
      return { valid: false };
    }
  },
};