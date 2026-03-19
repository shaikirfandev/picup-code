import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { creatorAnalyticsAPI } from '@/lib/api';
import {
  CreatorOverview,
  EngagementTimelinePoint,
  FollowerGrowthPoint,
  PostPerformanceRow,
  PostDetailedAnalytics,
  AffiliateAnalytics,
  AudienceInsights,
  AIInsights,
  CreatorAccessCheck,
  RealtimeCounters,
} from '@/types';
import { withRetry, serializeError, isCacheValid, SerializedError } from '../utils/retry';
import type { RootState } from '../index';

/* ========================================================================
   Types
   ======================================================================== */

interface PeriodParams {
  period?: string;
  startDate?: string;
  endDate?: string;
}

interface PostsParams extends PeriodParams {
  sort?: string;
  order?: string;
  page?: number;
  limit?: number;
  mediaType?: string;
  tag?: string;
  minImpressions?: number;
}

interface PostsPerformanceResult {
  data: PostPerformanceRow[];
  pagination: any;
}

/* ========================================================================
   State
   ======================================================================== */

interface CreatorAnalyticsState {
  // Access check
  access: CreatorAccessCheck | null;
  accessLoading: boolean;
  accessLastFetched: string | null;

  // Overview
  overview: CreatorOverview | null;
  overviewLoading: boolean;
  overviewLastFetched: string | null;

  // Timeline
  timeline: EngagementTimelinePoint[] | null;
  timelineLoading: boolean;
  timelineLastFetched: string | null;

  // Follower growth
  followerGrowth: FollowerGrowthPoint[] | null;
  followerGrowthLoading: boolean;
  followerGrowthLastFetched: string | null;

  // Posts performance
  postsPerformance: PostsPerformanceResult | null;
  postsPerformanceLoading: boolean;

  // Post detail analytics
  postAnalytics: Record<string, PostDetailedAnalytics>;
  postAnalyticsLoading: Record<string, boolean>;

  // Realtime stats
  realtimeStats: RealtimeCounters | null;
  realtimePostStats: Record<string, RealtimeCounters & { liveViewers: number }>;

  // Affiliate
  affiliate: AffiliateAnalytics | null;
  affiliateLoading: boolean;
  affiliateLastFetched: string | null;

  // Audience
  audience: AudienceInsights | null;
  audienceLoading: boolean;
  audienceLastFetched: string | null;

  // AI insights
  aiInsights: AIInsights | null;
  aiInsightsLoading: boolean;
  aiInsightsLastFetched: string | null;

  // CSV Export
  exportLoading: boolean;

  // Global error
  error: SerializedError | null;

  // Current period (shared across tabs)
  currentPeriod: string;
  currentCustomRange: { startDate?: string; endDate?: string };
}

const initialState: CreatorAnalyticsState = {
  access: null,
  accessLoading: false,
  accessLastFetched: null,

  overview: null,
  overviewLoading: false,
  overviewLastFetched: null,

  timeline: null,
  timelineLoading: false,
  timelineLastFetched: null,

  followerGrowth: null,
  followerGrowthLoading: false,
  followerGrowthLastFetched: null,

  postsPerformance: null,
  postsPerformanceLoading: false,

  postAnalytics: {},
  postAnalyticsLoading: {},

  realtimeStats: null,
  realtimePostStats: {},

  affiliate: null,
  affiliateLoading: false,
  affiliateLastFetched: null,

  audience: null,
  audienceLoading: false,
  audienceLastFetched: null,

  aiInsights: null,
  aiInsightsLoading: false,
  aiInsightsLastFetched: null,

  exportLoading: false,

  error: null,

  currentPeriod: '30d',
  currentCustomRange: {},
};

/* ========================================================================
   Thunks
   ======================================================================== */

