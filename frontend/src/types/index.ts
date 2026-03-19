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
  targetCategories?: string[];
  targetLocations?: string[];
  targetAudience?: 'all' | 'followers' | 'new_users' | 'returning_users';
  promotionType?: 'standard' | 'featured' | 'homepage' | 'category_boost';
  dailyStats?: AdDailyStat[];
  createdAt: string;
  updatedAt: string;
}

export interface AdDailyStat {
  date: string;
  impressions: number;
  clicks: number;
  views: number;
  spent: number;
}

// Ad Dashboard types
export interface AdDashboardData {
  stats: {
    totalAds: number;
    activeAds: number;
    pendingAds: number;
    completedAds: number;
    totalClicks: number;
    totalImpressions: number;
    totalViews: number;
    totalSpent: number;
    engagementScore: number;
    ctr: number;
  };
  statusBreakdown: Record<string, number>;
  clickTrends: Array<{
    date: string;
    clicks: number;
    impressions: number;
  }>;
  categoryPerformance: Array<{
    name: string;
    impressions: number;
    clicks: number;
    spent: number;
    count: number;
  }>;
  recentActiveAds: Advertisement[];
  period: string;
}

// Ad Earnings types
export interface AdEarningsData {
  revenueTimeline: Array<{
    date: string;
    amount: number;
    count: number;
  }>;
  campaignPerformance: Array<{
    _id: string;
    title: string;
    status: string;
    impressions: number;
    clicks: number;
    views: number;
    budget: number;
    spent: number;
    ctr: number;
    roi: number;
  }>;
  totals: {
    totalBudget: number;
    totalSpent: number;
    totalClicks: number;
    totalImpressions: number;
    avgCPC: number;
    avgCPM: number;
  };
  period: string;
}

// Ad Analytics types (per-ad)
export interface AdAnalyticsData {
  ad: {
    _id: string;
    title: string;
    status: string;
    placement: string;
    promotionType: string;
    campaign: {
      budget: number;
      spent: number;
      startDate: string;
      endDate?: string;
      currency?: string;
    };
    createdAt: string;
  };
  totals: {
    impressions: number;
    clicks: number;
    likes: number;
    shares: number;
    views: number;
    ctr: number;
    budget: number;
    spent: number;
  };
  dailyStats: AdDailyStat[];
  eventAnalytics: {
    totals: Record<string, number>;
    daily: Array<{ date: string; impressions: number; clicks: number; views: number }>;
    devices: Array<{ _id: string; count: number }>;
    geo: Array<{ _id: string; count: number }>;
  };
}

// Ad Click Event
export interface AdClickEvent {
  _id: string;
  advertisement: string;
  eventType: 'impression' | 'click' | 'view' | 'conversion';
  user?: string;
  sessionId: string;
  ip: string;
  country?: string;
  city?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  referrer?: string;
  placement?: string;
  costPerClick?: number;
  costPerImpression?: number;
  isSuspicious: boolean;
  createdAt: string;
}

// Withdraw Request types
export interface WithdrawRequest {
  _id: string;
  user: User | string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  payoutMethod: 'bank_transfer' | 'paypal' | 'upi';
  payoutDetails: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    paypalEmail?: string;
    upiId?: string;
  };
  processedBy?: User | string;
  rejectionReason?: string;
  transactionRef?: string;
  createdAt: string;
  updatedAt: string;
}

