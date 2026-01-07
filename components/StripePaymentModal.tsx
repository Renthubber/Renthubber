import React, { useState, useEffect } from 'react';
import { X, CreditCard, Wallet, Loader } from 'lucide-react';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import stripeService from '../services/stripeService';

// Carica Stripe (usa la chiave pubblica da .env)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  
  // Dati prenotazione
  listingId: string;
  renterId: string;
  hubberId: string;
  listingTitle: string;
  startDate: string;
  endDate: string;
  
  // Prezzi
  basePrice: number;
  renterFee: number;
  hubberFee: number;
  deposit: number;
  totalAmount: number;
  
  // Wallet
  useWallet: boolean;
  refundBalanceToUse: number;
  referralBalanceToUse: number;
  amountToPay: number; // Dopo deduzione wallet
  
  // Callbacks
  onSuccess: () => void;
  onError?: (error: string) => void;
}

/**
 * Form interno con Stripe Elements
 */
const CheckoutForm: React.FC<{
  clientSecret: string;
  amountToPay: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}> = ({ clientSecret, amountToPay, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?payment=success`,
        },
        redirect: 'if_required', // Non redirect se non necessario
      });

      if (error) {
        console.error('❌ Payment error:', error);
        onError(error.message || 'Errore durante il pagamento');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess();
      }
    } catch (err: any) {
      console.error('❌ Payment exception:', err);
      onError(err.message || 'Errore imprevisto');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Importo da pagare:</span>
          <span className="text-xl font-bold text-[#0d4a5f]">
            €{amountToPay.toFixed(2)}
          </span>
        </div>
      </div>

      <PaymentElement />

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full py-3 bg-[#0d4a5f] text-white rounded-lg hover:bg-[#0a3a4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            <span>Elaborazione...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            <span>Paga €{amountToPay.toFixed(2)}</span>
          </>
        )}
      </button>
    </form>
  );
};

/**
 * Modal principale
 */
export const StripePaymentModal: React.FC<StripePaymentModalProps> = ({
  isOpen,
  onClose,
  listingId,
  renterId,
  hubberId,
  listingTitle,
  startDate,
  endDate,
  basePrice,
  renterFee,
  hubberFee,
  deposit,
  totalAmount,
  useWallet,
  refundBalanceToUse,
  referralBalanceToUse,
  amountToPay,
  onSuccess,
  onError,
}) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paidWithWallet, setPaidWithWallet] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setClientSecret(null);
      setError(null);
      setPaidWithWallet(false);
      return;
    }

    createPaymentIntent();
  }, [isOpen]);

  const createPaymentIntent = async () => {
    setLoading(true);
    setError(null);

    try {
      
      const result = await stripeService.createPaymentIntent({
        listingId,
        renterId,
        hubberId,
        startDate,
        endDate,
        basePrice,
        renterFee,
        hubberFee,
        deposit,
        totalAmount,
        useWallet,
        refundBalanceToUse,
        referralBalanceToUse,
      });

      if (result.paidWithWallet) {
        // Pagamento 100% con wallet - nessun Payment Intent necessario
       
        setPaidWithWallet(true);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else if (result.clientSecret) {
        // Pagamento parziale/totale con Stripe
        setClientSecret(result.clientSecret);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error('❌ Error creating Payment Intent:', err);
      setError(err.message || 'Errore durante la creazione del pagamento');
      if (onError) {
        onError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    onSuccess();
  };

  const handleError = (errorMsg: string) => {
    setError(errorMsg);
    if (onError) {
      onError(errorMsg);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-xl text-gray-900">Completa prenotazione</h3>
            <p className="text-sm text-gray-500 mt-1">{listingTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Riepilogo wallet */}
          {useWallet && (refundBalanceToUse > 0 || referralBalanceToUse > 0) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-start gap-3">
              <Wallet className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-800">Wallet applicato</p>
                <div className="text-xs text-green-700 mt-1 space-y-1">
                  {refundBalanceToUse > 0 && (
                    <div>Crediti rimborsi: -€{refundBalanceToUse.toFixed(2)}</div>
                  )}
                  {referralBalanceToUse > 0 && (
                    <div>Crediti referral: -€{referralBalanceToUse.toFixed(2)}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-[#0d4a5f]" />
            </div>
          )}

          {/* Errore */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={createPaymentIntent}
                className="text-sm text-red-600 hover:text-red-800 underline mt-2"
              >
                Riprova
              </button>
            </div>
          )}

          {/* Pagato 100% con wallet */}
          {paidWithWallet && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Prenotazione confermata!
              </h4>
              <p className="text-sm text-gray-600">
                Pagamento completato con il tuo wallet
              </p>
            </div>
          )}

          {/* Stripe Payment Form */}
          {!loading && !error && !paidWithWallet && clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#0d4a5f',
                  },
                },
              }}
            >
              <CheckoutForm
                clientSecret={clientSecret}
                amountToPay={amountToPay}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
};

export default StripePaymentModal;