import React, { useState, useRef, useEffect } from "react";
import { Menu, PlusCircle, MessageSquare, Wallet, LogOut, LayoutDashboard } from "lucide-react";
import { User, ActiveMode } from "../types";

interface HeaderProps {
  setView: (view: string) => void;
  currentView: string;
  currentUser: User | null;
  activeMode: ActiveMode;
  onSwitchMode: (mode: ActiveMode) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  setView,
  currentView,
  currentUser,
  activeMode,
  onSwitchMode,
  onLogout,
}) => {

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // ✅ Controlla se l'utente ha il ruolo hubber
  const isHubber = currentUser?.roles?.includes("hubber") || currentUser?.role === "hubber";

  // Chiudi il menu cliccando fuori
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* LOGO */}
          <div
            className="flex items-center cursor-pointer"
            onClick={() => setView("home")}
          >
            <img 
              src="https://upyznglekmynztmydtxi.supabase.co/storage/v1/object/public/images/logo-renthubber.png.png" 
              alt="Renthubber" 
              className="h-16 w-auto"
            />
          </div>

          {/* DESKTOP NAV (solo se loggato) */}
          {currentUser && (
            <nav className="hidden md:flex items-center space-x-6">

              {/* ✅ Switch Renter / Hubber - SOLO se l'utente è hubber */}
              {isHubber && (
                <div className="bg-gray-100 p-1 rounded-lg flex items-center mr-4">
                  <button
                    onClick={() => onSwitchMode("renter")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                      activeMode === "renter"
                        ? "bg-white shadow text-brand"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Renter
                  </button>

                  <button
                    onClick={() => {
                      // ✅ Safety check: non permettere switch a hubber se non è hubber
                      if (isHubber) {
                        onSwitchMode("hubber");
                      }
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                      activeMode === "hubber"
                        ? "bg-white shadow text-brand-accent"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Hubber
                  </button>
                </div>
              )}

              <button
                onClick={() => setView("dashboard")}
                className={`flex items-center text-sm font-medium hover:text-brand ${
                  currentView === "dashboard" ? "text-brand" : "text-gray-500"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 mr-1.5" />
                Dashboard
              </button>

              {/* ✅ Pubblica - SOLO se l'utente è hubber E in modalità hubber */}
              {isHubber && activeMode === "hubber" && (
                <button
                  onClick={() => setView("publish")}
                  className={`flex items-center text-sm font-medium hover:text-brand ${
                    currentView === "publish" ? "text-brand" : "text-gray-500"
                  }`}
                >
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  Pubblica
                </button>
              )}

              <button
                onClick={() => setView("messages")}
                className={`flex items-center text-sm font-medium hover:text-brand ${
                  currentView === "messages" ? "text-brand" : "text-gray-500"
                }`}
              >
                <MessageSquare className="w-4 h-4 mr-1.5" />
                Messaggi
              </button>

              <button
                onClick={() => setView("wallet")}
                className={`flex items-center text-sm font-medium hover:text-brand ${
                  currentView === "wallet" ? "text-brand" : "text-gray-500"
                }`}
              >
                <Wallet className="w-4 h-4 mr-1.5" />
                Wallet
              </button>
            </nav>
          )}

          {/* MENU PROFILO / LOGIN */}
          <div className="flex items-center space-x-4">

            {!currentUser && (
              <>
                <button
                  onClick={() => setView("login")}
                  className="text-gray-600 hover:text-brand font-medium text-sm"
                >
                  Accedi
                </button>
                <button
                  onClick={() => setView("signup")}
                  className="bg-brand hover:bg-brand-dark text-white text-sm font-bold py-2 px-4 rounded-full transition-all shadow-md hover:shadow-lg"
                >
                  Registrati
                </button>
              </>
            )}

            {/* MENU PROFILO */}
            {currentUser && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center bg-gray-50 border border-gray-200 rounded-full pl-1 pr-1 py-1 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <Menu className="w-4 h-4 text-gray-600 mx-2" />
                  <img
                    src={currentUser.avatar}
                    className="w-8 h-8 rounded-full border border-white shadow-sm"
                  />
                </button>

                {/* DROP MENU A CLICK */}
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20">

                    <button
                      onClick={() => setView("dashboard")}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </button>

                    {/* ✅ I miei annunci - SOLO se l'utente è hubber */}
                    {isHubber && (
                      <button
                        onClick={() => setView("my-listings")}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                      >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        I miei annunci
                      </button>
                    )}

                    <button
                      onClick={() => setView("wallet")}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      Wallet
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center border-t border-gray-100"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Esci
                    </button>

                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};