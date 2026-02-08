'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Brain, Sparkles, Globe, FileText, Zap, Filter,
  ChevronDown, Loader2, Database, ArrowRight, X,
  Shield, Clock, BarChart3, ExternalLink, MessageSquare,
  Eye, Send, Plus, Trash2, RefreshCw, Copy, Check,
  Play, Pause, AlertCircle, Hash, ChevronUp,
} from 'lucide-react';
import {
  searchAPI, extractAPI, taskAPI, findAllAPI, chatAPI, monitorAPI,
} from '@/lib/parallelApi';
import type {
  ParallelMode, WebSearchResult, ExtractResult, TaskRun,
  FindAllCandidate, ChatMessage, MonitorWatch,
} from '@/types/parallel';
import MatrixText from '@/components/ui/MatrixText';

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════ */
export default function ParallelPage() {
  const [mode, setMode] = useState<ParallelMode>('search');
  const [animateTitle, setAnimateTitle] = useState(false);

  useEffect(() => { setAnimateTitle(true); }, []);

  const modes: { key: ParallelMode; label: string; icon: any; desc: string }[] = [
    { key: 'search',   label: 'SEARCH',   icon: Search,       desc: 'AI-powered web search with ranked results' },
    { key: 'extract',  label: 'EXTRACT',  icon: FileText,     desc: 'Extract structured content from URLs' },
    { key: 'research', label: 'RESEARCH', icon: Brain,        desc: 'Deep multi-step research with citations' },
    { key: 'findall',  label: 'FIND ALL', icon: Database,     desc: 'Discover entities matching conditions' },
    { key: 'chat',     label: 'CHAT',     icon: MessageSquare, desc: 'Web-grounded AI chat' },
    { key: 'monitor',  label: 'MONITOR',  icon: Eye,          desc: 'Watch URLs for changes' },
  ];

  return (
    <div className="min-h-screen">
      {/* ── Hero ──────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="max-w-5xl mx-auto px-4 pt-12 pb-4 relative z-10">
          <div className="text-center mb-6">
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
                <MatrixText text="PARALLEL" trigger={animateTitle} className="text-edith-cyan" style={{ textShadow: '0 0 20px rgba(0,212,255,0.4)' }} />
                <span className="text-white/20 mx-2">.</span>
                <MatrixText text="AI" trigger={animateTitle} className="text-purple-400" style={{ textShadow: '0 0 20px rgba(191,0,255,0.4)' }} />
              </h1>
            </div>
            <p className="text-[11px] font-mono text-white/25 tracking-[0.3em] uppercase">
              AI-Native Search & Research Platform — 6 APIs
            </p>
          </div>

          {/* ── Mode Selector ──────────────────────── */}
          <div className="flex items-center justify-center gap-1.5 mb-6 flex-wrap">
            {modes.map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`group flex items-center gap-1.5 px-3 py-2 rounded-lg text-[9px] font-mono font-bold tracking-wider transition-all duration-300 ${
                  mode === m.key
                    ? 'text-edith-cyan border-edith-cyan/40 bg-edith-cyan/8'
                    : 'text-white/25 border-white/5 bg-white/[0.02] hover:text-white/40 hover:border-white/10'
                }`}
                style={{ border: `1px solid ${mode === m.key ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.05)'}` }}
                title={m.desc}
              >
                <m.icon className="w-3 h-3" />
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Active Panel ──────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        {mode === 'search'   && <SearchPanel />}
        {mode === 'extract'  && <ExtractPanel />}
        {mode === 'research' && <ResearchPanel />}
        {mode === 'findall'  && <FindAllPanel />}
        {mode === 'chat'     && <ChatPanel />}
        {mode === 'monitor'  && <MonitorPanel />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════ */
function GlowCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(14,14,30,0.8), rgba(20,20,42,0.6))',
        border: '1px solid rgba(0,212,255,0.12)',
        boxShadow: '0 4px 40px rgba(0,0,0,0.3), 0 0 60px rgba(0,212,255,0.04)',
      }}
    >
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = status === 'completed' ? 'text-green-400 bg-green-400/10' :
    status === 'failed' ? 'text-red-400 bg-red-400/10' :
    status === 'running' ? 'text-yellow-400 bg-yellow-400/10' :
    'text-white/30 bg-white/5';
  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider ${color}`}>
      {status?.toUpperCase()}
    </span>
  );
}

function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="mb-4 p-3 rounded-xl flex items-center gap-3"
      style={{ background: 'rgba(255,50,50,0.08)', border: '1px solid rgba(255,50,50,0.2)' }}
    >
      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
      <p className="text-[11px] font-mono text-red-300">{message}</p>
    </div>
  );
}

function LoadingSpinner({ text = 'PROCESSING...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center py-12 gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }}
      >
        <Loader2 className="w-5 h-5 text-edith-cyan/60 animate-spin" />
      </div>
      <p className="text-[10px] font-mono text-edith-cyan/30 tracking-wider">{text}</p>
    </div>
  );
}

function SubmitButton({ loading, label, icon: Icon = Zap }: { loading: boolean; label: string; icon?: any }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex items-center gap-2 px-5 py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-wider transition-all duration-300 disabled:opacity-40"
      style={{
        background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(191,0,255,0.15))',
        border: '1px solid rgba(0,212,255,0.3)',
        color: '#00d4ff',
        boxShadow: '0 0 20px rgba(0,212,255,0.1)',
      }}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
}

function InputBox({
  value, onChange, placeholder, onSubmit, rows = 2,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  onSubmit: () => void;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(); } }}
      placeholder={placeholder}
      rows={rows}
      className="flex-1 bg-transparent text-sm font-mono text-white/80 placeholder:text-white/15 outline-none resize-none leading-relaxed"
    />
  );
}

/* ═══════════════════════════════════════════════════════
   1. SEARCH PANEL
   ═══════════════════════════════════════════════════════ */
function SearchPanel() {
  const [query, setQuery] = useState('');
  const [processor, setProcessor] = useState<'base' | 'pro'>('base');
  const [results, setResults] = useState<WebSearchResult[]>([]);
  const [searchId, setSearchId] = useState('');
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await searchAPI.search({
        objective: query.trim(),
        search_queries: [query.trim()],
        max_results: 20,
        processor,
      });
      const res = data.data;
      setResults(res.results || []);
      setSearchId(res.search_id || '');
      setMeta(res._meta || null);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    }
    setLoading(false);
  };

  return (
    <>
      <GlowCard>
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
          <div className="flex items-start p-4 gap-3">
            <Search className="w-5 h-5 text-edith-cyan/40 mt-1 shrink-0" />
            <InputBox value={query} onChange={setQuery} placeholder="Search across all indexed sources..." onSubmit={handleSearch} />
          </div>
          <div className="flex items-center justify-between px-4 py-2.5"
            style={{ borderTop: '1px solid rgba(0,212,255,0.06)', background: 'rgba(0,0,0,0.15)' }}
          >
            <div className="flex items-center gap-1.5">
              {(['base', 'pro'] as const).map((p) => (
                <button key={p} type="button" onClick={() => setProcessor(p)}
                  className={`px-2.5 py-1 rounded text-[9px] font-mono font-bold tracking-wider transition-all ${
                    processor === p ? 'text-edith-cyan bg-edith-cyan/10 border-edith-cyan/25' : 'text-white/20 hover:text-white/35 border-transparent'
                  }`}
                  style={{ border: `1px solid ${processor === p ? 'rgba(0,212,255,0.2)' : 'transparent'}` }}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
            <SubmitButton loading={loading} label="SEARCH" icon={Search} />
          </div>
        </form>
      </GlowCard>

      <ErrorBanner message={error} />

      {meta && !loading && (
        <div className="flex items-center gap-4 mt-4 px-1">
          <span className="text-[10px] font-mono text-white/25 tracking-wider">
            <span className="text-edith-cyan/60 font-bold">{results.length}</span> RESULTS
          </span>
          {meta.responseTime && (
            <span className="text-[10px] font-mono text-white/15">
              <Clock className="w-3 h-3 inline mr-1" />{meta.responseTime}ms
            </span>
          )}
          {searchId && (
            <span className="text-[9px] font-mono text-white/10">{searchId}</span>
          )}
        </div>
      )}

      {loading && <LoadingSpinner text="SEARCHING SOURCES..." />}

      {results.length > 0 && (
        <div className="space-y-3 mt-4">
          {results.map((r, i) => (
            <SearchResultCard key={`${r.url}-${i}`} result={r} index={i} />
          ))}
        </div>
      )}

      {!loading && results.length === 0 && !error && (
        <EmptyState icon={Search} title="SEARCH THE WEB" desc="Enter a query with an objective to search across all indexed sources using hybrid AI search." />
      )}
    </>
  );
}

function SearchResultCard({ result, index }: { result: WebSearchResult; index: number }) {
  const [expanded, setExpanded] = useState(false);
  let hostname = '';
  try { hostname = new URL(result.url).hostname; } catch {}

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group rounded-xl p-4 transition-all duration-300"
      style={{
        background: 'linear-gradient(135deg, rgba(14,14,30,0.7), rgba(20,20,42,0.5))',
        border: '1px solid rgba(0,212,255,0.06)',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[9px] font-mono font-bold"
          style={{
            background: index < 3 ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${index < 3 ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.05)'}`,
            color: index < 3 ? '#00d4ff' : 'rgba(255,255,255,0.25)',
          }}
        >{index + 1}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <img src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=16`} alt="" className="w-3.5 h-3.5 rounded" />
            <span className="text-[9px] font-mono text-edith-cyan/50 truncate">{hostname}</span>
            {result.publish_date && (
              <span className="text-[8px] font-mono text-white/15">{result.publish_date}</span>
            )}
          </div>
          <h3 className="text-sm font-display font-bold text-white/70 group-hover:text-white/90 transition-colors leading-tight mb-2">
            {result.title || 'Untitled'}
          </h3>
          <div className={`space-y-1.5 ${!expanded ? 'max-h-24 overflow-hidden' : ''}`}>
            {(result.excerpts || []).map((ex, i) => (
              <p key={i} className="text-[11px] font-mono text-white/40 leading-relaxed">
                {ex}
              </p>
            ))}
          </div>
          {(result.excerpts || []).length > 1 && (
            <button onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 mt-2 text-[9px] font-mono text-edith-cyan/30 hover:text-edith-cyan/60"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? 'COLLAPSE' : `SHOW ALL ${result.excerpts.length} EXCERPTS`}
            </button>
          )}
          <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <a href={result.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono text-edith-cyan/30 hover:text-edith-cyan/60"
              style={{ border: '1px solid rgba(0,212,255,0.08)' }}
            >
              <ExternalLink className="w-3 h-3" />SOURCE
            </a>
          </div>
        </div>
        {result.score !== undefined && (
          <div className="text-center shrink-0">
            <div className="text-[11px] font-mono font-bold text-purple-400">{result.score.toFixed(3)}</div>
            <div className="text-[7px] font-mono text-white/15 tracking-wider">SCORE</div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   2. EXTRACT PANEL
   ═══════════════════════════════════════════════════════ */
function ExtractPanel() {
  const [urls, setUrls] = useState('');
  const [objective, setObjective] = useState('');
  const [results, setResults] = useState<ExtractResult[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [extractId, setExtractId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleExtract = async () => {
    const urlList = urls.split('\n').map(u => u.trim()).filter(Boolean);
    if (!urlList.length) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await extractAPI.extract({
        urls: urlList,
        full_content: true,
        objective: objective || undefined,
      });
      const res = data.data;
      setResults(res.results || []);
      setErrors(res.errors || []);
      setExtractId(res.extract_id || '');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    }
    setLoading(false);
  };

  return (
    <>
      <GlowCard>
        <form onSubmit={(e) => { e.preventDefault(); handleExtract(); }}>
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-edith-cyan/40 mt-1 shrink-0" />
              <textarea
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder="Enter URLs to extract (one per line)..."
                rows={3}
                className="flex-1 bg-transparent text-sm font-mono text-white/80 placeholder:text-white/15 outline-none resize-none leading-relaxed"
              />
            </div>
            <div className="flex items-start gap-3 pl-8">
              <input
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Optional: describe what to extract..."
                className="flex-1 bg-transparent text-[11px] font-mono text-white/60 placeholder:text-white/15 outline-none py-2 px-3 rounded"
                style={{ border: '1px solid rgba(0,212,255,0.08)' }}
              />
            </div>
          </div>
          <div className="flex items-center justify-end px-4 py-2.5"
            style={{ borderTop: '1px solid rgba(0,212,255,0.06)', background: 'rgba(0,0,0,0.15)' }}
          >
            <SubmitButton loading={loading} label="EXTRACT" icon={FileText} />
          </div>
        </form>
      </GlowCard>

      <ErrorBanner message={error} />
      {loading && <LoadingSpinner text="EXTRACTING CONTENT..." />}

      {results.length > 0 && (
        <div className="space-y-4 mt-4">
          {results.map((r, i) => (
            <ExtractResultCard key={`${r.url}-${i}`} result={r} />
          ))}
        </div>
      )}

      {errors.length > 0 && (
        <div className="mt-4 space-y-2">
          {errors.map((e, i) => (
            <div key={i} className="p-3 rounded-xl text-[11px] font-mono text-red-300"
              style={{ background: 'rgba(255,50,50,0.06)', border: '1px solid rgba(255,50,50,0.15)' }}
            >
              <span className="text-red-400/60">{e.url}</span> — {e.error}
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && !error && (
        <EmptyState icon={FileText} title="EXTRACT FROM URLS" desc="Enter one or more URLs to extract titles, content, excerpts, and metadata." />
      )}
    </>
  );
}

function ExtractResultCard({ result }: { result: ExtractResult }) {
  const [showFull, setShowFull] = useState(false);
  const [copied, setCopied] = useState(false);
  let hostname = '';
  try { hostname = new URL(result.url).hostname; } catch {}

  return (
    <GlowCard>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <img src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=16`} alt="" className="w-4 h-4 rounded" />
          <span className="text-[10px] font-mono text-edith-cyan/50">{hostname}</span>
          {result.publish_date && <span className="text-[9px] font-mono text-white/15">{result.publish_date}</span>}
        </div>
        <h3 className="text-sm font-display font-bold text-white/70 mb-3">{result.title || 'Untitled'}</h3>

        {result.excerpts && result.excerpts.length > 0 && (
          <div className="mb-3">
            <p className="text-[9px] font-mono text-white/25 tracking-wider mb-1">EXCERPTS</p>
            {result.excerpts.map((ex, i) => (
              <p key={i} className="text-[11px] font-mono text-white/45 leading-relaxed mb-1">{ex}</p>
            ))}
          </div>
        )}

        {result.full_content && (
          <>
            <button onClick={() => setShowFull(!showFull)}
              className="text-[9px] font-mono text-edith-cyan/30 hover:text-edith-cyan/60 transition-colors mb-2 flex items-center gap-1"
            >
              {showFull ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showFull ? 'HIDE FULL CONTENT' : 'SHOW FULL CONTENT'}
            </button>
            {showFull && (
              <pre className="text-[10px] font-mono text-white/35 overflow-x-auto p-3 rounded-lg max-h-64 overflow-y-auto whitespace-pre-wrap"
                style={{ background: 'rgba(0,0,0,0.3)' }}
              >
                {result.full_content}
              </pre>
            )}
          </>
        )}

        <div className="flex items-center gap-2 mt-3">
          <a href={result.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono text-edith-cyan/30 hover:text-edith-cyan/60"
            style={{ border: '1px solid rgba(0,212,255,0.08)' }}
          >
            <ExternalLink className="w-3 h-3" />VISIT
          </a>
          <button onClick={async () => {
            await navigator.clipboard.writeText(result.full_content || result.excerpts?.join('\n') || '');
            setCopied(true); setTimeout(() => setCopied(false), 2000);
          }}
            className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono text-white/20 hover:text-white/40"
            style={{ border: '1px solid rgba(255,255,255,0.05)' }}
          >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'COPIED' : 'COPY'}
          </button>
        </div>
      </div>
    </GlowCard>
  );
}

