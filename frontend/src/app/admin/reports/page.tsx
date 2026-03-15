'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import {
  ChevronLeft, ChevronRight, CheckCircle, XCircle, Eye, AlertTriangle,
  Shield, Trash2, Ban, Search, Filter, X, ExternalLink,
  Flag, Clock, AlertOctagon, ChevronDown, User as UserIcon, Image as ImageIcon,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Report } from '@/types';

const PRIORITY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Critical' },
  high: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', label: 'High' },
  medium: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Medium' },
  low: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Low' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
  reviewed: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  resolved: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
  dismissed: { bg: 'bg-surface-100 dark:bg-surface-800', text: 'text-surface-500 dark:text-surface-400' },
};

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  nsfw: 'NSFW',
  nudity: 'Nudity',
  violence: 'Violence',
  harassment: 'Harassment',
  hate_speech: 'Hate Speech',
  abuse: 'Abuse',
  misinformation: 'Misinformation',
  copyright: 'Copyright',
  other: 'Other',
};

const ACTION_OPTIONS = [
  { value: 'none', label: 'No Action', icon: '—' },
  { value: 'removed', label: 'Remove Content', icon: '🗑️' },
  { value: 'hidden', label: 'Hide Content', icon: '👁️‍🗨️' },
  { value: 'warned', label: 'Warn User', icon: '⚠️' },
  { value: 'banned', label: 'Ban User', icon: '🚫' },
];

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [filter, setFilter] = useState('pending');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<any>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [actionForm, setActionForm] = useState({ status: 'resolved', actionTaken: 'none', reviewNotes: '' });
  const [isResolving, setIsResolving] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = { page, status: filter, limit: 20 };
      if (priorityFilter) params.priority = priorityFilter;
      if (reasonFilter) params.reason = reasonFilter;
      if (searchQuery) params.search = searchQuery;
      const { data } = await adminAPI.getReports(params);
      setReports(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
      if (data.statusCounts) setStatusCounts(data.statusCounts);
    } catch {
      toast.error('Failed to load reports');
    }
    setIsLoading(false);
  }, [page, filter, priorityFilter, reasonFilter, searchQuery]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const openDrawer = async (report: any) => {
    setSelectedReport(report);
    setDrawerOpen(true);
    setDrawerLoading(true);
    setActionForm({ status: 'resolved', actionTaken: 'none', reviewNotes: '' });
    try {
      const { data } = await adminAPI.getReportDetail(report._id);
      setDrawerData(data.data);
    } catch {
      setDrawerData(null);
    }
    setDrawerLoading(false);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedReport(null);
    setDrawerData(null);
  };

  const handleResolve = async (reportId: string, status: string, actionTaken?: string) => {
    try {
      await adminAPI.resolveReport(reportId, { status, actionTaken, reviewNotes: '' });
      toast.success(`Report ${status}`);
      fetchReports();
      if (drawerOpen && selectedReport?._id === reportId) closeDrawer();
    } catch {
      toast.error('Failed to update report');
    }
  };

  const handleDrawerResolve = async () => {
    if (!selectedReport) return;
    setIsResolving(true);
    try {
      await adminAPI.resolveReport(selectedReport._id, actionForm);
      toast.success('Report resolved');
      fetchReports();
      closeDrawer();
    } catch {
      toast.error('Failed to resolve report');
    }
    setIsResolving(false);
  };

  const handleQuickDismiss = async (reportId: string) => {
    await handleResolve(reportId, 'dismissed', 'none');
  };

  const handleQuickResolve = async (reportId: string) => {
    await handleResolve(reportId, 'resolved', 'none');
  };

  const totalPending = statusCounts.pending || 0;
  const totalResolved = statusCounts.resolved || 0;
  const totalDismissed = statusCounts.dismissed || 0;

  return (
    <div className="p-6 lg:p-8 relative">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-red-500/10">
            <Shield className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Moderation Center</h1>
            <p style={{ color: 'var(--text-tertiary)' }} className="text-sm">Review and manage user reports</p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Pending', count: totalPending, color: 'amber', icon: Clock },
          { label: 'Resolved', count: totalResolved, color: 'green', icon: CheckCircle },
          { label: 'Dismissed', count: totalDismissed, color: 'gray', icon: XCircle },
          { label: 'Total', count: totalPending + totalResolved + totalDismissed + (statusCounts.reviewed || 0), color: 'blue', icon: Flag },
        ].map(({ label, count, color, icon: Icon }) => (
          <div key={label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-${color}-500/10`}>
                <Icon className={`w-4 h-4 text-${color}-500`} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{count}</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        {/* Status tabs */}
        <div className="flex gap-2 flex-wrap">
          {['pending', 'resolved', 'dismissed', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                filter === f ? 'bg-brand-600 text-white shadow-md' : 'btn-ghost'
              }`}
            >
              {f}
              {f !== 'all' && statusCounts[f] ? (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">{statusCounts[f]}</span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 rounded-lg text-sm w-56"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-ghost p-2 rounded-lg ${showFilters ? 'bg-brand-500/10 text-brand-500' : ''}`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="card p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 rounded-lg text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            >
              <option value="">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Reason</label>
            <select
              value={reasonFilter}
              onChange={(e) => { setReasonFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 rounded-lg text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            >
              <option value="">All</option>
              {Object.entries(REASON_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => { setPriorityFilter(''); setReasonFilter(''); setSearchQuery(''); setPage(1); }}
            className="text-xs text-brand-500 hover:underline mt-4"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Reports List */}
      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-lg bg-surface-200 dark:bg-surface-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/3" />
                    <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-2/3" />
                    <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))
          : reports.map((r) => {
              const priorityColor = PRIORITY_COLORS[r.priority] || PRIORITY_COLORS.medium;
              const statusColor = STATUS_COLORS[r.status] || STATUS_COLORS.pending;

              return (
                <div
                  key={r._id}
                  className="card p-5 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => openDrawer(r)}
                >
                  <div className="flex items-start gap-4">
                    {/* Post Thumbnail */}
                    <div className="flex-shrink-0">
                      {r.post?.image?.url ? (
                        <img
                          src={r.post.image.url}
                          alt={r.post?.title || 'Post'}
                          className="w-16 h-16 rounded-lg object-cover"
                          style={{ border: '1px solid var(--border)' }}
                        />
                      ) : r.blogPost?.coverImage?.url ? (
                        <img
                          src={r.blogPost.coverImage.url}
                          alt={r.blogPost?.title || 'Article'}
                          className="w-16 h-16 rounded-lg object-cover"
                          style={{ border: '1px solid var(--border)' }}
                        />
                      ) : r.blogPost ? (
                        <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                          <FileText className="w-6 h-6" style={{ color: 'var(--text-tertiary)' }} />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                          <ImageIcon className="w-6 h-6" style={{ color: 'var(--text-tertiary)' }} />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${priorityColor.bg} ${priorityColor.text}`}>
                          {priorityColor.label}
                        </span>
                        <span className="text-sm font-semibold capitalize" style={{ color: 'var(--foreground)' }}>
                          {REASON_LABELS[r.reason] || r.reason}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${statusColor.bg} ${statusColor.text}`}>
                          {r.status}
                        </span>
                        {r.autoFlagged && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                            Auto-flagged
                          </span>
                        )}
                      </div>

                      {r.description && (
                        <p className="text-sm line-clamp-1 mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                          {r.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs flex-wrap" style={{ color: 'var(--text-tertiary)' }}>
                        <span className="flex items-center gap-1">
                          <UserIcon className="w-3 h-3" />
                          {r.reporter?.displayName || r.reporter?.username || 'Unknown'}
                        </span>
                        <span className="flex items-center gap-1">
                          {r.blogPost ? <FileText className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                          {(r.post?.title || r.blogPost?.title || 'Deleted content')?.slice(0, 30)}{(r.post?.title || r.blogPost?.title || '')?.length > 30 ? '...' : ''}
                          {r.blogPost && <span className="text-[9px] ml-1 px-1 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium">Blog</span>}
                        </span>
                        {((r.post?.reportCount || 0) > 1 || (r.blogPost?.reportCount || 0) > 1) && (
                          <span className="flex items-center gap-1 text-red-500 font-semibold">
                            <Flag className="w-3 h-3" />
                            {r.post?.reportCount || r.blogPost?.reportCount} reports
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(r.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    {r.status === 'pending' && (
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        {r.post?._id && (
                          <Link href={`/post/${r.post._id}`} className="btn-ghost p-2 rounded-lg" title="View Post" target="_blank">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}
                        {r.blogPost?.slug && (
                          <Link href={`/blog/${r.blogPost.slug}`} className="btn-ghost p-2 rounded-lg" title="View Article" target="_blank">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}
                        <button
                          onClick={() => handleQuickResolve(r._id)}
                          className="btn-ghost p-2 rounded-lg text-green-500 hover:text-green-600 hover:bg-green-500/10"
                          title="Quick Resolve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleQuickDismiss(r._id)}
                          className="btn-ghost p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700"
                          title="Dismiss"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

        {!isLoading && reports.length === 0 && (
          <div className="text-center py-16">
            <Shield className="w-14 h-14 mx-auto mb-4" style={{ color: 'var(--text-tertiary)', opacity: 0.3 }} />
            <p className="text-lg font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>No {filter !== 'all' ? filter : ''} reports</p>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {filter === 'pending' ? 'All clear! No reports need attention.' : 'No reports match the current filters.'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn-ghost p-2 disabled:opacity-40 rounded-lg">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn-ghost p-2 disabled:opacity-40 rounded-lg">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Side Drawer */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={closeDrawer} />

          {/* Drawer */}
          <div
            className="fixed top-0 right-0 h-full w-full max-w-xl z-50 overflow-y-auto shadow-2xl"
            style={{ background: 'var(--background)', borderLeft: '1px solid var(--border)' }}
          >
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between" style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <AlertOctagon className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Report Detail</h2>
              </div>
              <button onClick={closeDrawer} className="btn-ghost p-2 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {drawerLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/3 mb-2" />
                    <div className="h-20 bg-surface-200 dark:bg-surface-700 rounded" />
                  </div>
                ))}
              </div>
            ) : drawerData ? (
              <div className="p-6 space-y-6">
                {/* Report Info */}
                <div className="card p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${PRIORITY_COLORS[drawerData.report?.priority]?.bg || ''} ${PRIORITY_COLORS[drawerData.report?.priority]?.text || ''}`}>
                      {PRIORITY_COLORS[drawerData.report?.priority]?.label || 'Unknown'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[drawerData.report?.status]?.bg || ''} ${STATUS_COLORS[drawerData.report?.status]?.text || ''}`}>
                      {drawerData.report?.status}
                    </span>
                    {drawerData.report?.autoFlagged && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">
                        Auto-flagged
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Reason</label>
                    <p className="text-sm font-semibold capitalize" style={{ color: 'var(--foreground)' }}>
                      {REASON_LABELS[drawerData.report?.reason] || drawerData.report?.reason}
                    </p>
                  </div>
                  {drawerData.report?.description && (
                    <div>
                      <label className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Description</label>
                      <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{drawerData.report.description}</p>
                    </div>
                  )}
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Reported {timeAgo(drawerData.report?.createdAt)}
                    {drawerData.report?.reviewedAt && ` · Reviewed ${timeAgo(drawerData.report.reviewedAt)}`}
                  </div>
                </div>

                {/* Post Preview */}
                {drawerData.report?.post && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>Reported Post</h3>
                    <div className="card p-4">
                      <div className="flex gap-4">
                        {drawerData.report.post.image?.url ? (
                          <img
                            src={drawerData.report.post.image.url}
                            alt=""
                            className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--surface)' }}>
                            <ImageIcon className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm mb-1 line-clamp-2" style={{ color: 'var(--foreground)' }}>
                            {drawerData.report.post.title}
                          </p>
                          <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                            by {drawerData.report.post.author?.displayName || drawerData.report.post.author?.username}
                          </p>
                          <div className="flex items-center gap-3">
                            <span className="text-xs flex items-center gap-1 text-red-500 font-semibold">
                              <Flag className="w-3 h-3" /> {drawerData.report.post.reportCount || 0} reports
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${drawerData.report.post.status === 'published' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'}`}>
                              {drawerData.report.post.status}
                            </span>
                          </div>
                          <Link href={`/post/${drawerData.report.post._id}`} target="_blank"
                            className="inline-flex items-center gap-1 text-xs text-brand-500 hover:underline mt-2">
                            <ExternalLink className="w-3 h-3" /> View Post
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Blog Post Preview */}
                {drawerData.report?.blogPost && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>Reported Article</h3>
                    <div className="card p-4">
                      <div className="flex gap-4">
                        {drawerData.report.blogPost.coverImage?.url ? (
                          <img
                            src={drawerData.report.blogPost.coverImage.url}
                            alt=""
                            className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--surface)' }}>
                            <FileText className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-purple-400">{drawerData.report.blogPost.category}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium">Blog</span>
                          </div>
                          <p className="font-semibold text-sm mb-1 line-clamp-2" style={{ color: 'var(--foreground)' }}>
                            {drawerData.report.blogPost.title}
                          </p>
                          <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                            by {drawerData.report.blogPost.author?.displayName || drawerData.report.blogPost.author?.username}
                          </p>
                          <div className="flex items-center gap-3">
                            <span className="text-xs flex items-center gap-1 text-red-500 font-semibold">
                              <Flag className="w-3 h-3" /> {drawerData.report.blogPost.reportCount || 0} reports
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${drawerData.report.blogPost.status === 'published' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : drawerData.report.blogPost.status === 'archived' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'}`}>
                              {drawerData.report.blogPost.status}
                            </span>
                          </div>
                          <Link href={`/blog/${drawerData.report.blogPost.slug}`} target="_blank"
                            className="inline-flex items-center gap-1 text-xs text-brand-500 hover:underline mt-2">
                            <ExternalLink className="w-3 h-3" /> View Article
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reporter & Reported User */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Reporter */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>Reporter</h3>
                    <div className="card p-3">
                      <div className="flex items-center gap-2 mb-2">
                        {drawerData.report?.reporter?.avatar ? (
                          <img src={drawerData.report.reporter.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}>
                            {drawerData.report?.reporter?.displayName?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                            {drawerData.report?.reporter?.displayName || drawerData.report?.reporter?.username}
                          </p>
                          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                            @{drawerData.report?.reporter?.username}
                          </p>
                        </div>
                      </div>
                      <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                        {drawerData.reporterTotalReports} total reports filed
                      </p>
                    </div>
                  </div>

                  {/* Reported User */}
                  {drawerData.report?.reportedUser && (
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>Reported User</h3>
                      <div className="card p-3">
                        <div className="flex items-center gap-2 mb-2">
                          {drawerData.report.reportedUser.avatar ? (
                            <img src={drawerData.report.reportedUser.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}>
                              {drawerData.report.reportedUser.displayName?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                              {drawerData.report.reportedUser.displayName || drawerData.report.reportedUser.username}
                            </p>
                            <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                              {drawerData.report.reportedUser.status === 'banned'
                                ? '🚫 Banned'
                                : drawerData.report.reportedUser.status === 'suspended'
                                ? '⚠️ Suspended'
                                : '✅ Active'}
                            </p>
                          </div>
                        </div>
                        <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                          {drawerData.reportedUserTotalReports} reports received
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Related Reports */}
                {drawerData.relatedReports?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>
                      Other Reports for This {drawerData.report?.blogPost ? 'Article' : 'Post'} ({drawerData.relatedReports.length})
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {drawerData.relatedReports.map((rel: any) => (
                        <div key={rel._id} className="card p-3 text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${PRIORITY_COLORS[rel.priority]?.bg || ''} ${PRIORITY_COLORS[rel.priority]?.text || ''}`}>
                              {rel.priority}
                            </span>
                            <span className="font-medium capitalize" style={{ color: 'var(--foreground)' }}>
                              {REASON_LABELS[rel.reason] || rel.reason}
                            </span>
                            <span style={{ color: 'var(--text-tertiary)' }}>by {rel.reporter?.displayName || rel.reporter?.username}</span>
                            <span className="ml-auto" style={{ color: 'var(--text-tertiary)' }}>{timeAgo(rel.createdAt)}</span>
                          </div>
                          {rel.description && (
                            <p className="mt-1 line-clamp-1" style={{ color: 'var(--text-secondary)' }}>{rel.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Form (only for pending reports) */}
                {drawerData.report?.status === 'pending' && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>Take Action</h3>
                    <div className="card p-4 space-y-4">
                      <div>
                        <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Resolution</label>
                        <select
                          value={actionForm.status}
                          onChange={(e) => setActionForm({ ...actionForm, status: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg text-sm"
                          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                        >
                          <option value="resolved">Resolve</option>
                          <option value="dismissed">Dismiss</option>
                          <option value="reviewed">Mark as Reviewed</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Action</label>
                        <div className="grid grid-cols-1 gap-1.5">
                          {ACTION_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setActionForm({ ...actionForm, actionTaken: opt.value })}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all ${
                                actionForm.actionTaken === opt.value
                                  ? 'ring-2 ring-brand-500'
                                  : ''
                              }`}
                              style={{
                                background: actionForm.actionTaken === opt.value ? 'var(--accent-muted)' : 'var(--surface)',
                                border: '1px solid var(--border)',
                                color: 'var(--foreground)',
                              }}
                            >
                              <span>{opt.icon}</span>
                              <span className="font-medium">{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Internal Notes (optional)</label>
                        <textarea
                          value={actionForm.reviewNotes}
                          onChange={(e) => setActionForm({ ...actionForm, reviewNotes: e.target.value })}
                          placeholder="Add notes about this resolution..."
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                        />
                      </div>

                      {(actionForm.actionTaken === 'removed' || actionForm.actionTaken === 'banned') && (
                        <div className="flex items-start gap-2 p-3 rounded-lg text-xs" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <p style={{ color: 'var(--text-secondary)' }}>
                            {actionForm.actionTaken === 'removed'
                              ? `This will remove the ${drawerData?.report?.blogPost ? 'article' : 'post'} and auto-resolve all pending reports for it.`
                              : 'This will ban the user and auto-resolve all their pending reports.'}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={handleDrawerResolve}
                          disabled={isResolving}
                          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-all"
                        >
                          {isResolving ? 'Submitting...' : 'Submit Decision'}
                        </button>
                        <button
                          onClick={closeDrawer}
                          className="px-4 py-2.5 rounded-xl text-sm font-medium"
                          style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Previous Resolution Info */}
                {drawerData.report?.status !== 'pending' && drawerData.report?.reviewedBy && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>Resolution</h3>
                    <div className="card p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[drawerData.report.status]?.bg} ${STATUS_COLORS[drawerData.report.status]?.text}`}>
                          {drawerData.report.status}
                        </span>
                        {drawerData.report.actionTaken && drawerData.report.actionTaken !== 'none' && (
                          <span className="text-xs font-medium capitalize" style={{ color: 'var(--foreground)' }}>
                            → {drawerData.report.actionTaken}
                          </span>
                        )}
                      </div>
                      {drawerData.report.reviewNotes && (
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{drawerData.report.reviewNotes}</p>
                      )}
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        Reviewed by {drawerData.report.reviewedBy?.displayName || drawerData.report.reviewedBy?.username}
                        {drawerData.report.reviewedAt && ` · ${timeAgo(drawerData.report.reviewedAt)}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)', opacity: 0.3 }} />
                <p style={{ color: 'var(--text-secondary)' }}>Failed to load report details</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
