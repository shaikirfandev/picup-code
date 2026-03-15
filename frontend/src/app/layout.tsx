import type { Metadata } from 'next';
import { Suspense } from 'react';
import { JetBrains_Mono, Orbitron, Rajdhani } from 'next/font/google';
import { Providers } from './providers';
import Header from '@/components/layout/Header';
import dynamic from 'next/dynamic';
import './globals.css';

/* ── Self-hosted fonts via next/font (no render-blocking @import) ── */
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
  preload: true,
});

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
  preload: true,
});

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
  preload: false,
});

/* ── Lazy-load MobileSidebar (only needed on interaction) ── */
const MobileSidebar = dynamic(() => import('@/components/layout/MobileSidebar'), {
  ssr: false,
});

export const metadata: Metadata = {
  title: {
    default: 'E.D.I.T.H — Visual Discovery & Target Analysis',
    template: '%s | E.D.I.T.H',
  },
  description:
    'E.D.I.T.H (Even Dead I\'m The Hero) is a visual discovery platform to explore, save, and share images, AI art, products, and creative inspiration. Powered by AI.',
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
    'e.d.i.t.h',
    'picup',
  ],
  authors: [{ name: 'E.D.I.T.H Team' }],
  creator: 'E.D.I.T.H',
  publisher: 'E.D.I.T.H',
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
    siteName: 'E.D.I.T.H',
    title: 'E.D.I.T.H — Visual Discovery & Target Analysis',
    description:
      'Discover, save, and share visual inspiration. Explore AI-generated art, products, creative ideas and more.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'E.D.I.T.H — Visual Discovery & Target Analysis',
    description:
      'Discover, save, and share visual inspiration. Explore AI-generated art, products, creative ideas and more.',
  },
  alternates: {
    canonical: '/',
  },
  category: 'technology',
  other: {
    'theme-color': '#00d4ff',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'E.D.I.T.H',
  alternateName: 'Picup',
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
    <html lang="en" suppressHydrationWarning className={`${jetbrainsMono.variable} ${orbitron.variable} ${rajdhani.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen font-mono">
        <Providers>
          <Header />
          <Suspense fallback={null}>
            <MobileSidebar />
          </Suspense>
          <main className="pt-14">
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-6 h-6 border-2 border-edith-cyan border-t-transparent rounded-full animate-spin" />
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
