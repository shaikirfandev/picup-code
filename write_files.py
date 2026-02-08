#!/usr/bin/env python3
"""Write all cyber-themed frontend files."""
import os

BASE = '/Users/macbook/Desktop/FullStack-App/picup/frontend/src'

files = {}

# ============================================================
# tailwind.config.js
# ============================================================
files['/Users/macbook/Desktop/FullStack-App/picup/frontend/tailwind.config.js'] = r"""/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7ff', 100: '#d0ebff', 200: '#a4d4ff', 300: '#6cb8ff',
          400: '#38a3ff', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1',
          800: '#075985', 900: '#0c4a6e', 950: '#082f49',
        },
        surface: {
          50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4',
          400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e',
          800: '#115e59', 900: '#134e4a', 950: '#042f2e',
        },
        cyber: {
          black: '#0a0a0f', dark: '#0d0d14', deeper: '#10101a',
          panel: '#121220', card: '#14142a', border: '#1e1e3a',
          glow: '#00f0ff', neon: '#00ff88', pink: '#ff00aa',
          purple: '#bf00ff', amber: '#ffb800', red: '#ff003c', blue: '#0066ff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'matrix-in': 'matrixIn 0.6s ease-out forwards',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'scan-line': 'scanLine 3s linear infinite',
        'holo-shift': 'holoShift 6s ease-in-out infinite',
        'border-glow': 'borderGlow 3s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'glitch': 'glitch 0.3s ease-in-out',
        'cyber-reveal': 'cyberReveal 0.8s ease-out forwards',
        'data-stream': 'dataStream 1.5s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        matrixIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)', filter: 'blur(4px)' },
          '50%': { opacity: '0.7', filter: 'blur(1px)' },
          '100%': { opacity: '1', transform: 'translateY(0)', filter: 'blur(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0,240,255,0.3), 0 0 15px rgba(0,240,255,0.1)' },
          '50%': { boxShadow: '0 0 15px rgba(0,240,255,0.5), 0 0 40px rgba(0,240,255,0.2)' },
        },
        scanLine: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100%)' } },
        holoShift: { '0%, 100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        borderGlow: { '0%, 100%': { borderColor: 'rgba(0,240,255,0.3)' }, '50%': { borderColor: 'rgba(0,240,255,0.7)' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        glitch: {
          '0%': { transform: 'translate(0)' }, '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' }, '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' }, '100%': { transform: 'translate(0)' },
        },
        cyberReveal: { '0%': { clipPath: 'inset(0 100% 0 0)', opacity: '0' }, '100%': { clipPath: 'inset(0 0% 0 0)', opacity: '1' } },
        dataStream: { '0%': { backgroundPosition: '0% 0%' }, '100%': { backgroundPosition: '0% 100%' } },
      },
      screens: { xs: '475px' },
      boxShadow: {
        cyber: '0 0 15px rgba(0,240,255,0.15), 0 0 30px rgba(0,240,255,0.05)',
        'cyber-lg': '0 0 30px rgba(0,240,255,0.2), 0 0 60px rgba(0,240,255,0.1)',
        neon: '0 0 10px rgba(0,255,136,0.3), 0 0 20px rgba(0,255,136,0.1)',
        'neon-pink': '0 0 10px rgba(255,0,170,0.3), 0 0 20px rgba(255,0,170,0.1)',
      },
    },
  },
  plugins: [],
};
"""

