'use client';

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { store } from '@/store';
import { fetchUser } from '@/store/slices/authSlice';
import { SocketProvider } from '@/components/providers/SocketProvider';

function AuthInit() {
  useEffect(() => {
    store.dispatch(fetchUser());
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true}>
      <AuthInit />
      <SocketProvider>
      {children}
      </SocketProvider>
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--edith-elevated)',
            color: 'var(--edith-text)',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: "'JetBrains Mono', monospace",
            border: '1px solid var(--edith-border)',
            boxShadow: 'var(--edith-shadow-lg)',
            padding: '12px 16px',
          },
        }}
      />
    </ThemeProvider>
    </Provider>
  );
}
