import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Starting seed...');

  // Create test user
  const hashedPassword = await bcrypt.hash('TestPassword123!', 10);

  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      passwordHash: hashedPassword,
    },
  });

  console.log(`Created user: ${user.email}`);

  // Create sample builds
  const build1 = await prisma.build.create({
    data: {
      name: 'Build-2026-001',
      description: 'Q1 production run',
      status: 'PENDING',
    },
  });

  const build2 = await prisma.build.create({
    data: {
      name: 'Build-2026-002',
      description: 'Q2 production run',
      status: 'RUNNING',
    },
  });

  console.log(`Created builds: ${build1.id}, ${build2.id}`);

  // Create sample parts
  const part1 = await prisma.part.create({
    data: {
      buildId: build1.id,
      name: 'Valve',
      sku: 'V-001',
      quantity: 2,
    },
  });

  const part2 = await prisma.part.create({
    data: {
      buildId: build2.id,
      name: 'Pump',
      sku: 'P-001',
      quantity: 1,
    },
  });

  console.log(`Created parts: ${part1.id}, ${part2.id}`);

  // Create sample test runs
  const testRun1 = await prisma.testRun.create({
    data: {
      buildId: build1.id,
      status: 'PASSED',
      result: 'All tests passed',
      completedAt: new Date(),
    },
  });

  console.log(`Created test run: ${testRun1.id}`);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
