import { FastifyPluginAsync, FastifyRequest, FastifyReply, RouteGenericInterface } from 'fastify';
import { z } from 'zod';
import { businessService } from './business.service';
import { platformService } from '../platforms/platform.service';
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
      console.log('Received request to create business with body:', request.body);
      const dto = createBusinessSchema.parse(request.body);
      const business = await businessService.create(request.authUser!.id, dto);
      console.log('Created business:', business);
      return reply.status(201).send(created(business, 'Business created'));
    },
  );

  // GET /businesses/me
  fastify.get(
    '/me',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const businesses = await businessService.findByOwner(request.authUser!.id);
      return reply.send(success(businesses, 'Businesses retrieved'));
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

  // GET /businesses/:id/platforms
  fastify.get<IdParams>(
    '/:id/platforms',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const business = await businessService.findByIdAndOwner(request.params.id, request.authUser!.id);
      if (!business) {
        return reply.status(404).send({ success: false, message: 'Business not found', statusCode: 404 });
      }
      const connections = await platformService.getConnections(request.params.id);
      const safe = connections.map(c => ({
        id: String(c._id ?? c.id),
        platform: c.platform,
        accountName: c.platformUsername,
        accountId: c.platformUserId,
        isActive: c.isActive,
        expiresAt: c.tokenExpiry?.toISOString(),
        connectedAt: c.connectedAt ? new Date(c.connectedAt).toISOString() : new Date().toISOString(),
      }));
      return reply.send(success(safe, 'Platforms retrieved'));
    },
  );

  // DELETE /businesses/:id/platforms/:platform
  fastify.delete<IdPlatformParams>(
    '/:id/platforms/:platform',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const platform = z.enum(PLATFORMS).parse(request.params.platform);
      const business = await businessService.findByIdAndOwner(request.params.id, request.authUser!.id);
      if (!business) {
        return reply.status(404).send({ success: false, message: 'Business not found', statusCode: 404 });
      }
      await platformService.disconnectPlatform(request.params.id, platform);
      return reply.send(success(null, 'Platform disconnected'));
    },
  );
};
