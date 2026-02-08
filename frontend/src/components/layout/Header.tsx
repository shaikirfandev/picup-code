'use client';

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
