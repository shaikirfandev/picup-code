'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usersAPI, postsAPI } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { ProfileSkeleton } from '@/components/shared/Skeletons';
import PostCard from '@/components/feed/PostCard';
import { Post, User } from '@/types';
import { formatNumber } from '@/lib/utils';
import {
  MapPin, LinkIcon, Calendar, Settings, UserPlus, UserMinus,
  Grid3X3, Bookmark, Heart, Sparkles, MoreHorizontal, Share2,
  Camera,
} from 'lucide-react';
import Masonry from 'react-masonry-css';
import toast from 'react-hot-toast';

type Tab = 'posts' | 'saved' | 'liked';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAppSelector((s) => s.auth);
  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('posts');

  const isOwnProfile = currentUser?.username === params.username;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await usersAPI.getProfile(params.username as string);
        setProfile(data.data);
        setIsFollowing(data.data.isFollowing || false);
        setFollowersCount(data.data.followersCount || 0);
      } catch {
        toast.error('User not found');
        router.push('/');
        return;
      }

      try {
        const { data } = await usersAPI.getUserPosts(params.username as string);
        setPosts(data.data || []);
      } catch { /* silent */ }

      setIsLoading(false);
    };
    fetchProfile();
  }, [params.username, router]);

  useEffect(() => {
    if (activeTab === 'saved' && isOwnProfile && savedPosts.length === 0) {
      const fetchSaved = async () => {
        try {
          const { data } = await postsAPI.getSavedPosts();
          setSavedPosts(data.data || []);
        } catch { /* silent */ }
      };
      fetchSaved();
    }
  }, [activeTab, isOwnProfile, savedPosts.length]);

  const handleFollow = async () => {
    if (!isAuthenticated) { toast.error('Please login'); return; }
    try {
      if (isFollowing) {
        await usersAPI.unfollowUser(profile!._id);
        setIsFollowing(false);
        setFollowersCount((c) => c - 1);
        toast.success('Unfollowed');
      } else {
        await usersAPI.followUser(profile!._id);
        setIsFollowing(true);
        setFollowersCount((c) => c + 1);
        toast.success('Following!');
      }
    } catch { toast.error('Action failed'); }
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success('Profile link copied!');
  };

  if (isLoading || !profile) return <ProfileSkeleton />;

  const displayPosts = activeTab === 'saved' ? savedPosts : posts;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      {/* Cover */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-brand-600 via-purple-600 to-pink-600 relative">
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {/* Profile header */}
        <div className="relative -mt-20 mb-6">
          <div className="flex flex-col items-center">
            {/* Avatar */}
            <div className="relative">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.displayName}
                  className="w-36 h-36 rounded-full object-cover border-4 border-white dark:border-surface-900 shadow-xl"
                />
              ) : (
                <div className="w-36 h-36 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 border-4 border-white dark:border-surface-900 shadow-xl flex items-center justify-center">
                  <span className="text-5xl font-bold text-white">
                    {profile.displayName?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              {isOwnProfile && (
                <button className="absolute bottom-1 right-1 p-2 rounded-full bg-white dark:bg-surface-800 shadow-lg hover:scale-105 transition-transform">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Name & info */}
            <h1 className="text-2xl font-bold mt-4">{profile.displayName}</h1>
            <p className="text-surface-500">@{profile.username}</p>

            {profile.bio && (
              <p className="text-center text-surface-600 dark:text-surface-400 mt-3 max-w-lg">{profile.bio}</p>
            )}

            {/* Meta links */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-sm text-surface-500">
              {profile.location && (
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.location}</span>
              )}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-brand-600 hover:underline">
                  <LinkIcon className="w-3.5 h-3.5" />{new URL(profile.website).hostname}
                </a>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 mt-5">
              <div className="text-center">
                <p className="text-xl font-bold">{formatNumber(posts.length)}</p>
                <p className="text-sm text-surface-500">Pins</p>
              </div>
              <Link href={`/profile/${profile.username}/followers`} className="text-center hover:text-brand-600">
                <p className="text-xl font-bold">{formatNumber(followersCount)}</p>
                <p className="text-sm text-surface-500">Followers</p>
              </Link>
              <Link href={`/profile/${profile.username}/following`} className="text-center hover:text-brand-600">
                <p className="text-xl font-bold">{formatNumber(profile.followingCount || 0)}</p>
                <p className="text-sm text-surface-500">Following</p>
              </Link>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-5">
              {isOwnProfile ? (
                <Link href="/settings" className="btn-ghost gap-2 px-5 py-2.5">
                  <Settings className="w-4 h-4" />
                  Edit Profile
                </Link>
              ) : (
                <button
                  onClick={handleFollow}
                  className={`gap-2 px-6 py-2.5 ${isFollowing ? 'btn-ghost' : 'btn-primary'}`}
                >
                  {isFollowing ? (
                    <><UserMinus className="w-4 h-4" />Following</>
                  ) : (
                    <><UserPlus className="w-4 h-4" />Follow</>
                  )}
                </button>
              )}
              <button onClick={handleShare} className="btn-ghost p-2.5">
                <Share2 className="w-4 h-4" />
              </button>
              <button className="btn-ghost p-2.5">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center border-b border-surface-200 dark:border-surface-800 mb-8">
          {[
            { key: 'posts', label: 'Pins', icon: Grid3X3 },
            ...(isOwnProfile ? [{ key: 'saved', label: 'Saved', icon: Bookmark }] : []),
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as Tab)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-surface-500 hover:text-surface-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Posts grid */}
        {displayPosts.length > 0 ? (
          <Masonry
            breakpointCols={{ default: 5, 1280: 4, 1024: 3, 768: 2, 475: 2 }}
            className="masonry-grid"
            columnClassName="masonry-grid-column"
          >
            {displayPosts.map((post, i) => (
              <PostCard key={post._id} post={post} index={i} />
            ))}
          </Masonry>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-4">
              <Grid3X3 className="w-8 h-8 text-surface-400" />
            </div>
            <p className="text-lg font-medium">No pins yet</p>
            <p className="text-surface-500 mt-1">
              {isOwnProfile
                ? 'Create your first pin to get started!'
                : `${profile.displayName} hasn't shared any pins yet.`}
            </p>
            {isOwnProfile && (
              <Link href="/create" className="btn-primary mt-4 inline-flex gap-2">
                <Sparkles className="w-4 h-4" />
                Create Pin
              </Link>
            )}
          </div>
        )}

        <div className="h-12" />
      </div>
    </div>
  );
}
