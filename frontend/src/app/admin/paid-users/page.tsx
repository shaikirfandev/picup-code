'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { adminAPI } from '@/lib/api';
import { formatNumber, timeAgo } from '@/lib/utils';
import {
  Search, ChevronLeft, ChevronRight, DollarSign, Users,
  CreditCard, TrendingUp, Wallet, Filter, X,
  Crown,
} from 'lucide-react';
import Link from 'next/link';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import type { ColDef, ICellRendererParams, GridReadyEvent } from 'ag-grid-community';
import { usePicupGridTheme } from '@/lib/agGridTheme';

ModuleRegistry.registerModules([AllCommunityModule]);

/* ── Types ── */
interface PaidUser {
  _id: string;
  user: {
    _id: string;
    username: string;
    email: string;
    displayName: string;
    avatar: string;
    role: string;
    status: string;
    accountType: string;
    subscription?: { plan: string; isActive: boolean; endDate?: string };
    createdAt: string;
    lastLogin?: string;
    postsCount?: number;
  };
  totalSpent: number;
  paymentCount: number;
  lastPaymentAt: string;
  firstPaymentAt: string;
  currencies: string[];
  paymentTypes: string[];
  avgPayment: number;
  walletBalance: number;
  walletCredits: number;
  walletDebits: number;
}

interface Summary {
  totalRevenue: number;
  totalTransactions: number;
  uniquePayerCount: number;
  avgTransaction: number;
}

