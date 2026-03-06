import { useState, useEffect, useRef, type ReactElement } from 'react';
import {
  Plus, Edit, Trash2, Eye, EyeOff, Search, X, Save,
  Bold, Italic, Heading2, Heading3, List, ListOrdered,
  Quote, Link as LinkIcon, Image as ImageIcon, ExternalLink,
  Clock, Tag, Users, ChevronDown, Loader2,
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

// ─── TIPI ────────────────────────────────────────────────────
interface BlogPost {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  cover_url: string;
  category: string;
  audience: string;
  tags: string[];
  author_name: string;
  author_avatar?: string;
  published: boolean;
  featured: boolean;
  views: number;
  read_minutes: number;
}

type FormData = Omit<BlogPost, 'id' | 'created_at' | 'updated_at' | 'views'>;

// ─── COSTANTI ────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'inizia-subito',   label: 'Inizia subito'      },
  { id: 'cosa-noleggiare', label: 'Cosa noleggiare'     },
  { id: 'prezzi-e-trend',  label: 'Prezzi e Trend'      },
  { id: 'consigli-hubber', label: 'Consigli Hubber'     },
  { id: 'consigli-renter', label: 'Consigli Renter'     },
  { id: 'storie-successo', label: 'Storie di successo'  },
  { id: 'novita',          label: 'Novità'              },
];

const AUDIENCES = [
  { id: 'tutti',   label: 'Tutti (Hubber + Renter)' },
  { id: 'hubber',  label: 'Solo Hubber'             },
  { id: 'renter',  label: 'Solo Renter'             },
];

const EMPTY_FORM: FormData = {
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  cover_url: '',
  category: 'consigli-hubber',
  audience: 'tutti',
  tags: [],
  author_name: 'Team RentHubber',
  author_avatar: '',
  published: false,
  featured: false,
  read_minutes: 3,
};

// ─── UTILS ───────────────────────────────────────────────────
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[àáâã]/g, 'a').replace(/[èéê]/g, 'e')
    .replace(/[ìíî]/g, 'i').replace(/[òóô]/g, 'o')
    .replace(/[ùúû]/g, 'u').replace(/ç/g, 'c').replace(/ñ/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

function estimateReadTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, '');
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

