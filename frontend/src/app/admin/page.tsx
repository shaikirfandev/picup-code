'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { DashboardStats } from '@/types';
import {
  Users, FileImage, Eye, TrendingUp, Heart, Bookmark,
  Flag, Sparkles, ArrowUpRight, ArrowDownRight, Activity,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await adminAPI.getDashboard();
        setStats(data.data);
      } catch { /* silent */ }
      setIsLoading(false);
    };
    fetchStats();
  }, []);

  const statCards = stats
    ? [
        { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'from-blue-500 to-cyan-500' },
        { label: 'Total Posts', value: stats.totalPosts, icon: FileImage, color: 'from-purple-500 to-pink-500' },
        { label: 'Total Views', value: stats.totalViews, icon: Eye, color: 'from-amber-500 to-orange-500' },
        { label: 'Total Likes', value: stats.totalLikes, icon: Heart, color: 'from-red-500 to-rose-500' },
        { label: 'Total Saves', value: stats.totalSaves, icon: Bookmark, color: 'from-green-500 to-emerald-500' },
        { label: 'Active Reports', value: stats.activeReports, icon: Flag, color: 'from-yellow-500 to-amber-500' },
        { label: 'AI Generations', value: stats.totalAIGenerations, icon: Sparkles, color: 'from-violet-500 to-purple-500' },
        { label: 'New Today', value: stats.newUsersToday, icon: TrendingUp, color: 'from-teal-500 to-cyan-500' },
      ]
    : [];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-surface-500 mt-1">Overview of your platform&apos;s metrics</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-24 mb-3" />
              <div className="h-8 bg-surface-200 dark:bg-surface-700 rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-surface-500">{label}</span>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-bold">{(value || 0).toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Recent activity placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-brand-500" />
                Recent Activity
              </h2>
              <div className="space-y-3">
                {stats?.recentPosts?.slice(0, 5).map((post: any) => (
                  <div key={post._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800">
                    {post.image?.url && (
                      <img src={post.image.url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{post.title}</p>
                      <p className="text-xs text-surface-500">by {post.author?.displayName}</p>
                    </div>
                    <span className="text-xs text-surface-400">{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
                {(!stats?.recentPosts || stats.recentPosts.length === 0) && (
                  <p className="text-sm text-surface-400 text-center py-4">No recent activity</p>
                )}
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                Top Users
              </h2>
              <div className="space-y-3">
                {stats?.topUsers?.slice(0, 5).map((u: any, i: number) => (
                  <div key={u._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800">
                    <span className="w-6 h-6 rounded-full bg-surface-100 dark:bg-surface-700 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    {u.avatar ? (
                      <img src={u.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-sm font-bold text-brand-600">
                        {u.displayName?.[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{u.displayName}</p>
                      <p className="text-xs text-surface-500">@{u.username}</p>
                    </div>
                    <span className="text-sm font-semibold">{u.postsCount} pins</span>
                  </div>
                ))}
                {(!stats?.topUsers || stats.topUsers.length === 0) && (
                  <p className="text-sm text-surface-400 text-center py-4">No users yet</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
