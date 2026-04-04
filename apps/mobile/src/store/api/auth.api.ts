import { baseApi } from './base.api';
import { ApiResponse, User, AuthTokens, LoginCredentials, RegisterData } from '../../types';

interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    login: builder.mutation<ApiResponse<AuthResponse>, LoginCredentials>({
      query: credentials => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),

    register: builder.mutation<ApiResponse<AuthResponse>, RegisterData>({
      query: data => ({
        url: '/auth/register',
        method: 'POST',
        body: data,
      }),
    }),

    getMe: builder.query<ApiResponse<User>, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),

    forgotPassword: builder.mutation<ApiResponse<null>, { email: string }>({
      query: body => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body,
      }),
    }),

    resetPassword: builder.mutation<
      ApiResponse<null>,
      { token: string; password: string }
    >({
      query: body => ({
        url: '/auth/reset-password',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
