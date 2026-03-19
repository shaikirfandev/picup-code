'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart3, Eye, Link2, Download, Brain, Globe2, Activity,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchCreatorOverview,
  fetchEngagementTimeline,
  fetchFollowerGrowth,
  fetchPostsPerformance,
  fetchRealtimeStats,
  exportAnalyticsCSV,
} from '@/store/slices/creatorAnalyticsSlice';
import PeriodSelector from './PeriodSelector';
import OverviewCards from './OverviewCards';
import PostsTable from './PostsTable';
import AnimatedCounter from './AnimatedCounter';
import { AnalyticsSkeleton } from './AnalyticsSkeleton';
import EngagementChart from './charts/EngagementChart';
import FollowerGrowthChart from './charts/FollowerGrowthChart';
import AffiliatePanel from './AffiliatePanel';
import AudiencePanel from './AudiencePanel';
import AIInsightsPanel from './AIInsightsPanel';
import FunnelChart from './charts/FunnelChart';

type Tab = 'overview' | 'posts' | 'affiliate' | 'audience' | 'ai';

export default function AnalyticsDashboard() {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [period, setPeriod] = useState('30d');
  const [customRange, setCustomRange] = useState<{ startDate?: string; endDate?: string }>({});

  // Stable custom range handler to avoid re-creating the object on every render
  const handleCustomRange = useCallback((range: { startDate?: string; endDate?: string }) => {
    setCustomRange(prev => {
      if (prev.startDate === range.startDate && prev.endDate === range.endDate) return prev;
      return range;
    });
  }, []);

  const periodParams = useMemo(() => period === 'custom'
    ? { period, ...customRange }
    : { period }, [period, customRange]);

  const {
    overview,
    overviewLoading,
    timeline,
    followerGrowth,
    realtimeStats,
    exportLoading,
  } = useAppSelector((s) => s.creatorAnalytics);

  // Fetch overview data whenever period changes
  useEffect(() => {
    dispatch(fetchCreatorOverview(periodParams));
    dispatch(fetchEngagementTimeline(periodParams));
    dispatch(fetchFollowerGrowth(periodParams));
    dispatch(fetchRealtimeStats());
  }, [dispatch, period, customRange.startDate, customRange.endDate]);

  // Auto-refresh realtime stats every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchRealtimeStats());
    }, 30_000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleExport = useCallback(() => {
    dispatch(exportAnalyticsCSV(periodParams));
  }, [dispatch, period, customRange.startDate, customRange.endDate]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'posts', label: 'Posts', icon: <Eye className="w-4 h-4" /> },
    { id: 'affiliate', label: 'Affiliate', icon: <Link2 className="w-4 h-4" /> },
    { id: 'audience', label: 'Audience', icon: <Globe2 className="w-4 h-4" /> },
    { id: 'ai', label: 'AI Insights', icon: <Brain className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[var(--accent)]" />
            Creator Analytics
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Track your content performance, engagement, and revenue
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Real-time indicator */}
          {realtimeStats && realtimeStats.total > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-full text-sm font-medium">
              <Activity className="w-3.5 h-3.5" />
              <AnimatedCounter value={realtimeStats.total} /> today
            </div>
          )}
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            {exportLoading ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <PeriodSelector
        period={period}
        onPeriodChange={setPeriod}
        onCustomRange={handleCustomRange}
      />

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-[var(--border)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-[var(--accent)] border-b-2 border-[var(--accent)] bg-[var(--accent)]/5'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          overview={overview}
          timeline={timeline}
          followerGrowth={followerGrowth}
          isLoading={overviewLoading}
        />
      )}
      {activeTab === 'posts' && (
        <PostsTab periodParams={periodParams} />
      )}
      {activeTab === 'affiliate' && (
        <AffiliatePanel periodParams={periodParams} />
      )}
      {activeTab === 'audience' && (
        <AudiencePanel periodParams={periodParams} />
      )}
      {activeTab === 'ai' && (
        <AIInsightsPanel />
      )}
    </div>
  );
}

// ── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({
  overview,
  timeline,
  followerGrowth,
  isLoading,
}: {
  overview: any;
  timeline: any;
  followerGrowth: any;
  isLoading: boolean;
}) {
  if (isLoading) return <AnalyticsSkeleton />;
  if (!overview) return <p className="text-[var(--text-secondary)]">No data available yet.</p>;

  return (
    <div className="space-y-6">
      {/* Overview Metric Cards */}
      <OverviewCards overview={overview} />

      {/* Funnel Chart */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wider">
          Engagement Funnel
        </h3>
        <FunnelChart
          impressions={overview.impressions.value}
          clicks={overview.clicks.value}
          likes={overview.likes.value}
          shares={overview.shares.value}
          saves={overview.saves.value}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wider">
            Engagement Over Time
          </h3>
          {timeline && timeline.length > 0 ? (
            <EngagementChart data={timeline} />
          ) : (
            <div className="h-64 flex items-center justify-center text-[var(--text-secondary)]">No timeline data</div>
          )}
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wider">
            Follower Growth
          </h3>
          {followerGrowth && followerGrowth.length > 0 ? (
            <FollowerGrowthChart data={followerGrowth} />
          ) : (
            <div className="h-64 flex items-center justify-center text-[var(--text-secondary)]">No follower data</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Posts Tab ─────────────────────────────────────────────────────────────────
function PostsTab({ periodParams }: { periodParams: any }) {
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(1);
  const [mediaType, setMediaType] = useState('');

  const { postsPerformance, postsPerformanceLoading } = useAppSelector((s) => s.creatorAnalytics);

  useEffect(() => {
    dispatch(fetchPostsPerformance({
      ...periodParams,
      sort: 'impressions',
      order: 'desc',
      page,
      limit: 20,
      mediaType: mediaType || undefined,
    }));
  }, [dispatch, periodParams, page, mediaType]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={mediaType}
          onChange={(e) => { setMediaType(e.target.value); setPage(1); }}
          className="input-field text-sm w-auto"
        >
          <option value="">All Types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
        </select>
        <span className="text-xs text-[var(--text-muted)] ml-auto">
          Click column headers to sort &bull; Click a row for details
        </span>
      </div>

      <PostsTable
        data={postsPerformance?.data || []}
        isLoading={postsPerformanceLoading}
        pagination={postsPerformance?.pagination}
        onPageChange={setPage}
      />
    </div>
  );
}
