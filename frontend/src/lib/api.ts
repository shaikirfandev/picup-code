import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4500/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
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

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
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
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/change-password', data),
};

// Boards API
export const boardsAPI = {
  getMyBoards: () => api.get('/boards/my'),
  getBoards: () => api.get('/boards/my'),  // alias for getMyBoards
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
  searchPosts: (params: { q?: string; category?: string; tag?: string; sort?: string; page?: number; limit?: number; priceMin?: number; priceMax?: number }) =>
    api.get('/search/posts', { params }),
  search: (params: { q?: string; category?: string; tag?: string; sort?: string; page?: number; limit?: number; priceMin?: number; priceMax?: number }) =>
    api.get('/search/posts', { params }),  // alias for searchPosts
  searchUsers: (params: { q?: string; page?: number }) =>
    api.get('/search/users', { params }),
  getTrendingTags: () => api.get('/search/trending/tags'),
  getTrendingPosts: () => api.get('/search/trending/posts'),
  getTrending: () => api.get('/search/trending/tags'),  // alias for getTrendingTags
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getCategories: () => api.get('/categories'),  // alias for getAll
  getBySlug: (slug: string) => api.get(`/categories/${slug}`),
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
  uploadVideo: (formData: FormData) =>
    api.post('/upload/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // 2 min timeout for video uploads
    }),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params?: { page?: number; limit?: number; role?: string; status?: string; search?: string }) =>
    api.get('/admin/users', { params }),
  updateUser: (id: string, data: { role?: string; status?: string; isActive?: boolean }) => 
    api.put(`/admin/users/${id}`, data),
  updateUserRole: (id: string, role: string) => api.put(`/admin/users/${id}/role`, { role }),
  updateUserStatus: (id: string, status: string) => api.put(`/admin/users/${id}/status`, { status }),
  verifyUser: (id: string) => api.put(`/admin/users/${id}/verify`),
  getPosts: (params?: { page?: number; limit?: number; status?: string; reported?: string; search?: string }) =>
    api.get('/admin/posts', { params }),
  updatePost: (id: string, data: { status?: string; isFeatured?: boolean }) =>
    api.put(`/admin/posts/${id}`, data),
  deletePost: (id: string) => api.delete(`/admin/posts/${id}`),
  moderatePost: (id: string, action: string) => api.put(`/admin/posts/${id}/moderate`, { action }),
  getReports: (params?: { page?: number; limit?: number; status?: string }) => api.get('/admin/reports', { params }),
  updateReport: (id: string, data: { status: string; actionTaken?: string; reviewNotes?: string }) =>
    api.put(`/admin/reports/${id}`, data),
  resolveReport: (id: string, data: { status: string; actionTaken?: string; reviewNotes?: string }) =>
    api.put(`/admin/reports/${id}`, data),
  getCategories: () => api.get('/categories'),
  createCategory: (data: any) => api.post('/admin/categories', data),
  updateCategory: (id: string, data: any) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/admin/categories/${id}`),
  getAiLogs: (params?: { page?: number; limit?: number; status?: string; userId?: string }) =>
    api.get('/admin/ai/logs', { params }),
  setUserAiLimit: (id: string, limit: number) => api.put(`/admin/ai/users/${id}/limit`, { limit }),
};

export default api;
