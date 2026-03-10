'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';
import { adsAPI } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  DollarSign, TrendingUp, ArrowLeft, MousePointerClick, Eye,
  BarChart3, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import type { AdEarningsData } from '@/types';

const PERIOD_OPTIONS = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
];

export default function EarningsPage() {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [earnings, setEarnings] = useState<AdEarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  const fetchEarnings = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await adsAPI.getEarnings({ period });
      setEarnings(data.data);
    } catch (e: any) {
      console.error('Failed to fetch earnings:', e);
      if (e.response?.status !== 401) toast.error('Failed to load earnings');
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchEarnings();
  }, [isAuthenticated, fetchEarnings]);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-20">
        <p className="text-sm font-mono text-[var(--edith-text-dim)]">Please sign in.</p>
        <Link href="/login" className="btn-primary mt-4 inline-flex">Log In</Link>
      </div>
    );
  }

  const totals = earnings?.totals;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/ad-manager" className="inline-flex items-center gap-2 text-xs font-mono text-edith-cyan/60 hover:text-edith-cyan mb-4">
        <ArrowLeft className="w-3 h-3" /> Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-3" style={{ color: 'var(--edith-text)' }}>
            <div className="p-2 rounded-lg bg-green-500/10">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            Earnings & Analytics
          </h1>
          <p className="text-xs font-mono text-[var(--edith-text-dim)] mt-1 ml-[52px]">
            Revenue breakdown, campaign ROI, and cost metrics
          </p>
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: 'var(--edith-surface)' }}>
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                period === opt.value
                  ? 'text-edith-cyan bg-edith-cyan/10 border border-edith-cyan/30'
                  : 'text-[var(--edith-text-dim)] border border-transparent'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => <div key={i} className="card p-4 animate-pulse h-20" />)}
          </div>
          <div className="card p-6 animate-pulse h-72" />
        </div>
      ) : (
        <>
          {/* Totals */}
          {totals && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              {[
                { label: 'Total Budget', value: `$${totals.totalBudget}`, icon: DollarSign, color: 'text-blue-400' },
                { label: 'Total Spent', value: `$${totals.totalSpent}`, icon: DollarSign, color: 'text-red-400' },
                { label: 'Total Clicks', value: totals.totalClicks.toLocaleString(), icon: MousePointerClick, color: 'text-edith-cyan' },
                { label: 'Impressions', value: totals.totalImpressions.toLocaleString(), icon: Eye, color: 'text-purple-400' },
                { label: 'Avg CPC', value: `$${totals.avgCPC}`, icon: TrendingUp, color: 'text-amber-400' },
                { label: 'Avg CPM', value: `$${totals.avgCPM}`, icon: BarChart3, color: 'text-green-400' },
              ].map((card) => (
                <div key={card.label} className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
                    <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--edith-text-dim)]">{card.label}</span>
                  </div>
                  <p className="text-lg font-display font-bold" style={{ color: 'var(--edith-text)' }}>{card.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Revenue Timeline Chart */}
          <div className="card p-5 mb-8">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-4 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" /> Revenue Timeline
            </h3>
            {earnings?.revenueTimeline && earnings.revenueTimeline.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={earnings.revenueTimeline}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#888' }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 9, fill: '#888' }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 11 }}
                    formatter={(value) => [`$${value ?? 0}`, 'Revenue']}
                    labelStyle={{ color: '#22d3ee' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#10b981" fill="url(#revGrad)" strokeWidth={2} name="Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-xs font-mono text-[var(--edith-text-dim)]">
                No revenue data yet
              </div>
            )}
          </div>

          {/* Campaign Performance Table */}
          <div className="card p-5">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-4 flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5" /> Campaign Performance
            </h3>
            {earnings?.campaignPerformance && earnings.campaignPerformance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="text-[var(--edith-text-dim)] border-b border-[var(--edith-border)]">
                      <th className="text-left py-3 px-2">Campaign</th>
                      <th className="text-center py-3 px-2">Status</th>
                      <th className="text-right py-3 px-2">Impressions</th>
                      <th className="text-right py-3 px-2">Clicks</th>
                      <th className="text-right py-3 px-2">CTR</th>
                      <th className="text-right py-3 px-2">Budget</th>
                      <th className="text-right py-3 px-2">Spent</th>
                      <th className="text-right py-3 px-2">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.campaignPerformance.map((camp) => (
                      <tr key={camp._id} className="border-b border-[var(--edith-border)]/50 hover:bg-[var(--edith-surface)]">
                        <td className="py-3 px-2">
                          <Link href={`/ad-manager/${camp._id}/analytics`} className="text-edith-cyan hover:underline">
                            {camp.title}
                          </Link>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            camp.status === 'active' ? 'bg-green-500/10 text-green-400' :
                            camp.status === 'completed' ? 'bg-blue-500/10 text-blue-400' :
                            'bg-gray-500/10 text-gray-400'
                          }`}>
                            {camp.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right text-[var(--edith-text)]">{camp.impressions.toLocaleString()}</td>
                        <td className="py-3 px-2 text-right text-[var(--edith-text)]">{camp.clicks.toLocaleString()}</td>
                        <td className="py-3 px-2 text-right text-amber-400">{camp.ctr}%</td>
                        <td className="py-3 px-2 text-right text-[var(--edith-text)]">${camp.budget}</td>
                        <td className="py-3 px-2 text-right text-red-400">${camp.spent}</td>
                        <td className="py-3 px-2 text-right">
                          <span className={`flex items-center justify-end gap-0.5 ${Number(camp.roi) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {Number(camp.roi) > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {camp.roi}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs font-mono text-[var(--edith-text-dim)]">
                No campaign data yet
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
