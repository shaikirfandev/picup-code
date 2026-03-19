'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
} from '@/store/slices/notificationSlice';
import { useClickOutside } from '@/hooks';
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Bookmark,
  AlertTriangle,
  Info,
  Check,
  CheckCheck,
  X,
  Reply,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Notification } from '@/types';

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  like: { icon: Heart, color: 'text-error', label: 'Liked' },
  comment: { icon: MessageCircle, color: 'text-accent', label: 'Commented' },
  reply: { icon: Reply, color: 'text-accent', label: 'Replied' },
  follow: { icon: UserPlus, color: 'text-success', label: 'Followed' },
  save: { icon: Bookmark, color: 'text-warning', label: 'Saved' },
  mention: { icon: Info, color: 'text-accent', label: 'Mentioned' },
  report_resolved: { icon: AlertTriangle, color: 'text-warning', label: 'Report' },
  system: { icon: Info, color: 'text-accent', label: 'System' },
};

function NotificationItem({
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
    return '/notifications';
  };

  return (
    <Link
      href={getLink()}
      onClick={() => {
        if (!notification.isRead) onRead(notification._id);
      }}
      className={`flex items-start gap-3 px-4 py-3 transition-all duration-200 hover:bg-accent/5 ${
        !notification.isRead ? 'bg-accent/[0.03]' : ''
      }`}
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      {/* Sender avatar */}
      <div className="relative shrink-0">
        {notification.sender?.avatar ? (
          <img
            src={notification.sender.avatar}
            alt={notification.sender.displayName}
            className="w-8 h-8 rounded object-cover"
            style={{ border: '1px solid var(--border)' }}
          />
        ) : (
          <div
            className="w-8 h-8 rounded flex items-center justify-center text-[10px] font-mono font-bold text-accent"
            style={{ background: 'var(--accent-muted)', border: '1px solid var(--border)' }}
          >
            {notification.sender?.displayName?.[0]?.toUpperCase() || 'S'}
          </div>
        )}
        <div
          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${config.color}`}
          style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
        >
          <Icon className="w-2.5 h-2.5" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-mono leading-relaxed" style={{ color: 'var(--foreground)' }}>
          <span className="font-semibold text-accent">
            {notification.sender?.displayName || notification.sender?.username || 'System'}
          </span>{' '}
          <span style={{ color: 'var(--text-secondary)' }}>
            {notification.message?.replace(notification.sender?.displayName || notification.sender?.username || '', '').trim() || config.label}
          </span>
        </p>
        {notification.post?.title && (
          <p
            className="text-[10px] font-mono truncate mt-0.5"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {notification.post.title}
          </p>
        )}
        <p className="text-[9px] font-mono mt-1" style={{ color: 'var(--text-tertiary)' }}>
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="shrink-0 mt-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        </div>
      )}
    </Link>
  );
}

export default function NotificationBell() {
  const dispatch = useAppDispatch();
  const { items, unreadCount, isLoading, hasMore, page } = useAppSelector((s) => s.notifications);
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef as React.RefObject<HTMLElement>, () => setOpen(false));

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (open && isAuthenticated) {
      dispatch(fetchNotifications({ page: 1 }));
    }
  }, [open, isAuthenticated, dispatch]);

  // Poll unread count every 60s
  useEffect(() => {
    if (!isAuthenticated) return;
    dispatch(fetchUnreadCount());
    const interval = setInterval(() => dispatch(fetchUnreadCount()), 60_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, dispatch]);

  const handleRead = useCallback(
    (id: string) => {
      dispatch(markAsRead(id));
    },
    [dispatch]
  );

  const handleMarkAllRead = () => {
    dispatch(markAllAsRead());
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      dispatch(fetchNotifications({ page: page + 1 }));
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 hover:text-accent transition-all duration-300 hover:bg-accent/5 rounded"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center px-1 text-[9px] font-mono font-bold rounded-full bg-error text-white animate-pulse"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 animate-scale-in origin-top-right overflow-hidden rounded-md z-50"
          style={{
            background: 'var(--dropdown-bg)',
            backdropFilter: 'blur(30px)',
            border: '1px solid var(--border-strong)',
            boxShadow: 'var(--dropdown-shadow)',
            maxHeight: '480px',
          }}
        >
          {/* Header glow line */}
          <div
            className="h-[1px] dark:opacity-100 opacity-50"
            style={{
              background: 'linear-gradient(90deg, transparent, var(--accent-muted), transparent)',
            }}
          />

          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-accent" />
              <span className="text-[11px] font-mono font-semibold tracking-wider" style={{ color: 'var(--foreground)' }}>
                NOTIFICATIONS
              </span>
              {unreadCount > 0 && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="p-1 hover:text-accent transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 hover:text-accent transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto" style={{ maxHeight: '380px' }}>
            {items.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Bell className="w-8 h-8 mb-2" style={{ color: 'var(--text-tertiary)' }} />
                <p className="text-[11px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                  No notifications yet
                </p>
              </div>
            ) : (
              <>
                {items.map((n) => (
                  <NotificationItem key={n._id} notification={n} onRead={handleRead} />
                ))}
                {hasMore && (
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="w-full py-2.5 text-[10px] font-mono text-accent hover:bg-accent/5 transition-colors"
                  >
                    {isLoading ? 'Loading...' : 'Load more'}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid var(--border)' }}>
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center py-2.5 text-[10px] font-mono font-medium text-accent hover:bg-accent/5 transition-colors tracking-wider"
            >
              VIEW ALL NOTIFICATIONS
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
