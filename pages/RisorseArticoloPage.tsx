import { useState, useEffect, useRef, type ReactElement } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, Eye, Tag, TrendingUp, Lightbulb, Zap, Star, Loader2, Heart, MessageCircle, Send, Trash2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface BlogPost {
  id: string;
  created_at: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  cover_url: string;
  category: string;
  tags: string[];
  author_name: string;
  author_avatar?: string;
  views: number;
  read_minutes: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  'cosa-noleggiare': 'Cosa noleggiare',
  'prezzi-e-trend':  'Prezzi e Trend',
  'consigli-hubber': 'Consigli Hubber',
  'novita':          'Novità',
  'storie-successo': 'Storie di successo',
  'inizia-subito':   'Inizia subito',
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'cosa-noleggiare': { bg: '#f0fdf4', text: '#15803d' },
  'prezzi-e-trend':  { bg: '#eff6ff', text: '#1d4ed8' },
  'consigli-hubber': { bg: '#fefce8', text: '#a16207' },
  'novita':          { bg: '#f0fdfa', text: '#0f766e' },
  'storie-successo': { bg: '#fdf4ff', text: '#7e22ce' },
  'inizia-subito':   { bg: '#fff7ed', text: '#c2410c' },
};

const CATEGORY_ICONS: Record<string, ReactElement> = {
  'cosa-noleggiare': <Tag size={13} />,
  'prezzi-e-trend':  <TrendingUp size={13} />,
  'consigli-hubber': <Lightbulb size={13} />,
  'novita':          <Zap size={13} />,
  'storie-successo': <Star size={13} />,
};

