'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { login } from '@/store/slices/authSlice';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Crosshair, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await dispatch(login({ email, password })).unwrap();
      toast.success('Access granted. Welcome back.');
      router.push('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex">
      {/* Left – EDITH holographic display */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #050510 0%, #0a0a2e 50%, #050510 100%)' }} />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(191,0,255,0.05) 0%, transparent 70%)' }} />
        </div>
        {/* Grid lines overlay */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(rgba(0,200,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div className="relative flex flex-col justify-center px-16 text-white z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 rounded border border-edith-cyan/30 rotate-45" />
              <Crosshair className="w-6 h-6 text-edith-cyan" style={{ filter: 'drop-shadow(0 0 8px rgba(0,212,255,0.6))' }} />
            </div>
            <div>
              <span className="text-2xl font-display font-bold tracking-[0.15em] text-edith-cyan" style={{ textShadow: '0 0 20px rgba(0,212,255,0.5)' }}>E.D.I.T.H</span>
              <span className="block text-[8px] font-mono text-edith-cyan/30 tracking-[0.3em] uppercase">Even Dead I'm The Hero</span>
            </div>
          </div>
          <h2 className="text-3xl font-display font-bold mb-4 leading-tight tracking-wide">
            <span className="text-white/80">Identity</span><br />
            <span className="text-gradient">Verification</span>
          </h2>
          <p className="text-sm font-mono text-white/25 max-w-md leading-relaxed">
            // Secure authentication required<br />
            // Stark Industries clearance level: ALPHA<br />
            // Biometric fallback available
          </p>

          {/* Decorative HUD elements */}
          <div className="mt-12 grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square rounded overflow-hidden" style={{ border: '1px solid rgba(0,212,255,0.08)' }}>
                <img
                  src={`https://picsum.photos/seed/login${i}/200/200`}
                  alt=""
                  className="w-full h-full object-cover opacity-30"
                  style={{ filter: 'saturate(0.3) brightness(0.5)' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right – Auth form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 rounded border border-edith-cyan/30 rotate-45" />
                <Crosshair className="w-5 h-5 text-edith-cyan" />
              </div>
              <span className="text-xl font-display font-bold tracking-[0.15em] text-edith-cyan">E.D.I.T.H</span>
            </div>
            <h1 className="text-xl font-display font-bold mb-2 tracking-wider" style={{ color: 'var(--edith-text)' }}>
              AUTHENTICATE
            </h1>
            <p className="text-[11px] font-mono tracking-wider" style={{ color: 'var(--edith-text-muted)' }}>
              // Enter credentials to access the system
            </p>
          </div>

          {/* OAuth */}
          <div className="space-y-2.5 mb-6">
            <a
              href={`${API}/auth/google`}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded text-[12px] font-mono font-medium tracking-wider transition-all duration-300"
              style={{ background: 'var(--edith-btn-secondary-bg)', border: '1px solid var(--edith-btn-secondary-border)', color: 'var(--edith-text-dim)' }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              GOOGLE AUTH
            </a>
            <a
              href={`${API}/auth/github`}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded text-[12px] font-mono font-medium tracking-wider transition-all duration-300"
              style={{ background: 'var(--edith-btn-secondary-bg)', border: '1px solid var(--edith-btn-secondary-border)', color: 'var(--edith-text-dim)' }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GITHUB AUTH
            </a>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, var(--edith-border), transparent)' }} />
            </div>
            <div className="relative flex justify-center text-[9px] uppercase">
              <span className="px-3 font-mono tracking-[0.2em]" style={{ background: 'var(--edith-bg)', color: 'var(--edith-text-muted)' }}>
                or manual entry
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono font-bold mb-1.5 tracking-wider uppercase" style={{ color: 'var(--edith-text-dim)' }}>
                EMAIL_ADDRESS
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-edith-cyan/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@stark.tech"
                  required
                  className="input-field pl-10 text-[12px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold mb-1.5 tracking-wider uppercase" style={{ color: 'var(--edith-text-dim)' }}>
                ACCESS_KEY
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-edith-cyan/30" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="input-field pl-10 pr-10 text-[12px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-edith-cyan/50 transition-colors"
                  style={{ color: 'var(--edith-text-muted)' }}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-edith-cyan/30 border-t-edith-cyan rounded-full animate-spin" />
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5" />
                  AUTHENTICATE
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] font-mono mt-6" style={{ color: 'var(--edith-text-muted)' }}>
            No clearance?{' '}
            <Link href="/register" className="text-edith-cyan/60 hover:text-edith-cyan transition-colors">
              REQUEST ACCESS
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
