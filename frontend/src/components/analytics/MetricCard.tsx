'use client';

import AnimatedCounter from './AnimatedCounter';

interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  suffix?: string;
  prefix?: string;
  growth?: number;
}

export default function MetricCard({ label, value, icon, suffix, prefix, growth }: MetricCardProps) {
  return (
    <div className="card p-3.5 space-y-1.5">
      <div className="flex items-center gap-2 text-[var(--text-muted)]">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-bold">
        {prefix || ''}
        <AnimatedCounter value={value} decimals={suffix === '%' ? 1 : 0} />
        {suffix || ''}
      </p>
      {growth !== undefined && growth !== 0 && (
        <span className={`text-xs font-medium ${growth > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {growth > 0 ? '+' : ''}{growth}%
        </span>
      )}
    </div>
  );
}
