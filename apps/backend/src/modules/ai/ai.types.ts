import { Platform, Tone } from '../../config/constants';

export interface GeneratePostDto {
  businessId: string;
  prompt: string;
  platform: Platform;
  tone?: Tone;
  maxLength?: number;
}

export interface GenerateHashtagsDto {
  content: string;
  industry: string;
  count?: number;
}

export interface GenerateImagePromptDto {
  content: string;
  style?: string;
}

export interface ContentCalendarDto {
  businessId: string;
  days: number;
  platforms: Platform[];
  tone?: Tone;
}

export interface ImprovePostDto {
  content: string;
  feedback: string;
  platform?: Platform;
}

export interface AnalyzeSentimentDto {
  content: string;
}

export interface AIGeneratedContent {
  text: string;
  hashtags?: string[];
  imagePrompt?: string;
  platform?: Platform;
  tone?: Tone;
  metadata?: Record<string, unknown>;
}

export interface ContentCalendarEntry {
  date: string;
  platform: Platform;
  content: AIGeneratedContent;
  suggestedTime?: string;
}

export interface SentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  explanation: string;
}
