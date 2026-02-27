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
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true}>
      <AuthInit />
      {children}
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(10,10,26,0.95)',
            color: 'rgba(200,230,255,0.9)',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: "'JetBrains Mono', monospace",
            border: '1px solid rgba(0,212,255,0.15)',
            boxShadow: '0 0 20px rgba(0,212,255,0.1)',
            padding: '12px 16px',
          },
        }}
      />
    </ThemeProvider>
    </Provider>
  );
}
