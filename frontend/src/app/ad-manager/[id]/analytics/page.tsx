'use client';

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { adsAPI } from '@/lib/api';
import Link from 'next/link';
import {
  ArrowLeft, Eye, MousePointerClick, Heart, Share2, BarChart3,
  TrendingUp, DollarSign, ExternalLink, Monitor, Globe, Calendar
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import type { AdAnalyticsData } from '@/types';

const PIE_COLORS = ['#22d3ee', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function AdAnalyticsPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [data, setData] = useState<AdAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const { data: res } = await adsAPI.getAnalytics(id);
        setData(res.data);
      } catch { /* empty */ } finally {
        setLoading(false);
      }
    })();
  }, [id, isAuthenticated]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="card p-4 animate-pulse h-24" />)}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-sm font-mono text-[var(--edith-text-dim)]">Ad not found.</p>
        <Link href="/ad-manager" className="btn-primary mt-4 inline-flex">Back</Link>
      </div>
    );
  }

  const { ad, totals, dailyStats, eventAnalytics } = data;

  const metrics = [
    { label: 'Impressions', value: totals.impressions.toLocaleString(), icon: Eye, color: 'text-blue-400' },
    { label: 'Clicks', value: totals.clicks.toLocaleString(), icon: MousePointerClick, color: 'text-edith-cyan' },
    { label: 'CTR', value: `${totals.ctr}%`, icon: TrendingUp, color: 'text-green-400' },
    { label: 'Views', value: totals.views.toLocaleString(), icon: BarChart3, color: 'text-purple-400' },
    { label: 'Likes', value: totals.likes.toLocaleString(), icon: Heart, color: 'text-pink-400' },
    { label: 'Shares', value: totals.shares.toLocaleString(), icon: Share2, color: 'text-amber-400' },
    { label: 'Budget', value: `$${totals.budget}`, icon: DollarSign, color: 'text-emerald-400' },
    { label: 'Spent', value: `$${totals.spent}`, icon: DollarSign, color: 'text-red-400' },
  ];

  const budgetUsedPct = totals.budget > 0 ? Math.min(100, (totals.spent / totals.budget) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/ad-manager/manage" className="inline-flex items-center gap-2 text-xs font-mono text-edith-cyan/60 hover:text-edith-cyan mb-6">
        <ArrowLeft className="w-3 h-3" /> Back to Manage Ads
      </Link>

      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-display font-bold mb-1" style={{ color: 'var(--edith-text)' }}>{ad.title}</h1>
            <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--edith-text-dim)] mt-2">
              <span>Placement: {ad.placement}</span>
              {ad.promotionType && <span className="text-purple-400">Type: {ad.promotionType}</span>}
              {ad.campaign.startDate && <span>Start: {new Date(ad.campaign.startDate).toLocaleDateString()}</span>}
              {ad.campaign.endDate && <span>End: {new Date(ad.campaign.endDate).toLocaleDateString()}</span>}
            </div>
          </div>
          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            ad.status === 'active' ? 'bg-green-500/10 text-green-400' :
            ad.status === 'paused' ? 'bg-amber-500/10 text-amber-400' :
            ad.status === 'completed' ? 'bg-blue-500/10 text-blue-400' :
            'bg-[var(--edith-surface)] text-[var(--edith-text-dim)]'
          }`}>
            {ad.status}
          </span>
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
      <div className="card p-5 mb-6">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-3">Budget Usage</h3>
        <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--edith-surface)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${budgetUsedPct}%`,
              background: budgetUsedPct > 90 ? '#ef4444' : budgetUsedPct > 60 ? '#f59e0b' : '#22d3ee',
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono mt-2 text-[var(--edith-text-dim)]">
          <span>{budgetUsedPct.toFixed(1)}% used</span>
          <span>${totals.spent} / ${totals.budget}</span>
        </div>
      </div>

      {/* Daily Performance Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-4 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" /> Daily Performance
          </h3>
          {dailyStats && dailyStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dailyStats}>
                <defs>
                  <linearGradient id="dailyClickGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#888' }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tick={{ fontSize: 9, fill: '#888' }} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: '#22d3ee' }}
                />
                <Area type="monotone" dataKey="impressions" stroke="#8b5cf6" fill="url(#dailyClickGrad)" strokeWidth={1.5} name="Impressions" />
                <Area type="monotone" dataKey="clicks" stroke="#22d3ee" strokeWidth={2} fill="none" name="Clicks" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-xs font-mono text-[var(--edith-text-dim)]">
              No daily data yet
            </div>
          )}
        </div>

        {/* Event-based daily chart */}
        <div className="card p-5">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-4 flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5" /> Event Analytics
          </h3>
          {eventAnalytics?.daily && eventAnalytics.daily.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={eventAnalytics.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#888' }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tick={{ fontSize: 9, fill: '#888' }} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 11 }}
                />
                <Bar dataKey="impressions" fill="#8b5cf6" radius={[2, 2, 0, 0]} name="Impressions" />
                <Bar dataKey="clicks" fill="#22d3ee" radius={[2, 2, 0, 0]} name="Clicks" />
                <Bar dataKey="views" fill="#10b981" radius={[2, 2, 0, 0]} name="Views" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-xs font-mono text-[var(--edith-text-dim)]">
              No event data yet
            </div>
          )}
        </div>
      </div>

      {/* Device & Geo Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Devices */}
        <div className="card p-5">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-4 flex items-center gap-2">
            <Monitor className="w-3.5 h-3.5" /> Device Breakdown
          </h3>
          {eventAnalytics?.devices && eventAnalytics.devices.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie
                    data={eventAnalytics.devices.map((d) => ({ name: d._id || 'Unknown', value: d.count }))}
                    cx="50%" cy="50%" innerRadius={35} outerRadius={65}
                    paddingAngle={3} dataKey="value"
                  >
                    {eventAnalytics.devices.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {eventAnalytics.devices.map((d, idx) => (
                  <div key={d._id} className="flex items-center gap-2 text-[10px] font-mono">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <span className="text-[var(--edith-text-dim)] capitalize">{d._id || 'Unknown'}</span>
                    <span style={{ color: 'var(--edith-text)' }}>{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-xs font-mono text-[var(--edith-text-dim)]">
              No device data
            </div>
          )}
        </div>

        {/* Geo */}
        <div className="card p-5">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-4 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" /> Geographic Distribution
          </h3>
          {eventAnalytics?.geo && eventAnalytics.geo.length > 0 ? (
            <div className="space-y-2">
              {eventAnalytics.geo.slice(0, 10).map((g, idx) => {
                const maxCount = eventAnalytics.geo[0]?.count || 1;
                const pct = (g.count / maxCount) * 100;
                return (
                  <div key={g._id} className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-[var(--edith-text-dim)] w-20 truncate">
                      {g._id || 'Unknown'}
                    </span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--edith-surface)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                    </div>
                    <span className="text-[10px] font-mono" style={{ color: 'var(--edith-text)' }}>{g.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-xs font-mono text-[var(--edith-text-dim)]">
              No geo data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
