'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchUser } from '@/store/slices/authSlice';
import { updateProfile } from '@/store/slices/userSlice';
import { authAPI } from '@/lib/api';
import { User, Save, Camera, Shield, Bell, Palette, Loader2, Crown, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

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

        {/* Subscription */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            Subscription
          </h2>
          {user?.accountType === 'paid' && user?.subscription?.isActive ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }} className="text-sm">Plan</span>
                <span className="font-semibold text-sm capitalize" style={{ color: 'var(--foreground)' }}>{user.subscription.plan}</span>
              </div>
              {user.subscription.endDate && (
                <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-secondary)' }} className="text-sm">Renews</span>
                  <span className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>{new Date(user.subscription.endDate).toLocaleDateString()}</span>
                </div>
              )}
              <Link href="/upgrade" className="inline-flex items-center gap-1.5 text-sm font-medium mt-2" style={{ color: 'var(--accent)' }}>
                Change plan <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>You&apos;re on the free plan. Upgrade to unlock analytics, affiliate tools, and more.</p>
              <Link href="/upgrade" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5">
                <Crown className="w-4 h-4" />
                Upgrade Now
              </Link>
            </div>
          )}
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
