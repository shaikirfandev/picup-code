'use client';

import { useState, useEffect, useCallback } from 'react';
import { postsAPI, categoriesAPI, searchAPI } from '@/lib/api';
import MasonryFeed from '@/components/feed/MasonryFeed';
import { FeedSkeleton } from '@/components/shared/Skeletons';
import MatrixText from '@/components/ui/MatrixText';
import { Post, Category } from '@/types';
import { TrendingUp, Flame, Clock, Star, Zap, ChevronRight } from 'lucide-react';

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
          page: pageNum, limit: 30, sort,
          category: selectedCategory || undefined,
          tag: selectedTag || undefined,
        });
        if (reset) setPosts(data.data);
        else setPosts((prev) => [...prev, ...data.data]);
        setHasMore(data.pagination.hasMore);
      } catch (error) { console.error('Failed to fetch posts:', error); }
      finally { setIsLoading(false); }
    },
    [sort, selectedCategory, selectedTag]
  );

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [catRes, tagsRes] = await Promise.all([
          categoriesAPI.getAll(), searchAPI.getTrendingTags(),
        ]);
        setCategories(catRes.data.data);
        setTrendingTags(tagsRes.data.data);
      } catch (e) { console.error('Failed to load categories/tags:', e); }
    };
    loadInitial();
  }, []);

  useEffect(() => { setPage(1); fetchPosts(1, true); }, [fetchPosts]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage);
    }
  }, [isLoading, hasMore, page, fetchPosts]);

  const sortOptions: { key: SortOption; label: string; icon: React.ReactNode }[] = [
    { key: 'recent', label: 'LATEST', icon: <Clock className="w-3.5 h-3.5" /> },
    { key: 'popular', label: 'POPULAR', icon: <Flame className="w-3.5 h-3.5" /> },
    { key: 'trending', label: 'TRENDING', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { key: 'featured', label: 'FEATURED', icon: <Star className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-20">
        {/* Gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 left-1/3 w-[500px] h-[500px] bg-cyber-glow/[0.04] rounded-full blur-[100px]" />
          <div className="absolute -bottom-20 right-1/4 w-[400px] h-[400px] bg-cyber-purple/[0.05] rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center px-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 font-mono text-xs uppercase tracking-[0.2em]"
            style={{
              background: 'rgba(0,240,255,0.06)',
              border: '1px solid rgba(0,240,255,0.15)',
              color: 'var(--cyber-glow)',
              boxShadow: '0 0 15px rgba(0,240,255,0.08)',
            }}>
            <Zap className="w-3.5 h-3.5" />
            <span>Visual Discovery Interface</span>
            <ChevronRight className="w-3 h-3" />
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 tracking-tight leading-[1.1]">
            <span className="text-white">Find Products You&apos;ll </span>
            <MatrixText
              text="Love"
              className="text-gradient text-4xl md:text-5xl lg:text-6xl font-bold"
              speed={40}
              delay={500}
            />
          </h1>
          <p className="text-base text-white/40 max-w-2xl mx-auto font-mono leading-relaxed">
            &gt; Explore a curated collection of amazing products, AI-generated art, and creative inspiration.
          </p>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="sticky top-16 z-30"
          style={{
            background: 'rgba(10,10,15,0.8)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0,240,255,0.06)',
          }}>
          <div className="max-w-[2000px] mx-auto">
            <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
              <button onClick={() => { setSelectedCategory(''); setSelectedTag(''); }}
                className={`shrink-0 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all border
                  ${!selectedCategory && !selectedTag
                    ? 'bg-cyber-glow/10 border-cyber-glow/30 text-cyber-glow shadow-cyber'
                    : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/60 hover:border-white/10'}`}>
                ALL
              </button>
              {categories.map((cat) => (
                <button key={cat._id} onClick={() => { setSelectedCategory(cat._id); setSelectedTag(''); }}
                  className={`shrink-0 px-4 py-2 rounded-lg text-xs font-mono font-medium uppercase tracking-wider transition-all flex items-center gap-1.5 border
                    ${selectedCategory === cat._id
                      ? 'text-white shadow-cyber'
                      : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/60 hover:border-white/10'}`}
                  style={selectedCategory === cat._id
                    ? { backgroundColor: `${cat.color}22`, borderColor: `${cat.color}66`, boxShadow: `0 0 12px ${cat.color}33` }
                    : {}}>
                  <span>{cat.icon}</span>{cat.name}
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
            <span className="text-[10px] font-mono font-bold text-cyber-glow/40 uppercase tracking-[0.2em] shrink-0">&gt; TRENDING:</span>
            {trendingTags.slice(0, 10).map((t) => (
              <button key={t.tag} onClick={() => { setSelectedTag(t.tag); setSelectedCategory(''); }}
                className={`shrink-0 px-3 py-1 rounded-md text-[11px] font-mono transition-all border
                  ${selectedTag === t.tag
                    ? 'bg-cyber-glow/10 border-cyber-glow/30 text-cyber-glow shadow-cyber'
                    : 'bg-white/[0.02] border-white/[0.05] text-white/30 hover:text-cyber-glow/60 hover:border-cyber-glow/15'}`}>
                #{t.tag}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Sort */}
      <section className="max-w-[2000px] mx-auto px-4 pb-4">
        <div className="flex items-center gap-1.5">
          {sortOptions.map((opt) => (
            <button key={opt.key} onClick={() => setSort(opt.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider transition-all border
                ${sort === opt.key
                  ? 'bg-cyber-glow/10 border-cyber-glow/25 text-cyber-glow shadow-cyber'
                  : 'bg-transparent border-transparent text-white/30 hover:text-white/50 hover:bg-white/[0.02]'}`}>
              {opt.icon}{opt.label}
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
            <h3 className="text-xl font-bold neon-text mb-2 font-mono">NO DATA FOUND</h3>
            <p className="text-white/30 font-mono text-sm">&gt; Try changing your filters or check back later_</p>
          </div>
        ) : (
          <MasonryFeed posts={posts} hasMore={hasMore} onLoadMore={loadMore} isLoading={isLoading} />
        )}
      </section>
    </div>
  );
}
