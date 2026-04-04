import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import { env } from '../config/env.config';

async function corsPlugin(fastify: FastifyInstance): Promise<void> {
  const allowedOrigins = [
    env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5173',
  ];

  await fastify.register(fastifyCors, {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400,
  });
}

export default fp(corsPlugin, { name: 'cors' });
