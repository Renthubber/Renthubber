import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../services/supabaseClient";
import {
  Globe,
  Palette,
  FileText,
  Menu,
  Upload,
  Save,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  ExternalLink,
  Image as ImageIcon,
  X,
  Check,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Mail,
  Phone,
  Link,
  Search,
  MoreVertical,
} from "lucide-react";

// ============================================
// TYPES
// ============================================
interface SiteBranding {
  id: string;
  site_name: string;
  logo_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
  footer_text: string;
  social_facebook: string | null;
  social_instagram: string | null;
  social_linkedin: string | null;
  social_twitter: string | null;
  contact_email: string;
  contact_phone: string | null;
  meta_title: string;
  meta_description: string;
  custom_css: string | null;
  custom_head_scripts: string | null;
}

interface CMSPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  status: "draft" | "published";
  meta_description: string | null;
  meta_keywords: string | null;
  featured_image: string | null;
  menu_location: "none" | "header" | "footer" | "both";
  menu_order: number;
  parent_id: string | null;
  is_system_page: boolean;
  page_template: string;
  created_at: string;
  updated_at: string;
}

interface CMSMenu {
  id: string;
  name: string;
  location: string;
}

interface CMSMenuItem {
  id: string;
  menu_id: string;
  title: string;
  url: string | null;
  page_id: string | null;
  parent_id: string | null;
  order_index: number;
  open_in_new_tab: boolean;
  is_active: boolean;
}

type TabType = "branding" | "pages" | "menus";

