'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { blogAPI } from '@/lib/api';
import { BlogPost } from '@/types';
import { useAppSelector } from '@/store/hooks';
import Link from 'next/link';
import BlogFooter from '@/components/layout/BlogFooter';
import {
  Clock, Eye, Heart, ArrowLeft,
  BookOpen, MessageCircle, Twitter, Linkedin, Copy, Check,
  User, Flag,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import ReportModal from '@/components/shared/ReportModal';

function formatDate(d: string) {
  try { return format(new Date(d), 'MMMM d, yyyy'); } catch { return ''; }
}

/* ═══ Share Buttons — minimal circular ═══ */
function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? `${window.location.origin}/blog/${slug}` : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2500);
    } catch { /* noop */ }
  };

  return (
    <div className="flex items-center gap-3">
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
        target="_blank" rel="noopener noreferrer"
        className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--edith-accent-muted)] hover:text-[var(--edith-accent)]"
        style={{ color: 'var(--edith-text-dim)', border: '1px solid var(--edith-border)' }}
        title="Share on Twitter"
      >
        <Twitter className="w-4 h-4" />
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank" rel="noopener noreferrer"
        className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--edith-accent-muted)] hover:text-[var(--edith-accent)]"
        style={{ color: 'var(--edith-text-dim)', border: '1px solid var(--edith-border)' }}
        title="Share on LinkedIn"
      >
        <Linkedin className="w-4 h-4" />
      </a>
      <button
        onClick={copyLink}
        className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--edith-accent-muted)] hover:text-[var(--edith-accent)]"
        style={{ color: copied ? 'var(--edith-success)' : 'var(--edith-text-dim)', border: '1px solid var(--edith-border)' }}
        title="Copy link"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
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
    if (params.slug) {
      fetchPost();
      window.scrollTo(0, 0);
    }
  }, [params.slug]);

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-[680px] mx-auto px-6 py-16">
          <div className="animate-pulse space-y-8">
            <div className="skeleton h-12 w-4/5 rounded" />
            <div className="skeleton h-6 w-3/5 rounded" />
            <div className="flex items-center gap-3 pt-4">
              <div className="skeleton w-12 h-12 rounded-full" />
              <div className="space-y-2">
                <div className="skeleton h-4 w-32 rounded" />
                <div className="skeleton h-3 w-48 rounded" />
              </div>
            </div>
            <div className="skeleton h-[400px] w-full rounded-lg" />
            <div className="space-y-4 pt-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton h-5 rounded" style={{ width: `${80 + Math.random() * 20}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <BookOpen className="w-16 h-16 mx-auto mb-6" style={{ color: 'var(--edith-text-muted)' }} />
          <h2 className="text-2xl font-serif font-bold mb-3" style={{ color: 'var(--edith-text)' }}>
            Article not found
          </h2>
          <p className="text-base mb-6" style={{ color: 'var(--edith-text-dim)', fontFamily: 'var(--edith-article)' }}>
            This article may have been removed or doesn&apos;t exist.
          </p>
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-[var(--edith-accent)]"
            style={{ color: 'var(--edith-text-dim)' }}>
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <article>
        {/* ── Header — 680px like Medium ── */}
        <header className="max-w-[680px] mx-auto px-6 pt-10 md:pt-14">
          {/* Category pill */}
          <div className="mb-6">
            <Link
              href={`/blog?category=${post.category}`}
              className="inline-flex items-center px-3 py-1 rounded-full text-[13px] font-medium capitalize transition-colors hover:opacity-80"
              style={{ background: 'var(--edith-accent-muted)', color: 'var(--edith-accent)', border: '1px solid var(--edith-border)' }}
            >
              {post.category}
            </Link>
            {post.isFeatured && (
              <span className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium"
                style={{ background: 'var(--edith-warning-bg)', color: 'var(--edith-warning)', border: '1px solid rgba(255,170,0,0.15)' }}>
                ★ Featured
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="article-title mb-4">{post.title}</h1>

          {/* Subtitle / Excerpt */}
          {post.excerpt && <p className="article-subtitle mb-8">{post.excerpt}</p>}

          {/* Author row */}
          <div className="flex items-center gap-4 pb-8 mb-2" style={{ borderBottom: '1px solid var(--edith-border)' }}>
            <Link href={`/profile/${post.author?.username}`} className="shrink-0">
              {post.author?.avatar ? (
                <img src={post.author.avatar} alt="" className="w-12 h-12 rounded-full object-cover" style={{ border: '2px solid var(--edith-border)' }} />
              ) : (
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold"
                  style={{ background: 'var(--edith-accent-muted)', color: 'var(--edith-accent)' }}>
                  {post.author?.displayName?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link href={`/profile/${post.author?.username}`}
                  className="text-[15px] font-medium hover:underline"
                  style={{ color: 'var(--edith-text)', fontFamily: 'var(--edith-body)' }}>
                  {post.author?.displayName}
                </Link>
                {post.author?.isVerified && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm"
                    style={{ background: 'var(--edith-accent-muted)', color: 'var(--edith-accent)' }}>✓</span>
                )}
              </div>
              <div className="flex items-center gap-1 flex-wrap article-meta mt-0.5">
                <span>{formatDate(post.createdAt)}</span>
                <span className="mx-1">·</span>
                <span>{post.readTime} min read</span>
                <span className="mx-1">·</span>
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {post.viewsCount?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </header>

        {/* ── Cover image — wider ── */}
        {post.coverImage?.url && (
          <figure className="max-w-[900px] mx-auto px-4 my-10 md:my-12">
            <img src={post.coverImage.url} alt={post.title}
              className="w-full object-cover rounded-lg max-h-[520px]"
              style={{ boxShadow: 'var(--edith-shadow-md)' }} />
          </figure>
        )}

        {/* ── Article body — 680px, Medium typography ── */}
        <div className="max-w-[680px] mx-auto px-6">
          <div className="article-content" dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>

        {/* ── Tags ── */}
        {post.tags && post.tags.length > 0 && (
          <div className="max-w-[680px] mx-auto px-6 mt-12 pt-8" style={{ borderTop: '1px solid var(--edith-border)' }}>
            <div className="flex items-center gap-2.5 flex-wrap">
              {post.tags.map((tag) => (
                <Link key={tag} href={`/blog?search=${tag}`}
                  className="inline-flex items-center px-4 py-1.5 rounded-full text-[13px] transition-all hover:opacity-80"
                  style={{ color: 'var(--edith-text-dim)', background: 'var(--edith-accent-subtle)', border: '1px solid var(--edith-border)', fontFamily: 'var(--edith-body)' }}>
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Bottom action bar ── */}
        <div className="max-w-[680px] mx-auto px-6 mt-8 pt-6 pb-2" style={{ borderTop: '1px solid var(--edith-border)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 article-meta">
              <span className="flex items-center gap-1.5"><Heart className="w-5 h-5" /> {post.likesCount}</span>
              <span className="flex items-center gap-1.5"><MessageCircle className="w-5 h-5" /> {post.commentsCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShareButtons title={post.title} slug={post.slug} />
              {isAuthenticated && post.author && (
                <button onClick={() => setReportOpen(true)}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-red-500/10 hover:text-red-500 ml-1"
                  style={{ color: 'var(--edith-text-muted)', border: '1px solid var(--edith-border)' }}
                  title="Report this article">
                  <Flag className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ═══ Author Card ═══ */}
        <div className="max-w-[680px] mx-auto px-6 py-10">
          <div className="rounded-2xl p-8" style={{ background: 'var(--edith-panel)', border: '1px solid var(--edith-border)' }}>
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <Link href={`/profile/${post.author?.username}`} className="shrink-0">
                {post.author?.avatar ? (
                  <img src={post.author.avatar} alt="" className="w-[72px] h-[72px] rounded-full object-cover"
                    style={{ border: '2px solid var(--edith-border)' }} />
                ) : (
                  <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-xl font-bold"
                    style={{ background: 'var(--edith-accent-muted)', color: 'var(--edith-accent)' }}>
                    {post.author?.displayName?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-widest mb-2 font-medium"
                  style={{ color: 'var(--edith-text-muted)', fontFamily: 'var(--edith-body)' }}>
                  Written by
                </p>
                <Link href={`/profile/${post.author?.username}`}
                  className="text-xl font-bold hover:underline block mb-1"
                  style={{ color: 'var(--edith-text)', fontFamily: 'var(--edith-article-heading)' }}>
                  {post.author?.displayName}
                </Link>
                <p className="text-sm mb-3" style={{ color: 'var(--edith-text-muted)', fontFamily: 'var(--edith-body)' }}>
                  @{post.author?.username}
                </p>
                {post.author?.bio && (
                  <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--edith-text-dim)', fontFamily: 'var(--edith-article)' }}>
                    {post.author.bio}
                  </p>
                )}
                <Link href={`/profile/${post.author?.username}`}
                  className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
                  style={{ background: 'var(--edith-accent-muted)', color: 'var(--edith-accent)', border: '1px solid var(--edith-accent)', fontFamily: 'var(--edith-body)' }}>
                  <User className="w-4 h-4" /> View Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* ═══ RELATED POSTS ═══ */}
      {relatedPosts.length > 0 && (
        <section className="max-w-[900px] mx-auto px-6 pb-16">
          <div className="pt-8 mb-8" style={{ borderTop: '1px solid var(--edith-border)' }}>
            <h2 className="text-lg font-bold" style={{ color: 'var(--edith-text)', fontFamily: 'var(--edith-article-heading)' }}>
              More from E.D.I.T.H Blog
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {relatedPosts.map((rp) => (
              <Link key={rp._id} href={`/blog/${rp.slug}`} className="group block">
                <article>
                  <div className="aspect-[16/10] overflow-hidden rounded-lg mb-4">
                    {rp.coverImage?.url ? (
                      <img src={rp.coverImage.url} alt={rp.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center rounded-lg" style={{ background: 'var(--edith-panel)' }}>
                        <BookOpen className="w-10 h-10" style={{ color: 'var(--edith-text-muted)' }} />
                      </div>
                    )}
                  </div>
                  <p className="text-[12px] font-medium uppercase tracking-wide mb-2 capitalize"
                    style={{ color: 'var(--edith-accent)', fontFamily: 'var(--edith-body)' }}>{rp.category}</p>
                  <h3 className="text-base font-bold line-clamp-2 group-hover:text-[var(--edith-accent)] transition-colors mb-2"
                    style={{ color: 'var(--edith-text)', fontFamily: 'var(--edith-article-heading)', lineHeight: '1.35' }}>
                    {rp.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[13px]"
                    style={{ color: 'var(--edith-text-dim)', fontFamily: 'var(--edith-body)' }}>
                    <span>{rp.author?.displayName}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {rp.readTime} min read</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Back to blog */}
      <div className="max-w-[680px] mx-auto px-6 pb-10">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-[var(--edith-accent)]"
          style={{ color: 'var(--edith-text-dim)', fontFamily: 'var(--edith-body)' }}>
          <ArrowLeft className="w-4 h-4" /> All articles
        </Link>
      </div>

      <BlogFooter />

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