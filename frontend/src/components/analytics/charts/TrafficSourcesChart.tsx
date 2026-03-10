'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const SOURCE_LABELS: Record<string, string> = {
  home_feed: 'Home Feed',
  search: 'Search',
  profile: 'Profile',
  external: 'External',
  direct: 'Direct',
  board: 'Board',
  share: 'Shared Link',
};

interface Props {
  data: Record<string, number>;
}

export default function TrafficSourcesChart({ data }: Props) {
  const chartData = useMemo(() => {
    return Object.entries(data)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([source, count]) => ({
        name: SOURCE_LABELS[source] || source,
        views: count,
      }));
  }, [data]);

  if (chartData.length === 0) {
    return <div className="h-64 flex items-center justify-center text-[var(--text-secondary)]">No data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
        <YAxis
          dataKey="name"
          type="category"
          width={80}
          tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value: any) => [Number(value).toLocaleString(), 'Views']}
        />
        <Bar dataKey="views" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
