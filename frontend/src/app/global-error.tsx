'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[E.D.I.T.H Critical Error]', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#050510',
          color: 'rgba(200, 230, 255, 0.92)',
          fontFamily: "'Rajdhani', 'Inter', sans-serif",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center', padding: 24 }}>
          {/* Error icon */}
          <div
            style={{
              width: 64,
              height: 64,
              margin: '0 auto 24px',
              border: '1px solid rgba(255, 51, 51, 0.3)',
              borderRadius: 4,
              transform: 'rotate(45deg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                transform: 'rotate(-45deg)',
                fontSize: 28,
                color: '#ff4d4d',
              }}
            >
              ⚠
            </span>
          </div>

          <h1
            style={{
              fontSize: 20,
              fontFamily: "'Orbitron', sans-serif",
              fontWeight: 700,
              letterSpacing: '0.15em',
              marginBottom: 8,
            }}
          >
            CRITICAL SYSTEM FAILURE
          </h1>
          <p
            style={{
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              color: 'rgba(140, 170, 200, 0.5)',
              lineHeight: 1.8,
              marginBottom: 8,
            }}
          >
            // E.D.I.T.H root process encountered a fatal error<br />
            // All subsystems are offline
          </p>

          {process.env.NODE_ENV === 'development' && (
            <p
              style={{
                fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace",
                color: 'rgba(255, 77, 77, 0.6)',
                wordBreak: 'break-all',
                marginBottom: 24,
              }}
            >
              {error.message}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
            <button
              onClick={reset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 500,
                border: '1px solid rgba(0, 212, 255, 0.3)',
                color: '#00d4ff',
                background: 'rgba(0, 212, 255, 0.05)',
                borderRadius: 4,
                cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
            >
              ↻ REBOOT SYSTEM
            </button>
            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 500,
                border: '1px solid rgba(200, 230, 255, 0.12)',
                color: 'rgba(140, 170, 200, 0.5)',
                background: 'transparent',
                borderRadius: 4,
                cursor: 'pointer',
                textDecoration: 'none',
                letterSpacing: '0.05em',
              }}
            >
              ⌂ HOME
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
