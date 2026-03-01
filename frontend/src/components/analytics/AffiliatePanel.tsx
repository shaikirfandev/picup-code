'use client';

import { useEffect } from 'react';
import {
  Link2, MousePointerClick, DollarSign, AlertTriangle, Globe2,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchAffiliateAnalytics } from '@/store/slices/creatorAnalyticsSlice';
import AnimatedCounter from './AnimatedCounter';
import DeviceBreakdownChart from './charts/DeviceBreakdownChart';
import GeoChart from './charts/GeoChart';
import HourlyHeatmap from './charts/HourlyHeatmap';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from 'recharts';

interface Props {
  periodParams: Record<string, string>;
}

export default function AffiliatePanel({ periodParams }: Props) {
  const dispatch = useAppDispatch();
  const { affiliate: data, affiliateLoading: isLoading } = useAppSelector((s) => s.creatorAnalytics);

  useEffect(() => {
    dispatch(fetchAffiliateAnalytics(periodParams));
  }, [dispatch, periodParams.period, periodParams.startDate, periodParams.endDate]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-5 h-48 animate-pulse bg-[var(--surface)]" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card p-10 text-center text-[var(--text-secondary)]">
        <Link2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-lg font-medium">No affiliate data yet</p>
        <p className="text-sm mt-1">Add product links to your posts to start tracking affiliate performance.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <SummaryCard
          icon={<MousePointerClick className="w-5 h-5 text-blue-400" />}
          label="Total Clicks"
          value={data.totalClicks}
        />
        <SummaryCard
          icon={<MousePointerClick className="w-5 h-5 text-purple-400" />}
          label="Unique Clicks"
          value={data.uniqueClicks}
        />
        <SummaryCard
          icon={<DollarSign className="w-5 h-5 text-green-400" />}
          label="Est. Revenue"
          value={data.revenueEstimate}
          prefix="$"
          decimals={2}
        />
        <SummaryCard
          icon={<DollarSign className="w-5 h-5 text-amber-400" />}
          label="Est. Conversions"
          value={data.conversionEstimate}
        />
        <SummaryCard
          icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
          label="Suspicious"
          value={data.suspiciousClicks}
        />
      </div>

      {/* Daily Clicks Chart */}
      {data.dailyClicks && data.dailyClicks.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wider">
            Daily Affiliate Clicks
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.dailyClicks}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                tickFormatter={(d: string) => d.slice(5)}
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
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Total"
              />
              <Line
                type="monotone"
                dataKey="uniqueClicks"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
                name="Unique"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wider">
            Device Breakdown
          </h3>
          <DeviceBreakdownChart data={data.deviceBreakdown} />
        </div>

        {/* Geo Distribution */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wider">
            <Globe2 className="w-4 h-4 inline mr-1.5" />
            Click Geography
          </h3>
          <GeoChart data={data.geoDistribution} />
        </div>
      </div>

      {/* Hourly Distribution */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wider">
          Click Activity by Hour
        </h3>
        <HourlyHeatmap data={data.timeDistribution} />
      </div>

      {/* URL Performance Table */}
      {data.urlPerformance && data.urlPerformance.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wider">
            URL Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 pr-4 text-[var(--text-secondary)] font-medium">URL</th>
                  <th className="text-right py-2 px-3 text-[var(--text-secondary)] font-medium">Posts</th>
                  <th className="text-right py-2 px-3 text-[var(--text-secondary)] font-medium">Clicks</th>
                  <th className="text-right py-2 pl-3 text-[var(--text-secondary)] font-medium">Unique</th>
                </tr>
              </thead>
              <tbody>
                {data.urlPerformance.slice(0, 20).map((urlEntry) => (
                  <tr key={urlEntry.url} className="border-b border-[var(--border)]/50 hover:bg-[var(--surface)]">
                    <td className="py-2 pr-4 max-w-xs truncate">
                      <a
                        href={urlEntry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--accent)] hover:underline"
                        title={urlEntry.url}
                      >
                        {urlEntry.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 50)}
                      </a>
                    </td>
                    <td className="text-right py-2 px-3 tabular-nums">{urlEntry.postsCount}</td>
                    <td className="text-right py-2 px-3 tabular-nums font-medium">{urlEntry.clicks.toLocaleString()}</td>
                    <td className="text-right py-2 pl-3 tabular-nums">{urlEntry.uniqueClicks.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  prefix,
  decimals,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  prefix?: string;
  decimals?: number;
}) {
  return (
    <div className="card p-4 flex flex-col items-center text-center gap-2">
      {icon}
      <span className="text-xs text-[var(--text-secondary)]">{label}</span>
      <span className="text-xl font-bold tabular-nums">
        {prefix}
        {decimals !== undefined ? value.toFixed(decimals) : <AnimatedCounter value={value} />}
      </span>
    </div>
  );
}
