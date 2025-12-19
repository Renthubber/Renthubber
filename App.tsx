import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate, useParams, Navigate, useLocation } from "react-router-dom";
import { Header } from "./components/Header";
import { BottomNavBar } from "./components/BottomNavBar";
import { Footer } from "./components/Footer";
import { CookieConsent, CookieSettingsButton } from './components/CookieConsent';
import { Home } from "./views/Home";
import { Publish } from "./views/Publish";
import { PublishModal } from "./views/PublishModal";
import { Wallet } from "./views/Wallet";
import { Messages } from "./views/Messages";
import { ListingDetail } from "./views/ListingDetail";
import { Signup } from "./views/Signup";
import { ForgotPassword } from "./views/ForgotPassword";
import { ResetPassword } from "./views/ResetPassword";
import { ReferralLanding } from "./views/ReferralLanding";
import { Dashboard } from "./views/Dashboard";
import { MyListings } from "./views/MyListings";
import { HubberListingEditor } from "./views/HubberListingEditor";
import { AdminDashboard } from "./views/AdminDashboard";
import { BecomeHubberWizard } from "./views/BecomeHubberWizard";
import { PublicHostProfile } from "./views/PublicHostProfile";
import { PublicRenterProfile } from "./views/PublicRenterProfile";
import CityPage from "./pages/CityPage";
import LaunchLandingPage from './pages/LaunchLandingPage';
import ListingsMapView from './pages/ListingsMapView';
import OrdinamentoRisultati from './pages/OrdinamentoRisultati';
import ScrollToTop from './components/ScrollToTop';



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
  const navigate = useNavigate();
  const location = useLocation();
  
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
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  // ✅ Utenti completi per Admin (da Supabase)
  const [adminUsers, setAdminUsers] = useState<User[]>([]);

  // ✅ REF per evitare doppi processi auth
  const hasProcessedAuth = useRef(false);
  const isInitialized = useRef(false);

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
    
    // ✅ Salva URL corrente per preservarlo dopo auth
    const currentPath = window.location.pathname;

    // ✅ CHECK: Se l'utente arriva dal link email di reset password
    const hash = window.location.hash;
    if (hash.includes('type=recovery') && hash.includes('access_token')) {
      console.log("🔑 Reset password detected - redirect a reset-password view");
      navigate('/reset-password');
      return;
    }

    const init = async () => {
      console.log("🚀 Avvio Renthubber...");

      await api.init();

     // ✅ PRIMA: Check sessione (veloce)
const { data } = await supabase.auth.getSession();
const session = data.session;

// ✅ Nascondi spinner SUBITO dopo auth check
setIsAuthChecking(false);



      // DOPO: Carico dati base (l'app è già visibile)
      const loadedListings = await api.admin.getAllListings();
      console.log("🧩 App.init – listings da Supabase:", loadedListings);
      setListings(loadedListings);

      setTransactions(await api.wallet.getTransactions());
      setBookings(await api.bookings.getAll());
      setPayoutRequests(await api.payouts.getAll());
      setDisputes(await api.admin.getDisputes());
      setReviews(await api.admin.getReviews());
      setInvoices(await api.admin.getInvoices());

      // Processo sessione
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
          
          // ✅ Redirect solo se sulla home, NON se su altre pagine
          if (currentPath === '/' || currentPath === '/login') {
            navigate('/admin');
          }
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
                
                // ✅ Redirect solo se sulla home, NON se su altre pagine
                if (currentPath === '/' || currentPath === '/login') {
                  navigate('/admin');
                }
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
        }
      } else {
        console.log("❌ Nessuna sessione attiva");
      }
    };

    init();
  }, [navigate]);

  /* ------------------------------------------------------
      FUNZIONI HELPER
  -------------------------------------------------------*/
  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      const isAdmin =
        email.toLowerCase() === (DEMO_ADMIN.email || "").toLowerCase();

      if (isAdmin) {
        const adminUser: User = {
          ...DEMO_ADMIN,
          id: data.user.id,
          email,
        };
        setCurrentUser(adminUser);
        setActiveMode("hubber");
        navigate('/admin');
        await loadAdminUsers();
      } else {
        const dbUser = await api.users.get(data.user.id);

        if (dbUser) {
          setCurrentUser(dbUser);
          const userRoles = dbUser.roles || [dbUser.role];

          if (dbUser.role === "admin" || userRoles.includes("admin")) {
            setActiveMode("hubber");
            navigate('/admin');
            await loadAdminUsers();
          } else if (userRoles.includes("hubber")) {
            setActiveMode("hubber");
            navigate('/dashboard');
          } else {
            setActiveMode("renter");
            navigate('/dashboard');
          }
        } else {
          const fallbackUser = buildFallbackUser(data.user);
          setCurrentUser(fallbackUser);
          setActiveMode("renter");
          navigate('/dashboard');
        }
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setActiveMode("renter");
    navigate('/');
  };

  const handleAddListing = async (listing: Listing) => {
  try {
    console.log('💾 Salvataggio listing su Supabase...', listing);
    
    // 👇 SALVA SU SUPABASE (questa chiamata mancava!)
    const savedListing = await api.listings.create(listing);
    
    console.log('✅ Listing salvato con successo!', savedListing);
    
    // 👇 POI aggiorna lo stato locale
    setListings((prev) => [...prev, savedListing]);
    navigate('/my-listings');
  } catch (error) {
    console.error('❌ ERRORE salvataggio listing:', error);
    alert('Errore durante la pubblicazione. Riprova tra qualche istante.');
  }
};

  const handleUpdateListing = (updated: Listing) => {
    setListings((prev) =>
      prev.map((l) => (l.id === updated.id ? updated : l))
    );
    navigate('/my-listings');
  };

  const handleRenterClick = (renter: User) => {
    console.log("APP: renter cliccato:", renter);
    setSelectedRenter(renter);
    navigate('/renter-profile');
  };

  /* ------------------------------------------------------
      WRAPPER COMPONENTS PER GESTIRE PARAMS
  -------------------------------------------------------*/
  const ListingDetailWrapper = () => {
    const { id } = useParams<{ id: string }>();
    const listing = listings.find(l => l.id === id);
    
    if (!listing) {
      return <Navigate to="/" />;
    }

    return (
      <ListingDetail
        listing={listing}
        currentUser={currentUser}
        onBack={() => navigate(-1)}
        systemConfig={systemConfig}
        onPaymentSuccess={() => {}}
        onHostClick={(host) => {
          setSelectedHost(host);
          navigate('/host-profile');
        }}
        onRenterClick={handleRenterClick}
      />
    );
  };

  const PublicHostProfileWrapper = () => {
    if (!selectedHost) {
      return <Navigate to="/" />;
    }

    return (
      <PublicHostProfile
        host={selectedHost}
        listings={listings.filter(
          (l) => l.hostId === selectedHost.id && l.status === "published"
        )}
        onBack={() => navigate(-1)}
        onListingClick={(listing) => {
          setSelectedListing(listing);
          navigate(`/listing/${listing.id}`);
        }}
        onRenterClick={handleRenterClick}
      />
    );
  };

  const PublicRenterProfileWrapper = () => {
    if (!selectedRenter) {
      return <Navigate to="/" />;
    }

    return (
      <PublicRenterProfile
        renter={selectedRenter}
        onBack={() => navigate(-1)}
      />
    );
  };

  const HubberListingEditorWrapper = () => {
    if (!editingListing) {
      return <Navigate to="/my-listings" />;
    }

    return (
      <HubberListingEditor
        listing={editingListing}
        onSave={handleUpdateListing}
        onCancel={() => navigate('/my-listings')}
      />
    );
  };

  // ✅ Mostra spinner durante auth check (solo ~1 secondo)
  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#0A4D68] mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <BrandingProvider>
    <div className="min-h-screen flex flex-col bg-gray-50">
      <ScrollToTop />
      <Header
        currentUser={currentUser}
        activeMode={activeMode}
        onSwitchMode={setActiveMode}
        onLogout={handleLogout}
        onPublish={() => setIsPublishModalOpen(true)}
      />

      <main className="flex-1">
        <Routes>
          {/* HOME & AUTH */}
          <Route path="/" element={
            <Home
              listings={listings}
              bookings={bookings}
              currentUser={currentUser}
              onListingClick={(listing) => {
                setSelectedListing(listing);
                navigate(`/listing/${listing.id}`);
              }}
            />
          } />
          
 {/* ✅ CITY (attiva o prelancio) */}
  <Route path="/it/:citySlug" element={<CityPage />} />

  {/* ✅ LANCIO - Landing espansione città */}
