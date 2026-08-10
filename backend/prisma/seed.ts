/**
 * Seed script — creates one test user per role.
 *
 * Run:  npx ts-node prisma/seed.ts
 *
 * Test credentials (development only — never use in production):
 *   admin@erp.com     / Admin@123
 *   sales@erp.com     / Sales@123
 *   warehouse@erp.com / Warehouse@123
 *   accounts@erp.com  / Accounts@123
 */

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL']!,
});
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 12;

const seedUsers = [
  { name: 'Admin User',     email: 'admin@erp.com',     password: 'Admin@123',     role: 'ADMIN'     },
  { name: 'Sales User',     email: 'sales@erp.com',     password: 'Sales@123',     role: 'SALES'     },
  { name: 'Warehouse User', email: 'warehouse@erp.com', password: 'Warehouse@123', role: 'WAREHOUSE' },
  { name: 'Accounts User',  email: 'accounts@erp.com',  password: 'Accounts@123',  role: 'ACCOUNTS'  },
] as const;

async function main() {
  console.log('Seeding users...');

  for (const u of seedUsers) {
    const hashed = await bcrypt.hash(u.password, SALT_ROUNDS);

    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        password: hashed,
        role: u.role,
      },
    });

    console.log(`  ✓ ${u.role}: ${u.email}`);
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
