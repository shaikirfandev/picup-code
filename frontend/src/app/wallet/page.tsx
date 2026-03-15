'use client';

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { paymentAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Plus, CreditCard, DollarSign, IndianRupee } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { WalletData } from '@/types';

export default function WalletPage() {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(10);
  const [topUpCurrency, setTopUpCurrency] = useState<'USD' | 'INR'>('USD');
  const [processing, setProcessing] = useState(false);

  const fetchWallet = async () => {
    try {
      const { data } = await paymentAPI.getWallet();
      setWallet(data.data);
    } catch {
      // will show empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchWallet();
  }, [isAuthenticated]);

  const handleTopUp = async () => {
    if (topUpAmount < 1) {
      toast.error('Minimum top-up is 1');
      return;
    }
    setProcessing(true);
    try {
      await paymentAPI.topUpWallet({ amount: topUpAmount, currency: topUpCurrency });
      toast.success(`Added ${topUpCurrency === 'USD' ? '$' : '₹'}${topUpAmount} to your wallet`);
      setShowTopUp(false);
      fetchWallet();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Top-up failed');
    } finally {
      setProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-20">
        <p className="text-sm font-mono text-[var(--text-secondary)]">Please sign in to view your wallet.</p>
        <Link href="/login" className="btn-primary mt-4 inline-flex">Log In</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20">
        <div className="card p-8 animate-pulse h-40 mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="card p-4 animate-pulse h-16" />)}
        </div>
      </div>
    );
  }

  const presets = topUpCurrency === 'USD' ? [5, 10, 25, 50, 100] : [100, 500, 1000, 2500, 5000];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold font-bold mb-8 flex items-center gap-3" style={{ color: 'var(--foreground)' }}>
        <Wallet className="w-6 h-6 text-accent" /> Credits &amp; Wallet
      </h1>

      {/* Balance Card */}
      <div className="card p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 rounded-full -mr-10 -mt-10" />
        <p className="text-[10px] font-mono uppercase tracking-wider text-accent/60 mb-1">Available Balance</p>
        <p className="text-4xl font-semibold font-bold text-accent">
          ${wallet?.balance?.toFixed(2) || '0.00'}
        </p>
        <p className="text-[10px] font-mono text-[var(--text-secondary)] mt-1">
          {wallet?.currency || 'USD'}
        </p>
        <div className="flex gap-4 mt-4 text-xs font-mono">
          <span className="text-green-400">Total In: ${wallet?.totalCredits?.toFixed(2) || '0.00'}</span>
          <span className="text-red-400">Total Out: ${wallet?.totalDebits?.toFixed(2) || '0.00'}</span>
        </div>
        <button onClick={() => setShowTopUp(!showTopUp)} className="btn-primary mt-4 gap-2 text-xs">
          <Plus className="w-3 h-3" /> Add Credits
        </button>
      </div>

      {/* Top-Up Form */}
      {showTopUp && (
        <div className="card p-6 mb-6">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-accent/60 mb-4">Top Up Wallet</h3>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setTopUpCurrency('USD')} className={`px-3 py-1.5 rounded text-xs font-mono flex items-center gap-1 ${topUpCurrency === 'USD' ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)]'}`}>
              <DollarSign className="w-3 h-3" /> USD
            </button>
            <button onClick={() => setTopUpCurrency('INR')} className={`px-3 py-1.5 rounded text-xs font-mono flex items-center gap-1 ${topUpCurrency === 'INR' ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)]'}`}>
              <IndianRupee className="w-3 h-3" /> INR
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {presets.map((p) => (
              <button key={p} onClick={() => setTopUpAmount(p)} className={`px-3 py-1.5 rounded text-xs font-mono ${topUpAmount === p ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)]'}`}>
                {topUpCurrency === 'USD' ? '$' : '₹'}{p}
              </button>
            ))}
          </div>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-[10px] font-mono text-[var(--text-secondary)] mb-1 block">Custom Amount</label>
              <input type="number" min="1" value={topUpAmount} onChange={(e) => setTopUpAmount(Number(e.target.value))} className="input-field" />
            </div>
            <button onClick={handleTopUp} disabled={processing} className="btn-primary gap-2 text-xs h-[42px]">
              <CreditCard className="w-3 h-3" />
              {processing ? 'Processing...' : `Pay ${topUpCurrency === 'USD' ? '$' : '₹'}${topUpAmount}`}
            </button>
          </div>
          <p className="text-[10px] font-mono text-[var(--text-secondary)] mt-2">
            Gateway: {topUpCurrency === 'INR' ? 'Razorpay' : 'Stripe'}
          </p>
        </div>
      )}

      {/* Transaction History */}
      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-accent/60 mb-3">Transaction History</h3>
      {wallet?.transactions && wallet.transactions.length > 0 ? (
        <div className="space-y-2">
          {wallet.transactions.map((tx, i) => (
            <div key={i} className="card p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {tx.type === 'credit' ? (
                  <ArrowDownCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                ) : (
                  <ArrowUpCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                )}
                <div>
                  <p className="text-xs font-mono" style={{ color: 'var(--foreground)' }}>{tx.description || (tx.type === 'credit' ? 'Wallet Top-up' : 'Payment')}</p>
                  <p className="text-[10px] font-mono text-[var(--text-secondary)]">
                    {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-mono font-bold ${tx.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                </p>
                <p className="text-[9px] font-mono text-[var(--text-secondary)]">Bal: ${tx.balanceAfter.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <Wallet className="w-8 h-8 text-accent/20 mx-auto mb-2" />
          <p className="text-xs font-mono text-[var(--text-secondary)]">No transactions yet</p>
        </div>
      )}
    </div>
  );
}
