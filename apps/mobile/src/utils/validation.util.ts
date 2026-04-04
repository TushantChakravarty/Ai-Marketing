import { z } from 'zod';

// ─── Auth Schemas ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name is too long'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name is too long'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and a number',
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ─── Business Schemas ─────────────────────────────────────────────────────────

export const businessInfoSchema = z.object({
  name: z
    .string()
    .min(1, 'Business name is required')
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name is too long'),
  description: z
    .string()
    .min(1, 'Description is required')
    .min(20, 'Description must be at least 20 characters')
    .max(500, 'Description must be under 500 characters'),
  industry: z.string().min(1, 'Please select an industry'),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

export type BusinessInfoFormData = z.infer<typeof businessInfoSchema>;

export const audienceSchema = z.object({
  targetAudience: z
    .string()
    .min(1, 'Target audience is required')
    .min(10, 'Please describe your target audience in more detail')
    .max(300, 'Keep it under 300 characters'),
  tone: z.string().min(1, 'Please select a tone'),
});

export type AudienceFormData = z.infer<typeof audienceSchema>;

// ─── Post Schemas ─────────────────────────────────────────────────────────────

export const createPostSchema = z.object({
  content: z
    .string()
    .min(1, 'Post content is required')
    .min(5, 'Post must be at least 5 characters'),
  hashtags: z.array(z.string()).optional(),
  platforms: z
    .array(z.string())
    .min(1, 'Please select at least one platform'),
  scheduledAt: z.string().optional(),
});

export type CreatePostFormData = z.infer<typeof createPostSchema>;

export const aiGenerateSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Please describe what you want to post about')
    .min(10, 'Give a bit more detail for better results')
    .max(500, 'Keep your prompt under 500 characters'),
  tone: z.string().min(1, 'Please select a tone'),
  platforms: z
    .array(z.string())
    .min(1, 'Please select at least one platform'),
});

export type AiGenerateFormData = z.infer<typeof aiGenerateSchema>;
