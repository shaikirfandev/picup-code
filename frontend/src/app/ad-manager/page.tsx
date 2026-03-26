'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';
import { adsAPI } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  BarChart3, Plus, Eye, MousePointerClick, TrendingUp, DollarSign,
  Wallet, Settings, PieChart, Activity, Zap, Target, LayoutGrid,
  CreditCard, ChevronRight
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell
} from 'recharts';
import type { AdDashboardData } from '@/types';

const PERIOD_OPTIONS = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
];

const PIE_COLORS = ['#22d3ee', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdManagerPage() {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [dashboard, setDashboard] = useState<AdDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  const fetchDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await adsAPI.getDashboard({ period });
      setDashboard(data.data);
    } catch (e: any) {
      console.error('Failed to fetch dashboard:', e);
      if (e.response?.status !== 401) toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchDashboard();
  }, [isAuthenticated, fetchDashboard]);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-20">
        <p className="text-sm font-mono text-[var(--edith-text-dim)]">Please sign in to manage ads.</p>
        <Link href="/login" className="btn-primary mt-4 inline-flex">Log In</Link>
      </div>
    );
  }

  const stats = dashboard?.stats;
  const statCards = stats ? [
    { label: 'Total Campaigns', value: stats.totalAds, icon: LayoutGrid, color: 'text-edith-cyan', bgColor: 'bg-edith-cyan/10' },
    { label: 'Active Ads', value: stats.activeAds, icon: Zap, color: 'text-green-400', bgColor: 'bg-green-400/10' },
    { label: 'Total Clicks', value: stats.totalClicks.toLocaleString(), icon: MousePointerClick, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
    { label: 'Impressions', value: stats.totalImpressions.toLocaleString(), icon: Eye, color: 'text-purple-400', bgColor: 'bg-purple-400/10' },
    { label: 'CTR', value: `${stats.ctr}%`, icon: TrendingUp, color: 'text-amber-400', bgColor: 'bg-amber-400/10' },
    { label: 'Total Spent', value: `$${stats.totalSpent}`, icon: DollarSign, color: 'text-red-400', bgColor: 'bg-red-400/10' },
  ] : [];

  const quickLinks = [
    { href: '/ad-manager/create', label: 'Post New Ad', icon: Plus, desc: 'Launch a new campaign' },
    { href: '/ad-manager/manage', label: 'Manage Ads', icon: Settings, desc: 'Edit & control campaigns' },
    { href: '/ad-manager/earnings', label: 'Earnings', icon: DollarSign, desc: 'Revenue & performance' },
    { href: '/wallet', label: 'Ad Wallet', icon: Wallet, desc: 'Top-up & withdrawals' },
    { href: '/ad-manager/payments', label: 'Payment Methods', icon: CreditCard, desc: 'Cards & billing' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-3" style={{ color: 'var(--edith-text)' }}>
            <div className="p-2 rounded-lg bg-edith-cyan/10">
              <BarChart3 className="w-6 h-6 text-edith-cyan" />
            </div>
            Ad Dashboard
          </h1>
          <p className="text-xs font-mono text-[var(--edith-text-dim)] mt-1 ml-[52px]">
            Self-serve advertising platform — your campaigns at a glance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: 'var(--edith-surface)' }}>
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                  period === opt.value
                    ? 'text-edith-cyan bg-edith-cyan/10 border border-edith-cyan/30'
                    : 'text-[var(--edith-text-dim)] border border-transparent hover:text-[var(--edith-text)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Link href="/ad-manager/create" className="btn-primary gap-2">
            <Plus className="w-4 h-4" /> New Campaign
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="skeleton h-3 w-16 rounded mb-3" />
                <div className="skeleton h-6 w-20 rounded" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6 animate-pulse h-72" />
            <div className="card p-6 animate-pulse h-72" />
          </div>
        </div>
      ) : (
        <>
          {/* Quick Link Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="card p-4 group hover:border-edith-cyan/30 transition-all duration-200"
              >
                <link.icon className="w-5 h-5 text-edith-cyan/60 group-hover:text-edith-cyan transition-colors mb-2" />
                <p className="text-xs font-mono font-semibold" style={{ color: 'var(--edith-text)' }}>
                  {link.label}
                </p>
                <p className="text-[9px] font-mono text-[var(--edith-text-dim)] mt-0.5">{link.desc}</p>
              </Link>
            ))}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {statCards.map((card) => (
              <div key={card.label} className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded ${card.bgColor}`}>
                    <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--edith-text-dim)]">
                    {card.label}
                  </span>
                </div>
                <p className="text-xl font-display font-bold" style={{ color: 'var(--edith-text)' }}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Click Trends */}
            <div className="card p-5 lg:col-span-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-4 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" /> Click & Impression Trends
              </h3>
              {dashboard?.clickTrends && dashboard.clickTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={dashboard.clickTrends}>
                    <defs>
                      <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="impGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#888' }} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 9, fill: '#888' }} />
                    <Tooltip
                      contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 11 }}
                      labelStyle={{ color: '#22d3ee' }}
                    />
                    <Area type="monotone" dataKey="impressions" stroke="#8b5cf6" fill="url(#impGrad)" strokeWidth={2} name="Impressions" />
                    <Area type="monotone" dataKey="clicks" stroke="#22d3ee" fill="url(#clickGrad)" strokeWidth={2} name="Clicks" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-60 flex items-center justify-center text-xs font-mono text-[var(--edith-text-dim)]">
                  No trend data yet
                </div>
              )}
            </div>

            {/* Status Breakdown Pie */}
            <div className="card p-5">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-4 flex items-center gap-2">
                <PieChart className="w-3.5 h-3.5" /> Campaign Status
              </h3>
              {dashboard?.statusBreakdown && Object.keys(dashboard.statusBreakdown).length > 0 ? (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={180}>
                    <RechartsPie>
                      <Pie
                        data={Object.entries(dashboard.statusBreakdown).map(([name, value]) => ({ name, value }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {Object.entries(dashboard.statusBreakdown).map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 11 }}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3 mt-2 justify-center">
                    {Object.entries(dashboard.statusBreakdown).map(([name, value], idx) => (
                      <div key={name} className="flex items-center gap-1.5 text-[9px] font-mono">
                        <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                        <span className="text-[var(--edith-text-dim)] capitalize">{name}: {value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-xs font-mono text-[var(--edith-text-dim)]">
                  No campaigns yet
                </div>
              )}
            </div>
          </div>

          {/* Category Performance */}
          {dashboard?.categoryPerformance && dashboard.categoryPerformance.length > 0 && (
            <div className="card p-5 mb-8">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-4 flex items-center gap-2">
                <Target className="w-3.5 h-3.5" /> Category Performance
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dashboard.categoryPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#888' }} />
                  <YAxis tick={{ fontSize: 9, fill: '#888' }} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 11 }}
                  />
                  <Bar dataKey="clicks" fill="#22d3ee" radius={[4, 4, 0, 0]} name="Clicks" />
                  <Bar dataKey="impressions" fill="#8b5cf640" radius={[4, 4, 0, 0]} name="Impressions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent Active Ads */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-edith-cyan/60 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" /> Recent Active Campaigns
              </h3>
              <Link href="/ad-manager/manage" className="text-[10px] font-mono text-edith-cyan/60 hover:text-edith-cyan flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {dashboard?.recentActiveAds && dashboard.recentActiveAds.length > 0 ? (
              <div className="space-y-3">
                {dashboard.recentActiveAds.map((ad) => (
                  <Link
                    key={ad._id}
                    href={`/ad-manager/${ad._id}/analytics`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--edith-surface)] transition-colors group"
                  >
                    {ad.image?.url ? (
                      <img src={ad.image.url} alt="" className="w-12 h-12 rounded object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-edith-cyan/10 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-edith-cyan/40" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--edith-text)' }}>
                        {ad.title}
                      </p>
                      <div className="flex items-center gap-3 text-[9px] font-mono text-[var(--edith-text-dim)] mt-0.5">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {ad.impressions}</span>
                        <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" /> {ad.clicks}</span>
                        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {ad.ctr}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-bold text-edith-cyan">${ad.campaign?.spent || 0}</p>
                      <p className="text-[9px] font-mono text-[var(--edith-text-dim)]">/{ad.campaign?.budget} {ad.campaign?.currency}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--edith-text-dim)] group-hover:text-edith-cyan transition-colors" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <BarChart3 className="w-10 h-10 mx-auto text-edith-cyan/20 mb-3" />
                <p className="text-xs font-mono text-[var(--edith-text-dim)] mb-3">No active campaigns</p>
                <Link href="/ad-manager/create" className="btn-primary gap-2 inline-flex text-xs">
                  <Plus className="w-3 h-3" /> Create Your First Ad
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
