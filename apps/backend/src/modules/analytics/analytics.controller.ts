import { FastifyPluginAsync, FastifyRequest, FastifyReply, RouteGenericInterface } from 'fastify';
import { z } from 'zod';
import { analyticsService } from './analytics.service';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { success } from '../../shared/utils/response.util';
import { PLATFORMS } from '../../config/constants';

const dateRangeSchema = z.object({
  businessId: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

function parseDateRange(startDate?: string, endDate?: string) {
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate
    ? new Date(startDate)
    : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { start, end };
}

interface PlatformParams extends RouteGenericInterface {
  Params: { platform: string };
  Querystring: { businessId?: string; startDate?: string; endDate?: string };
}

export const analyticsController: FastifyPluginAsync = async (fastify) => {
  // GET /analytics/dashboard
  fastify.get(
    '/dashboard',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = dateRangeSchema.parse(request.query);
      const { start, end } = parseDateRange(query.startDate, query.endDate);
      const summary = await analyticsService.getDashboardSummary(query.businessId, start, end);
      return reply.send(success(summary, 'Dashboard analytics retrieved'));
    },
  );

  // GET /analytics/platforms/:platform
  fastify.get<PlatformParams>(
    '/platforms/:platform',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const platform = z.enum(PLATFORMS).parse(request.params.platform);
      const query = dateRangeSchema.parse(request.query);
      const { start, end } = parseDateRange(query.startDate, query.endDate);
      const data = await analyticsService.getPlatformAnalytics(
        query.businessId,
        platform,
        start,
        end,
      );
      return reply.send(success(data, 'Platform analytics retrieved'));
    },
  );

  // GET /analytics/posts/top
  fastify.get(
    '/posts/top',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = z
        .object({
          businessId: z.string().min(1),
          limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 10)),
        })
        .parse(request.query);
      const posts = await analyticsService.getTopPosts(query.businessId, query.limit);
      return reply.send(success(posts, 'Top posts retrieved'));
    },
  );

  // GET /analytics/trends
  fastify.get(
    '/trends',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = dateRangeSchema.parse(request.query);
      const { start, end } = parseDateRange(query.startDate, query.endDate);
      const trends = await analyticsService.getEngagementTrends(query.businessId, start, end);
      return reply.send(success(trends, 'Engagement trends retrieved'));
    },
  );

  // POST /analytics/sync
  fastify.post(
    '/sync',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { businessId } = z
        .object({ businessId: z.string().min(1) })
        .parse(request.body);
      await analyticsService.syncPlatformAnalytics(businessId);
      return reply.send(success(null, 'Analytics sync initiated'));
    },
  );
};
