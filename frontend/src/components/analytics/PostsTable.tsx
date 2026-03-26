'use client';

import { useMemo, useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Heart, MousePointerClick, TrendingUp, ExternalLink, Pencil, Check, X, Tag, Share2, Bookmark, MessageCircle } from 'lucide-react';
import type { PostPerformanceRow } from '@/types';
import { PostsTableSkeleton } from './AnalyticsSkeleton';
import { formatNumber } from '@/lib/utils';
import { postsAPI } from '@/lib/api';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import type { ColDef, ICellRendererParams, GridReadyEvent, RowClickedEvent } from 'ag-grid-community';
import { usePicupGridTheme } from '@/lib/agGridTheme';
import toast from 'react-hot-toast';

ModuleRegistry.registerModules([AllCommunityModule]);

/* ── Cell Renderers ────────────────────────────────────────────────────── */
function PostCellRenderer(params: ICellRendererParams) {
  const row = params.data as PostPerformanceRow;
  if (!row) return null;
  const thumb = row.post.image?.url || row.post.video?.thumbnailUrl;
  return (
    <div className="flex items-center gap-3 py-1">
      {thumb ? (
        <img src={thumb} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-lg bg-[var(--accent-muted)] flex items-center justify-center flex-shrink-0">
          <Eye className="w-4 h-4 text-[var(--text-secondary)]" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate leading-tight">{row.post.title || 'Untitled'}</p>
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] text-[var(--text-secondary)] capitalize leading-tight">{row.post.mediaType}</p>
          {row.post.tags && row.post.tags.length > 0 && (
            <span className="text-[10px] text-[var(--text-muted)]">· {row.post.tags.length} tags</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Edit Post Modal ── */
function EditPostModal({ row, onClose, onSaved }: { row: PostPerformanceRow; onClose: () => void; onSaved: (postId: string, title: string, tags: string[]) => void }) {
  const [title, setTitle] = useState(row.post.title || '');
  const [tags, setTags] = useState<string[]>(row.post.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      await postsAPI.updatePost(row.postId, { title: title.trim(), tags });
      toast.success('Post updated');
      onSaved(row.postId, title.trim(), tags);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update post');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-md p-6 space-y-4 mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Edit Post</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--surface-secondary)] transition-colors">
            <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            maxLength={200}
            placeholder="Post title"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Tags</label>
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              placeholder="Add a tag"
              className="input-field flex-1"
            />
            <button type="button" onClick={addTag} className="btn-ghost px-3">
              <Tag className="w-4 h-4" />
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((t) => (
                <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--accent-muted)] text-[var(--accent)] text-xs">
                  #{t}
                  <button type="button" onClick={() => removeTag(t)} className="hover:opacity-70">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving || !title.trim()} className="btn-primary px-4 py-2 text-sm gap-1.5">
            {saving ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function EngagementBadge({ rate }: { rate: number }) {
  let color = 'text-red-600 dark:text-red-400 bg-red-500/15 dark:bg-red-500/10';
  if (rate >= 10) color = 'text-green-600 dark:text-green-400 bg-green-500/15 dark:bg-green-500/10';
  else if (rate >= 5) color = 'text-amber-600 dark:text-amber-400 bg-amber-500/15 dark:bg-amber-500/10';
  else if (rate >= 2) color = 'text-blue-600 dark:text-blue-400 bg-blue-500/15 dark:bg-blue-500/10';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {rate.toFixed(1)}%
    </span>
  );
}

function EngagementCellRenderer(params: ICellRendererParams) {
  return <EngagementBadge rate={params.value ?? 0} />;
}

function DetailsCellRenderer(params: ICellRendererParams) {
  const row = params.data as PostPerformanceRow;
  if (!row) return null;
  const context = params.context as { onEditPost?: (row: PostPerformanceRow) => void };
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={(e) => { e.stopPropagation(); context?.onEditPost?.(row); }}
        className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
        title="Edit title & tags"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <Link
        href={`/analytics/post/${row.postId}`}
        className="text-[var(--accent)] hover:underline text-sm inline-flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        Details <ExternalLink className="w-3 h-3" />
      </Link>
    </div>
  );
}

/* ── Props ─────────────────────────────────────────────────────────────── */
interface PostsTableProps {
  data: PostPerformanceRow[];
  isLoading: boolean;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
  onPageChange: (page: number) => void;
}

export default function PostsTable({ data, isLoading, pagination, onPageChange }: PostsTableProps) {
  const router = useRouter();
  const gridRef = useRef<AgGridReact>(null);
  const picupTheme = usePicupGridTheme();
  const [editingRow, setEditingRow] = useState<PostPerformanceRow | null>(null);

  // Deep-clone data to avoid Immer frozen-state issues with AG Grid internal mutations
  const rowData = useMemo(() => {
    if (!data) return [];
    return data.map((row) => ({ ...row, post: { ...row.post } }));
  }, [data]);

  const handlePostUpdated = useCallback((postId: string, title: string, tags: string[]) => {
    if (gridRef.current?.api) {
      gridRef.current.api.forEachNode((node) => {
        const row = node.data as PostPerformanceRow;
        if (row?.postId === postId) {
          row.post.title = title;
          row.post.tags = tags;
          node.setData({ ...row });
        }
      });
    }
  }, []);

  const gridContext = useMemo(() => ({
    onEditPost: (row: PostPerformanceRow) => setEditingRow(row),
  }), []);

  const columnDefs = useMemo<ColDef[]>(() => [
    {
      headerName: 'Post',
      field: 'post.title',
      cellRenderer: PostCellRenderer,
      flex: 2,
      minWidth: 220,
      sortable: false,
      filter: false,
    },
    {
      headerName: 'Views',
      field: 'impressions',
      width: 110,
      type: 'numericColumn',
      valueFormatter: (p) => formatNumber(p.value ?? 0),
      sort: 'desc',
    },
    {
      headerName: 'Unique',
      field: 'uniqueViews',
      width: 100,
      type: 'numericColumn',
      valueFormatter: (p) => formatNumber(p.value ?? 0),
    },
    {
      headerName: 'Likes',
      field: 'likes',
      width: 90,
      type: 'numericColumn',
      valueFormatter: (p) => formatNumber(p.value ?? 0),
    },
    {
      headerName: 'Shares',
      field: 'shares',
      width: 90,
      type: 'numericColumn',
      valueFormatter: (p) => formatNumber(p.value ?? 0),
    },
    {
      headerName: 'Saves',
      field: 'saves',
      width: 90,
      type: 'numericColumn',
      valueFormatter: (p) => formatNumber(p.value ?? 0),
    },
    {
      headerName: 'Comments',
      field: 'comments',
      width: 110,
      type: 'numericColumn',
      valueFormatter: (p) => formatNumber(p.value ?? 0),
    },
    {
      headerName: 'Clicks',
      field: 'clicks',
      width: 90,
      type: 'numericColumn',
      valueFormatter: (p) => formatNumber(p.value ?? 0),
    },
    {
      headerName: 'CTR',
      field: 'ctr',
      width: 80,
      type: 'numericColumn',
      valueFormatter: (p) => `${(p.value ?? 0).toFixed(1)}%`,
    },
    {
      headerName: 'Eng. Rate',
      field: 'engagementRate',
      width: 110,
      cellRenderer: EngagementCellRenderer,
    },
    {
      headerName: '',
      field: 'postId',
      width: 90,
      cellRenderer: DetailsCellRenderer,
      sortable: false,
      filter: false,
    },
  ], []);

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    resizable: true,
    suppressMovable: true,
  }), []);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
  }, []);

  const onRowClicked = useCallback((event: RowClickedEvent) => {
    const row = event.data as PostPerformanceRow;
    if (row?.postId) {
      router.push(`/analytics/post/${row.postId}`);
    }
  }, [router]);

  if (isLoading) return <PostsTableSkeleton />;

  if (!data || data.length === 0) {
    return (
      <div className="card p-12 text-center text-[var(--text-secondary)]">
        <p>No post data available for this period.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* AG Grid Table */}
      <div className="card overflow-hidden" style={{ height: Math.min(rowData.length * 52 + 56, 680) }}>
        <AgGridReact
          ref={gridRef}
          theme={picupTheme}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowHeight={52}
          headerHeight={44}
          animateRows={true}
          suppressCellFocus={true}
          onGridReady={onGridReady}
          onRowClicked={onRowClicked}
          context={gridContext}
          rowClass="cursor-pointer"
          overlayNoRowsTemplate="<span class='text-[var(--text-secondary)]'>No post data</span>"
        />
      </div>

      {/* Mobile Cards (AG Grid hides on mobile) */}
      <div className="md:hidden space-y-3">
        {rowData.map((row) => (
          <div key={row.postId} className="card p-4 block hover:border-[var(--accent)]/20 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              {row.post.image?.url && (
                <img src={row.post.image.url} alt="" className="w-12 h-12 rounded-lg object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{row.post.title || 'Untitled'}</p>
                <p className="text-xs text-[var(--text-muted)] capitalize">{row.post.mediaType}</p>
              </div>
              <button
                onClick={() => setEditingRow(row)}
                className="text-[var(--text-secondary)] hover:text-[var(--accent)] p-1.5"
                title="Edit title & tags"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            <Link
              href={`/analytics/post/${row.postId}`}
              className="block"
            >
              <div className="grid grid-cols-3 gap-2 text-center mb-2">
                <MiniStat icon={<Eye className="w-3 h-3" />} value={row.impressions} label="Views" />
                <MiniStat icon={<Heart className="w-3 h-3" />} value={row.likes} label="Likes" />
                <MiniStat icon={<Share2 className="w-3 h-3" />} value={row.shares} label="Shares" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <MiniStat icon={<Bookmark className="w-3 h-3" />} value={row.saves} label="Saves" />
                <MiniStat icon={<MessageCircle className="w-3 h-3" />} value={row.comments} label="Comments" />
                <MiniStat icon={<MousePointerClick className="w-3 h-3" />} value={row.clicks} label="Clicks" />
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Edit Post Modal */}
      {editingRow && (
        <EditPostModal
          row={editingRow}
          onClose={() => setEditingRow(null)}
          onSaved={handlePostUpdated}
        />
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-[var(--text-muted)]">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} posts)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="btn-ghost p-2 disabled:opacity-30"
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
              const start = Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4));
              const p = start + i;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    p === pagination.page
                      ? 'bg-[var(--accent)] text-white'
                      : 'hover:bg-[var(--accent-muted)] text-[var(--text-secondary)]'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasMore}
              className="btn-ghost p-2 disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ icon, value, label, suffix }: { icon: React.ReactNode; value: number; label: string; suffix?: string }) {
  return (
    <div>
      <div className="flex items-center justify-center gap-1 text-[var(--text-muted)]">{icon}</div>
      <p className="text-sm font-semibold">
        {typeof value === 'number' && suffix === '%' ? value.toFixed(1) : formatNumber(value)}{suffix || ''}
      </p>
      <p className="text-[10px] text-[var(--text-muted)]">{label}</p>
    </div>
  );
}
