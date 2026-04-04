import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, AuthTokens } from '../../types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
}

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  hasCompletedOnboarding: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setTokens(state, action: PayloadAction<AuthTokens | null>) {
      state.tokens = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setAuthenticated(state, action: PayloadAction<boolean>) {
      state.isAuthenticated = action.payload;
    },
    setHasCompletedOnboarding(state, action: PayloadAction<boolean>) {
      state.hasCompletedOnboarding = action.payload;
    },
    logout(state) {
      state.user = null;
      state.tokens = null;
      state.isAuthenticated = false;
      state.hasCompletedOnboarding = false;
    },
  },
});

export const {
  setUser,
  setTokens,
  setLoading,
  setAuthenticated,
  setHasCompletedOnboarding,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
