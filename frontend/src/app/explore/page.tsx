'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCategories, fetchExplore } from '@/store/slices/postSlice';
import { selectExplorePosts, selectCategories } from '@/store/selectors';
import PostCard from '@/components/feed/PostCard';
import { Crosshair, TrendingUp, Radar, Loader2 } from 'lucide-react';
import Masonry from 'react-masonry-css';

export default function ExplorePage() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector(selectCategories);
  const posts = useAppSelector(selectExplorePosts);
  const isLoading = useAppSelector((s) => s.posts.exploreLoading);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchExplore({ sort: 'popular', limit: 30 }));
  }, [dispatch]);

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    dispatch(fetchExplore({ category: catId, sort: 'popular', limit: 30 }));
  };

  return (
    <div className="min-h-screen">
      {/* EDITH Hero */}
      <div className="relative overflow-hidden py-14 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
            style={{
              background: 'radial-gradient(circle, var(--edith-radial-hero) 0%, transparent 70%)',
            }}
          />
        </div>
        <div className="relative max-w-4xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded mb-4"
            style={{ background: 'var(--edith-accent-subtle)', border: '1px solid var(--edith-border)' }}
          >
            <Radar className="w-3 h-3 text-edith-cyan" />
            <span className="text-[10px] font-mono tracking-wider uppercase" style={{ color: 'var(--edith-text-dim)' }}>
              Scanning Visual Database
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-3 tracking-tight">
            <span style={{ color: 'var(--edith-gradient-text)' }}>Explore </span>
            <span className="text-gradient">Targets</span>
          </h1>
          <p className="text-sm font-mono max-w-lg mx-auto" style={{ color: 'var(--edith-text-muted)' }}>
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
                : 'border hover:border-edith-cyan/15'
            }`}
            style={!selectedCategory ? { background: 'var(--edith-accent-muted)', boxShadow: 'var(--edith-shadow-sm)' } : { background: 'var(--edith-tag-bg)', borderColor: 'var(--edith-tag-border)', color: 'var(--edith-tag-text)' }}
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
                  : 'border hover:border-edith-cyan/15'
              }`}
              style={
                selectedCategory === cat._id
                  ? { backgroundColor: `${cat.color}22`, borderColor: `${cat.color}66`, color: cat.color, boxShadow: 'var(--edith-shadow-sm)' }
                  : { background: 'var(--edith-tag-bg)', borderColor: 'var(--edith-tag-border)', color: 'var(--edith-tag-text)' }
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
            <p className="text-sm font-display font-medium tracking-wider" style={{ color: 'var(--edith-text-secondary)' }}>
              NO TARGETS DETECTED
            </p>
            <p className="text-[11px] font-mono mt-1" style={{ color: 'var(--edith-text-muted)' }}>
              // Adjust scan parameters or check back later
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
