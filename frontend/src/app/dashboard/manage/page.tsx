'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store';
import {
  fetchContentManagement, schedulePost, cancelScheduledPost,
  togglePinPost, bulkUpdatePosts,
} from '@/store/slices/creatorDashboardSlice';
import {
  FileText, Calendar, Pin, Trash2, Eye, EyeOff, Archive, Clock,
  CheckCircle, XCircle, Search, Filter, ChevronLeft, ChevronRight,
  MoreVertical, PinOff, CalendarPlus, Plus,
} from 'lucide-react';

const statusFilters = [
  { label: 'All', value: '' },
  { label: 'Published', value: 'published' },
  { label: 'Draft', value: 'draft' },
  { label: 'Archived', value: 'archived' },
  { label: 'Pending', value: 'pending' },
];

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

const statusColors: Record<string, string> = {
  published: '#10b981',
  draft: '#f59e0b',
  archived: '#6b7280',
  pending: '#3b82f6',
  rejected: '#ef4444',
  hidden: '#ef4444',
  scheduled: '#3b82f6',
};

const statusIcons: Record<string, React.ElementType> = {
  published: CheckCircle,
  draft: FileText,
  archived: Archive,
  pending: Clock,
  rejected: XCircle,
  hidden: EyeOff,
  scheduled: Clock,
};

