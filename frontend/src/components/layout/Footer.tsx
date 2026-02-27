'use client';

import Link from 'next/link';
import { Crosshair, Github, Twitter, Mail, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { label: 'Home', href: '/' },
      { label: 'Explore', href: '/explore' },
      { label: 'Blog', href: '/blog' },
      { label: 'Tools', href: '/tools' },
    ],
    company: [
      { label: 'About', href: '/about' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Contact', href: '/contact' },
    ],
    resources: [
      { label: 'Help Center', href: '/help' },
      { label: 'API Docs', href: '/docs' },
      { label: 'Advertise', href: '/advertise' },
      { label: 'Pricing', href: '/pricing' },
    ],
  };

  return (
    <footer
      className="relative mt-20 border-t"
      style={{
        background: 'var(--edith-surface)',
        borderColor: 'var(--edith-border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <div className="absolute inset-0 rounded border border-edith-cyan/30 rotate-45" />
                <Crosshair className="w-4 h-4 text-edith-cyan relative z-10" />
              </div>
              <span className="text-[15px] font-display font-bold tracking-[0.2em] text-edith-cyan">
                E.D.I.T.H
              </span>
            </Link>
            <p className="text-sm font-mono text-[var(--edith-text-dim)] mb-4 max-w-xs">
              Visual discovery platform for products, AI art, and creative assets.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="text-[var(--edith-text-dim)] hover:text-edith-cyan transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="text-[var(--edith-text-dim)] hover:text-edith-cyan transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="text-[var(--edith-text-dim)] hover:text-edith-cyan transition-colors">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-edith-cyan/60 mb-4">
                {section}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm font-mono text-[var(--edith-text-dim)] hover:text-edith-cyan transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: 'var(--edith-border)' }}
        >
          <p className="text-[10px] font-mono text-[var(--edith-text-dim)]">
            &copy; {currentYear} E.D.I.T.H — All rights reserved.
          </p>
          <p className="text-[10px] font-mono text-[var(--edith-text-dim)] flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-edith-red" /> by Stark Industries
          </p>
        </div>
      </div>
    </footer>
  );
}
