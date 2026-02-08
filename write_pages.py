#!/usr/bin/env python3
"""Write remaining cyber-themed pages."""
import os

BASE = '/Users/macbook/Desktop/FullStack-App/picup/frontend/src'

files = {}

# ============================================================
# Post Detail Page - Cyber styled
# ============================================================
files[f'{BASE}/app/post/[id]/page.tsx'] = r"""'use client';

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
"""

# ============================================================
# Login Page - Cyber styled
# ============================================================
files[f'{BASE}/app/login/page.tsx'] = r"""'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { login } from '@/store/slices/authSlice';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Zap, Terminal } from 'lucide-react';
import MatrixText from '@/components/ui/MatrixText';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await dispatch(login({ email, password })).unwrap();
      toast.success('Access granted!');
      router.push('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Authentication failed');
    } finally { setIsLoading(false); }
  };

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left — Cyber Art */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-cyber-black">
          {/* Grid */}
          <div className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: 'linear-gradient(rgba(0,240,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.05) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }} />
          {/* Glow */}
          <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-cyber-glow/[0.06] rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-cyber-purple/[0.08] rounded-full blur-[80px]" />
          {/* Scan line */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute left-0 right-0 h-[1px] animate-scan-line"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.3), transparent)' }} />
          </div>
        </div>

        <div className="relative flex flex-col justify-center px-16 text-white z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)', boxShadow: '0 0 20px rgba(0,240,255,0.15)' }}>
              <Zap className="w-6 h-6 text-cyber-glow" />
            </div>
            <span className="text-3xl font-bold"><span className="text-white">Pic</span><span className="neon-text">Up</span></span>
          </div>
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            <MatrixText text="Welcome Back," className="text-white text-4xl font-bold" speed={35} delay={300} />
            <br />
            <MatrixText text="Operator" className="neon-text text-4xl font-bold" speed={35} delay={900} />
          </h2>
          <p className="text-white/30 font-mono text-sm max-w-md leading-relaxed">
            &gt; Authentication required to access the visual discovery matrix_
          </p>

          {/* Decorative code block */}
          <div className="mt-12 p-4 rounded-xl border border-cyber-glow/10 bg-black/30 backdrop-blur-sm font-mono text-xs text-white/30 max-w-sm">
            <div className="text-cyber-glow/50">// system.auth</div>
            <div className="mt-1"><span className="text-cyber-purple/70">const</span> user = <span className="text-cyber-neon/70">await</span> authenticate();</div>
            <div><span className="text-cyber-purple/70">if</span> (user.verified) {'{'}</div>
            <div className="pl-4"><span className="text-cyber-neon/70">grant</span>(<span className="text-cyber-amber/70">'full_access'</span>);</div>
            <div>{'}'}</div>
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)' }}>
                <Zap className="w-5 h-5 text-cyber-glow" />
              </div>
              <span className="text-2xl font-bold"><span className="text-white">Pic</span><span className="neon-text">Up</span></span>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-white">
              <Terminal className="w-5 h-5 inline mr-2 text-cyber-glow" />
              AUTHENTICATE
            </h1>
            <p className="text-white/30 font-mono text-xs">&gt; Enter credentials to continue_</p>
          </div>

          {/* OAuth */}
          <div className="space-y-3 mb-6">
            <a href={`${API}/auth/google`}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-cyber-glow/15 transition-all font-mono text-xs text-white/60 hover:text-white/80">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              GOOGLE_AUTH
            </a>
            <a href={`${API}/auth/github`}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-cyber-glow/15 transition-all font-mono text-xs text-white/60 hover:text-white/80">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              GITHUB_AUTH
            </a>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-glow/15 to-transparent" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-mono">
              <span className="px-3 text-white/20" style={{ background: 'var(--cyber-bg)' }}>or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-medium mb-1.5 text-white/50 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@matrix.io" required className="input-field pl-11 font-mono text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono font-medium mb-1.5 text-white/50 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required
                  className="input-field pl-11 pr-11 font-mono text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-cyber-glow transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 text-sm gap-2 font-mono">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-cyber-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Terminal className="w-4 h-4" /> AUTHENTICATE <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-white/30 mt-6 font-mono">
            No account?{' '}
            <Link href="/register" className="text-cyber-glow hover:underline">REGISTER</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
"""

