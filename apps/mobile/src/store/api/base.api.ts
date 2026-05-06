import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import API_CONFIG from '../../config/api.config';
import { StorageUtil } from '../../utils/storage.util';
import { logout } from '../slices/auth.slice';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_CONFIG.BASE_URL,
  prepareHeaders: async headers => {
    const token = await StorageUtil.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    return headers;
  },
});

let isRefreshing = false;

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && !isRefreshing) {
    isRefreshing = true;
    try {
      const refreshToken = await StorageUtil.getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token');

      const refreshResult = await rawBaseQuery(
        { url: '/auth/refresh', method: 'POST', body: { refreshToken } },
        api,
        extraOptions,
      );

      if (refreshResult.data) {
        const { accessToken, refreshToken: newRefresh } = (
          refreshResult.data as { data: { accessToken: string; refreshToken: string } }
        ).data;
        await StorageUtil.setAuthTokens({
          accessToken,
          refreshToken: newRefresh,
          expiresAt: Date.now() + 3600 * 1000,
        });
        // Retry the original request with the new token
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        await StorageUtil.clearAll();
        api.dispatch(logout());
      }
    } catch {
      await StorageUtil.clearAll();
      api.dispatch(logout());
    } finally {
      isRefreshing = false;
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Business', 'Post', 'Analytics', 'Subscription', 'Campaign'],
  endpoints: () => ({}),
});
