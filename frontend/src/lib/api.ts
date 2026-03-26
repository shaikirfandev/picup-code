import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4500/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
  withCredentials: true, // 🔥 REQUIRED
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Token refresh queue ─────────────────────────────────────────────────────
// Prevents multiple concurrent 401s from racing to refresh the token.
// Only the first 401 refreshes; others wait for the same promise.
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function onRefreshFailed() {
  refreshSubscribers.forEach(() => {}); // let queued requests reject naturally
  refreshSubscribers = [];
}

// Response interceptor for token refresh (with queue)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 that hasn't already been retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If a refresh is already in-flight, queue this request
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
        const newAccessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;

        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Unblock all queued requests
        onTokenRefreshed(newAccessToken);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        onRefreshFailed();
        isRefreshing = false;

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { username: string; email: string; password: string; displayName?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/change-password', data),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; password: string }) =>
    api.post('/auth/reset-password', data),
};

// Posts API
export const postsAPI = {
  getFeed: (params: { page?: number; limit?: number; category?: string; tag?: string; sort?: string }) =>
    api.get('/posts/feed', { params }),
  getPost: (id: string) => api.get(`/posts/${id}`),
  createPost: (formData: FormData) =>
    api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updatePost: (id: string, data: any) => api.put(`/posts/${id}`, data),
  deletePost: (id: string) => api.delete(`/posts/${id}`),
  toggleLike: (id: string) => api.post(`/posts/${id}/like`),
  toggleSave: (id: string, boardId?: string) => api.post(`/posts/${id}/save`, { boardId }),
  trackClick: (id: string) => api.post(`/posts/${id}/click`),
  sharePost: (id: string) => api.post(`/posts/${id}/share`),
  reportPost: (id: string, data: { reason: string; description?: string }) =>
    api.post(`/posts/${id}/report`, data),
  getSavedPosts: (params?: { page?: number; limit?: number }) =>
    api.get('/posts/saved', { params }),
};

