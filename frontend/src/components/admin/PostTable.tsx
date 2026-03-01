'use client';

import { useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Post } from '@/types';
import { timeAgo } from '@/lib/utils';
import {
  Eye, Trash2, RotateCcw, AlertTriangle, ImageIcon, Play,
} from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import type { ColDef, ICellRendererParams, GridReadyEvent } from 'ag-grid-community';
import { useEdithGridTheme } from '@/lib/agGridTheme';

ModuleRegistry.registerModules([AllCommunityModule]);

/* ── Props ── */
interface PostTableProps {
  posts: Post[];
  isLoading: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onDelete: (id: string, title: string) => void;
  onRestore: (id: string) => void;
}

/* ── Module-level refs for cell renderer callbacks ── */
let _selectedIds: Set<string> = new Set();
let _onToggleSelect: (id: string) => void;
let _onToggleSelectAll: () => void;
let _onDelete: (id: string, title: string) => void;
let _onRestore: (id: string) => void;

/* ── Cell Renderers ── */
function CheckboxCellRenderer(params: ICellRendererParams) {
  const post = params.data as Post;
  if (!post) return null;
  const isSelected = _selectedIds.has(post._id);
  return (
    <button onClick={() => _onToggleSelect(post._id)} className="flex items-center justify-center w-full">
      <div className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${
        isSelected ? 'bg-[var(--edith-accent)] border-[var(--edith-accent)]' : 'border-[var(--edith-border)]'
      }`}>
        {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
      </div>
    </button>
  );
}

function CheckboxHeaderRenderer() {
  return (
    <button onClick={() => _onToggleSelectAll()} className="flex items-center justify-center w-full">
      <div className="w-4 h-4 rounded border border-[var(--edith-border)] flex items-center justify-center hover:border-[var(--edith-accent)] transition-colors" />
    </button>
  );
}

function PostCellRenderer(params: ICellRendererParams) {
  const post = params.data as Post;
  if (!post) return null;
  const thumb = post.image?.url || post.video?.thumbnailUrl;
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0" style={{ border: '1px solid var(--edith-border)' }}>
        {thumb ? (
          <img src={thumb} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--edith-accent-muted)' }}>
            <ImageIcon className="w-4 h-4" style={{ color: 'var(--edith-text-muted)' }} />
          </div>
        )}
        {post.mediaType === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-mono font-medium truncate leading-tight" style={{ color: 'var(--edith-text)' }}>
          {post.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {post.isAiGenerated && <span className="text-[9px] font-mono text-purple-600 dark:text-purple-400">✨ AI</span>}
          {post.reportCount > 0 && (
            <span className="flex items-center gap-0.5 text-[9px] font-mono text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-2.5 h-2.5" /> {post.reportCount}
            </span>
          )}
          {post.isFeatured && <span className="text-[9px] font-mono text-amber-500 dark:text-amber-300">⭐</span>}
        </div>
      </div>
    </div>
  );
}

function AuthorCellRenderer(params: ICellRendererParams) {
  const post = params.data as Post;
  if (!post) return null;
  return (
    <div className="flex items-center gap-2">
      {post.author?.avatar ? (
        <img src={post.author.avatar} alt="" className="w-5 h-5 rounded object-cover" style={{ border: '1px solid var(--edith-border)' }} />
      ) : (
        <div className="w-5 h-5 rounded flex items-center justify-center text-[8px] font-mono font-bold text-[var(--edith-accent)]" style={{ background: 'var(--edith-accent-muted)' }}>
          {post.author?.displayName?.[0]?.toUpperCase() || '?'}
        </div>
      )}
      <span className="text-[10px] font-mono truncate" style={{ color: 'var(--edith-text-dim)' }}>
        {post.author?.displayName || 'Unknown'}
      </span>
    </div>
  );
}

function StatsCellRenderer(params: ICellRendererParams) {
  const post = params.data as Post;
  if (!post) return null;
  return (
    <div className="text-[10px] font-mono" style={{ color: 'var(--edith-text-muted)' }}>
      <span title="Views">👁 {post.viewsCount}</span>{' '}
      <span title="Likes">❤️ {post.likesCount}</span>
    </div>
  );
}

function StatusBadgeCellRenderer(params: ICellRendererParams) {
  const post = params.data as Post;
  if (!post) return null;
  if (post.isDeleted) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-red-500/15 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
        <Trash2 className="w-2.5 h-2.5" /> Deleted
      </span>
    );
  }
  const statusConfig: Record<string, { bg: string; text: string }> = {
    published: { bg: 'bg-emerald-500/15 dark:bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
    pending: { bg: 'bg-amber-500/15 dark:bg-amber-500/10 border-amber-500/20', text: 'text-amber-600 dark:text-amber-400' },
    rejected: { bg: 'bg-red-500/15 dark:bg-red-500/10 border-red-500/20', text: 'text-red-600 dark:text-red-400' },
    draft: { bg: 'bg-gray-500/15 dark:bg-gray-500/10 border-gray-500/20', text: 'text-gray-600 dark:text-gray-400' },
    archived: { bg: 'bg-purple-500/15 dark:bg-purple-500/10 border-purple-500/20', text: 'text-purple-600 dark:text-purple-400' },
  };
  const c = statusConfig[post.status] || statusConfig.draft;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium rounded-full border ${c.bg} ${c.text}`}>
      {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
    </span>
  );
}

