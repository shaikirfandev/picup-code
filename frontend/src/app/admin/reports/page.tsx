'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Eye, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [filter, setFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminAPI.getReports({ page, status: filter, limit: 20 });
      setReports(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch { /* silent */ }
    setIsLoading(false);
  };

  useEffect(() => { fetchReports(); }, [page, filter]);

  const handleResolve = async (reportId: string, action: 'resolved' | 'dismissed') => {
    try {
      await adminAPI.updateReport(reportId, { status: action });
      toast.success(`Report ${action}`);
      fetchReports();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-surface-500">Review and manage user reports</p>
      </div>

      <div className="flex gap-2 mb-6">
        {['pending', 'resolved', 'dismissed'].map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              filter === f ? 'bg-brand-600 text-white' : 'btn-ghost'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/3 mb-2" />
                <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-2/3" />
              </div>
            ))
          : reports.map((r) => (
              <div key={r._id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-semibold capitalize">{r.reason}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        r.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : r.status === 'resolved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-surface-100 text-surface-500 dark:bg-surface-800'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                    {r.description && <p className="text-sm text-surface-600 dark:text-surface-400 mb-2">{r.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-surface-500">
                      <span>Reported by: {r.reporter?.displayName || 'Unknown'}</span>
                      <span>Post: {r.post?.title || 'Deleted'}</span>
                      <span>{timeAgo(r.createdAt)}</span>
                    </div>
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex items-center gap-2 ml-4">
                      {r.post?._id && (
                        <Link href={`/post/${r.post._id}`} className="btn-ghost p-2">
                          <Eye className="w-4 h-4" />
                        </Link>
                      )}
                      <button
                        onClick={() => handleResolve(r._id, 'resolved')}
                        className="btn-ghost p-2 text-green-500 hover:text-green-600"
                        title="Resolve"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleResolve(r._id, 'dismissed')}
                        className="btn-ghost p-2 text-surface-400 hover:text-surface-600"
                        title="Dismiss"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
        {!isLoading && reports.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-surface-300 mx-auto mb-3" />
            <p className="text-surface-500">No {filter} reports</p>
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
