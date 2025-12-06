/**
 * Stripe Service - RentHubber
 * 
 * Wrapper per tutte le chiamate alle Netlify Functions Stripe
 */

// Base URL per le functions (cambia in produzione)
const FUNCTIONS_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/.netlify/functions'
  : 'http://localhost:8888/.netlify/functions';

interface CreateConnectAccountResponse {
  success: boolean;
  accountId: string;
  onboardingUrl: string;
}

interface CreatePaymentIntentRequest {
  listingId: string;
  renterId: string;
  hubberId: string;
  startDate: string;
  endDate: string;
  basePrice: number;
  renterFee: number;
  hubberFee: number;
  deposit: number;
  totalAmount: number;
  useWallet: boolean;
  refundBalanceToUse?: number;
  referralBalanceToUse?: number;
}

interface CreatePaymentIntentResponse {
  success: boolean;
  paidWithWallet?: boolean;
  bookingId?: string;
  clientSecret?: string;
  paymentIntentId?: string;
  amountToPay?: number;
  amountToPayCents?: number;
}

interface ProcessPayoutRequest {
  payoutRequestId: string;
  adminId?: string;
  approved?: boolean;
  rejectionReason?: string;
}

interface ProcessPayoutResponse {
  success: boolean;
  approved?: boolean;
  stripePayoutId?: string;
  amount?: number;
  newBalance?: number;
  automatic?: boolean;
  requiresManualApproval?: boolean;
  reason?: string;
}

export const stripeService = {
  /**
   * Crea Stripe Connect Account per Hubber
   */
  createConnectAccount: async (
    userId: string,
    email: string,
    firstName?: string,
    lastName?: string
  ): Promise<CreateConnectAccountResponse> => {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/create-connect-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email, firstName, lastName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create Connect Account');
    }

    return response.json();
  },

  /**
   * Crea Payment Intent (con deduzione wallet)
   */
  createPaymentIntent: async (
    request: CreatePaymentIntentRequest
  ): Promise<CreatePaymentIntentResponse> => {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create Payment Intent');
    }

    return response.json();
  },

  /**
   * Processa payout MANUALE (admin approva/rifiuta)
   */
  processPayoutManual: async (
    request: ProcessPayoutRequest
  ): Promise<ProcessPayoutResponse> => {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/process-payout-manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to process payout');
    }

    return response.json();
  },

  /**
   * Processa payout AUTOMATICO (futuro)
   */
  processPayoutAuto: async (
    payoutRequestId: string
  ): Promise<ProcessPayoutResponse> => {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/process-payout-auto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payoutRequestId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to process automatic payout');
    }

    return response.json();
  },

  /**
   * Crea transfer a Hubber (chiamato da pg_cron o manualmente)
   */
  createTransfer: async (bookingId: string): Promise<any> => {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/create-transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create transfer');
    }

    return response.json();
  },
};

export default stripeService;