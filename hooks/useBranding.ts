import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export interface BrandingData {
  site_name: string;
  logo_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  footer_text: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_linkedin: string | null;
  social_twitter: string | null;
}

interface UseBrandingResult {
  branding: BrandingData;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Valori di default (quelli attuali di RentHubber)
const DEFAULT_BRANDING: BrandingData = {
  site_name: "RentHubber",
  logo_url: null,
  logo_dark_url: null,
  favicon_url: null,
  primary_color: "#0D414B",
  secondary_color: "#1a5f6b",
  accent_color: "#f59e0b",
  footer_text: null,
  social_facebook: null,
  social_instagram: null,
  social_linkedin: null,
  social_twitter: null,
};

/**
 * Hook per caricare i dati di branding dal CMS
 * 
 * Uso:
 * ```tsx
 * const { branding, loading } = useBranding();
 * 
 * <img src={branding.logo_url || '/default-logo.png'} />
 * <div style={{ backgroundColor: branding.primary_color }}>...</div>
 * ```
 */
export const useBranding = (): UseBrandingResult => {
  const [branding, setBranding] = useState<BrandingData>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBranding = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("cms_branding")
        .select("*")
        .single();

      if (fetchError) {
        // Se non esiste ancora un record, usa i default
        if (fetchError.code === "PGRST116") {
          console.log("Nessun branding configurato, uso valori default");
        } else {
          throw fetchError;
        }
      }

      if (data) {
        setBranding({
          site_name: data.site_name || DEFAULT_BRANDING.site_name,
          logo_url: data.logo_url,
          logo_dark_url: data.logo_dark_url,
          favicon_url: data.favicon_url,
          primary_color: data.primary_color || DEFAULT_BRANDING.primary_color,
          secondary_color: data.secondary_color || DEFAULT_BRANDING.secondary_color,
          accent_color: data.accent_color || DEFAULT_BRANDING.accent_color,
          footer_text: data.footer_text,
          social_facebook: data.social_facebook,
          social_instagram: data.social_instagram,
          social_linkedin: data.social_linkedin,
          social_twitter: data.social_twitter,
        });
      }
    } catch (err) {
      console.error("Errore caricamento branding:", err);
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  return { branding, loading, error, refetch: fetchBranding };
};

export default useBranding;