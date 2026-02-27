'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchFeed, fetchCategories, fetchTrendingTags, clearFeed,
} from '@/store/slices/postSlice';
import { selectFeedPosts, selectFeedMeta, selectFeedLoading, selectCategories, selectTrendingTags } from '@/store/selectors';
import MasonryFeed from '@/components/feed/MasonryFeed';
import { FeedSkeleton } from '@/components/shared/Skeletons';
import {
  TrendingUp, Flame, Clock, Star,
  Crosshair, Zap, Hash, ChevronRight,
} from 'lucide-react';

type SortOption = 'recent' | 'popular' | 'trending' | 'featured';

export default function HomePage() {
  const dispatch = useAppDispatch();
  const posts = useAppSelector(selectFeedPosts);
  const categories = useAppSelector(selectCategories);
  const trendingTags = useAppSelector(selectTrendingTags);
  const feedMeta = useAppSelector(selectFeedMeta);
  const isLoading = useAppSelector(selectFeedLoading);

  const [sort, setSort] = useState<SortOption>((feedMeta.sort as SortOption) || 'recent');
  const [selectedCategory, setSelectedCategory] = useState(feedMeta.category || '');
  const [selectedTag, setSelectedTag] = useState(feedMeta.tag || '');

  // Load reference data (cached)
  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchTrendingTags());
  }, [dispatch]);

  // Fetch feed when filters change
  useEffect(() => {
    dispatch(fetchFeed({ page: 1, sort, category: selectedCategory, tag: selectedTag, reset: true }));
  }, [dispatch, sort, selectedCategory, selectedTag]);

  const loadMore = useCallback(() => {
    if (!isLoading && feedMeta.hasMore) {
      dispatch(fetchFeed({
        page: feedMeta.page + 1,
        sort,
        category: selectedCategory,
        tag: selectedTag,
      }));
    }
  }, [dispatch, isLoading, feedMeta, sort, selectedCategory, selectedTag]);

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
                'radial-gradient(circle, var(--edith-radial-hero) 0%, transparent 70%)',
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
              background: 'var(--edith-accent-subtle)',
              border: '1px solid var(--edith-border)',
            }}
          >
            <Crosshair className="w-3.5 h-3.5 text-edith-cyan" />
            <span className="text-[11px] font-mono font-medium tracking-wider uppercase" style={{ color: 'var(--edith-text-dim)' }}>
              Visual Target Discovery System
            </span>
            <div className="w-1 h-1 rounded-full bg-edith-green animate-pulse" />
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 tracking-tight">
            <span style={{ color: 'var(--edith-gradient-text)' }}>Acquire </span>
            <span className="text-gradient">Targets</span>
          </h1>

          <p className="text-sm md:text-base font-mono max-w-2xl mx-auto tracking-wide" style={{ color: 'var(--edith-text-muted)' }}>
            // Scanning visual database... Discover products, AI-generated art,
            and creative assets. Analyze. Collect. Deploy.
          </p>

          {/* HUD decorative line */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="h-[1px] w-20" style={{ background: 'linear-gradient(90deg, transparent, var(--edith-border-strong))' }} />
            <Zap className="w-3 h-3" style={{ color: 'var(--edith-text-muted)' }} />
            <div className="h-[1px] w-20" style={{ background: 'linear-gradient(90deg, var(--edith-border-strong), transparent)' }} />
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      {categories.length > 0 && (
        <section
          className="sticky top-14 z-30"
          style={{
            background: 'var(--edith-header-bg)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--edith-border)',
          }}
        >
          <div className="max-w-[2000px] mx-auto">
            <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => { setSelectedCategory(''); setSelectedTag(''); }}
                className={`shrink-0 px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-300 ${
                  !selectedCategory && !selectedTag
                    ? 'text-edith-cyan border border-edith-cyan/30'
                    : 'border hover:border-edith-cyan/15'
                }`}
                style={{
                  ...((!selectedCategory && !selectedTag)
                    ? { background: 'var(--edith-accent-muted)', boxShadow: 'var(--edith-shadow-sm)' }
                    : { background: 'var(--edith-tag-bg)', borderColor: 'var(--edith-tag-border)', color: 'var(--edith-tag-text)' })
                }}
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
                      : 'border hover:border-edith-cyan/15'
                  }`}
                  style={
                    selectedCategory === cat._id
                      ? {
                          backgroundColor: `${cat.color}22`,
                          borderColor: `${cat.color}66`,
                          color: cat.color,
                          boxShadow: `var(--edith-shadow-sm)`,
                        }
                      : { background: 'var(--edith-tag-bg)', borderColor: 'var(--edith-tag-border)', color: 'var(--edith-tag-text)' }
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
            <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] shrink-0 flex items-center gap-1.5" style={{ color: 'var(--edith-text-muted)' }}>
              <TrendingUp className="w-3 h-3" />
              TRENDING
            </span>
            <ChevronRight className="w-3 h-3 shrink-0" style={{ color: 'var(--edith-text-muted)' }} />
            {trendingTags.slice(0, 10).map((t) => (
              <button
                key={t.tag}
                onClick={() => { setSelectedTag(t.tag); setSelectedCategory(''); }}
                className={`shrink-0 px-2.5 py-1 rounded text-[10px] font-mono tracking-wider transition-all duration-300 flex items-center gap-1 ${
                  selectedTag === t.tag
                    ? 'text-edith-cyan border border-edith-cyan/30'
                    : 'border hover:text-edith-cyan/60 hover:border-edith-cyan/10'
                }`}
                style={
                  selectedTag === t.tag
                    ? { background: 'var(--edith-accent-muted)' }
                    : { background: 'var(--edith-tag-bg)', borderColor: 'var(--edith-tag-border)', color: 'var(--edith-tag-text)' }
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
                  : ''
              }`}
              style={
                sort === opt.key
                  ? {
                      background: 'var(--edith-accent-muted)',
                      border: '1px solid var(--edith-border-strong)',
                      boxShadow: 'var(--edith-shadow-sm)',
                    }
                  : {
                      background: 'transparent',
                      border: '1px solid transparent',
                      color: 'var(--edith-tag-text)',
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
            <h3 className="text-lg font-display font-semibold mb-2 tracking-wider" style={{ color: 'var(--edith-text-secondary)' }}>
              NO TARGETS FOUND
            </h3>
            <p className="text-sm font-mono" style={{ color: 'var(--edith-text-muted)' }}>
              // Adjust scan parameters or check back later
            </p>
          </div>
        ) : (
          <MasonryFeed
            posts={posts}
            hasMore={feedMeta.hasMore}
            onLoadMore={loadMore}
            isLoading={isLoading}
          />
        )}
      </section>
    </div>
  );
}
