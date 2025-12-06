import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface PageSEO {
  title: string;
  meta_description: string | null;
  meta_keywords: string | null;
}

interface PageLayoutProps {
  slug: string;
  fallbackTitle: string;
  fallbackDescription?: string;
  children: React.ReactNode;
}

/**
 * PageLayout - Wrapper che carica automaticamente SEO dal CMS
 * 
 * Uso:
 * ```tsx
 * export const ChiSiamoPage = () => (
 *   <PageLayout slug="chi-siamo" fallbackTitle="Chi Siamo">
 *     <div>...contenuto...</div>
 *   </PageLayout>
 * );
 * ```
 */
export const PageLayout: React.FC<PageLayoutProps> = ({
  slug,
  fallbackTitle,
  fallbackDescription,
  children,
}) => {
  const [seo, setSeo] = useState<PageSEO | null>(null);

  useEffect(() => {
    const loadSEO = async () => {
      const { data } = await supabase
        .from("cms_pages")
        .select("title, meta_description, meta_keywords")
        .eq("slug", slug)
        .single();

      if (data) {
        setSeo(data);
      }
    };

    loadSEO();
  }, [slug]);

  // Aggiorna document head con SEO
  useEffect(() => {
    // Title
    const title = seo?.title || fallbackTitle;
    document.title = `${title} | RentHubber`;

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
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (seo?.meta_keywords) {
      if (!metaKeywords) {
        metaKeywords = document.createElement("meta");
        metaKeywords.setAttribute("name", "keywords");
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute("content", seo.meta_keywords);
    }

    // Cleanup on unmount
    return () => {
      document.title = "RentHubber";
    };
  }, [seo, fallbackTitle, fallbackDescription]);

  return <>{children}</>;
};

export default PageLayout;