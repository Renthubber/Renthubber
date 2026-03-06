// ============================================================
// RENTHUBBER STORE - Modal Abbonamento
// Path: src/store/components/StoreSubscriptionModal.tsx
// Pattern: identico a BookingPaymentModal (Elements + CardElement)
// ============================================================

import React, { useState } from 'react';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { stripePromise } from '../../lib/stripe';
import { supabase } from '../../services/supabaseClient';
import { CreditCard, CheckCircle, Store, Calendar, Loader2, X } from 'lucide-react';

// ============================================================
// PIANO
// ============================================================
const PLAN = {
  name: 'Piano Store',
  priceEur: 10.00,
  vatPercent: 22,
  vatEur: 2.20,
  totalEur: 12.20,
};

// ============================================================
// PROPS
// ============================================================
interface Props {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  storeName: string;
  onSuccess?: () => void;
}

// ============================================================
// INNER COMPONENT (dentro Elements)
// ============================================================
const StoreSubscriptionInner: React.FC<Props> = ({
  isOpen,
  onClose,
  storeId,
  storeName,
  onSuccess,
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!stripe || !elements) {
      setErrorMsg('Stripe non è ancora pronto. Riprova tra un momento.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setErrorMsg('Elemento carta non trovato.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      // 1. Crea subscription via Netlify Function
      const response = await fetch('/.netlify/functions/create-store-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore creazione abbonamento');
      }

      const { clientSecret } = await response.json();

      // 2. Conferma pagamento con Stripe
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: { name: storeName },
          },
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message || 'Pagamento fallito');
      }

      if (paymentIntent?.status === 'succeeded') {
        // 3. Polling: aspetta che il webhook aggiorni subscription_status
        console.log('⏳ Attendo conferma webhook...');
        await new Promise((resolve) => setTimeout(resolve, 2000));

        let activated = false;
        let attempts = 0;
        const maxAttempts = 15;

        while (attempts < maxAttempts && !activated) {
          attempts++;
          console.log(`🔄 Tentativo ${attempts}/${maxAttempts} - Verifico attivazione...`);

          const { data } = await supabase
            .from('stores')
            .select('subscription_status')
            .eq('id', storeId)
            .single();

          if (data?.subscription_status === 'active') {
            activated = true;
            break;
          }

          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        if (!activated) {
          console.warn('⚠️ Webhook non ancora arrivato, ma il pagamento è confermato');
        }

        setSuccess(true);
        setLoading(false);

        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      console.error('❌ Errore abbonamento:', err);
      setErrorMsg(err.message || 'Errore imprevisto durante il pagamento');
      setLoading(false);
    }
  };

  // ============================================================
  // SUCCESS STATE
  // ============================================================
  if (success) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Store attivato!</h2>
          <p className="text-sm text-gray-500">L'abbonamento è attivo. Puoi iniziare a operare subito.</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md relative shadow-2xl">

        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          onClick={onClose}
          disabled={loading}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Store className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Attiva il tuo Store</h2>
            <p className="text-xs text-gray-500">{storeName}</p>
          </div>
        </div>

        {/* Riepilogo costi */}
        <div className="space-y-1 text-sm mb-4">
          <div className="flex justify-between text-gray-600">
            <span>Abbonamento mensile</span>
            <span>€{PLAN.priceEur.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>IVA {PLAN.vatPercent}%</span>
            <span>€{PLAN.vatEur.toFixed(2)}</span>
          </div>
          <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-semibold text-gray-900">
            <span>Totale oggi</span>
            <span>€{PLAN.totalEur.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400 pt-1">
            <Calendar className="w-3 h-3" />
            <span>Si rinnova automaticamente ogni mese. Annulla quando vuoi.</span>
          </div>
        </div>

        {/* Card input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dettagli carta
          </label>
          <div className="border border-gray-300 rounded-md p-3">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': { color: '#aab7c4' },
                  },
                  invalid: { color: '#9e2146' },
                },
              }}
            />
          </div>
        </div>

        {errorMsg && (
          <div className="text-red-600 text-sm mb-3 bg-red-50 border border-red-200 rounded-md p-2">
            {errorMsg}
          </div>
        )}

        <button
          className="w-full bg-emerald-600 text-white py-2.5 rounded-md hover:bg-emerald-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2 transition-colors"
          onClick={handleConfirm}
          disabled={loading || !stripe}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Elaborazione...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              Abbonati · €{PLAN.totalEur.toFixed(2)}/mese
            </>
          )}
        </button>

        <p className="text-xs text-gray-400 mt-3 text-center">
          🔒 Pagamento sicuro elaborato da Stripe
        </p>
      </div>
    </div>
  );
};

// ============================================================
// EXPORT WRAPPER (Elements provider)
// ============================================================
export const StoreSubscriptionModal: React.FC<Props> = (props) => {
  if (!props.isOpen) return null;

  return (
    <Elements stripe={stripePromise}>
      <StoreSubscriptionInner {...props} />
    </Elements>
  );
};
