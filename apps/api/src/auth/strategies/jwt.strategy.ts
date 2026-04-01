import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        subscription: true,
        charity: {
          select: { id: true, name: true, imageUrl: true },
        },
      },
    });

    if (!user) throw new UnauthorizedException('User not found');

    // Real-time subscription status check on every authenticated request
    if (user.subscription && user.subscription.currentPeriodEnd && user.subscription.currentPeriodEnd < new Date()) {
      await this.prisma.subscription.update({
        where: { userId: user.id },
        data: { status: 'LAPSED' },
      });
    }

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
