import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { env } from '../config/env.config';

async function swaggerPlugin(fastify: FastifyInstance): Promise<void> {
  await fastify.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'AI Marketing Automation API',
        description: 'Backend API for AI-powered social media marketing automation',
        version: '1.0.0',
        contact: {
          name: 'AI Marketing Support',
          email: 'support@aimarketing.app',
        },
      },
      servers: [
        {
          url: `http://localhost:${env.PORT}`,
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
      tags: [
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Users', description: 'User management' },
        { name: 'Businesses', description: 'Business management' },
        { name: 'Posts', description: 'Social media posts' },
        { name: 'AI', description: 'AI content generation' },
        { name: 'Platforms', description: 'Social platform connections' },
        { name: 'Billing', description: 'Subscription & billing' },
        { name: 'Analytics', description: 'Performance analytics' },
      ],
    },
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      persistAuthorization: true,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });
}

export default fp(swaggerPlugin, { name: 'swagger' });
