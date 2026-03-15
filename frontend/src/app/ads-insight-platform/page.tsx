'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchAccountOverview, fetchCampaigns, fetchRecommendations } from '@/store/slices/adsInsightSlice';
import AdsInsightDashboard from '@/components/ads-insight/AdsInsightDashboard';
import AdsUpgradeScreen from '@/components/ads-insight/AdsUpgradeScreen';
import { Megaphone } from 'lucide-react';

export default function AdsInsightPlatformPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  const isPaid = user?.role === 'admin' || (user?.accountType === 'paid' && user?.subscription?.isActive);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isPaid) {
      dispatch(fetchAccountOverview({ period: 'last30' }));
      dispatch(fetchCampaigns({ page: 1, limit: 10 }));
      dispatch(fetchRecommendations());
    }
  }, [isAuthenticated, isPaid, dispatch, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Megaphone className="w-12 h-12 text-[var(--accent)] animate-pulse" />
          <p className="text-[var(--text-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isPaid) {
    return <AdsUpgradeScreen />;
  }

  return <AdsInsightDashboard />;
}
