'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';
import { adsAPI } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  BarChart3, Plus, Eye, MousePointerClick, TrendingUp, Edit, Trash2,
  Pause, Play, ExternalLink, DollarSign, Search, Filter, ArrowLeft,
  ChevronLeft, ChevronRight, MoreVertical, ArrowUpDown
} from 'lucide-react';
import type { Advertisement, PaginationMeta } from '@/types';

const STATUS_FILTERS = ['', 'active', 'pending', 'paused', 'draft', 'rejected', 'completed'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'budget_high', label: 'Budget (High)' },
  { value: 'budget_low', label: 'Budget (Low)' },
  { value: 'clicks', label: 'Most Clicks' },
];

export default function ManageAdsPage() {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const fetchAds = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await adsAPI.getMyAds({
        page,
        limit: 12,
        status: filter || undefined,
        search: search || undefined,
        sort: sort || undefined,
      });
      setAds(data.data);
      setPagination(data.pagination);
    } catch (e) {
      console.error('Failed to fetch ads:', e);
    } finally {
      setIsLoading(false);
    }
  }, [page, filter, search, sort]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchAds();
  }, [isAuthenticated, fetchAds]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchAds(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this advertisement? This cannot be undone.')) return;
    try {
      await adsAPI.deleteAd(id);
      toast.success('Ad deleted');
      fetchAds();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete');
    }
    setActionMenuId(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-20">
        <p className="text-sm font-mono text-[var(--edith-text-dim)]">Please sign in to manage ads.</p>
        <Link href="/login" className="btn-primary mt-4 inline-flex">Log In</Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/10 text-green-400',
    pending: 'bg-amber-500/10 text-amber-400',
    paused: 'bg-gray-500/10 text-gray-400',
    rejected: 'bg-red-500/10 text-red-400',
    draft: 'bg-gray-500/10 text-gray-400',
    completed: 'bg-blue-500/10 text-blue-400',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back + Header */}
      <Link href="/ad-manager" className="inline-flex items-center gap-2 text-xs font-mono text-edith-cyan/60 hover:text-edith-cyan mb-4">
        <ArrowLeft className="w-3 h-3" /> Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--edith-text)' }}>
            Manage Campaigns
          </h1>
          <p className="text-xs font-mono text-[var(--edith-text-dim)] mt-1">
            {pagination ? `${pagination.total} total campaigns` : 'Loading...'}
          </p>
        </div>
        <Link href="/ad-manager/create" className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Create Ad
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--edith-text-dim)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ads..."
              className="input-field pl-9 w-full"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-[var(--edith-text-dim)]" />
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="input-field text-xs"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-hide">
          <Filter className="w-3 h-3 text-[var(--edith-text-dim)] shrink-0" />
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => { setFilter(s); setPage(1); }}
              className={`shrink-0 px-3 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                filter === s
                  ? 'text-edith-cyan border border-edith-cyan/30 bg-edith-cyan/8'
                  : 'text-[var(--edith-text-dim)] border border-[var(--edith-border)] hover:text-[var(--edith-text)]'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Ads Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="skeleton w-16 h-16 rounded" />
                <div className="flex-1">
                  <div className="skeleton h-4 w-1/3 mb-2 rounded" />
                  <div className="skeleton h-3 w-2/3 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : ads.length === 0 ? (
        <div className="text-center py-20 card">
          <BarChart3 className="w-16 h-16 mx-auto text-edith-cyan/20 mb-4" />
          <h3 className="text-lg font-display font-semibold mb-2" style={{ color: 'var(--edith-text)' }}>
            {search || filter ? 'No matching ads' : 'No advertisements yet'}
          </h3>
          <p className="text-sm font-mono text-[var(--edith-text-dim)] mb-4">
            {search || filter ? 'Try adjusting your filters' : 'Create your first ad campaign to start reaching users.'}
          </p>
          {!search && !filter && (
            <Link href="/ad-manager/create" className="btn-primary gap-2 inline-flex">
              <Plus className="w-4 h-4" /> Create Ad
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {ads.map((ad) => (
              <div key={ad._id} className="card p-4 hover:border-[var(--edith-cyan)]/20 transition-colors">
                <div className="flex items-start gap-4">
                  {ad.image?.url ? (
                    <img src={ad.image.url} alt={ad.title} className="w-16 h-16 rounded object-cover shrink-0 border" style={{ borderColor: 'var(--edith-border)' }} />
                  ) : (
                    <div className="w-16 h-16 rounded bg-edith-cyan/10 flex items-center justify-center shrink-0">
                      <BarChart3 className="w-6 h-6 text-edith-cyan/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--edith-text)' }}>{ad.title}</h3>
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusColors[ad.status] || 'text-[var(--edith-text-dim)]'}`}>
                        {ad.status}
                      </span>
                      {ad.promotionType && ad.promotionType !== 'standard' && (
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 uppercase">
                          {ad.promotionType}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-[var(--edith-text-dim)] truncate mb-2">{ad.description}</p>
                    <div className="flex items-center gap-4 text-[9px] font-mono text-[var(--edith-text-dim)] flex-wrap">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {ad.impressions.toLocaleString()}</span>
                      <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" /> {ad.clicks.toLocaleString()}</span>
                      <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {ad.ctr}% CTR</span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {ad.campaign?.currency === 'INR' ? '₹' : '$'}{ad.campaign?.spent || 0}/{ad.campaign?.budget || 0}
                      </span>
                      <span className="text-[var(--edith-text-dim)]">
                        {formatDistanceToNow(new Date(ad.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 relative">
                    <Link
                      href={`/ad-manager/${ad._id}/analytics`}
                      className="p-2 text-[var(--edith-text-dim)] hover:text-edith-cyan transition-colors"
                      title="Analytics"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Link>
                    <a
                      href={ad.redirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-[var(--edith-text-dim)] hover:text-edith-cyan transition-colors"
                      title="Visit URL"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <div className="relative">
                      <button
                        onClick={() => setActionMenuId(actionMenuId === ad._id ? null : ad._id)}
                        className="p-2 text-[var(--edith-text-dim)] hover:text-[var(--edith-text)] transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {actionMenuId === ad._id && (
                        <div className="absolute right-0 top-full mt-1 card p-1 min-w-[140px] z-50 shadow-lg">
                          <Link
                            href={`/ad-manager/${ad._id}/analytics`}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-[var(--edith-text)] hover:bg-[var(--edith-surface)] rounded"
                            onClick={() => setActionMenuId(null)}
                          >
                            <Edit className="w-3 h-3" /> Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(ad._id)}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-red-400 hover:bg-red-400/10 rounded w-full text-left"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-2 card disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-[var(--edith-text-dim)]">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page >= pagination.totalPages}
                className="p-2 card disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
