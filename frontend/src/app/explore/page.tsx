'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { categoriesAPI, postsAPI } from '@/lib/api';
import PostCard from '@/components/feed/PostCard';
import { Category, Post } from '@/types';
import { Compass, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import Masonry from 'react-masonry-css';

export default function ExplorePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, featRes] = await Promise.all([
          categoriesAPI.getCategories(),
          postsAPI.getFeed({ sort: 'popular', limit: 30 }),
        ]);
        setCategories(catRes.data.data || []);
        setFeaturedPosts(featRes.data.data || []);
        setPosts(featRes.data.data || []);
      } catch { /* silent */ }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleCategorySelect = async (catId: string) => {
    setSelectedCategory(catId);
    setIsLoading(true);
    try {
      const { data } = await postsAPI.getFeed({ category: catId || undefined, sort: 'popular', limit: 30 });
      setPosts(data.data || []);
    } catch { /* silent */ }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Compass className="w-8 h-8" />
            <h1 className="text-4xl font-bold">Explore</h1>
          </div>
          <p className="text-lg text-white/80 max-w-lg mx-auto">
            Discover trending products, creative pins, and AI-generated masterpieces
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Categories */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          <button
            onClick={() => handleCategorySelect('')}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              !selectedCategory ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25' : 'bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 hover:border-brand-300'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => handleCategorySelect(cat._id)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat._id
                  ? 'text-white shadow-lg'
                  : 'bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 hover:border-brand-300'
              }`}
              style={selectedCategory === cat._id ? { backgroundColor: cat.color } : {}}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          </div>
        ) : posts.length > 0 ? (
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
          <div className="text-center py-20">
            <Compass className="w-16 h-16 text-surface-300 mx-auto mb-4" />
            <p className="text-xl font-medium">Nothing here yet</p>
            <p className="text-surface-500 mt-1">Check back soon for new pins!</p>
          </div>
        )}
      </div>
    </div>
  );
}