/* ═══════════════════════════════════════════════════════
   3. RESEARCH (TASK) PANEL
   ═══════════════════════════════════════════════════════ */
function ResearchPanel() {
  const [input, setInput] = useState('');
  const [processor, setProcessor] = useState<'base' | 'pro' | 'ultra'>('base');
  const [runId, setRunId] = useState('');
  const [taskRun, setTaskRun] = useState<TaskRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    setTaskRun(null);
    try {
      const { data } = await taskAPI.create({ input: input.trim(), processor, enable_events: true });
      setRunId(data.data.run_id);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  // Poll for completion
  useEffect(() => {
    if (!runId) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const { data } = await taskAPI.get(runId);
        const run = data.data;
        if (['completed', 'failed'].includes(run.status)) {
          setTaskRun(run);
          setLoading(false);
        } else if (!cancelled) {
          setTimeout(poll, 2000);
        }
      } catch {
        setLoading(false);
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [runId]);

  return (
    <>
      <GlowCard>
        <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
          <div className="flex items-start p-4 gap-3">
            <Brain className="w-5 h-5 text-purple-400/60 mt-1 shrink-0" />
            <InputBox value={input} onChange={setInput} placeholder="Describe your research goal in detail..." onSubmit={handleCreate} rows={3} />
          </div>
          <div className="flex items-center justify-between px-4 py-2.5"
            style={{ borderTop: '1px solid rgba(0,212,255,0.06)', background: 'rgba(0,0,0,0.15)' }}
          >
            <div className="flex items-center gap-1.5">
              {(['base', 'pro', 'ultra'] as const).map((p) => (
                <button key={p} type="button" onClick={() => setProcessor(p)}
                  className={`px-2.5 py-1 rounded text-[9px] font-mono font-bold tracking-wider transition-all ${
                    processor === p ? 'text-purple-400 bg-purple-400/10 border-purple-400/25' : 'text-white/20 hover:text-white/35 border-transparent'
                  }`}
                  style={{ border: `1px solid ${processor === p ? 'rgba(191,0,255,0.2)' : 'transparent'}` }}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
            <SubmitButton loading={loading} label="RESEARCH" icon={Brain} />
          </div>
        </form>
      </GlowCard>

      <ErrorBanner message={error} />
      {loading && <LoadingSpinner text={`RESEARCHING (${processor.toUpperCase()})...`} />}

      {taskRun && <TaskRunResult run={taskRun} />}

      {!loading && !taskRun && !error && (
        <EmptyState icon={Brain} title="DEEP RESEARCH" desc="Describe a research goal. The AI agent decomposes it, searches multiple sources, verifies claims, and produces cited results. Use Ultra for maximum depth." />
      )}
    </>
  );
}

function TaskRunResult({ run }: { run: TaskRun }) {
  return (
    <GlowCard className="mt-4">
      <div className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(0,212,255,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          <span className="text-[11px] font-mono font-bold text-white/60 tracking-wider">RESEARCH RESULT</span>
          <span className="text-[9px] font-mono text-white/15">{run.run_id}</span>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={run.status} />
          {run.confidence !== undefined && (
            <span className="text-[10px] font-mono text-green-400/60">
              <Shield className="w-3 h-3 inline mr-0.5" />{Math.round(run.confidence * 100)}%
            </span>
          )}
        </div>
      </div>

      {/* Output */}
      {run.output?.content && (
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(0,212,255,0.04)' }}>
          <p className="text-[9px] font-mono text-white/25 tracking-wider mb-2">OUTPUT</p>
          <div className="text-[12px] font-mono text-white/55 leading-relaxed whitespace-pre-wrap">
            {run.output.content}
          </div>
        </div>
      )}

      {/* Reasoning */}
      {run.reasoning && (
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(0,212,255,0.04)' }}>
          <p className="text-[9px] font-mono text-white/25 tracking-wider mb-2">REASONING</p>
          <p className="text-[11px] font-mono text-white/35 leading-relaxed">{run.reasoning}</p>
        </div>
      )}

      {/* Citations */}
      {run.citations?.length > 0 && (
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(0,212,255,0.04)' }}>
          <p className="text-[9px] font-mono text-white/25 tracking-wider mb-2">CITATIONS ({run.citations.length})</p>
          <div className="space-y-1.5">
            {run.citations.map((c, i) => (
              <a key={i} href={c.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-[10px] font-mono text-edith-cyan/40 hover:text-edith-cyan/70 transition-colors"
              >
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className="truncate">{c.title || c.url}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Events */}
      {run.events?.length > 0 && (
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(0,212,255,0.04)' }}>
          <p className="text-[9px] font-mono text-white/25 tracking-wider mb-2">EVENTS</p>
          <div className="space-y-1">
            {run.events.map((ev, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] font-mono text-white/30">
                <span className="text-edith-cyan/30">{ev.type}</span>
                <span>{ev.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance */}
      <div className="px-5 py-3 flex items-center gap-4 text-[9px] font-mono text-white/15"
        style={{ borderTop: '1px solid rgba(0,212,255,0.04)', background: 'rgba(0,0,0,0.1)' }}
      >
        {run.duration_ms && <span><Clock className="w-3 h-3 inline mr-1" />{run.duration_ms}ms</span>}
        <span>{run.sources_considered} sources considered</span>
        <span>{run.sources_read} sources read</span>
        <span className="uppercase">{run.processor}</span>
      </div>
    </GlowCard>
  );
}

/* ═══════════════════════════════════════════════════════
   4. FINDALL PANEL
   ═══════════════════════════════════════════════════════ */
function FindAllPanel() {
  const [entityType, setEntityType] = useState('');
  const [objective, setObjective] = useState('');
  const [conditions, setConditions] = useState<{ name: string; description: string }[]>([]);
  const [findallId, setFindallId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addCondition = () => setConditions([...conditions, { name: '', description: '' }]);
  const removeCondition = (i: number) => setConditions(conditions.filter((_, idx) => idx !== i));
  const updateCondition = (i: number, field: 'name' | 'description', value: string) => {
    const updated = [...conditions];
    updated[i][field] = value;
    setConditions(updated);
  };

  const handleCreate = async () => {
    if (!entityType.trim() || !objective.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const validConditions = conditions.filter(c => c.name && c.description);
      const { data } = await findAllAPI.create({
        entity_type: entityType.trim(),
        objective: objective.trim(),
        match_conditions: validConditions,
        match_limit: 10,
      });
      setFindallId(data.data.findall_id);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!findallId) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const { data } = await findAllAPI.get(findallId);
        const run = data.data;
        if (['completed', 'failed', 'cancelled'].includes(run.status?.status)) {
          setResult(run);
          setLoading(false);
        } else if (!cancelled) {
          setTimeout(poll, 2000);
        }
      } catch {
        setLoading(false);
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [findallId]);

  return (
    <>
      <GlowCard>
        <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-edith-cyan/40 mt-1 shrink-0" />
              <div className="flex-1 space-y-2">
                <input value={entityType} onChange={(e) => setEntityType(e.target.value)}
                  placeholder="Entity type (e.g. 'AI startups', 'SaaS tools')"
                  className="w-full bg-transparent text-sm font-mono text-white/80 placeholder:text-white/15 outline-none py-1"
                />
                <textarea value={objective} onChange={(e) => setObjective(e.target.value)}
                  placeholder="Objective (e.g. 'Find AI startups in healthcare space')"
                  rows={2}
                  className="w-full bg-transparent text-[12px] font-mono text-white/60 placeholder:text-white/15 outline-none resize-none"
                />
              </div>
            </div>

            {/* Match conditions */}
            {conditions.length > 0 && (
              <div className="pl-8 space-y-2">
                <p className="text-[9px] font-mono text-white/25 tracking-wider">MATCH CONDITIONS</p>
                {conditions.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={c.name} onChange={(e) => updateCondition(i, 'name', e.target.value)}
                      placeholder="Condition name"
                      className="w-32 bg-transparent text-[10px] font-mono text-white/60 placeholder:text-white/15 outline-none py-1.5 px-2 rounded"
                      style={{ border: '1px solid rgba(0,212,255,0.08)' }}
                    />
                    <input value={c.description} onChange={(e) => updateCondition(i, 'description', e.target.value)}
                      placeholder="Description"
                      className="flex-1 bg-transparent text-[10px] font-mono text-white/60 placeholder:text-white/15 outline-none py-1.5 px-2 rounded"
                      style={{ border: '1px solid rgba(0,212,255,0.08)' }}
                    />
                    <button type="button" onClick={() => removeCondition(i)} className="text-red-400/40 hover:text-red-400/70">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between px-4 py-2.5"
            style={{ borderTop: '1px solid rgba(0,212,255,0.06)', background: 'rgba(0,0,0,0.15)' }}
          >
            <button type="button" onClick={addCondition}
              className="flex items-center gap-1 text-[9px] font-mono text-white/20 hover:text-white/40"
            >
              <Plus className="w-3 h-3" />ADD CONDITION
            </button>
            <SubmitButton loading={loading} label="FIND ALL" icon={Database} />
          </div>
        </form>
      </GlowCard>

      <ErrorBanner message={error} />
      {loading && <LoadingSpinner text="DISCOVERING ENTITIES..." />}

      {result && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-4 px-1">
            <StatusBadge status={result.status?.status} />
            <span className="text-[10px] font-mono text-white/25">
              {result.status?.metrics?.candidates_matched || 0} matched / {result.status?.metrics?.candidates_generated || 0} generated
            </span>
          </div>
          {(result.candidates || []).filter((c: any) => c.match_status === 'matched').map((c: FindAllCandidate, i: number) => (
            <motion.div key={c.candidate_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl"
              style={{ background: 'rgba(14,14,30,0.7)', border: '1px solid rgba(0,212,255,0.08)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-display font-bold text-white/70">{c.name}</h3>
                <span className="text-[8px] font-mono text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">MATCHED</span>
              </div>
              {c.description && <p className="text-[11px] font-mono text-white/35 mb-2">{c.description}</p>}
              {c.url && (
                <a href={c.url} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] font-mono text-edith-cyan/40 hover:text-edith-cyan/60 flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />{c.url}
                </a>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {!loading && !result && !error && (
        <EmptyState icon={Database} title="DISCOVER ENTITIES" desc="Define an entity type and objective. Optionally add match conditions. The system will search, evaluate, and return matched candidates." />
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   5. CHAT PANEL
   ═══════════════════════════════════════════════════════ */
function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [webSearch, setWebSearch] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const { data } = await chatAPI.complete({
        messages: updatedMessages,
        web_search_enabled: webSearch,
      });
      const choice = data.data.choices?.[0];
      if (choice?.message) {
        setMessages([...updatedMessages, choice.message]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Chat messages area */}
      <div className="rounded-2xl overflow-hidden mb-4"
        style={{
          background: 'linear-gradient(135deg, rgba(14,14,30,0.6), rgba(20,20,42,0.4))',
          border: '1px solid rgba(0,212,255,0.08)',
          minHeight: '400px',
          maxHeight: '500px',
        }}
      >
        <div className="p-4 overflow-y-auto" style={{ maxHeight: '500px' }}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <MessageSquare className="w-8 h-8 text-edith-cyan/10 mb-3" />
              <p className="text-[11px] font-mono text-white/15">Start a conversation with web-grounded AI</p>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-edith-cyan/10 border border-edith-cyan/20'
                    : 'bg-white/[0.03] border border-white/5'
                }`}>
                  <p className={`text-[12px] font-mono leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user' ? 'text-edith-cyan/70' : 'text-white/55'
                  }`}>
                    {msg.content}
                  </p>
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <p className="text-[8px] font-mono text-white/20 tracking-wider mb-1">SOURCES</p>
                      {msg.citations.map((c, j) => (
                        <a key={j} href={c.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[9px] font-mono text-edith-cyan/30 hover:text-edith-cyan/60 mb-0.5"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span className="truncate">{c.title || c.url}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-xl px-4 py-3 bg-white/[0.03] border border-white/5">
                  <Loader2 className="w-4 h-4 text-edith-cyan/40 animate-spin" />
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEnd} />
        </div>
      </div>

      <ErrorBanner message={error} />

      {/* Chat input */}
      <GlowCard>
        <div className="flex items-center gap-3 p-3">
          <button onClick={() => setWebSearch(!webSearch)}
            className={`shrink-0 px-2 py-1 rounded text-[8px] font-mono font-bold tracking-wider transition-all ${
              webSearch ? 'text-edith-cyan bg-edith-cyan/10 border-edith-cyan/25' : 'text-white/20 border-white/5'
            }`}
            style={{ border: `1px solid ${webSearch ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.05)'}` }}
            title="Toggle web search grounding"
          >
            <Globe className="w-3 h-3 inline mr-1" />WEB
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask anything..."
            className="flex-1 bg-transparent text-sm font-mono text-white/80 placeholder:text-white/15 outline-none"
          />
          <button onClick={handleSend} disabled={loading || !input.trim()}
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
            style={{
              background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(191,0,255,0.15))',
              border: '1px solid rgba(0,212,255,0.3)',
            }}
          >
            <Send className="w-3.5 h-3.5 text-edith-cyan" />
          </button>
        </div>
      </GlowCard>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   6. MONITOR PANEL
   ═══════════════════════════════════════════════════════ */
function MonitorPanel() {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<string>('daily');
  const [watches, setWatches] = useState<MonitorWatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const loadWatches = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await monitorAPI.list();
      setWatches(data.data.watches || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadWatches(); }, [loadWatches]);

  const handleCreate = async () => {
    if (!url.trim()) return;
    setCreating(true);
    setError('');
    try {
      await monitorAPI.create({
        url: url.trim(),
        name: name.trim() || undefined,
        frequency: frequency as any,
      });
      setUrl('');
      setName('');
      setShowCreate(false);
      loadWatches();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    }
    setCreating(false);
  };

  const handleCheck = async (watchId: string) => {
    try {
      await monitorAPI.triggerCheck(watchId);
      loadWatches();
    } catch {}
  };

  const handleDelete = async (watchId: string) => {
    try {
      await monitorAPI.delete(watchId);
      loadWatches();
    } catch {}
  };

  return (
    <>
      {/* Create button / form */}
      {!showCreate ? (
        <button onClick={() => setShowCreate(true)}
          className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-mono font-bold tracking-wider text-edith-cyan/60 hover:text-edith-cyan transition-all"
          style={{ border: '1px solid rgba(0,212,255,0.15)' }}
        >
          <Plus className="w-3.5 h-3.5" />CREATE WATCH
        </button>
      ) : (
        <GlowCard className="mb-4">
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Eye className="w-5 h-5 text-edith-cyan/40 mt-1 shrink-0" />
              <div className="flex-1 space-y-2">
                <input value={url} onChange={(e) => setUrl(e.target.value)}
                  placeholder="URL to monitor (e.g. https://example.com)"
                  className="w-full bg-transparent text-sm font-mono text-white/80 placeholder:text-white/15 outline-none"
                />
                <input value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Optional name..."
                  className="w-full bg-transparent text-[11px] font-mono text-white/60 placeholder:text-white/15 outline-none py-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pl-8">
              <div className="flex items-center gap-1">
                {['hourly', 'daily', 'weekly'].map((f) => (
                  <button key={f} type="button" onClick={() => setFrequency(f)}
                    className={`px-2 py-1 rounded text-[8px] font-mono font-bold tracking-wider ${
                      frequency === f ? 'text-edith-cyan bg-edith-cyan/10 border-edith-cyan/25' : 'text-white/20 border-transparent'
                    }`}
                    style={{ border: `1px solid ${frequency === f ? 'rgba(0,212,255,0.2)' : 'transparent'}` }}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowCreate(false)} className="text-[9px] font-mono text-white/20 hover:text-white/40">
                  CANCEL
                </button>
                <button onClick={handleCreate} disabled={creating}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold tracking-wider disabled:opacity-40"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(191,0,255,0.15))',
                    border: '1px solid rgba(0,212,255,0.3)',
                    color: '#00d4ff',
                  }}
                >
                  {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                  CREATE
                </button>
              </div>
            </div>
          </div>
        </GlowCard>
      )}

      <ErrorBanner message={error} />
      {loading && <LoadingSpinner text="LOADING WATCHES..." />}

      {/* Watch list */}
      {watches.length > 0 && (
        <div className="space-y-3">
          {watches.map((w) => (
            <WatchCard key={w.watch_id} watch={w} onCheck={handleCheck} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {!loading && watches.length === 0 && !showCreate && (
        <EmptyState icon={Eye} title="MONITOR URLS" desc="Create watches to track URLs for changes. The system periodically checks and detects content differences." />
      )}
    </>
  );
}

function WatchCard({ watch, onCheck, onDelete }: {
  watch: MonitorWatch;
  onCheck: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  let hostname = '';
  try { hostname = new URL(watch.url).hostname; } catch {}

  return (
    <div className="group rounded-xl p-4 transition-all"
      style={{
        background: 'linear-gradient(135deg, rgba(14,14,30,0.7), rgba(20,20,42,0.5))',
        border: `1px solid ${watch.is_active ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.04)'}`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${watch.is_active ? 'bg-green-400 animate-pulse' : 'bg-white/10'}`} />
          <span className="text-sm font-display font-bold text-white/70">{watch.name || hostname}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-mono text-white/20 px-1.5 py-0.5 rounded bg-white/[0.03]">
            {watch.frequency?.toUpperCase()}
          </span>
          <button onClick={() => onCheck(watch.watch_id)}
            className="text-edith-cyan/30 hover:text-edith-cyan/70 transition-colors" title="Check now"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(watch.watch_id)}
            className="text-red-400/30 hover:text-red-400/70 transition-colors" title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <p className="text-[10px] font-mono text-edith-cyan/40 truncate mb-2">{watch.url}</p>
      <div className="flex items-center gap-4 text-[9px] font-mono text-white/15">
        <span>{watch.total_checks || 0} checks</span>
        <span>{watch.total_changes || 0} changes</span>
        {watch.last_checked && <span>Last: {new Date(watch.last_checked).toLocaleString()}</span>}
        {watch.next_check && <span>Next: {new Date(watch.next_check).toLocaleString()}</span>}
      </div>
    </div>
  );
}

/* ── Empty State ─────────────────────────────────────── */
function EmptyState({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="text-center py-16">
      <Icon className="w-10 h-10 text-edith-cyan/10 mx-auto mb-4" />
      <p className="text-sm font-display font-bold text-white/20 tracking-wider mb-2">{title}</p>
      <p className="text-[11px] font-mono text-white/10 max-w-md mx-auto">{desc}</p>
    </div>
  );
}
