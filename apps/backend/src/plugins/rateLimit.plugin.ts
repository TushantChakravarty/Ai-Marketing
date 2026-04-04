import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';
import Redis from 'ioredis';
import { env } from '../config/env.config';

async function rateLimitPlugin(fastify: FastifyInstance): Promise<void> {
  let redis: Redis | undefined;

  try {
    redis = new Redis(env.REDIS_URL, { lazyConnect: true, connectTimeout: 3000 });
    await redis.connect();
    fastify.log.info('Redis connected for rate limiting');
  } catch (err) {
    fastify.log.warn('Redis unavailable for rate limiting, using in-memory store');
    redis = undefined;
  }

  await fastify.register(fastifyRateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    redis: redis as Redis | undefined,
    keyGenerator: (request) => {
      return request.authUser?.id ?? request.ip;
    },
    errorResponseBuilder: (_request, context) => ({
      success: false,
      message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)}s`,
      statusCode: 429,
      timestamp: new Date().toISOString(),
    }),
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
  });

  if (redis) {
    fastify.addHook('onClose', async () => {
      await redis!.quit();
    });
  }
}

export default fp(rateLimitPlugin, { name: 'rateLimit' });
