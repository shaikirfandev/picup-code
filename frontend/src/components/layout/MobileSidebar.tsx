'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { closeSidebar } from '@/store/slices/uiSlice';
import { logout as logoutAction } from '@/store/slices/authSlice';
import {
  X, Home, Compass, Wrench, FileText, Plus,
  User, Bookmark, LayoutDashboard, Activity, CreditCard,
  Shield, Settings, LogOut, Search,
} from 'lucide-react';

export default function MobileSidebar() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { sidebarOpen } = useAppSelector((s) => s.ui);
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const overlayRef = useRef<HTMLDivElement>(null);

  const isPaid = user?.accountType === 'paid' || user?.role === 'admin';

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
    { href: '/', label: 'Home', icon: Home },
    { href: '/explore', label: 'Discover', icon: Compass },
    { href: '/tools', label: 'Tools', icon: Wrench },
    { href: '/blog', label: 'Blog', icon: FileText },
    { href: '/search', label: 'Search', icon: Search },
  ];

  const userItems = [
    { href: `/profile/${user?.username}`, label: 'Profile', icon: User },
    { href: '/saved', label: 'Saved', icon: Bookmark },
    { href: '/boards', label: 'Boards', icon: LayoutDashboard },
    ...(isPaid
      ? [
          { href: '/analytics', label: 'Analytics', icon: Activity },
          { href: '/wallet', label: 'Wallet', icon: CreditCard },
        ]
      : []),
    ...(user?.role === 'admin'
      ? [{ href: '/admin', label: 'Admin', icon: Shield }]
      : []),
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  if (!sidebarOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={close}
        className="fixed inset-0 z-[60] transition-opacity duration-300"
        style={{ background: 'var(--overlay-bg)', opacity: sidebarOpen ? 1 : 0 }}
      />

      {/* Drawer */}
      <aside
        className="fixed top-0 right-0 bottom-0 z-[61] w-72 max-w-[85vw] flex flex-col overflow-y-auto animate-slide-in-right"
        style={{
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <Link href="/" onClick={close} className="flex items-center gap-2">
            <span className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
              Picup
            </span>
          </Link>
          <button
            onClick={close}
            className="p-2 rounded-lg hover:bg-[var(--surface-secondary)] transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User info */}
        {isAuthenticated && user && (
          <div className="px-4 py-3 flex items-center gap-3 border-b" style={{ borderColor: 'var(--border)' }}>
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.displayName}
                className="w-10 h-10 rounded-full object-cover"
                style={{ border: '1px solid var(--border)' }}
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                style={{
                  background: 'var(--surface-secondary)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                }}
              >
                {user.displayName?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                {user.displayName}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                @{user.username}
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-2">
          <div className="px-4 py-2">
            <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Navigation
            </span>
          </div>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--surface-secondary)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </Link>
          ))}

          {isAuthenticated && (
            <>
              <div className="px-4 py-3">
                <Link
                  href="/create"
                  onClick={close}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all"
                  style={{ background: 'var(--foreground)', color: 'var(--background)' }}
                >
                  <Plus className="w-4 h-4" />
                  Create
                </Link>
              </div>

              <div className="px-4 py-2">
                <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Account
                </span>
              </div>
              {userItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--surface-secondary)]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <item.icon className="w-4.5 h-4.5" />
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors hover:bg-[var(--error-bg)]"
              style={{ color: 'var(--error)' }}
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          ) : (
            <div className="flex gap-2">
              <Link
                href="/login"
                onClick={close}
                className="flex-1 text-center py-2.5 text-sm font-medium rounded-lg transition-colors hover:bg-[var(--surface-secondary)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                Log in
              </Link>
              <Link
                href="/register"
                onClick={close}
                className="flex-1 text-center py-2.5 text-sm font-medium rounded-lg transition-all"
                style={{ background: 'var(--foreground)', color: 'var(--background)' }}
              >
                Sign up
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
