'use client';

import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import { History, ChevronLeft } from 'lucide-react';
import type { AdActivityLog as ActivityLogType } from '@/types';

const actionTypeColors: Record<string, string> = {
  CAMPAIGN_CREATED: 'text-green-400',
  CAMPAIGN_UPDATED: 'text-blue-400',
  CAMPAIGN_PAUSED: 'text-amber-400',
  CAMPAIGN_RESUMED: 'text-green-400',
  CAMPAIGN_DELETED: 'text-red-400',
  BUDGET_CHANGED: 'text-amber-400',
  AD_LAUNCHED: 'text-cyan-400',
  BULK_EDIT: 'text-purple-400',
  REPORT_EXPORTED: 'text-blue-400',
  TEMPLATE_SAVED: 'text-teal-400',
  BUSINESS_CREATED: 'text-green-400',
  MEMBER_ADDED: 'text-green-400',
  MEMBER_REMOVED: 'text-red-400',
  CATALOG_CREATED: 'text-cyan-400',
};

export default function ActivityTimeline() {
  const { activityTimeline, activityPagination } = useAppSelector((s) => s.adsInsight);

  return (
    <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/ads-insight-platform" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="w-6 h-6 text-amber-400" />
          Ad Account History
        </h1>
      </div>

      <p className="text-[var(--text-secondary)] text-sm">
        Full audit log of all ad account activities including campaign changes, budget updates, and team actions.
      </p>

      {activityTimeline.length === 0 ? (
        <div className="card p-12 text-center text-[var(--text-muted)]">
          <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No activity yet. Your ad account actions will appear here.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-[var(--border)]" />

          <div className="space-y-0">
            {activityTimeline.map((log) => (
              <TimelineItem key={log._id} log={log} />
            ))}
          </div>
        </div>
      )}

      {activityPagination && activityPagination.total > 0 && (
        <p className="text-xs text-[var(--text-muted)] text-center">
          Showing {activityTimeline.length} of {activityPagination.total} activities
        </p>
      )}
    </div>
  );
}

function TimelineItem({ log }: { log: ActivityLogType }) {
  const color = actionTypeColors[log.actionType] || 'text-gray-400';
  const formattedDate = new Date(log.createdAt).toLocaleString();

  return (
    <div className="relative flex items-start gap-4 pl-10 py-3">
      {/* Dot */}
      <div className={`absolute left-3.5 top-4 w-3 h-3 rounded-full border-2 border-[var(--surface)] ${color.replace('text-', 'bg-')}`} />

      <div className="flex-1 card p-4 space-y-1">
        <div className="flex items-center justify-between">
          <span className={`font-medium text-sm ${color}`}>
            {log.actionType.replace(/_/g, ' ')}
          </span>
          <span className="text-xs text-[var(--text-muted)]">{formattedDate}</span>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">{log.description}</p>
        {log.entityType && (
          <span className="text-xs text-[var(--text-muted)]">{log.entityType}</span>
        )}
      </div>
    </div>
  );
}
