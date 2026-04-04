import apiClient from './api.service';
import { ApiResponse, Platform, Tone } from '../types';

export interface GeneratePostData {
  businessId: string;
  prompt: string;
  tone: Tone;
  platforms: Platform[];
  includeHashtags?: boolean;
  includeEmojis?: boolean;
}

export interface GeneratedPost {
  content: string;
  hashtags: string[];
  platformVariants: Record<Platform, string>;
}

export interface GenerateHashtagsData {
  businessId: string;
  content: string;
  platforms: Platform[];
  count?: number;
}

export interface CalendarEntry {
  date: string;
  suggestedTopic: string;
  suggestedTone: Tone;
  platforms: Platform[];
}

export interface GenerateCalendarData {
  businessId: string;
  startDate: string;
  endDate: string;
  postsPerWeek: number;
  platforms: Platform[];
}

export interface ImprovePostData {
  businessId: string;
  content: string;
  instruction: string;
  tone?: Tone;
}

export const AiService = {
  async generatePost(
    data: GeneratePostData,
  ): Promise<ApiResponse<GeneratedPost>> {
    const response = await apiClient.post<ApiResponse<GeneratedPost>>(
      '/ai/generate-post',
      data,
    );
    return response.data;
  },

  async generateHashtags(
    data: GenerateHashtagsData,
  ): Promise<ApiResponse<string[]>> {
    const response = await apiClient.post<ApiResponse<string[]>>(
      '/ai/generate-hashtags',
      data,
    );
    return response.data;
  },

  async generateContentCalendar(
    data: GenerateCalendarData,
  ): Promise<ApiResponse<CalendarEntry[]>> {
    const response = await apiClient.post<ApiResponse<CalendarEntry[]>>(
      '/ai/content-calendar',
      data,
    );
    return response.data;
  },

  async improvePost(
    data: ImprovePostData,
  ): Promise<ApiResponse<{ content: string }>> {
    const response = await apiClient.post<ApiResponse<{ content: string }>>(
      '/ai/improve-post',
      data,
    );
    return response.data;
  },
};
