/**
 * Lightweight Redux middleware for:
 * 1. Toast notifications on thunk rejection
 * 2. Online/offline detection
 * 3. Optional logging (dev only)
 */
import { Middleware, isRejectedWithValue, isRejected } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';

// Thunk prefixes that should never show error toasts
const SILENT_PREFIXES = [
  'auth/fetchUser',           // Initial auth check — expected to fail when not logged in
  'notifications/fetchUnread', // Background polling — transient failures are fine
];

function isSilenced(type: string): boolean {
  return SILENT_PREFIXES.some((prefix) => type.startsWith(prefix));
}

// ---- Error notification middleware ----
export const errorToastMiddleware: Middleware = () => (next) => (action: any) => {
  if (isRejected(action) || isRejectedWithValue(action)) {
    const type: string = action.type || '';

    // Dev-only: always log rejected thunks for debugging
    if (process.env.NODE_ENV === 'development') {
      const source = isRejectedWithValue(action) ? 'rejectWithValue' : 'rejected';
      const detail = isRejectedWithValue(action)
        ? (action.payload as any)?.message
        : action.error?.message;
      console.warn(`[Redux] ${type} (${source})`, detail);
    }

    if (!isSilenced(type)) {
      const msg = isRejectedWithValue(action)
        ? ((action.payload as any)?.message || 'Something went wrong')
        : (action.error?.message || 'Something went wrong');
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
