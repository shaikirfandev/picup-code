'use client';

import { useState, useRef, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout as logoutAction } from '@/store/slices/authSlice';
import { toggleSidebar } from '@/store/slices/uiSlice';
import { useClickOutside } from '@/hooks';
import {
  Search, Plus, Menu, X, LogOut,
  User, Settings, LayoutDashboard, Bookmark, ChevronDown,
  Home, Compass, Wrench, FileText, CreditCard, Activity, Shield, Crown,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import dynamic from 'next/dynamic';

const NotificationBell = dynamic(
  () => import('@/components/notifications/NotificationBell'),
  { ssr: false, loading: () => <div className="w-8 h-8" /> }
);

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/explore', label: 'Discover', icon: Compass },
  { href: '/tools', label: 'Tools', icon: Wrench },
  { href: '/blog', label: 'Blog', icon: FileText },
] as const;

export default function Header() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading: authLoading } = useAppSelector((s) => s.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useClickOutside(userMenuRef as React.RefObject<HTMLElement>, () =>
    setShowUserMenu(false)
  );

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

  const isPaid = user?.accountType === 'paid' || user?.role === 'admin';

  const menuLinks = [
    { href: `/profile/${user?.username}`, label: 'Profile', icon: User },
    { href: '/saved', label: 'Saved', icon: Bookmark },
    { href: '/boards', label: 'Boards', icon: LayoutDashboard },
    ...(isPaid
      ? [
          { href: '/analytics', label: 'Analytics', icon: Activity },
          { href: '/wallet', label: 'Wallet', icon: CreditCard },
        ]
      : [
          { href: '/upgrade', label: 'Upgrade', icon: Crown },
        ]),
    ...(user?.role === 'admin'
      ? [{ href: '/admin', label: 'Admin', icon: Shield }]
      : []),
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b"
      style={{
        background: 'var(--header-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'var(--header-border)',
      }}
    >
      <div className="max-w-[2000px] mx-auto px-4 sm:px-6 h-full flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-lg font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
            mepiks
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1 ml-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150 hover:bg-[var(--surface-secondary)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-full transition-all duration-200 outline-none"
              style={{
                background: 'var(--surface-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            />
          </div>
        </form>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden p-2 rounded-lg transition-colors hover:bg-[var(--surface-secondary)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Search className="w-4.5 h-4.5" />
          </button>

          <ThemeToggle />

          {isAuthenticated ? (
            <>
              <Link
                href="/create"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
                style={{
                  background: 'var(--foreground)',
                  color: 'var(--background)',
                }}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden lg:inline">Create</span>
              </Link>

              <NotificationBell />

              {/* User menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-[var(--surface-secondary)] transition-colors duration-150"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.displayName || ''}
                      width={32}
                      height={32}
                      loading="eager"
                      decoding="async"
                      className="w-8 h-8 rounded-full object-cover border"
                      style={{ borderColor: 'var(--border)' }}
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                      style={{
                        background: 'var(--surface-secondary)',
                        color: 'var(--foreground)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {user?.displayName?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 hidden sm:block" style={{ color: 'var(--text-muted)' }} />
                </button>

                {showUserMenu && (
                  <div
                    className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden animate-scale-in origin-top-right"
                    style={{
                      background: 'var(--dropdown-bg)',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--dropdown-shadow)',
                    }}
                  >
                    {/* User info */}
                    <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                        {user?.displayName}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        @{user?.username}
                      </p>
                    </div>

                    {/* Links */}
                    <div className="py-1">
                      {menuLinks.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--surface-secondary)]"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <item.icon className="w-4 h-4" />
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    {/* Settings & logout */}
                    <div className="py-1 border-t" style={{ borderColor: 'var(--border)' }}>
                      <Link
                        href="/settings"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--surface-secondary)]"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--error-bg)]"
                        style={{ color: 'var(--error)' }}
                      >
                        <LogOut className="w-4 h-4" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : authLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-16 h-8 rounded-lg animate-pulse" style={{ background: 'var(--surface-secondary)' }} />
              <div className="w-8 h-8 rounded-full animate-pulse" style={{ background: 'var(--surface-secondary)' }} />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[var(--surface-secondary)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
                style={{
                  background: 'var(--foreground)',
                  color: 'var(--background)',
                }}
              >
                Sign up
              </Link>
            </div>
          )}

          <button
            onClick={() => dispatch(toggleSidebar())}
            className="md:hidden p-2 rounded-lg transition-colors hover:bg-[var(--surface-secondary)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile search panel */}
      {showMobileSearch && (
        <div
          className="md:hidden absolute top-full left-0 right-0 p-3 animate-slide-up border-b"
          style={{
            background: 'var(--header-bg)',
            backdropFilter: 'blur(20px)',
            borderColor: 'var(--border)',
          }}
        >
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-10 py-2.5 text-sm rounded-full outline-none"
              style={{
                background: 'var(--surface-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            />
            <button
              type="button"
              onClick={() => setShowMobileSearch(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
