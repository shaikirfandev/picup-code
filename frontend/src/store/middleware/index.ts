/**
 * Lightweight Redux middleware for:
 * 1. Toast notifications on thunk rejection
 * 2. Online/offline detection
 * 3. Optional logging (dev only)
 */
import { Middleware, isRejectedWithValue, isRejected } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';

// ---- Error notification middleware ----
export const errorToastMiddleware: Middleware = () => (next) => (action: any) => {
  // Show toast for rejected thunks (skip auth/fetchUser to avoid noise on page load)
  if (isRejected(action) && !isRejectedWithValue(action)) {
    const type: string = action.type || '';
    const silent = ['auth/fetchUser', 'notifications/fetchUnreadCount'];
    if (!silent.some((s) => type.startsWith(s))) {
      const msg = action.error?.message || 'Something went wrong';
      toast.error(msg, { id: `thunk-error-${type}` });
    }
  }
  if (isRejectedWithValue(action)) {
    const payload = action.payload as any;
    const type: string = action.type || '';
    const silent = ['auth/fetchUser', 'notifications/fetchUnreadCount'];
    if (!silent.some((s) => type.startsWith(s))) {
      const msg = payload?.message || 'Something went wrong';
      toast.error(msg, { id: `thunk-error-${type}` });
    }
  }
  return next(action);
};

// ---- Online/offline detector ----
let _onlineListenersAttached = false;

export function attachOnlineListeners(store: any) {
  if (_onlineListenersAttached || typeof window === 'undefined') return;
  _onlineListenersAttached = true;

  window.addEventListener('online', () => {
    toast.success('Back online', { id: 'network-status' });
    // Could dispatch a reconnect action here
  });

  window.addEventListener('offline', () => {
    toast.error('You are offline', { id: 'network-status', duration: Infinity });
  });
}
