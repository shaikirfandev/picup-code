'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { boardsAPI } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { Board } from '@/types';
import { Plus, FolderOpen, Lock, Globe, Image } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BoardsPage() {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const { data } = await boardsAPI.getBoards();
        setBoards(data.data || []);
      } catch { /* silent */ }
      setIsLoading(false);
    };
    if (isAuthenticated) fetchBoards();
    else setIsLoading(false);
  }, [isAuthenticated]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const { data } = await boardsAPI.createBoard({ name, description, isPrivate });
      setBoards([data.data, ...boards]);
      setShowCreate(false);
      setName('');
      setDescription('');
      toast.success('Board created!');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FolderOpen className="w-16 h-16 text-surface-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Sign in to create boards</h2>
          <p className="text-surface-500 mb-4">Save and organize your favorite pins</p>
          <Link href="/login" className="btn-primary">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Boards</h1>
            <p className="text-surface-500">Organize your saved pins into collections</p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary gap-2">
            <Plus className="w-4 h-4" />
            New Board
          </button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="card p-6 mb-8 border-2 border-brand-200 dark:border-brand-800">
            <h3 className="font-semibold text-lg mb-4">Create Board</h3>
            <div className="space-y-4">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Board name" className="input-field" maxLength={100} />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className="input-field resize-none" rows={2} />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500" />
                <Lock className="w-4 h-4 text-surface-500" />
                <span className="text-sm">Private board</span>
              </label>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary">Create</button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost">Cancel</button>
              </div>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card aspect-[4/3] animate-pulse">
                <div className="h-full bg-surface-200 dark:bg-surface-700 rounded-xl" />
              </div>
            ))}
          </div>
        ) : boards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => (
              <Link
                key={board._id}
                href={`/boards/${board._id}`}
                className="card overflow-hidden group hover:shadow-lg transition-all"
              >
                {/* Thumbnail grid */}
                <div className="aspect-[4/3] bg-surface-100 dark:bg-surface-800 grid grid-cols-2 grid-rows-2 gap-0.5 p-0.5 rounded-t-xl overflow-hidden">
                  {(board.coverImages || []).slice(0, 4).map((img, i) => (
                    <div key={i} className="bg-surface-200 dark:bg-surface-700 overflow-hidden">
                      <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 4 - (board.coverImages?.length || 0)) }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-surface-200 dark:bg-surface-700 flex items-center justify-center">
                      <Image className="w-6 h-6 text-surface-400" />
                    </div>
                  ))}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{board.name}</h3>
                    {board.isPrivate && <Lock className="w-3.5 h-3.5 text-surface-400" />}
                  </div>
                  <p className="text-sm text-surface-500 mt-1">{board.postsCount || 0} pins</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <FolderOpen className="w-16 h-16 text-surface-300 mx-auto mb-4" />
            <p className="text-xl font-medium">No boards yet</p>
            <p className="text-surface-500 mt-1">Create your first board to organize pins</p>
          </div>
        )}
      </div>
    </div>
  );
}
