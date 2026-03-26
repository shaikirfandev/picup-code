'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';
import { paymentAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  Wallet, ArrowUpCircle, ArrowDownCircle, Plus, CreditCard,
  DollarSign, IndianRupee, Send, Clock, CheckCircle, XCircle,
  ChevronLeft, ChevronRight, Banknote, ArrowLeft
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { WalletData, WalletTransaction, WithdrawRequest, PaginationMeta } from '@/types';

export default function WalletPage() {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(10);
  const [topUpCurrency, setTopUpCurrency] = useState<'USD' | 'INR'>('USD');
  const [processing, setProcessing] = useState(false);

  // Paginated transactions
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [txPage, setTxPage] = useState(1);
  const [txPagination, setTxPagination] = useState<PaginationMeta | null>(null);
  const [txFilter, setTxFilter] = useState('');
  const [txLoading, setTxLoading] = useState(false);

  // Withdrawals
  const [withdrawals, setWithdrawals] = useState<WithdrawRequest[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState(10);
  const [withdrawMethod, setWithdrawMethod] = useState<'bank_transfer' | 'paypal' | 'upi'>('bank_transfer');
  const [withdrawDetails, setWithdrawDetails] = useState({
    bankName: '', accountNumber: '', ifscCode: '',
    paypalEmail: '', upiId: '',
  });
  const [tab, setTab] = useState<'transactions' | 'withdrawals'>('transactions');

  const fetchWallet = useCallback(async () => {
    try {
      const { data } = await paymentAPI.getWallet();
      setWallet(data.data);
    } catch { /* empty */ } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      setTxLoading(true);
      const { data } = await paymentAPI.getWalletTransactions({
        page: txPage,
        limit: 15,
        type: txFilter || undefined,
      });
      setTransactions(data.data);
      setTxPagination(data.pagination);
    } catch { /* empty */ } finally {
      setTxLoading(false);
    }
  }, [txPage, txFilter]);

  const fetchWithdrawals = useCallback(async () => {
    try {
      const { data } = await paymentAPI.getMyWithdrawals({});
      setWithdrawals(data.data);
    } catch { /* empty */ }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchWallet();
    fetchWithdrawals();
  }, [isAuthenticated, fetchWallet, fetchWithdrawals]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchTransactions();
  }, [isAuthenticated, fetchTransactions]);

  const handleTopUp = async () => {
    if (topUpAmount < 1) { toast.error('Minimum top-up is 1'); return; }
    setProcessing(true);
    try {
      await paymentAPI.topUpWallet({ amount: topUpAmount, currency: topUpCurrency });
      toast.success(`Added ${topUpCurrency === 'USD' ? '$' : '₹'}${topUpAmount} to your wallet`);
      setShowTopUp(false);
      fetchWallet();
      fetchTransactions();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Top-up failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (withdrawAmount < 1) { toast.error('Minimum withdrawal is $1'); return; }
    if (wallet && withdrawAmount > wallet.balance) { toast.error('Insufficient balance'); return; }

    const details: Record<string, string> = {};
    if (withdrawMethod === 'bank_transfer') {
      if (!withdrawDetails.bankName || !withdrawDetails.accountNumber) { toast.error('Fill bank details'); return; }
      details.bankName = withdrawDetails.bankName;
      details.accountNumber = withdrawDetails.accountNumber;
      details.ifscCode = withdrawDetails.ifscCode;
    } else if (withdrawMethod === 'paypal') {
      if (!withdrawDetails.paypalEmail) { toast.error('Fill PayPal email'); return; }
      details.paypalEmail = withdrawDetails.paypalEmail;
    } else {
      if (!withdrawDetails.upiId) { toast.error('Fill UPI ID'); return; }
      details.upiId = withdrawDetails.upiId;
    }

    setProcessing(true);
    try {
      await paymentAPI.requestWithdraw({ amount: withdrawAmount, payoutMethod: withdrawMethod, payoutDetails: details });
      toast.success('Withdrawal request submitted!');
      setShowWithdraw(false);
      fetchWallet();
      fetchWithdrawals();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Withdrawal failed');
    } finally {
      setProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-20">
        <p className="text-sm font-mono text-[var(--edith-text-dim)]">Please sign in to view your wallet.</p>
        <Link href="/login" className="btn-primary mt-4 inline-flex">Log In</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20">
        <div className="card p-8 animate-pulse h-40 mb-4" />
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="card p-4 animate-pulse h-16" />)}</div>
      </div>
    );
  }

  const presets = topUpCurrency === 'USD' ? [5, 10, 25, 50, 100] : [100, 500, 1000, 2500, 5000];

  const withdrawStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-mono text-edith-cyan/60 hover:text-edith-cyan mb-4">
        <ArrowLeft className="w-3 h-3" /> Back to Dashboard
      </Link>

      <h1 className="text-2xl font-display font-bold mb-8 flex items-center gap-3" style={{ color: 'var(--edith-text)' }}>
        <div className="p-2 rounded-lg bg-edith-cyan/10">
          <Wallet className="w-6 h-6 text-edith-cyan" />
        </div>
        Ad Wallet
      </h1>

      {/* Balance Card */}
      <div className="card p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-edith-cyan/5 rounded-full -mr-10 -mt-10" />
        <p className="text-[10px] font-mono uppercase tracking-wider text-edith-cyan/60 mb-1">Available Balance</p>
        <p className="text-4xl font-display font-bold text-edith-cyan">${wallet?.balance?.toFixed(2) || '0.00'}</p>
        <p className="text-[10px] font-mono text-[var(--edith-text-dim)] mt-1">{wallet?.currency || 'USD'}</p>
        <div className="flex gap-4 mt-3 text-xs font-mono">
          <span className="text-green-400">Total In: ${wallet?.totalCredits?.toFixed(2) || '0.00'}</span>
          <span className="text-red-400">Total Out: ${wallet?.totalDebits?.toFixed(2) || '0.00'}</span>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={() => { setShowTopUp(!showTopUp); setShowWithdraw(false); }} className="btn-primary gap-2 text-xs">
            <Plus className="w-3 h-3" /> Add Credits
          </button>
          <button onClick={() => { setShowWithdraw(!showWithdraw); setShowTopUp(false); }} className="btn-ghost gap-2 text-xs">
            <Send className="w-3 h-3" /> Withdraw
          </button>
          <Link href="/settings" className="btn-ghost gap-2 text-xs">
            <CreditCard className="w-3 h-3" /> Payment Methods
          </Link>
        </div>
      </div>

      {/* Top-Up */}
      {showTopUp && (
        <div className="card p-6 mb-6">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-4">Top Up Wallet</h3>
          <div className="flex gap-2 mb-4">
            {['USD', 'INR'].map((c) => (
              <button key={c} onClick={() => setTopUpCurrency(c as 'USD' | 'INR')}
                className={`px-3 py-1.5 rounded text-xs font-mono flex items-center gap-1 ${topUpCurrency === c ? 'bg-edith-cyan/20 text-edith-cyan border border-edith-cyan/30' : 'bg-[var(--edith-surface)] text-[var(--edith-text-dim)] border border-[var(--edith-border)]'}`}>
                {c === 'USD' ? <DollarSign className="w-3 h-3" /> : <IndianRupee className="w-3 h-3" />} {c}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {presets.map((p) => (
              <button key={p} onClick={() => setTopUpAmount(p)}
                className={`px-3 py-1.5 rounded text-xs font-mono ${topUpAmount === p ? 'bg-edith-cyan/20 text-edith-cyan border border-edith-cyan/30' : 'bg-[var(--edith-surface)] text-[var(--edith-text-dim)] border border-[var(--edith-border)]'}`}>
                {topUpCurrency === 'USD' ? '$' : '₹'}{p}
              </button>
            ))}
          </div>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-[10px] font-mono text-[var(--edith-text-dim)] mb-1 block">Custom Amount</label>
              <input type="number" min="1" value={topUpAmount} onChange={(e) => setTopUpAmount(Number(e.target.value))} className="input-field" />
            </div>
            <button onClick={handleTopUp} disabled={processing} className="btn-primary gap-2 text-xs h-[42px]">
              <CreditCard className="w-3 h-3" /> {processing ? 'Processing...' : `Pay ${topUpCurrency === 'USD' ? '$' : '₹'}${topUpAmount}`}
            </button>
          </div>
        </div>
      )}

      {/* Withdraw */}
      {showWithdraw && (
        <div className="card p-6 mb-6">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-4">Request Withdrawal</h3>
          <div className="mb-4">
            <label className="text-[10px] font-mono text-[var(--edith-text-dim)] mb-1 block">Amount (USD)</label>
            <input type="number" min="1" max={wallet?.balance || 0} value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(Number(e.target.value))} className="input-field" />
          </div>
          <div className="mb-4">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-2 block">Payout Method</label>
            <div className="flex gap-2">
              {[
                { value: 'bank_transfer', label: 'Bank Transfer', icon: Banknote },
                { value: 'paypal', label: 'PayPal', icon: CreditCard },
                { value: 'upi', label: 'UPI', icon: IndianRupee },
              ].map((m) => (
                <button key={m.value} onClick={() => setWithdrawMethod(m.value as any)}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-mono transition-all ${
                    withdrawMethod === m.value
                      ? 'bg-edith-cyan/20 text-edith-cyan border border-edith-cyan/30'
                      : 'bg-[var(--edith-surface)] text-[var(--edith-text-dim)] border border-[var(--edith-border)]'
                  }`}>
                  <m.icon className="w-3 h-3" /> {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bank details */}
          {withdrawMethod === 'bank_transfer' && (
            <div className="space-y-3 mb-4">
              <input type="text" placeholder="Bank Name" value={withdrawDetails.bankName}
                onChange={(e) => setWithdrawDetails({ ...withdrawDetails, bankName: e.target.value })} className="input-field" />
              <input type="text" placeholder="Account Number" value={withdrawDetails.accountNumber}
                onChange={(e) => setWithdrawDetails({ ...withdrawDetails, accountNumber: e.target.value })} className="input-field" />
              <input type="text" placeholder="IFSC Code (optional)" value={withdrawDetails.ifscCode}
                onChange={(e) => setWithdrawDetails({ ...withdrawDetails, ifscCode: e.target.value })} className="input-field" />
            </div>
          )}
          {withdrawMethod === 'paypal' && (
            <div className="mb-4">
              <input type="email" placeholder="PayPal Email" value={withdrawDetails.paypalEmail}
                onChange={(e) => setWithdrawDetails({ ...withdrawDetails, paypalEmail: e.target.value })} className="input-field" />
            </div>
          )}
          {withdrawMethod === 'upi' && (
            <div className="mb-4">
              <input type="text" placeholder="UPI ID (e.g., name@upi)" value={withdrawDetails.upiId}
                onChange={(e) => setWithdrawDetails({ ...withdrawDetails, upiId: e.target.value })} className="input-field" />
            </div>
          )}

          <button onClick={handleWithdraw} disabled={processing} className="btn-primary w-full gap-2">
            <Send className="w-4 h-4" /> {processing ? 'Submitting...' : `Withdraw $${withdrawAmount}`}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-4 mb-4">
        {['transactions', 'withdrawals'].map((t) => (
          <button key={t} onClick={() => setTab(t as any)}
            className={`text-xs font-mono font-bold uppercase tracking-wider pb-1 border-b-2 transition-all ${
              tab === t ? 'text-edith-cyan border-edith-cyan' : 'text-[var(--edith-text-dim)] border-transparent'
            }`}>
            {t === 'transactions' ? 'Transaction History' : 'Withdrawals'}
          </button>
        ))}
      </div>

      {/* Transactions Tab */}
      {tab === 'transactions' && (
        <>
          <div className="flex items-center gap-2 mb-3 overflow-x-auto scrollbar-hide">
            {['', 'credit', 'debit', 'refund', 'bonus'].map((f) => (
              <button key={f} onClick={() => { setTxFilter(f); setTxPage(1); }}
                className={`shrink-0 px-3 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                  txFilter === f ? 'text-edith-cyan border border-edith-cyan/30 bg-edith-cyan/8' : 'text-[var(--edith-text-dim)] border border-[var(--edith-border)]'
                }`}>
                {f || 'All'}
              </button>
            ))}
          </div>

          {txLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="card p-4 animate-pulse h-16" />)}</div>
          ) : transactions.length > 0 ? (
            <>
              <div className="space-y-2">
                {transactions.map((tx, i) => (
                  <div key={i} className="card p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {tx.type === 'credit' || tx.type === 'bonus' || tx.type === 'refund' ? (
                        <ArrowDownCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      ) : (
                        <ArrowUpCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-xs font-mono" style={{ color: 'var(--edith-text)' }}>{tx.description || tx.type}</p>
                        <p className="text-[10px] font-mono text-[var(--edith-text-dim)]">
                          {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-mono font-bold ${
                        tx.type === 'credit' || tx.type === 'bonus' || tx.type === 'refund' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {tx.type === 'credit' || tx.type === 'bonus' || tx.type === 'refund' ? '+' : '-'}${tx.amount.toFixed(2)}
                      </p>
                      <p className="text-[9px] font-mono text-[var(--edith-text-dim)]">Bal: ${tx.balanceAfter.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Pagination */}
              {txPagination && txPagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-4">
                  <button onClick={() => setTxPage(Math.max(1, txPage - 1))} disabled={txPage <= 1} className="p-2 card disabled:opacity-30">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono text-[var(--edith-text-dim)]">Page {txPage} of {txPagination.totalPages}</span>
                  <button onClick={() => setTxPage(Math.min(txPagination.totalPages, txPage + 1))} disabled={txPage >= txPagination.totalPages} className="p-2 card disabled:opacity-30">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="card p-8 text-center">
              <Wallet className="w-8 h-8 text-edith-cyan/20 mx-auto mb-2" />
              <p className="text-xs font-mono text-[var(--edith-text-dim)]">No transactions yet</p>
            </div>
          )}
        </>
      )}

      {/* Withdrawals Tab */}
      {tab === 'withdrawals' && (
        withdrawals.length > 0 ? (
          <div className="space-y-2">
            {withdrawals.map((w) => (
              <div key={w._id} className="card p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {withdrawStatusIcon(w.status)}
                  <div>
                    <p className="text-xs font-mono" style={{ color: 'var(--edith-text)' }}>
                      ${w.amount.toFixed(2)} via {w.payoutMethod.replace('_', ' ')}
                    </p>
                    <p className="text-[10px] font-mono text-[var(--edith-text-dim)]">
                      {formatDistanceToNow(new Date(w.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                    w.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                    w.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                    w.status === 'processing' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-amber-500/10 text-amber-400'
                  }`}>
                    {w.status}
                  </span>
                  {w.rejectionReason && (
                    <p className="text-[9px] font-mono text-red-400 mt-1">{w.rejectionReason}</p>
                  )}
                  {w.transactionRef && (
                    <p className="text-[9px] font-mono text-[var(--edith-text-dim)] mt-1">Ref: {w.transactionRef}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <Send className="w-8 h-8 text-edith-cyan/20 mx-auto mb-2" />
            <p className="text-xs font-mono text-[var(--edith-text-dim)]">No withdrawal requests yet</p>
          </div>
        )
      )}
    </div>
  );
}
