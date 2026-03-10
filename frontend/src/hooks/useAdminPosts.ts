'use client';

import { useState, useCallback, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { Post } from '@/types';
import toast from 'react-hot-toast';

interface UseAdminPostsOptions {
  initialLimit?: number;
}

interface AdminPostsState {
  posts: Post[];
  page: number;
  totalPages: number;
  total: number;
  isLoading: boolean;
  search: string;
  statusFilter: string;
  deletedFilter: string; // '' | 'only' | 'true'
  sortBy: string;
}

export function useAdminPosts({ initialLimit = 20 }: UseAdminPostsOptions = {}) {
  const [state, setState] = useState<AdminPostsState>({
    posts: [],
    page: 1,
    totalPages: 1,
    total: 0,
    isLoading: true,
    search: '',
    statusFilter: '',
    deletedFilter: '',
    sortBy: 'recent',
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchPosts = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const params: Record<string, any> = {
        page: state.page,
        limit: initialLimit,
        sort: state.sortBy,
      };
      if (state.search) params.search = state.search;
      if (state.statusFilter) params.status = state.statusFilter;
      if (state.deletedFilter) params.includeDeleted = state.deletedFilter;

      const { data } = await adminAPI.getAdminPosts(params);
      setState((s) => ({
        ...s,
        posts: data.data || [],
        totalPages: data.pagination?.totalPages || 1,
        total: data.pagination?.total || 0,
        isLoading: false,
      }));
    } catch {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, [state.page, state.search, state.statusFilter, state.deletedFilter, state.sortBy, initialLimit]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const setPage = (p: number) => setState((s) => ({ ...s, page: p }));
  const setSearch = (search: string) => setState((s) => ({ ...s, search, page: 1 }));
  const setStatusFilter = (statusFilter: string) => setState((s) => ({ ...s, statusFilter, page: 1 }));
  const setDeletedFilter = (deletedFilter: string) => setState((s) => ({ ...s, deletedFilter, page: 1 }));
  const setSortBy = (sortBy: string) => setState((s) => ({ ...s, sortBy, page: 1 }));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === state.posts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(state.posts.map((p) => p._id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const deletePost = async (id: string, reason?: string, hardDelete = false) => {
    try {
      await adminAPI.deleteAdminPost(id, { reason, hardDelete });
      toast.success(hardDelete ? 'Post permanently deleted' : 'Post deleted');
      // Optimistic: remove from list
      setState((s) => ({
        ...s,
        posts: s.posts.filter((p) => p._id !== id),
        total: s.total - 1,
      }));
      selectedIds.delete(id);
      setSelectedIds(new Set(selectedIds));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed');
      throw err;
    }
  };

  const bulkDelete = async (reason?: string, hardDelete = false) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      const { data } = await adminAPI.bulkDeletePosts({ postIds: ids, reason, hardDelete });
      const result = data.data;
      toast.success(`${result.deleted.length} posts deleted`);
      if (result.failed.length > 0) {
        toast.error(`${result.failed.length} failed`);
      }
      // Optimistic: remove deleted ones
      const deletedSet = new Set(result.deleted.map((id: string) => id.toString()));
      setState((s) => ({
        ...s,
        posts: s.posts.filter((p) => !deletedSet.has(p._id)),
        total: s.total - result.deleted.length,
      }));
      setSelectedIds(new Set());
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Bulk delete failed');
      throw err;
    }
  };

  const restorePost = async (id: string) => {
    try {
      await adminAPI.restorePost(id);
      toast.success('Post restored');
      fetchPosts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Restore failed');
    }
  };

  return {
    ...state,
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
    refresh: fetchPosts,
  };
}
