import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';

interface ModifyStripeFormProps {
  clientSecret: string;
  bookingId: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const ModifyStripeForm: React.FC<ModifyStripeFormProps> = ({
  clientSecret,
  bookingId,
  amount,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?tab=bookings`,
        },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message || 'Errore durante il pagamento');
      } else {
        onSuccess();
      }
    } catch (err: any) {
      onError(err.message || 'Errore imprevisto');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Elaborazione...
          </>
        ) : (
          `Paga €${amount.toFixed(2)}`
        )}
      </button>
    </form>
  );
};