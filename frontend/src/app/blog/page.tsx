'use client';

import { useState, useEffect, useCallback } from 'react';
import { blogAPI } from '@/lib/api';
import { BlogPost } from '@/types';
import { useAppSelector } from '@/store/hooks';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import BlogFooter from '@/components/layout/BlogFooter';
import {
  Clock, Eye, Heart, Search, Plus, TrendingUp, BookOpen,
  Tag, ChevronRight, Flame, Sparkles, ArrowRight,
  Calendar, MessageCircle, Bookmark,
} from 'lucide-react';
import { format } from 'date-fns';

const BLOG_CATEGORIES = [
  { id: '', name: 'All', icon: '📰' },
  { id: 'technology', name: 'Technology', icon: '💻' },
  { id: 'ai', name: 'AI & ML', icon: '🤖' },
  { id: 'web-development', name: 'Web Dev', icon: '🌐' },
  { id: 'mobile', name: 'Mobile', icon: '📱' },
  { id: 'cloud', name: 'Cloud', icon: '☁️' },
  { id: 'cybersecurity', name: 'Security', icon: '🔒' },
  { id: 'gadgets', name: 'Gadgets', icon: '🎮' },
  { id: 'software', name: 'Software', icon: '⚙️' },
  { id: 'tutorials', name: 'Tutorials', icon: '📚' },
  { id: 'news', name: 'News', icon: '📢' },
];

function formatDate(d: string) {
  try { return format(new Date(d), 'MMM dd, yyyy'); } catch { return ''; }
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return formatDate(d);
}

