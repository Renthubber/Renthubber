import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { useBranding, BrandingData } from "../hooks/useBranding";

interface BrandingContextType {
  branding: BrandingData;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | null>(null);

interface BrandingProviderProps {
  children: ReactNode;
}

/**
 * Provider che carica il branding dal database e lo applica come CSS variables
 * 
 * Uso in App.tsx:
 * ```tsx
 * import { BrandingProvider } from './context/BrandingProvider';
 * 
 * function App() {
 *   return (
 *     <BrandingProvider>
 *       <RestoDellApp />
 *     </BrandingProvider>
 *   );
 * }
 * ```
 * 
 * Poi nei componenti puoi usare:
 * - CSS: var(--color-primary), var(--color-secondary), var(--color-accent)
 * - Hook: const { branding } = useBrandingContext();
 */
export const BrandingProvider: React.FC<BrandingProviderProps> = ({ children }) => {
  const { branding, loading, error, refetch } = useBranding();

  // Applica CSS variables quando il branding cambia
  useEffect(() => {
    if (!loading) {
      const root = document.documentElement;
      
      // Colori principali
      root.style.setProperty("--color-primary", branding.primary_color);
      root.style.setProperty("--color-secondary", branding.secondary_color);
      root.style.setProperty("--color-accent", branding.accent_color);
      
      // Varianti hover (leggermente più chiare/scure)
      root.style.setProperty("--color-primary-hover", adjustColor(branding.primary_color, 15));
      root.style.setProperty("--color-secondary-hover", adjustColor(branding.secondary_color, 15));
      
      // Favicon dinamica
      if (branding.favicon_url) {
        updateFavicon(branding.favicon_url);
      }
      
      // Titolo sito (usato come fallback)
      if (branding.site_name) {
        // Non sovrascrive il titolo, solo per reference
        document.documentElement.setAttribute("data-site-name", branding.site_name);
      }
    }
  }, [branding, loading]);

  return (
    <BrandingContext.Provider value={{ branding, loading, error, refetch }}>
      {children}
    </BrandingContext.Provider>
  );
};

/**
 * Hook per accedere al branding context
 */
export const useBrandingContext = (): BrandingContextType => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error("useBrandingContext deve essere usato dentro BrandingProvider");
  }
  return context;
};

/**
 * Utility per schiarire/scurire un colore hex
 */
function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

/**
 * Aggiorna la favicon dinamicamente
 */
function updateFavicon(url: string): void {
  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url;
}

export default BrandingProvider;