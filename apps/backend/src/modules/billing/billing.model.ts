import mongoose, { Document, Schema } from 'mongoose';
import { SUBSCRIPTION_STATUS, SubscriptionStatus } from '../../config/constants';

export interface ISubscription extends Document {
  user: mongoose.Types.ObjectId;
  business: mongoose.Types.ObjectId;
  plan: string;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  postCredits: number;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    business: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    plan: { type: String, required: true, default: 'free' },
    status: {
      type: String,
      enum: Object.values(SUBSCRIPTION_STATUS),
      default: SUBSCRIPTION_STATUS.ACTIVE,
    },
    stripeCustomerId: { type: String, select: false },
    stripeSubscriptionId: { type: String, select: false },
    stripePriceId: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: { type: Boolean, default: false },
    postCredits: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        delete ret.stripeCustomerId;
        delete ret.stripeSubscriptionId;
        return ret;
      },
    },
  },
);

subscriptionSchema.index({ user: 1, business: 1 }, { unique: true });

export const SubscriptionModel = mongoose.model<ISubscription>('Subscription', subscriptionSchema);
