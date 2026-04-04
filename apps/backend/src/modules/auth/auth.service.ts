import { FastifyInstance } from 'fastify';
import nodemailer from 'nodemailer';
import { UserModel } from '../users/user.model';
import { userService } from '../users/user.service';
import { RegisterDto, LoginDto, AuthTokens, AuthResponse } from './auth.types';
import { hashPassword } from '../../shared/utils/crypto.util';
import { generateToken, addHours } from '../../shared/utils/crypto.util';
import { env } from '../../config/env.config';
import {
  PASSWORD_RESET_EXPIRY_HOURS,
  EMAIL_VERIFY_EXPIRY_HOURS,
} from '../../config/constants';

function createTransport() {
  return nodemailer.createTransport({
    host: env.SMTP_HOST || 'smtp.ethereal.email',
    port: env.SMTP_PORT,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  try {
    const transport = createTransport();
    await transport.sendMail({ from: env.EMAIL_FROM, to, subject, html });
  } catch (err) {
    console.error('Failed to send email:', err);
  }
}

export class AuthService {
  constructor(private fastify: FastifyInstance) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await userService.findByEmail(dto.email);
    if (existing) {
      throw Object.assign(new Error('Email already in use'), { statusCode: 409 });
    }

    const verificationToken = generateToken();
    const verificationExpiry = addHours(new Date(), EMAIL_VERIFY_EXPIRY_HOURS);

    const user = await UserModel.create({
      email: dto.email,
      password: dto.password, // hashed by pre-save hook
      firstName: dto.firstName,
      lastName: dto.lastName,
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: verificationExpiry,
    });

    const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    await sendEmail(
      user.email,
      'Verify your email - AI Marketing',
      `<p>Hi ${user.firstName},</p>
       <p>Please verify your email by clicking the link below:</p>
       <a href="${verifyUrl}">Verify Email</a>
       <p>This link expires in ${EMAIL_VERIFY_EXPIRY_HOURS} hours.</p>`,
    );

    const tokens = this.generateTokens(user.id, user.email, user.role);
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await userService.findByEmail(dto.email, true);
    if (!user) {
      throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
    }

    const isValid = await user.comparePassword(dto.password);
    if (!isValid) {
      throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
    }

    const tokens = this.generateTokens(user.id, user.email, user.role);
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      tokens,
    };
  }

  async refreshToken(token: string): Promise<AuthTokens> {
    let payload;
    try {
      payload = this.fastify.verifyRefreshToken(token);
    } catch {
      throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 });
    }

    if (payload.type !== 'refresh') {
      throw Object.assign(new Error('Invalid token type'), { statusCode: 401 });
    }

    const user = await userService.findById(payload.sub);
    if (!user) {
      throw Object.assign(new Error('User not found'), { statusCode: 401 });
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await userService.findByEmail(email);
    if (!user) return; // silently ignore to prevent enumeration

    const resetToken = generateToken();
    const resetExpiry = addHours(new Date(), PASSWORD_RESET_EXPIRY_HOURS);

    await userService.setPasswordResetToken(user.id, resetToken, resetExpiry);

    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendEmail(
      user.email,
      'Reset your password - AI Marketing',
      `<p>Hi ${user.firstName},</p>
       <p>You requested a password reset. Click the link below to reset it:</p>
       <a href="${resetUrl}">Reset Password</a>
       <p>This link expires in ${PASSWORD_RESET_EXPIRY_HOURS} hours. If you didn't request this, ignore this email.</p>`,
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await userService.findByPasswordResetToken(token);
    if (!user) {
      throw Object.assign(new Error('Invalid or expired reset token'), { statusCode: 400 });
    }

    const hashed = await hashPassword(newPassword);
    await userService.updatePassword(user.id, hashed);
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await userService.findByEmailVerificationToken(token);
    if (!user) {
      throw Object.assign(new Error('Invalid or expired verification token'), { statusCode: 400 });
    }

    await userService.verifyEmail(user.id);
  }

  private generateTokens(userId: string, email: string, role: string): AuthTokens {
    const payload = { sub: userId, email, role: role as 'user' | 'admin' };
    const accessToken = this.fastify.signAccessToken(payload);
    const refreshToken = this.fastify.signRefreshToken(payload);
    return { accessToken, refreshToken, expiresIn: 900 }; // 15 min in seconds
  }
}
