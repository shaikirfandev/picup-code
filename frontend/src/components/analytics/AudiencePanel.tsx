'use client';

import { useEffect } from 'react';
import { Globe2, Monitor, Smartphone, Tablet, Users, UserPlus, UserCheck } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchAudienceInsights } from '@/store/slices/creatorAnalyticsSlice';
import AnimatedCounter from './AnimatedCounter';
import DeviceBreakdownChart from './charts/DeviceBreakdownChart';
import GeoChart from './charts/GeoChart';

interface Props {
  periodParams: Record<string, string>;
}

export default function AudiencePanel({ periodParams }: Props) {
  const dispatch = useAppDispatch();
  const { audience: data, audienceLoading: isLoading } = useAppSelector((s) => s.creatorAnalytics);

  useEffect(() => {
    dispatch(fetchAudienceInsights(periodParams));
  }, [dispatch, periodParams.period, periodParams.startDate, periodParams.endDate]);

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
        <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-lg font-medium">No audience data yet</p>
        <p className="text-sm mt-1">Once you get views on your posts, audience insights will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Viewer Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ViewerCard
          icon={<Users className="w-5 h-5 text-blue-400" />}
          label="Total Viewers"
          value={data.viewerBreakdown.total}
        />
        <ViewerCard
          icon={<UserPlus className="w-5 h-5 text-green-400" />}
          label="New Viewers"
          value={data.viewerBreakdown.new}
          percentage={data.viewerBreakdown.total > 0
            ? (data.viewerBreakdown.new / data.viewerBreakdown.total) * 100
            : 0}
        />
        <ViewerCard
          icon={<UserCheck className="w-5 h-5 text-purple-400" />}
          label="Returning Viewers"
          value={data.viewerBreakdown.returning}
          percentage={data.viewerBreakdown.total > 0
            ? (data.viewerBreakdown.returning / data.viewerBreakdown.total) * 100
            : 0}
        />
      </div>

      {/* Follower vs Non-follower */}
      {data.followerEngagement && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wider">
            Engagement Source
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[var(--text-secondary)]">From Followers</span>
                <span className="font-medium">{data.followerEngagement.fromFollowers.toLocaleString()}</span>
              </div>
              <div className="h-3 bg-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      (data.followerEngagement.fromFollowers + data.followerEngagement.fromNonFollowers) > 0
                        ? (data.followerEngagement.fromFollowers /
                            (data.followerEngagement.fromFollowers + data.followerEngagement.fromNonFollowers)) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[var(--text-secondary)]">From Non-Followers</span>
                <span className="font-medium">{data.followerEngagement.fromNonFollowers.toLocaleString()}</span>
              </div>
              <div className="h-3 bg-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      (data.followerEngagement.fromFollowers + data.followerEngagement.fromNonFollowers) > 0
                        ? (data.followerEngagement.fromNonFollowers /
                            (data.followerEngagement.fromFollowers + data.followerEngagement.fromNonFollowers)) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geographic Distribution */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wider">
            <Globe2 className="w-4 h-4 inline mr-1.5" />
            Top Locations
          </h3>
          <GeoChart data={data.locationDistribution} />
        </div>

        {/* Device Usage */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wider">
            Device Usage
          </h3>
          <DeviceBreakdownChart data={data.deviceUsage} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Browser Distribution */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wider">
            Browser Distribution
          </h3>
          <DistributionList data={data.browserDistribution} labelKey="browser" />
        </div>

        {/* OS Distribution */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wider">
            Operating System
          </h3>
          <DistributionList data={data.osDistribution} labelKey="os" />
        </div>
      </div>

      {/* Activity Heatmap (7×24) */}
      {data.activeTimeHeatmap && data.activeTimeHeatmap.length === 7 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wider">
            Audience Activity Heatmap
          </h3>
          <WeeklyHeatmap data={data.activeTimeHeatmap} />
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function ViewerCard({
  icon,
  label,
  value,
  percentage,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  percentage?: number;
}) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className="p-2.5 rounded-xl bg-[var(--surface)]">{icon}</div>
      <div>
        <p className="text-xs text-[var(--text-secondary)]">{label}</p>
        <p className="text-xl font-bold tabular-nums">
          <AnimatedCounter value={value} />
        </p>
        {percentage !== undefined && (
          <p className="text-xs text-[var(--text-secondary)]">{percentage.toFixed(1)}%</p>
        )}
      </div>
    </div>
  );
}

function DistributionList({
  data,
  labelKey,
}: {
  data: { [key: string]: any; count: number }[];
  labelKey: string;
}) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-[var(--text-secondary)]">No data</p>;
  }

  const sorted = [...data].sort((a, b) => b.count - a.count);
  const max = sorted[0]?.count || 1;
  const total = sorted.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-2 max-h-[260px] overflow-y-auto">
      {sorted.slice(0, 10).map((item) => (
        <div key={item[labelKey]} className="flex items-center gap-3">
          <span className="text-sm w-24 truncate text-[var(--text-secondary)]">{item[labelKey]}</span>
          <div className="flex-1 h-4 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500/70 rounded-full transition-all duration-500"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono w-10 text-right tabular-nums">{item.count}</span>
          <span className="text-xs font-mono w-11 text-right text-[var(--text-secondary)]">
            {total > 0 ? ((item.count / total) * 100).toFixed(1) : 0}%
          </span>
        </div>
      ))}
    </div>
  );
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS_LABEL = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  return `${h}${i < 12 ? 'a' : 'p'}`;
});