# ============================================================
# globals.css - Complete cyber glass theme
# ============================================================
files[f'{BASE}/app/globals.css'] = r"""@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

@layer base {
  :root {
    --cyber-glow: #00f0ff;
    --cyber-neon: #00ff88;
    --cyber-pink: #ff00aa;
    --cyber-purple: #bf00ff;
    --cyber-amber: #ffb800;
    --cyber-bg: #0a0a0f;
    --cyber-card: #14142a;
    --cyber-border: #1e1e3a;
    --glass-bg: rgba(14, 14, 30, 0.7);
    --glass-border: rgba(0, 240, 255, 0.12);
    --glass-shine: rgba(0, 240, 255, 0.03);
  }

  * {
    border-color: var(--cyber-border);
  }

  body {
    background: var(--cyber-bg);
    color: #e0e0f0;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Cyber scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
  ::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, var(--cyber-glow), var(--cyber-purple));
    border-radius: 10px;
  }
  ::-webkit-scrollbar-thumb:hover { background: var(--cyber-glow); }

  ::selection {
    background: rgba(0, 240, 255, 0.25);
    color: #fff;
  }
}

@layer components {
  /* === CYBER GLASS CARDS === */
  .cyber-glass {
    background: linear-gradient(135deg, rgba(14,14,30,0.8), rgba(20,20,42,0.6));
    backdrop-filter: blur(20px) saturate(1.2);
    -webkit-backdrop-filter: blur(20px) saturate(1.2);
    border: 1px solid rgba(0, 240, 255, 0.1);
    box-shadow:
      0 0 0 1px rgba(0, 240, 255, 0.05) inset,
      0 4px 30px rgba(0, 0, 0, 0.4),
      0 0 15px rgba(0, 240, 255, 0.03);
  }

  .cyber-glass-strong {
    background: linear-gradient(135deg, rgba(14,14,30,0.92), rgba(20,20,42,0.85));
    backdrop-filter: blur(30px) saturate(1.4);
    -webkit-backdrop-filter: blur(30px) saturate(1.4);
    border: 1px solid rgba(0, 240, 255, 0.15);
    box-shadow:
      0 0 0 1px rgba(0, 240, 255, 0.08) inset,
      0 8px 40px rgba(0, 0, 0, 0.5),
      0 0 20px rgba(0, 240, 255, 0.05);
  }

  /* === BUTTONS === */
  .btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.625rem 1.25rem;
    border-radius: 0.75rem;
    font-weight: 600;
    font-size: 0.875rem;
    color: #0a0a0f;
    background: linear-gradient(135deg, var(--cyber-glow), #00c8e0);
    border: 1px solid rgba(0, 240, 255, 0.4);
    box-shadow: 0 0 15px rgba(0, 240, 255, 0.25), 0 0 30px rgba(0, 240, 255, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    position: relative;
    overflow: hidden;
  }
  .btn-primary::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, transparent, rgba(255,255,255,0.15), transparent);
    transform: translateX(-100%);
    transition: transform 0.5s ease;
  }
  .btn-primary:hover::before { transform: translateX(100%); }
  .btn-primary:hover {
    box-shadow: 0 0 25px rgba(0, 240, 255, 0.4), 0 0 50px rgba(0, 240, 255, 0.15);
    transform: translateY(-1px);
  }
  .btn-primary:active { transform: translateY(0) scale(0.98); }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.625rem 1.25rem;
    border-radius: 0.75rem;
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--cyber-glow);
    background: rgba(0, 240, 255, 0.06);
    border: 1px solid rgba(0, 240, 255, 0.2);
    transition: all 0.3s ease;
  }
  .btn-secondary:hover {
    background: rgba(0, 240, 255, 0.12);
    border-color: rgba(0, 240, 255, 0.4);
    box-shadow: 0 0 15px rgba(0, 240, 255, 0.15);
  }
  .btn-secondary:disabled { opacity: 0.4; cursor: not-allowed; }

  .btn-ghost {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 0.875rem;
    border-radius: 0.75rem;
    font-weight: 500;
    font-size: 0.875rem;
    color: rgba(224, 224, 240, 0.7);
    background: transparent;
    border: 1px solid transparent;
    transition: all 0.3s ease;
  }
  .btn-ghost:hover {
    color: var(--cyber-glow);
    background: rgba(0, 240, 255, 0.06);
    border-color: rgba(0, 240, 255, 0.1);
  }
  .btn-ghost:disabled { opacity: 0.4; }

  .btn-danger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.625rem 1.25rem;
    border-radius: 0.75rem;
    font-weight: 600;
    font-size: 0.875rem;
    background: linear-gradient(135deg, #ff003c, #cc0030);
    color: white;
    border: 1px solid rgba(255, 0, 60, 0.4);
    box-shadow: 0 0 15px rgba(255, 0, 60, 0.2);
    transition: all 0.3s ease;
  }
  .btn-danger:hover {
    box-shadow: 0 0 25px rgba(255, 0, 60, 0.35);
  }

  /* === INPUT FIELDS === */
  .input-field {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    background: rgba(10, 10, 15, 0.6);
    border: 1px solid rgba(0, 240, 255, 0.12);
    color: #e0e0f0;
    font-size: 0.875rem;
    transition: all 0.3s ease;
    outline: none;
    backdrop-filter: blur(10px);
  }
  .input-field::placeholder { color: rgba(224, 224, 240, 0.3); }
  .input-field:focus {
    border-color: var(--cyber-glow);
    box-shadow: 0 0 0 3px rgba(0, 240, 255, 0.1), 0 0 15px rgba(0, 240, 255, 0.08);
    background: rgba(10, 10, 15, 0.8);
  }

  /* === CARDS === */
  .card {
    background: linear-gradient(135deg, rgba(14,14,30,0.85), rgba(20,20,42,0.7));
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 1rem;
    border: 1px solid rgba(0, 240, 255, 0.08);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .card:hover {
    border-color: rgba(0, 240, 255, 0.2);
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 240, 255, 0.08);
  }

  .glass-card {
    background: var(--glass-bg);
    backdrop-filter: blur(24px) saturate(1.3);
    -webkit-backdrop-filter: blur(24px) saturate(1.3);
    border-radius: 1rem;
    border: 1px solid var(--glass-border);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--glass-shine) inset;
  }

  /* === SKELETON === */
  .skeleton {
    border-radius: 0.5rem;
    background: linear-gradient(90deg, rgba(30,30,58,0.5) 25%, rgba(0,240,255,0.05) 50%, rgba(30,30,58,0.5) 75%);
    background-size: 200% 100%;
    animation: shimmer 2s linear infinite;
  }

  .shimmer {
    position: relative;
    overflow: hidden;
  }

  /* === MASONRY === */
  .masonry-grid {
    display: flex;
    margin-left: -12px;
    width: auto;
  }
  .masonry-grid-column {
    padding-left: 12px;
    background-clip: padding-box;
  }

  /* === PIN CARDS === */
  .pin-card {
    position: relative;
    cursor: pointer;
    overflow: visible;
    border-radius: 1rem;
    margin-bottom: 0.75rem;
    break-inside: avoid;
    perspective: 800px;
  }

  .pin-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 0%, transparent 40%, rgba(0,0,0,0.7) 100%);
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 0.75rem;
    border-radius: 1rem;
    z-index: 10;
  }

  .pin-overlay > * {
    opacity: 0;
    transform: translateY(8px);
    transition: all 0.3s ease;
  }

  /* === CYBER GRID BACKGROUND === */
  .cyber-grid-bg {
    background-image:
      linear-gradient(rgba(0,240,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,240,255,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  /* === SCAN LINE OVERLAY === */
  .scan-lines::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 240, 255, 0.015) 2px,
      rgba(0, 240, 255, 0.015) 4px
    );
    z-index: 1;
  }

  /* === HOLOGRAPHIC BORDER === */
  .holo-border {
    position: relative;
  }
  .holo-border::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    background: linear-gradient(135deg, var(--cyber-glow), var(--cyber-purple), var(--cyber-pink), var(--cyber-glow));
    background-size: 300% 300%;
    animation: holoShift 6s ease-in-out infinite;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  .holo-border:hover::before { opacity: 1; }

  /* === NEON TEXT === */
  .neon-text {
    color: var(--cyber-glow);
    text-shadow: 0 0 7px rgba(0,240,255,0.5), 0 0 20px rgba(0,240,255,0.2), 0 0 40px rgba(0,240,255,0.1);
  }

  .neon-text-pink {
    color: var(--cyber-pink);
    text-shadow: 0 0 7px rgba(255,0,170,0.5), 0 0 20px rgba(255,0,170,0.2);
  }

  .neon-text-green {
    color: var(--cyber-neon);
    text-shadow: 0 0 7px rgba(0,255,136,0.5), 0 0 20px rgba(0,255,136,0.2);
  }
}

@layer utilities {
  .text-gradient {
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    background-image: linear-gradient(135deg, var(--cyber-glow), var(--cyber-purple));
  }

  .text-gradient-neon {
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    background-image: linear-gradient(135deg, var(--cyber-neon), var(--cyber-glow));
  }

  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar { display: none; }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* 3D perspective container */
  .perspective-container {
    perspective: 1000px;
    transform-style: preserve-3d;
  }
}

/* === GLOBAL BACKGROUND AMBIENCE === */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  background:
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0,240,255,0.06), transparent),
    radial-gradient(ellipse 60% 40% at 80% 100%, rgba(191,0,255,0.04), transparent),
    radial-gradient(ellipse 60% 40% at 20% 100%, rgba(0,255,136,0.03), transparent);
}
"""

