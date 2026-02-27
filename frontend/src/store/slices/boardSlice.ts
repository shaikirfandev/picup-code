import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Board } from '@/types';
import { boardsAPI } from '@/lib/api';
import { withRetry, serializeError, isCacheValid, SerializedError } from '../utils/retry';
import type { RootState } from '../index';

/* ========================================================================
   State
   ======================================================================== */

interface BoardsState {
  boards: Board[];
  boardsLoading: boolean;
  boardsLastFetched: string | null;

  // Single board detail
  currentBoard: Board | null;
  currentBoardLoading: boolean;

  error: SerializedError | null;
}

const initialState: BoardsState = {
  boards: [],
  boardsLoading: false,
  boardsLastFetched: null,

  currentBoard: null,
  currentBoardLoading: false,

  error: null,
};

/* ========================================================================
   Thunks
   ======================================================================== */

export const fetchMyBoards = createAsyncThunk(
  'boards/fetchMyBoards',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = (getState() as RootState).boards;
      if (state.boards.length > 0 && isCacheValid(state.boardsLastFetched, 120_000)) {
        return { boards: state.boards, cached: true };
      }
      const { data } = await withRetry(() => boardsAPI.getMyBoards());
      return { boards: (data.data || []) as Board[], cached: false };
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
);

export const fetchBoard = createAsyncThunk(
  'boards/fetchBoard',
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await withRetry(() => boardsAPI.getBoard(id));
      return data.data as Board;
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
);

export const createBoard = createAsyncThunk(
  'boards/createBoard',
  async (payload: { name: string; description?: string; isPrivate?: boolean }, { rejectWithValue }) => {
    try {
      const { data } = await boardsAPI.createBoard(payload);
      return data.data as Board;
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
);

export const deleteBoard = createAsyncThunk(
  'boards/deleteBoard',
  async (id: string, { rejectWithValue }) => {
    try {
      await boardsAPI.deleteBoard(id);
      return id;
    } catch (err) {
      return rejectWithValue(serializeError(err));
    }
  },
);

/* ========================================================================
   Slice
   ======================================================================== */

const boardsSlice = createSlice({
  name: 'boards',
  initialState,
  reducers: {
    clearBoardError(state) {
      state.error = null;
    },
    invalidateBoardsCache(state) {
      state.boardsLastFetched = null;
    },
  },
  extraReducers: (builder) => {
    /* fetchMyBoards */
    builder
      .addCase(fetchMyBoards.pending, (state) => {
        state.boardsLoading = true;
        state.error = null;
      })
      .addCase(fetchMyBoards.fulfilled, (state, action) => {
        if (!action.payload.cached) {
          state.boards = action.payload.boards;
          state.boardsLastFetched = new Date().toISOString();
        }
        state.boardsLoading = false;
      })
      .addCase(fetchMyBoards.rejected, (state, action) => {
        state.boardsLoading = false;
        state.error = (action.payload as SerializedError) || { message: 'Failed to fetch boards' };
      });

    /* fetchBoard */
    builder
      .addCase(fetchBoard.pending, (state) => {
        state.currentBoardLoading = true;
        state.error = null;
      })
      .addCase(fetchBoard.fulfilled, (state, action) => {
        state.currentBoard = action.payload;
        state.currentBoardLoading = false;
      })
      .addCase(fetchBoard.rejected, (state, action) => {
        state.currentBoardLoading = false;
        state.error = (action.payload as SerializedError) || { message: 'Board not found' };
      });

    /* createBoard — optimistic: prepend to list */
    builder
      .addCase(createBoard.fulfilled, (state, action) => {
        state.boards.unshift(action.payload);
      });

    /* deleteBoard — optimistic remove */
    builder
      .addCase(deleteBoard.pending, (state, action) => {
        const id = action.meta.arg;
        state.boards = state.boards.filter((b) => b._id !== id);
      })
      .addCase(deleteBoard.rejected, (state) => {
        // Invalidate to re‑fetch on failure
        state.boardsLastFetched = null;
      });
  },
});

export const { clearBoardError, invalidateBoardsCache } = boardsSlice.actions;
export default boardsSlice.reducer;
