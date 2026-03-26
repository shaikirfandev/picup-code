'use client';

import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import { BarChart3, Lock, TrendingUp, Eye, DollarSign, Zap, ArrowRight } from 'lucide-react';

export default function UpgradeScreen() {
  const { user } = useAppSelector((s) => s.auth);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Blurred Preview */}
        <div className="relative rounded-2xl overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-6 blur-md opacity-50 pointer-events-none select-none">
            {[
              { label: 'Impressions', value: '124.5K', color: 'text-blue-400' },
              { label: 'Likes', value: '18.2K', color: 'text-pink-400' },
              { label: 'Clicks', value: '3.4K', color: 'text-cyan-400' },
              { label: 'Revenue', value: '$842', color: 'text-green-400' },
              { label: 'Engagement', value: '14.6%', color: 'text-purple-400' },
              { label: 'Shares', value: '2.1K', color: 'text-amber-400' },
              { label: 'Saves', value: '5.8K', color: 'text-teal-400' },
              { label: 'CTR', value: '2.7%', color: 'text-orange-400' },
            ].map((item) => (
              <div key={item.label} className="card p-4">
                <p className="text-xs text-[var(--text-muted)]">{item.label}</p>
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Blurred chart preview */}
          <div className="px-6 pb-6 blur-md opacity-50 pointer-events-none select-none">
            <div className="card p-6 h-48 flex items-end gap-1">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-[var(--accent)]/30 rounded-t"
                  style={{ height: `${20 + Math.random() * 80}%` }}
                />
              ))}
            </div>
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg)]/60 backdrop-blur-sm">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 max-w-md mx-4 space-y-6 shadow-xl">
              <div className="w-16 h-16 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8 text-[var(--accent)]" />
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-2">Unlock Creator Analytics</h2>
                <p className="text-[var(--text-secondary)] text-sm">
                  Get deep insights into your content performance, audience behavior, and affiliate revenue.
                </p>
              </div>

              <div className="space-y-3 text-left">
                {[
                  { icon: <Eye className="w-4 h-4 text-blue-400" />, text: 'Post-level impression & engagement tracking' },
                  { icon: <TrendingUp className="w-4 h-4 text-green-400" />, text: 'Real-time analytics with live counters' },
                  { icon: <DollarSign className="w-4 h-4 text-amber-400" />, text: 'Affiliate click & revenue analytics' },
                  { icon: <Zap className="w-4 h-4 text-purple-400" />, text: 'AI-powered posting time suggestions' },
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    {feature.icon}
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/upgrade"
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                Upgrade to Pro
                <ArrowRight className="w-4 h-4" />
              </Link>

              <p className="text-xs text-[var(--text-muted)]">
                Starting at $9.99/mo &middot; Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
