'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminWalletAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  DollarSign, Settings, Save, ToggleLeft, ToggleRight,
  Megaphone, RefreshCw, Pencil, Check, X,
} from 'lucide-react';
import type { CreditRule } from '@/types';

export default function AdminAdPricingPage() {
  const [rules, setRules] = useState<CreditRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Ad pricing form state
  const [adCost, setAdCost] = useState(0);
  const [adDescription, setAdDescription] = useState('');
  const [adActive, setAdActive] = useState(true);
  const [adRuleExists, setAdRuleExists] = useState(false);

  // Editing other rules
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCost, setEditCost] = useState(0);
  const [editActive, setEditActive] = useState(true);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminWalletAPI.getAllCreditRules();
      const allRules: CreditRule[] = data.data || [];
      setRules(allRules);

      // Find the ad_posting rule
      const adRule = allRules.find((r) => r.feature === 'ad_posting');
      if (adRule) {
        setAdCost(adRule.baseCost);
        setAdDescription(adRule.description || '');
        setAdActive(adRule.isActive);
        setAdRuleExists(true);
      }
    } catch {
      toast.error('Failed to load credit rules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const saveAdPricing = async () => {
    if (adCost < 0) {
      toast.error('Cost must be >= 0');
      return;
    }
    setSaving(true);
    try {
      await adminWalletAPI.setAdPricing({
        baseCost: adCost,
        description: adDescription,
        isActive: adActive,
      });
      toast.success('Ad posting price updated');
      setAdRuleExists(true);
      fetchRules();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const updateRule = async (id: string) => {
    try {
      await adminWalletAPI.updateCreditRule(id, {
        baseCost: editCost,
        isActive: editActive,
      });
      toast.success('Rule updated');
      setEditingId(null);
      fetchRules();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update');
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="h-10 w-64 bg-surface-100 dark:bg-surface-800 rounded animate-pulse mb-8" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-surface-100 dark:bg-surface-800 animate-pulse" />)}
        </div>
      </div>
    );
  }

  const otherRules = rules.filter((r) => r.feature !== 'ad_posting');

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Settings className="w-6 h-6 text-brand-500" /> Ad Pricing &amp; Credit Rules
          </h1>
          <p className="text-sm text-surface-500 mt-1">Control how much users pay in credits to post ads</p>
        </div>
        <button onClick={fetchRules} className="btn-secondary gap-2 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Ad Posting Price Card */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border-2 border-brand-500/30 p-6 mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-xl bg-brand-100 dark:bg-brand-900/30">
            <Megaphone className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Ad Posting Price</h2>
            <p className="text-xs text-surface-500">This amount is deducted from user wallets when they create a paid ad</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Credits Cost (per ad)</label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="number"
                min={0}
                value={adCost}
                onChange={(e) => setAdCost(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-lg font-bold focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none"
                placeholder="e.g. 50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Description</label>
            <input
              type="text"
              value={adDescription}
              onChange={(e) => setAdDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none"
              placeholder="Credit cost for posting a paid advertisement"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-5">
          <button
            onClick={() => setAdActive(!adActive)}
            className="flex items-center gap-2 text-sm"
          >
            {adActive ? (
              <ToggleRight className="w-6 h-6 text-green-500" />
            ) : (
              <ToggleLeft className="w-6 h-6 text-surface-400" />
            )}
            <span className={adActive ? 'text-green-600 font-medium' : 'text-surface-400'}>
              {adActive ? 'Active' : 'Disabled'}
            </span>
          </button>

          <button
            onClick={saveAdPricing}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-brand-500 text-white font-medium text-sm hover:bg-brand-600 disabled:opacity-50 flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : adRuleExists ? 'Update Price' : 'Set Price'}
          </button>
        </div>
      </div>

      {/* Other Credit Rules */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6">
        <h3 className="text-sm font-semibold mb-4">All Credit Rules</h3>
        {otherRules.length === 0 ? (
          <p className="text-sm text-surface-400 text-center py-4">No other credit rules configured</p>
        ) : (
          <div className="space-y-3">
            {otherRules.map((rule) => (
              <div key={rule._id} className="flex items-center gap-4 p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-700">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold capitalize">{rule.feature.replace(/_/g, ' ')}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${rule.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                      {rule.isActive ? 'Active' : 'Disabled'}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-200 dark:bg-surface-700 text-surface-500`}>
                      {rule.category}
                    </span>
                  </div>
                  <p className="text-xs text-surface-400 mt-0.5">{rule.description || 'No description'}</p>
                  {rule.updatedBy && (
                    <p className="text-[10px] text-surface-400 mt-1">
                      Updated by {rule.updatedBy.displayName || rule.updatedBy.username} · {formatDistanceToNow(new Date(rule.updatedAt), { addSuffix: true })}
                    </p>
                  )}
                </div>

                {editingId === rule._id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={editCost}
                      onChange={(e) => setEditCost(Number(e.target.value))}
                      className="w-20 px-2 py-1.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-sm text-center"
                    />
                    <button
                      onClick={() => setEditActive(!editActive)}
                      className="p-1"
                    >
                      {editActive ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-surface-400" />}
                    </button>
                    <button onClick={() => updateRule(rule._id)} className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200 transition">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-surface-200 dark:bg-surface-700 text-surface-500 hover:bg-surface-300 transition">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold font-mono">{rule.baseCost}</span>
                    <span className="text-xs text-surface-400">credits</span>
                    <button
                      onClick={() => { setEditingId(rule._id); setEditCost(rule.baseCost); setEditActive(rule.isActive); }}
                      className="p-1.5 rounded-lg bg-surface-200 dark:bg-surface-700 text-surface-500 hover:bg-surface-300 dark:hover:bg-surface-600 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
