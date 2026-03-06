import { useState, useEffect, type ReactElement } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Clock, ArrowRight, TrendingUp, Lightbulb, Tag, Star, Zap, ChevronRight, Package, ShoppingBag, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

// ─── TIPI ────────────────────────────────────────────────────
interface BlogPost {
  id: string;
  created_at: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_url: string;
  category: string;
  audience: string;
  tags: string[];
  author_name: string;
  featured: boolean;
  views: number;
  read_minutes: number;
}

type Audience = 'hubber' | 'renter';

// ─── CATEGORIE PER RUOLO ─────────────────────────────────────
const CATEGORIES: Record<Audience, { id: string; label: string; icon: string }[]> = {
  hubber: [
    { id: 'tutti',           label: 'Tutti',               icon: '✦'  },
    { id: 'inizia-subito',   label: 'Inizia subito',       icon: '🚀' },
    { id: 'prezzi-e-trend',  label: 'Prezzi e Trend',      icon: '📈' },
    { id: 'consigli-hubber', label: 'Consigli Hubber',     icon: '💡' },
    { id: 'storie-successo', label: 'Storie di successo',  icon: '⭐' },
    { id: 'novita',          label: 'Novità',              icon: '⚡' },
  ],
  renter: [
    { id: 'tutti',           label: 'Tutti',               icon: '✦'  },
    { id: 'cosa-noleggiare', label: 'Cosa noleggiare',     icon: '🧰' },
    { id: 'prezzi-e-trend',  label: 'Prezzi e Trend',      icon: '📈' },
    { id: 'consigli-renter', label: 'Consigli Renter',     icon: '💡' },
    { id: 'novita',          label: 'Novità',              icon: '⚡' },
  ],
};

const CATEGORY_LABELS: Record<string, string> = {
  'cosa-noleggiare': 'Cosa noleggiare',
  'prezzi-e-trend':  'Prezzi e Trend',
  'consigli-hubber': 'Consigli Hubber',
  'consigli-renter': 'Consigli Renter',
  'novita':          'Novità',
  'storie-successo': 'Storie di successo',
  'inizia-subito':   'Inizia subito',
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'cosa-noleggiare': { bg: '#f0fdf4', text: '#15803d' },
  'prezzi-e-trend':  { bg: '#eff6ff', text: '#1d4ed8' },
  'consigli-hubber': { bg: '#fefce8', text: '#a16207' },
  'consigli-renter': { bg: '#fefce8', text: '#a16207' },
  'novita':          { bg: '#f0fdfa', text: '#0f766e' },
  'storie-successo': { bg: '#fdf4ff', text: '#7e22ce' },
  'inizia-subito':   { bg: '#fff7ed', text: '#c2410c' },
};

const CATEGORY_ICONS: Record<string, ReactElement> = {
  'cosa-noleggiare': <Tag size={13} />,
  'prezzi-e-trend':  <TrendingUp size={13} />,
  'consigli-hubber': <Lightbulb size={13} />,
  'consigli-renter': <Lightbulb size={13} />,
  'novita':          <Zap size={13} />,
  'storie-successo': <Star size={13} />,
  'inizia-subito':   <ArrowRight size={13} />,
};

// ─── HELPER ──────────────────────────────────────────────────
function getCategoryLabel(id: string) {
  return CATEGORY_LABELS[id] || id;
}

// ─── COMPONENTI ──────────────────────────────────────────────
function CategoryBadge({ category }: { category: string }) {
  const colors = CATEGORY_COLORS[category] || { bg: '#f1f5f9', text: '#475569' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
      background: colors.bg, color: colors.text,
    }}>
      {CATEGORY_ICONS[category]}
      {getCategoryLabel(category)}
    </span>
  );
}

