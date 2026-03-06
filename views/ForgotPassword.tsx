import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface ForgotPasswordProps {
  onBackToLogin?: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setEmailSent(true);
    } catch (error: any) {
      setError(error.message || 'Errore durante l\'invio dell\'email');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Header Logo */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand to-brand-light flex items-center justify-center mr-3">
                <span className="text-white font-bold text-2xl">R</span>
              </div>
              <span className="font-bold text-3xl tracking-tight text-brand">Renthubber</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Email Inviata!
              </h2>
              <p className="text-gray-600 mb-6">
                Abbiamo inviato un link per reimpostare la password a{' '}
                <span className="font-semibold">{email}</span>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Controlla la tua casella di posta e clicca sul link per reimpostare la password.
                Il link è valido per 1 ora.
              </p>
              <button
                onClick={onBackToLogin}
                className="inline-flex items-center justify-center w-full px-6 py-3 bg-brand hover:bg-brand-dark text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Torna al Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Header Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand to-brand-light flex items-center justify-center mr-3">
              <span className="text-white font-bold text-2xl">R</span>
            </div>
            <span className="font-bold text-3xl tracking-tight text-brand">Renthubber</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <Mail className="w-12 h-12 text-brand mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Password Dimenticata?
            </h2>
            <p className="text-gray-600">
              Inserisci la tua email e ti invieremo un link per reimpostare la password
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tua@email.com"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-brand hover:bg-brand-dark text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Invio in corso...' : 'Invia Link di Reset'}
            </button>

            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full flex items-center justify-center text-gray-600 hover:text-brand transition-colors py-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna al Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};