// Payment Method types
export interface PaymentMethod {
  _id: string;
  user: string;
  type: 'card' | 'upi' | 'paypal' | 'bank_account';
  label: string;
  details: {
    last4?: string;
    brand?: string;
    expiry?: string;
    paypalEmail?: string;
    upiId?: string;
    bankName?: string;
    accountLast4?: string;
  };
  gateway: string;
  gatewayToken?: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Subscription types
export interface SubscriptionData {
  plan: 'basic' | 'pro' | 'enterprise';
  expiresAt: string;
  price: number;
}

export interface SubscriptionPlan {
  id: 'basic' | 'pro' | 'enterprise';
  name: string;
  price: number;
  features: string[];
}

// Admin Ad Stats
export interface AdminAdStats {
  totalAds: number;
  statusBreakdown: Record<string, number>;
  totalRevenue: number;
  recentAds: Advertisement[];
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

// ──────────────────────────────────────────────────────────────────────────────
// Creator Analytics Types
// ──────────────────────────────────────────────────────────────────────────────

export interface MetricWithGrowth {
  value: number;
  previous: number;
  growth: number;
}

export interface CreatorOverview {
  totalPosts: number;
  impressions: MetricWithGrowth;
  uniqueViews: MetricWithGrowth;
  likes: MetricWithGrowth;
  shares: MetricWithGrowth;
  saves: MetricWithGrowth;
  comments: MetricWithGrowth;
  clicks: MetricWithGrowth;
  affiliateClicks: MetricWithGrowth;
  ctr: number;
  engagementRate: number;
  estimatedRevenue: MetricWithGrowth;
  realtimeCounters: RealtimeCounters;
}

export interface RealtimeCounters {
  views: number;
  likes: number;
  shares: number;
  clicks: number;
  saves: number;
  comments: number;
  total: number;
}

export interface EngagementTimelinePoint {
  date: string;
  impressions: number;
  uniqueViews: number;
  likes: number;
  shares: number;
  saves: number;
  comments: number;
  clicks: number;
  engagements: number;
}

export interface FollowerGrowthPoint {
  date: string;
  followersCount: number;
  followersGained: number;
  followersLost: number;
  netFollowerGrowth: number;
}

export interface PostPerformanceRow {
  postId: string;
  post: {
    title: string;
    slug?: string;
    mediaType: string;
    image?: { url: string };
    video?: { thumbnailUrl?: string };
    productUrl?: string;
    tags?: string[];
    createdAt?: string;
  };
  impressions: number;
  uniqueViews: number;
  likes: number;
  shares: number;
  saves: number;
  comments: number;
  clicks: number;
  ctr: number;
  engagementRate: number;
}

export interface PostDetailedAnalytics {
  post: {
    title: string;
    mediaType: string;
    image?: { url: string };
    video?: { url: string; thumbnailUrl?: string; duration?: number };
    productUrl?: string;
    tags: string[];
  };
  totals: {
    impressions: number;
    uniqueViews: number;
    likes: number;
    shares: number;
    saves: number;
    comments: number;
    clicks: number;
    ctr: number;
    engagementRate: number;
    avgWatchDuration: number;
    avgCompletionRate: number;
  };
  timeline: EngagementTimelinePoint[];
  deviceBreakdown: Record<string, number>;
  trafficSources: Record<string, number>;
  geoDistribution: { country: string; count: number }[];
  hourlyHeatmap: number[];
  liveViewers: number;
  realtimeCounters: RealtimeCounters;
}

export interface AffiliateAnalytics {
  totalClicks: number;
  uniqueClicks: number;
  suspiciousClicks: number;
  conversionEstimate: number;
  revenueEstimate: number;
  geoDistribution: { country: string; count: number }[];
  deviceBreakdown: Record<string, number>;
  timeDistribution: number[];
  dailyClicks: { date: string; clicks: number; uniqueClicks: number }[];
  urlPerformance: { url: string; clicks: number; uniqueClicks: number; postsCount: number }[];
}

export interface AudienceInsights {
  locationDistribution: { country: string; count: number }[];
  deviceUsage: Record<string, number>;
  browserDistribution: { browser: string; count: number }[];
  osDistribution: { os: string; count: number }[];
  activeTimeHeatmap: number[][]; // 7×24 matrix
  viewerBreakdown: { total: number; returning: number; new: number };
  followerEngagement: { fromFollowers: number; fromNonFollowers: number };
}

export interface AIInsights {
  bestPostingTimes: { hour: number; label: string; engagementScore: number }[];
  postTypePerformance: { type: string; avgImpressions: number; avgEngagementRate: number; totalPosts: number }[];
  topTags: { tag: string; avgImpressions: number; avgEngagementRate: number; postCount: number }[];
  performanceTrend: {
    current: { avgEngagement: number; avgImpressions: number; avgPerformanceScore: number };
    previous: { avgEngagement: number; avgImpressions: number; avgPerformanceScore: number };
  };
}

export interface CreatorAccessCheck {
  hasAccess: boolean;
  accountType: string;
  plan: string;
  isActive: boolean;
}

// ─── Creator Professional Dashboard Types ──────────────────────

export interface DashboardOverview {
  user: { username: string; displayName: string; avatar: string };
  metrics: {
    totalFollowers: number;
    profileVisits: number;
    totalContentPosted: number;
    totalImpressions: number;
    engagementRate: number;
    totalRevenue: number;
  };
  growth: {
    followers: number;
    impressions: number;
    engagement: number;
    revenue: number;
    profileVisits: number;
  };
  revenueStats: { totalRevenue: number; prevRevenue: number };
  topPosts: ContentMetricsItem[];
  recentActivity: ActivityEventItem[];
  realtimeCounters: { liveViews: number; liveEngagement: number; liveViewers: number };
  period: string;
}

export interface ContentMetricsItem {
  _id: string;
  post: { _id: string; title: string; slug: string; mediaType: string; image?: { url: string; thumbnailUrl?: string }; video?: { thumbnailUrl?: string }; createdAt: string };
  totalViews: number;
  uniqueViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalSaves: number;
  engagementRate: number;
  clickThroughRate: number;
  performanceScore: number;
  performanceTier: string;
  totalWatchTime: number;
  averageWatchTime: number;
  viewsTrend: { date: string; value: number }[];
  engagementTrend: { date: string; value: number }[];
}

export interface ContentPerformanceData {
  posts: ContentPostItem[];
  totals: { totalViews: number; totalLikes: number; totalComments: number; totalShares: number; avgEngagement: number };
  pagination: PaginationMeta;
}

export interface ContentPostItem {
  _id: string;
  title: string;
  slug: string;
  mediaType: string;
  image?: { url: string; thumbnailUrl?: string };
  video?: { url: string; thumbnailUrl?: string };
  createdAt: string;
  isPinned?: boolean;
  metrics: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalSaves: number;
    engagementRate: number;
    clickThroughRate: number;
    performanceScore: number;
    performanceTier: string;
    totalWatchTime: number;
    averageWatchTime: number;
  };
  periodMetrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    clicks: number;
    watchTime: number;
  };
  trend: { date: string; value: number }[];
  engagementTrend: { date: string; value: number }[];
}