function WeeklyHeatmap({ data }: { data: number[][] }) {
  const maxVal = Math.max(...data.flat(), 1);

  const getColor = (val: number) => {
    const intensity = val / maxVal;
    if (intensity < 0.1) return 'bg-blue-500/5';
    if (intensity < 0.2) return 'bg-blue-500/15';
    if (intensity < 0.35) return 'bg-blue-500/30';
    if (intensity < 0.5) return 'bg-blue-400/45';
    if (intensity < 0.65) return 'bg-cyan-400/55';
    if (intensity < 0.8) return 'bg-cyan-400/70';
    return 'bg-cyan-300/85';
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Hour labels */}
        <div className="flex mb-1 pl-10">
          {HOURS_LABEL.map((h, i) => (
            <span
              key={i}
              className="flex-1 text-center text-[9px] text-[var(--text-secondary)]"
            >
              {i % 3 === 0 ? h : ''}
            </span>
          ))}
        </div>
        {/* Rows */}
        {data.map((row, dayIdx) => (
          <div key={dayIdx} className="flex items-center gap-1 mb-1">
            <span className="text-[10px] text-[var(--text-secondary)] w-9 text-right pr-1">
              {DAYS[dayIdx]}
            </span>
            {row.map((val, hourIdx) => (
              <div key={hourIdx} className="group relative flex-1">
                <div
                  className={`aspect-square rounded-sm ${getColor(val)} transition-all hover:ring-1 hover:ring-cyan-400`}
                />
                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-[var(--panel)] border border-[var(--border)] rounded px-2 py-1 text-[10px] whitespace-nowrap shadow-lg">
                    {DAYS[dayIdx]} {HOURS_LABEL[hourIdx]}: {val.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        {/* Scale */}
        <div className="flex items-center justify-end gap-1 mt-3">
          <span className="text-[10px] text-[var(--text-secondary)] mr-1">Low</span>
          {['bg-blue-500/5', 'bg-blue-500/15', 'bg-blue-500/30', 'bg-cyan-400/55', 'bg-cyan-400/70', 'bg-cyan-300/85'].map(
            (cls, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
            ),
          )}
          <span className="text-[10px] text-[var(--text-secondary)] ml-1">High</span>
        </div>
      </div>
    </div>
  );
}
