import Groq from 'groq-sdk';
import { env } from '../../config/env.config';
import { Platform, Tone } from '../../config/constants';
import {
  AIGeneratedContent,
  ContentCalendarEntry,
  SentimentResult,
} from './ai.types';

const MODEL = 'llama-3.3-70b-versatile';

const PLATFORM_LIMITS: Record<Platform, number> = {
  twitter: 280,
  facebook: 63206,
  instagram: 2200,
  linkedin: 3000,
};

const PLATFORM_GUIDELINES: Record<Platform, string> = {
  twitter: 'Keep it concise (under 280 chars), punchy, use 1-2 hashtags, conversational tone.',
  facebook: 'Can be longer, more storytelling, engage with questions, use 3-5 hashtags.',
  instagram: 'Visual-focused, emojis welcome, up to 30 hashtags, lifestyle language.',
  linkedin: 'Professional, industry insights, thought leadership, 3-5 hashtags, add value.',
};

export class AIService {
  private client: Groq;

  constructor() {
    this.client = new Groq({ apiKey: env.GROQ_API_KEY });
  }

  private async chat(systemPrompt: string, userMessage: string, maxTokens = 1024): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });
    return response.choices[0]?.message?.content ?? '';
  }

  async generatePost(
    businessContext: { name: string; industry: string; targetAudience?: string },
    prompt: string,
    platform: Platform,
    tone: Tone = 'professional',
    maxLength?: number,
  ): Promise<AIGeneratedContent> {
    const limit = maxLength ?? PLATFORM_LIMITS[platform];
    const guidelines = PLATFORM_GUIDELINES[platform];

    const systemPrompt = `You are an expert social media marketing copywriter.
Business: ${businessContext.name} (${businessContext.industry})
Target Audience: ${businessContext.targetAudience ?? 'General audience'}
Tone: ${tone}

Platform Guidelines for ${platform}: ${guidelines}
Character limit: ${limit}

Respond ONLY with a valid JSON object, no markdown, no explanation:
{ "text": "post content here", "hashtags": ["tag1", "tag2"], "imagePrompt": "image prompt here" }`;

    const raw = await this.chat(systemPrompt, `Create a ${platform} post about: ${prompt}`);

    try {
      const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
      return {
        text: parsed.text ?? raw,
        hashtags: parsed.hashtags ?? [],
        imagePrompt: parsed.imagePrompt,
        platform,
        tone,
      };
    } catch {
      return { text: raw, hashtags: [], platform, tone };
    }
  }

  async generateHashtags(content: string, industry: string, count = 10): Promise<string[]> {
    const raw = await this.chat(
      'You are a social media hashtag expert. Respond ONLY with a valid JSON array of strings, no markdown.',
      `Generate ${count} relevant hashtags for this ${industry} industry post. No # symbol. Post: "${content}"`,
      256,
    );
    try {
      const match = raw.match(/\[[\s\S]*\]/);
      return match ? JSON.parse(match[0]) : [];
    } catch {
      return [];
    }
  }

  async generateImagePrompt(content: string, style = 'modern, professional'): Promise<string> {
    const raw = await this.chat(
      'You are a visual art director. Respond with just the image prompt, no explanation.',
      `Create a concise image generation prompt for this social media post. Style: ${style}. Post: "${content}"`,
      256,
    );
    return raw.trim();
  }

  async generateContentCalendar(
    businessContext: { name: string; industry: string; targetAudience?: string; tone?: Tone },
    days: number,
    platforms: Platform[],
  ): Promise<ContentCalendarEntry[]> {
    const raw = await this.chat(
      'You are a social media content strategist. Respond ONLY with a valid JSON array, no markdown.',
      `Create a ${days}-day social media content calendar for:
Business: ${businessContext.name} (${businessContext.industry})
Target Audience: ${businessContext.targetAudience ?? 'General audience'}
Tone: ${businessContext.tone ?? 'professional'}
Platforms: ${platforms.join(', ')}

Each item: { "date": "YYYY-MM-DD", "platform": "platform_name", "content": { "text": "post content", "hashtags": ["tag1"], "imagePrompt": "prompt" }, "suggestedTime": "HH:MM" }`,
      4096,
    );
    try {
      const match = raw.match(/\[[\s\S]*\]/);
      return match ? JSON.parse(match[0]) : [];
    } catch {
      return [];
    }
  }

  async analyzeSentiment(content: string): Promise<SentimentResult> {
    const raw = await this.chat(
      'You are a sentiment analysis expert. Respond ONLY with valid JSON, no markdown.',
      `Analyze the sentiment of this post. Respond: { "sentiment": "positive|neutral|negative", "score": 0.0-1.0, "explanation": "brief" }. Post: "${content}"`,
      256,
    );
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : { sentiment: 'neutral', score: 0.5, explanation: '' };
    } catch {
      return { sentiment: 'neutral', score: 0.5, explanation: 'Unable to analyze' };
    }
  }

  async improvePost(content: string, feedback: string, platform?: Platform): Promise<AIGeneratedContent> {
    const platformContext = platform
      ? `Platform: ${platform}. ${PLATFORM_GUIDELINES[platform]}`
      : '';

    const raw = await this.chat(
      `You are a social media copywriter. ${platformContext} Respond ONLY with valid JSON, no markdown.`,
      `Improve this post based on feedback.
Original: "${content}"
Feedback: "${feedback}"
Respond: { "text": "improved post", "hashtags": ["tag1"], "changes": "what changed" }`,
    );

    try {
      const match = raw.match(/\{[\s\S]*\}/);
      const parsed = match ? JSON.parse(match[0]) : {};
      return {
        text: parsed.text ?? content,
        hashtags: parsed.hashtags ?? [],
        platform,
        metadata: { changes: parsed.changes },
      };
    } catch {
      return { text: content, hashtags: [] };
    }
  }
}

export const aiService = new AIService();
