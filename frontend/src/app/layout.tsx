import type { Metadata } from 'next';
import { Providers } from './providers';
import Header from '@/components/layout/Header';
import CyberBackground from '@/components/ui/CyberBackground';
import './globals.css';

export const metadata: Metadata = {
  title: 'PicUp - Cyber Visual Discovery Platform',
  description: 'Discover, collect, and share amazing products through a cyberpunk visual interface.',
  keywords: ['pinterest', 'visual discovery', 'products', 'shopping', 'ai images', 'cyberpunk'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen">
        <Providers>
          <CyberBackground />
          <Header />
          <main className="pt-16">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
