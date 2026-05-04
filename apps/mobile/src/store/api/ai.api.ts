import { baseApi } from './base.api';
import { ApiResponse, Platform } from '../../types';

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
  }),
});

export const {
  useGeneratePostMutation,
  useGenerateHashtagsMutation,
  useGenerateContentCalendarMutation,
  useImprovePostMutation,
} = aiApi;
