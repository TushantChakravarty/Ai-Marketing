import { UserModel, IUser } from './user.model';
import { UpdateProfileDto, ChangePasswordDto } from './user.types';
import { hashPassword, comparePassword } from '../../shared/utils/crypto.util';

export class UserService {
  async findById(id: string): Promise<IUser | null> {
    return UserModel.findById(id).exec();
  }

  async findByEmail(email: string, includePassword = false): Promise<IUser | null> {
    const query = UserModel.findOne({ email: email.toLowerCase() });
    if (includePassword) {
      query.select('+password');
    }
    return query.exec();
  }

  async findByEmailVerificationToken(token: string): Promise<IUser | null> {
    return UserModel.findOne({
      emailVerificationToken: token,
      emailVerificationExpiry: { $gt: new Date() },
    })
      .select('+emailVerificationToken +emailVerificationExpiry')
      .exec();
  }

  async findByPasswordResetToken(token: string): Promise<IUser | null> {
    return UserModel.findOne({
      passwordResetToken: token,
      passwordResetExpiry: { $gt: new Date() },
    })
      .select('+passwordResetToken +passwordResetExpiry')
      .exec();
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true, runValidators: true },
    ).exec();
  }

  async changePassword(id: string, dto: ChangePasswordDto): Promise<void> {
    const user = await UserModel.findById(id).select('+password').exec();
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await comparePassword(dto.currentPassword, user.password);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    user.password = await hashPassword(dto.newPassword);
    await user.save();
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, {
      $set: {
        password: hashedPassword,
        passwordResetToken: undefined,
        passwordResetExpiry: undefined,
      },
    }).exec();
  }

  async setEmailVerificationToken(id: string, token: string, expiry: Date): Promise<void> {
    await UserModel.findByIdAndUpdate(id, {
      $set: { emailVerificationToken: token, emailVerificationExpiry: expiry },
    }).exec();
  }

  async verifyEmail(id: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, {
      $set: {
        isEmailVerified: true,
        emailVerificationToken: undefined,
        emailVerificationExpiry: undefined,
      },
    }).exec();
  }

  async setPasswordResetToken(id: string, token: string, expiry: Date): Promise<void> {
    await UserModel.findByIdAndUpdate(id, {
      $set: { passwordResetToken: token, passwordResetExpiry: expiry },
    }).exec();
  }

  async deleteAccount(id: string): Promise<void> {
    await UserModel.findByIdAndDelete(id).exec();
  }

  async getAllUsers(page: number, limit: number): Promise<{ users: IUser[]; total: number }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      UserModel.find().skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      UserModel.countDocuments(),
    ]);
    return { users, total };
  }
}

export const userService = new UserService();
