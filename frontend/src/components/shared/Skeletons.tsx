'use client';

export function FeedSkeleton() {
  return (
    <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-3">
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} className="mb-3 break-inside-avoid rounded-xl overflow-hidden"
          style={{
            height: `${200 + Math.random() * 200}px`,
            background: 'linear-gradient(135deg, rgba(14,14,30,0.5), rgba(20,20,42,0.3))',
            border: '1px solid rgba(0,240,255,0.05)',
          }}>
          <div className="skeleton w-full h-full" />
        </div>
      ))}
    </div>
  );
}

export function PostDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="skeleton h-8 w-24 rounded-lg mb-4" />
      <div className="cyber-glass-strong rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="skeleton aspect-square" />
          <div className="p-6 space-y-4">
            <div className="skeleton h-6 w-3/4 rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-2/3 rounded" />
            <div className="skeleton h-20 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="cyber-glass-strong rounded-2xl p-8">
        <div className="flex items-center gap-6">
          <div className="skeleton w-24 h-24 rounded-xl" />
          <div className="flex-1 space-y-3">
            <div className="skeleton h-7 w-48 rounded" />
            <div className="skeleton h-4 w-32 rounded" />
            <div className="skeleton h-4 w-64 rounded" />
          </div>
        </div>
      </div>
      <div className="columns-2 md:columns-3 lg:columns-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="mb-3 break-inside-avoid rounded-xl overflow-hidden"
            style={{
              height: `${200 + Math.random() * 150}px`,
              background: 'linear-gradient(135deg, rgba(14,14,30,0.5), rgba(20,20,42,0.3))',
              border: '1px solid rgba(0,240,255,0.05)',
            }}>
            <div className="skeleton w-full h-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
