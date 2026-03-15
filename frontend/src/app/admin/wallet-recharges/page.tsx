'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminWalletAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  Wallet, ArrowUpCircle, TrendingUp, Users, Search,
  ChevronLeft, ChevronRight, DollarSign, Filter,
  BarChart3, RefreshCw,
} from 'lucide-react';
import type { AdminRecharge, RechargeStats } from '@/types';

export default function AdminWalletRechargesPage() {
  const [recharges, setRecharges] = useState<AdminRecharge[]>([]);
  const [stats, setStats] = useState<RechargeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('');
  const [tab, setTab] = useState<'recharges' | 'stats'>('recharges');

  const fetchRecharges = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (search) params.search = search;
      if (source) params.source = source;
      const { data } = await adminWalletAPI.getAllRecharges(params as any);
      setRecharges(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch {
      toast.error('Failed to load recharges');
    } finally {
      setLoading(false);
    }
  }, [page, search, source]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await adminWalletAPI.getRechargeStats({ days: 30 });
      setStats(data.data || null);
    } catch {
      toast.error('Failed to load stats');
    }
  }, []);

  useEffect(() => {
    fetchRecharges();
  }, [fetchRecharges]);

  useEffect(() => {
    if (tab === 'stats' && !stats) fetchStats();
  }, [tab, stats, fetchStats]);

  const sourceOptions = [
    { value: '', label: 'All Sources' },
    { value: 'manual_purchase', label: 'Manual Purchase' },
    { value: 'wallet_topup', label: 'Wallet Top-up' },
    { value: 'admin_grant', label: 'Admin Grant' },
    { value: 'monthly_free', label: 'Monthly Free' },
    { value: 'subscription', label: 'Subscription' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Wallet className="w-6 h-6 text-brand-500" /> Wallet Recharges
          </h1>
          <p className="text-sm text-surface-500 mt-1">View all user wallet recharges and top-ups</p>
        </div>
        <button onClick={() => { fetchRecharges(); fetchStats(); }} className="btn-secondary gap-2 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('recharges')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'recharges' ? 'bg-brand-500 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'}`}
        >
          All Recharges
        </button>
        <button
          onClick={() => setTab('stats')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'stats' ? 'bg-brand-500 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'}`}
        >
          <BarChart3 className="w-4 h-4 inline mr-1" /> Statistics
        </button>
      </div>

      {tab === 'recharges' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                placeholder="Search by username or email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none"
              />
            </div>
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <select
                value={source}
                onChange={(e) => { setSource(e.target.value); setPage(1); }}
                className="pl-10 pr-8 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm appearance-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none"
              >
                {sourceOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Recharges Table */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-surface-100 dark:bg-surface-800 animate-pulse" />)}
            </div>
          ) : recharges.length === 0 ? (
            <div className="text-center py-16">
              <Wallet className="w-10 h-10 text-surface-300 mx-auto mb-3" />
              <p className="text-sm text-surface-500">No recharges found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-700">
                    <th className="text-left py-3 px-4 font-medium text-surface-500">User</th>
                    <th className="text-left py-3 px-4 font-medium text-surface-500">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-surface-500">Source</th>
                    <th className="text-right py-3 px-4 font-medium text-surface-500">Amount</th>
                    <th className="text-right py-3 px-4 font-medium text-surface-500">Balance After</th>
                    <th className="text-left py-3 px-4 font-medium text-surface-500">Description</th>
                    <th className="text-right py-3 px-4 font-medium text-surface-500">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recharges.map((r) => (
                    <tr key={r._id} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {r.user?.avatar ? (
                            <img src={r.user.avatar} alt="" className="w-7 h-7 rounded-full" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-xs font-bold text-brand-600">
                              {r.user?.username?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm">{r.user?.displayName || r.user?.username || 'Unknown'}</p>
                            <p className="text-xs text-surface-400">{r.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${r.type === 'purchase' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'}`}>
                          {r.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-surface-600 dark:text-surface-400">{r.source?.replace(/_/g, ' ')}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-green-600 dark:text-green-400">+{r.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono text-surface-500">{r.balanceAfter.toLocaleString()}</td>
                      <td className="py-3 px-4 text-surface-500 max-w-[200px] truncate">{r.description || '—'}</td>
                      <td className="py-3 px-4 text-right text-surface-400 text-xs whitespace-nowrap">
                        {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-surface-100 dark:bg-surface-800 disabled:opacity-30 hover:bg-surface-200 dark:hover:bg-surface-700 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-surface-500">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg bg-surface-100 dark:bg-surface-800 disabled:opacity-30 hover:bg-surface-200 dark:hover:bg-surface-700 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {tab === 'stats' && stats && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-surface-900 rounded-2xl p-5 border border-surface-200 dark:border-surface-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/30">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs font-medium text-surface-500 uppercase tracking-wider">Total Recharged</span>
              </div>
              <p className="text-2xl font-bold">{stats.summary.totalAmount.toLocaleString()}</p>
              <p className="text-xs text-surface-400 mt-1">credits in {stats.period}</p>
            </div>
            <div className="bg-white dark:bg-surface-900 rounded-2xl p-5 border border-surface-200 dark:border-surface-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <ArrowUpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs font-medium text-surface-500 uppercase tracking-wider">Total Transactions</span>
              </div>
              <p className="text-2xl font-bold">{stats.summary.totalCount.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-surface-900 rounded-2xl p-5 border border-surface-200 dark:border-surface-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                  <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-xs font-medium text-surface-500 uppercase tracking-wider">Unique Users</span>
              </div>
              <p className="text-2xl font-bold">{stats.summary.uniqueUserCount}</p>
            </div>
            <div className="bg-white dark:bg-surface-900 rounded-2xl p-5 border border-surface-200 dark:border-surface-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                  <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-xs font-medium text-surface-500 uppercase tracking-wider">Avg Recharge</span>
              </div>
              <p className="text-2xl font-bold">{Math.round(stats.summary.avgAmount).toLocaleString()}</p>
            </div>
          </div>

          {/* Top Rechargers */}
          <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 border border-surface-200 dark:border-surface-800">
            <h3 className="text-sm font-semibold mb-4">Top Rechargers ({stats.period})</h3>
            {stats.topRechargers.length === 0 ? (
              <p className="text-sm text-surface-400 text-center py-4">No recharges in this period</p>
            ) : (
              <div className="space-y-3">
                {stats.topRechargers.map((r, i) => (
                  <div key={r.user._id} className="flex items-center gap-4 p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                    <span className="text-lg font-bold text-surface-300 w-6 text-center">#{i + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{r.user.displayName || r.user.username}</p>
                      <p className="text-xs text-surface-400">{r.user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 dark:text-green-400">{r.totalRecharged.toLocaleString()} credits</p>
                      <p className="text-xs text-surface-400">{r.rechargeCount} recharges</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* By Source */}
          <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 border border-surface-200 dark:border-surface-800">
            <h3 className="text-sm font-semibold mb-4">Recharges by Source</h3>
            <div className="space-y-2">
              {stats.bySource.map((s) => {
                const pct = stats.summary.totalAmount > 0 ? (s.totalAmount / stats.summary.totalAmount) * 100 : 0;
                return (
                  <div key={s._id} className="flex items-center gap-3">
                    <span className="text-xs text-surface-500 w-32 capitalize">{s._id.replace(/_/g, ' ')}</span>
                    <div className="flex-1 h-4 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-mono text-surface-500 w-24 text-right">{s.totalAmount.toLocaleString()} ({s.count})</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Chart (simple bar representation) */}
          <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 border border-surface-200 dark:border-surface-800">
            <h3 className="text-sm font-semibold mb-4">Daily Recharges</h3>
            {stats.dailyRecharges.length === 0 ? (
              <p className="text-sm text-surface-400 text-center py-4">No data</p>
            ) : (
              <div className="flex items-end gap-1 h-40">
                {stats.dailyRecharges.map((d) => {
                  const maxAmt = Math.max(...stats.dailyRecharges.map((dd) => dd.totalAmount));
                  const hPct = maxAmt > 0 ? (d.totalAmount / maxAmt) * 100 : 0;
                  return (
                    <div key={d._id} className="flex-1 flex flex-col items-center gap-1" title={`${d._id}: ${d.totalAmount} credits (${d.count} txns)`}>
                      <div className="w-full bg-brand-500/80 rounded-t" style={{ height: `${Math.max(hPct, 2)}%` }} />
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex justify-between text-[10px] text-surface-400 mt-1">
              <span>{stats.dailyRecharges[0]?._id}</span>
              <span>{stats.dailyRecharges[stats.dailyRecharges.length - 1]?._id}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
