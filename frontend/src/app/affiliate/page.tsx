'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchAffiliateSummary, fetchAffiliatePosts } from '@/store/slices/affiliateSlice';
import AffiliateUpgradePrompt from '@/components/affiliate/AffiliateUpgradePrompt';
import AffiliateDashboard from '@/components/affiliate/AffiliateDashboard';
import { Link2, Loader2 } from 'lucide-react';

export default function AffiliatePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const { summary, loading } = useAppSelector((s) => s.affiliate);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    dispatch(fetchAffiliateSummary());
    dispatch(fetchAffiliatePosts({ page: 1, limit: 20 }));
  }, [isAuthenticated, dispatch, router]);

  if (!isAuthenticated) return null;

  if (loading && !summary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  const isPaid = user?.accountType === 'paid' || user?.role === 'admin';

  return (
    <div className="min-h-screen px-4 py-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Link2 className="w-8 h-8 text-[var(--accent)]" />
          Affiliate Marketing
        </h1>
        <p className="text-[var(--text-muted)] mt-1">
          Add product links to your pins and earn from clicks
        </p>
      </div>

      {isPaid ? <AffiliateDashboard /> : <AffiliateUpgradePrompt />}
    </div>
  );
}
