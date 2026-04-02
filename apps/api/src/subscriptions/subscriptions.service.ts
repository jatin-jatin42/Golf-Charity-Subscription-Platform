import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Razorpay = require('razorpay');
import * as crypto from 'crypto';

// Monthly plan: ₹500
// Yearly plan: ₹4500 (approx 25% discount)
const PLANS: Record<string, any> = {
  MONTHLY: {
    amount: 500 * 100, // 500 INR in paise
    currency: 'INR',
    period: 'monthly',
    interval: 1,
    description: 'Monthly Golf Charity Subscription',
  },
  YEARLY: {
    amount: 4500 * 100, // 4500 INR in paise
    currency: 'INR',
    period: 'yearly',
    interval: 1,
    description: 'Yearly Golf Charity Subscription (Save 25%)',
  },
};

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private razorpay: any;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.razorpay = new Razorpay({
      key_id: this.config.get('RAZORPAY_KEY_ID'),
      key_secret: this.config.get('RAZORPAY_KEY_SECRET'),
    });
  }

  /**
   * Creates a Razorpay Order for the client to initiate checkout
   */
  async createOrder(userId: string, plan: 'MONTHLY' | 'YEARLY') {
    const planConfig = PLANS[plan];
    if (!planConfig) {
      throw new BadRequestException(`Invalid plan: ${plan}`);
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    try {
      const order = await this.razorpay.orders.create({
        amount: planConfig.amount,
        currency: planConfig.currency,
        receipt: `sub_${userId.slice(-8)}_${Date.now().toString().slice(-10)}`,
        notes: {
          userId,
          plan,
          userEmail: user.email,
          userName: user.name,
        },
      });

      this.logger.log(`Razorpay order created: ${order.id} for user ${userId}, plan: ${plan}`);

      return {
        orderId: order.id,
        amount: planConfig.amount,
        currency: planConfig.currency,
        keyId: this.config.get('RAZORPAY_KEY_ID'),
        userName: user.name,
        userEmail: user.email,
        description: planConfig.description,
        plan,
      };
    } catch (err) {
      this.logger.error('Razorpay order creation failed', err);
      throw new InternalServerErrorException('Could not create payment order. Please try again.');
    }
  }

  /**
   * Verifies the Razorpay payment signature and activates the subscription
   */
  async verifyAndActivate(
    userId: string,
    data: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      plan: 'MONTHLY' | 'YEARLY';
    },
  ) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = data;

    // Verify signature
    const keySecret = this.config.get('RAZORPAY_KEY_SECRET');
    const expectedSig = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      this.logger.warn(`Invalid Razorpay signature for order ${razorpay_order_id}`);
      throw new BadRequestException('Payment verification failed: Invalid signature');
    }

    // Calculate dates
    const now = new Date();
    const periodEnd = new Date(now);
    if (plan === 'MONTHLY') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    // Calculate prize pool and charity shares
    const planConfig = PLANS[plan];
    const totalAmount = planConfig.amount / 100; // Convert from paise back to main unit
    const prizePoolShare = totalAmount * 0.5;
    const charityShare = totalAmount * 0.1;

    // Upsert subscription in DB
    const subscription = await this.prisma.subscription.upsert({
      where: { userId },
      update: {
        status: 'ACTIVE',
        plan,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        prizePoolShare,
        charityShare,
      },
      create: {
        userId,
        status: 'ACTIVE',
        plan,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        prizePoolShare,
        charityShare,
      },
    });

    this.logger.log(`Subscription activated for user ${userId}, plan ${plan}`);
    return { success: true, subscription };
  }

  async getStatus(userId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    return sub ?? { status: 'NONE' };
  }

  async cancel(userId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!sub) throw new BadRequestException('No active subscription found');

    return this.prisma.subscription.update({
      where: { userId },
      data: {
        status: 'CANCELLED',
      },
    });
  }
}