# ============================================================
# MatrixText component
# ============================================================
files[f'{BASE}/components/ui/MatrixText.tsx'] = r"""'use client';

import { useState, useEffect, useRef } from 'react';

interface MatrixTextProps {
  text: string;
  className?: string;
  delay?: number;
  speed?: number;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'div';
  glowColor?: string;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*<>{}[]|/\\~';

export default function MatrixText({
  text,
  className = '',
  delay = 0,
  speed = 30,
  as: Tag = 'span',
  glowColor = 'rgba(0,240,255,0.6)',
}: MatrixTextProps) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef(0);
  const iterRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    indexRef.current = 0;
    iterRef.current = 0;
    setDisplayed('');

    intervalRef.current = setInterval(() => {
      const idx = indexRef.current;
      const iter = iterRef.current;

      if (idx >= text.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayed(text);
        return;
      }

      // Build the string: resolved chars + scrambled current + faded rest
      let result = text.slice(0, idx);
      if (iter < 3) {
        result += CHARS[Math.floor(Math.random() * CHARS.length)];
        iterRef.current++;
      } else {
        result += text[idx];
        indexRef.current++;
        iterRef.current = 0;
      }

      setDisplayed(result);
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [started, text, speed]);

  return (
    <Tag
      className={`font-mono ${className}`}
      style={{
        textShadow: started ? `0 0 8px ${glowColor}` : 'none',
      }}
    >
      {displayed}
      {displayed.length < text.length && started && (
        <span className="inline-block w-[2px] h-[1em] bg-cyber-glow animate-pulse ml-0.5 align-middle" />
      )}
    </Tag>
  );
}
"""

# ============================================================
# CyberHexagonBg component
# ============================================================
files[f'{BASE}/components/ui/CyberBackground.tsx'] = r"""'use client';

export default function CyberBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Cyber grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,240,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.04) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Ambient glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-cyber-glow/[0.03] blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-cyber-purple/[0.04] blur-[100px]" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] rounded-full bg-cyber-neon/[0.02] blur-[80px]" />

      {/* Scan line */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute left-0 right-0 h-[2px] animate-scan-line"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.15), transparent)',
          }}
        />
      </div>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-32 h-32">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-cyber-glow/30 to-transparent" />
        <div className="absolute top-0 left-0 h-full w-[1px] bg-gradient-to-b from-cyber-glow/30 to-transparent" />
      </div>
      <div className="absolute top-0 right-0 w-32 h-32">
        <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-l from-cyber-glow/30 to-transparent" />
        <div className="absolute top-0 right-0 h-full w-[1px] bg-gradient-to-b from-cyber-glow/30 to-transparent" />
      </div>
    </div>
  );
}
"""

# ============================================================
# GlassCard 3D tilt component
# ============================================================
files[f'{BASE}/components/ui/GlassTilt.tsx'] = r"""'use client';

import { useRef, useState, useCallback } from 'react';

interface GlassTiltProps {
  children: React.ReactNode;
  className?: string;
  tiltAmount?: number;
  glareOpacity?: number;
  scale?: number;
}

export default function GlassTilt({
  children,
  className = '',
  tiltAmount = 12,
  glareOpacity = 0.15,
  scale = 1.04,
}: GlassTiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotateX = (0.5 - y) * tiltAmount;
      const rotateY = (x - 0.5) * tiltAmount;
      setTransform(
        `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`
      );
      setGlare({ x: x * 100, y: y * 100, opacity: glareOpacity });
    },
    [tiltAmount, glareOpacity, scale]
  );

  const handleMouseLeave = useCallback(() => {
    setTransform('perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)');
    setGlare({ x: 50, y: 50, opacity: 0 });
  }, []);

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform,
        transition: 'transform 0.15s ease-out',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
    >
      {children}
      {/* Glare overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] z-20"
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(0,240,255,${glare.opacity}), transparent 60%)`,
          transition: 'opacity 0.2s ease',
        }}
      />
    </div>
  );
}
"""

