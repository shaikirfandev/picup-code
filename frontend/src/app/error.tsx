'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Error]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded border border-red-500/30 rotate-45 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400 -rotate-45" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-wide text-foreground">
            SYSTEM MALFUNCTION
          </h2>
          <p className="text-xs font-mono text-text-secondary leading-relaxed">
            // Something went wrong<br />
            // Diagnostic data captured for analysis
          </p>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-[10px] font-mono text-red-400/60 mt-2 break-all">
              {error.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-medium
                       border border-accent/30 text-accent rounded
                       hover:bg-accent/10 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            RETRY
          </button>
          <a
            href="/"
            className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-medium
                       border border-border text-text-secondary rounded
                       hover:bg-surface-elevated transition-colors"
          >
            <Home className="w-3 h-3" />
            HOME
          </a>
        </div>
      </div>
    </div>
  );
}
