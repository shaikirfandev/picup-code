'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchBoard, deleteBoard } from '@/store/slices/boardSlice';
import PostCard from '@/components/feed/PostCard';
import { Board, Post } from '@/types';
import { ArrowLeft, Lock, Globe, MoreHorizontal, Edit2, Trash2, Share2 } from 'lucide-react';
import Masonry from 'react-masonry-css';
import toast from 'react-hot-toast';

export default function BoardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { currentBoard: board, currentBoardLoading: isLoading } = useAppSelector((s) => s.boards);
  const [showMenu, setShowMenu] = useState(false);

  const posts = board?.posts || [];

  useEffect(() => {
    dispatch(fetchBoard(params.id as string)).unwrap().catch(() => {
      toast.error('Board not found');
      router.push('/boards');
    });
  }, [params.id, router, dispatch]);

  const handleDelete = async () => {
    if (!confirm('Delete this board?')) return;
    try {
      await dispatch(deleteBoard(board!._id)).unwrap();
      toast.success('Board deleted');
      router.push('/boards');
    } catch { toast.error('Failed'); }
  };

  const isOwner = user?._id === (typeof board?.user === 'string' ? board.user : board?.user?._id);

  if (isLoading || !board) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="btn-ghost mb-6 gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">{board.name}</h1>
            {board.isPrivate ? <Lock className="w-5 h-5 text-surface-400" /> : <Globe className="w-5 h-5 text-surface-400" />}
          </div>
          {board.description && <p className="text-surface-500 max-w-lg mx-auto">{board.description}</p>}
          <p className="text-sm text-surface-400 mt-2">{posts.length} pins</p>

          {isOwner && (
            <div className="relative inline-block mt-4">
              <button onClick={() => setShowMenu(!showMenu)} className="btn-ghost p-2">
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-1 w-40 card p-1 z-10 shadow-lg">
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800">
                    <Edit2 className="w-4 h-4" />Edit
                  </button>
                  <button onClick={handleDelete} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 text-red-500">
                    <Trash2 className="w-4 h-4" />Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {posts.length > 0 ? (
          <Masonry
            breakpointCols={{ default: 5, 1280: 4, 1024: 3, 768: 2, 475: 2 }}
            className="masonry-grid"
            columnClassName="masonry-grid-column"
          >
            {posts.map((post, i) => (
              <PostCard key={post._id} post={post} index={i} />
            ))}
          </Masonry>
        ) : (
          <div className="text-center py-20">
            <p className="text-surface-500">This board is empty</p>
          </div>
        )}
      </div>
    </div>
  );
}
