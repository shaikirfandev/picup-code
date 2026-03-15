'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import MediaPlanner from '@/components/ads-insight/MediaPlanner';
import { Calculator } from 'lucide-react';

export default function MediaPlannerPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const isPaid = user?.role === 'admin' || (user?.accountType === 'paid' && user?.subscription?.isActive);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!isPaid) { router.push('/ads-insight-platform'); return; }
  }, [isAuthenticated, isPaid, router]);

  if (!isAuthenticated || !isPaid) {
    return <div className="min-h-screen flex items-center justify-center"><Calculator className="w-12 h-12 text-[var(--accent)] animate-pulse" /></div>;
  }

  return <MediaPlanner />;
}
