import { FastifyPluginAsync, FastifyRequest, FastifyReply, RouteGenericInterface } from 'fastify';
import { z } from 'zod';
import { businessService } from './business.service';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { success, created, noContent } from '../../shared/utils/response.util';
import { PLATFORMS, MARKETING_MODE, TONE, INDUSTRY_LIST } from '../../config/constants';

const createBusinessSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  industry: z.enum(INDUSTRY_LIST),
  website: z.preprocess(v => (v === '' ? undefined : v), z.string().url().optional()),
  logo: z.preprocess(v => (v === '' ? undefined : v), z.string().url().optional()),
  socialHandles: z
    .object({
      twitter: z.string().optional(),
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      linkedin: z.string().optional(),
    })
    .optional(),
  marketingMode: z.enum([MARKETING_MODE.MANUAL, MARKETING_MODE.AI, MARKETING_MODE.HYBRID]).optional(),
  targetAudience: z.string().max(300).optional(),
  tone: z.enum([TONE.PROFESSIONAL, TONE.CASUAL, TONE.HUMOROUS, TONE.INSPIRATIONAL, TONE.EDUCATIONAL, TONE.PROMOTIONAL]).optional(),
});

const updateBusinessSchema = createBusinessSchema.partial().extend({
  isActive: z.boolean().optional(),
});

const connectPlatformSchema = z.object({
  platform: z.enum(PLATFORMS),
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  tokenExpiry: z.string().datetime().optional(),
  platformUserId: z.string().min(1),
  platformUsername: z.string().min(1),
});

interface IdParams extends RouteGenericInterface {
  Params: { id: string };
}

interface IdPlatformParams extends RouteGenericInterface {
  Params: { id: string; platform: string };
}

export const businessController: FastifyPluginAsync = async (fastify) => {
  // GET /businesses
  fastify.get(
    '/',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const businesses = await businessService.findByOwner(request.authUser!.id);
      return reply.send(success(businesses, 'Businesses retrieved'));
    },
  );

  // POST /businesses
  fastify.post(
    '/',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const dto = createBusinessSchema.parse(request.body);
      const business = await businessService.create(request.authUser!.id, dto);
      return reply.status(201).send(created(business, 'Business created'));
    },
  );

  // GET /businesses/:id
  fastify.get<IdParams>(
    '/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const business = await businessService.findByIdAndOwner(
        request.params.id,
        request.authUser!.id,
      );
      if (!business) {
        return reply.status(404).send({ success: false, message: 'Business not found', statusCode: 404 });
      }
      return reply.send(success(business, 'Business retrieved'));
    },
  );

  // PATCH /businesses/:id
  fastify.patch<IdParams>(
    '/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const dto = updateBusinessSchema.parse(request.body);
      const business = await businessService.update(request.params.id, request.authUser!.id, dto);
      if (!business) {
        return reply.status(404).send({ success: false, message: 'Business not found', statusCode: 404 });
      }
      return reply.send(success(business, 'Business updated'));
    },
  );

  // DELETE /businesses/:id
  fastify.delete<IdParams>(
    '/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      await businessService.delete(request.params.id, request.authUser!.id);
      return reply.send(noContent('Business deleted'));
    },
  );

  // POST /businesses/:id/platforms/connect
  fastify.post<IdParams>(
    '/:id/platforms/connect',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const dto = connectPlatformSchema.parse(request.body);
      const business = await businessService.connectPlatform(
        request.params.id,
        request.authUser!.id,
        {
          ...dto,
          tokenExpiry: dto.tokenExpiry ? new Date(dto.tokenExpiry) : undefined,
        },
      );
      if (!business) {
        return reply.status(404).send({ success: false, message: 'Business not found', statusCode: 404 });
      }
      return reply.send(success(business, 'Platform connected'));
    },
  );

  // DELETE /businesses/:id/platforms/:platform
  fastify.delete<IdPlatformParams>(
    '/:id/platforms/:platform',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const platform = z.enum(PLATFORMS).parse(request.params.platform);
      const business = await businessService.disconnectPlatform(
        request.params.id,
        request.authUser!.id,
        platform,
      );
      if (!business) {
        return reply.status(404).send({ success: false, message: 'Business not found', statusCode: 404 });
      }
      return reply.send(success(business, 'Platform disconnected'));
    },
  );
};
