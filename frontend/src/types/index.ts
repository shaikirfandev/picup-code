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
  accountType: 'free' | 'paid';
  subscription?: {
    plan: 'none' | 'basic' | 'pro' | 'enterprise';
    startDate?: string;
    endDate?: string;
    isActive: boolean;
  };
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
  // Soft-delete fields
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: User;
  deleteReason?: string;
  deleteStatus?: 'active' | 'deleted';
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
  blogPost?: BlogPost;
  reportedUser?: User;
  reason: 'spam' | 'nsfw' | 'nudity' | 'violence' | 'harassment' | 'hate_speech' | 'abuse' | 'misinformation' | 'copyright' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  severity: number;
  autoFlagged: boolean;
  reviewedBy?: User;
  reviewedAt?: string;
  reviewNotes?: string;
  actionTaken?: 'none' | 'removed' | 'warned' | 'banned' | 'hidden';
  createdAt: string;
  updatedAt?: string;
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
  type: 'like' | 'comment' | 'reply' | 'follow' | 'save' | 'mention' | 'report_resolved' | 'system';
  post?: {
    _id: string;
    title: string;
    slug?: string;
    image?: { url: string };
  };
  comment?: string;
  message?: string;
  isRead: boolean;
  metadata?: Record<string, any>;
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

// Blog types
export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage?: {
    url: string;
    publicId?: string;
    fileId?: string;
  };
  tags: string[];
  category: string;
  author: User;
  status: 'draft' | 'published' | 'archived';
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isFeatured: boolean;
  readTime: number;
  // Soft-delete fields
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: User;
  deleteReason?: string;
  deleteStatus?: 'active' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

// Advertisement types
export interface Advertisement {
  _id: string;
  title: string;
  description: string;
  image?: {
    url: string;
    width?: number;
    height?: number;
  };
  redirectUrl: string;
  advertiser: User;
  campaign: {
    name: string;
    startDate: string;
    endDate?: string;
    budget: number;
    spent: number;
    currency: 'USD' | 'INR';
  };
  placement: 'feed' | 'sidebar' | 'banner' | 'search';
  status: 'draft' | 'pending' | 'active' | 'paused' | 'completed' | 'rejected';
  isPaid: boolean;
  impressions: number;
  clicks: number;
  likes: number;
  shares: number;
  views: number;
  ctr: number;
  createdAt: string;
  updatedAt: string;
}

// Payment types
export interface PaymentRecord {
  _id: string;
  user: User;
  type: 'ad_payment' | 'subscription' | 'wallet_topup' | 'refund';
  amount: number;
  currency: 'USD' | 'INR';
  gateway: 'stripe' | 'razorpay' | 'manual';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  advertisement?: Advertisement;
  description: string;
  paidAt?: string;
  createdAt: string;
}

// Wallet types
export interface WalletData {
  balance: number;
  currency: string;
  totalCredits: number;
  totalDebits: number;
  transactions: WalletTransaction[];
}

export interface WalletTransaction {
  type: 'credit' | 'debit' | 'refund' | 'bonus';
  amount: number;
  description: string;
  reference: string;
  balanceAfter: number;
  createdAt: string;
}

// Login analytics
export interface LoginAnalytics {
  dailyLogins: { _id: string; count: number; uniqueUsers: number }[];
  totalLogins: number;
  uniqueUsersCount: number;
  loginsByMethod: { _id: string; count: number }[];
}

// Analytics Overview
export interface AnalyticsOverview {
  totalUsers: number;
  newUsersToday: number;
  totalPosts: number;
  totalViews: number;
  totalLikes: number;
  totalSaves: number;
  activeReports: number;
  totalAIGenerations: number;
  activeUsersLast24h: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  todayLogins: number;
}

// Analytics Login Stats
export interface AnalyticsLoginStats {
  dailyStats: {
    date: string;
    logins: number;
    uniqueLogins: number;
    newUsers?: number;
    posts?: number;
    likes?: number;
    saves?: number;
    loginsByMethod?: { email: number; google: number; github: number };
    loginsByDevice?: { desktop: number; mobile: number; tablet: number; unknown: number };
    topCountries?: { country: string; count: number }[];
  }[];
  summary: {
    activeToday: number;
    weeklyActive: number;
    monthlyActive: number;
  };
  loginsByMethod: Record<string, number>;
  topCountries: { country: string; count: number }[];
}

// Analytics User Row
export interface AnalyticsUser {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  avatar: string;
  role: 'user' | 'moderator' | 'admin';
  status: 'active' | 'suspended' | 'banned';
  isVerified: boolean;
  lastLogin: string | null;
  loginCount: number;
  lastLoginDevice: string;
  lastLoginCountry: string;
  lastLoginIP: string;
  postsCount: number;
  accountType: string;
  createdAt: string;
}

// Top User
export interface TopUser {
  _id: string;
  username: string;
  displayName: string;
  avatar: string;
  postsCount?: number;
  loginCount?: number;
  totalLikes?: number;
  totalViews?: number;
  postCount?: number;
  engagementScore?: number;
}

// Recent Activity
export interface RecentActivity {
  recentLogins: {
    _id: string;
    user: { _id: string; username: string; displayName: string; avatar: string };
    browser: string;
    os: string;
    deviceType: string;
    country: string;
    method: string;
    createdAt: string;
  }[];
  recentPosts: {
    _id: string;
    title: string;
    image?: { url: string };
    viewsCount: number;
    likesCount: number;
    author: { _id: string; username: string; displayName: string; avatar: string };
    createdAt: string;
  }[];
  recentReports: {
    _id: string;
    reporter: { _id: string; username: string; displayName: string; avatar: string };
    post?: { _id: string; title: string };
    blogPost?: { _id: string; title: string };
    reason: string;
    status: string;
    priority: string;
    createdAt: string;
  }[];
  recentAI: {
    _id: string;
    user: { _id: string; username: string; displayName: string; avatar: string };
    prompt: string;
    style: string;
    status: string;
    createdAt: string;
  }[];
}

// Audit log
export interface AuditLog {
  _id: string;
  actionType: string;
  performedBy: User;
  targetId: string;
  targetModel: string;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}
