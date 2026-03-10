'use client';

import {
  Eye, Heart, Share2, Bookmark, MessageCircle,
  MousePointerClick, TrendingUp, DollarSign, Users, Link2,
} from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';
import type { CreatorOverview } from '@/types';

export default function OverviewCards({ overview }: { overview: CreatorOverview }) {
  const cards = [
    {
      label: 'Total Impressions',
      value: overview.impressions.value,
      growth: overview.impressions.growth,
      icon: <Eye className="w-5 h-5" />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Total Likes',
      value: overview.likes.value,
      growth: overview.likes.growth,
      icon: <Heart className="w-5 h-5" />,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
    },
    {
      label: 'Total Shares',
      value: overview.shares.value,
      growth: overview.shares.growth,
      icon: <Share2 className="w-5 h-5" />,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Total Saves',
      value: overview.saves.value,
      growth: overview.saves.growth,
      icon: <Bookmark className="w-5 h-5" />,
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/10',
    },
    {
      label: 'Total Comments',
      value: overview.comments.value,
      growth: overview.comments.growth,
      icon: <MessageCircle className="w-5 h-5" />,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Link Clicks',
      value: overview.clicks.value,
      growth: overview.clicks.growth,
      icon: <MousePointerClick className="w-5 h-5" />,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
    {
      label: 'Affiliate Clicks',
      value: overview.affiliateClicks.value,
      growth: overview.affiliateClicks.growth,
      icon: <Link2 className="w-5 h-5" />,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
    },
    {
      label: 'Est. Revenue',
      value: overview.estimatedRevenue.value,
      growth: overview.estimatedRevenue.growth,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      prefix: '$',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Total Posts" value={overview.totalPosts} />
        <SummaryCard label="Engagement Rate" value={overview.engagementRate} suffix="%" />
        <SummaryCard label="CTR" value={overview.ctr} suffix="%" />
        <SummaryCard label="Unique Views" value={overview.uniqueViews.value} growth={overview.uniqueViews.growth} />
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((card) => (
          <div key={card.label} className="card p-4 space-y-3 hover:border-[var(--accent)]/20 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">
                {card.label}
              </span>
              <div className={`p-1.5 rounded-lg ${card.bgColor}`}>
                <span className={card.color}>{card.icon}</span>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {card.prefix || ''}
                <AnimatedCounter value={card.value} />
              </p>
            </div>
            <GrowthBadge growth={card.growth} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, suffix, growth }: { label: string; value: number; suffix?: string; growth?: number }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
      <p className="text-xl font-bold">
        <AnimatedCounter value={value} />{suffix || ''}
      </p>
      {growth !== undefined && <GrowthBadge growth={growth} />}
    </div>
  );
}

function GrowthBadge({ growth }: { growth: number }) {
  if (growth === 0) return <span className="text-xs text-[var(--text-muted)]">No change</span>;

  const isPositive = growth > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
      isPositive ? 'text-green-400' : 'text-red-400'
    }`}>
      <TrendingUp className={`w-3 h-3 ${!isPositive ? 'rotate-180' : ''}`} />
      {isPositive ? '+' : ''}{growth}%
      <span className="text-[var(--text-muted)] ml-1">vs prev</span>
    </span>
  );
}
