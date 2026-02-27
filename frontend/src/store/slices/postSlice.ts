import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
  PayloadAction,
  EntityState,
} from '@reduxjs/toolkit';
import { Post, Category } from '@/types';
import { postsAPI, categoriesAPI, searchAPI, usersAPI } from '@/lib/api';
import { withRetry, serializeError, isCacheValid, SerializedError } from '../utils/retry';
import type { RootState } from '../index';

/* ========================================================================
   Entity Adapter — normalised { ids[], entities{} } for posts
   ======================================================================== */

const postsAdapter = createEntityAdapter<Post, string>({
  selectId: (post) => post._id,
});

/* ========================================================================
   State shape
   ======================================================================== */

interface FeedMeta {
  page: number;
  hasMore: boolean;
  sort: string;
  category: string;
  tag: string;
}

interface PostsState extends EntityState<Post, string> {
  // Loading / error
  loading: boolean;
  error: SerializedError | null;

  // Per-entity loading (for like / save / delete buttons)
  entityLoading: Record<string, 'like' | 'save' | 'delete' | 'update' | null>;

  // Cache timestamps
  lastFetched: string | null;           // feed
  detailLastFetched: Record<string, string>;  // per post id

  // Feed pagination
  feedIds: string[];
  feedMeta: FeedMeta;

  // Explore
  exploreIds: string[];
  exploreLoading: boolean;

  // Search
  searchIds: string[];
  searchMeta: { page: number; hasMore: boolean };
  searchLoading: boolean;

  // Saved
  savedIds: string[];
  savedLoading: boolean;
  savedLastFetched: string | null;

  // User posts (profile page)
  userPostIds: Record<string, string[]>;

  // Reference data
  categories: Category[];
  categoriesLastFetched: string | null;
  trendingTags: { tag: string; count: number }[];
  trendingTagsLastFetched: string | null;
}

const initialState: PostsState = postsAdapter.getInitialState({
  loading: false,
  error: null,
  entityLoading: {},
  lastFetched: null,
  detailLastFetched: {},

  feedIds: [],
  feedMeta: { page: 1, hasMore: true, sort: 'recent', category: '', tag: '' },

  exploreIds: [],
  exploreLoading: false,

  searchIds: [],
  searchMeta: { page: 1, hasMore: true },
  searchLoading: false,

  savedIds: [],
  savedLoading: false,
  savedLastFetched: null,

  userPostIds: {},

  categories: [],
  categoriesLastFetched: null,
  trendingTags: [],
  trendingTagsLastFetched: null,
});

/* ========================================================================
   Thunks
   ======================================================================== */

// ---- Fetch feed posts (infinite scroll) ----
export const fetchFeed = createAsyncThunk(
  'posts/fetchFeed',
  async (
    { page = 1, limit = 30, sort = 'recent', category = '', tag = '', reset = false }:
    { page?: number; limit?: number; sort?: string; category?: string; tag?: string; reset?: boolean },
    { getState, rejectWithValue },
  ) => {
    try {
      const { data } = await withRetry(() =>
        postsAPI.getFeed({ page, limit, sort, category: category || undefined, tag: tag || undefined }),
      );
      return {
        posts: data.data as Post[],
        pagination: data.pagination,
        page,
        sort,
        category,
        tag,
        reset,
      };
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
  {
    condition: (arg, { getState }) => {
      const state = (getState() as RootState).posts;
      // Skip if already loading
      if (state.loading) return false;
      return true;
    },
  },
);

// ---- Fetch single post ----
export const fetchPost = createAsyncThunk(
  'posts/fetchPost',
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const state = (getState() as RootState).posts;
      // Use cache if fresh (2 min)
      if (state.entities[id] && isCacheValid(state.detailLastFetched[id])) {
        return { post: state.entities[id]!, cached: true };
      }
      const { data } = await withRetry(() => postsAPI.getPost(id));
      return { post: data.data as Post, cached: false };
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
);

// ---- Delete post (optimistic) ----
export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (id: string, { rejectWithValue }) => {
    try {
      await withRetry(() => postsAPI.deletePost(id));
      return id;
    } catch (err) {
      return rejectWithValue({ ...serializeError(err), id });
    }
  },
);

// ---- Update post ----
export const updatePost = createAsyncThunk(
  'posts/updatePost',
  async ({ id, data: updateData }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const { data } = await withRetry(() => postsAPI.updatePost(id, updateData));
      return data.data as Post;
    } catch (err) {
      return rejectWithValue({ ...serializeError(err), id });
    }
  },
);

// ---- Like post (optimistic) ----
export const likePost = createAsyncThunk(
  'posts/likePost',
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await withRetry(() => postsAPI.toggleLike(id), { maxRetries: 2 });
      return { id, isLiked: data.data.isLiked as boolean };
    } catch (err) {
      return rejectWithValue({ ...serializeError(err), id });
    }
  },
);

