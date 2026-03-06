// ============================================================
// RENTHUBBER STORE - Login Page
// Path: store/components/StoreLogin.tsx
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoreAuth } from '../context/StoreAuthContext';
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export const StoreLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading } = useStoreAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Se già autenticato, redirect alla dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/store/dashboard');
    }
  }, [loading, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Inserisci email e password');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/store/dashboard');
    } catch (err: any) {
      setError(err.message || 'Errore durante il login');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-dark to-brand flex flex-col">
      {/* Header */}
      <div className="p-4">
        <button
          onClick={() => navigate('/store')}
          className="flex items-center text-white/70 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Torna alla pagina Store
        </button>
      </div>

      {/* Login Card */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-sm">
          {/* Logo / Badge */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center mx-auto mb-4 p-3">
              <img
                src="https://upyznglekmynztmydtxi.supabase.co/storage/v1/object/public/images/renthubberStoreAutorizzato.webp"
                alt="Renthubber Store"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">Area Store</h1>
            <p className="text-gray-500 text-sm mt-1">Accedi alla tua dashboard</p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                    placeholder="email@tuostore.it"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand text-white font-bold py-3 rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Accesso in corso...
                  </>
                ) : (
                  'Accedi'
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400">
                Non hai ancora uno store?{' '}
                <a href="/store" className="text-brand hover:underline font-medium">
                  Candidati qui
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
