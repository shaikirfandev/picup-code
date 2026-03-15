import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { adsInsightAPI, businessAPI } from '@/lib/api';
import type {
  Campaign, AdGroup, AdAccountOverview, CampaignReport,
  AdReportTemplate, AdRecommendation, MediaPlanEstimate,
  AdActivityLog, AdAccount, Business, Catalog,
} from '@/types';

// ─── State ───────────────────────────────────────────────────────────────────

interface AdsInsightState {
  // Campaigns
  campaigns: Campaign[];
  campaignsPagination: { total: number; page: number; totalPages: number; hasMore: boolean } | null;
  selectedCampaign: Campaign | null;
  adGroups: AdGroup[];

  // Overview
  overview: AdAccountOverview | null;

  // Reports
  report: CampaignReport | null;
  reportTemplates: AdReportTemplate[];

  // Recommendations
  recommendations: AdRecommendation[];

  // Media planner
  mediaPlanEstimate: MediaPlanEstimate | null;

  // History
  activityTimeline: AdActivityLog[];
  activityPagination: { total: number; page: number; totalPages: number; hasMore: boolean } | null;

  // Business
  businesses: Business[];
  selectedBusiness: Business | null;
  adAccounts: AdAccount[];
  catalogs: Catalog[];
  selectedCatalog: Catalog | null;

  // Meta
  loading: boolean;
  error: string | null;
}

const initialState: AdsInsightState = {
  campaigns: [],
  campaignsPagination: null,
  selectedCampaign: null,
  adGroups: [],
  overview: null,
  report: null,
  reportTemplates: [],
  recommendations: [],
  mediaPlanEstimate: null,
  activityTimeline: [],
  activityPagination: null,
  businesses: [],
  selectedBusiness: null,
  adAccounts: [],
  catalogs: [],
  selectedCatalog: null,
  loading: false,
  error: null,
};

// ─── Thunks ──────────────────────────────────────────────────────────────────

// Campaigns
export const fetchCampaigns = createAsyncThunk(
  'adsInsight/fetchCampaigns',
  async (params: { page?: number; limit?: number; status?: string; search?: string } = {}) => {
    const { data } = await adsInsightAPI.getCampaigns(params);
    return data;
  }
);

export const fetchCampaign = createAsyncThunk(
  'adsInsight/fetchCampaign',
  async (id: string) => {
    const { data } = await adsInsightAPI.getCampaign(id);
    return data.data;
  }
);

export const createCampaign = createAsyncThunk(
  'adsInsight/createCampaign',
  async (campaignData: Partial<Campaign>) => {
    const { data } = await adsInsightAPI.createCampaign(campaignData);
    return data.data;
  }
);

export const updateCampaign = createAsyncThunk(
  'adsInsight/updateCampaign',
  async ({ id, data: updateData }: { id: string; data: Partial<Campaign> }) => {
    const { data } = await adsInsightAPI.updateCampaign(id, updateData);
    return data.data;
  }
);

export const togglePauseCampaign = createAsyncThunk(
  'adsInsight/togglePauseCampaign',
  async (id: string) => {
    const { data } = await adsInsightAPI.togglePauseCampaign(id);
    return data.data;
  }
);

export const deleteCampaign = createAsyncThunk(
  'adsInsight/deleteCampaign',
  async (id: string) => {
    await adsInsightAPI.deleteCampaign(id);
    return id;
  }
);

// Overview
export const fetchAccountOverview = createAsyncThunk(
  'adsInsight/fetchAccountOverview',
  async (params?: { period?: string }) => {
    const { data } = await adsInsightAPI.getAccountOverview(params);
    return data.data;
  }
);

// Reports
export const fetchCampaignReport = createAsyncThunk(
  'adsInsight/fetchCampaignReport',
  async (params: { campaignId?: string; startDate?: string; endDate?: string; groupBy?: string }) => {
    const { data } = await adsInsightAPI.getCampaignReport(params);
    return data.data;
  }
);

export const fetchReportTemplates = createAsyncThunk(
  'adsInsight/fetchReportTemplates',
  async () => {
    const { data } = await adsInsightAPI.getReportTemplates();
    return data.data;
  }
);

export const saveReportTemplate = createAsyncThunk(
  'adsInsight/saveReportTemplate',
  async (templateData: Partial<AdReportTemplate>) => {
    const { data } = await adsInsightAPI.saveReportTemplate(templateData);
    return data.data;
  }
);

