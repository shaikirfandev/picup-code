'use client';

import { useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { BlogPost } from '@/types';
import { timeAgo } from '@/lib/utils';
import {
  Eye, Trash2, RotateCcw, BookOpen, Clock,
} from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import type { ColDef, ICellRendererParams, GridReadyEvent } from 'ag-grid-community';
import { usePicupGridTheme } from '@/lib/agGridTheme';

ModuleRegistry.registerModules([AllCommunityModule]);

/* ── Props ── */
interface BlogTableProps {
  posts: BlogPost[];
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

/* ── Category Colors ── */
const CATEGORY_COLORS: Record<string, string> = {
  technology: 'text-blue-600 dark:text-blue-400 bg-blue-500/15 dark:bg-blue-500/10',
  ai: 'text-purple-600 dark:text-purple-400 bg-purple-500/15 dark:bg-purple-500/10',
  'web-development': 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/15 dark:bg-indigo-500/10',
  mobile: 'text-pink-600 dark:text-pink-400 bg-pink-500/15 dark:bg-pink-500/10',
  cloud: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/15 dark:bg-cyan-500/10',
  cybersecurity: 'text-red-600 dark:text-red-400 bg-red-500/15 dark:bg-red-500/10',
  gadgets: 'text-amber-600 dark:text-amber-400 bg-amber-500/15 dark:bg-amber-500/10',
  software: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 dark:bg-emerald-500/10',
  tutorials: 'text-teal-600 dark:text-teal-400 bg-teal-500/15 dark:bg-teal-500/10',
  news: 'text-orange-600 dark:text-orange-400 bg-orange-500/15 dark:bg-orange-500/10',
  other: 'text-gray-600 dark:text-gray-400 bg-gray-500/15 dark:bg-gray-500/10',
};

/* ── Cell Renderers ── */
function CheckboxCellRenderer(params: ICellRendererParams) {
  const post = params.data as BlogPost;
  if (!post) return null;
  const isSelected = _selectedIds.has(post._id);
  return (
    <button onClick={() => _onToggleSelect(post._id)} className="flex items-center justify-center w-full">
      <div className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${
        isSelected ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border)]'
      }`}>
        {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
      </div>
    </button>
  );
}

function CheckboxHeaderRenderer() {
  return (
    <button onClick={() => _onToggleSelectAll()} className="flex items-center justify-center w-full">
      <div className="w-4 h-4 rounded border border-[var(--border)] flex items-center justify-center hover:border-[var(--accent)] transition-colors" />
    </button>
  );
}

function ArticleCellRenderer(params: ICellRendererParams) {
  const post = params.data as BlogPost;
  if (!post) return null;
  const cover = post.coverImage?.url;
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="relative w-14 h-10 rounded-lg overflow-hidden shrink-0" style={{ border: '1px solid var(--border)' }}>
        {cover ? (
          <img src={cover} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--accent-muted)' }}>
            <BookOpen className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-mono font-medium truncate leading-tight" style={{ color: 'var(--foreground)' }}>
          {post.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="flex items-center gap-0.5 text-[9px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
            <Clock className="w-2.5 h-2.5" /> {post.readTime}m read
          </span>
          {post.isFeatured && <span className="text-[9px] font-mono text-amber-500 dark:text-amber-300">⭐</span>}
        </div>
      </div>
    </div>
  );
}

function AuthorCellRenderer(params: ICellRendererParams) {
  const post = params.data as BlogPost;
  if (!post) return null;
  return (
    <div className="flex items-center gap-2">
      {post.author?.avatar ? (
        <img src={post.author.avatar} alt="" className="w-5 h-5 rounded object-cover" style={{ border: '1px solid var(--border)' }} />
      ) : (
        <div className="w-5 h-5 rounded flex items-center justify-center text-[8px] font-mono font-bold text-[var(--accent)]" style={{ background: 'var(--accent-muted)' }}>
          {post.author?.displayName?.[0]?.toUpperCase() || '?'}
        </div>
      )}
      <span className="text-[10px] font-mono truncate" style={{ color: 'var(--text-secondary)' }}>
        {post.author?.displayName || 'Unknown'}
      </span>
    </div>
  );
}

function CategoryCellRenderer(params: ICellRendererParams) {
  const post = params.data as BlogPost;
  if (!post) return null;
  const c = CATEGORY_COLORS[post.category] || CATEGORY_COLORS.other;
  const label = post.category.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono font-medium rounded ${c}`}>
      {label}
    </span>
  );
}

