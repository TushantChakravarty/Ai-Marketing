import { baseApi } from './base.api';
import { ApiResponse, Business, PlatformConnection, Platform } from '../../types';

interface ConnectUrlParams {
  platform: Platform;
  businessId: string;
  returnUrl: string;
}

interface CreateBusinessData {
  name: string;
  description: string;
  industry: string;
  tone: string;
  targetAudience: string;
  marketingMode: string;
  website?: string;
}

export const businessApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    createBusiness: builder.mutation<ApiResponse<Business>, CreateBusinessData>(
      {
        query: data => ({
          url: '/businesses',
          method: 'POST',
          body: data,
        }),
        invalidatesTags: ['Business'],
      },
    ),

    getMyBusinesses: builder.query<ApiResponse<Business[]>, void>({
      query: () => '/businesses/me',
      providesTags: ['Business'],
    }),

    getBusiness: builder.query<ApiResponse<Business>, string>({
      query: id => `/businesses/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Business', id }],
    }),

    updateBusiness: builder.mutation<
      ApiResponse<Business>,
      { id: string; data: Partial<CreateBusinessData> }
    >({
      query: ({ id, data }) => ({
        url: `/businesses/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Business', id }],
    }),

    getPlatformConnections: builder.query<
      ApiResponse<PlatformConnection[]>,
      string
    >({
      query: businessId => `/businesses/${businessId}/platforms`,
      providesTags: ['Business'],
    }),

    disconnectPlatform: builder.mutation<
      ApiResponse<null>,
      { businessId: string; platform: Platform }
    >({
      query: ({ businessId, platform }) => ({
        url: `/businesses/${businessId}/platforms/${platform}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Business'],
    }),

    getConnectUrl: builder.query<ApiResponse<{ url: string }>, ConnectUrlParams>({
      query: ({ platform, businessId, returnUrl }) =>
        `/platforms/connect-url?platform=${platform}&businessId=${businessId}&returnUrl=${encodeURIComponent(returnUrl)}`,
    }),
  }),
});

export const {
  useCreateBusinessMutation,
  useGetMyBusinessesQuery,
  useGetBusinessQuery,
  useUpdateBusinessMutation,
  useGetPlatformConnectionsQuery,
  useDisconnectPlatformMutation,
  useLazyGetConnectUrlQuery,
} = businessApi;
