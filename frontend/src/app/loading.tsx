import { Crosshair } from 'lucide-react';

export default function RootLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
      {/* Animated HUD diamond */}
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div
          className="absolute inset-0 rounded border rotate-45 animate-spin"
          style={{
            borderColor: 'var(--edith-accent-muted)',
            animationDuration: '3s',
          }}
        />
        <div
          className="absolute inset-2 rounded border -rotate-45 animate-spin"
          style={{
            borderColor: 'var(--edith-border)',
            animationDuration: '2s',
            animationDirection: 'reverse',
          }}
        />
        <Crosshair
          className="w-5 h-5 text-edith-cyan animate-pulse"
        />
      </div>

      {/* Loading text */}
      <div className="text-center space-y-1">
        <p
          className="text-[11px] font-mono tracking-[0.3em] animate-pulse"
          style={{ color: 'var(--edith-text-dim)' }}
        >
          INITIALIZING E.D.I.T.H
        </p>
        <div
          className="mx-auto w-32 h-[2px] rounded-full overflow-hidden"
          style={{ background: 'var(--edith-accent-muted)' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, var(--edith-cyan), var(--edith-blue))',
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
