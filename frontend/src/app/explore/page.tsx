'use client';

import { useState, useEffect } from 'react';
import { categoriesAPI, postsAPI } from '@/lib/api';
import PostCard from '@/components/feed/PostCard';
import { Category, Post } from '@/types';
import { Crosshair, TrendingUp, Radar, Loader2 } from 'lucide-react';
import Masonry from 'react-masonry-css';

export default function ExplorePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, featRes] = await Promise.all([
          categoriesAPI.getAll(),
          postsAPI.getFeed({ sort: 'popular', limit: 30 }),
        ]);
        setCategories(catRes.data.data || []);
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
      const { data } = await postsAPI.getFeed({
        category: catId || undefined,
        sort: 'popular',
        limit: 30,
      });
      setPosts(data.data || []);
    } catch { /* silent */ }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen">
      {/* EDITH Hero */}
      <div className="relative overflow-hidden py-14 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)',
            }}
          />
        </div>
        <div className="relative max-w-4xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded mb-4"
            style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.12)' }}
          >
            <Radar className="w-3 h-3 text-edith-cyan" />
            <span className="text-[10px] font-mono text-edith-cyan/60 tracking-wider uppercase">
              Scanning Visual Database
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-3 tracking-tight">
            <span className="text-white/90">Explore </span>
            <span className="text-gradient">Targets</span>
          </h1>
          <p className="text-sm font-mono text-white/25 max-w-lg mx-auto">
            // Discover trending products, creative pins, and AI-generated assets
          </p>
        </div>
      </div>

      <div className="max-w-[2000px] mx-auto px-4 py-6">
        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <button
            onClick={() => handleCategorySelect('')}
            className={`px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-300 ${
              !selectedCategory
                ? 'text-edith-cyan border border-edith-cyan/30'
                : 'text-white/30 border border-white/[0.06] hover:text-white/50 hover:border-edith-cyan/15'
            }`}
            style={!selectedCategory ? { background: 'rgba(0,212,255,0.08)', boxShadow: '0 0 15px rgba(0,212,255,0.08)' } : { background: 'rgba(255,255,255,0.02)' }}
          >
            <TrendingUp className="w-3 h-3 inline mr-1 -mt-0.5" />
            ALL
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => handleCategorySelect(cat._id)}
              className={`px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-300 ${
                selectedCategory === cat._id
                  ? 'text-white border'
                  : 'text-white/30 border border-white/[0.06] hover:text-white/50 hover:border-edith-cyan/15'
              }`}
              style={
                selectedCategory === cat._id
                  ? { backgroundColor: `${cat.color}22`, borderColor: `${cat.color}66`, color: cat.color, boxShadow: `0 0 15px ${cat.color}22` }
                  : { background: 'rgba(255,255,255,0.02)' }
              }
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 text-edith-cyan/40 animate-spin" />
            <span className="text-[10px] font-mono text-edith-cyan/20 tracking-wider">
              SCANNING...
            </span>
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
            <Crosshair className="w-12 h-12 text-edith-cyan/20 mx-auto mb-3" />
            <p className="text-sm font-display font-medium text-white/40 tracking-wider">
              NO TARGETS DETECTED
            </p>
            <p className="text-[11px] font-mono text-white/15 mt-1">
              // Adjust scan parameters or check back later
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
