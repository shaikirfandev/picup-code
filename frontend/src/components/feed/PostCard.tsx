'use client';

import { useState, useRef, useCallback, useEffect, memo, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Heart, Bookmark, ExternalLink, Share2, Sparkles,
  Play, Volume2, VolumeX, Eye, MoreHorizontal, Flag,
} from 'lucide-react';
import { Post } from '@/types';
import { formatNumber, formatPrice, timeAgo } from '@/lib/utils';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { likePost, savePost, sharePost as sharePostThunk, trackClick } from '@/store/slices/postSlice';
import { creatorAnalyticsAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const ReportModal = dynamic(() => import('@/components/shared/ReportModal'), { ssr: false });

interface PostCardProps {
  post: Post;
  index?: number;
}

/* Deterministic pseudo-random from string */
function hashAspect(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return 1 + (Math.abs(h) % 80) / 100;
}

const PostCard = memo(function PostCard({ post, index = 0 }: PostCardProps) {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();

  const isLiked = post.isLiked || false;
  const isSaved = post.isSaved || false;
  const likesCount = post.likesCount;

  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const isVideo = post.mediaType === 'video' && post.video?.url;

  // Track impression when card enters viewport
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          creatorAnalyticsAPI.trackEvent({ postId: post._id, eventType: 'view', referrer: 'feed' }).catch(() => {});
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [post._id]);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
    if (isVideo && videoRef.current) videoRef.current.play().catch(() => {});
  }, [isVideo]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    if (isVideo && videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; }
  }, [isVideo]);

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsMuted(!isMuted);
    if (videoRef.current) videoRef.current.muted = !isMuted;
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login to like posts'); return; }
    dispatch(likePost(post._id));
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login to save posts'); return; }
    dispatch(savePost({ id: post._id }));
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
      dispatch(sharePostThunk(post._id));
      toast.success('Link copied!');
    } catch { toast.error('Failed to copy link'); }
  };

  const handleProductClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(trackClick(post._id));
  };

  const handleReport = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login to report posts'); return; }
    setShowContextMenu(false);
    setShowReportModal(true);
  };

  const toggleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setShowContextMenu((prev) => !prev);
  };

  useEffect(() => {
    if (!showContextMenu) return;
    const handler = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setShowContextMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showContextMenu]);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const aspectRatio = isVideo
    ? (post.video?.height && post.video?.width ? post.video.height / post.video.width : 1.33)
    : (post.image?.height && post.image?.width ? post.image.height / post.image.width : hashAspect(post._id));

  const thumbnailUrl = isVideo ? (post.video?.thumbnailUrl || post.image?.url) : post.image?.url;

  const animDelay = useMemo(() => `${Math.min(index * 40, 250)}ms`, [index]);

  return (
    <div
      ref={cardRef}
      className="pin-card group animate-fade-slide-up"
      style={{ animationDelay: animDelay, animationFillMode: 'both' }}
    >
      <Link
        href={`/post/${post._id}`}
        className="block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Media container */}
        <div
          className="relative overflow-hidden"
          style={{
            paddingBottom: `${Math.min(aspectRatio * 100, 180)}%`,
            borderRadius: 'var(--radius-lg)',
          }}
        >
          {/* Skeleton */}
          {!imageLoaded && !isVideo && (
            <div className="absolute inset-0 skeleton" />
          )}

          {isVideo ? (
            <>
              {!isHovering && thumbnailUrl && (
                <img src={thumbnailUrl} alt={post.title} loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover" />
              )}
              <video ref={videoRef} src={post.video!.url} muted={isMuted} loop playsInline
                preload={thumbnailUrl ? 'none' : 'metadata'}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isHovering || !thumbnailUrl ? 'opacity-100' : 'opacity-0'}`} />
              {!isHovering && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                  </div>
                </div>
              )}
              {post.video?.duration && (
                <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium z-10">
                  {formatDuration(post.video.duration)}
                </div>
              )}
              {isHovering && (
                <button onClick={toggleMute}
                  className="absolute bottom-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 z-20 transition-colors">
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              )}
            </>
          ) : (
            <img
              src={post.image?.url || ''}
              alt={post.title || ''}
              loading={index < 6 ? 'eager' : 'lazy'}
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-300
                ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                ${isHovering ? 'scale-105 brightness-[0.92]' : 'scale-100 brightness-100'}`}
            />
          )}

          {/* Hover overlay */}
          <div className={`absolute inset-0 z-10 transition-opacity duration-200 flex flex-col justify-between p-3
            ${isHovering ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            style={{
              background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, transparent 30%, transparent 50%, rgba(0,0,0,0.55) 100%)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            {/* Top badges & actions */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-1.5">
                {isVideo && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium">
                    <Play className="w-2.5 h-2.5" fill="white" /> Video
                  </span>
                )}
                {post.isAiGenerated && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/70 backdrop-blur-sm text-white text-[10px] font-medium">
                    <Sparkles className="w-2.5 h-2.5" /> AI
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={handleSave}
                  className={`p-2 rounded-full backdrop-blur-sm transition-all
                    ${isSaved
                      ? 'bg-white text-black'
                      : 'bg-black/30 text-white hover:bg-black/50'}`}>
                  <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                </button>
                <div className="relative" ref={contextMenuRef}>
                  <button onClick={toggleContextMenu}
                    className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm transition-all">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {showContextMenu && (
                    <div className="absolute right-0 top-full mt-1 w-36 rounded-xl overflow-hidden shadow-lg z-50"
                      style={{ background: 'var(--dropdown-bg)', border: '1px solid var(--border)' }}>
                      <button onClick={handleReport}
                        className="flex items-center gap-2 w-full px-3 py-2.5 text-left text-xs font-medium transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                        style={{ color: 'var(--error)' }}>
                        <Flag className="w-3.5 h-3.5" /> Report
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom actions */}
            <div className="flex items-center justify-between">
              {post.productUrl ? (
                <a href={post.productUrl} target="_blank" rel="noopener noreferrer" onClick={handleProductClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all">
                  <ExternalLink className="w-3 h-3" />
                  {/* {post.price?.amount ? formatPrice(post.price.amount) : 'Visit'} */}
                  {'Visit'}
                </a>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-white/70">
                  <Eye className="w-3.5 h-3.5" />
                  {formatNumber(post.viewsCount || 0)}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <button onClick={handleShare}
                  className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm transition-all">
                  <Share2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={handleLike}
                  className={`p-2 rounded-full backdrop-blur-sm transition-all
                    ${isLiked
                      ? 'bg-red-500/80 text-white'
                      : 'bg-black/30 text-white hover:bg-black/50'}`}>
                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Persistent price tag */}
          {/* Persistent price tag removed from pins */}
        </div>

        {/* Info below media */}
        <div className="px-1 pt-2.5 pb-1 space-y-1.5">
          <h3 className="text-sm font-semibold line-clamp-2 leading-snug transition-colors"
            style={{ color: 'var(--foreground)' }}>
            {post.title}
          </h3>
          <div className="flex items-center justify-between">
            <Link href={`/profile/${post.author?.username}`} onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 group/author">
              {post.author?.avatar ? (
                <img src={post.author.avatar} alt={post.author.displayName || ''}
                  width={22} height={22} loading="lazy" decoding="async"
                  className="w-[22px] h-[22px] rounded-full object-cover"
                  style={{ border: '1px solid var(--border)' }} />
              ) : (
                <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] font-semibold"
                  style={{ background: 'var(--surface-secondary)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>
                  {post.author?.displayName?.[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-xs truncate max-w-[100px] transition-colors group-hover/author:text-[var(--foreground)]"
                style={{ color: 'var(--text-secondary)' }}>
                {post.author?.displayName}
              </span>
            </Link>
            {likesCount > 0 && (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                <Heart className="w-3 h-3" />{formatNumber(likesCount)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {showReportModal && (
        <ReportModal
          postId={post._id}
          postTitle={post.title}
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
});

export default PostCard;
