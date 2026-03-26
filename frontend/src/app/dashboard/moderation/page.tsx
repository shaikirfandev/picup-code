'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store';
import { fetchCommentsForModeration, moderateComment } from '@/store/slices/creatorDashboardSlice';
import {
  Shield, CheckCircle, EyeOff, Trash2, MessageCircle, AlertTriangle,
  Filter, Clock, ChevronLeft, ChevronRight, User, Flag,
} from 'lucide-react';

const statusFilters = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Hidden', value: 'hidden' },
  { label: 'Flagged', value: 'flagged' },
];

const statusConfig: Record<string, { icon: React.ElementType; color: string }> = {
  pending: { icon: Clock, color: '#f59e0b' },
  approved: { icon: CheckCircle, color: '#10b981' },
  hidden: { icon: EyeOff, color: '#6b7280' },
  flagged: { icon: Flag, color: '#ef4444' },
  deleted: { icon: Trash2, color: '#ef4444' },
};

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const secs = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export default function ModerationPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { comments, commentsLoading } = useSelector((state: RootState) => state.creatorDashboard);

  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [processing, setProcessing] = useState<string | null>(null);

  const loadData = useCallback(() => {
    dispatch(fetchCommentsForModeration({ page, filter: status }));
  }, [dispatch, page, status]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleModerate = async (commentId: string, action: string) => {
    setProcessing(commentId);
    await dispatch(moderateComment({ commentId, action }));
    setProcessing(null);
    loadData();
  };

  const commentList = (comments?.comments || []) as any[];
  const pagination = comments?.pagination as any;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Shield className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
          Comment Moderation
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
          Review and moderate comments on your content.
        </p>
      </div>

      {/* Status filter chips */}
      <div className="flex gap-2 flex-wrap items-center">
        <Filter className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
        {statusFilters.map(f => {
          const cfg = statusConfig[f.value] || { color: 'var(--accent-primary)' };
          return (
            <button key={f.value}
              onClick={() => { setStatus(f.value); setPage(1); }}
              className="px-3 py-1.5 text-xs rounded-full transition-all font-medium"
              style={{
                background: status === f.value
                  ? (f.value ? `${cfg.color}20` : 'var(--accent-primary)')
                  : 'var(--bg-surface)',
                color: status === f.value
                  ? (f.value ? cfg.color : 'var(--bg-primary)')
                  : 'var(--text-tertiary)',
                border: `1px solid ${status === f.value ? (f.value ? cfg.color : 'var(--accent-primary)') : 'var(--border-primary)'}`,
              }}>
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Comment List */}
      <div className="space-y-3">
        {commentsLoading && !commentList.length ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: 'var(--bg-surface)' }} />
          ))
        ) : commentList.length > 0 ? (
          commentList.map((comment: any) => {
            const cfg = statusConfig[comment.status] || statusConfig.pending;
            const StatusIcon = cfg.icon;
            const isProcessing = processing === comment._id;

            return (
              <div key={comment._id}
                className="rounded-xl border p-4 transition-all"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: comment.status === 'flagged' ? '#ef444440' : 'var(--border-primary)',
                  opacity: isProcessing ? 0.6 : 1,
                }}>
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  {comment.user?.profilePicture ? (
                    <img src={comment.user.profilePicture} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--bg-elevated)' }}>
                      <User className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {comment.user?.username || 'Unknown'}
                        </span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px]"
                          style={{ background: `${cfg.color}15`, color: cfg.color }}>
                          <StatusIcon className="w-3 h-3" />
                          {comment.status}
                        </span>
                        <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                          {timeAgo(comment.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Comment content */}
                    <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                      {comment.content || comment.text}
                    </p>

                    {/* Post reference */}
                    {comment.post && (
                      <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
                        on: <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {typeof comment.post === 'object' ? comment.post.title : comment.post}
                        </span>
                      </p>
                    )}

                    {/* Flags */}
                    {comment.reports && comment.reports > 0 && (
                      <div className="flex items-center gap-1 mb-3 text-xs" style={{ color: '#ef4444' }}>
                        <AlertTriangle className="w-3 h-3" />
                        {comment.reports} report{comment.reports > 1 ? 's' : ''}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {comment.status !== 'approved' && (
                        <button
                          onClick={() => handleModerate(comment._id, 'approve')}
                          disabled={isProcessing}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border disabled:opacity-50"
                          style={{ borderColor: '#10b98140', color: '#10b981', background: '#10b98110' }}>
                          <CheckCircle className="w-3 h-3" /> Approve
                        </button>
                      )}
                      {comment.status !== 'hidden' && (
                        <button
                          onClick={() => handleModerate(comment._id, 'hide')}
                          disabled={isProcessing}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border disabled:opacity-50"
                          style={{ borderColor: 'var(--border-primary)', color: 'var(--text-tertiary)' }}>
                          <EyeOff className="w-3 h-3" /> Hide
                        </button>
                      )}
                      <button
                        onClick={() => handleModerate(comment._id, 'delete')}
                        disabled={isProcessing}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border disabled:opacity-50"
                        style={{ borderColor: '#ef444440', color: '#ef4444', background: '#ef444410' }}>
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
            <MessageCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>No comments to moderate</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
              {status ? `No ${status} comments found.` : 'All comments are moderated. Great job!'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} comments)
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 rounded-lg border disabled:opacity-50 transition-all"
              style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasMore}
              className="p-2 rounded-lg border disabled:opacity-50 transition-all"
              style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
