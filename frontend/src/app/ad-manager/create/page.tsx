'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { adsAPI, paymentAPI, categoriesAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  ArrowLeft, Upload, Send, DollarSign, Wallet, CreditCard,
  Target, Globe, Users, Zap, CheckCircle, ChevronRight
} from 'lucide-react';

interface Category { _id: string; name: string; slug: string; }

export default function CreateAdPage() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'details' | 'targeting' | 'payment'>('details');
  const [categories, setCategories] = useState<Category[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
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
    targetCategories: [] as string[],
    targetLocations: [] as string[],
    targetAudience: 'all' as 'all' | 'followers' | 'new_users' | 'returning_users',
    promotionType: 'standard' as 'standard' | 'featured' | 'homepage' | 'category_boost',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'gateway'>('wallet');
  const [locationInput, setLocationInput] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    categoriesAPI.getAll().then(({ data }) => setCategories(data.data)).catch(() => {});
    paymentAPI.getWallet().then(({ data }) => setWalletBalance(data.data.balance || 0)).catch(() => {});
  }, [isAuthenticated]);

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const addLocation = () => {
    const loc = locationInput.trim();
    if (loc && !form.targetLocations.includes(loc)) {
      setForm({ ...form, targetLocations: [...form.targetLocations, loc] });
    }
    setLocationInput('');
  };

  const removeLocation = (loc: string) => {
    setForm({ ...form, targetLocations: form.targetLocations.filter((l) => l !== loc) });
  };

  const toggleCategory = (id: string) => {
    setForm({
      ...form,
      targetCategories: form.targetCategories.includes(id)
        ? form.targetCategories.filter((c) => c !== id)
        : [...form.targetCategories, id],
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-20">
        <p className="text-sm font-mono text-[var(--edith-text-dim)]">Please sign in to create ads.</p>
        <Link href="/login" className="btn-primary mt-4 inline-flex">Log In</Link>
      </div>
    );
  }

  const handleSubmit = async () => {
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
      formData.append('promotionType', form.promotionType);
      formData.append('targetAudience', form.targetAudience);
      formData.append('campaign', JSON.stringify({
        name: form.campaignName || form.title,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        budget: form.budget,
        currency: form.currency,
      }));
      if (form.targetCategories.length > 0) {
        formData.append('targetCategories', JSON.stringify(form.targetCategories));
      }
      if (form.targetLocations.length > 0) {
        formData.append('targetLocations', JSON.stringify(form.targetLocations));
      }
      if (imageFile) formData.append('image', imageFile);

      if (paymentMethod === 'wallet') {
        await adsAPI.createAdFromWallet(formData);
        toast.success('Ad created and paid from wallet! Campaign is now active.');
      } else {
        const { data } = await adsAPI.createAd(formData);
        const adId = data.data._id;
        const { data: payData } = await paymentAPI.createPayment({
          amount: form.budget,
          currency: form.currency,
          type: 'ad_payment',
          advertisementId: adId,
          description: `Ad campaign: ${form.title}`,
        });
        await paymentAPI.confirmPayment({ paymentId: payData.data.paymentId });
        toast.success('Payment successful! Your ad is now active.');
      }
      router.push('/ad-manager');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to create ad');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { key: 'details', label: 'Ad Details' },
    { key: 'targeting', label: 'Targeting' },
    { key: 'payment', label: 'Payment' },
  ];

  const promotionTypes = [
    { value: 'standard', label: 'Standard', desc: 'Normal placement in feed', price: '1x' },
    { value: 'featured', label: 'Featured', desc: 'Highlighted in feed', price: '1.5x' },
    { value: 'homepage', label: 'Homepage', desc: 'Shown on homepage banner', price: '2x' },
    { value: 'category_boost', label: 'Category Boost', desc: 'Top of category pages', price: '1.75x' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/ad-manager" className="inline-flex items-center gap-2 text-xs font-mono text-edith-cyan/60 hover:text-edith-cyan mb-6">
        <ArrowLeft className="w-3 h-3" /> Back to Dashboard
      </Link>

      <h1 className="text-2xl font-display font-bold mb-6" style={{ color: 'var(--edith-text)' }}>
        Create Ad Campaign
      </h1>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            {i > 0 && <ChevronRight className="w-3 h-3 text-[var(--edith-text-dim)] shrink-0" />}
            <button
              onClick={() => {
                if (s.key === 'details' || (s.key === 'targeting' && form.title) || (s.key === 'payment' && form.title))
                  setStep(s.key as any);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all shrink-0 ${
                step === s.key
                  ? 'bg-edith-cyan/10 text-edith-cyan border border-edith-cyan/30'
                  : 'text-[var(--edith-text-dim)] border border-[var(--edith-border)]'
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] border"
                style={{ borderColor: step === s.key ? 'rgba(0,212,255,0.3)' : 'var(--edith-border)' }}>
                {i + 1}
              </span>
              {s.label}
            </button>
          </div>
        ))}
      </div>

      {/* Step 1: Details */}
      {step === 'details' && (
        <div className="space-y-5">
          <div>
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-1.5 block">Ad Title *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="Your ad title..." required />
          </div>
          <div>
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-1.5 block">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field h-20 resize-none" placeholder="Compelling ad copy..." />
          </div>
          <div>
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-1.5 block">Redirect URL *</label>
            <input type="url" value={form.redirectUrl} onChange={(e) => setForm({ ...form, redirectUrl: e.target.value })} className="input-field" placeholder="https://your-website.com" required />
          </div>
          <div>
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-1.5 block">Ad Image</label>
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-edith-cyan/30 transition-colors relative"
              style={{ borderColor: 'var(--edith-border)' }}
              onClick={() => document.getElementById('ad-image')?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="max-h-40 mx-auto rounded" />
              ) : (
                <>
                  <Upload className="w-6 h-6 mx-auto text-edith-cyan/30 mb-2" />
                  <p className="text-xs font-mono text-[var(--edith-text-dim)]">Click to upload image</p>
                </>
              )}
              <input id="ad-image" type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e.target.files?.[0] || null)} />
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
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-1.5 block">Budget</label>
              <input type="number" min="1" value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} className="input-field" />
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-1.5 block">Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-1.5 block">End Date</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="input-field" />
            </div>
          </div>
          <button onClick={() => { if (form.title && form.redirectUrl) setStep('targeting'); else toast.error('Fill required fields'); }} className="btn-primary w-full gap-2">
            Continue to Targeting <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 2: Targeting */}
      {step === 'targeting' && (
        <div className="space-y-6">
          {/* Promotion Type */}
          <div>
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-3 block flex items-center gap-2">
              <Zap className="w-3 h-3" /> Promotion Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {promotionTypes.map((pt) => (
                <button
                  key={pt.value}
                  onClick={() => setForm({ ...form, promotionType: pt.value as any })}
                  className={`p-4 rounded-lg text-left transition-all ${
                    form.promotionType === pt.value
                      ? 'border-2 border-edith-cyan/50 bg-edith-cyan/5'
                      : 'border border-[var(--edith-border)] hover:border-[var(--edith-cyan)]/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold" style={{ color: 'var(--edith-text)' }}>{pt.label}</span>
                    <span className="text-[9px] font-mono text-edith-cyan">{pt.price}</span>
                  </div>
                  <p className="text-[10px] font-mono text-[var(--edith-text-dim)]">{pt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-2 block flex items-center gap-2">
              <Users className="w-3 h-3" /> Target Audience
            </label>
            <div className="flex flex-wrap gap-2">
              {['all', 'followers', 'new_users', 'returning_users'].map((aud) => (
                <button
                  key={aud}
                  onClick={() => setForm({ ...form, targetAudience: aud as any })}
                  className={`px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                    form.targetAudience === aud
                      ? 'text-edith-cyan bg-edith-cyan/10 border border-edith-cyan/30'
                      : 'text-[var(--edith-text-dim)] border border-[var(--edith-border)]'
                  }`}
                >
                  {aud.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Target Categories */}
          {categories.length > 0 && (
            <div>
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-2 block flex items-center gap-2">
                <Target className="w-3 h-3" /> Target Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => toggleCategory(cat._id)}
                    className={`px-3 py-1.5 rounded text-[10px] font-mono font-bold transition-all ${
                      form.targetCategories.includes(cat._id)
                        ? 'text-edith-cyan bg-edith-cyan/10 border border-edith-cyan/30'
                        : 'text-[var(--edith-text-dim)] border border-[var(--edith-border)]'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Target Locations */}
          <div>
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-2 block flex items-center gap-2">
              <Globe className="w-3 h-3" /> Target Locations
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLocation())}
                placeholder="Add location (e.g., US, India, NYC)"
                className="input-field flex-1"
              />
              <button onClick={addLocation} className="btn-primary text-xs px-4">Add</button>
            </div>
            {form.targetLocations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.targetLocations.map((loc) => (
                  <span key={loc} className="flex items-center gap-1.5 px-2 py-1 rounded bg-edith-cyan/10 text-edith-cyan text-[10px] font-mono">
                    {loc}
                    <button onClick={() => removeLocation(loc)} className="hover:text-red-400">&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('details')} className="btn-ghost flex-1 gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => setStep('payment')} className="btn-primary flex-1 gap-2">
              Continue to Payment <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Payment */}
      {step === 'payment' && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="card p-5">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-3">Campaign Summary</h3>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div><span className="text-[var(--edith-text-dim)]">Title:</span> <span style={{ color: 'var(--edith-text)' }}>{form.title}</span></div>
              <div><span className="text-[var(--edith-text-dim)]">Placement:</span> <span style={{ color: 'var(--edith-text)' }} className="capitalize">{form.placement}</span></div>
              <div><span className="text-[var(--edith-text-dim)]">Budget:</span> <span style={{ color: 'var(--edith-text)' }}>{form.currency === 'USD' ? '$' : '₹'}{form.budget}</span></div>
              <div><span className="text-[var(--edith-text-dim)]">Promotion:</span> <span style={{ color: 'var(--edith-text)' }} className="capitalize">{form.promotionType.replace('_', ' ')}</span></div>
              <div><span className="text-[var(--edith-text-dim)]">Audience:</span> <span style={{ color: 'var(--edith-text)' }} className="capitalize">{form.targetAudience.replace('_', ' ')}</span></div>
              <div><span className="text-[var(--edith-text-dim)]">Duration:</span> <span style={{ color: 'var(--edith-text)' }}>{form.startDate}{form.endDate ? ` → ${form.endDate}` : ' → Open'}</span></div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-3 block">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('wallet')}
                className={`p-4 rounded-lg text-left transition-all ${
                  paymentMethod === 'wallet'
                    ? 'border-2 border-edith-cyan/50 bg-edith-cyan/5'
                    : 'border border-[var(--edith-border)]'
                }`}
              >
                <Wallet className="w-5 h-5 text-edith-cyan mb-2" />
                <p className="text-xs font-mono font-bold" style={{ color: 'var(--edith-text)' }}>Wallet Balance</p>
                <p className="text-[10px] font-mono text-[var(--edith-text-dim)]">Available: ${walletBalance.toFixed(2)}</p>
                {walletBalance < form.budget && (
                  <p className="text-[9px] font-mono text-red-400 mt-1">Insufficient balance</p>
                )}
              </button>
              <button
                onClick={() => setPaymentMethod('gateway')}
                className={`p-4 rounded-lg text-left transition-all ${
                  paymentMethod === 'gateway'
                    ? 'border-2 border-edith-cyan/50 bg-edith-cyan/5'
                    : 'border border-[var(--edith-border)]'
                }`}
              >
                <CreditCard className="w-5 h-5 text-edith-cyan mb-2" />
                <p className="text-xs font-mono font-bold" style={{ color: 'var(--edith-text)' }}>Card / Gateway</p>
                <p className="text-[10px] font-mono text-[var(--edith-text-dim)]">
                  {form.currency === 'INR' ? 'Razorpay' : 'Stripe'}
                </p>
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('targeting')} className="btn-ghost flex-1 gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || (paymentMethod === 'wallet' && walletBalance < form.budget)}
              className="btn-primary flex-1 gap-2"
            >
              {isSubmitting ? (
                <>Processing...</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> Launch Campaign — {form.currency === 'USD' ? '$' : '₹'}{form.budget}</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
