'use client';

import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { store } from '@/store';
import { fetchUser } from '@/store/slices/authSlice';
import { SocketContext } from '@/components/providers/SocketContext';

function AuthInit() {
  useEffect(() => {
    store.dispatch(fetchUser());
  }, []);
  return null;
}

/**
 * Lazily loads SocketProvider only on the client.
 * Children are ALWAYS rendered immediately — socket context upgrades in-place
 * once the chunk loads, so the page is never blank.
 */
function LazySocketProvider({ children }: { children: React.ReactNode }) {
  const [Loaded, setLoaded] = useState<React.ComponentType<{ children: React.ReactNode }> | null>(null);

  useEffect(() => {
    import('@/components/providers/SocketProvider').then((m) => {
      setLoaded(() => m.SocketProvider);
    });
  }, []);

  if (Loaded) return <Loaded>{children}</Loaded>;

  // Before chunk loads, provide null socket context so useSocket() doesn't throw
  return (
    <SocketContext.Provider value={null}>
      {children}
    </SocketContext.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true}>
      <AuthInit />
      <LazySocketProvider>
        {children}
      </LazySocketProvider>
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--edith-elevated)',
            color: 'var(--edith-text)',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: "var(--font-mono, 'JetBrains Mono'), monospace",
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
