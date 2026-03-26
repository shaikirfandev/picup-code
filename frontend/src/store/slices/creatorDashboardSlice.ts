import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { creatorDashboardAPI } from '@/lib/api';
import type {
  DashboardOverview,
  ContentPerformanceData,
  EngagementTrendItem,
  PerformanceHeatmapData,
  DashboardAudienceInsights,
  MonetizationData,
  ContentManagementData,
  GrowthInsightsData,
  ActivityFeedData,
  CreatorProfileData,
} from '@/types';
import type { RootState } from '..';

// ─── State ─────────────────────────────────────────────────────

interface DashboardState {
  // Period control
  period: string;

  // Overview
  overview: DashboardOverview | null;
  overviewLoading: boolean;
  overviewError: string | null;

  // Content Performance
  contentPerformance: ContentPerformanceData | null;
  contentPerformanceLoading: boolean;

  // Engagement Trends
  engagementTrends: EngagementTrendItem[];
  engagementTrendsLoading: boolean;

  // Performance Heatmap
  heatmap: PerformanceHeatmapData | null;
  heatmapLoading: boolean;

  // Audience
  audience: DashboardAudienceInsights | null;
  audienceLoading: boolean;

  // Monetization
  monetization: MonetizationData | null;
  monetizationLoading: boolean;

  // Content Management
  contentManagement: ContentManagementData | null;
  contentManagementLoading: boolean;

  // Growth / AI Insights
  growthInsights: GrowthInsightsData | null;
  growthInsightsLoading: boolean;

  // Activity Feed
  activityFeed: ActivityFeedData | null;
  activityFeedLoading: boolean;

  // Creator Profile
  creatorProfile: CreatorProfileData | null;
  creatorProfileLoading: boolean;

  // Comments Moderation
  comments: { comments: unknown[]; pagination: unknown } | null;
  commentsLoading: boolean;
}

const initialState: DashboardState = {
  period: '30d',
  overview: null,
  overviewLoading: false,
  overviewError: null,
  contentPerformance: null,
  contentPerformanceLoading: false,
  engagementTrends: [],
  engagementTrendsLoading: false,
  heatmap: null,
  heatmapLoading: false,
  audience: null,
  audienceLoading: false,
  monetization: null,
  monetizationLoading: false,
  contentManagement: null,
  contentManagementLoading: false,
  growthInsights: null,
  growthInsightsLoading: false,
  activityFeed: null,
  activityFeedLoading: false,
  creatorProfile: null,
  creatorProfileLoading: false,
  comments: null,
  commentsLoading: false,
};

// ─── Thunks ────────────────────────────────────────────────────

export const fetchDashboardOverview = createAsyncThunk(
  'creatorDashboard/fetchOverview',
  async (params: { period?: string } | undefined, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const period = params?.period || state.creatorDashboard.period;
      const res = await creatorDashboardAPI.getOverview({ period });
      return res.data.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch overview');
    }
  }
);

export const fetchContentPerformance = createAsyncThunk(
  'creatorDashboard/fetchContentPerformance',
  async (params: {
    page?: number; limit?: number; sortBy?: string; sortOrder?: string;
    mediaType?: string; period?: string; search?: string;
  } | undefined, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const period = params?.period || state.creatorDashboard.period;
      const res = await creatorDashboardAPI.getContentPerformance({ ...params, period });
      return res.data.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch content performance');
    }
  }
);

export const fetchEngagementTrends = createAsyncThunk(
  'creatorDashboard/fetchEngagementTrends',
  async (params: { period?: string } | undefined, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const period = params?.period || state.creatorDashboard.period;
      const res = await creatorDashboardAPI.getEngagementTrends({ period });
      return res.data.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch engagement trends');
    }
  }
);

export const fetchPerformanceHeatmap = createAsyncThunk(
  'creatorDashboard/fetchHeatmap',
  async (params: { period?: string } | undefined, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const period = params?.period || state.creatorDashboard.period;
      const res = await creatorDashboardAPI.getPerformanceHeatmap({ period });
      return res.data.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch heatmap');
    }
  }
);

export const fetchAudienceInsights = createAsyncThunk(
  'creatorDashboard/fetchAudience',
  async (params: { period?: string } | undefined, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const period = params?.period || state.creatorDashboard.period;
      const res = await creatorDashboardAPI.getAudienceInsights({ period });
      return res.data.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch audience insights');
    }
  }
);

export const fetchMonetization = createAsyncThunk(
  'creatorDashboard/fetchMonetization',
  async (params: { period?: string } | undefined, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const period = params?.period || state.creatorDashboard.period;
      const res = await creatorDashboardAPI.getMonetization({ period });
      return res.data.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch monetization data');
    }
  }
);

export const enableMonetization = createAsyncThunk(
  'creatorDashboard/enableMonetization',
  async (_, { rejectWithValue }) => {
    try {
      const res = await creatorDashboardAPI.enableMonetization();
      return res.data.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to enable monetization');
    }
  }
);

export const fetchContentManagement = createAsyncThunk(
  'creatorDashboard/fetchContentManagement',
  async (params: {
    page?: number; limit?: number; status?: string;
    mediaType?: string; search?: string; sortBy?: string; sortOrder?: string;
  } | undefined, { rejectWithValue }) => {
    try {
      const res = await creatorDashboardAPI.getContentManagement(params);
      return res.data.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch content management data');
    }
  }
);

export const schedulePost = createAsyncThunk(
  'creatorDashboard/schedulePost',
  async (data: { postId?: string; title?: string; content?: string; scheduledFor: string; timezone?: string; recurring?: boolean; recurrencePattern?: string; notes?: string }, { rejectWithValue }) => {
    try {
      const res = await creatorDashboardAPI.schedulePost(data);
      return res.data.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to schedule post');
    }
  }
);

export const cancelScheduledPost = createAsyncThunk(
  'creatorDashboard/cancelScheduledPost',
  async ({ id }: { id: string }, { rejectWithValue }) => {
    try {
      const res = await creatorDashboardAPI.cancelScheduledPost(id);
      return res.data.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel scheduled post');
    }
  }
);

export const togglePinPost = createAsyncThunk(
  'creatorDashboard/togglePinPost',
  async ({ postId }: { postId: string }, { rejectWithValue }) => {
    try {
      const res = await creatorDashboardAPI.togglePinPost(postId);
      return { postId, ...res.data.data };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle pin');
    }
  }
);

export const bulkUpdatePosts = createAsyncThunk(
  'creatorDashboard/bulkUpdatePosts',
  async (data: { postIds: string[]; action: string }, { rejectWithValue }) => {
    try {
      const res = await creatorDashboardAPI.bulkUpdatePosts(data);
      return res.data.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to bulk update');
    }
  }
);

export const fetchGrowthInsights = createAsyncThunk(
  'creatorDashboard/fetchGrowthInsights',
  async (_, { rejectWithValue }) => {
    try {
      const res = await creatorDashboardAPI.getGrowthInsights();
      return res.data.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch growth insights');
    }
  }
);

export const fetchActivityFeed = createAsyncThunk(
  'creatorDashboard/fetchActivityFeed',
  async (params: { page?: number; limit?: number; eventType?: string } | undefined, { rejectWithValue }) => {
    try {
      const res = await creatorDashboardAPI.getActivityFeed(params);
      return res.data.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch activity feed');
    }
  }
);

export const markActivityRead = createAsyncThunk(
  'creatorDashboard/markActivityRead',
  async (eventIds: string[] | 'all' | undefined, { rejectWithValue }) => {
    try {
      await creatorDashboardAPI.markActivityRead(eventIds);
      return eventIds;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to mark activity read');
    }
  }
);

export const fetchCreatorProfile = createAsyncThunk(
  'creatorDashboard/fetchCreatorProfile',
  async (_, { rejectWithValue }) => {
    try {
      const res = await creatorDashboardAPI.getCreatorProfile();
      return res.data.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch creator profile');
    }
  }
);

export const updateCreatorProfile = createAsyncThunk(
  'creatorDashboard/updateCreatorProfile',
  async (data: Record<string, unknown>, { rejectWithValue }) => {
    try {
      const res = await creatorDashboardAPI.updateCreatorProfile(data);
      return res.data.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to update creator profile');
    }
  }
);

export const fetchCommentsForModeration = createAsyncThunk(
  'creatorDashboard/fetchComments',
  async (params: { page?: number; limit?: number; filter?: string } | undefined, { rejectWithValue }) => {
    try {
      const res = await creatorDashboardAPI.getCommentsForModeration(params);
      return res.data.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch comments');
    }
  }
);

export const moderateComment = createAsyncThunk(
  'creatorDashboard/moderateComment',
  async ({ commentId, action }: { commentId: string; action: string }, { rejectWithValue }) => {
    try {
      const res = await creatorDashboardAPI.moderateComment(commentId, action);
      return { commentId, action, result: res.data.data };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to moderate comment');
    }
  }
);

// ─── Slice ─────────────────────────────────────────────────────

