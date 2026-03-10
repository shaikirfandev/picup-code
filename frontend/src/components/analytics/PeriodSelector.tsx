'use client';

import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

interface PeriodSelectorProps {
  period: string;
  onPeriodChange: (period: string) => void;
  onCustomRange: (range: { startDate?: string; endDate?: string }) => void;
}

const PERIODS = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: '90d', label: '90 Days' },
  { id: 'custom', label: 'Custom' },
];

export default function PeriodSelector({ period, onPeriodChange, onCustomRange }: PeriodSelectorProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handlePeriodChange = (p: string) => {
    onPeriodChange(p);
    if (p === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
    }
  };

  const applyCustomRange = () => {
    if (startDate && endDate) {
      onCustomRange({ startDate, endDate });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex bg-[var(--surface)] rounded-lg p-0.5 border border-[var(--border)]">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => handlePeriodChange(p.id)}
            className={`px-3 py-1.5 text-sm rounded-md transition-all ${
              period === p.id
                ? 'bg-[var(--accent)] text-white font-medium shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input-field text-sm w-auto"
          />
          <span className="text-[var(--text-muted)]">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input-field text-sm w-auto"
          />
          <button
            onClick={applyCustomRange}
            className="btn-primary text-sm px-3 py-1.5"
            disabled={!startDate || !endDate}
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
