import { Loader2 } from 'lucide-react';

export default function RootLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div
          className="absolute inset-0 rounded border rotate-45 animate-spin"
          style={{
            borderColor: 'var(--accent-muted)',
            animationDuration: '3s',
          }}
        />
        <div
          className="absolute inset-2 rounded border -rotate-45 animate-spin"
          style={{
            borderColor: 'var(--border)',
            animationDuration: '2s',
            animationDirection: 'reverse',
          }}
        />
        <Loader2
          className="w-5 h-5 text-accent animate-spin"
        />
      </div>

      {/* Loading text */}
      <div className="text-center space-y-1">
        <p
          className="text-[11px] font-mono tracking-[0.3em] animate-pulse"
          style={{ color: 'var(--text-secondary)' }}
        >
          Loading
        </p>
        <div
          className="mx-auto w-32 h-[2px] rounded-full overflow-hidden"
          style={{ background: 'var(--accent-muted)' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, var(--accent), var(--accent))',
              animation: 'loadingBar 1.5s ease-in-out infinite',
              width: '40%',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes loadingBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}
