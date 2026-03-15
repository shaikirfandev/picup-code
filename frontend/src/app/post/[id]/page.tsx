'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { commentsAPI, downloadAPI, affiliateAPI } from '@/lib/api';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchPost, likePost, savePost, trackClick } from '@/store/slices/postSlice';
import { PostDetailSkeleton } from '@/components/shared/Skeletons';
import PostCard from '@/components/feed/PostCard';
import ReportModal from '@/components/shared/ReportModal';
import { Comment } from '@/types';
import { formatPrice, formatNumber, timeAgo } from '@/lib/utils';
import {
  Heart, Bookmark, ExternalLink, Share2, MessageCircle, Send,
  ArrowLeft, Flag, MoreHorizontal, Sparkles, Eye, MousePointerClick,
  Calendar, Tag, Play, Video, Volume2, VolumeX, Download, Link2,
} from 'lucide-react';
import Masonry from 'react-masonry-css';
import toast from 'react-hot-toast';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const post = useAppSelector((s) => s.posts.entities[params.id as string] || null);
  const isLoading = useAppSelector((s) => s.posts.loading);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Derived from normalised entity
  const isLiked = post?.isLiked || false;
  const isSaved = post?.isSaved || false;
  const likesCount = post?.likesCount || 0;

  useEffect(() => {
    dispatch(fetchPost(params.id as string)).unwrap().catch(() => {
      toast.error('Post not found');
      router.push('/');
    });

    commentsAPI.getComments(params.id as string)
      .then(({ data }) => setComments(data.data))
      .catch(() => {});
  }, [params.id, dispatch, router]);

  const handleLike = async () => {
    if (!isAuthenticated) { toast.error('Please login'); return; }
    dispatch(likePost(post!._id));
  };

  const handleSave = async () => {
    if (!isAuthenticated) { toast.error('Please login'); return; }
    dispatch(savePost({ id: post!._id }));
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;
    try {
      const { data } = await commentsAPI.createComment(post!._id, { text: newComment });
      setComments((prev) => [data.data, ...prev]);
      setNewComment('');
      toast.success('Comment added');
    } catch { toast.error('Failed to add comment'); }
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied!');
  };

  const handleDownload = async () => {
    if (!isAuthenticated) { toast.error('Please login to download'); return; }
    if (!(post?.image as any)?.fileId && !post?.image?.url) { toast.error('No image to download'); return; }
    const p = post!;
    try {
      if ((p.image as any)?.fileId) {
        const { data: blob } = await downloadAPI.downloadImage((p.image as any).fileId);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${p.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'image'}.jpg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else if (p.image?.url) {
        const res = await fetch(p.image.url);
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${p.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'image'}.jpg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
      toast.success('Download started!');
    } catch { toast.error('Download failed'); }
  };

  const handleProductClick = async () => {
    if (post) dispatch(trackClick(post._id));
  };

  const handleAffiliateLinkClick = async (linkIndex: number) => {
    if (post) {
      affiliateAPI.trackClick(post._id, { linkIndex, referrer: 'post_detail' }).catch(() => {});
    }
  };

  if (isLoading || !post) return <PostDetailSkeleton />;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Back button */}
        <button onClick={() => router.back()} className="btn-ghost mb-4 gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Main content */}
        <div className="card overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Media */}
            <div className="relative bg-surface-100 dark:bg-surface-800">
              {post.mediaType === 'video' && post.video?.url ? (
                <div className="relative">
                  <video
                    src={post.video.url}
                    controls
                    playsInline
                    className="w-full max-h-[80vh] object-contain bg-black"
                    poster={post.video.thumbnailUrl || post.image?.url}
                  />
                  {post.video.duration && (
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/90 text-white text-sm font-medium backdrop-blur-sm">
                      <Play className="w-4 h-4" fill="white" />
                      {Math.round(post.video.duration)}s
                    </div>
                  )}
                </div>
              ) : (
                <img
                  src={post.image?.url}
                  alt={post.title}
                  className="w-full h-full object-contain max-h-[80vh]"
                />
              )}
              {post.isAiGenerated && (
                <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/90 text-white text-sm font-medium backdrop-blur-sm">
                  <Sparkles className="w-4 h-4" />
                  AI Generated
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col">
              {/* Actions bar */}
              <div className="flex items-center justify-between p-4 border-b border-surface-100 dark:border-surface-800">
                <div className="flex items-center gap-2">
                  <button onClick={handleLike} className={`btn-ghost gap-1.5 ${isLiked ? 'text-red-500' : ''}`}>
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    {formatNumber(likesCount)}
                  </button>
                  <button onClick={handleSave} className={`btn-ghost gap-1.5 ${isSaved ? 'text-brand-600' : ''}`}>
                    <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                    Save
                  </button>
                  <button onClick={handleShare} className="btn-ghost gap-1.5">
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button onClick={handleDownload} className="btn-ghost gap-1.5" title="Download image">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
                <button className="btn-ghost p-2 relative" onClick={() => setShowMoreMenu(!showMoreMenu)}>
                  <MoreHorizontal className="w-5 h-5" />
                  {showMoreMenu && (
                    <div className="absolute right-0 top-full mt-1 w-44 rounded-xl overflow-hidden shadow-lg z-50"
                      style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMoreMenu(false);
                          if (!isAuthenticated) { toast.error('Please login to report posts'); return; }
                          setShowReportModal(true);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-red-500/10 text-red-500"
                      >
                        <Flag className="w-4 h-4" /> Report Post
                      </button>
                    </div>
                  )}
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 space-y-5 overflow-y-auto max-h-[60vh]">
                <div>
                  <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
                  {post.description && (
                    <p className="text-surface-600 dark:text-surface-400 leading-relaxed">{post.description}</p>
                  )}
                </div>

                {/* Price & Product URL */}
                {post.productUrl && (
                  <a
                    href={post.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleProductClick}
                    className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-brand-50 to-purple-50 dark:from-brand-950/30 dark:to-purple-950/30 border border-brand-100 dark:border-brand-900/50 hover:shadow-md transition-all group"
                  >
                    <div className="flex-1">
                      {post.price?.amount && (
                        <p className="text-2xl font-bold text-brand-600">{formatPrice(post.price.amount)}</p>
                      )}
                      <p className="text-sm text-surface-500 truncate">{post.productUrl}</p>
                    </div>
                    <div className="btn-primary gap-1.5 group-hover:gap-2.5 transition-all">
                      <ExternalLink className="w-4 h-4" />
                      {post.price?.amount ? 'Buy Now' : 'Visit Product'}
                    </div>
                  </a>
                )}

                {/* Affiliate Links */}
                {post.affiliateLinks && post.affiliateLinks.length > 0 && (
                  <div className="space-y-2">
                    {post.affiliateLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleAffiliateLinkClick(idx)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700 hover:shadow-md transition-all group"
                      >
                        <Link2 className="w-4 h-4 text-brand-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{link.label || `Product Link ${idx + 1}`}</p>
                          <p className="text-xs text-surface-500 truncate">{link.url}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-surface-400 group-hover:text-brand-500 transition-colors" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Meta info */}
                <div className="flex flex-wrap gap-4 text-sm text-surface-500">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    {formatNumber(post.viewsCount)} views
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MousePointerClick className="w-4 h-4" />
                    {formatNumber(post.clicksCount)} clicks
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {timeAgo(post.createdAt)}
                  </span>
                </div>

                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/search?tag=${tag}`}
                        className="flex items-center gap-1 px-3 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Author */}
                <Link
                  href={`/profile/${post.author?.username}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                >
                  {post.author?.avatar ? (
                    <img src={post.author.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-lg font-bold text-brand-600">
                      {post.author?.displayName?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{post.author?.displayName}</p>
                    <p className="text-sm text-surface-500">@{post.author?.username}</p>
                  </div>
                </Link>

                {/* Comments */}
                <div className="border-t border-surface-100 dark:border-surface-800 pt-5">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Comments ({comments.length})
                  </h3>

                  {isAuthenticated && (
                    <form onSubmit={handleComment} className="flex gap-2 mb-4">
                      <input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="input-field flex-1 py-2.5 text-sm"
                      />
                      <button type="submit" disabled={!newComment.trim()} className="btn-primary px-3">
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  )}

                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment._id} className="flex gap-3">
                        <Link href={`/profile/${comment.user?.username}`}>
                          {comment.user?.avatar ? (
                            <img src={comment.user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-xs font-bold text-brand-600">
                              {comment.user?.displayName?.[0]?.toUpperCase()}
                            </div>
                          )}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{comment.user?.displayName}</span>
                            <span className="text-xs text-surface-400">{timeAgo(comment.createdAt)}</span>
                          </div>
                          <p className="text-sm text-surface-600 dark:text-surface-400 mt-0.5">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <p className="text-center text-surface-400 text-sm py-4">No comments yet. Be the first!</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Posts */}
        {post.relatedPosts && post.relatedPosts.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold mb-6">More like this</h2>
            <Masonry
              breakpointCols={{ default: 5, 1280: 4, 1024: 3, 768: 2, 475: 2 }}
              className="masonry-grid"
              columnClassName="masonry-grid-column"
            >
              {post.relatedPosts.map((related, i) => (
                <PostCard key={related._id} post={related} index={i} />
              ))}
            </Masonry>
          </section>
        )}
      </div>

      {/* Report Modal */}
      <ReportModal
        postId={post._id}
        postTitle={post.title}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
}
