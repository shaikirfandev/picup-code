'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';
import { adsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Megaphone, Plus, Wallet, Eye, MousePointerClick, Clock,
  ExternalLink, Trash2, BarChart3, ChevronLeft, ChevronRight,
  Filter, AlertCircle,
} from 'lucide-react';
import type { Advertisement, AdPricing } from '@/types';

export default function AdsPage() {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [tab, setTab] = useState<'my-ads' | 'create'>('my-ads');
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  // Creation form
  const [pricing, setPricing] = useState<AdPricing | null>(null);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    redirectUrl: '',
    placement: 'feed',
    validityDays: 7,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchMyAds = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await adsAPI.getMyAds(params as any);
      setAds(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch {
      toast.error('Failed to load ads');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  const fetchPricing = useCallback(async () => {
    setPricingLoading(true);
    try {
      const { data } = await adsAPI.getPricing();
      setPricing(data.data || null);
    } catch {
      // pricing not configured
    } finally {
      setPricingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchMyAds();
  }, [isAuthenticated, fetchMyAds]);

  useEffect(() => {
    if (tab === 'create' && !pricing) fetchPricing();
  }, [tab, pricing, fetchPricing]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.redirectUrl.trim()) { toast.error('Redirect URL is required'); return; }
    if (!pricing?.isConfigured) { toast.error('Ad pricing not configured. Contact admin.'); return; }
    if (!pricing?.canAfford) { toast.error('Insufficient wallet balance. Please top up first.'); return; }

    setCreating(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('redirectUrl', form.redirectUrl);
      fd.append('placement', form.placement);
      fd.append('validityDays', String(form.validityDays));
      if (imageFile) fd.append('image', imageFile);

      await adsAPI.createAd(fd);
      toast.success(`Ad created! ${pricing.creditsCost} credits charged.`);
      setForm({ title: '', description: '', redirectUrl: '', placement: 'feed', validityDays: 7 });
      setImageFile(null);
      setImagePreview(null);
      setTab('my-ads');
      fetchMyAds();
      fetchPricing(); // refresh balance
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to create ad');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this ad?')) return;
    try {
      await adsAPI.deleteAd(id);
      toast.success('Ad deleted');
      fetchMyAds();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-surface-500">Please sign in to manage ads.</p>
        <Link href="/login" className="btn-primary mt-4 inline-flex">Log In</Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    paused: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    draft: 'bg-surface-100 text-surface-700 dark:bg-surface-900/30 dark:text-surface-400',
  };

  const validityOptions = [
    { value: 1, label: '1 day' },
    { value: 3, label: '3 days' },
    { value: 7, label: '1 week' },
    { value: 14, label: '2 weeks' },
    { value: 30, label: '1 month' },
    { value: 60, label: '2 months' },
    { value: 90, label: '3 months' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold flex items-center gap-3 mb-6">
        <Megaphone className="w-6 h-6 text-brand-500" /> My Advertisements
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('my-ads')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === 'my-ads' ? 'bg-brand-500 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'}`}
        >
          My Ads
        </button>
        <button
          onClick={() => setTab('create')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${tab === 'create' ? 'bg-brand-500 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'}`}
        >
          <Plus className="w-4 h-4" /> Create Ad
        </button>
      </div>

      {/* My Ads Tab */}
      {tab === 'my-ads' && (
        <>
          <div className="flex gap-2 mb-4">
            {['', 'pending', 'active', 'paused', 'completed', 'rejected'].map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${statusFilter === s ? 'bg-brand-500 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-500'}`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-surface-100 dark:bg-surface-800 animate-pulse" />)}
            </div>
          ) : ads.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800">
              <Megaphone className="w-10 h-10 text-surface-300 mx-auto mb-3" />
              <p className="text-sm text-surface-500">No ads found</p>
              <button onClick={() => setTab('create')} className="mt-4 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm hover:bg-brand-600 transition">
                Create Your First Ad
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {ads.map((ad) => (
                <div key={ad._id} className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 flex gap-4">
                  {ad.image?.url && (
                    <img src={ad.image.url} alt={ad.title} className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">{ad.title}</h3>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[ad.status] || ''}`}>
                        {ad.status}
                      </span>
                    </div>
                    <p className="text-xs text-surface-400 mb-2 truncate">{ad.redirectUrl}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-surface-500">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {ad.impressions}</span>
                      <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" /> {ad.clicks}</span>
                      <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {ad.ctr}% CTR</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ad.validityDays}d</span>
                      <span className="flex items-center gap-1"><Wallet className="w-3 h-3" /> {ad.creditsCost} credits</span>
                      {ad.expiresAt && (
                        <span className="text-surface-400">
                          Expires {formatDistanceToNow(new Date(ad.expiresAt), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <a href={ad.redirectUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 transition">
                      <ExternalLink className="w-4 h-4 text-surface-400" />
                    </a>
                    <button onClick={() => handleDelete(ad._id)} className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg bg-surface-100 dark:bg-surface-800 disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-surface-500">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg bg-surface-100 dark:bg-surface-800 disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Ad Tab */}
      {tab === 'create' && (
        <div className="space-y-6">
          {/* Wallet Balance & Pricing Info */}
          {pricingLoading ? (
            <div className="h-20 rounded-2xl bg-surface-100 dark:bg-surface-800 animate-pulse" />
          ) : pricing ? (
            <div className={`rounded-2xl p-5 border-2 ${pricing.canAfford ? 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/20' : 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-brand-500" />
                  <div>
                    <p className="text-sm font-medium">Wallet Balance: <span className="font-bold">{pricing.walletBalance.toLocaleString()} credits</span></p>
                    <p className="text-xs text-surface-500">Ad posting cost: <span className="font-bold text-brand-600">{pricing.creditsCost} credits</span> per ad</p>
                  </div>
                </div>
                {!pricing.canAfford && (
                  <Link href="/wallet" className="px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 transition flex items-center gap-2">
                    <Plus className="w-3 h-3" /> Top Up
                  </Link>
                )}
              </div>
              {!pricing.canAfford && (
                <div className="mt-3 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  Insufficient credits. You need {(pricing.creditsCost || 0) - pricing.walletBalance} more credits.
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl p-5 border-2 border-yellow-300 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20">
              <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400">
                <AlertCircle className="w-5 h-5" />
                Ad pricing not configured. Please contact admin.
              </div>
            </div>
          )}

          {/* Form */}
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 space-y-5">
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={150}
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none"
                placeholder="Ad headline"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={500}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none resize-none"
                placeholder="Optional description"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">Redirect URL *</label>
              <input
                type="url"
                value={form.redirectUrl}
                onChange={(e) => setForm({ ...form, redirectUrl: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none"
                placeholder="https://example.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1.5">Placement</label>
                <select
                  value={form.placement}
                  onChange={(e) => setForm({ ...form, placement: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm appearance-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none"
                >
                  <option value="feed">Feed</option>
                  <option value="sidebar">Sidebar</option>
                  <option value="banner">Banner</option>
                  <option value="search">Search</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1.5">Ad Validity Duration</label>
                <select
                  value={form.validityDays}
                  onChange={(e) => setForm({ ...form, validityDays: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm appearance-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none"
                >
                  {validityOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">Ad Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="text-sm text-surface-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-brand-50 dark:file:bg-brand-900/30 file:text-brand-600"
              />
              {imagePreview && (
                <div className="mt-3 relative inline-block">
                  <img src={imagePreview} alt="Preview" className="w-40 h-28 object-cover rounded-xl" />
                  <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs">×</button>
                </div>
              )}
            </div>

            {/* Cost Summary */}
            <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-surface-500">Cost:</span>
                <span className="font-bold">{pricing?.creditsCost || 0} credits</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-surface-500">Validity:</span>
                <span className="font-medium">{form.validityDays} days</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-surface-500">After deduction:</span>
                <span className="font-medium">{Math.max(0, (pricing?.walletBalance || 0) - (pricing?.creditsCost || 0)).toLocaleString()} credits remaining</span>
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={creating || !pricing?.canAfford || !pricing?.isConfigured}
              className="w-full py-3 rounded-xl bg-brand-500 text-white font-medium text-sm hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
            >
              <Megaphone className="w-4 h-4" />
              {creating ? 'Creating...' : `Create Ad (${pricing?.creditsCost || 0} credits)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