# ============================================================
# PostCard - Full Cyber 3D Glass with matrix info
# ============================================================
files[f'{BASE}/components/feed/PostCard.tsx'] = r"""'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Heart, Bookmark, ExternalLink, Share2, Sparkles,
  Play, Volume2, VolumeX, Eye, Tag,
} from 'lucide-react';
import { Post } from '@/types';
import { formatNumber, formatPrice, timeAgo } from '@/lib/utils';
import { postsAPI } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import toast from 'react-hot-toast';
import GlassTilt from '@/components/ui/GlassTilt';

interface PostCardProps {
  post: Post;
  index?: number;
}

const MATRIX_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%';

export default function PostCard({ post, index = 0 }: PostCardProps) {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [matrixTitle, setMatrixTitle] = useState('');
  const [matrixAuthor, setMatrixAuthor] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const matrixTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isVideo = post.mediaType === 'video' && post.video?.url;

  // Matrix text decode effect on hover
  const decodeText = useCallback((target: string, setter: (s: string) => void) => {
    let idx = 0;
    let iter = 0;
    const run = () => {
      if (idx >= target.length) { setter(target); return; }
      let result = target.slice(0, idx);
      if (iter < 2) {
        result += MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
        for (let i = idx + 1; i < Math.min(idx + 4, target.length); i++) {
          result += MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
        }
        iter++;
      } else {
        result += target[idx];
        idx++;
        iter = 0;
      }
      setter(result);
      matrixTimerRef.current = setTimeout(run, 20);
    };
    run();
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
    if (isVideo && videoRef.current) videoRef.current.play().catch(() => {});
    // Start matrix decode
    if (matrixTimerRef.current) clearTimeout(matrixTimerRef.current);
    setMatrixTitle('');
    setMatrixAuthor('');
    setTimeout(() => decodeText(post.title.slice(0, 40), setMatrixTitle), 100);
    setTimeout(() => decodeText(post.author?.displayName || '', setMatrixAuthor), 300);
  }, [isVideo, post.title, post.author?.displayName, decodeText]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    if (isVideo && videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; }
    if (matrixTimerRef.current) clearTimeout(matrixTimerRef.current);
    setMatrixTitle('');
    setMatrixAuthor('');
  }, [isVideo]);

  useEffect(() => () => { if (matrixTimerRef.current) clearTimeout(matrixTimerRef.current); }, []);

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsMuted(!isMuted);
    if (videoRef.current) videoRef.current.muted = !isMuted;
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login to like posts'); return; }
    try {
      const { data } = await postsAPI.toggleLike(post._id);
      setIsLiked(data.data.isLiked);
      setLikesCount((prev) => prev + (data.data.isLiked ? 1 : -1));
    } catch { toast.error('Failed to like post'); }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login to save posts'); return; }
    try {
      const { data } = await postsAPI.toggleSave(post._id);
      setIsSaved(data.data.isSaved);
      toast.success(data.data.isSaved ? 'Saved to collection' : 'Removed from saved');
    } catch { toast.error('Failed to save post'); }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
      await postsAPI.sharePost(post._id);
      toast.success('Link copied!');
    } catch { toast.error('Failed to copy link'); }
  };

  const handleProductClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try { await postsAPI.trackClick(post._id); } catch { /* silent */ }
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const aspectRatio = isVideo
    ? (post.video?.height && post.video?.width ? post.video.height / post.video.width : 1.33)
    : (post.image?.height && post.image?.width ? post.image.height / post.image.width : 1 + Math.random() * 0.8);

  const thumbnailUrl = isVideo ? (post.video?.thumbnailUrl || post.image?.url) : post.image?.url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.25) }}
      className="pin-card group"
    >
      <GlassTilt tiltAmount={10} glareOpacity={0.12} scale={1.03}>
        <Link
          href={`/post/${post._id}`}
          className="block"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Media container */}
          <div
            className="relative overflow-hidden rounded-xl"
            style={{
              paddingBottom: `${Math.min(aspectRatio * 100, 180)}%`,
              background: 'linear-gradient(135deg, #0e0e1e, #14142a)',
            }}
          >
            {/* Skeleton loader */}
            {!imageLoaded && !isVideo && <div className="absolute inset-0 skeleton" />}

            {isVideo ? (
              <>
                {!isHovering && thumbnailUrl && (
                  <img src={thumbnailUrl} alt={post.title} loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover" />
                )}
                <video ref={videoRef} src={post.video!.url} muted={isMuted} loop playsInline preload="none"
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isHovering ? 'opacity-100' : 'opacity-0'}`} />
                {!isHovering && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-md border border-cyber-glow/30 flex items-center justify-center shadow-cyber">
                      <Play className="w-6 h-6 text-cyber-glow ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                )}
                {post.video?.duration && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-cyber-glow/20 text-cyber-glow text-[11px] font-mono font-medium z-10">
                    {formatDuration(post.video.duration)}
                  </div>
                )}
                {isHovering && (
                  <button onClick={toggleMute}
                    className="absolute bottom-3 right-3 p-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white hover:text-cyber-glow z-20 transition-colors">
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                )}
              </>
            ) : (
              <img src={post.image?.url} alt={post.title} loading="lazy"
                onLoad={() => setImageLoaded(true)}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-700
                  ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                  ${isHovering ? 'scale-110 brightness-110' : 'scale-100 brightness-100'}`}
              />
            )}

            {/* Cyber scan line on hover */}
            {isHovering && (
              <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                <div
                  className="absolute left-0 right-0 h-[2px] animate-scan-line"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.4), transparent)' }}
                />
              </div>
            )}

            {/* Hover overlay - glassmorphism info panel */}
            <div className={`absolute inset-0 z-10 transition-all duration-400 rounded-xl flex flex-col justify-between p-3
              ${isHovering ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              style={{
                background: isHovering
                  ? 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.0) 50%, rgba(10,10,20,0.85) 80%)'
                  : 'transparent',
              }}
            >
              {/* Top row: badges */}
              <div className={`flex items-start justify-between transition-all duration-300 ${isHovering ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                <div className="flex items-center gap-1.5">
                  {isVideo && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-cyber-blue/80 backdrop-blur-sm text-white text-[10px] font-mono font-bold uppercase tracking-wider border border-cyber-blue/40">
                      <Play className="w-2.5 h-2.5" fill="white" /> VID
                    </span>
                  )}
                  {post.isAiGenerated && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-cyber-purple/80 backdrop-blur-sm text-white text-[10px] font-mono font-bold uppercase tracking-wider border border-cyber-purple/40">
                      <Sparkles className="w-2.5 h-2.5" /> AI
                    </span>
                  )}
                  {post.category && (
                    <span className="px-2 py-1 rounded-md text-[10px] font-mono font-bold text-white backdrop-blur-sm uppercase tracking-wider border"
                      style={{ backgroundColor: `${post.category.color}88`, borderColor: `${post.category.color}66` }}>
                      {post.category.name}
                    </span>
                  )}
                </div>
                <button onClick={handleSave}
                  className={`p-2 rounded-lg backdrop-blur-md transition-all border
                    ${isSaved
                      ? 'bg-cyber-glow/20 border-cyber-glow/40 text-cyber-glow shadow-cyber'
                      : 'bg-black/30 border-white/10 text-white/80 hover:text-cyber-glow hover:border-cyber-glow/30'}`}>
                  <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Bottom row: matrix-decoded info + actions */}
              <div className={`space-y-2 transition-all duration-300 delay-100 ${isHovering ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {/* Matrix-decoded title */}
                {matrixTitle && (
                  <div className="font-mono text-xs text-cyber-glow leading-tight tracking-wide"
                    style={{ textShadow: '0 0 8px rgba(0,240,255,0.5)' }}>
                    {matrixTitle}
                    {matrixTitle.length < post.title.slice(0, 40).length && (
                      <span className="inline-block w-[2px] h-3 bg-cyber-glow animate-pulse ml-0.5 align-middle" />
                    )}
                  </div>
                )}
                {/* Matrix-decoded author */}
                {matrixAuthor && (
                  <div className="font-mono text-[10px] text-cyber-neon/70 tracking-widest uppercase"
                    style={{ textShadow: '0 0 6px rgba(0,255,136,0.3)' }}>
                    &gt; {matrixAuthor}
                  </div>
                )}

                {/* Action row */}
                <div className="flex items-center justify-between pt-1">
                  {post.productUrl ? (
                    <a href={post.productUrl} target="_blank" rel="noopener noreferrer" onClick={handleProductClick}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyber-glow/90 text-cyber-black text-[11px] font-bold font-mono uppercase tracking-wider hover:bg-cyber-glow transition-all shadow-cyber border border-cyber-glow/50">
                      <ExternalLink className="w-3 h-3" />
                      {post.price?.amount ? formatPrice(post.price.amount) : 'VISIT'}
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 text-[11px] font-mono text-white/50">
                      <Eye className="w-3 h-3" />
                      {formatNumber(post.viewsCount || 0)}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <button onClick={handleShare}
                      className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-cyber-glow hover:border-cyber-glow/30 backdrop-blur-sm transition-all">
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={handleLike}
                      className={`p-1.5 rounded-lg backdrop-blur-sm transition-all border
                        ${isLiked
                          ? 'bg-cyber-pink/20 border-cyber-pink/40 text-cyber-pink'
                          : 'bg-white/5 border-white/10 text-white/70 hover:text-cyber-pink hover:border-cyber-pink/30'}`}>
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Persistent price tag */}
            {post.price?.amount && !isHovering && (
              <div className="absolute top-3 left-3 z-10">
                <span className="px-2.5 py-1 rounded-md bg-cyber-neon/90 text-cyber-black text-[11px] font-mono font-bold shadow-neon border border-cyber-neon/50">
                  {formatPrice(post.price.amount)}
                </span>
              </div>
            )}

            {/* Cyber border glow on hover */}
            <div className={`absolute inset-0 rounded-xl pointer-events-none transition-all duration-500 z-20
              ${isHovering
                ? 'shadow-[inset_0_0_30px_rgba(0,240,255,0.08),0_0_20px_rgba(0,240,255,0.12)] border border-cyber-glow/25'
                : 'border border-transparent'}`}
            />
          </div>

          {/* Info below media */}
          <div className="p-2.5 space-y-1.5">
            <h3 className="text-[13px] font-medium line-clamp-2 text-white/85 leading-snug group-hover:text-cyber-glow/90 transition-colors">
              {post.title}
            </h3>
            <div className="flex items-center justify-between">
              <Link href={`/profile/${post.author?.username}`} onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 group/author">
                {post.author?.avatar ? (
                  <img src={post.author.avatar} alt={post.author.displayName}
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-cyber-border" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-cyber-card border border-cyber-border flex items-center justify-center text-[9px] font-bold text-cyber-glow">
                    {post.author?.displayName?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-[11px] text-white/40 group-hover/author:text-cyber-glow/60 transition-colors truncate max-w-[90px] font-mono">
                  {post.author?.displayName}
                </span>
              </Link>
              <div className="flex items-center gap-2 text-[11px] text-white/30 font-mono">
                {likesCount > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Heart className="w-3 h-3" />{formatNumber(likesCount)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      </GlassTilt>
    </motion.div>
  );
}
"""

