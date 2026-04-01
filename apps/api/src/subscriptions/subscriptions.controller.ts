import {
  Controller, Post, Get, Delete, Body, Headers,
  UseGuards, RawBodyRequest, Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IsEnum } from 'class-validator';

class CheckoutDto {
  @IsEnum(['MONTHLY', 'YEARLY'])
  plan: 'MONTHLY' | 'YEARLY';
}

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  // Stripe webhook — must be before auth guards (no JWT needed)
  @Post('webhook')
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.subscriptionsService.handleWebhook(req.rawBody, signature);
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createCheckout(@CurrentUser() user: any, @Body() dto: CheckoutDto) {
    return this.subscriptionsService.createCheckout(user.id, dto.plan);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getStatus(@CurrentUser() user: any) {
    return this.subscriptionsService.getStatus(user.id);
  }

  @Delete('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  cancel(@CurrentUser() user: any) {
    return this.subscriptionsService.cancelSubscription(user.id);
  }
}
