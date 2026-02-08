'use client';

import { useState, useEffect, useCallback } from 'react';
import { postsAPI, categoriesAPI, searchAPI } from '@/lib/api';
import MasonryFeed from '@/components/feed/MasonryFeed';
import { FeedSkeleton } from '@/components/shared/Skeletons';
import { Post, Category } from '@/types';
import {
  TrendingUp, Flame, Clock, Star,
  Crosshair, Zap, Hash, ChevronRight,
} from 'lucide-react';

type SortOption = 'recent' | 'popular' | 'trending' | 'featured';

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [trendingTags, setTrendingTags] = useState<{ tag: string; count: number }[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>('recent');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  const fetchPosts = useCallback(
    async (pageNum: number, reset = false) => {
      try {
        setIsLoading(true);
        const { data } = await postsAPI.getFeed({
          page: pageNum,
          limit: 30,
          sort,
          category: selectedCategory || undefined,
          tag: selectedTag || undefined,
        });
        if (reset) {
          setPosts(data.data);
        } else {
          setPosts((prev) => [...prev, ...data.data]);
        }
        setHasMore(data.pagination.hasMore);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [sort, selectedCategory, selectedTag]
  );

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [catRes, tagsRes] = await Promise.all([
          categoriesAPI.getAll(),
          searchAPI.getTrendingTags(),
        ]);
        setCategories(catRes.data.data);
        setTrendingTags(tagsRes.data.data);
      } catch (e) {
        console.error('Failed to load categories/tags:', e);
      }
    };
    loadInitial();
  }, []);

  useEffect(() => {
    setPage(1);
    fetchPosts(1, true);
  }, [fetchPosts]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage);
    }
  }, [isLoading, hasMore, page, fetchPosts]);

  const sortOptions: { key: SortOption; label: string; icon: React.ReactNode }[] = [
    { key: 'recent', label: 'LATEST', icon: <Clock className="w-3 h-3" /> },
    { key: 'popular', label: 'POPULAR', icon: <Flame className="w-3 h-3" /> },
    { key: 'trending', label: 'TRENDING', icon: <TrendingUp className="w-3 h-3" /> },
    { key: 'featured', label: 'FEATURED', icon: <Star className="w-3 h-3" /> },
  ];

  return (
    <div className="min-h-screen">
      {/* ── EDITH Hero HUD ── */}
      <section className="relative overflow-hidden py-16 md:py-20">
        {/* HUD background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
            style={{
              background:
                'radial-gradient(circle, rgba(0,212,255,0.08) 0%, rgba(0,136,255,0.04) 40%, transparent 70%)',
            }}
          />
          <div
            className="absolute -top-20 -right-20 w-60 h-60 opacity-30"
            style={{
              background:
                'radial-gradient(circle, rgba(191,0,255,0.06) 0%, transparent 70%)',
            }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto text-center px-4">
          {/* HUD badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded mb-6"
            style={{
              background: 'rgba(0,212,255,0.05)',
              border: '1px solid rgba(0,212,255,0.15)',
            }}
          >
            <Crosshair className="w-3.5 h-3.5 text-edith-cyan" />
            <span className="text-[11px] font-mono font-medium tracking-wider text-edith-cyan/70 uppercase">
              Visual Target Discovery System
            </span>
            <div className="w-1 h-1 rounded-full bg-edith-green animate-pulse" />
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 tracking-tight">
            <span className="text-white/90">Acquire </span>
            <span className="text-gradient">Targets</span>
          </h1>

          <p className="text-sm md:text-base font-mono text-white/30 max-w-2xl mx-auto tracking-wide">
            // Scanning visual database... Discover products, AI-generated art,
            and creative assets. Analyze. Collect. Deploy.
          </p>

          {/* HUD decorative line */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="h-[1px] w-20" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.3))' }} />
            <Zap className="w-3 h-3 text-edith-cyan/30" />
            <div className="h-[1px] w-20" style={{ background: 'linear-gradient(90deg, rgba(0,212,255,0.3), transparent)' }} />
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      {categories.length > 0 && (
        <section
          className="sticky top-14 z-30"
          style={{
            background: 'rgba(5,5,16,0.9)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0,212,255,0.06)',
          }}
        >
          <div className="max-w-[2000px] mx-auto">
            <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => { setSelectedCategory(''); setSelectedTag(''); }}
                className={`shrink-0 px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-300 ${
                  !selectedCategory && !selectedTag
                    ? 'text-edith-cyan border border-edith-cyan/30'
                    : 'text-white/30 border border-white/[0.06] hover:border-edith-cyan/15 hover:text-white/50'
                }`}
                style={
                  !selectedCategory && !selectedTag
                    ? { background: 'rgba(0,212,255,0.08)', boxShadow: '0 0 15px rgba(0,212,255,0.08)' }
                    : { background: 'rgba(255,255,255,0.02)' }
                }
              >
                ALL
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => { setSelectedCategory(cat._id); setSelectedTag(''); }}
                  className={`shrink-0 px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${
                    selectedCategory === cat._id
                      ? 'text-white border'
                      : 'text-white/30 border border-white/[0.06] hover:border-edith-cyan/15 hover:text-white/50'
                  }`}
                  style={
                    selectedCategory === cat._id
                      ? {
                          backgroundColor: `${cat.color}22`,
                          borderColor: `${cat.color}66`,
                          color: cat.color,
                          boxShadow: `0 0 15px ${cat.color}22`,
                        }
                      : { background: 'rgba(255,255,255,0.02)' }
                  }
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Trending Tags ── */}
      {trendingTags.length > 0 && (
        <section className="max-w-[2000px] mx-auto px-4 py-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <span className="text-[9px] font-mono font-bold text-edith-cyan/30 uppercase tracking-[0.2em] shrink-0 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" />
              TRENDING
            </span>
            <ChevronRight className="w-3 h-3 text-white/10 shrink-0" />
            {trendingTags.slice(0, 10).map((t) => (
              <button
                key={t.tag}
                onClick={() => { setSelectedTag(t.tag); setSelectedCategory(''); }}
                className={`shrink-0 px-2.5 py-1 rounded text-[10px] font-mono tracking-wider transition-all duration-300 flex items-center gap-1 ${
                  selectedTag === t.tag
                    ? 'text-edith-cyan border border-edith-cyan/30'
                    : 'text-white/25 border border-white/[0.05] hover:text-white/40 hover:border-edith-cyan/10'
                }`}
                style={
                  selectedTag === t.tag
                    ? { background: 'rgba(0,212,255,0.08)' }
                    : { background: 'rgba(255,255,255,0.01)' }
                }
              >
                <Hash className="w-2.5 h-2.5" />
                {t.tag}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Sort Tabs ── */}
      <section className="max-w-[2000px] mx-auto px-4 pb-4">
        <div className="flex items-center gap-1">
          {sortOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSort(opt.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-mono font-medium tracking-wider transition-all duration-300 ${
                sort === opt.key
                  ? 'text-edith-cyan'
                  : 'text-white/25 hover:text-white/40'
              }`}
              style={
                sort === opt.key
                  ? {
                      background: 'rgba(0,212,255,0.08)',
                      border: '1px solid rgba(0,212,255,0.2)',
                      boxShadow: '0 0 12px rgba(0,212,255,0.06)',
                    }
                  : {
                      background: 'transparent',
                      border: '1px solid transparent',
                    }
              }
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Feed ── */}
      <section className="max-w-[2000px] mx-auto px-3">
        {isLoading && posts.length === 0 ? (
          <FeedSkeleton />
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 opacity-30">
              <Crosshair className="w-16 h-16 mx-auto text-edith-cyan/30" />
            </div>
            <h3 className="text-lg font-display font-semibold mb-2 text-white/60 tracking-wider">
              NO TARGETS FOUND
            </h3>
            <p className="text-sm font-mono text-white/20">
              // Adjust scan parameters or check back later
            </p>
          </div>
        ) : (
          <MasonryFeed
            posts={posts}
            hasMore={hasMore}
            onLoadMore={loadMore}
            isLoading={isLoading}
          />
        )}
      </section>
    </div>
  );
}
