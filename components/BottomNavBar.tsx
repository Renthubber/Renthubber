import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  currentUser: UserType | null;
  activeMode: ActiveMode;
  onSwitchMode: (mode: ActiveMode) => void;
  onPublish?: () => void;
  unreadCount?: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentUser,
  activeMode,
  onSwitchMode,
  onPublish,
  unreadCount = 0,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentView = location.pathname;

  const isHubber = currentUser?.roles?.includes("hubber") || currentUser?.role === "hubber";
 const [localUnreadCount, setLocalUnreadCount] = useState(0);

// ✅ Azzera badge se sei nella sezione messaggi
useEffect(() => {
  if (currentView === '/messages') {
    setLocalUnreadCount(0);  // ← CAMBIA QUI
  } else {
    setLocalUnreadCount(unreadCount || 0);  // ← CAMBIA QUI
  }
}, [unreadCount, currentView]);

  // ✅ Determina il path corretto per la dashboard in base al ruolo
  const isAdmin = currentUser?.role === 'admin' || currentUser?.roles?.includes('admin');
  const dashboardPath = isAdmin ? "/admin" : "/dashboard";

  // Non mostrare la bottom nav se l'utente non è loggato o è admin
  if (!currentUser || isAdmin) return null;

  const navItems = [
    {
      id: "home",
      icon: Home,
      label: "Home",
      path: "/",
      show: true,
    },
    {
      id: "dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      path: dashboardPath,
      show: true,
    },
    {
      id: "publish",
      icon: PlusCircle,
      label: "Pubblica",
      path: "/publish",
      show: isHubber && activeMode === "hubber" && !isAdmin,
    },
    {
      id: "messages",
      icon: MessageSquare,
      label: "Messaggi",
      path: "/messages",
      show: true,
    },
    {
      id: "wallet",
      icon: Wallet,
      label: "Wallet",
      path: "/wallet",
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
              // ✅ Per dashboard, considera attivo sia /dashboard che /admin
              const isActive = item.id === "dashboard" 
                ? (currentView === "/dashboard" || currentView === "/admin")
                : currentView === item.path;

              return (
  <button
    key={item.id}
    onClick={() => {
      if (item.id === "publish" && onPublish) {
        onPublish();
      } else {
        navigate(item.path);
      }
    }}
    className={`flex flex-col items-center justify-center flex-1 h-full transition-all relative ${
      isActive ? "text-brand" : "text-gray-500"
    }`}
                >
                  <div className="relative">
  <Icon className={`w-6 h-6 mb-1 ${isActive ? "stroke-2" : ""}`} />
  {item.id === "messages" && localUnreadCount > 0 && (
    <span className="absolute -top-1 -right-2 bg-brand text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
      {localUnreadCount > 9 ? '9+' : localUnreadCount}
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
