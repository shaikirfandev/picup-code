'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { blogAPI } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import toast from 'react-hot-toast';
import Link from 'next/link';
import BlogFooter from '@/components/layout/BlogFooter';
import {
  Upload, Send, Image, X, Eye, Edit3,
  Bold, Italic, Heading1, Heading2, List, ListOrdered, Quote, Code,
  Link as LinkIcon, Minus, type LucideIcon, MoreHorizontal,
} from 'lucide-react';

const CATEGORIES = [
  'technology', 'ai', 'web-development', 'mobile', 'cloud',
  'cybersecurity', 'gadgets', 'software', 'tutorials', 'news', 'other',
];

/* ─── Toolbar Button ─── */
function ToolbarBtn({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} title={label}
      className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
      style={{ color: 'var(--text-tertiary)' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-secondary)'; e.currentTarget.style.color = 'var(--foreground)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}>
      <Icon className="w-[18px] h-[18px]" />
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
  const [showSettings, setShowSettings] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  /* ─── Auth guard ─── */
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <h2 className="text-[22px] font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            Sign in to write
          </h2>
          <p className="text-[15px] mb-6" style={{ color: 'var(--text-secondary)' }}>
            You need to be logged in to publish articles.
          </p>
          <Link href="/login"
            className="inline-flex items-center px-5 py-2.5 rounded-full text-[14px] font-medium"
            style={{ background: 'var(--accent)', color: '#fff' }}>
            Sign in
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
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* ═══ TOP BAR ═══ */}
      <header className="sticky top-0 z-30" style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-[1024px] mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/blog" className="text-[14px] font-medium" style={{ color: 'var(--text-secondary)' }}>
            mepiks
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-[13px] hidden sm:inline" style={{ color: 'var(--text-tertiary)' }}>
              {wordCount > 0 ? `${wordCount} words · ${readTime} min read` : 'Draft'}
            </span>
            <button type="button" onClick={() => setPreview(!preview)}
              className="px-3 py-1.5 rounded-full text-[13px] transition-colors"
              style={preview
                ? { background: 'var(--foreground)', color: 'var(--background)' }
                : { background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }
              }>
              {preview ? 'Edit' : 'Preview'}
            </button>
            <button type="button" onClick={(e) => { e.preventDefault(); handleSubmit(e); }} disabled={isSubmitting}
              className="px-4 py-1.5 rounded-full text-[14px] font-medium transition-colors disabled:opacity-50"
              style={{ background: 'var(--accent)', color: '#fff' }}>
              {isSubmitting ? 'Publishing...' : 'Publish'}
            </button>
            <button type="button" onClick={() => setShowSettings(!showSettings)}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ color: 'var(--text-tertiary)' }}>
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-[680px] mx-auto px-6 py-10">
        {/* ─── Cover Image ─── */}
        {coverPreviewUrl ? (
          <div className="relative mb-8 -mx-6 sm:mx-0 sm:rounded-lg overflow-hidden group">
            <img src={coverPreviewUrl} alt="Cover" className="w-full max-h-[400px] object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button type="button" onClick={() => document.getElementById('cover-upload')?.click()}
                className="px-4 py-2 rounded-full text-[14px] bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 transition-colors">
                Change
              </button>
              <button type="button" onClick={removeCover}
                className="px-4 py-2 rounded-full text-[14px] bg-red-500/30 text-white backdrop-blur-sm hover:bg-red-500/40 transition-colors">
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button type="button"
            className="flex items-center gap-2 text-[14px] mb-6 transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            onClick={() => document.getElementById('cover-upload')?.click()}>
            <Image className="w-5 h-5" />
            Add a cover image
          </button>
        )}
        <input id="cover-upload" type="file" accept="image/*" className="hidden" onChange={handleCoverSelect} />

        {preview ? (
          /* ═══ PREVIEW MODE ═══ */
          <div>
            <h1 className="text-[32px] md:text-[42px] font-extrabold leading-[1.15] tracking-tight mb-6"
              style={{ color: form.title ? 'var(--foreground)' : 'var(--text-tertiary)', letterSpacing: '-0.016em' }}>
              {form.title || 'Your title'}
            </h1>
            {form.excerpt && (
              <p className="text-[20px] leading-[1.4] mb-8" style={{ color: 'var(--text-secondary)' }}>
                {form.excerpt}
              </p>
            )}
            <div
              className="prose dark:prose-invert max-w-none
                prose-headings:font-bold prose-headings:tracking-tight
                prose-h1:text-[28px] prose-h2:text-[24px] prose-h3:text-[20px]
                prose-p:text-[18px] prose-p:leading-[1.72]
                prose-a:text-accent prose-a:underline
                prose-code:text-[15px] prose-code:text-accent
                prose-pre:rounded-lg
                prose-li:text-[18px] prose-li:leading-[1.72]
                prose-blockquote:border-l-[3px] prose-blockquote:pl-5 prose-blockquote:italic prose-blockquote:text-[20px]"
              style={{ color: 'var(--foreground)' }}
              dangerouslySetInnerHTML={{ __html: form.content || '<p style="color:var(--text-tertiary)">Start writing...</p>' }}
            />
          </div>
        ) : (
          /* ═══ EDIT MODE ═══ */
          <div>
            {/* Title */}
            <textarea
              value={form.title}
              onChange={(e) => {
                setForm({ ...form, title: e.target.value });
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              rows={1}
              className="w-full bg-transparent text-[32px] md:text-[42px] font-extrabold leading-[1.15] tracking-tight outline-none resize-none placeholder-[var(--text-tertiary)] mb-4"
              style={{ color: 'var(--foreground)', letterSpacing: '-0.016em', border: 'none', overflow: 'hidden' }}
              placeholder="Title"
              required
            />

            {/* Excerpt */}
            <textarea
              value={form.excerpt}
              onChange={(e) => {
                setForm({ ...form, excerpt: e.target.value });
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              rows={1}
              className="w-full bg-transparent text-[20px] leading-[1.4] outline-none resize-none mb-8 placeholder-[var(--text-tertiary)]"
              style={{ color: 'var(--text-secondary)', border: 'none', overflow: 'hidden' }}
              placeholder="Write a brief description..."
            />

            {/* Formatting toolbar */}
            <div className="flex items-center gap-0.5 mb-4 pb-4 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
              <ToolbarBtn icon={Bold} label="Bold" onClick={() => insertWrap('<b>', '</b>')} />
              <ToolbarBtn icon={Italic} label="Italic" onClick={() => insertWrap('<i>', '</i>')} />
              <ToolbarBtn icon={Heading1} label="Heading 1" onClick={() => insertWrap('<h1>', '</h1>')} />
              <ToolbarBtn icon={Heading2} label="Heading 2" onClick={() => insertWrap('<h2>', '</h2>')} />
              <ToolbarBtn icon={Quote} label="Blockquote" onClick={() => insertWrap('<blockquote>', '</blockquote>')} />
              <ToolbarBtn icon={List} label="List" onClick={() => insertWrap('<ul>\n<li>', '</li>\n</ul>')} />
              <ToolbarBtn icon={ListOrdered} label="Numbered List" onClick={() => insertWrap('<ol>\n<li>', '</li>\n</ol>')} />
              <ToolbarBtn icon={Code} label="Code" onClick={() => insertWrap('<code>', '</code>')} />
              <ToolbarBtn icon={LinkIcon} label="Link" onClick={() => insertWrap('<a href="url">', '</a>')} />
              <ToolbarBtn icon={Minus} label="Divider" onClick={() => insertWrap('<hr/>', '')} />
            </div>

            {/* Content */}
            <textarea
              ref={contentRef}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full min-h-[400px] resize-none bg-transparent text-[18px] leading-[1.72] outline-none placeholder-[var(--text-tertiary)]"
              style={{ color: 'var(--foreground)', border: 'none' }}
              placeholder="Tell your story..."
              required
            />
          </div>
        )}
      </form>

      {/* ═══ SETTINGS DRAWER ═══ */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setShowSettings(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative w-full max-w-sm h-full overflow-y-auto p-8 space-y-6"
            style={{ background: 'var(--background)', borderLeft: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-bold" style={{ color: 'var(--foreground)' }}>Story settings</h2>
              <button onClick={() => setShowSettings(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ color: 'var(--text-tertiary)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[14px] font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Category
              </label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none capitalize"
                style={{ background: 'var(--surface-secondary)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat.replace(/-/g, ' ')}</option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-[14px] font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Tags
              </label>
              <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none"
                style={{ background: 'var(--surface-secondary)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
                placeholder="react, typescript, nextjs" />
              <p className="text-[12px] mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
                Separate with commas. Max 5 tags.
              </p>
            </div>

            {/* Cover */}
            <div>
              <label className="block text-[14px] font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Cover image
              </label>
              {coverPreviewUrl ? (
                <div className="relative rounded-lg overflow-hidden">
                  <img src={coverPreviewUrl} alt="Cover" className="w-full h-32 object-cover" />
                  <button type="button" onClick={removeCover}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center bg-black/50 text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button type="button" className="w-full px-3 py-6 rounded-lg border-2 border-dashed text-center text-[14px] transition-colors"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}
                  onClick={() => document.getElementById('cover-upload')?.click()}>
                  Upload cover image
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <BlogFooter />
    </div>
  );
}
