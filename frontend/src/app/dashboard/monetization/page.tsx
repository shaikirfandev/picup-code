'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store';
import { fetchMonetization, enableMonetization, setPeriod } from '@/store/slices/creatorDashboardSlice';
import {
  DollarSign, TrendingUp, Wallet, CreditCard, Gift, ArrowUp, ArrowDown,
  Star, Clock, CheckCircle, XCircle, Eye, Heart, Zap,
} from 'lucide-react';

const periods = [
  { label: 'Today', value: 'today' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
];

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K';
  return '$' + n.toFixed(2);
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

const revenueTypeLabels: Record<string, string> = {
  ad_revenue: 'Ad Revenue',
  sponsorship: 'Sponsorships',
  donation: 'Donations',
  tip: 'Tips',
  subscription: 'Subscriptions',
  premium_content: 'Premium Content',
  affiliate: 'Affiliates',
};

const revenueTypeColors: Record<string, string> = {
  ad_revenue: '#3b82f6',
  sponsorship: '#8b5cf6',
  donation: '#ec4899',
  tip: '#f97316',
  subscription: '#10b981',
  premium_content: '#06b6d4',
  affiliate: '#f59e0b',
};

const statusIcons: Record<string, React.ElementType> = {
  completed: CheckCircle,
  pending: Clock,
  failed: XCircle,
};
const statusColors: Record<string, string> = {
  completed: '#10b981',
  pending: '#f59e0b',
  failed: '#ef4444',
};

export default function MonetizationPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { monetization, monetizationLoading, period } = useSelector((state: RootState) => state.creatorDashboard);
  const [enabling, setEnabling] = useState(false);

  useEffect(() => {
    dispatch(fetchMonetization({ period }));
  }, [dispatch, period]);

  const handleEnableMonetization = async () => {
    setEnabling(true);
    await dispatch(enableMonetization());
    dispatch(fetchMonetization({ period }));
    setEnabling(false);
  };

  const data = monetization;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Monetization Center</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Track your earnings, manage payouts, and grow your revenue.
          </p>
        </div>
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border-primary)' }}>
          {periods.map((p) => (
            <button key={p.value} onClick={() => dispatch(setPeriod(p.value))}
              className="px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                background: period === p.value ? 'var(--accent-primary)' : 'var(--bg-surface)',
                color: period === p.value ? 'var(--bg-primary)' : 'var(--text-secondary)',
              }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {monetizationLoading && !data ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl animate-pulse" style={{ background: 'var(--bg-surface)' }} />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Revenue Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Revenue', value: formatCurrency(data.earnings?.totalRevenue || 0), icon: DollarSign, color: '#10b981',
                change: data.earnings?.revenueGrowth },
              { label: 'Pending Payout', value: formatCurrency(data.payouts?.pendingBalance || 0), icon: Clock, color: '#f59e0b' },
              { label: 'Wallet Balance', value: formatCurrency(data.wallet?.balance || 0), icon: Wallet, color: '#3b82f6' },
              { label: 'Lifetime Payouts', value: formatCurrency(data.payouts?.lifetimePayouts || 0), icon: TrendingUp, color: '#8b5cf6' },
            ].map((stat, i) => (
              <div key={i} className="rounded-xl p-4 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                  {stat.change !== undefined && (
                    <span className="flex items-center text-xs font-medium" style={{ color: stat.change >= 0 ? '#10b981' : '#ef4444' }}>
                      {stat.change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      {Math.abs(stat.change).toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Earnings by Type */}
            {data.earnings?.revenueByType && data.earnings.revenueByType.length > 0 && (
              <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <DollarSign className="w-4 h-4" style={{ color: '#10b981' }} /> Earnings Breakdown
                </h3>
                <div className="space-y-3">
                  {(() => {
                    const total = data.earnings.revenueByType.reduce((s, t) => s + t.total, 0) || 1;
                    return data.earnings.revenueByType.map((type) => {
                      const pct = (type.total / total) * 100;
                      const color = revenueTypeColors[type.type] || '#6b7280';
                      return (
                        <div key={type.type} className="flex items-center gap-3">
                          <span className="text-xs w-28 truncate text-right" style={{ color: 'var(--text-secondary)' }}>
                            {revenueTypeLabels[type.type] || type.type}
                          </span>
                          <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                            <div className="h-full rounded-full transition-all flex items-center px-2"
                              style={{ width: `${Math.max(pct, 3)}%`, background: color }}>
                              <span className="text-[10px] font-bold text-white truncate">
                                {pct >= 10 ? `${pct.toFixed(0)}%` : ''}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs font-mono w-16 text-right" style={{ color: 'var(--text-primary)' }}>
                            {formatCurrency(type.total)}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* Revenue Timeline */}
            {data.timeline && data.timeline.length > 0 && (
              <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <TrendingUp className="w-4 h-4" style={{ color: '#3b82f6' }} /> Revenue Timeline
                </h3>
                <div className="flex items-end gap-1 h-40">
                  {data.timeline.map((d, i) => {
                    const max = Math.max(...data.timeline.map(t => t.amount), 1);
                    const height = (d.amount / max) * 100;
                    return (
                      <div key={i} className="flex-1 group relative">
                        <div className="w-full rounded-t-sm transition-all hover:opacity-80"
                          style={{
                            height: `${height}%`,
                            background: `linear-gradient(to top, #10b981, rgba(16, 185, 129, 0.4))`,
                            minHeight: d.amount > 0 ? '4px' : '0',
                          }} />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                          <div className="rounded-lg p-2 text-xs shadow-lg whitespace-nowrap"
                            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}>
                            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{d.date}</p>
                            <p style={{ color: '#10b981' }}>{formatCurrency(d.amount)}</p>
                            <p style={{ color: 'var(--text-tertiary)' }}>{d.transactions} txns</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-1 mt-1">
                  {data.timeline.map((d, i) => (
                    <div key={i} className="flex-1 text-center text-[9px]" style={{ color: 'var(--text-tertiary)' }}>
                      {i % Math.max(Math.floor(data.timeline.length / 7), 1) === 0
                        ? new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })
                        : ''}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Earning Posts */}
            {data.topEarningPosts && data.topEarningPosts.length > 0 && (
              <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Star className="w-4 h-4" style={{ color: '#f59e0b' }} /> Top Earning Posts
                </h3>
                <div className="space-y-3">
                  {data.topEarningPosts.slice(0, 5).map((item, i) => (
                    <div key={item._id || i} className="flex items-center gap-3 p-2 rounded-lg transition-all hover:opacity-90"
                      style={{ background: 'var(--bg-elevated)' }}>
                      <span className="text-sm font-bold w-6 text-center" style={{ color: 'var(--text-tertiary)' }}>#{i + 1}</span>
                      {item.post?.image?.thumbnailUrl ? (
                        <img src={item.post.image.thumbnailUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--bg-surface)' }}>
                          <DollarSign className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.post?.title}</p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {item.transactions} transactions
                        </p>
                      </div>
                      <p className="text-sm font-bold" style={{ color: '#10b981' }}>{formatCurrency(item.totalRevenue)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payout History */}
            {data.payouts?.history && data.payouts.history.length > 0 && (
              <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <CreditCard className="w-4 h-4" style={{ color: '#3b82f6' }} /> Recent Payouts
                </h3>
                <div className="space-y-2">
                  {data.payouts.history.slice(0, 6).map((payout) => {
                    const StatusIcon = statusIcons[payout.status] || Clock;
                    return (
                      <div key={payout._id} className="flex items-center justify-between p-3 rounded-lg border"
                        style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-elevated)' }}>
                        <div className="flex items-center gap-3">
                          <StatusIcon className="w-5 h-5" style={{ color: statusColors[payout.status] || '#6b7280' }} />
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                              {formatCurrency(payout.amount)}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              {payout.payoutMethod} · {new Date(payout.paidAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs capitalize px-2 py-1 rounded-full"
                          style={{
                            background: `${statusColors[payout.status] || '#6b7280'}20`,
                            color: statusColors[payout.status] || '#6b7280',
                          }}>
                          {payout.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Donations */}
            {data.recentDonations && data.recentDonations.length > 0 && (
              <div className="rounded-xl border p-5 lg:col-span-2" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Gift className="w-4 h-4" style={{ color: '#ec4899' }} /> Recent Donations & Tips
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {data.recentDonations.slice(0, 6).map((d) => (
                    <div key={d._id} className="flex items-center gap-3 p-3 rounded-lg border"
                      style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-elevated)' }}>
                      {d.donor?.avatar ? (
                        <img src={d.donor.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-surface)' }}>
                          <Gift className="w-4 h-4" style={{ color: '#ec4899' }} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {d.donor?.displayName || d.donor?.username || 'Anonymous'}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {new Date(d.createdAt).toLocaleDateString()}
                        </p>
                        {d.donorMessage && (
                          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>"{d.donorMessage}"</p>
                        )}
                      </div>
                      <p className="text-sm font-bold" style={{ color: '#ec4899' }}>{formatCurrency(d.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Enable Monetization CTA (if not enabled) */}
          {!data.profile?.monetizationEnabled && (
            <div className="rounded-xl border p-8 text-center" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
              <Zap className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--accent-primary)' }} />
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Start Earning</h3>
              <p className="text-sm mb-4 max-w-md mx-auto" style={{ color: 'var(--text-tertiary)' }}>
                Enable monetization to start earning from your content through ads, sponsorships, tips, and more.
              </p>
              <button
                onClick={handleEnableMonetization}
                disabled={enabling}
                className="px-6 py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-50"
                style={{ background: 'var(--accent-primary)', color: 'var(--bg-primary)' }}>
                {enabling ? 'Enabling...' : 'Enable Monetization'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
          <DollarSign className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>No monetization data</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Start creating content and enable monetization to see earnings.</p>
        </div>
      )}
    </div>
  );
}
