'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import {
  LayoutDashboard, Users, FileImage, Flag, FolderTree, Sparkles,
  Shield, ChevronRight, BookOpen, BarChart3, Crown, Wallet,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/paid-users', label: 'Paid Users', icon: Crown },
  { href: '/admin/wallet-recharges', label: 'Wallet Recharges', icon: Wallet },
  { href: '/admin/posts', label: 'Posts', icon: FileImage },
  { href: '/admin/blogs', label: 'Blog Posts', icon: BookOpen },
  { href: '/admin/reports', label: 'Reports', icon: Flag },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/ai', label: 'AI Logs', icon: Sparkles },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAppSelector((s) => s.auth);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'moderator'))) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'moderator')) return null;

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>
      {/* Sidebar */}
      <aside className="w-64 hidden lg:flex flex-col" style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
        <div className="p-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold" style={{ color: 'var(--foreground)' }}>Admin Panel</p>
              <p className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{user?.role}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/admin' ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={
                  isActive
                    ? { background: 'var(--accent-muted)', color: 'var(--accent)' }
                    : { color: 'var(--text-secondary)' }
                }
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--surface-hover)'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon className="w-4.5 h-4.5" />
                {label}
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