const creatorDashboardSlice = createSlice({
  name: 'creatorDashboard',
  initialState,
  reducers: {
    setPeriod: (state, action: PayloadAction<string>) => {
      state.period = action.payload;
    },
    resetDashboard: () => initialState,
  },
  extraReducers: (builder) => {
    // Overview
    builder
      .addCase(fetchDashboardOverview.pending, (state) => {
        state.overviewLoading = true;
        state.overviewError = null;
      })
      .addCase(fetchDashboardOverview.fulfilled, (state, action) => {
        state.overviewLoading = false;
        state.overview = action.payload;
      })
      .addCase(fetchDashboardOverview.rejected, (state, action) => {
        state.overviewLoading = false;
        state.overviewError = action.payload as string;
      })
      // Content Performance
      .addCase(fetchContentPerformance.pending, (state) => { state.contentPerformanceLoading = true; })
      .addCase(fetchContentPerformance.fulfilled, (state, action) => {
        state.contentPerformanceLoading = false;
        state.contentPerformance = action.payload;
      })
      .addCase(fetchContentPerformance.rejected, (state) => { state.contentPerformanceLoading = false; })
      // Engagement Trends
      .addCase(fetchEngagementTrends.pending, (state) => { state.engagementTrendsLoading = true; })
      .addCase(fetchEngagementTrends.fulfilled, (state, action) => {
        state.engagementTrendsLoading = false;
        state.engagementTrends = action.payload;
      })
      .addCase(fetchEngagementTrends.rejected, (state) => { state.engagementTrendsLoading = false; })
      // Heatmap
      .addCase(fetchPerformanceHeatmap.pending, (state) => { state.heatmapLoading = true; })
      .addCase(fetchPerformanceHeatmap.fulfilled, (state, action) => {
        state.heatmapLoading = false;
        state.heatmap = action.payload;
      })
      .addCase(fetchPerformanceHeatmap.rejected, (state) => { state.heatmapLoading = false; })
      // Audience
      .addCase(fetchAudienceInsights.pending, (state) => { state.audienceLoading = true; })
      .addCase(fetchAudienceInsights.fulfilled, (state, action) => {
        state.audienceLoading = false;
        state.audience = action.payload;
      })
      .addCase(fetchAudienceInsights.rejected, (state) => { state.audienceLoading = false; })
      // Monetization
      .addCase(fetchMonetization.pending, (state) => { state.monetizationLoading = true; })
      .addCase(fetchMonetization.fulfilled, (state, action) => {
        state.monetizationLoading = false;
        state.monetization = action.payload;
      })
      .addCase(fetchMonetization.rejected, (state) => { state.monetizationLoading = false; })
      .addCase(enableMonetization.fulfilled, (state, action) => {
        if (state.monetization) {
          state.monetization.profile.monetizationEnabled = true;
        }
        if (state.creatorProfile) {
          state.creatorProfile.monetizationEnabled = true;
        }
        // The returned profile data
        state.creatorProfile = action.payload;
      })
      // Content Management
      .addCase(fetchContentManagement.pending, (state) => { state.contentManagementLoading = true; })
      .addCase(fetchContentManagement.fulfilled, (state, action) => {
        state.contentManagementLoading = false;
        state.contentManagement = action.payload;
      })
      .addCase(fetchContentManagement.rejected, (state) => { state.contentManagementLoading = false; })
      // Growth Insights
      .addCase(fetchGrowthInsights.pending, (state) => { state.growthInsightsLoading = true; })
      .addCase(fetchGrowthInsights.fulfilled, (state, action) => {
        state.growthInsightsLoading = false;
        state.growthInsights = action.payload;
      })
      .addCase(fetchGrowthInsights.rejected, (state) => { state.growthInsightsLoading = false; })
      // Activity Feed
      .addCase(fetchActivityFeed.pending, (state) => { state.activityFeedLoading = true; })
      .addCase(fetchActivityFeed.fulfilled, (state, action) => {
        state.activityFeedLoading = false;
        state.activityFeed = action.payload;
      })
      .addCase(fetchActivityFeed.rejected, (state) => { state.activityFeedLoading = false; })
      .addCase(markActivityRead.fulfilled, (state, action) => {
        if (state.activityFeed) {
          if (action.payload === 'all') {
            state.activityFeed.events = state.activityFeed.events.map(e => ({ ...e, isRead: true }));
            state.activityFeed.unreadCount = 0;
          }
        }
      })
      // Creator Profile
      .addCase(fetchCreatorProfile.pending, (state) => { state.creatorProfileLoading = true; })
      .addCase(fetchCreatorProfile.fulfilled, (state, action) => {
        state.creatorProfileLoading = false;
        state.creatorProfile = action.payload;
      })
      .addCase(fetchCreatorProfile.rejected, (state) => { state.creatorProfileLoading = false; })
      .addCase(updateCreatorProfile.fulfilled, (state, action) => {
        state.creatorProfile = action.payload;
      })
      // Comments
      .addCase(fetchCommentsForModeration.pending, (state) => { state.commentsLoading = true; })
      .addCase(fetchCommentsForModeration.fulfilled, (state, action) => {
        state.commentsLoading = false;
        state.comments = action.payload;
      })
      .addCase(fetchCommentsForModeration.rejected, (state) => { state.commentsLoading = false; })
      // Toggle pin
      .addCase(togglePinPost.fulfilled, (state, action) => {
        if (state.contentManagement) {
          state.contentManagement.posts = state.contentManagement.posts.map(p =>
            p._id === action.payload.postId ? { ...p, isPinned: action.payload.isPinned } : p
          );
        }
      });
  },
});

export const { setPeriod, resetDashboard } = creatorDashboardSlice.actions;
export default creatorDashboardSlice.reducer;
