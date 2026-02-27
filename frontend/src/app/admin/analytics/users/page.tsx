'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '@/lib/api';
import { AnalyticsUser } from '@/types';
import { timeAgo } from '@/lib/utils';
import Link from 'next/link';
import {
  Users, Search, Download, ChevronLeft, ChevronRight, ArrowUpDown,
  Shield, Mail, Globe, Monitor, Clock, Filter, X, CheckCircle,
  AlertTriangle, Ban, BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
  active: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', icon: CheckCircle },
  suspended: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', icon: AlertTriangle },
  banned: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', icon: Ban },
};

const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  moderator: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  user: 'bg-surface-100 dark:bg-surface-800 text-surface-500',
};

export default function AnalyticsUsersPage() {
  const [users, setUsers] = useState<AnalyticsUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('-createdAt');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 25, sort: sortField };
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
  }, [page, sortField, search, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortField(`-${field}`);
    } else if (sortField === `-${field}`) {
      setSortField(field);
    } else {
      setSortField(`-${field}`);
    }
    setPage(1);
  };

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

  const SortButton = ({ field, label }: { field: string; label: string }) => {
    const isActive = sortField === field || sortField === `-${field}`;
    const isDesc = sortField === `-${field}`;
    return (
      <button
        onClick={() => handleSort(field)}
        className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-brand-500' : ''}`}
        style={!isActive ? { color: 'var(--edith-text-muted)' } : {}}
      >
        {label}
        <ArrowUpDown className={`w-3 h-3 ${isActive ? 'opacity-100' : 'opacity-40'} ${isDesc ? 'rotate-180' : ''}`} />
      </button>
    );
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/analytics" className="btn-ghost p-2 rounded-lg">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--edith-text)' }}>User Management</h1>
            <p className="text-sm" style={{ color: 'var(--edith-text-muted)' }}>
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

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--edith-text-muted)' }} />
          <input
            type="text"
            placeholder="Search by name, email, username..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm"
            style={{ background: 'var(--edith-surface)', border: '1px solid var(--edith-border)', color: 'var(--edith-text)' }}
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
        <div className="card p-4 mb-6 flex flex-wrap items-center gap-4">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--edith-text-dim)' }}>Role</label>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 rounded-lg text-sm"
              style={{ background: 'var(--edith-surface)', border: '1px solid var(--edith-border)', color: 'var(--edith-text)' }}
            >
              <option value="">All</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="user">User</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--edith-text-dim)' }}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 rounded-lg text-sm"
              style={{ background: 'var(--edith-surface)', border: '1px solid var(--edith-border)', color: 'var(--edith-text)' }}
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

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--edith-border)' }}>
                <th className="text-left px-4 py-3"><SortButton field="displayName" label="User" /></th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--edith-text-muted)' }}>Email</span>
                </th>
                <th className="text-left px-4 py-3 hidden md:table-cell"><SortButton field="lastLoginCountry" label="Country" /></th>
                <th className="text-left px-4 py-3"><SortButton field="lastLogin" label="Last Login" /></th>
                <th className="text-left px-4 py-3"><SortButton field="loginCount" label="Logins" /></th>
                <th className="text-left px-4 py-3 hidden md:table-cell">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--edith-text-muted)' }}>Device</span>
                </th>
                <th className="text-left px-4 py-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--edith-text-muted)' }}>Status</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--edith-border)' }}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded animate-pulse" style={{ width: `${40 + Math.random() * 60}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : users.map((u) => {
                    const statusStyle = STATUS_STYLES[u.status] || STATUS_STYLES.active;
                    const roleStyle = ROLE_STYLES[u.role] || ROLE_STYLES.user;

                    return (
                      <tr key={u._id} className="hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors" style={{ borderBottom: '1px solid var(--edith-border)' }}>
                        {/* User */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {u.avatar ? (
                              <img src={u.avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-brand-500/10 flex items-center justify-center text-xs font-bold text-brand-500 flex-shrink-0">
                                {u.displayName?.[0] || '?'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium truncate" style={{ color: 'var(--edith-text)' }}>{u.displayName || u.username}</p>
                                {u.isVerified && <CheckCircle className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                                {u.role !== 'user' && (
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${roleStyle}`}>{u.role}</span>
                                )}
                              </div>
                              <p className="text-[10px]" style={{ color: 'var(--edith-text-muted)' }}>@{u.username}</p>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <p className="text-xs font-mono truncate max-w-[200px]" style={{ color: 'var(--edith-text-dim)' }}>{u.email}</p>
                        </td>

                        {/* Country */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Globe className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--edith-text-muted)' }} />
                            <span className="text-xs" style={{ color: 'var(--edith-text-dim)' }}>{u.lastLoginCountry || '—'}</span>
                          </div>
                        </td>

                        {/* Last Login */}
                        <td className="px-4 py-3">
                          <span className="text-xs" style={{ color: 'var(--edith-text-dim)' }}>
                            {u.lastLogin ? timeAgo(u.lastLogin) : 'Never'}
                          </span>
                        </td>

                        {/* Login Count */}
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold" style={{ color: 'var(--edith-text)' }}>
                            {(u.loginCount || 0).toLocaleString()}
                          </span>
                        </td>

                        {/* Device */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-xs truncate max-w-[140px]" style={{ color: 'var(--edith-text-dim)' }}>
                            {u.lastLoginDevice || '—'}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${statusStyle.bg} ${statusStyle.text}`}>
                            {u.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

              {!isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--edith-text-muted)', opacity: 0.3 }} />
                    <p className="text-sm" style={{ color: 'var(--edith-text-dim)' }}>No users found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--edith-border)' }}>
            <p className="text-xs" style={{ color: 'var(--edith-text-muted)' }}>
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
              {/* Page numbers */}
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
    </div>
  );
}
