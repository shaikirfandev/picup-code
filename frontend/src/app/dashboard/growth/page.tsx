'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store';
import { fetchGrowthInsights } from '@/store/slices/creatorDashboardSlice';
import {
  Sparkles, TrendingUp, Clock, Tag, Hash, Lightbulb, ArrowRight,
  Target, Zap, BarChart3, PieChart, Award,
} from 'lucide-react';

const priorityColors: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  info: '#3b82f6',
};

const typeIcons: Record<string, React.ElementType> = {
  content: Lightbulb,
  engagement: Target,
  growth: TrendingUp,
  monetization: Sparkles,
  schedule: Clock,
  posting: Clock,
  tags: Tag,
  audience: BarChart3,
};

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export default function GrowthInsightsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { growthInsights, growthInsightsLoading } = useSelector((state: RootState) => state.creatorDashboard);

  useEffect(() => {
    dispatch(fetchGrowthInsights());
  }, [dispatch]);

  const data = growthInsights;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Sparkles className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
          Growth & AI Insights
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
          AI-powered recommendations and analytics to accelerate your growth.
        </p>
      </div>

      {growthInsightsLoading && !data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl animate-pulse" style={{ background: 'var(--bg-surface)' }} />
          ))}
        </div>
      ) : data ? (
        <>
          {/* AI Recommendations */}
          {data.recommendations && data.recommendations.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Zap className="w-5 h-5" style={{ color: '#f59e0b' }} /> AI Recommendations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.recommendations.map((rec, i) => {
                  const Icon = typeIcons[rec.type] || Lightbulb;
                  return (
                    <div key={i} className="rounded-xl border p-5 transition-all hover:shadow-lg"
                      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: `${priorityColors[rec.priority] || '#6b7280'}15` }}>
                            <Icon className="w-4 h-4" style={{ color: priorityColors[rec.priority] || '#6b7280' }} />
                          </div>
                          <span className="text-xs capitalize px-2 py-0.5 rounded-full font-medium"
                            style={{ background: `${priorityColors[rec.priority] || '#6b7280'}15`, color: priorityColors[rec.priority] || '#6b7280' }}>
                            {rec.priority} priority
                          </span>
                        </div>
                        {rec.icon && (
                          <span className="text-lg">{rec.icon}</span>
                        )}
                      </div>
                      <h4 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{rec.title}</h4>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{rec.description}</p>
                      <div className="mt-3 flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        <ArrowRight className="w-3 h-3" style={{ color: 'var(--accent-primary)' }} />
                        Type: {rec.type}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Best Posting Times */}
            {data.bestPostingTimes && data.bestPostingTimes.length > 0 && (
              <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Clock className="w-4 h-4" style={{ color: '#3b82f6' }} /> Best Posting Times
                </h3>
                <div className="space-y-3">
                  {data.bestPostingTimes.slice(0, 6).map((slot, i) => {
                    const maxEng = Math.max(...data.bestPostingTimes.map((s) => s.avgEngagement), 1);
                    const pct = (slot.avgEngagement / maxEng) * 100;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-20 text-xs text-right" style={{ color: 'var(--text-secondary)' }}>
                          <span className="font-mono">{slot.hour}:00</span>
                          <span className="block text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                            {slot.day}
                          </span>
                        </div>
                        <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: `linear-gradient(to right, #3b82f6, #8b5cf6)` }} />
                        </div>
                        <span className="text-xs font-mono w-12 text-right" style={{ color: 'var(--text-primary)' }}>
                          {slot.avgEngagement.toFixed(1)}%
                        </span>
                        {i === 0 && <Award className="w-4 h-4" style={{ color: '#f59e0b' }} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Content Type Performance */}
            {data.contentTypePerformance && data.contentTypePerformance.length > 0 && (
              <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <PieChart className="w-4 h-4" style={{ color: '#8b5cf6' }} /> Content Type Performance
                </h3>
                <div className="space-y-4">
                  {data.contentTypePerformance.map((ctp, i) => {
                    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981'];
                    const color = colors[i % colors.length];
                    return (
                      <div key={ctp._id || i} className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{ctp._id}</span>
                          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{ctp.totalPosts} posts</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p style={{ color: 'var(--text-tertiary)' }}>Avg Views</p>
                            <p className="font-mono font-medium" style={{ color }}>{formatNum(Math.round(ctp.avgViews || 0))}</p>
                          </div>
                          <div>
                            <p style={{ color: 'var(--text-tertiary)' }}>Avg Likes</p>
                            <p className="font-mono font-medium" style={{ color }}>{formatNum(Math.round(ctp.avgLikes || 0))}</p>
                          </div>
                          <div>
                            <p style={{ color: 'var(--text-tertiary)' }}>Avg Comments</p>
                            <p className="font-mono font-medium" style={{ color }}>{formatNum(Math.round(ctp.avgComments || 0))}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tag Performance */}
            {data.tagPerformance && data.tagPerformance.length > 0 && (
              <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Hash className="w-4 h-4" style={{ color: '#10b981' }} /> Top Performing Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {data.tagPerformance.slice(0, 15).map((tag, i) => {
                    const maxEng = Math.max(...data.tagPerformance.map((t) => t.avgEngagement), 1);
                    const opacity = Math.max((tag.avgEngagement / maxEng), 0.3);
                    return (
                      <div key={tag._id || i}
                        className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all hover:scale-105 cursor-default"
                        style={{
                          borderColor: 'var(--border-primary)',
                          background: `rgba(16, 185, 129, ${opacity * 0.15})`,
                          color: 'var(--text-primary)',
                        }}
                        title={`${tag.postCount} posts · ${(tag.avgEngagement || 0).toFixed(1)}% engagement`}>
                        <Tag className="w-3 h-3 inline mr-1" style={{ color: `rgba(16, 185, 129, ${opacity})` }} />
                        {tag._id}
                        <span className="ml-1 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                          {(tag.avgEngagement || 0).toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Trending Topics */}
            {data.trendingTopics && data.trendingTopics.length > 0 && (
              <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <TrendingUp className="w-4 h-4" style={{ color: '#f97316' }} /> Trending Topics
                </h3>
                <div className="space-y-3">
                  {data.trendingTopics.slice(0, 8).map((topic, i) => (
                    <div key={topic._id || i} className="flex items-center gap-3 p-2 rounded-lg"
                      style={{ background: 'var(--bg-elevated)' }}>
                      <span className="text-sm font-bold w-6 text-center" style={{ color: 'var(--text-tertiary)' }}>#{i + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{topic._id}</p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {topic.postCount || 0} posts · {formatNum(topic.avgViews || 0)} avg views
                        </p>
                      </div>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full"
                        style={{ background: '#10b98115', color: '#10b981' }}>
                        {(topic.avgEngagement || 0).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Growth Prediction */}
            {data.growthPrediction && (
              <div className="rounded-xl border p-5 lg:col-span-2" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <BarChart3 className="w-4 h-4" style={{ color: '#3b82f6' }} /> Growth Prediction
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Current Followers', value: formatNum(data.growthPrediction.currentFollowers || 0), icon: Target, color: '#6b7280' },
                    { label: 'Predicted (30d)', value: formatNum(data.growthPrediction.predicted30d || 0), icon: TrendingUp, color: '#3b82f6' },
                    { label: 'Predicted (90d)', value: formatNum(data.growthPrediction.predicted90d || 0), icon: BarChart3, color: '#8b5cf6' },
                    { label: 'Confidence', value: `${(data.growthPrediction.confidence || 0).toFixed(0)}%`, icon: Sparkles, color: '#f59e0b' },
                  ].map((pred, i) => (
                    <div key={i} className="text-center p-4 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                      <pred.icon className="w-6 h-6 mx-auto mb-2" style={{ color: pred.color }} />
                      <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{pred.value}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{pred.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-4" style={{ borderColor: 'var(--border-primary)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Trajectory:</span>
                    <span className="text-xs font-medium capitalize px-2 py-0.5 rounded-full"
                      style={{ background: '#3b82f615', color: '#3b82f6' }}>
                      {data.growthPrediction.trajectory || 'stable'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Daily Growth Rate:</span>
                    <span className="text-xs font-mono font-medium" style={{ color: '#10b981' }}>
                      +{(data.growthPrediction.dailyGrowthRate || 0).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Audience Summary */}
            {data.audienceSummary && (
              <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Target className="w-4 h-4" style={{ color: '#ec4899' }} /> Audience Summary
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Top Country', value: data.audienceSummary.topCountry || 'N/A' },
                    { label: 'Peak Day', value: data.audienceSummary.peakDay || 'N/A' },
                    { label: 'Top Device', value: data.audienceSummary.topDevice || 'N/A' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                      <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{item.label}</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Engagement Patterns */}
            {data.engagementPatterns && data.engagementPatterns.length > 0 && (
              <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <BarChart3 className="w-4 h-4" style={{ color: '#06b6d4' }} /> Engagement Patterns
                </h3>
                <div className="space-y-2">
                  {data.engagementPatterns.map((pattern, i) => {
                    const maxCount = Math.max(...data.engagementPatterns.map((p) => p.count), 1);
                    const pct = (pattern.count / maxCount) * 100;
                    return (
                      <div key={pattern._id || i} className="flex items-center gap-3">
                        <span className="text-xs w-20 text-right capitalize" style={{ color: 'var(--text-secondary)' }}>
                          {pattern._id}
                        </span>
                        <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: '#06b6d4' }} />
                        </div>
                        <span className="text-xs font-mono w-10 text-right" style={{ color: 'var(--text-primary)' }}>
                          {pattern.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-20 rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
          <Sparkles className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>No growth data yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Post more content to unlock AI-powered growth insights.</p>
        </div>
      )}
    </div>
  );
}
