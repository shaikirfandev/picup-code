'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  fetchAffiliateSummary,
  fetchAffiliatePosts,
  fetchAffiliatePostStats,
  clearSelectedPostStats,
} from '@/store/slices/affiliateSlice';
import { formatNumber } from '@/lib/utils';
import {
  MousePointerClick,
  Users,
  TrendingUp,
  DollarSign,
  ShieldAlert,
  ArrowRight,
  BarChart3,
  ChevronLeft,
  ExternalLink,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export default function AffiliateDashboard() {
  const dispatch = useAppDispatch();
  const {
    summary,
    affiliatePosts,
    selectedPostStats,
    statsLoading,
    loading,
  } = useAppSelector((s) => s.affiliate);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    dispatch(fetchAffiliateSummary());
  }, [dispatch]);

  const handleViewPostStats = (postId: string) => {
    setSelectedPost(postId);
    dispatch(fetchAffiliatePostStats({ postId, period }));
  };

  const handleBack = () => {
    setSelectedPost(null);
    dispatch(clearSelectedPostStats());
  };

  // ── Per-Post Detail View ─────────────────────────────────────────────────
  if (selectedPost && selectedPostStats) {
    return (
      <div className="space-y-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <ChevronLeft className="w-4 h-4" /> Back to overview
        </button>

        <div className="card p-6">
          <h2 className="text-xl font-bold mb-1">{selectedPostStats.title}</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4 truncate">
            {selectedPostStats.productUrl}
          </p>

          {/* Period selector */}
          <div className="flex gap-2 mb-6">
            {['7d', '30d', '90d'].map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPeriod(p);
                  dispatch(fetchAffiliatePostStats({ postId: selectedPost, period: p }));
                }}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  period === p
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Clicks chart */}
          <div className="h-64 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedPostStats.clicksByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={false}
                  name="Clicks"
                />
                <Line
                  type="monotone"
                  dataKey="uniqueClicks"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="Unique"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Device */}
            <div className="bg-[var(--surface)] rounded-xl p-4">
              <h4 className="text-sm font-medium mb-3">Device Breakdown</h4>
              {Object.entries(selectedPostStats.deviceBreakdown).map(([device, count]) => (
                <div key={device} className="flex justify-between text-sm py-1">
                  <span className="capitalize">{device}</span>
                  <span className="font-medium">{count as number}</span>
                </div>
              ))}
            </div>
            {/* Geo */}
            <div className="bg-[var(--surface)] rounded-xl p-4">
              <h4 className="text-sm font-medium mb-3">Top Countries</h4>
              {selectedPostStats.geoBreakdown.slice(0, 5).map((g) => (
                <div key={g.country} className="flex justify-between text-sm py-1">
                  <span>{g.country}</span>
                  <span className="font-medium">{g.count}</span>
                </div>
              ))}
            </div>
            {/* Referrer */}
            <div className="bg-[var(--surface)] rounded-xl p-4">
              <h4 className="text-sm font-medium mb-3">Traffic Sources</h4>
              {selectedPostStats.referrerBreakdown.slice(0, 5).map((r) => (
                <div key={r.source} className="flex justify-between text-sm py-1">
                  <span className="capitalize">{r.source.replace('_', ' ')}</span>
                  <span className="font-medium">{r.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Per-link clicks */}
          {selectedPostStats.affiliateLinks?.length > 0 && (
            <div className="mt-6 bg-[var(--surface)] rounded-xl p-4">
              <h4 className="text-sm font-medium mb-3">Link Performance</h4>
              {selectedPostStats.affiliateLinks.map((link, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {link.label || `Link ${idx + 1}`}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {link.url}
                    </p>
                  </div>
                  <span className="text-sm font-bold ml-4">
                    {formatNumber(link.clicks)} clicks
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Loading state for per-post stats ─────────────────────────────────────
  if (selectedPost && statsLoading) {
    return (
      <div className="space-y-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="card p-12 text-center">
          <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[var(--text-muted)] mt-3">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // ── Overview Dashboard ───────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          {
            icon: MousePointerClick,
            label: 'Total Clicks',
            value: formatNumber(summary?.totalClicks || 0),
            color: 'text-blue-400',
          },
          {
            icon: Users,
            label: 'Unique Clicks',
            value: formatNumber(summary?.uniqueClicks || 0),
            color: 'text-green-400',
          },
          {
            icon: TrendingUp,
            label: 'Est. Conversions',
            value: formatNumber(summary?.conversionEstimate || 0),
            color: 'text-purple-400',
          },
          {
            icon: DollarSign,
            label: 'Est. Revenue',
            value: `$${(summary?.revenueEstimate || 0).toFixed(2)}`,
            color: 'text-amber-400',
          },
          {
            icon: ShieldAlert,
            label: 'Suspicious',
            value: formatNumber(summary?.suspiciousClicks || 0),
            color: 'text-red-400',
          },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card p-4">
            <Icon className={`w-5 h-5 ${color} mb-2`} />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-[var(--text-muted)]">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent Clicks Chart */}
      {summary?.recentClicks && summary.recentClicks.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Clicks (Last 7 Days)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.recentClicks}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="clicks" fill="var(--accent)" radius={[4, 4, 0, 0]} name="Clicks" />
                <Bar
                  dataKey="uniqueClicks"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  name="Unique"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Posts */}
      {summary?.topPosts && summary.topPosts.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Top Performing Pins</h3>
          <div className="space-y-2">
            {summary.topPosts.map((post) => (
              <div
                key={post._id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--surface)] transition-colors cursor-pointer"
                onClick={() => handleViewPostStats(post._id)}
              >
                {post.image?.url && (
                  <img
                    src={post.image.url}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{post.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {formatNumber(post.clicksCount)} clicks · {formatNumber(post.viewsCount)} views
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--text-muted)]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Affiliate Posts */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">All Affiliate Pins</h3>
          <Link
            href="/create"
            className="text-sm text-[var(--accent)] hover:underline flex items-center gap-1"
          >
            Create pin <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {affiliatePosts.length === 0 ? (
          <p className="text-center py-8 text-[var(--text-muted)]">
            No affiliate pins yet. Create a pin with product links to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {affiliatePosts.map((post) => (
              <div
                key={post._id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--surface)] transition-colors cursor-pointer"
                onClick={() => handleViewPostStats(post._id)}
              >
                {post.image?.url && (
                  <img
                    src={post.image.url}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{post.title}</p>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <span>{formatNumber(post.clicksCount)} clicks</span>
                    <span>·</span>
                    <span className="truncate">
                      {post.productUrl || post.affiliateLinks?.[0]?.url}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {post.affiliateLinks && post.affiliateLinks.length > 0 && (
                    <span className="text-xs bg-[var(--accent)]/10 text-[var(--accent)] px-1.5 py-0.5 rounded">
                      {post.affiliateLinks.length} link{post.affiliateLinks.length > 1 ? 's' : ''}
                    </span>
                  )}
                  <BarChart3 className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
