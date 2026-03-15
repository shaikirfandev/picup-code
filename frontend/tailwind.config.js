/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e6fbff',
          100: '#b3f3ff',
          200: '#80ebff',
          300: '#4de3ff',
          400: '#1adbff',
          500: '#00d4ff',
          600: '#00a8cc',
          700: '#007d99',
          800: '#005266',
          900: '#002733',
          950: '#001a22',
        },
        surface: {
          50: '#f4f6f9',
          100: '#e8ecf0',
          200: '#c5cdd6',
          300: '#94a3b8',
          400: '#6b7d99',
          500: '#3d4f66',
          600: '#2a3a4a',
          700: '#1a2535',
          800: '#111b28',
          900: '#0a111c',
          950: '#050510',
        },
        edith: {
          cyan: 'var(--edith-cyan)',
          blue: 'var(--edith-blue)',
          red: 'var(--edith-red)',
          amber: 'var(--edith-amber)',
          green: 'var(--edith-green)',
          purple: 'var(--edith-purple)',
          bg: 'var(--edith-bg)',
          surface: 'var(--edith-surface)',
          panel: 'var(--edith-panel)',
        },
      },
      fontFamily: {
        sans: ['Rajdhani', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        display: ['Orbitron', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line': 'scanLine 3s linear infinite',
        'dash-flow': 'dashFlow 1.2s linear infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'hud-boot': 'hudBoot 0.6s ease-out',
        'edith-flicker': 'edithFlicker 4s ease-in-out infinite',
        'fade-slide-up': 'fadeSU 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeSU: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scanLine: {
          '0%': { top: '-2px' },
          '100%': { top: '100%' },
        },
        dashFlow: {
          '0%': { strokeDashoffset: '0' },
          '100%': { strokeDashoffset: '-16' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0,212,255,0.3), 0 0 15px rgba(0,212,255,0.1)' },
          '50%': { boxShadow: '0 0 15px rgba(0,212,255,0.5), 0 0 40px rgba(0,212,255,0.2)' },
        },
        hudBoot: {
          '0%': { opacity: '0', transform: 'scale(0.95)', filter: 'brightness(2) blur(4px)' },
          '40%': { opacity: '1', filter: 'brightness(1.5) blur(1px)' },
          '100%': { opacity: '1', transform: 'scale(1)', filter: 'brightness(1) blur(0)' },
        },
        edithFlicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.97' },
          '80%': { opacity: '0.98' },
        },
      },
      boxShadow: {
        'edith': 'var(--edith-shadow-md)',
        'edith-lg': 'var(--edith-shadow-lg)',
        'edith-red': '0 0 15px rgba(255,51,51,0.15), 0 0 30px rgba(255,51,51,0.05)',
        'edith-amber': '0 0 15px rgba(255,170,0,0.15), 0 0 30px rgba(255,170,0,0.05)',
        'theme-sm': 'var(--edith-shadow-sm)',
        'theme-md': 'var(--edith-shadow-md)',
        'theme-lg': 'var(--edith-shadow-lg)',
        'theme-xl': 'var(--edith-shadow-xl)',
      },
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [],
};
