/** @type {import('tailwindcss').Config} */
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
        'dash-flow': 'dashFlow 1.2s linear infinite',
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
        dashFlow: { '0%': { strokeDashoffset: '0' }, '100%': { strokeDashoffset: '-16' } },
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
