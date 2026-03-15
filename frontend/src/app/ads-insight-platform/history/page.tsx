'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchActivityTimeline } from '@/store/slices/adsInsightSlice';
import ActivityTimeline from '@/components/ads-insight/ActivityTimeline';
import { History } from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const isPaid = user?.role === 'admin' || (user?.accountType === 'paid' && user?.subscription?.isActive);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!isPaid) { router.push('/ads-insight-platform'); return; }
    dispatch(fetchActivityTimeline({ page: 1, limit: 30 }));
  }, [isAuthenticated, isPaid, dispatch, router]);

  if (!isAuthenticated || !isPaid) {
    return <div className="min-h-screen flex items-center justify-center"><History className="w-12 h-12 text-[var(--accent)] animate-pulse" /></div>;
  }

  return <ActivityTimeline />;
}
