'use client';

import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import {
  Lock, Megaphone, BarChart3, Sparkles, Building2,
  Calculator, Table, History, ArrowRight,
} from 'lucide-react';

export default function AdsUpgradeScreen() {
  const { user } = useAppSelector((s) => s.auth);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Blurred Preview */}
        <div className="relative rounded-2xl overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-6 blur-md opacity-50 pointer-events-none select-none">
            {[
              { label: 'Total Campaigns', value: '24', color: 'text-blue-400' },
              { label: 'Active Campaigns', value: '12', color: 'text-green-400' },
              { label: 'Ad Spend', value: '$8,420', color: 'text-amber-400' },
              { label: 'Impressions', value: '1.2M', color: 'text-cyan-400' },
              { label: 'Clicks', value: '45.2K', color: 'text-purple-400' },
              { label: 'Conversions', value: '2,340', color: 'text-pink-400' },
              { label: 'CTR', value: '3.8%', color: 'text-teal-400' },
              { label: 'ROI', value: '2.4x', color: 'text-orange-400' },
            ].map((item) => (
              <div key={item.label} className="card p-4">
                <p className="text-xs text-[var(--text-muted)]">{item.label}</p>
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

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
                <h2 className="text-2xl font-bold mb-2">Unlock Ads Insight Platform</h2>
                <p className="text-[var(--text-secondary)] text-sm">
                  Access powerful advertising tools, campaign management, AI recommendations, and business management.
                </p>
              </div>

              <div className="space-y-3 text-left">
                {[
                  { icon: <Megaphone className="w-4 h-4 text-blue-400" />, text: 'Full campaign management & creation' },
                  { icon: <BarChart3 className="w-4 h-4 text-green-400" />, text: 'Advanced reporting & analytics' },
                  { icon: <Sparkles className="w-4 h-4 text-purple-400" />, text: 'AI-powered ad recommendations' },
                  { icon: <Building2 className="w-4 h-4 text-amber-400" />, text: 'Business manager & team roles' },
                  { icon: <Calculator className="w-4 h-4 text-cyan-400" />, text: 'Media planner & audience estimates' },
                  { icon: <Table className="w-4 h-4 text-pink-400" />, text: 'Bulk editor for mass operations' },
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    {feature.icon}
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/settings?tab=subscription"
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
