/**
 * Memoised selectors using createSelector (reselect).
 * Prevents unnecessary re-renders by returning referentially-stable values.
 */
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';

/* ========================================================================
   Post selectors
   ======================================================================== */

/** Feed posts as ordered array */
export const selectFeedPosts = createSelector(
  [(s: RootState) => s.posts.feedIds, (s: RootState) => s.posts.entities],
  (ids, entities) => ids.map((id) => entities[id]!).filter(Boolean),
);

/** Explore posts as ordered array */
export const selectExplorePosts = createSelector(
  [(s: RootState) => s.posts.exploreIds, (s: RootState) => s.posts.entities],
  (ids, entities) => ids.map((id) => entities[id]!).filter(Boolean),
);

/** Search result posts */
export const selectSearchPosts = createSelector(
  [(s: RootState) => s.posts.searchIds, (s: RootState) => s.posts.entities],
  (ids, entities) => ids.map((id) => entities[id]!).filter(Boolean),
);

/** Saved posts */
export const selectSavedPosts = createSelector(
  [(s: RootState) => s.posts.savedIds, (s: RootState) => s.posts.entities],
  (ids, entities) => ids.map((id) => entities[id]!).filter(Boolean),
);

/** User posts for a given username */
export const selectUserPosts = createSelector(
  [
    (s: RootState) => s.posts.userPostIds,
    (s: RootState) => s.posts.entities,
    (_s: RootState, username: string) => username,
  ],
  (userPostIds, entities, username) =>
    (userPostIds[username] || []).map((id) => entities[id]!).filter(Boolean),
);

/** Post by ID with entity loading state */
export const selectPostWithLoading = createSelector(
  [
    (s: RootState) => s.posts.entities,
    (s: RootState) => s.posts.entityLoading,
    (_s: RootState, id: string) => id,
  ],
  (entities, loading, id) => ({
    post: entities[id] || null,
    loadingAction: loading[id] || null,
  }),
);

/** Feed metadata */
export const selectFeedMeta = (s: RootState) => s.posts.feedMeta;
export const selectFeedLoading = (s: RootState) => s.posts.loading;
export const selectFeedError = (s: RootState) => s.posts.error;
export const selectSearchMeta = (s: RootState) => s.posts.searchMeta;
export const selectSearchLoading = (s: RootState) => s.posts.searchLoading;

/** Reference data */
export const selectCategories = (s: RootState) => s.posts.categories;
export const selectTrendingTags = (s: RootState) => s.posts.trendingTags;

/* ========================================================================
   User selectors
   ======================================================================== */

/** Profile for a given username */
export const selectProfile = createSelector(
  [(s: RootState) => s.users.profiles, (_s: RootState, username: string) => username],
  (profiles, username) => profiles[username] || null,
);

export const selectProfileLoading = (s: RootState) => s.users.profileLoading;

/* ========================================================================
   Auth selectors
   ======================================================================== */

export const selectAuth = (s: RootState) => s.auth;
export const selectCurrentUser = (s: RootState) => s.auth.user;
export const selectIsAuthenticated = (s: RootState) => s.auth.isAuthenticated;

/* ========================================================================
   Analytics selectors
   ======================================================================== */

export const selectDashboardStats = (s: RootState) => s.analytics.dashboardStats;
export const selectDashboardLoading = (s: RootState) => s.analytics.dashboardLoading;
export const selectAnalyticsOverview = (s: RootState) => s.analytics.overview;
export const selectLoginStats = (s: RootState) => s.analytics.loginStats;

/* ========================================================================
   Notifications
   ======================================================================== */

export const selectNotifications = (s: RootState) => s.notifications;
export const selectUnreadCount = (s: RootState) => s.notifications.unreadCount;

/* ========================================================================
   Boards selectors
   ======================================================================== */

export const selectMyBoards = (s: RootState) => s.boards.boards;
export const selectBoardsLoading = (s: RootState) => s.boards.boardsLoading;
export const selectCurrentBoard = (s: RootState) => s.boards.currentBoard;
export const selectCurrentBoardLoading = (s: RootState) => s.boards.currentBoardLoading;
