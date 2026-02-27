'use client';

import Link from 'next/link';
import { Post } from '@/types';
import { timeAgo } from '@/lib/utils';
import {
  Eye,
  Trash2,
  RotateCcw,
  ExternalLink,
  AlertTriangle,
  CheckSquare,
  Square,
  ImageIcon,
  Play,
} from 'lucide-react';

interface PostTableProps {
  posts: Post[];
  isLoading: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onDelete: (id: string, title: string) => void;
  onRestore: (id: string) => void;
}

function StatusBadge({ post }: { post: Post }) {
  if (post.isDeleted) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
        <Trash2 className="w-2.5 h-2.5" />
        Deleted
      </span>
    );
  }

  const statusConfig: Record<string, { bg: string; text: string }> = {
    published: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400' },
    pending: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400' },
    rejected: { bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-400' },
    draft: { bg: 'bg-gray-500/10 border-gray-500/20', text: 'text-gray-400' },
    archived: { bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-400' },
  };

  const c = statusConfig[post.status] || statusConfig.draft;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium rounded-full border ${c.bg} ${c.text}`}>
      {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
    </span>
  );
}

export default function PostTable({
  posts,
  isLoading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onDelete,
  onRestore,
}: PostTableProps) {
  const allSelected = posts.length > 0 && selectedIds.size === posts.length;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-lg animate-pulse"
            style={{ background: 'var(--edith-elevated)', border: '1px solid var(--edith-border)' }}
          >
            <div className="w-5 h-5 rounded bg-edith-cyan/10" />
            <div className="w-12 h-12 rounded bg-edith-cyan/10" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 rounded bg-edith-cyan/10" />
              <div className="h-2 w-24 rounded bg-edith-cyan/10" />
            </div>
            <div className="h-3 w-16 rounded bg-edith-cyan/10" />
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 rounded-lg"
        style={{ border: '1px solid var(--edith-border)', background: 'var(--edith-elevated)' }}
      >
        <ImageIcon className="w-10 h-10 mb-3" style={{ color: 'var(--edith-text-muted)' }} />
        <p className="text-sm font-mono" style={{ color: 'var(--edith-text-muted)' }}>No posts found</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--edith-border)' }}>
      {/* Table header */}
      <div
        className="hidden md:grid grid-cols-[40px_1fr_120px_100px_100px_80px_120px] gap-3 items-center px-4 py-2.5"
        style={{ background: 'var(--edith-elevated)', borderBottom: '1px solid var(--edith-border)' }}
      >
        <button onClick={onToggleSelectAll} className="flex items-center justify-center">
          {allSelected ? (
            <CheckSquare className="w-4 h-4 text-edith-cyan" />
          ) : (
            <Square className="w-4 h-4" style={{ color: 'var(--edith-text-muted)' }} />
          )}
        </button>
        <span className="text-[10px] font-mono tracking-widest font-medium" style={{ color: 'var(--edith-text-muted)' }}>POST</span>
        <span className="text-[10px] font-mono tracking-widest font-medium" style={{ color: 'var(--edith-text-muted)' }}>AUTHOR</span>
        <span className="text-[10px] font-mono tracking-widest font-medium" style={{ color: 'var(--edith-text-muted)' }}>STATS</span>
        <span className="text-[10px] font-mono tracking-widest font-medium" style={{ color: 'var(--edith-text-muted)' }}>DATE</span>
        <span className="text-[10px] font-mono tracking-widest font-medium" style={{ color: 'var(--edith-text-muted)' }}>STATUS</span>
        <span className="text-[10px] font-mono tracking-widest font-medium text-right" style={{ color: 'var(--edith-text-muted)' }}>ACTIONS</span>
      </div>

      {/* Rows */}
      <div className="divide-y" style={{ borderColor: 'var(--edith-border)' }}>
        {posts.map((post) => {
          const isSelected = selectedIds.has(post._id);
          const thumb = post.image?.url || post.video?.thumbnailUrl;

          return (
            <div
              key={post._id}
              className={`group grid grid-cols-1 md:grid-cols-[40px_1fr_120px_100px_100px_80px_120px] gap-3 items-center px-4 py-3 transition-all duration-200 ${
                isSelected ? 'bg-edith-cyan/[0.04]' : 'hover:bg-edith-cyan/[0.02]'
              } ${post.isDeleted ? 'opacity-60' : ''}`}
            >
              {/* Checkbox */}
              <button
                onClick={() => onToggleSelect(post._id)}
                className="flex items-center justify-center"
              >
                {isSelected ? (
                  <CheckSquare className="w-4 h-4 text-edith-cyan" />
                ) : (
                  <Square className="w-4 h-4" style={{ color: 'var(--edith-text-muted)' }} />
                )}
              </button>

              {/* Post info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0" style={{ border: '1px solid var(--edith-border)' }}>
                  {thumb ? (
                    <img src={thumb} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--edith-accent-muted)' }}>
                      <ImageIcon className="w-4 h-4" style={{ color: 'var(--edith-text-muted)' }} />
                    </div>
                  )}
                  {post.mediaType === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-mono font-medium truncate" style={{ color: 'var(--edith-text)' }}>
                    {post.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {post.isAiGenerated && (
                      <span className="text-[9px] font-mono text-purple-400">✨ AI</span>
                    )}
                    {post.reportCount > 0 && (
                      <span className="flex items-center gap-0.5 text-[9px] font-mono text-amber-400">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        {post.reportCount}
                      </span>
                    )}
                    {post.isFeatured && (
                      <span className="text-[9px] font-mono text-amber-300">⭐</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Author */}
              <div className="flex items-center gap-2">
                {post.author?.avatar ? (
                  <img
                    src={post.author.avatar}
                    alt=""
                    className="w-5 h-5 rounded object-cover"
                    style={{ border: '1px solid var(--edith-border)' }}
                  />
                ) : (
                  <div className="w-5 h-5 rounded flex items-center justify-center text-[8px] font-mono font-bold text-edith-cyan" style={{ background: 'var(--edith-accent-muted)' }}>
                    {post.author?.displayName?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <span className="text-[10px] font-mono truncate" style={{ color: 'var(--edith-text-dim)' }}>
                  {post.author?.displayName || 'Unknown'}
                </span>
              </div>

              {/* Stats */}
              <div className="text-[10px] font-mono" style={{ color: 'var(--edith-text-muted)' }}>
                <span title="Views">👁 {post.viewsCount}</span>{' '}
                <span title="Likes">❤️ {post.likesCount}</span>
              </div>

              {/* Date */}
              <div className="text-[10px] font-mono" style={{ color: 'var(--edith-text-muted)' }}>
                {post.isDeleted && post.deletedAt ? (
                  <span className="text-red-400" title={`Deleted: ${new Date(post.deletedAt).toLocaleString()}`}>
                    🗑 {timeAgo(post.deletedAt)}
                  </span>
                ) : (
                  timeAgo(post.createdAt)
                )}
              </div>

              {/* Status badge */}
              <div>
                <StatusBadge post={post} />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1">
                <Link
                  href={`/post/${post._id}`}
                  className="p-1.5 rounded-lg transition-colors hover:bg-edith-cyan/10"
                  style={{ color: 'var(--edith-text-muted)' }}
                  title="View post"
                >
                  <Eye className="w-3.5 h-3.5" />
                </Link>

                {post.isDeleted ? (
                  <button
                    onClick={() => onRestore(post._id)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-emerald-500/10 text-emerald-400"
                    title="Restore post"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => onDelete(post._id, post.title)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10 text-red-400"
                    title="Delete post"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
