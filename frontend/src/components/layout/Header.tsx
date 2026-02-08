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
  Search, Plus, Bell, Menu, X, Sun, Moon, LogOut,
  User, Settings, LayoutDashboard, Bookmark, ChevronDown,
  Sparkles, Home,
} from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const handleToggleSidebar = () => dispatch(toggleSidebar());
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
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
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/80 dark:bg-surface-950/80 backdrop-blur-xl border-b border-surface-100 dark:border-surface-800">
      <div className="max-w-[2000px] mx-auto px-4 h-full flex items-center gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/25">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold hidden sm:block">
            Pic<span className="text-brand-600">Up</span>
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-1 ml-2">
          <Link href="/" className="btn-ghost text-sm font-semibold">
            <Home className="w-4 h-4 mr-1.5" />
            Home
          </Link>
          <Link href="/explore" className="btn-ghost text-sm font-semibold">
            Explore
          </Link>
          {isAuthenticated && (
            <Link href="/create" className="btn-ghost text-sm font-semibold">
              Create
            </Link>
          )}
        </nav>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-4">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search for inspiration, products, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-full bg-surface-100 dark:bg-surface-800 
                border-0 text-sm placeholder:text-surface-400 
                focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-surface-700
                transition-all duration-200"
            />
          </div>
        </form>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Mobile search toggle */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden btn-ghost p-2"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="btn-ghost p-2"
            aria-label="Toggle theme"
          >
            <Sun className="w-5 h-5 hidden dark:block" />
            <Moon className="w-5 h-5 dark:hidden" />
          </button>

          {isAuthenticated ? (
            <>
              {/* Create button */}
              <Link href="/create" className="btn-primary gap-1.5 hidden sm:inline-flex">
                <Plus className="w-4 h-4" />
                <span className="hidden lg:inline">Create</span>
              </Link>

              {/* Notifications */}
              <button className="btn-ghost p-2 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* User menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.displayName}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-surface-200 dark:ring-surface-700"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-sm font-semibold text-brand-600">
                      {user?.displayName?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-surface-500 hidden sm:block" />
                </button>

                {/* Dropdown menu */}
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 glass-card py-2 animate-scale-in origin-top-right">
                    <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800">
                      <p className="font-semibold text-sm">{user?.displayName}</p>
                      <p className="text-xs text-surface-500">@{user?.username}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        href={`/profile/${user?.username}`}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                      >
                        <User className="w-4 h-4 text-surface-500" />
                        Your Profile
                      </Link>
                      <Link
                        href="/saved"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                      >
                        <Bookmark className="w-4 h-4 text-surface-500" />
                        Saved Posts
                      </Link>
                      <Link
                        href="/boards"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-surface-500" />
                        My Boards
                      </Link>
                      {user?.role === 'admin' && (
                        <Link
                          href="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors text-brand-600"
                        >
                          <Settings className="w-4 h-4" />
                          Admin Panel
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-surface-100 dark:border-surface-800 pt-1">
                      <Link
                        href="/settings"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-surface-500" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn-ghost text-sm font-semibold">
                Log In
              </Link>
              <Link href="/register" className="btn-primary text-sm">
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile menu */}
          <button onClick={toggleSidebar} className="md:hidden btn-ghost p-2">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile search */}
      {showMobileSearch && (
        <div className="md:hidden absolute top-full left-0 right-0 p-3 bg-white dark:bg-surface-950 border-b border-surface-100 dark:border-surface-800 animate-slide-up">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-11 pr-10 py-3 rounded-full bg-surface-100 dark:bg-surface-800 
                border-0 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="button"
              onClick={() => setShowMobileSearch(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-surface-400" />
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
