'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, Globe, Trash2, RefreshCw, Plus, Search,
  BarChart3, Loader2, CheckCircle, XCircle, Clock,
  AlertTriangle, ChevronDown, Shield, Zap, FileText,
  Activity, Brain, ExternalLink, Hash, Eye,
} from 'lucide-react';
import { parallelSourcesAPI, parallelStatsAPI, parallelChunksAPI } from '@/lib/parallelApi';
import type { ParallelSource, ParallelStats } from '@/types/parallel';
import MatrixText from '@/components/ui/MatrixText';

type Tab = 'overview' | 'sources' | 'ingest';

export default function ParallelAdminPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<ParallelStats | null>(null);
  const [sources, setSources] = useState<ParallelSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [animTitle, setAnimTitle] = useState(false);

  /* ── Ingest form ───────────────────────────────────── */
  const [ingestUrl, setIngestUrl] = useState('');
  const [ingestName, setIngestName] = useState('');
  const [ingestDepth, setIngestDepth] = useState(1);
  const [ingestTags, setIngestTags] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState<any>(null);

  useEffect(() => { setAnimTitle(true); }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, sourcesRes] = await Promise.all([
        parallelStatsAPI.get(),
        parallelSourcesAPI.list({ limit: 50 }),
      ]);
      setStats(statsRes.data.data);
      setSources(sourcesRes.data.data || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestUrl.trim()) return;
    setIsIngesting(true);
    setIngestResult(null);
    try {
      const { data } = await parallelSourcesAPI.add({
        url: ingestUrl.trim(),
        name: ingestName.trim() || undefined,
        crawlDepth: ingestDepth,
        tags: ingestTags.split(',').map(t => t.trim()).filter(Boolean),
      });
      setIngestResult({ success: true, data: data.data });
      setIngestUrl('');
      setIngestName('');
      setIngestTags('');
      loadData();
    } catch (err: any) {
      setIngestResult({ success: false, error: err.response?.data?.message || err.message });
    }
    setIsIngesting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this source and all its chunks?')) return;
    try {
      await parallelSourcesAPI.delete(id);
      setSources(sources.filter(s => s._id !== id));
      loadData();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleRecrawl = async (id: string) => {
    try {
      await parallelSourcesAPI.recrawl(id);
      loadData();
    } catch (err) {
      console.error('Recrawl failed:', err);
    }
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: 'OVERVIEW', icon: BarChart3 },
    { key: 'sources', label: 'SOURCES', icon: Database },
    { key: 'ingest', label: 'INGEST', icon: Plus },
  ];

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-3.5 h-3.5 text-green-400" />;
      case 'failed': return <XCircle className="w-3.5 h-3.5 text-red-400" />;
      case 'crawling': return <Loader2 className="w-3.5 h-3.5 text-yellow-400 animate-spin" />;
      case 'pending': return <Clock className="w-3.5 h-3.5 text-white/20" />;
      default: return <AlertTriangle className="w-3.5 h-3.5 text-white/15" />;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-wider">
              <MatrixText text="PARALLEL" animate={animTitle} className="text-edith-cyan" />
              <span className="text-white/15 mx-2">/</span>
              <MatrixText text="ADMIN" animate={animTitle} className="text-purple-400" />
            </h1>
            <p className="text-[10px] font-mono text-white/20 tracking-wider mt-1">
              Source Management · Ingestion Monitor · System Stats
            </p>
          </div>
          <button onClick={loadData} disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-mono text-edith-cyan/40 hover:text-edith-cyan/70 transition-all"
            style={{ border: '1px solid rgba(0,212,255,0.1)' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            REFRESH
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-mono font-bold tracking-wider transition-all ${
                tab === t.key
                  ? 'text-edith-cyan bg-edith-cyan/8 border-edith-cyan/25'
                  : 'text-white/20 hover:text-white/35 border-white/5'
              }`}
              style={{ border: `1px solid ${tab === t.key ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.05)'}` }}
            >
              <t.icon className="w-3.5 h-3.5" />{t.label}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ─────────────────────────── */}
        {tab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'SOURCES', value: stats.overview.totalSources, icon: Globe, color: 'cyan' },
                { label: 'CHUNKS', value: stats.overview.totalChunks, icon: Database, color: 'purple' },
                { label: 'CRAWL JOBS', value: stats.overview.totalCrawlJobs, icon: Activity, color: 'yellow' },
                { label: 'TASKS', value: stats.overview.totalResearchTasks, icon: Brain, color: 'green' },
                { label: 'SEARCHES', value: stats.overview.totalSearches, icon: Search, color: 'blue' },
                { label: 'AVG RESPONSE', value: `${stats.overview.avgSearchResponseMs}ms`, icon: Zap, color: 'orange' },
              ].map((s, i) => (
                <div key={i} className="rounded-xl p-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(14,14,30,0.8), rgba(20,20,42,0.5))',
                    border: '1px solid rgba(0,212,255,0.06)',
                  }}
                >
                  <s.icon className="w-4 h-4 text-edith-cyan/25 mb-2" />
                  <div className="text-xl font-display font-bold text-white/70">{s.value}</div>
                  <div className="text-[8px] font-mono text-white/20 tracking-wider mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Chunk status breakdown */}
            {stats.chunkStatusBreakdown.length > 0 && (
              <div className="rounded-xl p-5"
                style={{ background: 'rgba(14,14,30,0.6)', border: '1px solid rgba(0,212,255,0.06)' }}
              >
                <h3 className="text-[10px] font-mono text-white/25 tracking-wider mb-3">CHUNK STATUS BREAKDOWN</h3>
                <div className="flex gap-4 flex-wrap">
                  {stats.chunkStatusBreakdown.map((s) => (
                    <div key={s._id} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        s._id === 'indexed' ? 'bg-green-400' :
                        s._id === 'failed' ? 'bg-red-400' :
                        s._id === 'embedded' ? 'bg-blue-400' : 'bg-white/15'
                      }`} />
                      <span className="text-[11px] font-mono text-white/40">{s._id}: <span className="text-white/60 font-bold">{s.count}</span></span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top sources */}
            {stats.topSources.length > 0 && (
              <div className="rounded-xl p-5"
                style={{ background: 'rgba(14,14,30,0.6)', border: '1px solid rgba(0,212,255,0.06)' }}
              >
                <h3 className="text-[10px] font-mono text-white/25 tracking-wider mb-3">TOP SOURCES BY CHUNK COUNT</h3>
                <div className="space-y-2">
                  {stats.topSources.map((s) => (
                    <div key={s._id} className="flex items-center justify-between p-2 rounded-lg"
                      style={{ background: 'rgba(0,0,0,0.15)' }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {s.favicon && <img src={s.favicon} alt="" className="w-4 h-4 rounded" />}
                        <span className="text-[11px] font-mono text-white/50 truncate">{s.domain || s.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] font-mono text-edith-cyan/40">{s.chunksCount} chunks</span>
                        {statusIcon(s.crawlStatus)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent searches */}
            {stats.recentSearches.length > 0 && (
              <div className="rounded-xl p-5"
                style={{ background: 'rgba(14,14,30,0.6)', border: '1px solid rgba(0,212,255,0.06)' }}
              >
                <h3 className="text-[10px] font-mono text-white/25 tracking-wider mb-3">RECENT SEARCHES</h3>
                <div className="space-y-1.5">
                  {stats.recentSearches.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded"
                      style={{ background: 'rgba(0,0,0,0.1)' }}
                    >
                      <span className="text-[11px] font-mono text-white/40 truncate">&quot;{s.query}&quot;</span>
                      <div className="flex items-center gap-3 shrink-0 text-[9px] font-mono text-white/20">
                        <span>{s.resultCount} results</span>
                        <span>{s.responseTime}ms</span>
                        <span className="uppercase">{s.searchType}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Sources Tab ──────────────────────────── */}
        {tab === 'sources' && (
          <div className="space-y-3">
            {sources.length === 0 && !isLoading && (
              <div className="text-center py-16">
                <Database className="w-10 h-10 text-edith-cyan/10 mx-auto mb-3" />
                <p className="text-sm font-display text-white/20 tracking-wider">NO SOURCES INDEXED</p>
                <p className="text-[10px] font-mono text-white/10 mt-1">Add sources from the Ingest tab</p>
              </div>
            )}

            {sources.map((source) => (
              <div key={source._id} className="rounded-xl p-4 group"
                style={{
                  background: 'linear-gradient(135deg, rgba(14,14,30,0.7), rgba(20,20,42,0.5))',
                  border: '1px solid rgba(0,212,255,0.06)',
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {source.favicon && <img src={source.favicon} alt="" className="w-4 h-4 rounded" />}
                      {statusIcon(source.crawlStatus)}
                      <span className="text-[13px] font-display font-bold text-white/70 truncate">{source.name}</span>
                    </div>
                    <a href={source.url} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] font-mono text-edith-cyan/30 hover:text-edith-cyan/60 truncate block"
                    >
                      {source.url}
                    </a>
                    <div className="flex items-center gap-4 mt-2 text-[9px] font-mono text-white/20">
                      <span><Database className="w-3 h-3 inline mr-1" />{source.chunksCount} chunks</span>
                      <span><FileText className="w-3 h-3 inline mr-1" />{source.pagesCount} pages</span>
                      <span><Shield className="w-3 h-3 inline mr-1" />trust: {Math.round(source.trustScore * 100)}%</span>
                      <span className="uppercase">{source.type}</span>
                      {source.lastCrawledAt && (
                        <span><Clock className="w-3 h-3 inline mr-1" />{new Date(source.lastCrawledAt).toLocaleDateString()}</span>
                      )}
                    </div>
                    {source.tags.length > 0 && (
                      <div className="flex gap-1.5 mt-2">
                        {source.tags.map(t => (
                          <span key={t} className="px-1.5 py-0.5 rounded text-[8px] font-mono text-edith-cyan/25"
                            style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.06)' }}
                          >{t}</span>
                        ))}
                      </div>
                    )}
                    {source.crawlError && (
                      <p className="text-[9px] font-mono text-red-400/50 mt-1">Error: {source.crawlError}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleRecrawl(source._id)} title="Re-crawl"
                      className="p-2 rounded-lg text-edith-cyan/30 hover:text-edith-cyan/70 hover:bg-edith-cyan/5 transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(source._id)} title="Delete"
                      className="p-2 rounded-lg text-red-400/30 hover:text-red-400/70 hover:bg-red-400/5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Ingest Tab ───────────────────────────── */}
        {tab === 'ingest' && (
          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl p-6"
              style={{
                background: 'linear-gradient(135deg, rgba(14,14,30,0.8), rgba(20,20,42,0.6))',
                border: '1px solid rgba(0,212,255,0.1)',
              }}
            >
              <h2 className="text-[12px] font-mono font-bold text-white/40 tracking-wider mb-6 flex items-center gap-2">
                <Plus className="w-4 h-4 text-edith-cyan/40" />
                ADD NEW SOURCE
              </h2>

              <form onSubmit={handleIngest} className="space-y-4">
                <div>
                  <label className="text-[9px] font-mono text-white/25 tracking-wider mb-1.5 block">URL *</label>
                  <input value={ingestUrl} onChange={(e) => setIngestUrl(e.target.value)}
                    placeholder="https://example.com/blog"
                    required
                    className="w-full bg-transparent text-sm font-mono text-white/60 placeholder:text-white/15 outline-none py-2.5 px-3 rounded-lg"
                    style={{ border: '1px solid rgba(0,212,255,0.1)' }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-mono text-white/25 tracking-wider mb-1.5 block">NAME (optional)</label>
                    <input value={ingestName} onChange={(e) => setIngestName(e.target.value)}
                      placeholder="My Blog Source"
                      className="w-full bg-transparent text-[12px] font-mono text-white/60 placeholder:text-white/15 outline-none py-2.5 px-3 rounded-lg"
                      style={{ border: '1px solid rgba(0,212,255,0.08)' }}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-white/25 tracking-wider mb-1.5 block">CRAWL DEPTH</label>
                    <select value={ingestDepth} onChange={(e) => setIngestDepth(Number(e.target.value))}
                      className="w-full bg-transparent text-[12px] font-mono text-white/60 outline-none py-2.5 px-3 rounded-lg appearance-none"
                      style={{ border: '1px solid rgba(0,212,255,0.08)', background: 'rgba(0,0,0,0.2)' }}
                    >
                      <option value={0}>0 — Single page</option>
                      <option value={1}>1 — Page + direct links</option>
                      <option value={2}>2 — Two levels deep</option>
                      <option value={3}>3 — Three levels deep</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-mono text-white/25 tracking-wider mb-1.5 block">TAGS (comma-separated)</label>
                  <input value={ingestTags} onChange={(e) => setIngestTags(e.target.value)}
                    placeholder="news, technology, ai"
                    className="w-full bg-transparent text-[12px] font-mono text-white/60 placeholder:text-white/15 outline-none py-2.5 px-3 rounded-lg"
                    style={{ border: '1px solid rgba(0,212,255,0.08)' }}
                  />
                </div>

                <button type="submit" disabled={isIngesting || !ingestUrl.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-[11px] font-mono font-bold tracking-wider transition-all disabled:opacity-40"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(191,0,255,0.1))',
                    border: '1px solid rgba(0,212,255,0.25)',
                    color: '#00d4ff',
                  }}
                >
                  {isIngesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {isIngesting ? 'INGESTING...' : 'START INGESTION'}
                </button>
              </form>

              {/* Result feedback */}
              <AnimatePresence>
                {ingestResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mt-4 p-3 rounded-lg text-[11px] font-mono ${
                      ingestResult.success
                        ? 'text-green-400 bg-green-400/5 border border-green-400/15'
                        : 'text-red-400 bg-red-400/5 border border-red-400/15'
                    }`}
                  >
                    {ingestResult.success
                      ? `✓ Source added! Ingestion pipeline started.`
                      : `✗ ${ingestResult.error}`
                    }
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* How it works */}
            <div className="mt-8 rounded-xl p-5"
              style={{ background: 'rgba(14,14,30,0.4)', border: '1px solid rgba(0,212,255,0.04)' }}
            >
              <h3 className="text-[10px] font-mono text-white/25 tracking-wider mb-4">INGESTION PIPELINE</h3>
              <div className="flex items-center gap-2 flex-wrap">
                {['CRAWL', 'CLEAN', 'CHUNK', 'EMBED', 'INDEX'].map((stage, i) => (
                  <div key={stage} className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold tracking-wider text-edith-cyan/40"
                      style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)' }}
                    >
                      {stage}
                    </span>
                    {i < 4 && <span className="text-white/10">→</span>}
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-mono text-white/15 mt-3 leading-relaxed">
                URLs are crawled → HTML cleaned of boilerplate → split into semantic chunks →
                embedded into vectors → indexed for hybrid keyword + semantic search.
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && tab !== 'ingest' && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-edith-cyan/30 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
