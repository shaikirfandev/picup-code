'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchAccountOverview, fetchCampaigns, fetchRecommendations } from '@/store/slices/adsInsightSlice';
import { formatNumber } from '@/lib/utils';
import {
  Megaphone, BarChart3, Sparkles, Building2, Calculator,
  Table, History, Eye, MousePointerClick, Target,
  DollarSign, TrendingUp, ArrowUpRight, ArrowRight,
  RefreshCw, ChevronRight,
} from 'lucide-react';
import type { AdAccountOverview, Campaign, AdRecommendation } from '@/types';

const periodOptions = [
  { label: 'Last 7 days', value: 'last7' },
  { label: 'Last 30 days', value: 'last30' },
  { label: 'Last 90 days', value: 'last90' },
];

export default function AdsInsightDashboard() {
  const dispatch = useAppDispatch();
  const { overview, campaigns, recommendations, loading } = useAppSelector((s) => s.adsInsight);
  const [period, setPeriod] = useState('last30');

  const handlePeriodChange = (p: string) => {
    setPeriod(p);
    dispatch(fetchAccountOverview({ period: p }));
  };

  const navItems = [
    { label: 'Campaigns', href: '/ads-insight-platform/campaigns', icon: <Megaphone className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Reports', href: '/ads-insight-platform/reports', icon: <BarChart3 className="w-5 h-5" />, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'AI Recommendations', href: '/ads-insight-platform/recommendations', icon: <Sparkles className="w-5 h-5" />, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Media Planner', href: '/ads-insight-platform/media-planner', icon: <Calculator className="w-5 h-5" />, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Bulk Editor', href: '/ads-insight-platform/bulk-editor', icon: <Table className="w-5 h-5" />, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { label: 'Activity History', href: '/ads-insight-platform/history', icon: <History className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Business Manager', href: '/ads-insight-platform/business', icon: <Building2 className="w-5 h-5" />, color: 'text-teal-400', bg: 'bg-teal-500/10' },
    { label: 'Catalogs', href: '/ads-insight-platform/business/catalogs', icon: <Target className="w-5 h-5" />, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  ];

  return (
    <div className="min-h-screen px-4 py-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-[var(--accent)]" />
            Ads Insight Platform
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Manage campaigns, view reports, and grow your advertising performance.
          </p>
        </div>
        <button
          onClick={() => {
            dispatch(fetchAccountOverview({ period }));
            dispatch(fetchCampaigns({ page: 1, limit: 10 }));
            dispatch(fetchRecommendations());
          }}
          className="btn-secondary flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {periodOptions.map((p) => (
          <button
            key={p.value}
            onClick={() => handlePeriodChange(p.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p.value
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Overview Cards */}
      {overview && <OverviewGrid overview={overview} />}

      {/* Navigation Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Tools & Features</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="card p-4 hover:border-[var(--accent)]/30 transition-all group"
            >
              <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center mb-3`}>
                <span className={item.color}>{item.icon}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Campaigns + Recommendations side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Campaigns */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Recent Campaigns</h3>
            <Link href="/ads-insight-platform/campaigns" className="text-sm text-[var(--accent)] flex items-center gap-1 hover:underline">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {campaigns.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-8 text-center">No campaigns yet. Create your first campaign to get started.</p>
          ) : (
            <div className="space-y-3">
              {campaigns.slice(0, 5).map((c) => (
                <CampaignRow key={c._id} campaign={c} />
              ))}
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              AI Recommendations
            </h3>
            <Link href="/ads-insight-platform/recommendations" className="text-sm text-[var(--accent)] flex items-center gap-1 hover:underline">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recommendations.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-8 text-center">Run some campaigns to get AI-powered recommendations.</p>
          ) : (
            <div className="space-y-3">
              {recommendations.slice(0, 4).map((r, i) => (
                <RecommendationRow key={i} rec={r} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewGrid({ overview }: { overview: AdAccountOverview }) {
  const cards = [
    { label: 'Total Campaigns', value: overview.totalCampaigns, icon: <Megaphone className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Active Campaigns', value: overview.activeCampaigns, icon: <TrendingUp className="w-5 h-5" />, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Ad Spend', value: overview.adSpend, icon: <DollarSign className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-500/10', prefix: '$' },
    { label: 'Impressions', value: overview.impressions, icon: <Eye className="w-5 h-5" />, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Clicks', value: overview.clicks, icon: <MousePointerClick className="w-5 h-5" />, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Conversions', value: overview.conversions, icon: <Target className="w-5 h-5" />, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { label: 'CTR', value: overview.ctr, icon: <ArrowUpRight className="w-5 h-5" />, color: 'text-teal-400', bg: 'bg-teal-500/10', suffix: '%' },
    { label: 'ROI', value: overview.roi, icon: <TrendingUp className="w-5 h-5" />, color: 'text-orange-400', bg: 'bg-orange-500/10', suffix: 'x' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="card p-4 space-y-3 hover:border-[var(--accent)]/20 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">{card.label}</span>
            <div className={`p-1.5 rounded-lg ${card.bg}`}>
              <span className={card.color}>{card.icon}</span>
            </div>
          </div>
          <p className="text-2xl font-bold">
            {card.prefix || ''}{formatNumber(card.value)}{card.suffix || ''}
          </p>
        </div>
      ))}
    </div>
  );
}

function CampaignRow({ campaign }: { campaign: Campaign }) {
  const statusColors: Record<string, string> = {
    active: 'bg-green-500/10 text-green-400',
    paused: 'bg-amber-500/10 text-amber-400',
    draft: 'bg-gray-500/10 text-gray-400',
    completed: 'bg-blue-500/10 text-blue-400',
    archived: 'bg-gray-500/10 text-gray-500',
    pending: 'bg-yellow-500/10 text-yellow-400',
    rejected: 'bg-red-500/10 text-red-400',
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{campaign.name}</p>
        <p className="text-xs text-[var(--text-muted)]">{campaign.objective} &middot; ${formatNumber(campaign.budget.spent)} spent</p>
      </div>
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[campaign.status] || ''}`}>
        {campaign.status}
      </span>
    </div>
  );
}

function RecommendationRow({ rec }: { rec: AdRecommendation }) {
  const priorityColors: Record<string, string> = {
    high: 'border-l-red-400',
    medium: 'border-l-amber-400',
    low: 'border-l-blue-400',
  };

  return (
    <div className={`border-l-2 ${priorityColors[rec.priority]} pl-3 py-1`}>
      <p className="font-medium text-sm">{rec.title}</p>
      <p className="text-xs text-[var(--text-muted)] line-clamp-2">{rec.description}</p>
      <span className="text-xs text-green-400">{rec.impact}</span>
    </div>
  );
}
