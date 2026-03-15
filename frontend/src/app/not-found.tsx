'use client';

import Link from 'next/link';
import { Home, Search, ArrowLeft, Crosshair } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* HUD diamond icon */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div
            className="absolute inset-0 rounded border rotate-45 animate-pulse"
            style={{ borderColor: 'var(--edith-accent-muted)' }}
          />
          <div
            className="absolute inset-3 rounded border rotate-45"
            style={{ borderColor: 'var(--edith-border)' }}
          />
          <Crosshair className="w-8 h-8 text-edith-cyan relative z-10" />
        </div>

        {/* Error code */}
        <div className="space-y-3">
          <h1
            className="text-6xl font-display font-bold tracking-widest"
            style={{ color: 'var(--edith-accent)' }}
          >
            404
          </h1>
          <h2 className="text-lg font-display font-bold tracking-wide text-edith-text">
            TARGET NOT FOUND
          </h2>
          <p className="text-xs font-mono leading-relaxed" style={{ color: 'var(--edith-text-dim)' }}>
            // E.D.I.T.H scan complete — no matching target in database<br />
            // The requested resource has been moved or does not exist
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="btn-primary gap-2 text-[10px] py-2 px-5">
            <Home className="w-3.5 h-3.5" />
            RETURN HOME
          </Link>
          <Link href="/explore" className="btn-secondary gap-2 text-[10px] py-2 px-5">
            <Search className="w-3.5 h-3.5" />
            EXPLORE
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn-ghost gap-2 text-[10px] py-2 px-5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            GO BACK
          </button>
        </div>

        {/* Decorative scan line */}
        <div className="mx-auto w-48 h-[1px]" style={{
          background: 'linear-gradient(90deg, transparent, var(--edith-accent-muted), transparent)',
        }} />
      </div>
    </div>
  );
}
