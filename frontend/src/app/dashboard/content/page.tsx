'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store';
import {
  fetchContentPerformance, fetchEngagementTrends, fetchPerformanceHeatmap, setPeriod,
} from '@/store/slices/creatorDashboardSlice';
import {
  Eye, Heart, MessageCircle, Share2, Bookmark, TrendingUp, ArrowUpDown,
  Search, Filter, BarChart3, ChevronLeft, ChevronRight, Flame,
} from 'lucide-react';

const periods = [
  { label: 'Today', value: 'today' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
];

const sortOptions = [
  { label: 'Views', value: 'totalViews' },
  { label: 'Likes', value: 'totalLikes' },
  { label: 'Comments', value: 'totalComments' },
  { label: 'Engagement', value: 'engagementRate' },
  { label: 'Score', value: 'performanceScore' },
];

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const tierColors: Record<string, string> = {
  'mega-viral': '#f59e0b',
  viral: '#f97316',
  good: '#10b981',
  average: '#3b82f6',
  low: '#6b7280',
};

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export default function ContentAnalyticsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    contentPerformance, contentPerformanceLoading,
    engagementTrends, engagementTrendsLoading,
    heatmap, heatmapLoading, period,
  } = useSelector((state: RootState) => state.creatorDashboard);

  const [sortBy, setSortBy] = useState('totalViews');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<'table' | 'heatmap' | 'trends'>('table');

  const loadData = useCallback(() => {
    dispatch(fetchContentPerformance({ page, sortBy, sortOrder, search, mediaType, period }));
    dispatch(fetchEngagementTrends({ period }));
    dispatch(fetchPerformanceHeatmap({ period }));
  }, [dispatch, page, sortBy, sortOrder, search, mediaType, period]);

  useEffect(() => { loadData(); }, [loadData]);

  const handlePeriodChange = (p: string) => {
    dispatch(setPeriod(p));
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const totals = contentPerformance?.totals;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Content Analytics</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Track and analyze your content performance across all posts.
          </p>
        </div>
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border-primary)' }}>
          {periods.map((p) => (
            <button key={p.value} onClick={() => handlePeriodChange(p.value)}
              className="px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                background: period === p.value ? 'var(--accent-primary)' : 'var(--bg-surface)',
                color: period === p.value ? 'var(--bg-primary)' : 'var(--text-secondary)',
              }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Aggregate Stats */}
      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Views', value: totals.totalViews, icon: Eye, color: '#3b82f6' },
            { label: 'Total Likes', value: totals.totalLikes, icon: Heart, color: '#ef4444' },
            { label: 'Total Comments', value: totals.totalComments, icon: MessageCircle, color: '#8b5cf6' },
            { label: 'Total Shares', value: totals.totalShares, icon: Share2, color: '#06b6d4' },
            { label: 'Avg Engagement', value: `${(totals.avgEngagement || 0).toFixed(1)}%`, icon: TrendingUp, color: '#10b981' },
          ].map((stat, i) => (
            <div key={i} className="rounded-xl p-3 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</span>
              </div>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {typeof stat.value === 'number' ? formatNum(stat.value) : stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-2 border-b pb-2" style={{ borderColor: 'var(--border-primary)' }}>
        {[
          { key: 'table', label: 'Performance Table', icon: BarChart3 },
          { key: 'heatmap', label: 'Engagement Heatmap', icon: Flame },
          { key: 'trends', label: 'Trends Over Time', icon: TrendingUp },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-medium transition-all"
            style={{
              background: tab === t.key ? 'var(--bg-surface)' : 'transparent',
              color: tab === t.key ? 'var(--accent-primary)' : 'var(--text-tertiary)',
              borderBottom: tab === t.key ? '2px solid var(--accent-primary)' : '2px solid transparent',
            }}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Table Tab */}
      {tab === 'table' && (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
          {/* Filters */}
          <div className="p-4 border-b flex flex-wrap gap-3 items-center" style={{ borderColor: 'var(--border-primary)' }}>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search content..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
              />
            </div>
            <select
              value={mediaType}
              onChange={(e) => { setMediaType(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg text-sm border"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
              <option value="">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
            </select>
            <div className="flex items-center gap-1">
              <Filter className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
              {sortOptions.map((opt) => (
                <button key={opt.value} onClick={() => handleSort(opt.value)}
                  className="px-2 py-1 text-xs rounded-md transition-all flex items-center gap-1"
                  style={{
                    background: sortBy === opt.value ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                    color: sortBy === opt.value ? 'var(--bg-primary)' : 'var(--text-tertiary)',
                  }}>
                  {opt.label}
                  {sortBy === opt.value && <ArrowUpDown className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-elevated)' }}>
                  <th className="text-left p-3 font-medium" style={{ color: 'var(--text-tertiary)' }}>Content</th>
                  <th className="text-right p-3 font-medium" style={{ color: 'var(--text-tertiary)' }}>Views</th>
                  <th className="text-right p-3 font-medium" style={{ color: 'var(--text-tertiary)' }}>Likes</th>
                  <th className="text-right p-3 font-medium" style={{ color: 'var(--text-tertiary)' }}>Comments</th>
                  <th className="text-right p-3 font-medium" style={{ color: 'var(--text-tertiary)' }}>Shares</th>
                  <th className="text-right p-3 font-medium" style={{ color: 'var(--text-tertiary)' }}>Saves</th>
                  <th className="text-right p-3 font-medium" style={{ color: 'var(--text-tertiary)' }}>CTR</th>
                  <th className="text-right p-3 font-medium" style={{ color: 'var(--text-tertiary)' }}>Eng %</th>
                  <th className="text-center p-3 font-medium" style={{ color: 'var(--text-tertiary)' }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {contentPerformanceLoading && !contentPerformance ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}><td colSpan={9} className="p-3"><div className="h-10 rounded animate-pulse" style={{ background: 'var(--bg-elevated)' }} /></td></tr>
                  ))
                ) : contentPerformance?.posts?.length ? contentPerformance.posts.map((post) => (
                  <tr key={post._id} className="border-t transition-colors hover:opacity-90" style={{ borderColor: 'var(--border-primary)' }}>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {post.image?.thumbnailUrl || post.image?.url ? (
                          <img src={post.image.thumbnailUrl || post.image.url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ background: 'var(--bg-elevated)' }} />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>{post.title}</p>
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {post.mediaType} · {new Date(post.createdAt).toLocaleDateString()}
                            {post.isPinned && ' · 📌'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-right p-3 font-mono" style={{ color: 'var(--text-primary)' }}>{formatNum(post.metrics.totalViews)}</td>
                    <td className="text-right p-3 font-mono" style={{ color: 'var(--text-primary)' }}>{formatNum(post.metrics.totalLikes)}</td>
                    <td className="text-right p-3 font-mono" style={{ color: 'var(--text-primary)' }}>{formatNum(post.metrics.totalComments)}</td>
                    <td className="text-right p-3 font-mono" style={{ color: 'var(--text-primary)' }}>{formatNum(post.metrics.totalShares)}</td>
                    <td className="text-right p-3 font-mono" style={{ color: 'var(--text-primary)' }}>{formatNum(post.metrics.totalSaves)}</td>
                    <td className="text-right p-3 font-mono" style={{ color: 'var(--text-primary)' }}>{post.metrics.clickThroughRate.toFixed(1)}%</td>
                    <td className="text-right p-3 font-mono" style={{ color: 'var(--text-primary)' }}>{post.metrics.engagementRate.toFixed(1)}%</td>
                    <td className="text-center p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold" style={{
                        background: `${tierColors[post.metrics.performanceTier] || '#6b7280'}30`,
                        color: tierColors[post.metrics.performanceTier] || '#6b7280',
                      }}>
                        {post.metrics.performanceScore}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={9} className="text-center p-12" style={{ color: 'var(--text-tertiary)' }}>
                      No content found. Start creating to see analytics!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {contentPerformance?.pagination && contentPerformance.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Page {contentPerformance.pagination.page} of {contentPerformance.pagination.totalPages} ({contentPerformance.pagination.total} posts)
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-2 rounded-lg border disabled:opacity-50 transition-all"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage(p => p + 1)} disabled={!contentPerformance.pagination.hasMore}
                  className="p-2 rounded-lg border disabled:opacity-50 transition-all"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Heatmap Tab */}
      {tab === 'heatmap' && (
        <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Engagement Heatmap (Day × Hour)
          </h3>
          {heatmapLoading ? (
            <div className="h-64 animate-pulse rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
          ) : heatmap?.heatmap ? (
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Hour labels */}
                <div className="flex ml-12 mb-1">
                  {Array.from({ length: 24 }, (_, h) => (
                    <div key={h} className="flex-1 text-center text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                      {h % 3 === 0 ? `${h}h` : ''}
                    </div>
                  ))}
                </div>
                {/* Rows */}
                {heatmap.heatmap.map((row, dayIdx) => {
                  const maxVal = Math.max(...heatmap.heatmap.flat(), 1);
                  return (
                    <div key={dayIdx} className="flex items-center mb-1">
                      <span className="w-12 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{days[dayIdx]}</span>
                      <div className="flex flex-1 gap-0.5">
                        {row.map((val, hourIdx) => {
                          const intensity = val / maxVal;
                          return (
                            <div
                              key={hourIdx}
                              className="flex-1 h-7 rounded-sm transition-all hover:scale-110 cursor-pointer"
                              style={{
                                background: intensity > 0
                                  ? `rgba(16, 185, 129, ${Math.max(intensity, 0.1)})`
                                  : 'var(--bg-elevated)',
                              }}
                              title={`${days[dayIdx]} ${hourIdx}:00 — ${val} events`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>No heatmap data available</p>
          )}
        </div>
      )}

      {/* Trends Tab */}
      {tab === 'trends' && (
        <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Engagement Trends Over Time
          </h3>
          {engagementTrendsLoading ? (
            <div className="h-64 animate-pulse rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
          ) : engagementTrends?.length ? (
            <div className="space-y-4">
              {/* Simple bar visualization */}
              <div className="overflow-x-auto">
                <div className="min-w-[600px] h-48 flex items-end gap-1">
                  {engagementTrends.map((d, i) => {
                    const maxViews = Math.max(...engagementTrends.map(t => t.views), 1);
                    const height = (d.views / maxViews) * 100;
                    return (
                      <div key={i} className="flex-1 group relative">
                        <div
                          className="w-full rounded-t-sm transition-all hover:opacity-80 mx-auto"
                          style={{
                            height: `${height}%`,
                            background: `linear-gradient(to top, var(--accent-primary), rgba(16, 185, 129, 0.6))`,
                            minHeight: d.views > 0 ? '4px' : '0',
                          }}
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                          <div className="rounded-lg p-2 text-xs shadow-lg whitespace-nowrap" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}>
                            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{d.date}</p>
                            <p style={{ color: 'var(--text-secondary)' }}>Views: {formatNum(d.views)}</p>
                            <p style={{ color: 'var(--text-secondary)' }}>Likes: {formatNum(d.likes)}</p>
                            <p style={{ color: 'var(--text-secondary)' }}>Eng: {d.engagementRate}%</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Date labels */}
                <div className="flex gap-1 mt-1">
                  {engagementTrends.map((d, i) => (
                    <div key={i} className="flex-1 text-center text-[9px]" style={{ color: 'var(--text-tertiary)' }}>
                      {i % Math.max(Math.floor(engagementTrends.length / 7), 1) === 0
                        ? new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })
                        : ''}
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                {[
                  { label: 'Avg Daily Views', value: formatNum(Math.round(engagementTrends.reduce((s, d) => s + d.views, 0) / engagementTrends.length)) },
                  { label: 'Avg Daily Likes', value: formatNum(Math.round(engagementTrends.reduce((s, d) => s + d.likes, 0) / engagementTrends.length)) },
                  { label: 'Avg Engagement', value: `${(engagementTrends.reduce((s, d) => s + d.engagementRate, 0) / engagementTrends.length).toFixed(1)}%` },
                  { label: 'Peak Day', value: engagementTrends.sort((a, b) => b.views - a.views)[0]?.date || '-' },
                ].map((s, i) => (
                  <div key={i} className="text-center p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                    <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>No trend data available</p>
          )}
        </div>
      )}
    </div>
  );
}
