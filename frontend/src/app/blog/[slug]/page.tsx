'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { blogAPI } from '@/lib/api';
import { BlogPost } from '@/types';
import { useAppSelector } from '@/store/hooks';
import Link from 'next/link';
import BlogFooter from '@/components/layout/BlogFooter';
import {
  Clock, Heart, ArrowLeft,
  BookOpen, MessageCircle, Twitter, Linkedin, Copy, Check,
  Flag, MoreHorizontal,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import ReportModal from '@/components/shared/ReportModal';

function formatDate(d: string) {
  try { return format(new Date(d), 'MMM dd, yyyy'); } catch { return ''; }
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
    <div className="flex items-center gap-3">
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
        target="_blank" rel="noopener noreferrer"
        className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
        style={{ color: 'var(--text-secondary)' }}
      >
        <Twitter className="w-5 h-5" />
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank" rel="noopener noreferrer"
        className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
        style={{ color: 'var(--text-secondary)' }}
      >
        <Linkedin className="w-5 h-5" />
      </a>
      <button
        onClick={copyLink}
        className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
        style={{ color: copied ? 'var(--success)' : 'var(--text-secondary)' }}
      >
        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
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
        if (data.data?.category) {
          try {
            const related = await blogAPI.getPosts({ limit: 4, category: data.data.category, sort: 'popular' });
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
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <div className="max-w-[680px] mx-auto px-6 py-16">
          <div className="animate-pulse space-y-8">
            <div className="skeleton h-12 w-4/5 rounded" />
            <div className="skeleton h-6 w-3/5 rounded" />
            <div className="flex items-center gap-3">
              <div className="skeleton w-12 h-12 rounded-full" />
              <div className="space-y-2">
                <div className="skeleton h-4 w-32 rounded" />
                <div className="skeleton h-3 w-48 rounded" />
              </div>
            </div>
            <div className="skeleton h-[400px] w-full rounded-lg" />
            <div className="space-y-4">
              <div className="skeleton h-5 w-full rounded" />
              <div className="skeleton h-5 w-5/6 rounded" />
              <div className="skeleton h-5 w-4/6 rounded" />
              <div className="skeleton h-5 w-full rounded" />
              <div className="skeleton h-5 w-3/4 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--border-strong)' }} />
          <h2 className="text-[22px] font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            Article not found
          </h2>
          <p className="text-[15px] mb-6" style={{ color: 'var(--text-secondary)' }}>
            This article may have been removed or doesn&apos;t exist.
          </p>
          <Link href="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-medium"
            style={{ background: 'var(--foreground)', color: 'var(--background)' }}>
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* ═══ ARTICLE ═══ */}
      <article className="max-w-[680px] mx-auto px-6 pt-10 pb-8">
        {/* Title */}
        <h1 className="text-[32px] md:text-[42px] font-extrabold leading-[1.15] tracking-tight mb-4"
          style={{ color: 'var(--foreground)', letterSpacing: '-0.016em' }}>
          {post.title}
        </h1>

        {/* Subtitle / Excerpt */}
        {post.excerpt && (
          <p className="text-[20px] md:text-[22px] leading-[1.4] mb-8"
            style={{ color: 'var(--text-secondary)' }}>
            {post.excerpt}
          </p>
        )}

        {/* Author row */}
        <div className="flex items-center gap-3 mb-8 pb-8" style={{ borderBottom: '1px solid var(--border)' }}>
          {post.author?.avatar ? (
            <img src={post.author.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-bold"
              style={{ background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}>
              {post.author?.displayName?.[0] || '?'}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Link href={`/profile/${post.author?.username}`}
                className="text-[16px] font-medium hover:underline" style={{ color: 'var(--foreground)' }}>
                {post.author?.displayName}
              </Link>
              {post.author?.isVerified && (
                <span className="text-[12px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
                  Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[14px]" style={{ color: 'var(--text-tertiary)' }}>
              <span>{post.readTime} min read</span>
              <span>·</span>
              <span>{formatDate(post.createdAt)}</span>
              {post.isFeatured && (
                <>
                  <span>·</span>
                  <span className="text-[13px] font-medium" style={{ color: 'var(--accent)' }}>Featured</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between mb-8 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-5 text-[14px]" style={{ color: 'var(--text-tertiary)' }}>
            <span className="flex items-center gap-1.5"><Heart className="w-5 h-5" /> {post.likesCount}</span>
            <span className="flex items-center gap-1.5"><MessageCircle className="w-5 h-5" /> {post.commentsCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <ShareButtons title={post.title} slug={post.slug} />
            {isAuthenticated && post.author && (post.author as any)._id !== undefined && (
              <button
                onClick={() => setReportOpen(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
                style={{ color: 'var(--text-tertiary)' }}
                title="Report this article"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Cover image */}
        {post.coverImage?.url && (
          <div className="mb-10 -mx-6 sm:mx-0 sm:rounded-lg overflow-hidden">
            <img src={post.coverImage.url} alt={post.title} className="w-full object-cover max-h-[500px]" />
          </div>
        )}

        {/* Content */}
        <div
          className="prose dark:prose-invert max-w-none mb-12
            prose-headings:font-bold prose-headings:tracking-tight
            prose-h1:text-[28px] prose-h1:leading-tight prose-h1:mt-12 prose-h1:mb-4
            prose-h2:text-[24px] prose-h2:leading-tight prose-h2:mt-10 prose-h2:mb-3
            prose-h3:text-[20px] prose-h3:leading-snug prose-h3:mt-8 prose-h3:mb-2
            prose-p:text-[18px] prose-p:leading-[1.72] prose-p:mb-6
            prose-a:text-accent prose-a:underline prose-a:underline-offset-2
            prose-code:text-[15px] prose-code:text-accent
            prose-pre:rounded-lg prose-pre:text-[15px]
            prose-img:rounded-lg prose-img:my-8
            prose-blockquote:border-l-[3px] prose-blockquote:pl-5 prose-blockquote:italic prose-blockquote:text-[20px] prose-blockquote:leading-relaxed
            prose-li:text-[18px] prose-li:leading-[1.72]
            prose-strong:font-bold
            prose-figure:my-8"
          style={{ color: 'var(--foreground)' }}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10">
            {post.tags.map((tag) => (
              <Link key={tag} href={`/blog?search=${tag}`}
                className="text-[14px] px-4 py-2 rounded-full transition-colors hover:opacity-80"
                style={{ background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}>
                {tag}
              </Link>
            ))}
          </div>
        )}

        {/* Bottom action bar */}
        <div className="flex items-center justify-between py-6 mb-10"
          style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-5 text-[14px]" style={{ color: 'var(--text-tertiary)' }}>
            <span className="flex items-center gap-1.5"><Heart className="w-5 h-5" /> {post.likesCount}</span>
            <span className="flex items-center gap-1.5"><MessageCircle className="w-5 h-5" /> {post.commentsCount}</span>
          </div>
          <ShareButtons title={post.title} slug={post.slug} />
        </div>

        {/* Author Card */}
        <div className="flex items-start gap-4 py-8 mb-8">
          {post.author?.avatar ? (
            <img src={post.author.avatar} alt="" className="w-[72px] h-[72px] rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-[24px] font-bold shrink-0"
              style={{ background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}>
              {post.author?.displayName?.[0] || '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--text-tertiary)' }}>
              Written by
            </p>
            <Link href={`/profile/${post.author?.username}`}
              className="text-[20px] font-bold hover:underline" style={{ color: 'var(--foreground)' }}>
              {post.author?.displayName}
            </Link>
            {post.author?.bio && (
              <p className="text-[15px] leading-relaxed mt-2" style={{ color: 'var(--text-secondary)' }}>
                {post.author.bio}
              </p>
            )}
            <Link href={`/profile/${post.author?.username}`}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-[14px] font-medium transition-colors"
              style={{ border: '1px solid var(--foreground)', color: 'var(--foreground)' }}>
              View Profile
            </Link>
          </div>
        </div>
      </article>

      {/* ═══ RELATED POSTS ═══ */}
      {relatedPosts.length > 0 && (
        <section className="py-10" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="max-w-[1192px] mx-auto px-6">
            <h2 className="text-[20px] font-bold mb-8" style={{ color: 'var(--foreground)' }}>
              More from {post.author?.displayName}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {relatedPosts.map((rp) => (
                <Link key={rp._id} href={`/blog/${rp.slug}`} className="group block">
                  {rp.coverImage?.url && (
                    <div className="aspect-[16/10] overflow-hidden rounded-lg mb-4">
                      <img src={rp.coverImage.url} alt={rp.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <h3 className="text-[16px] font-bold leading-snug mb-2 group-hover:underline decoration-1 underline-offset-2 line-clamp-2"
                    style={{ color: 'var(--foreground)' }}>
                    {rp.title}
                  </h3>
                  <p className="text-[14px] line-clamp-2 mb-3" style={{ color: 'var(--text-secondary)' }}>
                    {rp.excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
                    <span>{formatDate(rp.createdAt)}</span>
                    <span>·</span>
                    <span>{rp.readTime} min read</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

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