// ============================================
// MAIN COMPONENT
// ============================================
export const AdminCMSBranding: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("branding");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Branding state
  const [branding, setBranding] = useState<SiteBranding | null>(null);

  // Pages state
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [editingPage, setEditingPage] = useState<CMSPage | null>(null);
  const [showPageModal, setShowPageModal] = useState(false);
  const [pageSearch, setPageSearch] = useState("");

  // Menus state
  const [menus, setMenus] = useState<CMSMenu[]>([]);
  const [menuItems, setMenuItems] = useState<CMSMenuItem[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<CMSMenu | null>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<CMSMenuItem | null>(null);
  const [showMenuItemModal, setShowMenuItemModal] = useState(false);

  // ============================================
  // DATA LOADING
  // ============================================
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([loadBranding(), loadPages(), loadMenus()]);
    setLoading(false);
  };

  const loadBranding = async () => {
    const { data, error } = await supabase
      .from("site_branding")
      .select("*")
      .limit(1)
      .single();

    if (data && !error) {
      setBranding(data);
    }
  };

  const loadPages = async () => {
    const { data, error } = await supabase
      .from("cms_pages")
      .select("*")
      .order("menu_order", { ascending: true });

    if (data && !error) {
      setPages(data);
    }
  };

  const loadMenus = async () => {
    const { data: menusData } = await supabase
      .from("cms_menus")
      .select("*")
      .order("created_at");

    if (menusData) {
      setMenus(menusData);
      if (menusData.length > 0 && !selectedMenu) {
        setSelectedMenu(menusData[0]);
      }
    }

    const { data: itemsData } = await supabase
      .from("cms_menu_items")
      .select("*")
      .order("order_index");

    if (itemsData) {
      setMenuItems(itemsData);
    }
  };

  // ============================================
  // MESSAGE HELPER
  // ============================================
  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // ============================================
  // BRANDING HANDLERS
  // ============================================
  const handleBrandingChange = (field: keyof SiteBranding, value: string) => {
    if (branding) {
      setBranding({ ...branding, [field]: value });
    }
  };

  const handleImageUpload = async (
    file: File,
    field: "logo_url" | "logo_dark_url" | "favicon_url"
  ) => {
    if (!file || !branding) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `branding/${field.replace("_url", "")}_${Date.now()}.${fileExt}`;

    setSaving(true);

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      showMessage("error", "Errore upload: " + uploadError.message);
      setSaving(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("images")
      .getPublicUrl(fileName);

    if (urlData?.publicUrl) {
      setBranding({ ...branding, [field]: urlData.publicUrl });
      showMessage("success", "Immagine caricata con successo!");
    }

    setSaving(false);
  };

  const saveBranding = async () => {
    if (!branding) return;

    setSaving(true);

    const { error } = await supabase
      .from("site_branding")
      .update({
        ...branding,
        updated_at: new Date().toISOString(),
      })
      .eq("id", branding.id);

    if (error) {
      showMessage("error", "Errore salvataggio: " + error.message);
    } else {
      showMessage("success", "Branding salvato con successo!");
    }

    setSaving(false);
  };

  // ============================================
  // PAGES HANDLERS
  // ============================================
  const createNewPage = (): CMSPage => ({
    id: "",
    slug: "",
    title: "",
    content: "",
    status: "draft",
    meta_description: "",
    meta_keywords: "",
    featured_image: null,
    menu_location: "none",
    menu_order: pages.length,
    parent_id: null,
    is_system_page: false,
    page_template: "default",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const handlePageSave = async (page: CMSPage) => {
    setSaving(true);

    const pageData = {
      slug: page.slug,
      title: page.title,
      content: page.content,
      status: page.status,
      meta_description: page.meta_description,
      meta_keywords: page.meta_keywords,
      featured_image: page.featured_image,
      menu_location: page.menu_location,
      menu_order: page.menu_order,
      parent_id: page.parent_id,
      is_system_page: page.is_system_page,
      page_template: page.page_template,
      updated_at: new Date().toISOString(),
    };

    let error;

    if (page.id) {
      // Update
      const result = await supabase
        .from("cms_pages")
        .update(pageData)
        .eq("id", page.id);
      error = result.error;
    } else {
      // Insert
      const result = await supabase.from("cms_pages").insert({
        ...pageData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      });
      error = result.error;
    }

    if (error) {
      showMessage("error", "Errore salvataggio: " + error.message);
    } else {
      showMessage("success", "Pagina salvata con successo!");
      await loadPages();
      setShowPageModal(false);
      setEditingPage(null);
    }

    setSaving(false);
  };

  const handlePageDelete = async (pageId: string) => {
    if (!confirm("Sei sicuro di voler eliminare questa pagina?")) return;

    const { error } = await supabase.from("cms_pages").delete().eq("id", pageId);

    if (error) {
      showMessage("error", "Errore eliminazione: " + error.message);
    } else {
      showMessage("success", "Pagina eliminata!");
      await loadPages();
    }
  };

  const handlePageImageUpload = async (file: File, page: CMSPage) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `pages/${page.slug || "new"}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      showMessage("error", "Errore upload: " + uploadError.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("images")
      .getPublicUrl(fileName);

    return urlData?.publicUrl || null;
  };

  // ============================================
  // MENU HANDLERS
  // ============================================
  const createNewMenuItem = (): CMSMenuItem => ({
    id: "",
    menu_id: selectedMenu?.id || "",
    title: "",
    url: "",
    page_id: null,
    parent_id: null,
    order_index: menuItems.filter((i) => i.menu_id === selectedMenu?.id).length,
    open_in_new_tab: false,
    is_active: true,
  });

  const handleMenuItemSave = async (item: CMSMenuItem) => {
    setSaving(true);

    const itemData = {
      menu_id: item.menu_id,
      title: item.title,
      url: item.url,
      page_id: item.page_id,
      parent_id: item.parent_id,
      order_index: item.order_index,
      open_in_new_tab: item.open_in_new_tab,
      is_active: item.is_active,
    };

    let error;

    if (item.id) {
      const result = await supabase
        .from("cms_menu_items")
        .update(itemData)
        .eq("id", item.id);
      error = result.error;
    } else {
      const result = await supabase.from("cms_menu_items").insert({
        ...itemData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      });
      error = result.error;
    }

    if (error) {
      showMessage("error", "Errore salvataggio: " + error.message);
    } else {
      showMessage("success", "Voce menu salvata!");
      await loadMenus();
      setShowMenuItemModal(false);
      setEditingMenuItem(null);
    }

    setSaving(false);
  };

  const handleMenuItemDelete = async (itemId: string) => {
    if (!confirm("Eliminare questa voce del menu?")) return;

    const { error } = await supabase
      .from("cms_menu_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      showMessage("error", "Errore eliminazione: " + error.message);
    } else {
      showMessage("success", "Voce eliminata!");
      await loadMenus();
    }
  };

  // ============================================
  // FILTERED DATA
  // ============================================
  const filteredPages = pages.filter(
    (p) =>
      p.title.toLowerCase().includes(pageSearch.toLowerCase()) ||
      p.slug.toLowerCase().includes(pageSearch.toLowerCase())
  );

  const currentMenuItems = menuItems.filter(
    (i) => i.menu_id === selectedMenu?.id
  );

  // ============================================
  // RENDER
  // ============================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <span className="ml-3 text-gray-600">Caricamento CMS...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Message Toast */}
      {message && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {message.type === "success" ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Globe className="w-7 h-7 text-brand" />
          CMS & Branding
        </h2>
        <button
          onClick={loadAllData}
          className="p-2 text-gray-500 hover:text-brand hover:bg-gray-100 rounded-lg transition"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: "branding" as TabType, label: "Branding", icon: Palette },
          { id: "pages" as TabType, label: "Pagine", icon: FileText },
          { id: "menus" as TabType, label: "Menu", icon: Menu },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition ${
              activeTab === tab.id
                ? "border-brand text-brand"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        {/* ========== BRANDING TAB ========== */}
        {activeTab === "branding" && branding && (
          <div className="space-y-8">
            {/* Logo & Favicon */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-brand" />
                Logo & Favicon
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Logo */}
                <ImageUploadField
                  label="Logo Principale"
                  value={branding.logo_url}
                  onChange={(file) => handleImageUpload(file, "logo_url")}
                  onClear={() => handleBrandingChange("logo_url", "")}
                />
                {/* Logo Dark */}
                <ImageUploadField
                  label="Logo Scuro (per sfondi chiari)"
                  value={branding.logo_dark_url}
                  onChange={(file) => handleImageUpload(file, "logo_dark_url")}
                  onClear={() => handleBrandingChange("logo_dark_url", "")}
                />
                {/* Favicon */}
                <ImageUploadField
                  label="Favicon (32x32 o 64x64)"
                  value={branding.favicon_url}
                  onChange={(file) => handleImageUpload(file, "favicon_url")}
                  onClear={() => handleBrandingChange("favicon_url", "")}
                  small
                />
              </div>
            </section>

            {/* Colors */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-brand" />
                Colori Brand
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <ColorPickerField
                  label="Primario"
                  value={branding.primary_color}
                  onChange={(v) => handleBrandingChange("primary_color", v)}
                />
                <ColorPickerField
                  label="Secondario"
                  value={branding.secondary_color}
                  onChange={(v) => handleBrandingChange("secondary_color", v)}
                />
                <ColorPickerField
                  label="Accent"
                  value={branding.accent_color}
                  onChange={(v) => handleBrandingChange("accent_color", v)}
                />
                <ColorPickerField
                  label="Testo"
                  value={branding.text_color}
                  onChange={(v) => handleBrandingChange("text_color", v)}
                />
                <ColorPickerField
                  label="Sfondo"
                  value={branding.background_color}
                  onChange={(v) => handleBrandingChange("background_color", v)}
                />
              </div>

              {/* Color Preview */}
              <div className="mt-4 p-4 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Anteprima colori:</p>
                <div className="flex gap-2">
                  <div
                    className="w-16 h-10 rounded-lg shadow-sm border"
                    style={{ backgroundColor: branding.primary_color }}
                  />
                  <div
                    className="w-16 h-10 rounded-lg shadow-sm border"
                    style={{ backgroundColor: branding.secondary_color }}
                  />
                  <div
                    className="w-16 h-10 rounded-lg shadow-sm border"
                    style={{ backgroundColor: branding.accent_color }}
                  />
                  <div
                    className="flex-1 h-10 rounded-lg shadow-sm border flex items-center px-3"
                    style={{
                      backgroundColor: branding.background_color,
                      color: branding.text_color,
                    }}
                  >
                    <span className="text-sm">Testo di esempio</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Site Info */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-brand" />
                Informazioni Sito
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Nome Sito"
                  value={branding.site_name}
                  onChange={(v) => handleBrandingChange("site_name", v)}
                />
                <InputField
                  label="Meta Title (SEO)"
                  value={branding.meta_title}
                  onChange={(v) => handleBrandingChange("meta_title", v)}
                />
                <div className="md:col-span-2">
                  <InputField
                    label="Meta Description (SEO)"
                    value={branding.meta_description}
                    onChange={(v) => handleBrandingChange("meta_description", v)}
                    textarea
                  />
                </div>
                <div className="md:col-span-2">
                  <InputField
                    label="Testo Footer"
                    value={branding.footer_text}
                    onChange={(v) => handleBrandingChange("footer_text", v)}
                  />
                </div>
              </div>
            </section>

            {/* Contact & Social */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-brand" />
                Contatti & Social
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Email Contatto"
                  value={branding.contact_email}
                  onChange={(v) => handleBrandingChange("contact_email", v)}
                  icon={<Mail className="w-4 h-4" />}
                />
                <InputField
                  label="Telefono"
                  value={branding.contact_phone || ""}
                  onChange={(v) => handleBrandingChange("contact_phone", v)}
                  icon={<Phone className="w-4 h-4" />}
                />
                <InputField
                  label="Facebook"
                  value={branding.social_facebook || ""}
                  onChange={(v) => handleBrandingChange("social_facebook", v)}
                  icon={<Facebook className="w-4 h-4" />}
                  placeholder="https://facebook.com/..."
                />
                <InputField
                  label="Instagram"
                  value={branding.social_instagram || ""}
                  onChange={(v) => handleBrandingChange("social_instagram", v)}
                  icon={<Instagram className="w-4 h-4" />}
                  placeholder="https://instagram.com/..."
                />
                <InputField
                  label="LinkedIn"
                  value={branding.social_linkedin || ""}
                  onChange={(v) => handleBrandingChange("social_linkedin", v)}
                  icon={<Linkedin className="w-4 h-4" />}
                  placeholder="https://linkedin.com/..."
                />
                <InputField
                  label="Twitter/X"
                  value={branding.social_twitter || ""}
                  onChange={(v) => handleBrandingChange("social_twitter", v)}
                  icon={<Twitter className="w-4 h-4" />}
                  placeholder="https://twitter.com/..."
                />
              </div>
            </section>

            {/* Advanced */}
            <section>
              <details className="group">
                <summary className="cursor-pointer text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ChevronDown className="w-5 h-5 text-brand group-open:rotate-180 transition-transform" />
                  Avanzate (CSS/Script)
                </summary>
                <div className="mt-4 space-y-4">
                  <InputField
                    label="CSS Personalizzato"
                    value={branding.custom_css || ""}
                    onChange={(v) => handleBrandingChange("custom_css", v)}
                    textarea
                    rows={6}
                    placeholder=".my-class { color: red; }"
                  />
                  <InputField
                    label="Script Head (es. Analytics)"
                    value={branding.custom_head_scripts || ""}
                    onChange={(v) =>
                      handleBrandingChange("custom_head_scripts", v)
                    }
                    textarea
                    rows={6}
                    placeholder="<!-- Google Analytics -->"
                  />
                </div>
              </details>
            </section>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={saveBranding}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand text-white rounded-xl font-semibold hover:bg-brand-dark transition disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Salva Branding
              </button>
            </div>
          </div>
        )}

        {/* ========== PAGES TAB ========== */}
        {activeTab === "pages" && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={pageSearch}
                  onChange={(e) => setPageSearch(e.target.value)}
                  placeholder="Cerca pagine..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                />
              </div>
              <button
                onClick={() => {
                  setEditingPage(createNewPage());
                  setShowPageModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand-dark transition"
              >
                <Plus className="w-4 h-4" />
                Nuova Pagina
              </button>
            </div>

            {/* Pages List */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-700 font-semibold">
                  <tr>
                    <th className="p-4">Titolo</th>
                    <th className="p-4">Slug</th>
                    <th className="p-4">Stato</th>
                    <th className="p-4">Menu</th>
                    <th className="p-4 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPages.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        Nessuna pagina trovata
                      </td>
                    </tr>
                  ) : (
                    filteredPages.map((page) => (
                      <tr
                        key={page.id}
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        <td className="p-4 font-medium text-gray-900">
                          {page.title}
                          {page.is_system_page && (
                            <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                              Sistema
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-gray-500 font-mono text-xs">
                          /{page.slug}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              page.status === "published"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {page.status === "published"
                              ? "Pubblicata"
                              : "Bozza"}
                          </span>
                        </td>
                        <td className="p-4 text-gray-500 text-xs">
                          {page.menu_location === "none"
                            ? "-"
                            : page.menu_location}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingPage(page);
                                setShowPageModal(true);
                              }}
                              className="p-2 text-gray-500 hover:text-brand hover:bg-brand/10 rounded-lg transition"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <a
                              href={`/${page.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            {!page.is_system_page && (
                              <button
                                onClick={() => handlePageDelete(page.id)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========== MENUS TAB ========== */}
        {activeTab === "menus" && (
          <div className="space-y-4">
            {/* Menu Selector */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex gap-2">
                {menus.map((menu) => (
                  <button
                    key={menu.id}
                    onClick={() => setSelectedMenu(menu)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      selectedMenu?.id === menu.id
                        ? "bg-brand text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {menu.name}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setEditingMenuItem(createNewMenuItem());
                  setShowMenuItemModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand-dark transition"
              >
                <Plus className="w-4 h-4" />
                Aggiungi Voce
              </button>
            </div>

            {/* Menu Items List */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              {currentMenuItems.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Nessuna voce in questo menu
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {currentMenuItems
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-gray-300 cursor-grab" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.url ||
                                pages.find((p) => p.id === item.page_id)?.slug ||
                                "-"}
                              {item.open_in_new_tab && (
                                <span className="ml-2 text-blue-500">
                                  (nuova tab)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              item.is_active ? "bg-green-500" : "bg-gray-300"
                            }`}
                          />
                          <button
                            onClick={() => {
                              setEditingMenuItem(item);
                              setShowMenuItemModal(true);
                            }}
                            className="p-2 text-gray-500 hover:text-brand hover:bg-brand/10 rounded-lg transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMenuItemDelete(item.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========== PAGE MODAL ========== */}
      {showPageModal && editingPage && (
        <PageEditorModal
          page={editingPage}
          pages={pages}
          onSave={handlePageSave}
          onClose={() => {
            setShowPageModal(false);
            setEditingPage(null);
          }}
          onImageUpload={handlePageImageUpload}
          saving={saving}
        />
      )}

      {/* ========== MENU ITEM MODAL ========== */}
      {showMenuItemModal && editingMenuItem && (
        <MenuItemModal
          item={editingMenuItem}
          pages={pages}
          onSave={handleMenuItemSave}
          onClose={() => {
            setShowMenuItemModal(false);
            setEditingMenuItem(null);
          }}
          saving={saving}
        />
      )}
    </div>
  );
};

// ============================================
// SUB-COMPONENTS
// ============================================

// Image Upload Field
const ImageUploadField: React.FC<{
  label: string;
  value: string | null;
  onChange: (file: File) => void;
  onClear: () => void;
  small?: boolean;
}> = ({ label, value, onChange, onClear, small }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div
        className={`relative border-2 border-dashed border-gray-300 rounded-xl hover:border-brand transition cursor-pointer ${
          small ? "h-24 w-24" : "h-32"
        }`}
        onClick={() => inputRef.current?.click()}
      >
        {value ? (
          <>
            <img
              src={value}
              alt={label}
              className="w-full h-full object-contain rounded-xl"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Upload className="w-6 h-6 mb-1" />
            <span className="text-xs">Carica</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])}
          className="hidden"
        />
      </div>
    </div>
  );
};

// Color Picker Field
const ColorPickerField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-brand outline-none"
      />
    </div>
  </div>
);

// Input Field
const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  rows?: number;
  placeholder?: string;
  icon?: React.ReactNode;
}> = ({ label, value, onChange, textarea, rows = 3, placeholder, icon }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </span>
      )}
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none ${
            icon ? "pl-10 pr-4" : "px-4"
          }`}
        />
      )}
    </div>
  </div>
);

// Page Editor Modal
const PageEditorModal: React.FC<{
  page: CMSPage;
  pages: CMSPage[];
  onSave: (page: CMSPage) => void;
  onClose: () => void;
  onImageUpload: (file: File, page: CMSPage) => Promise<string | null>;
  saving: boolean;
}> = ({ page, pages, onSave, onClose, onImageUpload, saving }) => {
  const [localPage, setLocalPage] = useState<CMSPage>(page);
  const [activeSection, setActiveSection] = useState<"content" | "seo" | "settings">("content");

  const handleChange = (field: keyof CMSPage, value: any) => {
    setLocalPage((prev) => ({ ...prev, [field]: value }));
  };

  const handleSlugify = () => {
    const slug = localPage.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    handleChange("slug", slug);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">
            {page.id ? "Modifica Pagina" : "Nuova Pagina"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-4 pt-4 border-b border-gray-200">
          {[
            { id: "content" as const, label: "Contenuto" },
            { id: "seo" as const, label: "SEO" },
            { id: "settings" as const, label: "Impostazioni" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                activeSection === tab.id
                  ? "border-brand text-brand"
                  : "border-transparent text-gray-500"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSection === "content" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <InputField
                    label="Titolo"
                    value={localPage.title}
                    onChange={(v) => handleChange("title", v)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug (URL)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={localPage.slug}
                      onChange={(e) => handleChange("slug", e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none font-mono text-sm"
                    />
                    <button
                      onClick={handleSlugify}
                      className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm"
                    >
                      Auto
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenuto (HTML)
                </label>
                <textarea
                  value={localPage.content}
                  onChange={(e) => handleChange("content", e.target.value)}
                  rows={15}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none font-mono text-sm resize-none"
                  placeholder="<h1>Titolo</h1><p>Contenuto della pagina...</p>"
                />
              </div>
            </div>
          )}

          {activeSection === "seo" && (
            <div className="space-y-4">
              <InputField
                label="Meta Description"
                value={localPage.meta_description || ""}
                onChange={(v) => handleChange("meta_description", v)}
                textarea
                rows={3}
                placeholder="Descrizione della pagina per i motori di ricerca (max 160 caratteri)"
              />
              <InputField
                label="Meta Keywords"
                value={localPage.meta_keywords || ""}
                onChange={(v) => handleChange("meta_keywords", v)}
                placeholder="parola1, parola2, parola3"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Immagine Featured
                </label>
                <ImageUploadField
                  label=""
                  value={localPage.featured_image}
                  onChange={async (file) => {
                    const url = await onImageUpload(file, localPage);
                    if (url) handleChange("featured_image", url);
                  }}
                  onClear={() => handleChange("featured_image", null)}
                />
              </div>
            </div>
          )}

          {activeSection === "settings" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stato
                  </label>
                  <select
                    value={localPage.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  >
                    <option value="draft">Bozza</option>
                    <option value="published">Pubblicata</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Posizione Menu
                  </label>
                  <select
                    value={localPage.menu_location}
                    onChange={(e) => handleChange("menu_location", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  >
                    <option value="none">Nessuno</option>
                    <option value="header">Header</option>
                    <option value="footer">Footer</option>
                    <option value="both">Entrambi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ordine Menu
                  </label>
                  <input
                    type="number"
                    value={localPage.menu_order}
                    onChange={(e) =>
                      handleChange("menu_order", parseInt(e.target.value) || 0)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template
                  </label>
                  <select
                    value={localPage.page_template}
                    onChange={(e) => handleChange("page_template", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                  >
                    <option value="default">Default</option>
                    <option value="full-width">Full Width</option>
                    <option value="sidebar">Con Sidebar</option>
                    <option value="landing">Landing Page</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pagina Genitore
                </label>
                <select
                  value={localPage.parent_id || ""}
                  onChange={(e) =>
                    handleChange("parent_id", e.target.value || null)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
                >
                  <option value="">Nessuna (root)</option>
                  {pages
                    .filter((p) => p.id !== localPage.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition"
          >
            Annulla
          </button>
          <button
            onClick={() => onSave(localPage)}
            disabled={saving || !localPage.title || !localPage.slug}
            className="flex items-center gap-2 px-6 py-2 bg-brand text-white rounded-lg font-semibold hover:bg-brand-dark transition disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salva Pagina
          </button>
        </div>
      </div>
    </div>
  );
};

// Menu Item Modal
const MenuItemModal: React.FC<{
  item: CMSMenuItem;
  pages: CMSPage[];
  onSave: (item: CMSMenuItem) => void;
  onClose: () => void;
  saving: boolean;
}> = ({ item, pages, onSave, onClose, saving }) => {
  const [localItem, setLocalItem] = useState<CMSMenuItem>(item);
  const [linkType, setLinkType] = useState<"url" | "page">(
    item.page_id ? "page" : "url"
  );

  const handleChange = (field: keyof CMSMenuItem, value: any) => {
    setLocalItem((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">
            {item.id ? "Modifica Voce" : "Nuova Voce Menu"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <InputField
            label="Titolo"
            value={localItem.title}
            onChange={(v) => handleChange("title", v)}
            placeholder="es. Chi Siamo"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo Link
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setLinkType("url");
                  handleChange("page_id", null);
                }}
                className={`flex-1 py-2 rounded-lg font-medium transition ${
                  linkType === "url"
                    ? "bg-brand text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                URL Esterno
              </button>
              <button
                onClick={() => {
                  setLinkType("page");
                  handleChange("url", null);
                }}
                className={`flex-1 py-2 rounded-lg font-medium transition ${
                  linkType === "page"
                    ? "bg-brand text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Pagina Interna
              </button>
            </div>
          </div>

          {linkType === "url" ? (
            <InputField
              label="URL"
              value={localItem.url || ""}
              onChange={(v) => handleChange("url", v)}
              placeholder="https://..."
              icon={<Link className="w-4 h-4" />}
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pagina
              </label>
              <select
                value={localItem.page_id || ""}
                onChange={(e) => handleChange("page_id", e.target.value || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
              >
                <option value="">Seleziona una pagina</option>
                {pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} (/{p.slug})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordine
              </label>
              <input
                type="number"
                value={localItem.order_index}
                onChange={(e) =>
                  handleChange("order_index", parseInt(e.target.value) || 0)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localItem.open_in_new_tab}
                  onChange={(e) =>
                    handleChange("open_in_new_tab", e.target.checked)
                  }
                  className="w-4 h-4 text-brand rounded"
                />
                <span className="text-sm text-gray-700">Apri in nuova tab</span>
              </label>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localItem.is_active}
              onChange={(e) => handleChange("is_active", e.target.checked)}
              className="w-4 h-4 text-brand rounded"
            />
            <span className="text-sm text-gray-700">Attivo</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition"
          >
            Annulla
          </button>
          <button
            onClick={() => onSave(localItem)}
            disabled={saving || !localItem.title}
            className="flex items-center gap-2 px-6 py-2 bg-brand text-white rounded-lg font-semibold hover:bg-brand-dark transition disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salva
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminCMSBranding;