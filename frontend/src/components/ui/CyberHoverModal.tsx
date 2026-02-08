'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Post } from '@/types';
import { formatPrice, formatNumber, timeAgo } from '@/lib/utils';
import {
  Heart, Eye, Sparkles, Tag, ExternalLink, Play, Clock,
  Bookmark, Zap,
} from 'lucide-react';

interface CyberHoverModalProps {
  post: Post;
  cardRect: DOMRect | null;
  isVisible: boolean;
}

export default function CyberHoverModal({ post, cardRect, isVisible }: CyberHoverModalProps) {
  const [mounted, setMounted] = useState(false);
  const [animIn, setAnimIn] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isVisible) {
      const t = setTimeout(() => setAnimIn(true), 30);
      return () => clearTimeout(t);
    } else {
      setAnimIn(false);
    }
  }, [isVisible]);

  // Don't render on small screens
  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 900;

  if (!mounted || !cardRect || !isVisible || isSmallScreen) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const MODAL_W = 300;
  const MODAL_H = 380;
  const GAP = 28;

  // Prefer right side, fallback left
  const cardCenterX = cardRect.left + cardRect.width / 2;
  const goRight = cardCenterX < vw * 0.55;

  const modalLeft = goRight
    ? Math.min(cardRect.right + GAP, vw - MODAL_W - 16)
    : Math.max(cardRect.left - MODAL_W - GAP, 16);

  // Vertically center modal relative to card, clamp to viewport
  let modalTop = cardRect.top + cardRect.height / 2 - MODAL_H / 2;
  modalTop = Math.max(16, Math.min(modalTop, vh - MODAL_H - 16));

  // Off-screen safety
  if (modalLeft < 8 || modalLeft + MODAL_W > vw - 8) return null;

  // ── SVG line endpoints ────────────────────────────────────
  const lineX1 = goRight ? cardRect.right + 2 : cardRect.left - 2;
  const lineY1 = cardRect.top + cardRect.height / 2;
  const lineX2 = goRight ? modalLeft + 2 : modalLeft + MODAL_W - 2;
  const lineY2 = modalTop + 70;

  // Quadratic bezier control point for a subtle curve
  const cpX = (lineX1 + lineX2) / 2;
  const cpY = Math.min(lineY1, lineY2) - 30;
  const pathD = `M ${lineX1} ${lineY1} Q ${cpX} ${cpY} ${lineX2} ${lineY2}`;

  const isVideo = post.mediaType === 'video' && post.video?.url;
  const thumbUrl = isVideo
    ? (post.video?.thumbnailUrl || post.image?.url)
    : post.image?.url;

  // Unique filter/gradient IDs (avoids collisions when multiple modals exist)
  const filterId = `cyber-glow-${post._id}`;
  const gradId  = `line-grad-${post._id}`;

  const content = (
    <div className="pointer-events-none" style={{ position: 'fixed', inset: 0, zIndex: 9998 }}>

      {/* ── SVG Connector Line ─────────────────────────────── */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <filter id={filterId}>
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="rgba(0,240,255,0.7)" />
            <stop offset="50%"  stopColor="rgba(191,0,255,0.5)" />
            <stop offset="100%" stopColor="rgba(0,240,255,0.7)" />
          </linearGradient>
        </defs>

        {/* Glow under-line */}
        <path
          d={pathD}
          fill="none"
          stroke="rgba(0,240,255,0.15)"
          strokeWidth="6"
          filter={`url(#${filterId})`}
          className={`transition-all duration-500 ${animIn ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Main dotted line */}
        <path
          d={pathD}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="1.5"
          strokeDasharray="3 5"
          strokeLinecap="round"
          filter={`url(#${filterId})`}
          className={`transition-all duration-500 ${animIn ? 'opacity-100' : 'opacity-0'}`}
          style={{ animation: animIn ? 'dashFlow 1.2s linear infinite' : 'none' }}
        />

        {/* Start endpoint — card side */}
        <circle
          cx={lineX1} cy={lineY1} r={animIn ? 4 : 0}
          fill="#0a0a0f"
          stroke="rgba(0,240,255,0.8)"
          strokeWidth="1.5"
          filter={`url(#${filterId})`}
          style={{ transition: 'r 0.3s ease' }}
        />
        <circle
          cx={lineX1} cy={lineY1} r={animIn ? 2 : 0}
          fill="rgba(0,240,255,0.9)"
          style={{ transition: 'r 0.3s ease 0.1s' }}
        />

        {/* End endpoint — modal side */}
        <circle
          cx={lineX2} cy={lineY2} r={animIn ? 4 : 0}
          fill="#0a0a0f"
          stroke="rgba(0,240,255,0.8)"
          strokeWidth="1.5"
          filter={`url(#${filterId})`}
          style={{ transition: 'r 0.3s ease 0.15s' }}
        />
        <circle
          cx={lineX2} cy={lineY2} r={animIn ? 2 : 0}
          fill="rgba(0,240,255,0.9)"
          style={{ transition: 'r 0.3s ease 0.2s' }}
        />

        {/* Traveling data packet */}
        {animIn && (
          <circle r="2.5" fill="#00f0ff" filter={`url(#${filterId})`}>
            <animateMotion dur="2s" repeatCount="indefinite" path={pathD} />
          </circle>
        )}
      </svg>

      {/* ── Modal Panel ──────────────────────────────────────── */}
      <div
        ref={modalRef}
        className={`absolute transition-all duration-300 ease-out ${
          animIn
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-2'
        }`}
        style={{
          left: modalLeft,
          top: modalTop,
          width: MODAL_W,
          transformOrigin: goRight ? 'left center' : 'right center',
        }}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(14,14,30,0.95), rgba(20,20,42,0.92))',
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
          {/* Image / Video thumbnail */}
          <div className="relative h-40 overflow-hidden">
            {thumbUrl && (
              <img
                src={thumbUrl}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            )}
            {/* Overlay gradient */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(10,10,15,0.1) 0%, transparent 30%, rgba(14,14,30,0.95) 100%)',
              }}
            />
            {/* Scan line */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div
                className="absolute left-0 right-0 h-[1px] animate-scan-line"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(0,240,255,0.5), transparent)',
                }}
              />
            </div>
            {/* Badges */}
            <div className="absolute top-2.5 left-2.5 flex gap-1.5 z-10">
              {isVideo && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyber-blue/80 backdrop-blur-sm text-white text-[9px] font-mono font-bold border border-cyber-blue/40">
                  <Play className="w-2 h-2" fill="white" />VID
                </span>
              )}
              {post.isAiGenerated && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyber-purple/80 backdrop-blur-sm text-white text-[9px] font-mono font-bold border border-cyber-purple/40">
                  <Sparkles className="w-2 h-2" />AI
                </span>
              )}
            </div>
            {/* Duration badge */}
            {isVideo && post.video?.duration && (
              <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-cyber-glow/20 text-cyber-glow text-[9px] font-mono z-10">
                <Clock className="w-2 h-2" />
                {Math.round(post.video.duration)}s
              </div>
            )}
            {/* Corner accent lines */}
            <div className="absolute top-0 left-0 w-8 h-[1px] bg-gradient-to-r from-cyber-glow/50 to-transparent z-10" />
            <div className="absolute top-0 left-0 h-8 w-[1px] bg-gradient-to-b from-cyber-glow/50 to-transparent z-10" />
            <div className="absolute top-0 right-0 w-8 h-[1px] bg-gradient-to-l from-cyber-purple/50 to-transparent z-10" />
            <div className="absolute top-0 right-0 h-8 w-[1px] bg-gradient-to-b from-cyber-purple/50 to-transparent z-10" />
          </div>

          {/* Content */}
          <div className="p-3.5 space-y-2.5">
            {/* Title */}
            <h3
              className="text-[13px] font-semibold text-white leading-snug line-clamp-2 font-mono"
              style={{ textShadow: '0 0 10px rgba(0,240,255,0.3)' }}
            >
              {post.title}
            </h3>

            {post.description && (
              <p className="text-[10px] text-white/35 line-clamp-2 leading-relaxed">
                {post.description}
              </p>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-3 text-[9px] font-mono text-white/25">
              <span className="flex items-center gap-1">
                <Heart className="w-2.5 h-2.5 text-cyber-pink/50" />
                {formatNumber(post.likesCount)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-2.5 h-2.5" />
                {formatNumber(post.viewsCount || 0)}
              </span>
              <span className="flex items-center gap-1">
                <Bookmark className="w-2.5 h-2.5" />
                {formatNumber(post.savesCount || 0)}
              </span>
              <span className="ml-auto">{timeAgo(post.createdAt)}</span>
            </div>

            {/* Author */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
              {post.author?.avatar ? (
                <img
                  src={post.author.avatar}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover ring-1 ring-cyber-glow/20"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-cyber-card border border-cyber-glow/15 flex items-center justify-center text-[8px] font-bold text-cyber-glow font-mono">
                  {post.author?.displayName?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-medium text-white/60 block truncate">
                  {post.author?.displayName}
                </span>
                <span className="text-[9px] text-cyber-neon/40 font-mono">
                  @{post.author?.username}
                </span>
              </div>
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {post.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-mono text-cyber-glow/40 border border-cyber-glow/[0.07]"
                    style={{ background: 'rgba(0,240,255,0.02)' }}
                  >
                    <Tag className="w-2 h-2" />{tag}
                  </span>
                ))}
                {post.tags.length > 4 && (
                  <span className="text-[8px] font-mono text-white/20 self-center">
                    +{post.tags.length - 4}
                  </span>
                )}
              </div>
            )}

            {/* Price / Product */}
            {(post.price?.amount || post.productUrl) && (
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                {post.price?.amount && (
                  <span
                    className="text-sm font-bold font-mono"
                    style={{ color: '#00f0ff', textShadow: '0 0 8px rgba(0,240,255,0.5)' }}
                  >
                    {formatPrice(post.price.amount)}
                  </span>
                )}
                {post.productUrl && (
                  <span className="flex items-center gap-1 text-[8px] font-mono text-cyber-glow/30">
                    <ExternalLink className="w-2.5 h-2.5" />PRODUCT_LINK
                  </span>
                )}
              </div>
            )}

            {/* Category */}
            {post.category && (
              <div className="flex items-center gap-1.5">
                <span
                  className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider border"
                  style={{
                    backgroundColor: `${post.category.color}22`,
                    borderColor: `${post.category.color}44`,
                    color: post.category.color,
                  }}
                >
                  {post.category.icon} {post.category.name}
                </span>
              </div>
            )}
          </div>

          {/* Bottom accent bar */}
          <div
            className="h-[2px]"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(0,240,255,0.5), rgba(191,0,255,0.5), transparent)',
            }}
          />
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
