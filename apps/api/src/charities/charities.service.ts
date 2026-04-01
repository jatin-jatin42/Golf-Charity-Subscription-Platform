import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class CharitiesService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async findAll(search?: string, category?: string) {
    return this.prisma.charity.findMany({
      where: {
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(category && { category }),
      },
      include: {
        events: { orderBy: { date: 'asc' }, take: 3 },
        _count: { select: { users: true } },
      },
      orderBy: [{ featured: 'desc' }, { name: 'asc' }],
    });
  }

  async findFeatured() {
    return this.prisma.charity.findFirst({
      where: { featured: true },
      include: { events: true },
    });
  }

  async findById(id: string) {
    const charity = await this.prisma.charity.findUnique({
      where: { id },
      include: {
        events: { orderBy: { date: 'asc' } },
        _count: { select: { users: true, donations: true } },
      },
    });
    if (!charity) throw new NotFoundException('Charity not found');
    return charity;
  }

  async create(data: {
    name: string;
    description: string;
    imageUrl?: string;
    category?: string;
    website?: string;
    featured?: boolean;
  }) {
    return this.prisma.charity.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.charity.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.charity.delete({ where: { id } });
  }

  async addEvent(charityId: string, data: { title: string; description?: string; date: Date; location?: string }) {
    return this.prisma.charityEvent.create({
      data: { charityId, ...data },
    });
  }

  async getCategories() {
    const charities = await this.prisma.charity.findMany({
      select: { category: true },
      distinct: ['category'],
      where: { category: { not: null } },
    });
    return charities.map((c) => c.category).filter(Boolean);
  }
}
