'use client';

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { adsAPI } from '@/lib/api';
import { Advertisement } from '@/types';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  BarChart3, Plus, Eye, MousePointerClick, TrendingUp,
  Edit, Trash2, Pause, Play, ExternalLink, DollarSign,
} from 'lucide-react';

export default function AdManagerPage() {
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchAds();
  }, [isAuthenticated, filter]);

  const fetchAds = async () => {
    try {
      setIsLoading(true);
      const { data } = await adsAPI.getMyAds({ status: filter || undefined });
      setAds(data.data);
    } catch (e) {
      console.error('Failed to fetch ads:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this advertisement?')) return;
    try {
      await adsAPI.deleteAd(id);
      toast.success('Ad deleted');
      fetchAds();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete');
    }
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
    active: 'text-edith-green',
    pending: 'text-edith-amber',
    paused: 'text-[var(--edith-text-dim)]',
    rejected: 'text-edith-red',
    draft: 'text-[var(--edith-text-dim)]',
    completed: 'text-edith-blue',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-3" style={{ color: 'var(--edith-text)' }}>
            <BarChart3 className="w-6 h-6 text-edith-cyan" /> Ad Manager
          </h1>
          <p className="text-xs font-mono text-[var(--edith-text-dim)] mt-1">
            Manage, track, and optimize your advertisement campaigns
          </p>
        </div>
        <Link href="/ad-manager/create" className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Create Ad
        </Link>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide">
        {['', 'active', 'pending', 'paused', 'draft', 'rejected', 'completed'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`shrink-0 px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
              filter === s ? 'text-edith-cyan border border-edith-cyan/30' : 'text-[var(--edith-text-dim)] border border-[var(--edith-border)]'
            }`}
            style={filter === s ? { background: 'rgba(0,212,255,0.08)' } : {}}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Ads List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="skeleton w-20 h-20 rounded" />
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
            No advertisements yet
          </h3>
          <p className="text-sm font-mono text-[var(--edith-text-dim)] mb-4">
            Create your first ad campaign to start reaching users.
          </p>
          <Link href="/ad-manager/create" className="btn-primary gap-2 inline-flex">
            <Plus className="w-4 h-4" /> Create Ad
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {ads.map((ad) => (
            <div key={ad._id} className="card p-4">
              <div className="flex items-start gap-4">
                {ad.image?.url && (
                  <img src={ad.image.url} alt={ad.title} className="w-20 h-20 rounded object-cover border" style={{ borderColor: 'var(--edith-border)' }} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--edith-text)' }}>{ad.title}</h3>
                    <span className={`text-[9px] font-mono font-bold uppercase ${statusColors[ad.status]}`}>
                      {ad.status}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[var(--edith-text-dim)] truncate mb-2">{ad.description}</p>
                  <div className="flex items-center gap-4 text-[9px] font-mono text-[var(--edith-text-dim)]">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {ad.impressions} views</span>
                    <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" /> {ad.clicks} clicks</span>
                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {ad.ctr}% CTR</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {ad.campaign?.spent || 0}/{ad.campaign?.budget || 0} {ad.campaign?.currency}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={ad.redirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-[var(--edith-text-dim)] hover:text-edith-cyan transition-colors"
                    title="Visit URL"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <Link
                    href={`/ad-manager/${ad._id}/analytics`}
                    className="p-2 text-[var(--edith-text-dim)] hover:text-edith-cyan transition-colors"
                    title="Analytics"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(ad._id)}
                    className="p-2 text-[var(--edith-text-dim)] hover:text-edith-red transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
