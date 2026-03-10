'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { checkCreatorAccess } from '@/store/slices/creatorAnalyticsSlice';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import UpgradeScreen from '@/components/analytics/UpgradeScreen';
import { BarChart3 } from 'lucide-react';

export default function CreatorAnalyticsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const { access, accessLoading } = useAppSelector((s) => s.creatorAnalytics);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(checkCreatorAccess());
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (!isAuthenticated && !accessLoading) {
      router.push('/login');
    }
  }, [isAuthenticated, accessLoading, router]);

  if (!isAuthenticated || accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <BarChart3 className="w-12 h-12 text-[var(--accent)] animate-pulse" />
          <p className="text-[var(--text-secondary)]">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!access?.hasAccess) {
    return <UpgradeScreen />;
  }

  return <AnalyticsDashboard />;
}
