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

  // Root sectors (KBLI 2020 — 15 sectors)
  const sectorData = [
    { id: '10000000-0000-0000-0000-000000000001', name: 'Perdagangan Besar dan Eceran', code: 'G', icon: '🏪' },
    { id: '10000000-0000-0000-0000-000000000002', name: 'Industri Pengolahan', code: 'C', icon: '🏭' },
    { id: '10000000-0000-0000-0000-000000000003', name: 'Penyediaan Akomodasi dan Makan Minum', code: 'I', icon: '🍽️' },
    { id: '10000000-0000-0000-0000-000000000004', name: 'Informasi dan Komunikasi', code: 'J', icon: '📡' },
    { id: '10000000-0000-0000-0000-000000000005', name: 'Jasa Profesional, Ilmiah, dan Teknis', code: 'M', icon: '💼' },
    { id: '10000000-0000-0000-0000-000000000006', name: 'Konstruksi', code: 'F', icon: '🏗️' },
    { id: '10000000-0000-0000-0000-000000000007', name: 'Pertanian, Kehutanan, dan Perikanan', code: 'A', icon: '🌾' },
    { id: '10000000-0000-0000-0000-000000000008', name: 'Transportasi dan Pergudangan', code: 'H', icon: '🚛' },
    { id: '10000000-0000-0000-0000-000000000009', name: 'Pertambangan dan Penggalian', code: 'B', icon: '⛏️' },
    { id: '10000000-0000-0000-0000-000000000010', name: 'Jasa Keuangan dan Asuransi', code: 'K', icon: '🏦' },
    { id: '10000000-0000-0000-0000-000000000011', name: 'Jasa Pendidikan', code: 'P', icon: '🎓' },
    { id: '10000000-0000-0000-0000-000000000012', name: 'Jasa Kesehatan dan Kegiatan Sosial', code: 'Q', icon: '🏥' },
    { id: '10000000-0000-0000-0000-000000000013', name: 'Real Estate', code: 'L', icon: '🏠' },
    { id: '10000000-0000-0000-0000-000000000014', name: 'Kesenian, Hiburan, dan Rekreasi', code: 'R', icon: '🎭' },
    { id: '10000000-0000-0000-0000-000000000015', name: 'Jasa Lainnya', code: 'S', icon: '🔧' },
  ];

  const sectors = await Promise.all(
    sectorData.map((s) =>
      prisma.sector.upsert({
        where: { id: s.id },
        update: {},
        create: s,
      }),
    ),
  );
  console.log(`✅ ${sectors.length} root sectors seeded`);

  // Sub-sectors (2-3 per root sector for top 5)
  const subSectorData = [
    // G — Perdagangan
    { id: '20000000-0000-0000-0000-000000000001', name: 'Perdagangan Eceran', code: 'G47', icon: '🛒', parentId: '10000000-0000-0000-0000-000000000001' },
    { id: '20000000-0000-0000-0000-000000000002', name: 'Perdagangan Besar', code: 'G46', icon: '📦', parentId: '10000000-0000-0000-0000-000000000001' },
    { id: '20000000-0000-0000-0000-000000000003', name: 'Perdagangan Online / E-Commerce', code: 'G47.9', icon: '🌐', parentId: '10000000-0000-0000-0000-000000000001' },
    // C — Industri Pengolahan
    { id: '20000000-0000-0000-0000-000000000004', name: 'Industri Makanan', code: 'C10', icon: '🍔', parentId: '10000000-0000-0000-0000-000000000002' },
    { id: '20000000-0000-0000-0000-000000000005', name: 'Industri Tekstil dan Pakaian', code: 'C13', icon: '👕', parentId: '10000000-0000-0000-0000-000000000002' },
    { id: '20000000-0000-0000-0000-000000000006', name: 'Industri Kimia dan Farmasi', code: 'C20', icon: '💊', parentId: '10000000-0000-0000-0000-000000000002' },
    // I — Akomodasi & F&B
    { id: '20000000-0000-0000-0000-000000000007', name: 'Restoran dan Kafe', code: 'I56', icon: '☕', parentId: '10000000-0000-0000-0000-000000000003' },
    { id: '20000000-0000-0000-0000-000000000008', name: 'Hotel dan Penginapan', code: 'I55', icon: '🏨', parentId: '10000000-0000-0000-0000-000000000003' },
    // J — IT
    { id: '20000000-0000-0000-0000-000000000009', name: 'Pengembangan Perangkat Lunak', code: 'J62', icon: '💻', parentId: '10000000-0000-0000-0000-000000000004' },
    { id: '20000000-0000-0000-0000-000000000010', name: 'Jasa Telekomunikasi', code: 'J61', icon: '📱', parentId: '10000000-0000-0000-0000-000000000004' },
    { id: '20000000-0000-0000-0000-000000000011', name: 'Media dan Konten Digital', code: 'J63', icon: '🎬', parentId: '10000000-0000-0000-0000-000000000004' },
    // M — Jasa Profesional
    { id: '20000000-0000-0000-0000-000000000012', name: 'Jasa Hukum', code: 'M69', icon: '⚖️', parentId: '10000000-0000-0000-0000-000000000005' },
    { id: '20000000-0000-0000-0000-000000000013', name: 'Jasa Akuntansi dan Audit', code: 'M69.2', icon: '📊', parentId: '10000000-0000-0000-0000-000000000005' },
    { id: '20000000-0000-0000-0000-000000000014', name: 'Konsultasi Manajemen', code: 'M70', icon: '📋', parentId: '10000000-0000-0000-0000-000000000005' },
  ];

  const subSectors = await Promise.all(
    subSectorData.map((s) =>
      prisma.sector.upsert({
        where: { id: s.id },
        update: {},
        create: s,
      }),
    ),
  );
  console.log(`✅ ${subSectors.length} sub-sectors seeded`);

  // Default feature flags — keys MUST match @RequireFeature() decorators on controllers
  // targetPlans [] = all plans allowed, specific array = only those plans
  const ALL_PLANS = ['free', 'starter', 'growth', 'business'];
  const PAID_ONLY = ['growth', 'business'];
  const flagData = [
    { key: 'menu-dashboard', enabled: true, targetPlans: ALL_PLANS },
    { key: 'menu-chat', enabled: true, targetPlans: ALL_PLANS },
    { key: 'menu-checklist', enabled: true, targetPlans: ALL_PLANS },
    { key: 'menu-documents', enabled: true, targetPlans: ALL_PLANS },
    { key: 'menu-doc-review', enabled: true, targetPlans: PAID_ONLY },
    { key: 'menu-hr', enabled: true, targetPlans: PAID_ONLY },
    { key: 'menu-notifications', enabled: true, targetPlans: ALL_PLANS },
    { key: 'menu-knowledge', enabled: true, targetPlans: ALL_PLANS },
    { key: 'menu-billing', enabled: true, targetPlans: ALL_PLANS },
    { key: 'menu-settings', enabled: true, targetPlans: ALL_PLANS },
    { key: 'menu-oss-wizard', enabled: true, targetPlans: ALL_PLANS },
  ];

  const flags = await Promise.all(
    flagData.map((f) =>
      prisma.featureFlag.upsert({
        where: { key: f.key },
        update: { enabled: f.enabled },
        create: { key: f.key, enabled: f.enabled, targetPlans: f.targetPlans },
      }),
    ),
  );
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
