import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import API_CONFIG from '../config/api.config';
import { StorageUtil } from '../utils/storage.util';
import { store } from '../store';
import { logout } from '../store/slices/auth.slice';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string | null) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
});

// Request interceptor: attach Bearer token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await StorageUtil.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

// Response interceptor: handle errors, token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async error => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!error.response) {
      // Network error — retry up to RETRY_ATTEMPTS times
      const retryCount = (originalRequest as { _retryCount?: number })
        ._retryCount ?? 0;
      if (retryCount < API_CONFIG.RETRY_ATTEMPTS) {
        (originalRequest as { _retryCount?: number })._retryCount =
          retryCount + 1;
        await new Promise(resolve =>
          setTimeout(resolve, API_CONFIG.RETRY_DELAY * (retryCount + 1)),
        );
        return apiClient(originalRequest);
      }
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }

    const { status } = error.response;
    const requestUrl: string = (originalRequest as { url?: string }).url ?? '';
    const isAuthEndpoint = requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/forgot-password') ||
      requestUrl.includes('/auth/reset-password');

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token as string}`;
            }
            return apiClient(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await StorageUtil.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(
          `${API_CONFIG.BASE_URL}/auth/refresh`,
          { refreshToken },
          { headers: API_CONFIG.HEADERS },
        );

        const { accessToken, refreshToken: newRefresh } = response.data.data;
        await StorageUtil.setAuthTokens({
          accessToken,
          refreshToken: newRefresh,
          expiresAt: Date.now() + 3600 * 1000,
        });

        processQueue(null, accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await StorageUtil.clearAll();
        store.dispatch(logout());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 403) {
      return Promise.reject(new Error('You do not have permission to perform this action.'));
    }

    if (status === 500) {
      return Promise.reject(new Error('Server error. Please try again later.'));
    }

    // Extract message from API error response body
    const apiMessage = error.response?.data?.message;
    if (apiMessage) {
      return Promise.reject(new Error(apiMessage));
    }

    return Promise.reject(error);
  },
);

export default apiClient;
