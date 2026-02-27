'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { blogAPI } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import toast from 'react-hot-toast';
import { ArrowLeft, Upload, Send } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = [
  'technology', 'ai', 'web-development', 'mobile', 'cloud',
  'cybersecurity', 'gadgets', 'software', 'tutorials', 'news', 'other',
];

export default function CreateBlogPost() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '', content: '', excerpt: '', category: 'technology', tags: '',
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-20">
        <p className="text-sm font-mono text-[var(--edith-text-dim)]">Please log in to write articles.</p>
        <Link href="/login" className="btn-primary mt-4 inline-flex">Log In</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) {
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
      if (form.tags) formData.append('tags', JSON.stringify(form.tags.split(',').map((t) => t.trim())));
      if (coverFile) formData.append('coverImage', coverFile);

      await blogAPI.createPost(formData);
      toast.success('Article published!');
      router.push('/blog');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link href="/blog" className="inline-flex items-center gap-2 text-xs font-mono text-edith-cyan/60 hover:text-edith-cyan mb-6">
        <ArrowLeft className="w-3 h-3" /> Back to Blog
      </Link>

      <h1 className="text-2xl font-display font-bold mb-8" style={{ color: 'var(--edith-text)' }}>
        Write New Article
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-2 block">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="input-field"
            placeholder="Article title..."
            required
          />
        </div>

        <div>
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-2 block">Cover Image</label>
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-edith-cyan/30 transition-colors"
            style={{ borderColor: 'var(--edith-border)' }}
            onClick={() => document.getElementById('cover-upload')?.click()}
          >
            <Upload className="w-8 h-8 mx-auto text-edith-cyan/30 mb-2" />
            <p className="text-xs font-mono text-[var(--edith-text-dim)]">
              {coverFile ? coverFile.name : 'Click to upload cover image'}
            </p>
            <input
              id="cover-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-2 block">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="input-field"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat.replace('-', ' ').toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-2 block">Excerpt</label>
          <textarea
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            className="input-field h-20 resize-none"
            placeholder="Brief summary (optional)..."
          />
        </div>

        <div>
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-2 block">Content</label>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="input-field h-64 resize-y"
            placeholder="Write your article content here... (HTML supported)"
            required
          />
        </div>

        <div>
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-2 block">Tags</label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            className="input-field"
            placeholder="react, typescript, nextjs (comma separated)"
          />
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary gap-2 w-full">
          <Send className="w-4 h-4" />
          {isSubmitting ? 'Publishing...' : 'Publish Article'}
        </button>
      </form>
    </div>
  );
}
