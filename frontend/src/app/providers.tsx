'use client';

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { store } from '@/store';
import { fetchUser } from '@/store/slices/authSlice';

function AuthInit() {
  useEffect(() => {
    store.dispatch(fetchUser());
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
        <AuthInit />
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(14, 14, 30, 0.95)',
              color: '#00f0ff',
              borderRadius: '12px',
              fontSize: '13px',
              padding: '12px 16px',
              border: '1px solid rgba(0, 240, 255, 0.15)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 240, 255, 0.05)',
              fontFamily: 'JetBrains Mono, monospace',
              backdropFilter: 'blur(20px)',
            },
          }}
        />
      </ThemeProvider>
    </Provider>
  );
}
