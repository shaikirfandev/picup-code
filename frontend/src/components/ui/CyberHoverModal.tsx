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
import MatrixText from '@/components/ui/MatrixText';

interface CyberHoverModalProps {
  post: Post;
  cardRect: DOMRect | null;
  isVisible: boolean;
  onModalMouseEnter?: () => void;
  onModalMouseLeave?: () => void;
}

export default function CyberHoverModal({
  post,
  cardRect,
  isVisible,
  onModalMouseEnter,
  onModalMouseLeave,
}: CyberHoverModalProps) {
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
  const MODAL_W = 300;
  const MODAL_H = 380;
  const GAP = 28;

  const cardCenterX = cardRect.left + cardRect.width / 2;
  const goRight = cardCenterX < vw * 0.55;

  const modalLeft = goRight
    ? Math.min(cardRect.right + GAP, vw - MODAL_W - 16)
    : Math.max(cardRect.left - MODAL_W - GAP, 16);

  let modalTop = cardRect.top + cardRect.height / 2 - MODAL_H / 2;
  modalTop = Math.max(16, Math.min(modalTop, vh - MODAL_H - 16));

  if (modalLeft < 8 || modalLeft + MODAL_W > vw - 8) return null;

  // SVG connector endpoints
  const lineX1 = goRight ? cardRect.right + 2 : cardRect.left - 2;
  const lineY1 = cardRect.top + cardRect.height / 2;
  const lineX2 = goRight ? modalLeft + 2 : modalLeft + MODAL_W - 2;
  const lineY2 = modalTop + 70;

  const cpX = (lineX1 + lineX2) / 2;
  const cpY = Math.min(lineY1, lineY2) - 30;
  const pathD = `M ${lineX1} ${lineY1} Q ${cpX} ${cpY} ${lineX2} ${lineY2}`;

  const isVideo = post.mediaType === 'video' && post.video?.url;
  const thumbUrl = isVideo ? (post.video?.thumbnailUrl || post.image?.url) : post.image?.url;

  const filterId = `cyber-glow-${post._id}`;
  const gradId = `line-grad-${post._id}`;

  // Invisible bridge hitbox between card edge and modal so mouse can travel
  const bridgeL = goRight ? cardRect.right : modalLeft + MODAL_W;
  const bridgeR = goRight ? modalLeft : cardRect.left;
  const bridgeT = Math.min(cardRect.top, modalTop) - 20;
  const bridgeB = Math.max(cardRect.bottom, modalTop + MODAL_H) + 20;

  const content = (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none' }}>

      {/* Invisible bridge so cursor can travel from card to modal */}
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

      {/* SVG Connector Line */}
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

        {/* Glow under-line */}
        <path d={pathD} fill="none" stroke="rgba(0,240,255,0.15)" strokeWidth="6"
          filter={`url(#${filterId})`}
          className={`transition-all duration-500 ${animIn ? 'opacity-100' : 'opacity-0'}`} />

        {/* Main dotted line */}
        <path d={pathD} fill="none" stroke={`url(#${gradId})`}
          strokeWidth="1.5" strokeDasharray="3 5" strokeLinecap="round"
          filter={`url(#${filterId})`}
          className={`transition-all duration-500 ${animIn ? 'opacity-100' : 'opacity-0'}`}
          style={{ animation: animIn ? 'dashFlow 1.2s linear infinite' : 'none' }} />

        {/* Start endpoint */}
        <circle cx={lineX1} cy={lineY1} r={animIn ? 4 : 0} fill="var(--surface)"
          stroke="rgba(0,240,255,0.8)" strokeWidth="1.5"
          filter={`url(#${filterId})`} style={{ transition: 'r 0.3s ease' }} />
        <circle cx={lineX1} cy={lineY1} r={animIn ? 2 : 0}
          fill="rgba(0,240,255,0.9)" style={{ transition: 'r 0.3s ease 0.1s' }} />

        {/* End endpoint */}
        <circle cx={lineX2} cy={lineY2} r={animIn ? 4 : 0} fill="var(--surface)"
          stroke="rgba(0,240,255,0.8)" strokeWidth="1.5"
          filter={`url(#${filterId})`} style={{ transition: 'r 0.3s ease 0.15s' }} />
        <circle cx={lineX2} cy={lineY2} r={animIn ? 2 : 0}
          fill="rgba(0,240,255,0.9)" style={{ transition: 'r 0.3s ease 0.2s' }} />

        {/* Traveling data packet */}
        {animIn && (
          <circle r="2.5" fill="#00f0ff" filter={`url(#${filterId})`}>
            <animateMotion dur="2s" repeatCount="indefinite" path={pathD} />
          </circle>
        )}
      </svg>

      {/* Modal Panel — interactive */}
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
            background: 'var(--dropdown-bg)',
            backdropFilter: 'blur(30px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(30px) saturate(1.4)',
            border: '1px solid var(--border-strong)',
            boxShadow: 'var(--dropdown-shadow)',
          }}
        >
          {/* Image section */}
          <div className="relative h-40 overflow-hidden group/media">
            {thumbUrl && (
              <img src={thumbUrl} alt={post.title || ''}
                loading="eager" decoding="async"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/media:scale-105" />
            )}
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 30%, rgba(0,0,0,0.5) 100%)' }} />
            {/* Scan line */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute left-0 right-0 h-[1px] animate-scan-line"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.5), transparent)' }} />
            </div>
            {/* Badges */}
            <div className="absolute top-2.5 left-2.5 flex gap-1.5 z-10">
              {isVideo && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-600/80 backdrop-blur-sm text-white text-[9px] font-mono font-bold border border-blue-500/40">
                  <Play className="w-2 h-2" fill="white" />VID
                </span>
              )}
              {post.isAiGenerated && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-600/80 backdrop-blur-sm text-white text-[9px] font-mono font-bold border border-purple-500/40">
                  <Sparkles className="w-2 h-2" />AI
                </span>
              )}
            </div>
            {/* Duration */}
            {isVideo && post.video?.duration && (
              <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-cyan-400/20 text-cyan-400 text-[9px] font-mono z-10">
                <Clock className="w-2 h-2" />{Math.round(post.video.duration)}s
              </div>
            )}
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-8 h-[1px] bg-gradient-to-r from-cyan-400/50 to-transparent z-10" />
            <div className="absolute top-0 left-0 h-8 w-[1px] bg-gradient-to-b from-cyan-400/50 to-transparent z-10" />
            <div className="absolute top-0 right-0 w-8 h-[1px] bg-gradient-to-l from-purple-500/50 to-transparent z-10" />
            <div className="absolute top-0 right-0 h-8 w-[1px] bg-gradient-to-b from-purple-500/50 to-transparent z-10" />
          </div>

          {/* Content */}
          <div className="p-3.5 space-y-2.5">
            <Link href={`/post/${post._id}`}>
              <h3 className="text-[13px] font-semibold text-cyan-400 leading-snug line-clamp-2 font-mono hover:text-white transition-colors cursor-pointer"
                style={{ textShadow: '0 0 10px rgba(0,240,255,0.4)' }}>
                <MatrixText text={post.title} trigger={animIn} speed={18} scramblePasses={2} />
              </h3>
            </Link>

            {post.description && (
              <p className="text-[10px] line-clamp-2 leading-relaxed font-mono" style={{ color: 'var(--text-tertiary)' }}>
                <MatrixText text={post.description.slice(0, 80)} trigger={animIn} speed={12} scramblePasses={1} />
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-3 text-[9px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
              <span className="flex items-center gap-1"><Heart className="w-2.5 h-2.5 text-pink-500/50" /><MatrixText text={formatNumber(post.likesCount)} trigger={animIn} speed={30} scramblePasses={3} /></span>
              <span className="flex items-center gap-1"><Eye className="w-2.5 h-2.5" /><MatrixText text={formatNumber(post.viewsCount || 0)} trigger={animIn} speed={30} scramblePasses={3} /></span>
              <span className="flex items-center gap-1"><Bookmark className="w-2.5 h-2.5" /><MatrixText text={formatNumber(post.savesCount || 0)} trigger={animIn} speed={30} scramblePasses={3} /></span>
              <span className="ml-auto text-emerald-400/30"><MatrixText text={timeAgo(post.createdAt)} trigger={animIn} speed={20} scramblePasses={2} /></span>
            </div>

            {/* Author */}
            <Link href={`/profile/${post.author?.username}`}
              className="flex items-center gap-2 pt-2 hover:opacity-80 transition-opacity" style={{ borderTop: '1px solid var(--border)' }}>
              {post.author?.avatar ? (
                <img src={post.author.avatar} alt=""
                  width={20} height={20} loading="lazy" decoding="async"
                  className="w-5 h-5 rounded-full object-cover" style={{ boxShadow: '0 0 0 1px var(--border)' }} />
              ) : (
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-cyan-400 font-mono"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  {post.author?.displayName?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-medium block truncate font-mono" style={{ color: 'var(--text-secondary)' }}>
                  <MatrixText text={post.author?.displayName || ''} trigger={animIn} speed={22} scramblePasses={2} />
                </span>
                <span className="text-[9px] text-emerald-400/40 font-mono">
                  <MatrixText text={`@${post.author?.username || ''}`} trigger={animIn} speed={18} scramblePasses={1} />
                </span>
              </div>
            </Link>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {post.tags.slice(0, 4).map((tag, i) => (
                  <span key={tag}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-mono text-cyan-400/40 border border-cyan-400/[0.07]"
                    style={{ background: 'rgba(0,240,255,0.02)' }}>
                    <Tag className="w-2 h-2" /><MatrixText text={tag} trigger={animIn} speed={15 + i * 5} scramblePasses={1} />
                  </span>
                ))}
                {post.tags.length > 4 && (
                  <span className="text-[8px] font-mono self-center" style={{ color: 'var(--text-tertiary)' }}>+{post.tags.length - 4}</span>
                )}
              </div>
            )}

            {/* Price / Product */}
            {(post.price?.amount || post.productUrl) && (
              <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                {post.price?.amount && (
                  <span className="text-sm font-bold font-mono text-accent">
                    <MatrixText text={formatPrice(post.price.amount)} trigger={animIn} speed={25} scramblePasses={3} />
                  </span>
                )}
                {post.productUrl && (
                  <a href={post.productUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[8px] font-mono text-cyan-400/50 hover:text-cyan-400 transition-colors">
                    <ExternalLink className="w-2.5 h-2.5" /><MatrixText text="VISIT" trigger={animIn} speed={40} scramblePasses={4} />
                  </a>
                )}
              </div>
            )}

            {/* Category */}
            {post.category && (
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider border"
                  style={{
                    backgroundColor: `${post.category.color}22`,
                    borderColor: `${post.category.color}44`,
                    color: post.category.color,
                  }}>
                  {post.category.icon} <MatrixText text={post.category.name} trigger={animIn} speed={20} scramblePasses={2} />
                </span>
              </div>
            )}
          </div>

          {/* Bottom accent */}
          <div className="h-[2px]"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.5), rgba(191,0,255,0.5), transparent)' }} />
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
