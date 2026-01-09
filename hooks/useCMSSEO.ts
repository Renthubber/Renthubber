import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

interface PageSEO {
  title: string;
  meta_description: string | null;
  meta_keywords: string | null;
  featured_image: string | null;
}

interface UseCMSSEOResult {
  seo: PageSEO | null;
  loading: boolean;
}

/**
 * Hook per caricare i dati SEO dal CMS per una pagina esistente
 * 
 * Uso:
 * ```tsx
 * const { seo, loading } = useCMSSEO('chi-siamo');
 * 
 * <Helmet>
 *   <title>{seo?.title || 'Chi Siamo'} | Renthubber</title>
 *   <meta name="description" content={seo?.meta_description || 'Descrizione default'} />
 * </Helmet>
 * ```
 */
export const useCMSSEO = (slug: string): UseCMSSEOResult => {
  const [seo, setSeo] = useState<PageSEO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSEO = async () => {
      const { data, error } = await supabase
        .from("cms_pages")
        .select("title, meta_description, meta_keywords, featured_image")
        .eq("slug", slug)
        .single();

      if (data && !error) {
        setSeo(data);
      }
      setLoading(false);
    };

    loadSEO();
  }, [slug]);

  return { seo, loading };
};

/**
 * Componente wrapper per aggiungere SEO alle pagine React esistenti
 * 
 * Uso:
 * ```tsx
 * import { CMSSEOHead } from '../hooks/useCMSSEO';
 * 
 * export const ChiSiamoPage = () => {
 *   return (
 *     <>
 *       <CMSSEOHead 
 *         slug="chi-siamo" 
 *         fallbackTitle="Chi Siamo"
 *         fallbackDescription="Scopri la storia di Renthubber"
 *       />
 *       <div>...contenuto pagina...</div>
 *     </>
 *   );
 * };
 * ```
 */
export const CMSSEOHead: React.FC<{
  slug: string;
  fallbackTitle: string;
  fallbackDescription?: string;
}> = ({ slug, fallbackTitle, fallbackDescription }) => {
  const { seo } = useCMSSEO(slug);

  useEffect(() => {
    const title = seo?.title || fallbackTitle;
    document.title = `${title} | Renthubber`;

    // Meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      "content",
      seo?.meta_description || fallbackDescription || ""
    );

    // Meta keywords
    if (seo?.meta_keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement("meta");
        metaKeywords.setAttribute("name", "keywords");
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute("content", seo.meta_keywords);
    }
  }, [seo, fallbackTitle, fallbackDescription]);

  return null;
};

export default useCMSSEO;