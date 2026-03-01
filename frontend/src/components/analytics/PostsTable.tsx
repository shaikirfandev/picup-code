'use client';

import { useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Heart, MousePointerClick, TrendingUp, ExternalLink } from 'lucide-react';
import type { PostPerformanceRow } from '@/types';
import { PostsTableSkeleton } from './AnalyticsSkeleton';
import { formatNumber } from '@/lib/utils';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import type { ColDef, ICellRendererParams, GridReadyEvent, RowClickedEvent } from 'ag-grid-community';
import { useEdithGridTheme } from '@/lib/agGridTheme';

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
        <div className="w-9 h-9 rounded-lg bg-[var(--edith-accent-muted)] flex items-center justify-center flex-shrink-0">
          <Eye className="w-4 h-4 text-[var(--edith-text-dim)]" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium truncate leading-tight">{row.post.title || 'Untitled'}</p>
        <p className="text-[11px] text-[var(--edith-text-dim)] capitalize leading-tight">{row.post.mediaType}</p>
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
  return (
    <Link
      href={`/analytics/post/${row.postId}`}
      className="text-[var(--edith-accent)] hover:underline text-sm inline-flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      Details <ExternalLink className="w-3 h-3" />
    </Link>
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
  const edithTheme = useEdithGridTheme();

  // Deep-clone data to avoid Immer frozen-state issues with AG Grid internal mutations
  const rowData = useMemo(() => {
    if (!data) return [];
    return data.map((row) => ({ ...row, post: { ...row.post } }));
  }, [data]);

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
          theme={edithTheme}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowHeight={52}
          headerHeight={44}
          animateRows={true}
          suppressCellFocus={true}
          onGridReady={onGridReady}
          onRowClicked={onRowClicked}
          rowClass="cursor-pointer"
          overlayNoRowsTemplate="<span class='text-[var(--edith-text-dim)]'>No post data</span>"
        />
      </div>

      {/* Mobile Cards (AG Grid hides on mobile) */}
      <div className="md:hidden space-y-3">
        {rowData.map((row) => (
          <Link
            key={row.postId}
            href={`/analytics/post/${row.postId}`}
            className="card p-4 block hover:border-[var(--accent)]/20 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              {row.post.image?.url && (
                <img src={row.post.image.url} alt="" className="w-12 h-12 rounded-lg object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{row.post.title || 'Untitled'}</p>
                <p className="text-xs text-[var(--text-muted)] capitalize">{row.post.mediaType}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <MiniStat icon={<Eye className="w-3 h-3" />} value={row.impressions} label="Views" />
              <MiniStat icon={<Heart className="w-3 h-3" />} value={row.likes} label="Likes" />
              <MiniStat icon={<MousePointerClick className="w-3 h-3" />} value={row.clicks} label="Clicks" />
              <MiniStat icon={<TrendingUp className="w-3 h-3" />} value={row.engagementRate} label="Eng %" suffix="%" />
            </div>
          </Link>
        ))}
      </div>

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
                      ? 'bg-[var(--edith-accent)] text-white'
                      : 'hover:bg-[var(--edith-accent-muted)] text-[var(--edith-text-secondary)]'
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