// ─── RICH TEXT EDITOR ────────────────────────────────────────
function RichTextEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (editorRef.current && isFirstRender.current) {
      editorRef.current.innerHTML = value;
      isFirstRender.current = false;
    }
  }, []);

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
    editorRef.current?.focus();
  };

  const insertBlock = (tag: string) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const el = document.createElement(tag);
    el.innerHTML = sel.toString() || 'Testo qui';
    range.deleteContents();
    range.insertNode(el);
    range.setStartAfter(el);
    sel.removeAllRanges();
    sel.addRange(range);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const insertLink = () => {
    const url = prompt('URL del link:');
    if (url) exec('createLink', url);
  };

  const insertImage = () => {
    const url = prompt('URL immagine:');
    if (url) exec('insertImage', url);
  };

  const toolbarBtn = (onClick: () => void, icon: ReactElement, title: string) => (
    <button
      type="button" title={title} onClick={onClick}
      style={{ width: 32, height: 32, border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0D414B', flexShrink: 0 }}
      onMouseEnter={e => (e.currentTarget.style.background = '#f0fdfa')}
      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
    >
      {icon}
    </button>
  );

  return (
    <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '10px 12px', background: '#f8fafb', borderBottom: '1px solid #e2e8f0' }}>
        {toolbarBtn(() => exec('bold'),           <Bold size={14} />,         'Grassetto')}
        {toolbarBtn(() => exec('italic'),         <Italic size={14} />,       'Corsivo')}
        <div style={{ width: 1, background: '#e2e8f0', margin: '0 4px' }} />
        {toolbarBtn(() => insertBlock('h2'),      <Heading2 size={14} />,     'Titolo H2')}
        {toolbarBtn(() => insertBlock('h3'),      <Heading3 size={14} />,     'Titolo H3')}
        <div style={{ width: 1, background: '#e2e8f0', margin: '0 4px' }} />
        {toolbarBtn(() => exec('insertUnorderedList'), <List size={14} />,    'Lista puntata')}
        {toolbarBtn(() => exec('insertOrderedList'),   <ListOrdered size={14} />, 'Lista numerata')}
        {toolbarBtn(() => insertBlock('blockquote'),   <Quote size={14} />,   'Citazione')}
        <div style={{ width: 1, background: '#e2e8f0', margin: '0 4px' }} />
        {toolbarBtn(insertLink,                   <LinkIcon size={14} />,     'Inserisci link')}
        {toolbarBtn(insertImage,                  <ImageIcon size={14} />,    'Inserisci immagine')}
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => { if (editorRef.current) onChange(editorRef.current.innerHTML); }}
        style={{
          minHeight: 320, padding: 20, outline: 'none',
          fontSize: 15, lineHeight: 1.75, color: '#374151',
          fontFamily: "'DM Sans', sans-serif",
        }}
      />

      <style>{`
        [contenteditable] h2 { font-size: 22px; font-weight: 800; color: #0D414B; margin: 24px 0 12px; }
        [contenteditable] h3 { font-size: 18px; font-weight: 700; color: #0D414B; margin: 18px 0 10px; }
        [contenteditable] p  { margin-bottom: 14px; }
        [contenteditable] ul, [contenteditable] ol { padding-left: 24px; margin-bottom: 14px; }
        [contenteditable] li { margin-bottom: 6px; }
        [contenteditable] blockquote { border-left: 4px solid #3DD9D0; padding: 12px 16px; background: rgba(61,217,208,.06); border-radius: 0 8px 8px 0; margin: 16px 0; color: #0D414B; font-style: italic; }
        [contenteditable] img { max-width: 100%; border-radius: 10px; margin: 12px 0; }
        [contenteditable] a { color: #0D414B; text-decoration: underline; }
      `}</style>
    </div>
  );
}

