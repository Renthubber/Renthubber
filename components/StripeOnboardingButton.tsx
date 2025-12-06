import React, { useState } from 'react';
import { ExternalLink, Loader } from 'lucide-react';
import stripeService from '../services/stripeService';

interface StripeOnboardingButtonProps {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Bottone per avviare onboarding Stripe Connect
 * 
 * Uso in BecomeHubberWizard o Dashboard
 */
export const StripeOnboardingButton: React.FC<StripeOnboardingButtonProps> = ({
  userId,
  email,
  firstName,
  lastName,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);

  const handleStartOnboarding = async () => {
    setLoading(true);

    try {
      console.log('🚀 Starting Stripe Connect onboarding...');

      const result = await stripeService.createConnectAccount(
        userId,
        email,
        firstName,
        lastName
      );

      console.log('✅ Onboarding URL received:', result.onboardingUrl);

      // Redirect a Stripe per completare onboarding
      // NON chiamare onSuccess qui - viene eseguito il redirect
      window.location.href = result.onboardingUrl;
      
      // onSuccess verrà gestito al ritorno da Stripe tramite webhook
    } catch (error: any) {
      console.error('❌ Onboarding error:', error);
      alert(`Errore: ${error.message}`);

      if (onError) {
        onError(error.message);
      }

      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleStartOnboarding}
      disabled={loading}
      className="flex items-center gap-2 px-6 py-3 bg-[#0d4a5f] text-white rounded-lg hover:bg-[#0a3a4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <Loader className="w-5 h-5 animate-spin" />
          <span>Connessione a Stripe...</span>
        </>
      ) : (
        <>
          <ExternalLink className="w-5 h-5" />
          <span>Configura Pagamenti</span>
        </>
      )}
    </button>
  );
};

export default StripeOnboardingButton;