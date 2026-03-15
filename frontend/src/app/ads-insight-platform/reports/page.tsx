'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchCampaignReport, fetchReportTemplates } from '@/store/slices/adsInsightSlice';
import AdReporting from '@/components/ads-insight/AdReporting';
import { BarChart3 } from 'lucide-react';

export default function ReportsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const isPaid = user?.role === 'admin' || (user?.accountType === 'paid' && user?.subscription?.isActive);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!isPaid) { router.push('/ads-insight-platform'); return; }
    dispatch(fetchReportTemplates());
  }, [isAuthenticated, isPaid, dispatch, router]);

  if (!isAuthenticated || !isPaid) {
    return <div className="min-h-screen flex items-center justify-center"><BarChart3 className="w-12 h-12 text-[var(--accent)] animate-pulse" /></div>;
  }

  return <AdReporting />;
}
