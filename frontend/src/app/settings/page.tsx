'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchUser } from '@/store/slices/authSlice';
import { updateProfile } from '@/store/slices/userSlice';
import { authAPI, paymentAPI } from '@/lib/api';
import { User, Save, Camera, Shield, Bell, Palette, Loader2, Crown, Check, Zap, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import type { SubscriptionPlan } from '@/types';

export default function SettingsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const plans: SubscriptionPlan[] = [
    { id: 'basic', name: 'Basic', price: 9.99, features: ['5 active campaigns', 'Basic analytics', 'Email support'] },
    { id: 'pro', name: 'Pro', price: 29.99, features: ['25 active campaigns', 'Advanced analytics', 'Priority support', 'A/B testing'] },
    { id: 'enterprise', name: 'Enterprise', price: 99.99, features: ['Unlimited campaigns', 'Real-time analytics', 'Dedicated support', 'API access', 'Custom targeting'] },
  ];

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
      setLocation(user.location || '');
      setWebsite(user.website || '');
    }
  }, [isAuthenticated, user, router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await dispatch(updateProfile({ displayName, bio, location, website })).unwrap();
      await dispatch(fetchUser());
      toast.success('Profile updated!');
    } catch (err: any) { toast.error(err?.message || 'Failed'); }
    setIsSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('Passwords don\'t match'); return; }
    if (newPassword.length < 8) { toast.error('Minimum 8 characters'); return; }
    setIsChangingPassword(true);
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed!');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    setIsChangingPassword(false);
  };

  const handleSubscribe = async (planId: string) => {
    setSubscribing(true);
    try {
      await paymentAPI.subscribePlan({ plan: planId });
      toast.success(`Subscribed to ${planId} plan!`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Subscription failed. Check wallet balance.');
    } finally {
      setSubscribing(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-surface-500 mb-8">Manage your account and preferences</p>

        {/* Profile section */}
        <form onSubmit={handleSaveProfile} className="card p-6 mb-6">
          <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
            <User className="w-5 h-5 text-brand-500" />
            Profile
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Display Name</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="input-field resize-none" maxLength={500} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Location</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Website</label>
                <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." type="url" className="input-field" />
              </div>
            </div>
            <button type="submit" disabled={isSaving} className="btn-primary gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </form>

        {/* Password section */}
        <form onSubmit={handleChangePassword} className="card p-6 mb-6">
          <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-500" />
            Change Password
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Current Password</label>
              <input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">New Password</label>
              <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" className="input-field" placeholder="Min 8 characters" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Confirm New Password</label>
              <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" className="input-field" />
            </div>
            <button type="submit" disabled={isChangingPassword || !currentPassword || !newPassword} className="btn-primary gap-2">
              {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Change Password
            </button>
          </div>
        </form>

        {/* Subscription Plans */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            Subscription Plans
          </h2>
          <p className="text-sm text-[var(--edith-text-dim)] mb-4">
            Upgrade your ad platform capabilities. Plans are billed from your wallet balance.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`p-5 rounded-lg border transition-all ${
                  plan.id === 'pro'
                    ? 'border-edith-cyan/40 bg-edith-cyan/5 relative'
                    : 'border-[var(--edith-border)]'
                }`}
              >
                {plan.id === 'pro' && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold px-2 py-0.5 bg-edith-cyan text-black rounded-full uppercase">
                    Popular
                  </span>
                )}
                <div className="flex items-center gap-2 mb-2">
                  {plan.id === 'basic' && <Zap className="w-4 h-4 text-blue-400" />}
                  {plan.id === 'pro' && <Star className="w-4 h-4 text-edith-cyan" />}
                  {plan.id === 'enterprise' && <Crown className="w-4 h-4 text-amber-400" />}
                  <span className="text-sm font-bold" style={{ color: 'var(--edith-text)' }}>{plan.name}</span>
                </div>
                <p className="text-2xl font-display font-bold text-edith-cyan mb-3">
                  ${plan.price}<span className="text-xs font-mono text-[var(--edith-text-dim)]">/mo</span>
                </p>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs font-mono text-[var(--edith-text-dim)]">
                      <Check className="w-3 h-3 text-green-400 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={subscribing}
                  className={plan.id === 'pro' ? 'btn-primary w-full text-xs' : 'btn-ghost w-full text-xs'}
                >
                  {subscribing ? 'Processing...' : `Subscribe — $${plan.price}`}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Account info */}
        <div className="card p-6">
          <h2 className="text-lg font-bold mb-5">Account</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800">
              <span className="text-surface-500">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800">
              <span className="text-surface-500">Username</span>
              <span className="font-medium">@{user?.username}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800">
              <span className="text-surface-500">Role</span>
              <span className="font-medium capitalize">{user?.role}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-surface-500">Member since</span>
              <span className="font-medium">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
