import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adsAPI } from '@/lib/api';
import type { Advertisement, AdDashboardData, AdEarningsData, PaginationMeta } from '@/types';

interface AdState {
  // Dashboard
  dashboard: AdDashboardData | null;
  dashboardLoading: boolean;

  // My Ads
  myAds: Advertisement[];
  myAdsLoading: boolean;
  myAdsPagination: PaginationMeta | null;

  // Earnings
  earnings: AdEarningsData | null;
  earningsLoading: boolean;

  // Current ad
  currentAd: Advertisement | null;
  currentAdLoading: boolean;

  error: string | null;
}

const initialState: AdState = {
  dashboard: null,
  dashboardLoading: false,
  myAds: [],
  myAdsLoading: false,
  myAdsPagination: null,
  earnings: null,
  earningsLoading: false,
  currentAd: null,
  currentAdLoading: false,
  error: null,
};

export const fetchAdDashboard = createAsyncThunk(
  'ads/fetchDashboard',
  async (params?: { period?: string }) => {
    const { data } = await adsAPI.getDashboard(params);
    return data.data;
  }
);

export const fetchMyAds = createAsyncThunk(
  'ads/fetchMyAds',
  async (params?: { page?: number; limit?: number; status?: string; search?: string; sort?: string }) => {
    const { data } = await adsAPI.getMyAds(params);
    return { ads: data.data, pagination: data.pagination };
  }
);

export const fetchAdEarnings = createAsyncThunk(
  'ads/fetchEarnings',
  async (params?: { period?: string }) => {
    const { data } = await adsAPI.getEarnings(params);
    return data.data;
  }
);

export const fetchSingleAd = createAsyncThunk(
  'ads/fetchSingleAd',
  async (id: string) => {
    const { data } = await adsAPI.getAd(id);
    return data.data;
  }
);

export const deleteAd = createAsyncThunk(
  'ads/deleteAd',
  async (id: string) => {
    await adsAPI.deleteAd(id);
    return id;
  }
);

const adSlice = createSlice({
  name: 'ads',
  initialState,
  reducers: {
    clearAdError: (state) => { state.error = null; },
    clearCurrentAd: (state) => { state.currentAd = null; },
  },
  extraReducers: (builder) => {
    builder
      // Dashboard
      .addCase(fetchAdDashboard.pending, (state) => { state.dashboardLoading = true; state.error = null; })
      .addCase(fetchAdDashboard.fulfilled, (state, action) => { state.dashboardLoading = false; state.dashboard = action.payload; })
      .addCase(fetchAdDashboard.rejected, (state, action) => { state.dashboardLoading = false; state.error = action.error.message || 'Failed to fetch dashboard'; })

      // My Ads
      .addCase(fetchMyAds.pending, (state) => { state.myAdsLoading = true; state.error = null; })
      .addCase(fetchMyAds.fulfilled, (state, action) => { state.myAdsLoading = false; state.myAds = action.payload.ads; state.myAdsPagination = action.payload.pagination; })
      .addCase(fetchMyAds.rejected, (state, action) => { state.myAdsLoading = false; state.error = action.error.message || 'Failed to fetch ads'; })

      // Earnings
      .addCase(fetchAdEarnings.pending, (state) => { state.earningsLoading = true; state.error = null; })
      .addCase(fetchAdEarnings.fulfilled, (state, action) => { state.earningsLoading = false; state.earnings = action.payload; })
      .addCase(fetchAdEarnings.rejected, (state, action) => { state.earningsLoading = false; state.error = action.error.message || 'Failed to fetch earnings'; })

      // Single Ad
      .addCase(fetchSingleAd.pending, (state) => { state.currentAdLoading = true; state.error = null; })
      .addCase(fetchSingleAd.fulfilled, (state, action) => { state.currentAdLoading = false; state.currentAd = action.payload; })
      .addCase(fetchSingleAd.rejected, (state, action) => { state.currentAdLoading = false; state.error = action.error.message || 'Failed to fetch ad'; })

      // Delete
      .addCase(deleteAd.fulfilled, (state, action) => { state.myAds = state.myAds.filter((a) => a._id !== action.payload); });
  },
});

export const { clearAdError, clearCurrentAd } = adSlice.actions;
export default adSlice.reducer;
