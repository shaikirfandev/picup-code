'use client';

import { useState, useCallback, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { BlogPost } from '@/types';
import toast from 'react-hot-toast';
import { useDebounce } from '@/hooks';

interface UseAdminBlogsOptions {
  initialLimit?: number;
}

interface AdminBlogsState {
  posts: BlogPost[];
  page: number;
  totalPages: number;
  total: number;
  isLoading: boolean;
  search: string;
  statusFilter: string;
  categoryFilter: string;
  deletedFilter: string; // '' | 'only' | 'true'
  sortBy: string;
}

export function useAdminBlogs({ initialLimit = 20 }: UseAdminBlogsOptions = {}) {
  const [state, setState] = useState<AdminBlogsState>({
    posts: [],
    page: 1,
    totalPages: 1,
    total: 0,
    isLoading: true,
    search: '',
    statusFilter: '',
    categoryFilter: '',
    deletedFilter: '',
    sortBy: 'recent',
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const debouncedSearch = useDebounce(state.search, 400);

  // Reset to page 1 when debounced search changes
  useEffect(() => { setState((s) => ({ ...s, page: 1 })); }, [debouncedSearch]);

  const fetchPosts = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const params: Record<string, any> = {
        page: state.page,
        limit: initialLimit,
        sort: state.sortBy,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (state.statusFilter) params.status = state.statusFilter;
      if (state.categoryFilter) params.category = state.categoryFilter;
      if (state.deletedFilter) params.includeDeleted = state.deletedFilter;

      const { data } = await adminAPI.getAdminBlogPosts(params);
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
  }, [state.page, debouncedSearch, state.statusFilter, state.categoryFilter, state.deletedFilter, state.sortBy, initialLimit]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const setPage = (p: number) => setState((s) => ({ ...s, page: p }));
  const setSearch = (search: string) => setState((s) => ({ ...s, search, page: 1 }));
  const setStatusFilter = (statusFilter: string) => setState((s) => ({ ...s, statusFilter, page: 1 }));
  const setCategoryFilter = (categoryFilter: string) => setState((s) => ({ ...s, categoryFilter, page: 1 }));
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
      await adminAPI.deleteAdminBlogPost(id, { reason, hardDelete });
      toast.success(hardDelete ? 'Blog post permanently deleted' : 'Blog post deleted');
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
      const { data } = await adminAPI.bulkDeleteBlogPosts({ postIds: ids, reason, hardDelete });
      const result = data.data;
      toast.success(`${result.deleted.length} blog posts deleted`);
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
      await adminAPI.restoreBlogPost(id);
      toast.success('Blog post restored');
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
    setCategoryFilter,
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
