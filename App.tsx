import React, { useState, useEffect, useRef } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { CookieConsent, CookieSettingsButton } from './components/CookieConsent';
import { Home } from "./views/Home";
import { Publish } from "./views/Publish";
import { Wallet } from "./views/Wallet";
import { Messages } from "./views/Messages";
import { ListingDetail } from "./views/ListingDetail";
import { Signup } from "./views/Signup";
import { Dashboard } from "./views/Dashboard";
import { MyListings } from "./views/MyListings";
import { HubberListingEditor } from "./views/HubberListingEditor";
import { AdminDashboard } from "./views/AdminDashboard";
import { BecomeHubberWizard } from "./views/BecomeHubberWizard";
import { PublicHostProfile } from "./views/PublicHostProfile";
import { PublicRenterProfile } from "./views/PublicRenterProfile";

// === PAGINE FOOTER ===
import { ChiSiamoPage } from "./pages/ChiSiamoPage";
import { ComeFunzionaPage } from "./pages/ComeFunzionaPage";
import { SicurezzaPage } from "./pages/SicurezzaPage";
import { TariffePage } from "./pages/TariffePage";
import { InvitaAmicoPage } from "./pages/InvitaAmicoPage";
import { SuperHubberPage } from "./pages/SuperHubberPage";
import { InvestitoriPage } from "./pages/InvestitoriPage";
import { FaqPage } from "./pages/FaqPage";
import { DiventareHubberPage } from "./pages/DiventareHubberPage";
import { AssistenzaPage } from "./pages/AssistenzaPage";
import { CancellazionePage } from "./pages/CancellazionePage";
import { SegnalaPage } from "./pages/SegnalaPage";
import { ContattiPage } from "./pages/ContattiPage";
import { CookiePage } from "./pages/CookiePage";
import { LineeGuidaPage } from "./pages/LineeGuidaPage";
import { AntidiscriminazionePage } from "./pages/AntidiscriminazionePage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { TerminiPage } from "./pages/TerminiPage";
import { MappaSitoPage } from "./pages/MappaSitoPage";
// === CONTEXT ===
import { BrandingProvider } from "./context/BrandingProvider";

import {
  Listing,
  User,
  SystemConfig,
  ActiveMode,
  PayoutRequest,
  Dispute,
  Review,
  Invoice,
  Transaction,
  BookingRequest,
} from "./types";

import { DEFAULT_SYSTEM_CONFIG, DEMO_ADMIN } from "./constants";
import { api } from "./services/api";
import { supabase } from "./lib/supabase";

/* ------------------------------------------------------
   FALLBACK USER - evita rotelline, permette login sicuro
-------------------------------------------------------*/
const buildFallbackUser = (authUser: any): User => ({
  id: authUser.id,
  email: authUser.email,
  name: authUser.email?.split("@")[0] || "Utente",
  role: "renter",
  roles: ["renter"],
  status: "active",
  renterBalance: 0,
  hubberBalance: 0,
  referralCode: "",
  avatar: `https://ui-avatars.com/api/?name=${authUser.email}&background=random`,
  isSuperHubber: false,
  rating: 0,
  isSuspended: false,
  emailVerified: !!authUser.email_confirmed_at,
  phoneVerified: false,
  idDocumentVerified: false,
  verificationStatus: "unverified",
  address: undefined,
  phoneNumber: undefined,
  bio: undefined,
  bankDetails: undefined,
  hubberSince: undefined,
  idDocumentUrl: undefined,
});

