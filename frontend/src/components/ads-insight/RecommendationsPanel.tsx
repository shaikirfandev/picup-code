'use client';

import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchRecommendations } from '@/store/slices/adsInsightSlice';
import {
  Sparkles, ChevronLeft, RefreshCw,
  TrendingUp, Users, Image, Clock, MousePointerClick, FileWarning,
} from 'lucide-react';
import type { AdRecommendation } from '@/types';

const typeIcons: Record<string, React.ReactNode> = {
  increase_budget: <TrendingUp className="w-5 h-5" />,
  adjust_audience: <Users className="w-5 h-5" />,
  improve_creatives: <Image className="w-5 h-5" />,
  best_times: <Clock className="w-5 h-5" />,
  audience_insight: <Users className="w-5 h-5" />,
  landing_page: <FileWarning className="w-5 h-5" />,
};

const typeColors: Record<string, { text: string; bg: string }> = {
  increase_budget: { text: 'text-green-400', bg: 'bg-green-500/10' },
  adjust_audience: { text: 'text-blue-400', bg: 'bg-blue-500/10' },
  improve_creatives: { text: 'text-purple-400', bg: 'bg-purple-500/10' },
  best_times: { text: 'text-amber-400', bg: 'bg-amber-500/10' },
  audience_insight: { text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  landing_page: { text: 'text-red-400', bg: 'bg-red-500/10' },
};

const priorityBadge: Record<string, string> = {
  high: 'bg-red-500/10 text-red-400',
  medium: 'bg-amber-500/10 text-amber-400',
  low: 'bg-blue-500/10 text-blue-400',
};

export default function RecommendationsPanel() {
  const dispatch = useAppDispatch();
  const { recommendations, loading } = useAppSelector((s) => s.adsInsight);

  return (
    <div className="min-h-screen px-4 py-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/ads-insight-platform" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            AI Ad Recommendations
          </h1>
        </div>
        <button onClick={() => dispatch(fetchRecommendations())} className="btn-secondary flex items-center gap-2" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <p className="text-[var(--text-secondary)] text-sm">
        AI-powered suggestions to improve your campaign performance based on real data.
      </p>

      {recommendations.length === 0 ? (
        <div className="card p-12 text-center text-[var(--text-muted)]">
          <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No recommendations yet. Create and run campaigns to receive AI-powered suggestions.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec, i) => (
            <RecommendationCard key={i} rec={rec} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecommendationCard({ rec }: { rec: AdRecommendation }) {
  const colors = typeColors[rec.type] || { text: 'text-gray-400', bg: 'bg-gray-500/10' };
  const icon = typeIcons[rec.type] || <Sparkles className="w-5 h-5" />;

  return (
    <div className="card p-5 space-y-3 hover:border-[var(--accent)]/20 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colors.bg}`}>
            <span className={colors.text}>{icon}</span>
          </div>
          <div>
            <h3 className="font-semibold">{rec.title}</h3>
            <p className="text-xs text-[var(--text-muted)]">Campaign: {rec.campaignName}</p>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityBadge[rec.priority] || ''}`}>
          {rec.priority}
        </span>
      </div>

      <p className="text-sm text-[var(--text-secondary)]">{rec.description}</p>

      <div className="flex items-center gap-2">
        <TrendingUp className="w-3.5 h-3.5 text-green-400" />
        <span className="text-xs text-green-400 font-medium">{rec.impact}</span>
      </div>
    </div>
  );
}
