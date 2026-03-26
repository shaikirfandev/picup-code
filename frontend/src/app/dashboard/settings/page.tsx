'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store';
import { fetchCreatorProfile, updateCreatorProfile } from '@/store/slices/creatorDashboardSlice';
import {
  Settings, Bell, Shield, DollarSign, Target, Palette, Save,
  CheckCircle, AlertCircle, Eye, EyeOff, CreditCard, Mail,
  MessageCircle, TrendingUp, Users, Zap,
} from 'lucide-react';

type SectionKey = 'monetization' | 'payout' | 'moderation' | 'notifications' | 'goals' | 'dashboard';

const sections: { key: SectionKey; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'monetization', label: 'Monetization', icon: DollarSign, color: '#10b981' },
  { key: 'payout', label: 'Payout Settings', icon: CreditCard, color: '#3b82f6' },
  { key: 'moderation', label: 'Comment Moderation', icon: Shield, color: '#8b5cf6' },
  { key: 'notifications', label: 'Notifications', icon: Bell, color: '#f59e0b' },
  { key: 'goals', label: 'Goals', icon: Target, color: '#ec4899' },
  { key: 'dashboard', label: 'Dashboard Preferences', icon: Palette, color: '#06b6d4' },
];

export default function SettingsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { creatorProfile, creatorProfileLoading } = useSelector((state: RootState) => state.creatorDashboard);

  const [activeSection, setActiveSection] = useState<SectionKey>('monetization');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    dispatch(fetchCreatorProfile());
  }, [dispatch]);

  useEffect(() => {
    if (creatorProfile) {
      setForm({ ...creatorProfile });
    }
  }, [creatorProfile]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await dispatch(updateCreatorProfile(form));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateField = (path: string, value: any) => {
    setForm((prev: any) => {
      const copy = { ...prev };
      const keys = path.split('.');
      let obj = copy;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return copy;
    });
  };

  const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <button onClick={() => onChange(!checked)} className="relative w-11 h-6 rounded-full transition-all"
        style={{ background: checked ? 'var(--accent-primary)' : 'var(--bg-elevated)' }}>
        <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
          style={{ left: checked ? '22px' : '2px' }} />
      </button>
    </div>
  );

  const InputField = ({ label, value, onChange, type = 'text', placeholder = '' }: {
    label: string; value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string;
  }) => (
    <div className="space-y-1">
      <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg text-sm border"
        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Settings className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
            Dashboard Settings
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Customize your creator dashboard experience.
          </p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
          style={{ background: saved ? '#10b981' : 'var(--accent-primary)', color: 'var(--bg-primary)' }}>
          {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="flex gap-6 flex-col md:flex-row">
        {/* Section nav */}
        <nav className="md:w-48 flex-shrink-0">
          <div className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
            {sections.map((s) => (
              <button key={s.key} onClick={() => setActiveSection(s.key)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all"
                style={{
                  background: activeSection === s.key ? `${s.color}15` : 'transparent',
                  color: activeSection === s.key ? s.color : 'var(--text-tertiary)',
                }}>
                <s.icon className="w-4 h-4" />
                {s.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 rounded-xl border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
          {creatorProfileLoading && !creatorProfile ? (
            <div className="h-64 animate-pulse rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
          ) : (
            <>
              {/* Monetization */}
              {activeSection === 'monetization' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <DollarSign className="w-5 h-5" style={{ color: '#10b981' }} /> Monetization Settings
                  </h3>
                  <Toggle
                    label="Enable Monetization"
                    checked={form.monetization?.enabled || false}
                    onChange={(v) => updateField('monetization.enabled', v)}
                  />
                  <Toggle
                    label="Accept Donations"
                    checked={form.monetization?.acceptDonations || false}
                    onChange={(v) => updateField('monetization.acceptDonations', v)}
                  />
                  <Toggle
                    label="Accept Tips"
                    checked={form.monetization?.acceptTips || false}
                    onChange={(v) => updateField('monetization.acceptTips', v)}
                  />
                  <Toggle
                    label="Enable Subscriptions"
                    checked={form.monetization?.subscriptionsEnabled || false}
                    onChange={(v) => updateField('monetization.subscriptionsEnabled', v)}
                  />
                  <Toggle
                    label="Show Ads on Content"
                    checked={form.monetization?.showAds || false}
                    onChange={(v) => updateField('monetization.showAds', v)}
                  />

                  {form.monetization?.subscriptionsEnabled && (
                    <div className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--border-primary)' }}>
                      <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Subscription Tiers</h4>
                      {(form.monetization?.subscriptionTiers || []).map((tier: any, i: number) => (
                        <div key={i} className="p-3 rounded-lg space-y-2" style={{ background: 'var(--bg-elevated)' }}>
                          <InputField label="Tier Name" value={tier.name || ''}
                            onChange={(v) => {
                              const tiers = [...(form.monetization?.subscriptionTiers || [])];
                              tiers[i] = { ...tiers[i], name: v };
                              updateField('monetization.subscriptionTiers', tiers);
                            }} />
                          <InputField label="Price ($/month)" value={tier.price || ''}
                            type="number"
                            onChange={(v) => {
                              const tiers = [...(form.monetization?.subscriptionTiers || [])];
                              tiers[i] = { ...tiers[i], price: parseFloat(v) || 0 };
                              updateField('monetization.subscriptionTiers', tiers);
                            }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Payout */}
              {activeSection === 'payout' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <CreditCard className="w-5 h-5" style={{ color: '#3b82f6' }} /> Payout Settings
                  </h3>
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Payout Method</label>
                    <select
                      value={form.payoutSettings?.method || 'paypal'}
                      onChange={(e) => updateField('payoutSettings.method', e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg text-sm border"
                      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                      <option value="paypal">PayPal</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="stripe">Stripe</option>
                      <option value="crypto">Cryptocurrency</option>
                    </select>
                  </div>
                  <InputField label="PayPal Email / Account ID" value={form.payoutSettings?.accountId || ''}
                    onChange={(v) => updateField('payoutSettings.accountId', v)} placeholder="your@email.com" />
                  <InputField label="Minimum Payout Amount ($)" value={form.payoutSettings?.minimumPayout || 25}
                    type="number" onChange={(v) => updateField('payoutSettings.minimumPayout', parseFloat(v) || 25)} />
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Payout Schedule</label>
                    <select
                      value={form.payoutSettings?.schedule || 'monthly'}
                      onChange={(e) => updateField('payoutSettings.schedule', e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg text-sm border"
                      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Moderation */}
              {activeSection === 'moderation' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Shield className="w-5 h-5" style={{ color: '#8b5cf6' }} /> Comment Moderation
                  </h3>
                  <Toggle
                    label="Auto-approve comments"
                    checked={form.commentModeration?.autoApprove || false}
                    onChange={(v) => updateField('commentModeration.autoApprove', v)}
                  />
                  <Toggle
                    label="Filter profanity"
                    checked={form.commentModeration?.filterProfanity || false}
                    onChange={(v) => updateField('commentModeration.filterProfanity', v)}
                  />
                  <Toggle
                    label="Filter spam"
                    checked={form.commentModeration?.filterSpam || false}
                    onChange={(v) => updateField('commentModeration.filterSpam', v)}
                  />
                  <Toggle
                    label="Filter links"
                    checked={form.commentModeration?.filterLinks || false}
                    onChange={(v) => updateField('commentModeration.filterLinks', v)}
                  />
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Blocked Words (comma-separated)</label>
                    <textarea
                      value={(form.commentModeration?.blockedWords || []).join(', ')}
                      onChange={(e) => updateField('commentModeration.blockedWords', e.target.value.split(',').map((w: string) => w.trim()).filter(Boolean))}
                      rows={3}
                      className="w-full mt-1 px-3 py-2 rounded-lg text-sm border resize-none"
                      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                      placeholder="spam, scam, hate..."
                    />
                  </div>
                </div>
              )}

              {/* Notifications */}
              {activeSection === 'notifications' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Bell className="w-5 h-5" style={{ color: '#f59e0b' }} /> Notification Preferences
                  </h3>
                  <div className="space-y-1">
                    <Toggle label="New follower notifications" checked={form.notifications?.newFollower ?? true}
                      onChange={(v) => updateField('notifications.newFollower', v)} />
                    <Toggle label="New comment notifications" checked={form.notifications?.newComment ?? true}
                      onChange={(v) => updateField('notifications.newComment', v)} />
                    <Toggle label="Like notifications" checked={form.notifications?.newLike ?? true}
                      onChange={(v) => updateField('notifications.newLike', v)} />
                    <Toggle label="Share notifications" checked={form.notifications?.newShare ?? true}
                      onChange={(v) => updateField('notifications.newShare', v)} />
                    <Toggle label="Donation notifications" checked={form.notifications?.donation ?? true}
                      onChange={(v) => updateField('notifications.donation', v)} />
                    <Toggle label="Milestone notifications" checked={form.notifications?.milestone ?? true}
                      onChange={(v) => updateField('notifications.milestone', v)} />
                    <Toggle label="Weekly digest email" checked={form.notifications?.weeklyDigest ?? true}
                      onChange={(v) => updateField('notifications.weeklyDigest', v)} />
                    <Toggle label="Monthly report email" checked={form.notifications?.monthlyReport ?? true}
                      onChange={(v) => updateField('notifications.monthlyReport', v)} />
                  </div>
                </div>
              )}

              {/* Goals */}
              {activeSection === 'goals' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Target className="w-5 h-5" style={{ color: '#ec4899' }} /> Goals
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    Set targets to track your progress on the dashboard overview.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="Monthly Views Goal" value={form.goals?.monthlyViews || ''}
                      type="number" onChange={(v) => updateField('goals.monthlyViews', parseInt(v) || 0)}
                      placeholder="e.g. 10000" />
                    <InputField label="Monthly Followers Goal" value={form.goals?.monthlyFollowers || ''}
                      type="number" onChange={(v) => updateField('goals.monthlyFollowers', parseInt(v) || 0)}
                      placeholder="e.g. 500" />
                    <InputField label="Monthly Posts Goal" value={form.goals?.monthlyPosts || ''}
                      type="number" onChange={(v) => updateField('goals.monthlyPosts', parseInt(v) || 0)}
                      placeholder="e.g. 20" />
                    <InputField label="Monthly Revenue Goal ($)" value={form.goals?.monthlyRevenue || ''}
                      type="number" onChange={(v) => updateField('goals.monthlyRevenue', parseFloat(v) || 0)}
                      placeholder="e.g. 1000" />
                    <InputField label="Engagement Rate Goal (%)" value={form.goals?.engagementRate || ''}
                      type="number" onChange={(v) => updateField('goals.engagementRate', parseFloat(v) || 0)}
                      placeholder="e.g. 5" />
                  </div>
                </div>
              )}

              {/* Dashboard Preferences */}
              {activeSection === 'dashboard' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Palette className="w-5 h-5" style={{ color: '#06b6d4' }} /> Dashboard Preferences
                  </h3>
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Default Period</label>
                    <select
                      value={form.dashboardPreferences?.defaultPeriod || '30d'}
                      onChange={(e) => updateField('dashboardPreferences.defaultPeriod', e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg text-sm border"
                      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                      <option value="today">Today</option>
                      <option value="7d">Last 7 Days</option>
                      <option value="30d">Last 30 Days</option>
                      <option value="90d">Last 90 Days</option>
                    </select>
                  </div>
                  <Toggle label="Show real-time counters" checked={form.dashboardPreferences?.showRealtime ?? true}
                    onChange={(v) => updateField('dashboardPreferences.showRealtime', v)} />
                  <Toggle label="Compact mode" checked={form.dashboardPreferences?.compactMode ?? false}
                    onChange={(v) => updateField('dashboardPreferences.compactMode', v)} />
                  <Toggle label="Auto-refresh data" checked={form.dashboardPreferences?.autoRefresh ?? true}
                    onChange={(v) => updateField('dashboardPreferences.autoRefresh', v)} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
