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
  TrendingUp, Flame, Clock, Star, Search,
} from 'lucide-react';

type SortOption = 'recent' | 'popular' | 'trending' | 'featured';

const SORT_OPTIONS: { key: SortOption; label: string; icon: React.ReactNode }[] = [
  { key: 'recent', label: 'Latest', icon: <Clock className="w-3.5 h-3.5" /> },
  { key: 'popular', label: 'Popular', icon: <Flame className="w-3.5 h-3.5" /> },
  { key: 'trending', label: 'Trending', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { key: 'featured', label: 'Featured', icon: <Star className="w-3.5 h-3.5" /> },
];

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

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchTrendingTags());
  }, [dispatch]);

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

  return (
    <div className="min-h-screen">
      {/* ── Category Bar ── */}
      {categories.length > 0 && (
        <section
          className="sticky top-14 z-30 border-b"
          style={{
            background: 'var(--header-bg)',
            backdropFilter: 'blur(20px)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="max-w-[2000px] mx-auto">
            <div className="flex items-center gap-2 px-4 sm:px-6 py-3 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => { setSelectedCategory(''); setSelectedTag(''); }}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  !selectedCategory && !selectedTag
                    ? 'text-[var(--text-on-accent)]'
                    : 'hover:bg-[var(--surface-secondary)]'
                }`}
                style={
                  !selectedCategory && !selectedTag
                    ? { background: 'var(--foreground)', color: 'var(--background)' }
                    : { color: 'var(--text-secondary)' }
                }
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => { setSelectedCategory(cat._id); setSelectedTag(''); }}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    selectedCategory === cat._id
                      ? ''
                      : 'hover:bg-[var(--surface-secondary)]'
                  }`}
                  style={
                    selectedCategory === cat._id
                      ? { background: 'var(--foreground)', color: 'var(--background)' }
                      : { color: 'var(--text-secondary)' }
                  }
                >
                  {cat.icon && <span>{cat.icon}</span>}
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Trending Tags ── */}
      {trendingTags.length > 0 && (
        <section className="max-w-[2000px] mx-auto px-4 sm:px-6 pt-5 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <span className="text-xs font-medium shrink-0 flex items-center gap-1.5"
              style={{ color: 'var(--text-tertiary)' }}>
              <TrendingUp className="w-3.5 h-3.5" />
              Trending
            </span>
            {trendingTags.slice(0, 10).map((t) => (
              <button
                key={t.tag}
                onClick={() => { setSelectedTag(t.tag); setSelectedCategory(''); }}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                  selectedTag === t.tag ? '' : 'hover:bg-[var(--surface-hover)]'
                }`}
                style={
                  selectedTag === t.tag
                    ? { background: 'var(--foreground)', color: 'var(--background)' }
                    : { background: 'var(--tag-bg)', border: '1px solid var(--tag-border)', color: 'var(--tag-text)' }
                }
              >
                #{t.tag}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Sort Tabs ── */}
      <section className="max-w-[2000px] mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center gap-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSort(opt.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                sort === opt.key ? '' : 'hover:bg-[var(--surface-secondary)]'
              }`}
              style={
                sort === opt.key
                  ? { background: 'var(--surface-secondary)', color: 'var(--foreground)' }
                  : { color: 'var(--text-tertiary)' }
              }
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Feed ── */}
      <section className="max-w-[2000px] mx-auto px-3 sm:px-5">
        {isLoading && posts.length === 0 ? (
          <FeedSkeleton />
        ) : posts.length === 0 ? (
          <div className="text-center py-24">
            <Search className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
              No posts found
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Try adjusting your filters or check back later
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
