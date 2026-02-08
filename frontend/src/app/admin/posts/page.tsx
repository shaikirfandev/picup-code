'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { Search, Eye, Trash2, ChevronLeft, ChevronRight, ExternalLink, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminAPI.getPosts({ page, search, limit: 20 });
      setPosts(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch { /* silent */ }
    setIsLoading(false);
  };

  useEffect(() => { fetchPosts(); }, [page, search]);

  const handleDelete = async (postId: string) => {
    if (!confirm('Delete this post permanently?')) return;
    try {
      await adminAPI.deletePost(postId);
      toast.success('Post deleted');
      fetchPosts();
    } catch { toast.error('Failed'); }
  };

  const handleToggleFeatured = async (postId: string, current: boolean) => {
    try {
      await adminAPI.updatePost(postId, { isFeatured: !current });
      toast.success(!current ? 'Featured!' : 'Unfeatured');
      fetchPosts();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Posts</h1>
        <p className="text-surface-500">Manage all platform content</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search posts..."
          className="input-field pl-10"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-50 dark:bg-surface-800">
              <tr>
                <th className="text-left text-sm font-medium text-surface-500 p-4">Post</th>
                <th className="text-left text-sm font-medium text-surface-500 p-4">Author</th>
                <th className="text-left text-sm font-medium text-surface-500 p-4">Stats</th>
                <th className="text-left text-sm font-medium text-surface-500 p-4">Created</th>
                <th className="text-left text-sm font-medium text-surface-500 p-4">Status</th>
                <th className="text-right text-sm font-medium text-surface-500 p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="p-4"><div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-20" /></td>
                      ))}
                    </tr>
                  ))
                : posts.map((p) => (
                    <tr key={p._id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {p.image?.url && (
                            <img src={p.image.url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate max-w-[200px]">{p.title}</p>
                            {p.isAiGenerated && (
                              <span className="text-xs text-purple-500 font-medium">✨ AI Generated</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-surface-600">{p.author?.displayName || 'Unknown'}</td>
                      <td className="p-4 text-sm">
                        <span className="text-surface-500">👁 {p.viewsCount} · ❤️ {p.likesCount} · 🔖 {p.savesCount}</span>
                      </td>
                      <td className="p-4 text-sm text-surface-500">{timeAgo(p.createdAt)}</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleFeatured(p._id, p.isFeatured)}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            p.isFeatured ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-surface-100 text-surface-500 dark:bg-surface-800'
                          }`}
                        >
                          {p.isFeatured ? '⭐ Featured' : 'Regular'}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/post/${p._id}`} className="btn-ghost p-2">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button onClick={() => handleDelete(p._id)} className="btn-ghost p-2 text-red-500 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

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
