'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Heart, Bookmark, ExternalLink, Share2, Sparkles,
  Play, Volume2, VolumeX, Eye,
} from 'lucide-react';
import { Post } from '@/types';
import { formatNumber, formatPrice, timeAgo } from '@/lib/utils';
import { postsAPI } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import toast from 'react-hot-toast';
import GlassTilt from '@/components/ui/GlassTilt';
import MatrixText from '@/components/ui/MatrixText';
import CyberHoverModal from '@/components/ui/CyberHoverModal';

interface PostCardProps {
  post: Post;
  index?: number;
}

export default function PostCard({ post, index = 0 }: PostCardProps) {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardRect, setCardRect] = useState<DOMRect | null>(null);
  const [showModal, setShowModal] = useState(false);
  const modalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isModalHovered, setIsModalHovered] = useState(false);

  const isVideo = post.mediaType === 'video' && post.video?.url;

  // Keep cardRect in sync while hovering (handles scroll/resize)
  const updateCardRect = useCallback(() => {
    if (cardRef.current) {
      setCardRect(cardRef.current.getBoundingClientRect());
      rafRef.current = requestAnimationFrame(updateCardRect);
    }
  }, []);

  const cancelPendingLeave = useCallback(() => {
    if (leaveTimerRef.current) { clearTimeout(leaveTimerRef.current); leaveTimerRef.current = null; }
  }, []);

  const handleMouseEnter = useCallback(() => {
    cancelPendingLeave();
    setIsHovering(true);
    if (isVideo && videoRef.current) videoRef.current.play().catch(() => {});
    // Show modal after short delay
    if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
    modalTimerRef.current = setTimeout(() => {
      setShowModal(true);
      updateCardRect();
    }, 400);
  }, [isVideo, updateCardRect, cancelPendingLeave]);

  const dismissAll = useCallback(() => {
    setIsHovering(false);
    if (isVideo && videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; }
    if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setShowModal(false);
    setCardRect(null);
    setIsModalHovered(false);
  }, [isVideo]);

  const handleMouseLeave = useCallback(() => {
    cancelPendingLeave();
    leaveTimerRef.current = setTimeout(() => {
      if (!isModalHovered) dismissAll();
    }, 250);
  }, [cancelPendingLeave, dismissAll, isModalHovered]);

  // When modal becomes un-hovered and card isn't hovered, dismiss
  useEffect(() => {
    if (!isModalHovered && !isHovering && showModal) {
      leaveTimerRef.current = setTimeout(dismissAll, 200);
    }
    return () => { if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current); };
  }, [isModalHovered, isHovering, showModal, dismissAll]);

  const handleModalMouseEnter = useCallback(() => {
    cancelPendingLeave();
    setIsModalHovered(true);
  }, [cancelPendingLeave]);

  const handleModalMouseLeave = useCallback(() => {
    setIsModalHovered(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => {
    if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
  }, []);

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsMuted(!isMuted);
    if (videoRef.current) videoRef.current.muted = !isMuted;
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login to like posts'); return; }
    try {
      const { data } = await postsAPI.toggleLike(post._id);
      setIsLiked(data.data.isLiked);
      setLikesCount((prev) => prev + (data.data.isLiked ? 1 : -1));
    } catch { toast.error('Failed to like post'); }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login to save posts'); return; }
    try {
      const { data } = await postsAPI.toggleSave(post._id);
      setIsSaved(data.data.isSaved);
      toast.success(data.data.isSaved ? 'Saved to collection' : 'Removed from saved');
    } catch { toast.error('Failed to save post'); }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
      await postsAPI.sharePost(post._id);
      toast.success('Link copied!');
    } catch { toast.error('Failed to copy link'); }
  };

  const handleProductClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try { await postsAPI.trackClick(post._id); } catch { /* silent */ }
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const aspectRatio = isVideo
    ? (post.video?.height && post.video?.width ? post.video.height / post.video.width : 1.33)
    : (post.image?.height && post.image?.width ? post.image.height / post.image.width : 1 + Math.random() * 0.8);

  const thumbnailUrl = isVideo ? (post.video?.thumbnailUrl || post.image?.url) : post.image?.url;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.25) }}
      className="pin-card group"
    >
      {/* GlassTilt gives 3D perspective tilt on mouse move */}
      <GlassTilt tiltAmount={10} glareOpacity={0.12} scale={1.03}>
        <Link
          href={`/post/${post._id}`}
          className="block"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Media container */}
          <div
            className="relative overflow-hidden rounded-xl"
            style={{
              paddingBottom: `${Math.min(aspectRatio * 100, 180)}%`,
              background: 'linear-gradient(135deg, #0e0e1e, #14142a)',
            }}
          >
            {/* Skeleton */}
            {!imageLoaded && !isVideo && (
              <div className="absolute inset-0 skeleton shimmer" />
            )}

            {isVideo ? (
              <>
                {!isHovering && thumbnailUrl && (
                  <img src={thumbnailUrl} alt={post.title} loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover" />
                )}
                <video ref={videoRef} src={post.video!.url} muted={isMuted} loop playsInline preload="none"
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isHovering ? 'opacity-100' : 'opacity-0'}`} />
                {!isHovering && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-md border border-cyan-400/30 flex items-center justify-center shadow-cyber">
                      <Play className="w-6 h-6 text-cyan-400 ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                )}
                {post.video?.duration && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-cyan-400/20 text-cyan-400 text-[11px] font-mono font-medium z-10">
                    {formatDuration(post.video.duration)}
                  </div>
                )}
                {isHovering && (
                  <button onClick={toggleMute}
                    className="absolute bottom-3 right-3 p-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white hover:text-cyan-400 z-20 transition-colors">
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                )}
              </>
            ) : (
              <img
                src={post.image?.url}
                alt={post.title}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-700
                  ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                  ${isHovering ? 'scale-110 brightness-110' : 'scale-100 brightness-100'}`}
              />
            )}

            {/* Cyber scan line on hover */}
            {isHovering && (
              <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                <div className="absolute left-0 right-0 h-[2px] animate-scan-line"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.4), transparent)' }} />
              </div>
            )}

            {/* Hover overlay — glassmorphism info panel */}
            <div className={`absolute inset-0 z-10 transition-all duration-400 rounded-xl flex flex-col justify-between p-3
              ${isHovering ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              style={{
                background: isHovering
                  ? 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.0) 50%, rgba(10,10,20,0.85) 80%)'
                  : 'transparent',
              }}
            >
              {/* Top row: badges */}
              <div className={`flex items-start justify-between transition-all duration-300 ${isHovering ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                <div className="flex items-center gap-1.5">
                  {isVideo && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-600/80 backdrop-blur-sm text-white text-[10px] font-mono font-bold uppercase tracking-wider border border-blue-500/40">
                      <Play className="w-2.5 h-2.5" fill="white" /> VID
                    </span>
                  )}
                  {post.isAiGenerated && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-purple-600/80 backdrop-blur-sm text-white text-[10px] font-mono font-bold uppercase tracking-wider border border-purple-500/40">
                      <Sparkles className="w-2.5 h-2.5" /> AI
                    </span>
                  )}
                  {post.category && (
                    <span className="px-2 py-1 rounded-md text-[10px] font-mono font-bold text-white backdrop-blur-sm uppercase tracking-wider border"
                      style={{ backgroundColor: `${post.category.color}88`, borderColor: `${post.category.color}66` }}>
                      {post.category.name}
                    </span>
                  )}
                </div>
                <button onClick={handleSave}
                  className={`p-2 rounded-lg backdrop-blur-md transition-all border
                    ${isSaved
                      ? 'bg-cyan-400/20 border-cyan-400/40 text-cyan-400 shadow-cyber'
                      : 'bg-black/30 border-white/10 text-white/80 hover:text-cyan-400 hover:border-cyan-400/30'}`}>
                  <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Bottom row: matrix-decoded info + actions */}
              <div className={`space-y-2 transition-all duration-300 delay-100 ${isHovering ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {/* Matrix-decoded title */}
                <div className="font-mono text-xs text-cyan-400 leading-tight tracking-wide"
                  style={{ textShadow: '0 0 8px rgba(0,240,255,0.5)' }}>
                  <MatrixText text={post.title.slice(0, 40)} trigger={isHovering} speed={20} scramblePasses={2} />
                </div>
                {/* Matrix-decoded author */}
                <div className="font-mono text-[10px] text-emerald-400/70 tracking-widest uppercase"
                  style={{ textShadow: '0 0 6px rgba(0,255,136,0.3)' }}>
                  <MatrixText text={`> ${post.author?.displayName || ''}`} trigger={isHovering} speed={25} scramblePasses={1} />
                </div>

                {/* Action row */}
                <div className="flex items-center justify-between pt-1">
                  {post.productUrl ? (
                    <a href={post.productUrl} target="_blank" rel="noopener noreferrer" onClick={handleProductClick}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-400/90 text-slate-900 text-[11px] font-bold font-mono uppercase tracking-wider hover:bg-cyan-400 transition-all shadow-cyber border border-cyan-400/50">
                      <ExternalLink className="w-3 h-3" />
                      {post.price?.amount ? formatPrice(post.price.amount) : 'VISIT'}
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 text-[11px] font-mono text-white/50">
                      <Eye className="w-3 h-3" />
                      {formatNumber(post.viewsCount || 0)}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <button onClick={handleShare}
                      className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-cyan-400 hover:border-cyan-400/30 backdrop-blur-sm transition-all">
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={handleLike}
                      className={`p-1.5 rounded-lg backdrop-blur-sm transition-all border
                        ${isLiked
                          ? 'bg-pink-500/20 border-pink-500/40 text-pink-500'
                          : 'bg-white/5 border-white/10 text-white/70 hover:text-pink-500 hover:border-pink-500/30'}`}>
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Persistent price tag */}
            {post.price?.amount && !isHovering && (
              <div className="absolute top-3 left-3 z-10">
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/90 text-white text-[11px] font-mono font-bold shadow-lg border border-emerald-400/50">
                  {formatPrice(post.price.amount)}
                </span>
              </div>
            )}

            {/* Cyber border glow on hover */}
            <div className={`absolute inset-0 rounded-xl pointer-events-none transition-all duration-500 z-20
              ${isHovering
                ? 'shadow-[inset_0_0_30px_rgba(0,240,255,0.08),0_0_20px_rgba(0,240,255,0.12)] border border-cyan-400/25'
                : 'border border-transparent'}`}
            />
          </div>

          {/* Info below media */}
          <div className="p-2.5 space-y-1.5">
            <h3 className="text-[13px] font-medium line-clamp-2 text-white/85 leading-snug group-hover:text-cyan-400/90 transition-colors">
              {post.title}
            </h3>
            <div className="flex items-center justify-between">
              <Link href={`/profile/${post.author?.username}`} onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 group/author">
                {post.author?.avatar ? (
                  <img src={post.author.avatar} alt={post.author.displayName}
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-700" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-bold text-cyan-400">
                    {post.author?.displayName?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-[11px] text-white/40 group-hover/author:text-cyan-400/60 transition-colors truncate max-w-[90px] font-mono">
                  {post.author?.displayName}
                </span>
              </Link>
              <div className="flex items-center gap-2 text-[11px] text-white/30 font-mono">
                {likesCount > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Heart className="w-3 h-3" />{formatNumber(likesCount)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      </GlassTilt>

      {/* CyberHoverModal — interactive, user can move mouse to it */}
      <CyberHoverModal
        post={post}
        cardRect={cardRect}
        isVisible={showModal}
        onModalMouseEnter={handleModalMouseEnter}
        onModalMouseLeave={handleModalMouseLeave}
      />
    </motion.div>
  );
}
