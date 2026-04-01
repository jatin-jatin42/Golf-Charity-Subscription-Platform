import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

// Prize pool contribution rate per subscription
const PRIZE_POOL_RATE = 0.5;   // 50% of subscription goes to prize pool
const CHARITY_MIN_RATE = 0.1;  // 10% minimum to charity

@Injectable()
export class SubscriptionsService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.stripe = new Stripe(config.get<string>('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16',
    });
  }

  /** Create Stripe Checkout Session */
  async createCheckout(userId: string, plan: 'MONTHLY' | 'YEARLY') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const priceId =
      plan === 'MONTHLY'
        ? this.config.get<string>('STRIPE_MONTHLY_PRICE_ID')
        : this.config.get<string>('STRIPE_YEARLY_PRICE_ID');

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId, plan },
      success_url: `${this.config.get('CLIENT_URL')}/dashboard?subscription=success`,
      cancel_url: `${this.config.get('CLIENT_URL')}/pricing?subscription=cancelled`,
    });

    return { url: session.url };
  }

  /** Handle Stripe Webhook Events */
  async handleWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.config.get<string>('STRIPE_WEBHOOK_SECRET'),
      );
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }

    return { received: true };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const { userId, plan } = session.metadata;
    const subscription = await this.stripe.subscriptions.retrieve(session.subscription as string);
    const invoice = await this.stripe.invoices.retrieve(subscription.latest_invoice as string);
    const totalAmount = invoice.amount_paid / 100;
    const charityRate = 0.1; // default 10%

    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeCustomerId: session.customer as string,
        stripeSubId: subscription.id,
        plan: plan as any,
        status: 'ACTIVE',
        renewalDate: new Date(subscription.current_period_end * 1000),
        totalAmount,
        prizeAmount: totalAmount * PRIZE_POOL_RATE,
        charityAmount: totalAmount * charityRate,
      },
      update: {
        stripeSubId: subscription.id,
        plan: plan as any,
        status: 'ACTIVE',
        renewalDate: new Date(subscription.current_period_end * 1000),
        totalAmount,
        prizeAmount: totalAmount * PRIZE_POOL_RATE,
        charityAmount: totalAmount * charityRate,
      },
    });
  }

  private async handleSubscriptionUpdated(sub: Stripe.Subscription) {
    const existing = await this.prisma.subscription.findFirst({
      where: { stripeSubId: sub.id },
    });
    if (!existing) return;

    await this.prisma.subscription.update({
      where: { id: existing.id },
      data: {
        status: sub.status === 'active' ? 'ACTIVE' : 'LAPSED',
        renewalDate: new Date(sub.current_period_end * 1000),
      },
    });
  }

  private async handleSubscriptionDeleted(sub: Stripe.Subscription) {
    await this.prisma.subscription.updateMany({
      where: { stripeSubId: sub.id },
      data: { status: 'CANCELLED' },
    });
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    await this.prisma.subscription.updateMany({
      where: { stripeCustomerId: invoice.customer as string },
      data: { status: 'LAPSED' },
    });
  }

  async getStatus(userId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    return sub || { status: 'NONE' };
  }

  async cancelSubscription(userId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!sub) throw new NotFoundException('No active subscription');

    await this.stripe.subscriptions.cancel(sub.stripeSubId);
    return this.prisma.subscription.update({
      where: { userId },
      data: { status: 'CANCELLED' },
    });
  }
}
