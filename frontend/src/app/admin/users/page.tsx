'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { adminAPI } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import type { ColDef, ICellRendererParams, GridReadyEvent } from 'ag-grid-community';
import { useEdithGridTheme } from '@/lib/agGridTheme';

ModuleRegistry.registerModules([AllCommunityModule]);

/* ── Cell Renderers ── */
function UserCellRenderer(params: ICellRendererParams) {
  const u = params.data;
  if (!u) return null;
  return (
    <div className="flex items-center gap-3 py-1">
      {u.avatar ? (
        <img src={u.avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-[var(--edith-accent-muted)] flex items-center justify-center text-sm font-bold text-[var(--edith-accent)] flex-shrink-0">
          {u.displayName?.[0]?.toUpperCase() || '?'}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium truncate leading-tight">{u.displayName}</p>
        <p className="text-[11px] text-[var(--edith-text-dim)] truncate leading-tight">@{u.username}</p>
      </div>
    </div>
  );
}

function StatusCellRenderer(params: ICellRendererParams) {
  const u = params.data;
  if (!u) return null;
  const isActive = u.isActive !== false;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
      isActive ? 'bg-green-500/15 dark:bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/15 dark:bg-red-500/10 text-red-600 dark:text-red-400'
    }`}>
      {isActive ? 'Active' : 'Banned'}
    </span>
  );
}

/* ── Inline action renderers ── */
let _handleBan: (userId: string, isBanned: boolean) => Promise<void>;
let _handleRoleChange: (userId: string, role: string) => Promise<void>;

function RoleCellRenderer(params: ICellRendererParams) {
  const u = params.data;
  if (!u) return null;
  return (
    <select
      value={u.role}
      onChange={(e) => _handleRoleChange(u._id, e.target.value)}
      className="text-xs px-2 py-1 rounded-lg outline-none cursor-pointer"
      style={{ background: 'var(--edith-surface)', border: '1px solid var(--edith-border)', color: 'var(--edith-text)' }}
    >
      <option value="user">User</option>
      <option value="moderator">Moderator</option>
      <option value="admin">Admin</option>
    </select>
  );
}

function ActionsCellRenderer(params: ICellRendererParams) {
  const u = params.data;
  if (!u) return null;
  const isBanned = u.isActive === false;
  return (
    <button
      onClick={() => _handleBan(u._id, isBanned)}
      className={`text-xs px-3 py-1 rounded-lg font-mono transition-colors ${
        isBanned ? 'bg-green-500/15 dark:bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20' : 'bg-red-500/15 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20'
      }`}
    >
      {isBanned ? 'Unban' : 'Ban'}
    </button>
  );
}

/* ── Main Page ── */
export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const gridRef = useRef<AgGridReact>(null);
  const edithTheme = useEdithGridTheme();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await adminAPI.getUsers({ page, search, limit: 20 } as any);
      setUsers(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch { /* silent */ }
    setIsLoading(false);
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleBan = useCallback(async (userId: string, isBanned: boolean) => {
    try {
      await adminAPI.updateUserStatus(userId, isBanned ? 'active' : 'banned');
      toast.success(isBanned ? 'User unbanned' : 'User banned');
      fetchUsers();
    } catch { toast.error('Failed'); }
  }, [fetchUsers]);

  const handleRoleChange = useCallback(async (userId: string, role: string) => {
    try {
      await adminAPI.updateUserRole(userId, role);
      toast.success('Role updated');
      fetchUsers();
    } catch { toast.error('Failed'); }
  }, [fetchUsers]);

  // Expose handlers to cell renderers
  _handleBan = handleBan;
  _handleRoleChange = handleRoleChange;

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
      minWidth: 200,
      sortable: false,
    },
    {
      headerName: 'Email',
      field: 'email',
      flex: 1.5,
      minWidth: 180,
      cellStyle: { color: 'var(--edith-text-dim)', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' } as any,
    },
    {
      headerName: 'Role',
      field: 'role',
      cellRenderer: RoleCellRenderer,
      width: 130,
      sortable: false,
    },
    {
      headerName: 'Posts',
      field: 'postsCount',
      width: 90,
      type: 'numericColumn',
      valueFormatter: (p) => String(p.value || 0),
    },
    {
      headerName: 'Joined',
      field: 'createdAt',
      width: 120,
      valueFormatter: (p) => p.value ? timeAgo(p.value) : '—',
    },
    {
      headerName: 'Status',
      field: 'isActive',
      cellRenderer: StatusCellRenderer,
      width: 100,
      sortable: false,
    },
    {
      headerName: '',
      field: '_id',
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

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--edith-text)' }}>Users</h1>
          <p style={{ color: 'var(--edith-text-muted)' }}>Manage platform users</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--edith-text-muted)' }} />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search users by name or email..."
          className="input-field pl-10"
        />
      </div>

      {/* AG Grid */}
      <div className="card overflow-hidden" style={{ height: isLoading ? 440 : Math.min(rowData.length * 52 + 56, 680) }}>
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-[var(--edith-accent-muted)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 rounded bg-[var(--edith-accent-muted)]" />
                  <div className="h-2 w-24 rounded bg-[var(--edith-accent-muted)]" />
                </div>
                <div className="h-3 w-16 rounded bg-[var(--edith-accent-muted)]" />
              </div>
            ))}
          </div>
        ) : (
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
            overlayNoRowsTemplate='<span style="color: var(--edith-text-muted)">No users found</span>'
          />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 px-4 py-2.5 rounded-lg"
          style={{ background: 'var(--edith-elevated)', border: '1px solid var(--edith-border)' }}
        >
          <p className="text-xs font-mono" style={{ color: 'var(--edith-text-muted)' }}>
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-ghost p-2 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn-ghost p-2 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
