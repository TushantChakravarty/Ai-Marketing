import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3001').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  BACKEND_URL: z.string().default('http://localhost:3001'),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  REDIS_URL: z.string().default('redis://localhost:6379'),

  STRIPE_SECRET_KEY: z.string().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().default(''),
  STRIPE_STARTER_PRICE_ID: z.string().default(''),
  STRIPE_PRO_PRICE_ID: z.string().default(''),
  STRIPE_ENTERPRISE_PRICE_ID: z.string().default(''),

  OPENAI_API_KEY: z.string().default(''),
  ANTHROPIC_API_KEY: z.string().default(''),
  GROQ_API_KEY: z.string().default(''),
  HF_TOKEN: z.string().default(''),  // Hugging Face token — free at huggingface.co

  SENDGRID_API_KEY: z.string().default(''),
  EMAIL_FROM: z.string().default('noreply@aimarketing.app'),

  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.string().default('587').transform(Number),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),

  TWITTER_CLIENT_ID: z.string().default(''),
  TWITTER_CLIENT_SECRET: z.string().default(''),

  FACEBOOK_APP_ID: z.string().default(''),
  FACEBOOK_APP_SECRET: z.string().default(''),

  // Meta (Facebook) — accepted as META_* or FACEBOOK_* (META_* takes precedence)
  META_APP_ID: z.string().default(''),
  META_APP_SECRET: z.string().default(''),
  META_ACCESS_TOKEN: z.string().default(''),
  META_AD_ACCOUNT_ID: z.string().default(''),  // e.g. 123456789 (without act_ prefix)
  META_PAGE_ID: z.string().default(''),        // Facebook Page ID linked to the ad account

  INSTAGRAM_APP_ID: z.string().default(''),
  INSTAGRAM_APP_SECRET: z.string().default(''),

  LINKEDIN_CLIENT_ID: z.string().default(''),
  LINKEDIN_CLIENT_SECRET: z.string().default(''),
});

const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success) {
  console.error('Invalid environment variables:');
  console.error(_parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = _parsed.data;
export type Env = z.infer<typeof envSchema>;