// Recommendations
export const fetchRecommendations = createAsyncThunk(
  'adsInsight/fetchRecommendations',
  async () => {
    const { data } = await adsInsightAPI.getRecommendations();
    return data.data;
  }
);

// Media Planner
export const estimateMediaPlan = createAsyncThunk(
  'adsInsight/estimateMediaPlan',
  async (planData: { budget: number; audience?: any; duration: number; placement?: string[] }) => {
    const { data } = await adsInsightAPI.estimateMediaPlan(planData);
    return data.data;
  }
);

// Bulk
export const bulkUpdateStatus = createAsyncThunk(
  'adsInsight/bulkUpdateStatus',
  async (data: { campaignIds: string[]; status: string }) => {
    const res = await adsInsightAPI.bulkUpdateStatus(data);
    return res.data.data;
  }
);

// Ad Groups
export const fetchAdGroups = createAsyncThunk(
  'adsInsight/fetchAdGroups',
  async (campaignId: string) => {
    const { data } = await adsInsightAPI.getAdGroups(campaignId);
    return data.data;
  }
);

export const createAdGroup = createAsyncThunk(
  'adsInsight/createAdGroup',
  async (groupData: any) => {
    const { data } = await adsInsightAPI.createAdGroup(groupData);
    return data.data;
  }
);

// History
export const fetchActivityTimeline = createAsyncThunk(
  'adsInsight/fetchActivityTimeline',
  async (params?: { page?: number; limit?: number; actionType?: string }) => {
    const { data } = await adsInsightAPI.getActivityTimeline(params);
    return data;
  }
);

// Business
export const fetchBusinesses = createAsyncThunk(
  'adsInsight/fetchBusinesses',
  async () => {
    const { data } = await businessAPI.getMyBusinesses();
    return data.data;
  }
);

export const fetchBusiness = createAsyncThunk(
  'adsInsight/fetchBusiness',
  async (id: string) => {
    const { data } = await businessAPI.getBusiness(id);
    return data.data;
  }
);

export const createBusiness = createAsyncThunk(
  'adsInsight/createBusiness',
  async (bizData: any) => {
    const { data } = await businessAPI.createBusiness(bizData);
    return data.data;
  }
);

// Ad Accounts
export const fetchAdAccounts = createAsyncThunk(
  'adsInsight/fetchAdAccounts',
  async () => {
    const { data } = await businessAPI.getMyAdAccounts();
    return data.data;
  }
);

export const createAdAccount = createAsyncThunk(
  'adsInsight/createAdAccount',
  async (accountData: any) => {
    const { data } = await businessAPI.createAdAccount(accountData);
    return data.data;
  }
);

// Catalogs
export const fetchCatalogs = createAsyncThunk(
  'adsInsight/fetchCatalogs',
  async (params?: { businessId?: string }) => {
    const { data } = await businessAPI.getCatalogs(params);
    return data.data;
  }
);

export const fetchCatalog = createAsyncThunk(
  'adsInsight/fetchCatalog',
  async (id: string) => {
    const { data } = await businessAPI.getCatalog(id);
    return data.data;
  }
);

export const createCatalog = createAsyncThunk(
  'adsInsight/createCatalog',
  async (catalogData: any) => {
    const { data } = await businessAPI.createCatalog(catalogData);
    return data.data;
  }
);

export const addBusinessMember = createAsyncThunk(
  'adsInsight/addBusinessMember',
  async ({ businessId, userId, role }: { businessId: string; userId: string; role: string }) => {
    const { data } = await businessAPI.addMember(businessId, { userId, role });
    return data.data;
  }
);

export const removeBusinessMember = createAsyncThunk(
  'adsInsight/removeBusinessMember',
  async ({ businessId, userId }: { businessId: string; userId: string }) => {
    const { data } = await businessAPI.removeMember(businessId, userId);
    return data.data;
  }
);

export const addProductToCatalog = createAsyncThunk(
  'adsInsight/addProductToCatalog',
  async ({ catalogId, product }: { catalogId: string; product: any }) => {
    const { data } = await businessAPI.addProduct(catalogId, product);
    return data.data;
  }
);

