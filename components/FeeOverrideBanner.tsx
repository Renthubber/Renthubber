import React, { useState, useEffect } from 'react';
import { Gift, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface FeeOverrideBannerProps {
  userId: string;
  onFeeOverride?: (override: {
    fees_disabled: boolean;
    custom_renter_fee: number | null;
    custom_hubber_fee: number | null;
  }) => void;
}

export const FeeOverrideBanner: React.FC<FeeOverrideBannerProps> = ({ userId, onFeeOverride }) => {
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

  const daysLeft = Math.max(0, override.days_remaining);
  const formatCurrency = (n: number) => `€${n.toFixed(2)}`;

  const feeLabel = override.fees_disabled
    ? 'Commissioni azzerate'
    : override.custom_renter_fee !== null
    ? `Commissione ridotta al ${override.custom_renter_fee}%`
    : 'Promozione attiva';

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Gift className="w-5 h-5 text-green-600" />
        <span className="font-bold text-green-800 text-sm">{feeLabel}</span>
      </div>

      <div className="flex items-center gap-4 text-xs text-green-700">
        {/* Scadenza */}
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {daysLeft > 0 ? `${daysLeft} giorni rimanenti` : 'Ultimo giorno!'}
          </span>
        </div>

        {/* Tetto transazioni */}
        {override.max_transaction_amount && override.amount_remaining !== null && (
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>
              {formatCurrency(override.amount_remaining)} rimanenti su {formatCurrency(override.max_transaction_amount)}
            </span>
          </div>
        )}
      </div>

      {/* Progress bar tetto */}
      {override.max_transaction_amount && (
        <div className="w-full bg-green-200 rounded-full h-1.5 mt-2">
          <div
            className="bg-green-600 h-1.5 rounded-full transition-all"
            style={{
              width: `${Math.min(
                100,
                (override.current_transaction_amount / override.max_transaction_amount) * 100
              )}%`,
            }}
          />
        </div>
      )}
    </div>
  );
};