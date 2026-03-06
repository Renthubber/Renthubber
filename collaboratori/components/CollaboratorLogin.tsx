// ============================================================
// RENTHUBBER - MODULO COLLABORATORI - Login
// Path: collaboratori/components/CollaboratorLogin.tsx
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Mail, Eye, EyeOff, Loader2, Lock, UserPlus } from 'lucide-react';
import { useCollaboratorAuth } from '../context/CollaboratorAuthContext';

export const CollaboratorLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useCollaboratorAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Inserisci email e password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      await login(email, password);
      navigate('/collaboratori/dashboard');
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'Login fallito. Controlla le credenziali.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center">
            <img 
              src="/R-logo.png" 
              alt="Renthubber Logo" 
              className="w-16 h-16"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Area Collaboratori</h1>
          <p className="text-gray-500 text-sm mt-2">
            Accedi alla tua dashboard per gestire lead e monitorare i guadagni.
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center border border-red-200">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400 pointer-events-none">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
                  placeholder="la.tua@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400 pointer-events-none">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
                  placeholder="La tua password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                  aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center disabled:opacity-70"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Accesso in corso...
                </span>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" /> Accedi
                </>
              )}
            </button>
          </form>

          {/* Link registrazione */}
          <div className="text-center mt-6 text-sm text-gray-500">
            Non sei ancora collaboratore?
            <button
              type="button"
              onClick={() => navigate('/collaboratori/registrazione')}
              className="ml-1 font-bold text-brand hover:underline inline-flex items-center"
            >
              <UserPlus className="w-3 h-3 mr-1" /> Candidati ora
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Questa area è riservata ai collaboratori commerciali RentHubber.
          <br />
          Se sei un utente, <a href="/signup" className="text-brand hover:underline">accedi qui</a>.
        </p>
      </div>
    </div>
  );
};
