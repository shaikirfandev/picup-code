'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { blogAPI } from '@/lib/api';
import { BlogPost } from '@/types';
import { useAppSelector } from '@/store/hooks';
import Link from 'next/link';
import BlogFooter from '@/components/layout/BlogFooter';
import {
  Clock, Eye, Heart, Share2, ArrowLeft, Calendar, Tag,
  BookOpen, MessageCircle, Twitter, Linkedin, Copy, Check,
  ChevronRight, User, Bookmark, Flag,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import ReportModal from '@/components/shared/ReportModal';

function formatDate(d: string) {
  try { return format(new Date(d), 'MMMM dd, yyyy'); } catch { return ''; }
}

function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? `${window.location.origin}/blog/${slug}` : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-mono uppercase tracking-widest mr-1" style={{ color: 'var(--edith-text-muted)' }}>Share</span>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
        target="_blank" rel="noopener noreferrer"
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:text-edith-cyan"
        style={{ background: 'var(--edith-accent-subtle)', color: 'var(--edith-text-dim)', border: '1px solid var(--edith-border)' }}
      >
        <Twitter className="w-3.5 h-3.5" />
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank" rel="noopener noreferrer"
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:text-edith-cyan"
        style={{ background: 'var(--edith-accent-subtle)', color: 'var(--edith-text-dim)', border: '1px solid var(--edith-border)' }}
      >
        <Linkedin className="w-3.5 h-3.5" />
      </a>
      <button
        onClick={copyLink}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:text-edith-cyan"
        style={{ background: 'var(--edith-accent-subtle)', color: copied ? 'var(--edith-success)' : 'var(--edith-text-dim)', border: '1px solid var(--edith-border)' }}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

export default function BlogPostPage() {
  const params = useParams();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data } = await blogAPI.getPost(params.slug as string);
        setPost(data.data);
        // Fetch related posts by same category
        if (data.data?.category) {
          try {
            const related = await blogAPI.getPosts({ limit: 3, category: data.data.category, sort: 'popular' });
            setRelatedPosts((related.data.data || []).filter((p: BlogPost) => p._id !== data.data._id).slice(0, 3));
          } catch { /* noop */ }
        }
      } catch (e) {
        console.error('Failed to fetch blog post:', e);
      } finally {
        setIsLoading(false);
      }
    };
    if (params.slug) fetchPost();
  }, [params.slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="animate-pulse space-y-6">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-10 w-3/4 rounded" />
            <div className="flex items-center gap-4">
              <div className="skeleton w-10 h-10 rounded-full" />
              <div className="space-y-2">
                <div className="skeleton h-3 w-32 rounded" />
                <div className="skeleton h-3 w-24 rounded" />
              </div>
            </div>
            <div className="skeleton h-80 w-full rounded-xl" />
            <div className="space-y-3">
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-5/6 rounded" />
              <div className="skeleton h-4 w-4/6 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-3/4 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 mx-auto text-edith-cyan/20 mb-4" />
          <h2 className="text-xl font-display font-bold mb-2" style={{ color: 'var(--edith-text)' }}>
            Article not found
          </h2>
          <p className="text-xs font-mono mb-4" style={{ color: 'var(--edith-text-dim)' }}>
            This article may have been removed or doesn't exist.
          </p>
          <Link href="/blog" className="btn-primary inline-flex gap-2 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* ═══ ARTICLE ═══ */}
      <article className="max-w-4xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-[10px] font-mono" style={{ color: 'var(--edith-text-muted)' }}>
          <Link href="/blog" className="hover:text-edith-cyan transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Blog
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/blog?category=${post.category}`} className="hover:text-edith-cyan transition-colors capitalize">
            {post.category}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="truncate max-w-[200px]" style={{ color: 'var(--edith-text-dim)' }}>{post.title}</span>
        </div>

        {/* Header */}
        <header className="mb-8">
          {/* Category + Read time */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-edith-cyan px-2.5 py-1 rounded"
              style={{ background: 'var(--edith-accent-muted)', border: '1px solid var(--edith-border-strong)' }}>
              {post.category}
            </span>
            <span className="text-[10px] font-mono flex items-center gap-1" style={{ color: 'var(--edith-text-dim)' }}>
              <Clock className="w-3 h-3" /> {post.readTime} min read
            </span>
            {post.isFeatured && (
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-edith-amber px-2 py-0.5 rounded"
                style={{ background: 'var(--edith-warning-bg)', border: '1px solid rgba(255,170,0,0.2)' }}>
                Featured
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-display font-bold mb-6 leading-tight tracking-tight"
            style={{ color: 'var(--edith-text)' }}>
            {post.title}
          </h1>

          {/* Author row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6"
            style={{ borderBottom: '1px solid var(--edith-border)' }}>
            <div className="flex items-center gap-3">
              {post.author?.avatar ? (
                <img src={post.author.avatar} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-edith-cyan/15" />
              ) : (
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-edith-cyan"
                  style={{ background: 'var(--edith-accent-muted)' }}>
                  {post.author?.displayName?.[0] || '?'}
                </div>
              )}
              <div>
                <Link href={`/profile/${post.author?.username}`}
                  className="text-sm font-semibold hover:text-edith-cyan transition-colors" style={{ color: 'var(--edith-text)' }}>
                  {post.author?.displayName}
                </Link>
                <div className="flex items-center gap-3 text-[10px] font-mono" style={{ color: 'var(--edith-text-muted)' }}>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {formatDate(post.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-[10px] font-mono" style={{ color: 'var(--edith-text-muted)' }}>
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {post.viewsCount} views</span>
                <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {post.likesCount}</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {post.commentsCount}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Cover image */}
        {post.coverImage?.url && (
          <div className="mb-10 rounded-xl overflow-hidden" style={{ border: '1px solid var(--edith-border)', boxShadow: 'var(--edith-shadow-md)' }}>
            <img src={post.coverImage.url} alt={post.title} className="w-full object-cover max-h-[500px]" />
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-invert dark:prose-invert max-w-none mb-10
            prose-headings:font-display prose-headings:tracking-tight
            prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
            prose-p:font-mono prose-p:text-sm prose-p:leading-relaxed
            prose-a:text-edith-cyan prose-a:no-underline hover:prose-a:underline
            prose-code:text-edith-cyan prose-code:text-xs
            prose-pre:rounded-lg prose-pre:border
            prose-img:rounded-lg prose-img:border
            prose-blockquote:border-edith-cyan/30 prose-blockquote:bg-edith-cyan/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1
            prose-li:font-mono prose-li:text-sm"
          style={{ color: 'var(--edith-text-secondary)' }}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-8 pb-8" style={{ borderBottom: '1px solid var(--edith-border)' }}>
            <Tag className="w-3.5 h-3.5 text-edith-cyan/40 shrink-0" />
            {post.tags.map((tag) => (
              <Link key={tag} href={`/blog?search=${tag}`}
                className="text-[10px] font-mono px-2.5 py-1 rounded transition-all hover:text-edith-cyan hover:border-edith-cyan/20"
                style={{ color: 'var(--edith-tag-text)', background: 'var(--edith-tag-bg)', border: '1px solid var(--edith-tag-border)' }}>
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Share + Actions */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <ShareButtons title={post.title} slug={post.slug} />
            {isAuthenticated && post.author && (post.author as any)._id !== undefined && (
              <button
                onClick={() => setReportOpen(true)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:text-red-400 hover:border-red-500/30"
                style={{ background: 'var(--edith-accent-subtle)', color: 'var(--edith-text-dim)', border: '1px solid var(--edith-border)' }}
                title="Report this article"
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Link href="/blog" className="text-[10px] font-mono flex items-center gap-1 hover:text-edith-cyan transition-colors"
            style={{ color: 'var(--edith-text-dim)' }}>
            <ArrowLeft className="w-3 h-3" /> Back to Blog
          </Link>
        </div>

        {/* Author Card */}
        <div className="rounded-xl p-6 mb-12" style={{ background: 'var(--edith-panel)', border: '1px solid var(--edith-border)' }}>
          <div className="flex items-start gap-4">
            {post.author?.avatar ? (
              <img src={post.author.avatar} alt="" className="w-14 h-14 rounded-full object-cover ring-2 ring-edith-cyan/15 shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-edith-cyan shrink-0"
                style={{ background: 'var(--edith-accent-muted)' }}>
                {post.author?.displayName?.[0] || '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-display font-bold" style={{ color: 'var(--edith-text)' }}>
                  {post.author?.displayName}
                </h3>
                {post.author?.isVerified && (
                  <span className="text-[8px] font-mono text-edith-cyan px-1.5 py-0.5 rounded"
                    style={{ background: 'var(--edith-accent-muted)', border: '1px solid var(--edith-border-strong)' }}>
                    Verified
                  </span>
                )}
              </div>
              <p className="text-[10px] font-mono mb-2" style={{ color: 'var(--edith-text-muted)' }}>
                @{post.author?.username}
              </p>
              {post.author?.bio && (
                <p className="text-xs font-mono leading-relaxed" style={{ color: 'var(--edith-text-dim)' }}>
                  {post.author.bio}
                </p>
              )}
              <div className="mt-3">
                <Link href={`/profile/${post.author?.username}`}
                  className="btn-secondary text-[10px] px-4 py-1.5 inline-flex gap-1.5">
                  <User className="w-3 h-3" /> View Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* ═══ RELATED POSTS ═══ */}
      {relatedPosts.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 pb-16">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-4 h-4 text-edith-cyan" />
            <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-edith-cyan/70">
              Related Articles
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {relatedPosts.map((rp) => (
              <Link key={rp._id} href={`/blog/${rp.slug}`} className="group block">
                <article className="rounded-xl overflow-hidden transition-all duration-300"
                  style={{ background: 'var(--edith-card-bg)', border: '1px solid var(--edith-border)', boxShadow: 'var(--edith-shadow-sm)' }}>
                  <div className="aspect-video overflow-hidden">
                    {rp.coverImage?.url ? (
                      <img src={rp.coverImage.url} alt={rp.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--edith-panel)' }}>
                        <BookOpen className="w-8 h-8 text-edith-cyan/15" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-edith-cyan/60">{rp.category}</span>
                    <h3 className="text-xs font-semibold line-clamp-2 mt-1 group-hover:text-edith-cyan transition-colors"
                      style={{ color: 'var(--edith-text)' }}>
                      {rp.title}
                    </h3>
                    <p className="text-[9px] font-mono mt-1.5 flex items-center gap-2" style={{ color: 'var(--edith-text-muted)' }}>
                      <span>{rp.author?.displayName}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {rp.readTime} min</span>
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══ FOOTER ═══ */}
      <BlogFooter />

      {/* Report Modal */}
      {post && (
        <ReportModal
          blogPostId={post._id}
          postTitle={post.title}
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  );
}
