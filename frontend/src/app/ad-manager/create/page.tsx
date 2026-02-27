'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { adsAPI, paymentAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ArrowLeft, Upload, Send, DollarSign } from 'lucide-react';

export default function CreateAdPage() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [form, setForm] = useState({
    title: '',
    description: '',
    redirectUrl: '',
    placement: 'feed',
    campaignName: '',
    budget: 50,
    currency: 'USD' as 'USD' | 'INR',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [adId, setAdId] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-20">
        <p className="text-sm font-mono text-[var(--edith-text-dim)]">Please sign in to create ads.</p>
        <Link href="/login" className="btn-primary mt-4 inline-flex">Log In</Link>
      </div>
    );
  }

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.redirectUrl) {
      toast.error('Title and redirect URL are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('redirectUrl', form.redirectUrl);
      formData.append('placement', form.placement);
      formData.append('campaign', JSON.stringify({
        name: form.campaignName || form.title,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        budget: form.budget,
        currency: form.currency,
      }));
      if (imageFile) formData.append('image', imageFile);

      const { data } = await adsAPI.createAd(formData);
      setAdId(data.data._id);
      toast.success('Ad created! Proceed to payment.');
      setStep('payment');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to create ad');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayment = async () => {
    if (!adId) return;
    setIsSubmitting(true);
    try {
      // Create payment
      const { data: payData } = await paymentAPI.createPayment({
        amount: form.budget,
        currency: form.currency,
        type: 'ad_payment',
        advertisementId: adId,
        description: `Ad campaign: ${form.title}`,
      });

      // In production, open Stripe/Razorpay checkout
      // For now, auto-confirm
      await paymentAPI.confirmPayment({
        paymentId: payData.data.paymentId,
      });

      toast.success('Payment successful! Your ad is now active.');
      router.push('/ad-manager');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Payment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/ad-manager" className="inline-flex items-center gap-2 text-xs font-mono text-edith-cyan/60 hover:text-edith-cyan mb-6">
        <ArrowLeft className="w-3 h-3" /> Back to Ad Manager
      </Link>

      <h1 className="text-2xl font-display font-bold mb-8" style={{ color: 'var(--edith-text)' }}>
        Create Advertisement
      </h1>

      {/* Steps */}
      <div className="flex items-center gap-4 mb-8">
        {['details', 'payment'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
              step === s ? 'bg-edith-cyan/20 text-edith-cyan border border-edith-cyan/30' : 'bg-[var(--edith-surface)] text-[var(--edith-text-dim)] border border-[var(--edith-border)]'
            }`}>
              {i + 1}
            </div>
            <span className={`text-[10px] font-mono uppercase tracking-wider ${
              step === s ? 'text-edith-cyan' : 'text-[var(--edith-text-dim)]'
            }`}>
              {s}
            </span>
          </div>
        ))}
      </div>

      {step === 'details' ? (
        <form onSubmit={handleCreateAd} className="space-y-5">
          <div>
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-1.5 block">Ad Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="Your ad title..." required />
          </div>

          <div>
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-1.5 block">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field h-20 resize-none" placeholder="Ad description..." />
          </div>

          <div>
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-1.5 block">Redirect URL</label>
            <input type="url" value={form.redirectUrl} onChange={(e) => setForm({ ...form, redirectUrl: e.target.value })} className="input-field" placeholder="https://your-website.com" required />
          </div>

          <div>
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-1.5 block">Ad Image</label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-edith-cyan/30 transition-colors"
              style={{ borderColor: 'var(--edith-border)' }}
              onClick={() => document.getElementById('ad-image')?.click()}>
              <Upload className="w-6 h-6 mx-auto text-edith-cyan/30 mb-2" />
              <p className="text-xs font-mono text-[var(--edith-text-dim)]">
                {imageFile ? imageFile.name : 'Click to upload'}
              </p>
              <input id="ad-image" type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-1.5 block">Placement</label>
              <select value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })} className="input-field">
                <option value="feed">Feed</option>
                <option value="sidebar">Sidebar</option>
                <option value="banner">Banner</option>
                <option value="search">Search</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-1.5 block">Currency</label>
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as 'USD' | 'INR' })} className="input-field">
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-1.5 block">Budget</label>
              <input type="number" min="1" value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} className="input-field" />
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-1.5 block">End Date</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="input-field" />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full gap-2">
            <Send className="w-4 h-4" /> {isSubmitting ? 'Creating...' : 'Continue to Payment'}
          </button>
        </form>
      ) : (
        <div className="card p-8 text-center">
          <DollarSign className="w-12 h-12 text-edith-cyan mx-auto mb-4" />
          <h2 className="text-lg font-display font-bold mb-2" style={{ color: 'var(--edith-text)' }}>
            Complete Payment
          </h2>
          <p className="text-sm font-mono text-[var(--edith-text-dim)] mb-6">
            Pay {form.currency === 'USD' ? '$' : '₹'}{form.budget} {form.currency} to activate your ad campaign.
          </p>
          <div className="card p-4 mb-6 text-left">
            <div className="flex justify-between text-xs font-mono mb-2">
              <span className="text-[var(--edith-text-dim)]">Campaign</span>
              <span style={{ color: 'var(--edith-text)' }}>{form.title}</span>
            </div>
            <div className="flex justify-between text-xs font-mono mb-2">
              <span className="text-[var(--edith-text-dim)]">Amount</span>
              <span style={{ color: 'var(--edith-text)' }}>{form.currency === 'USD' ? '$' : '₹'}{form.budget}</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[var(--edith-text-dim)]">Gateway</span>
              <span style={{ color: 'var(--edith-text)' }}>{form.currency === 'INR' ? 'Razorpay' : 'Stripe'}</span>
            </div>
          </div>
          <button onClick={handlePayment} disabled={isSubmitting} className="btn-primary w-full gap-2">
            <DollarSign className="w-4 h-4" />
            {isSubmitting ? 'Processing...' : `Pay ${form.currency === 'USD' ? '$' : '₹'}${form.budget}`}
          </button>
        </div>
      )}
    </div>
  );
}
