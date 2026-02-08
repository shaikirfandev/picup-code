import type { Metadata } from 'next';
import { Providers } from './providers';
import Header from '@/components/layout/Header';
import './globals.css';

export const metadata: Metadata = {
  title: 'E.D.I.T.H — Visual Discovery & Target Analysis',
  description: 'Even Dead I\'m The Hero — Discover, collect, and analyze visual targets. Powered by Stark Tech.',
  keywords: ['pinterest', 'visual discovery', 'products', 'shopping', 'ai images'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <Providers>
          <Header />
          <main className="pt-14">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