# ============================================================
# Register Page - Cyber styled
# ============================================================
files[f'{BASE}/app/register/page.tsx'] = r"""'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { register } from '@/store/slices/authSlice';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Zap, Terminal, UserPlus } from 'lucide-react';
import MatrixText from '@/components/ui/MatrixText';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [form, setForm] = useState({ username: '', email: '', password: '', displayName: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password: min 6 characters'); return; }
    setIsLoading(true);
    try {
      await dispatch(register(form)).unwrap();
      toast.success('Account created! Welcome to PicUp');
      router.push('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally { setIsLoading(false); }
  };

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left — Cyber Art */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-cyber-black">
          <div className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: 'linear-gradient(rgba(191,0,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(191,0,255,0.05) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }} />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-cyber-purple/[0.08] rounded-full blur-[100px]" />
          <div className="absolute bottom-1/3 left-1/3 w-[300px] h-[300px] bg-cyber-neon/[0.05] rounded-full blur-[80px]" />
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute left-0 right-0 h-[1px] animate-scan-line"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(191,0,255,0.3), transparent)' }} />
          </div>
        </div>

        <div className="relative flex flex-col justify-center px-16 text-white z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(191,0,255,0.1)', border: '1px solid rgba(191,0,255,0.3)', boxShadow: '0 0 20px rgba(191,0,255,0.15)' }}>
              <Zap className="w-6 h-6 text-cyber-purple" />
            </div>
            <span className="text-3xl font-bold"><span className="text-white">Pic</span><span className="neon-text-pink">Up</span></span>
          </div>
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            <MatrixText text="Join the" className="text-white text-4xl font-bold" speed={35} delay={300} />
            <br />
            <MatrixText text="Network" className="neon-text-pink text-4xl font-bold" speed={35} delay={800} glowColor="rgba(255,0,170,0.6)" />
          </h2>
          <p className="text-white/30 font-mono text-sm max-w-md leading-relaxed">
            &gt; Create your identity in the visual discovery matrix_
          </p>

          <div className="mt-12 flex items-center gap-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-9 h-9 rounded-lg bg-cyber-card border border-cyber-border flex items-center justify-center text-[10px] font-bold text-cyber-glow font-mono"
                  style={{ boxShadow: '0 0 8px rgba(0,240,255,0.1)' }}>
                  U{i}
                </div>
              ))}
            </div>
            <p className="text-xs text-white/30 font-mono">
              <span className="text-cyber-neon">10K+</span> operators connected
            </p>
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(191,0,255,0.1)', border: '1px solid rgba(191,0,255,0.3)' }}>
                <Zap className="w-5 h-5 text-cyber-purple" />
              </div>
              <span className="text-2xl font-bold"><span className="text-white">Pic</span><span className="neon-text-pink">Up</span></span>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-white">
              <UserPlus className="w-5 h-5 inline mr-2 text-cyber-purple" />
              CREATE IDENTITY
            </h1>
            <p className="text-white/30 font-mono text-xs">&gt; Initialize your operator profile_</p>
          </div>

          {/* OAuth */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <a href={`${API}/auth/google`}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-cyber-glow/15 transition-all font-mono text-[11px] text-white/50 hover:text-white/70">
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </a>
            <a href={`${API}/auth/github`}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-cyber-glow/15 transition-all font-mono text-[11px] text-white/50 hover:text-white/70">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              GitHub
            </a>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-purple/15 to-transparent" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-mono">
              <span className="px-3 text-white/20" style={{ background: 'var(--cyber-bg)' }}>or</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono font-medium mb-1.5 text-white/40 uppercase tracking-wider">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-sm font-mono">@</span>
                  <input type="text" value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    placeholder="username" required className="input-field pl-9 font-mono text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono font-medium mb-1.5 text-white/40 uppercase tracking-wider">Display Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input type="text" value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    placeholder="Your Name" className="input-field pl-11 font-mono text-sm" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono font-medium mb-1.5 text-white/40 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="user@matrix.io" required className="input-field pl-11 font-mono text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono font-medium mb-1.5 text-white/40 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 6 characters" required minLength={6}
                  className="input-field pl-11 pr-11 font-mono text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-cyber-glow transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 text-sm gap-2 font-mono">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-cyber-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <><UserPlus className="w-4 h-4" /> CREATE_IDENTITY <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-white/30 mt-6 font-mono">
            Already connected?{' '}
            <Link href="/login" className="text-cyber-glow hover:underline">LOG_IN</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
"""

