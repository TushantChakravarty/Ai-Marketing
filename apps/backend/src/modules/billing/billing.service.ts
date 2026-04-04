import Stripe from 'stripe';
import { SubscriptionModel, ISubscription } from './billing.model';
import { CreateCheckoutDto, PurchaseCreditsDto } from './billing.types';
import { PLANS, SUBSCRIPTION_STATUS } from '../../config/constants';
import { env } from '../../config/env.config';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' });

const CREDIT_PRICE_CENTS = 100; // $1 per credit
const CREDITS_PER_UNIT = 10;

export class BillingService {
  async getOrCreateCustomer(userId: string, email: string): Promise<string> {
    const existing = await SubscriptionModel.findOne({ user: userId })
      .select('+stripeCustomerId')
      .exec();

    if (existing?.stripeCustomerId) return existing.stripeCustomerId;

    const customer = await stripe.customers.create({
      email,
      metadata: { userId },
    });

    return customer.id;
  }

  async createCheckoutSession(
    userId: string,
    userEmail: string,
    dto: CreateCheckoutDto,
  ): Promise<{ url: string }> {
    const plan = Object.values(PLANS).find((p) => p.id === dto.planId);
    if (!plan) throw Object.assign(new Error('Invalid plan'), { statusCode: 400 });
    if (!plan.priceId) throw Object.assign(new Error('Plan not available for purchase'), { statusCode: 400 });

    const customerId = await this.getOrCreateCustomer(userId, userEmail);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: dto.successUrl ?? `${env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: dto.cancelUrl ?? `${env.FRONTEND_URL}/billing/cancel`,
      metadata: { userId, businessId: dto.businessId, planId: dto.planId },
    });

    return { url: session.url! };
  }

  async createPortalSession(userId: string): Promise<{ url: string }> {
    const subscription = await SubscriptionModel.findOne({ user: userId })
      .select('+stripeCustomerId')
      .exec();

    if (!subscription?.stripeCustomerId) {
      throw Object.assign(new Error('No billing account found'), { statusCode: 404 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${env.FRONTEND_URL}/billing`,
    });

    return { url: session.url };
  }

  async getSubscription(userId: string, businessId: string): Promise<ISubscription | null> {
    return SubscriptionModel.findOne({ user: userId, business: businessId }).exec();
  }

  async cancelSubscription(userId: string, businessId: string): Promise<ISubscription | null> {
    const subscription = await SubscriptionModel.findOne({ user: userId, business: businessId })
      .select('+stripeSubscriptionId')
      .exec();

    if (!subscription) throw Object.assign(new Error('Subscription not found'), { statusCode: 404 });

    if (subscription.stripeSubscriptionId) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    return SubscriptionModel.findByIdAndUpdate(
      subscription.id,
      { $set: { cancelAtPeriodEnd: true } },
      { new: true },
    ).exec();
  }

  async purchasePostCredits(
    userId: string,
    userEmail: string,
    dto: PurchaseCreditsDto,
  ): Promise<{ url: string }> {
    const customerId = await this.getOrCreateCustomer(userId, userEmail);
    const amount = Math.ceil(dto.credits / CREDITS_PER_UNIT) * CREDIT_PRICE_CENTS;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: `${dto.credits} Post Credits` },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${env.FRONTEND_URL}/billing/credits/success`,
      cancel_url: `${env.FRONTEND_URL}/billing`,
      metadata: { userId, businessId: dto.businessId, credits: dto.credits.toString(), type: 'credits' },
    });

    return { url: session.url! };
  }

  async handleWebhook(payload: string | Buffer, signature: string): Promise<void> {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      throw Object.assign(new Error('Webhook signature verification failed'), { statusCode: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutComplete(session);
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionUpdated(sub);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionDeleted(sub);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.handlePaymentFailed(invoice);
        break;
      }
    }
  }

  private async handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
    const { userId, businessId, planId, credits, type } = session.metadata ?? {};
    if (!userId || !businessId) return;

    if (type === 'credits' && credits) {
      await SubscriptionModel.findOneAndUpdate(
        { user: userId, business: businessId },
        { $inc: { postCredits: parseInt(credits, 10) } },
        { upsert: true },
      ).exec();
      return;
    }

    if (session.subscription && planId) {
      const stripeSub = await stripe.subscriptions.retrieve(session.subscription as string);
      await SubscriptionModel.findOneAndUpdate(
        { user: userId, business: businessId },
        {
          $set: {
            plan: planId,
            status: SUBSCRIPTION_STATUS.ACTIVE,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            stripePriceId: stripeSub.items.data[0]?.price.id,
            currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            cancelAtPeriodEnd: false,
          },
        },
        { upsert: true },
      ).exec();
    }
  }

  private async handleSubscriptionUpdated(sub: Stripe.Subscription): Promise<void> {
    const status = sub.status === 'active'
      ? SUBSCRIPTION_STATUS.ACTIVE
      : sub.status === 'past_due'
      ? SUBSCRIPTION_STATUS.PAST_DUE
      : sub.status === 'trialing'
      ? SUBSCRIPTION_STATUS.TRIALING
      : SUBSCRIPTION_STATUS.CANCELLED;

    await SubscriptionModel.findOneAndUpdate(
      { stripeSubscriptionId: sub.id },
      {
        $set: {
          status,
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
      },
    ).exec();
  }

  private async handleSubscriptionDeleted(sub: Stripe.Subscription): Promise<void> {
    await SubscriptionModel.findOneAndUpdate(
      { stripeSubscriptionId: sub.id },
      { $set: { status: SUBSCRIPTION_STATUS.CANCELLED, plan: 'free' } },
    ).exec();
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    if (invoice.subscription) {
      await SubscriptionModel.findOneAndUpdate(
        { stripeSubscriptionId: invoice.subscription as string },
        { $set: { status: SUBSCRIPTION_STATUS.PAST_DUE } },
      ).exec();
    }
  }
}

export const billingService = new BillingService();
