'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Brain, Sparkles, Globe, FileText, Zap, Filter,
  ChevronDown, Loader2, Database, ArrowRight, X,
  Shield, Clock, BarChart3, Hash, ExternalLink,
} from 'lucide-react';
import { parallelSearchAPI, parallelSourcesAPI } from '@/lib/parallelApi';
import type { SearchChunk, SearchResponse } from '@/types/parallel';
import ParallelResultCard from '@/components/parallel/ParallelResultCard';
import MatrixText from '@/components/ui/MatrixText';

type SearchMode = 'search' | 'extract' | 'task' | 'findall';

export default function ParallelSearchPage() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('search');
  const [searchType, setSearchType] = useState<'hybrid' | 'keyword' | 'semantic'>('hybrid');
  const [results, setResults] = useState<SearchChunk[]>([]);
  const [meta, setMeta] = useState<SearchResponse['meta'] | null>(null);
  const [pagination, setPagination] = useState<SearchResponse['pagination'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [extractUrl, setExtractUrl] = useState('');
  const [taskResult, setTaskResult] = useState<any>(null);
  const [pollingId, setPollingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [animateTitle, setAnimateTitle] = useState(false);

  /* ── Filters ───────────────────────────────────────── */
  const [filterDomain, setFilterDomain] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterTags, setFilterTags] = useState('');

  useEffect(() => {
    setAnimateTitle(true);
  }, []);

  /* ── Search handler ────────────────────────────────── */
  const handleSearch = useCallback(async (page = 1) => {
    if (!query.trim() && mode === 'search') return;
    setIsLoading(true);
    setError('');
    setTaskResult(null);

    try {
      const filters: Record<string, any> = {};
      if (filterDomain) filters.domain = filterDomain;
      if (filterCategory) filters.category = filterCategory;
      if (filterTags) filters.tags = filterTags.split(',').map(t => t.trim()).filter(Boolean);

      if (mode === 'search') {
        const { data } = await parallelSearchAPI.search({
          query: query.trim(),
          filters,
          limit: 20,
          page,
          searchType,
        });
        const response = data.data as SearchResponse;
        setResults(page === 1 ? response.results : [...results, ...response.results]);
        setMeta(response.meta);
        setPagination(response.pagination);

      } else if (mode === 'extract') {
        const url = extractUrl.trim() || query.trim();
        if (!url) { setError('URL is required for extraction'); setIsLoading(false); return; }
        const { data } = await parallelSearchAPI.extract({ url });
        setTaskResult(data.data);

      } else if (mode === 'task') {
        const { data } = await parallelSearchAPI.createTask({ goal: query.trim() });
        setPollingId(data.data.taskId);

      } else if (mode === 'findall') {
        const { data } = await parallelSearchAPI.findAll({ criteria: query.trim() });
        setPollingId(data.data.taskId);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Search failed');
    }
    setIsLoading(false);
  }, [query, mode, searchType, filterDomain, filterCategory, filterTags, extractUrl, results]);

  /* ── Poll for task completion ──────────────────────── */
  useEffect(() => {
    if (!pollingId) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const { data } = await (await import('@/lib/parallelApi')).parallelTasksAPI.get(pollingId);
        const task = data.data;
        if (['completed', 'failed'].includes(task.status)) {
          setTaskResult(task);
          setPollingId(null);
          setIsLoading(false);
        } else if (!cancelled) {
          setTimeout(poll, 2000);
        }
      } catch {
        setPollingId(null);
        setIsLoading(false);
      }
    };
    setIsLoading(true);
    poll();
    return () => { cancelled = true; };
  }, [pollingId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResults([]);
    handleSearch(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const modes: { key: SearchMode; label: string; icon: any; desc: string }[] = [
    { key: 'search', label: 'SEARCH', icon: Search, desc: 'Hybrid AI search across all indexed sources' },
    { key: 'extract', label: 'EXTRACT', icon: FileText, desc: 'Extract structured data from any URL' },
    { key: 'task', label: 'RESEARCH', icon: Brain, desc: 'Multi-step research agent with citations' },
    { key: 'findall', label: 'FIND ALL', icon: Database, desc: 'Build datasets matching your criteria' },
  ];

  return (
    <div className="min-h-screen">
      {/* ── Hero / Header ──────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Animated grid background */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="max-w-5xl mx-auto px-4 pt-12 pb-8 relative z-10">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(191,0,255,0.1))',
                  border: '1px solid rgba(0,212,255,0.25)',
                  boxShadow: '0 0 30px rgba(0,212,255,0.15)',
                }}
              >
                <Sparkles className="w-5 h-5 text-edith-cyan" style={{ filter: 'drop-shadow(0 0 8px rgba(0,212,255,0.6))' }} />
              </div>
              <h1 className="text-3xl font-display font-bold tracking-[0.15em]">
                <MatrixText text="PARALLEL" animate={animateTitle} className="text-edith-cyan" style={{ textShadow: '0 0 20px rgba(0,212,255,0.4)' }} />
                <span className="text-white/20 mx-2">.</span>
                <MatrixText text="AI" animate={animateTitle} className="text-purple-400" style={{ textShadow: '0 0 20px rgba(191,0,255,0.4)' }} />
              </h1>
            </div>
            <p className="text-[11px] font-mono text-white/25 tracking-[0.3em] uppercase">
              AI-Native Search & Research Platform
            </p>
          </div>

          {/* ── Mode Selector ──────────────────────── */}
          <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
            {modes.map((m) => (
              <button
                key={m.key}
                onClick={() => { setMode(m.key); setResults([]); setTaskResult(null); setError(''); }}
                className={`group flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-mono font-bold tracking-wider transition-all duration-300 ${
                  mode === m.key
                    ? 'text-edith-cyan border-edith-cyan/40 bg-edith-cyan/8'
                    : 'text-white/25 border-white/5 bg-white/[0.02] hover:text-white/40 hover:border-white/10'
                }`}
                style={{ border: `1px solid ${mode === m.key ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.05)'}` }}
                title={m.desc}
              >
                <m.icon className="w-3.5 h-3.5" />
                {m.label}
              </button>
            ))}
          </div>

          {/* ── Search Input ───────────────────────── */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative group rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(14,14,30,0.8), rgba(20,20,42,0.6))',
                border: '1px solid rgba(0,212,255,0.12)',
                boxShadow: '0 4px 40px rgba(0,0,0,0.3), 0 0 60px rgba(0,212,255,0.04)',
              }}
            >
              <div className="flex items-start p-4 gap-3">
                <Search className="w-5 h-5 text-edith-cyan/40 mt-1 shrink-0" />
                <textarea
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    mode === 'search' ? 'Search across all indexed sources...' :
                    mode === 'extract' ? 'Describe what to extract (also enter URL below)...' :
                    mode === 'task' ? 'Describe your research goal in detail...' :
                    'Describe the dataset criteria...'
                  }
                  rows={2}
                  className="flex-1 bg-transparent text-sm font-mono text-white/80 placeholder:text-white/15 outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Extract URL input */}
              {mode === 'extract' && (
                <div className="px-4 pb-3 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-edith-cyan/30 shrink-0" />
                  <input
                    value={extractUrl}
                    onChange={(e) => setExtractUrl(e.target.value)}
                    placeholder="https://example.com/page-to-extract"
                    className="flex-1 bg-transparent text-[11px] font-mono text-white/60 placeholder:text-white/15 outline-none py-1.5 px-2 rounded"
                    style={{ border: '1px solid rgba(0,212,255,0.08)' }}
                  />
                </div>
              )}

              {/* Bottom bar */}
              <div className="flex items-center justify-between px-4 py-2.5"
                style={{ borderTop: '1px solid rgba(0,212,255,0.06)', background: 'rgba(0,0,0,0.15)' }}
              >
                <div className="flex items-center gap-3">
                  {mode === 'search' && (
                    <div className="flex items-center gap-1.5">
                      {(['hybrid', 'semantic', 'keyword'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSearchType(t)}
                          className={`px-2.5 py-1 rounded text-[9px] font-mono font-bold tracking-wider transition-all ${
                            searchType === t
                              ? 'text-edith-cyan bg-edith-cyan/10 border-edith-cyan/25'
                              : 'text-white/20 hover:text-white/35 border-transparent'
                          }`}
                          style={{ border: `1px solid ${searchType === t ? 'rgba(0,212,255,0.2)' : 'transparent'}` }}
                        >
                          {t.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono transition-all ${
                      showFilters ? 'text-edith-cyan bg-edith-cyan/8' : 'text-white/20 hover:text-white/35'
                    }`}
                  >
                    <Filter className="w-3 h-3" />
                    FILTERS
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-5 py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-wider transition-all duration-300 disabled:opacity-40"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(191,0,255,0.15))',
                    border: '1px solid rgba(0,212,255,0.3)',
                    color: '#00d4ff',
                    boxShadow: '0 0 20px rgba(0,212,255,0.1)',
                  }}
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  {mode === 'search' ? 'SEARCH' : mode === 'extract' ? 'EXTRACT' : mode === 'task' ? 'RESEARCH' : 'FIND ALL'}
                </button>
              </div>
            </div>

            {/* Glow line at bottom of search box */}
            <div className="absolute bottom-0 left-[10%] right-[10%] h-[1px] opacity-50"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.3), rgba(191,0,255,0.2), transparent)' }}
            />
          </form>

          {/* ── Filters Panel ──────────────────────── */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 p-4 rounded-xl"
                  style={{
                    background: 'rgba(14,14,30,0.6)',
                    border: '1px solid rgba(0,212,255,0.08)',
                  }}
                >
                  <div>
                    <label className="text-[9px] font-mono text-white/25 tracking-wider mb-1 block">DOMAIN</label>
                    <input value={filterDomain} onChange={(e) => setFilterDomain(e.target.value)}
                      placeholder="e.g. nytimes.com"
                      className="w-full bg-transparent text-[11px] font-mono text-white/60 placeholder:text-white/15 outline-none py-2 px-3 rounded"
                      style={{ border: '1px solid rgba(0,212,255,0.08)' }}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-white/25 tracking-wider mb-1 block">CATEGORY</label>
                    <input value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                      placeholder="e.g. technology"
                      className="w-full bg-transparent text-[11px] font-mono text-white/60 placeholder:text-white/15 outline-none py-2 px-3 rounded"
                      style={{ border: '1px solid rgba(0,212,255,0.08)' }}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-white/25 tracking-wider mb-1 block">TAGS (comma-separated)</label>
                    <input value={filterTags} onChange={(e) => setFilterTags(e.target.value)}
                      placeholder="e.g. ai, machine-learning"
                      className="w-full bg-transparent text-[11px] font-mono text-white/60 placeholder:text-white/15 outline-none py-2 px-3 rounded"
                      style={{ border: '1px solid rgba(0,212,255,0.08)' }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Results Section ────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 pb-16">

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl flex items-center gap-3"
            style={{ background: 'rgba(255,50,50,0.08)', border: '1px solid rgba(255,50,50,0.2)' }}
          >
            <X className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-[11px] font-mono text-red-300">{error}</p>
          </div>
        )}

        {/* Search meta */}
        {meta && !isLoading && (
          <div className="flex items-center justify-between mb-6 px-1">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-mono text-white/25 tracking-wider">
                <span className="text-edith-cyan/60 font-bold">{pagination?.total || 0}</span> RESULTS
              </span>
              <span className="text-[10px] font-mono text-white/15">
                <Clock className="w-3 h-3 inline mr-1" />{meta.responseTime}ms
              </span>
              <span className="text-[10px] font-mono text-white/15 uppercase">
                <BarChart3 className="w-3 h-3 inline mr-1" />{meta.searchType}
              </span>
            </div>
          </div>
        )}

        {/* Search results */}
        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((chunk, i) => (
              <ParallelResultCard key={chunk.id + '-' + i} chunk={chunk} index={i} />
            ))}
          </div>
        )}

        {/* Load more */}
        {pagination?.hasMore && !isLoading && (
          <div className="text-center mt-8">
            <button
              onClick={() => handleSearch((pagination?.page || 1) + 1)}
              className="px-6 py-2.5 rounded-lg text-[10px] font-mono font-bold tracking-wider text-edith-cyan/60 transition-all hover:text-edith-cyan hover:bg-edith-cyan/5"
              style={{ border: '1px solid rgba(0,212,255,0.15)' }}
            >
              LOAD MORE RESULTS
              <ArrowRight className="w-3.5 h-3.5 inline ml-2" />
            </button>
          </div>
        )}

        {/* Task / Extract result */}
        {taskResult && (
          <div className="mt-6">
            <TaskResultPanel result={taskResult} mode={mode} />
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(0,212,255,0.05)',
                  border: '1px solid rgba(0,212,255,0.15)',
                }}
              >
                <Loader2 className="w-5 h-5 text-edith-cyan/60 animate-spin" />
              </div>
              <div className="absolute -inset-2 rounded-xl animate-pulse"
                style={{ border: '1px solid rgba(0,212,255,0.08)' }}
              />
            </div>
            <div className="text-center">
              <p className="text-[11px] font-mono text-edith-cyan/30 tracking-wider">
                {mode === 'task' || mode === 'findall' ? 'AGENT PROCESSING...' : 'SCANNING SOURCES...'}
              </p>
              {pollingId && (
                <p className="text-[9px] font-mono text-white/15 mt-1">Task ID: {pollingId}</p>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && results.length === 0 && !taskResult && !error && (
          <div className="text-center py-16">
            <Sparkles className="w-10 h-10 text-edith-cyan/10 mx-auto mb-4" />
            <p className="text-sm font-display font-bold text-white/20 tracking-wider mb-2">
              {mode === 'search' ? 'SEARCH THE INDEXED WEB' :
               mode === 'extract' ? 'EXTRACT DATA FROM ANY URL' :
               mode === 'task' ? 'RUN AI RESEARCH AGENTS' :
               'BUILD DATASETS AT SCALE'}
            </p>
            <p className="text-[11px] font-mono text-white/10 max-w-md mx-auto">
              {mode === 'search' ? 'Enter a query to search across all indexed sources using hybrid AI search with citations and confidence scores.' :
               mode === 'extract' ? 'Enter a URL to extract structured data — titles, authors, dates, prices, and any custom schema.' :
               mode === 'task' ? 'Describe a research goal and the AI agent will decompose it, search multiple sources, verify claims, and produce cited results.' :
               'Define criteria and the system will find all matching data across the web, deduplicate, and return a structured dataset.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Task/Extract result panel ──────────────────────── */
function TaskResultPanel({ result, mode }: { result: any; mode: string }) {
  const isTask = result?.steps || result?.plan;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(14,14,30,0.8), rgba(20,20,42,0.6))',
        border: '1px solid rgba(0,212,255,0.12)',
      }}
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(0,212,255,0.06)' }}
      >
        <div className="flex items-center gap-2">
          {isTask ? <Brain className="w-4 h-4 text-purple-400" /> : <FileText className="w-4 h-4 text-edith-cyan" />}
          <span className="text-[11px] font-mono font-bold text-white/60 tracking-wider">
            {isTask ? 'RESEARCH RESULT' : 'EXTRACTION RESULT'}
          </span>
        </div>
        {result.status && (
          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider ${
            result.status === 'completed' ? 'text-green-400 bg-green-400/10' :
            result.status === 'failed' ? 'text-red-400 bg-red-400/10' :
            'text-yellow-400 bg-yellow-400/10'
          }`}>
            {result.status?.toUpperCase()}
          </span>
        )}
      </div>

      {/* Summary */}
      {(result.result?.summary || result.data?.description || result.data?.content) && (
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(0,212,255,0.04)' }}>
          <p className="text-[10px] font-mono text-white/25 tracking-wider mb-2">SUMMARY</p>
          <p className="text-sm text-white/60 leading-relaxed font-mono">
            {result.result?.summary || result.data?.description || result.data?.content?.substring(0, 500)}
          </p>
        </div>
      )}

      {/* Key findings */}
      {result.result?.data?.keyFindings?.length > 0 && (
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(0,212,255,0.04)' }}>
          <p className="text-[10px] font-mono text-white/25 tracking-wider mb-3">KEY FINDINGS</p>
          <ul className="space-y-2">
            {result.result.data.keyFindings.map((finding: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-[12px] font-mono text-white/50">
                <span className="text-edith-cyan/40 shrink-0 mt-0.5">▸</span>
                {finding}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Steps */}
      {result.steps?.length > 0 && (
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(0,212,255,0.04)' }}>
          <p className="text-[10px] font-mono text-white/25 tracking-wider mb-3">EXECUTION STEPS</p>
          <div className="space-y-2">
            {result.steps.map((step: any, i: number) => (
              <div key={i} className="flex items-center gap-3 text-[11px] font-mono">
                <span className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold ${
                  step.status === 'completed' ? 'bg-green-400/10 text-green-400' :
                  step.status === 'failed' ? 'bg-red-400/10 text-red-400' :
                  'bg-white/5 text-white/20'
                }`}>{step.stepNumber}</span>
                <span className="text-white/40">{step.action.toUpperCase()}</span>
                {step.duration && <span className="text-white/15">{step.duration}ms</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Citations */}
      {result.result?.citations?.length > 0 && (
        <div className="px-5 py-4">
          <p className="text-[10px] font-mono text-white/25 tracking-wider mb-3">CITATIONS</p>
          <div className="space-y-2">
            {result.result.citations.map((cite: any, i: number) => (
              <a key={i} href={cite.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-[11px] font-mono text-edith-cyan/40 hover:text-edith-cyan/70 transition-colors"
              >
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className="truncate">{cite.title || cite.url}</span>
                {cite.trustScore > 0 && (
                  <span className="text-[9px] text-white/15 shrink-0">
                    trust: {Math.round(cite.trustScore * 100)}%
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Raw data */}
      {result.data && !isTask && (
        <div className="px-5 py-4">
          <p className="text-[10px] font-mono text-white/25 tracking-wider mb-2">EXTRACTED DATA</p>
          <pre className="text-[10px] font-mono text-white/40 overflow-x-auto p-3 rounded-lg max-h-64 overflow-y-auto"
            style={{ background: 'rgba(0,0,0,0.3)' }}
          >
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}

      {/* Performance */}
      {(result.duration || result.totalTokensUsed > 0) && (
        <div className="px-5 py-3 flex items-center gap-4 text-[9px] font-mono text-white/15"
          style={{ borderTop: '1px solid rgba(0,212,255,0.04)', background: 'rgba(0,0,0,0.1)' }}
        >
          {result.duration && <span><Clock className="w-3 h-3 inline mr-1" />{result.duration}ms</span>}
          {result.totalTokensUsed > 0 && <span>🔤 {result.totalTokensUsed} tokens</span>}
          {result.totalCost > 0 && <span>💰 ${result.totalCost.toFixed(4)}</span>}
          {result.result?.confidence > 0 && (
            <span><Shield className="w-3 h-3 inline mr-1" />{Math.round(result.result.confidence * 100)}% confidence</span>
          )}
        </div>
      )}
    </div>
  );
}