function StatsCellRenderer(params: ICellRendererParams) {
  const post = params.data as BlogPost;
  if (!post) return null;
  return (
    <div className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
      <span title="Views">👁 {post.viewsCount}</span>{' '}
      <span title="Likes">❤️ {post.likesCount}</span>
    </div>
  );
}

function StatusBadgeCellRenderer(params: ICellRendererParams) {
  const post = params.data as BlogPost;
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
  const post = params.data as BlogPost;
  if (!post) return null;
  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/blog/${post.slug}`}
        className="p-1.5 rounded-lg transition-colors hover:bg-[rgba(0,145,179,0.1)] dark:hover:bg-[rgba(0,200,255,0.1)]"
        style={{ color: 'var(--text-tertiary)' }}
        title="View article"
        onClick={(e) => e.stopPropagation()}
      >
        <Eye className="w-3.5 h-3.5" />
      </Link>
      {post.isDeleted ? (
        <button
          onClick={() => _onRestore(post._id)}
          className="p-1.5 rounded-lg transition-colors hover:bg-emerald-500/15 dark:hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          title="Restore article"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button
          onClick={() => _onDelete(post._id, post.title)}
          className="p-1.5 rounded-lg transition-colors hover:bg-red-500/15 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400"
          title="Delete article"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

/* ── Main Component ── */
export default function BlogTable({
  posts,
  isLoading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onDelete,
  onRestore,
}: BlogTableProps) {
  const gridRef = useRef<AgGridReact>(null);
  const picupTheme = usePicupGridTheme();

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
      headerName: 'ARTICLE',
      field: 'title',
      cellRenderer: ArticleCellRenderer,
      flex: 2,
      minWidth: 240,
      sortable: false,
    },
    {
      headerName: 'AUTHOR',
      field: 'author.displayName',
      cellRenderer: AuthorCellRenderer,
      width: 130,
      sortable: false,
    },
    {
      headerName: 'CATEGORY',
      field: 'category',
      cellRenderer: CategoryCellRenderer,
      width: 120,
      sortable: false,
    },
    {
      headerName: 'STATS',
      field: 'viewsCount',
      cellRenderer: StatsCellRenderer,
      width: 100,
      sortable: false,
    },
    {
      headerName: 'DATE',
      field: 'createdAt',
      width: 110,
      valueFormatter: (p) => {
        const post = p.data as BlogPost;
        if (post?.isDeleted && post?.deletedAt) return `🗑 ${timeAgo(post.deletedAt)}`;
        return p.value ? timeAgo(p.value) : '—';
      },
      cellStyle: ((p: any) => ({
        color: (p.data as BlogPost)?.isDeleted ? '#f87171' : 'var(--text-tertiary)',
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
    const post = params.data as BlogPost;
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
            style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
          >
            <div className="w-5 h-5 rounded bg-accent/10" />
            <div className="w-14 h-10 rounded bg-accent/10" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-48 rounded bg-accent/10" />
              <div className="h-2 w-24 rounded bg-accent/10" />
            </div>
            <div className="h-3 w-16 rounded bg-accent/10" />
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 rounded-lg"
        style={{ border: '1px solid var(--border)', background: 'var(--surface-elevated)' }}
      >
        <BookOpen className="w-10 h-10 mb-3" style={{ color: 'var(--text-tertiary)' }} />
        <p className="text-sm font-mono" style={{ color: 'var(--text-tertiary)' }}>No blog posts found</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden" style={{ height: Math.min(rowData.length * 56 + 48, 700) }}>
      <AgGridReact
        ref={gridRef}
        theme={picupTheme}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowHeight={56}
        headerHeight={40}
        animateRows={true}
        suppressCellFocus={true}
        onGridReady={onGridReady}
        getRowStyle={getRowStyle}
        overlayNoRowsTemplate='<span style="color: var(--text-tertiary)">No blog posts found</span>'
      />
    </div>
  );
}
