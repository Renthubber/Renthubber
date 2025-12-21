import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useAdminNotifications } from '../../hooks/useAdminNotifications';

interface AdminNotificationBellProps {
  onNavigate: (tab: string) => void;
}

export const AdminNotificationBell: React.FC<AdminNotificationBellProps> = ({ onNavigate }) => {
  const { notifications, totalCount, loading, lastUpdate } = useAdminNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Chiudi dropdown quando clicchi fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (tab: string) => {
    onNavigate(tab);
    setIsOpen(false);
  };

  const formatLastUpdate = () => {
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
    
    if (diffSeconds < 60) return 'Aggiornato ora';
    if (diffSeconds < 120) return 'Aggiornato 1 minuto fa';
    const minutes = Math.floor(diffSeconds / 60);
    return `Aggiornato ${minutes} minuti fa`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        
        {/* Badge con contatore */}
        {totalCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-brand to-brand-dark">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifiche Admin
              </h3>
              {totalCount > 0 && (
                <span className="px-3 py-1 bg-white/20 text-white rounded-full text-sm font-bold">
                  {totalCount}
                </span>
              )}
            </div>
            <p className="text-xs text-white/80 mt-1">{formatLastUpdate()}</p>
          </div>

          {/* Notifiche */}
          <div className="max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full mx-auto mb-3"></div>
                Caricamento...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">✅</span>
                </div>
                <p className="text-gray-600 font-medium">Tutto a posto!</p>
                <p className="text-sm text-gray-400 mt-1">Non ci sono elementi da gestire</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notif, index) => (
                  <button
                    key={index}
                    onClick={() => handleNotificationClick(notif.tab)}
                    className="w-full p-4 hover:bg-gray-50 transition-colors text-left flex items-center gap-3 group"
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg ${notif.color} flex items-center justify-center flex-shrink-0 text-xl`}>
                      {notif.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900 text-sm group-hover:text-brand transition-colors">
                          {notif.label}
                        </p>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${notif.color} flex-shrink-0`}>
                          {notif.count}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Clicca per gestire →
                      </p>
                    </div>

                    {/* Priority indicator */}
                    {notif.priority === 'critical' && (
                      <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse flex-shrink-0"></div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
              <p className="text-xs text-gray-500">
                Aggiornamento automatico ogni 10 secondi
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};