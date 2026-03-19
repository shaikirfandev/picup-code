'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchUser } from '@/store/slices/authSlice';
import { paymentAPI } from '@/lib/api';
import { Check, Crown, Zap, Building2, ArrowRight, Loader2, BarChart3, Users, Sparkles, Shield, Globe, HeadphonesIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 4.99,
    period: '/mo',
    description: 'For creators getting started with analytics',
    icon: <Zap className="w-6 h-6" />,
    color: 'from-blue-500 to-cyan-500',
    borderColor: 'border-blue-500/20',
    features: [
      'Post-level analytics & insights',
      'Impression & engagement tracking',
      'Up to 50 posts tracked',
      'Weekly performance reports',
      'Basic export (CSV)',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    period: '/mo',
    description: 'For serious creators who want full control',
    icon: <Crown className="w-6 h-6" />,
    color: 'from-purple-500 to-pink-500',
    borderColor: 'border-purple-500/30',
    popular: true,
    features: [
      'Everything in Basic',
      'Unlimited posts tracked',
      'Affiliate link analytics & revenue',
      'Real-time live counters',
      'AI-powered posting suggestions',
      'Advanced export & API access',
      'Priority support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 29.99,
    period: '/mo',
    description: 'For teams and professional brands',
    icon: <Building2 className="w-6 h-6" />,
    color: 'from-amber-500 to-orange-500',
    borderColor: 'border-amber-500/20',
    features: [
      'Everything in Pro',
      'Multi-user team access',
      'Custom branding & white-label',
      'Dedicated account manager',
      'Advanced API & webhooks',
      'Custom analytics dashboards',
      'SSO & enhanced security',
      'SLA guarantee',
    ],
  },
];

export default function UpgradePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const currentPlan = user?.subscription?.plan || 'none';
  const isPaid = user?.accountType === 'paid';

  const handleSubscribe = async (planId: string) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (currentPlan === planId && isPaid) {
      toast('You\'re already on this plan!', { icon: '✅' });
      return;
    }

    setSubscribing(planId);
    try {
      await paymentAPI.subscribe({ plan: planId });
      await dispatch(fetchUser());
      toast.success(`Successfully upgraded to ${planId.charAt(0).toUpperCase() + planId.slice(1)}!`);
      router.push('/analytics');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Subscription failed. Please try again.');
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <div className="min-h-screen px-4 py-12" style={{ background: 'var(--background)' }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>
            Upgrade your mepiks
          </h1>
          <p className="text-base max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Unlock powerful analytics, affiliate tools, and AI features to grow your creative presence.
          </p>
          {isPaid && (
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-sm font-medium"
              style={{ background: 'var(--accent-muted)', color: 'var(--foreground)' }}>
              <Crown className="w-4 h-4" />
              Current plan: <span className="capitalize font-semibold">{currentPlan}</span>
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => {
            const isCurrentPlan = isPaid && currentPlan === plan.id;
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border transition-all ${
                  plan.popular ? 'scale-[1.02] md:scale-105 shadow-lg' : ''
                } ${isCurrentPlan ? 'ring-2' : ''}`}
                style={{
                  background: 'var(--surface)',
                  borderColor: plan.popular ? 'var(--accent)' : 'var(--border)',
                  ...(isCurrentPlan ? { '--tw-ring-color': 'var(--accent)' } as any : {}),
                }}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ background: 'var(--accent)' }}>
                    Most Popular
                  </div>
                )}

                <div className="p-6 pt-8">
                  {/* Icon + Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-white`}>
                      {plan.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{plan.name}</h3>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{plan.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-4xl font-bold" style={{ color: 'var(--foreground)' }}>${plan.price}</span>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{plan.period}</span>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={subscribing !== null || isCurrentPlan}
                    className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      isCurrentPlan
                        ? 'opacity-60 cursor-default'
                        : plan.popular
                          ? 'text-white hover:opacity-90'
                          : 'hover:opacity-80'
                    }`}
                    style={
                      isCurrentPlan
                        ? { background: 'var(--surface-hover)', color: 'var(--text-secondary)' }
                        : plan.popular
                          ? { background: 'var(--accent)', color: 'var(--text-on-accent)' }
                          : { background: 'var(--accent-muted)', color: 'var(--foreground)' }
                    }
                  >
                    {subscribing === plan.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : (
                      <>
                        {isPaid ? 'Switch Plan' : 'Get Started'}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Features */}
                  <div className="mt-6 pt-6 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-sm">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature comparison highlights */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>Why upgrade?</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>All paid plans include these core benefits</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {[
            { icon: <BarChart3 className="w-5 h-5" />, title: 'Deep Analytics', desc: 'Track every impression, like, share, and click on your posts' },
            { icon: <Sparkles className="w-5 h-5" />, title: 'AI Suggestions', desc: 'Get AI-powered recommendations for the best times to post' },
            { icon: <Globe className="w-5 h-5" />, title: 'Affiliate Tools', desc: 'Manage affiliate links and track click-through revenue' },
            { icon: <Shield className="w-5 h-5" />, title: 'Priority Support', desc: 'Get help faster with dedicated support for paid members' },
            { icon: <Users className="w-5 h-5" />, title: 'Audience Insights', desc: 'Understand who engages with your content and when' },
            { icon: <HeadphonesIcon className="w-5 h-5" />, title: 'Cancel Anytime', desc: 'No long-term commitment. Upgrade or downgrade as you need' },
          ].map((item, i) => (
            <div
              key={i}
              className="rounded-xl p-5 border transition-colors"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                style={{ background: 'var(--accent-muted)', color: 'var(--foreground)' }}>
                {item.icon}
              </div>
              <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--foreground)' }}>{item.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* FAQ-style note */}
        <div className="text-center text-xs pb-8" style={{ color: 'var(--text-muted)' }}>
          <p>Payments are currently in demo mode. No real charges will be made.</p>
          <p className="mt-1">Have questions? Contact us at support@mepiks.com</p>
        </div>
      </div>
    </div>
  );
}
