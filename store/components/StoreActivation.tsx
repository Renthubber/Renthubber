// ============================================================
// RENTHUBBER STORE - Pagamento Quota Iscrizione
// Path: store/components/StoreActivation.tsx
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CheckCircle, Loader2, Shield, Store as StoreIcon } from 'lucide-react';
import { useStoreAuth } from '../context/StoreAuthContext';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const ACTIVATION = {
  netEur: 25.00,
  vatPercent: 22,
  vatEur: 5.50,
  totalEur: 30.50,
};

// ============================================================
// FORM INTERNO
// ============================================================
const ActivationForm: React.FC<{ storeId: string; storeName: string }> = ({ storeId, storeName }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { refreshStore } = useStoreAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    setError('');

    try {
      // 1. Crea PaymentIntent
      const res = await fetch('/.netlify/functions/create-store-activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId }),
      });

      const data = await res.json();
      if (!res.ok || !data.clientSecret) {
        throw new Error(data.error || 'Errore nella creazione del pagamento');
      }

      // 2. Conferma pagamento
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card: cardElement },
      });

      if (stripeError) throw new Error(stripeError.message);

      if (paymentIntent?.status === 'succeeded') {
        // 3. Polling per conferma attivazione
        // Polling diretto su Supabase per verificare attivazione
        let activated = false;
        for (let i = 0; i < 15; i++) {
          await new Promise(r => setTimeout(r, 1000));
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/stores?id=eq.${storeId}&select=activated_at`,
            {
              headers: {
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
              },
            }
          );
          const data = await res.json();
          if (data[0]?.activated_at) {
            activated = true;
            break;
          }
        }

        await refreshStore();
        setSuccess(true);
        setTimeout(() => navigate('/store/dashboard'), 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Errore durante il pagamento');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Store Attivato!</h3>
        <p className="text-gray-500 text-sm">Stai per essere reindirizzato alla dashboard...</p>
        <Loader2 className="w-5 h-5 animate-spin text-brand mx-auto mt-4" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Riepilogo costi */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Quota iscrizione</span>
          <span>€{ACTIVATION.netEur.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>IVA {ACTIVATION.vatPercent}%</span>
          <span>€{ACTIVATION.vatEur.toFixed(2)}</span>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900">
          <span>Totale</span>
          <span>€{ACTIVATION.totalEur.toFixed(2)}</span>
        </div>
      </div>

      {/* Card Element */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Dati carta</label>
        <div className="border border-gray-300 rounded-xl px-4 py-3 bg-white">
          <CardElement options={{
            style: {
              base: { fontSize: '16px', color: '#374151', '::placeholder': { color: '#9CA3AF' } },
              invalid: { color: '#EF4444' },
            },
          }} />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !stripe}
        className="w-full bg-brand text-white py-3 rounded-xl font-semibold hover:bg-brand-dark disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Elaborazione...</>
        ) : (
          <><Shield className="w-4 h-4" /> Paga €{ACTIVATION.totalEur.toFixed(2)} e Attiva</>
        )}
      </button>

      <p className="text-xs text-center text-gray-400">
        Pagamento sicuro tramite Stripe · Una tantum, non ricorrente
      </p>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export const StoreActivation: React.FC = () => {
  const { store, loading } = useStoreAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!store) {
    navigate('/store/login');
    return null;
  }

  // Se già attivato, vai alla dashboard
  if (store.activated_at) {
    navigate('/store/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <StoreIcon className="w-7 h-7 text-brand" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Attiva il tuo Store</h1>
          <p className="text-gray-500 text-sm mt-2">
            Benvenuto <strong>{store.business_name}</strong>! Per iniziare a operare è richiesta una quota di iscrizione una tantum.
          </p>
        </div>

        {/* Cosa include */}
        <div className="bg-brand/5 rounded-xl p-4 mb-6 space-y-2">
          {[
            'Accesso completo alla dashboard store',
            'Gestione inventario e operazioni QR',
            'Welcome Pack: primi 100 ritiri gratuiti',
            'Supporto dedicato RentHubber',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-brand flex-shrink-0" />
              <span className="text-sm text-gray-700">{item}</span>
            </div>
          ))}
        </div>

        {/* Form pagamento */}
        <Elements stripe={stripePromise}>
          <ActivationForm storeId={store.id} storeName={store.business_name} />
        </Elements>
      </div>
    </div>
  );
};
