'use client';

import { useState, useEffect, useCallback } from 'react';
import { postsAPI, categoriesAPI, searchAPI } from '@/lib/api';
import MasonryFeed from '@/components/feed/MasonryFeed';
import { FeedSkeleton } from '@/components/shared/Skeletons';
import { Post, Category } from '@/types';
import { TrendingUp, Flame, Clock, Star, Sparkles } from 'lucide-react';
import Link from 'next/link';

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

  // Initial load
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
    { key: 'recent', label: 'Latest', icon: <Clock className="w-4 h-4" /> },
    { key: 'popular', label: 'Popular', icon: <Flame className="w-4 h-4" /> },
    { key: 'trending', label: 'Trending', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'featured', label: 'Featured', icon: <Star className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-purple-50 dark:from-surface-950 dark:via-surface-900 dark:to-brand-950 py-12 md:py-16">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-400/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center px-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100/80 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-sm font-medium mb-6 backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
            Discover & Shop Visual Inspiration
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
            Find Products You&apos;ll{' '}
            <span className="text-gradient">Love</span>
          </h1>
          <p className="text-lg text-surface-500 dark:text-surface-400 max-w-2xl mx-auto">
            Explore a curated collection of amazing products, AI-generated art, and creative inspiration. Save, share, and shop.
          </p>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="border-b border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-950 sticky top-16 z-30">
          <div className="max-w-[2000px] mx-auto">
            <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => { setSelectedCategory(''); setSelectedTag(''); }}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${!selectedCategory && !selectedTag
                    ? 'bg-surface-900 dark:bg-white text-white dark:text-surface-900'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                  }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => { setSelectedCategory(cat._id); setSelectedTag(''); }}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5
                    ${selectedCategory === cat._id
                      ? 'text-white shadow-sm'
                      : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                    }`}
                  style={selectedCategory === cat._id ? { backgroundColor: cat.color } : {}}
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending tags */}
      {trendingTags.length > 0 && (
        <section className="max-w-[2000px] mx-auto px-4 py-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider shrink-0">Trending:</span>
            {trendingTags.slice(0, 10).map((t) => (
              <button
                key={t.tag}
                onClick={() => { setSelectedTag(t.tag); setSelectedCategory(''); }}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all
                  ${selectedTag === t.tag
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-700'
                  }`}
              >
                #{t.tag}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Sort tabs */}
      <section className="max-w-[2000px] mx-auto px-4 pb-4">
        <div className="flex items-center gap-1">
          {sortOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSort(opt.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all
                ${sort === opt.key
                  ? 'bg-surface-900 dark:bg-white text-white dark:text-surface-900 shadow-sm'
                  : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800'
                }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Feed */}
      <section className="max-w-[2000px] mx-auto px-3">
        {isLoading && posts.length === 0 ? (
          <FeedSkeleton />
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No posts found</h3>
            <p className="text-surface-400">Try changing your filters or check back later</p>
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
