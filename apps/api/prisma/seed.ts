import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // Compliance Categories (6 categories from blueprint)
  const categories = await Promise.all([
    prisma.complianceCategory.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Perizinan & Legalitas',
        icon: 'shield',
        sortOrder: 1,
      },
    }),
    prisma.complianceCategory.upsert({
      where: { id: '00000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Ketenagakerjaan',
        icon: 'users',
        sortOrder: 2,
      },
    }),
    prisma.complianceCategory.upsert({
      where: { id: '00000000-0000-0000-0000-000000000003' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'Perpajakan',
        icon: 'receipt',
        sortOrder: 3,
      },
    }),
    prisma.complianceCategory.upsert({
      where: { id: '00000000-0000-0000-0000-000000000004' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000004',
        name: 'Kontrak & Perjanjian',
        icon: 'file-text',
        sortOrder: 4,
      },
    }),
    prisma.complianceCategory.upsert({
      where: { id: '00000000-0000-0000-0000-000000000005' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000005',
        name: 'K3 (Keselamatan Kerja)',
        icon: 'hard-hat',
        sortOrder: 5,
      },
    }),
    prisma.complianceCategory.upsert({
      where: { id: '00000000-0000-0000-0000-000000000006' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000006',
        name: 'Lingkungan',
        icon: 'leaf',
        sortOrder: 6,
      },
    }),
  ]);
  console.log(`✅ ${categories.length} compliance categories seeded`);

  // Top 5 sectors (KBLI 2020)
  const sectors = await Promise.all([
    prisma.sector.upsert({
      where: { id: '10000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '10000000-0000-0000-0000-000000000001',
        name: 'Perdagangan Besar dan Eceran',
        code: 'G',
        icon: 'store',
      },
    }),
    prisma.sector.upsert({
      where: { id: '10000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: '10000000-0000-0000-0000-000000000002',
        name: 'Industri Pengolahan',
        code: 'C',
        icon: 'factory',
      },
    }),
    prisma.sector.upsert({
      where: { id: '10000000-0000-0000-0000-000000000003' },
      update: {},
      create: {
        id: '10000000-0000-0000-0000-000000000003',
        name: 'Penyediaan Akomodasi dan Makan Minum',
        code: 'I',
        icon: 'utensils',
      },
    }),
    prisma.sector.upsert({
      where: { id: '10000000-0000-0000-0000-000000000004' },
      update: {},
      create: {
        id: '10000000-0000-0000-0000-000000000004',
        name: 'Informasi dan Komunikasi',
        code: 'J',
        icon: 'wifi',
      },
    }),
    prisma.sector.upsert({
      where: { id: '10000000-0000-0000-0000-000000000005' },
      update: {},
      create: {
        id: '10000000-0000-0000-0000-000000000005',
        name: 'Jasa Profesional, Ilmiah, dan Teknis',
        code: 'M',
        icon: 'briefcase',
      },
    }),
  ]);
  console.log(`✅ ${sectors.length} sectors seeded`);

  // Default feature flags
  const flags = await Promise.all([
    prisma.featureFlag.upsert({
      where: { key: 'compliance_bot' },
      update: {},
      create: { key: 'compliance_bot', enabled: true, targetPlans: ['free', 'starter', 'growth', 'business'] },
    }),
    prisma.featureFlag.upsert({
      where: { key: 'document_generator' },
      update: {},
      create: { key: 'document_generator', enabled: true, targetPlans: ['free', 'starter', 'growth', 'business'] },
    }),
    prisma.featureFlag.upsert({
      where: { key: 'document_review_ai' },
      update: {},
      create: { key: 'document_review_ai', enabled: false, targetPlans: ['growth', 'business'] },
    }),
  ]);
  console.log(`✅ ${flags.length} feature flags seeded`);

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
