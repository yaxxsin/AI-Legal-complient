/**
 * Compliance Rules Seed Data — 50+ rules across 4 categories
 * Run: npx ts-node prisma/seed-compliance.ts
 *
 * Categories:
 * 1. Perizinan (Licensing)
 * 2. Ketenagakerjaan (Employment)
 * 3. Perpajakan (Tax)
 * 4. Perlindungan Data (Data Protection)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ──────────────────────────────────────────
// Category definitions
// ──────────────────────────────────────────
const categories = [
  { name: 'Perizinan', icon: '📋', sortOrder: 1 },
  { name: 'Ketenagakerjaan', icon: '👷', sortOrder: 2 },
  { name: 'Perpajakan', icon: '💰', sortOrder: 3 },
  { name: 'Perlindungan Data', icon: '🔒', sortOrder: 4 },
];

// ──────────────────────────────────────────
// Helper: condition builders
// ──────────────────────────────────────────
type Cond = { field: string; op: string; value: unknown };
const and = (...rules: Cond[]) => ({ operator: 'AND', rules });
const or = (...rules: Cond[]) => ({ operator: 'OR', rules });
const eq = (field: string, value: unknown): Cond => ({ field, op: 'eq', value });
const gte = (field: string, value: number): Cond => ({ field, op: 'gte', value });
const lt = (field: string, value: number): Cond => ({ field, op: 'lt', value });
const inList = (field: string, value: unknown[]): Cond => ({ field, op: 'in', value });
const exists = (field: string): Cond => ({ field, op: 'exists', value: true });
const ALL = { operator: 'AND' as const, rules: [] }; // applies to everyone

// ──────────────────────────────────────────
// Rules per category
// ──────────────────────────────────────────
interface RuleSeed {
  title: string;
  description: string;
  priority: string;
  conditions: ReturnType<typeof and>;
  legalReferences: { name: string; url?: string }[];
  guidanceText?: string;
}

const perizinanRules: RuleSeed[] = [
  {
    title: 'Nomor Induk Berusaha (NIB)',
    description: 'Setiap pelaku usaha wajib memiliki NIB melalui sistem OSS.',
    priority: 'critical',
    conditions: ALL,
    legalReferences: [{ name: 'PP 5/2021 tentang OSS-RBA' }],
    guidanceText: 'Daftarkan di oss.go.id. NIB berfungsi sebagai TDP, API, dan Akses Kepabeanan.',
  },
  {
    title: 'Izin Usaha melalui OSS',
    description: 'Izin Usaha diterbitkan bersamaan dengan NIB via sistem OSS.',
    priority: 'critical',
    conditions: ALL,
    legalReferences: [{ name: 'PP 5/2021 Pasal 13' }],
  },
  {
    title: 'Sertifikat Standar / Izin Komersial',
    description: 'Usaha berisiko menengah-tinggi wajib memenuhi sertifikat standar.',
    priority: 'high',
    conditions: and(inList('entityType', ['PT', 'CV'])),
    legalReferences: [{ name: 'PP 5/2021 Pasal 14' }],
  },
  {
    title: 'Akta Pendirian PT',
    description: 'PT wajib memiliki akta pendirian dari notaris yang disahkan Kemenkumham.',
    priority: 'critical',
    conditions: and(eq('entityType', 'PT')),
    legalReferences: [{ name: 'UU 40/2007 tentang Perseroan Terbatas' }],
  },
  {
    title: 'Akta Pendirian CV',
    description: 'CV wajib memiliki akta pendirian notaris yang didaftarkan di Pengadilan Negeri.',
    priority: 'critical',
    conditions: and(eq('entityType', 'CV')),
    legalReferences: [{ name: 'KUHD Pasal 22-35' }],
  },
  {
    title: 'Izin Lokasi / Peruntukan',
    description: 'Usaha yang memerlukan lokasi fisik wajib memiliki izin lokasi.',
    priority: 'high',
    conditions: and(eq('isOnlineBusiness', false)),
    legalReferences: [{ name: 'Permen ATR 17/2019' }],
  },
  {
    title: 'Izin Mendirikan Bangunan (IMB/PBG)',
    description: 'Bangunan usaha wajib memiliki Persetujuan Bangunan Gedung (PBG).',
    priority: 'high',
    conditions: and(eq('isOnlineBusiness', false)),
    legalReferences: [{ name: 'PP 16/2021 tentang Bangunan Gedung' }],
  },
  {
    title: 'Sertifikat Halal (Wajib)',
    description: 'Produk makanan, minuman, kosmetik yang beredar di Indonesia wajib bersertifikat halal.',
    priority: 'high',
    conditions: ALL,
    legalReferences: [{ name: 'UU 33/2014 tentang Jaminan Produk Halal' }],
    guidanceText: 'Ajukan melalui BPJPH (Badan Penyelenggara Jaminan Produk Halal).',
  },
  {
    title: 'PIRT / Izin Edar BPOM',
    description: 'Produk pangan olahan wajib memiliki izin edar BPOM atau PIRT untuk industri rumah tangga.',
    priority: 'high',
    conditions: ALL,
    legalReferences: [{ name: 'Perka BPOM 27/2017' }],
  },
  {
    title: 'Tanda Daftar Perusahaan (TDP)',
    description: 'TDP kini terintegrasi dengan NIB melalui OSS. Pastikan NIB sudah diterbitkan.',
    priority: 'medium',
    conditions: ALL,
    legalReferences: [{ name: 'PP 24/2018' }],
  },
  {
    title: 'SIUP (Surat Izin Usaha Perdagangan)',
    description: 'SIUP terintegrasi NIB. Berlaku untuk usaha perdagangan.',
    priority: 'medium',
    conditions: ALL,
    legalReferences: [{ name: 'Permendag 36/2007' }],
  },
  {
    title: 'Izin Usaha Mikro Kecil (IUMK)',
    description: 'Usaha mikro dan kecil bisa menggunakan IUMK yang prosesnya lebih sederhana.',
    priority: 'medium',
    conditions: and(inList('entityType', ['Perorangan', 'UMKM'])),
    legalReferences: [{ name: 'PP 7/2021' }],
  },
  {
    title: 'Sertifikat Laik Fungsi',
    description: 'Bangunan usaha harus memiliki Sertifikat Laik Fungsi (SLF).',
    priority: 'medium',
    conditions: and(eq('isOnlineBusiness', false)),
    legalReferences: [{ name: 'PP 16/2021' }],
  },
  {
    title: 'Izin Lingkungan / AMDAL / UKL-UPL',
    description: 'Usaha berdampak lingkungan wajib memiliki dokumen lingkungan.',
    priority: 'high',
    conditions: and(gte('employeeCount', 50)),
    legalReferences: [{ name: 'UU 32/2009 tentang Perlindungan Lingkungan' }],
  },
  {
    title: 'Pendaftaran Merek Dagang',
    description: 'Lindungi merek dagang bisnis Anda dengan mendaftarkan ke DJKI.',
    priority: 'low',
    conditions: ALL,
    legalReferences: [{ name: 'UU 20/2016 tentang Merek dan Indikasi Geografis' }],
    guidanceText: 'Daftar di dgip.go.id. Biaya mulai Rp 500.000.',
  },
];

const ketenagakerjaanRules: RuleSeed[] = [
  {
    title: 'Peraturan Perusahaan (PP)',
    description: 'Perusahaan dengan ≥10 karyawan wajib membuat Peraturan Perusahaan.',
    priority: 'critical',
    conditions: and(gte('employeeCount', 10)),
    legalReferences: [{ name: 'UU 13/2003 Pasal 108' }],
    guidanceText: 'PP harus disahkan oleh Disnaker. Berlaku max 2 tahun.',
  },
  {
    title: 'Perjanjian Kerja (PKWT/PKWTT)',
    description: 'Setiap hubungan kerja wajib dituangkan dalam perjanjian kerja tertulis.',
    priority: 'critical',
    conditions: and(gte('employeeCount', 1)),
    legalReferences: [{ name: 'UU 13/2003 Pasal 50-66' }, { name: 'PP 35/2021' }],
  },
  {
    title: 'BPJS Ketenagakerjaan',
    description: 'Wajib mendaftarkan seluruh pekerja ke BPJS Ketenagakerjaan.',
    priority: 'critical',
    conditions: and(gte('employeeCount', 1)),
    legalReferences: [{ name: 'UU 24/2011 tentang BPJS' }],
    guidanceText: 'Meliputi JKK, JKM, JHT, JP. Daftar di bpjsketenagakerjaan.go.id.',
  },
  {
    title: 'BPJS Kesehatan',
    description: 'Wajib mendaftarkan seluruh pekerja ke BPJS Kesehatan.',
    priority: 'critical',
    conditions: and(gte('employeeCount', 1)),
    legalReferences: [{ name: 'UU 24/2011', name: 'Perpres 82/2018' }],
  },
  {
    title: 'Upah Minimum Regional (UMR/UMK)',
    description: 'Upah karyawan tidak boleh di bawah UMK yang berlaku.',
    priority: 'critical',
    conditions: and(gte('employeeCount', 1)),
    legalReferences: [{ name: 'PP 36/2021 tentang Pengupahan' }],
  },
  {
    title: 'Jam Kerja Sesuai Undang-Undang',
    description: 'Jam kerja max 40 jam/minggu. Lembur wajib dibayar sesuai ketentuan.',
    priority: 'high',
    conditions: and(gte('employeeCount', 1)),
    legalReferences: [{ name: 'UU 13/2003 Pasal 77-78' }],
  },
  {
    title: 'Cuti Tahunan 12 Hari',
    description: 'Pekerja yang telah bekerja 12 bulan berhak atas 12 hari cuti.',
    priority: 'high',
    conditions: and(gte('employeeCount', 1)),
    legalReferences: [{ name: 'UU 13/2003 Pasal 79' }],
  },
  {
    title: 'THR Keagamaan',
    description: 'Pekerja berhak menerima THR paling lambat 7 hari sebelum hari raya.',
    priority: 'critical',
    conditions: and(gte('employeeCount', 1)),
    legalReferences: [{ name: 'Permenaker 6/2016' }],
  },
  {
    title: 'Wajib Lapor Ketenagakerjaan (WLKP)',
    description: 'Perusahaan wajib melaporkan data ketenagakerjaan secara berkala.',
    priority: 'high',
    conditions: and(gte('employeeCount', 1)),
    legalReferences: [{ name: 'UU 7/1981 tentang Wajib Lapor' }],
    guidanceText: 'Lapor melalui wajiblapor.kemnaker.go.id.',
  },
  {
    title: 'Keselamatan dan Kesehatan Kerja (K3)',
    description: 'Perusahaan wajib menerapkan standar K3 di tempat kerja.',
    priority: 'high',
    conditions: and(gte('employeeCount', 10)),
    legalReferences: [{ name: 'UU 1/1970 tentang Keselamatan Kerja' }],
  },
  {
    title: 'Penunjukan Petugas P2K3',
    description: 'Perusahaan ≥100 karyawan wajib membentuk Panitia Pembina K3.',
    priority: 'medium',
    conditions: and(gte('employeeCount', 100)),
    legalReferences: [{ name: 'Permenaker 4/1987' }],
  },
  {
    title: 'Jaminan Pensiun',
    description: 'Pekerja berhak atas jaminan pensiun melalui BPJS Ketenagakerjaan.',
    priority: 'high',
    conditions: and(gte('employeeCount', 1), inList('entityType', ['PT', 'CV'])),
    legalReferences: [{ name: 'PP 45/2015' }],
  },
  {
    title: 'Struktur dan Skala Upah',
    description: 'Perusahaan ≥10 karyawan wajib menyusun struktur dan skala upah.',
    priority: 'medium',
    conditions: and(gte('employeeCount', 10)),
    legalReferences: [{ name: 'Permenaker 1/2017' }],
  },
  {
    title: 'Pekerja Anak dan Perlindungan',
    description: 'Dilarang mempekerjakan anak di bawah 18 tahun kecuali kondisi khusus.',
    priority: 'critical',
    conditions: and(gte('employeeCount', 1)),
    legalReferences: [{ name: 'UU 13/2003 Pasal 68-75' }],
  },
  {
    title: 'Perlindungan Pekerja Perempuan',
    description: 'Pekerja perempuan berhak atas cuti haid, hamil, melahirkan sesuai UU.',
    priority: 'high',
    conditions: and(gte('employeeCount', 1)),
    legalReferences: [{ name: 'UU 13/2003 Pasal 76, 81-84' }],
  },
];

const perpajakanRules: RuleSeed[] = [
  {
    title: 'NPWP Badan Usaha',
    description: 'Setiap badan usaha wajib memiliki NPWP.',
    priority: 'critical',
    conditions: and(inList('entityType', ['PT', 'CV', 'Firma', 'Koperasi'])),
    legalReferences: [{ name: 'UU 28/2007 tentang KUP' }],
    guidanceText: 'Daftar di pajak.go.id atau kantor pajak terdekat.',
  },
  {
    title: 'NPWP Perorangan',
    description: 'Pengusaha perorangan dengan penghasilan di atas PTKP wajib NPWP.',
    priority: 'critical',
    conditions: and(inList('entityType', ['Perorangan', 'UMKM'])),
    legalReferences: [{ name: 'UU 28/2007' }],
  },
  {
    title: 'Pengusaha Kena Pajak (PKP)',
    description: 'Usaha dengan omzet >Rp 4,8M/tahun wajib dikukuhkan sebagai PKP.',
    priority: 'critical',
    conditions: and(inList('annualRevenue', ['above_4_8b', '1b_4_8b'])),
    legalReferences: [{ name: 'UU 42/2009 tentang PPN', name: 'PMK 197/2013' }],
  },
  {
    title: 'PPh Pasal 21 (Pajak Karyawan)',
    description: 'Pemotongan dan pelaporan PPh 21 atas gaji karyawan.',
    priority: 'critical',
    conditions: and(gte('employeeCount', 1)),
    legalReferences: [{ name: 'UU 36/2008 tentang PPh' }],
    guidanceText: 'Lapor dan setor setiap bulan paling lambat tanggal 10 dan 20.',
  },
  {
    title: 'PPN (Pajak Pertambahan Nilai)',
    description: 'PKP wajib memungut, menyetor, dan melaporkan PPN.',
    priority: 'critical',
    conditions: and(inList('annualRevenue', ['above_4_8b', '1b_4_8b'])),
    legalReferences: [{ name: 'UU 42/2009' }],
  },
  {
    title: 'SPT Tahunan Badan',
    description: 'Wajib melaporkan SPT Tahunan PPh Badan paling lambat 30 April.',
    priority: 'critical',
    conditions: and(inList('entityType', ['PT', 'CV', 'Firma', 'Koperasi'])),
    legalReferences: [{ name: 'UU 28/2007 Pasal 3' }],
  },
  {
    title: 'PPh Final UMKM 0,5%',
    description: 'UMKM dengan omzet <Rp 4,8M/tahun bisa menggunakan tarif PPh Final 0,5%.',
    priority: 'high',
    conditions: and(inList('annualRevenue', ['below_500m', '500m_1b'])),
    legalReferences: [{ name: 'PP 55/2022' }],
    guidanceText: 'Berlaku untuk WP badan max 4 tahun, WP OP max 7 tahun.',
  },
  {
    title: 'Faktur Pajak Elektronik (e-Faktur)',
    description: 'PKP wajib menerbitkan e-Faktur untuk setiap transaksi.',
    priority: 'high',
    conditions: and(inList('annualRevenue', ['above_4_8b', '1b_4_8b'])),
    legalReferences: [{ name: 'PER-03/PJ/2022' }],
  },
  {
    title: 'Pembukuan / Pencatatan',
    description: 'WP badan wajib menyelenggarakan pembukuan. WP OP omzet <Rp 4,8M boleh pencatatan.',
    priority: 'high',
    conditions: ALL,
    legalReferences: [{ name: 'UU 28/2007 Pasal 28' }],
  },
  {
    title: 'Pajak Daerah (PBB, Reklame, dll)',
    description: 'Usaha dengan lokasi fisik wajib membayar pajak daerah yang berlaku.',
    priority: 'medium',
    conditions: and(eq('isOnlineBusiness', false)),
    legalReferences: [{ name: 'UU 1/2022 tentang HKPD' }],
  },
];

const perlindunganDataRules: RuleSeed[] = [
  {
    title: 'Penunjukan Data Protection Officer (DPO)',
    description: 'Pengendali data berskala besar wajib menunjuk DPO.',
    priority: 'high',
    conditions: and(gte('employeeCount', 50)),
    legalReferences: [{ name: 'UU 27/2022 tentang PDP Pasal 53' }],
  },
  {
    title: 'Consent Management (Persetujuan)',
    description: 'Wajib mendapatkan persetujuan eksplisit sebelum memproses data pribadi.',
    priority: 'critical',
    conditions: ALL,
    legalReferences: [{ name: 'UU 27/2022 Pasal 20-22' }],
    guidanceText: 'Implementasikan consent form di setiap titik pengumpulan data.',
  },
  {
    title: 'Privacy Policy / Kebijakan Privasi',
    description: 'Wajib membuat dan mempublikasikan kebijakan privasi yang jelas.',
    priority: 'critical',
    conditions: ALL,
    legalReferences: [{ name: 'UU 27/2022 Pasal 21' }],
  },
  {
    title: 'Records of Processing Activities (ROPA)',
    description: 'Wajib mendokumentasikan semua aktivitas pemrosesan data pribadi.',
    priority: 'high',
    conditions: and(gte('employeeCount', 10)),
    legalReferences: [{ name: 'UU 27/2022 Pasal 29' }],
  },
  {
    title: 'Data Breach Notification',
    description: 'Wajib memberitahu subjek data dan otoritas dalam 3x24 jam jika terjadi kebocoran.',
    priority: 'critical',
    conditions: ALL,
    legalReferences: [{ name: 'UU 27/2022 Pasal 46' }],
  },
  {
    title: 'Data Processing Agreement (DPA)',
    description: 'Wajib membuat perjanjian dengan setiap pihak ketiga yang memproses data.',
    priority: 'high',
    conditions: ALL,
    legalReferences: [{ name: 'UU 27/2022 Pasal 35' }],
  },
  {
    title: 'Hak Subjek Data',
    description: 'Wajib menyediakan mekanisme untuk hak akses, koreksi, dan penghapusan data.',
    priority: 'high',
    conditions: ALL,
    legalReferences: [{ name: 'UU 27/2022 Pasal 5-13' }],
  },
  {
    title: 'Data Protection Impact Assessment (DPIA)',
    description: 'Wajib melakukan DPIA untuk pemrosesan berisiko tinggi.',
    priority: 'medium',
    conditions: and(gte('employeeCount', 50)),
    legalReferences: [{ name: 'UU 27/2022 Pasal 34' }],
  },
  {
    title: 'Penyimpanan Data di Indonesia',
    description: 'Data strategis wajib disimpan di server dalam wilayah Indonesia.',
    priority: 'high',
    conditions: ALL,
    legalReferences: [{ name: 'PP 71/2019 Pasal 20', name: 'UU 27/2022' }],
  },
  {
    title: 'Keamanan Sistem Elektronik',
    description: 'Wajib menerapkan standar keamanan informasi (enkripsi, access control, audit trail).',
    priority: 'high',
    conditions: ALL,
    legalReferences: [{ name: 'UU 27/2022 Pasal 35', name: 'PP 71/2019' }],
  },
];

// ──────────────────────────────────────────
// Seed runner
// ──────────────────────────────────────────
async function seedCompliance() {
  console.log('🌱 Seeding compliance data...\n');

  // 1. Create categories
  const catMap: Record<string, string> = {};
  for (const cat of categories) {
    const record = await prisma.complianceCategory.upsert({
      where: { id: cat.name }, // will fail, use create
      update: { name: cat.name, icon: cat.icon, sortOrder: cat.sortOrder },
      create: { name: cat.name, icon: cat.icon, sortOrder: cat.sortOrder },
    }).catch(async () => {
      // Upsert by name — find first or create
      const existing = await prisma.complianceCategory.findFirst({
        where: { name: cat.name },
      });
      if (existing) return existing;
      return prisma.complianceCategory.create({
        data: { name: cat.name, icon: cat.icon, sortOrder: cat.sortOrder },
      });
    });
    catMap[cat.name] = record.id;
    console.log(`  ✅ Category: ${cat.name} (${record.id})`);
  }

  // 2. Create rules
  const allRules: { category: string; rules: RuleSeed[] }[] = [
    { category: 'Perizinan', rules: perizinanRules },
    { category: 'Ketenagakerjaan', rules: ketenagakerjaanRules },
    { category: 'Perpajakan', rules: perpajakanRules },
    { category: 'Perlindungan Data', rules: perlindunganDataRules },
  ];

  let totalCreated = 0;
  for (const group of allRules) {
    const categoryId = catMap[group.category];
    for (const rule of group.rules) {
      const existing = await prisma.complianceRule.findFirst({
        where: { title: rule.title, categoryId },
      });
      if (existing) {
        console.log(`  ⏭️  Skip (exists): ${rule.title}`);
        continue;
      }
      await prisma.complianceRule.create({
        data: {
          title: rule.title,
          description: rule.description,
          categoryId,
          priority: rule.priority,
          conditions: rule.conditions,
          legalReferences: rule.legalReferences,
          guidanceText: rule.guidanceText,
          isPublished: true,
        },
      });
      totalCreated++;
    }
    console.log(`  📋 ${group.category}: ${group.rules.length} rules`);
  }

  console.log(`\n✅ Seed complete: ${totalCreated} rules created`);
  console.log(`   Categories: ${categories.length}`);
  console.log(`   Total rules: ${perizinanRules.length + ketenagakerjaanRules.length + perpajakanRules.length + perlindunganDataRules.length}`);
}

seedCompliance()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
