import React from 'react';
import { AlertCircle, CheckCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { StripeOnboardingButton } from './StripeOnboardingButton';

interface StripeStatusBannerProps {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  stripeAccountId?: string;
  stripeOnboardingCompleted?: boolean;
  stripeChargesEnabled?: boolean;
  stripePayoutsEnabled?: boolean;
  onRefresh?: () => void;
}

/**
 * Banner che mostra lo stato dell'account Stripe Connect
 * 
 * 3 Stati possibili:
 * 1. Non configurato (mostra bottone onboarding)
 * 2. In corso verifica (mostra link per completare)
 * 3. Attivo (nessun banner, tutto OK)
 */
export const StripeStatusBanner: React.FC<StripeStatusBannerProps> = ({
  userId,
  email,
  firstName,
  lastName,
  stripeAccountId,
  stripeOnboardingCompleted,
  stripeChargesEnabled,
  stripePayoutsEnabled,
  onRefresh,
}) => {
  // Stato 3: ATTIVO ✅
  if (stripeAccountId && stripeChargesEnabled && stripePayoutsEnabled) {
    return null; // Nessun banner, tutto OK!
  }

  // Stato 1: NON CONFIGURATO ⚠️
  if (!stripeAccountId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              Configura Pagamenti Stripe
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Per ricevere pagamenti dai tuoi clienti devi collegare il tuo conto corrente tramite Stripe.
              Il processo richiede solo 5 minuti.
            </p>
            <StripeOnboardingButton
              userId={userId}
              email={email}
              firstName={firstName}
              lastName={lastName}
              onSuccess={onRefresh}
            />
          </div>
        </div>
      </div>
    );
  }

  // Stato 2: IN CORSO VERIFICA 🔄
  if (!stripeOnboardingCompleted || !stripeChargesEnabled || !stripePayoutsEnabled) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <RefreshCw className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              Completa Verifica Stripe
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Il tuo account Stripe è in fase di verifica. Completa tutti i passaggi richiesti per iniziare a ricevere pagamenti.
            </p>
            <div className="flex items-center gap-3">
              <StripeOnboardingButton
                userId={userId}
                email={email}
                firstName={firstName}
                lastName={lastName}
                onSuccess={onRefresh}
              />
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Aggiorna Stato</span>
                </button>
              )}
            </div>
            
            {/* Status details */}
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                {stripeOnboardingCompleted ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                )}
                <span className={stripeOnboardingCompleted ? 'text-gray-900' : 'text-gray-500'}>
                  Onboarding completato
                </span>
              </div>
              <div className="flex items-center gap-2">
                {stripeChargesEnabled ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                )}
                <span className={stripeChargesEnabled ? 'text-gray-900' : 'text-gray-500'}>
                  Pagamenti abilitati
                </span>
              </div>
              <div className="flex items-center gap-2">
                {stripePayoutsEnabled ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                )}
                <span className={stripePayoutsEnabled ? 'text-gray-900' : 'text-gray-500'}>
                  Prelievi abilitati
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default StripeStatusBanner;