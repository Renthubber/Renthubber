import React, { useState, useRef } from 'react';
import { User } from '../../../types';
import { BillingDataSection } from '../../BillingDataSection';

type UserTypeOption = 'privato' | 'ditta_individuale' | 'societa' | 'associazione';

interface Preferences {
  language: 'it' | 'en';
  emailNotifications: boolean;
  profilePrivacy: 'standard' | 'private' | 'public';
}

interface ProfileSectionProps {
  user: User;
  profileData: any;
  avatarPreview: string | null;
  preferences: Preferences;
  avatarInputRef: React.RefObject<HTMLInputElement>;
  onAvatarClick: () => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenProfileModal: () => void;
  onPreferencesChange: (prefs: Preferences) => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  user,
  profileData,
  avatarPreview,
  preferences,
  avatarInputRef,
  onAvatarClick,
  onAvatarChange,
  onOpenProfileModal,
  onPreferencesChange,
}) => {
  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300 pb-20 md:pb-0">
      
      {/* CARD PROFILO PRINCIPALE */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6">
        {/* AVATAR + UPLOAD */}
        <div className="flex-shrink-0 mx-auto md:mx-0">
          <div
            className="relative w-24 h-24 rounded-full overflow-hidden bg-brand text-white flex items-center justify-center text-2xl font-bold cursor-pointer group"
            onClick={onAvatarClick}
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={profileData.firstName || user.email}
                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
              />
            ) : (
              <>
                {(
                  profileData.firstName ||
                  user.name ||
                  user.email ||
                  'U'
                )
                  .charAt(0)
                  .toUpperCase()}
              </>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-semibold transition-opacity">
              Cambia foto
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={avatarInputRef}
            onChange={onAvatarChange}
          />
        </div>

        {/* INFO PROFILO */}
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center md:text-left mb-2">
            {profileData.firstName || profileData.lastName
              ? `${profileData.firstName} ${profileData.lastName}`.trim()
              : 'Nuovo utente Renthubber'}
          </h2>

          <div className="flex flex-wrap items-center gap-2 mb-2 justify-center md:justify-start">
            {user.isSuperHubber && (
              <span className="px-2 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700">
                SuperHubber
              </span>
            )}

            {user.status && (
              <span
                className={`px-2 py-1 text-xs font-bold rounded-full text-center ${
                  user.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {user.status === 'active' ? 'Account attivo' : user.status}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Gestisci le informazioni principali del tuo profilo Renthubber.
            Questi dati sono visibili agli altri utenti quando interagiscono con
            te.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs uppercase font-semibold mb-1">
                Nome
              </p>
              <p className="font-medium text-gray-800">
                {profileData.firstName || '—'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase font-semibold mb-1">
                Cognome
              </p>
              <p className="font-medium text-gray-800">
                {profileData.lastName || '—'}
              </p>
            </div>

            <div>
              <p className="text-gray-400 text-xs uppercase font-semibold mb-1">
                Email
              </p>
              <p className="font-medium text-gray-800">{profileData.email}</p>
            </div>

            <div>
              <p className="text-gray-400 text-xs uppercase font-semibold mb-1">
                Ruolo
              </p>
              <p className="font-medium text-gray-800">
                {user.roles && user.roles.length
                  ? user.roles.join(' · ')
                  : (user as any).role || 'Renter'}
              </p>
            </div>

            <div>
              <p className="text-gray-400 text-xs uppercase font-semibold mb-1">
                Valutazione
              </p>
              <p className="font-medium text-gray-800">
                {typeof user.rating === 'number' && user.rating > 0
                  ? `${user.rating.toFixed(1)} / 5`
                  : 'Nessuna recensione'}
              </p>
            </div>

            <div>
              <p className="text-gray-400 text-xs uppercase font-semibold mb-1">
                Telefono
              </p>
              <p className="font-medium text-gray-800">
                {profileData.phoneNumber || 'Non inserito'}
              </p>
            </div>

            <div>
              <p className="text-gray-400 text-xs uppercase font-semibold mb-1">
                Tipo utente
              </p>
              <p className="font-medium text-gray-800">
                {profileData.userType === 'privato' && 'Privato'}
                {profileData.userType === 'ditta_individuale' &&
                  'Ditta individuale'}
                {profileData.userType === 'societa' && 'Società'}
                {profileData.userType === 'associazione' && 'Associazione'}
              </p>
            </div>

            <div>
              <p className="text-gray-400 text-xs uppercase font-semibold mb-1">
                Data di nascita
              </p>
              <p className="font-medium text-gray-800">
                {profileData.dateOfBirth || 'Non impostata'}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={onOpenProfileModal}
              className="w-full md:w-auto px-4 py-2 rounded-lg border border-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              Modifica dati profilo
            </button>
          </div>
        </div>
      </div>

       {/* DATI DI FATTURAZIONE */}
      <BillingDataSection user={user} userType={profileData.userType} />

      {/* PREFERENZE ACCOUNT */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-2">Preferenze account</h3>
        <p className="text-sm text-gray-500 mb-4">
          Gestisci alcune impostazioni di base del tuo account Renthubber.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          {/* Lingua */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">
              Lingua
            </p>
            <select
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand bg-white"
              value={preferences.language}
              onChange={(e) =>
                onPreferencesChange({
                  ...preferences,
                  language: e.target.value as 'it' | 'en',
                })
              }
            >
              <option value="it">Italiano</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Notifiche email */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">
              Notifiche email
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-medium text-gray-800">
                {preferences.emailNotifications ? 'Attive' : 'Disattive'}
              </span>
              <button
                type="button"
                onClick={() =>
                  onPreferencesChange({
                    ...preferences,
                    emailNotifications: !preferences.emailNotifications,
                  })
                }
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  preferences.emailNotifications
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {preferences.emailNotifications ? 'Disattiva' : 'Attiva'}
              </button>
            </div>
          </div>

          {/* Privacy profilo */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">
              Privacy profilo
            </p>
            <select
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand bg-white"
              value={preferences.profilePrivacy}
              onChange={(e) =>
                onPreferencesChange({
                  ...preferences,
                  profilePrivacy: e.target.value as
                    | 'standard'
                    | 'private'
                    | 'public',
                })
              }
            >
              <option value="standard">Standard</option>
              <option value="private">Profilo più riservato</option>
              <option value="public">Maggiore visibilità</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};