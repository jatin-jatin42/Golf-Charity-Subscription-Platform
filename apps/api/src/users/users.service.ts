import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true,
        charityPercent: true, country: true, createdAt: true,
        subscription: { select: { plan: true, status: true, currentPeriodEnd: true } },
        charity: { select: { id: true, name: true } },
        _count: { select: { scores: true, drawEntries: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, role: true,
        charityId: true, charityPercent: true, country: true,
        subscription: true,
        charity: { select: { id: true, name: true, imageUrl: true, description: true } },
        scores: { orderBy: { date: 'desc' }, take: 5 },
        createdAt: true,
      },
    });
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        charityId: dto.charityId,
        charityPercent: dto.charityPercent,
        country: dto.country,
      },
      select: { id: true, name: true, email: true, charityId: true, charityPercent: true },
    });
  }
}
