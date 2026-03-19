'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import {
  LayoutDashboard, BarChart3, Users, DollarSign, FolderOpen,
  Sparkles, Settings, Activity, MessageSquare, ChevronRight,
} from 'lucide-react';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Content Analytics', href: '/dashboard/content', icon: BarChart3 },
  { label: 'Audience Insights', href: '/dashboard/audience', icon: Users },
  { label: 'Monetization', href: '/dashboard/monetization', icon: DollarSign },
  { label: 'Content Manager', href: '/dashboard/manage', icon: FolderOpen },
  { label: 'Growth & AI', href: '/dashboard/growth', icon: Sparkles },
  { label: 'Activity Feed', href: '/dashboard/activity', icon: Activity },
  { label: 'Moderation', href: '/dashboard/moderation', icon: MessageSquare },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-transparent" style={{ borderTopColor: 'var(--accent-primary)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Sidebar */}
      <aside className="w-64 fixed left-0 top-16 bottom-0 z-40 overflow-y-auto border-r hidden lg:block"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
        {/* Creator Identity */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="flex items-center gap-3">
            {user.avatar ? (
              <img src={user.avatar} alt={user.displayName} className="w-10 h-10 rounded-full object-cover ring-2" style={{ '--tw-ring-color': 'var(--accent-primary)' } as React.CSSProperties} />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--accent-primary)', color: 'var(--bg-primary)' }}>
                {user.displayName?.[0] || user.username?.[0] || '?'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {user.displayName || user.username}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                Professional Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive ? '' : 'hover:opacity-80'}`}
                style={{
                  background: isActive ? 'var(--accent-primary)' : 'transparent',
                  color: isActive ? 'var(--bg-primary)' : 'var(--text-secondary)',
                }}
              >
                <item.icon className="w-4.5 h-4.5 flex-shrink-0" style={{ width: '18px', height: '18px' }} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* Quick Stats */}
        <div className="p-4 mt-4 mx-2 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>Quick Stats</p>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span style={{ color: 'var(--text-secondary)' }}>Followers</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {(user.followersCount || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: 'var(--text-secondary)' }}>Posts</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {(user.postsCount || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed top-16 left-0 right-0 z-40 border-b overflow-x-auto"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
        <div className="flex gap-1 p-2 min-w-max">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all"
                style={{
                  background: isActive ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                  color: isActive ? 'var(--bg-primary)' : 'var(--text-secondary)',
                }}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-4 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8 mt-12 lg:mt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
