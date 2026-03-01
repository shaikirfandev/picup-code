'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import {
  LayoutDashboard, Users, FileImage, Flag, FolderTree, Sparkles,
  Shield, ChevronRight, BookOpen, BarChart3, Crown,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/paid-users', label: 'Paid Users', icon: Crown },
  { href: '/admin/posts', label: 'Posts', icon: FileImage },
  { href: '/admin/blogs', label: 'Blog Posts', icon: BookOpen },
  { href: '/admin/reports', label: 'Reports', icon: Flag },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/ai', label: 'AI Logs', icon: Sparkles },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'moderator')) {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'moderator')) return null;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 hidden lg:flex flex-col">
        <div className="p-6 border-b border-surface-100 dark:border-surface-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold">Admin Panel</p>
              <p className="text-xs text-surface-500 capitalize">{user?.role}</p>
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950/30 text-brand-600'
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800'
                }`}
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
