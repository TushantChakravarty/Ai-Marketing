import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { env } from '../config/env.config';
import { JWTPayload } from '../shared/types';

async function jwtPlugin(fastify: FastifyInstance): Promise<void> {
  await fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  });

  // Decorate with helpers
  fastify.decorate(
    'signAccessToken',
    function (payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>): string {
      return fastify.jwt.sign({ ...payload, type: 'access' }, { expiresIn: env.JWT_EXPIRES_IN });
    },
  );

  fastify.decorate(
    'signRefreshToken',
    function (payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>): string {
      return fastify.jwt.sign(
        { ...payload, type: 'refresh' },
        { secret: env.JWT_REFRESH_SECRET, expiresIn: env.JWT_REFRESH_EXPIRES_IN },
      );
    },
  );

  fastify.decorate(
    'verifyRefreshToken',
    function (token: string): JWTPayload {
      return fastify.jwt.verify<JWTPayload>(token, { secret: env.JWT_REFRESH_SECRET });
    },
  );
}

export default fp(jwtPlugin, { name: 'jwt' });

declare module 'fastify' {
  interface FastifyInstance {
    signAccessToken(payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>): string;
    signRefreshToken(payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>): string;
    verifyRefreshToken(token: string): JWTPayload;
  }
}
