import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setUser,
  setTokens,
  logout as logoutAction,
  setLoading,
  setHasCompletedOnboarding,
} from '../store/slices/auth.slice';
import { AuthService } from '../services/auth.service';
import { registerLogoutHandler } from '../services/api.service';
import { StorageUtil } from '../utils/storage.util';
import type { LoginCredentials, RegisterData, User, AuthTokens } from '../types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, tokens, isAuthenticated, isLoading, hasCompletedOnboarding } =
    useAppSelector(s => s.auth);

  useEffect(() => {
    registerLogoutHandler(() => {
      dispatch(logoutAction());
    });
  }, [dispatch]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      dispatch(setLoading(true));
      try {
        const response = await AuthService.login(credentials);
        const { user: userData, tokens: authTokens } = response.data;
        await StorageUtil.setUser(userData);
        await StorageUtil.setAuthTokens(authTokens);
        dispatch(setUser(userData));
        dispatch(setTokens(authTokens));
        return response;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  const register = useCallback(
    async (data: RegisterData) => {
      dispatch(setLoading(true));
      try {
        const response = await AuthService.register(data);
        const { user: userData, tokens: authTokens } = response.data;
        await StorageUtil.setUser(userData);
        await StorageUtil.setAuthTokens(authTokens);
        dispatch(setUser(userData));
        dispatch(setTokens(authTokens));
        return response;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  const logout = useCallback(async () => {
    try {
      if (tokens?.refreshToken) {
        await AuthService.logout(tokens.refreshToken);
      }
    } catch {
      // Ignore logout API errors
    } finally {
      await StorageUtil.clearAll();
      dispatch(logoutAction());
    }
  }, [dispatch, tokens]);

  const updateUser = useCallback(
    async (userData: User) => {
      await StorageUtil.setUser(userData);
      dispatch(setUser(userData));
    },
    [dispatch],
  );

  const updateTokens = useCallback(
    async (authTokens: AuthTokens) => {
      await StorageUtil.setAuthTokens(authTokens);
      dispatch(setTokens(authTokens));
    },
    [dispatch],
  );

  const markOnboardingComplete = useCallback(async () => {
    await StorageUtil.setOnboardingCompleted();
    dispatch(setHasCompletedOnboarding(true));
  }, [dispatch]);

  return {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    hasCompletedOnboarding,
    login,
    register,
    logout,
    updateUser,
    updateTokens,
    markOnboardingComplete,
  };
};
