'use client';

import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import {
  Link2,
  TrendingUp,
  BarChart3,
  Globe,
  Lock,
  ArrowRight,
  Sparkles,
  MousePointerClick,
  Eye,
} from 'lucide-react';

export default function AffiliateUpgradePrompt() {
  const { summary, affiliatePosts } = useAppSelector((s) => s.affiliate);

  return (
    <div className="space-y-8">
      {/* Basic info card — visible to free users */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Your Affiliate Posts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[var(--surface)] rounded-xl p-4">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">
              Posts with Links
            </p>
            <p className="text-3xl font-bold">{summary?.totalAffiliatePosts || 0}</p>
          </div>
          <div className="bg-[var(--surface)] rounded-xl p-4">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">
              Create More
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--accent)] hover:underline mt-2"
            >
              Add a pin with affiliate links <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Post list (no analytics) */}
        {affiliatePosts.length > 0 && (
          <div className="mt-6 space-y-2">
            <h3 className="text-sm font-medium text-[var(--text-muted)]">Recent affiliate pins</h3>
            {affiliatePosts.slice(0, 5).map((post) => (
              <Link
                key={post._id}
                href={`/post/${post._id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--surface)] transition-colors"
              >
                {post.image?.url && (
                  <img
                    src={post.image.url}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{post.title}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {post.productUrl || post.affiliateLinks?.[0]?.url || 'No link'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Upgrade CTA */}
      <div className="card p-8 text-center border-2 border-dashed border-[var(--accent)]/30 bg-gradient-to-b from-[var(--accent)]/5 to-transparent">
        <div className="w-16 h-16 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-[var(--accent)]" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Unlock Affiliate Analytics</h2>
        <p className="text-[var(--text-muted)] max-w-md mx-auto mb-6">
          Upgrade to a paid plan to see how your affiliate links perform — track clicks,
          revenue estimates, geographic data, and more.
        </p>

        {/* Feature grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-2xl mx-auto">
          {[
            { icon: MousePointerClick, label: 'Click Tracking', desc: 'Total & unique clicks' },
            { icon: TrendingUp, label: 'Revenue Estimates', desc: 'Conversion projections' },
            { icon: Globe, label: 'Geo Analytics', desc: 'Where clicks come from' },
            { icon: BarChart3, label: 'Per-Post Stats', desc: 'Deep dive per pin' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-[var(--surface)] rounded-xl p-3 text-left">
              <Icon className="w-5 h-5 text-[var(--accent)] mb-2" />
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-[var(--text-muted)]">{desc}</p>
            </div>
          ))}
        </div>

        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          <Sparkles className="w-4 h-4" />
          Upgrade Now
        </Link>
      </div>

      {/* How it works */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">How Affiliate Marketing Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: '1',
              icon: Link2,
              title: 'Add Links to Pins',
              desc: 'When creating a pin, add your affiliate URL or multiple product links.',
            },
            {
              step: '2',
              icon: Eye,
              title: 'Users Click Your Links',
              desc: 'When viewers click your product links, each click is tracked automatically.',
            },
            {
              step: '3',
              icon: TrendingUp,
              title: 'Track Performance',
              desc: 'Paid users get detailed analytics: clicks, devices, locations, revenue.',
            },
          ].map(({ step, icon: Icon, title, desc }) => (
            <div key={step} className="text-center">
              <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-3">
                <Icon className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <h4 className="font-medium mb-1">{title}</h4>
              <p className="text-sm text-[var(--text-muted)]">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
