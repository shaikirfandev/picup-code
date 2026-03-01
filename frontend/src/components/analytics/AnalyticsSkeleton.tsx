'use client';

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4 space-y-2">
            <div className="skeleton h-3 w-20 rounded" />
            <div className="skeleton h-8 w-24 rounded" />
          </div>
        ))}
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="skeleton h-3 w-16 rounded" />
              <div className="skeleton h-8 w-8 rounded-lg" />
            </div>
            <div className="skeleton h-7 w-20 rounded" />
            <div className="skeleton h-3 w-14 rounded" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="skeleton h-4 w-32 rounded mb-4" />
          <div className="skeleton h-64 rounded" />
        </div>
        <div className="card p-5">
          <div className="skeleton h-4 w-32 rounded mb-4" />
          <div className="skeleton h-64 rounded" />
        </div>
      </div>
    </div>
  );
}

export function PostsTableSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="card p-4 flex items-center gap-4">
          <div className="skeleton w-12 h-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-48 rounded" />
            <div className="skeleton h-3 w-32 rounded" />
          </div>
          <div className="flex gap-6">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="skeleton h-6 w-12 rounded" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