# ============================================================
# Header - Cyber Glass Navbar
# ============================================================
files[f'{BASE}/components/layout/Header.tsx'] = r"""'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout as logoutAction } from '@/store/slices/authSlice';
import { toggleSidebar } from '@/store/slices/uiSlice';
import { useClickOutside } from '@/hooks';
import {
  Search, Plus, Bell, Menu, X, LogOut,
  User, Settings, LayoutDashboard, Bookmark, ChevronDown,
  Home, Zap, Terminal,
} from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const handleToggleSidebar = () => dispatch(toggleSidebar());
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useClickOutside(userMenuRef as React.RefObject<HTMLElement>, () => setShowUserMenu(false));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowMobileSearch(false);
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutAction());
    router.push('/');
    setShowUserMenu(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16">
      {/* Glass background */}
      <div className="absolute inset-0 bg-cyber-black/70 backdrop-blur-2xl border-b border-cyber-glow/10"
        style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.4), 0 1px 0 rgba(0,240,255,0.05) inset' }} />

      <div className="relative max-w-[2000px] mx-auto px-4 h-full flex items-center gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(0,240,255,0.15), rgba(191,0,255,0.15))',
              border: '1px solid rgba(0,240,255,0.3)',
              boxShadow: '0 0 15px rgba(0,240,255,0.15)',
            }}>
            <Zap className="w-5 h-5 text-cyber-glow" />
            <div className="absolute inset-0 bg-gradient-to-tr from-cyber-glow/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-xl font-bold hidden sm:block">
            <span className="text-white">Pic</span>
            <span className="neon-text">Up</span>
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-1 ml-3">
          <Link href="/" className="btn-ghost text-sm font-medium gap-1.5">
            <Home className="w-4 h-4" />Home
          </Link>
          <Link href="/explore" className="btn-ghost text-sm font-medium">Explore</Link>
          {isAuthenticated && (
            <Link href="/create" className="btn-ghost text-sm font-medium gap-1.5">
              <Terminal className="w-3.5 h-3.5" />Create
            </Link>
          )}
        </nav>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-4">
          <div className={`relative w-full transition-all duration-300 ${searchFocused ? 'scale-[1.02]' : ''}`}>
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${searchFocused ? 'text-cyber-glow' : 'text-white/30'}`} />
            <input
              type="text"
              placeholder="Search the matrix..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl text-sm placeholder:text-white/25 text-white/90 font-mono transition-all duration-300 outline-none"
              style={{
                background: searchFocused ? 'rgba(0,240,255,0.06)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${searchFocused ? 'rgba(0,240,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
                boxShadow: searchFocused ? '0 0 20px rgba(0,240,255,0.08), 0 0 0 3px rgba(0,240,255,0.05)' : 'none',
              }}
            />
          </div>
        </form>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => setShowMobileSearch(!showMobileSearch)} className="md:hidden btn-ghost p-2">
            <Search className="w-5 h-5" />
          </button>

          {isAuthenticated ? (
            <>
              <Link href="/create"
                className="btn-primary gap-1.5 hidden sm:inline-flex text-xs py-2 px-3">
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden lg:inline font-mono">CREATE</span>
              </Link>
              <button className="btn-ghost p-2 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyber-pink rounded-full shadow-neon-pink" />
              </button>

              {/* User menu */}
              <div className="relative" ref={userMenuRef}>
                <button onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-cyber-glow/10">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.displayName}
                      className="w-8 h-8 rounded-lg object-cover ring-1 ring-cyber-glow/20" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-cyber-card border border-cyber-glow/20 flex items-center justify-center text-sm font-bold text-cyber-glow font-mono">
                      {user?.displayName?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-white/40 hidden sm:block" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 cyber-glass-strong rounded-xl py-2 animate-scale-in origin-top-right"
                    style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 20px rgba(0,240,255,0.05)' }}>
                    <div className="px-4 py-3 border-b border-cyber-glow/10">
                      <p className="font-semibold text-sm text-white">{user?.displayName}</p>
                      <p className="text-xs text-cyber-glow/60 font-mono">@{user?.username}</p>
                    </div>
                    <div className="py-1">
                      {[
                        { href: `/profile/${user?.username}`, icon: User, label: 'Your Profile' },
                        { href: '/saved', icon: Bookmark, label: 'Saved Posts' },
                        { href: '/boards', icon: LayoutDashboard, label: 'My Boards' },
                      ].map((item) => (
                        <Link key={item.href} href={item.href} onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-cyber-glow hover:bg-cyber-glow/5 transition-all">
                          <item.icon className="w-4 h-4" />
                          <span className="font-mono text-xs">{item.label}</span>
                        </Link>
                      ))}
                      {user?.role === 'admin' && (
                        <Link href="/admin" onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-cyber-neon hover:bg-cyber-neon/5 transition-all">
                          <Settings className="w-4 h-4" />
                          <span className="font-mono text-xs">Admin Panel</span>
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-cyber-glow/10 pt-1">
                      <Link href="/settings" onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-cyber-glow hover:bg-cyber-glow/5 transition-all">
                        <Settings className="w-4 h-4" />
                        <span className="font-mono text-xs">Settings</span>
                      </Link>
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-cyber-red hover:bg-cyber-red/5 transition-all">
                        <LogOut className="w-4 h-4" />
                        <span className="font-mono text-xs">Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn-ghost text-sm font-mono">LOG IN</Link>
              <Link href="/register" className="btn-primary text-xs font-mono py-2 px-4">SIGN UP</Link>
            </div>
          )}

          <button onClick={handleToggleSidebar} className="md:hidden btn-ghost p-2"><Menu className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Mobile search */}
      {showMobileSearch && (
        <div className="md:hidden absolute top-full left-0 right-0 p-3 cyber-glass-strong animate-slide-up">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-glow/50" />
            <input type="text" placeholder="Search..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} autoFocus
              className="input-field pl-11 pr-10 font-mono text-sm" />
            <button type="button" onClick={() => setShowMobileSearch(false)} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-white/40" />
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
"""