// Users API
export const usersAPI = {
  getProfile: (username: string) => api.get(`/users/profile/${username}`),
  getUserPosts: (username: string, params?: { page?: number; limit?: number }) =>
    api.get(`/users/profile/${username}/posts`, { params }),
  updateProfile: (data: any) => api.put('/users/profile', data),
  uploadAvatar: (formData: FormData) =>
    api.put('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  followUser: (id: string) => api.post(`/users/${id}/follow`),
  unfollowUser: (id: string) => api.delete(`/users/${id}/follow`),
  getFollowers: (username: string, params?: { page?: number }) =>
    api.get(`/users/profile/${username}/followers`, { params }),
  getFollowing: (username: string, params?: { page?: number }) =>
    api.get(`/users/profile/${username}/following`, { params }),
  getSuggested: () => api.get('/users/suggested'),
};

// Boards API
export const boardsAPI = {
  getMyBoards: () => api.get('/boards/my'),
  getUserBoards: (userId: string) => api.get(`/boards/user/${userId}`),
  getBoard: (id: string, params?: { page?: number }) => api.get(`/boards/${id}`, { params }),
  createBoard: (data: { name: string; description?: string; isPrivate?: boolean }) =>
    api.post('/boards', data),
  updateBoard: (id: string, data: any) => api.put(`/boards/${id}`, data),
  deleteBoard: (id: string) => api.delete(`/boards/${id}`),
  addToBoard: (id: string, postId: string) => api.post(`/boards/${id}/posts`, { postId }),
  removeFromBoard: (id: string, postId: string) => api.delete(`/boards/${id}/posts/${postId}`),
};

// Search API
export const searchAPI = {
  searchPosts: (params: { q?: string; category?: string; tag?: string; sort?: string; page?: number }) =>
    api.get('/search/posts', { params }),
  searchUsers: (params: { q?: string; page?: number }) =>
    api.get('/search/users', { params }),
  getTrendingTags: () => api.get('/search/trending/tags'),
  getTrendingPosts: () => api.get('/search/trending/posts'),
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getBySlug: (slug: string) => api.get(`/categories/${slug}`),
};

// Blog API
export const blogAPI = {
  getPosts: (params?: { page?: number; limit?: number; category?: string; tag?: string; sort?: string; search?: string }) =>
    api.get('/blog', { params }),
  getPost: (slug: string) => api.get(`/blog/${slug}`),
  createPost: (formData: FormData) =>
    api.post('/blog', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updatePost: (id: string, formData: FormData) =>
    api.put(`/blog/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deletePost: (id: string) => api.delete(`/blog/${id}`),
  getMyPosts: (params?: { page?: number; limit?: number }) =>
    api.get('/blog/user/my-posts', { params }),
  getCategories: () => api.get('/blog/categories'),
  reportPost: (id: string, data: { reason: string; description?: string }) =>
    api.post(`/blog/${id}/report`, data),
};

// Comments API
export const commentsAPI = {
  getComments: (postId: string, params?: { page?: number }) =>
    api.get(`/comments/post/${postId}`, { params }),
  getReplies: (commentId: string) => api.get(`/comments/${commentId}/replies`),
  createComment: (postId: string, data: { text: string; parentComment?: string }) =>
    api.post(`/comments/post/${postId}`, data),
  updateComment: (id: string, data: { text: string }) => api.put(`/comments/${id}`, data),
  deleteComment: (id: string) => api.delete(`/comments/${id}`),
};

// AI API
export const aiAPI = {
  generateImage: (data: { prompt: string; negativePrompt?: string; style?: string; width?: number; height?: number; seed?: number }) =>
    api.post('/ai/generate', data),
  getMyGenerations: (params?: { page?: number }) => api.get('/ai/generations', { params }),
  getGenerationStatus: (id: string) => api.get(`/ai/generations/${id}`),
  getStyles: () => api.get('/ai/styles'),
};

// Upload API
export const uploadAPI = {
  uploadImage: (formData: FormData) =>
    api.post('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadImages: (formData: FormData) =>
    api.post('/upload/images', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadVideo: (formData: FormData) =>
    api.post('/upload/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // 2 min timeout for video uploads
    }),
};

// Payment API
export const paymentAPI = {
  createPayment: (data: { amount: number; currency: string; type: string; description?: string }) =>
    api.post('/payments/create', data),
  confirmPayment: (data: { paymentId: string; gatewayPaymentId?: string; gatewaySignature?: string }) =>
    api.post('/payments/confirm', data),
  getMyPayments: (params?: { page?: number; limit?: number; type?: string; status?: string }) =>
    api.get('/payments/my', { params }),
  getWallet: () => api.get('/payments/wallet'),
  topUpWallet: (data: { amount: number; currency: string }) =>
    api.post('/payments/wallet/topup', data),
  subscribe: (data: { plan: string; currency?: string }) =>
    api.post('/payments/subscribe', data),
  getSubscription: () => api.get('/payments/subscription'),
  cancelSubscription: () => api.post('/payments/subscription/cancel'),
};

// Creator Analytics API
export const creatorAnalyticsAPI = {
  checkAccess: () => api.get('/creator-analytics/access'),
  getOverview: (params?: { period?: string; startDate?: string; endDate?: string }) =>
    api.get('/creator-analytics/overview', { params }),
  getTimeline: (params?: { period?: string; startDate?: string; endDate?: string }) =>
    api.get('/creator-analytics/timeline', { params }),
  getFollowerGrowth: (params?: { period?: string; startDate?: string; endDate?: string }) =>
    api.get('/creator-analytics/followers', { params }),
  getPostsPerformance: (params?: {
    period?: string; startDate?: string; endDate?: string;
    sort?: string; order?: string; page?: number; limit?: number;
    mediaType?: string; tag?: string; minImpressions?: number;
  }) => api.get('/creator-analytics/posts', { params }),
  getPostAnalytics: (postId: string, params?: { period?: string; startDate?: string; endDate?: string }) =>
    api.get(`/creator-analytics/posts/${postId}`, { params }),
  getAffiliateAnalytics: (params?: { period?: string; startDate?: string; endDate?: string }) =>
    api.get('/creator-analytics/affiliate', { params }),
  getAudienceInsights: (params?: { period?: string; startDate?: string; endDate?: string }) =>
    api.get('/creator-analytics/audience', { params }),
  getAIInsights: () => api.get('/creator-analytics/ai-insights'),
  getRealtimeStats: () => api.get('/creator-analytics/realtime'),
  getRealtimePostStats: (postId: string) => api.get(`/creator-analytics/realtime/${postId}`),
  trackEvent: (data: { postId: string; eventType: string; referrer?: string; watchDuration?: number; completionRate?: number; sessionId?: string }) =>
    api.post('/creator-analytics/track', data),
  exportCSV: (params?: { period?: string; startDate?: string; endDate?: string }) =>
    api.get('/creator-analytics/export/csv', { params, responseType: 'blob' }),
};

// Download API (for authenticated image downloads)
export const downloadAPI = {
  downloadImage: (fileId: string) =>
    api.get(`/files/download/image/${fileId}`, { responseType: 'blob' }),
};

export const notificationsAPI = {
  getNotifications: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/mark-all-read'),
  deleteNotification: (id: string) => api.delete(`/notifications/${id}`),
  clearAll: () => api.delete('/notifications/clear-all'),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params?: { page?: number; role?: string; status?: string; search?: string }) =>
    api.get('/admin/users', { params }),
  updateUserRole: (id: string, role: string) => api.put(`/admin/users/${id}/role`, { role }),
  updateUserStatus: (id: string, status: string) => api.put(`/admin/users/${id}/status`, { status }),
  verifyUser: (id: string) => api.put(`/admin/users/${id}/verify`),
  getPosts: (params?: { page?: number; status?: string; reported?: string }) =>
    api.get('/admin/posts', { params }),
  moderatePost: (id: string, action: string) => api.put(`/admin/posts/${id}/moderate`, { action }),
  // Enhanced post management
  getAdminPosts: (params?: { page?: number; limit?: number; status?: string; reported?: string; includeDeleted?: string; search?: string; sort?: string }) =>
    api.get('/admin/posts-manage', { params }),
  deleteAdminPost: (id: string, data: { reason?: string; hardDelete?: boolean }) =>
    api.delete(`/admin/posts-manage/${id}`, { data }),
  bulkDeletePosts: (data: { postIds: string[]; reason?: string; hardDelete?: boolean }) =>
    api.post('/admin/posts-manage/bulk-delete', data),
  restorePost: (id: string) =>
    api.patch(`/admin/posts-manage/${id}/restore`),
  getAuditLogs: (params?: { page?: number; limit?: number; actionType?: string }) =>
    api.get('/admin/posts-manage/audit-logs', { params }),
  getReports: (params?: { page?: number; status?: string; priority?: string; reason?: string; search?: string }) => api.get('/admin/reports', { params }),
  getReportDetail: (id: string) => api.get(`/admin/reports/${id}`),
  getReportsByPost: (postId: string) => api.get(`/admin/reports/post/${postId}`),
  getReportsByBlogPost: (blogPostId: string) => api.get(`/admin/reports/blog/${blogPostId}`),
  resolveReport: (id: string, data: { status: string; actionTaken?: string; reviewNotes?: string }) =>
    api.put(`/admin/reports/${id}`, data),
  createCategory: (formData: FormData) =>
    api.post('/admin/categories', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateCategory: (id: string, formData: FormData) =>
    api.put(`/admin/categories/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteCategory: (id: string) => api.delete(`/admin/categories/${id}`),
  getAiLogs: (params?: { page?: number; status?: string; userId?: string }) =>
    api.get('/admin/ai/logs', { params }),
  setUserAiLimit: (id: string, limit: number) => api.put(`/admin/ai/users/${id}/limit`, { limit }),
  // Login analytics (legacy)
  getLoginAnalytics: (params?: { days?: number }) =>
    api.get('/admin/analytics/logins', { params }),
  getUserEmails: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/admin/analytics/emails', { params }),
  // Analytics — new production-grade endpoints
  getAnalyticsOverview: () => api.get('/admin/analytics/stats/overview'),
  getAnalyticsLogins: (params?: { days?: number }) =>
    api.get('/admin/analytics/stats/logins', { params }),
  getAnalyticsUsers: (params?: { page?: number; limit?: number; search?: string; sort?: string; role?: string; status?: string }) =>
    api.get('/admin/analytics/users', { params }),
  exportUsersCSV: () =>
    api.get('/admin/analytics/users/export', { responseType: 'blob' }),
  getTopUsers: (params?: { metric?: string; limit?: number }) =>
    api.get('/admin/analytics/users/top', { params }),
  getRecentActivity: (params?: { limit?: number }) =>
    api.get('/admin/analytics/activity/recent', { params }),
  triggerStatsCompute: (data?: { date?: string; backfill?: number }) =>
    api.post('/admin/analytics/stats/compute', data),
  // Payments
  getAllPayments: (params?: { page?: number; status?: string; type?: string }) =>
    api.get('/payments/admin/all', { params }),
  // Paid users
  getPaidUsers: (params?: { page?: number; limit?: number; search?: string; sort?: string; order?: string; type?: string; minSpent?: number }) =>
    api.get('/admin/paid-users', { params }),
  // Enhanced blog post management
  getAdminBlogPosts: (params?: { page?: number; limit?: number; status?: string; category?: string; includeDeleted?: string; search?: string; sort?: string }) =>
    api.get('/admin/blogs-manage', { params }),
  deleteAdminBlogPost: (id: string, data: { reason?: string; hardDelete?: boolean }) =>
    api.delete(`/admin/blogs-manage/${id}`, { data }),
  bulkDeleteBlogPosts: (data: { postIds: string[]; reason?: string; hardDelete?: boolean }) =>
    api.post('/admin/blogs-manage/bulk-delete', data),
  restoreBlogPost: (id: string) =>
    api.patch(`/admin/blogs-manage/${id}/restore`),
  getBlogAuditLogs: (params?: { page?: number; limit?: number; actionType?: string }) =>
    api.get('/admin/blogs-manage/audit-logs', { params }),
};

// ─── Admin Wallet / Recharge API ─────────────────────────────────────────────

export const adminWalletAPI = {
  // Recharges
  getAllRecharges: (params?: { page?: number; limit?: number; source?: string; search?: string; startDate?: string; endDate?: string; sort?: string; order?: string; minAmount?: number; maxAmount?: number }) =>
    api.get('/admin/wallet/recharges', { params }),
  getRechargeStats: (params?: { days?: number }) =>
    api.get('/admin/wallet/recharges/stats', { params }),

  // All Transactions
  getAllTransactions: (params?: { page?: number; limit?: number; type?: string; source?: string; status?: string; search?: string; startDate?: string; endDate?: string }) =>
    api.get('/admin/wallet/transactions', { params }),

  // All Wallets
  getAllWallets: (params?: { page?: number; limit?: number; search?: string; sort?: string; order?: string; frozen?: string }) =>
    api.get('/admin/wallet/wallets', { params }),

  // Credit Rules
  getAllCreditRules: () => api.get('/admin/wallet/credit-rules'),
  updateCreditRule: (id: string, data: { baseCost?: number; description?: string; isDynamic?: boolean; isActive?: boolean; minCredits?: number; maxCredits?: number }) =>
    api.put(`/admin/wallet/credit-rules/${id}`, data),
};

// ─── Affiliate Marketing API ─────────────────────────────────────────────────

export const affiliateAPI = {
  getMyAffiliatePosts: (params?: { page?: number; limit?: number; sort?: string }) =>
    api.get('/affiliate/posts', { params }),
  getSummary: () => api.get('/affiliate/summary'),
  getPostStats: (postId: string, params?: { period?: string }) =>
    api.get(`/affiliate/posts/${postId}/stats`, { params }),
  trackClick: (postId: string, data?: { linkIndex?: number; referrer?: string }) =>
    api.post(`/posts/${postId}/click`, data),
};

// ─── Creator Dashboard API ────────────────────────────────────────────────────

export const creatorDashboardAPI = {
  getOverview: (params?: { period?: string }) => api.get('/dashboard/overview', { params }),
  getContentPerformance: (params?: any) => api.get('/dashboard/content-performance', { params }),
  getEngagementTrends: (params?: { period?: string }) => api.get('/dashboard/engagement-trends', { params }),
  getPerformanceHeatmap: (params?: { period?: string }) => api.get('/dashboard/performance-heatmap', { params }),
  getAudienceInsights: (params?: { period?: string }) => api.get('/dashboard/audience-insights', { params }),
  getMonetization: (params?: { period?: string }) => api.get('/dashboard/monetization', { params }),
  enableMonetization: () => api.post('/dashboard/monetization/enable', {}),
  getContentManagement: (params?: any) => api.get('/dashboard/content-management', { params }),
  schedulePost: (data: any) => api.post('/dashboard/schedule-post', data),
  cancelScheduledPost: (id: string) => api.delete(`/dashboard/schedule-post/${id}`),
  togglePinPost: (postId: string) => api.put(`/dashboard/posts/${postId}/pin`, {}),
  bulkUpdatePosts: (data: any) => api.put('/dashboard/posts/bulk', data),
  getGrowthInsights: () => api.get('/dashboard/growth-insights'),
  getActivityFeed: (params?: any) => api.get('/dashboard/activity-feed', { params }),
  markActivityRead: (eventIds: string[]) => api.put('/dashboard/activity-feed/read', { eventIds }),
  getCreatorProfile: () => api.get('/dashboard/profile'),
  updateCreatorProfile: (data: any) => api.put('/dashboard/profile', data),
  getCommentsForModeration: (params?: any) => api.get('/dashboard/moderation/comments', { params }),
  moderateComment: (commentId: string, action: string) => api.put(`/dashboard/moderation/comments/${commentId}`, { action }),
};

export default api;
