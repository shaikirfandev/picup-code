import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@/types';
import { usersAPI } from '@/lib/api';
import { withRetry, serializeError, isCacheValid, SerializedError } from '../utils/retry';
import type { RootState } from '../index';

/* ========================================================================
   State shape
   ======================================================================== */

interface ProfileData {
  user: User;
  isFollowing: boolean;
  followersCount: number;
  lastFetched: string;
}

interface UserState {
  // Profiles cache — keyed by username
  profiles: Record<string, ProfileData>;
  profileLoading: boolean;
  profileError: SerializedError | null;

  // Suggested users
  suggested: User[];
  suggestedLastFetched: string | null;
}

const initialState: UserState = {
  profiles: {},
  profileLoading: false,
  profileError: null,
  suggested: [],
  suggestedLastFetched: null,
};

/* ========================================================================
   Thunks
   ======================================================================== */

export const fetchProfile = createAsyncThunk(
  'users/fetchProfile',
  async (username: string, { getState, rejectWithValue }) => {
    try {
      const state = (getState() as RootState).users;
      const cached = state.profiles[username];
      if (cached && isCacheValid(cached.lastFetched)) {
        return { user: cached.user, cached: true };
      }
      const { data } = await withRetry(() => usersAPI.getProfile(username));
      return { user: data.data as User, cached: false };
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
);

export const followUser = createAsyncThunk(
  'users/followUser',
  async ({ userId, username }: { userId: string; username: string }, { rejectWithValue }) => {
    try {
      await withRetry(() => usersAPI.followUser(userId), { maxRetries: 2 });
      return { username, following: true };
    } catch (err) {
      return rejectWithValue({ ...serializeError(err), username });
    }
  },
);

export const unfollowUser = createAsyncThunk(
  'users/unfollowUser',
  async ({ userId, username }: { userId: string; username: string }, { rejectWithValue }) => {
    try {
      await withRetry(() => usersAPI.unfollowUser(userId), { maxRetries: 2 });
      return { username, following: false };
    } catch (err) {
      return rejectWithValue({ ...serializeError(err), username });
    }
  },
);

export const fetchSuggestedUsers = createAsyncThunk(
  'users/fetchSuggested',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = (getState() as RootState).users;
      if (state.suggested.length > 0 && isCacheValid(state.suggestedLastFetched, 300_000)) {
        return { users: state.suggested, cached: true };
      }
      const { data } = await withRetry(() => usersAPI.getSuggested());
      return { users: data.data as User[], cached: false };
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
);

export const updateProfile = createAsyncThunk(
  'users/updateProfile',
  async (profileData: any, { rejectWithValue }) => {
    try {
      const { data } = await withRetry(() => usersAPI.updateProfile(profileData));
      return data.data as User;
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
);

/* ========================================================================
   Slice
   ======================================================================== */

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    invalidateProfile(state, action: PayloadAction<string>) {
      delete state.profiles[action.payload];
    },
    clearProfileError(state) {
      state.profileError = null;
    },
  },
  extraReducers: (builder) => {
    /* ---- fetchProfile ---- */
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.profileLoading = true;
        state.profileError = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        const { user, cached } = action.payload;
        if (!cached) {
          state.profiles[user.username] = {
            user,
            isFollowing: user.isFollowing || false,
            followersCount: user.followersCount || 0,
            lastFetched: new Date().toISOString(),
          };
        }
        state.profileLoading = false;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.profileError = (action.payload as SerializedError) || { message: 'User not found' };
      });

    /* ---- followUser (optimistic) ---- */
    builder
      .addCase(followUser.pending, (state, action) => {
        const { username } = action.meta.arg;
        const p = state.profiles[username];
        if (p) {
          p.isFollowing = true;
          p.followersCount += 1;
        }
      })
      .addCase(followUser.fulfilled, () => {
        // already applied optimistically
      })
      .addCase(followUser.rejected, (state, action) => {
        // Rollback
        const payload = action.payload as any;
        const username = payload?.username;
        if (username) {
          const p = state.profiles[username];
          if (p) {
            p.isFollowing = false;
            p.followersCount = Math.max(0, p.followersCount - 1);
          }
        }
      });

    /* ---- unfollowUser (optimistic) ---- */
    builder
      .addCase(unfollowUser.pending, (state, action) => {
        const { username } = action.meta.arg;
        const p = state.profiles[username];
        if (p) {
          p.isFollowing = false;
          p.followersCount = Math.max(0, p.followersCount - 1);
        }
      })
      .addCase(unfollowUser.fulfilled, () => {})
      .addCase(unfollowUser.rejected, (state, action) => {
        const payload = action.payload as any;
        const username = payload?.username;
        if (username) {
          const p = state.profiles[username];
          if (p) {
            p.isFollowing = true;
            p.followersCount += 1;
          }
        }
      });

    /* ---- fetchSuggestedUsers ---- */
    builder
      .addCase(fetchSuggestedUsers.fulfilled, (state, action) => {
        if (!action.payload.cached) {
          state.suggested = action.payload.users;
          state.suggestedLastFetched = new Date().toISOString();
        }
      });

    /* ---- updateProfile ---- */
    builder
      .addCase(updateProfile.fulfilled, (state, action) => {
        const user = action.payload;
        // Also update profile cache
        if (state.profiles[user.username]) {
          state.profiles[user.username].user = user;
          state.profiles[user.username].lastFetched = new Date().toISOString();
        }
      });
  },
});

export const { invalidateProfile, clearProfileError } = userSlice.actions;
export default userSlice.reducer;
