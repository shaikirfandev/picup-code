'use client';

export function PostCardSkeleton() {
  const height = 200 + Math.random() * 200;

  return (
    <div className="mb-4 break-inside-avoid">
      <div className="overflow-hidden" style={{ borderRadius: 'var(--radius-lg)' }}>
        <div className="skeleton" style={{ height: `${height}px` }} />
        <div className="px-1 pt-2.5 pb-1 space-y-2">
          <div className="skeleton h-4 w-3/4" style={{ borderRadius: 'var(--radius-sm)' }} />
          <div className="flex items-center gap-2">
            <div className="skeleton w-[22px] h-[22px] rounded-full" />
            <div className="skeleton h-3 w-20" style={{ borderRadius: 'var(--radius-sm)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeedSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      <div className="flex flex-col items-center gap-4">
        <div className="skeleton w-32 h-32 rounded-full" />
        <div className="skeleton h-6 w-48 rounded" />
        <div className="skeleton h-4 w-32 rounded" />
        <div className="skeleton h-4 w-64 rounded" />
        <div className="flex gap-6 mt-4">
          <div className="skeleton h-8 w-20 rounded" />
          <div className="skeleton h-8 w-20 rounded" />
          <div className="skeleton h-8 w-20 rounded" />
        </div>
      </div>
    </div>
  );
}

export function PostDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-4 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="skeleton rounded-2xl h-[500px]" />
        <div className="space-y-4">
          <div className="skeleton h-8 w-3/4 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-2/3 rounded" />
          <div className="flex gap-2 mt-6">
            <div className="skeleton h-10 w-24 rounded-full" />
            <div className="skeleton h-10 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
