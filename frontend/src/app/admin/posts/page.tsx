'use client';

import { useState } from 'react';
import { useAdminPosts } from '@/hooks/useAdminPosts';
import PostTable from '@/components/admin/PostTable';
import DeleteConfirmationModal from '@/components/admin/DeleteConfirmationModal';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  RefreshCw,
  Filter,
  X,
  Shield,
  FileImage,
} from 'lucide-react';

type DeleteTarget = { mode: 'single'; id: string; title: string } | { mode: 'bulk' };

export default function AdminPostsPage() {
  const {
    posts,
    page,
    totalPages,
    total,
    isLoading,
    search,
    statusFilter,
    deletedFilter,
    sortBy,
    selectedIds,
    setPage,
    setSearch,
    setStatusFilter,
    setDeletedFilter,
    setSortBy,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    deletePost,
    bulkDelete,
    restorePost,
    refresh,
  } = useAdminPosts();

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // --- handlers ---
  const openDeleteSingle = (id: string, title: string) => setDeleteTarget({ mode: 'single', id, title });
  const openDeleteBulk = () => setDeleteTarget({ mode: 'bulk' });

  const handleConfirmDelete = async (reason: string, hardDelete: boolean) => {
    if (!deleteTarget) return;
    if (deleteTarget.mode === 'single') {
      await deletePost(deleteTarget.id, reason, hardDelete);
    } else {
      await bulkDelete(reason, hardDelete);
    }
    setDeleteTarget(null);
  };

  const hasActiveFilters = statusFilter !== '' || deletedFilter !== '' || sortBy !== 'recent';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto">
      {/* ---------- Header ---------- */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--accent-muted)' }}
            >
              <FileImage className="w-4 h-4 text-accent" />
            </div>
            <h1 className="text-lg font-mono font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
              Post Management
            </h1>
          </div>
          <p className="text-[11px] font-mono mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {total} total posts &middot; soft-delete + audit logging enabled
          </p>
        </div>
        <button
          onClick={refresh}
          className="p-2 rounded-lg transition-colors hover:bg-accent/10"
          style={{ color: 'var(--text-tertiary)' }}
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ---------- Search + filter toggle ---------- */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts by title or tag..."
            className="w-full h-9 text-xs font-mono rounded-lg pl-9 pr-3 outline-none transition-all"
            style={{
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
            }}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`h-9 px-3 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors ${
            showFilters || hasActiveFilters ? 'bg-accent/10 text-accent' : ''
          }`}
          style={{
            border: '1px solid var(--border)',
            color: showFilters || hasActiveFilters ? undefined : 'var(--text-tertiary)',
          }}
        >
          <Filter className="w-3 h-3" />
          Filters
          {hasActiveFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          )}
        </button>
      </div>

      {/* ---------- Filter row ---------- */}
      {showFilters && (
        <div
          className="flex flex-wrap gap-2 mb-4 p-3 rounded-lg"
          style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
        >
          <Select
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: '', label: 'All' },
              { value: 'published', label: 'Published' },
              { value: 'pending', label: 'Pending' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'draft', label: 'Draft' },
              { value: 'archived', label: 'Archived' },
            ]}
          />
          <Select
            label="Deleted"
            value={deletedFilter}
            onChange={setDeletedFilter}
            options={[
              { value: '', label: 'Active Only' },
              { value: 'true', label: 'Include Deleted' },
              { value: 'only', label: 'Deleted Only' },
            ]}
          />
          <Select
            label="Sort"
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: 'recent', label: 'Most Recent' },
              { value: 'popular', label: 'Most Popular' },
              { value: 'reported', label: 'Most Reported' },
              { value: 'views', label: 'Most Viewed' },
            ]}
          />
          {hasActiveFilters && (
            <button
              onClick={() => {
                setStatusFilter('');
                setDeletedFilter('');
                setSortBy('recent');
              }}
              className="h-8 px-2.5 rounded-md text-[10px] font-mono flex items-center gap-1 text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      )}

      {/* ---------- Selection bar ---------- */}
      {selectedIds.size > 0 && (
        <div
          className="flex items-center justify-between gap-4 mb-3 px-4 py-2.5 rounded-lg"
          style={{ background: 'var(--accent-muted)', border: '1px solid var(--accent-muted)' }}
        >
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-mono text-accent">
              {selectedIds.size} post{selectedIds.size > 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearSelection}
              className="h-7 px-2.5 text-[10px] font-mono rounded-md transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Deselect
            </button>
            <button
              onClick={openDeleteBulk}
              className="h-7 px-3 text-[10px] font-mono rounded-md flex items-center gap-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* ---------- Table ---------- */}
      <PostTable
        posts={posts}
        isLoading={isLoading}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        onDelete={openDeleteSingle}
        onRestore={restorePost}
      />

      {/* ---------- Pagination ---------- */}
      {totalPages > 1 && (
        <div
          className="flex items-center justify-between mt-3 px-4 py-2.5 rounded-lg"
          style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
        >
          <p className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
            Page {page} of {totalPages} &middot; {total} posts
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg transition-colors hover:bg-accent/10 disabled:opacity-30 disabled:pointer-events-none"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg transition-colors hover:bg-accent/10 disabled:opacity-30 disabled:pointer-events-none"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ---------- Delete modal ---------- */}
      <DeleteConfirmationModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        count={deleteTarget?.mode === 'bulk' ? selectedIds.size : 1}
        postTitle={deleteTarget?.mode === 'single' ? deleteTarget.title : undefined}
      />
    </div>
  );
}

/* ---------- tiny reusable filter select ---------- */
function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] font-mono tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
        {label.toUpperCase()}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 px-2 pr-6 text-[11px] font-mono rounded-md outline-none appearance-none cursor-pointer"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--foreground)',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
