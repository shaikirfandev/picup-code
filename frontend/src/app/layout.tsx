import type { Metadata } from 'next';
import { Providers } from './providers';
import Header from '@/components/layout/Header';
import './globals.css';

export const metadata: Metadata = {
  title: 'PicUp - Visual Discovery & Product Platform',
  description: 'Discover, collect, and share amazing products through beautiful visual pins.',
  keywords: ['pinterest', 'visual discovery', 'products', 'shopping', 'ai images'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <Providers>
          <Header />
          <main className="pt-16">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
