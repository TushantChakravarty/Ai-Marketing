import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';
import { User, AuthTokens, Business } from '../types';

export const StorageUtil = {
  // ─── Token ────────────────────────────────────────────────────────────────

  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  async removeToken(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  // ─── Refresh Token ────────────────────────────────────────────────────────

  async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  async setRefreshToken(token: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  async removeRefreshToken(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  // ─── Auth Tokens ──────────────────────────────────────────────────────────

  async setAuthTokens(tokens: AuthTokens): Promise<void> {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
      AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
    ]);
  },

  async clearAuthTokens(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
  },

  // ─── User ─────────────────────────────────────────────────────────────────

  async getUser(): Promise<User | null> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  async setUser(user: User): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  async removeUser(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  },

  // ─── Current Business ─────────────────────────────────────────────────────

  async getCurrentBusiness(): Promise<Business | null> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_BUSINESS);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Business;
    } catch {
      return null;
    }
  },

  async setCurrentBusiness(business: Business): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_BUSINESS, JSON.stringify(business));
  },

  async removeCurrentBusiness(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_BUSINESS);
  },

  // ─── Onboarding ───────────────────────────────────────────────────────────

  async getOnboardingCompleted(): Promise<boolean> {
    const val = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
    return val === 'true';
  },

  async setOnboardingCompleted(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
  },

  // ─── Theme ────────────────────────────────────────────────────────────────

  async getTheme(): Promise<'light' | 'dark' | null> {
    const val = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
    if (val === 'light' || val === 'dark') return val;
    return null;
  },

  async setTheme(theme: 'light' | 'dark'): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  // ─── Clear All ────────────────────────────────────────────────────────────

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER,
      STORAGE_KEYS.CURRENT_BUSINESS,
      STORAGE_KEYS.ONBOARDING_COMPLETED,
    ]);
  },
};
