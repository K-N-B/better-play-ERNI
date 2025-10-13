import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ernipuzzle.com' },
    update: {},
    create: {
      email: 'admin@ernipuzzle.com',
      name: 'Admin User',
      role: 'ADMIN',
      status: 'ACTIVE',
      azureId: 'admin-azure-id-123'
    }
  });
  console.log('✅ Created admin user:', admin.email);

  // Create moderator user
  const moderator = await prisma.user.upsert({
    where: { email: 'moderator@ernipuzzle.com' },
    update: {},
    create: {
      email: 'moderator@ernipuzzle.com',
      name: 'Moderator User',
      role: 'MODERATOR',
      status: 'ACTIVE',
      azureId: 'moderator-azure-id-456'
    }
  });
  console.log('✅ Created moderator user:', moderator.email);

  // Create regular users
  const users = [];
  for (let i = 1; i <= 10; i++) {
    const user = await prisma.user.upsert({
      where: { email: `user${i}@ernipuzzle.com` },
      update: {},
      create: {
        email: `user${i}@ernipuzzle.com`,
        name: `User ${i}`,
        role: 'USER',
        status: i % 5 === 0 ? 'INACTIVE' : 'ACTIVE',
        azureId: `user-azure-id-${i}`
      }
    });
    users.push(user);
  }
  console.log(`✅ Created ${users.length} regular users`);

  // Create sample puzzles
  const puzzles = [];
  for (let i = 1; i <= 5; i++) {
    const puzzle = await prisma.puzzle.create({
      data: {
        title: `Puzzle ${i}`,
        description: `This is puzzle number ${i}`,
        difficulty: ['EASY', 'MEDIUM', 'HARD'][i % 3] as any,
        content: {
          grid: [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
          solution: [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
        },
        createdBy: admin.id,
        status: 'PUBLISHED',
        publishedAt: new Date()
      }
    });
    puzzles.push(puzzle);
  }
  console.log(`✅ Created ${puzzles.length} puzzles`);

  // Create sample activities
  for (const user of [admin, moderator, ...users.slice(0, 3)]) {
    await prisma.activity.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        description: `${user.name} logged in`,
        metadata: { ip: '127.0.0.1' }
      }
    });
  }
  console.log('✅ Created sample activities');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });