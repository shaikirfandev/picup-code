'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Post } from '@/types';
import { formatPrice, formatNumber, timeAgo } from '@/lib/utils';
import {
  Heart, Eye, Sparkles, Tag, ExternalLink, Play, Clock,
  Bookmark, Shield, Crosshair, Radio, Cpu, Activity,
  User as UserIcon,
} from 'lucide-react';

/* ───────────────────────────────────────────
   StarkHoverModal  v2
   • 3D tilt on mouse-move
   • Fully customisable color via `colorTheme` prop
   ─────────────────────────────────────────── */

/* ── Color themes ── */
export type ModalColorTheme =
  | 'stark'      // orange – Tony Stark
  | 'jarvis'     // cyan – J.A.R.V.I.S
  | 'ultron'     // red – Ultron
  | 'wakanda'    // purple – Wakanda
  | 'hulk'       // green – Hulk
  | 'friday'     // blue – F.R.I.D.A.Y
  | { r: number; g: number; b: number }; // custom RGB

interface ThemeColors {
  rgb: string;          // "251,146,60"
  hex: string;          // "#fb923c"
  label: string;        // "J.A.R.V.I.S"
}

const PRESETS: Record<string, ThemeColors> = {
  stark:   { rgb: '251,146,60',  hex: '#fb923c', label: 'J.A.R.V.I.S' },
  jarvis:  { rgb: '0,240,255',   hex: '#00f0ff', label: 'J.A.R.V.I.S' },
  ultron:  { rgb: '239,68,68',   hex: '#ef4444', label: 'ULTRON' },
  wakanda: { rgb: '168,85,247',  hex: '#a855f7', label: 'SHURI-NET' },
  hulk:    { rgb: '74,222,128',  hex: '#4ade80', label: 'GAMMA-SYS' },
  friday:  { rgb: '96,165,250',  hex: '#60a5fa', label: 'F.R.I.D.A.Y' },
};

function resolveTheme(t: ModalColorTheme): ThemeColors {
  if (typeof t === 'string') return PRESETS[t] || PRESETS.stark;
  return {
    rgb: `${t.r},${t.g},${t.b}`,
    hex: `#${[t.r, t.g, t.b].map((c) => c.toString(16).padStart(2, '0')).join('')}`,
    label: 'CUSTOM-HUD',
  };
}

/* ── Props ── */
interface StarkHoverModalProps {
  post: Post;
  cardRect: DOMRect | null;
  isVisible: boolean;
  colorTheme?: ModalColorTheme;
  onModalMouseEnter?: () => void;
  onModalMouseLeave?: () => void;
}

/* deterministic "serial" from post id */
function serialFromId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16).toUpperCase().padStart(8, '0');
}

/* ── Component ── */
export default function StarkHoverModal({
  post,
  cardRect,
  isVisible,
  colorTheme = 'stark',
  onModalMouseEnter,
  onModalMouseLeave,
}: StarkHoverModalProps) {
  const theme = resolveTheme(colorTheme);
  const C = theme.rgb;   // shorthand for rgba()
  const HEX = theme.hex;

  const [mounted, setMounted] = useState(false);
  const [animIn, setAnimIn] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [scanPct, setScanPct] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<NodeJS.Timeout | null>(null);

  /* tilt state */
  const [tiltTransform, setTiltTransform] = useState('perspective(900px) rotateX(0deg) rotateY(0deg)');
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  useEffect(() => { setMounted(true); }, []);

  /* entrance / exit with delayed unmount */
  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      const t = setTimeout(() => setAnimIn(true), 30);
      return () => clearTimeout(t);
    }
    setAnimIn(false);
    setScanPct(0);
    const exit = setTimeout(() => setShouldRender(false), 350);
    return () => clearTimeout(exit);
  }, [isVisible]);

  /* fake scan progress 0→100 */
  useEffect(() => {
    if (!animIn) { setScanPct(0); return; }
    scanRef.current = setInterval(() => {
      setScanPct((p) => {
        if (p >= 100) { clearInterval(scanRef.current!); return 100; }
        return p + 2;
      });
    }, 30);
    return () => { if (scanRef.current) clearInterval(scanRef.current); };
  }, [animIn]);

  /* ── tilt handlers ── */
  const handleTiltMove = useCallback((e: React.MouseEvent) => {
    if (!tiltRef.current) return;
    const rect = tiltRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;   // 0→1
    const y = (e.clientY - rect.top) / rect.height;
    const TILT = 8; // degrees
    const rotX = (0.5 - y) * TILT;
    const rotY = (x - 0.5) * TILT;
    setTiltTransform(`perspective(900px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`);
    setGlare({ x: x * 100, y: y * 100, opacity: 0.12 });
  }, []);

  const handleTiltLeave = useCallback(() => {
    setTiltTransform('perspective(900px) rotateX(0deg) rotateY(0deg)');
    setGlare({ x: 50, y: 50, opacity: 0 });
  }, []);

  /* ── guards ── */
  const isSmall = mounted && window.innerWidth < 900;
  if (!mounted || !cardRect || !shouldRender || isSmall) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const MODAL_W = 340;
  const MODAL_H = 440;
  const GAP = 32;

  const cardCX = cardRect.left + cardRect.width / 2;
  const goRight = cardCX < vw * 0.55;

  const modalLeft = goRight
    ? Math.min(cardRect.right + GAP, vw - MODAL_W - 16)
    : Math.max(cardRect.left - MODAL_W - GAP, 16);

  let modalTop = cardRect.top + cardRect.height / 2 - MODAL_H / 2;
  modalTop = Math.max(16, Math.min(modalTop, vh - MODAL_H - 16));

  if (modalLeft < 8 || modalLeft + MODAL_W > vw - 8) return null;

  /* connector line */
  const lx1 = goRight ? cardRect.right + 2 : cardRect.left - 2;
  const ly1 = cardRect.top + cardRect.height / 2;
  const lx2 = goRight ? modalLeft + 2 : modalLeft + MODAL_W - 2;
  const ly2 = modalTop + 60;
  const cpX = (lx1 + lx2) / 2;
  const cpY = Math.min(ly1, ly2) - 30;
  const pathD = `M ${lx1} ${ly1} Q ${cpX} ${cpY} ${lx2} ${ly2}`;

  const isVideo = post.mediaType === 'video' && post.video?.url;
  const thumbUrl = isVideo ? (post.video?.thumbnailUrl || post.image?.url) : post.image?.url;

  const serial = serialFromId(post._id);
  const filterId = `stark-glow-${post._id}`;

  /* bridge hitbox */
  const bL = goRight ? cardRect.right : modalLeft + MODAL_W;
  const bR = goRight ? modalLeft : cardRect.left;
  const overlapTop = Math.max(cardRect.top, modalTop);
  const overlapBot = Math.min(cardRect.bottom, modalTop + MODAL_H);
  const bT = overlapTop - 10;
  const bB = overlapBot + 10;
  const bridgeW = Math.abs(bR - bL) + 12;
  const bridgeH = Math.max(bB - bT, 40);

  /* threat level */
  const threatLevel = ((post.likesCount + post.viewsCount) % 5) + 1;
  const threatLabel = ['MINIMAL', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'][threatLevel - 1];
  const threatColor = ['#22d3ee', '#4ade80', '#facc15', '#fb923c', '#ef4444'][threatLevel - 1];

  /* ── Helpers for themed rgba ── */
  const rgba = (a: number) => `rgba(${C},${a})`;

  const content = (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none' }}>

      {/* Bridge hitbox */}
      {bridgeW > 0 && bridgeH > 0 && (
        <div
          onMouseEnter={onModalMouseEnter}
          onMouseLeave={onModalMouseLeave}
          style={{
            position: 'absolute',
            left: Math.min(bL, bR) - 6,
            top: bT,
            width: bridgeW,
            height: bridgeH,
            pointerEvents: 'auto',
            zIndex: 9997,
          }}
        />
      )}

      {/* SVG connector */}
      <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible', pointerEvents: 'none' }}>
        <defs>
          <filter id={filterId}>
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path d={pathD} fill="none" stroke={rgba(0.12)} strokeWidth="8"
          filter={`url(#${filterId})`}
          className={`transition-opacity duration-500 ${animIn ? 'opacity-100' : 'opacity-0'}`} />
        <path d={pathD} fill="none" stroke={rgba(0.7)}
          strokeWidth="1.5" strokeDasharray="6 4" strokeLinecap="round"
          className={`transition-opacity duration-500 ${animIn ? 'opacity-100' : 'opacity-0'}`}
          style={{ animation: animIn ? 'dashFlow 1s linear infinite' : 'none' }} />
        <circle cx={lx1} cy={ly1} r={animIn ? 5 : 0} fill="none"
          stroke={rgba(0.9)} strokeWidth="1.5" style={{ transition: 'r 0.3s ease' }} />
        <circle cx={lx1} cy={ly1} r={animIn ? 2 : 0} fill={HEX} style={{ transition: 'r 0.3s ease 0.1s' }} />
        <circle cx={lx2} cy={ly2} r={animIn ? 5 : 0} fill="none"
          stroke={rgba(0.9)} strokeWidth="1.5" style={{ transition: 'r 0.3s ease 0.15s' }} />
        <circle cx={lx2} cy={ly2} r={animIn ? 2 : 0} fill={HEX} style={{ transition: 'r 0.3s ease 0.2s' }} />
        {animIn && (
          <circle r="3" fill={HEX} filter={`url(#${filterId})`}>
            <animateMotion dur="1.6s" repeatCount="indefinite" path={pathD} />
          </circle>
        )}
      </svg>

      {/* ── Modal Panel with 3D Tilt ── */}
      <div
        ref={modalRef}
        onMouseEnter={onModalMouseEnter}
        onMouseLeave={(e) => { handleTiltLeave(); onModalMouseLeave?.(); }}
        onMouseMove={handleTiltMove}
        className={`absolute transition-all duration-[400ms] ease-[cubic-bezier(.16,1,.3,1)]
          ${animIn ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.92]'}`}
        style={{
          left: modalLeft, top: modalTop, width: MODAL_W,
          transformOrigin: goRight ? 'left center' : 'right center',
          pointerEvents: 'auto',
        }}
      >
        {/* Tilt wrapper */}
        <div
          ref={tiltRef}
          style={{
            transform: tiltTransform,
            transition: 'transform 0.12s ease-out',
            transformStyle: 'preserve-3d',
            willChange: 'transform',
          }}
        >
          <div
            className="rounded-2xl overflow-hidden relative"
            style={{
              background: 'linear-gradient(160deg, rgba(15,10,5,0.96), rgba(10,12,18,0.97))',
              backdropFilter: 'blur(32px) saturate(1.6)',
              WebkitBackdropFilter: 'blur(32px) saturate(1.6)',
              border: `1px solid ${rgba(0.25)}`,
              boxShadow: `0 0 40px ${rgba(0.08)}, 0 0 80px ${rgba(0.04)}, inset 0 1px 0 ${rgba(0.12)}`,
            }}
          >
            {/* Glare overlay from tilt */}
            <div
              className="absolute inset-0 pointer-events-none rounded-2xl z-50"
              style={{
                background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, ${rgba(glare.opacity)}, transparent 60%)`,
                transition: 'opacity 0.12s ease-out',
                mixBlendMode: 'overlay',
              }}
            />

            {/* ── Top HUD bar ── */}
            <div className="flex items-center justify-between px-3 py-2"
              style={{ borderBottom: `1px solid ${rgba(0.15)}`, background: rgba(0.04) }}>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3 h-3" style={{ color: HEX }} />
                <span className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase"
                  style={{ color: rgba(0.9), textShadow: `0 0 8px ${rgba(0.4)}` }}>
                  {theme.label} — FILE #{serial.slice(0, 6)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: HEX, animation: 'starkPulse 1.5s ease-in-out infinite', boxShadow: `0 0 6px ${rgba(0.6)}` }} />
                <span className="text-[8px] font-mono tracking-wider" style={{ color: rgba(0.6) }}>LIVE</span>
              </div>
            </div>

            {/* ── Image / Evidence Section ── */}
            <div className="relative h-[150px] overflow-hidden">
              {thumbUrl && (
                <img src={thumbUrl} alt={post.title}
                  className="w-full h-full object-cover"
                  style={{ filter: animIn ? 'none' : 'brightness(0.3) saturate(0)', transition: 'filter 0.6s ease' }} />
              )}
              {/* hologram grid */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: `
                  repeating-linear-gradient(0deg, transparent, transparent 2px, ${rgba(0.03)} 2px, ${rgba(0.03)} 4px),
                  linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 60%, rgba(10,10,15,0.95) 100%)
                `,
              }} />
              {/* scan sweep */}
              {animIn && scanPct < 100 && (
                <div className="absolute left-0 right-0 h-[2px] pointer-events-none z-20"
                  style={{
                    top: `${scanPct}%`,
                    background: `linear-gradient(90deg, transparent 0%, ${rgba(0.9)} 30%, ${rgba(0.9)} 70%, transparent 100%)`,
                    boxShadow: `0 0 12px 2px ${rgba(0.4)}`,
                    transition: 'top 0.03s linear',
                  }} />
              )}
              {/* corner brackets */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 340 150" preserveAspectRatio="none">
                <path d="M 2 20 L 2 2 L 20 2" fill="none" stroke={rgba(0.6)} strokeWidth="1.5" />
                <path d="M 320 2 L 338 2 L 338 20" fill="none" stroke={rgba(0.6)} strokeWidth="1.5" />
                <path d="M 2 130 L 2 148 L 20 148" fill="none" stroke={rgba(0.6)} strokeWidth="1.5" />
                <path d="M 320 148 L 338 148 L 338 130" fill="none" stroke={rgba(0.6)} strokeWidth="1.5" />
                <line x1="160" y1="68" x2="180" y2="68" stroke={rgba(0.35)} strokeWidth="0.5" />
                <line x1="170" y1="58" x2="170" y2="78" stroke={rgba(0.35)} strokeWidth="0.5" />
                <circle cx="170" cy="68" r="12" fill="none" stroke={rgba(0.2)} strokeWidth="0.5" strokeDasharray="3 3" />
              </svg>
              {/* badges */}
              <div className="absolute top-2.5 left-2.5 flex gap-1.5 z-20">
                {isVideo && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded backdrop-blur-sm text-white text-[9px] font-mono font-bold"
                    style={{ background: rgba(0.65), border: `1px solid ${rgba(0.5)}` }}>
                    <Play className="w-2 h-2" fill="white" />VID
                  </span>
                )}
                {post.isAiGenerated && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded backdrop-blur-sm text-white text-[9px] font-mono font-bold"
                    style={{ background: rgba(0.65), border: `1px solid ${rgba(0.5)}` }}>
                    <Sparkles className="w-2 h-2" />AI-GEN
                  </span>
                )}
              </div>
              {/* scan status */}
              <div className="absolute bottom-2 left-2.5 z-20 flex items-center gap-2">
                <Crosshair className="w-3 h-3" style={{ color: rgba(0.8), animation: scanPct < 100 ? 'starkSpin 3s linear infinite' : 'none' }} />
                <span className="text-[9px] font-mono font-bold tracking-widest uppercase"
                  style={{ color: scanPct >= 100 ? '#4ade80' : HEX, textShadow: '0 0 6px currentColor' }}>
                  {scanPct >= 100 ? '✓ ANALYSIS COMPLETE' : `SCANNING… ${scanPct}%`}
                </span>
              </div>
              {isVideo && post.video?.duration && (
                <div className="absolute bottom-2 right-2.5 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[9px] font-mono z-20"
                  style={{ border: `1px solid ${rgba(0.3)}`, color: rgba(0.8) }}>
                  <Clock className="w-2 h-2" />{Math.round(post.video.duration)}s
                </div>
              )}
            </div>

            {/* ── Data / Intel Section ── */}
            <div className="p-3.5 space-y-3">

              {/* Classification + Title */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-1.5 py-[1px] rounded text-[7px] font-mono font-black tracking-[0.25em] uppercase border"
                    style={{
                      color: threatColor,
                      borderColor: `${threatColor}55`,
                      background: `${threatColor}11`,
                      textShadow: `0 0 6px ${threatColor}66`,
                    }}>
                    {threatLabel}
                  </span>
                  <span className="text-[7px] font-mono tracking-wider" style={{ color: rgba(0.4) }}>
                    SIG: {serial}
                  </span>
                </div>
                <Link href={`/post/${post._id}`}>
                  <h3 className="text-[13px] font-bold leading-snug line-clamp-2 font-mono transition-colors cursor-pointer"
                    style={{ color: rgba(0.85), textShadow: `0 0 12px ${rgba(0.25)}` }}>
                    {post.title}
                  </h3>
                </Link>
              </div>

              {post.description && (
                <p className="text-[10px] line-clamp-2 leading-relaxed font-mono" style={{ color: rgba(0.35) }}>
                  {post.description.slice(0, 90)}
                </p>
              )}

              {/* Metrics grid */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { icon: Heart, label: 'LIKES', val: formatNumber(post.likesCount), color: '#f472b6' },
                  { icon: Eye, label: 'VIEWS', val: formatNumber(post.viewsCount || 0), color: '#60a5fa' },
                  { icon: Bookmark, label: 'SAVES', val: formatNumber(post.savesCount || 0), color: '#a78bfa' },
                  { icon: Activity, label: 'SHARES', val: formatNumber(post.sharesCount || 0), color: '#34d399' },
                ].map((m) => (
                  <div key={m.label}
                    className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg"
                    style={{ background: `${m.color}08`, border: `1px solid ${m.color}18` }}>
                    <m.icon className="w-2.5 h-2.5" style={{ color: `${m.color}99` }} />
                    <span className="text-[10px] font-mono font-bold" style={{ color: `${m.color}cc` }}>{m.val}</span>
                    <span className="text-[6px] font-mono tracking-[0.15em] uppercase" style={{ color: `${m.color}55` }}>{m.label}</span>
                  </div>
                ))}
              </div>

              {/* Author */}
              <Link href={`/profile/${post.author?.username}`}
                className="flex items-center gap-2.5 pt-2.5 hover:opacity-80 transition-opacity"
                style={{ borderTop: `1px solid ${rgba(0.1)}` }}>
                <div className="relative">
                  {post.author?.avatar ? (
                    <img src={post.author.avatar} alt=""
                      className="w-7 h-7 rounded-full object-cover"
                      style={{ boxShadow: `0 0 0 1.5px ${rgba(0.4)}, 0 0 8px ${rgba(0.15)}` }} />
                  ) : (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold font-mono"
                      style={{ color: HEX, background: rgba(0.1), border: `1.5px solid ${rgba(0.3)}` }}>
                      {post.author?.displayName?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border border-black" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <UserIcon className="w-2.5 h-2.5" style={{ color: rgba(0.4) }} />
                    <span className="text-[10px] font-semibold font-mono truncate" style={{ color: rgba(0.8) }}>
                      {post.author?.displayName || 'Unknown'}
                    </span>
                  </div>
                  <span className="text-[8px] font-mono tracking-wider" style={{ color: rgba(0.3) }}>
                    @{post.author?.username || '—'}
                  </span>
                </div>
                <span className="text-[8px] font-mono" style={{ color: rgba(0.25) }}>{timeAgo(post.createdAt)}</span>
              </Link>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {post.tags.slice(0, 5).map((tag) => (
                    <span key={tag}
                      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-mono border"
                      style={{ color: rgba(0.5), borderColor: rgba(0.12), background: rgba(0.03) }}>
                      <Tag className="w-2 h-2" />{tag}
                    </span>
                  ))}
                  {post.tags.length > 5 && (
                    <span className="text-[8px] font-mono self-center" style={{ color: rgba(0.25) }}>+{post.tags.length - 5}</span>
                  )}
                </div>
              )}

              {/* Price / Product */}
              {(post.price?.amount || post.productUrl) && (
                <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${rgba(0.1)}` }}>
                  {post.price?.amount && (
                    <span className="text-sm font-black font-mono" style={{ color: HEX, textShadow: `0 0 10px ${rgba(0.4)}` }}>
                      {formatPrice(post.price.amount)}
                    </span>
                  )}
                  {post.productUrl && (
                    <a href={post.productUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-all"
                      style={{
                        background: rgba(0.15),
                        color: rgba(0.8),
                        border: `1px solid ${rgba(0.3)}`,
                      }}>
                      <ExternalLink className="w-2.5 h-2.5" />ACQUIRE
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
                    {post.category.icon} {post.category.name}
                  </span>
                </div>
              )}
            </div>

            {/* ── Bottom HUD bar ── */}
            <div className="flex items-center justify-between px-3 py-1.5"
              style={{ background: rgba(0.04), borderTop: `1px solid ${rgba(0.1)}` }}>
              <div className="flex items-center gap-1.5">
                <Cpu className="w-2.5 h-2.5" style={{ color: rgba(0.3) }} />
                <span className="text-[7px] font-mono tracking-wider" style={{ color: rgba(0.25) }}>STARK INDUSTRIES</span>
              </div>
              <div className="flex items-center gap-1">
                <Radio className="w-2.5 h-2.5" style={{ color: rgba(0.3) }} />
                <span className="text-[7px] font-mono tracking-wider" style={{ color: rgba(0.25) }}>SEC-{serial.slice(-4)}</span>
              </div>
            </div>

            {/* Bottom glow strip */}
            <div className="h-[2px]"
              style={{ background: `linear-gradient(90deg, transparent 5%, ${rgba(0.6)} 30%, ${rgba(0.5)} 50%, ${rgba(0.6)} 70%, transparent 95%)` }} />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
