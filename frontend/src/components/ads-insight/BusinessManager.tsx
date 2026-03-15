'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  fetchBusinesses,
  createBusiness,
  addBusinessMember,
  removeBusinessMember,
  fetchAdAccounts,
} from '@/store/slices/adsInsightSlice';
import { Building2, ChevronLeft, Users, Plus, Trash2, CreditCard, ShieldCheck, Eye, BarChart3 } from 'lucide-react';
import type { Business, BusinessMember } from '@/types';

const roleIcons: Record<string, React.ReactNode> = {
  admin: <ShieldCheck className="w-4 h-4 text-red-400" />,
  manager: <BarChart3 className="w-4 h-4 text-blue-400" />,
  analyst: <Eye className="w-4 h-4 text-green-400" />,
  viewer: <Eye className="w-4 h-4 text-gray-400" />,
};

export default function BusinessManager() {
  const dispatch = useAppDispatch();
  const { businesses, adAccounts, loading } = useAppSelector((s) => s.adsInsight);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedBiz, setExpandedBiz] = useState<string | null>(null);
  const [newBiz, setNewBiz] = useState({ name: '', industry: '', website: '' });
  const [newMember, setNewMember] = useState({ userId: '', role: 'viewer' });

  useEffect(() => {
    dispatch(fetchBusinesses());
    dispatch(fetchAdAccounts());
  }, [dispatch]);

  const handleCreateBusiness = async () => {
    if (!newBiz.name.trim()) return;
    await dispatch(createBusiness(newBiz));
    setShowCreateModal(false);
    setNewBiz({ name: '', industry: '', website: '' });
  };

  const handleAddMember = async (businessId: string) => {
    if (!newMember.userId.trim()) return;
    await dispatch(addBusinessMember({ businessId, ...newMember }));
    setNewMember({ userId: '', role: 'viewer' });
  };

  const handleRemoveMember = async (businessId: string, userId: string) => {
    await dispatch(removeBusinessMember({ businessId, userId }));
  };

  const toggleExpand = (id: string) => {
    setExpandedBiz(expandedBiz === id ? null : id);
  };

  return (
    <div className="min-h-screen px-4 py-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/ads-insight-platform" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-400" />
            Business Manager
          </h1>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New Business
        </button>
      </div>

      {/* Ad Accounts Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Businesses</p>
          <p className="text-2xl font-bold">{businesses.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Ad Accounts</p>
          <p className="text-2xl font-bold">{adAccounts.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Total Members</p>
          <p className="text-2xl font-bold">
            {businesses.reduce((sum, b) => sum + (b.members?.length || 0), 0)}
          </p>
        </div>
      </div>

      {/* Business List */}
      <div className="space-y-4">
        {loading && businesses.length === 0 && (
          <div className="card p-12 text-center text-[var(--text-muted)]">Loading businesses...</div>
        )}
        {!loading && businesses.length === 0 && (
          <div className="card p-12 text-center text-[var(--text-muted)]">
            No businesses yet. Create one to get started.
          </div>
        )}
        {businesses.map((biz) => (
          <div key={biz._id} className="card overflow-hidden">
            <div
              className="flex items-center justify-between p-5 cursor-pointer hover:bg-[var(--surface)]/50"
              onClick={() => toggleExpand(biz._id)}
            >
              <div>
                <h3 className="font-semibold text-lg">{biz.name}</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  {biz.industry && `${biz.industry} · `}{biz.members?.length || 0} members · {biz.adAccounts?.length || 0} ad accounts
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                biz.status === 'active' ? 'bg-green-500/10 text-green-400' :
                biz.status === 'suspended' ? 'bg-red-500/10 text-red-400' :
                'bg-gray-500/10 text-gray-400'
              }`}>
                {biz.status}
              </span>
            </div>

            {expandedBiz === biz._id && (
              <div className="border-t border-[var(--border)] px-5 py-4 space-y-5">
                {/* Members */}
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4" /> Team Members
                  </h4>
                  <div className="space-y-2">
                    {biz.members?.map((m: BusinessMember) => (
                      <div key={m.user._id} className="flex items-center justify-between bg-[var(--surface)] rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          {roleIcons[m.role] || null}
                          <span className="text-sm font-medium">{m.user.displayName || m.user.username}</span>
                          <span className="text-xs capitalize px-1.5 py-0.5 rounded bg-[var(--bg)] text-[var(--text-muted)]">{m.role}</span>
                        </div>
                        <button onClick={() => handleRemoveMember(biz._id, m.user._id)} className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {/* Add Member */}
                  <div className="flex gap-2 mt-3">
                    <input
                      type="text"
                      placeholder="User ID"
                      value={newMember.userId}
                      onChange={(e) => setNewMember({ ...newMember, userId: e.target.value })}
                      className="input flex-1"
                    />
                    <select
                      value={newMember.role}
                      onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                      className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="analyst">Analyst</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button onClick={() => handleAddMember(biz._id)} className="btn-primary text-sm px-3">
                      Add
                    </button>
                  </div>
                </div>

                {/* Ad Accounts */}
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                    <CreditCard className="w-4 h-4" /> Linked Ad Accounts
                  </h4>
                  {(biz.adAccounts?.length || 0) === 0 ? (
                    <p className="text-sm text-[var(--text-muted)]">No ad accounts linked.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(biz.adAccounts || []).map((acc) => (
                          <div key={acc._id} className="bg-[var(--surface)] rounded-lg px-3 py-2 text-sm">
                            <p className="font-medium">{acc.name}</p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {acc.currency} · Total spend: ${acc.totalSpend}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Business Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="card p-6 w-full max-w-md space-y-4 relative">
            <h2 className="text-lg font-bold">Create Business</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Name *</label>
                <input
                  type="text"
                  value={newBiz.name}
                  onChange={(e) => setNewBiz({ ...newBiz, name: e.target.value })}
                  className="input w-full"
                  placeholder="Business name"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Industry</label>
                <input
                  type="text"
                  value={newBiz.industry}
                  onChange={(e) => setNewBiz({ ...newBiz, industry: e.target.value })}
                  className="input w-full"
                  placeholder="e.g. Technology"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Website</label>
                <input
                  type="text"
                  value={newBiz.website}
                  onChange={(e) => setNewBiz({ ...newBiz, website: e.target.value })}
                  className="input w-full"
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleCreateBusiness} className="btn-primary text-sm" disabled={loading || !newBiz.name.trim()}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
