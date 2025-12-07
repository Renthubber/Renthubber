import React from "react";
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
                  className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
                    isActive ? "text-brand" : "text-gray-500"
                  }`}
                >
                  <Icon className={`w-6 h-6 mb-1 ${isActive ? "stroke-2" : ""}`} />
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