export default function ContentManagerPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { contentManagement, contentManagementLoading } = useSelector((state: RootState) => state.creatorDashboard);

  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleContent, setScheduleContent] = useState('');
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [bulkAction, setBulkAction] = useState('');
  const [tab, setTab] = useState<'posts' | 'scheduled'>('posts');

  const loadData = useCallback(() => {
    dispatch(fetchContentManagement({ page, status, search }));
  }, [dispatch, page, status, search]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleTogglePin = async (postId: string) => {
    await dispatch(togglePinPost({ postId }));
    setActionMenu(null);
    loadData();
  };

  const handleCancelScheduled = async (id: string) => {
    await dispatch(cancelScheduledPost({ id }));
    loadData();
  };

  const handleSchedule = async () => {
    if (!scheduleDate || !scheduleTitle) return;
    await dispatch(schedulePost({ title: scheduleTitle, content: scheduleContent, scheduledFor: scheduleDate }));
    setShowSchedule(false);
    setScheduleDate('');
    setScheduleTitle('');
    setScheduleContent('');
    loadData();
  };

  const handleBulk = async () => {
    if (!bulkAction || !selected.length) return;
    await dispatch(bulkUpdatePosts({ postIds: selected, action: bulkAction }));
    setSelected([]);
    setBulkAction('');
    loadData();
  };

  const toggleSelectAll = () => {
    if (contentManagement?.posts) {
      const all = contentManagement.posts.map(p => p._id);
      setSelected(prev => prev.length === all.length ? [] : all);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const data = contentManagement;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Content Manager</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Manage, schedule, and organize all your posts.
          </p>
        </div>
        <button onClick={() => setShowSchedule(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ background: 'var(--accent-primary)', color: 'var(--bg-primary)' }}>
          <CalendarPlus className="w-4 h-4" /> Schedule Post
        </button>
      </div>

      {/* Status Counts */}
      {data?.statusSummary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(data.statusSummary).map(([key, val]) => {
            const Icon = statusIcons[key] || FileText;
            return (
              <button key={key} onClick={() => { setStatus(key === status ? '' : key); setPage(1); }}
                className="rounded-xl p-3 border transition-all"
                style={{
                  background: status === key ? `${statusColors[key] || '#6b7280'}15` : 'var(--bg-surface)',
                  borderColor: status === key ? statusColors[key] || '#6b7280' : 'var(--border-primary)',
                }}>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color: statusColors[key] || '#6b7280' }} />
                  <span className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{key}</span>
                </div>
                <p className="text-xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{val}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2" style={{ borderColor: 'var(--border-primary)' }}>
        {[
          { key: 'posts', label: 'All Posts', icon: FileText },
          { key: 'scheduled', label: 'Scheduled', icon: Calendar },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-medium transition-all"
            style={{
              background: tab === t.key ? 'var(--bg-surface)' : 'transparent',
              color: tab === t.key ? 'var(--accent-primary)' : 'var(--text-tertiary)',
              borderBottom: tab === t.key ? '2px solid var(--accent-primary)' : '2px solid transparent',
            }}>
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.key === 'scheduled' && data?.scheduled?.length ? (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full font-bold" style={{ background: '#3b82f620', color: '#3b82f6' }}>
                {data.scheduled.length}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Posts Tab */}
      {tab === 'posts' && (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
          {/* Filters & Bulk */}
          <div className="p-4 border-b flex flex-wrap gap-3 items-center" style={{ borderColor: 'var(--border-primary)' }}>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
              <input type="text" placeholder="Search posts..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
            </div>
            <div className="flex items-center gap-1">
              <Filter className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
              {statusFilters.map(f => (
                <button key={f.value} onClick={() => { setStatus(f.value); setPage(1); }}
                  className="px-2 py-1 text-xs rounded-md transition-all"
                  style={{
                    background: status === f.value ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                    color: status === f.value ? 'var(--bg-primary)' : 'var(--text-tertiary)',
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
            {selected.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{selected.length} selected</span>
                <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)}
                  className="px-2 py-1 text-xs rounded-md border"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                  <option value="">Bulk Action</option>
                  <option value="publish">Publish</option>
                  <option value="archive">Archive</option>
                  <option value="hide">Hide</option>
                  <option value="delete">Delete</option>
                </select>
                <button onClick={handleBulk} disabled={!bulkAction}
                  className="px-3 py-1 text-xs rounded-md font-medium transition-all disabled:opacity-50"
                  style={{ background: 'var(--accent-primary)', color: 'var(--bg-primary)' }}>
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-elevated)' }}>
                  <th className="p-3 w-10">
                    <input type="checkbox" onChange={toggleSelectAll}
                      checked={!!data?.posts?.length && selected.length === data.posts.length}
                      className="w-4 h-4 rounded" />
                  </th>
                  <th className="text-left p-3 font-medium" style={{ color: 'var(--text-tertiary)' }}>Content</th>
                  <th className="text-center p-3 font-medium" style={{ color: 'var(--text-tertiary)' }}>Status</th>
                  <th className="text-right p-3 font-medium" style={{ color: 'var(--text-tertiary)' }}>Views</th>
                  <th className="text-right p-3 font-medium" style={{ color: 'var(--text-tertiary)' }}>Likes</th>
                  <th className="text-right p-3 font-medium" style={{ color: 'var(--text-tertiary)' }}>Comments</th>
                  <th className="text-center p-3 font-medium" style={{ color: 'var(--text-tertiary)' }}>Date</th>
                  <th className="text-center p-3 font-medium w-12" style={{ color: 'var(--text-tertiary)' }}></th>
                </tr>
              </thead>
              <tbody>
                {contentManagementLoading && !data ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}><td colSpan={8} className="p-3">
                      <div className="h-12 rounded animate-pulse" style={{ background: 'var(--bg-elevated)' }} />
                    </td></tr>
                  ))
                ) : data?.posts?.length ? data.posts.map((post) => {
                  const StatusIcon = statusIcons[post.status] || FileText;
                  return (
                    <tr key={post._id} className="border-t transition-colors" style={{ borderColor: 'var(--border-primary)' }}>
                      <td className="p-3">
                        <input type="checkbox" checked={selected.includes(post._id)}
                          onChange={() => toggleSelect(post._id)} className="w-4 h-4 rounded" />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {post.image?.thumbnailUrl || post.image?.url ? (
                            <img src={post.image.thumbnailUrl || post.image.url} alt=""
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ background: 'var(--bg-elevated)' }} />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>{post.title}</p>
                              {post.isPinned && <Pin className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />}
                            </div>
                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              {post.mediaType} · {post.tags?.slice(0, 3).join(', ') || 'No tags'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center p-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: `${statusColors[post.status] || '#6b7280'}20`, color: statusColors[post.status] || '#6b7280' }}>
                          <StatusIcon className="w-3 h-3" />
                          {post.status}
                        </span>
                      </td>
                      <td className="text-right p-3 font-mono" style={{ color: 'var(--text-primary)' }}>{formatNum(post.viewsCount)}</td>
                      <td className="text-right p-3 font-mono" style={{ color: 'var(--text-primary)' }}>{formatNum(post.likesCount)}</td>
                      <td className="text-right p-3 font-mono" style={{ color: 'var(--text-primary)' }}>{formatNum(post.commentsCount)}</td>
                      <td className="text-center p-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {new Date(post.createdAt).toLocaleDateString()}
                      </td>
                      <td className="text-center p-3 relative">
                        <button onClick={() => setActionMenu(actionMenu === post._id ? null : post._id)}
                          className="p-1 rounded-md hover:opacity-80 transition-all" style={{ color: 'var(--text-tertiary)' }}>
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {actionMenu === post._id && (
                          <div className="absolute right-0 top-full z-20 rounded-lg border shadow-lg py-1 min-w-[140px]"
                            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-primary)' }}>
                            <button onClick={() => handleTogglePin(post._id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:opacity-80 transition-all"
                              style={{ color: 'var(--text-secondary)' }}>
                              {post.isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                              {post.isPinned ? 'Unpin' : 'Pin to Profile'}
                            </button>
                            <button onClick={() => setActionMenu(null)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:opacity-80 transition-all"
                              style={{ color: 'var(--text-secondary)' }}>
                              <Eye className="w-3 h-3" /> View Post
                            </button>
                            <button onClick={() => setActionMenu(null)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:opacity-80 transition-all"
                              style={{ color: 'var(--text-secondary)' }}>
                              <Archive className="w-3 h-3" /> Archive
                            </button>
                            <button onClick={() => setActionMenu(null)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:opacity-80 transition-all"
                              style={{ color: '#ef4444' }}>
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={8} className="text-center p-12" style={{ color: 'var(--text-tertiary)' }}>No posts found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Page {data.pagination.page} of {data.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-2 rounded-lg border disabled:opacity-50"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage(p => p + 1)} disabled={!data.pagination.hasMore}
                  className="p-2 rounded-lg border disabled:opacity-50"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scheduled Tab */}
      {tab === 'scheduled' && (
        <div className="space-y-3">
          {data?.scheduled?.length ? data.scheduled.map((sp) => (
            <div key={sp._id} className="rounded-xl border p-4 flex items-center justify-between"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5" style={{ color: '#3b82f6' }} />
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{sp.post?.title || 'Scheduled Post'}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Scheduled for: {new Date(sp.scheduledFor).toLocaleString()}
                    {sp.recurring && ` · ${sp.recurrencePattern || 'recurring'}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs capitalize px-2 py-1 rounded-full"
                  style={{ background: `${statusColors[sp.status] || '#3b82f6'}20`, color: statusColors[sp.status] || '#3b82f6' }}>
                  {sp.status}
                </span>
                {sp.status === 'scheduled' && (
                  <button onClick={() => handleCancelScheduled(sp._id)}
                    className="p-1.5 rounded-md hover:opacity-80 transition-all" style={{ color: '#ef4444' }}>
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )) : (
            <div className="text-center py-16 rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
              <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>No scheduled posts</p>
              <p className="text-sm mt-1 mb-4" style={{ color: 'var(--text-tertiary)' }}>
                Schedule content to be published automatically at the best times.
              </p>
              <button onClick={() => setShowSchedule(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ background: 'var(--accent-primary)', color: 'var(--bg-primary)' }}>
                <Plus className="w-4 h-4 inline mr-1" /> Schedule First Post
              </button>
            </div>
          )}
        </div>
      )}

      {/* Schedule Modal */}
      {showSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowSchedule(false)}>
          <div className="rounded-xl p-6 w-full max-w-md mx-4 space-y-4" onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-primary)' }}>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Schedule a Post</h3>
            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Title *</label>
              <input type="text" value={scheduleTitle} onChange={(e) => setScheduleTitle(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm border"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                placeholder="Post title" />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Content</label>
              <textarea value={scheduleContent} onChange={(e) => setScheduleContent(e.target.value)} rows={3}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm border resize-none"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                placeholder="Post content..." />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Schedule Date & Time *</label>
              <input type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm border"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowSchedule(false)} className="flex-1 py-2 rounded-lg text-sm border transition-all"
                style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={handleSchedule} disabled={!scheduleTitle || !scheduleDate}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                style={{ background: 'var(--accent-primary)', color: 'var(--bg-primary)' }}>Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
