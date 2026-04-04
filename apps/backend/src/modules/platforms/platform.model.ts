import mongoose, { Document, Schema } from 'mongoose';
import { PLATFORMS, Platform } from '../../config/constants';

export interface IPlatformConnection extends Document {
  business: mongoose.Types.ObjectId;
  platform: Platform;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  platformUserId: string;
  platformUsername: string;
  isActive: boolean;
  connectedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const platformConnectionSchema = new Schema<IPlatformConnection>(
  {
    business: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    platform: { type: String, enum: PLATFORMS, required: true },
    accessToken: { type: String, required: true, select: false },
    refreshToken: { type: String, select: false },
    tokenExpiry: Date,
    platformUserId: { type: String, required: true },
    platformUsername: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    connectedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        delete ret.accessToken;
        delete ret.refreshToken;
        return ret;
      },
    },
  },
);

platformConnectionSchema.index({ business: 1, platform: 1 }, { unique: true });

export const PlatformConnectionModel = mongoose.model<IPlatformConnection>(
  'PlatformConnection',
  platformConnectionSchema,
);
