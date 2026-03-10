import type { Metadata } from 'next';
import { Providers } from './providers';
import Header from '@/components/layout/Header';
import ScrollHoverGuard from '@/components/ui/ScrollHoverGuard';
import { JetBrains_Mono, Rajdhani, Lora, Source_Serif_4, Orbitron } from 'next/font/google';
import './globals.css';

/* ── Fonts via next/font — auto-preloaded, swap, no layout shift ── */
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
  preload: true,
});

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-rajdhani',
  display: 'swap',
  preload: true,
});

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-orbitron',
  display: 'swap',
  preload: true,
});

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
  display: 'swap',
  preload: true,
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-source-serif',
  display: 'swap',
  preload: true,
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`min-h-screen ${jetbrainsMono.variable} ${rajdhani.variable} ${orbitron.variable} ${lora.variable} ${sourceSerif.variable}`}>
        <ScrollHoverGuard />
        <Providers>
          <Header />
          <main className="pt-14">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