// ---- Save post (optimistic) ----
export const savePost = createAsyncThunk(
  'posts/savePost',
  async ({ id, boardId }: { id: string; boardId?: string }, { rejectWithValue }) => {
    try {
      const { data } = await withRetry(() => postsAPI.toggleSave(id, boardId), { maxRetries: 2 });
      return { id, isSaved: data.data.isSaved as boolean };
    } catch (err) {
      return rejectWithValue({ ...serializeError(err), id });
    }
  },
);

// ---- Create post ----
export const createPost = createAsyncThunk(
  'posts/createPost',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const { data } = await postsAPI.createPost(formData); // no retry for uploads
      return data.data as Post;
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
);

// ---- Fetch categories (cached) ----
export const fetchCategories = createAsyncThunk(
  'posts/fetchCategories',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = (getState() as RootState).posts;
      if (state.categories.length > 0 && isCacheValid(state.categoriesLastFetched, 300_000)) {
        return { categories: state.categories, cached: true };
      }
      const { data } = await withRetry(() => categoriesAPI.getAll());
      return { categories: data.data as Category[], cached: false };
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
);

// ---- Fetch trending tags (cached) ----
export const fetchTrendingTags = createAsyncThunk(
  'posts/fetchTrendingTags',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = (getState() as RootState).posts;
      if (state.trendingTags.length > 0 && isCacheValid(state.trendingTagsLastFetched, 300_000)) {
        return { tags: state.trendingTags, cached: true };
      }
      const { data } = await withRetry(() => searchAPI.getTrendingTags());
      return { tags: data.data as { tag: string; count: number }[], cached: false };
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
);

