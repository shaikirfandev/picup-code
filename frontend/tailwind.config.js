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
          50: '#e8ecf0',
          100: '#c5cdd6',
          200: '#8a99a8',
          300: '#5f7080',
          400: '#3d4f5f',
          500: '#2a3a4a',
          600: '#1a2535',
          700: '#111b28',
          800: '#0a111c',
          900: '#060d14',
          950: '#030609',
        },
        edith: {
          cyan: '#00d4ff',
          blue: '#0088ff',
          red: '#ff3333',
          amber: '#ffaa00',
          green: '#00ff88',
          purple: '#bf00ff',
          bg: '#050510',
          surface: '#0a0a1a',
          panel: '#0d0d20',
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
        'edith': '0 0 15px rgba(0,212,255,0.15), 0 0 30px rgba(0,212,255,0.05)',
        'edith-lg': '0 0 30px rgba(0,212,255,0.2), 0 0 60px rgba(0,212,255,0.1)',
        'edith-red': '0 0 15px rgba(255,51,51,0.15), 0 0 30px rgba(255,51,51,0.05)',
        'edith-amber': '0 0 15px rgba(255,170,0,0.15), 0 0 30px rgba(255,170,0,0.05)',
      },
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [],
};
