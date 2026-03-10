'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { searchPosts, fetchCategories, fetchTrendingTags, clearSearch } from '@/store/slices/postSlice';
import { selectSearchPosts, selectSearchMeta, selectSearchLoading, selectCategories, selectTrendingTags } from '@/store/selectors';
import PostCard from '@/components/feed/PostCard';
import {
  Search as SearchIcon, SlidersHorizontal, X,
  TrendingUp, Crosshair, Hash, Loader2,
} from 'lucide-react';
import Masonry from 'react-masonry-css';
import { useInfiniteScroll } from '@/hooks';

export default function SearchPage() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialTag = searchParams.get('tag') || '';

  const posts = useAppSelector(selectSearchPosts);
  const categories = useAppSelector(selectCategories);
  const trendingTagsData = useAppSelector(selectTrendingTags);
  const trending = trendingTagsData.map((t) => t.tag);
  const { page, hasMore } = useAppSelector(selectSearchMeta);
  const isLoading = useAppSelector(selectSearchLoading);

  const [query, setQuery] = useState(initialQuery);
  const [tag, setTag] = useState(initialTag);
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchTrendingTags());
  }, [dispatch]);

  const doSearch = useCallback((
    pageNum = 1,
    overrides?: { q?: string; t?: string }
  ) => {
    const searchQuery = overrides?.q ?? query;
    const searchTag = overrides?.t ?? tag;
    if (!searchQuery.trim() && !searchTag) return;
    const params: any = { page: pageNum, limit: 30, sort: sortBy, reset: pageNum === 1 };
    if (searchQuery.trim()) params.q = searchQuery.trim();
    if (searchTag) params.tag = searchTag;
    if (category) params.category = category;
    dispatch(searchPosts(params));
  }, [dispatch, query, tag, sortBy, category]);

  useEffect(() => {
    if (initialQuery || initialTag) doSearch(1, { q: initialQuery, t: initialTag });
  }, [initialQuery, initialTag]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTag('');
    dispatch(clearSearch());
    doSearch(1, { q: query, t: '' });
  };

  const handleTagClick = (t: string) => {
    setTag(t);
    setQuery('');
    dispatch(clearSearch());
    doSearch(1, { q: '', t });
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
                background: 'var(--edith-input-bg)',
                border: '1px solid var(--edith-input-border)',
                color: 'var(--edith-text)',
              }}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded transition-all duration-300 ${
                  showFilters ? 'text-edith-cyan bg-edith-cyan/10' : 'hover:text-edith-cyan/50'
                }`}
                style={{ color: showFilters ? undefined : 'var(--edith-text-muted)' }}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              <button type="submit" className="btn-primary px-4 py-1.5 text-[10px]">
                SCAN
              </button>
            </div>
            <div
              className="absolute bottom-0 left-0 right-0 h-[1px] opacity-0 group-focus-within:opacity-100 transition-opacity"
              style={{ background: 'linear-gradient(90deg, transparent, var(--edith-border-strong), transparent)' }}
            />
          </div>
        </form>

        {/* Active tag */}
        {tag && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <span
              className="px-3 py-1.5 rounded text-[11px] font-mono font-bold text-edith-cyan tracking-wider flex items-center gap-1.5"
              style={{ background: 'var(--edith-accent-muted)', border: '1px solid var(--edith-border-strong)' }}
            >
              <Hash className="w-3 h-3" />{tag}
            </span>
            <button
              onClick={() => { setTag(''); dispatch(clearSearch()); }}
              className="p-1 hover:text-edith-red/60 transition-colors"
              style={{ color: 'var(--edith-text-muted)' }}
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
                <option value="newest">MOST RECENT</option>
                <option value="popular">MOST POPULAR</option>
                <option value="relevance">MOST RELEVANT</option>
                <option value="price_asc">PRICE: LOW → HIGH</option>
                <option value="price_desc">PRICE: HIGH → LOW</option>
              </select>
              <input value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="MIN PRICE" type="number" className="input-field text-[11px]" />
              <input value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="MAX PRICE" type="number" className="input-field text-[11px]" />
            </div>
            <button onClick={() => { dispatch(clearSearch()); doSearch(1); }} className="btn-primary mt-4 text-[10px] py-2 px-4">
              APPLY FILTERS
            </button>
          </div>
        )}

        {/* Trending tags */}
        {!query && !tag && trending.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-display font-bold mb-3 flex items-center gap-2 tracking-wider" style={{ color: 'var(--edith-text-dim)' }}>
              <TrendingUp className="w-4 h-4 text-edith-cyan/50" />
              TRENDING TAGS
            </h2>
            <div className="flex flex-wrap gap-2">
              {trending.map((t) => (
                <button
                  key={t}
                  onClick={() => handleTagClick(t)}
                  className="px-3 py-1.5 rounded text-[10px] font-mono tracking-wider transition-all duration-300 hover:text-edith-cyan/60 hover:border-edith-cyan/15 flex items-center gap-1"
                  style={{ background: 'var(--edith-tag-bg)', border: '1px solid var(--edith-tag-border)', color: 'var(--edith-tag-text)' }}
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
              <p className="text-sm font-display font-medium tracking-wider" style={{ color: 'var(--edith-text-secondary)' }}>
                NO TARGETS FOUND
              </p>
              <p className="text-[11px] font-mono mt-1" style={{ color: 'var(--edith-text-muted)' }}>
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