# ============================================================
# Create page - Cyber styled (preserving video upload logic)
# ============================================================
files[f'{BASE}/app/create/page.tsx'] = r"""'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { postsAPI, categoriesAPI, aiAPI, uploadAPI } from '@/lib/api';
import { Category, AIStyle } from '@/types';
import {
  Upload, X, ImagePlus, Sparkles, Tag, DollarSign, ExternalLink,
  Loader2, Wand2, AlertCircle, FileImage, Palette,
  Video, Play, Clock, Terminal, Zap,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

export default function CreatePostPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const [activeTab, setActiveTab] = useState<'upload' | 'video' | 'ai'>('upload');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [uploadedPublicId, setUploadedPublicId] = useState('');

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoError, setVideoError] = useState('');
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadedVideoData, setUploadedVideoData] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiStyle, setAiStyle] = useState('');
  const [aiStyles, setAiStyles] = useState<AIStyle[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    const fetchData = async () => {
      try {
        const [catRes, styleRes] = await Promise.all([categoriesAPI.getAll(), aiAPI.getStyles()]);
        setCategories(catRes.data.data || []);
        setAiStyles(styleRes.data.data || []);
      } catch { /* silent */ }
    };
    fetchData();
  }, [isAuthenticated, router]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      setGeneratedImage('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const onVideoDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setVideoFile(file);
      setVideoError('');
      setUploadedVideoData(null);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        const dur = video.duration;
        setVideoDuration(dur);
        if (dur > 15) setVideoError(`Video is ${Math.round(dur)}s. Maximum is 15 seconds.`);
        else if (dur < 1) setVideoError('Video too short. Minimum 1 second.');
      };
      video.src = url;
    }
  }, []);

  const { getRootProps: getVideoRootProps, getInputProps: getVideoInputProps, isDragActive: isVideoDragActive } = useDropzone({
    onDrop: onVideoDrop,
    accept: { 'video/*': ['.mp4', '.webm', '.mov', '.avi'] },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  });

  const clearVideo = () => { setVideoFile(null); setVideoPreview(''); setVideoDuration(0); setVideoError(''); setUploadedVideoData(null); };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (tag && !tags.includes(tag) && tags.length < 10) { setTags([...tags, tag]); setTagInput(''); }
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const { data } = await aiAPI.generateImage({ prompt: aiPrompt, style: aiStyle || undefined });
      setGeneratedImage(data.data.imageUrl);
      setUploadedImageUrl(data.data.imageUrl);
      setImagePreview(''); setImageFile(null);
      toast.success('Image generated!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Generation failed');
    } finally { setIsGenerating(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Title required'); return; }
    const isVideoPost = activeTab === 'video';
    if (isVideoPost) {
      if (!videoFile && !uploadedVideoData) { toast.error('Video required'); return; }
      if (videoError) { toast.error(videoError); return; }
    } else {
      if (!imageFile && !generatedImage && !uploadedImageUrl) { toast.error('Image required'); return; }
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      if (description.trim()) formData.append('description', description.trim());
      if (tags.length > 0) formData.append('tags', JSON.stringify(tags));
      if (categoryId) formData.append('category', categoryId);
      if (productUrl.trim()) formData.append('productUrl', productUrl.trim());
      if (price) formData.append('price', JSON.stringify({ amount: parseFloat(price), currency }));

      if (isVideoPost) {
        formData.append('mediaType', 'video');
        if (videoFile && !uploadedVideoData) {
          setIsUploadingVideo(true);
          const videoFormData = new FormData();
          videoFormData.append('video', videoFile);
          try {
            const uploadRes = await uploadAPI.uploadVideo(videoFormData);
            const vData = uploadRes.data.data;
            setUploadedVideoData(vData);
            formData.append('videoData', JSON.stringify(vData));
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'Video upload failed');
            setIsSubmitting(false); setIsUploadingVideo(false); return;
          }
          setIsUploadingVideo(false);
        } else if (uploadedVideoData) {
          formData.append('videoData', JSON.stringify(uploadedVideoData));
        }
      } else {
        formData.append('mediaType', 'image');
        if (generatedImage || uploadedImageUrl) {
          formData.append('isAiGenerated', String(!!generatedImage));
          formData.append('aiImageUrl', generatedImage || uploadedImageUrl);
        } else if (imageFile) {
          formData.append('media', imageFile);
        }
      }

      const { data } = await postsAPI.createPost(formData);
      toast.success('Post created!');
      router.push(`/post/${data.data._id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create post');
    } finally { setIsSubmitting(false); setIsUploadingVideo(false); }
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-6 h-6 text-cyber-glow" />
          <h1 className="text-2xl font-bold text-white">CREATE_POST</h1>
        </div>
        <p className="text-white/30 font-mono text-xs mb-8">&gt; Upload media or generate with AI to publish_</p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left — Media */}
          <div>
            {/* Tab switcher */}
            <div className="flex rounded-xl p-1 mb-4 gap-1" style={{ background: 'rgba(0,240,255,0.03)', border: '1px solid rgba(0,240,255,0.08)' }}>
              {[
                { key: 'upload' as const, icon: FileImage, label: 'IMAGE' },
                { key: 'video' as const, icon: Video, label: 'VIDEO' },
                { key: 'ai' as const, icon: Sparkles, label: 'AI_GEN' },
              ].map((tab) => (
                <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider transition-all
                    ${activeTab === tab.key
                      ? 'bg-cyber-glow/10 border border-cyber-glow/25 text-cyber-glow shadow-cyber'
                      : 'text-white/30 hover:text-white/50 border border-transparent'}`}>
                  <tab.icon className="w-3.5 h-3.5" />{tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'upload' ? (
              <div {...getRootProps()}
                className={`relative aspect-[3/4] rounded-xl border-2 border-dashed transition-all cursor-pointer flex items-center justify-center overflow-hidden
                  ${isDragActive ? 'border-cyber-glow bg-cyber-glow/[0.03]' : 'border-cyber-border hover:border-cyber-glow/30'}`}
                style={{ background: 'linear-gradient(135deg, rgba(14,14,30,0.6), rgba(20,20,42,0.4))' }}>
                <input {...getInputProps()} />
                {imagePreview ? (
                  <div className="relative w-full h-full">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(''); }}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-white hover:text-cyber-red transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <div className="w-16 h-16 rounded-xl bg-cyber-glow/[0.05] border border-cyber-glow/15 flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-7 h-7 text-cyber-glow/50" />
                    </div>
                    <p className="font-mono text-sm text-white/50 mb-1">DROP_IMAGE_HERE</p>
                    <p className="text-xs text-white/20 font-mono">PNG, JPG, WEBP // Max 10 MB</p>
                  </div>
                )}
              </div>
            ) : activeTab === 'video' ? (
              <div className="space-y-4">
                <div {...getVideoRootProps()}
                  className={`relative aspect-[3/4] rounded-xl border-2 border-dashed transition-all cursor-pointer flex items-center justify-center overflow-hidden
                    ${isVideoDragActive ? 'border-cyber-purple bg-cyber-purple/[0.03]' : 'border-cyber-border hover:border-cyber-purple/30'}`}
                  style={{ background: 'linear-gradient(135deg, rgba(14,14,30,0.6), rgba(20,20,42,0.4))' }}>
                  <input {...getVideoInputProps()} />
                  {videoPreview ? (
                    <div className="relative w-full h-full bg-black">
                      <video ref={videoRef} src={videoPreview} className="w-full h-full object-contain" controls muted playsInline />
                      <button type="button" onClick={(e) => { e.stopPropagation(); clearVideo(); }}
                        className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-white hover:text-cyber-red z-10 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                      {videoDuration > 0 && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-cyber-glow/20 text-cyber-glow text-xs font-mono z-10">
                          <Clock className="w-3 h-3" />{formatDuration(videoDuration)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <div className="w-16 h-16 rounded-xl bg-cyber-purple/[0.05] border border-cyber-purple/15 flex items-center justify-center mx-auto mb-4">
                        <Video className="w-7 h-7 text-cyber-purple/50" />
                      </div>
                      <p className="font-mono text-sm text-white/50 mb-1">DROP_VIDEO_HERE</p>
                      <p className="text-xs text-white/20 font-mono">MP4, WebM, MOV // Max 15s // 50 MB</p>
                    </div>
                  )}
                </div>
                {videoError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl border border-cyber-red/20 text-cyber-red text-xs font-mono"
                    style={{ background: 'rgba(255,0,60,0.05)' }}>
                    <AlertCircle className="w-4 h-4 shrink-0" />{videoError}
                  </div>
                )}
                {videoFile && !videoError && videoDuration > 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-xl border border-cyber-neon/20 text-cyber-neon text-xs font-mono"
                    style={{ background: 'rgba(0,255,136,0.03)' }}>
                    <Play className="w-4 h-4 shrink-0" />
                    VIDEO_READY // {formatDuration(videoDuration)} // {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(14,14,30,0.6), rgba(20,20,42,0.4))', border: '1px solid rgba(191,0,255,0.1)' }}>
                  {generatedImage ? (
                    <div className="relative w-full h-full">
                      <img src={generatedImage} alt="Generated" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setGeneratedImage('')}
                        className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-white hover:text-cyber-red transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: 'linear-gradient(135deg, rgba(191,0,255,0.1), rgba(0,240,255,0.1))', border: '1px solid rgba(191,0,255,0.2)', boxShadow: '0 0 20px rgba(191,0,255,0.1)' }}>
                        <Wand2 className="w-7 h-7 text-cyber-purple" />
                      </div>
                      <p className="font-mono text-sm text-white/50 mb-1">AI_IMAGE_GEN</p>
                      <p className="text-xs text-white/20 font-mono">Describe what to generate_</p>
                    </div>
                  )}
                  {isGenerating && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                      <div className="text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-cyber-glow mx-auto mb-3" />
                        <p className="font-mono text-sm text-cyber-glow">GENERATING...</p>
                        <p className="text-xs text-white/30 font-mono mt-1">Processing neural network_</p>
                      </div>
                    </div>
                  )}
                </div>
                <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="> Describe your vision..." rows={3} className="input-field resize-none font-mono text-sm" />
                {aiStyles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {aiStyles.map((s) => (
                      <button key={s.id} type="button" onClick={() => setAiStyle(aiStyle === s.id ? '' : s.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all border
                          ${aiStyle === s.id
                            ? 'border-cyber-purple/40 bg-cyber-purple/10 text-cyber-purple'
                            : 'border-white/[0.06] text-white/30 hover:text-white/50 hover:border-white/10'}`}>
                        <Palette className="w-3 h-3" />{s.name}
                      </button>
                    ))}
                  </div>
                )}
                <button type="button" onClick={handleGenerate} disabled={!aiPrompt.trim() || isGenerating}
                  className="btn-primary w-full gap-2 py-3 font-mono text-xs">
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isGenerating ? 'GENERATING...' : 'GENERATE_IMAGE'}
                </button>
              </div>
            )}
          </div>

          {/* Right — Details */}
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-mono font-medium mb-1.5 text-white/40 uppercase tracking-wider">Title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter post title" className="input-field font-mono" maxLength={200} />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-medium mb-1.5 text-white/40 uppercase tracking-wider">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your post..." rows={4} className="input-field resize-none" maxLength={5000} />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-medium mb-1.5 text-white/40 uppercase tracking-wider">Tags</label>
              <div className="flex gap-2">
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  placeholder="Add tag" className="input-field flex-1 font-mono" />
                <button type="button" onClick={addTag} className="btn-ghost px-3 text-cyber-glow">
                  <Tag className="w-4 h-4" />
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((t) => (
                    <span key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyber-glow/5 border border-cyber-glow/15 text-cyber-glow text-xs font-mono">
                      #{t}
                      <button type="button" onClick={() => removeTag(t)}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-mono font-medium mb-1.5 text-white/40 uppercase tracking-wider">Category</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-field font-mono">
                <option value="">Select category</option>
                {categories.map((c) => (<option key={c._id} value={c._id}>{c.icon} {c.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono font-medium mb-1.5 text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                <ExternalLink className="w-3 h-3" /> Product URL
              </label>
              <input value={productUrl} onChange={(e) => setProductUrl(e.target.value)}
                placeholder="https://..." className="input-field font-mono" type="url" />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-medium mb-1.5 text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3 h-3" /> Price (optional)
              </label>
              <div className="flex gap-2">
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input-field w-24 font-mono">
                  <option value="USD">USD</option><option value="EUR">EUR</option>
                  <option value="GBP">GBP</option><option value="MAD">MAD</option>
                </select>
                <input value={price} onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00" className="input-field flex-1 font-mono" type="number" step="0.01" min="0" />
              </div>
            </div>
            <button type="submit"
              disabled={isSubmitting || isUploadingVideo || !title.trim() ||
                (activeTab === 'video' ? (!videoFile && !uploadedVideoData) || !!videoError : !imageFile && !generatedImage && !uploadedImageUrl)}
              className="btn-primary w-full py-3.5 text-sm gap-2 font-mono">
              {isSubmitting || isUploadingVideo ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> {isUploadingVideo ? 'UPLOADING_VIDEO...' : 'PUBLISHING...'}</>
              ) : (
                <><Terminal className="w-4 h-4" /> PUBLISH_POST</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
"""

