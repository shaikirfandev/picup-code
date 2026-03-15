'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { blogAPI } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import toast from 'react-hot-toast';
import Link from 'next/link';
import BlogFooter from '@/components/layout/BlogFooter';
import {
  ArrowLeft, Upload, Send, Image, X, Eye, Edit3, ChevronRight,
  Bold, Italic, Heading1, Heading2, List, ListOrdered, Quote, Code,
  Link as LinkIcon, Minus, type LucideIcon, Sparkles, FileText
} from 'lucide-react';

const CATEGORIES = [
  'technology', 'ai', 'web-development', 'mobile', 'cloud',
  'cybersecurity', 'gadgets', 'software', 'tutorials', 'news', 'other',
];

/* ─── Toolbar Button ─── */
function ToolbarBtn({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} title={label}
      className="w-7 h-7 rounded flex items-center justify-center transition-all hover:text-accent"
      style={{ color: 'var(--text-secondary)', background: 'transparent' }}>
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}

export default function CreateBlogPost() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState(false);
  const [form, setForm] = useState({
    title: '', content: '', excerpt: '', category: 'technology', tags: '',
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  /* ─── Auth guard ─── */
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto text-accent/20 mb-4" />
          <h2 className="text-xl font-semibold font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            Sign in to Write
          </h2>
          <p className="text-xs font-mono mb-4" style={{ color: 'var(--text-secondary)' }}>
            You need to be logged in to publish articles.
          </p>
          <Link href="/login" className="btn-primary inline-flex gap-2 text-xs">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  /* ─── Toolbar actions ─── */
  const insertWrap = (before: string, after: string) => {
    const ta = contentRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.substring(start, end);
    const newVal = ta.value.substring(0, start) + before + selected + after + ta.value.substring(end);
    setForm((f) => ({ ...f, content: newVal }));
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + before.length, end + before.length); }, 0);
  };

  /* ─── Cover image handling ─── */
  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onload = () => setCoverPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };
  const removeCover = () => {
    setCoverFile(null);
    setCoverPreviewUrl(null);
  };

  /* ─── Submit ─── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('content', form.content);
      if (form.excerpt) formData.append('excerpt', form.excerpt);
      formData.append('category', form.category);
      if (form.tags) formData.append('tags', JSON.stringify(form.tags.split(',').map((t) => t.trim()).filter(Boolean)));
      if (coverFile) formData.append('coverImage', coverFile);

      await blogAPI.createPost(formData);
      toast.success('Article published!');
      router.push('/blog');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to publish');
    } finally {
      setIsSubmitting(false);
    }
  };

  const wordCount = form.content.split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
          <Link href="/blog" className="hover:text-accent transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Blog
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span style={{ color: 'var(--text-secondary)' }}>Write New Article</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <Edit3 className="w-5 h-5 text-accent" /> Write Article
            </h1>
            <p className="text-[10px] font-mono mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Share your knowledge with the community
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPreview(!preview)}
              className="text-[10px] font-mono px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
              style={{
                background: preview ? 'var(--accent-muted)' : 'var(--accent-subtle)',
                color: preview ? 'var(--accent)' : 'var(--text-secondary)',
                border: `1px solid ${preview ? 'var(--border-strong)' : 'var(--border)'}`,
              }}>
              {preview ? <><Edit3 className="w-3 h-3" /> Edit</> : <><Eye className="w-3 h-3" /> Preview</>}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ─── Title ─── */}
          <div>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-transparent text-2xl md:text-3xl font-semibold font-bold outline-none placeholder:text-[var(--text-tertiary)] pb-4"
              style={{ color: 'var(--foreground)', borderBottom: '1px solid var(--border)' }}
              placeholder="Article title..."
              required
            />
          </div>

          {/* ─── Cover Image ─── */}
          <div>
            <label className="text-[9px] font-mono font-bold uppercase tracking-widest mb-2 block text-accent/50">
              Cover Image
            </label>
            {coverPreviewUrl ? (
              <div className="relative rounded-xl overflow-hidden group" style={{ border: '1px solid var(--border)' }}>
                <img src={coverPreviewUrl} alt="Cover" className="w-full max-h-72 object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button type="button" onClick={() => document.getElementById('cover-upload')?.click()}
                    className="text-[10px] font-mono px-3 py-1.5 rounded bg-white/10 text-white hover:bg-white/20 transition-colors">
                    Replace
                  </button>
                  <button type="button" onClick={removeCover}
                    className="text-[10px] font-mono px-3 py-1.5 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors">
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all hover:border-accent/30 hover:bg-accent/[0.02]"
                style={{ borderColor: 'var(--border)' }}
                onClick={() => document.getElementById('cover-upload')?.click()}
              >
                <Image className="w-10 h-10 mx-auto text-accent/20 mb-3" />
                <p className="text-xs font-mono mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Click to upload cover image
                </p>
                <p className="text-[9px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                  PNG, JPG, WebP up to 5MB — Recommended: 1200×630
                </p>
              </div>
            )}
            <input
              id="cover-upload" type="file" accept="image/*" className="hidden"
              onChange={handleCoverSelect}
            />
          </div>

          {/* ─── Meta row ─── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-mono font-bold uppercase tracking-widest mb-2 block text-accent/50">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input-field text-sm capitalize">
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat.replace(/-/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-mono font-bold uppercase tracking-widest mb-2 block text-accent/50">Tags</label>
              <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="input-field text-sm" placeholder="react, typescript, nextjs (comma separated)" />
            </div>
          </div>

          {/* ─── Excerpt ─── */}
          <div>
            <label className="text-[9px] font-mono font-bold uppercase tracking-widest mb-2 block text-accent/50">
              Excerpt <span style={{ color: 'var(--text-tertiary)' }}>(optional)</span>
            </label>
            <textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              className="input-field h-20 resize-none text-sm" placeholder="Brief summary of the article..." />
          </div>

          {/* ─── Content ─── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[9px] font-mono font-bold uppercase tracking-widest text-accent/50">Content</label>
              <span className="text-[9px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                {wordCount} words · {readTime} min read
              </span>
            </div>

            {preview ? (
              /* Preview mode */
              <div className="rounded-xl p-6 min-h-[300px]"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                {form.content ? (
                  <div
                    className="prose prose-invert dark:prose-invert max-w-none prose-p:font-mono prose-p:text-sm prose-a:text-accent"
                    style={{ color: 'var(--text-secondary)' }}
                    dangerouslySetInnerHTML={{ __html: form.content }}
                  />
                ) : (
                  <p className="text-xs font-mono text-center py-10" style={{ color: 'var(--text-tertiary)' }}>
                    Nothing to preview yet
                  </p>
                )}
              </div>
            ) : (
              /* Edit mode */
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                {/* Toolbar */}
                <div className="flex items-center gap-0.5 px-2 py-1.5 flex-wrap"
                  style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                  <ToolbarBtn icon={Bold} label="Bold" onClick={() => insertWrap('<b>', '</b>')} />
                  <ToolbarBtn icon={Italic} label="Italic" onClick={() => insertWrap('<i>', '</i>')} />
                  <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />
                  <ToolbarBtn icon={Heading1} label="Heading 1" onClick={() => insertWrap('<h1>', '</h1>')} />
                  <ToolbarBtn icon={Heading2} label="Heading 2" onClick={() => insertWrap('<h2>', '</h2>')} />
                  <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />
                  <ToolbarBtn icon={List} label="Unordered List" onClick={() => insertWrap('<ul>\n<li>', '</li>\n</ul>')} />
                  <ToolbarBtn icon={ListOrdered} label="Ordered List" onClick={() => insertWrap('<ol>\n<li>', '</li>\n</ol>')} />
                  <ToolbarBtn icon={Quote} label="Blockquote" onClick={() => insertWrap('<blockquote>', '</blockquote>')} />
                  <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />
                  <ToolbarBtn icon={Code} label="Code" onClick={() => insertWrap('<code>', '</code>')} />
                  <ToolbarBtn icon={LinkIcon} label="Link" onClick={() => insertWrap('<a href="url">', '</a>')} />
                  <ToolbarBtn icon={Minus} label="Divider" onClick={() => insertWrap('<hr/>', '')} />
                </div>
                <textarea
                  ref={contentRef}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full h-80 resize-y text-sm font-mono p-4 outline-none"
                  style={{ background: 'var(--background)', color: 'var(--foreground)', border: 'none' }}
                  placeholder="Write your article content here... HTML is supported."
                  required
                />
              </div>
            )}
          </div>

          {/* ─── Action bar ─── */}
          <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="text-[9px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
              <Sparkles className="w-3 h-3 inline mr-1 text-accent/30" />
              HTML tags are supported for formatting
            </div>
            <div className="flex items-center gap-3">
              <Link href="/blog" className="btn-secondary text-xs px-4 py-2">
                Cancel
              </Link>
              <button type="submit" disabled={isSubmitting}
                className="btn-primary text-xs px-6 py-2 flex items-center gap-2 disabled:opacity-50">
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Publishing...' : 'Publish Article'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <BlogFooter />
    </div>
  );
}
