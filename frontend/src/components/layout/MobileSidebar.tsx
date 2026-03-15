'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { closeSidebar } from '@/store/slices/uiSlice';
import { logout as logoutAction } from '@/store/slices/authSlice';
import {
  X, Home, Zap, Wrench, FileText, Plus,
  User, Bookmark, LayoutDashboard, Activity, BarChart3, CreditCard,
  Shield, Settings, LogOut, Search, Crosshair,
} from 'lucide-react';

export default function MobileSidebar() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { sidebarOpen } = useAppSelector((s) => s.ui);
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const overlayRef = useRef<HTMLDivElement>(null);

  const isPaid = user?.accountType === 'paid' || user?.role === 'admin';

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch(closeSidebar());
    };
    if (sidebarOpen) {
      document.addEventListener('keydown', handler);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [sidebarOpen, dispatch]);

  const close = () => dispatch(closeSidebar());

  const handleLogout = async () => {
    close();
    await dispatch(logoutAction());
    router.push('/');
  };

  const navItems = [
    { href: '/', label: 'HOME', icon: Home },
    { href: '/explore', label: 'EXPLORE', icon: Zap },
    { href: '/tools', label: 'TOOLS', icon: Wrench },
    { href: '/blog', label: 'BLOG', icon: FileText },
    { href: '/search', label: 'SEARCH', icon: Search },
  ];

  const userItems = [
    { href: `/profile/${user?.username}`, label: 'Profile', icon: User },
    { href: '/saved', label: 'Saved Intel', icon: Bookmark },
    { href: '/boards', label: 'Boards', icon: LayoutDashboard },
    ...(isPaid
      ? [
          { href: '/analytics', label: 'Creator Analytics', icon: Activity },
          { href: '/ad-manager', label: 'Ad Manager', icon: BarChart3 },
          { href: '/wallet', label: 'Credits / Wallet', icon: CreditCard },
        ]
      : []),
    ...(user?.role === 'admin'
      ? [{ href: '/admin', label: 'Command Center', icon: Shield }]
      : []),
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  if (!sidebarOpen) return null;

  return (
    <>
      {/* Overlay backdrop */}
      <div
        ref={overlayRef}
        onClick={close}
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: sidebarOpen ? 1 : 0 }}
      />

      {/* Drawer panel */}
      <aside
        className="fixed top-0 right-0 bottom-0 z-[61] w-72 max-w-[85vw] flex flex-col overflow-y-auto animate-slide-in-right"
        style={{
          background: 'var(--edith-surface)',
          borderLeft: '1px solid var(--edith-border-strong)',
          boxShadow: 'var(--edith-shadow-xl)',
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px]"
          style={{
            background: 'linear-gradient(90deg, transparent, var(--edith-accent-muted), transparent)',
          }}
        />

        {/* Header */}
        <div
          className="flex items-center justify-between p-4"
          style={{ borderBottom: '1px solid var(--edith-border)' }}
        >
          <Link href="/" onClick={close} className="flex items-center gap-2.5 group">
            <div className="relative w-7 h-7 flex items-center justify-center">
              <div className="absolute inset-0 rounded border border-edith-cyan/30 rotate-45 group-hover:rotate-[225deg] transition-transform duration-700" />
              <Crosshair className="w-3.5 h-3.5 text-edith-cyan relative z-10" />
            </div>
            <span className="text-[13px] font-display font-bold tracking-[0.2em] text-edith-cyan">
              E.D.I.T.H
            </span>
          </Link>
          <button
            onClick={close}
            className="p-2 rounded hover:bg-edith-cyan/10 transition-colors"
            style={{ color: 'var(--edith-text-dim)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User info (if logged in) */}
        {isAuthenticated && user && (
          <div
            className="px-4 py-3 flex items-center gap-3"
            style={{ borderBottom: '1px solid var(--edith-border)' }}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.displayName}
                className="w-9 h-9 rounded object-cover"
                style={{ border: '1px solid var(--edith-border)' }}
              />
            ) : (
              <div
                className="w-9 h-9 rounded flex items-center justify-center text-xs font-mono font-bold text-edith-cyan"
                style={{
                  background: 'var(--edith-accent-muted)',
                  border: '1px solid var(--edith-border)',
                }}
              >
                {user.displayName?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--edith-text)' }}>
                {user.displayName}
              </p>
              <p className="text-[10px] font-mono truncate" style={{ color: 'var(--edith-text-dim)' }}>
                @{user.username}
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-2">
          <div className="px-3 py-2">
            <span className="text-[9px] font-mono tracking-[0.2em] uppercase" style={{ color: 'var(--edith-text-muted)' }}>
              Navigation
            </span>
          </div>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className="flex items-center gap-3 px-4 py-2.5 text-[11px] font-mono tracking-wider hover:text-edith-cyan hover:bg-edith-cyan/5 transition-all"
              style={{ color: 'var(--edith-text-dim)' }}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}

          {isAuthenticated && (
            <>
              {/* Create button */}
              <div className="px-4 py-3">
                <Link
                  href="/create"
                  onClick={close}
                  className="btn-primary w-full gap-2 text-[10px] py-2.5 justify-center"
                >
                  <Plus className="w-3.5 h-3.5" />
                  CREATE
                </Link>
              </div>

              <div className="px-3 py-2">
                <span className="text-[9px] font-mono tracking-[0.2em] uppercase" style={{ color: 'var(--edith-text-muted)' }}>
                  Account
                </span>
              </div>
              {userItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className="flex items-center gap-3 px-4 py-2.5 text-[11px] font-mono tracking-wider hover:text-edith-cyan hover:bg-edith-cyan/5 transition-all"
                  style={{ color: 'var(--edith-text-dim)' }}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Footer actions */}
        <div
          className="p-4"
          style={{ borderTop: '1px solid var(--edith-border)' }}
        >
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-[11px] font-mono text-edith-red/60 hover:text-edith-red hover:bg-edith-red/5 rounded transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              DISCONNECT
            </button>
          ) : (
            <div className="flex gap-2">
              <Link
                href="/login"
                onClick={close}
                className="btn-ghost flex-1 text-[10px] font-mono tracking-wider justify-center"
              >
                LOG IN
              </Link>
              <Link
                href="/register"
                onClick={close}
                className="btn-primary flex-1 text-[10px] py-2 justify-center"
              >
                SIGN UP
              </Link>
            </div>
          )}
        </div>
      </aside>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  );
}
