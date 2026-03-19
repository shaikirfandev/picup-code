'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store';
import { fetchActivityFeed, markActivityRead } from '@/store/slices/creatorDashboardSlice';
import {
  Bell, Heart, MessageCircle, Share2, UserPlus, TrendingUp, DollarSign,
  Award, Star, Eye, CheckCheck, Filter, RefreshCw, ChevronDown,
} from 'lucide-react';

const eventTypeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  new_follower: { icon: UserPlus, color: '#3b82f6', label: 'New Followers' },
  post_like: { icon: Heart, color: '#ef4444', label: 'Likes' },
  comment: { icon: MessageCircle, color: '#8b5cf6', label: 'Comments' },
  share: { icon: Share2, color: '#06b6d4', label: 'Shares' },
  mention: { icon: Star, color: '#f59e0b', label: 'Mentions' },
  milestone: { icon: Award, color: '#10b981', label: 'Milestones' },
  donation: { icon: DollarSign, color: '#ec4899', label: 'Donations' },
  trending: { icon: TrendingUp, color: '#f97316', label: 'Trending' },
  achievement: { icon: Award, color: '#f59e0b', label: 'Achievements' },
  post_view: { icon: Eye, color: '#6b7280', label: 'Views' },
};

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const secs = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`;
  return d.toLocaleDateString();
}

export default function ActivityFeedPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { activityFeed, activityFeedLoading } = useSelector((state: RootState) => state.creatorDashboard);

  const [eventType, setEventType] = useState('');
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    dispatch(fetchActivityFeed({ page, eventType: eventType || undefined }));
  }, [dispatch, page, eventType]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchActivityFeed({ page: 1, eventType: eventType || undefined }));
    setPage(1);
    setRefreshing(false);
  };

  const handleMarkAllRead = async () => {
    await dispatch(markActivityRead());
    loadData();
  };

  const handleLoadMore = () => {
    setPage(p => p + 1);
  };

  const activities = activityFeed?.events || [];
  const unreadCount = activityFeed?.unreadCount || 0;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Bell className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
            Activity Feed
            {unreadCount > 0 && (
              <span className="text-sm px-2 py-0.5 rounded-full font-bold" style={{ background: '#ef444420', color: '#ef4444' }}>
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Stay updated with all interactions on your content.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRefresh} disabled={refreshing}
            className="p-2 rounded-lg border transition-all disabled:opacity-50"
            style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all border"
              style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap items-center">
        <Filter className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
        <button
          onClick={() => { setEventType(''); setPage(1); }}
          className="px-3 py-1 text-xs rounded-full transition-all"
          style={{
            background: !eventType ? 'var(--accent-primary)' : 'var(--bg-surface)',
            color: !eventType ? 'var(--bg-primary)' : 'var(--text-tertiary)',
            border: `1px solid ${!eventType ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
          }}>
          All
        </button>
        {Object.entries(eventTypeConfig).map(([key, config]) => (
          <button key={key}
            onClick={() => { setEventType(key === eventType ? '' : key); setPage(1); }}
            className="flex items-center gap-1 px-3 py-1 text-xs rounded-full transition-all"
            style={{
              background: eventType === key ? `${config.color}20` : 'var(--bg-surface)',
              color: eventType === key ? config.color : 'var(--text-tertiary)',
              border: `1px solid ${eventType === key ? config.color : 'var(--border-primary)'}`,
            }}>
            <config.icon className="w-3 h-3" />
            {config.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="space-y-2">
        {activityFeedLoading && !activities.length ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--bg-surface)' }} />
          ))
        ) : activities.length > 0 ? (
          <>
            {activities.map((activity: any, i: number) => {
              const config = eventTypeConfig[activity.eventType] || { icon: Bell, color: '#6b7280', label: activity.eventType };
              const Icon = config.icon;
              return (
                <div key={activity._id || i}
                  className="rounded-xl border p-4 flex items-start gap-3 transition-all hover:shadow-sm"
                  style={{
                    background: activity.isRead ? 'var(--bg-surface)' : `${config.color}08`,
                    borderColor: activity.isRead ? 'var(--border-primary)' : config.color + '40',
                  }}>
                  {/* Icon */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${config.color}15` }}>
                    <Icon className="w-4 h-4" style={{ color: config.color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                          {activity.actor?.username && (
                            <span className="font-semibold">{activity.actor.username} </span>
                          )}
                          {activity.message || activity.eventType.replace(/_/g, ' ')}
                        </p>
                        {activity.postTitle && (
                          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>
                            on "{activity.postTitle}"
                          </p>
                        )}
                        {activity.amount != null && (
                          <p className="text-xs mt-1 font-mono" style={{ color: 'var(--accent-primary)' }}>
                            ${activity.amount.toFixed(2)} {activity.currency || 'USD'}
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] whitespace-nowrap flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                        {timeAgo(activity.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Unread dot */}
                  {!activity.isRead && (
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: config.color }} />
                  )}
                </div>
              );
            })}

            {/* Load More */}
            {activityFeed?.pagination?.hasMore && (
              <button onClick={handleLoadMore}
                className="w-full py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2"
                style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}>
                <ChevronDown className="w-4 h-4" /> Load More
              </button>
            )}
          </>
        ) : (
          <div className="text-center py-20 rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }}>
            <Bell className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>No activity yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
              {eventType ? 'No events of this type found.' : 'Interactions with your content will appear here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
