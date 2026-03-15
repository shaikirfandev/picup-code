'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchCampaignReport, clearReport } from '@/store/slices/adsInsightSlice';
import { adsInsightAPI } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import {
  BarChart3, ChevronLeft, Download, Calendar,
  Eye, MousePointerClick, Target, DollarSign, TrendingUp,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from 'recharts';

const groupByOptions = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
];

export default function AdReporting() {
  const dispatch = useAppDispatch();
  const { report, campaigns, loading } = useAppSelector((s) => s.adsInsight);
  const [campaignId, setCampaignId] = useState('');
  const [groupBy, setGroupBy] = useState('day');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleGenerate = () => {
    dispatch(fetchCampaignReport({
      campaignId: campaignId || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      groupBy,
    }));
  };

  const handleExport = async () => {
    try {
      const response = await adsInsightAPI.exportReport({
        campaignId: campaignId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        format: 'csv',
      });
      const blob = new Blob([response.data as any], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ad-report.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {}
  };

  return (
    <div className="min-h-screen px-4 py-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/ads-insight-platform" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-green-400" />
          Ad Reporting
        </h1>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Campaign</label>
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm"
            >
              <option value="">All Campaigns</option>
              {campaigns.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Group By</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm"
            >
              {groupByOptions.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Start</label>
            <input
              type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">End</label>
            <input
              type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm"
            />
          </div>
          <button onClick={handleGenerate} className="btn-primary">Generate Report</button>
          {report && <button onClick={handleExport} className="btn-secondary flex items-center gap-2"><Download className="w-4 h-4" /> Export CSV</button>}
        </div>
      </div>

      {/* Report Content */}
      {report && (
        <div className="space-y-6">
          {/* Totals */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: 'Impressions', value: formatNumber(report.totals.impressions), icon: <Eye className="w-4 h-4 text-blue-400" /> },
              { label: 'Reach', value: formatNumber(report.totals.reach), icon: <TrendingUp className="w-4 h-4 text-green-400" /> },
              { label: 'Clicks', value: formatNumber(report.totals.clicks), icon: <MousePointerClick className="w-4 h-4 text-purple-400" /> },
              { label: 'Conversions', value: formatNumber(report.totals.conversions), icon: <Target className="w-4 h-4 text-pink-400" /> },
              { label: 'Spend', value: `$${formatNumber(report.totals.spend)}`, icon: <DollarSign className="w-4 h-4 text-amber-400" /> },
              { label: 'CTR', value: `${report.totals.ctr}%`, icon: <TrendingUp className="w-4 h-4 text-cyan-400" /> },
              { label: 'CPC', value: `$${report.totals.cpc}`, icon: <DollarSign className="w-4 h-4 text-orange-400" /> },
            ].map((m) => (
              <div key={m.label} className="card p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                  {m.icon}
                  <span className="text-xs">{m.label}</span>
                </div>
                <p className="text-lg font-bold">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-sm font-semibold mb-4">Impressions & Clicks</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={report.report}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="_id" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="impressions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="clicks" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-6">
              <h3 className="text-sm font-semibold mb-4">CTR & Spend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={report.report}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="_id" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="ctr" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="spend" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Data Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-[var(--text-muted)] text-xs uppercase tracking-wider">
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3">Impressions</th>
                    <th className="px-4 py-3">Reach</th>
                    <th className="px-4 py-3">Clicks</th>
                    <th className="px-4 py-3">Conversions</th>
                    <th className="px-4 py-3">Spend</th>
                    <th className="px-4 py-3">CTR</th>
                    <th className="px-4 py-3">CPC</th>
                  </tr>
                </thead>
                <tbody>
                  {report.report.map((row, i) => (
                    <tr key={i} className="border-b border-[var(--border)]">
                      <td className="px-4 py-2 font-medium">{row._id}</td>
                      <td className="px-4 py-2">{formatNumber(row.impressions)}</td>
                      <td className="px-4 py-2">{formatNumber(row.reach)}</td>
                      <td className="px-4 py-2">{formatNumber(row.clicks)}</td>
                      <td className="px-4 py-2">{formatNumber(row.conversions)}</td>
                      <td className="px-4 py-2">${formatNumber(row.spend)}</td>
                      <td className="px-4 py-2">{row.ctr}%</td>
                      <td className="px-4 py-2">${row.cpc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!report && !loading && (
        <div className="card p-12 text-center text-[var(--text-muted)]">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select filters and generate a report to see campaign performance data.</p>
        </div>
      )}
    </div>
  );
}