// ---- Explore page ----
export const fetchExplore = createAsyncThunk(
  'posts/fetchExplore',
  async ({ category = '', sort = 'popular', limit = 30 }: { category?: string; sort?: string; limit?: number }, { rejectWithValue }) => {
    try {
      const { data } = await withRetry(() =>
        postsAPI.getFeed({ sort, category: category || undefined, limit }),
      );
      return { posts: data.data as Post[], category };
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
);

// ---- Search ----
export const searchPosts = createAsyncThunk(
  'posts/searchPosts',
  async (
    params: { q?: string; tag?: string; category?: string; sort?: string; page?: number; limit?: number; reset?: boolean },
    { rejectWithValue },
  ) => {
    try {
      const { reset, ...apiParams } = params;
      const { data } = await withRetry(() => searchAPI.searchPosts(apiParams));
      return { posts: data.data as Post[], page: params.page || 1, reset: !!reset };
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
);

// ---- Saved posts ----
export const fetchSavedPosts = createAsyncThunk(
  'posts/fetchSavedPosts',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = (getState() as RootState).posts;
      if (state.savedIds.length > 0 && isCacheValid(state.savedLastFetched)) {
        return { posts: state.savedIds.map((id) => state.entities[id]!).filter(Boolean), cached: true };
      }
      const { data } = await withRetry(() => postsAPI.getSavedPosts());
      return { posts: data.data as Post[], cached: false };
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
);

// ---- User posts (profile page) ----
export const fetchUserPosts = createAsyncThunk(
  'posts/fetchUserPosts',
  async ({ username, page, limit }: { username: string; page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const { data } = await withRetry(() =>
        usersAPI.getUserPosts(username, { page, limit }),
      );
      return { posts: data.data as Post[], username };
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
);

// ---- Share post (fire-and-forget) ----
export const sharePost = createAsyncThunk(
  'posts/sharePost',
  async (id: string) => {
    await postsAPI.sharePost(id).catch(() => {});
    return id;
  },
);

// ---- Track click (fire-and-forget) ----
export const trackClick = createAsyncThunk(
  'posts/trackClick',
  async (id: string) => {
    await postsAPI.trackClick(id).catch(() => {});
    return id;
  },
);

/* ========================================================================
   Slice
   ======================================================================== */

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    // Invalidate all caches (called after create / delete / update)
    invalidateCache(state) {
      state.lastFetched = null;
      state.savedLastFetched = null;
      state.detailLastFetched = {};
      state.categoriesLastFetched = null;
      state.trendingTagsLastFetched = null;
    },
    // Clear feed (for filter change)
    clearFeed(state) {
      state.feedIds = [];
      state.feedMeta = { page: 1, hasMore: true, sort: 'recent', category: '', tag: '' };
      state.lastFetched = null;
    },
    // Set feed filters
    setFeedFilters(state, action: PayloadAction<Partial<FeedMeta>>) {
      Object.assign(state.feedMeta, action.payload);
    },
    clearSearch(state) {
      state.searchIds = [];
      state.searchMeta = { page: 1, hasMore: true };
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    /* ---- fetchFeed ---- */
    builder
      .addCase(fetchFeed.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        const { posts, pagination, page, sort, category, tag, reset } = action.payload;
        postsAdapter.upsertMany(state, posts);
        const newIds = posts.map((p) => p._id);

        if (reset || page === 1) {
          state.feedIds = newIds;
        } else {
          // Deduplicate on append
          const existing = new Set(state.feedIds);
          state.feedIds.push(...newIds.filter((id) => !existing.has(id)));
        }

        state.feedMeta = {
          page: pagination?.page ?? page,
          hasMore: pagination?.hasMore ?? posts.length >= 30,
          sort,
          category,
          tag,
        };
        state.loading = false;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as SerializedError) || { message: 'Failed to fetch feed' };
      });

    /* ---- fetchPost ---- */
    builder
      .addCase(fetchPost.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPost.fulfilled, (state, action) => {
        const { post, cached } = action.payload;
        if (!cached) {
          postsAdapter.upsertOne(state, post);
          state.detailLastFetched[post._id] = new Date().toISOString();
        }
        state.loading = false;
      })
      .addCase(fetchPost.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as SerializedError) || { message: 'Post not found' };
      });

    /* ---- deletePost (optimistic) ---- */
    builder
      .addCase(deletePost.pending, (state, action) => {
        const id = action.meta.arg;
        state.entityLoading[id] = 'delete';
        // Optimistic: remove from all lists immediately
        postsAdapter.removeOne(state, id);
        state.feedIds = state.feedIds.filter((fid) => fid !== id);
        state.exploreIds = state.exploreIds.filter((fid) => fid !== id);
        state.savedIds = state.savedIds.filter((fid) => fid !== id);
        state.searchIds = state.searchIds.filter((fid) => fid !== id);
        for (const username of Object.keys(state.userPostIds)) {
          state.userPostIds[username] = state.userPostIds[username].filter((fid) => fid !== id);
        }
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        delete state.entityLoading[action.payload];
        state.lastFetched = null; // Invalidate
      })
      .addCase(deletePost.rejected, (state, action) => {
        // Rollback: we can't fully restore without the original entity,
        // so we invalidate to force a re-fetch
        const payload = action.payload as any;
        if (payload?.id) delete state.entityLoading[payload.id];
        state.lastFetched = null;
      });

    /* ---- updatePost (optimistic) ---- */
    builder
      .addCase(updatePost.pending, (state, action) => {
        state.entityLoading[action.meta.arg.id] = 'update';
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        postsAdapter.upsertOne(state, action.payload);
        delete state.entityLoading[action.payload._id];
        state.lastFetched = null; // Invalidate
      })
      .addCase(updatePost.rejected, (state, action) => {
        const payload = action.payload as any;
        if (payload?.id) delete state.entityLoading[payload.id];
      });

    /* ---- likePost (optimistic) ---- */
    builder
      .addCase(likePost.pending, (state, action) => {
        const id = action.meta.arg;
        state.entityLoading[id] = 'like';
        // Optimistic toggle
        const post = state.entities[id];
        if (post) {
          const wasLiked = post.isLiked;
          post.isLiked = !wasLiked;
          post.likesCount += wasLiked ? -1 : 1;
        }
      })
      .addCase(likePost.fulfilled, (state, action) => {
        const { id, isLiked } = action.payload;
        delete state.entityLoading[id];
        // Reconcile with server truth
        const post = state.entities[id];
        if (post) {
          // We already toggled optimistically; now reconcile.
          // The optimistic toggle assumed !wasLiked. If server disagrees, fix it.
          if (post.isLiked !== isLiked) {
            const diff = isLiked ? 1 : -1;
            const oppDiff = isLiked ? -1 : 1;
            post.isLiked = isLiked;
            post.likesCount += diff - oppDiff;  // undo wrong + apply correct
          }
        }
      })
      .addCase(likePost.rejected, (state, action) => {
        const payload = action.payload as any;
        const id = payload?.id;
        if (id) {
          delete state.entityLoading[id];
          // Rollback optimistic toggle
          const post = state.entities[id];
          if (post) {
            post.isLiked = !post.isLiked;
            post.likesCount += post.isLiked ? 1 : -1;
          }
        }
      });

    /* ---- savePost (optimistic) ---- */
    builder
      .addCase(savePost.pending, (state, action) => {
        const id = action.meta.arg.id;
        state.entityLoading[id] = 'save';
        // Optimistic toggle
        const post = state.entities[id];
        if (post) {
          const wasSaved = post.isSaved;
          post.isSaved = !wasSaved;
          post.savesCount += wasSaved ? -1 : 1;
          // Update savedIds list
          if (!wasSaved) {
            if (!state.savedIds.includes(id)) state.savedIds.push(id);
          } else {
            state.savedIds = state.savedIds.filter((sid) => sid !== id);
          }
        }
      })
      .addCase(savePost.fulfilled, (state, action) => {
        const { id, isSaved } = action.payload;
        delete state.entityLoading[id];
        const post = state.entities[id];
        if (post && post.isSaved !== isSaved) {
          // Reconcile with server truth
          post.isSaved = isSaved;
          post.savesCount += isSaved ? 1 : -1;
          if (isSaved && !state.savedIds.includes(id)) state.savedIds.push(id);
          if (!isSaved) state.savedIds = state.savedIds.filter((sid) => sid !== id);
        }
        state.savedLastFetched = null;
      })
      .addCase(savePost.rejected, (state, action) => {
        const payload = action.payload as any;
        const id = payload?.id;
        if (id) {
          delete state.entityLoading[id];
          // Rollback
          const post = state.entities[id];
          if (post) {
            post.isSaved = !post.isSaved;
            post.savesCount += post.isSaved ? 1 : -1;
            if (post.isSaved && !state.savedIds.includes(id)) state.savedIds.push(id);
            if (!post.isSaved) state.savedIds = state.savedIds.filter((sid) => sid !== id);
          }
        }
      });

    /* ---- createPost ---- */
    builder
      .addCase(createPost.fulfilled, (state, action) => {
        postsAdapter.addOne(state, action.payload);
        state.feedIds.unshift(action.payload._id);
        state.lastFetched = null; // Invalidate
      });

    /* ---- fetchCategories ---- */
    builder
      .addCase(fetchCategories.fulfilled, (state, action) => {
        if (!action.payload.cached) {
          state.categories = action.payload.categories;
          state.categoriesLastFetched = new Date().toISOString();
        }
      });

    /* ---- fetchTrendingTags ---- */
    builder
      .addCase(fetchTrendingTags.fulfilled, (state, action) => {
        if (!action.payload.cached) {
          state.trendingTags = action.payload.tags;
          state.trendingTagsLastFetched = new Date().toISOString();
        }
      });

    /* ---- fetchExplore ---- */
    builder
      .addCase(fetchExplore.pending, (state) => {
        state.exploreLoading = true;
      })
      .addCase(fetchExplore.fulfilled, (state, action) => {
        const { posts } = action.payload;
        postsAdapter.upsertMany(state, posts);
        state.exploreIds = posts.map((p) => p._id);
        state.exploreLoading = false;
      })
      .addCase(fetchExplore.rejected, (state) => {
        state.exploreLoading = false;
      });

    /* ---- searchPosts ---- */
    builder
      .addCase(searchPosts.pending, (state) => {
        state.searchLoading = true;
      })
      .addCase(searchPosts.fulfilled, (state, action) => {
        const { posts, page, reset } = action.payload;
        postsAdapter.upsertMany(state, posts);
        const newIds = posts.map((p) => p._id);

        if (reset || page === 1) {
          state.searchIds = newIds;
        } else {
          const existing = new Set(state.searchIds);
          state.searchIds.push(...newIds.filter((id) => !existing.has(id)));
        }
        state.searchMeta = { page, hasMore: posts.length >= 30 };
        state.searchLoading = false;
      })
      .addCase(searchPosts.rejected, (state) => {
        state.searchLoading = false;
      });

    /* ---- fetchSavedPosts ---- */
    builder
      .addCase(fetchSavedPosts.pending, (state) => {
        state.savedLoading = true;
      })
      .addCase(fetchSavedPosts.fulfilled, (state, action) => {
        if (!action.payload.cached) {
          postsAdapter.upsertMany(state, action.payload.posts);
          state.savedIds = action.payload.posts.map((p) => p._id);
          state.savedLastFetched = new Date().toISOString();
        }
        state.savedLoading = false;
      })
      .addCase(fetchSavedPosts.rejected, (state) => {
        state.savedLoading = false;
      });

    /* ---- fetchUserPosts ---- */
    builder
      .addCase(fetchUserPosts.fulfilled, (state, action) => {
        const { posts, username } = action.payload;
        postsAdapter.upsertMany(state, posts);
        state.userPostIds[username] = posts.map((p) => p._id);
      });
  },
});

export const {
  invalidateCache,
  clearFeed,
  setFeedFilters,
  clearSearch,
  clearError,
} = postsSlice.actions;

/* ========================================================================
   Selectors (adapter-based)
   ======================================================================== */

export const {
  selectAll: selectAllPosts,
  selectById: selectPostById,
  selectIds: selectPostIds,
} = postsAdapter.getSelectors((state: RootState) => state.posts);

export default postsSlice.reducer;
