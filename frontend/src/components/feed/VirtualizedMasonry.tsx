'use client';

import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import PostCard from './PostCard';
import { Post } from '@/types';

interface VirtualizedMasonryProps {
  posts: Post[];
  hasMore: boolean;
  onLoadMore: () => void;
  isLoading: boolean;
}

/**
 * Virtualized masonry grid using react-window.
 * Distributes posts into columns and renders only visible rows.
 */
export default function VirtualizedMasonry({
  posts,
  hasMore,
  onLoadMore,
  isLoading,
}: VirtualizedMasonryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Calculate number of columns based on container width
  const columnCount = useMemo(() => {
    if (containerWidth < 475) return 2;
    if (containerWidth < 768) return 2;
    if (containerWidth < 1024) return 3;
    if (containerWidth < 1280) return 4;
    if (containerWidth < 1536) return 5;
    return 6;
  }, [containerWidth]);

  // Measure container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(container);
    setContainerWidth(container.offsetWidth);

    return () => observer.disconnect();
  }, []);

  // Distribute posts into rows for the virtual list
  const rows = useMemo(() => {
    const result: Post[][] = [];
    for (let i = 0; i < posts.length; i += columnCount) {
      result.push(posts.slice(i, i + columnCount));
    }
    return result;
  }, [posts, columnCount]);

  // Estimate row height based on image aspect ratios
  const getRowHeight = useCallback(
    (index: number) => {
      const row = rows[index];
      if (!row) return 350;

      const colWidth = (containerWidth - (columnCount - 1) * 12) / columnCount;
      let maxHeight = 0;

      for (const post of row) {
        const aspect = post.image?.height && post.image?.width
          ? post.image.height / post.image.width
          : 1.3;
        const imgHeight = colWidth * Math.min(aspect, 1.8);
        const cardHeight = imgHeight + 80; // padding + text
        maxHeight = Math.max(maxHeight, cardHeight);
      }

      return maxHeight + 12; // gap
    },
    [rows, containerWidth, columnCount]
  );

  // Handle scroll to load more
  const handleItemsRendered = useCallback(
    ({ visibleStopIndex }: { visibleStopIndex: number }) => {
      if (hasMore && !isLoading && visibleStopIndex >= rows.length - 3) {
        onLoadMore();
      }
    },
    [hasMore, isLoading, rows.length, onLoadMore]
  );

  // Row renderer
  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const row = rows[index];
      if (!row) return null;

      return (
        <div style={style} className="flex gap-3 px-1">
          {row.map((post, colIdx) => (
            <div key={post._id} style={{ flex: `1 1 ${100 / columnCount}%`, maxWidth: `${100 / columnCount}%` }}>
              <PostCard post={post} index={index * columnCount + colIdx} />
            </div>
          ))}
          {/* Fill empty slots */}
          {row.length < columnCount &&
            Array.from({ length: columnCount - row.length }).map((_, i) => (
              <div key={`empty-${i}`} style={{ flex: `1 1 ${100 / columnCount}%` }} />
            ))}
        </div>
      );
    },
    [rows, columnCount]
  );

  if (!containerWidth) {
    return <div ref={containerRef} className="w-full min-h-[200px]" />;
  }

  // For simplicity with variable heights, we use a standard approach
  // react-window FixedSizeList with estimated average row height
  const avgRowHeight = 380;

  return (
    <div ref={containerRef} className="w-full">
      {rows.length > 0 && containerWidth > 0 && (
        <List
          height={typeof window !== 'undefined' ? window.innerHeight - 120 : 800}
          itemCount={rows.length + (isLoading ? 1 : 0)}
          itemSize={avgRowHeight}
          width={containerWidth}
          onItemsRendered={handleItemsRendered}
          overscanCount={3}
          className="scrollbar-hide"
        >
          {({ index, style }) => {
            if (index >= rows.length) {
              return (
                <div style={style} className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              );
            }
            return Row({ index, style });
          }}
        </List>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center gap-2 text-surface-400">
      <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm">Loading more...</span>
    </div>
  );
}
