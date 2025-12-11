import React, { useState, useEffect } from "react";
import { 
  Home, 
  PlusCircle, 
  MessageSquare, 
  Wallet, 
  User,
  LayoutDashboard
} from "lucide-react";
import { User as UserType, ActiveMode } from "../types";

interface BottomNavBarProps {
  setView: (view: string) => void;
  currentView: string;
  currentUser: UserType | null;
  activeMode: ActiveMode;
  onSwitchMode: (mode: ActiveMode) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  setView,
  currentView,
  currentUser,
  activeMode,
  onSwitchMode,
}) => {
  const isHubber = currentUser?.roles?.includes("hubber") || currentUser?.role === "hubber";
  const [unreadCount, setUnreadCount] = useState(0);

  // 🔔 Carica conteggio messaggi non letti
  useEffect(() => {
    if (!currentUser) return;

    const loadUnreadCount = async () => {
      try {
        const { supabase } = await import('../lib/supabase');
        
        const field = activeMode === 'renter' ? 'unread_for_renter' : 'unread_for_hubber';
        const userField = activeMode === 'renter' ? 'renter_id' : 'hubber_id';
        
        const { data, error } = await supabase
          .from('conversations')
          .select('id')
          .eq(userField, currentUser.id)
          .eq(field, true);

        if (!error && data) {
          // Se sei nella sezione messaggi, azzera il badge
          if (currentView === 'messages') {
            setUnreadCount(0);
          } else {
            setUnreadCount(data.length);
            console.log('🔔 Mobile - Messaggi non letti:', data.length);
          }
        }
      } catch (err) {
        console.error('Errore caricamento messaggi non letti mobile:', err);
      }
    };

    loadUnreadCount();

    // 🔔 Ascolta evento per aggiornamento immediato
    window.addEventListener('unread-changed', loadUnreadCount);

    const interval = setInterval(loadUnreadCount, 30000);
    
    return () => {
      window.removeEventListener('unread-changed', loadUnreadCount);
      clearInterval(interval);
    };
  }, [currentUser, activeMode, currentView]);

  // Non mostrare la bottom nav se l'utente non è loggato
  if (!currentUser) return null;

  const navItems = [
    {
      id: "home",
      icon: Home,
      label: "Home",
      view: "home",
      show: true,
    },
    {
      id: "dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      view: "dashboard",
      show: true,
    },
    {
      id: "publish",
      icon: PlusCircle,
      label: "Pubblica",
      view: "publish",
      show: isHubber && activeMode === "hubber",
    },
    {
      id: "messages",
      icon: MessageSquare,
      label: "Messaggi",
      view: "messages",
      show: true,
    },
    {
      id: "wallet",
      icon: Wallet,
      label: "Wallet",
      view: "wallet",
      show: true,
    },
  ];

  return (
    <>
      {/* Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.view;

              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.view)}
                  className={`flex flex-col items-center justify-center flex-1 h-full transition-all relative ${
                    isActive ? "text-brand" : "text-gray-500"
                  }`}
                >
                  <div className="relative">
                    <Icon className={`w-6 h-6 mb-1 ${isActive ? "stroke-2" : ""}`} />
                    {item.id === "messages" && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-2 bg-brand text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
        </div>
      </nav>

      {/* Spacer per evitare che il contenuto venga coperto dalla bottom nav */}
      <div className="md:hidden h-16" />
    </>
  );
};