'use client';

import { useEffect, useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
} from '@/store/slices/notificationSlice';
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Bookmark,
  AlertTriangle,
  Info,
  CheckCheck,
  Trash2,
  Reply,
  Filter,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Notification } from '@/types';

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  like: { icon: Heart, color: 'text-error', bg: 'bg-error/10', label: 'Like' },
  comment: { icon: MessageCircle, color: 'text-accent', bg: 'bg-accent/10', label: 'Comment' },
  reply: { icon: Reply, color: 'text-accent', bg: 'bg-accent/10', label: 'Reply' },
  follow: { icon: UserPlus, color: 'text-success', bg: 'bg-success/10', label: 'Follow' },
  save: { icon: Bookmark, color: 'text-warning', bg: 'bg-warning/10', label: 'Save' },
  mention: { icon: Info, color: 'text-accent', bg: 'bg-accent/10', label: 'Mention' },
  report_resolved: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', label: 'Report' },
  system: { icon: Info, color: 'text-accent', bg: 'bg-accent/10', label: 'System' },
};

const ALL_TYPES = ['like', 'comment', 'reply', 'follow', 'save', 'mention', 'report_resolved', 'system'];

function NotificationRow({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  const config = typeConfig[notification.type] || typeConfig.system;
  const Icon = config.icon;

  const getLink = () => {
    if (notification.post?._id) return `/post/${notification.post._id}`;
    if (notification.type === 'follow' && notification.sender?.username)
      return `/profile/${notification.sender.username}`;
    return '#';
  };

  return (
    <Link
      href={getLink()}
      onClick={() => {
        if (!notification.isRead) onRead(notification._id);
      }}
      className={`block group transition-all duration-200 rounded-lg hover:scale-[1.005] ${
        !notification.isRead ? '' : 'opacity-70'
      }`}
    >
      <div
        className={`flex items-start gap-4 p-4 rounded-lg transition-all duration-200 group-hover:border-accent/20 ${
          !notification.isRead ? 'bg-accent/[0.03]' : ''
        }`}
        style={{
          border: '1px solid var(--border)',
          background: !notification.isRead ? 'var(--surface-elevated)' : 'transparent',
        }}
      >
        {/* Type icon */}
        <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${config.bg}`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>

        {/* Sender avatar */}
        <div className="shrink-0">
          {notification.sender?.avatar ? (
            <img
              src={notification.sender.avatar}
              alt={notification.sender.displayName}
              className="w-10 h-10 rounded object-cover"
              style={{ border: '1px solid var(--border)' }}
            />
          ) : (
            <div
              className="w-10 h-10 rounded flex items-center justify-center text-xs font-mono font-bold text-accent"
              style={{ background: 'var(--accent-muted)', border: '1px solid var(--border)' }}
            >
              {notification.sender?.displayName?.[0]?.toUpperCase() || 'S'}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono leading-relaxed" style={{ color: 'var(--foreground)' }}>
            <span className="font-semibold text-accent">
              {notification.sender?.displayName || notification.sender?.username || 'System'}
            </span>{' '}
            <span style={{ color: 'var(--text-secondary)' }}>
              {notification.message?.replace(notification.sender?.displayName || notification.sender?.username || '', '').trim() || config.label}
            </span>
          </p>
          {notification.post?.title && (
            <p className="text-[11px] font-mono mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>
              &ldquo;{notification.post.title}&rdquo;
            </p>
          )}
          <p className="text-[10px] font-mono mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
        </div>

        {/* Post thumbnail */}
        {notification.post?.image?.url && (
          <div className="shrink-0 hidden sm:block">
            <img
              src={notification.post.image.url}
              alt=""
              className="w-12 h-12 rounded object-cover"
              style={{ border: '1px solid var(--border)' }}
            />
          </div>
        )}

        {/* Unread dot */}
        {!notification.isRead && (
          <div className="shrink-0 mt-3">
            <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
          </div>
        )}
      </div>
    </Link>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items, unreadCount, isLoading, hasMore, page } = useAppSelector((s) => s.notifications);
  const { isAuthenticated, isLoading: authLoading } = useAppSelector((s) => s.auth);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isAuthenticated) {
      dispatch(fetchNotifications({ page: 1, limit: 30 }));
    }
  }, [isAuthenticated, authLoading, dispatch, router]);

  const handleRead = useCallback(
    (id: string) => {
      dispatch(markAsRead(id));
    },
    [dispatch]
  );

  const handleMarkAllRead = () => dispatch(markAllAsRead());
  const handleClearAll = () => {
    if (window.confirm('Clear all notifications? This cannot be undone.')) {
      dispatch(clearAllNotifications());
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      dispatch(fetchNotifications({ page: page + 1, limit: 30 }));
    }
  };

  const filtered = typeFilter === 'all' ? items : items.filter((n) => n.type === typeFilter);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-14">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-14" style={{ background: 'var(--background)' }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--accent-muted)', border: '1px solid var(--border)' }}
            >
              <Bell className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-lg font-semibold font-bold tracking-wider" style={{ color: 'var(--foreground)' }}>
                NOTIFICATIONS
              </h1>
              <p className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono tracking-wider text-accent hover:bg-accent/10 rounded transition-colors"
                style={{ border: '1px solid var(--border)' }}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                MARK ALL READ
              </button>
            )}
            {items.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono tracking-wider text-error/60 hover:text-error hover:bg-error/10 rounded transition-colors"
                style={{ border: '1px solid var(--border)' }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                CLEAR
              </button>
            )}
          </div>
        </div>

        {/* Type filter pills */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Filter className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1 text-[10px] font-mono rounded-full transition-all ${
              typeFilter === 'all'
                ? 'bg-accent/20 text-accent border-accent/30'
                : 'hover:bg-accent/5'
            }`}
            style={{
              border: `1px solid ${typeFilter === 'all' ? '' : 'var(--border)'}`,
              color: typeFilter === 'all' ? '' : 'var(--text-secondary)',
            }}
          >
            ALL
          </button>
          {ALL_TYPES.map((t) => {
            const cfg = typeConfig[t];
            const Icon = cfg.icon;
            const count = items.filter((n) => n.type === t).length;
            if (count === 0) return null;
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`flex items-center gap-1 px-3 py-1 text-[10px] font-mono rounded-full transition-all ${
                  typeFilter === t
                    ? `${cfg.bg} ${cfg.color}`
                    : 'hover:bg-accent/5'
                }`}
                style={{
                  border: `1px solid ${typeFilter === t ? '' : 'var(--border)'}`,
                  color: typeFilter === t ? '' : 'var(--text-secondary)',
                }}
              >
                <Icon className="w-3 h-3" />
                {cfg.label.toUpperCase()} ({count})
              </button>
            );
          })}
        </div>

        {/* Notification list */}
        <div className="space-y-2">
          {filtered.length === 0 && !isLoading ? (
            <div
              className="flex flex-col items-center justify-center py-16 rounded-lg"
              style={{ border: '1px solid var(--border)', background: 'var(--surface-elevated)' }}
            >
              <Bell className="w-12 h-12 mb-3" style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-sm font-mono" style={{ color: 'var(--text-tertiary)' }}>
                {typeFilter !== 'all' ? `No ${typeConfig[typeFilter]?.label.toLowerCase()} notifications` : 'No notifications yet'}
              </p>
              <p className="text-[10px] font-mono mt-1" style={{ color: 'var(--text-tertiary)' }}>
                When someone interacts with your content, you&apos;ll see it here.
              </p>
            </div>
          ) : (
            <>
              {filtered.map((n) => (
                <NotificationRow key={n._id} notification={n} onRead={handleRead} />
              ))}

              {hasMore && typeFilter === 'all' && (
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="w-full py-3 text-[11px] font-mono text-accent hover:bg-accent/5 rounded-lg transition-colors"
                  style={{ border: '1px solid var(--border)' }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    'LOAD MORE'
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
