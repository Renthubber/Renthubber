// ============================================================
// RENTHUBBER STORE - Change Password Modal
// Path: store/components/StoreChangePasswordModal.tsx
// ============================================================

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, Shield } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface StoreChangePasswordModalProps {
  storeId: string;
  onSuccess: () => void;
}

// Stessa funzione hash del storeAuth.ts
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '_renthubber_store_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const StoreChangePasswordModal: React.FC<StoreChangePasswordModalProps> = ({ storeId, onSuccess }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordValid = newPassword.length >= 8;
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passwordValid) {
      setError('La password deve avere almeno 8 caratteri');
      return;
    }

    if (!passwordsMatch) {
      setError('Le password non coincidono');
      return;
    }

    setIsSubmitting(true);
    try {
      const password_hash = await hashPassword(newPassword);

      const { error: updateError } = await supabase
        .from('stores')
        .update({
          password_hash,
          must_change_password: false,
        })
        .eq('id', storeId);

      if (updateError) throw updateError;

      // Aggiorna anche il localStorage
      const stored = localStorage.getItem('store_data');
      if (stored) {
        const data = JSON.parse(stored);
        data.password_hash = password_hash;
        data.must_change_password = false;
        localStorage.setItem('store_data', JSON.stringify(data));
      }

      onSuccess();
    } catch (err: any) {
      console.error('Errore cambio password:', err);
      setError('Errore durante il cambio password. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl">
        {/* Header */}
        <div className="p-6 text-center border-b border-gray-100">
          <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Shield className="w-7 h-7 text-amber-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Imposta la tua password</h3>
          <p className="text-sm text-gray-500 mt-1">
            Per sicurezza, scegli una nuova password personale
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Nuova password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nuova password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                placeholder="Minimo 8 caratteri"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPassword.length > 0 && (
              <p className={`text-xs mt-1 ${passwordValid ? 'text-green-600' : 'text-red-500'}`}>
                {passwordValid ? '✓ Password valida' : `Ancora ${8 - newPassword.length} caratteri`}
              </p>
            )}
          </div>

          {/* Conferma password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conferma password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                placeholder="Ripeti la password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <p className={`text-xs mt-1 ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                {passwordsMatch ? '✓ Le password coincidono' : 'Le password non coincidono'}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !passwordValid || !passwordsMatch}
            className="w-full bg-brand text-white font-bold py-3 rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Salvataggio...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Salva password
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
