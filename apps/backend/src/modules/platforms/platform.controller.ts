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
  Querystring: { code?: string; state?: string; error?: string; error_description?: string };
}

interface ConnectUrlQuery extends RouteGenericInterface {
  Querystring: { platform: string; businessId: string; returnUrl: string };
}

export const platformController: FastifyPluginAsync = async (fastify) => {
  // GET /platforms/connect-url?platform=X&businessId=Y&returnUrl=Z
  // Authenticated — returns the OAuth URL the mobile app should open in a browser
  fastify.get<ConnectUrlQuery>(
    '/connect-url',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { platform, businessId, returnUrl } = z.object({
        platform: z.enum(PLATFORMS),
        businessId: z.string().min(1),
        returnUrl: z.string().min(1),
      }).parse(request.query);

      const url = platformService.getOAuthUrl(platform, businessId, returnUrl);
      return reply.send(success({ url }, 'OAuth URL generated'));
    },
  );

  // GET /platforms/oauth/:platform/callback — Facebook/etc redirect here after user auth
  // No auth required — browser session, no JWT available
  fastify.get<OAuthCallbackParams>(
    '/oauth/:platform/callback',
    async (request, reply) => {
      const { code, state, error } = request.query;

      // Decode state to get returnUrl for redirecting back to the app
      let returnUrl = 'aimarketing://platforms/connected';
      try {
        if (state) {
          const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8')) as {
            returnUrl?: string;
          };
          if (decoded.returnUrl) returnUrl = decoded.returnUrl;
        }
      } catch {
        // keep default returnUrl
      }

      if (error || !code || !state) {
        const msg = error ?? 'Authorization cancelled';
        return reply.redirect(
          `${returnUrl}?success=false&error=${encodeURIComponent(msg)}`,
        );
      }

      try {
        const platform = z.enum(PLATFORMS).parse(request.params.platform);
        const { connection } = await platformService.handleCallback(platform, code, state);

        const params = new URLSearchParams({
          success: 'true',
          platform,
          username: connection.platformUsername ?? '',
        });
        return reply.redirect(`${returnUrl}?${params.toString()}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Connection failed';
        return reply.redirect(
          `${returnUrl}?success=false&error=${encodeURIComponent(msg)}`,
        );
      }
    },
  );

  // GET /platforms — list connected platforms for a business
  fastify.get(
    '/',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { businessId } = z.object({ businessId: z.string().min(1) }).parse(request.query);
      const connections = await platformService.getConnections(businessId);
      return reply.send(success(connections, 'Platform connections retrieved'));
    },
  );

  // DELETE /platforms/:platform — disconnect a platform
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
