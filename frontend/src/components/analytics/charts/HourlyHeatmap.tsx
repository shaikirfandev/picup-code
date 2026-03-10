'use client';

import { useMemo } from 'react';

interface Props {
  /** 24-element array of counts (index 0 = midnight, 23 = 11pm) */
  data: number[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  const ampm = i < 12 ? 'a' : 'p';
  return `${h}${ampm}`;
});

export default function HourlyHeatmap({ data }: Props) {
  const { cells, maxVal } = useMemo(() => {
    const arr = data && data.length === 24 ? data : new Array(24).fill(0);
    const max = Math.max(...arr, 1);
    return { cells: arr, maxVal: max };
  }, [data]);

  const getColor = (val: number) => {
    const intensity = val / maxVal;
    if (intensity < 0.1) return 'bg-blue-500/10';
    if (intensity < 0.25) return 'bg-blue-500/25';
    if (intensity < 0.4) return 'bg-blue-500/40';
    if (intensity < 0.55) return 'bg-blue-400/55';
    if (intensity < 0.7) return 'bg-cyan-400/60';
    if (intensity < 0.85) return 'bg-cyan-400/75';
    return 'bg-cyan-300/90';
  };

  return (
    <div>
      <div className="grid grid-cols-12 gap-1 sm:grid-cols-24">
        {cells.map((val, i) => (
          <div key={i} className="group relative">
            <div
              className={`aspect-square rounded-sm ${getColor(val)} transition-all hover:ring-2 hover:ring-cyan-400 cursor-default`}
            />
            {/* Tooltip */}
            <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-[var(--panel)] border border-[var(--border)] rounded px-2 py-1 text-xs whitespace-nowrap shadow-lg">
                <span className="font-medium">{HOURS[i]}</span>: {val.toLocaleString()} events
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Hour labels */}
      <div className="grid grid-cols-12 sm:grid-cols-24 gap-1 mt-1">
        {HOURS.map((h, i) => (
          <span
            key={i}
            className={`text-center text-[9px] text-[var(--text-secondary)] ${i % 3 !== 0 ? 'hidden sm:block' : ''}`}
          >
            {i % 3 === 0 ? h : ''}
          </span>
        ))}
      </div>
      {/* Scale */}
      <div className="flex items-center justify-end gap-1 mt-3">
        <span className="text-[10px] text-[var(--text-secondary)] mr-1">Low</span>
        {['bg-blue-500/10', 'bg-blue-500/25', 'bg-blue-500/40', 'bg-cyan-400/55', 'bg-cyan-400/75', 'bg-cyan-300/90'].map((cls, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
        ))}
        <span className="text-[10px] text-[var(--text-secondary)] ml-1">High</span>
      </div>
    </div>
  );
}
