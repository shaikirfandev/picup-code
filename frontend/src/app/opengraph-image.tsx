import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };
export const alt = 'Picup — Visual Discovery & Inspiration';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #050510 0%, #0a0a2e 50%, #050510 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Grid overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.06,
            backgroundImage:
              'linear-gradient(rgba(0,200,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.4) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Diamond icon */}
        <div
          style={{
            display: 'flex',
            width: 80,
            height: 80,
            border: '2px solid rgba(0,212,255,0.4)',
            borderRadius: 8,
            transform: 'rotate(45deg)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          <span
            style={{
              transform: 'rotate(-45deg)',
              fontSize: 32,
              color: '#00d4ff',
            }}
          >
            ⊕
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: 64,
            fontWeight: 900,
            letterSpacing: '0.2em',
            color: '#00d4ff',
            textShadow: '0 0 40px rgba(0,212,255,0.4)',
            marginBottom: 16,
          }}
        >
          Picup
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: 'flex',
            fontSize: 22,
            letterSpacing: '0.15em',
            color: 'rgba(140,170,200,0.6)',
            textTransform: 'uppercase',
          }}
        >
          Visual Discovery & Inspiration
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            width: 300,
            height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.4), transparent)',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
