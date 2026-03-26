'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';
import { paymentAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  CreditCard, Plus, Trash2, Star, ArrowLeft, Shield,
  CheckCircle, Banknote, IndianRupee
} from 'lucide-react';
import type { PaymentMethod } from '@/types';

type MethodType = 'card' | 'upi' | 'paypal' | 'bank_account';

const METHOD_ICONS: Record<MethodType, any> = {
  card: CreditCard,
  upi: IndianRupee,
  paypal: CreditCard,
  bank_account: Banknote,
};

export default function PaymentSettingsPage() {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [processing, setProcessing] = useState(false);

  // New method form
  const [newType, setNewType] = useState<MethodType>('card');
  const [newDetails, setNewDetails] = useState({
    last4: '', brand: 'visa', expiry: '',
    paypalEmail: '', upiId: '',
    bankName: '', accountLast4: '',
  });
  const [newLabel, setNewLabel] = useState('');

  const fetchMethods = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await paymentAPI.getPaymentMethods();
      setMethods(data.data);
    } catch { /* empty */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchMethods();
  }, [isAuthenticated, fetchMethods]);

  const handleAddMethod = async () => {
    setProcessing(true);
    try {
      const details: Record<string, string> = {};
      if (newType === 'card') {
        if (!newDetails.last4 || newDetails.last4.length !== 4) { toast.error('Enter last 4 digits'); setProcessing(false); return; }
        details.last4 = newDetails.last4;
        details.brand = newDetails.brand;
        details.expiry = newDetails.expiry;
      } else if (newType === 'paypal') {
        if (!newDetails.paypalEmail) { toast.error('Enter PayPal email'); setProcessing(false); return; }
        details.paypalEmail = newDetails.paypalEmail;
      } else if (newType === 'upi') {
        if (!newDetails.upiId) { toast.error('Enter UPI ID'); setProcessing(false); return; }
        details.upiId = newDetails.upiId;
      } else {
        if (!newDetails.bankName) { toast.error('Enter bank name'); setProcessing(false); return; }
        details.bankName = newDetails.bankName;
        details.accountLast4 = newDetails.accountLast4;
      }

      await paymentAPI.addPaymentMethod({
        type: newType,
        details,
        label: newLabel || undefined,
        gateway: newType === 'upi' ? 'razorpay' : 'stripe',
      });
      toast.success('Payment method added');
      setShowAdd(false);
      setNewDetails({ last4: '', brand: 'visa', expiry: '', paypalEmail: '', upiId: '', bankName: '', accountLast4: '' });
      setNewLabel('');
      fetchMethods();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to add method');
    } finally {
      setProcessing(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await paymentAPI.updatePaymentMethod(id, { isDefault: true });
      toast.success('Default payment method updated');
      fetchMethods();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this payment method?')) return;
    try {
      await paymentAPI.deletePaymentMethod(id);
      toast.success('Payment method removed');
      fetchMethods();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to remove');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-20">
        <p className="text-sm font-mono text-[var(--edith-text-dim)]">Please sign in.</p>
        <Link href="/login" className="btn-primary mt-4 inline-flex">Log In</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/ad-manager" className="inline-flex items-center gap-2 text-xs font-mono text-edith-cyan/60 hover:text-edith-cyan mb-4">
        <ArrowLeft className="w-3 h-3" /> Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-3" style={{ color: 'var(--edith-text)' }}>
            <div className="p-2 rounded-lg bg-edith-cyan/10">
              <CreditCard className="w-6 h-6 text-edith-cyan" />
            </div>
            Payment Methods
          </h1>
          <p className="text-xs font-mono text-[var(--edith-text-dim)] mt-1 ml-[52px]">
            Manage your payment methods for ad campaigns
          </p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary gap-2 text-xs">
          <Plus className="w-3 h-3" /> Add Method
        </button>
      </div>

      {/* Add Method Form */}
      {showAdd && (
        <div className="card p-6 mb-6">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-4">
            Add Payment Method
          </h3>

          {/* Type selector */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {(
              [
                { value: 'card', label: 'Card' },
                { value: 'paypal', label: 'PayPal' },
                { value: 'upi', label: 'UPI' },
                { value: 'bank_account', label: 'Bank' },
              ] as { value: MethodType; label: string }[]
            ).map((t) => {
              const Icon = METHOD_ICONS[t.value];
              return (
                <button
                  key={t.value}
                  onClick={() => setNewType(t.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg text-center transition-all ${
                    newType === t.value
                      ? 'border-2 border-edith-cyan/50 bg-edith-cyan/5'
                      : 'border border-[var(--edith-border)]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${newType === t.value ? 'text-edith-cyan' : 'text-[var(--edith-text-dim)]'}`} />
                  <span className="text-[10px] font-mono font-bold">{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Type-specific fields */}
          <div className="space-y-3 mb-4">
            {newType === 'card' && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-[var(--edith-text-dim)] mb-1 block">Last 4 digits</label>
                    <input type="text" maxLength={4} value={newDetails.last4}
                      onChange={(e) => setNewDetails({ ...newDetails, last4: e.target.value.replace(/\D/g, '') })}
                      className="input-field" placeholder="4242" />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-[var(--edith-text-dim)] mb-1 block">Brand</label>
                    <select value={newDetails.brand} onChange={(e) => setNewDetails({ ...newDetails, brand: e.target.value })} className="input-field">
                      <option value="visa">Visa</option>
                      <option value="mastercard">Mastercard</option>
                      <option value="amex">Amex</option>
                      <option value="discover">Discover</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-[var(--edith-text-dim)] mb-1 block">Expiry</label>
                    <input type="text" value={newDetails.expiry}
                      onChange={(e) => setNewDetails({ ...newDetails, expiry: e.target.value })}
                      className="input-field" placeholder="12/25" />
                  </div>
                </div>
              </>
            )}
            {newType === 'paypal' && (
              <div>
                <label className="text-[10px] font-mono text-[var(--edith-text-dim)] mb-1 block">PayPal Email</label>
                <input type="email" value={newDetails.paypalEmail}
                  onChange={(e) => setNewDetails({ ...newDetails, paypalEmail: e.target.value })}
                  className="input-field" placeholder="you@email.com" />
              </div>
            )}
            {newType === 'upi' && (
              <div>
                <label className="text-[10px] font-mono text-[var(--edith-text-dim)] mb-1 block">UPI ID</label>
                <input type="text" value={newDetails.upiId}
                  onChange={(e) => setNewDetails({ ...newDetails, upiId: e.target.value })}
                  className="input-field" placeholder="yourname@upi" />
              </div>
            )}
            {newType === 'bank_account' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-[var(--edith-text-dim)] mb-1 block">Bank Name</label>
                  <input type="text" value={newDetails.bankName}
                    onChange={(e) => setNewDetails({ ...newDetails, bankName: e.target.value })}
                    className="input-field" placeholder="Bank of America" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[var(--edith-text-dim)] mb-1 block">Last 4 digits</label>
                  <input type="text" maxLength={4} value={newDetails.accountLast4}
                    onChange={(e) => setNewDetails({ ...newDetails, accountLast4: e.target.value.replace(/\D/g, '') })}
                    className="input-field" placeholder="1234" />
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] font-mono text-[var(--edith-text-dim)] mb-1 block">Label (optional)</label>
              <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
                className="input-field" placeholder="e.g., My Visa Card" />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setShowAdd(false)} className="btn-ghost flex-1">Cancel</button>
            <button onClick={handleAddMethod} disabled={processing} className="btn-primary flex-1 gap-2">
              <Plus className="w-3 h-3" /> {processing ? 'Adding...' : 'Add Method'}
            </button>
          </div>
        </div>
      )}

      {/* Methods List */}
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card p-4 animate-pulse h-20" />)}</div>
      ) : methods.length > 0 ? (
        <div className="space-y-3">
          {methods.map((m) => {
            const Icon = METHOD_ICONS[m.type as MethodType] || CreditCard;
            return (
              <div key={m._id} className={`card p-4 flex items-center justify-between gap-4 ${m.isDefault ? 'border-edith-cyan/30' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-edith-cyan/10">
                    <Icon className="w-5 h-5 text-edith-cyan" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-mono font-bold" style={{ color: 'var(--edith-text)' }}>
                        {m.label}
                      </p>
                      {m.isDefault && (
                        <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-edith-cyan/10 text-edith-cyan uppercase">Default</span>
                      )}
                      {m.isVerified && (
                        <CheckCircle className="w-3 h-3 text-green-400" />
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-[var(--edith-text-dim)]">
                      {m.type === 'card' && `${m.details.brand} •••• ${m.details.last4} | exp ${m.details.expiry}`}
                      {m.type === 'paypal' && `PayPal: ${m.details.paypalEmail}`}
                      {m.type === 'upi' && `UPI: ${m.details.upiId}`}
                      {m.type === 'bank_account' && `${m.details.bankName} •••• ${m.details.accountLast4}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!m.isDefault && (
                    <button onClick={() => handleSetDefault(m._id)} className="p-2 text-[var(--edith-text-dim)] hover:text-amber-400 transition-colors" title="Set as default">
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(m._id)} className="p-2 text-[var(--edith-text-dim)] hover:text-red-400 transition-colors" title="Remove">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Shield className="w-10 h-10 text-edith-cyan/20 mx-auto mb-3" />
          <h3 className="text-sm font-display font-semibold mb-1" style={{ color: 'var(--edith-text)' }}>No payment methods</h3>
          <p className="text-xs font-mono text-[var(--edith-text-dim)] mb-4">Add a card, PayPal, or UPI to get started</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary gap-2 inline-flex text-xs">
            <Plus className="w-3 h-3" /> Add Payment Method
          </button>
        </div>
      )}
    </div>
  );
}
