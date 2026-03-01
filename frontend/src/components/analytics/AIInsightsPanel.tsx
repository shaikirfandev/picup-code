'use client';

import { useEffect } from 'react';
import {
  Brain, Clock, TrendingUp, TrendingDown, Hash, Image, Video,
  BarChart3, Zap, Sparkles, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchAIInsights } from '@/store/slices/creatorAnalyticsSlice';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

export default function AIInsightsPanel() {
  const dispatch = useAppDispatch();
  const { aiInsights: data, aiInsightsLoading: isLoading } = useAppSelector((s) => s.creatorAnalytics);

  useEffect(() => {
    dispatch(fetchAIInsights());
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5 h-48 animate-pulse bg-[var(--surface)]" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card p-10 text-center text-[var(--text-secondary)]">
        <Brain className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-lg font-medium">Not enough data for AI insights</p>
        <p className="text-sm mt-1">Keep posting and engaging — insights will appear once we have enough data to analyze.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-5 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-purple-500/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <h2 className="text-lg font-bold">AI-Powered Insights</h2>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          Personalized recommendations based on your content performance patterns. Updated daily.
        </p>
      </div>

      {/* Performance Trend */}
      {data.performanceTrend && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Performance Trend
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <TrendMetric
              label="Avg Engagement"
              current={data.performanceTrend.current.avgEngagement}
              previous={data.performanceTrend.previous.avgEngagement}
            />
            <TrendMetric
              label="Avg Impressions"
              current={data.performanceTrend.current.avgImpressions}
              previous={data.performanceTrend.previous.avgImpressions}
            />
            <TrendMetric
              label="Performance Score"
              current={data.performanceTrend.current.avgPerformanceScore}
              previous={data.performanceTrend.previous.avgPerformanceScore}
              decimals={1}
            />
          </div>
        </div>
      )}

      {/* Best Posting Times */}
      {data.bestPostingTimes && data.bestPostingTimes.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Best Posting Times
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {data.bestPostingTimes.slice(0, 6).map((slot, i) => {
              const maxScore = data.bestPostingTimes[0]?.engagementScore || 1;
              const intensity = slot.engagementScore / maxScore;
              return (
                <div
                  key={slot.hour}
                  className={`
                    p-3 rounded-xl text-center transition-all border
                    ${i === 0
                      ? 'bg-green-500/15 border-green-500/30'
                      : 'bg-[var(--surface)] border-[var(--border)]'}
                  `}
                >
                  {i === 0 && (
                    <span className="text-[10px] font-medium text-green-400 uppercase tracking-widest">Best</span>
                  )}
                  <p className="text-lg font-bold">{slot.label}</p>
                  <div className="mt-1.5 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-400 rounded-full transition-all duration-500"
                      style={{ width: `${intensity * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                    Score: {slot.engagementScore.toFixed(1)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Post Type Performance */}
      {data.postTypePerformance && data.postTypePerformance.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Content Type Performance
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar chart */}
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.postTypePerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="type"
                  tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--panel)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="avgImpressions" fill="#3b82f6" name="Avg Impressions" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="avgEngagementRate" fill="#10b981" name="Avg Eng. Rate %" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
            {/* Cards */}
            <div className="space-y-3">
              {data.postTypePerformance.map((pt) => (
                <div key={pt.type} className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface)]">
                  <div className="flex items-center gap-2">
                    {pt.type === 'image' ? (
                      <Image className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Video className="w-4 h-4 text-purple-400" />
                    )}
                    <span className="text-sm font-medium capitalize">{pt.type}</span>
                    <span className="text-xs text-[var(--text-secondary)]">({pt.totalPosts} posts)</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums">
                      {pt.avgImpressions.toLocaleString()} avg views
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {pt.avgEngagementRate.toFixed(2)}% engagement
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Tags */}
      {data.topTags && data.topTags.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
            <Hash className="w-4 h-4" />
            Top Performing Tags
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.topTags.slice(0, 9).map((tag, i) => {
              const maxImp = data.topTags[0]?.avgImpressions || 1;
              return (
                <div
                  key={tag.tag}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]"
                >
                  <span className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${i < 3 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-[var(--border)] text-[var(--text-secondary)]'}
                  `}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">#{tag.tag}</p>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <span>{tag.postCount} posts</span>
                      <span>·</span>
                      <span>{tag.avgEngagementRate.toFixed(2)}% eng.</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold tabular-nums">{tag.avgImpressions.toLocaleString()}</p>
                    <p className="text-[10px] text-[var(--text-secondary)]">avg views</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Trend Metric Card ─────────────────────────────────────────────────── */

function TrendMetric({
  label,
  current,
  previous,
  decimals = 0,
}: {
  label: string;
  current: number;
  previous: number;
  decimals?: number;
}) {
  const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <div className="p-4 rounded-xl bg-[var(--surface)]">
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold tabular-nums">
          {decimals > 0 ? current.toFixed(decimals) : current.toLocaleString()}
        </p>
        {change !== 0 && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-[10px] text-[var(--text-secondary)] mt-1">
        Previous: {decimals > 0 ? previous.toFixed(decimals) : previous.toLocaleString()}
      </p>
    </div>
  );
}