# ============================================================
# Layout
# ============================================================
files[f'{BASE}/app/layout.tsx'] = r"""import type { Metadata } from 'next';
import { Providers } from './providers';
import Header from '@/components/layout/Header';
import CyberBackground from '@/components/ui/CyberBackground';
import './globals.css';

export const metadata: Metadata = {
  title: 'PicUp - Cyber Visual Discovery Platform',
  description: 'Discover, collect, and share amazing products through a cyberpunk visual interface.',
  keywords: ['pinterest', 'visual discovery', 'products', 'shopping', 'ai images', 'cyberpunk'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen">
        <Providers>
          <CyberBackground />
          <Header />
          <main className="pt-16">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
"""

# ============================================================
# Providers - Force dark theme
# ============================================================
files[f'{BASE}/app/providers.tsx'] = r"""'use client';

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { store } from '@/store';
import { fetchUser } from '@/store/slices/authSlice';

function AuthInit() {
  useEffect(() => {
    store.dispatch(fetchUser());
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
        <AuthInit />
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(14, 14, 30, 0.95)',
              color: '#00f0ff',
              borderRadius: '12px',
              fontSize: '13px',
              padding: '12px 16px',
              border: '1px solid rgba(0, 240, 255, 0.15)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 240, 255, 0.05)',
              fontFamily: 'JetBrains Mono, monospace',
              backdropFilter: 'blur(20px)',
            },
          }}
        />
      </ThemeProvider>
    </Provider>
  );
}
"""

