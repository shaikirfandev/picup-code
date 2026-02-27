'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { Sparkles, ChevronLeft, ChevronRight, Image, Clock, User } from 'lucide-react';

export default function AdminAILogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const { data } = await adminAPI.getAiLogs({ page } as any);
        setLogs(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
      } catch { /* silent */ }
      setIsLoading(false);
    };
    fetchLogs();
  }, [page]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">AI Generation Logs</h1>
        <p className="text-surface-500">Monitor AI image generation activity</p>
      </div>

      <div className="space-y-4">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-surface-200 dark:bg-surface-700 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))
          : logs.map((log) => (
              <div key={log._id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  {log.imageUrl ? (
                    <img src={log.imageUrl} alt="" className="w-20 h-20 rounded-xl object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Sparkles className="w-7 h-7 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm mb-1 line-clamp-2">&ldquo;{log.prompt}&rdquo;</p>
                    <div className="flex flex-wrap gap-3 text-xs text-surface-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {log.user?.displayName || 'Unknown'}
                      </span>
                      {log.style && (
                        <span className="flex items-center gap-1">
                          <Image className="w-3 h-3" />
                          {log.style}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(log.createdAt)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        log.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : log.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        {!isLoading && logs.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-surface-300 mx-auto mb-3" />
            <p className="text-surface-500">No AI generation logs yet</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-surface-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn-ghost p-2 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn-ghost p-2 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
