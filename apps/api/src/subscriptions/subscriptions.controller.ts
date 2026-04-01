import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  /**
   * Step 1: Create a Razorpay order — returns orderId, amount, keyId for the frontend
   */
  @Post('create-order')
  @ApiOperation({ summary: 'Create a Razorpay payment order' })
  createOrder(
    @CurrentUser() user: any,
    @Body() body: { plan: 'MONTHLY' | 'YEARLY' },
  ) {
    return this.subscriptionsService.createOrder(user.id, body.plan);
  }

  /**
   * Step 2: Verify Razorpay payment signature and activate subscription
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Razorpay payment and activate subscription' })
  verifyPayment(
    @CurrentUser() user: any,
    @Body()
    body: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      plan: 'MONTHLY' | 'YEARLY';
    },
  ) {
    return this.subscriptionsService.verifyAndActivate(user.id, body);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get current subscription status' })
  getStatus(@CurrentUser() user: any) {
    return this.subscriptionsService.getStatus(user.id);
  }

  @Delete('cancel')
  @ApiOperation({ summary: 'Cancel subscription' })
  cancel(@CurrentUser() user: any) {
    return this.subscriptionsService.cancel(user.id);
  }
}
