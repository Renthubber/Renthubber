import { supabase } from "../services/supabaseClient";

/**
 * CMS Service - Gestione Branding e Pagine CMS
 */

// ========== TYPES ==========

export interface BrandingSettings {
  logoUrl?: string;
  siteName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  favicon?: string;
  metaDescription?: string;
}

export interface PageContent {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
}

// ========== BRANDING ==========

export async function getBranding(): Promise<BrandingSettings | null> {
  try {
    const { data, error } = await supabase
      .from('cms_settings')
      .select('value')
      .eq('type', 'branding')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Non trovato
      throw error;
    }
    
    return data?.value as BrandingSettings;
  } catch (error) {
    console.error('Errore caricamento branding:', error);
    return null;
  }
}

export async function updateBranding(branding: BrandingSettings): Promise<void> {
  const { data: existing } = await supabase
    .from('cms_settings')
    .select('id')
    .eq('type', 'branding')
    .single();
  
  if (existing) {
    // Update
    const { error } = await supabase
      .from('cms_settings')
      .update({ 
        value: branding,
        updated_at: new Date().toISOString()
      })
      .eq('type', 'branding');
    
    if (error) throw error;
  } else {
    // Insert
    const { error } = await supabase
      .from('cms_settings')
      .insert({
        type: 'branding',
        value: branding
      });
    
    if (error) throw error;
  }
}

// ========== PAGES ==========

export async function getPages(): Promise<PageContent[]> {
  try {
    const { data, error } = await supabase
      .from('cms_settings')
      .select('value')
      .eq('type', 'pages')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return []; // Non trovato
      throw error;
    }
    
    return (data?.value as PageContent[]) || [];
  } catch (error) {
    console.error('Errore caricamento pagine:', error);
    return [];
  }
}

export async function updatePages(pages: PageContent[]): Promise<void> {
  const { data: existing } = await supabase
    .from('cms_settings')
    .select('id')
    .eq('type', 'pages')
    .single();
  
  if (existing) {
    // Update
    const { error } = await supabase
      .from('cms_settings')
      .update({ 
        value: pages,
        updated_at: new Date().toISOString()
      })
      .eq('type', 'pages');
    
    if (error) throw error;
  } else {
    // Insert
    const { error } = await supabase
      .from('cms_settings')
      .insert({
        type: 'pages',
        value: pages
      });
    
    if (error) throw error;
  }
}

export async function updatePage(page: PageContent): Promise<void> {
  const pages = await getPages();
  const index = pages.findIndex(p => p.id === page.id);
  
  if (index >= 0) {
    pages[index] = page;
  } else {
    pages.push(page);
  }
  
  await updatePages(pages);
}