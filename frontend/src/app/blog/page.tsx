'use client';

import { useState, useEffect, useCallback } from 'react';
import { blogAPI } from '@/lib/api';
import { BlogPost } from '@/types';
import { useAppSelector } from '@/store/hooks';
import Link from 'next/link';
import Footer from '@/components/layout/Footer';
import {
  Clock, Eye, Heart, MessageCircle, Search, Plus,
  TrendingUp, BookOpen, ChevronRight, Tag,
} from 'lucide-react';

const BLOG_CATEGORIES = [
  { id: '', name: 'All', icon: '📰' },
  { id: 'technology', name: 'Technology', icon: '💻' },
  { id: 'ai', name: 'AI', icon: '🤖' },
  { id: 'web-development', name: 'Web Dev', icon: '🌐' },
  { id: 'mobile', name: 'Mobile', icon: '📱' },
  { id: 'cloud', name: 'Cloud', icon: '☁️' },
  { id: 'cybersecurity', name: 'Security', icon: '🔒' },
  { id: 'tutorials', name: 'Tutorials', icon: '📚' },
  { id: 'news', name: 'News', icon: '📰' },
];

export default function BlogPage() {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');

  const fetchPosts = useCallback(async (pageNum: number, reset = false) => {
    try {
      setIsLoading(true);
      const { data } = await blogAPI.getPosts({
        page: pageNum, limit: 12, category: category || undefined,
        search: search || undefined, sort,
      });
      if (reset) setPosts(data.data);
      else setPosts((prev) => [...prev, ...data.data]);
      setHasMore(data.pagination.hasMore);
    } catch (e) {
      console.error('Failed to fetch blog posts:', e);
    } finally {
      setIsLoading(false);
    }
  }, [category, search, sort]);

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
      {/* Hero */}
      <section className="relative py-16 text-center px-4">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded mb-6"
            style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }}>
            <BookOpen className="w-3.5 h-3.5 text-edith-cyan" />
            <span className="text-[11px] font-mono font-medium tracking-wider text-edith-cyan/70 uppercase">
              Tech Blog
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 tracking-tight">
            <span style={{ color: 'var(--edith-text)' }}>Latest </span>
            <span className="text-gradient">Tech Insights</span>
          </h1>
          <p className="text-sm font-mono text-[var(--edith-text-dim)] max-w-xl mx-auto">
            Stay updated with the latest in technology, AI, web development, and more.
          </p>
        </div>
      </section>

      {/* Search & Controls */}
      <section className="max-w-6xl mx-auto px-4 mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <form onSubmit={handleSearch} className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-edith-cyan/40" />
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </form>
          {isAuthenticated && (
            <Link href="/blog/create" className="btn-primary gap-2 shrink-0">
              <Plus className="w-4 h-4" /> Write Article
            </Link>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 mb-8">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
          {BLOG_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`shrink-0 px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                category === cat.id
                  ? 'text-edith-cyan border border-edith-cyan/30'
                  : 'text-[var(--edith-text-dim)] border border-[var(--edith-border)] hover:border-edith-cyan/15'
              }`}
              style={category === cat.id ? { background: 'rgba(0,212,255,0.08)' } : { background: 'rgba(255,255,255,0.02)' }}
            >
              <span className="mr-1">{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Sort */}
      <section className="max-w-6xl mx-auto px-4 mb-6">
        <div className="flex items-center gap-2">
          {[
            { key: 'recent', label: 'Latest', icon: Clock },
            { key: 'popular', label: 'Popular', icon: Eye },
            { key: 'trending', label: 'Trending', icon: TrendingUp },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSort(opt.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-mono font-medium tracking-wider transition-all ${
                sort === opt.key ? 'text-edith-cyan' : 'text-[var(--edith-text-dim)]'
              }`}
              style={sort === opt.key ? { background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' } : { border: '1px solid transparent' }}
            >
              <opt.icon className="w-3 h-3" /> {opt.label.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      {/* Posts Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        {isLoading && posts.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="skeleton h-48 w-full mb-4 rounded" />
                <div className="skeleton h-4 w-3/4 mb-2 rounded" />
                <div className="skeleton h-3 w-full mb-2 rounded" />
                <div className="skeleton h-3 w-2/3 rounded" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 mx-auto text-edith-cyan/30 mb-4" />
            <h3 className="text-lg font-display font-semibold mb-2" style={{ color: 'var(--edith-text)' }}>
              No articles found
            </h3>
            <p className="text-sm font-mono text-[var(--edith-text-dim)]">
              Be the first to share your knowledge!
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link key={post._id} href={`/blog/${post.slug}`} className="card group overflow-hidden hover:border-edith-cyan/20 transition-all">
                  {post.coverImage?.url && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={post.coverImage.url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-edith-cyan/60 px-2 py-0.5 rounded"
                        style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)' }}>
                        {post.category}
                      </span>
                      <span className="text-[9px] font-mono text-[var(--edith-text-dim)] flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {post.readTime} min read
                      </span>
                    </div>
                    <h2 className="text-sm font-semibold mb-2 line-clamp-2 group-hover:text-edith-cyan transition-colors"
                      style={{ color: 'var(--edith-text)' }}>
                      {post.title}
                    </h2>
                    <p className="text-xs font-mono text-[var(--edith-text-dim)] line-clamp-2 mb-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {post.author?.avatar ? (
                          <img src={post.author.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-edith-cyan/10 flex items-center justify-center text-[8px] font-bold text-edith-cyan">
                            {post.author?.displayName?.[0]}
                          </div>
                        )}
                        <span className="text-[10px] font-mono text-[var(--edith-text-dim)]">
                          {post.author?.displayName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[9px] font-mono text-[var(--edith-text-dim)]">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.viewsCount}</span>
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likesCount}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {hasMore && (
              <div className="text-center mt-8">
                <button onClick={loadMore} disabled={isLoading} className="btn-secondary">
                  {isLoading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </div>
  );
}