// ── Access Check ─────────────────────────────────────────────────────────────
export const checkCreatorAccess = createAsyncThunk(
  'creatorAnalytics/checkAccess',
  async (_: void, { getState, rejectWithValue }) => {
    try {
      const state = (getState() as RootState).creatorAnalytics;
      if (state.access && isCacheValid(state.accessLastFetched, 300_000)) {
        return { data: state.access, cached: true };
      }
      const { data } = await withRetry(() => creatorAnalyticsAPI.checkAccess());
      return { data: data.data as CreatorAccessCheck, cached: false };
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
  {
    condition: (_, { getState }) => !(getState() as RootState).creatorAnalytics.accessLoading,
  },
);

// ── Overview ─────────────────────────────────────────────────────────────────
export const fetchCreatorOverview = createAsyncThunk(
  'creatorAnalytics/fetchOverview',
  async (params: PeriodParams | void, { rejectWithValue }) => {
    try {
      const { data } = await withRetry(() =>
        creatorAnalyticsAPI.getOverview(params || undefined),
      );
      return data.data as CreatorOverview;
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
  {
    condition: (_, { getState }) => !(getState() as RootState).creatorAnalytics.overviewLoading,
  },
);

// ── Engagement Timeline ──────────────────────────────────────────────────────
export const fetchEngagementTimeline = createAsyncThunk(
  'creatorAnalytics/fetchTimeline',
  async (params: PeriodParams | void, { rejectWithValue }) => {
    try {
      const { data } = await withRetry(() =>
        creatorAnalyticsAPI.getTimeline(params || undefined),
      );
      return data.data as EngagementTimelinePoint[];
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
  {
    condition: (_, { getState }) => !(getState() as RootState).creatorAnalytics.timelineLoading,
  },
);

// ── Follower Growth ──────────────────────────────────────────────────────────
export const fetchFollowerGrowth = createAsyncThunk(
  'creatorAnalytics/fetchFollowerGrowth',
  async (params: PeriodParams | void, { rejectWithValue }) => {
    try {
      const { data } = await withRetry(() =>
        creatorAnalyticsAPI.getFollowerGrowth(params || undefined),
      );
      return data.data as FollowerGrowthPoint[];
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
  {
    condition: (_, { getState }) => !(getState() as RootState).creatorAnalytics.followerGrowthLoading,
  },
);

// ── Posts Performance ────────────────────────────────────────────────────────
export const fetchPostsPerformance = createAsyncThunk(
  'creatorAnalytics/fetchPostsPerformance',
  async (params: PostsParams | void, { rejectWithValue }) => {
    try {
      const { data } = await withRetry(() =>
        creatorAnalyticsAPI.getPostsPerformance(params || undefined),
      );
      return { data: data.data as PostPerformanceRow[], pagination: data.pagination };
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
  {
    condition: (_, { getState }) => !(getState() as RootState).creatorAnalytics.postsPerformanceLoading,
  },
);

// ── Single Post Analytics ────────────────────────────────────────────────────
export const fetchPostAnalytics = createAsyncThunk(
  'creatorAnalytics/fetchPostAnalytics',
  async ({ postId, params }: { postId: string; params?: PeriodParams }, { getState, rejectWithValue }) => {
    try {
      const { data } = await withRetry(() =>
        creatorAnalyticsAPI.getPostAnalytics(postId, params),
      );
      return { postId, data: data.data as PostDetailedAnalytics };
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
  {
    condition: ({ postId }, { getState }) => !(getState() as RootState).creatorAnalytics.postAnalyticsLoading[postId],
  },
);

// ── Realtime Stats ───────────────────────────────────────────────────────────
export const fetchRealtimeStats = createAsyncThunk(
  'creatorAnalytics/fetchRealtime',
  async (_: void, { rejectWithValue }) => {
    try {
      const { data } = await withRetry(() => creatorAnalyticsAPI.getRealtimeStats());
      return data.data as RealtimeCounters;
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
);

export const fetchRealtimePostStats = createAsyncThunk(
  'creatorAnalytics/fetchRealtimePost',
  async (postId: string, { rejectWithValue }) => {
    try {
      const { data } = await withRetry(() => creatorAnalyticsAPI.getRealtimePostStats(postId));
      return { postId, data: data.data as RealtimeCounters & { liveViewers: number } };
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
);

// ── Affiliate Analytics ──────────────────────────────────────────────────────
export const fetchAffiliateAnalytics = createAsyncThunk(
  'creatorAnalytics/fetchAffiliate',
  async (params: PeriodParams | void, { rejectWithValue }) => {
    try {
      const { data } = await withRetry(() =>
        creatorAnalyticsAPI.getAffiliateAnalytics(params || undefined),
      );
      return data.data as AffiliateAnalytics;
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
  {
    condition: (_, { getState }) => !(getState() as RootState).creatorAnalytics.affiliateLoading,
  },
);

// ── Audience Insights ────────────────────────────────────────────────────────
export const fetchAudienceInsights = createAsyncThunk(
  'creatorAnalytics/fetchAudience',
  async (params: PeriodParams | void, { rejectWithValue }) => {
    try {
      const { data } = await withRetry(() =>
        creatorAnalyticsAPI.getAudienceInsights(params || undefined),
      );
      return data.data as AudienceInsights;
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
  {
    condition: (_, { getState }) => !(getState() as RootState).creatorAnalytics.audienceLoading,
  },
);

// ── AI Insights ──────────────────────────────────────────────────────────────
export const fetchAIInsights = createAsyncThunk(
  'creatorAnalytics/fetchAIInsights',
  async (_: void, { getState, rejectWithValue }) => {
    try {
      const state = (getState() as RootState).creatorAnalytics;
      if (state.aiInsights && isCacheValid(state.aiInsightsLastFetched, 900_000)) {
        return { data: state.aiInsights, cached: true };
      }
      const { data } = await withRetry(() => creatorAnalyticsAPI.getAIInsights());
      return { data: data.data as AIInsights, cached: false };
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
  {
    condition: (_, { getState }) => !(getState() as RootState).creatorAnalytics.aiInsightsLoading,
  },
);

// ── Export CSV ────────────────────────────────────────────────────────────────
export const exportAnalyticsCSV = createAsyncThunk(
  'creatorAnalytics/exportCSV',
  async (params: PeriodParams | void, { rejectWithValue }) => {
    try {
      const { data } = await creatorAnalyticsAPI.exportCSV(params || undefined);
      // Trigger download
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
);

// ── Track Event ──────────────────────────────────────────────────────────────
export const trackAnalyticsEvent = createAsyncThunk(
  'creatorAnalytics/trackEvent',
  async (
    params: {
      postId: string;
      eventType: string;
      referrer?: string;
      watchDuration?: number;
      completionRate?: number;
      sessionId?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      await creatorAnalyticsAPI.trackEvent(params);
      return true;
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
);

/* ========================================================================
   Slice
   ======================================================================== */

const creatorAnalyticsSlice = createSlice({
  name: 'creatorAnalytics',
  initialState,
  reducers: {
    setPeriod(state, action: PayloadAction<string>) {
      state.currentPeriod = action.payload;
    },
    setCustomRange(state, action: PayloadAction<{ startDate?: string; endDate?: string }>) {
      state.currentCustomRange = action.payload;
    },
    clearCreatorAnalyticsError(state) {
      state.error = null;
    },
    invalidateCreatorAnalytics(state) {
      state.overviewLastFetched = null;
      state.timelineLastFetched = null;
      state.followerGrowthLastFetched = null;
      state.affiliateLastFetched = null;
      state.audienceLastFetched = null;
      state.aiInsightsLastFetched = null;
    },
  },
  extraReducers: (builder) => {
    /* ── Access ── */
    builder
      .addCase(checkCreatorAccess.pending, (state) => {
        state.accessLoading = true;
      })
      .addCase(checkCreatorAccess.fulfilled, (state, action) => {
        state.accessLoading = false;
        if (!action.payload.cached) {
          state.access = action.payload.data;
          state.accessLastFetched = new Date().toISOString();
        }
      })
      .addCase(checkCreatorAccess.rejected, (state, action) => {
        state.accessLoading = false;
        state.error = (action.payload as SerializedError) || { message: 'Failed' };
      });

    /* ── Overview ── */
    builder
      .addCase(fetchCreatorOverview.pending, (state) => {
        state.overviewLoading = true;
      })
      .addCase(fetchCreatorOverview.fulfilled, (state, action) => {
        state.overviewLoading = false;
        state.overview = action.payload;
        state.overviewLastFetched = new Date().toISOString();
      })
      .addCase(fetchCreatorOverview.rejected, (state, action) => {
        state.overviewLoading = false;
        state.error = (action.payload as SerializedError) || { message: 'Failed' };
      });

    /* ── Timeline ── */
    builder
      .addCase(fetchEngagementTimeline.pending, (state) => {
        state.timelineLoading = true;
      })
      .addCase(fetchEngagementTimeline.fulfilled, (state, action) => {
        state.timelineLoading = false;
        state.timeline = action.payload;
        state.timelineLastFetched = new Date().toISOString();
      })
      .addCase(fetchEngagementTimeline.rejected, (state, action) => {
        state.timelineLoading = false;
        state.error = (action.payload as SerializedError) || { message: 'Failed' };
      });

    /* ── Follower Growth ── */
    builder
      .addCase(fetchFollowerGrowth.pending, (state) => {
        state.followerGrowthLoading = true;
      })
      .addCase(fetchFollowerGrowth.fulfilled, (state, action) => {
        state.followerGrowthLoading = false;
        state.followerGrowth = action.payload;
        state.followerGrowthLastFetched = new Date().toISOString();
      })
      .addCase(fetchFollowerGrowth.rejected, (state, action) => {
        state.followerGrowthLoading = false;
        state.error = (action.payload as SerializedError) || { message: 'Failed' };
      });

    /* ── Posts Performance ── */
    builder
      .addCase(fetchPostsPerformance.pending, (state) => {
        state.postsPerformanceLoading = true;
      })
      .addCase(fetchPostsPerformance.fulfilled, (state, action) => {
        state.postsPerformanceLoading = false;
        state.postsPerformance = action.payload;
      })
      .addCase(fetchPostsPerformance.rejected, (state, action) => {
        state.postsPerformanceLoading = false;
        state.error = (action.payload as SerializedError) || { message: 'Failed' };
      });

    /* ── Post Detail ── */
    builder
      .addCase(fetchPostAnalytics.pending, (state, action) => {
        state.postAnalyticsLoading[action.meta.arg.postId] = true;
      })
      .addCase(fetchPostAnalytics.fulfilled, (state, action) => {
        const { postId, data } = action.payload;
        state.postAnalyticsLoading[postId] = false;
        state.postAnalytics[postId] = data;
      })
      .addCase(fetchPostAnalytics.rejected, (state, action) => {
        state.postAnalyticsLoading[action.meta.arg.postId] = false;
        state.error = (action.payload as SerializedError) || { message: 'Failed' };
      });

    /* ── Realtime ── */
    builder
      .addCase(fetchRealtimeStats.fulfilled, (state, action) => {
        state.realtimeStats = action.payload;
      });
    builder
      .addCase(fetchRealtimePostStats.fulfilled, (state, action) => {
        state.realtimePostStats[action.payload.postId] = action.payload.data;
      });

    /* ── Affiliate ── */
    builder
      .addCase(fetchAffiliateAnalytics.pending, (state) => {
        state.affiliateLoading = true;
      })
      .addCase(fetchAffiliateAnalytics.fulfilled, (state, action) => {
        state.affiliateLoading = false;
        state.affiliate = action.payload;
        state.affiliateLastFetched = new Date().toISOString();
      })
      .addCase(fetchAffiliateAnalytics.rejected, (state, action) => {
        state.affiliateLoading = false;
        state.error = (action.payload as SerializedError) || { message: 'Failed' };
      });

    /* ── Audience ── */
    builder
      .addCase(fetchAudienceInsights.pending, (state) => {
        state.audienceLoading = true;
      })
      .addCase(fetchAudienceInsights.fulfilled, (state, action) => {
        state.audienceLoading = false;
        state.audience = action.payload;
        state.audienceLastFetched = new Date().toISOString();
      })
      .addCase(fetchAudienceInsights.rejected, (state, action) => {
        state.audienceLoading = false;
        state.error = (action.payload as SerializedError) || { message: 'Failed' };
      });

    /* ── AI Insights ── */
    builder
      .addCase(fetchAIInsights.pending, (state) => {
        state.aiInsightsLoading = true;
      })
      .addCase(fetchAIInsights.fulfilled, (state, action) => {
        state.aiInsightsLoading = false;
        if (!action.payload.cached) {
          state.aiInsights = action.payload.data;
          state.aiInsightsLastFetched = new Date().toISOString();
        }
      })
      .addCase(fetchAIInsights.rejected, (state, action) => {
        state.aiInsightsLoading = false;
        state.error = (action.payload as SerializedError) || { message: 'Failed' };
      });

    /* ── CSV Export ── */
    builder
      .addCase(exportAnalyticsCSV.pending, (state) => {
        state.exportLoading = true;
      })
      .addCase(exportAnalyticsCSV.fulfilled, (state) => {
        state.exportLoading = false;
      })
      .addCase(exportAnalyticsCSV.rejected, (state) => {
        state.exportLoading = false;
      });
  },
});

export const {
  setPeriod,
  setCustomRange,
  clearCreatorAnalyticsError,
  invalidateCreatorAnalytics,
} = creatorAnalyticsSlice.actions;

export default creatorAnalyticsSlice.reducer;