<Route path="/lancio" element={<LaunchLandingPage />} />

        <Route path="/signup" element={
  <Signup
    key="signup"
    onComplete={async (user) => {
      setCurrentUser(user);
      const userRoles = user.roles || [user.role];
                
                if (user.role === "admin" || userRoles.includes("admin")) {
                  setActiveMode("hubber");
                  navigate('/admin');
                  await loadAdminUsers();
                } else if (userRoles.includes("hubber")) {
                  setActiveMode("hubber");
                  navigate('/dashboard');
                } else {
                  setActiveMode("renter");
                  navigate('/dashboard');
                }
              }}
              onLoginRedirect={() => navigate('/login')}
              onForgotPassword={() => navigate('/forgot-password')}
            />
          } />
          
          <Route path="/login" element={
  <Signup
    key="login"
    initialStep="login"
    onComplete={async (user) => {
      setCurrentUser(user);
      const userRoles = user.roles || [user.role];
                
                if (user.role === "admin" || userRoles.includes("admin")) {
                  setActiveMode("hubber");
                  navigate('/admin');
                  await loadAdminUsers();
                } else if (userRoles.includes("hubber")) {
                  setActiveMode("hubber");
                  navigate('/dashboard');
                } else {
                  setActiveMode("renter");
                  navigate('/dashboard');
                }
              }}
              onLoginRedirect={() => navigate('/signup')}
              onForgotPassword={() => navigate('/forgot-password')}
            />
          } />
          
          <Route path="/forgot-password" element={
            <ForgotPassword onBack={() => navigate('/')} />
          } />
          
          <Route path="/reset-password" element={
            <ResetPassword onSuccess={() => navigate('/')} />
          } />

          {/* REFERRAL LANDING */}
          <Route path="/invito/:code" element={<ReferralLanding />} />

          {/* DASHBOARD & USER VIEWS */}
          <Route path="/dashboard" element={
            currentUser ? (
              <Dashboard
                user={currentUser}
                activeMode={activeMode}
                onManageListings={() => navigate('/my-listings')}
                onBecomeHubber={() => navigate('/become-hubber')}
                onNavigateToWallet={() => navigate('/wallet')}
                onViewListing={(listing) => {
                  setSelectedListing(listing);
                  navigate(`/listing/${listing.id}`);
                }}
                invoices={invoices}
                onUpdateProfile={async (updated) => {
                  // Qui dovresti implementare l'aggiornamento del profilo
                  console.log('Update profile:', updated);
                }}
                onViewRenterProfile={handleRenterClick}
              />
            ) : (
              <Navigate to="/" />
            )
          } />

          <Route path="/admin" element={
            currentUser?.role === 'admin' ? (
              <AdminDashboard
                systemConfig={systemConfig}
                onUpdateConfig={setSystemConfig}
                allListings={listings}
                allUsers={adminUsers}
                payoutRequests={payoutRequests}
                onProcessPayout={(requestId, approved) => {
                  setPayoutRequests((prev) =>
                    prev.map((p) => 
                      p.id === requestId 
                        ? { ...p, status: approved ? "paid" : "rejected" } 
                        : p
                    )
                  );
                }}
                onLogout={() => {
                  setCurrentUser(null);
                  navigate('/');
                }}
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
            ) : (
              <Navigate to="/" />
            )
          } />

          <Route path="/my-listings" element={
            currentUser ? (
              <MyListings
                currentUser={currentUser}
                listings={listings}
                onCreateNew={() => setIsPublishModalOpen(true)}
                onEditListing={(listing) => {
                  setEditingListing(listing);
                  navigate('/edit-listing');
                }}
                onListingUpdated={async () => {
                  api.listings.invalidateCache();
                  const loadedListings = await api.admin.getAllListings();
                  setListings(loadedListings);
                }}
              />
            ) : (
              <Navigate to="/" />
            )
          } />

          {/* <Route path="/publish" element={
            currentUser ? (
              <Publish onPublish={handleAddListing} currentUser={currentUser} />
            ) : (
              <Navigate to="/" />
            )
          } /> */}

          <Route path="/messages" element={
            currentUser ? (
              <Messages currentUser={currentUser} onCreateDispute={() => {}} />
            ) : (
              <Navigate to="/" />
            )
          } />

          <Route path="/wallet" element={
            currentUser ? (
              <Wallet
                currentUser={currentUser}
                activeMode={activeMode}
                systemConfig={systemConfig}
                onUpdateUser={() => {}}
                onRequestPayout={() => {}}
              />
            ) : (
              <Navigate to="/" />
            )
          } />

          {/* LISTING DETAIL */}
          <Route path="/listing/:id" element={<ListingDetailWrapper />} />

          {/* PROFILES */}
          <Route path="/host-profile" element={<PublicHostProfileWrapper />} />
          <Route path="/renter-profile" element={<PublicRenterProfileWrapper />} />

          {/* EDIT LISTING */}
          <Route path="/edit-listing" element={<HubberListingEditorWrapper />} />

          {/* BECOME HUBBER */}
          <Route path="/become-hubber" element={
            currentUser ? (
              <BecomeHubberWizard
                user={currentUser}
                onComplete={(updatedUser) => {
                  setCurrentUser(updatedUser);
                  setActiveMode("hubber");
                  navigate('/dashboard');
                }}
                onCancel={() => navigate('/dashboard')}
              />
            ) : (
              <Navigate to="/" />
            )
          } />

          <Route path="/ordinamento-risultati" element={<OrdinamentoRisultati />} />

          {/* PAGINE FOOTER - RENTHUBBER */}
          <Route path="/chi-siamo" element={<ChiSiamoPage />} />
          <Route path="/come-funziona" element={<ComeFunzionaPage />} />
          <Route path="/sicurezza" element={<SicurezzaPage />} />
          <Route path="/tariffe" element={<TariffePage />} />
          <Route path="/invita-amico" element={<InvitaAmicoPage />} />
          <Route path="/super-hubber" element={<SuperHubberPage />} />
          <Route path="/investitori" element={<InvestitoriPage />} />

          {/* PAGINE FOOTER - SUPPORTO */}
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/diventare-hubber" element={<DiventareHubberPage />} />
          <Route path="/assistenza" element={<AssistenzaPage />} />
          <Route path="/cancellazione" element={<CancellazionePage />} />
          <Route path="/segnala" element={<SegnalaPage />} />
          <Route path="/contatti" element={<ContattiPage />} />

          {/* PAGINE FOOTER - LEGALE */}
          <Route path="/cookie-policy" element={<CookiePage />} />
          <Route path="/linee-guida" element={<LineeGuidaPage />} />
          <Route path="/antidiscriminazione" element={<AntidiscriminazionePage />} />
          <Route path="/privacy-policy" element={<PrivacyPage />} />
          <Route path="/termini-condizioni" element={<TerminiPage />} />
          <Route path="/mappa-sito" element={<MappaSitoPage />} />

