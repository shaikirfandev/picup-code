'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { searchAPI, categoriesAPI } from '@/lib/api';
import PostCard from '@/components/feed/PostCard';
import { Post, Category } from '@/types';
import { Search as SearchIcon, SlidersHorizontal, X, TrendingUp } from 'lucide-react';
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

  // Filters
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  useEffect(() => {
    categoriesAPI.getCategories().then(({ data }) => setCategories(data.data || [])).catch(() => {});
    searchAPI.getTrending().then(({ data }) => setTrending(data.data?.tags || [])).catch(() => {});
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

      const { data } = await searchAPI.search(params);
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
    if (hasMore && !isLoading) doSearch(page + 1);
  }, hasMore);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search form */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pins, products, tags..."
              className="w-full pl-12 pr-24 py-4 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-lg"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <button type="button" onClick={() => setShowFilters(!showFilters)} className="btn-ghost p-2">
                <SlidersHorizontal className="w-5 h-5" />
              </button>
              <button type="submit" className="btn-primary px-4 py-2">Search</button>
            </div>
          </div>
        </form>

        {/* Active tag */}
        {tag && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="px-4 py-2 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 font-medium">
              #{tag}
            </span>
            <button onClick={() => { setTag(''); setPosts([]); }} className="btn-ghost p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="max-w-2xl mx-auto mb-8 card p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field text-sm">
                <option value="">All categories</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-field text-sm">
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <input value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="Min price" type="number" className="input-field text-sm" />
              <input value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="Max price" type="number" className="input-field text-sm" />
            </div>
            <button onClick={() => doSearch(1)} className="btn-primary mt-4 text-sm">Apply Filters</button>
          </div>
        )}

        {/* Trending tags */}
        {!query && !tag && trending.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-500" />
              Trending
            </h2>
            <div className="flex flex-wrap gap-2">
              {trending.map((t) => (
                <button
                  key={t}
                  onClick={() => handleTagClick(t)}
                  className="px-4 py-2 rounded-full bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm font-medium hover:border-brand-300 hover:text-brand-600 transition-all"
                >
                  #{t}
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
              <SearchIcon className="w-16 h-16 text-surface-300 mx-auto mb-4" />
              <p className="text-xl font-medium">No results found</p>
              <p className="text-surface-500 mt-1">Try different keywords or filters</p>
            </div>
          )
        )}

        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          </div>
        )}

        <div ref={loadMoreRef} className="h-4" />
      </div>
    </div>
  );
}
