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
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthInit />
      {children}
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--toast-bg, #18181b)',
            color: 'var(--toast-color, #fafafa)',
            borderRadius: '12px',
            fontSize: '14px',
            padding: '12px 16px',
          },
        }}
      />
    </ThemeProvider>
    </Provider>
  );
}
