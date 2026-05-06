import { baseApi } from './base.api';
import { ApiResponse, Business, PlatformAdConfig } from '../../types';

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
    createBusiness: builder.mutation<ApiResponse<Business>, CreateBusinessData>({
      query: data => ({ url: '/businesses', method: 'POST', body: data }),
      invalidatesTags: ['Business'],
    }),

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
      query: ({ id, data }) => ({ url: `/businesses/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Business', id }],
    }),

    getPlatformConfigs: builder.query<ApiResponse<PlatformAdConfig[]>, string>({
      query: businessId => `/businesses/${businessId}/platform-configs`,
      providesTags: ['Business'],
    }),

    updatePlatformConfigs: builder.mutation<
      ApiResponse<PlatformAdConfig[]>,
      { businessId: string; configs: PlatformAdConfig[] }
    >({
      query: ({ businessId, configs }) => ({
        url: `/businesses/${businessId}/platform-configs`,
        method: 'PATCH',
        body: configs,
      }),
      invalidatesTags: ['Business'],
    }),
  }),
});

export const {
  useCreateBusinessMutation,
  useGetMyBusinessesQuery,
  useGetBusinessQuery,
  useUpdateBusinessMutation,
  useGetPlatformConfigsQuery,
  useUpdatePlatformConfigsMutation,
} = businessApi;
