'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { estimateMediaPlan, clearMediaPlanEstimate } from '@/store/slices/adsInsightSlice';
import { formatNumber } from '@/lib/utils';
import {
  Calculator, ChevronLeft, Eye, MousePointerClick, Target,
  DollarSign, Users, TrendingUp,
} from 'lucide-react';

const placementOptions = ['feed', 'sidebar', 'banner', 'search', 'stories'];

export default function MediaPlanner() {
  const dispatch = useAppDispatch();
  const { mediaPlanEstimate, loading } = useAppSelector((s) => s.adsInsight);

  const [form, setForm] = useState({
    budget: 1000,
    duration: 30,
    placements: ['feed'] as string[],
    ageMin: 18,
    ageMax: 65,
    locations: '',
  });

  const handleEstimate = () => {
    dispatch(estimateMediaPlan({
      budget: form.budget,
      duration: form.duration,
      placement: form.placements,
      audience: {
        ageMin: form.ageMin,
        ageMax: form.ageMax,
        locations: form.locations ? form.locations.split(',').map((l) => l.trim()) : [],
      },
    }));
  };

  const togglePlacement = (p: string) => {
    setForm((prev) => ({
      ...prev,
      placements: prev.placements.includes(p)
        ? prev.placements.filter((x) => x !== p)
        : [...prev.placements, p],
    }));
  };

  return (
    <div className="min-h-screen px-4 py-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/ads-insight-platform" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calculator className="w-6 h-6 text-cyan-400" />
          Media Planner
        </h1>
      </div>

      <p className="text-[var(--text-secondary)] text-sm">
        Simulate campaigns before launching. Estimate reach, impressions, and costs based on your budget and audience.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold">Campaign Parameters</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1 block">Total Budget ($)</label>
              <input
                type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: +e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1 block">Duration (days)</label>
              <input
                type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: +e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--text-muted)] mb-2 block">Placements</label>
            <div className="flex flex-wrap gap-2">
              {placementOptions.map((p) => (
                <button
                  key={p}
                  onClick={() => togglePlacement(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    form.placements.includes(p)
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1 block">Age Min</label>
              <input
                type="number" value={form.ageMin} onChange={(e) => setForm({ ...form, ageMin: +e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1 block">Age Max</label>
              <input
                type="number" value={form.ageMax} onChange={(e) => setForm({ ...form, ageMax: +e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Locations (comma-separated)</label>
            <input
              type="text" value={form.locations} onChange={(e) => setForm({ ...form, locations: e.target.value })}
              placeholder="US, UK, India"
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm"
            />
          </div>

          <button onClick={handleEstimate} disabled={loading} className="btn-primary w-full">
            {loading ? 'Estimating...' : 'Estimate Campaign'}
          </button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {mediaPlanEstimate ? (
            <>
              <h3 className="font-semibold">Estimated Results</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Est. Audience Size', value: formatNumber(mediaPlanEstimate.audienceSize), icon: <Users className="w-4 h-4 text-blue-400" /> },
                  { label: 'Est. Impressions', value: formatNumber(mediaPlanEstimate.estimatedImpressions), icon: <Eye className="w-4 h-4 text-cyan-400" /> },
                  { label: 'Est. Reach', value: formatNumber(mediaPlanEstimate.estimatedReach), icon: <TrendingUp className="w-4 h-4 text-green-400" /> },
                  { label: 'Est. Clicks', value: formatNumber(mediaPlanEstimate.estimatedClicks), icon: <MousePointerClick className="w-4 h-4 text-purple-400" /> },
                  { label: 'Est. Conversions', value: formatNumber(mediaPlanEstimate.estimatedConversions), icon: <Target className="w-4 h-4 text-pink-400" /> },
                  { label: 'Est. CPC', value: `$${mediaPlanEstimate.estimatedCPC}`, icon: <DollarSign className="w-4 h-4 text-amber-400" /> },
                  { label: 'Est. CPM', value: `$${mediaPlanEstimate.estimatedCPM.toFixed(2)}`, icon: <DollarSign className="w-4 h-4 text-orange-400" /> },
                  { label: 'Daily Budget', value: `$${mediaPlanEstimate.dailyBudget}`, icon: <DollarSign className="w-4 h-4 text-teal-400" /> },
                ].map((m) => (
                  <div key={m.label} className="card p-4 space-y-2">
                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                      {m.icon}
                      <span className="text-xs">{m.label}</span>
                    </div>
                    <p className="text-xl font-bold">{m.value}</p>
                  </div>
                ))}
              </div>

              <button onClick={() => dispatch(clearMediaPlanEstimate())} className="btn-secondary w-full">
                Clear & Start Over
              </button>
            </>
          ) : (
            <div className="card p-12 text-center text-[var(--text-muted)] h-full flex flex-col items-center justify-center">
              <Calculator className="w-12 h-12 mb-4 opacity-50" />
              <p>Set your campaign parameters and click &ldquo;Estimate&rdquo; to see projected results.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
