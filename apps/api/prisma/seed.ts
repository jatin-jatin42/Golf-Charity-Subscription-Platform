import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with large-scale realistic data...');

  // ── 1. Charities (Expanded to 8 Diverse Orgs) ──────────────────────
  const charityData = [
    { id: 'charity-1', name: 'Hope Foundation', category: 'Education', featured: true, description: 'Education and healthcare for underprivileged children.' },
    { id: 'charity-2', name: 'Green Earth', category: 'Environment', featured: true, description: 'Combatting climate change through global reforestation.' },
    { id: 'charity-3', name: 'Medical Aid Direct', category: 'Healthcare', featured: false, description: 'Critical medical supplies to disaster-affected regions.' },
    { id: 'charity-4', name: 'Veteran Voice', category: 'Veterans', featured: true, description: 'Mental health and career support for military veterans.' },
    { id: 'charity-5', name: 'Youth Sports Alliance', category: 'Community', featured: false, description: 'Empowering city youth through accessible sports programs.' },
    { id: 'charity-6', name: 'Clean Water Project', category: 'Global South', featured: false, description: 'Building sustainable water infrastructure in rural areas.' },
    { id: 'charity-7', name: 'Mental Health Matter', category: 'Health', featured: true, description: 'Accessible counseling and crisis support services.' },
    { id: 'charity-8', name: 'Animal Haven', category: 'Animal Welfare', featured: false, description: 'Rescuing and rehoming abandoned pets globally.' },
  ];

  for (const c of charityData) {
    await prisma.charity.upsert({
      where: { id: c.id },
      update: {},
      create: { 
        ...c, 
        imageUrl: `https://picsum.photos/seed/${c.id}/800/600`,
        website: `https://${c.name.toLowerCase().replace(/ /g, '')}.org`
      },
    });
  }

  // ── 2. Administrative Accounts (Multi-Admin Environment) ──────────
  const adminPassword = await bcrypt.hash('admin@gc', 12);
  const admins = [
    { email: 'admin@gc.com', name: 'Main Admin' },
    { email: 'jatin@gc.com', name: 'Admin Jatin' },
    { email: 'admin@golfcharity.com', name: 'Backup Admin' },
  ];

  for (const a of admins) {
    await prisma.user.upsert({
      where: { email: a.email },
      update: { passwordHash: adminPassword },
      create: { ...a, passwordHash: adminPassword, role: 'ADMIN' },
    });
  }

  // ── 3. Bulk Subscribers (30 Users) ──────────────────────────────────
  const userPassword = await bcrypt.hash('12345678', 12);
  const subscribers = [
    { email: 'user@gc.com', name: 'Test Subscriber' }, // Keep existing
    { email: 'michael.scott@dundermifflin.com', name: 'Michael Scott' },
    { email: 'dwight.schrute@beetfarm.com', name: 'Dwight Schrute' },
    { email: 'jim.halpert@jimmymagic.com', name: 'Jim Halpert' },
    { email: 'pam.beesly@artschool.com', name: 'Pam Beesly' },
    { email: 'stanley.hudson@pretzelday.com', name: 'Stanley Hudson' },
    { email: 'angela.martin@cataccountants.com', name: 'Angela Martin' },
    { email: 'kevin.malone@chili.com', name: 'Kevin Malone' },
    { email: 'oscar.martinez@rationality.com', name: 'Oscar Martinez' },
    { email: 'creed.bratton@scuba.com', name: 'Creed Bratton' },
    { email: 'toby.flenderson@hrjail.com', name: 'Toby Flenderson' },
    { email: 'kelly.kapoor@popculture.com', name: 'Kelly Kapoor' },
    { email: 'ryan.howard@fire.com', name: 'Ryan Howard' },
    { email: 'erin.hannon@reception.com', name: 'Erin Hannon' },
    { email: 'andy.bernard@cornell.com', name: 'Andy Bernard' },
    { email: 'phyllis.vance@vancerefrig.com', name: 'Phyllis Vance' },
    { email: 'darryl.philbin@logistics.com', name: 'Darryl Philbin' },
    { email: 'meredith.palmer@partymad.com', name: 'Meredith Palmer' },
    { email: 'jan.levinson@candlesbyjan.com', name: 'Jan Levinson' },
    { email: 'david.wallace@suckit.com', name: 'David Wallace' },
    { email: 'holly.fax@flax.com', name: 'Holly Flax' },
    { email: 'gabe.lewis@horror.com', name: 'Gabe Lewis' },
    { email: 'nellie.bertram@prowess.com', name: 'Nellie Bertram' },
    { email: 'robert.california@lizardking.com', name: 'Robert California' },
    { email: 'pete.miller@plop.com', name: 'Pete Miller' },
    { email: 'clark.green@clark.com', name: 'Clark Green' },
    { email: 'charles.miner@steel.com', name: 'Charles Miner' },
    { email: 'deangelo.vickers@juggling.com', name: 'Deangelo Vickers' },
    { email: 'josh.porter@competitor.com', name: 'Josh Porter' },
    { email: 'karen.filippelli@utica.com', name: 'Karen Filippelli' },
  ];

  const userIds: string[] = [];
  for (const u of subscribers) {
    const charityId = `charity-${Math.floor(Math.random() * 8) + 1}`;
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { 
        ...u, 
        passwordHash: userPassword, 
        role: 'SUBSCRIBER',
        charityId,
        charityPercent: 10 + Math.floor(Math.random() * 15),
        country: Math.random() > 0.8 ? 'UK' : 'IN'
      },
    });
    userIds.push(user.id);

    // Active Subscriptions for 90% of users
    if (Math.random() > 0.1) {
      await prisma.subscription.upsert({
        where: { userId: user.id },
        update: { status: 'ACTIVE' },
        create: {
          userId: user.id,
          plan: Math.random() > 0.7 ? 'YEARLY' : 'MONTHLY',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          prizePoolShare: 1000,
          charityShare: 200,
        },
      });
    }
  }

  // ── 4. Historical Scores (Last 5 Months) ───────────────────────────
  console.log('📊 Generating historical scores...');
  const months = [1, 2, 3, 4, 5]; // Jan to May
  const year = 2026;

  for (const month of months) {
    for (const userId of userIds) {
      // 4 scores per month for 70% of users
      if (Math.random() > 0.3) {
        for (let i = 0; i < 4; i++) {
          await prisma.score.create({
            data: {
              userId,
              value: 20 + Math.floor(Math.random() * 20), // Realistic Stableford score 20–40
              date: new Date(year, month - 1, 5 + i * 7),
            },
          });
        }
      }
    }
  }

  // ── 5. Draws & Historical Winners ───────────────────────────────────
  console.log('🎰 Creating draw history...');
  const statuses = ['PUBLISHED', 'PUBLISHED', 'SIMULATED', 'PENDING'] as const;
  for (let m = 0; m < 4; m++) {
    const drawDate = new Date(2026, m, 1);
    const status = statuses[m];
    
    const draw = await prisma.draw.create({
      data: {
        month: drawDate,
        status: status,
        logicType: 'RANDOM',
        numbers: status === 'PENDING' ? [] : [5, 12, 18, 24, 39],
        prizePool: 50000 + Math.random() * 20000,
        jackpotPool: 200000,
        publishedAt: status === 'PUBLISHED' ? new Date(2026, m, 28) : null,
      },
    });

    // Entries for this draw (limit to 15 users to keep seed size manageable)
    const drawEntrants = userIds.slice(0, 15);
    for (const uid of drawEntrants) {
      await prisma.drawEntry.create({
        data: {
          drawId: draw.id,
          userId: uid,
          scores: [28, 32, 35, 30, 29],
          matchCount: status === 'PENDING' ? 0 : Math.floor(Math.random() * 4), // 0 to 3 matches for seeding
        },
      });
    }

    if (status === 'PUBLISHED') {
      // Historical Winners for PUBLISHED draws
      const winnerId = drawEntrants[Math.floor(Math.random() * drawEntrants.length)];
      await prisma.winner.create({
        data: {
          drawId: draw.id,
          userId: winnerId,
          tier: 'THREE_MATCH',
          amount: 2500,
          verifyStatus: 'APPROVED',
          payStatus: 'PAID',
        },
      });
    }
  }

  // Current Pending Draw
  await prisma.draw.create({
    data: {
      month: new Date(2026, 5, 1), // June 2026
      status: 'PENDING',
      prizePool: 45000,
      jackpotPool: 250000,
    },
  });

  // ── 6. Donations ──────────────────────────────────────────────────
  console.log('❤️ Generating donations...');
  for (let i = 0; i < 20; i++) {
    const randomUser = userIds[Math.floor(Math.random() * userIds.length)];
    const randomCharity = `charity-${Math.floor(Math.random() * 8) + 1}`;
    await prisma.donation.create({
      data: {
        userId: randomUser,
        charityId: randomCharity,
        amount: 500 + Math.floor(Math.random() * 5000),
        message: 'Keep up the great work!',
      },
    });
  }

  console.log('✅ Large-Scale Seeding Complete!');
  console.log('📊 Stats Generated:');
  console.log(`- Charities: 8`);
  console.log(`- Total Users: ${subscribers.length + admins.length}`);
  console.log(`- Historical Scores: ~${userIds.length * months.length * 3}`);
  console.log(`- Past Draws: 4`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
