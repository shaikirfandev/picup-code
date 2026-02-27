import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { DashboardStats, AnalyticsOverview, AnalyticsLoginStats } from '@/types';
import { adminAPI } from '@/lib/api';
import { withRetry, serializeError, isCacheValid, SerializedError } from '../utils/retry';
import type { RootState } from '../index';

/* ========================================================================
   State
   ======================================================================== */

interface AnalyticsState {
  // Admin dashboard
  dashboardStats: DashboardStats | null;
  dashboardLoading: boolean;
  dashboardLastFetched: string | null;

  // Analytics overview
  overview: AnalyticsOverview | null;
  overviewLoading: boolean;
  overviewLastFetched: string | null;

  // Login stats
  loginStats: AnalyticsLoginStats | null;
  loginStatsLoading: boolean;

  error: SerializedError | null;
}

const initialState: AnalyticsState = {
  dashboardStats: null,
  dashboardLoading: false,
  dashboardLastFetched: null,

  overview: null,
  overviewLoading: false,
  overviewLastFetched: null,

  loginStats: null,
  loginStatsLoading: false,

  error: null,
};

/* ========================================================================
   Thunks
   ======================================================================== */

export const fetchDashboardStats = createAsyncThunk(
  'analytics/fetchDashboard',
  async (options: { force?: boolean } | void, { getState, rejectWithValue }) => {
    try {
      const state = (getState() as RootState).analytics;
      const force = (options as any)?.force;
      // Cache for 5 min unless forced
      if (!force && state.dashboardStats && isCacheValid(state.dashboardLastFetched, 300_000)) {
        return { data: state.dashboardStats, cached: true };
      }
      const { data } = await withRetry(() => adminAPI.getDashboard());
      return { data: data.data as DashboardStats, cached: false };
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
  {
    condition: (_, { getState }) => {
      return !(getState() as RootState).analytics.dashboardLoading;
    },
  },
);

export const fetchAnalyticsOverview = createAsyncThunk(
  'analytics/fetchOverview',
  async (options: { force?: boolean } | void, { getState, rejectWithValue }) => {
    try {
      const state = (getState() as RootState).analytics;
      const force = (options as any)?.force;
      if (!force && state.overview && isCacheValid(state.overviewLastFetched, 120_000)) {
        return { data: state.overview, cached: true };
      }
      const { data } = await withRetry(() => adminAPI.getAnalyticsOverview());
      return { data: data.data as AnalyticsOverview, cached: false };
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
);

export const fetchLoginStats = createAsyncThunk(
  'analytics/fetchLoginStats',
  async (params: { days?: number } | void, { rejectWithValue }) => {
    try {
      const { data } = await withRetry(() =>
        adminAPI.getAnalyticsLogins({ days: (params as any)?.days }),
      );
      return data.data as AnalyticsLoginStats;
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
);

/* ========================================================================
   Slice
   ======================================================================== */

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    invalidateDashboard(state) {
      state.dashboardLastFetched = null;
    },
    clearAnalyticsError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    /* ---- Dashboard ---- */
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.dashboardLoading = true;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        if (!action.payload.cached) {
          state.dashboardStats = action.payload.data;
          state.dashboardLastFetched = new Date().toISOString();
        }
        state.dashboardLoading = false;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.dashboardLoading = false;
        state.error = (action.payload as SerializedError) || { message: 'Failed' };
      });

    /* ---- Overview ---- */
    builder
      .addCase(fetchAnalyticsOverview.pending, (state) => {
        state.overviewLoading = true;
      })
      .addCase(fetchAnalyticsOverview.fulfilled, (state, action) => {
        if (!action.payload.cached) {
          state.overview = action.payload.data;
          state.overviewLastFetched = new Date().toISOString();
        }
        state.overviewLoading = false;
      })
      .addCase(fetchAnalyticsOverview.rejected, (state, action) => {
        state.overviewLoading = false;
        state.error = (action.payload as SerializedError) || { message: 'Failed' };
      });

    /* ---- Login Stats ---- */
    builder
      .addCase(fetchLoginStats.pending, (state) => {
        state.loginStatsLoading = true;
      })
      .addCase(fetchLoginStats.fulfilled, (state, action) => {
        state.loginStats = action.payload;
        state.loginStatsLoading = false;
      })
      .addCase(fetchLoginStats.rejected, (state, action) => {
        state.loginStatsLoading = false;
        state.error = (action.payload as SerializedError) || { message: 'Failed' };
      });
  },
});

export const { invalidateDashboard, clearAnalyticsError } = analyticsSlice.actions;
export default analyticsSlice.reducer;
