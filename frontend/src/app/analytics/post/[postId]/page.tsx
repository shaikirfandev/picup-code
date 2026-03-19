'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchPostAnalytics, fetchRealtimePostStats } from '@/store/slices/creatorAnalyticsSlice';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Eye, Heart, Share2, Bookmark, MessageCircle, MousePointerClick, Users, Clock, TrendingUp } from 'lucide-react';
import PeriodSelector from '@/components/analytics/PeriodSelector';
import EngagementChart from '@/components/analytics/charts/EngagementChart';
import DeviceBreakdownChart from '@/components/analytics/charts/DeviceBreakdownChart';
import TrafficSourcesChart from '@/components/analytics/charts/TrafficSourcesChart';
import GeoChart from '@/components/analytics/charts/GeoChart';
import HourlyHeatmap from '@/components/analytics/charts/HourlyHeatmap';
import AnimatedCounter from '@/components/analytics/AnimatedCounter';
import MetricCard from '@/components/analytics/MetricCard';
import { AnalyticsSkeleton } from '@/components/analytics/AnalyticsSkeleton';

export default function PostAnalyticsPage() {
  const { postId } = useParams<{ postId: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [period, setPeriod] = useState('30d');
  const [customRange, setCustomRange] = useState<{ startDate?: string; endDate?: string }>({});

  const periodParams = period === 'custom'
    ? { period, ...customRange }
    : { period };

  const data = useAppSelector((s) => s.creatorAnalytics.postAnalytics[postId]);
  const isLoading = useAppSelector((s) => s.creatorAnalytics.postAnalyticsLoading[postId]);
  const realtimeData = useAppSelector((s) => s.creatorAnalytics.realtimePostStats[postId]);

  // Track whether we've initiated a fetch
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (postId) {
      dispatch(fetchPostAnalytics({ postId, params: periodParams }));
      dispatch(fetchRealtimePostStats(postId));
      setHasFetched(true);
    }
  }, [dispatch, postId, period, customRange.startDate, customRange.endDate]);

  // Auto-refresh realtime every 30s
  useEffect(() => {
    if (!postId) return;
    const interval = setInterval(() => {
      dispatch(fetchRealtimePostStats(postId));
    }, 30_000);
    return () => clearInterval(interval);
  }, [dispatch, postId]);

  // Show loading state while fetch is in flight or hasn't completed yet
  if (isLoading || !hasFetched) return <AnalyticsSkeleton />;
  if (!data) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-[var(--text-secondary)]">Post not found or you don&apos;t own this post.</p>
    </div>
  );

  const { post, totals, timeline, deviceBreakdown, trafficSources, geoDistribution, hourlyHeatmap } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-[var(--surface)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{post.title}</h1>
          <span className="text-sm text-[var(--text-secondary)] capitalize">{post.mediaType} post</span>
        </div>
        {realtimeData && realtimeData.liveViewers > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <AnimatedCounter value={realtimeData.liveViewers} /> live
          </div>
        )}
      </div>

      <PeriodSelector
        period={period}
        onPeriodChange={setPeriod}
        onCustomRange={setCustomRange}
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <MetricCard label="Impressions" value={totals.impressions} icon={<Eye className="w-4 h-4" />} />
        <MetricCard label="Unique Views" value={totals.uniqueViews} icon={<Users className="w-4 h-4" />} />
        <MetricCard label="Likes" value={totals.likes} icon={<Heart className="w-4 h-4" />} />
        <MetricCard label="Shares" value={totals.shares} icon={<Share2 className="w-4 h-4" />} />
        <MetricCard label="Saves" value={totals.saves} icon={<Bookmark className="w-4 h-4" />} />
        <MetricCard label="Comments" value={totals.comments} icon={<MessageCircle className="w-4 h-4" />} />
        <MetricCard label="Clicks" value={totals.clicks} icon={<MousePointerClick className="w-4 h-4" />} />
        <MetricCard label="CTR" value={totals.ctr} suffix="%" icon={<TrendingUp className="w-4 h-4" />} />
        <MetricCard label="Engagement Rate" value={totals.engagementRate} suffix="%" icon={<TrendingUp className="w-4 h-4" />} />
        {post.mediaType === 'video' && (
          <MetricCard label="Avg Watch Time" value={totals.avgWatchDuration} suffix="s" icon={<Clock className="w-4 h-4" />} />
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wider">Engagement Over Time</h3>
          <EngagementChart data={timeline} />
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wider">Traffic Sources</h3>
          <TrafficSourcesChart data={trafficSources} />
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wider">Device Breakdown</h3>
          <DeviceBreakdownChart data={deviceBreakdown} />
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wider">Geographic Distribution</h3>
          <GeoChart data={geoDistribution} />
        </div>
      </div>

      {/* Hourly Activity */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wider">Activity by Hour</h3>
        <HourlyHeatmap data={hourlyHeatmap} />
      </div>
    </div>
  );
}
