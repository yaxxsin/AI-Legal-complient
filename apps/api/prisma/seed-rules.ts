import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding Compliance Rules...');

  // Pastikan kategori pertama (Perizinan) ada
  let category = await prisma.complianceCategory.findFirst({
    where: { name: 'Perizinan & Legalitas' }
  });

  if (!category) {
    category = await prisma.complianceCategory.create({
      data: {
        name: 'Perizinan & Legalitas',
        icon: 'shield',
        sortOrder: 1,
      }
    });
  }

  const rules = await Promise.all([
    prisma.complianceRule.upsert({
      where: { id: '30000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '30000000-0000-0000-0000-000000000001',
        title: 'NIB (Nomor Induk Berusaha)',
        description: 'Wajib memiliki dan mendaftarkan Nomor Induk Berusaha (NIB) sesuai dengan KBLI perusahaan melalui sistem OSS RBA.',
        categoryId: category.id,
        priority: 'HIGH',
        conditions: { entityType: ['PT', 'CV', 'Firma', 'Perorangan'] },
        legalReferences: ['PP No. 5 Tahun 2021 tentang Penyelenggaraan Perizinan Berusaha Berbasis Risiko'],
        isPublished: true,
      },
    }),
    prisma.complianceRule.upsert({
      where: { id: '30000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: '30000000-0000-0000-0000-000000000002',
        title: 'NPWP Perusahaan',
        description: 'Setiap badan usaha yang terbentuk wajib mendaftarkan dan memiliki Nomor Pokok Wajib Pajak (NPWP) Badan.',
        categoryId: category.id,
        priority: 'HIGH',
        conditions: {},
        legalReferences: ['UU Ketentuan Umum dan Tata Cara Perpajakan'],
        isPublished: true,
      },
    }),
    prisma.complianceRule.upsert({
      where: { id: '30000000-0000-0000-0000-000000000003' },
      update: {},
      create: {
        id: '30000000-0000-0000-0000-000000000003',
        title: 'Sertifikat Standar / Izin Operasional',
        description: 'Untuk usaha beresiko Menengah-Tinggi dan Tinggi, diwajibkan mengantongi Sertifikat Standar atau Izin sebelum beroperasi penuh.',
        categoryId: category.id,
        priority: 'MEDIUM',
        conditions: {},
        legalReferences: ['Peraturan BKPM No. 4 Tahun 2021'],
        isPublished: true,
      },
    }),
  ]);

  console.log(`✅ ${rules.length} compliance rules seeded!`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
