'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Bookmark, ExternalLink, Share2, MoreHorizontal, Sparkles, Play, Volume2, VolumeX } from 'lucide-react';
import { Post } from '@/types';
import { formatNumber, formatPrice, timeAgo } from '@/lib/utils';
import { postsAPI } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import toast from 'react-hot-toast';
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

  // Keep cardRect in sync while hovering (handles scroll / resize)
  const updateCardRect = useCallback(() => {
    if (cardRef.current) {
      setCardRect(cardRef.current.getBoundingClientRect());
      rafRef.current = requestAnimationFrame(updateCardRect);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => () => {
    if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const isVideo = post.mediaType === 'video' && post.video?.url;

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (isVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
    // Show modal after a short hover delay
    if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
    modalTimerRef.current = setTimeout(() => {
      setShowModal(true);
      updateCardRect(); // start tracking position
    }, 400);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (isVideo && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    // Cancel / hide modal
    if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setShowModal(false);
    setCardRect(null);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please login to like posts');
      return;
    }
    try {
      const { data } = await postsAPI.toggleLike(post._id);
      setIsLiked(data.data.isLiked);
      setLikesCount((prev) => prev + (data.data.isLiked ? 1 : -1));
    } catch {
      toast.error('Failed to like post');
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please login to save posts');
      return;
    }
    try {
      const { data } = await postsAPI.toggleSave(post._id);
      setIsSaved(data.data.isSaved);
      toast.success(data.data.isSaved ? 'Saved to collection' : 'Removed from saved');
    } catch {
      toast.error('Failed to save post');
    }
  };

  const handleProductClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await postsAPI.trackClick(post._id);
    } catch {
      // silent
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
      await postsAPI.sharePost(post._id);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
      className="pin-card group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={`/post/${post._id}`} className="block">
        {/* Media */}
        <div
          className="relative overflow-hidden rounded-2xl bg-surface-100 dark:bg-surface-800"
          style={{ paddingBottom: `${Math.min(aspectRatio * 100, 180)}%` }}
        >
          {/* Skeleton */}
          {!imageLoaded && !isVideo && (
            <div className="absolute inset-0 skeleton shimmer" />
          )}

          {isVideo ? (
            <>
              {/* Video thumbnail (poster) */}
              {!isHovering && thumbnailUrl && (
                <img
                  src={thumbnailUrl}
                  alt={post.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* Video element */}
              <video
                ref={videoRef}
                src={post.video!.url}
                muted={isMuted}
                loop
                playsInline
                preload="none"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                  isHovering ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* Play icon (when not hovering) */}
              {!isHovering && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                  </div>
                </div>
              )}

              {/* Duration badge */}
              {post.video?.duration && (
                <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 text-white text-xs font-medium backdrop-blur-sm z-10">
                  {formatDuration(post.video.duration)}
                </div>
              )}

              {/* Mute toggle (while hovering) */}
              {isHovering && (
                <button
                  onClick={toggleMute}
                  className="absolute bottom-3 right-3 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm z-10 transition-colors"
                >
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
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-500
                ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                group-hover:scale-105`}
            />
          )}

          {/* Hover overlay */}
          <div className="pin-overlay">
            {/* Top actions */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-1.5">
                {isVideo && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/90 text-white text-xs font-medium backdrop-blur-sm">
                    <Play className="w-3 h-3" fill="white" />
                    Video
                  </span>
                )}
                {post.isAiGenerated && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/90 text-white text-xs font-medium backdrop-blur-sm">
                    <Sparkles className="w-3 h-3" />
                    AI
                  </span>
                )}
                {post.category && (
                  <span
                    className="px-2 py-1 rounded-full text-xs font-medium text-white backdrop-blur-sm"
                    style={{ backgroundColor: `${post.category.color}cc` }}
                  >
                    {post.category.name}
                  </span>
                )}
              </div>

              <button
                onClick={handleSave}
                className={`p-2 rounded-full backdrop-blur-sm transition-all
                  ${isSaved 
                    ? 'bg-brand-600 text-white' 
                    : 'bg-black/40 text-white hover:bg-black/60'}`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Bottom actions */}
            <div className="flex items-end justify-between">
              {post.productUrl && (
                <a
                  href={post.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleProductClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-surface-900 text-xs font-semibold hover:bg-surface-100 transition-colors shadow-sm"
                >
                  <ExternalLink className="w-3 h-3" />
                  {post.price?.amount ? formatPrice(post.price.amount) : 'Visit'}
                </a>
              )}

              <div className="flex items-center gap-1">
                <button
                  onClick={handleShare}
                  className="p-2 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleLike}
                  className={`p-2 rounded-full backdrop-blur-sm transition-all
                    ${isLiked 
                      ? 'bg-red-500 text-white' 
                      : 'bg-black/40 text-white hover:bg-black/60'}`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Price badge (always visible) */}
          {post.price?.amount && !imageLoaded === false && (
            <div className="absolute top-3 left-3 group-hover:opacity-0 transition-opacity">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-lg">
                {formatPrice(post.price.amount)}
              </span>
            </div>
          )}
        </div>

        {/* Content below image */}
        <div className="p-3 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold line-clamp-2 text-surface-800 dark:text-surface-200 leading-snug">
              {post.title}
            </h3>
          </div>

          {/* Author & Stats */}
          <div className="flex items-center justify-between">
            <Link
              href={`/profile/${post.author?.username}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 group/author"
            >
              {post.author?.avatar ? (
                <img
                  src={post.author.avatar}
                  alt={post.author.displayName}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-[10px] font-bold text-brand-600">
                  {post.author?.displayName?.[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-xs text-surface-500 group-hover/author:text-surface-700 dark:group-hover/author:text-surface-300 transition-colors truncate max-w-[100px]">
                {post.author?.displayName}
              </span>
            </Link>

            <div className="flex items-center gap-2 text-xs text-surface-400">
              {likesCount > 0 && (
                <span className="flex items-center gap-0.5">
                  <Heart className="w-3 h-3" />
                  {formatNumber(likesCount)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
      <CyberHoverModal post={post} cardRect={cardRect} isVisible={showModal} />
    </motion.div>
  );
}
