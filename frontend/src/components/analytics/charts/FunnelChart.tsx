'use client';

import { useMemo } from 'react';

interface FunnelStep {
  label: string;
  value: number;
  color: string;
}

interface Props {
  impressions: number;
  clicks: number;
  likes: number;
  shares: number;
  saves: number;
}

export default function FunnelChart({ impressions, clicks, likes, shares, saves }: Props) {
  const steps: FunnelStep[] = useMemo(() => {
    return [
      { label: 'Impressions', value: impressions, color: '#3b82f6' },
      { label: 'Clicks', value: clicks, color: '#8b5cf6' },
      { label: 'Likes', value: likes, color: '#ec4899' },
      { label: 'Shares', value: shares, color: '#f59e0b' },
      { label: 'Saves', value: saves, color: '#10b981' },
    ];
  }, [impressions, clicks, likes, shares, saves]);

  const maxValue = Math.max(impressions, 1);

  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const widthPercent = Math.max((step.value / maxValue) * 100, 8);
        const convRate = i > 0 && steps[i - 1].value > 0
          ? ((step.value / steps[i - 1].value) * 100).toFixed(1)
          : null;

        return (
          <div key={step.label} className="flex items-center gap-3">
            <span className="text-xs w-20 text-right text-[var(--text-secondary)] flex-shrink-0">
              {step.label}
            </span>
            <div className="flex-1 relative">
              <div
                className="h-8 rounded-md flex items-center px-3 transition-all duration-500"
                style={{
                  width: `${widthPercent}%`,
                  backgroundColor: step.color,
                  minWidth: '60px',
                }}
              >
                <span className="text-white text-xs font-medium">
                  {step.value.toLocaleString()}
                </span>
              </div>
            </div>
            <span className="text-xs w-14 text-[var(--text-secondary)] flex-shrink-0">
              {convRate !== null ? `${convRate}%` : ''}
            </span>
          </div>
        );
      })}
      {/* Overall conversion */}
      <div className="pt-2 border-t border-[var(--border)] flex justify-between text-xs text-[var(--text-secondary)]">
        <span>Overall conversion</span>
        <span className="font-medium">
          {impressions > 0 ? ((saves / impressions) * 100).toFixed(2) : '0'}% (Impressions → Saves)
        </span>
      </div>
    </div>
  );
}