export default function RisorseArticoloPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [prevPost, setPrevPost] = useState<{ slug: string; title: string } | null>(null);
  const [nextPost, setNextPost] = useState<{ slug: string; title: string } | null>(null);

  // Likes
  const [likesCount, setLikesCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  // Commenti
  const [comments, setComments] = useState<{ id: string; author_name: string; body: string; created_at: string }[]>([]);
  const [commentName, setCommentName] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [commentSending, setCommentSending] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);

  // Fingerprint anonimo per like
  const ipHashRef = useRef<string>('');

  useEffect(() => {
    const fp = [navigator.userAgent, navigator.language, screen.width, screen.height].join('|');
    let hash = 0;
    for (let i = 0; i < fp.length; i++) { hash = ((hash << 5) - hash) + fp.charCodeAt(i); hash |= 0; }
    ipHashRef.current = Math.abs(hash).toString(36);
  }, []);

  useEffect(() => {
    if (slug) fetchPost(slug);
  }, [slug]);

  async function fetchLikes(postId: string) {
    const { data } = await supabase.from('blog_likes').select('ip_hash').eq('post_id', postId);
    if (data) {
      setLikesCount(data.length);
      setLiked(data.some(l => l.ip_hash === ipHashRef.current));
    }
  }

  async function fetchComments(postId: string) {
    const { data } = await supabase
      .from('blog_comments')
      .select('*')
      .eq('post_id', postId)
      .eq('approved', true)
      .order('created_at', { ascending: true });
    setComments(data || []);
  }

  async function toggleLike() {
    if (!post || likeLoading) return;
    setLikeLoading(true);
    if (liked) {
      await supabase.from('blog_likes').delete().eq('post_id', post.id).eq('ip_hash', ipHashRef.current);
      setLikesCount(c => c - 1);
      setLiked(false);
    } else {
      await supabase.from('blog_likes').insert([{ post_id: post.id, ip_hash: ipHashRef.current }]);
      setLikesCount(c => c + 1);
      setLiked(true);
    }
    setLikeLoading(false);
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!post || !commentName.trim() || !commentBody.trim()) return;
    setCommentSending(true);
    await supabase.from('blog_comments').insert([{
      post_id: post.id,
      author_name: commentName.trim(),
      body: commentBody.trim(),
    }]);
    setCommentSuccess(true);
    setCommentName('');
    setCommentBody('');
    fetchComments(post.id);
    setCommentSending(false);
    setTimeout(() => setCommentSuccess(false), 3000);
  }

  async function fetchPost(s: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', s)
      .eq('published', true)
      .single();

    if (error || !data) { setNotFound(true); setLoading(false); return; }
    setPost(data);

    // Incrementa views
    await supabase.from('blog_posts').update({ views: (data.views || 0) + 1 }).eq('id', data.id);

    // Articoli correlati (stessa categoria, escludi corrente)
    const { data: rel } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .eq('category', data.category)
      .neq('id', data.id)
      .limit(3);

    setRelated(rel || []);

    // Fetch post precedente e successivo nella stessa categoria
    const { data: prev } = await supabase
      .from('blog_posts')
      .select('slug, title')
      .eq('published', true)
      .eq('category', data.category)
      .lt('created_at', data.created_at)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const { data: next } = await supabase
      .from('blog_posts')
      .select('slug, title')
      .eq('published', true)
      .eq('category', data.category)
      .gt('created_at', data.created_at)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    setPrevPost(prev || null);
    setNextPost(next || null);
    fetchLikes(data.id);
    fetchComments(data.id);
    setLoading(false);
  }

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 className="w-8 h-8 animate-spin text-brand" />
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>404</div>
        <p style={{ color: '#64748b', marginBottom: 20 }}>Articolo non trovato</p>
        <button onClick={() => navigate('/risorse')}
          style={{ background: '#0D414B', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          ← Torna alle Risorse
        </button>
      </div>
    </div>
  );

  if (!post) return null;

  const colors = CATEGORY_COLORS[post.category] || { bg: '#f1f5f9', text: '#475569' };

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", minHeight: '100vh', background: '#f8f9fa' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }

        .article-body { line-height: 1.8; color: #374151; font-size: 17px; }
        .article-body h2 { font-size: 24px; font-weight: 800; color: #0D414B; margin: 36px 0 16px; }
        .article-body h3 { font-size: 20px; font-weight: 700; color: #0D414B; margin: 28px 0 12px; }
        .article-body p  { margin-bottom: 20px; }
        .article-body ul, .article-body ol { padding-left: 24px; margin-bottom: 20px; }
        .article-body li { margin-bottom: 8px; }
        .article-body strong { color: #0D414B; font-weight: 700; }
        .article-body a { color: #0D414B; text-decoration: underline; }
        .article-body blockquote {
          border-left: 4px solid #3DD9D0; padding: 16px 20px;
          background: rgba(61,217,208,.06); border-radius: 0 10px 10px 0;
          margin: 24px 0; font-style: italic; color: #0D414B;
        }

        .related-card {
          background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px;
          overflow: hidden; cursor: pointer;
          transition: box-shadow .2s, transform .2s;
          text-decoration: none; display: block;
        }
        .related-card:hover {
          box-shadow: 0 8px 28px rgba(13,65,75,.10);
          transform: translateY(-2px);
        }
      `}</style>

      {/* Cover */}
      

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* Back + meta */}
        <div style={{ marginTop: 40, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {prevPost && (
                <button onClick={() => navigate(`/risorse/${prevPost.slug}`)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 99, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#0D414B', cursor: 'pointer', fontFamily: 'inherit', maxWidth: 200 }}>
                  <ChevronLeft size={14} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prevPost.title}</span>
                </button>
              )}
              {nextPost && (
                <button onClick={() => navigate(`/risorse/${nextPost.slug}`)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 99, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#0D414B', cursor: 'pointer', fontFamily: 'inherit', maxWidth: 200 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nextPost.title}</span>
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
          <button onClick={() => navigate('/risorse')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.95)', border: '1px solid rgba(255,255,255,.5)', borderRadius: 99, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#0D414B', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 24, backdropFilter: 'blur(8px)' }}>
            <ArrowLeft size={14} /> Centro Risorse
          </button>

          {/* Card articolo */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '40px 44px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 30px rgba(13,65,75,.07)' }}>

            {/* Badge categoria */}
            {post.cover_url && (
              <img
                src={post.cover_url}
                alt={post.title}
                style={{ width: '100%', height: 240, objectFit: 'cover', borderRadius: 12, marginBottom: 24 }}
              />
            )}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
              background: colors.bg, color: colors.text, marginBottom: 20,
            }}>
              {CATEGORY_ICONS[post.category]}
              {CATEGORY_LABELS[post.category] || post.category}
            </span>

            <h1 style={{ fontSize: 34, fontWeight: 800, color: '#0D414B', lineHeight: 1.2, marginBottom: 16 }}>
              {post.title}
            </h1>

            {post.excerpt && (
              <p style={{ fontSize: 18, color: '#64748b', lineHeight: 1.65, marginBottom: 28, borderBottom: '1px solid #f1f5f9', paddingBottom: 24 }}>
                {post.excerpt}
              </p>
            )}

            {/* Meta autore */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden' }}>
                  <img
                    src={post.author_avatar || '/favicon.ico'}
                    alt={post.author_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0D414B' }}>{post.author_name}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    {new Date(post.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#94a3b8' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={13} /> {post.read_minutes} min
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Eye size={13} /> {post.views}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="article-body" dangerouslySetInnerHTML={{ __html: post.body }} />

            {/* Tags */}
            {post.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 36, paddingTop: 24, borderTop: '1px solid #f1f5f9' }}>
                {post.tags.map(tag => (
                  <span key={tag} style={{ padding: '4px 12px', borderRadius: 99, background: '#f1f5f9', fontSize: 12, fontWeight: 600, color: '#475569' }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Like + Condividi */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <button
            onClick={toggleLike}
            disabled={likeLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 22px', borderRadius: 99, border: `2px solid ${liked ? '#0D414B' : '#e2e8f0'}`,
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
              background: liked ? 'rgba(13,65,75,.08)' : '#fff', color: liked ? '#0D414B' : '#475569',
              transition: 'all .18s',
            }}
          >
            <Heart size={17} fill={liked ? '#0D414B' : 'none'} color={liked ? '#0D414B' : '#94a3b8'} />
            {liked ? `Ti piace! (${likesCount})` : `Mi piace${likesCount > 0 ? ` (${likesCount})` : ''}`}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginRight: 4 }}>Condividi</span>
            {[
              { bg: '#25D366', url: `https://wa.me/?text=${encodeURIComponent(post.title + ' ' + window.location.href)}`, title: 'WhatsApp',
                svg: <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.531 5.856L.044 23.432a.75.75 0 00.918.919l5.625-1.492A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.686-.498-5.231-1.369l-.374-.215-3.899 1.033 1.024-3.818-.234-.389A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg> },
              { bg: '#1877F2', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, title: 'Facebook',
                svg: <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.932-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg> },
              { bg: '#000', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`, title: 'X',
                svg: <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
              { bg: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', url: `https://www.instagram.com/`, title: 'Instagram',
                svg: <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
              { bg: '#010101', url: `https://www.tiktok.com/`, title: 'TikTok',
                svg: <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/></svg> },
              { bg: '#0D414B', url: `mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(window.location.href)}`, title: 'Email',
                svg: <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg> },
            ].map(s => (
              <a key={s.title} href={s.url} target={s.title === 'Email' ? '_self' : '_blank'} rel="noreferrer" title={s.title}
                style={{ width: 36, height: 36, borderRadius: '50%', background: s.bg, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {s.svg}
              </a>
            ))}
            <button title="Copia link"
              onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Link copiato!'); }}
              style={{ width: 36, height: 36, borderRadius: '50%', fontSize: 14, background: '#f1f5f9', color: '#475569', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              🔗
            </button>
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: '#0D414B', borderRadius: 18, padding: '32px 36px', marginTop: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <p style={{ color: '#3DD9D0', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>Pronto a iniziare?</p>
            <h3 style={{ color: '#fff', fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>
              Pubblica il tuo primo annuncio
            </h3>
            <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 14, marginTop: 6 }}>Iscrizione gratuita · Nessun vincolo</p>
          </div>
          <button onClick={() => navigate('/signup')}
            style={{ background: '#3DD9D0', color: '#0D414B', border: 'none', borderRadius: 12, padding: '14px 28px', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            Registrati gratis →
          </button>
        </div>

        

        {/* Articoli correlati */}
        {related.length > 0 && (
          <div style={{ marginTop: 52 }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0D414B', marginBottom: 20 }}>Potrebbe interessarti</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {related.map(p => (
                <Link key={p.id} to={`/risorse/${p.slug}`} className="related-card">
                  {p.cover_url && (
                    <div style={{ height: 140, background: `url(${p.cover_url}) center/cover` }} />
                  )}
                  <div style={{ padding: '16px 18px' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0D414B', lineHeight: 1.35, marginBottom: 8 }}>{p.title}</p>
                    <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} /> {p.read_minutes} min
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
