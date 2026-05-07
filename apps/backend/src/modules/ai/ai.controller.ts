import path from 'path';
import fs from 'fs';
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { aiService } from './ai.service';
import { businessService } from '../businesses/business.service';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { success } from '../../shared/utils/response.util';
import { PLATFORMS, TONE, INDUSTRY_LIST } from '../../config/constants';
import { getServerOrigin } from '../../shared/utils/url.util';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const generatePostSchema = z.object({
  businessId: z.string().min(1),
  prompt: z.string().min(1).max(1000),
  platform: z.enum(PLATFORMS),
  tone: z.enum([TONE.PROFESSIONAL, TONE.CASUAL, TONE.HUMOROUS, TONE.INSPIRATIONAL, TONE.EDUCATIONAL, TONE.PROMOTIONAL]).optional(),
  maxLength: z.number().int().positive().optional(),
});

const generateHashtagsSchema = z.object({
  content: z.string().min(1).max(5000),
  industry: z.enum(INDUSTRY_LIST),
  count: z.number().int().min(1).max(30).optional(),
});

const generateImagePromptSchema = z.object({
  content: z.string().min(1).max(5000),
  style: z.string().optional(),
});

const generateImageSchema = z.object({
  prompt: z.string().min(1).max(1000),
});

const contentCalendarSchema = z.object({
  businessId: z.string().min(1),
  days: z.number().int().min(1).max(30),
  platforms: z.array(z.enum(PLATFORMS)).min(1),
  tone: z.enum([TONE.PROFESSIONAL, TONE.CASUAL, TONE.HUMOROUS, TONE.INSPIRATIONAL, TONE.EDUCATIONAL, TONE.PROMOTIONAL]).optional(),
});

const improvePostSchema = z.object({
  content: z.string().min(1).max(5000),
  feedback: z.string().min(1).max(1000),
  platform: z.enum(PLATFORMS).optional(),
});

const analyzeSentimentSchema = z.object({
  content: z.string().min(1).max(5000),
});

export const aiController: FastifyPluginAsync = async (fastify) => {
  // POST /ai/generate-post
  fastify.post(
    '/generate-post',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const dto = generatePostSchema.parse(request.body);
      const business = await businessService.findByIdAndOwner(dto.businessId, request.authUser!.id);
      if (!business) {
        return reply.status(404).send({ success: false, message: 'Business not found', statusCode: 404 });
      }

      const result = await aiService.generatePost(
        { name: business.name, industry: business.industry, targetAudience: business.targetAudience },
        dto.prompt,
        dto.platform,
        dto.tone ?? business.tone,
        dto.maxLength,
      );

      return reply.send(success(result, 'Post generated successfully'));
    },
  );

  // POST /ai/generate-hashtags
  fastify.post(
    '/generate-hashtags',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const dto = generateHashtagsSchema.parse(request.body);
      const hashtags = await aiService.generateHashtags(dto.content, dto.industry, dto.count);
      return reply.send(success({ hashtags }, 'Hashtags generated'));
    },
  );

  // POST /ai/generate-image-prompt
  fastify.post(
    '/generate-image-prompt',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const dto = generateImagePromptSchema.parse(request.body);
      const imagePrompt = await aiService.generateImagePrompt(dto.content, dto.style);
      return reply.send(success({ imagePrompt }, 'Image prompt generated'));
    },
  );

  // POST /ai/generate-image
  fastify.post(
    '/generate-image',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const dto = generateImageSchema.parse(request.body);
      const result = await aiService.generateImage(dto.prompt);

      let imageUrl: string;
      if (result.kind === 'url') {
        // Pollinations or other external URL — use directly
        imageUrl = result.url;
      } else {
        // Buffer from HF or DALL-E — save to disk
        const filename = `ai-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        fs.writeFileSync(path.join(UPLOADS_DIR, filename), result.buffer);
        imageUrl = `${getServerOrigin(request)}/uploads/${filename}`;
      }

      return reply.send(success({ imageUrl }, 'Image generated successfully'));
    },
  );

  // POST /ai/content-calendar
  fastify.post(
    '/content-calendar',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const dto = contentCalendarSchema.parse(request.body);
      const business = await businessService.findByIdAndOwner(dto.businessId, request.authUser!.id);
      if (!business) {
        return reply.status(404).send({ success: false, message: 'Business not found', statusCode: 404 });
      }

      const calendar = await aiService.generateContentCalendar(
        {
          name: business.name,
          industry: business.industry,
          targetAudience: business.targetAudience,
          tone: dto.tone ?? business.tone,
        },
        dto.days,
        dto.platforms,
      );

      return reply.send(success({ calendar }, 'Content calendar generated'));
    },
  );

  // POST /ai/improve-post
  fastify.post(
    '/improve-post',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const dto = improvePostSchema.parse(request.body);
      const result = await aiService.improvePost(dto.content, dto.feedback, dto.platform);
      return reply.send(success(result, 'Post improved'));
    },
  );

  // POST /ai/analyze-sentiment
  fastify.post(
    '/analyze-sentiment',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const dto = analyzeSentimentSchema.parse(request.body);
      const result = await aiService.analyzeSentiment(dto.content);
      return reply.send(success(result, 'Sentiment analyzed'));
    },
  );
};