{/* MAPPA ANNUNCI */}
<Route path="/listings/map" element={
  <ListingsMapView 
    listings={listings}
    currentUser={currentUser}
    onListingClick={(listing) => {
      setSelectedListing(listing);
      navigate(`/listing/${listing.id}`);
    }}
  />
} />

        </Routes>
      </main>

      {/* Bottom Navigation Bar - Solo Mobile */}
      <BottomNavBar
        currentUser={currentUser}
        activeMode={activeMode}
        onSwitchMode={setActiveMode}
        onPublish={() => setIsPublishModalOpen(true)}
      />

      {/* Footer - Solo pagine pubbliche (NON dashboard) */}
      {!location.pathname.startsWith('/dashboard') && 
       !location.pathname.startsWith('/messages') && 
       !location.pathname.startsWith('/wallet') && 
       !location.pathname.startsWith('/admin') && 
       !location.pathname.startsWith('/my-listings') && 
       !location.pathname.startsWith('/become-hubber') && 
       !location.pathname.startsWith('/edit-listing') && (
        <Footer />
      )}
    </div>

    <CookieConsent />
    <CookieSettingsButton />

    {/* 🎨 MODALE PUBLISH */}
    {currentUser && (
      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onPublish={async (listing) => {
          await handleAddListing(listing);
          setIsPublishModalOpen(false);
        }}
        currentUser={currentUser}
      />
    )}

    </BrandingProvider> 
  );
};

export default App;