import bcrypt from 'bcryptjs';
import { randomBytes, createHmac } from 'crypto';
import { SALT_ROUNDS, OTP_LENGTH } from '../../config/constants';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(length = 32): string {
  return randomBytes(length).toString('hex');
}

export function generateOTP(length = OTP_LENGTH): string {
  const digits = '0123456789';
  let otp = '';
  const bytes = randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[bytes[i] % 10];
  }
  return otp;
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function hashWithHmac(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('hex');
}

export function generateUniqueId(): string {
  return randomBytes(16).toString('hex');
}

export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}
