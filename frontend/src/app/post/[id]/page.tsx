'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { postsAPI, commentsAPI, downloadAPI } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { PostDetailSkeleton } from '@/components/shared/Skeletons';
import PostCard from '@/components/feed/PostCard';
import { Post, Comment } from '@/types';
import { formatPrice, formatNumber, timeAgo } from '@/lib/utils';
import {
  Heart, Bookmark, ExternalLink, Share2, MessageCircle, Send,
  ArrowLeft, Flag, MoreHorizontal, Sparkles, Eye, MousePointerClick,
  Calendar, Tag, Play, Video, Volume2, VolumeX, Download,
} from 'lucide-react';
import Masonry from 'react-masonry-css';
import toast from 'react-hot-toast';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data } = await postsAPI.getPost(params.id as string);
        setPost(data.data);
        setIsLiked(data.data.isLiked || false);
        setIsSaved(data.data.isSaved || false);
        setLikesCount(data.data.likesCount);
      } catch (error) {
        toast.error('Post not found');
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchComments = async () => {
      try {
        const { data } = await commentsAPI.getComments(params.id as string);
        setComments(data.data);
      } catch (e) { /* silent */ }
    };

    fetchPost();
    fetchComments();
  }, [params.id, router]);

  const handleLike = async () => {
    if (!isAuthenticated) { toast.error('Please login'); return; }
    try {
      const { data } = await postsAPI.toggleLike(post!._id);
      setIsLiked(data.data.isLiked);
      setLikesCount((p) => p + (data.data.isLiked ? 1 : -1));
    } catch { toast.error('Failed'); }
  };

  const handleSave = async () => {
    if (!isAuthenticated) { toast.error('Please login'); return; }
    try {
      const { data } = await postsAPI.toggleSave(post!._id);
      setIsSaved(data.data.isSaved);
      toast.success(data.data.isSaved ? 'Saved!' : 'Removed');
    } catch { toast.error('Failed'); }
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
    if (!post?.image?.fileId && !post?.image?.url) { toast.error('No image to download'); return; }
    try {
      if (post.image?.fileId) {
        const { data: blob } = await downloadAPI.downloadImage(post.image.fileId);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${post.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'image'}.jpg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else if (post.image?.url) {
        const res = await fetch(post.image.url);
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${post.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'image'}.jpg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
      toast.success('Download started!');
    } catch { toast.error('Download failed'); }
  };

  const handleProductClick = async () => {
    if (post) await postsAPI.trackClick(post._id);
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
                <button className="btn-ghost p-2">
                  <MoreHorizontal className="w-5 h-5" />
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
    </div>
  );
}
