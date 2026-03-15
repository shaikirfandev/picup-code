'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchAnalyticsOverview, fetchLoginStats } from '@/store/slices/analyticsSlice';
import { selectAnalyticsOverview, selectLoginStats } from '@/store/selectors';
import { AnalyticsOverview, AnalyticsLoginStats, TopUser, RecentActivity } from '@/types';
import { timeAgo } from '@/lib/utils';
import Link from 'next/link';
import {
  Users, FileImage, Eye, Heart, Bookmark, Flag, Sparkles, TrendingUp,
  Activity, Clock, Globe, Monitor, Smartphone, Tablet, BarChart3,
  ArrowUpRight, Crown, Zap, LogIn, UserCheck, CalendarDays,
  ChevronDown, RefreshCw, Download, Shield, Mail, Laptop,
} from 'lucide-react';

// ── Simple Line Chart (no external dependency) ──
function MiniLineChart({ data, height = 120, color = '#3b82f6' }: { data: number[]; height?: number; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 100;
  const h = height;
  const points = data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * w;
    const y = h - (v / max) * (h - 10) - 5;
    return `${x},${y}`;
  });
  const pathD = `M${points.join(' L')}`;
  const fillD = `${pathD} L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#grad-${color.replace('#', '')})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Bar chart for methods/devices ──
function HorizontalBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium w-16 text-right" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-bold w-12" style={{ color: 'var(--foreground)' }}>{value.toLocaleString()}</span>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const dispatch = useAppDispatch();
  const overview = useAppSelector(selectAnalyticsOverview);
  const loginStats = useAppSelector(selectLoginStats);
  const overviewLoading = useAppSelector((s) => s.analytics.overviewLoading);
  const loginStatsLoading = useAppSelector((s) => s.analytics.loginStatsLoading);

  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [activity, setActivity] = useState<RecentActivity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [topMetric, setTopMetric] = useState<'posts' | 'likes' | 'active' | 'engagement'>('engagement');
  const [chartDays, setChartDays] = useState(30);
  const [activityTab, setActivityTab] = useState<'logins' | 'posts' | 'reports' | 'ai'>('logins');

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      dispatch(fetchAnalyticsOverview({ force: true }));
      dispatch(fetchLoginStats({ days: chartDays }));
      const activityRes = await adminAPI.getRecentActivity({ limit: 10 });
      setActivity(activityRes.data.data);
    } catch { /* silent */ }
    setIsLoading(false);
  }, [chartDays, dispatch]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Fetch top users when metric changes
  useEffect(() => {
    adminAPI.getTopUsers({ metric: topMetric, limit: 10 })
      .then((r) => setTopUsers(r.data.data || []))
      .catch(() => {});
  }, [topMetric]);

  const handleExportCSV = async () => {
    try {
      const response = await adminAPI.exportUsersCSV();
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent */ }
  };

  // ── Stat cards config ──
  const statCards = overview
    ? [
        { label: 'Total Users', value: overview.totalUsers, icon: Users, gradient: 'from-blue-500 to-cyan-500' },
        { label: 'Total Posts', value: overview.totalPosts, icon: FileImage, gradient: 'from-purple-500 to-pink-500' },
        { label: 'Total Views', value: overview.totalViews, icon: Eye, gradient: 'from-amber-500 to-orange-500' },
        { label: 'Total Likes', value: overview.totalLikes, icon: Heart, gradient: 'from-red-500 to-rose-500' },
        { label: 'Total Saves', value: overview.totalSaves, icon: Bookmark, gradient: 'from-green-500 to-emerald-500' },
        { label: 'Active Reports', value: overview.activeReports, icon: Flag, gradient: 'from-yellow-500 to-amber-500' },
        { label: 'AI Generations', value: overview.totalAIGenerations, icon: Sparkles, gradient: 'from-violet-500 to-purple-500' },
        { label: 'New Today', value: overview.newUsersToday, icon: TrendingUp, gradient: 'from-teal-500 to-cyan-500' },
      ]
    : [];

  const loginMetrics = overview
    ? [
        { label: 'Active (24h)', value: overview.activeUsersLast24h, icon: UserCheck, color: 'text-green-500' },
        { label: 'Weekly Active', value: overview.weeklyActiveUsers, icon: CalendarDays, color: 'text-blue-500' },
        { label: 'Monthly Active', value: overview.monthlyActiveUsers, icon: Activity, color: 'text-purple-500' },
        { label: 'Logins Today', value: overview.todayLogins, icon: LogIn, color: 'text-amber-500' },
      ]
    : [];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10">
              <BarChart3 className="w-6 h-6 text-blue-500" />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Analytics Dashboard</h1>
          </div>
          <p className="text-sm ml-14" style={{ color: 'var(--text-tertiary)' }}>Platform metrics, login analytics & user insights</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="btn-ghost px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5" title="Export Users CSV">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={fetchAll} className="btn-ghost p-2 rounded-lg" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Link href="/admin/analytics/users" className="btn-ghost px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> User Table
          </Link>
        </div>
      </div>

      {/* Loading */}
      {isLoading && !overview ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-20 mb-3" />
                <div className="h-8 bg-surface-200 dark:bg-surface-700 rounded w-14" />
              </div>
            ))}
          </div>
          <div className="card p-6 animate-pulse">
            <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-40 mb-4" />
            <div className="h-40 bg-surface-200 dark:bg-surface-700 rounded" />
          </div>
        </div>
      ) : (
        <>
          {/* ═══ OVERVIEW STAT CARDS ═══ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(({ label, value, icon: Icon, gradient }) => (
              <div key={label} className="card p-5 hover:shadow-lg transition-shadow group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{(value || 0).toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* ═══ LOGIN METRICS ROW ═══ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {loginMetrics.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ background: 'var(--surface)' }}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{(value || 0).toLocaleString()}</p>
                  <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ═══ DAILY LOGIN CHART + BREAKDOWN ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="lg:col-span-2 card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Daily Logins</h2>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Last {chartDays} days</p>
                </div>
                <div className="flex gap-1">
                  {[7, 14, 30, 60].map((d) => (
                    <button
                      key={d}
                      onClick={() => setChartDays(d)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                        chartDays === d ? 'bg-brand-600 text-white' : 'btn-ghost'
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              {loginStats?.dailyStats && loginStats.dailyStats.length > 0 ? (
                <div>
                  <MiniLineChart
                    data={loginStats.dailyStats.map((d) => d.logins || 0)}
                    height={160}
                    color="#3b82f6"
                  />
                  {/* X-axis labels */}
                  <div className="flex justify-between mt-2 px-1">
                    {loginStats.dailyStats.filter((_, i) => i === 0 || i === loginStats.dailyStats.length - 1 || i === Math.floor(loginStats.dailyStats.length / 2)).map((d) => (
                      <span key={d.date} className="text-[9px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                        {d.date.slice(5)}
                      </span>
                    ))}
                  </div>
                  {/* Summary row */}
                  <div className="flex items-center gap-6 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Total Logins</p>
                      <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                        {loginStats.dailyStats.reduce((s, d) => s + (d.logins || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Avg/Day</p>
                      <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                        {loginStats.dailyStats.length > 0
                          ? Math.round(loginStats.dailyStats.reduce((s, d) => s + (d.logins || 0), 0) / loginStats.dailyStats.length)
                          : 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Peak Day</p>
                      <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                        {Math.max(...loginStats.dailyStats.map((d) => d.logins || 0))}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center">
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No login data yet</p>
                </div>
              )}
            </div>

            {/* Breakdown Sidebar */}
            <div className="space-y-4">
              {/* Login Methods */}
              <div className="card p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>
                  Login Methods
                </h3>
                {loginStats?.loginsByMethod && (
                  <div className="space-y-2.5">
                    {(() => {
                      const m = loginStats.loginsByMethod;
                      const maxVal = Math.max(m.email || 0, m.google || 0, m.github || 0, 1);
                      return (
                        <>
                          <HorizontalBar label="Email" value={m.email || 0} max={maxVal} color="#3b82f6" />
                          <HorizontalBar label="Google" value={m.google || 0} max={maxVal} color="#ef4444" />
                          <HorizontalBar label="GitHub" value={m.github || 0} max={maxVal} color="#8b5cf6" />
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Top Countries */}
              <div className="card p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>
                  <Globe className="w-3 h-3 inline mr-1" /> Top Countries
                </h3>
                {loginStats?.topCountries && loginStats.topCountries.length > 0 ? (
                  <div className="space-y-2">
                    {loginStats.topCountries.slice(0, 6).map((c, i) => (
                      <div key={c.country} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-4 text-center font-bold" style={{ color: 'var(--text-tertiary)' }}>{i + 1}</span>
                          <span style={{ color: 'var(--foreground)' }}>{c.country || 'Unknown'}</span>
                        </div>
                        <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>{c.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-center py-3" style={{ color: 'var(--text-tertiary)' }}>No geo data yet</p>
                )}
              </div>
            </div>
          </div>

          {/* ═══ RECENT ACTIVITY + TOP USERS ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                  <Activity className="w-5 h-5 text-brand-500" /> Recent Activity
                </h2>
              </div>
              {/* Tabs */}
              <div className="flex gap-1 mb-4">
                {(['logins', 'posts', 'reports', 'ai'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActivityTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                      activityTab === tab ? 'bg-brand-600 text-white' : 'btn-ghost'
                    }`}
                  >
                    {tab === 'ai' ? 'AI' : tab}
                  </button>
                ))}
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {activityTab === 'logins' && activity?.recentLogins?.map((l) => (
                  <div key={l._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    {l.user?.avatar ? (
                      <img src={l.user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-xs font-bold text-blue-500">
                        {l.user?.displayName?.[0] || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                        {l.user?.displayName || l.user?.username}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                        {l.browser} · {l.os} · {l.country || 'Unknown'} · {l.method}
                      </p>
                    </div>
                    <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>{timeAgo(l.createdAt)}</span>
                  </div>
                ))}

                {activityTab === 'posts' && activity?.recentPosts?.map((p) => (
                  <div key={p._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    {p.image?.url ? (
                      <img src={p.image.url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <FileImage className="w-4 h-4 text-purple-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{p.title}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                        by {p.author?.displayName} · {p.viewsCount} views · {p.likesCount} likes
                      </p>
                    </div>
                    <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>{timeAgo(p.createdAt)}</span>
                  </div>
                ))}

                {activityTab === 'reports' && activity?.recentReports?.map((r) => (
                  <div key={r._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                      r.priority === 'critical' ? 'bg-red-500/10 text-red-500'
                        : r.priority === 'high' ? 'bg-orange-500/10 text-orange-500'
                        : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      <Flag className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                        {r.post?.title || r.blogPost?.title || 'Unknown content'}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                        by {r.reporter?.displayName} · {r.reason} · <span className="capitalize">{r.status}</span>
                      </p>
                    </div>
                    <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>{timeAgo(r.createdAt)}</span>
                  </div>
                ))}

                {activityTab === 'ai' && activity?.recentAI?.map((a) => (
                  <div key={a._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                        {a.prompt?.slice(0, 60)}{a.prompt?.length > 60 ? '...' : ''}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                        by {a.user?.displayName} · {a.style} · <span className="capitalize">{a.status}</span>
                      </p>
                    </div>
                    <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>{timeAgo(a.createdAt)}</span>
                  </div>
                ))}

                {/* Empty state */}
                {activityTab === 'logins' && (!activity?.recentLogins || activity.recentLogins.length === 0) && (
                  <p className="text-sm text-center py-6" style={{ color: 'var(--text-tertiary)' }}>No recent logins</p>
                )}
                {activityTab === 'posts' && (!activity?.recentPosts || activity.recentPosts.length === 0) && (
                  <p className="text-sm text-center py-6" style={{ color: 'var(--text-tertiary)' }}>No recent posts</p>
                )}
                {activityTab === 'reports' && (!activity?.recentReports || activity.recentReports.length === 0) && (
                  <p className="text-sm text-center py-6" style={{ color: 'var(--text-tertiary)' }}>No recent reports</p>
                )}
                {activityTab === 'ai' && (!activity?.recentAI || activity.recentAI.length === 0) && (
                  <p className="text-sm text-center py-6" style={{ color: 'var(--text-tertiary)' }}>No recent AI generations</p>
                )}
              </div>
            </div>

            {/* Top Users */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                  <Crown className="w-5 h-5 text-amber-500" /> Top Users
                </h2>
              </div>
              {/* Metric tabs */}
              <div className="flex gap-1 mb-4">
                {([
                  { key: 'engagement', label: 'Engagement' },
                  { key: 'posts', label: 'Posts' },
                  { key: 'likes', label: 'Likes' },
                  { key: 'active', label: 'Active' },
                ] as const).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setTopMetric(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      topMetric === key ? 'bg-brand-600 text-white' : 'btn-ghost'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {topUsers.map((u, i) => {
                  const rankColors = ['text-amber-500', 'text-gray-400', 'text-orange-600'];
                  return (
                    <div key={u._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i < 3 ? rankColors[i] : ''
                      }`} style={i >= 3 ? { color: 'var(--text-tertiary)' } : {}}>
                        {i < 3 ? <Crown className="w-3.5 h-3.5" /> : i + 1}
                      </span>
                      {u.avatar ? (
                        <img src={u.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-brand-500/10 flex items-center justify-center text-xs font-bold text-brand-500">
                          {u.displayName?.[0] || '?'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{u.displayName}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>@{u.username}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                          {topMetric === 'posts' && (u.postsCount || 0)}
                          {topMetric === 'likes' && (u.totalLikes || 0)}
                          {topMetric === 'active' && (u.loginCount || 0)}
                          {topMetric === 'engagement' && (u.engagementScore || 0).toLocaleString()}
                        </p>
                        <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                          {topMetric === 'posts' && 'posts'}
                          {topMetric === 'likes' && 'likes'}
                          {topMetric === 'active' && 'logins'}
                          {topMetric === 'engagement' && 'score'}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {topUsers.length === 0 && (
                  <p className="text-sm text-center py-6" style={{ color: 'var(--text-tertiary)' }}>No data yet</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