export const addProductGroupToCatalog = createAsyncThunk(
  'adsInsight/addProductGroupToCatalog',
  async ({ catalogId, group }: { catalogId: string; group: any }) => {
    const { data } = await businessAPI.addProductGroup(catalogId, group);
    return data.data;
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const adsInsightSlice = createSlice({
  name: 'adsInsight',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearSelectedCampaign(state) {
      state.selectedCampaign = null;
      state.adGroups = [];
    },
    clearMediaPlanEstimate(state) {
      state.mediaPlanEstimate = null;
    },
    clearReport(state) {
      state.report = null;
    },
  },
  extraReducers: (builder) => {
    // Campaigns
    builder
      .addCase(fetchCampaigns.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.loading = false;
        state.campaigns = action.payload.data;
        state.campaignsPagination = action.payload.pagination;
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch campaigns';
      })
      .addCase(fetchCampaign.fulfilled, (state, action) => {
        state.selectedCampaign = action.payload;
      })
      .addCase(createCampaign.fulfilled, (state, action) => {
        state.campaigns.unshift(action.payload);
      })
      .addCase(updateCampaign.fulfilled, (state, action) => {
        const idx = state.campaigns.findIndex((c) => c._id === action.payload._id);
        if (idx >= 0) state.campaigns[idx] = action.payload;
        if (state.selectedCampaign?._id === action.payload._id) state.selectedCampaign = action.payload;
      })
      .addCase(togglePauseCampaign.fulfilled, (state, action) => {
        const idx = state.campaigns.findIndex((c) => c._id === action.payload._id);
        if (idx >= 0) state.campaigns[idx] = action.payload;
        if (state.selectedCampaign?._id === action.payload._id) state.selectedCampaign = action.payload;
      })
      .addCase(deleteCampaign.fulfilled, (state, action) => {
        state.campaigns = state.campaigns.filter((c) => c._id !== action.payload);
      });

    // Overview
    builder
      .addCase(fetchAccountOverview.pending, (state) => { state.loading = true; })
      .addCase(fetchAccountOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.overview = action.payload;
      })
      .addCase(fetchAccountOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch overview';
      });

    // Reports
    builder
      .addCase(fetchCampaignReport.fulfilled, (state, action) => { state.report = action.payload; })
      .addCase(fetchReportTemplates.fulfilled, (state, action) => { state.reportTemplates = action.payload; })
      .addCase(saveReportTemplate.fulfilled, (state, action) => { state.reportTemplates.unshift(action.payload); });

    // Recommendations
    builder.addCase(fetchRecommendations.fulfilled, (state, action) => { state.recommendations = action.payload; });

    // Media Planner
    builder.addCase(estimateMediaPlan.fulfilled, (state, action) => { state.mediaPlanEstimate = action.payload; });

    // Bulk
    builder.addCase(bulkUpdateStatus.fulfilled, (state) => {
      // Re-fetch is more reliable than patching local state for bulk
    });

    // Ad Groups
    builder
      .addCase(fetchAdGroups.fulfilled, (state, action) => { state.adGroups = action.payload; })
      .addCase(createAdGroup.fulfilled, (state, action) => { state.adGroups.unshift(action.payload); });

    // History
    builder.addCase(fetchActivityTimeline.fulfilled, (state, action) => {
      state.activityTimeline = action.payload.data;
      state.activityPagination = action.payload.pagination;
    });

    // Business
    builder
      .addCase(fetchBusinesses.fulfilled, (state, action) => { state.businesses = action.payload; })
      .addCase(fetchBusiness.fulfilled, (state, action) => { state.selectedBusiness = action.payload; })
      .addCase(createBusiness.fulfilled, (state, action) => { state.businesses.unshift(action.payload); });

    // Ad Accounts
    builder
      .addCase(fetchAdAccounts.fulfilled, (state, action) => { state.adAccounts = action.payload; })
      .addCase(createAdAccount.fulfilled, (state, action) => { state.adAccounts.unshift(action.payload); });

    // Catalogs
    builder
      .addCase(fetchCatalogs.fulfilled, (state, action) => { state.catalogs = action.payload; })
      .addCase(fetchCatalog.fulfilled, (state, action) => { state.selectedCatalog = action.payload; })
      .addCase(createCatalog.fulfilled, (state, action) => { state.catalogs.unshift(action.payload); });
  },
});

export const { clearError, clearSelectedCampaign, clearMediaPlanEstimate, clearReport } = adsInsightSlice.actions;
export default adsInsightSlice.reducer;
