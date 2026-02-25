import React, { useState, useEffect } from 'react';
import { DollarSign, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from "../services/supabaseClient";

interface PayoutRequestButtonProps {
  userId: string;
  hubberBalance: number;
  stripeAccountId?: string;
  stripePayoutsEnabled?: boolean;
  iban?: string; // IBAN già configurato da bankDetails
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onConfigureIban?: () => void; // Callback per aprire Impostazioni Fiscali
}

/**
 * Bottone per richiedere payout (Hubber)
 * 
 * Uso in Dashboard Hubber - Wallet section
 */
export const PayoutRequestButton: React.FC<PayoutRequestButtonProps> = ({
  userId,
  hubberBalance,
  stripeAccountId,
  stripePayoutsEnabled,
  iban,
  onSuccess,
  onError,
  onConfigureIban,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [minAmount, setMinAmount] = useState(50);

useEffect(() => {
  const fetchMinAmount = async () => {
    const { data } = await supabase
      .from('cms_settings')
      .select('value')
      .eq('type', 'finance_settings')
      .maybeSingle();
    
   if (data?.value?.minPayoutAmount !== undefined) {
      setMinAmount(data.value.minPayoutAmount);
    }
  };
  fetchMinAmount();
}, []);
  const maxAmount = hubberBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const requestedAmount = parseFloat(amount);

    // Validazione
    if (isNaN(requestedAmount) || requestedAmount < minAmount) {
      alert(`Importo minimo: €${minAmount}`);
      return;
    }

    if (requestedAmount > maxAmount) {
      alert(`Saldo insufficiente. Disponibile: €${maxAmount.toFixed(2)}`);
      return;
    }

    if (!iban || iban.length < 15) {
      alert('IBAN non configurato. Vai in Impostazioni Fiscali.');
      return;
    }

    // Verifica Stripe Connect Account
    if (!stripeAccountId) {
      alert('Devi prima configurare i pagamenti Stripe');
      return;
    }

    if (!stripePayoutsEnabled) {
      alert('Il tuo account Stripe non è ancora completamente attivato. Completa la verifica.');
      return;
    }

    setLoading(true);

    try {
      console.log('💰 Creating payout request:', {
        userId,
        amount: requestedAmount,
        iban,
      });

      // Verifica dispute aperte
      const { data: disputes, error: disputeError } = await supabase
        .from('disputes')
        .select('id')
        .eq('against_user_id', userId)
        .eq('status', 'open');

      if (disputeError) {
        throw new Error('Errore verifica dispute');
      }

      if (disputes && disputes.length > 0) {
        throw new Error(
          `Hai ${disputes.length} contestazioni aperte. Non puoi richiedere bonifici finché non vengono risolte.`
        );
      }

      // Crea richiesta payout
      const { data, error } = await supabase
        .from('payout_requests')
        .insert({
          user_id: userId,
          amount: requestedAmount,
          iban: iban.toUpperCase().replace(/\s/g, ''),
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Errore creazione richiesta');
      }

      setSuccess(true);

      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
        setAmount('');

        if (onSuccess) {
          onSuccess();
        }
      }, 2000);
    } catch (err: any) {
      console.error('❌ Payout request error:', err);
      alert(`Errore: ${err.message}`);

      if (onError) {
        onError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Bottone principale */}
      <button
        onClick={() => setShowModal(true)}
        disabled={hubberBalance < minAmount || !stripeAccountId}
        className="flex items-center gap-2 px-4 py-2 bg-[#0d4a5f] text-white rounded-lg hover:bg-[#0a3a4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <DollarSign className="w-5 h-5" />
        <span>Richiedi Bonifico</span>
      </button>

      {/* Messaggio se non può richiedere */}
      {hubberBalance < minAmount && (
        <p className="text-xs text-gray-500 mt-2">
          Importo minimo: €{minAmount}
        </p>
      )}

      {!stripeAccountId && (
        <p className="text-xs text-red-500 mt-2">
          Configura prima i pagamenti Stripe
        </p>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-bold text-xl text-gray-900">
                Richiedi Bonifico
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Disponibile: €{hubberBalance.toFixed(2)}
              </p>
            </div>

            {/* Body */}
            <div className="p-6">
              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Richiesta inviata!
                  </h4>
                  <p className="text-sm text-gray-600">
                    Il team verificherà la tua richiesta
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-800">
                      <p className="font-semibold mb-1">Note importanti:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Importo minimo: €{minAmount}</li>
                        <li>La richiesta sarà verificata dal team</li>
                        <li>Tempo di elaborazione: 2-5 giorni lavorativi</li>
                        <li>Non puoi avere contestazioni aperte</li>
                      </ul>
                    </div>
                  </div>

                  {/* Importo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Importo da prelevare
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        €
                      </span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        step="0.01"
                        min={minAmount}
                        max={maxAmount}
                        required
                        placeholder={`Min ${minAmount}`}
                        className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0d4a5f] focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Max: €{maxAmount.toFixed(2)}
                    </p>
                  </div>

                  {/* IBAN Display */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IBAN di destinazione
                    </label>
                    {iban ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm text-gray-900">
                            {iban.replace(/(.{4})/g, '$1 ').trim()}
                          </span>
                          {onConfigureIban && (
                            <button
                              type="button"
                              onClick={onConfigureIban}
                              className="text-xs text-[#0d4a5f] hover:underline"
                            >
                              Cambia
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800 mb-2">
                          IBAN non configurato
                        </p>
                        {onConfigureIban && (
                          <button
                            type="button"
                            onClick={onConfigureIban}
                            className="text-sm text-[#0d4a5f] hover:underline font-medium"
                          >
                            Configura IBAN in Impostazioni Fiscali
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      disabled={loading}
                      className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-[#0d4a5f] text-white rounded-lg hover:bg-[#0a3a4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          <span>Invio...</span>
                        </>
                      ) : (
                        'Richiedi'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PayoutRequestButton;