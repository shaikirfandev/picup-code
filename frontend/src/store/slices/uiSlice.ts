import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  searchOpen: boolean;
  createPostOpen: boolean;
  theme: 'light' | 'dark' | 'system';
}

const initialState: UIState = {
  sidebarOpen: false,
  searchOpen: false,
  createPostOpen: false,
  theme: 'system',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    closeSidebar(state) {
      state.sidebarOpen = false;
    },
    toggleSearch(state) {
      state.searchOpen = !state.searchOpen;
    },
    toggleCreatePost(state) {
      state.createPostOpen = !state.createPostOpen;
    },
    setTheme(state, action: PayloadAction<'light' | 'dark' | 'system'>) {
      state.theme = action.payload;
    },
  },
});

export const { toggleSidebar, closeSidebar, toggleSearch, toggleCreatePost, setTheme } = uiSlice.actions;
export default uiSlice.reducer;
