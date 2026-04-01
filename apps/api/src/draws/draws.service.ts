import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Prize pool distribution
const PRIZE_RATES = {
  FIVE_MATCH: 0.4,   // 40% — jackpot (rolls over if unclaimed)
  FOUR_MATCH: 0.35,  // 35%
  THREE_MATCH: 0.25, // 25%
};

@Injectable()
export class DrawsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.draw.findMany({
      orderBy: { month: 'desc' },
      include: {
        _count: { select: { entries: true, winners: true } },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.draw.findUnique({
      where: { id },
      include: {
        winners: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { entries: true } },
      },
    });
  }

  async getCurrentDraw() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return this.prisma.draw.findFirst({
      where: { month: monthStart },
      include: { _count: { select: { entries: true } } },
    });
  }

  async getMyParticipation(userId: string) {
    return this.prisma.drawEntry.findMany({
      where: { userId },
      include: {
        draw: {
          select: {
            id: true, month: true, status: true, numbers: true, prizePool: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Admin: Create a new draw for a given month */
  async createDraw(month: Date, logicType: 'RANDOM' | 'ALGORITHMIC') {
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);

    const existing = await this.prisma.draw.findFirst({ where: { month: monthStart } });
    if (existing) throw new BadRequestException('A draw already exists for this month');

    // Calculate prize pool from active subscriptions
    const activeSubs = await this.prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      select: { prizeAmount: true },
    });
    const prizePool = activeSubs.reduce((sum, s) => sum + s.prizeAmount, 0);

    // Check for unclaimed jackpot from previous draw
    const lastDraw = await this.prisma.draw.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: { month: 'desc' },
    });
    const jackpotRollover = lastDraw ? await this.getJackpotRollover(lastDraw.id) : 0;

    return this.prisma.draw.create({
      data: {
        month: monthStart,
        logicType,
        prizePool,
        jackpotPool: jackpotRollover,
        status: 'PENDING',
        numbers: [],
      },
    });
  }

  /** Generate draw numbers and calculate matches (simulation or publish) */
  private async generateDrawNumbers(drawId: string, logicType: 'RANDOM' | 'ALGORITHMIC'): Promise<number[]> {
    if (logicType === 'RANDOM') {
      return this.generateRandomNumbers();
    } else {
      return this.generateAlgorithmicNumbers(drawId);
    }
  }

  private generateRandomNumbers(): number[] {
    const numbers: number[] = [];
    while (numbers.length < 5) {
      const n = Math.floor(Math.random() * 45) + 1;
      if (!numbers.includes(n)) numbers.push(n);
    }
    return numbers.sort((a, b) => a - b);
  }

  /** Weighted algorithmic draw — biased toward most frequent user scores */
  private async generateAlgorithmicNumbers(drawId: string): Promise<number[]> {
    const entries = await this.prisma.drawEntry.findMany({
      where: { drawId },
      select: { scores: true },
    });

    // Count frequency of each score value
    const freq: Record<number, number> = {};
    for (const entry of entries) {
      for (const score of entry.scores) {
        freq[score] = (freq[score] || 0) + 1;
      }
    }

    if (Object.keys(freq).length < 5) {
      return this.generateRandomNumbers();
    }

    // Sort by frequency descending, pick top 5 (most common scores)
    const sorted = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .map(([score]) => parseInt(score));

    return sorted.slice(0, 5).sort((a, b) => a - b);
  }

  /** Admin: Simulate draw — pre-analysis without publishing */
  async simulate(drawId: string) {
    const draw = await this.prisma.draw.findUnique({ where: { id: drawId } });
    if (!draw) throw new NotFoundException('Draw not found');
    if (draw.status === 'PUBLISHED') throw new BadRequestException('Draw already published');

    // Snapshot current active subscribers' scores
    await this.snapshotEntries(drawId);

    const numbers = await this.generateDrawNumbers(drawId, draw.logicType);

    // Calculate potential winners (simulation only — not saved as winners)
    const simulation = await this.calculateMatches(drawId, numbers);

    // Update draw with simulated numbers
    await this.prisma.draw.update({
      where: { id: drawId },
      data: { numbers, status: 'SIMULATED' },
    });

    return { numbers, simulation };
  }

  /** Admin: Publish draw results officially */
  async publish(drawId: string) {
    const draw = await this.prisma.draw.findUnique({
      where: { id: drawId },
      include: { entries: true },
    });
    if (!draw) throw new NotFoundException('Draw not found');
    if (draw.status === 'PUBLISHED') throw new BadRequestException('Already published');

    // Ensure entries are snapshotted
    await this.snapshotEntries(drawId);

    const numbers = draw.status === 'SIMULATED' && draw.numbers.length === 5
      ? draw.numbers
      : await this.generateDrawNumbers(drawId, draw.logicType);

    const matches = await this.calculateMatches(drawId, numbers);
    await this.createWinners(drawId, matches, draw.prizePool + draw.jackpotPool);

    // Check jackpot — if no 5-match winner, jackpot rolls over
    const hasFiveMatch = matches.five.length > 0;
    const jackpotCarryforward = hasFiveMatch ? 0 : draw.prizePool * PRIZE_RATES.FIVE_MATCH + draw.jackpotPool;

    await this.prisma.draw.update({
      where: { id: drawId },
      data: {
        numbers,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        jackpotPool: jackpotCarryforward,
      },
    });

    return this.findById(drawId);
  }

  /** Snapshot current active subscriber scores as draw entries */
  private async snapshotEntries(drawId: string) {
    const draw = await this.prisma.draw.findUnique({ where: { id: drawId } });

    const activeUsers = await this.prisma.user.findMany({
      where: { subscription: { status: 'ACTIVE' } },
      include: {
        scores: { orderBy: { date: 'desc' }, take: 5 },
      },
    });

    for (const user of activeUsers) {
      const scores = user.scores.map((s) => s.value);
      await this.prisma.drawEntry.upsert({
        where: { drawId_userId: { drawId, userId: user.id } },
        create: { drawId, userId: user.id, scores, matchCount: 0 },
        update: { scores },
      });
    }
  }

  /** Calculate how many scores each user matches with draw numbers */
  private async calculateMatches(drawId: string, drawNumbers: number[]) {
    const entries = await this.prisma.drawEntry.findMany({
      where: { drawId },
      include: { user: { select: { id: true, name: true } } },
    });

    const five: any[] = [], four: any[] = [], three: any[] = [];

    for (const entry of entries) {
      const matchCount = entry.scores.filter((s) => drawNumbers.includes(s)).length;

      await this.prisma.drawEntry.update({
        where: { id: entry.id },
        data: { matchCount },
      });

      const result = { ...entry, matchCount };
      if (matchCount >= 5) five.push(result);
      else if (matchCount === 4) four.push(result);
      else if (matchCount === 3) three.push(result);
    }

    return { five, four, three };
  }

  /** Create winner records after publish */
  private async createWinners(
    drawId: string,
    matches: { five: any[]; four: any[]; three: any[] },
    totalPool: number,
  ) {
    const fivePool = totalPool * PRIZE_RATES.FIVE_MATCH;
    const fourPool = totalPool * PRIZE_RATES.FOUR_MATCH;
    const threePool = totalPool * PRIZE_RATES.THREE_MATCH;

    const createForTier = async (entries: any[], tier: string, pool: number) => {
      if (entries.length === 0) return;
      const amountPerWinner = pool / entries.length;
      for (const entry of entries) {
        await this.prisma.winner.create({
          data: {
            drawId,
            userId: entry.userId,
            tier: tier as any,
            amount: amountPerWinner,
          },
        });
      }
    };

    await createForTier(matches.five, 'FIVE_MATCH', fivePool);
    await createForTier(matches.four, 'FOUR_MATCH', fourPool);
    await createForTier(matches.three, 'THREE_MATCH', threePool);
  }

  private async getJackpotRollover(drawId: string): Promise<number> {
    const draw = await this.prisma.draw.findUnique({ where: { id: drawId } });
    if (!draw) return 0;
    const fiveMatchWinners = await this.prisma.winner.count({
      where: { drawId, tier: 'FIVE_MATCH' },
    });
    if (fiveMatchWinners === 0) {
      return draw.prizePool * PRIZE_RATES.FIVE_MATCH + draw.jackpotPool;
    }
    return 0;
  }
}
