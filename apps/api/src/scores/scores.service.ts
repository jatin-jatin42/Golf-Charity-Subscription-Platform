import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MAX_SCORES = 5;

@Injectable()
export class ScoresService {
  constructor(private prisma: PrismaService) {}

  /** Get user's last 5 scores in reverse chronological order */
  async getMyScores(userId: string) {
    return this.prisma.score.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: MAX_SCORES,
    });
  }

  /** Add a score — auto-replaces oldest if user already has 5 */
  async addScore(userId: string, value: number, date: Date) {
    if (value < 1 || value > 45) {
      throw new BadRequestException('Score must be between 1 and 45 (Stableford)');
    }

    // Count existing scores
    const count = await this.prisma.score.count({ where: { userId } });

    if (count >= MAX_SCORES) {
      // Find the oldest score and delete it
      const oldest = await this.prisma.score.findFirst({
        where: { userId },
        orderBy: { date: 'asc' },
      });
      if (oldest) await this.prisma.score.delete({ where: { id: oldest.id } });
    }

    return this.prisma.score.create({
      data: { userId, value, date: new Date(date) },
    });
  }

  /** Edit an existing score */
  async updateScore(userId: string, scoreId: string, value: number, date?: Date) {
    if (value < 1 || value > 45) {
      throw new BadRequestException('Score must be between 1 and 45 (Stableford)');
    }

    return this.prisma.score.update({
      where: { id: scoreId, userId },
      data: { value, ...(date ? { date: new Date(date) } : {}) },
    });
  }

  /** Delete a score */
  async deleteScore(userId: string, scoreId: string) {
    return this.prisma.score.delete({ where: { id: scoreId, userId } });
  }

  /** Admin: get scores for any user */
  async getUserScores(userId: string) {
    return this.prisma.score.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  /** Admin: update any user's score */
  async adminUpdateScore(scoreId: string, value: number, date?: Date) {
    return this.prisma.score.update({
      where: { id: scoreId },
      data: { value, ...(date ? { date: new Date(date) } : {}) },
    });
  }
}
