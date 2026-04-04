import { FastifyPluginAsync, FastifyRequest, FastifyReply, RouteGenericInterface } from 'fastify';
import { z } from 'zod';
import { platformService } from './platform.service';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { success } from '../../shared/utils/response.util';
import { PLATFORMS } from '../../config/constants';

interface PlatformParams extends RouteGenericInterface {
  Params: { platform: string };
  Querystring: { businessId?: string };
}

interface OAuthCallbackParams extends RouteGenericInterface {
  Params: { platform: string };
  Querystring: { code?: string; state?: string };
}

export const platformController: FastifyPluginAsync = async (fastify) => {
  // GET /platforms/oauth/:platform - Initiate OAuth
  fastify.get<PlatformParams>(
    '/oauth/:platform',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const platform = z.enum(PLATFORMS).parse(request.params.platform);
      const { businessId } = z.object({ businessId: z.string().min(1) }).parse(request.query);
      const oauthUrl = platformService.getOAuthUrl(platform, businessId);
      return reply.redirect(oauthUrl);
    },
  );

  // GET /platforms/oauth/:platform/callback - OAuth callback
  fastify.get<OAuthCallbackParams>(
    '/oauth/:platform/callback',
    async (request, reply) => {
      const platform = z.enum(PLATFORMS).parse(request.params.platform);
      const { code, state } = z
        .object({ code: z.string(), state: z.string() })
        .parse(request.query);

      const connection = await platformService.handleCallback(platform, code, state);
      return reply.redirect(
        `${process.env.FRONTEND_URL}/platforms/connected?platform=${platform}&username=${connection.platformUsername}`,
      );
    },
  );

  // GET /platforms - List connected platforms for a business
  fastify.get(
    '/',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { businessId } = z.object({ businessId: z.string().min(1) }).parse(request.query);
      const connections = await platformService.getConnections(businessId);
      return reply.send(success(connections, 'Platform connections retrieved'));
    },
  );

  // DELETE /platforms/:platform - Disconnect a platform
  fastify.delete<PlatformParams>(
    '/:platform',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const platform = z.enum(PLATFORMS).parse(request.params.platform);
      const { businessId } = z.object({ businessId: z.string().min(1) }).parse(request.query);
      await platformService.disconnectPlatform(businessId, platform);
      return reply.send(success(null, 'Platform disconnected'));
    },
  );
};
