import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ScoresModule } from './scores/scores.module';
import { CharitiesModule } from './charities/charities.module';
import { DrawsModule } from './draws/draws.module';
import { WinnersModule } from './winners/winners.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    // ── Config ─────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ── Rate Limiting ───────────────────────────────────────────
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // ── Core ────────────────────────────────────────────────────
    PrismaModule,

    // ── Feature Modules ─────────────────────────────────────────
    AuthModule,
    UsersModule,
    SubscriptionsModule,
    ScoresModule,
    CharitiesModule,
    DrawsModule,
    WinnersModule,
    ReportsModule,
  ],
})
export class AppModule {}
