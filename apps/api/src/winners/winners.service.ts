import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class WinnersService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  /** Get all winners — admin */
  async findAll(verifyStatus?: string, payStatus?: string) {
    return this.prisma.winner.findMany({
      where: {
        ...(verifyStatus && { verifyStatus: verifyStatus as any }),
        ...(payStatus && { payStatus: payStatus as any }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        draw: { select: { id: true, month: true, numbers: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Get authenticated user's winnings */
  async getMyWinnings(userId: string) {
    return this.prisma.winner.findMany({
      where: { userId },
      include: {
        draw: { select: { id: true, month: true, numbers: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Winner uploads proof screenshot to Supabase Storage */
  async uploadProof(winnerId: string, userId: string, file: Express.Multer.File) {
    const winner = await this.prisma.winner.findFirst({
      where: { id: winnerId, userId },
    });
    if (!winner) throw new NotFoundException('Winner record not found');

    // Upload to Supabase Storage
    const supabase = createClient(
      this.config.get<string>('SUPABASE_URL'),
      this.config.get<string>('SUPABASE_SERVICE_KEY'),
    );

    const filename = `winner-proofs/${winnerId}/${Date.now()}_${file.originalname}`;
    const { data, error } = await supabase.storage
      .from('winner-proofs')
      .upload(filename, file.buffer, { contentType: file.mimetype, upsert: true });

    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data: urlData } = supabase.storage.from('winner-proofs').getPublicUrl(filename);

    return this.prisma.winner.update({
      where: { id: winnerId },
      data: { proofUrl: urlData.publicUrl },
    });
  }

  /** Admin: approve or reject a winner submission */
  async verify(winnerId: string, status: 'APPROVED' | 'REJECTED') {
    return this.prisma.winner.update({
      where: { id: winnerId },
      data: { verifyStatus: status },
    });
  }

  /** Admin: mark payout as completed */
  async markPaid(winnerId: string) {
    return this.prisma.winner.update({
      where: { id: winnerId },
      data: { payStatus: 'PAID' },
    });
  }
}
