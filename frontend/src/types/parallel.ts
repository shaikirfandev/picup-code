/* ═══════════════════════════════════════════════════════
   Parallel AI Platform — TypeScript Types
   Mirrors the real Parallel.ai SDK type surface.
   ═══════════════════════════════════════════════════════ */

/* ── Common ─────────────────────────────────────────── */
export interface SourcePolicy {
  after_date?:       string;
  include_domains?:  string[];
  exclude_domains?:  string[];
}

export interface ExcerptSettings {
  max_chars_per_result?: number;
  max_chars_total?:      number;
}

export interface UsageEntry {
  type:       string;
  tokens?:    number;
  timestamp?: string;
}

export interface Citation {
  url:       string;
  title:     string;
  excerpts:  string[];
  domain?:   string;
}

export interface FieldBasis {
  field:       string;
  reasoning:   string;
  citations:   Citation[];
  confidence:  number;
}

/* ═══════════════════════════════════════════════════════
   SEARCH API
   ═══════════════════════════════════════════════════════ */
export interface WebSearchResult {
  url:           string;
  title:         string;
  excerpts:      string[];
  publish_date?: string;
  domain?:       string;
  score?:        number;
}

export interface SearchParams {
  objective?:      string;
  search_queries?: string[];
  query?:          string; // legacy compat
  max_results?:    number;
  excerpts?:       ExcerptSettings;
  processor?:      'base' | 'pro';
  mode?:           'one-shot' | 'agentic';
  source_policy?:  SourcePolicy;
}

export interface SearchResponse {
  results:   WebSearchResult[];
  search_id: string;
  usage:     Record<string, any>;
  warnings:  string[];
  _meta?:    {
    objective:    string;
    processor:    string;
    mode:         string;
    responseTime: number;
  };
}

/* ═══════════════════════════════════════════════════════
   EXTRACT API
   ═══════════════════════════════════════════════════════ */
export interface ExtractResult {
  url:           string;
  title:         string;
  publish_date?: string;
  excerpts?:     string[];
  full_content?: string;
}

export interface ExtractError {
  url:     string;
  error:   string;
  status?: number;
}

export interface ExtractParams {
  urls:            string[];
  url?:            string; // legacy: single URL
  excerpts?:       ExcerptSettings;
  full_content?:   boolean;
  objective?:      string;
  search_queries?: string[];
}

export interface ExtractResponse {
  results:    ExtractResult[];
  errors:     ExtractError[];
  extract_id: string;
  usage:      Record<string, any>;
  warnings:   string[];
}

/* ═══════════════════════════════════════════════════════
   TASK API
   ═══════════════════════════════════════════════════════ */
export interface TaskRunCreateParams {
  input:           string;
  processor?:      'base' | 'pro' | 'ultra';
  output_schema?:  Record<string, any>;
  task_spec?:      {
    input_schema?:  Record<string, any>;
    output_schema?: Record<string, any>;
    instructions?:  string;
  };
  source_policy?:  SourcePolicy;
  metadata?:       Record<string, any>;
  enable_events?:  boolean;
}

export interface TaskRunEvent {
  type:       string;
  message:    string;
  timestamp:  string;
  data?:      Record<string, any>;
}

export interface TaskRun {
  run_id:          string;
  input:           string;
  processor:       'base' | 'pro' | 'ultra';
  status:          'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  output?: {
    type:             'text' | 'json';
    content:          string;
    structured_data?: Record<string, any>;
  };
  citations:       Citation[];
  basis:           FieldBasis[];
  confidence?:     number;
  reasoning?:      string;
  warnings?:       string[];
  sources_considered: number;
  sources_read:       number;
  events:          TaskRunEvent[];
  usage:           UsageEntry[];
  started_at?:     string;
  completed_at?:   string;
  duration_ms?:    number;
  createdAt:       string;
}

/* ═══════════════════════════════════════════════════════
   FINDALL API
   ═══════════════════════════════════════════════════════ */
export interface MatchCondition {
  name:        string;
  description: string;
}

export interface FindAllCandidate {
  candidate_id:  string;
  name:          string;
  url:           string;
  description?:  string;
  match_status:  'generated' | 'matched' | 'unmatched' | 'discarded';
  output?:       Record<string, any>;
  basis?:        FieldBasis[];
}