/* ──────────── Featured Card (Hero) ──────────── */
function FeaturedCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <div className="relative rounded-2xl overflow-hidden" style={{ border: '1px solid var(--edith-border)' }}>
        <div className="grid md:grid-cols-2">
          <div className="aspect-video md:aspect-auto md:h-full overflow-hidden">
            {post.coverImage?.url ? (
              <img src={post.coverImage.url} alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            ) : (
              <div className="w-full h-full min-h-[280px] flex items-center justify-center"
                style={{ background: 'var(--edith-panel)' }}>
                <BookOpen className="w-16 h-16 text-edith-cyan/20" />
              </div>
            )}
          </div>
          <div className="p-6 md:p-8 flex flex-col justify-center" style={{ background: 'var(--edith-panel)' }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider text-edith-cyan"
                style={{ background: 'var(--edith-accent-muted)', border: '1px solid var(--edith-border-strong)' }}>
                <Sparkles className="w-2.5 h-2.5" /> Featured
              </span>
              <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded"
                style={{ color: 'var(--edith-text-dim)', background: 'var(--edith-accent-subtle)', border: '1px solid var(--edith-border)' }}>
                {post.category}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold mb-3 group-hover:text-edith-cyan transition-colors line-clamp-2"
              style={{ color: 'var(--edith-text)', fontFamily: 'var(--edith-article-heading)', letterSpacing: '-0.01em' }}>
              {post.title}
            </h2>
            <p className="text-[15px] mb-5 line-clamp-3 leading-relaxed" style={{ color: 'var(--edith-text-dim)', fontFamily: 'var(--edith-article)' }}>
              {post.excerpt}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {post.author?.avatar ? (
                  <img src={post.author.avatar} alt="" className="w-7 h-7 rounded-full object-cover ring-1 ring-edith-cyan/20" />
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-edith-cyan"
                    style={{ background: 'var(--edith-accent-muted)' }}>
                    {post.author?.displayName?.[0] || '?'}
                  </div>
                )}
                <div>
                  <p className="text-[11px] font-semibold" style={{ color: 'var(--edith-text-secondary)' }}>{post.author?.displayName}</p>
                  <p className="text-[9px] font-mono" style={{ color: 'var(--edith-text-muted)' }}>{formatDate(post.createdAt)}</p>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-3 text-[9px] font-mono" style={{ color: 'var(--edith-text-muted)' }}>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime} min</span>
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.viewsCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ──────────── Blog Card ──────────── */
function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg"
        style={{ background: 'var(--edith-card-bg)', border: '1px solid var(--edith-border)', boxShadow: 'var(--edith-shadow-sm)' }}>
        <div className="aspect-video overflow-hidden relative">
          {post.coverImage?.url ? (
            <img src={post.coverImage.url} alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--edith-panel)' }}>
              <BookOpen className="w-10 h-10 text-edith-cyan/15" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className="text-[11px] font-medium capitalize px-2.5 py-1 rounded-full backdrop-blur-md"
              style={{ background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {post.category}
            </span>
          </div>
        </div>
        <div className="p-5">
          <h3 className="text-[17px] font-bold mb-2 line-clamp-2 group-hover:text-[var(--edith-accent)] transition-colors"
            style={{ color: 'var(--edith-text)', fontFamily: 'var(--edith-article-heading)', lineHeight: '1.3', letterSpacing: '-0.01em' }}>
            {post.title}
          </h3>
          <p className="text-[15px] line-clamp-2 mb-4 leading-relaxed"
            style={{ color: 'var(--edith-text-dim)', fontFamily: 'var(--edith-article)' }}>
            {post.excerpt}
          </p>
          <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--edith-border)' }}>
            <div className="flex items-center gap-2.5">
              {post.author?.avatar ? (
                <img src={post.author.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-edith-cyan"
                  style={{ background: 'var(--edith-accent-muted)' }}>
                  {post.author?.displayName?.[0] || '?'}
                </div>
              )}
              <span className="text-[13px]" style={{ color: 'var(--edith-text-dim)', fontFamily: 'var(--edith-body)' }}>{post.author?.displayName}</span>
            </div>
            <div className="flex items-center gap-3 text-[12px]" style={{ color: 'var(--edith-text-muted)', fontFamily: 'var(--edith-body)' }}>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime} min</span>
              <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" />{post.likesCount}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

/* ──────────── Sidebar Article ──────────── */
function SidebarArticle({ post, rank }: { post: BlogPost; rank: number }) {
  return (
    <Link href={`/blog/${post.slug}`} className="flex gap-3 group items-start py-3" style={{ borderBottom: '1px solid var(--edith-border)' }}>
      <span className="text-lg font-display font-bold text-edith-cyan/20 shrink-0 w-6 text-center leading-none mt-0.5">
        {String(rank).padStart(2, '0')}
      </span>
      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-semibold line-clamp-2 group-hover:text-edith-cyan transition-colors leading-snug mb-1"
          style={{ color: 'var(--edith-text)', fontFamily: 'var(--edith-article-heading)' }}>
          {post.title}
        </h4>
        <div className="flex items-center gap-2 text-[9px] font-mono" style={{ color: 'var(--edith-text-muted)' }}>
          <span>{post.author?.displayName}</span>
          <span>·</span>
          <span>{timeAgo(post.createdAt)}</span>
          <span>·</span>
          <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" />{post.viewsCount}</span>
        </div>
      </div>
      {post.coverImage?.url && (
        <img src={post.coverImage.url} alt="" className="w-14 h-14 rounded object-cover shrink-0" />
      )}
    </Link>
  );
}

/* ══════════════ MAIN PAGE ══════════════ */
export default function BlogPage() {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || '';

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
  const [trendingPosts, setTrendingPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const [totalPosts, setTotalPosts] = useState(0);

  const fetchPosts = useCallback(async (pageNum: number, reset = false) => {
    try {
      setIsLoading(true);
      const { data } = await blogAPI.getPosts({
        page: pageNum, limit: 12,
        category: category || undefined,
        search: search || undefined,
        sort,
      });
      const fetched: BlogPost[] = data.data || [];
      if (reset) {
        setPosts(fetched);
        setTotalPosts(data.pagination?.total || fetched.length);
      } else {
        setPosts((prev) => [...prev, ...fetched]);
      }
      setHasMore(data.pagination?.hasMore ?? false);
    } catch (e) {
      console.error('Failed to fetch blog posts:', e);
    } finally {
      setIsLoading(false);
    }
  }, [category, search, sort]);

  useEffect(() => {
    (async () => {
      try {
        const [featRes, trendRes] = await Promise.all([
          blogAPI.getPosts({ limit: 1, sort: 'featured' }),
          blogAPI.getPosts({ limit: 5, sort: 'popular' }),
        ]);
        setFeaturedPost(featRes.data.data?.[0] || null);
        setTrendingPosts(trendRes.data.data || []);
      } catch (e) { console.error(e); }
    })();
  }, []);

  useEffect(() => {
    setPage(1);
    fetchPosts(1, true);
  }, [fetchPosts]);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      const next = page + 1;
      setPage(next);
      fetchPosts(next);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPosts(1, true);
  };

  return (
    <div className="min-h-screen">
      {/* ═══ HERO ═══ */}
      <section className="relative py-14 md:py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-25"
            style={{ background: 'radial-gradient(circle, var(--edith-radial-hero) 0%, transparent 70%)' }} />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{ background: 'var(--edith-accent-subtle)', border: '1px solid var(--edith-border)' }}>
            <BookOpen className="w-3.5 h-3.5 text-edith-cyan" />
            <span className="text-[10px] font-mono font-medium tracking-widest uppercase" style={{ color: 'var(--edith-text-dim)' }}>
              E.D.I.T.H Tech Blog
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-edith-green/60 animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight"
            style={{ fontFamily: 'var(--edith-article-heading)' }}>
            <span style={{ color: 'var(--edith-gradient-text)' }}>Latest </span>
            <span className="text-gradient">Tech Insights</span>
          </h1>
          <p className="text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed" style={{ color: 'var(--edith-text-muted)', fontFamily: 'var(--edith-article)' }}>
            Deep-dive articles on AI, web development, cybersecurity, and emerging technologies.
            <br className="hidden md:block" />
            Written by the community, curated for developers.
          </p>
          <form onSubmit={handleSearch} className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-edith-cyan/40" />
            <input
              type="text"
              placeholder="Search articles, tutorials, topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-24 py-3 text-xs font-mono rounded-lg outline-none transition-all"
              style={{ background: 'var(--edith-input-bg)', border: '1px solid var(--edith-input-border)', color: 'var(--edith-text)' }}
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary text-[10px] px-4 py-1.5">
              Search
            </button>
          </form>
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="text-center">
              <span className="text-lg font-display font-bold text-edith-cyan">{totalPosts || '—'}</span>
              <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'var(--edith-text-muted)' }}>Articles</p>
            </div>
            <div className="w-px h-8" style={{ background: 'var(--edith-border)' }} />
            <div className="text-center">
              <span className="text-lg font-display font-bold text-edith-cyan">{BLOG_CATEGORIES.length - 1}</span>
              <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'var(--edith-text-muted)' }}>Categories</p>
            </div>
            <div className="w-px h-8" style={{ background: 'var(--edith-border)' }} />
            <div className="text-center">
              <span className="text-lg font-display font-bold text-edith-cyan">Open</span>
              <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'var(--edith-text-muted)' }}>Submissions</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURED ═══ */}
      {featuredPost && !search && !category && (
        <section className="max-w-6xl mx-auto px-4 mb-10">
          <FeaturedCard post={featuredPost} />
        </section>
      )}

      {/* ═══ CATEGORIES ═══ */}
      <section className="max-w-6xl mx-auto px-4 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
          {BLOG_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                category === cat.id ? 'text-edith-cyan' : ''
              }`}
              style={category === cat.id
                ? { background: 'var(--edith-accent-muted)', border: '1px solid var(--edith-border-strong)', boxShadow: 'var(--edith-shadow-sm)' }
                : { background: 'transparent', border: '1px solid transparent', color: 'var(--edith-tag-text)' }
              }
            >
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* ═══ SORT + WRITE ═══ */}
      <section className="max-w-6xl mx-auto px-4 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {[
              { key: 'recent', label: 'Latest', icon: Clock },
              { key: 'popular', label: 'Popular', icon: Flame },
              { key: 'trending', label: 'Trending', icon: TrendingUp },
              { key: 'featured', label: 'Featured', icon: Sparkles },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSort(opt.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-mono font-medium tracking-wider transition-all ${
                  sort === opt.key ? 'text-edith-cyan' : ''
                }`}
                style={sort === opt.key
                  ? { background: 'var(--edith-accent-muted)', border: '1px solid var(--edith-border-strong)' }
                  : { background: 'transparent', border: '1px solid transparent', color: 'var(--edith-tag-text)' }
                }
              >
                <opt.icon className="w-3 h-3" /> {opt.label.toUpperCase()}
              </button>
            ))}
          </div>
          {isAuthenticated && (
            <Link href="/blog/create" className="btn-primary gap-2 text-[10px] px-4">
              <Plus className="w-3.5 h-3.5" /> Write Article
            </Link>
          )}
        </div>
      </section>

      {/* ═══ MAIN CONTENT ═══ */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Posts Grid */}
          <div className="lg:col-span-2">
            {isLoading && posts.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl overflow-hidden" style={{ background: 'var(--edith-panel)', border: '1px solid var(--edith-border)' }}>
                    <div className="skeleton shimmer aspect-video" />
                    <div className="p-4 space-y-2">
                      <div className="skeleton h-3 w-16 rounded" />
                      <div className="skeleton h-4 w-3/4 rounded" />
                      <div className="skeleton h-3 w-full rounded" />
                      <div className="flex items-center gap-2 pt-2">
                        <div className="skeleton w-5 h-5 rounded-full" />
                        <div className="skeleton h-3 w-20 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20 rounded-xl" style={{ background: 'var(--edith-panel)', border: '1px solid var(--edith-border)' }}>
                <BookOpen className="w-12 h-12 mx-auto text-edith-cyan/20 mb-4" />
                <h3 className="text-base font-display font-semibold mb-2" style={{ color: 'var(--edith-text)' }}>
                  No articles found
                </h3>
                <p className="text-xs font-mono mb-4" style={{ color: 'var(--edith-text-dim)' }}>
                  {search ? `No results for "${search}"` : 'Be the first to share your knowledge!'}
                </p>
                {isAuthenticated && (
                  <Link href="/blog/create" className="btn-primary gap-2 text-xs inline-flex">
                    <Plus className="w-3.5 h-3.5" /> Write Article
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {posts.map((post) => (
                    <BlogCard key={post._id} post={post} />
                  ))}
                </div>
                {hasMore && (
                  <div className="text-center mt-8">
                    <button onClick={loadMore} disabled={isLoading}
                      className="btn-secondary gap-2 text-xs px-6">
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 border-2 border-edith-cyan/30 border-t-edith-cyan rounded-full animate-spin" /> Loading...
                        </span>
                      ) : (
                        <><ArrowRight className="w-3.5 h-3.5" /> Load More Articles</>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Write CTA */}
            <div className="rounded-xl p-5 relative overflow-hidden"
              style={{ background: 'var(--edith-panel)', border: '1px solid var(--edith-border)' }}>
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20"
                style={{ background: 'radial-gradient(circle, var(--edith-radial-hero), transparent)' }} />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--edith-accent-muted)' }}>
                    <Sparkles className="w-4 h-4 text-edith-cyan" />
                  </div>
                  <h3 className="text-sm font-display font-bold" style={{ color: 'var(--edith-text)' }}>
                    Share Your Knowledge
                  </h3>
                </div>
                <p className="text-[11px] font-mono mb-4 leading-relaxed" style={{ color: 'var(--edith-text-dim)' }}>
                  Write articles about technology, share tutorials, and contribute to the community.
                </p>
                <Link href={isAuthenticated ? '/blog/create' : '/login'}
                  className="btn-primary gap-2 text-[10px] w-full justify-center">
                  <Plus className="w-3.5 h-3.5" /> {isAuthenticated ? 'Write Article' : 'Log in to Write'}
                </Link>
              </div>
            </div>

            {/* Trending */}
            {trendingPosts.length > 0 && (
              <div className="rounded-xl p-5"
                style={{ background: 'var(--edith-panel)', border: '1px solid var(--edith-border)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-edith-cyan" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-edith-cyan/70">Trending</h3>
                </div>
                <div>
                  {trendingPosts.map((post, i) => (
                    <SidebarArticle key={post._id} post={post} rank={i + 1} />
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            <div className="rounded-xl p-5"
              style={{ background: 'var(--edith-panel)', border: '1px solid var(--edith-border)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-4 h-4 text-edith-cyan" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-edith-cyan/70">Categories</h3>
              </div>
              <ul className="space-y-1">
                {BLOG_CATEGORIES.filter((c) => c.id).map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => setCategory(cat.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-mono transition-all text-left ${
                        category === cat.id ? 'text-edith-cyan' : ''
                      }`}
                      style={category === cat.id
                        ? { background: 'var(--edith-accent-muted)' }
                        : { color: 'var(--edith-text-dim)' }
                      }
                    >
                      <span>{cat.icon}</span>
                      <span className="flex-1">{cat.name}</span>
                      <ChevronRight className="w-3 h-3 opacity-30" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tags Cloud */}
            <div className="rounded-xl p-5"
              style={{ background: 'var(--edith-panel)', border: '1px solid var(--edith-border)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Bookmark className="w-4 h-4 text-edith-cyan" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-edith-cyan/70">Popular Tags</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['react', 'nextjs', 'typescript', 'python', 'ai', 'machine-learning', 'devops', 'docker', 'kubernetes', 'rust', 'golang', 'css', 'tailwind', 'api', 'graphql', 'security'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => { setSearch(tag); setPage(1); fetchPosts(1, true); }}
                    className="text-[9px] font-mono px-2 py-1 rounded transition-all hover:text-edith-cyan hover:border-edith-cyan/20"
                    style={{ color: 'var(--edith-tag-text)', background: 'var(--edith-tag-bg)', border: '1px solid var(--edith-tag-border)' }}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <BlogFooter />
    </div>
  );
}
