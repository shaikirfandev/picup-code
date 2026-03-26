'use client';

import { useRef, useState, useEffect, useCallback, memo } from 'react';
import Masonry from 'react-masonry-css';
import PostCard from './PostCard';
import { Post } from '@/types';
import { useInfiniteScroll } from '@/hooks';

interface MasonryFeedProps {
  posts: Post[];
  hasMore: boolean;
  onLoadMore: () => void;
  isLoading: boolean;
}

const breakpointColumns = {
  default: 6,
  1536: 5,
  1280: 4,
  1024: 3,
  768: 2,
  475: 2,
};

/**
 * Lazy wrapper — only mounts PostCard when the slot is near the viewport.
 * Shows a lightweight placeholder until then, avoiding hundreds of heavy
 * PostCard instances in the DOM simultaneously.
 */
const LazyPostCard = memo(function LazyPostCard({ post, index }: { post: Post; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // once visible, stay mounted
        }
      },
      { rootMargin: '600px 0px' } // pre-render 600px ahead of viewport
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!isVisible) {
    // Lightweight placeholder — same break-inside:avoid as pin-card
    return (
      <div
        ref={ref}
        className="rounded-xl mb-2.5"
        style={{
          height: 220 + (index % 5) * 40,
          background: 'var(--edith-surface)',
          border: '1px solid var(--edith-border)',
          breakInside: 'avoid',
        }}
      />
    );
  }

  return (
    <div ref={ref}>
      <PostCard post={post} index={index} />
    </div>
  );
});

/**
 * Standard masonry grid with infinite scroll + lazy rendering.
 * Uses react-masonry-css for layout + IntersectionObserver for loading.
 */
export default function MasonryFeed({
  posts,
  hasMore,
  onLoadMore,
  isLoading,
}: MasonryFeedProps) {
  const lastRef = useInfiniteScroll(onLoadMore, hasMore && !isLoading);

  return (
    <div>
      <Masonry
        breakpointCols={breakpointColumns}
        className="masonry-grid"
        columnClassName="masonry-grid-column"
      >
        {posts.map((post, index) => (
          <LazyPostCard key={post._id} post={post} index={index} />
        ))}
      </Masonry>

      {/* Load more trigger */}
      {hasMore && (
        <div ref={lastRef} className="flex items-center justify-center py-8">
          {isLoading && (
            <div className="flex items-center gap-2 text-surface-400">
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading more pins...</span>
            </div>
          )}
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div className="text-center py-12">
          <p className="text-surface-400 text-sm">✨ You&apos;ve seen it all!</p>
        </div>
      )}
    </div>
  );
}
