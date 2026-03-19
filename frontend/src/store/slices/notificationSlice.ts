import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Notification } from '@/types';
import { notificationsAPI } from '@/lib/api';

interface NotificationState {
  items: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isFetchingUnread: boolean;
  lastFetchedUnread: number | null;
  page: number;
  hasMore: boolean;
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  isLoading: false,
  isFetchingUnread: false,
  lastFetchedUnread: null,
  page: 1,
  hasMore: true,
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async ({ page = 1, limit = 20 }: { page?: number; limit?: number } = {}) => {
    const { data } = await notificationsAPI.getNotifications({ page, limit });
    return { notifications: data.data as Notification[], pagination: data.pagination, page };
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async () => {
    const { data } = await notificationsAPI.getUnreadCount();
    return data.data.count as number;
  },
  {
    // Prevent concurrent requests and throttle to once per 10 seconds
    condition: (_, { getState }) => {
      const state = (getState() as { notifications: NotificationState }).notifications;
      if (state.isFetchingUnread) return false;
      if (state.lastFetchedUnread && Date.now() - state.lastFetchedUnread < 10_000) return false;
      return true;
    },
  }
);

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (id: string) => {
    await notificationsAPI.markAsRead(id);
    return id;
  }
);

export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async () => {
    await notificationsAPI.markAllAsRead();
  }
);

export const clearAllNotifications = createAsyncThunk(
  'notifications/clearAll',
  async () => {
    await notificationsAPI.clearAll();
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification(state, action: PayloadAction<Notification>) {
      // Prepend and deduplicate
      const exists = state.items.find((n) => n._id === action.payload._id);
      if (!exists) {
        state.items.unshift(action.payload);
        state.unreadCount += 1;
      }
    },
    notificationRead(state, action: PayloadAction<string>) {
      const item = state.items.find((n) => n._id === action.payload);
      if (item && !item.isRead) {
        item.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    allNotificationsRead(state) {
      state.items.forEach((n) => (n.isRead = true));
      state.unreadCount = 0;
    },
    resetNotifications() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        const { notifications, pagination, page } = action.payload;
        if (page === 1) {
          state.items = notifications;
        } else {
          // Append, deduplicate
          const existingIds = new Set(state.items.map((n) => n._id));
          const newItems = notifications.filter((n) => !existingIds.has(n._id));
          state.items.push(...newItems);
        }
        state.page = pagination.page;
        state.hasMore = pagination.hasMore;
        state.isLoading = false;
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.isLoading = false;
      });

    builder.addCase(fetchUnreadCount.pending, (state) => {
      state.isFetchingUnread = true;
    });
    builder.addCase(fetchUnreadCount.fulfilled, (state, action) => {
      state.isFetchingUnread = false;
      state.lastFetchedUnread = Date.now();
      state.unreadCount = action.payload;
    });
    builder.addCase(fetchUnreadCount.rejected, (state) => {
      state.isFetchingUnread = false;
    });

    builder.addCase(markAsRead.fulfilled, (state, action) => {
      const item = state.items.find((n) => n._id === action.payload);
      if (item && !item.isRead) {
        item.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    });

    builder.addCase(markAllAsRead.fulfilled, (state) => {
      state.items.forEach((n) => (n.isRead = true));
      state.unreadCount = 0;
    });

    builder.addCase(clearAllNotifications.fulfilled, () => {
      return initialState;
    });
  },
});

export const { addNotification, notificationRead, allNotificationsRead, resetNotifications } =
  notificationSlice.actions;
export default notificationSlice.reducer;
