'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { adminAPI } from '@/lib/api';
import { AnalyticsUser } from '@/types';
import { timeAgo } from '@/lib/utils';
import Link from 'next/link';
import {
  Users, Search, Download, ChevronLeft, ChevronRight,
  Filter, X, CheckCircle, Globe, Ban, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import type { ColDef, ICellRendererParams, GridReadyEvent } from 'ag-grid-community';
import { usePicupGridTheme } from '@/lib/agGridTheme';

ModuleRegistry.registerModules([AllCommunityModule]);

const STATUS_STYLES: Record<string, { cls: string }> = {
  active: { cls: 'bg-green-500/15 dark:bg-green-500/10 text-green-600 dark:text-green-400' },
  suspended: { cls: 'bg-amber-500/15 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  banned: { cls: 'bg-red-500/15 dark:bg-red-500/10 text-red-600 dark:text-red-400' },
};

const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-purple-500/15 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
  moderator: 'bg-blue-500/15 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
  user: '',
};

/* ── Cell Renderers ── */
function UserCellRenderer(params: ICellRendererParams) {
  const u = params.data as AnalyticsUser;
  if (!u) return null;
  const roleStyle = ROLE_STYLES[u.role] || '';
  return (
    <div className="flex items-center gap-3 py-1">
      {u.avatar ? (
        <img src={u.avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-[var(--accent-muted)] flex items-center justify-center text-xs font-bold text-[var(--accent)] flex-shrink-0">
          {u.displayName?.[0] || '?'}
        </div>
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium truncate leading-tight" style={{ color: 'var(--foreground)' }}>{u.displayName || u.username}</p>
          {u.isVerified && <CheckCircle className="w-3 h-3 text-blue-500 flex-shrink-0" />}
          {u.role !== 'user' && roleStyle && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${roleStyle}`}>{u.role}</span>
          )}
        </div>
        <p className="text-[10px] leading-tight" style={{ color: 'var(--text-tertiary)' }}>@{u.username}</p>
      </div>
    </div>
  );
}

function CountryCellRenderer(params: ICellRendererParams) {
  const u = params.data as AnalyticsUser;
  if (!u) return null;
  return (
    <div className="flex items-center gap-1.5">
      <Globe className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{u.lastLoginCountry || '—'}</span>
    </div>
  );
}

function StatusCellRenderer(params: ICellRendererParams) {
  const u = params.data as AnalyticsUser;
  if (!u) return null;
  const s = STATUS_STYLES[u.status] || STATUS_STYLES.active;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${s.cls}`}>
      {u.status}
    </span>
  );
}

/* ── Main Page ── */
export default function AnalyticsUsersPage() {
  const [users, setUsers] = useState<AnalyticsUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const gridRef = useRef<AgGridReact>(null);
  const picupTheme = usePicupGridTheme();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 25, sort: '-createdAt' };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      const { data } = await adminAPI.getAnalyticsUsers(params);
      setUsers(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load users');
    }
    setIsLoading(false);
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleExport = async () => {
    try {
      const response = await adminAPI.exportUsersCSV();
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('CSV exported successfully');
    } catch {
      toast.error('Export failed');
    }
  };

  const rowData = useMemo(() => {
    if (!users) return [];
    return users.map((u) => ({ ...u }));
  }, [users]);

  const columnDefs = useMemo<ColDef[]>(() => [
    {
      headerName: 'User',
      field: 'displayName',
      cellRenderer: UserCellRenderer,
      flex: 2,
      minWidth: 220,
      sortable: true,
    },
    {
      headerName: 'Email',
      field: 'email',
      flex: 1.5,
      minWidth: 180,
      cellStyle: { color: 'var(--text-secondary)', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' } as any,
    },
    {
      headerName: 'Country',
      field: 'lastLoginCountry',
      cellRenderer: CountryCellRenderer,
      width: 120,
      sortable: true,
    },
    {
      headerName: 'Last Login',
      field: 'lastLogin',
      width: 120,
      valueFormatter: (p) => p.value ? timeAgo(p.value) : 'Never',
      cellStyle: { color: 'var(--text-secondary)', fontSize: '12px' } as any,
      sortable: true,
    },
    {
      headerName: 'Logins',
      field: 'loginCount',
      width: 90,
      type: 'numericColumn',
      valueFormatter: (p) => (p.value || 0).toLocaleString(),
      sortable: true,
    },
    {
      headerName: 'Device',
      field: 'lastLoginDevice',
      width: 140,
      cellStyle: { color: 'var(--text-secondary)', fontSize: '11px' } as any,
      valueFormatter: (p) => p.value || '—',
    },
    {
      headerName: 'Status',
      field: 'status',
      cellRenderer: StatusCellRenderer,
      width: 100,
      sortable: false,
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

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/analytics" className="btn-ghost p-2 rounded-lg">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>User Management</h1>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {total.toLocaleString()} registered users
            </p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Search + Filter toggle */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search by name, email, username..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-10"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-ghost px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 ${showFilters ? 'bg-brand-500/10 text-brand-500' : ''}`}
        >
          <Filter className="w-4 h-4" /> Filters
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="card p-4 mb-4 flex flex-wrap items-center gap-4">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Role</label>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 rounded-lg text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            >
              <option value="">All</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="user">User</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 rounded-lg text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </div>
          <button
            onClick={() => { setRoleFilter(''); setStatusFilter(''); setSearch(''); setPage(1); }}
            className="text-xs text-brand-500 hover:underline mt-5"
          >
            Clear All
          </button>
        </div>
      )}

      {/* AG Grid */}
      <div className="card overflow-hidden" style={{ height: isLoading ? 520 : Math.min(rowData.length * 52 + 56, 680) }}>
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-[var(--accent-muted)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 rounded bg-[var(--accent-muted)]" style={{ width: `${40 + Math.random() * 60}%` }} />
                  <div className="h-2 w-24 rounded bg-[var(--accent-muted)]" />
                </div>
                <div className="h-3 w-16 rounded bg-[var(--accent-muted)]" />
              </div>
            ))}
          </div>
        ) : (
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
            overlayNoRowsTemplate='<span style="color: var(--text-tertiary)">No users found</span>'
          />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 px-4 py-2.5 rounded-lg"
          style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
            Page {page} of {totalPages} · {total.toLocaleString()} users
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-ghost p-1.5 rounded-lg disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              if (p > totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                    page === p ? 'bg-brand-600 text-white' : 'btn-ghost'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn-ghost p-1.5 rounded-lg disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
