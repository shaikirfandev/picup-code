import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import notificationReducer from './slices/notificationSlice';
import postReducer from './slices/postSlice';
import userReducer from './slices/userSlice';
import analyticsReducer from './slices/analyticsSlice';
import creatorAnalyticsReducer from './slices/creatorAnalyticsSlice';
import creatorDashboardReducer from './slices/creatorDashboardSlice';
import boardReducer from './slices/boardSlice';
import walletReducer from './slices/walletSlice';
import affiliateReducer from './slices/affiliateSlice';
import { errorToastMiddleware, attachOnlineListeners } from './middleware';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    notifications: notificationReducer,
    posts: postReducer,
    users: userReducer,
    analytics: analyticsReducer,
    creatorAnalytics: creatorAnalyticsReducer,
    creatorDashboard: creatorDashboardReducer,
    boards: boardReducer,
    wallet: walletReducer,
    affiliate: affiliateReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values in auth actions
        ignoredActions: ['auth/setUser'],
      },
    }).concat(errorToastMiddleware),
});

// Attach online/offline listeners
if (typeof window !== 'undefined') {
  attachOnlineListeners(store);
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