function FeaturedCard({ post }: { post: BlogPost }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/risorse/${post.slug}`)}
      style={{
        borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
        background: '#fff', border: '1.5px solid #e2e8f0',
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        transition: 'box-shadow .2s, transform .2s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(13,65,75,.12)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLDivElement).style.transform = 'none';
      }}
      className="featured-card"
    >
      <div style={{ padding: '36px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <CategoryBadge category={post.category} />
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0D414B', lineHeight: 1.25, margin: '14px 0 12px' }}>
            {post.title}
          </h2>
          <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.65 }}>{post.excerpt}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}>
            <Clock size={13} />
            <span>{post.read_minutes} min di lettura</span>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#0D414B', fontSize: 13, fontWeight: 700 }}>
            Leggi <ArrowRight size={14} />
          </span>
        </div>
      </div>
      <div style={{
        background: post.cover_url ? `url(${post.cover_url}) center/cover` : '#e2e8f0',
        minHeight: 280,
      }} />
    </div>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/risorse/${post.slug}`)}
      style={{
        borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
        background: '#fff', border: '1.5px solid #e2e8f0',
        display: 'flex', flexDirection: 'column',
        transition: 'box-shadow .2s, transform .2s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 30px rgba(13,65,75,.10)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLDivElement).style.transform = 'none';
      }}
    >
      {post.cover_url && (
        <div style={{ height: 180, background: `url(${post.cover_url}) center/cover` }} />
      )}
      <div style={{ padding: '20px 22px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <CategoryBadge category={post.category} />
        <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0D414B', lineHeight: 1.35, margin: '12px 0 8px' }}>
          {post.title}
        </h3>
        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, flex: 1 }}>{post.excerpt}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, fontSize: 12, color: '#94a3b8' }}>
          <Clock size={12} />
          <span>{post.read_minutes} min</span>
          <span style={{ margin: '0 4px' }}>·</span>
          <span>{new Date(post.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
}

// ─── PAGINA PRINCIPALE ───────────────────────────────────────
export default function RisorseHubberPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [audience, setAudience] = useState<Audience>('hubber');
  const [activeCategory, setActiveCategory] = useState('tutti');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => { fetchPosts(); }, []);

  // Reset categoria quando cambia audience
  useEffect(() => { setActiveCategory('tutti'); setSearch(''); setSearchInput(''); }, [audience]);

  async function fetchPosts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });
    if (!error && data) setPosts(data);
    setLoading(false);
  }

  // Filtra per audience + categoria + search
  const filtered = posts.filter(p => {
    const matchAudience = p.audience === audience || p.audience === 'tutti';
    const matchCat = activeCategory === 'tutti' || p.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q) || p.excerpt?.toLowerCase().includes(q) || p.tags?.some(t => t.toLowerCase().includes(q));
    return matchAudience && matchCat && matchSearch;
  });

  const featured = filtered.filter(p => p.featured);
  const regular  = filtered.filter(p => !p.featured);

  const byCategory: Record<string, BlogPost[]> = {};
  if (activeCategory === 'tutti' && !search) {
    regular.forEach(p => {
      (byCategory[p.category] = byCategory[p.category] || []).push(p);
    });
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setActiveCategory('tutti');
  };

  const QUICK_TAGS: Record<Audience, string[]> = {
    hubber: ['Come iniziare', 'Prezzi Milano', 'Fotografie annuncio', 'SuperHubber', 'Guadagni'],
    renter: ['Cosa noleggiare', 'E-bike', 'Fotocamera', 'Feste ed eventi', 'Spazi'],
  };

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", minHeight: '100vh', background: '#f8f9fa' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }

        .rh-search {
          width: 100%; padding: 15px 20px 15px 52px;
          border: 2px solid rgba(255,255,255,.2); border-radius: 14px;
          font-size: 15px; font-family: inherit;
          background: rgba(255,255,255,.12); color: #fff; outline: none;
          transition: border-color .2s, background .2s;
          backdrop-filter: blur(4px);
        }
        .rh-search:focus { border-color: #3DD9D0; background: rgba(255,255,255,.18); }
        .rh-search::placeholder { color: rgba(255,255,255,.5); }

        .audience-btn {
          flex: 1; padding: 20px 16px; border-radius: 16px;
          border: 2px solid transparent; cursor: pointer;
          font-family: inherit; text-align: center;
          transition: all .2s;
        }

        .cat-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 18px; border-radius: 99px; font-size: 13px; font-weight: 600;
          cursor: pointer; border: 1.5px solid #e2e8f0; background: #fff;
          color: #475569; font-family: inherit; white-space: nowrap;
          transition: all .18s;
        }
        .cat-pill:hover { border-color: #3DD9D0; color: #0D414B; }
        .cat-pill.active { background: #0D414B; border-color: #0D414B; color: #fff; }

        .posts-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .show-all-btn {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 700; color: #0D414B;
          background: transparent; border: none; cursor: pointer;
          font-family: inherit; padding: 0;
        }
        .show-all-btn:hover { color: #3DD9D0; }

        @media (max-width: 900px) {
          .posts-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .featured-card { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .posts-grid { grid-template-columns: 1fr !important; }
          .audience-btn { padding: 14px 10px !important; }
        }
      `}</style>

      {/* ── HERO ── */}
      <div style={{ background: 'linear-gradient(135deg, #0D414B 0%, #0a3a42 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -100, right: -80, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(61,217,208,.12) 0%,transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: -40, left: '10%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle,rgba(61,217,208,.07) 0%,transparent 70%)' }} />

        <div style={{ maxWidth: 820, margin: '0 auto', padding: '56px 24px 68px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(61,217,208,.15)', border: '1px solid rgba(61,217,208,.3)', borderRadius: 99, padding: '6px 16px', marginBottom: 22 }}>
            <Lightbulb size={13} color="#3DD9D0" />
            <span style={{ color: '#3DD9D0', fontSize: 20, fontWeight: 600, letterSpacing: .5 }}>Centro Risorse</span>
          </div>

          <h1 style={{ fontSize: 40, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 12 }}>
            Ciao, cosa vuoi <span style={{ color: '#3DD9D0' }}>sapere?</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 16, marginBottom: 36 }}>
            Guide pratiche, trend di mercato e consigli dal team RentHubber.
          </p>

          {/* AUDIENCE SELECTOR */}
          <div style={{ display: 'flex', gap: 12, maxWidth: 480, margin: '0 auto 32px', background: 'rgba(255,255,255,.08)', borderRadius: 20, padding: 8 }}>
            <button
              className="audience-btn"
              onClick={() => setAudience('hubber')}
              style={{
                background: audience === 'hubber' ? '#fff' : 'transparent',
                border: audience === 'hubber' ? '2px solid #fff' : '2px solid transparent',
                color: audience === 'hubber' ? '#0D414B' : 'rgba(255,255,255,.65)',
              }}
            >
              <div style={{ fontSize: 26, marginBottom: 6 }}><Package size={28} strokeWidth={audience === 'hubber' ? 2.5 : 1.5} style={{ margin: '0 auto' }} /></div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Sono un Hubber</div>
              <div style={{ fontSize: 12, marginTop: 3, opacity: .75 }}>Affitta i tuoi oggetti e spazi</div>
            </button>
            <button
              className="audience-btn"
              onClick={() => setAudience('renter')}
              style={{
                background: audience === 'renter' ? '#fff' : 'transparent',
                border: audience === 'renter' ? '2px solid #fff' : '2px solid transparent',
                color: audience === 'renter' ? '#0D414B' : 'rgba(255,255,255,.65)',
              }}
            >
              <div style={{ fontSize: 26, marginBottom: 6 }}><ShoppingBag size={28} strokeWidth={audience === 'renter' ? 2.5 : 1.5} style={{ margin: '0 auto' }} /></div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Sono un Renter</div>
              <div style={{ fontSize: 12, marginTop: 3, opacity: .75 }}>Noleggia ciò che ti serve</div>
            </button>
          </div>

          {/* SEARCH */}
          <form onSubmit={handleSearch} style={{ position: 'relative', maxWidth: 540, margin: '0 auto' }}>
            <Search size={20} color="rgba(255,255,255,.5)" style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              className="rh-search"
              placeholder={audience === 'hubber' ? 'Cerca guide per hubber…' : 'Cerca cosa noleggiare…'}
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </form>

          {/* Quick tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 14 }}>
            {QUICK_TAGS[audience].map(tag => (
              <button key={tag} onClick={() => { setSearchInput(tag); setSearch(tag); setActiveCategory('tutti'); }}
                style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 99, padding: '5px 14px', fontSize: 12, color: 'rgba(255,255,255,.75)', cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.1)')}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── FILTRI CATEGORIA ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '14px 0', scrollbarWidth: 'none', justifyContent: 'center' }}>
            {CATEGORIES[audience].map(cat => (
              <button
                key={cat.id}
                className={`cat-pill ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => { setActiveCategory(cat.id); setSearch(''); setSearchInput(''); }}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENUTO ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' }}>

       {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#0D414B' }}>Nessun risultato trovato</p>
            <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 6 }}>Prova con parole chiave diverse</p>
            <button onClick={() => { setSearch(''); setSearchInput(''); setActiveCategory('tutti'); }}
              style={{ marginTop: 20, background: '#0D414B', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Mostra tutti gli articoli
            </button>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured.length > 0 && (
              <div style={{ marginBottom: 48 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <span style={{ fontSize: 18 }}>✦</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: '#0D414B' }}>In evidenza</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {featured.map(p => <FeaturedCard key={p.id} post={p} />)}
                </div>
              </div>
            )}

            {/* Ricerca o categoria specifica → grid flat */}
            {(search || activeCategory !== 'tutti') && regular.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: '#0D414B' }}>
                    {search ? `Risultati per "${search}"` : getCategoryLabel(activeCategory)}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#94a3b8' }}>({regular.length})</span>
                </div>
                <div className="posts-grid">
                  {regular.map(p => <PostCard key={p.id} post={p} />)}
                </div>
              </div>
            )}

            {/* Vista "tutti" → sezioni per categoria */}
            {!search && activeCategory === 'tutti' && Object.entries(byCategory).map(([catId, catPosts]) => (
              <div key={catId} style={{ marginBottom: 52 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 800, color: '#0D414B' }}>
                    <span>{CATEGORIES[audience].find(c => c.id === catId)?.icon || '📌'}</span>
                    {getCategoryLabel(catId)}
                  </div>
                  <button className="show-all-btn" onClick={() => setActiveCategory(catId)}>
                    Mostra tutti <ChevronRight size={14} />
                  </button>
                </div>
                <div className="posts-grid">
                  {catPosts.slice(0, 3).map(p => <PostCard key={p.id} post={p} />)}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
