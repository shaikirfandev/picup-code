/**
 * Parallel AI Search Platform — API client
 * All endpoints under /api/parallel
 */
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

const parallelApi = axios.create({
  baseURL: `${API_URL}/parallel`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

// Auth interceptor — reuse token from main app
parallelApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ── Search ─────────────────────────────────────────── */
export const parallelSearchAPI = {
  search: (data: {
    query: string;
    filters?: Record<string, any>;
    limit?: number;
    page?: number;
    searchType?: 'keyword' | 'semantic' | 'hybrid';
  }) => parallelApi.post('/search', data),

  extract: (data: { url: string; schema?: Record<string, any> }) =>
    parallelApi.post('/extract', data),

  createTask: (data: {
    goal: string;
    output_schema?: Record<string, any>;
    filters?: Record<string, any>;
    maxResults?: number;
  }) => parallelApi.post('/task', data),

  findAll: (data: {
    criteria: string;
    schema?: Record<string, any>;
    maxResults?: number;
    filters?: Record<string, any>;
  }) => parallelApi.post('/findall', data),
};

/* ── Tasks ──────────────────────────────────────────── */
export const parallelTasksAPI = {
  list: (params?: { page?: number; limit?: number; status?: string; taskType?: string }) =>
    parallelApi.get('/tasks', { params }),

  get: (id: string) => parallelApi.get(`/tasks/${id}`),
};

/* ── Sources ────────────────────────────────────────── */
export const parallelSourcesAPI = {
  list: (params?: { page?: number; limit?: number; status?: string; type?: string; search?: string }) =>
    parallelApi.get('/sources', { params }),

  add: (data: { url: string; name?: string; type?: string; crawlDepth?: number; tags?: string[] }) =>
    parallelApi.post('/sources', data),

  get: (id: string) => parallelApi.get(`/sources/${id}`),

  delete: (id: string) => parallelApi.delete(`/sources/${id}`),

  recrawl: (id: string) => parallelApi.post(`/sources/${id}/recrawl`),
};

/* ── Chunks ─────────────────────────────────────────── */
export const parallelChunksAPI = {
  list: (params?: { page?: number; limit?: number; source?: string; status?: string; search?: string }) =>
    parallelApi.get('/chunks', { params }),
};

/* ── Stats ──────────────────────────────────────────── */
export const parallelStatsAPI = {
  get: () => parallelApi.get('/stats'),
};
