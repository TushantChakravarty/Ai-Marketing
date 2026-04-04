import { baseApi } from './base.api';
import { ApiResponse, PaginatedResponse } from '../../types';
import {
  Campaign,
  CreateCampaignDto,
  UpdateCampaignDto,
  GetCampaignsQuery,
  AudienceTargeting,
  MetaInterest,
} from '../../types/ads';

export const adsApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    createCampaign: builder.mutation<ApiResponse<Campaign>, CreateCampaignDto>({
      query: data => ({ url: '/ads', method: 'POST', body: data }),
      invalidatesTags: ['Campaign'],
    }),

    getCampaigns: builder.query<PaginatedResponse<Campaign>, GetCampaignsQuery>({
      query: params => ({ url: '/ads', params }),
      providesTags: ['Campaign'],
    }),

    getCampaign: builder.query<ApiResponse<Campaign>, string>({
      query: id => `/ads/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Campaign', id }],
    }),

    updateCampaign: builder.mutation<ApiResponse<Campaign>, { id: string; data: UpdateCampaignDto }>({
      query: ({ id, data }) => ({ url: `/ads/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Campaign', id }, 'Campaign'],
    }),

    deleteCampaign: builder.mutation<ApiResponse<null>, string>({
      query: id => ({ url: `/ads/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Campaign'],
    }),

    launchCampaign: builder.mutation<ApiResponse<Campaign>, string>({
      query: id => ({ url: `/ads/${id}/launch`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Campaign', id }, 'Campaign'],
    }),

    pauseCampaign: builder.mutation<ApiResponse<Campaign>, string>({
      query: id => ({ url: `/ads/${id}/pause`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Campaign', id }, 'Campaign'],
    }),

    resumeCampaign: builder.mutation<ApiResponse<Campaign>, string>({
      query: id => ({ url: `/ads/${id}/resume`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Campaign', id }, 'Campaign'],
    }),

    syncInsights: builder.mutation<ApiResponse<Campaign>, string>({
      query: id => ({ url: `/ads/${id}/sync-insights`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Campaign', id }],
    }),

    searchInterests: builder.query<
      ApiResponse<MetaInterest[]>,
      { businessId: string; adAccountId: string; q: string }
    >({
      query: params => ({ url: '/ads/tools/interests', params }),
    }),

    estimateAudience: builder.mutation<
      ApiResponse<{ lower: number; upper: number }>,
      { businessId: string; adAccountId: string; targeting: AudienceTargeting }
    >({
      query: data => ({ url: '/ads/tools/estimate-audience', method: 'POST', body: data }),
    }),
  }),
});

export const {
  useCreateCampaignMutation,
  useGetCampaignsQuery,
  useGetCampaignQuery,
  useUpdateCampaignMutation,
  useDeleteCampaignMutation,
  useLaunchCampaignMutation,
  usePauseCampaignMutation,
  useResumeCampaignMutation,
  useSyncInsightsMutation,
  useSearchInterestsQuery,
  useEstimateAudienceMutation,
} = adsApi;