# ============================================================
# Home page - Cyber themed
# ============================================================
files[f'{BASE}/app/page.tsx'] = r"""'use client';

import { useState, useEffect, useCallback } from 'react';
import { postsAPI, categoriesAPI, searchAPI } from '@/lib/api';
import MasonryFeed from '@/components/feed/MasonryFeed';
import { FeedSkeleton } from '@/components/shared/Skeletons';
import MatrixText from '@/components/ui/MatrixText';
import { Post, Category } from '@/types';
import { TrendingUp, Flame, Clock, Star, Zap, ChevronRight } from 'lucide-react';

type SortOption = 'recent' | 'popular' | 'trending' | 'featured';

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [trendingTags, setTrendingTags] = useState<{ tag: string; count: number }[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>('recent');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  const fetchPosts = useCallback(
    async (pageNum: number, reset = false) => {
      try {
        setIsLoading(true);
        const { data } = await postsAPI.getFeed({
          page: pageNum, limit: 30, sort,
          category: selectedCategory || undefined,
          tag: selectedTag || undefined,
        });
        if (reset) setPosts(data.data);
        else setPosts((prev) => [...prev, ...data.data]);
        setHasMore(data.pagination.hasMore);
      } catch (error) { console.error('Failed to fetch posts:', error); }
      finally { setIsLoading(false); }
    },
    [sort, selectedCategory, selectedTag]
  );

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [catRes, tagsRes] = await Promise.all([
          categoriesAPI.getAll(), searchAPI.getTrendingTags(),
        ]);
        setCategories(catRes.data.data);
        setTrendingTags(tagsRes.data.data);
      } catch (e) { console.error('Failed to load categories/tags:', e); }
    };
    loadInitial();
  }, []);

  useEffect(() => { setPage(1); fetchPosts(1, true); }, [fetchPosts]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage);
    }
  }, [isLoading, hasMore, page, fetchPosts]);

  const sortOptions: { key: SortOption; label: string; icon: React.ReactNode }[] = [
    { key: 'recent', label: 'LATEST', icon: <Clock className="w-3.5 h-3.5" /> },
    { key: 'popular', label: 'POPULAR', icon: <Flame className="w-3.5 h-3.5" /> },
    { key: 'trending', label: 'TRENDING', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { key: 'featured', label: 'FEATURED', icon: <Star className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-20">
        {/* Gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 left-1/3 w-[500px] h-[500px] bg-cyber-glow/[0.04] rounded-full blur-[100px]" />
          <div className="absolute -bottom-20 right-1/4 w-[400px] h-[400px] bg-cyber-purple/[0.05] rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center px-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 font-mono text-xs uppercase tracking-[0.2em]"
            style={{
              background: 'rgba(0,240,255,0.06)',
              border: '1px solid rgba(0,240,255,0.15)',
              color: 'var(--cyber-glow)',
              boxShadow: '0 0 15px rgba(0,240,255,0.08)',
            }}>
            <Zap className="w-3.5 h-3.5" />
            <span>Visual Discovery Interface</span>
            <ChevronRight className="w-3 h-3" />
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 tracking-tight leading-[1.1]">
            <span className="text-white">Find Products You&apos;ll </span>
            <MatrixText
              text="Love"
              className="text-gradient text-4xl md:text-5xl lg:text-6xl font-bold"
              speed={40}
              delay={500}
            />
          </h1>
          <p className="text-base text-white/40 max-w-2xl mx-auto font-mono leading-relaxed">
            &gt; Explore a curated collection of amazing products, AI-generated art, and creative inspiration.
          </p>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="sticky top-16 z-30"
          style={{
            background: 'rgba(10,10,15,0.8)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0,240,255,0.06)',
          }}>
          <div className="max-w-[2000px] mx-auto">
            <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
              <button onClick={() => { setSelectedCategory(''); setSelectedTag(''); }}
                className={`shrink-0 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all border
                  ${!selectedCategory && !selectedTag
                    ? 'bg-cyber-glow/10 border-cyber-glow/30 text-cyber-glow shadow-cyber'
                    : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/60 hover:border-white/10'}`}>
                ALL
              </button>
              {categories.map((cat) => (
                <button key={cat._id} onClick={() => { setSelectedCategory(cat._id); setSelectedTag(''); }}
                  className={`shrink-0 px-4 py-2 rounded-lg text-xs font-mono font-medium uppercase tracking-wider transition-all flex items-center gap-1.5 border
                    ${selectedCategory === cat._id
                      ? 'text-white shadow-cyber'
                      : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/60 hover:border-white/10'}`}
                  style={selectedCategory === cat._id
                    ? { backgroundColor: `${cat.color}22`, borderColor: `${cat.color}66`, boxShadow: `0 0 12px ${cat.color}33` }
                    : {}}>
                  <span>{cat.icon}</span>{cat.name}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending tags */}
      {trendingTags.length > 0 && (
        <section className="max-w-[2000px] mx-auto px-4 py-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <span className="text-[10px] font-mono font-bold text-cyber-glow/40 uppercase tracking-[0.2em] shrink-0">&gt; TRENDING:</span>
            {trendingTags.slice(0, 10).map((t) => (
              <button key={t.tag} onClick={() => { setSelectedTag(t.tag); setSelectedCategory(''); }}
                className={`shrink-0 px-3 py-1 rounded-md text-[11px] font-mono transition-all border
                  ${selectedTag === t.tag
                    ? 'bg-cyber-glow/10 border-cyber-glow/30 text-cyber-glow shadow-cyber'
                    : 'bg-white/[0.02] border-white/[0.05] text-white/30 hover:text-cyber-glow/60 hover:border-cyber-glow/15'}`}>
                #{t.tag}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Sort */}
      <section className="max-w-[2000px] mx-auto px-4 pb-4">
        <div className="flex items-center gap-1.5">
          {sortOptions.map((opt) => (
            <button key={opt.key} onClick={() => setSort(opt.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider transition-all border
                ${sort === opt.key
                  ? 'bg-cyber-glow/10 border-cyber-glow/25 text-cyber-glow shadow-cyber'
                  : 'bg-transparent border-transparent text-white/30 hover:text-white/50 hover:bg-white/[0.02]'}`}>
              {opt.icon}{opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Feed */}
      <section className="max-w-[2000px] mx-auto px-3">
        {isLoading && posts.length === 0 ? (
          <FeedSkeleton />
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold neon-text mb-2 font-mono">NO DATA FOUND</h3>
            <p className="text-white/30 font-mono text-sm">&gt; Try changing your filters or check back later_</p>
          </div>
        ) : (
          <MasonryFeed posts={posts} hasMore={hasMore} onLoadMore={loadMore} isLoading={isLoading} />
        )}
      </section>
    </div>
  );
}
"""

