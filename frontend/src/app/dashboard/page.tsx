'use client';

import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store';
import { fetchDashboardOverview, fetchActivityFeed, setPeriod } from '@/store/slices/creatorDashboardSlice';
import {
  Eye, Heart, MessageCircle, Share2, TrendingUp, TrendingDown,
  Users, BarChart3, Activity, DollarSign, Zap, Globe,
  ArrowUpRight, ArrowDownRight, Radio,
} from 'lucide-react';

const periods = [
  { label: 'Today', value: 'today' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function GrowthBadge({ value }: { value: number }) {
  const isPositive = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
      {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, growth, color }: {
  icon: React.ElementType; label: string; value: string | number; growth?: number; color: string;
}) {
  return (
    <div className="rounded-xl p-4 border transition-all duration-300 hover:scale-[1.02]"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg" style={{ background: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {growth !== undefined && <GrowthBadge value={growth} />}
      </div>
      <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
        {typeof value === 'number' ? formatNumber(value) : value}
      </p>
      <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
    </div>
  );
}

function ActivityItem({ event }: { event: { eventType: string; message?: string; actorName?: string; postTitle?: string; createdAt: string; amount?: number } }) {
  const iconMap: Record<string, { icon: React.ElementType; color: string }> = {
    new_follower: { icon: Users, color: '#3b82f6' },
    post_like: { icon: Heart, color: '#ef4444' },
    post_comment: { icon: MessageCircle, color: '#8b5cf6' },
    post_share: { icon: Share2, color: '#06b6d4' },
    post_view_milestone: { icon: Eye, color: '#f59e0b' },
    donation_received: { icon: DollarSign, color: '#10b981' },
    content_trending: { icon: TrendingUp, color: '#f97316' },
  };
  const { icon: Icon, color } = iconMap[event.eventType] || { icon: Activity, color: '#6b7280' };
  const timeAgo = getTimeAgo(event.createdAt);

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg transition-colors" style={{ background: 'var(--bg-elevated)' }}>
      <div className="p-1.5 rounded-lg flex-shrink-0" style={{ background: `${color}20` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>
          {event.message || `${event.actorName || 'Someone'} interacted with ${event.postTitle || 'your content'}`}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{timeAgo}</p>
      </div>
      {event.amount && (
        <span className="text-sm font-semibold text-green-400">${event.amount.toFixed(2)}</span>
      )}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DashboardOverviewPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { overview, overviewLoading, period, activityFeed } = useSelector(
    (state: RootState) => state.creatorDashboard
  );

  const loadData = useCallback(() => {
    dispatch(fetchDashboardOverview({ period }));
    dispatch(fetchActivityFeed({ limit: 15 }));
  }, [dispatch, period]);

  useEffect(() => {
    loadData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handlePeriodChange = (p: string) => {
    dispatch(setPeriod(p));
    dispatch(fetchDashboardOverview({ period: p }));
  };

  if (overviewLoading && !overview) {
    return <DashboardSkeleton />;
  }

  const metrics = overview?.metrics;
  const growth = overview?.growth;
  const rt = overview?.realtimeCounters;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Professional Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Welcome back, {overview?.user?.displayName || 'Creator'}. Here&apos;s your performance overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Realtime indicator */}
          {rt && (rt.liveViews > 0 || rt.liveViewers > 0) && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border" style={{ borderColor: 'var(--accent-primary)', background: 'var(--accent-primary)10' }}>
              <Radio className="w-3.5 h-3.5 animate-pulse" style={{ color: 'var(--accent-primary)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--accent-primary)' }}>
                {rt.liveViewers} live
              </span>
            </div>
          )}
          {/* Period Selector */}
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border-primary)' }}>
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => handlePeriodChange(p.value)}
                className="px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  background: period === p.value ? 'var(--accent-primary)' : 'var(--bg-surface)',
                  color: period === p.value ? 'var(--bg-primary)' : 'var(--text-secondary)',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard icon={Users} label="Total Followers" value={metrics?.totalFollowers || 0} growth={growth?.followers} color="#3b82f6" />
        <MetricCard icon={Globe} label="Profile Visits" value={metrics?.profileVisits || 0} growth={growth?.profileVisits} color="#8b5cf6" />
        <MetricCard icon={BarChart3} label="Content Posted" value={metrics?.totalContentPosted || 0} color="#06b6d4" />
        <MetricCard icon={Eye} label="Impressions" value={metrics?.totalImpressions || 0} growth={growth?.impressions} color="#f59e0b" />
        <MetricCard icon={Zap} label="Engagement Rate" value={`${(metrics?.engagementRate || 0).toFixed(1)}%`} growth={growth?.engagement} color="#10b981" />
        <MetricCard icon={DollarSign} label="Revenue" value={`$${(metrics?.totalRevenue || 0).toFixed(2)}`} growth={growth?.revenue} color="#f97316" />
      </div>

      {/* Two Column: Top Performing + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Posts */}
        <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Top Performing Content
            </h2>
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div className="space-y-3">
            {overview?.topPosts?.length ? overview.topPosts.slice(0, 5).map((item, i) => (
              <div key={item._id || i} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                <span className="text-xs font-bold w-5 text-center" style={{ color: 'var(--accent-primary)' }}>#{i + 1}</span>
                {item.post?.image?.thumbnailUrl || item.post?.image?.url ? (
                  <img
                    src={item.post.image.thumbnailUrl || item.post.image.url}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg" style={{ background: 'var(--bg-primary)' }} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {item.post?.title || 'Untitled'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {formatNumber(item.totalViews || 0)} views
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>·</span>
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {(item.engagementRate || 0).toFixed(1)}% eng
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    item.performanceTier === 'viral' || item.performanceTier === 'mega-viral'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : item.performanceTier === 'good'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {item.performanceScore || 0}
                  </span>
                </div>
              </div>
            )) : (
              <p className="text-sm py-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
                No performance data yet. Start creating content!
              </p>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Recent Activity
            </h2>
            <Activity className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {activityFeed?.events?.length ? activityFeed.events.slice(0, 15).map((event) => (
              <ActivityItem key={event._id} event={event} />
            )) : overview?.recentActivity?.length ? overview.recentActivity.slice(0, 15).map((event) => (
              <ActivityItem key={event._id} event={event} />
            )) : (
              <p className="text-sm py-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
                No recent activity. Your feed will populate as people interact with your content.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
      <div className="h-8 w-64 rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl p-4 h-28" style={{ background: 'var(--bg-surface)' }}>
            <div className="h-4 w-8 rounded" style={{ background: 'var(--bg-elevated)' }} />
            <div className="h-6 w-20 rounded mt-4" style={{ background: 'var(--bg-elevated)' }} />
            <div className="h-3 w-16 rounded mt-2" style={{ background: 'var(--bg-elevated)' }} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-xl p-5 h-96" style={{ background: 'var(--bg-surface)' }} />
        ))}
      </div>
    </div>
  );
}
