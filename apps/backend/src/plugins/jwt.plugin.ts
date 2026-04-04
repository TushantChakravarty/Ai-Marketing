import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.config';
import { JWTPayload } from '../shared/types';

async function jwtPlugin(fastify: FastifyInstance): Promise<void> {
  await fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  });

  // Decorate with helpers for access tokens
  fastify.decorate(
    'signAccessToken',
    function (payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>): string {
      return fastify.jwt.sign({ ...payload, type: 'access' }, { expiresIn: env.JWT_EXPIRES_IN });
    },
  );

  // Use jsonwebtoken directly for refresh tokens (different secret)
  fastify.decorate(
    'signRefreshToken',
    function (payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>): string {
      const options: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'] };
      return jwt.sign({ ...payload, type: 'refresh' }, env.JWT_REFRESH_SECRET, options);
    },
  );

  fastify.decorate(
    'verifyRefreshToken',
    function (token: string): JWTPayload {
      return jwt.verify(token, env.JWT_REFRESH_SECRET) as JWTPayload;
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
