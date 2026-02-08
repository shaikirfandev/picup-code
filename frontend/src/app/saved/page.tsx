'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { postsAPI } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import PostCard from '@/components/feed/PostCard';
import { Post } from '@/types';
import { Bookmark } from 'lucide-react';
import Masonry from 'react-masonry-css';

export default function SavedPage() {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const { data } = await postsAPI.getSavedPosts();
        setPosts(data.data || []);
      } catch { /* silent */ }
      setIsLoading(false);
    };
    if (isAuthenticated) fetchSaved();
    else setIsLoading(false);
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Bookmark className="w-16 h-16 text-surface-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Sign in to view saved pins</h2>
          <Link href="/login" className="btn-primary mt-3 inline-flex">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Saved Pins</h1>
        <p className="text-surface-500 mb-8">Your collection of saved inspiration</p>

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
            <Bookmark className="w-16 h-16 text-surface-300 mx-auto mb-4" />
            <p className="text-xl font-medium">No saved pins yet</p>
            <p className="text-surface-500 mt-1">Click the save icon on any pin to add it here</p>
            <Link href="/" className="btn-primary mt-4 inline-flex">Explore Pins</Link>
          </div>
        )}
      </div>
    </div>
  );
}
