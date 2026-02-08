/* ── Parallel AI Search Platform Types ──────────────── */

export interface SearchChunk {
  id: string;
  content: string;
  title: string;
  snippet: string;
  relevanceScore: number;
  confidenceScore: number;
  trustScore: number;
  source: {
    id: string;
    name: string;
    url: string;
    domain: string;
    favicon: string;
  };
  citation: {
    title: string;
    url: string;
    domain: string;
    publishedAt?: string;
    author?: string;
    snippet: string;
  };
  tags: string[];
  category: string;
  contentType: string;
  language: string;
  wordCount: number;
  createdAt: string;
}

export interface SearchResponse {
  results: SearchChunk[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
  meta: {
    query: string;
    searchType: string;
    responseTime: number;
    filters: Record<string, any>;
  };
}

export interface ParallelSource {
  _id: string;
  name: string;
  url: string;
  domain: string;
  type: string;
  trustScore: number;
  qualityScore: number;
  isVerified: boolean;
  isBanned: boolean;
  crawlFrequency: string;
  crawlDepth: number;
  lastCrawledAt?: string;
  crawlStatus: string;
  crawlError?: string;
  chunksCount: number;
  pagesCount: number;
  totalBytes: number;
  tags: string[];
  description?: string;
  favicon?: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchTaskStep {
  _id: string;
  stepNumber: number;
  action: string;
  input: any;
  output: any;
  sourcesUsed: { url: string; title: string; trustScore: number }[];
  status: string;
  error?: string;
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  tokensUsed: number;
}

export interface ResearchTask {
  _id: string;
  taskType: 'search' | 'extract' | 'task' | 'findall';
  goal: string;
  query?: string;
  url?: string;
  outputSchema?: any;
  filters?: any;
  criteria?: any;
  maxResults: number;
  status: string;
  plan: string[];
  steps: ResearchTaskStep[];
  result?: {
    data: any;
    summary: string;
    confidence: number;
    citations: {
      title: string;
      url: string;
      domain: string;
      trustScore: number;
      snippet: string;
      accessedAt: string;
    }[];
  };
  totalTokensUsed: number;
  totalCost: number;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  error?: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParallelStats {
  overview: {
    totalSources: number;
    totalChunks: number;
    totalCrawlJobs: number;
    totalResearchTasks: number;
    totalSearches: number;
    avgSearchResponseMs: number;
  };
  chunkStatusBreakdown: { _id: string; count: number }[];
  crawlJobStages: { _id: string; count: number }[];
  recentSearches: {
    query: string;
    resultCount: number;
    responseTime: number;
    searchType: string;
    createdAt: string;
  }[];
  topSources: ParallelSource[];
}

export interface CrawlJob {
  _id: string;
  source: string;
  url: string;
  depth: number;
  stage: string;
  progress: number;
  rawBytes: number;
  cleanedBytes: number;
  chunksCreated: number;
  pageTitle?: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  error?: string;
  createdAt: string;
}
