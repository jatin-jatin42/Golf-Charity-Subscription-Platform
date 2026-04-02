import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Charities ─────────────────────────────────────────────────
  const charity1 = await prisma.charity.upsert({
    where: { id: 'charity-1' },
    update: {},
    create: {
      id: 'charity-1',
      name: 'Hope Foundation',
      description: 'Providing education and healthcare to underprivileged children across rural communities.',
      imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800',
      featured: true,
      category: 'Education',
      website: 'https://hopefoundation.org',
    },
  });

  const charity2 = await prisma.charity.upsert({
    where: { id: 'charity-2' },
    update: {},
    create: {
      id: 'charity-2',
      name: 'Green Earth Initiative',
      description: 'Planting trees and restoring natural habitats to combat climate change.',
      imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
      featured: false,
      category: 'Environment',
      website: 'https://greenearth.org',
    },
  });

  const charity3 = await prisma.charity.upsert({
    where: { id: 'charity-3' },
    update: {},
    create: {
      id: 'charity-3',
      name: 'Medical Aid Direct',
      description: 'Delivering critical medical supplies and care to disaster-affected regions worldwide.',
      imageUrl: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=800',
      featured: false,
      category: 'Healthcare',
      website: 'https://medicalaiddirect.org',
    },
  });

  // Charity Events
  await prisma.charityEvent.createMany({
    data: [
      {
        charityId: 'charity-1',
        title: 'Charity Golf Day 2026',
        description: 'Annual golf fundraiser at Royal Melbourne Golf Club.',
        date: new Date('2026-06-15'),
        location: 'Royal Melbourne Golf Club',
      },
      {
        charityId: 'charity-1',
        title: 'Education Gala Dinner',
        description: 'Fundraising dinner to support our scholarship program.',
        date: new Date('2026-07-20'),
        location: 'Grand Hyatt Melbourne',
      },
      {
        charityId: 'charity-2',
        title: 'Tree Planting Weekend',
        description: 'Community tree planting event across 5 parks.',
        date: new Date('2026-05-10'),
        location: 'Various Parks, Sydney',
      },
    ],
    skipDuplicates: true,
  });

  // ── Admin User ────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin@gc', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gc.com' },
    update: {
      passwordHash: adminPassword,
    },
    create: {
      email: 'admin@gc.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  // ── Test Subscriber ────────────────────────────────────────────
  const userPassword = await bcrypt.hash('12345678', 12);
  const testUser = await prisma.user.upsert({
    where: { email: 'user@gc.com' },
    update: {
      passwordHash: userPassword,
    },
    create: {
      email: 'user@gc.com',
      name: 'Test Subscriber',
      passwordHash: userPassword,
      role: 'SUBSCRIBER',
      charityId: 'charity-1',
      charityPercent: 15,
    },
  });

  // Test user subscription (simulated — no real payment in seed)
  await prisma.subscription.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      plan: 'MONTHLY',
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      prizePoolShare: 1000,  // ₹1000 to prize pool (50% of ₹2000)
      charityShare: 300,     // ₹300 to charity (15% of ₹2000)
    },
  });

  // Test scores for test user
  const scores = [
    { value: 32, date: new Date('2026-03-25') },
    { value: 28, date: new Date('2026-03-18') },
    { value: 35, date: new Date('2026-03-11') },
    { value: 30, date: new Date('2026-03-04') },
    { value: 27, date: new Date('2026-02-25') },
  ];

  for (const score of scores) {
    await prisma.score.create({
      data: { userId: testUser.id, ...score },
    });
  }

  console.log('✅ Seed complete!');
  console.log('');
  console.log('📋 Test Credentials:');
  console.log('  Admin:  admin@gc.com / admin@gc');
  console.log('  User:   user@gc.com  / 12345678');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