# ============================================================
# Skeletons - Updated for cyber theme
# ============================================================
files[f'{BASE}/components/shared/Skeletons.tsx'] = r"""'use client';

export function FeedSkeleton() {
  return (
    <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-3">
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} className="mb-3 break-inside-avoid rounded-xl overflow-hidden"
          style={{
            height: `${200 + Math.random() * 200}px`,
            background: 'linear-gradient(135deg, rgba(14,14,30,0.5), rgba(20,20,42,0.3))',
            border: '1px solid rgba(0,240,255,0.05)',
          }}>
          <div className="skeleton w-full h-full" />
        </div>
      ))}
    </div>
  );
}

export function PostDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="skeleton h-8 w-24 rounded-lg mb-4" />
      <div className="cyber-glass-strong rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="skeleton aspect-square" />
          <div className="p-6 space-y-4">
            <div className="skeleton h-6 w-3/4 rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-2/3 rounded" />
            <div className="skeleton h-20 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
"""

for path, content in files.items():
    directory = os.path.dirname(path)
    os.makedirs(directory, exist_ok=True)
    with open(path, 'w') as f:
        f.write(content.lstrip('\n'))
    print(f"  ✅ {os.path.relpath(path, '/Users/macbook/Desktop/FullStack-App/picup/frontend')}")

print(f"\n🎮 {len(files)} pages written successfully!")