/* ── Cell Renderers ── */
function UserCellRenderer(params: ICellRendererParams) {
  const item = params.data as PaidUser;
  if (!item) return null;
  const u = item.user;
  return (
    <Link href={`/profile/${u.username}`} className="flex items-center gap-3 py-1 group">
      {u.avatar ? (
        <img src={u.avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-[var(--accent-muted)] flex items-center justify-center text-sm font-bold text-[var(--accent)] flex-shrink-0">
          {u.displayName?.[0]?.toUpperCase() || '?'}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium truncate leading-tight group-hover:text-[var(--accent)] transition-colors">
          {u.displayName}
          {u.accountType === 'paid' && <Crown className="w-3 h-3 text-amber-500 dark:text-amber-400 inline ml-1 -mt-0.5" />}
        </p>
        <p className="text-[11px] text-[var(--text-secondary)] truncate leading-tight">@{u.username}</p>
      </div>
    </Link>
  );
}

function SpentCellRenderer(params: ICellRendererParams) {
  const item = params.data as PaidUser;
  if (!item) return null;
  return (
    <div>
      <span className="text-sm font-bold text-green-600 dark:text-green-400">
        ${item.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">avg ${item.avgPayment.toFixed(2)}</p>
    </div>
  );
}

function PaymentsCellRenderer(params: ICellRendererParams) {
  const item = params.data as PaidUser;
  if (!item) return null;
  return (
    <div>
      <span className="text-sm font-medium">{item.paymentCount}</span>
      <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{item.currencies.join(', ')}</p>
    </div>
  );
}

function WalletCellRenderer(params: ICellRendererParams) {
  const item = params.data as PaidUser;
  if (!item) return null;
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <Wallet className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
        <span className="text-sm font-medium">${item.walletBalance.toFixed(2)}</span>
      </div>
      <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
        +{item.walletCredits.toFixed(0)} / -{item.walletDebits.toFixed(0)}
      </p>
    </div>
  );
}

function TypesCellRenderer(params: ICellRendererParams) {
  const item = params.data as PaidUser;
  if (!item) return null;
  const paymentTypeLabel = (t: string) => ({ ad_payment: 'Ads', subscription: 'Sub', wallet_topup: 'Top-up', refund: 'Refund' }[t] || t);
  const paymentTypeBadgeColor = (t: string) => ({
    ad_payment: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
    subscription: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',
    wallet_topup: 'bg-green-500/20 text-green-600 dark:text-green-400',
    refund: 'bg-red-500/20 text-red-600 dark:text-red-400',
  }[t] || 'bg-[var(--accent-muted)] text-[var(--text-secondary)]');
  return (
    <div className="flex flex-wrap gap-1">
      {item.paymentTypes.map((t) => (
        <span key={t} className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono ${paymentTypeBadgeColor(t)}`}>
          {paymentTypeLabel(t)}
        </span>
      ))}
    </div>
  );
}

function StatusCellRenderer(params: ICellRendererParams) {
  const item = params.data as PaidUser;
  if (!item) return null;
  const u = item.user;
  const color = u.status === 'active'
    ? 'bg-green-500/15 dark:bg-green-500/10 text-green-600 dark:text-green-400'
    : u.status === 'suspended'
    ? 'bg-amber-500/15 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
    : 'bg-red-500/15 dark:bg-red-500/10 text-red-600 dark:text-red-400';
  return (
    <div>
      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${color}`}>
        {u.status}
      </span>
      {u.subscription?.isActive && (
        <span className="block text-[9px] text-cyan-600 dark:text-cyan-400 mt-0.5">{u.subscription.plan}</span>
      )}
    </div>
  );
}

/* ── Main Page ── */
export default function PaidUsersPage() {
  const [users, setUsers] = useState<PaidUser[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const gridRef = useRef<AgGridReact>(null);
  const picupTheme = usePicupGridTheme();

  const fetchPaidUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 20, sort: 'totalSpent', order: 'desc' };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      const { data } = await adminAPI.getPaidUsers(params);
      setUsers(data.data || []);
      setSummary(data.pagination?.summary || null);
      setTotalPages(data.pagination?.pages || 1);
      setTotal(data.pagination?.total || 0);
    } catch { /* silent */ }
    setIsLoading(false);
  }, [page, search, typeFilter]);

  useEffect(() => { fetchPaidUsers(); }, [fetchPaidUsers]);

  const rowData = useMemo(() => {
    if (!users) return [];
    return users.map((u) => ({ ...u, user: { ...u.user } }));
  }, [users]);

  const columnDefs = useMemo<ColDef[]>(() => [
    {
      headerName: 'User',
      field: 'user.displayName',
      cellRenderer: UserCellRenderer,
      flex: 2,
      minWidth: 200,
      sortable: false,
      filter: false,
    },
    {
      headerName: 'Total Spent',
      field: 'totalSpent',
      cellRenderer: SpentCellRenderer,
      width: 140,
      sort: 'desc',
    },
    {
      headerName: 'Payments',
      field: 'paymentCount',
      cellRenderer: PaymentsCellRenderer,
      width: 110,
    },
    {
      headerName: 'Wallet',
      field: 'walletBalance',
      cellRenderer: WalletCellRenderer,
      width: 130,
    },
    {
      headerName: 'Types',
      field: 'paymentTypes',
      cellRenderer: TypesCellRenderer,
      width: 140,
      sortable: false,
    },
    {
      headerName: 'Last Payment',
      field: 'lastPaymentAt',
      width: 120,
      valueFormatter: (p) => p.value ? timeAgo(p.value) : '—',
    },
    {
      headerName: 'Joined',
      field: 'user.createdAt',
      width: 110,
      valueFormatter: (p) => p.value ? timeAgo(p.value) : '—',
    },
    {
      headerName: 'Status',
      field: 'user.status',
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

  const paymentTypeLabel = (t: string) => ({ '': 'All', wallet_topup: 'Top-up', ad_payment: 'Ads', subscription: 'Sub' }[t] || t);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <Crown className="w-6 h-6 text-amber-500 dark:text-amber-400" />
            Paid Users
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-tertiary)' }}>Users with completed payments &amp; transactions</p>
        </div>
        <span className="text-sm font-mono" style={{ color: 'var(--text-tertiary)' }}>
          {total} paid user{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Revenue', value: `$${summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign, gradient: 'from-green-500 to-emerald-500' },
            { label: 'Unique Payers', value: formatNumber(summary.uniquePayerCount), icon: Users, gradient: 'from-blue-500 to-cyan-500' },
            { label: 'Total Transactions', value: formatNumber(summary.totalTransactions), icon: CreditCard, gradient: 'from-purple-500 to-pink-500' },
            { label: 'Avg Transaction', value: `$${summary.avgTransaction.toFixed(2)}`, icon: TrendingUp, gradient: 'from-amber-500 to-orange-500' },
          ].map(({ label, value, icon: Icon, gradient }) => (
            <div key={label} className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email, or username..."
            className="input-field pl-10"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-ghost p-2.5 ${showFilters ? 'text-[var(--accent)]' : ''}`}
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="card p-4 mb-4 flex flex-wrap items-center gap-3">
          <span className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>Payment Type:</span>
          {['', 'wallet_topup', 'ad_payment', 'subscription'].map((t) => (
            <button
              key={t}
              onClick={() => { setTypeFilter(t); setPage(1); }}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                typeFilter === t
                  ? 'bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent)]'
                  : ''
              }`}
              style={typeFilter !== t ? { color: 'var(--text-tertiary)', background: 'var(--surface)', border: '1px solid var(--border)' } : {}}
            >
              {paymentTypeLabel(t)}
            </button>
          ))}
          {(typeFilter || search) && (
            <button
              onClick={() => { setTypeFilter(''); setSearch(''); setPage(1); }}
              className="ml-auto text-xs flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      )}

      {/* AG Grid Table */}
      <div className="card overflow-hidden" style={{ height: isLoading ? 480 : Math.min(rowData.length * 60 + 56, 680) }}>
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-[var(--accent-muted)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 rounded bg-[var(--accent-muted)]" />
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
            rowHeight={60}
            headerHeight={44}
            animateRows={true}
            suppressCellFocus={true}
            onGridReady={onGridReady}
            overlayNoRowsTemplate={`<span style="color: var(--text-tertiary)">${search || typeFilter ? 'No paid users match your filters' : 'No paid users yet'}</span>`}
          />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 px-4 py-2.5 rounded-lg"
          style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
            Page {page} of {totalPages} · {total} paid users
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
