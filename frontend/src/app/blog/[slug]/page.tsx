'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { blogAPI } from '@/lib/api';
import { BlogPost } from '@/types';
import Link from 'next/link';
import Footer from '@/components/layout/Footer';
import { Clock, Eye, Heart, Share2, ArrowLeft, Calendar, Tag } from 'lucide-react';
import { format } from 'date-fns';

export default function BlogPostPage() {
  const params = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data } = await blogAPI.getPost(params.slug as string);
        setPost(data.data);
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
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="animate-pulse">
          <div className="skeleton h-8 w-3/4 mb-4 rounded" />
          <div className="skeleton h-60 w-full mb-6 rounded" />
          <div className="skeleton h-4 w-full mb-2 rounded" />
          <div className="skeleton h-4 w-5/6 mb-2 rounded" />
          <div className="skeleton h-4 w-4/6 rounded" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-display font-bold mb-2" style={{ color: 'var(--edith-text)' }}>
          Article not found
        </h2>
        <Link href="/blog" className="btn-primary mt-4 inline-flex">Back to Blog</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <article className="max-w-3xl mx-auto px-4 py-10">
        {/* Back */}
        <Link href="/blog" className="inline-flex items-center gap-2 text-xs font-mono text-edith-cyan/60 hover:text-edith-cyan mb-6 transition-colors">
          <ArrowLeft className="w-3 h-3" /> Back to Blog
        </Link>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-edith-cyan/70 px-2 py-1 rounded"
              style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)' }}>
              {post.category}
            </span>
            <span className="text-[10px] font-mono text-[var(--edith-text-dim)] flex items-center gap-1">
              <Clock className="w-3 h-3" /> {post.readTime} min read
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-4" style={{ color: 'var(--edith-text)' }}>
            {post.title}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {post.author?.avatar ? (
                <img src={post.author.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-edith-cyan/10 flex items-center justify-center text-xs font-bold text-edith-cyan">
                  {post.author?.displayName?.[0]}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--edith-text)' }}>{post.author?.displayName}</p>
                <p className="text-[10px] font-mono text-[var(--edith-text-dim)]">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  {format(new Date(post.createdAt), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-3 text-[10px] font-mono text-[var(--edith-text-dim)]">
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.viewsCount}</span>
              <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likesCount}</span>
            </div>
          </div>
        </header>

        {/* Cover image */}
        {post.coverImage?.url && (
          <div className="mb-8 rounded-lg overflow-hidden border" style={{ borderColor: 'var(--edith-border)' }}>
            <img src={post.coverImage.url} alt={post.title} className="w-full object-cover" />
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-invert max-w-none font-mono text-sm leading-relaxed"
          style={{ color: 'var(--edith-text)' }}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-8 flex items-center gap-2 flex-wrap">
            <Tag className="w-3 h-3 text-edith-cyan/40" />
            {post.tags.map((tag) => (
              <span key={tag} className="text-[10px] font-mono text-edith-cyan/60 px-2 py-0.5 rounded"
                style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)' }}>
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>

      <Footer />
    </div>
  );
}
