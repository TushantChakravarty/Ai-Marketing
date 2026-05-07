import { baseApi } from './base.api';
import { ApiResponse, Platform, AICampaign, CampaignType, BudgetRange } from '../../types';

interface GeneratePostParams {
  businessId: string;
  prompt: string;
  platform: Platform;
  tone?: string;
}

interface GenerateHashtagsParams {
  content: string;
  industry: string;
}

interface ContentCalendarParams {
  businessId: string;
  days: number;
  tone?: string;
}

interface GenerateImageParams {
  prompt: string;
}

interface GenerateCampaignParams {
  businessId: string;
  campaignType: CampaignType;
  offer: string;
  location: string;
  budgetRange: BudgetRange;
  durationDays: number;
}

interface GeneratedImage {
  imageUrl: string;
}

interface GeneratedPost {
  text: string;
  hashtags: string[];
  imagePrompt?: string;
}

interface GeneratedHashtags {
  hashtags: string[];
}

interface CalendarEntry {
  date: string;
  content: string;
  hashtags: string[];
  platforms: Platform[];
  tone: string;
}

export const aiApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    generatePost: builder.mutation<ApiResponse<GeneratedPost>, GeneratePostParams>({
      query: data => ({
        url: '/ai/generate-post',
        method: 'POST',
        body: data,
      }),
    }),

    generateHashtags: builder.mutation<ApiResponse<GeneratedHashtags>, GenerateHashtagsParams>({
      query: data => ({
        url: '/ai/generate-hashtags',
        method: 'POST',
        body: data,
      }),
    }),

    generateContentCalendar: builder.mutation<ApiResponse<CalendarEntry[]>, ContentCalendarParams>({
      query: data => ({
        url: '/ai/content-calendar',
        method: 'POST',
        body: data,
      }),
    }),

    improvePost: builder.mutation<ApiResponse<GeneratedPost>, { content: string; feedback: string }>({
      query: data => ({
        url: '/ai/improve-post',
        method: 'POST',
        body: data,
      }),
    }),

    generateImage: builder.mutation<ApiResponse<GeneratedImage>, GenerateImageParams>({
      query: data => ({
        url: '/ai/generate-image',
        method: 'POST',
        body: data,
      }),
    }),

    generateCampaign: builder.mutation<ApiResponse<{ campaign: AICampaign }>, GenerateCampaignParams>({
      query: data => ({
        url: '/ai/generate-campaign',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useGeneratePostMutation,
  useGenerateHashtagsMutation,
  useGenerateContentCalendarMutation,
  useImprovePostMutation,
  useGenerateImageMutation,
  useGenerateCampaignMutation,
} = aiApi;
