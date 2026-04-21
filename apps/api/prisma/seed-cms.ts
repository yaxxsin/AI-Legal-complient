import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CMS Pages...');

  const homePage = await prisma.cmsPage.upsert({
    where: { slug: 'home' },
    update: {},
    create: {
      slug: 'home',
      title: 'Solusi Kepatuhan Hukum Otomatis untuk Bisnis Anda',
      metaDescription: 'LocalCompliance membantu UMKM dan perusahaan memastikan kepatuhan hukum secara otomatis, aman, dan tanpa repot.',
      isPublished: true,
    },
  });

  // Seed Sections for Home Page
  // 1. Hero
  await prisma.cmsSection.create({
    data: {
      pageId: homePage.id,
      type: 'hero',
      sortOrder: 1,
      content: {
        title: 'Solusi Kepatuhan Hukum Otomatis untuk Bisnis Anda',
        subtitle: 'Hemat waktu dan hindari sanksi dengan asisten legal AI pertama di Indonesia yang memahami konteks bisnis Anda secara real-time.',
        ctaText: 'Coba Gratis',
        ctaUrl: '/login',
        secondaryCtaText: 'Jadwalkan Demo',
        secondaryCtaUrl: '#demo',
      },
      isActive: true,
    },
  });

  // 2. Features Grid
  await prisma.cmsSection.create({
    data: {
      pageId: homePage.id,
      type: 'features',
      sortOrder: 2,
      content: {
        title: 'Semua Kepatuhan di Satu Tempat',
        subtitle: 'Fitur lengkap untuk menjawab semua tantangan regulasi',
        items: [
          {
            title: 'Automasi Dokumen',
            description: 'Buat perjanjian kerja, NDA, dan dokumen legal lainnya dalam hitungan detik.',
            icon: 'FileText'
          },
          {
            title: 'ComplianceScore Real-time',
            description: 'Monitor tingkat kepatuhan bisnis Anda dan dapatkan saran perbaikan instan.',
            icon: 'Activity'
          },
          {
            title: 'Notifikasi Regulasi',
            description: 'Dapatkan peringatan otomatis ketika ada perubahan hukum yang berdampak pada bisnis Anda.',
            icon: 'Bell'
          }
        ]
      },
      isActive: true,
    },
  });

  // 3. Document Generator
  await prisma.cmsSection.create({
    data: {
      pageId: homePage.id,
      type: 'testimonials', // Using testimonials variant for social proof
      sortOrder: 3,
      content: {
        title: 'Dipercaya oleh 500+ UMKM',
        subtitle: 'Lihat bagaimana kami membantu bisnis berkembang tanpa pusing urusan legal',
        items: [
          {
            name: 'Budi Santoso',
            role: 'CEO StartupTech',
            quote: 'Sangat membantu! Checklist compliance-nya membuat audite lebih terarah.'
          },
          {
            name: 'Andi M',
            role: 'Founder KopiKangen',
            quote: 'Dokumen perjanjian mitra langsung jadi. Nggak perlu sewa lawyer mahal untuk tahap awal.'
          }
        ]
      },
      isActive: true,
    },
  });

  // 4. CTA
  await prisma.cmsSection.create({
    data: {
      pageId: homePage.id,
      type: 'cta',
      sortOrder: 4,
      content: {
        title: 'Siap Mengamankan Bisnis Anda?',
        subtitle: 'Bergabung dengan ratusan perusahaan yang telah beralih ke compliance otomatis.',
        ctaText: 'Mulai Sekarang — Gratis',
        ctaUrl: '/login'
      },
      isActive: true,
    },
  });

  console.log(`✅ Seeded CMS Page: ${homePage.slug} with 4 sections.`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding CMS:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
