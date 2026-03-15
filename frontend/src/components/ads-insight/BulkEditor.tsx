'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { bulkUpdateStatus, fetchCampaigns } from '@/store/slices/adsInsightSlice';
import { formatNumber } from '@/lib/utils';
import { Table, ChevronLeft, Check, X } from 'lucide-react';
import type { Campaign } from '@/types';

const bulkStatusOptions = ['active', 'paused', 'archived', 'draft'];

export default function BulkEditor() {
  const dispatch = useAppDispatch();
  const { campaigns, loading } = useAppSelector((s) => s.adsInsight);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('active');

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === campaigns.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(campaigns.map((c) => c._id)));
    }
  };

  const handleBulkStatus = async () => {
    if (selected.size === 0) return;
    await dispatch(bulkUpdateStatus({
      campaignIds: Array.from(selected),
      status: bulkStatus,
    }));
    setSelected(new Set());
    dispatch(fetchCampaigns({ page: 1, limit: 100 }));
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/10 text-green-400',
    paused: 'bg-amber-500/10 text-amber-400',
    draft: 'bg-gray-500/10 text-gray-400',
    completed: 'bg-blue-500/10 text-blue-400',
    archived: 'bg-gray-500/10 text-gray-500',
  };

  return (
    <div className="min-h-screen px-4 py-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/ads-insight-platform" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Table className="w-6 h-6 text-pink-400" />
          Bulk Editor
        </h1>
      </div>

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div className="card p-4 flex items-center gap-4 bg-[var(--accent)]/5 border-[var(--accent)]/20">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm"
          >
            {bulkStatusOptions.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <button onClick={handleBulkStatus} className="btn-primary text-sm py-1.5" disabled={loading}>
            Apply Status
          </button>
          <button onClick={() => setSelected(new Set())} className="btn-secondary text-sm py-1.5">
            Clear Selection
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[var(--text-muted)] text-xs uppercase tracking-wider">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === campaigns.length && campaigns.length > 0}
                    onChange={toggleAll}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Objective</th>
                <th className="px-4 py-3">Total Budget</th>
                <th className="px-4 py-3">Spent</th>
                <th className="px-4 py-3">Impressions</th>
                <th className="px-4 py-3">Clicks</th>
                <th className="px-4 py-3">CTR</th>
                <th className="px-4 py-3">Placements</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-[var(--text-muted)]">
                    No campaigns to edit.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr
                    key={c._id}
                    className={`border-b border-[var(--border)] hover:bg-[var(--surface)]/50 transition-colors ${
                      selected.has(c._id) ? 'bg-[var(--accent)]/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(c._id)}
                        onChange={() => toggleSelect(c._id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[c.status] || ''}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize text-xs">{c.objective}</td>
                    <td className="px-4 py-3 text-xs">${formatNumber(c.budget.total)}</td>
                    <td className="px-4 py-3 text-xs">${formatNumber(c.budget.spent)}</td>
                    <td className="px-4 py-3 text-xs">{formatNumber(c.metrics.impressions)}</td>
                    <td className="px-4 py-3 text-xs">{formatNumber(c.metrics.clicks)}</td>
                    <td className="px-4 py-3 text-xs">{c.metrics.ctr}%</td>
                    <td className="px-4 py-3 text-xs">{c.placement.join(', ')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
