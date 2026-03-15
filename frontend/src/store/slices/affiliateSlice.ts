import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { affiliateAPI } from '@/lib/api';
import type { AffiliateSummary, AffiliatePostStats, Post } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AffiliateState {
  summary: AffiliateSummary | null;
  affiliatePosts: Post[];
  postsTotal: number;
  selectedPostStats: AffiliatePostStats | null;
  loading: boolean;
  statsLoading: boolean;
  error: string | null;
}

const initialState: AffiliateState = {
  summary: null,
  affiliatePosts: [],
  postsTotal: 0,
  selectedPostStats: null,
  loading: false,
  statsLoading: false,
  error: null,
};

// ─── Thunks ──────────────────────────────────────────────────────────────────

export const fetchAffiliateSummary = createAsyncThunk(
  'affiliate/fetchSummary',
  async () => {
    const { data } = await affiliateAPI.getSummary();
    return data.data as AffiliateSummary;
  }
);

export const fetchAffiliatePosts = createAsyncThunk(
  'affiliate/fetchPosts',
  async (params?: { page?: number; limit?: number; sort?: string }) => {
    const { data } = await affiliateAPI.getMyAffiliatePosts(params);
    return { posts: data.data as Post[], pagination: data.pagination };
  }
);

export const fetchAffiliatePostStats = createAsyncThunk(
  'affiliate/fetchPostStats',
  async ({ postId, period }: { postId: string; period?: string }) => {
    const { data } = await affiliateAPI.getPostStats(postId, { period });
    return data.data as AffiliatePostStats;
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const affiliateSlice = createSlice({
  name: 'affiliate',
  initialState,
  reducers: {
    clearAffiliateError(state) {
      state.error = null;
    },
    clearSelectedPostStats(state) {
      state.selectedPostStats = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Summary
      .addCase(fetchAffiliateSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAffiliateSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchAffiliateSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load summary';
      })
      // Affiliate posts
      .addCase(fetchAffiliatePosts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAffiliatePosts.fulfilled, (state, action) => {
        state.loading = false;
        state.affiliatePosts = action.payload.posts;
        state.postsTotal = action.payload.pagination?.total || 0;
      })
      .addCase(fetchAffiliatePosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load posts';
      })
      // Per-post stats
      .addCase(fetchAffiliatePostStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchAffiliatePostStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.selectedPostStats = action.payload;
      })
      .addCase(fetchAffiliatePostStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.error = action.error.message || 'Failed to load post stats';
      });
  },
});

export const { clearAffiliateError, clearSelectedPostStats } = affiliateSlice.actions;
export default affiliateSlice.reducer;