# ============================================================
# MasonryFeed update
# ============================================================
files[f'{BASE}/components/feed/MasonryFeed.tsx'] = r"""'use client';

import Masonry from 'react-masonry-css';
import PostCard from './PostCard';
import { Post } from '@/types';
import { useInfiniteScroll } from '@/hooks';

interface MasonryFeedProps {
  posts: Post[];
  hasMore: boolean;
  onLoadMore: () => void;
  isLoading: boolean;
}

const breakpointColumns = {
  default: 6,
  1536: 5,
  1280: 4,
  1024: 3,
  768: 2,
  475: 2,
};

export default function MasonryFeed({ posts, hasMore, onLoadMore, isLoading }: MasonryFeedProps) {
  const lastRef = useInfiniteScroll(onLoadMore, hasMore && !isLoading);

  return (
    <div>
      <Masonry
        breakpointCols={breakpointColumns}
        className="masonry-grid"
        columnClassName="masonry-grid-column"
      >
        {posts.map((post, index) => (
          <PostCard key={post._id} post={post} index={index} />
        ))}
      </Masonry>

      {hasMore && (
        <div ref={lastRef} className="flex items-center justify-center py-8">
          {isLoading && (
            <div className="flex items-center gap-3 font-mono text-xs text-cyber-glow/50">
              <div className="w-5 h-5 border-2 border-cyber-glow/30 border-t-cyber-glow rounded-full animate-spin" />
              <span>&gt; LOADING_MORE_DATA...</span>
            </div>
          )}
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div className="text-center py-12">
          <p className="text-white/20 text-xs font-mono">&gt; END_OF_DATA_STREAM // You&apos;ve seen it all_</p>
        </div>
      )}
    </div>
  );
}
"""

# ============================================================
# Write all files
# ============================================================
for path, content in files.items():
    directory = os.path.dirname(path)
    os.makedirs(directory, exist_ok=True)
    with open(path, 'w') as f:
        f.write(content.lstrip('\n'))
    print(f"  ✅ {os.path.relpath(path, '/Users/macbook/Desktop/FullStack-App/picup/frontend')}")

print(f"\n🎮 {len(files)} files written successfully!")
