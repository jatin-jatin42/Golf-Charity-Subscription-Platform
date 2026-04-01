import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const [
      totalUsers,
      activeSubscribers,
      totalDraws,
      publishedDraws,
      totalWinners,
      pendingVerification,
      totalDonations,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.draw.count(),
      this.prisma.draw.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.winner.count(),
      this.prisma.winner.count({ where: { verifyStatus: 'PENDING' } }),
      this.prisma.donation.aggregate({ _sum: { amount: true } }),
    ]);

    // Total prize pool across all subscriptions
    const prizePoolAggregate = await this.prisma.subscription.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { prizePoolShare: true },
    });

    // Total charity contributions
    const charityAggregate = await this.prisma.subscription.aggregate({
      _sum: { charityShare: true },
    });

    // Draw statistics breakdown
    const drawStats = await this.prisma.draw.findMany({
      select: {
        id: true,
        month: true,
        status: true,
        prizePool: true,
        jackpotPool: true,
        _count: { select: { entries: true, winners: true } },
      },
      orderBy: { month: 'desc' },
      take: 6,
    });

    // Most popular charities
    const topCharities = await this.prisma.charity.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { users: true } },
      },
      orderBy: { users: { _count: 'desc' } },
      take: 5,
    });

    return {
      users: {
        total: totalUsers,
        activeSubscribers,
        conversionRate:
          totalUsers > 0 ? ((activeSubscribers / totalUsers) * 100).toFixed(1) : 0,
      },
      prizes: {
        monthlyPool: prizePoolAggregate._sum.prizePoolShare || 0,
        totalPaid: 0, // would aggregate from winner pays
      },
      charity: {
        totalContributions: charityAggregate._sum.charityShare || 0,
        totalDonations: totalDonations._sum.amount || 0,
      },
      draws: {
        total: totalDraws,
        published: publishedDraws,
        recentStats: drawStats,
      },
      winners: {
        total: totalWinners,
        pendingVerification,
      },
      topCharities,
    };
  }
}