export interface FindAllRunCreateParams {
  entity_type:      string;
  objective:        string;
  generator?:       'base' | 'core' | 'pro' | 'preview';
  match_conditions?: MatchCondition[];
  match_limit?:     number;
  exclude_list?:    { url: string }[];
}

export interface FindAllRun {
  findall_id:  string;
  entity_type: string;
  objective:   string;
  generator:   string;
  status: {
    is_active:  boolean;
    status:     'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
    metrics: {
      candidates_generated: number;
      candidates_matched:   number;
      candidates_unmatched: number;
      candidates_discarded: number;
    };
    termination_reason?: string;
  };
  candidates:  FindAllCandidate[];
  createdAt:   string;
  updatedAt:   string;
}

/* ═══════════════════════════════════════════════════════
   CHAT API
   ═══════════════════════════════════════════════════════ */
export interface ChatMessage {
  role:            'system' | 'user' | 'assistant';
  content:         string;
  citations?:      Citation[];
  search_queries?: string[];
}

export interface ChatCompletionParams {
  messages:            ChatMessage[];
  model?:              string;
  web_search_enabled?: boolean;
  source_policy?:      SourcePolicy;
  session_id?:         string;
}

export interface ChatCompletion {
  id:      string;
  object:  string;
  model:   string;
  created: number;
  choices: {
    index:         number;
    message:       ChatMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens:     number;
    completion_tokens: number;
    total_tokens:      number;
    search_queries:    number;
    sources_consulted: number;
  };
  web_search_enabled: boolean;
  session_id?:        string;
}

export interface ChatSession {
  session_id:         string;
  model:              string;
  web_search_enabled: boolean;
  messages:           ChatMessage[];
  source_policy?:     SourcePolicy;
  usage:              UsageEntry[];
  createdAt:          string;
}

/* ═══════════════════════════════════════════════════════
   MONITOR API
   ═══════════════════════════════════════════════════════ */
export interface MonitorWatchCreateParams {
  url:        string;
  name?:      string;
  objective?: string;
  frequency?: '5min' | '15min' | '30min' | 'hourly' | '6hour' | '12hour' | 'daily' | 'weekly';
  notify_on?: string[];
}

export interface MonitorChangeEvent {
  detected_at: string;
  change_type: 'content_change' | 'initial_capture' | 'error';
  summary:     string;
  old_hash?:   string;
  new_hash?:   string;
  diff_stats?: {
    chars_added:   number;
    chars_removed: number;
  };
}

export interface MonitorWatch {
  watch_id:      string;
  url:           string;
  name:          string;
  objective:     string;
  frequency:     string;
  is_active:     boolean;
  last_checked?: string;
  next_check?:   string;
  total_checks:  number;
  total_changes: number;
  changes:       MonitorChangeEvent[];
  createdAt:     string;
}

/* ═══════════════════════════════════════════════════════
   ADMIN: Sources, Chunks, Stats
   ═══════════════════════════════════════════════════════ */
export interface ParallelSource {
  _id:            string;
  name:           string;
  url:            string;
  domain:         string;
  type:           string;
  trustScore:     number;
  qualityScore:   number;
  isVerified:     boolean;
  crawlFrequency: string;
  crawlDepth:     number;
  lastCrawledAt?: string;
  crawlStatus:    string;
  crawlError?:    string;
  chunksCount:    number;
  pagesCount:     number;
  totalBytes:     number;
  tags:           string[];
  description?:   string;
  favicon?:       string;
  language:       string;
  createdAt:      string;
  updatedAt:      string;
}

export interface ParallelStats {
  overview: {
    totalSources:       number;
    totalChunks:        number;
    totalCrawlJobs:     number;
    totalTaskRuns:      number;
    totalFindAllRuns:   number;
    totalChatSessions:  number;
    totalMonitorWatches: number;
    totalSearches:      number;
    avgSearchResponseMs: number;
  };
  chunkStatusBreakdown: { _id: string; count: number }[];
  crawlJobStages:       { _id: string; count: number }[];
  recentSearches: {
    query:        string;
    resultCount:  number;
    responseTime: number;
    searchType:   string;
    createdAt:    string;
  }[];
  topSources: ParallelSource[];
}

/* ── Active mode type ───────────────────────────────── */
export type ParallelMode = 'search' | 'extract' | 'research' | 'findall' | 'chat' | 'monitor';
