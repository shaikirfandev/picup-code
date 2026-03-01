'use client';

import { useMemo } from 'react';

interface CountryEntry {
  country: string;
  count: number;
  percentage?: number;
}

interface Props {
  data: CountryEntry[];
}

const FLAG_EMOJI: Record<string, string> = {
  US: '🇺🇸', GB: '🇬🇧', CA: '🇨🇦', AU: '🇦🇺', DE: '🇩🇪', FR: '🇫🇷',
  IN: '🇮🇳', BR: '🇧🇷', JP: '🇯🇵', KR: '🇰🇷', MX: '🇲🇽', ES: '🇪🇸',
  IT: '🇮🇹', NL: '🇳🇱', SE: '🇸🇪', NO: '🇳🇴', PL: '🇵🇱', RU: '🇷🇺',
  CN: '🇨🇳', PH: '🇵🇭', ID: '🇮🇩', NG: '🇳🇬', ZA: '🇿🇦', AR: '🇦🇷',
  Unknown: '🌍',
};

export default function GeoChart({ data }: Props) {
  const processed = useMemo(() => {
    if (!data || data.length === 0) return [];
    const total = data.reduce((s, d) => s + d.count, 0);
    return [...data]
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
      .map((d) => ({
        ...d,
        percentage: total > 0 ? (d.count / total) * 100 : 0,
      }));
  }, [data]);

  if (processed.length === 0) {
    return <div className="h-64 flex items-center justify-center text-[var(--text-secondary)]">No data</div>;
  }

  const maxCount = processed[0]?.count || 1;

  return (
    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
      {processed.map((item) => (
        <div key={item.country} className="flex items-center gap-3">
          <span className="text-lg w-7 text-center flex-shrink-0">
            {FLAG_EMOJI[item.country] || '🏳️'}
          </span>
          <span className="text-sm w-20 truncate text-[var(--text-secondary)]">{item.country}</span>
          <div className="flex-1 h-5 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono w-14 text-right text-[var(--text-secondary)]">
            {item.count.toLocaleString()}
          </span>
          <span className="text-xs font-mono w-12 text-right tabular-nums">
            {item.percentage.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}
