import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, PlusCircle, MessageSquare, Wallet, LogOut, LayoutDashboard } from "lucide-react";
import { User, ActiveMode } from "../types";

interface HeaderProps {
  currentUser: User | null;
  activeMode: ActiveMode;
  onSwitchMode: (mode: ActiveMode) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeMode,
  onSwitchMode,
  onLogout,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentView = location.pathname;

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // ✅ Controlla se l'utente ha il ruolo hubber
  const isHubber = currentUser?.roles?.includes("hubber") || currentUser?.role === "hubber";
  
  // ✅ Controlla se l'utente è admin
  const isAdmin = currentUser?.role === 'admin' || currentUser?.roles?.includes('admin');

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

  // 🔔 Carica conteggio messaggi non letti
  useEffect(() => {
    if (!currentUser) return;

    const loadUnreadCount = async () => {
      try {
        const { supabase } = await import('../lib/supabase');
        
        // Query diversa in base al ruolo attivo
        const field = activeMode === 'renter' ? 'unread_for_renter' : 'unread_for_hubber';
        const userField = activeMode === 'renter' ? 'renter_id' : 'hubber_id';
        
        const { data, error } = await supabase
          .from('conversations')
          .select('id')
          .eq(userField, currentUser.id)
          .eq(field, true);

        if (!error && data) {
          // Se sei nella sezione messaggi, azzera il badge
          if (currentView === '/messages') {
            setUnreadCount(0);
          } else {
            setUnreadCount(data.length);
            console.log('🔔 Messaggi non letti:', data.length, 'per', activeMode);
          }
        } else if (error) {
          console.error('❌ Errore query non letti:', error);
        }
      } catch (err) {
        console.error('Errore caricamento messaggi non letti:', err);
      }
    };

    loadUnreadCount();

    // 🔔 Ascolta evento per aggiornamento immediato
    window.addEventListener('unread-changed', loadUnreadCount);

    // Ricarica ogni 30 secondi
    const interval = setInterval(loadUnreadCount, 30000);
    
    return () => {
      window.removeEventListener('unread-changed', loadUnreadCount);
      clearInterval(interval);
    };
  }, [currentUser, activeMode, currentView]);

  return (
    <header className="sticky top-0 z-[9999] bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* LOGO */}
          <div
            className="flex items-center cursor-pointer"
            onClick={() => navigate("/")}
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
              
              {/* ✅ ADMIN: Solo Dashboard */}
              {isAdmin ? (
                <button
                  onClick={() => navigate("/admin")}
                  className={`flex items-center text-sm font-medium hover:text-brand ${
                    currentView === "/admin" ? "text-brand" : "text-gray-500"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 mr-1.5" />
                  Dashboard
                </button>
              ) : (
                <>
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
                    onClick={() => navigate("/dashboard")}
                    className={`flex items-center text-sm font-medium hover:text-brand ${
                      currentView === "/dashboard" ? "text-brand" : "text-gray-500"
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 mr-1.5" />
                    Dashboard
                  </button>

                  {/* ✅ Pubblica - SOLO se l'utente è hubber E in modalità hubber */}
                  {isHubber && activeMode === "hubber" && (
                    <button
                      onClick={() => navigate("/publish")}
                      className={`flex items-center text-sm font-medium hover:text-brand ${
                        currentView === "/publish" ? "text-brand" : "text-gray-500"
                      }`}
                    >
                      <PlusCircle className="w-4 h-4 mr-1.5" />
                      Pubblica
                    </button>
                  )}

                  <button
                    onClick={() => navigate("/messages")}
                    className={`flex items-center text-sm font-medium hover:text-brand ${
                      currentView === "/messages" ? "text-brand" : "text-gray-500"
                    }`}
                  >
                    <div className="relative">
                      <MessageSquare className="w-4 h-4 mr-1.5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1 bg-brand text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <span>Messaggi</span>
                  </button>

                  <button
                    onClick={() => navigate("/wallet")}
                    className={`flex items-center text-sm font-medium hover:text-brand ${
                      currentView === "/wallet" ? "text-brand" : "text-gray-500"
                    }`}
                  >
                    <Wallet className="w-4 h-4 mr-1.5" />
                    Wallet
                  </button>
                </>
              )}
            </nav>
          )}

          {/* MENU PROFILO / LOGIN */}
          <div className="flex items-center space-x-4">

            {!currentUser && (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="text-gray-600 hover:text-brand font-medium text-sm"
                >
                  Accedi
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="bg-brand hover:bg-brand-dark text-white text-sm font-bold py-2 px-4 rounded-full transition-all shadow-md hover:shadow-lg"
                >
                  Registrati
                </button>
              </>
            )}

            {/* MENU PROFILO - Nascosto per admin */}
            {currentUser && !isAdmin && (
              <div className="relative z-[9999]" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center bg-gray-50 border border-gray-200 rounded-full pl-1 pr-1 py-1 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <Menu className="w-4 h-4 text-gray-600 mx-2" />
                  <img
                    src={currentUser.avatar}
                    alt="Profile"
                    className="w-8 h-8 rounded-full border border-white shadow-sm"
                  />
                </button>

                {/* DROP MENU A CLICK */}
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-[9999]">

                    {/* ✅ Switch Renter/Hubber - SOLO per hubber e NON admin - SOLO su mobile */}
                    {isHubber && !isAdmin && (
                      <div className="md:hidden px-4 py-3 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 mb-2">Modalità</p>
                        <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                          <button
                            onClick={() => {
                              onSwitchMode("renter");
                              setMenuOpen(false);
                            }}
                            className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                              activeMode === "renter"
                                ? "bg-white shadow text-brand"
                                : "text-gray-500"
                            }`}
                          >
                            Renter
                          </button>
                          <button
                            onClick={() => {
                              onSwitchMode("hubber");
                              setMenuOpen(false);
                            }}
                            className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                              activeMode === "hubber"
                                ? "bg-white shadow text-brand-accent"
                                : "text-gray-500"
                            }`}
                          >
                            Hubber
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        const isAdmin = currentUser?.role === 'admin' || 
                                        currentUser?.roles?.includes('admin');
                        navigate(isAdmin ? "/admin" : "/dashboard");
                        setMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </button>

                    {/* ✅ I miei annunci - SOLO se l'utente è hubber E NON admin */}
                    {isHubber && !isAdmin && (
                      <button
                        onClick={() => navigate("/my-listings")}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                      >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        I miei annunci
                      </button>
                    )}

                    <button
                      onClick={() => navigate("/wallet")}
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
