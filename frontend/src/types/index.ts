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
  affiliateLinks?: { url: string; label: string; clicks?: number }[];
  isAffiliate?: boolean;
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

export interface AffiliateSummary {
  totalAffiliatePosts: number;
  isPaid: boolean;
  totalClicks?: number;
  uniqueClicks?: number;
  suspiciousClicks?: number;
  conversionEstimate?: number;
  revenueEstimate?: number;
  topPosts?: Post[];
  recentClicks?: { date: string; clicks: number; uniqueClicks: number }[];
}

export interface AffiliatePostStats {
  postId: string;
  title: string;
  productUrl: string;
  affiliateLinks: { url: string; label: string; clicks: number }[];
  totalClicks: number;
  clicksByDay: { date: string; clicks: number; uniqueClicks: number }[];
  deviceBreakdown: Record<string, number>;
  geoBreakdown: { country: string; count: number }[];
  referrerBreakdown: { source: string; count: number }[];
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

// ─── Ads Insight Platform Types ──────────────────────────────────────────────

export interface CampaignBudget {
  total: number;
  daily: number;
  spent: number;
  currency: 'USD' | 'INR';
}

export interface CampaignSchedule {
  startDate: string;
  endDate?: string;
  timezone: string;
}

export interface TargetAudience {
  ageMin: number;
  ageMax: number;
  genders: string[];
  locations: string[];
  interests: string[];
  languages: string[];
  devices: string[];
}

export interface CampaignCreative {
  type: 'image' | 'video' | 'carousel' | 'text';
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  callToAction: string;
  redirectUrl: string;
}

export interface CampaignMetrics {
  impressions: number;
  reach: number;
  clicks: number;
  conversions: number;
  engagement: number;
  ctr: number;
  cpc: number;
  cpm: number;
  costPerConversion: number;
  roi: number;
}

export interface Campaign {
  _id: string;
  name: string;
  owner: string;
  business?: string;
  adAccount?: string;
  objective: 'awareness' | 'traffic' | 'engagement' | 'leads' | 'conversions' | 'sales';
  budget: CampaignBudget;
  schedule: CampaignSchedule;
  targetAudience: TargetAudience;
  creatives: CampaignCreative[];
  placement: string[];
  status: 'draft' | 'pending' | 'active' | 'paused' | 'completed' | 'archived' | 'rejected';
  metrics: CampaignMetrics;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdGroup {
  _id: string;
  name: string;
  campaign: string;
  owner: string;
  budget: { daily: number; spent: number; currency: string };
  targetAudience: Partial<TargetAudience>;
  placement: string[];
  status: 'active' | 'paused' | 'archived' | 'deleted';
  metrics: Partial<CampaignMetrics>;
  createdAt: string;
  updatedAt: string;
}

export interface AdAccountOverview {
  totalCampaigns: number;
  activeCampaigns: number;
  adSpend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  roi: number;
  totalBudget: number;
  period: string;
}

export interface ReportDataPoint {
  _id: string;
  impressions: number;
  reach: number;
  clicks: number;
  conversions: number;
  engagement: number;
  spend: number;
  ctr: number;
  cpc: number;
  costPerConversion: number;
}

export interface CampaignReport {
  report: ReportDataPoint[];
  totals: ReportDataPoint;
  groupBy: string;
}

export interface AdReportTemplate {
  _id: string;
  name: string;
  owner: string;
  description: string;
  metrics: string[];
  filters: {
    campaignIds: string[];
    adGroupIds: string[];
    audienceSegments: string[];
    dateRange: { start?: string; end?: string; preset: string };
  };
  groupBy: string;
  exportFormat: 'csv' | 'pdf' | 'json';
  isTemplate: boolean;
  createdAt: string;
}

export interface AdRecommendation {
  campaignId: string;
  campaignName: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
}

export interface MediaPlanEstimate {
  audienceSize: number;
  estimatedImpressions: number;
  estimatedReach: number;
  estimatedClicks: number;
  estimatedConversions: number;
  estimatedCPC: number;
  estimatedCPM: number;
  dailyBudget: number;
  totalBudget: number;
  duration: number;
}

export interface AdActivityLog {
  _id: string;
  owner: string;
  actionType: string;
  entityType: string;
  entityId: string;
  description: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface AdAccount {
  _id: string;
  name: string;
  owner: string;
  business?: string;
  currency: string;
  timezone: string;
  status: 'active' | 'suspended' | 'closed';
  totalSpend: number;
  totalBudget: number;
  metrics: Partial<CampaignMetrics>;
  campaignCount?: number;
  activeCampaignCount?: number;
  createdAt: string;
}

export interface BusinessMember {
  user: { _id: string; username: string; displayName: string; avatar: string; email?: string };
  role: 'admin' | 'manager' | 'analyst' | 'viewer';
  joinedAt: string;
}

export interface Business {
  _id: string;
  name: string;
  owner: string;
  description: string;
  logo?: { url: string };
  website?: string;
  industry?: string;
  members: BusinessMember[];
  adAccounts: AdAccount[];
  billing?: { companyName?: string; address?: string; taxId?: string; email?: string };
  status: 'active' | 'suspended' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface CatalogProduct {
  _id?: string;
  externalId?: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  imageUrl?: string;
  productUrl?: string;
  category?: string;
  tags: string[];
  availability: 'in_stock' | 'out_of_stock' | 'preorder';
  status: 'active' | 'archived';
}

export interface ProductGroup {
  _id?: string;
  name: string;
  description?: string;
  filters: { category?: string; priceMin?: number; priceMax?: number; tags?: string[] };
}

export interface Catalog {
  _id: string;
  name: string;
  business: string | { _id: string; name: string };
  owner: string;
  description: string;
  productGroups: ProductGroup[];
  products: CatalogProduct[];
  feedUrl?: string;
  feedType: 'manual' | 'csv' | 'xml' | 'api';
  lastSyncAt?: string;
  status: 'active' | 'archived';
  createdAt: string;
}

// ─── Admin Wallet / Recharge Types ─────────────────────────────────────────

export interface AdminRecharge {
  _id: string;
  user: { _id: string; username: string; displayName: string; avatar?: string; email: string };
  type: 'purchase' | 'bonus';
  source: string;
  amount: number;
  status: string;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface RechargeStats {
  summary: {
    totalAmount: number;
    totalCount: number;
    avgAmount: number;
    uniqueUserCount: number;
    maxRecharge: number;
  };
  dailyRecharges: { _id: string; totalAmount: number; count: number }[];
  topRechargers: {
    user: { _id: string; username: string; displayName: string; avatar?: string; email: string };
    totalRecharged: number;
    rechargeCount: number;
    lastRecharge: string;
  }[];
  bySource: { _id: string; totalAmount: number; count: number }[];
  period: string;
}

export interface AdminTransaction {
  _id: string;
  user: { _id: string; username: string; displayName: string; avatar?: string; email: string };
  type: 'purchase' | 'usage' | 'refund' | 'bonus' | 'adjustment';
  source: string;
  amount: number;
  status: string;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  referenceId?: string;
  referenceType?: string;
  createdAt: string;
}

export interface AdminWallet {
  _id: string;
  user: string;
  userInfo: { _id: string; username: string; displayName: string; avatar?: string; email: string; role: string };
  balance: number;
  totalPurchased: number;
  totalUsed: number;
  bonusCredits: number;
  isFrozen: boolean;
  createdAt: string;
}

export interface CreditRule {
  _id: string;
  feature: string;
  baseCost: number;
  description?: string;
  isDynamic: boolean;
  dynamicFormula?: Record<string, unknown>;
  category: string;
  isActive: boolean;
  minCredits: number;
  maxCredits: number;
  updatedBy?: { _id: string; username: string; displayName: string };
  createdAt: string;
  updatedAt: string;
}

export interface AdPricing {
  creditsCost: number | null;
  isConfigured: boolean;
  walletBalance: number;
  canAfford: boolean;
  rule: {
    description?: string;
    minCredits: number;
    maxCredits: number;
    isDynamic: boolean;
  } | null;
}

/* Advertisement type is already declared above — extended fields merged here */
export interface Advertisement {
  creditsCost?: number;
  validityDays?: number;
  expiresAt?: string;
}

