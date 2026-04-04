import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env.config';
import { Platform, Tone } from '../../config/constants';
import {
  AIGeneratedContent,
  ContentCalendarEntry,
  SentimentResult,
} from './ai.types';

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
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
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

Respond with a JSON object: { "text": "...", "hashtags": ["..."], "imagePrompt": "..." }
- text: the post content (within character limit)
- hashtags: array of relevant hashtags without the # symbol
- imagePrompt: a DALL-E/image generation prompt for a matching visual`;

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Create a ${platform} post about: ${prompt}`,
        },
      ],
      system: systemPrompt,
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '{}';

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
    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Generate ${count} relevant, trending hashtags for this ${industry} industry post. Return only a JSON array of strings without the # symbol.

Post content: "${content}"`,
        },
      ],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '[]';
    try {
      const match = raw.match(/\[[\s\S]*\]/);
      return match ? JSON.parse(match[0]) : [];
    } catch {
      return [];
    }
  }

  async generateImagePrompt(content: string, style = 'modern, professional'): Promise<string> {
    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Create a concise, vivid image generation prompt for this social media post. Style: ${style}.

Post: "${content}"

Respond with just the image prompt, no explanation.`,
        },
      ],
    });

    return response.content[0].type === 'text' ? response.content[0].text.trim() : '';
  }

  async generateContentCalendar(
    businessContext: { name: string; industry: string; targetAudience?: string; tone?: Tone },
    days: number,
    platforms: Platform[],
  ): Promise<ContentCalendarEntry[]> {
    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `Create a ${days}-day social media content calendar for:
Business: ${businessContext.name} (${businessContext.industry})
Target Audience: ${businessContext.targetAudience ?? 'General audience'}
Tone: ${businessContext.tone ?? 'professional'}
Platforms: ${platforms.join(', ')}

Return a JSON array where each item has:
{
  "date": "YYYY-MM-DD",
  "platform": "platform_name",
  "content": {
    "text": "post content",
    "hashtags": ["tag1", "tag2"],
    "imagePrompt": "image generation prompt"
  },
  "suggestedTime": "HH:MM"
}

Generate varied, engaging content types (tips, questions, stories, promos).`,
        },
      ],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '[]';
    try {
      const match = raw.match(/\[[\s\S]*\]/);
      return match ? JSON.parse(match[0]) : [];
    } catch {
      return [];
    }
  }

  async analyzeSentiment(content: string): Promise<SentimentResult> {
    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Analyze the sentiment of this social media post. Respond with JSON:
{ "sentiment": "positive|neutral|negative", "score": 0.0-1.0, "explanation": "brief explanation" }

Post: "${content}"`,
        },
      ],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '{}';
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

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Improve this social media post based on the feedback provided.
${platformContext}

Original post: "${content}"
Feedback: "${feedback}"

Respond with JSON: { "text": "improved post", "hashtags": ["..."], "changes": "brief description of changes made" }`,
        },
      ],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '{}';
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
