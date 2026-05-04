import { FastifyPluginAsync, FastifyRequest, FastifyReply, RouteGenericInterface } from 'fastify';
import { z } from 'zod';
import { postService } from './post.service';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { success, created, noContent, paginated } from '../../shared/utils/response.util';
import { PLATFORMS, POST_MODE, POST_STATUS } from '../../config/constants';

const createPostSchema = z.object({
  businessId: z.string().min(1),
  text: z.string().min(1).max(5000),
  mediaUrls: z.array(z.string().url()).optional(),
  hashtags: z.array(z.string()).optional(),
  platforms: z.array(z.enum(PLATFORMS)).optional().default([]),
  mode: z.enum([POST_MODE.MANUAL, POST_MODE.AI]).optional(),
  aiPrompt: z.string().optional(),
});

const schedulePostSchema = z.object({
  scheduledAt: z.string().datetime(),
});

const updatePostSchema = z.object({
  text: z.string().min(1).max(5000).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  hashtags: z.array(z.string()).optional(),
  platforms: z.array(z.enum(PLATFORMS)).optional(),
  aiPrompt: z.string().optional(),
});

const listQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform((v) => (v ? Math.min(parseInt(v, 10), 100) : 20)),
  status: z.enum([POST_STATUS.DRAFT, POST_STATUS.SCHEDULED, POST_STATUS.PUBLISHED, POST_STATUS.FAILED]).optional(),
  businessId: z.string().min(1),
});

interface IdParams extends RouteGenericInterface {
  Params: { id: string };
}

export const postController: FastifyPluginAsync = async (fastify) => {
  // GET /posts?businessId=...
  fastify.get(
    '/',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = listQuerySchema.parse(request.query);
      const { posts, total } = await postService.getByBusiness(
        query.businessId,
        query.page,
        query.limit,
        query.status,
      );
      return reply.send(paginated(posts, total, query.page, query.limit, 'Posts retrieved'));
    },
  );

  // POST /posts
  fastify.post(
    '/',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const dto = createPostSchema.parse(request.body);
      const post = await postService.create(request.authUser!.id, dto);
      return reply.status(201).send(created(post, 'Post created'));
    },
  );

  // GET /posts/:id
  fastify.get<IdParams>(
    '/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const post = await postService.getById(request.params.id);
      if (!post) {
        return reply.status(404).send({ success: false, message: 'Post not found', statusCode: 404 });
      }
      return reply.send(success(post, 'Post retrieved'));
    },
  );

  // PATCH /posts/:id
  fastify.patch<IdParams>(
    '/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const dto = updatePostSchema.parse(request.body);
      const post = await postService.update(request.params.id, request.authUser!.id, dto);
      if (!post) {
        return reply.status(404).send({ success: false, message: 'Post not found or not editable', statusCode: 404 });
      }
      return reply.send(success(post, 'Post updated'));
    },
  );

  // DELETE /posts/:id
  fastify.delete<IdParams>(
    '/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      await postService.delete(request.params.id, request.authUser!.id);
      return reply.send(noContent('Post deleted'));
    },
  );

  // POST /posts/:id/publish
  fastify.post<IdParams>(
    '/:id/publish',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const post = await postService.publish(request.params.id, request.authUser!.id);
      if (!post) {
        return reply.status(404).send({ success: false, message: 'Post not found', statusCode: 404 });
      }
      return reply.send(success(post, 'Post published'));
    },
  );

  // POST /posts/:id/schedule
  fastify.post<IdParams>(
    '/:id/schedule',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const dto = schedulePostSchema.parse(request.body);
      const post = await postService.schedule(request.params.id, request.authUser!.id, dto);
      if (!post) {
        return reply.status(404).send({ success: false, message: 'Post not found', statusCode: 404 });
      }
      return reply.send(success(post, 'Post scheduled'));
    },
  );

  // GET /posts/:id/analytics
  fastify.get<IdParams>(
    '/:id/analytics',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const data = await postService.getAnalytics(request.params.id);
      if (!data) {
        return reply.status(404).send({ success: false, message: 'Post not found', statusCode: 404 });
      }
      return reply.send(success(data, 'Post analytics retrieved'));
    },
  );
};
