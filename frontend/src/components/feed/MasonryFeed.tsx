'use client';

import { memo } from 'react';
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
 * Standard masonry grid with infinite scroll.
 * Memoized to prevent re-renders when parent state changes but posts haven't.
 */
const MasonryFeed = memo(function MasonryFeed({
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
          <PostCard key={post._id} post={post} index={index} />
        ))}
      </Masonry>

      {/* Load more trigger */}
      {hasMore && (
        <div ref={lastRef} className="flex items-center justify-center py-8">
          {isLoading && (
            <div className="flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
              <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-strong)', borderTopColor: 'transparent' }} />
              <span className="text-sm">Loading...</span>
            </div>
          )}
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div className="text-center py-12">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>You&apos;ve reached the end</p>
        </div>
      )}
    </div>
  );
});

export default MasonryFeed;
