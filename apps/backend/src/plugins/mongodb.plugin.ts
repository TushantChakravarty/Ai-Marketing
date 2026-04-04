import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';
import { env } from '../config/env.config';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

async function connectWithRetry(uri: string, attempt = 1): Promise<void> {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      console.warn(`MongoDB connection attempt ${attempt} failed. Retrying in ${RETRY_DELAY_MS}ms...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectWithRetry(uri, attempt + 1);
    }
    throw err;
  }
}

async function mongodbPlugin(fastify: FastifyInstance): Promise<void> {
  mongoose.connection.on('connected', () => {
    fastify.log.info('MongoDB connected');
  });

  mongoose.connection.on('disconnected', () => {
    fastify.log.warn('MongoDB disconnected');
  });

  mongoose.connection.on('error', (err) => {
    fastify.log.error({ err }, 'MongoDB connection error');
  });

  await connectWithRetry(env.MONGODB_URI);

  fastify.addHook('onClose', async () => {
    await mongoose.connection.close();
    fastify.log.info('MongoDB connection closed');
  });
}

export default fp(mongodbPlugin, { name: 'mongodb' });
