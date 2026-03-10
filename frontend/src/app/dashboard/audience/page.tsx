'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store';
import { fetchAudienceInsights, setPeriod } from '@/store/slices/creatorDashboardSlice';
import {
  Users, Globe, Clock, Smartphone, Monitor, Tablet,
  TrendingUp, UserPlus, ArrowUp, ArrowDown, MapPin, Activity,
} from 'lucide-react';

const periods = [
  { label: 'Today', value: 'today' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
];

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

const barColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#06b6d4', '#f59e0b'];
const genderColors: Record<string, string> = { male: '#3b82f6', female: '#ec4899', other: '#8b5cf6', unknown: '#6b7280' };

function HorizontalBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-24 truncate text-right" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-mono w-14 text-right" style={{ color: 'var(--text-primary)' }}>{formatNum(value)}</span>
    </div>
  );
}

export default function AudienceInsightsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { audience, audienceLoading, period } = useSelector((state: RootState) => state.creatorDashboard);

  useEffect(() => {
    dispatch(fetchAudienceInsights({ period }));
  }, [dispatch, period]);

  const data = audience;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Audience Insights</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Understand who your audience is and how they engage with your content.
          </p>
        </div>
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border-primary)' }}>
          {periods.map((p) => (
            <button key={p.value} onClick={() => dispatch(setPeriod(p.value))}
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

      {audienceLoading && !data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 rounded-xl animate-pulse" style={{ background: 'var(--bg-surface)' }} />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Follower Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Followers', value: formatNum(data.followers?.totalFollowers || 0), icon: Users, color: '#3b82f6',
                change: data.followers?.netGrowth },
              { label: 'New Followers', value: formatNum(data.followers?.recentGain || 0), icon: UserPlus, color: '#10b981' },
              { label: 'Follower Rate', value: `${(data.engagement?.followerRate || 0).toFixed(1)}%`, icon: Activity, color: '#8b5cf6' },
              { label: 'Engagement Ratio', value: `${(data.engagement?.ratio || 0).toFixed(1)}%`, icon: TrendingUp, color: '#f97316' },
            ].map((stat, i) => (
              <div key={i} className="rounded-xl p-4 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                  {stat.change !== undefined && (
                    <span className="flex items-center text-xs font-medium" style={{ color: stat.change >= 0 ? '#10b981' : '#ef4444' }}>
                      {stat.change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      {Math.abs(stat.change)}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Age Distribution */}
            {data.demographics?.ageGroups && (
              <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Users className="w-4 h-4" style={{ color: '#3b82f6' }} /> Age Distribution
                </h3>
                <div className="space-y-3">
                  {(() => {
                    const groups = data.demographics.ageGroups;
                    const maxVal = Math.max(...Object.values(groups), 1);
                    return Object.entries(groups).map(([label, value], i) => (
                      <HorizontalBar key={label} label={label} value={value} max={maxVal} color={barColors[i % barColors.length]} />
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Gender Distribution */}
            {data.demographics?.genderDistribution && (
              <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Users className="w-4 h-4" style={{ color: '#ec4899' }} /> Gender Distribution
                </h3>
                <div className="flex items-center gap-6">
                  <div className="relative w-32 h-32 flex-shrink-0">
                    {(() => {
                      const g = data.demographics.genderDistribution;
                      const total = (g.male + g.female + g.other + g.unknown) || 1;
                      let cumulative = 0;
                      const entries: [string, number][] = [['male', g.male], ['female', g.female], ['other', g.other], ['unknown', g.unknown]];
                      const segments = entries.map(([key, val]) => {
                        const pct = (val / total) * 100;
                        const start = cumulative;
                        cumulative += pct;
                        return { key, pct, start, color: genderColors[key] || '#6b7280' };
                      });
                      const gradientParts = segments.map(s => `${s.color} ${s.start}% ${s.start + s.pct}%`).join(', ');
                      return (
                        <div className="w-full h-full rounded-full" style={{
                          background: `conic-gradient(${gradientParts})`,
                          WebkitMask: 'radial-gradient(farthest-side, transparent 60%, black 61%)',
                          mask: 'radial-gradient(farthest-side, transparent 60%, black 61%)',
                        }} />
                      );
                    })()}
                  </div>
                  <div className="space-y-2">
                    {(() => {
                      const g = data.demographics.genderDistribution;
                      const total = (g.male + g.female + g.other + g.unknown) || 1;
                      const entries: [string, number][] = [['male', g.male], ['female', g.female], ['other', g.other], ['unknown', g.unknown]];
                      return entries.map(([key, val]) => (
                        <div key={key} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ background: genderColors[key] || '#6b7280' }} />
                          <span className="text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>
                            {key}: {(val / total * 100).toFixed(0)}%
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Top Countries */}
            {data.demographics?.countries && data.demographics.countries.length > 0 && (
              <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Globe className="w-4 h-4" style={{ color: '#06b6d4' }} /> Top Countries
                </h3>
                <div className="space-y-3">
                  {(() => {
                    const maxVal = Math.max(...data.demographics.countries.map(c => c.count), 1);
                    return data.demographics.countries.slice(0, 8).map((country, i) => (
                      <HorizontalBar
                        key={country.code || i}
                        label={country.name}
                        value={country.count}
                        max={maxVal}
                        color={barColors[i % barColors.length]}
                      />
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Top Cities */}
            {data.demographics?.cities && data.demographics.cities.length > 0 && (
              <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <MapPin className="w-4 h-4" style={{ color: '#f97316' }} /> Top Cities
                </h3>
                <div className="space-y-3">
                  {(() => {
                    const maxVal = Math.max(...data.demographics.cities.map(c => c.count), 1);
                    return data.demographics.cities.slice(0, 8).map((city, i) => (
                      <HorizontalBar
                        key={city.name || i}
                        label={city.name}
                        value={city.count}
                        max={maxVal}
                        color={barColors[i % barColors.length]}
                      />
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Active Hours */}
            {data.activity?.activeHours && (
              <div className="rounded-xl border p-5 md:col-span-2" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Clock className="w-4 h-4" style={{ color: '#f59e0b' }} /> Active Hours
                </h3>
                <div className="flex items-end gap-1 h-32">
                  {Array.from({ length: 24 }, (_, h) => {
                    const val = data.activity!.activeHours[String(h)] || 0;
                    const allVals = Object.values(data.activity!.activeHours);
                    const max = Math.max(...allVals, 1);
                    const height = (val / max) * 100;
                    const isPeak = h === data.activity!.peakHour;
                    return (
                      <div key={h} className="flex-1 group relative flex flex-col items-center">
                        <div
                          className="w-full rounded-t-sm transition-all hover:opacity-80"
                          style={{
                            height: `${height}%`,
                            background: isPeak
                              ? 'var(--accent-primary)'
                              : `rgba(59, 130, 246, ${Math.max(val / max, 0.15)})`,
                            minHeight: val > 0 ? '2px' : '0',
                          }}
                        />
                        <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                          <div className="rounded-md px-2 py-1 text-xs shadow-lg whitespace-nowrap" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
                            {h}:00 — {formatNum(val)} active{isPeak ? ' 🔥 Peak' : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-1 mt-1">
                  {Array.from({ length: 24 }, (_, h) => (
                    <div key={h} className="flex-1 text-center text-[9px]" style={{ color: 'var(--text-tertiary)' }}>
                      {h % 4 === 0 ? `${h}h` : ''}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Devices */}
            {data.engagement?.devices && data.engagement.devices.length > 0 && (
              <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Smartphone className="w-4 h-4" style={{ color: '#8b5cf6' }} /> Devices
                </h3>
                <div className="space-y-4">
                  {data.engagement.devices.map((d, i) => {
                    const Icon = d.device === 'mobile' ? Smartphone : d.device === 'tablet' ? Tablet : Monitor;
                    return (
                      <div key={d.device || i} className="flex items-center gap-3">
                        <Icon className="w-5 h-5" style={{ color: barColors[i % barColors.length] }} />
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="capitalize" style={{ color: 'var(--text-secondary)' }}>{d.device}</span>
                            <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{d.percentage.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${d.percentage}%`, background: barColors[i % barColors.length] }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Traffic Sources */}
            {data.engagement?.trafficSources && data.engagement.trafficSources.length > 0 && (
              <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <TrendingUp className="w-4 h-4" style={{ color: '#10b981' }} /> Traffic Sources
                </h3>
                <div className="space-y-3">
                  {(() => {
                    const maxVal = Math.max(...data.engagement!.trafficSources.map(s => s.count), 1);
                    return data.engagement!.trafficSources.slice(0, 8).map((source, i) => (
                      <HorizontalBar
                        key={source.source || i}
                        label={source.source}
                        value={source.count}
                        max={maxVal}
                        color={barColors[i % barColors.length]}
                      />
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Engagement Segments */}
            {data.engagement?.segments && (
              <div className="rounded-xl border p-5 md:col-span-2" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Activity className="w-4 h-4" style={{ color: '#3b82f6' }} /> Audience Segments
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Super Fans', value: data.engagement.segments.superFans, color: '#ef4444', desc: 'Highly active' },
                    { label: 'Active Fans', value: data.engagement.segments.activeFans, color: '#f59e0b', desc: 'Regular engagers' },
                    { label: 'Casual Viewers', value: data.engagement.segments.casualViewers, color: '#3b82f6', desc: 'Occasional visitors' },
                    { label: 'Dormant', value: data.engagement.segments.dormant, color: '#6b7280', desc: 'Inactive' },
                  ].map((seg, i) => (
                    <div key={i} className="text-center p-4 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                      <p className="text-2xl font-bold" style={{ color: seg.color }}>{formatNum(seg.value)}</p>
                      <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-primary)' }}>{seg.label}</p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{seg.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-20 rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
          <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>No audience data yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Start creating content to build your audience insights.</p>
        </div>
      )}
    </div>
  );
}
