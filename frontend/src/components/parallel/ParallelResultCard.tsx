'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ExternalLink, Shield, BarChart3, Globe, Hash,
  FileText, ChevronDown, ChevronUp, Copy, Check,
  Clock, Bookmark, Sparkles,
} from 'lucide-react';
import type { SearchChunk } from '@/types/parallel';
import ParallelHoverModal from './ParallelHoverModal';
import MatrixText from '@/components/ui/MatrixText';

interface Props {
  chunk: SearchChunk;
  index: number;
}

export default function ParallelResultCard({ chunk, index }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);
  const dismissTimer = useRef<NodeJS.Timeout | null>(null);

  const confidenceColor =
    chunk.confidenceScore >= 0.8 ? 'text-green-400' :
    chunk.confidenceScore >= 0.5 ? 'text-yellow-400' : 'text-red-400';

  const trustColor =
    chunk.trustScore >= 0.7 ? 'text-green-400' :
    chunk.trustScore >= 0.4 ? 'text-yellow-400' : 'text-red-400';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(chunk.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Hover modal logic (matching PostCard pattern) ── */
  const clearTimers = useCallback(() => {
    if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null; }
    if (dismissTimer.current) { clearTimeout(dismissTimer.current); dismissTimer.current = null; }
  }, []);

  const handleMouseEnter = useCallback(() => {
    clearTimers();
    setIsHovering(true);
    hoverTimer.current = setTimeout(() => setShowModal(true), 600);
  }, [clearTimers]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null; }
    dismissTimer.current = setTimeout(() => setShowModal(false), 300);
  }, []);

  const handleModalMouseEnter = useCallback(() => {
    if (dismissTimer.current) { clearTimeout(dismissTimer.current); dismissTimer.current = null; }
  }, []);

  const handleModalMouseLeave = useCallback(() => {
    setIsHovering(false);
    dismissTimer.current = setTimeout(() => setShowModal(false), 200);
  }, []);

  const cardRect = cardRef.current?.getBoundingClientRect() || null;

  return (
    <>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.35, ease: 'easeOut' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="group rounded-xl transition-all duration-300 cursor-pointer"
        style={{
          background: isHovering
            ? 'linear-gradient(135deg, rgba(14,14,30,0.95), rgba(25,25,50,0.85))'
            : 'linear-gradient(135deg, rgba(14,14,30,0.7), rgba(20,20,42,0.5))',
          border: `1px solid ${isHovering ? 'rgba(0,212,255,0.2)' : 'rgba(0,212,255,0.06)'}`,
          boxShadow: isHovering
            ? '0 8px 40px rgba(0,0,0,0.3), 0 0 30px rgba(0,212,255,0.05)'
            : '0 2px 15px rgba(0,0,0,0.2)',
        }}
      >
        <div className="p-4">
          {/* ── Top row: index + source + scores ──── */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Rank badge */}
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-mono font-bold"
                style={{
                  background: index < 3 ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${index < 3 ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.05)'}`,
                  color: index < 3 ? '#00d4ff' : 'rgba(255,255,255,0.25)',
                }}
              >
                {index + 1}
              </div>

              {/* Source info */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  {chunk.source.favicon && (
                    <img src={chunk.source.favicon} alt="" className="w-4 h-4 rounded" />
                  )}
                  <span className="text-[10px] font-mono text-edith-cyan/50 truncate">
                    {chunk.source.domain || chunk.source.name}
                  </span>
                </div>
                <h3 className="text-sm font-display font-bold text-white/70 group-hover:text-white/90 transition-colors truncate leading-tight">
                  <MatrixText text={chunk.title || 'Untitled'} animate={isHovering} />
                </h3>
              </div>
            </div>

            {/* Scores */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-center" title="Confidence Score">
                <div className={`text-[11px] font-mono font-bold ${confidenceColor}`}>
                  {Math.round(chunk.confidenceScore * 100)}%
                </div>
                <div className="text-[7px] font-mono text-white/15 tracking-wider">CONF</div>
              </div>
              <div className="w-[1px] h-6 bg-white/5" />
              <div className="text-center" title="Trust Score">
                <div className={`text-[11px] font-mono font-bold ${trustColor}`}>
                  {Math.round(chunk.trustScore * 100)}%
                </div>
                <div className="text-[7px] font-mono text-white/15 tracking-wider">TRUST</div>
              </div>
              <div className="w-[1px] h-6 bg-white/5" />
              <div className="text-center" title="Relevance Score">
                <div className="text-[11px] font-mono font-bold text-purple-400">
                  {chunk.relevanceScore.toFixed(4)}
                </div>
                <div className="text-[7px] font-mono text-white/15 tracking-wider">SCORE</div>
              </div>
            </div>
          </div>

          {/* ── Content snippet / full ───────────── */}
          <div className="ml-10">
            <p className={`text-[12px] font-mono text-white/45 leading-relaxed ${!isExpanded ? 'line-clamp-3' : ''}`}>
              {chunk.content}
            </p>

            {chunk.content.length > 250 && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                className="flex items-center gap-1 mt-2 text-[9px] font-mono text-edith-cyan/30 hover:text-edith-cyan/60 transition-colors"
              >
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {isExpanded ? 'COLLAPSE' : 'EXPAND CONTENT'}
              </button>
            )}

            {/* ── Tags + meta ────────────────────── */}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              {chunk.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="flex items-center gap-0.5 text-[9px] font-mono text-white/20">
                  <Hash className="w-2.5 h-2.5" />{tag}
                </span>
              ))}
              {chunk.category && (
                <span className="text-[9px] font-mono text-purple-400/40 flex items-center gap-0.5">
                  <FileText className="w-2.5 h-2.5" />{chunk.category}
                </span>
              )}
              <span className="text-[9px] font-mono text-white/15">
                {chunk.wordCount} words
              </span>
              <span className="text-[9px] font-mono text-white/15">
                {chunk.language.toUpperCase()}
              </span>
            </div>

            {/* ── Action buttons ──────────────────── */}
            <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {chunk.source.url && (
                <a href={chunk.source.url} target="_blank" rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono text-edith-cyan/30 hover:text-edith-cyan/60 transition-colors"
                  style={{ border: '1px solid rgba(0,212,255,0.08)' }}
                >
                  <ExternalLink className="w-3 h-3" />SOURCE
                </a>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono text-white/20 hover:text-white/40 transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.05)' }}
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'COPIED' : 'COPY'}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom accent */}
        <div className="h-[1px] opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'linear-gradient(90deg, transparent 5%, rgba(0,212,255,0.15) 30%, rgba(191,0,255,0.1) 70%, transparent 95%)' }}
        />
      </motion.div>

      {/* ── Hover Modal ──────────────────────────── */}
      <ParallelHoverModal
        chunk={chunk}
        cardRect={cardRect}
        isVisible={showModal}
        onModalMouseEnter={handleModalMouseEnter}
        onModalMouseLeave={handleModalMouseLeave}
      />
    </>
  );
}