// ─── FORM MODALE ─────────────────────────────────────────────
function PostForm({
  post,
  onSave,
  onClose,
}: {
  post: BlogPost | null;
  onSave: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormData>(post ? {
    title: post.title, slug: post.slug, excerpt: post.excerpt, body: post.body,
    cover_url: post.cover_url || '', category: post.category, audience: post.audience || 'tutti',
    tags: post.tags || [], author_name: post.author_name, author_avatar: post.author_avatar || '',
    published: post.published, featured: post.featured, read_minutes: post.read_minutes,
  } : EMPTY_FORM);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [slugManual, setSlugManual] = useState(!!post);
  const [activeSection, setActiveSection] = useState<'contenuto' | 'meta' | 'impostazioni'>('contenuto');

  const set = (k: keyof FormData, v: any) => setForm(f => ({ ...f, [k]: v }));

  // Auto-slug da titolo
  useEffect(() => {
    if (!slugManual && form.title) set('slug', generateSlug(form.title));
  }, [form.title, slugManual]);

  // Auto read time
  useEffect(() => {
    set('read_minutes', estimateReadTime(form.body));
  }, [form.body]);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !form.tags.includes(t)) set('tags', [...form.tags, t]);
    setTagInput('');
  };

  const removeTag = (t: string) => set('tags', form.tags.filter(x => x !== t));

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Il titolo è obbligatorio'); return; }
    if (!form.slug.trim())  { setError('Lo slug è obbligatorio'); return; }
    if (!form.body.trim())  { setError('Il contenuto è obbligatorio'); return; }
    setSaving(true); setError('');
    try {
      if (post) {
        const { error: err } = await supabase.from('blog_posts').update({ ...form, updated_at: new Date().toISOString() }).eq('id', post.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('blog_posts').insert([form]);
        if (err) throw err;
      }
      onSave();
    } catch (e: any) {
      setError(e.message || 'Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const sectionBtn = (id: typeof activeSection, label: string) => (
    <button
      type="button"
      onClick={() => setActiveSection(id)}
      style={{
        padding: '8px 20px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
        fontFamily: 'inherit', cursor: 'pointer',
        background: activeSection === id ? '#0D414B' : 'transparent',
        color: activeSection === id ? '#fff' : '#64748b',
      }}
    >
      {label}
    </button>
  );

  const inputStyle = {
    width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0',
    borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none',
    background: '#fafafa', color: '#1a202c',
  };

  const labelStyle = { fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: .5, display: 'block', marginBottom: 6 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 860, marginTop: 20, marginBottom: 20 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0D414B' }}>
            {post ? '✏️ Modifica articolo' : '✦ Nuovo articolo'}
          </h2>
          <button onClick={onClose} style={{ width: 34, height: 34, border: '1.5px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} color="#64748b" />
          </button>
        </div>

        {/* Section tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '12px 28px', borderBottom: '1px solid #f1f5f9', background: '#f8fafb' }}>
          {sectionBtn('contenuto',    '📝 Contenuto')}
          {sectionBtn('meta',         '🔍 SEO & Meta')}
          {sectionBtn('impostazioni', '⚙️ Impostazioni')}
        </div>

        <div style={{ padding: '28px' }}>

          {/* ── CONTENUTO ── */}
          {activeSection === 'contenuto' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelStyle}>Titolo *</label>
                <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Titolo dell'articolo" />
              </div>
              <div>
                <label style={labelStyle}>Estratto / Anteprima</label>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} value={form.excerpt} onChange={e => set('excerpt', e.target.value)} placeholder="Breve descrizione (max 200 caratteri, appare nelle card)" maxLength={220} />
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{form.excerpt.length}/220</span>
              </div>
              <div>
                <label style={labelStyle}>Contenuto *</label>
                <RichTextEditor value={form.body} onChange={v => set('body', v)} />
              </div>
            </div>
          )}

          {/* ── META ── */}
          {activeSection === 'meta' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelStyle}>Slug URL *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    value={form.slug}
                    onChange={e => { set('slug', e.target.value); setSlugManual(true); }}
                    placeholder="url-articolo"
                  />
                  <button type="button" onClick={() => { set('slug', generateSlug(form.title)); setSlugManual(false); }}
                    style={{ padding: '0 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 12, fontWeight: 600, color: '#64748b', background: '#f8fafb', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    Auto
                  </button>
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  URL: renthubber.com/risorse/{form.slug || '...'}
                </p>
              </div>
              <div>
                <label style={labelStyle}>Immagine copertina</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    value={form.cover_url}
                    onChange={e => set('cover_url', e.target.value)}
                    placeholder="Incolla URL oppure carica file →"
                  />
                  <label style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '0 16px', background: '#0D414B', color: '#fff',
                    borderRadius: 10, fontSize: 13, fontWeight: 700,
                    cursor: uploadingImage ? 'not-allowed' : 'pointer',
                    opacity: uploadingImage ? .6 : 1, whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    <ImageIcon size={14} />
                    {uploadingImage ? 'Caricamento…' : 'Carica foto'}
                    <input
                      type="file" accept="image/*" style={{ display: 'none' }}
                      disabled={uploadingImage}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingImage(true);
                        try {
                          const ext = file.name.split('.').pop();
                          const path = `blog/${Date.now()}.${ext}`;
                          const { error } = await supabase.storage.from('images').upload(path, file, { upsert: true });
                          if (error) throw error;
                          const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);
                          set('cover_url', urlData.publicUrl);
                        } catch (err: any) {
                          alert('Errore upload: ' + err.message);
                        } finally {
                          setUploadingImage(false);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                </div>
                {form.cover_url && (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={form.cover_url} alt="preview"
                      style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 10, border: '1px solid #e2e8f0' }}
                      onError={e => ((e.target as HTMLImageElement).style.display = 'none')}
                    />
                    <button
                      type="button" onClick={() => set('cover_url', '')}
                      style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,.5)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <X size={13} color="#fff" />
                    </button>
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Autore</label>
                  <input style={inputStyle} value={form.author_name} onChange={e => set('author_name', e.target.value)} placeholder="Team RentHubber" />
                </div>
                <div>
                  <label style={labelStyle}>Tempo di lettura (min)</label>
                  <input type="number" style={inputStyle} value={form.read_minutes} min={1} max={60} onChange={e => set('read_minutes', Number(e.target.value))} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Tag</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input style={{ ...inputStyle, flex: 1 }} value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="es. ebike, guadagni…" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                  <button type="button" onClick={addTag}
                    style={{ padding: '0 16px', background: '#0D414B', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    + Aggiungi
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {form.tags.map(t => (
                    <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#f1f5f9', borderRadius: 99, fontSize: 12, fontWeight: 600, color: '#475569' }}>
                      #{t}
                      <button type="button" onClick={() => removeTag(t)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', color: '#94a3b8' }}>
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── IMPOSTAZIONI ── */}
          {activeSection === 'impostazioni' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Categoria</label>
                  <select style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }} value={form.category} onChange={e => set('category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Audience</label>
                  <select style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }} value={form.audience} onChange={e => set('audience', e.target.value)}>
                    {AUDIENCES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['published', '🟢 Pubblicato', 'Se spento, l\'articolo è in bozza e non visibile pubblicamente'],
                  ['featured', '⭐ In evidenza', 'Appare in cima alla pagina risorse con card grande'],
                ].map(([key, label, desc]) => (
                  <div key={key as string} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#f8fafb', borderRadius: 12, border: '1.5px solid #f1f5f9' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0D414B' }}>{label}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{desc}</div>
                    </div>
                    <div
                      onClick={() => set(key as keyof FormData, !form[key as keyof FormData])}
                      style={{
                        width: 44, height: 24, borderRadius: 99, cursor: 'pointer', position: 'relative', flexShrink: 0,
                        background: form[key as keyof FormData] ? '#0D414B' : '#e2e8f0',
                        transition: 'background .2s',
                      }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', background: '#fff',
                        position: 'absolute', top: 3, transition: 'left .2s',
                        left: form[key as keyof FormData] ? 23 : 3,
                        boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#dc2626', fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
            {form.slug && (
              <a href={`/risorse/${form.slug}`} target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 18px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#64748b', textDecoration: 'none', background: '#fff' }}>
                <ExternalLink size={14} /> Anteprima
              </a>
            )}
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#64748b', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
              Annulla
            </button>
            <button type="button" onClick={handleSave} disabled={saving}
              style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#0D414B', background: '#3DD9D0', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? .7 : 1 }}>
              <Save size={16} /> {saving ? 'Salvataggio…' : post ? 'Salva modifiche' : 'Pubblica articolo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPALE ───────────────────────────────────
export function AdminRisorse() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('tutti');
  const [filterStatus, setFilterStatus] = useState<'tutti' | 'pubblicati' | 'bozze'>('tutti');
  const [editingPost, setEditingPost] = useState<BlogPost | null | undefined>(undefined); // undefined = chiuso, null = nuovo
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { fetchPosts(); }, []);

  async function fetchPosts() {
    setLoading(true);
    const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
    setPosts(data || []);
    setLoading(false);
  }

  async function togglePublish(post: BlogPost) {
    await supabase.from('blog_posts').update({ published: !post.published }).eq('id', post.id);
    fetchPosts();
  }

  async function deletePost(id: string) {
    if (!window.confirm('Eliminare questo articolo? L\'azione è irreversibile.')) return;
    setDeleting(id);
    await supabase.from('blog_posts').delete().eq('id', id);
    fetchPosts();
    setDeleting(null);
  }

  const filtered = posts.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.category.includes(search.toLowerCase());
    const matchCat = filterCat === 'tutti' || p.category === filterCat;
    const matchStatus = filterStatus === 'tutti' || (filterStatus === 'pubblicati' ? p.published : !p.published);
    return matchSearch && matchCat && matchStatus;
  });

  const stats = {
    total: posts.length,
    published: posts.filter(p => p.published).length,
    featured: posts.filter(p => p.featured).length,
    views: posts.reduce((s, p) => s + (p.views || 0), 0),
  };

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0D414B' }}>📰 Centro Risorse</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Gestisci articoli, guide e post per hubber e renter</p>
        </div>
        <button
          onClick={() => setEditingPost(null)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#3DD9D0', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#0D414B', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <Plus size={16} /> Nuovo articolo
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          ['Totale articoli', stats.total, '📄'],
          ['Pubblicati',      stats.published, '🟢'],
          ['In evidenza',     stats.featured, '⭐'],
          ['Visualizzazioni', stats.views.toLocaleString('it-IT'), '👁️'],
        ].map(([label, value, icon]) => (
          <div key={label as string} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '16px 20px' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0D414B' }}>{value}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filtri */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cerca articolo…"
            style={{ width: '100%', padding: '10px 14px 10px 36px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff' }}
          />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          style={{ padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', color: '#475569', cursor: 'pointer' }}>
          <option value="tutti">Tutte le categorie</option>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
          style={{ padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', color: '#475569', cursor: 'pointer' }}>
          <option value="tutti">Tutti gli stati</option>
          <option value="pubblicati">Pubblicati</option>
          <option value="bozze">Bozze</option>
        </select>
      </div>

      {/* Lista articoli */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
          <p>Nessun articolo trovato</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(post => (
            <div key={post.id} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Cover thumbnail */}
              <div style={{ width: 64, height: 48, borderRadius: 8, background: post.cover_url ? `url(${post.cover_url}) center/cover` : '#f1f5f9', flexShrink: 0 }} />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#0D414B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {post.title}
                  </span>
                  {post.featured && <span style={{ fontSize: 10, padding: '2px 8px', background: '#fefce8', color: '#a16207', borderRadius: 99, fontWeight: 700 }}>⭐ IN EVIDENZA</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, fontSize: 12, color: '#94a3b8', flexWrap: 'wrap' }}>
                  <span>{CATEGORIES.find(c => c.id === post.category)?.label || post.category}</span>
                  <span>·</span>
                  <span style={{ color: post.audience === 'hubber' ? '#0f766e' : post.audience === 'renter' ? '#7e22ce' : '#475569' }}>
                    {post.audience === 'hubber' ? '👤 Hubber' : post.audience === 'renter' ? '🛍️ Renter' : '👥 Tutti'}
                  </span>
                  <span>·</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={11} /> {post.read_minutes} min</span>
                  <span>·</span>
                  <span>👁️ {post.views}</span>
                  <span>·</span>
                  <span>{new Date(post.created_at).toLocaleDateString('it-IT')}</span>
                </div>
              </div>

              {/* Status badge */}
              <div style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, flexShrink: 0, background: post.published ? '#f0fdf4' : '#f8fafb', color: post.published ? '#15803d' : '#94a3b8' }}>
                {post.published ? '🟢 Pubblicato' : '⚫ Bozza'}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => togglePublish(post)} title={post.published ? 'Nascondi' : 'Pubblica'}
                  style={{ width: 34, height: 34, border: '1.5px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {post.published ? <EyeOff size={15} color="#94a3b8" /> : <Eye size={15} color="#3DD9D0" />}
                </button>
                <a href={`/risorse/${post.slug}`} target="_blank" rel="noreferrer" title="Anteprima"
                  style={{ width: 34, height: 34, border: '1.5px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                  <ExternalLink size={15} color="#64748b" />
                </a>
                <button onClick={() => setEditingPost(post)} title="Modifica"
                  style={{ width: 34, height: 34, border: '1.5px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Edit size={15} color="#0D414B" />
                </button>
                <button onClick={() => deletePost(post.id)} title="Elimina" disabled={deleting === post.id}
                  style={{ width: 34, height: 34, border: '1.5px solid #fecaca', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={15} color="#dc2626" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modale form */}
      {editingPost !== undefined && (
        <PostForm
          post={editingPost}
          onSave={() => { fetchPosts(); setEditingPost(undefined); }}
          onClose={() => setEditingPost(undefined)}
        />
      )}
    </div>
  );
}
