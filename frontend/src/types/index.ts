export interface User {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  bio: string;
  avatar: string;
  coverImage: string;
  website: string;
  location: string;
  role: 'user' | 'moderator' | 'admin';
  status: 'active' | 'suspended' | 'banned';
  isVerified: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  aiGenerationsToday: number;
  aiGenerationsTotal: number;
  aiDailyLimit: number;
  isFollowing?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  _id: string;
  title: string;
  slug: string;
  description: string;
  mediaType: 'image' | 'video';
  image?: {
    url: string;
    publicId?: string;
    width?: number;
    height?: number;
    blurHash?: string;
    dominantColor?: string;
  };
  video?: {
    url: string;
    publicId?: string;
    thumbnailUrl?: string;
    duration?: number;
    width?: number;
    height?: number;
    format?: string;
    bytes?: number;
  };
  thumbnails?: {
    small?: string;
    medium?: string;
    large?: string;
  };
  productUrl: string;
  price?: {
    amount: number;
    currency: string;
    display?: string;
  };
  tags: string[];
  category?: Category;
  author: User;
  status: 'draft' | 'pending' | 'published' | 'rejected' | 'archived';
  isAiGenerated: boolean;
  aiMetadata?: {
    prompt?: string;
    model?: string;
    seed?: number;
    style?: string;
  };
  likesCount: number;
  savesCount: number;
  commentsCount: number;
  viewsCount: number;
  clicksCount: number;
  sharesCount: number;
  reportCount: number;
  isNSFW: boolean;
  isFeatured: boolean;
  isLiked?: boolean;
  isSaved?: boolean;
  relatedPosts?: Post[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  image?: string;
  postsCount: number;
  isActive: boolean;
  order: number;
}

export interface Board {
  _id: string;
  name: string;
  description: string;
  coverImage: string;
  coverImages?: string[];
  user: User;
  posts: Post[];
  isPrivate: boolean;
  postsCount: number;
  createdAt: string;
}

export interface Comment {
  _id: string;
  text: string;
  post: string;
  user: User;
  parentComment?: string;
  likesCount: number;
  isEdited: boolean;
  repliesCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  _id: string;
  reporter: User;
  post?: Post;
  reportedUser?: User;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewedBy?: User;
  reviewNotes?: string;
  actionTaken?: string;
  createdAt: string;
}

export interface AIGeneration {
  _id: string;
  user: User;
  prompt: string;
  negativePrompt?: string;
  model: string;
  style: string;
  width: number;
  height: number;
  seed?: number;
  resultImage?: {
    url: string;
    publicId?: string;
  };
  status: 'queued' | 'processing' | 'completed' | 'failed';
  error?: string;
  processingTime?: number;
  createdAt: string;
}

export interface AIStyle {
  id: string;
  name: string;
  description: string;
}

export interface Notification {
  _id: string;
  recipient: string;
  sender: User;
  type: 'like' | 'comment' | 'follow' | 'save' | 'mention' | 'system';
  post?: Post;
  message?: string;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ApiResponseData<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface DashboardStats {
  stats: {
    totalUsers: number;
    newUsersThisMonth: number;
    totalPosts: number;
    newPostsThisMonth: number;
    totalViews: number;
    totalClicks: number;
    totalAiGenerations: number;
    pendingReports: number;
    activeUsers: number;
  };
  topPosts: Post[];
  charts: {
    userGrowth: { _id: string; count: number }[];
    postGrowth: { _id: string; count: number }[];
  };
}
