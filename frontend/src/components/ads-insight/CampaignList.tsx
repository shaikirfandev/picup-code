'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchCampaigns, deleteCampaign, togglePauseCampaign, createCampaign } from '@/store/slices/adsInsightSlice';
import { formatNumber } from '@/lib/utils';
import {
  Plus, Search, Filter, Pause, Play, Trash2, Edit,
  Megaphone, ChevronLeft, Eye, MousePointerClick, Target,
} from 'lucide-react';
import type { Campaign } from '@/types';

const statusOptions = ['all', 'draft', 'active', 'paused', 'completed', 'archived'];
const objectiveOptions = ['awareness', 'traffic', 'engagement', 'leads', 'conversions', 'sales'];

export default function CampaignList() {
  const dispatch = useAppDispatch();
  const { campaigns, campaignsPagination, loading } = useAppSelector((s) => s.adsInsight);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(1);

  const handleSearch = () => {
    dispatch(fetchCampaigns({
      page: 1,
      limit: 20,
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }));
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    dispatch(fetchCampaigns({
      page: newPage,
      limit: 20,
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }));
  };

  return (
    <div className="min-h-screen px-4 py-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/ads-insight-platform" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-[var(--accent)]" />
            Campaign Management
          </h1>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Campaign
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search campaigns..."
            className="w-full pl-10 pr-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); }}
          className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm"
        >
          {statusOptions.map((s) => (
            <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <button onClick={handleSearch} className="btn-secondary flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Apply
        </button>
      </div>

      {/* Campaign Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[var(--text-muted)] text-xs uppercase tracking-wider">
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Objective</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3"><Eye className="w-3 h-3 inline" /> Impr.</th>
                <th className="px-4 py-3"><MousePointerClick className="w-3 h-3 inline" /> Clicks</th>
                <th className="px-4 py-3"><Target className="w-3 h-3 inline" /> Conv.</th>
                <th className="px-4 py-3">CTR</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-[var(--text-muted)]">
                    {loading ? 'Loading campaigns...' : 'No campaigns found. Create your first campaign!'}
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => <CampaignRowItem key={c._id} campaign={c} />)
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {campaignsPagination && campaignsPagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
            <span className="text-xs text-[var(--text-muted)]">
              Showing {campaigns.length} of {campaignsPagination.total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 text-sm bg-[var(--surface)] border border-[var(--border)] rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">Page {page} of {campaignsPagination.totalPages}</span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={!campaignsPagination.hasMore}
                className="px-3 py-1 text-sm bg-[var(--surface)] border border-[var(--border)] rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreate && <CreateCampaignModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function CampaignRowItem({ campaign }: { campaign: Campaign }) {
  const dispatch = useAppDispatch();

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/10 text-green-400',
    paused: 'bg-amber-500/10 text-amber-400',
    draft: 'bg-gray-500/10 text-gray-400',
    completed: 'bg-blue-500/10 text-blue-400',
    archived: 'bg-gray-500/10 text-gray-500',
    pending: 'bg-yellow-500/10 text-yellow-400',
    rejected: 'bg-red-500/10 text-red-400',
  };

  return (
    <tr className="border-b border-[var(--border)] hover:bg-[var(--surface)]/50 transition-colors">
      <td className="px-4 py-3">
        <div>
          <p className="font-medium">{campaign.name}</p>
          <p className="text-xs text-[var(--text-muted)]">{campaign.placement.join(', ')}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[campaign.status] || ''}`}>
          {campaign.status}
        </span>
      </td>
      <td className="px-4 py-3 capitalize text-xs">{campaign.objective}</td>
      <td className="px-4 py-3 text-xs">
        ${formatNumber(campaign.budget.spent)} / ${formatNumber(campaign.budget.total)}
      </td>
      <td className="px-4 py-3 text-xs">{formatNumber(campaign.metrics.impressions)}</td>
      <td className="px-4 py-3 text-xs">{formatNumber(campaign.metrics.clicks)}</td>
      <td className="px-4 py-3 text-xs">{formatNumber(campaign.metrics.conversions)}</td>
      <td className="px-4 py-3 text-xs">{campaign.metrics.ctr}%</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => dispatch(togglePauseCampaign(campaign._id))}
            className="p-1.5 rounded hover:bg-[var(--border)] transition-colors"
            title={campaign.status === 'paused' ? 'Resume' : 'Pause'}
          >
            {campaign.status === 'paused' ? <Play className="w-3.5 h-3.5 text-green-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
          </button>
          <button
            onClick={() => {
              if (confirm('Delete this campaign?')) dispatch(deleteCampaign(campaign._id));
            }}
            className="p-1.5 rounded hover:bg-[var(--border)] transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function CreateCampaignModal({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState({
    name: '',
    objective: 'awareness',
    budgetTotal: 100,
    budgetDaily: 10,
    currency: 'USD',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    placement: ['feed'],
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      await dispatch(createCampaign({
        name: form.name,
        objective: form.objective as any,
        budget: { total: form.budgetTotal, daily: form.budgetDaily, spent: 0, currency: form.currency as any },
        schedule: { startDate: form.startDate, endDate: form.endDate || undefined, timezone: 'UTC' },
        placement: form.placement,
      })).unwrap();
      onClose();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-lg mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold">Create Campaign</h2>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Campaign Name</label>
            <input
              type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm"
              placeholder="My Campaign"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1 block">Objective</label>
              <select
                value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm"
              >
                {objectiveOptions.map((o) => (
                  <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1 block">Currency</label>
              <select
                value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm"
              >
                <option value="USD">USD</option>
                <option value="INR">INR</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1 block">Total Budget</label>
              <input
                type="number" value={form.budgetTotal} onChange={(e) => setForm({ ...form, budgetTotal: +e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1 block">Daily Budget</label>
              <input
                type="number" value={form.budgetDaily} onChange={(e) => setForm({ ...form, budgetDaily: +e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1 block">Start Date</label>
              <input
                type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1 block">End Date</label>
              <input
                type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || !form.name.trim()} className="btn-primary">
            {submitting ? 'Creating...' : 'Create Campaign'}
          </button>
        </div>
      </div>
    </div>
  );
}
