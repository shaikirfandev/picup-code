/**
 * Parallel AI Platform — API Client
 * Mirrors the real Parallel.ai SDK with all 6 APIs.
 * All endpoints under /api/parallel
 */
import axios from 'axios';
import type {
  SearchParams, SearchResponse,
  ExtractParams, ExtractResponse,
  TaskRunCreateParams, TaskRun,
  FindAllRunCreateParams, FindAllRun,
  ChatCompletionParams, ChatCompletion, ChatSession,
  MonitorWatchCreateParams, MonitorWatch,
  ParallelStats,
} from '@/types/parallel';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

const api = axios.create({
  baseURL: `${API_URL}/parallel`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000,
});

// Auth interceptor
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ═══════════════════════════════════════════════════════
   SEARCH API — POST /search
   ═══════════════════════════════════════════════════════ */
export const searchAPI = {
  search: (params: SearchParams) =>
    api.post<{ success: boolean; data: SearchResponse }>('/search', params),
};

/* ═══════════════════════════════════════════════════════
   EXTRACT API — POST /extract
   ═══════════════════════════════════════════════════════ */
export const extractAPI = {
  extract: (params: ExtractParams) =>
    api.post<{ success: boolean; data: ExtractResponse }>('/extract', params),
};

/* ═══════════════════════════════════════════════════════
   TASK API — /tasks/runs
   ═══════════════════════════════════════════════════════ */
export const taskAPI = {
  create: (params: TaskRunCreateParams) =>
    api.post<{ success: boolean; data: { run_id: string; status: string; processor: string; created_at: string } }>(
      '/tasks/runs', params
    ),

  list: (params?: { page?: number; limit?: number; status?: string; processor?: string }) =>
    api.get<{ success: boolean; data: TaskRun[] }>('/tasks/runs', { params }),

  get: (runId: string) =>
    api.get<{ success: boolean; data: TaskRun }>(`/tasks/runs/${runId}`),

  getResult: (runId: string, timeout?: number) =>
    api.get<{ success: boolean; data: TaskRun }>(`/tasks/runs/${runId}/result`, { params: { timeout } }),

  getEvents: (runId: string) =>
    api.get<{ success: boolean; data: any[] }>(`/tasks/runs/${runId}/events`),
};

/* ═══════════════════════════════════════════════════════
   FINDALL API — /findall/runs
   ═══════════════════════════════════════════════════════ */
export const findAllAPI = {
  create: (params: FindAllRunCreateParams) =>
    api.post<{ success: boolean; data: { findall_id: string; generator: string; status: any; created_at: string } }>(
      '/findall/runs', params
    ),

  get: (findallId: string) =>
    api.get<{ success: boolean; data: FindAllRun }>(`/findall/runs/${findallId}`),

  getResult: (findallId: string) =>
    api.get<{ success: boolean; data: { run: any; candidates: any[] } }>(`/findall/runs/${findallId}/result`),

  cancel: (findallId: string) =>
    api.post(`/findall/runs/${findallId}/cancel`),

  ingest: (objective: string) =>
    api.post<{ success: boolean; data: any }>('/findall/ingest', { objective }),
};

/* ═══════════════════════════════════════════════════════
   CHAT API — /chat
   ═══════════════════════════════════════════════════════ */
export const chatAPI = {
  complete: (params: ChatCompletionParams) =>
    api.post<{ success: boolean; data: ChatCompletion }>('/chat/completions', params),

  createSession: (params?: { model?: string; web_search_enabled?: boolean }) =>
    api.post<{ success: boolean; data: ChatSession }>('/chat/sessions', params),

  getSession: (sessionId: string) =>
    api.get<{ success: boolean; data: ChatSession }>(`/chat/sessions/${sessionId}`),

  listSessions: (params?: { limit?: number; offset?: number }) =>
    api.get<{ success: boolean; data: ChatSession[] }>('/chat/sessions', { params }),
};

/* ═══════════════════════════════════════════════════════
   MONITOR API — /monitor/watches
   ═══════════════════════════════════════════════════════ */
export const monitorAPI = {
  create: (params: MonitorWatchCreateParams) =>
    api.post<{ success: boolean; data: MonitorWatch }>('/monitor/watches', params),

  list: (params?: { limit?: number; offset?: number; active_only?: boolean }) =>
    api.get<{ success: boolean; data: { watches: MonitorWatch[]; total: number } }>('/monitor/watches', { params }),

  get: (watchId: string) =>
    api.get<{ success: boolean; data: MonitorWatch }>(`/monitor/watches/${watchId}`),

  delete: (watchId: string) =>
    api.delete(`/monitor/watches/${watchId}`),

  triggerCheck: (watchId: string) =>
    api.post<{ success: boolean; data: any }>(`/monitor/watches/${watchId}/check`),

  toggle: (watchId: string, active: boolean) =>
    api.post(`/monitor/watches/${watchId}/toggle`, { active }),

  getChanges: (watchId: string, params?: { limit?: number; offset?: number }) =>
    api.get<{ success: boolean; data: any }>(`/monitor/watches/${watchId}/changes`, { params }),
};

/* ═══════════════════════════════════════════════════════
   ADMIN — Sources, Chunks, Stats
   ═══════════════════════════════════════════════════════ */
export const sourcesAPI = {
  list: (params?: { page?: number; limit?: number; status?: string; type?: string; search?: string }) =>
    api.get('/sources', { params }),

  add: (data: { url: string; name?: string; type?: string; crawlDepth?: number; tags?: string[] }) =>
    api.post('/sources', data),

  get: (id: string) => api.get(`/sources/${id}`),

  delete: (id: string) => api.delete(`/sources/${id}`),

  recrawl: (id: string) => api.post(`/sources/${id}/recrawl`),
};

export const chunksAPI = {
  list: (params?: { page?: number; limit?: number; source?: string; status?: string; search?: string }) =>
    api.get('/chunks', { params }),
};

export const statsAPI = {
  get: () => api.get<{ success: boolean; data: ParallelStats }>('/stats'),
};

/* ── Legacy compat aliases ──────────────────────────── */
export const parallelSearchAPI = {
  search: (data: any) => api.post('/search', {
    objective: data.query,
    search_queries: [data.query],
    max_results: data.limit || 20,
    processor: data.searchType === 'semantic' ? 'pro' : 'base',
    source_policy: data.filters?.domain ? { include_domains: [data.filters.domain] } : {},
  }),
  extract: (data: any) => api.post('/extract', { urls: [data.url] }),
  createTask: (data: any) => api.post('/tasks/runs', { input: data.goal }),
  findAll: (data: any) => api.post('/findall/runs', { entity_type: 'entity', objective: data.criteria }),
};

export const parallelTasksAPI = {
  list: (params?: any) => api.get('/tasks/runs', { params }),
  get: (id: string) => api.get(`/tasks/runs/${id}`),
};

export const parallelSourcesAPI = sourcesAPI;
export const parallelChunksAPI = chunksAPI;
export const parallelStatsAPI = statsAPI;
