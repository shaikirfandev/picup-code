'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { searchAPI, categoriesAPI } from '@/lib/api';
import PostCard from '@/components/feed/PostCard';
import { Post, Category } from '@/types';
import {
  Search as SearchIcon, SlidersHorizontal, X,
  TrendingUp, Crosshair, Hash, Loader2,
} from 'lucide-react';
import Masonry from 'react-masonry-css';
import { useInfiniteScroll } from '@/hooks';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialTag = searchParams.get('tag') || '';

  const [query, setQuery] = useState(initialQuery);
  const [tag, setTag] = useState(initialTag);
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [trending, setTrending] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  useEffect(() => {
    categoriesAPI.getAll().then(({ data }: any) => setCategories(data.data || [])).catch(() => {});
    searchAPI.getTrendingTags().then(({ data }: any) => setTrending(data.data?.tags || [])).catch(() => {});
  }, []);

  const doSearch = async (pageNum = 1) => {
    if (!query.trim() && !tag) return;
    setIsLoading(true);
    try {
      const params: any = { page: pageNum, limit: 30, sort: sortBy };
      if (query.trim()) params.q = query.trim();
      if (tag) params.tag = tag;
      if (category) params.category = category;
      if (priceMin) params.priceMin = priceMin;
      if (priceMax) params.priceMax = priceMax;

      const { data } = await searchAPI.searchPosts(params);
      const newPosts = data.data || [];
      setPosts(pageNum === 1 ? newPosts : [...posts, ...newPosts]);
      setHasMore(newPosts.length === 30);
      setPage(pageNum);
    } catch { /* silent */ }
    setIsLoading(false);
  };

  useEffect(() => {
    if (initialQuery || initialTag) doSearch(1);
  }, [initialQuery, initialTag]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTag('');
    setPosts([]);
    doSearch(1);
  };

  const handleTagClick = (t: string) => {
    setTag(t);
    setQuery('');
    setPosts([]);
    doSearch(1);
  };

  const loadMoreRef = useInfiniteScroll(() => {
    if (!isLoading) doSearch(page + 1);
  }, hasMore);

  return (
    <div className="min-h-screen">
      <div className="max-w-[2000px] mx-auto px-4 py-8">
        {/* Search form */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-8">
          <div className="relative group">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-edith-cyan/30 group-focus-within:text-edith-cyan/60 transition-colors" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SEARCH TARGETS, PRODUCTS, TAGS..."
              className="w-full pl-11 pr-28 py-3.5 rounded text-[12px] font-mono tracking-wider outline-none transition-all duration-300"
              style={{
                background: 'rgba(0,212,255,0.03)',
                border: '1px solid rgba(0,212,255,0.1)',
                color: 'var(--edith-text)',
              }}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded transition-all duration-300 ${
                  showFilters ? 'text-edith-cyan bg-edith-cyan/10' : 'text-white/20 hover:text-edith-cyan/50'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              <button type="submit" className="btn-primary px-4 py-1.5 text-[10px]">
                SCAN
              </button>
            </div>
            <div
              className="absolute bottom-0 left-0 right-0 h-[1px] opacity-0 group-focus-within:opacity-100 transition-opacity"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.3), transparent)' }}
            />
          </div>
        </form>

        {/* Active tag */}
        {tag && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <span
              className="px-3 py-1.5 rounded text-[11px] font-mono font-bold text-edith-cyan tracking-wider flex items-center gap-1.5"
              style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}
            >
              <Hash className="w-3 h-3" />{tag}
            </span>
            <button
              onClick={() => { setTag(''); setPosts([]); }}
              className="p-1 text-white/20 hover:text-edith-red/60 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="max-w-2xl mx-auto mb-8 card p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field text-[11px]">
                <option value="">ALL CATEGORIES</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
                ))}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-field text-[11px]">
                <option value="recent">MOST RECENT</option>
                <option value="popular">MOST POPULAR</option>
                <option value="price-low">PRICE: LOW → HIGH</option>
                <option value="price-high">PRICE: HIGH → LOW</option>
              </select>
              <input value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="MIN PRICE" type="number" className="input-field text-[11px]" />
              <input value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="MAX PRICE" type="number" className="input-field text-[11px]" />
            </div>
            <button onClick={() => doSearch(1)} className="btn-primary mt-4 text-[10px] py-2 px-4">
              APPLY FILTERS
            </button>
          </div>
        )}

        {/* Trending tags */}
        {!query && !tag && trending.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-display font-bold mb-3 flex items-center gap-2 text-white/50 tracking-wider">
              <TrendingUp className="w-4 h-4 text-edith-cyan/50" />
              TRENDING TAGS
            </h2>
            <div className="flex flex-wrap gap-2">
              {trending.map((t) => (
                <button
                  key={t}
                  onClick={() => handleTagClick(t)}
                  className="px-3 py-1.5 rounded text-[10px] font-mono tracking-wider text-white/25 transition-all duration-300 hover:text-edith-cyan/60 hover:border-edith-cyan/15 flex items-center gap-1"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <Hash className="w-2.5 h-2.5" />{t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {posts.length > 0 ? (
          <Masonry
            breakpointCols={{ default: 5, 1280: 4, 1024: 3, 768: 2, 475: 2 }}
            className="masonry-grid"
            columnClassName="masonry-grid-column"
          >
            {posts.map((post, i) => (
              <PostCard key={post._id} post={post} index={i} />
            ))}
          </Masonry>
        ) : (
          !isLoading && (query || tag) && (
            <div className="text-center py-20">
              <Crosshair className="w-12 h-12 text-edith-cyan/15 mx-auto mb-3" />
              <p className="text-sm font-display font-medium text-white/40 tracking-wider">
                NO TARGETS FOUND
              </p>
              <p className="text-[11px] font-mono text-white/15 mt-1">
                // Try different scan parameters
              </p>
            </div>
          )
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Loader2 className="w-5 h-5 text-edith-cyan/40 animate-spin" />
            <span className="text-[10px] font-mono text-edith-cyan/20 tracking-wider">
              SCANNING...
            </span>
          </div>
        )}

        <div ref={loadMoreRef} className="h-4" />
      </div>
    </div>
  );
}
