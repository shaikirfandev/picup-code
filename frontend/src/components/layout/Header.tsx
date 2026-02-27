'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout as logoutAction } from '@/store/slices/authSlice';
import { toggleSidebar } from '@/store/slices/uiSlice';
import { useClickOutside } from '@/hooks';
import {
  Search, Plus, Menu, X, LogOut,
  User, Settings, LayoutDashboard, Bookmark, ChevronDown,
  Home, Shield, Zap, Crosshair, Wrench, FileText, CreditCard, BarChart3,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import NotificationBell from '@/components/notifications/NotificationBell';

export default function Header() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState('');

  useClickOutside(userMenuRef as React.RefObject<HTMLElement>, () =>
    setShowUserMenu(false)
  );

  /* Live HUD clock */
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(
        d.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

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

  const navItems = [
    { href: '/', label: 'HOME', icon: Home },
    { href: '/explore', label: 'EXPLORE', icon: Zap },
    { href: '/tools', label: 'TOOLS', icon: Wrench },
    { href: '/blog', label: 'BLOG', icon: FileText },
    ...(isAuthenticated ? [{ href: '/create', label: 'CREATE', icon: Plus }] : []),
  ];

  const menuLinks = [
    { href: `/profile/${user?.username}`, label: 'Profile', icon: User },
    { href: '/saved', label: 'Saved Intel', icon: Bookmark },
    { href: '/boards', label: 'Boards', icon: LayoutDashboard },
    { href: '/ad-manager', label: 'Ad Manager', icon: BarChart3 },
    { href: '/wallet', label: 'Credits / Wallet', icon: CreditCard },
    ...(user?.role === 'admin'
      ? [{ href: '/admin', label: 'Command Center', icon: Shield }]
      : []),
  ];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14"
      style={{
        background: 'var(--edith-header-bg)',
        backdropFilter: 'blur(30px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(30px) saturate(1.2)',
        borderBottom: `1px solid var(--edith-header-border)`,
        boxShadow: 'var(--edith-header-shadow)',
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] dark:opacity-100 opacity-40"
        style={{
          background:
            'linear-gradient(90deg, transparent 5%, var(--edith-accent-muted) 30%, var(--edith-accent-subtle) 50%, transparent 95%)',
        }}
      />

      <div className="max-w-[2000px] mx-auto px-4 h-full flex items-center gap-3">
        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute inset-0 rounded border border-edith-cyan/30 rotate-45 group-hover:rotate-[225deg] transition-transform duration-700" />
            <Crosshair
              className="w-4 h-4 text-edith-cyan relative z-10 dark:drop-shadow-[0_0_6px_rgba(0,212,255,0.6)]"
            />
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span
              className="text-[15px] font-display font-bold tracking-[0.2em] text-edith-cyan dark:text-edith-glow"
            >
              E.D.I.T.H
            </span>
            <span className="text-[7px] font-mono text-edith-cyan/30 tracking-[0.3em] uppercase">
              Visual Discovery
            </span>
          </div>
        </Link>

        {/* ── Nav ── */}
        <nav className="hidden md:flex items-center gap-0.5 ml-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono font-medium tracking-wider transition-all duration-300 hover:text-edith-cyan hover:bg-edith-cyan/5 rounded" style={{ color: 'var(--edith-text-dim)' }}
            >
              <item.icon className="w-3 h-3" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* ── Search ── */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-4">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-edith-cyan/40 group-focus-within:text-edith-cyan/70 transition-colors" />
            <input
              type="text"
              placeholder="SEARCH TARGETS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-[11px] font-mono tracking-wider rounded transition-all duration-300 outline-none"
              style={{
                background: 'var(--edith-input-bg)',
                border: '1px solid var(--edith-input-border)',
                color: 'var(--edith-text)',
              }}
            />
            <div
              className="absolute bottom-0 left-0 right-0 h-[1px] opacity-0 group-focus-within:opacity-100 transition-opacity"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(0,212,255,0.3), transparent)',
              }}
            />
          </div>
        </form>

        {/* ── Right side ── */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Live clock */}
          <div className="hidden lg:flex items-center gap-2 mr-2">
            <span className="text-[10px] font-mono tracking-wider" style={{ color: 'var(--edith-text-muted)' }}>
              {time}
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-edith-green/60 animate-pulse" />
          </div>

          {/* Mobile search toggle */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden p-2 hover:text-edith-cyan transition-colors"
            style={{ color: 'var(--edith-text-dim)' }}
          >
            <Search className="w-4 h-4" />
          </button>

          <ThemeToggle />

          {isAuthenticated ? (
            <>
              <Link
                href="/create"
                className="btn-primary gap-1.5 hidden sm:inline-flex text-[10px] py-1.5 px-3"
              >
                <Plus className="w-3 h-3" />
                <span className="hidden lg:inline">CREATE</span>
              </Link>

              {/* Notifications */}
              <NotificationBell />

              {/* User menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 rounded hover:bg-edith-cyan/5 transition-all duration-300"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.displayName}
                      className="w-7 h-7 rounded object-cover"
                      style={{
                        border: '1px solid var(--edith-border)',
                        boxShadow: 'var(--edith-shadow-sm)',
                      }}
                    />
                  ) : (
                    <div
                      className="w-7 h-7 rounded flex items-center justify-center text-[10px] font-mono font-bold text-edith-cyan"
                      style={{
                        background: 'var(--edith-accent-muted)',
                        border: '1px solid var(--edith-border)',
                      }}
                    >
                      {user?.displayName?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <ChevronDown className="w-3 h-3 hidden sm:block" style={{ color: 'var(--edith-text-muted)' }} />
                </button>

                {/* Dropdown */}
                {showUserMenu && (
                  <div
                    className="absolute right-0 top-full mt-2 w-60 animate-scale-in origin-top-right overflow-hidden rounded-md"
                    style={{
                      background: 'var(--edith-dropdown-bg)',
                      backdropFilter: 'blur(30px)',
                      border: '1px solid var(--edith-border-strong)',
                      boxShadow: 'var(--edith-dropdown-shadow)',
                    }}
                  >
                    {/* Top glow line */}
                    <div
                      className="h-[1px] dark:opacity-100 opacity-50"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent, var(--edith-accent-muted), transparent)',
                      }}
                    />

                    {/* User info */}
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--edith-border)' }}>
                      <p className="text-xs font-semibold" style={{ color: 'var(--edith-text)' }}>
                        {user?.displayName}
                      </p>
                      <p className="text-[10px] font-mono" style={{ color: 'var(--edith-text-dim)' }}>
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
                          className="flex items-center gap-3 px-4 py-2 text-[11px] font-mono hover:text-edith-cyan hover:bg-edith-cyan/5 transition-all"
                          style={{ color: 'var(--edith-text-dim)' }}
                        >
                          <item.icon className="w-3.5 h-3.5" />
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    {/* Settings & logout */}
                    <div className="py-1" style={{ borderTop: '1px solid var(--edith-border)' }}>
                      <Link
                        href="/settings"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 text-[11px] font-mono hover:text-edith-cyan hover:bg-edith-cyan/5 transition-all"
                        style={{ color: 'var(--edith-text-dim)' }}
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-[11px] font-mono text-edith-red/60 hover:text-edith-red hover:bg-edith-red/5 transition-all"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Disconnect
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="btn-ghost text-[11px] font-mono tracking-wider"
              >
                LOG IN
              </Link>
              <Link
                href="/register"
                className="btn-primary text-[10px] py-1.5 px-3"
              >
                SIGN UP
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="md:hidden p-2 hover:text-edith-cyan transition-colors"
            style={{ color: 'var(--edith-text-dim)' }}
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile search panel */}
      {showMobileSearch && (
        <div
          className="md:hidden absolute top-full left-0 right-0 p-3 animate-slide-up"
          style={{
            background: 'var(--edith-header-bg)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--edith-header-border)',
          }}
        >
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-edith-cyan/40" />
            <input
              type="text"
              placeholder="SEARCH..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-9 pr-10 py-2.5 text-[11px] font-mono tracking-wider rounded outline-none"
              style={{
                background: 'var(--edith-input-bg)',
                border: '1px solid var(--edith-input-border)',
                color: 'var(--edith-text)',
              }}
            />
            <button
              type="button"
              onClick={() => setShowMobileSearch(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-3.5 h-3.5" style={{ color: 'var(--edith-text-muted)' }} />
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