export interface EngagementTrendItem {
  date: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number;
}

export interface PerformanceHeatmapData {
  heatmap: number[][];
  period: string;
}

export interface DashboardAudienceInsights {
  demographics: {
    ageGroups: Record<string, number>;
    genderDistribution: { male: number; female: number; other: number; unknown: number };
    countries: { code: string; name: string; count: number; percentage: number }[];
    cities: { name: string; country: string; count: number; percentage: number }[];
  };
  engagement: {
    segments: { superFans: number; activeFans: number; casualViewers: number; dormant: number };
    followerRate: number;
    nonFollowerRate: number;
    ratio: number;
    devices: { device: string; count: number; percentage: number }[];
    trafficSources: { source: string; count: number; percentage: number }[];
  };
  activity: {
    activeHours: Record<string, number>;
    activeDays: Record<string, number>;
    peakHour: number;
  };
  followers: {
    totalFollowers: number;
    totalFollowing: number;
    recentGain: number;
    recentLost: number;
    netGrowth: number;
    growthTimeline: { date: string; totalFollowers: number; newFollowers: number; lostFollowers: number }[];
  };
  viewers: { newViewers: number; returningViewers: number };
}

export interface MonetizationData {
  profile: {
    monetizationEnabled: boolean;
    monetizationTier: string;
    enabledStreams: {
      adRevenue: boolean;
      sponsorship: boolean;
      donations: boolean;
      tips: boolean;
      subscriptions: boolean;
      premiumContent: boolean;
      affiliate: boolean;
    };
  };
  earnings: {
    totalRevenue: number;
    revenueGrowth: number;
    transactionCount: number;
    revenueByType: { type: string; total: number; count: number }[];
    revenuePerPost: number;
  };
  timeline: { date: string; amount: number; transactions: number }[];
  payouts: {
    history: PayoutItem[];
    pendingBalance: number;
    lifetimePayouts: number;
    lifetimeRevenue: number;
  };
  wallet: { balance: number; totalDeposits: number; totalWithdrawals: number };
  topEarningPosts: TopEarningPost[];
  recentDonations: DonationItem[];
  subscriberCount: number;
  period: string;
}

