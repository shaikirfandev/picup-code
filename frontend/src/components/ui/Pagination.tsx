'use client';

import { useEffect, useRef, useCallback } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-2.5 py-1.5 text-[10px] font-mono tracking-wider rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-edith-cyan/5 hover:text-edith-cyan"
        style={{ color: 'var(--edith-text-dim)', border: '1px solid var(--edith-border)' }}
      >
        PREV
      </button>
      {getPages().map((page, i) =>
        page === 'ellipsis' ? (
          <span
            key={`e-${i}`}
            className="px-1.5 text-xs font-mono"
            style={{ color: 'var(--edith-text-muted)' }}
          >
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className="w-8 h-8 text-[10px] font-mono rounded transition-all hover:bg-edith-cyan/10"
            style={{
              background: page === currentPage ? 'var(--edith-accent-muted)' : 'transparent',
              color: page === currentPage ? 'var(--edith-accent)' : 'var(--edith-text-dim)',
              border: `1px solid ${page === currentPage ? 'var(--edith-accent)' : 'var(--edith-border)'}`,
            }}
          >
            {page}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-2.5 py-1.5 text-[10px] font-mono tracking-wider rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-edith-cyan/5 hover:text-edith-cyan"
        style={{ color: 'var(--edith-text-dim)', border: '1px solid var(--edith-border)' }}
      >
        NEXT
      </button>
    </nav>
  );
}

// ── Infinite scroll hook ─────────────────────────────────────────────────────
export function useInfiniteScroll(
  callback: () => void,
  { enabled = true, threshold = 200 }: { enabled?: boolean; threshold?: number } = {}
) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && enabled) callback();
    },
    [callback, enabled]
  );

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: `${threshold}px`,
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [handleObserver, threshold]);

  return sentinelRef;
}
