'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCategories, invalidateCache } from '@/store/slices/postSlice';
import { selectCategories } from '@/store/selectors';
import { Category } from '@/types';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCategoriesPage() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector(selectCategories);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', icon: '', color: '#e11d48', description: '' });

  useEffect(() => {
    dispatch(fetchCategories()).finally(() => setIsLoading(false));
  }, [dispatch]);

  const refetchCategories = () => {
    dispatch(invalidateCache()); // Clear categories cache
    dispatch(fetchCategories());
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    try {
      await adminAPI.createCategory(form as any);
      toast.success('Category created');
      setShowCreate(false);
      setForm({ name: '', icon: '', color: '#e11d48', description: '' });
      refetchCategories();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const handleUpdate = async (id: string) => {
    try {
      await adminAPI.updateCategory(id, form as any);
      toast.success('Updated');
      setEditingId(null);
      refetchCategories();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await adminAPI.deleteCategory(id);
      toast.success('Deleted');
      refetchCategories();
    } catch { toast.error('Failed'); }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat._id);
    setForm({ name: cat.name, icon: cat.icon || '', color: cat.color || '#e11d48', description: cat.description || '' });
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-surface-500">Manage post categories</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card p-5 mb-6 border-2 border-brand-200 dark:border-brand-800">
          <h3 className="font-semibold mb-4">New Category</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="input-field" />
            <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="Icon emoji (e.g. 🎨)" className="input-field" />
            <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} type="color" className="input-field h-10 p-1" />
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="input-field" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="btn-primary gap-1"><Save className="w-3.5 h-3.5" />Save</button>
            <button onClick={() => setShowCreate(false)} className="btn-ghost gap-1"><X className="w-3.5 h-3.5" />Cancel</button>
          </div>
        </div>
      )}

      {/* Categories list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-5 bg-surface-200 dark:bg-surface-700 rounded w-24 mb-2" />
                <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-16" />
              </div>
            ))
          : categories.map((cat) => (
              <div key={cat._id} className="card p-5 hover:shadow-md transition-shadow">
                {editingId === cat._id ? (
                  <div className="space-y-3">
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field text-sm" />
                    <div className="flex gap-2">
                      <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="Icon" className="input-field text-sm flex-1" />
                      <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} type="color" className="w-10 h-10 rounded border p-1" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdate(cat._id)} className="btn-primary text-sm px-3 py-1.5">Save</button>
                      <button onClick={() => setEditingId(null)} className="btn-ghost text-sm px-3 py-1.5">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{cat.icon}</span>
                        <span className="font-semibold">{cat.name}</span>
                      </div>
                      {cat.description && <p className="text-sm text-surface-500">{cat.description}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: cat.color }} />
                        <span className="text-xs text-surface-400">{cat.postsCount || 0} posts</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(cat)} className="btn-ghost p-1.5">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(cat._id)} className="btn-ghost p-1.5 text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
      </div>
    </div>
  );
}
