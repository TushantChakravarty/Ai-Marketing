import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface UIState {
  theme: ThemeMode;
  notifications: Notification[];
  isConnected: boolean;
}

const initialState: UIState = {
  theme: 'system',
  notifications: [],
  isConnected: true,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.theme = action.payload;
    },
    addNotification(state, action: PayloadAction<Notification>) {
      state.notifications.push(action.payload);
    },
    removeNotification(state, action: PayloadAction<string>) {
      state.notifications = state.notifications.filter(
        n => n.id !== action.payload,
      );
    },
    clearNotifications(state) {
      state.notifications = [];
    },
    setConnected(state, action: PayloadAction<boolean>) {
      state.isConnected = action.payload;
    },
  },
});

export const {
  setTheme,
  addNotification,
  removeNotification,
  clearNotifications,
  setConnected,
} = uiSlice.actions;

export default uiSlice.reducer;