function ActionsCellRenderer(params: ICellRendererParams) {
  const post = params.data as Post;
  if (!post) return null;
  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/post/${post._id}`}
        className="p-1.5 rounded-lg transition-colors hover:bg-[rgba(0,200,255,0.1)] dark:hover:bg-[rgba(0,200,255,0.1)] hover:bg-[rgba(0,145,179,0.1)]"
        style={{ color: 'var(--edith-text-muted)' }}
        title="View post"
        onClick={(e) => e.stopPropagation()}
      >
        <Eye className="w-3.5 h-3.5" />
      </Link>
      {post.isDeleted ? (
        <button
          onClick={() => _onRestore(post._id)}
          className="p-1.5 rounded-lg transition-colors hover:bg-emerald-500/15 dark:hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          title="Restore post"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button
          onClick={() => _onDelete(post._id, post.title)}
          className="p-1.5 rounded-lg transition-colors hover:bg-red-500/15 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400"
          title="Delete post"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

/* ── Main Component ── */
export default function PostTable({
  posts,
  isLoading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onDelete,
  onRestore,
}: PostTableProps) {
  const gridRef = useRef<AgGridReact>(null);
  const edithTheme = useEdithGridTheme();

  // Expose callbacks to cell renderers
  _selectedIds = selectedIds;
  _onToggleSelect = onToggleSelect;
  _onToggleSelectAll = onToggleSelectAll;
  _onDelete = onDelete;
  _onRestore = onRestore;

  const rowData = useMemo(() => {
    if (!posts) return [];
    return posts.map((p) => ({ ...p, author: p.author ? { ...p.author } : undefined }));
  }, [posts]);

  const columnDefs = useMemo<ColDef[]>(() => [
    {
      headerName: '',
      field: '_id',
      cellRenderer: CheckboxCellRenderer,
      headerComponent: CheckboxHeaderRenderer,
      width: 50,
      sortable: false,
      filter: false,
      resizable: false,
      suppressMovable: true,
    },
    {
      headerName: 'POST',
      field: 'title',
      cellRenderer: PostCellRenderer,
      flex: 2,
      minWidth: 220,
      sortable: false,
    },
    {
      headerName: 'AUTHOR',
      field: 'author.displayName',
      cellRenderer: AuthorCellRenderer,
      width: 140,
      sortable: false,
    },
    {
      headerName: 'STATS',
      field: 'viewsCount',
      cellRenderer: StatsCellRenderer,
      width: 110,
      sortable: false,
    },
    {
      headerName: 'DATE',
      field: 'createdAt',
      width: 110,
      valueFormatter: (p) => {
        const post = p.data as Post;
        if (post?.isDeleted && post?.deletedAt) return `🗑 ${timeAgo(post.deletedAt)}`;
        return p.value ? timeAgo(p.value) : '—';
      },
      cellStyle: ((p: any) => ({
        color: (p.data as Post)?.isDeleted ? '#f87171' : 'var(--edith-text-muted)',
        fontSize: '10px',
        fontFamily: 'JetBrains Mono, monospace',
      })) as any,
    },
    {
      headerName: 'STATUS',
      field: 'status',
      cellRenderer: StatusBadgeCellRenderer,
      width: 100,
      sortable: false,
    },
    {
      headerName: '',
      field: 'actions',
      cellRenderer: ActionsCellRenderer,
      width: 100,
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

  const getRowStyle = useCallback((params: any): any => {
    const post = params.data as Post;
    if (post?.isDeleted) return { opacity: '0.6' };
    if (selectedIds.has(post?._id)) return { background: 'rgba(0,200,255,0.04)' };
    return undefined;
  }, [selectedIds]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-lg animate-pulse"
            style={{ background: 'var(--edith-elevated)', border: '1px solid var(--edith-border)' }}
          >
            <div className="w-5 h-5 rounded bg-edith-cyan/10" />
            <div className="w-12 h-12 rounded bg-edith-cyan/10" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 rounded bg-edith-cyan/10" />
              <div className="h-2 w-24 rounded bg-edith-cyan/10" />
            </div>
            <div className="h-3 w-16 rounded bg-edith-cyan/10" />
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 rounded-lg"
        style={{ border: '1px solid var(--edith-border)', background: 'var(--edith-elevated)' }}
      >
        <ImageIcon className="w-10 h-10 mb-3" style={{ color: 'var(--edith-text-muted)' }} />
        <p className="text-sm font-mono" style={{ color: 'var(--edith-text-muted)' }}>No posts found</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden" style={{ height: Math.min(rowData.length * 56 + 48, 700) }}>
      <AgGridReact
        ref={gridRef}
        theme={edithTheme}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowHeight={56}
        headerHeight={40}
        animateRows={true}
        suppressCellFocus={true}
        onGridReady={onGridReady}
        getRowStyle={getRowStyle}
        overlayNoRowsTemplate='<span style="color: var(--edith-text-muted)">No posts found</span>'
      />
    </div>
  );
}
