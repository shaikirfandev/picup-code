'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Shield, BarChart3, Globe, FileText, Clock, Hash,
  ExternalLink, Sparkles, Eye, Database, Zap,
} from 'lucide-react';
import type { SearchChunk } from '@/types/parallel';
import MatrixText from '@/components/ui/MatrixText';

interface Props {
  chunk: SearchChunk;
  cardRect: DOMRect | null;
  isVisible: boolean;
  onModalMouseEnter?: () => void;
  onModalMouseLeave?: () => void;
}

export default function ParallelHoverModal({
  chunk,
  cardRect,
  isVisible,
  onModalMouseEnter,
  onModalMouseLeave,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [animIn, setAnimIn] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isVisible) {
      const t = setTimeout(() => setAnimIn(true), 30);
      return () => clearTimeout(t);
    } else {
      setAnimIn(false);
    }
  }, [isVisible]);

  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 900;
  if (!mounted || !cardRect || !isVisible || isSmallScreen) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const MODAL_W = 340;
  const MODAL_H = 440;
  const GAP = 24;

  const cardCenterX = cardRect.left + cardRect.width / 2;
  const goRight = cardCenterX < vw * 0.55;

  const modalLeft = goRight
    ? Math.min(cardRect.right + GAP, vw - MODAL_W - 16)
    : Math.max(cardRect.left - MODAL_W - GAP, 16);

  let modalTop = cardRect.top + cardRect.height / 2 - MODAL_H / 2;
  modalTop = Math.max(16, Math.min(modalTop, vh - MODAL_H - 16));

  if (modalLeft < 8 || modalLeft + MODAL_W > vw - 8) return null;

  // SVG connector
  const lineX1 = goRight ? cardRect.right + 2 : cardRect.left - 2;
  const lineY1 = cardRect.top + cardRect.height / 2;
  const lineX2 = goRight ? modalLeft + 2 : modalLeft + MODAL_W - 2;
  const lineY2 = modalTop + 60;
  const cpX = (lineX1 + lineX2) / 2;
  const cpY = Math.min(lineY1, lineY2) - 30;
  const pathD = `M ${lineX1} ${lineY1} Q ${cpX} ${cpY} ${lineX2} ${lineY2}`;

  const filterId = `parallel-glow-${chunk.id}`;
  const gradId = `parallel-grad-${chunk.id}`;

  // Bridge hitbox
  const bridgeL = goRight ? cardRect.right : modalLeft + MODAL_W;
  const bridgeR = goRight ? modalLeft : cardRect.left;
  const bridgeT = Math.min(cardRect.top, modalTop) - 20;
  const bridgeB = Math.max(cardRect.bottom, modalTop + MODAL_H) + 20;

  const confidenceColor =
    chunk.confidenceScore >= 0.8 ? '#4ade80' :
    chunk.confidenceScore >= 0.5 ? '#facc15' : '#f87171';

  const trustColor =
    chunk.trustScore >= 0.7 ? '#4ade80' :
    chunk.trustScore >= 0.4 ? '#facc15' : '#f87171';

  const content = (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none' }}>

      {/* Invisible bridge */}
      <div
        onMouseEnter={onModalMouseEnter}
        onMouseLeave={onModalMouseLeave}
        style={{
          position: 'absolute',
          left: Math.min(bridgeL, bridgeR) - 6,
          top: bridgeT,
          width: Math.abs(bridgeR - bridgeL) + 12,
          height: bridgeB - bridgeT,
          pointerEvents: 'auto',
          zIndex: 9997,
        }}
      />

      {/* SVG Connector */}
      <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible', pointerEvents: 'none' }}>
        <defs>
          <filter id={filterId}>
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0,240,255,0.7)" />
            <stop offset="50%" stopColor="rgba(191,0,255,0.5)" />
            <stop offset="100%" stopColor="rgba(0,240,255,0.7)" />
          </linearGradient>
        </defs>

        <path d={pathD} fill="none" stroke="rgba(0,240,255,0.12)" strokeWidth="6"
          filter={`url(#${filterId})`}
          className={`transition-all duration-500 ${animIn ? 'opacity-100' : 'opacity-0'}`} />

        <path d={pathD} fill="none" stroke={`url(#${gradId})`}
          strokeWidth="1.5" strokeDasharray="3 5" strokeLinecap="round"
          filter={`url(#${filterId})`}
          className={`transition-all duration-500 ${animIn ? 'opacity-100' : 'opacity-0'}`}
          style={{ animation: animIn ? 'dashFlow 1.2s linear infinite' : 'none' }} />

        <circle cx={lineX1} cy={lineY1} r={animIn ? 4 : 0} fill="#0a0a0f"
          stroke="rgba(0,240,255,0.8)" strokeWidth="1.5"
          filter={`url(#${filterId})`} style={{ transition: 'r 0.3s ease' }} />
        <circle cx={lineX1} cy={lineY1} r={animIn ? 2 : 0}
          fill="rgba(0,240,255,0.9)" style={{ transition: 'r 0.3s ease 0.1s' }} />

        <circle cx={lineX2} cy={lineY2} r={animIn ? 4 : 0} fill="#0a0a0f"
          stroke="rgba(0,240,255,0.8)" strokeWidth="1.5"
          filter={`url(#${filterId})`} style={{ transition: 'r 0.3s ease 0.15s' }} />
        <circle cx={lineX2} cy={lineY2} r={animIn ? 2 : 0}
          fill="rgba(0,240,255,0.9)" style={{ transition: 'r 0.3s ease 0.2s' }} />

        {animIn && (
          <circle r="2.5" fill="#00f0ff" filter={`url(#${filterId})`}>
            <animateMotion dur="2s" repeatCount="indefinite" path={pathD} />
          </circle>
        )}
      </svg>

      {/* ── Modal Panel ──────────────────────────── */}
      <div
        ref={modalRef}
        onMouseEnter={onModalMouseEnter}
        onMouseLeave={onModalMouseLeave}
        className={`absolute transition-all duration-300 ease-out ${
          animIn ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'
        }`}
        style={{
          left: modalLeft,
          top: modalTop,
          width: MODAL_W,
          transformOrigin: goRight ? 'left center' : 'right center',
          pointerEvents: 'auto',
        }}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(14,14,30,0.97), rgba(20,20,42,0.94))',
            backdropFilter: 'blur(30px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(30px) saturate(1.4)',
            border: '1px solid rgba(0,240,255,0.18)',
            boxShadow: `
              0 0 0 1px rgba(0,240,255,0.08) inset,
              0 20px 60px rgba(0,0,0,0.6),
              0 0 40px rgba(0,240,255,0.08),
              0 0 80px rgba(191,0,255,0.04)
            `,
          }}
        >
          {/* Header with source info */}
          <div className="p-4 relative overflow-hidden"
            style={{ borderBottom: '1px solid rgba(0,240,255,0.08)' }}
          >
            {/* Scan line */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute left-0 right-0 h-[1px] animate-scan-line"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.4), transparent)' }} />
            </div>

            <div className="flex items-center gap-2 mb-2">
              {chunk.source.favicon && (
                <img src={chunk.source.favicon} alt="" className="w-5 h-5 rounded" />
              )}
              <span className="text-[10px] font-mono text-edith-cyan/40 truncate">
                <MatrixText text={chunk.source.domain || chunk.source.name} animate={animIn} />
              </span>
            </div>
            <h3 className="text-[13px] font-display font-bold text-white/80 leading-tight mb-1">
              <MatrixText text={chunk.title || 'Untitled Source'} animate={animIn} />
            </h3>
            {chunk.citation.author && (
              <p className="text-[10px] font-mono text-white/25">
                by <MatrixText text={chunk.citation.author} animate={animIn} />
              </p>
            )}
          </div>

          {/* Score gauges */}
          <div className="grid grid-cols-3 gap-0 px-2 py-3"
            style={{ borderBottom: '1px solid rgba(0,240,255,0.06)' }}
          >
            <ScoreGauge label="CONFIDENCE" value={chunk.confidenceScore} color={confidenceColor} animate={animIn} />
            <ScoreGauge label="TRUST" value={chunk.trustScore} color={trustColor} animate={animIn} />
            <ScoreGauge label="RELEVANCE" value={Math.min(1, chunk.relevanceScore * 100)} color="#c084fc" animate={animIn} />
          </div>

          {/* Content preview */}
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(0,240,255,0.04)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <FileText className="w-3 h-3 text-edith-cyan/30" />
              <span className="text-[9px] font-mono text-white/20 tracking-wider">CONTENT PREVIEW</span>
            </div>
            <p className="text-[11px] font-mono text-white/40 leading-relaxed line-clamp-5">
              {chunk.content}
            </p>
          </div>

          {/* Metadata */}
          <div className="px-4 py-3 space-y-2" style={{ borderBottom: '1px solid rgba(0,240,255,0.04)' }}>
            {chunk.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Hash className="w-3 h-3 text-edith-cyan/25 shrink-0" />
                {chunk.tags.slice(0, 5).map((tag) => (
                  <span key={tag} className="px-1.5 py-0.5 rounded text-[8px] font-mono text-edith-cyan/30"
                    style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.08)' }}
                  >
                    <MatrixText text={tag} animate={animIn} />
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 text-[9px] font-mono text-white/15">
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3" />{chunk.wordCount} words
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" />{chunk.language.toUpperCase()}
              </span>
              {chunk.contentType !== 'text' && (
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />{chunk.contentType}
                </span>
              )}
            </div>
          </div>

          {/* Source link */}
          {chunk.source.url && (
            <a href={chunk.source.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-mono text-edith-cyan/30 hover:text-edith-cyan/60 transition-colors"
              style={{ background: 'rgba(0,0,0,0.1)' }}
            >
              <ExternalLink className="w-3 h-3" />
              <span className="truncate">{chunk.source.url}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

/* ── Score Gauge Component ───────────────────────────── */
function ScoreGauge({ label, value, color, animate }: { label: string; value: number; color: string; animate: boolean }) {
  const pct = Math.round(value * 100);
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * pct) / 100;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 -rotate-90">
          <circle cx="24" cy="24" r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
          <circle cx="24" cy="24" r={radius} fill="none" stroke={color} strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animate ? strokeDashoffset : circumference}
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-mono font-bold" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <span className="text-[7px] font-mono text-white/20 tracking-wider mt-1">{label}</span>
    </div>
  );
}
