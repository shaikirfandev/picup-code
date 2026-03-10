'use client';

import { useState, useEffect, use } from 'react';
import { useAppSelector } from '@/store/hooks';
import { adsAPI } from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, Eye, MousePointerClick, Heart, Share2, BarChart3, TrendingUp, DollarSign, ExternalLink } from 'lucide-react';

interface AdAnalytics {
  _id: string;
  title: string;
  description: string;
  redirectUrl: string;
  placement: string;
  status: string;
  isPaid: boolean;
  campaign: { name: string; startDate: string; endDate: string; budget: number; spent: number; currency: string };
  analytics: { impressions: number; clicks: number; likes: number; shares: number; views: number; ctr: number };
  createdAt: string;
}

export default function AdAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [ad, setAd] = useState<AdAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const { data } = await adsAPI.getAd(id);
        setAd(data.data);
      } catch {
        // error handled by UI
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isAuthenticated]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="text-center py-20">
        <p className="text-sm font-mono text-[var(--edith-text-dim)]">Ad not found.</p>
        <Link href="/ad-manager" className="btn-primary mt-4 inline-flex">Back</Link>
      </div>
    );
  }

  const metrics = [
    { label: 'Impressions', value: ad.analytics.impressions.toLocaleString(), icon: Eye, color: 'text-blue-400' },
    { label: 'Clicks', value: ad.analytics.clicks.toLocaleString(), icon: MousePointerClick, color: 'text-edith-cyan' },
    { label: 'CTR', value: `${ad.analytics.ctr.toFixed(2)}%`, icon: TrendingUp, color: 'text-green-400' },
    { label: 'Views', value: ad.analytics.views.toLocaleString(), icon: BarChart3, color: 'text-purple-400' },
    { label: 'Likes', value: ad.analytics.likes.toLocaleString(), icon: Heart, color: 'text-pink-400' },
    { label: 'Shares', value: ad.analytics.shares.toLocaleString(), icon: Share2, color: 'text-amber-400' },
    { label: 'Budget', value: `${ad.campaign.currency === 'INR' ? '₹' : '$'}${ad.campaign.budget}`, icon: DollarSign, color: 'text-emerald-400' },
    { label: 'Spent', value: `${ad.campaign.currency === 'INR' ? '₹' : '$'}${ad.campaign.spent}`, icon: DollarSign, color: 'text-red-400' },
  ];

  const budgetUsedPct = ad.campaign.budget > 0 ? Math.min(100, (ad.campaign.spent / ad.campaign.budget) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link href="/ad-manager" className="inline-flex items-center gap-2 text-xs font-mono text-edith-cyan/60 hover:text-edith-cyan mb-6">
        <ArrowLeft className="w-3 h-3" /> Back to Ad Manager
      </Link>

      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-display font-bold mb-1" style={{ color: 'var(--edith-text)' }}>{ad.title}</h1>
            <p className="text-xs font-mono text-[var(--edith-text-dim)]">{ad.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
              ad.status === 'active' ? 'bg-green-500/10 text-green-400' :
              ad.status === 'paused' ? 'bg-amber-500/10 text-amber-400' :
              'bg-[var(--edith-surface)] text-[var(--edith-text-dim)]'
            }`}>
              {ad.status}
            </span>
            <a href={ad.redirectUrl} target="_blank" rel="noopener noreferrer" className="text-edith-cyan/60 hover:text-edith-cyan">
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
        <div className="mt-4 flex gap-4 text-[10px] font-mono text-[var(--edith-text-dim)]">
          <span>Placement: {ad.placement}</span>
          <span>Campaign: {ad.campaign.name}</span>
          {ad.campaign.startDate && <span>Start: {new Date(ad.campaign.startDate).toLocaleDateString()}</span>}
          {ad.campaign.endDate && <span>End: {new Date(ad.campaign.endDate).toLocaleDateString()}</span>}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {metrics.map((m) => (
          <div key={m.label} className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={`w-4 h-4 ${m.color}`} />
              <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--edith-text-dim)]">{m.label}</span>
            </div>
            <p className="text-lg font-display font-bold" style={{ color: 'var(--edith-text)' }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Budget Bar */}
      <div className="card p-5">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-3">Budget Usage</h3>
        <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--edith-surface)' }}>
          <div className="h-full rounded-full transition-all duration-500"
               style={{ width: `${budgetUsedPct}%`, background: budgetUsedPct > 90 ? '#ef4444' : budgetUsedPct > 60 ? '#f59e0b' : '#22d3ee' }} />
        </div>
        <div className="flex justify-between text-[10px] font-mono mt-2 text-[var(--edith-text-dim)]">
          <span>{budgetUsedPct.toFixed(1)}% used</span>
          <span>{ad.campaign.currency === 'INR' ? '₹' : '$'}{ad.campaign.spent} / {ad.campaign.currency === 'INR' ? '₹' : '$'}{ad.campaign.budget}</span>
        </div>
      </div>
    </div>
  );
}
