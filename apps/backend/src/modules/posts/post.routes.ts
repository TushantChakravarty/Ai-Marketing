import { FastifyInstance } from 'fastify';
import { postController } from './post.controller';

export async function postRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.register(postController, { prefix: '/posts' });
}
