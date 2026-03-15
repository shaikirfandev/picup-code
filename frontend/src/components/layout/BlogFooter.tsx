'use client';

import Link from 'next/link';
import {
  Camera, Github, Twitter, Mail, Heart, Linkedin,
  Youtube, Rss, ArrowUpRight, Zap, BookOpen, Shield,
  FileText, HelpCircle, Globe, Code,
} from 'lucide-react';

const FOOTER_NAV = {
  Platform: [
    { label: 'Home', href: '/' },
    { label: 'Explore', href: '/explore' },
    { label: 'Blog', href: '/blog' },
    { label: 'Create Post', href: '/create' },
    { label: 'Boards', href: '/boards' },
  ],
  Blog: [
    { label: 'Latest Articles', href: '/blog' },
    { label: 'Technology', href: '/blog?category=technology' },
    { label: 'AI & ML', href: '/blog?category=ai' },
    { label: 'Web Development', href: '/blog?category=web-development' },
    { label: 'Write Article', href: '/blog/create' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Contact', href: '/contact' },
    { label: 'Careers', href: '/careers' },
  ],
  Resources: [
    { label: 'Help Center', href: '/help' },
    { label: 'API Docs', href: '/docs' },
    { label: 'Advertise', href: '/advertise' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Status', href: '/status' },
  ],
};

const SOCIAL_LINKS = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Github, href: '#', label: 'GitHub' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Youtube, href: '#', label: 'YouTube' },
  { icon: Rss, href: '/blog', label: 'RSS' },
  { icon: Mail, href: 'mailto:hello@picup.app', label: 'Email' },
];

export default function BlogFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-24 border-t" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] dark:opacity-60 opacity-30"
        style={{ background: 'linear-gradient(90deg, transparent 5%, var(--accent-muted) 30%, var(--accent-subtle) 50%, transparent 95%)' }} />

      {/* Newsletter CTA */}
      <div className="max-w-7xl mx-auto px-4 pt-12 pb-8">
        <div className="rounded-xl p-6 md:p-8 mb-12 relative overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full"
              style={{ background: 'radial-gradient(circle, transparent 0%, transparent 70%)' }} />
          </div>
          <div className="relative flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-accent" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent/70">Newsletter</span>
              </div>
              <h3 className="text-lg font-semibold font-bold mb-1" style={{ color: 'var(--foreground)' }}>
                Stay ahead in tech
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Get the latest articles, tutorials, and insights delivered to your inbox weekly.
              </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="input-field text-xs flex-1 md:w-64"
              />
              <button className="btn-primary text-[10px] px-5 shrink-0">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand col */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <div className="absolute inset-0 rounded border border-accent/30 rotate-45 group-hover:rotate-[225deg] transition-transform duration-700" />
                <Camera className="w-4 h-4 text-accent relative z-10" />
              </div>
              <span className="text-[15px] font-semibold font-bold tracking-[0.2em] text-accent">
                Picup
              </span>
            </Link>
            <p className="text-xs mb-5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Visual discovery & tech blog platform. Explore products, AI art, creative assets, and stay up-to-date with the latest in technology.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:text-accent"
                  style={{ background: 'var(--accent-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                >
                  <s.icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Nav cols */}
          {Object.entries(FOOTER_NAV).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4 text-accent/60">
                {section}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-xs hover:text-accent transition-colors flex items-center gap-1 group"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {link.label}
                      <ArrowUpRight className="w-2.5 h-2.5 opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-10 py-6 rounded-lg"
          style={{ background: 'var(--accent-subtle)', border: '1px solid var(--border)' }}>
          {[
            { icon: Shield, text: 'SSL Encrypted' },
            { icon: Globe, text: 'Open Platform' },
            { icon: Code, text: 'API Available' },
            { icon: BookOpen, text: 'Community Driven' },
            { icon: FileText, text: 'Free to Publish' },
            { icon: HelpCircle, text: '24/7 Support' },
          ].map((badge) => (
            <div key={badge.text} className="flex items-center gap-1.5">
              <badge.icon className="w-3 h-3 text-accent/50" />
              <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{badge.text}</span>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: 'var(--border)' }}>
          <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            &copy; {year} Picup &mdash; All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-[10px] hover:text-accent transition-colors" style={{ color: 'var(--text-secondary)' }}>Privacy</Link>
            <Link href="/terms" className="text-[10px] hover:text-accent transition-colors" style={{ color: 'var(--text-secondary)' }}>Terms</Link>
            <Link href="/contact" className="text-[10px] hover:text-accent transition-colors" style={{ color: 'var(--text-secondary)' }}>Contact</Link>
          </div>
          <p className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
            Built with <Heart className="w-3 h-3 text-error" /> by Picup Team
          </p>
        </div>
      </div>
    </footer>
  );
}
