import React, { useState, useEffect } from 'react';
import { Gift, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface FeeOverrideBannerProps {
  userId: string;
  mode: 'renter' | 'hubber';
  onFeeOverride?: (override: {
    fees_disabled: boolean;
    custom_renter_fee: number | null;
    custom_hubber_fee: number | null;
  }) => void;
}

export const FeeOverrideBanner: React.FC<FeeOverrideBannerProps> = ({ userId, mode, onFeeOverride }) => {
  const [override, setOverride] = useState<{
    fees_disabled: boolean;
    custom_renter_fee: number | null;
    custom_hubber_fee: number | null;
    valid_until: string;
    max_transaction_amount: number | null;
    current_transaction_amount: number;
    days_remaining: number;
    amount_remaining: number | null;
  } | null>(null);

  useEffect(() => {
    const loadOverride = async () => {
      if (!userId) return;
      try {
        const { data } = await supabase.rpc('get_active_fee_override', { p_user_id: userId });
        if (data?.[0]) {
          setOverride(data[0]);
          onFeeOverride?.({
            fees_disabled: data[0].fees_disabled,
            custom_renter_fee: data[0].custom_renter_fee,
            custom_hubber_fee: data[0].custom_hubber_fee,
          });
        }
      } catch (err) {
        console.error('Errore caricamento fee override:', err);
      }
    };
    loadOverride();
  }, [userId]);

  if (!override) return null;

  // Mostra solo se c'è un override per questa modalità
  const hasRenterOverride = override.fees_disabled || override.custom_renter_fee !== null;
  const hasHubberOverride = override.fees_disabled || override.custom_hubber_fee !== null;
  if (mode === 'renter' && !hasRenterOverride) return null;
  if (mode === 'hubber' && !hasHubberOverride) return null;

  const daysLeft = Math.max(0, override.days_remaining);
  const formatCurrency = (n: number) => `€${n.toFixed(2)}`;

  // Descrizione chiara in base alla modalità
  const getDescription = () => {
    if (override.fees_disabled) {
      return 'Le commissioni di servizio sono state azzerate sul tuo account!';
    }
    if (mode === 'renter' && override.custom_renter_fee !== null) {
      return `Hai una promozione attiva: commissione di servizio ridotta al ${override.custom_renter_fee}%.`;
    }
    if (mode === 'hubber' && override.custom_hubber_fee !== null) {
      return `Hai una promozione attiva: commissione di servizio ridotta al ${override.custom_hubber_fee}%.`;
    }
    return 'Hai una promozione attiva sulle commissioni!';
  };

  // Titolo
  const getTitle = () => {
    if (override.fees_disabled) return '🎉 Commissioni azzerate!';
    return '🎁 Promozione commissioni ridotte';
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-4">
      {/* Titolo + Descrizione */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Gift className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h4 className="font-bold text-green-800 text-sm">{getTitle()}</h4>
          <p className="text-xs text-green-700 mt-0.5">{getDescription()}</p>
        </div>
      </div>

      {/* Info scadenza e tetto */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-green-700 bg-white/60 rounded-lg p-2.5">
        {/* Scadenza */}
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-green-600" />
          <span>
            {daysLeft > 1
              ? `Valida ancora per ${daysLeft} giorni`
              : daysLeft === 1
              ? 'Scade domani!'
              : 'Ultimo giorno!'}
          </span>
        </div>

        {/* Tetto transazioni */}
        {override.max_transaction_amount && override.amount_remaining !== null && (
          <>
            <div className="w-px h-4 bg-green-300" />
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-green-600" />
              <span>
                Utilizzabile su transazioni fino a {formatCurrency(override.max_transaction_amount)} (
                {formatCurrency(override.amount_remaining)} rimanenti)
              </span>
            </div>
          </>
        )}
      </div>

      {/* Progress bar tetto */}
      {override.max_transaction_amount && (
        <div className="mt-2.5">
          <div className="flex justify-between text-[10px] text-green-600 mb-1">
            <span>Utilizzato: {formatCurrency(override.current_transaction_amount)}</span>
            <span>Tetto: {formatCurrency(override.max_transaction_amount)}</span>
          </div>
          <div className="w-full bg-green-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{
                width: `${Math.min(
                  100,
                  (override.current_transaction_amount / override.max_transaction_amount) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};