'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { setTokens, fetchUser } from '@/store/slices/authSlice';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = searchParams.get('token');
    const refresh = searchParams.get('refresh');

    if (token && refresh) {
      dispatch(setTokens({ accessToken: token, refreshToken: refresh }));
      dispatch(fetchUser()).then(() => router.replace('/'));
    } else {
      router.replace('/login');
    }
  }, [searchParams, dispatch, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-surface-500">Completing sign in...</p>
      </div>
    </div>
  );
}