export interface PayoutItem {
  _id: string;
  amount: number;
  netAmount: number;
  status: string;
  paidAt: string;
  payoutMethod: string;
}

export interface TopEarningPost {
  _id: string;
  post: { title: string; slug: string; mediaType: string; image?: { thumbnailUrl?: string } };
  totalRevenue: number;
  transactions: number;
}

export interface DonationItem {
  _id: string;
  amount: number;
  netAmount: number;
  donor: { username: string; avatar: string; displayName: string };
  donorMessage: string;
  createdAt: string;
}

export interface ContentManagementData {
  posts: ManagedPost[];
  scheduled: ScheduledPostItem[];
  statusSummary: { published: number; draft: number; pending: number; archived: number; rejected: number };
  pagination: PaginationMeta;
}

export interface ManagedPost {
  _id: string;
  title: string;
  slug: string;
  mediaType: string;
  image?: { url: string; thumbnailUrl?: string };
  video?: { url: string; thumbnailUrl?: string };
  status: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  sharesCount: number;
  savesCount: number;
  tags?: string[];
  actualCommentCount: number;
}

export interface ScheduledPostItem {
  _id: string;
  post: { _id: string; title: string; slug: string; mediaType: string; image?: { url: string } };
  scheduledFor: string;
  status: string;
  timezone: string;
  recurring: boolean;
  recurrencePattern?: string;
}

export interface GrowthInsightsData {
  bestPostingTimes: { day: string; hour: number; avgEngagement: number; avgViews: number; postCount: number }[];
  contentTypePerformance: { _id: string; avgViews: number; avgLikes: number; avgComments: number; totalPosts: number }[];
  tagPerformance: { _id: string; avgViews: number; avgEngagement: number; postCount: number }[];
  trendingTopics: { _id: string; postCount: number; avgViews: number; avgEngagement: number }[];
  growthPrediction: {
    currentFollowers: number;
    dailyGrowthRate: number;
    predicted30d: number;
    predicted90d: number;
    trajectory: string;
    confidence: number;
  };
  recommendations: GrowthRecommendation[];
  engagementPatterns: { _id: string; count: number }[];
  audienceSummary: { topCountry: string; peakDay: string; topDevice: string };
}

export interface GrowthRecommendation {
  type: string;
  priority: 'high' | 'medium' | 'info';
  title: string;
  description: string;
  icon: string;
}

export interface ActivityEventItem {
  _id: string;
  eventType: string;
  actor?: { _id: string; username: string; avatar: string };
  actorName?: string;
  actorAvatar?: string;
  post?: string;
  postTitle?: string;
  postThumbnail?: string;
  message?: string;
  amount?: number;
  currency?: string;
  milestone?: number;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityFeedData {
  events: ActivityEventItem[];
  unreadCount: number;
  pagination: PaginationMeta;
}

export interface CreatorProfileData {
  _id: string;
  user: string;
  isCreator: boolean;
  creatorSince: string;
  verificationStatus: string;
  monetizationEnabled: boolean;
  monetizationTier: string;
  adRevenueEnabled: boolean;
  sponsorshipEnabled: boolean;
  donationsEnabled: boolean;
  tipsEnabled: boolean;
  subscriptionEnabled: boolean;
  premiumContentEnabled: boolean;
  affiliateEnabled: boolean;
  payoutMethod: string;
  minimumPayout: number;
  payoutSchedule: string;
  autoModeration: boolean;
  commentFilter: {
    enabled: boolean;
    blockedWords: string[];
    requireApproval: boolean;
    blockLinks: boolean;
  };
  spamDetection: boolean;
  dashboardLayout: string;
  emailReports: { enabled: boolean; frequency: string };
  notificationPreferences: Record<string, boolean>;
  goals: {
    followerTarget?: number;
    monthlyRevenueTarget?: number;
    engagementRateTarget?: number;
    postsPerWeekTarget?: number;
  };
  lifetimeRevenue: number;
  lifetimePayouts: number;
  pendingBalance: number;
  totalSubscribers: number;
  totalDonationsReceived: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

