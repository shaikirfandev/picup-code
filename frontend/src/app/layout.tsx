import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Poppins, JetBrains_Mono } from 'next/font/google';
import { Providers } from './providers';
import Header from '@/components/layout/Header';
import dynamic from 'next/dynamic';
import './globals.css';

/* ── Self-hosted fonts via next/font (no render-blocking @import) ── */
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
  preload: false,
});

/* ── Lazy-load MobileSidebar (only needed on interaction) ── */
const MobileSidebar = dynamic(() => import('@/components/layout/MobileSidebar'), {
  ssr: false,
});

export const metadata: Metadata = {
  title: {
    default: 'mepiks — Your Space for Inspiration',
    template: '%s | mepiks',
  },
  description:
    'mepiks is a visual discovery platform to explore, save, and share images, AI art, products, and creative inspiration.',
  keywords: [
    'visual discovery',
    'image sharing',
    'pinterest alternative',
    'AI image generator',
    'product discovery',
    'creative inspiration',
    'mood boards',
    'design inspiration',
    'photo sharing platform',
    'mepiks',
  ],
  authors: [{ name: 'mepiks Team' }],
  creator: 'mepiks',
  publisher: 'mepiks',
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'mepiks',
    title: 'mepiks — Your Space for Inspiration',
    description:
      'Discover, save, and share visual inspiration. Explore AI-generated art, products, creative ideas and more.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'mepiks — Your Space for Inspiration',
    description:
      'Discover, save, and share visual inspiration. Explore AI-generated art, products, creative ideas and more.',
  },
  alternates: {
    canonical: '/',
  },
  category: 'technology',
  other: {
    'theme-color': '#111111',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'mepiks',
  alternateName: 'mepiks',
  url: 'https://mepiks.app',
  description:
    'Visual discovery platform to explore, save, and share images, AI art, products, and creative inspiration.',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'Visual discovery and inspiration boards',
    'AI image generation',
    'Product bookmarking and price tracking',
    'Community-driven content sharing',
    'Multi-image uploads',
    'Blog and creative tools',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${poppins.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen font-sans bg-background text-foreground antialiased">
        <Providers>
          <Header />
          <Suspense fallback={null}>
            <MobileSidebar />
          </Suspense>
          <main className="pt-14">
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-6 h-6 border-2 border-neutral-300 border-t-transparent rounded-full animate-spin" />
              </div>
            }>
              {children}
            </Suspense>
          </main>
        </Providers>
      </body>
    </html>
  );
}
