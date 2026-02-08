'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { postsAPI, commentsAPI } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { PostDetailSkeleton } from '@/components/shared/Skeletons';
import PostCard from '@/components/feed/PostCard';
import MatrixText from '@/components/ui/MatrixText';
import { Post, Comment } from '@/types';
import { formatPrice, formatNumber, timeAgo } from '@/lib/utils';
import {
  Heart, Bookmark, ExternalLink, Share2, MessageCircle, Send,
  ArrowLeft, MoreHorizontal, Sparkles, Eye, MousePointerClick,
  Calendar, Tag, Play, Volume2, VolumeX, Terminal, Zap,
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
      } finally { setIsLoading(false); }
    };
    const fetchComments = async () => {
      try {
        const { data } = await commentsAPI.getComments(params.id as string);
        setComments(data.data);
      } catch { /* silent */ }
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

  const handleProductClick = async () => {
    if (post) await postsAPI.trackClick(post._id);
  };

  if (isLoading || !post) return <PostDetailSkeleton />;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Back */}
        <button onClick={() => router.back()}
          className="btn-ghost mb-4 gap-2 font-mono text-xs text-white/50 hover:text-cyber-glow">
          <ArrowLeft className="w-4 h-4" />&lt; BACK
        </button>

        {/* Main card */}
        <div className="cyber-glass-strong rounded-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Media */}
            <div className="relative bg-cyber-black/50 overflow-hidden">
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-16 h-[1px] bg-gradient-to-r from-cyber-glow/40 to-transparent z-10" />
              <div className="absolute top-0 left-0 h-16 w-[1px] bg-gradient-to-b from-cyber-glow/40 to-transparent z-10" />
              <div className="absolute bottom-0 right-0 w-16 h-[1px] bg-gradient-to-l from-cyber-purple/40 to-transparent z-10" />
              <div className="absolute bottom-0 right-0 h-16 w-[1px] bg-gradient-to-t from-cyber-purple/40 to-transparent z-10" />

              {post.mediaType === 'video' && post.video?.url ? (
                <div className="relative">
                  <video
                    src={post.video.url} controls playsInline
                    className="w-full max-h-[80vh] object-contain bg-black"
                    poster={post.video.thumbnailUrl || post.image?.url}
                  />
                  {post.video.duration && (
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-cyber-glow/20 text-cyber-glow text-sm font-mono font-medium">
                      <Play className="w-4 h-4" fill="currentColor" />
                      {Math.round(post.video.duration)}s
                    </div>
                  )}
                </div>
              ) : (
                <img src={post.image?.url} alt={post.title}
                  className="w-full h-full object-contain max-h-[80vh]" />
              )}
              {post.isAiGenerated && (
                <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyber-purple/80 backdrop-blur-sm border border-cyber-purple/40 text-white text-xs font-mono font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" /> AI_GENERATED
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col">
              {/* Actions bar */}
              <div className="flex items-center justify-between p-4 border-b border-cyber-glow/8">
                <div className="flex items-center gap-1.5">
                  <button onClick={handleLike}
                    className={`btn-ghost gap-1.5 font-mono text-xs ${isLiked ? 'text-cyber-pink' : 'text-white/50'}`}>
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    {formatNumber(likesCount)}
                  </button>
                  <button onClick={handleSave}
                    className={`btn-ghost gap-1.5 font-mono text-xs ${isSaved ? 'text-cyber-glow' : 'text-white/50'}`}>
                    <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                    SAVE
                  </button>
                  <button onClick={handleShare} className="btn-ghost gap-1.5 font-mono text-xs text-white/50">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
                <button className="btn-ghost p-2 text-white/30">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 space-y-5 overflow-y-auto max-h-[60vh]">
                <div>
                  <h1 className="text-2xl font-bold mb-3 text-white leading-tight">{post.title}</h1>
                  {post.description && (
                    <p className="text-white/50 leading-relaxed text-sm">{post.description}</p>
                  )}
                </div>

                {/* Product URL */}
                {post.productUrl && (
                  <a href={post.productUrl} target="_blank" rel="noopener noreferrer"
                    onClick={handleProductClick}
                    className="flex items-center gap-3 p-4 rounded-xl border border-cyber-glow/15 group transition-all hover:border-cyber-glow/30"
                    style={{ background: 'linear-gradient(135deg, rgba(0,240,255,0.04), rgba(191,0,255,0.04))' }}>
                    <div className="flex-1">
                      {post.price?.amount && (
                        <p className="text-2xl font-bold neon-text font-mono">{formatPrice(post.price.amount)}</p>
                      )}
                      <p className="text-xs text-white/30 truncate font-mono">{post.productUrl}</p>
                    </div>
                    <div className="btn-primary gap-1.5 text-xs font-mono">
                      <ExternalLink className="w-3.5 h-3.5" />
                      {post.price?.amount ? 'BUY' : 'VISIT'}
                    </div>
                  </a>
                )}

                {/* Meta */}
                <div className="flex flex-wrap gap-4 text-xs font-mono text-white/30">
                  <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />{formatNumber(post.viewsCount)} views</span>
                  <span className="flex items-center gap-1.5"><MousePointerClick className="w-3.5 h-3.5" />{formatNumber(post.clicksCount)} clicks</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{timeAgo(post.createdAt)}</span>
                </div>

                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Link key={tag} href={`/search?tag=${tag}`}
                        className="flex items-center gap-1 px-3 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-xs font-mono text-white/40 hover:text-cyber-glow hover:border-cyber-glow/20 transition-all">
                        <Tag className="w-3 h-3" />{tag}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Author */}
                <Link href={`/profile/${post.author?.username}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] border border-transparent hover:border-cyber-glow/8 transition-all">
                  {post.author?.avatar ? (
                    <img src={post.author.avatar} alt="" className="w-11 h-11 rounded-lg object-cover ring-1 ring-cyber-glow/15" />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-cyber-card border border-cyber-glow/15 flex items-center justify-center text-base font-bold text-cyber-glow font-mono">
                      {post.author?.displayName?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-white">{post.author?.displayName}</p>
                    <p className="text-xs text-cyber-glow/50 font-mono">@{post.author?.username}</p>
                  </div>
                </Link>

                {/* Comments */}
                <div className="border-t border-cyber-glow/8 pt-5">
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-sm text-white/80">
                    <MessageCircle className="w-4 h-4 text-cyber-glow/60" />
                    <span className="font-mono">COMMENTS ({comments.length})</span>
                  </h3>

                  {isAuthenticated && (
                    <form onSubmit={handleComment} className="flex gap-2 mb-4">
                      <input value={newComment} onChange={(e) => setNewComment(e.target.value)}
                        placeholder="> Add a comment..." className="input-field flex-1 py-2.5 text-xs font-mono" />
                      <button type="submit" disabled={!newComment.trim()} className="btn-primary px-3 py-2">
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  )}

                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment._id} className="flex gap-3 p-3 rounded-lg hover:bg-white/[0.02] transition-colors">
                        <Link href={`/profile/${comment.user?.username}`}>
                          {comment.user?.avatar ? (
                            <img src={comment.user.avatar} alt="" className="w-7 h-7 rounded-md object-cover ring-1 ring-cyber-border" />
                          ) : (
                            <div className="w-7 h-7 rounded-md bg-cyber-card border border-cyber-border flex items-center justify-center text-[10px] font-bold text-cyber-glow font-mono">
                              {comment.user?.displayName?.[0]?.toUpperCase()}
                            </div>
                          )}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white/80">{comment.user?.displayName}</span>
                            <span className="text-[10px] text-white/20 font-mono">{timeAgo(comment.createdAt)}</span>
                          </div>
                          <p className="text-xs text-white/50 mt-0.5">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <p className="text-center text-white/20 text-xs py-4 font-mono">&gt; No comments yet. Be the first_</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related */}
        {post.relatedPosts && post.relatedPosts.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyber-glow" />
              <span className="font-mono text-white/80">RELATED_POSTS</span>
            </h2>
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
