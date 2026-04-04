import { UserRole } from '../../config/constants';

export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  role: UserRole;
  subscription?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface UserPublic {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isEmailVerified: boolean;
  role: UserRole;
  createdAt: Date;
}
