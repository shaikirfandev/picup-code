'use client';

import { useState, useEffect, useCallback } from 'react';
import { blogAPI } from '@/lib/api';
import { BlogPost } from '@/types';
import { useAppSelector } from '@/store/hooks';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import BlogFooter from '@/components/layout/BlogFooter';
import {
  Clock, Heart, Search, Plus, TrendingUp, BookOpen,
  ArrowRight, MessageCircle,
} from 'lucide-react';
import { format } from 'date-fns';

const BLOG_CATEGORIES = [
  { id: '', name: 'All' },
  { id: 'technology', name: 'Technology' },
  { id: 'ai', name: 'AI & ML' },
  { id: 'web-development', name: 'Web Dev' },
  { id: 'mobile', name: 'Mobile' },
  { id: 'cloud', name: 'Cloud' },
  { id: 'cybersecurity', name: 'Security' },
  { id: 'gadgets', name: 'Gadgets' },
  { id: 'software', name: 'Software' },
  { id: 'tutorials', name: 'Tutorials' },
  { id: 'news', name: 'News' },
];

function formatDate(d: string) {
  try { return format(new Date(d), 'MMM dd, yyyy'); } catch { return ''; }
}

function readingTime(min: number) {
  return `${min} min read`;
}

/* ──────────── Trending Item (numbered, like Medium) ──────────── */
function TrendingItem({ post, rank }: { post: BlogPost; rank: number }) {
  return (
    <Link href={`/blog/${post.slug}`} className="flex gap-4 group">
      <span className="text-[32px] font-bold leading-none" style={{ color: 'var(--border-strong)' }}>
        {String(rank).padStart(2, '0')}
      </span>
      <div className="flex-1 min-w-0 pt-1">
        <div className="flex items-center gap-2 mb-1.5">
          {post.author?.avatar ? (
            <img src={post.author.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
          ) : (
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold"
              style={{ background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}>
              {post.author?.displayName?.[0] || '?'}
            </div>
          )}
          <span className="text-[13px] font-medium" style={{ color: 'var(--foreground)' }}>
            {post.author?.displayName}
          </span>
        </div>
        <h3 className="text-[16px] font-bold leading-snug mb-1.5 group-hover:underline decoration-1 underline-offset-2 line-clamp-2"
          style={{ color: 'var(--foreground)' }}>
          {post.title}
        </h3>
        <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
          <span>{formatDate(post.createdAt)}</span>
          <span>·</span>
          <span>{readingTime(post.readTime)}</span>
        </div>
      </div>
    </Link>
  );
}

/* ──────────── Article Card (horizontal, Medium-style) ──────────── */
function ArticleCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block py-7" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {post.author?.avatar ? (
              <img src={post.author.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold"
                style={{ background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}>
                {post.author?.displayName?.[0] || '?'}
              </div>
            )}
            <span className="text-[13px] font-medium" style={{ color: 'var(--foreground)' }}>
              {post.author?.displayName}
            </span>
          </div>
          <h2 className="text-[20px] font-bold leading-snug mb-1 group-hover:underline decoration-1 underline-offset-2 line-clamp-2"
            style={{ color: 'var(--foreground)' }}>
            {post.title}
          </h2>
          <p className="text-[16px] leading-relaxed mb-3 line-clamp-2 hidden sm:block"
            style={{ color: 'var(--text-secondary)' }}>
            {post.excerpt}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[13px] px-2.5 py-0.5 rounded-full capitalize"
              style={{ background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}>
              {post.category.replace(/-/g, ' ')}
            </span>
            <span className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
              {formatDate(post.createdAt)}
            </span>
            <span className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
              {readingTime(post.readTime)}
            </span>
            <div className="flex items-center gap-3 text-[13px] ml-auto" style={{ color: 'var(--text-tertiary)' }}>
              <span className="hidden sm:flex items-center gap-1"><Heart className="w-4 h-4" /> {post.likesCount}</span>
              <span className="hidden sm:flex items-center gap-1"><MessageCircle className="w-4 h-4" /> {post.commentsCount}</span>
            </div>
          </div>
        </div>
        {post.coverImage?.url && (
          <div className="hidden sm:block shrink-0 w-[200px] h-[134px] rounded overflow-hidden">
            <img src={post.coverImage.url} alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
        )}
      </div>
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
          blogAPI.getPosts({ limit: 6, sort: 'popular' }),
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
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* ═══ HEADER BAR ═══ */}
      <header className="sticky top-0 z-30" style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-[1192px] mx-auto px-6 flex items-center justify-between h-14">
          <h1 className="text-[22px] font-bold" style={{ color: 'var(--foreground)' }}>Blog</h1>
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-[14px] rounded-full w-[220px] outline-none"
                style={{ background: 'var(--surface-secondary)', color: 'var(--foreground)', border: 'none' }}
              />
            </form>
            {isAuthenticated && (
              <Link href="/blog/create"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[14px] font-medium transition-colors"
                style={{ background: 'var(--accent)', color: '#fff' }}>
                <Plus className="w-4 h-4" /> Write
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ═══ TRENDING SECTION ═══ */}
      {trendingPosts.length > 0 && !search && (
        <section className="py-10" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-[1192px] mx-auto px-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--foreground)' }} />
              <h2 className="text-[16px] font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>Trending on mepiks</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
              {trendingPosts.slice(0, 6).map((post, i) => (
                <TrendingItem key={post._id} post={post} rank={i + 1} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ TOPIC TABS + SORT ═══ */}
      <div className="sticky top-14 z-20" style={{ background: 'var(--background)' }}>
        <div className="max-w-[1192px] mx-auto px-6">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide" style={{ borderBottom: '1px solid var(--border)' }}>
            {BLOG_CATEGORIES.map((cat) => {
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className="shrink-0 px-4 py-3.5 text-[14px] transition-colors relative"
                  style={{ color: active ? 'var(--foreground)' : 'var(--text-tertiary)', fontWeight: active ? 600 : 400 }}
                >
                  {cat.name}
                  {active && (
                    <span className="absolute bottom-0 left-4 right-4 h-[1px]" style={{ background: 'var(--foreground)' }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <section className="max-w-[1192px] mx-auto px-6 pt-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-14">
          {/* Article Feed */}
          <div>
            {/* Sort pills */}
            <div className="flex items-center gap-2 mb-6">
              {[
                { key: 'recent', label: 'Latest' },
                { key: 'popular', label: 'Popular' },
                { key: 'featured', label: 'Featured' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSort(opt.key)}
                  className="px-3.5 py-1.5 rounded-full text-[13px] transition-colors"
                  style={sort === opt.key
                    ? { background: 'var(--foreground)', color: 'var(--background)', fontWeight: 500 }
                    : { background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Articles */}
            {isLoading && posts.length === 0 ? (
              <div className="space-y-0">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="py-7 flex gap-6" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="skeleton w-5 h-5 rounded-full" />
                        <div className="skeleton h-3 w-24 rounded" />
                      </div>
                      <div className="skeleton h-5 w-4/5 rounded" />
                      <div className="skeleton h-4 w-full rounded" />
                      <div className="flex items-center gap-3">
                        <div className="skeleton h-3 w-16 rounded-full" />
                        <div className="skeleton h-3 w-20 rounded" />
                      </div>
                    </div>
                    <div className="hidden sm:block skeleton w-[200px] h-[134px] rounded shrink-0" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--border-strong)' }} />
                <h3 className="text-[18px] font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  No articles found
                </h3>
                <p className="text-[15px] mb-6" style={{ color: 'var(--text-secondary)' }}>
                  {search ? `No results for "${search}"` : 'Be the first to share your knowledge!'}
                </p>
                {isAuthenticated && (
                  <Link href="/blog/create"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-medium"
                    style={{ background: 'var(--accent)', color: '#fff' }}>
                    <Plus className="w-4 h-4" /> Write Article
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div>
                  {posts.map((post) => (
                    <ArticleCard key={post._id} post={post} />
                  ))}
                </div>
                {hasMore && (
                  <div className="text-center mt-10">
                    <button onClick={loadMore} disabled={isLoading}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-[14px] font-medium transition-colors"
                      style={{ border: '1px solid var(--border-strong)', color: 'var(--foreground)', background: 'transparent' }}>
                      {isLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--foreground)' }} />
                          Loading...
                        </>
                      ) : (
                        <>Show more <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block space-y-8 pt-2">
            {/* Recommended Topics */}
            <div>
              <h3 className="text-[16px] font-bold mb-4" style={{ color: 'var(--foreground)' }}>
                Recommended topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {BLOG_CATEGORIES.filter(c => c.id).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className="px-4 py-2 rounded-full text-[14px] transition-colors"
                    style={category === cat.id
                      ? { background: 'var(--foreground)', color: 'var(--background)' }
                      : { background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }
                    }
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Write CTA */}
            <div className="rounded-2xl p-6" style={{ background: 'var(--surface-secondary)' }}>
              <h3 className="text-[16px] font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                Writing on mepiks
              </h3>
              <p className="text-[14px] leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                Share your ideas, tutorials, and insights with the community.
              </p>
              <Link href={isAuthenticated ? '/blog/create' : '/login'}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-medium transition-colors"
                style={{ background: 'var(--foreground)', color: 'var(--background)' }}>
                Start writing
              </Link>
            </div>

            {/* Popular Tags */}
            <div>
              <h3 className="text-[16px] font-bold mb-4" style={{ color: 'var(--foreground)' }}>
                Popular tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {['React', 'Next.js', 'TypeScript', 'Python', 'AI', 'DevOps', 'Docker', 'Rust', 'CSS', 'APIs'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => { setSearch(tag.toLowerCase()); setPage(1); fetchPosts(1, true); }}
                    className="text-[13px] px-3 py-1.5 rounded-full transition-colors"
                    style={{ background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}
                  >
                    {tag}
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
