'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { formatNumber, timeAgo } from '@/lib/utils';
import {
  Search, MoreHorizontal, UserX, Shield, ShieldCheck, ChevronLeft,
  ChevronRight, Mail, Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminAPI.getUsers({ page, search, limit: 20 });
      setUsers(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch { /* silent */ }
    setIsLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [page, search]);

  const handleBan = async (userId: string, isBanned: boolean) => {
    try {
      await adminAPI.updateUser(userId, { isActive: isBanned });
      toast.success(isBanned ? 'User unbanned' : 'User banned');
      fetchUsers();
    } catch { toast.error('Failed'); }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await adminAPI.updateUser(userId, { role });
      toast.success('Role updated');
      fetchUsers();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-surface-500">Manage platform users</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search users by name or email..."
          className="input-field pl-10"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-50 dark:bg-surface-800">
              <tr>
                <th className="text-left text-sm font-medium text-surface-500 p-4">User</th>
                <th className="text-left text-sm font-medium text-surface-500 p-4">Email</th>
                <th className="text-left text-sm font-medium text-surface-500 p-4">Role</th>
                <th className="text-left text-sm font-medium text-surface-500 p-4">Posts</th>
                <th className="text-left text-sm font-medium text-surface-500 p-4">Joined</th>
                <th className="text-left text-sm font-medium text-surface-500 p-4">Status</th>
                <th className="text-right text-sm font-medium text-surface-500 p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="p-4"><div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-20" /></td>
                      ))}
                    </tr>
                  ))
                : users.map((u) => (
                    <tr key={u._id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            <img src={u.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-sm font-bold text-brand-600">
                              {u.displayName?.[0]}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm">{u.displayName}</p>
                            <p className="text-xs text-surface-500">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-surface-600 dark:text-surface-400">{u.email}</td>
                      <td className="p-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="text-xs px-2 py-1 rounded-lg border border-surface-200 dark:border-surface-700 bg-transparent"
                        >
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="p-4 text-sm">{u.postsCount || 0}</td>
                      <td className="p-4 text-sm text-surface-500">{timeAgo(u.createdAt)}</td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.isActive !== false ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {u.isActive !== false ? 'Active' : 'Banned'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleBan(u._id, u.isActive === false)}
                          className="btn-ghost text-sm px-2 py-1"
                        >
                          {u.isActive === false ? 'Unban' : 'Ban'}
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-surface-100 dark:border-surface-800">
          <p className="text-sm text-surface-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn-ghost p-2 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn-ghost p-2 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