/* ------------------------------------------------------
                COMPONENTE PRINCIPALE
-------------------------------------------------------*/
const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>("home");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedHost, setSelectedHost] = useState<User | null>(null);
  const [selectedRenter, setSelectedRenter] = useState<User | null>(null);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [listings, setListings] = useState<Listing[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);

  const [systemConfig, setSystemConfig] =
    useState<SystemConfig>(DEFAULT_SYSTEM_CONFIG);

  const [activeMode, setActiveMode] = useState<ActiveMode>("renter");

  // ✅ Utenti completi per Admin (da Supabase)
  const [adminUsers, setAdminUsers] = useState<User[]>([]);

  // ✅ REF per evitare doppi processi auth
  const hasProcessedAuth = useRef(false);
  const isInitialized = useRef(false);

  // ✅ Traccia la view precedente per il back dal profilo renter
  const [previousView, setPreviousView] = useState<string>("home");

  const loadAdminUsers = async () => {
    try {
      const list = await api.admin.getAllUsers();
      console.log("👑 ADMIN USERS DA SUPABASE:", list?.length, list);
      setAdminUsers(list || []);
    } catch (err) {
      console.error("Errore nel caricamento utenti admin:", err);
      setAdminUsers([]);
    }
  };

  /* ------------------------------------------------------
      BOOTSTRAP + SESSION CHECK
  -------------------------------------------------------*/
  useEffect(() => {
    // ✅ Evita doppia inizializzazione in React StrictMode
    if (isInitialized.current) {
      console.log("⏭️ Init già eseguito, skip");
      return;
    }
    isInitialized.current = true;

    console.log("🔄 useEffect INIT chiamato - timestamp:", Date.now());

    const init = async () => {
      console.log("🚀 Avvio Renthubber...");

      await api.init();

      // Carico dati base
      const loadedListings = await api.admin.getAllListings();
      console.log("🧩 App.init – listings da Supabase:", loadedListings);
      setListings(loadedListings);

      setTransactions(await api.wallet.getTransactions());
      setBookings(await api.bookings.getAll());
      setPayoutRequests(await api.payouts.getAll());
      setDisputes(await api.admin.getDisputes());
      setReviews(await api.admin.getReviews());
      setInvoices(await api.admin.getInvoices());

      // Controllo sessione
      const { data } = await supabase.auth.getSession();
      const session = data.session;

     if (session?.user) {
        const email = session.user.email || "";
        const isAdmin =
          email.toLowerCase() === (DEMO_ADMIN.email || "").toLowerCase();

        if (isAdmin) {
          const adminUser: User = {
            ...DEMO_ADMIN,
            id: session.user.id,
            email,
          };
          setCurrentUser(adminUser);
          setActiveMode("hubber");
          setCurrentView("admin");
          hasProcessedAuth.current = true;

          await loadAdminUsers();
        } else {
          console.log("🔑 Utente loggato:", session.user.id);

          try {
            const dbUser = await Promise.race([
              api.users.get(session.user.id),
              new Promise<null>((resolve) =>
                setTimeout(() => resolve(null), 5000)
              ),
            ]);

            if (dbUser) {
              console.log("✅ Utente caricato dal DB:", dbUser);
              setCurrentUser(dbUser);
              const userRoles = dbUser.roles || [dbUser.role];
              
              // ✅ FIX: Controlla se è admin dal ruolo DB
              if (dbUser.role === "admin" || userRoles.includes("admin")) {
                console.log("🔑 Admin riconosciuto dal ruolo DB!");
                setActiveMode("hubber");
                setCurrentView("admin");
                hasProcessedAuth.current = true;
                await loadAdminUsers();
                return;
              } else if (userRoles.includes("hubber")) {
                setActiveMode("hubber");
              } else {
                setActiveMode("renter");
              }
            } else {
              console.log("⚠️ Timeout o utente non trovato, uso fallback");
              const fallbackUser = buildFallbackUser(session.user);
              setCurrentUser(fallbackUser);
              setActiveMode("renter");
            }
          } catch (e) {
            console.log("⚠️ Errore caricamento utente, uso fallback:", e);
            const fallbackUser = buildFallbackUser(session.user);
            setCurrentUser(fallbackUser);
            setActiveMode("renter");
          }

          hasProcessedAuth.current = true;
          setCurrentView("home");
        }
      } else {
        setCurrentView("home");
      }
    };

    init();

    // Listener Auth
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("⚡ Stato auth:", event);

        // ✅ Ignora eventi che non sono login/logout effettivi
        if (
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED" ||
          event === "INITIAL_SESSION"
        ) {
          console.log("⏭️ Evento ignorato:", event);
          return;
        }

        if (event === "SIGNED_IN" && session?.user) {
          // ✅ Se abbiamo già processato l'auth, ignora
          if (hasProcessedAuth.current) {
            console.log("⏭️ Auth già processato, ignoro evento SIGNED_IN");
            return;
          }
          hasProcessedAuth.current = true;

          const email = session.user.email || "";
          const isAdmin =
            email.toLowerCase() === (DEMO_ADMIN.email || "").toLowerCase();

          if (isAdmin) {
            const adminUser: User = {
              ...DEMO_ADMIN,
              id: session.user.id,
              email,
            };
            setCurrentUser(adminUser);
            setActiveMode("hubber");
            setCurrentView("admin");
            await loadAdminUsers();
          } else {
            console.log("🔑 Utente loggato (listener):", session.user.id);
            try {
              const dbUser = await Promise.race([
                api.users.get(session.user.id),
                new Promise<null>((resolve) =>
                  setTimeout(() => resolve(null), 5000)
                ),
              ]);

              if (dbUser) {
                console.log("✅ Utente caricato dal DB (listener):", dbUser);
                setCurrentUser(dbUser);
                const userRoles = dbUser.roles || [dbUser.role];
                
                // ✅ FIX: Controlla se è admin dal ruolo DB
                if (dbUser.role === "admin" || userRoles.includes("admin")) {
                  console.log("🔑 Admin riconosciuto dal ruolo DB (listener)!");
                  setActiveMode("hubber");
                  setCurrentView("admin");
                  await loadAdminUsers();
                  return;
                }
                
                setActiveMode(
                  userRoles.includes("hubber") ? "hubber" : "renter"
                );
              } else {
                console.log("⚠️ Timeout o utente non trovato, uso fallback");
                const fallbackUser = buildFallbackUser(session.user);
                setCurrentUser(fallbackUser);
                setActiveMode("renter");
              }
            } catch (e) {
              console.log("⚠️ Errore caricamento utente, uso fallback:", e);
              const fallbackUser = buildFallbackUser(session.user);
              setCurrentUser(fallbackUser);
              setActiveMode("renter");
            }
            // ✅ NON cambiamo view qui - l'utente resta dove si trova
          }
        } else if (event === "SIGNED_OUT") {
          // ✅ Reset al logout
          hasProcessedAuth.current = false;
          setCurrentUser(null);
          setActiveMode("renter");
          setCurrentView("home");
          setAdminUsers([]);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  /* ------------------------------------------------------
                      HANDLER ANNUNCI
  -------------------------------------------------------*/
  const handleAddListing = async (listing: Listing) => {
    try {
      const saved = await api.listings.create(listing);
      setListings((prev) => [saved, ...prev]);
      setCurrentView("my-listings");
    } catch (e) {
      console.error("Errore create listing:", e);
      setListings((prev) => [listing, ...prev]);
      setCurrentView("my-listings");
    }
  };

  const handleUpdateListing = async (listing: Listing) => {
    const saved = await api.listings.update(listing);
    setListings((prev) => prev.map((l) => (l.id === saved.id ? saved : l)));
    setCurrentView("my-listings");
  };

  /* ------------------------------------------------------
                        LOGOUT
  -------------------------------------------------------*/
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setCurrentView("home");
    setAdminUsers([]);
  };

  /* ------------------------------------------------------
        HANDLER COMUNE PER CLICK SU RENTER
  -------------------------------------------------------*/
  const handleRenterClick = async (renter: { id: string; name: string; avatar?: string }, fromView: string) => {
    setPreviousView(fromView);
    
    // ✅ Carica dati completi dal database
    try {
      const fullRenter = await api.users.get(renter.id);
      if (fullRenter) {
        setSelectedRenter(fullRenter);  // ✅ CAMBIATO
      } else {
        // Fallback se non trova l'utente
        const renterAsUser: User = {
          id: renter.id,
          name: renter.name,
          avatar: renter.avatar,
          email: "",
          role: "renter",
          roles: ["renter"],
          status: "active",
          renterBalance: 0,
          hubberBalance: 0,
          referralCode: "",
          isSuperHubber: false,
          rating: 0,
          isSuspended: false,
          emailVerified: false,
          phoneVerified: false,
          idDocumentVerified: false,
          verificationStatus: "unverified",
        };
        setSelectedRenter(renterAsUser);  // ✅ CAMBIATO
      }
    } catch (err) {
      console.error("Errore caricamento renter:", err);
    }
    
    setCurrentView("renter-profile");
  };
  /* ------------------------------------------------------
                    RENDER PRINCIPALE
  -------------------------------------------------------*/
  return (
    <BrandingProvider>
      <div className="min-h-screen flex flex-col">
      {/* HEADER */}
      {currentView !== "admin" &&
        currentView !== "hubber-edit" &&
        currentView !== "become-hubber" && (
          <Header
            setView={setCurrentView}
            currentView={currentView}
            currentUser={currentUser}
            activeMode={activeMode}
            onSwitchMode={setActiveMode}
            onLogout={handleLogout}
          />
        )}

      <main className="flex-grow bg-gray-50">
        {/* SIGNUP (Registrazione - parte dalla scelta ruolo) */}
        {currentView === "signup" && (
          <Signup
            initialStep="role"
            onComplete={(user) => {
              setCurrentUser(user);
              const userRoles = user.roles || [user.role];
              setActiveMode(userRoles.includes("hubber") ? "hubber" : "renter");
              setCurrentView("dashboard");
            }}
            onLoginRedirect={() => setCurrentView("login")}
          />
        )}

        {/* LOGIN (Accedi - parte direttamente dal form login) */}
{currentView === "login" && (
  <Signup
    initialStep="login"
    onComplete={async (user) => {
      setCurrentUser(user);
      const userRoles = user.roles || [user.role];
      
      // Se è admin, vai alla dashboard admin
      if (user.role === "admin" || userRoles.includes("admin") || 
          user.email?.toLowerCase() === (DEMO_ADMIN.email || "").toLowerCase()) {
        setActiveMode("hubber");
        setCurrentView("admin");
        await loadAdminUsers();
        return;
      }
      
      setActiveMode(userRoles.includes("hubber") ? "hubber" : "renter");
      setCurrentView("dashboard");
    }}
    onLoginRedirect={() => setCurrentView("signup")}
  />
)}

{/* HOME */}
        {currentView === "home" && (
          <Home
            listings={listings}
            onListingClick={(listing) => {
              console.log("App.onListingClick HOME", listing.id);
              setSelectedListing(listing);
              setCurrentView("detail");
            }}
          />
        )}

        {/* DASHBOARD HUBBER/RENTER */}
        {currentView === "dashboard" && currentUser && (
          <Dashboard
            user={currentUser}
            activeMode={activeMode}
            onManageListings={() => setCurrentView("my-listings")}
            onBecomeHubber={() => setCurrentView("become-hubber")}
            invoices={invoices}
            onUpdateProfile={async (data) => {
              try {
                const updatedUser: User = {
                  ...currentUser,
                  email: data.email ?? currentUser.email,
                  phoneNumber: data.phoneNumber ?? currentUser.phoneNumber,
                  userType: data.userType ?? (currentUser as any).userType,
                  dateOfBirth: data.dateOfBirth ?? (currentUser as any).dateOfBirth,
                  bio: data.bio ?? (currentUser as any).bio,
                  emailVerified: data.resetEmailVerification
                    ? false
                    : currentUser.emailVerified,
                  phoneVerified: data.resetPhoneVerification
                    ? false
                    : currentUser.phoneVerified,
                  idDocumentVerified: data.resetIdDocumentVerification
                    ? false
                    : currentUser.idDocumentVerified,
                };
                await api.users.update(updatedUser);
                setCurrentUser(updatedUser);
                console.log("✅ Profilo aggiornato su Supabase");
              } catch (err) {
                console.error("❌ Errore aggiornamento profilo:", err);
              }
            }}
            onViewRenterProfile={(renter) => handleRenterClick(renter, "dashboard")}
          />
        )}

        {/* ADMIN DASHBOARD */}
        {currentView === "admin" &&
          currentUser &&
          currentUser.role === "admin" && (
            <AdminDashboard
              systemConfig={systemConfig}
              onUpdateConfig={setSystemConfig}
              allListings={listings}
              allUsers={adminUsers}
              payoutRequests={payoutRequests}
              onProcessPayout={(id, approved) => {
                setPayoutRequests((prev) =>
                  prev.map((p) =>
                    p.id === id
                      ? { ...p, status: approved ? "approved" : "rejected" }
                      : p
                  )
                );
              }}
              onLogout={handleLogout}
              disputes={disputes}
              onDisputeAction={(id, action, note) => {
                setDisputes((prev) =>
                  prev.map((d) =>
                    d.id === id
                      ? {
                          ...d,
                          status:
                            action === "resolve" ? "resolved" : "dismissed",
                          adminNote: note ?? d.adminNote,
                        }
                      : d
                  )
                );
              }}
              reviews={reviews}
              invoices={invoices}
              currentUser={currentUser}
              bookings={bookings}
            />
          )}

        {/* MY LISTINGS */}
        {currentView === "my-listings" && currentUser && (
          <MyListings
            currentUser={currentUser}
            listings={listings}
            onCreateNew={() => setCurrentView("publish")}
            onEditListing={(listing) => {
              console.log("App.onEditListing", listing.id);
              setEditingListing(listing);
              setCurrentView("hubber-edit");
            }}
          />
        )}

        {/* PUBLISH */}
        {currentView === "publish" && currentUser && (
          <Publish onPublish={handleAddListing} currentUser={currentUser} />
        )}

        {/* MESSAGES */}
        {currentView === "messages" && currentUser && (
          <Messages currentUser={currentUser} onCreateDispute={() => {}} />
        )}

        {/* WALLET */}
        {currentView === "wallet" && currentUser && (
          <Wallet
            currentUser={currentUser}
            activeMode={activeMode}
            systemConfig={systemConfig}
            onUpdateUser={() => {}}
            onRequestPayout={() => {}}
          />
        )}

        {/* DETTAGLIO ANNUNCIO */}
        {currentView === "detail" && selectedListing && (
          <ListingDetail
            listing={selectedListing}
            currentUser={currentUser}
            onBack={() => {
              setSelectedListing(null);
              setCurrentView("home");
            }}
            systemConfig={systemConfig}
            onPaymentSuccess={() => {}}
            onHostClick={(host) => {
              console.log("APP: host cliccato:", host);
              setSelectedHost(host);
              setCurrentView("host-profile");
            }}
            onRenterClick={(renter) => handleRenterClick(renter, "detail")}
          />
        )}

        {/* PROFILO HOST */}
        {currentView === "host-profile" && selectedHost && (
          <PublicHostProfile
            host={selectedHost}
            listings={listings.filter(
              (l) => l.hostId === selectedHost.id && l.status === "published"
            )}
            onBack={() => setCurrentView("detail")}
            onListingClick={(listing) => {
              setSelectedListing(listing);
              setCurrentView("detail");
            }}
            onRenterClick={(renter) => handleRenterClick(renter, "host-profile")}
          />
        )}

        {/* PROFILO RENTER */}
{currentView === "renter-profile" && selectedRenter && (
  <PublicRenterProfile
    renter={selectedRenter}
    onBack={() => setCurrentView(previousView)}
  />
)}

        {/* EDIT LISTING */}
        {currentView === "hubber-edit" && editingListing && (
          <HubberListingEditor
            listing={editingListing}
            onSave={handleUpdateListing}
            onCancel={() => setCurrentView("my-listings")}
          />
        )}

        {/* BECOME HUBBER */}
        {currentView === "become-hubber" && currentUser && (
          <BecomeHubberWizard
            user={currentUser}
            onComplete={(updatedUser) => {
              setCurrentUser(updatedUser);
              setActiveMode("hubber");
              setCurrentView("dashboard");
            }}
            onCancel={() => setCurrentView("dashboard")}
          />
        )}

        {/* ============================================
            PAGINE FOOTER - RENTHUBBER
        ============================================ */}

        {currentView === "chi-siamo" && (
          <ChiSiamoPage setView={setCurrentView} />
        )}

        {currentView === "come-funziona" && (
          <ComeFunzionaPage setView={setCurrentView} />
        )}

        {currentView === "sicurezza" && (
          <SicurezzaPage setView={setCurrentView} />
        )}

        {currentView === "tariffe" && (
          <TariffePage setView={setCurrentView} />
        )}

        {currentView === "invita-amico" && (
          <InvitaAmicoPage setView={setCurrentView} />
        )}

        {currentView === "super-hubber" && (
          <SuperHubberPage setView={setCurrentView} />
        )}

        {currentView === "investitori" && (
          <InvestitoriPage setView={setCurrentView} />
        )}

        {/* ============================================
            PAGINE FOOTER - SUPPORTO
        ============================================ */}

        {currentView === "faq" && <FaqPage setView={setCurrentView} />}

        {currentView === "diventare-hubber" && (
          <DiventareHubberPage setView={setCurrentView} />
        )}

        {currentView === "assistenza" && (
          <AssistenzaPage setView={setCurrentView} />
        )}

        {currentView === "cancellazione" && (
          <CancellazionePage setView={setCurrentView} />
        )}

        {currentView === "segnala" && (
          <SegnalaPage setView={setCurrentView} />
        )}

        {currentView === "contatti" && (
          <ContattiPage setView={setCurrentView} />
        )}

        {/* ============================================
            PAGINE FOOTER - LEGALE
        ============================================ */}

        {currentView === "cookie" && <CookiePage setView={setCurrentView} />}

        {currentView === "linee-guida" && (
          <LineeGuidaPage setView={setCurrentView} />
        )}

        {currentView === "antidiscriminazione" && (
          <AntidiscriminazionePage setView={setCurrentView} />
        )}

        {currentView === "privacy" && (
          <PrivacyPage setView={setCurrentView} />
        )}

        {currentView === "termini" && (
          <TerminiPage setView={setCurrentView} />
        )}

        {currentView === "mappa-sito" && (
          <MappaSitoPage setView={setCurrentView} />
        )}
      </main>

      <Footer setView={setCurrentView} />
    </div>

<CookieConsent />
    <CookieSettingsButton />

    </BrandingProvider> 
  );
};

export default App;