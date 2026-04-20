/**
 * Seed 5 MVP document templates into the database.
 * Run: npx ts-node prisma/seed-documents.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Reusable field groups ─────────────────

const COMPANY_FIELDS = [
  { name: 'companyName', label: 'Nama Perusahaan', type: 'text', required: true, autoFillKey: 'businessName' },
  { name: 'companyAddress', label: 'Alamat Perusahaan', type: 'text', required: true },
  { name: 'representativeName', label: 'Nama Perwakilan', type: 'text', required: true },
  { name: 'representativePosition', label: 'Jabatan Perwakilan', type: 'text', required: true },
];

const EMPLOYEE_FIELDS = [
  { name: 'employeeName', label: 'Nama Karyawan', type: 'text', required: true },
  { name: 'employeeAddress', label: 'Alamat Karyawan', type: 'text', required: true },
  { name: 'employeeIdNumber', label: 'No. KTP', type: 'text', required: true },
  { name: 'position', label: 'Jabatan', type: 'text', required: true },
  { name: 'department', label: 'Departemen', type: 'text' },
  { name: 'salary', label: 'Gaji Pokok (Rp)', type: 'number', required: true },
  { name: 'startDate', label: 'Tanggal Mulai', type: 'date', required: true },
];

// ── Template definitions ──────────────────

interface TemplateSeed {
  name: string;
  description: string;
  category: string;
  formSchema: object[];
  templateHtml: string;
  isPublished: boolean;
}

const TEMPLATES: TemplateSeed[] = [
  // 1. PKWT
  {
    name: 'Perjanjian Kerja Waktu Tertentu (PKWT)',
    description: 'Kontrak kerja dengan jangka waktu tertentu. Sesuai PP 35/2021.',
    category: 'Ketenagakerjaan',
    formSchema: [
      ...COMPANY_FIELDS,
      ...EMPLOYEE_FIELDS,
      { name: 'endDate', label: 'Tanggal Berakhir', type: 'date', required: true },
      { name: 'contractDuration', label: 'Durasi (bulan)', type: 'number', required: true },
      { name: 'jobDescription', label: 'Uraian Pekerjaan', type: 'textarea', required: true },
    ],
    templateHtml: `<div style="font-family:serif;max-width:700px;margin:0 auto;padding:40px;line-height:1.8">
<h1 style="text-align:center;font-size:18px;margin-bottom:4px">PERJANJIAN KERJA WAKTU TERTENTU</h1>
<p style="text-align:center;font-size:13px;color:#666;margin-bottom:30px">No: PKWT/{{companyName}}/{{startDate}}</p>
<p>Yang bertanda tangan di bawah ini:</p>
<table style="margin:15px 0"><tr><td style="width:160px">Nama</td><td>: <strong>{{representativeName}}</strong></td></tr><tr><td>Jabatan</td><td>: {{representativePosition}}</td></tr><tr><td>Perusahaan</td><td>: {{companyName}}</td></tr><tr><td>Alamat</td><td>: {{companyAddress}}</td></tr></table>
<p>Selanjutnya disebut <strong>PIHAK PERTAMA</strong>, dan:</p>
<table style="margin:15px 0"><tr><td style="width:160px">Nama</td><td>: <strong>{{employeeName}}</strong></td></tr><tr><td>No. KTP</td><td>: {{employeeIdNumber}}</td></tr><tr><td>Alamat</td><td>: {{employeeAddress}}</td></tr></table>
<p>Selanjutnya disebut <strong>PIHAK KEDUA</strong>.</p>
<h3 style="margin-top:25px">Pasal 1 — Ruang Lingkup</h3>
<p>PIHAK PERTAMA mempekerjakan PIHAK KEDUA sebagai <strong>{{position}}</strong> di departemen {{department}} dengan uraian pekerjaan: {{jobDescription}}</p>
<h3>Pasal 2 — Jangka Waktu</h3>
<p>Perjanjian berlaku selama <strong>{{contractDuration}} bulan</strong>, dari {{startDate}} sampai {{endDate}}.</p>
<h3>Pasal 3 — Kompensasi</h3>
<p>Gaji pokok sebesar <strong>Rp {{salary}}</strong> per bulan, dibayarkan setiap akhir bulan.</p>
<h3>Pasal 4 — Pemutusan Hubungan Kerja</h3>
<p>Pemutusan sebelum jangka waktu berakhir wajib memberikan kompensasi sesuai PP 35/2021 Pasal 17.</p>
<div style="margin-top:50px;display:flex;justify-content:space-between"><div style="text-align:center"><p>PIHAK PERTAMA</p><br/><br/><p style="border-top:1px solid #000;padding-top:5px">{{representativeName}}</p></div><div style="text-align:center"><p>PIHAK KEDUA</p><br/><br/><p style="border-top:1px solid #000;padding-top:5px">{{employeeName}}</p></div></div></div>`,
    isPublished: true,
  },

  // 2. PKWTT
  {
    name: 'Perjanjian Kerja Waktu Tidak Tertentu (PKWTT)',
    description: 'Kontrak kerja permanen tanpa batas waktu. Sesuai UU 13/2003.',
    category: 'Ketenagakerjaan',
    formSchema: [
      ...COMPANY_FIELDS,
      ...EMPLOYEE_FIELDS,
      { name: 'probationMonths', label: 'Masa Percobaan (bulan)', type: 'number', placeholder: '3' },
      { name: 'jobDescription', label: 'Uraian Pekerjaan', type: 'textarea', required: true },
    ],
    templateHtml: `<div style="font-family:serif;max-width:700px;margin:0 auto;padding:40px;line-height:1.8">
<h1 style="text-align:center;font-size:18px;margin-bottom:4px">PERJANJIAN KERJA WAKTU TIDAK TERTENTU</h1>
<p style="text-align:center;font-size:13px;color:#666;margin-bottom:30px">No: PKWTT/{{companyName}}/{{startDate}}</p>
<p>Yang bertanda tangan di bawah ini:</p>
<table style="margin:15px 0"><tr><td style="width:160px">Nama</td><td>: <strong>{{representativeName}}</strong></td></tr><tr><td>Jabatan</td><td>: {{representativePosition}}</td></tr><tr><td>Perusahaan</td><td>: {{companyName}}</td></tr></table>
<p>Selanjutnya disebut <strong>PIHAK PERTAMA</strong>, dan:</p>
<table style="margin:15px 0"><tr><td style="width:160px">Nama</td><td>: <strong>{{employeeName}}</strong></td></tr><tr><td>No. KTP</td><td>: {{employeeIdNumber}}</td></tr><tr><td>Alamat</td><td>: {{employeeAddress}}</td></tr></table>
<p>Selanjutnya disebut <strong>PIHAK KEDUA</strong>.</p>
<h3 style="margin-top:25px">Pasal 1 — Pengangkatan</h3>
<p>PIHAK PERTAMA mengangkat PIHAK KEDUA sebagai karyawan tetap dengan jabatan <strong>{{position}}</strong> di departemen {{department}}.</p>
<h3>Pasal 2 — Masa Percobaan</h3>
<p>Masa percobaan selama <strong>{{probationMonths}} bulan</strong> terhitung sejak {{startDate}}.</p>
<h3>Pasal 3 — Kompensasi</h3>
<p>Gaji pokok sebesar <strong>Rp {{salary}}</strong> per bulan.</p>
<h3>Pasal 4 — Uraian Pekerjaan</h3>
<p>{{jobDescription}}</p>
<h3>Pasal 5 — Pemutusan</h3>
<p>Pemutusan hubungan kerja mengacu pada ketentuan UU 13/2003 tentang Ketenagakerjaan.</p>
<div style="margin-top:50px;display:flex;justify-content:space-between"><div style="text-align:center"><p>PIHAK PERTAMA</p><br/><br/><p style="border-top:1px solid #000;padding-top:5px">{{representativeName}}</p></div><div style="text-align:center"><p>PIHAK KEDUA</p><br/><br/><p style="border-top:1px solid #000;padding-top:5px">{{employeeName}}</p></div></div></div>`,
    isPublished: true,
  },

  // 3. NDA
  {
    name: 'Non-Disclosure Agreement (NDA)',
    description: 'Perjanjian kerahasiaan untuk melindungi informasi bisnis.',
    category: 'Kontrak',
    formSchema: [
      ...COMPANY_FIELDS,
      { name: 'secondPartyName', label: 'Nama Pihak Kedua', type: 'text', required: true },
      { name: 'secondPartyCompany', label: 'Perusahaan Pihak Kedua', type: 'text' },
      { name: 'secondPartyAddress', label: 'Alamat Pihak Kedua', type: 'text', required: true },
      { name: 'effectiveDate', label: 'Tanggal Efektif', type: 'date', required: true },
      { name: 'ndaDuration', label: 'Durasi NDA (tahun)', type: 'number', required: true, placeholder: '2' },
      { name: 'confidentialScope', label: 'Lingkup Informasi Rahasia', type: 'textarea', required: true },
      { name: 'penaltyAmount', label: 'Denda Pelanggaran (Rp)', type: 'number' },
    ],
    templateHtml: `<div style="font-family:serif;max-width:700px;margin:0 auto;padding:40px;line-height:1.8">
<h1 style="text-align:center;font-size:18px;margin-bottom:4px">PERJANJIAN KERAHASIAAN<br/>(NON-DISCLOSURE AGREEMENT)</h1>
<p style="text-align:center;font-size:13px;color:#666;margin-bottom:30px">Tanggal: {{effectiveDate}}</p>
<p>Perjanjian ini dibuat oleh dan antara:</p>
<table style="margin:15px 0"><tr><td style="width:160px">Nama</td><td>: <strong>{{representativeName}}</strong></td></tr><tr><td>Perusahaan</td><td>: {{companyName}}</td></tr><tr><td>Alamat</td><td>: {{companyAddress}}</td></tr></table>
<p>Selanjutnya disebut <strong>"Pihak Pengungkap"</strong>, dan:</p>
<table style="margin:15px 0"><tr><td style="width:160px">Nama</td><td>: <strong>{{secondPartyName}}</strong></td></tr><tr><td>Perusahaan</td><td>: {{secondPartyCompany}}</td></tr><tr><td>Alamat</td><td>: {{secondPartyAddress}}</td></tr></table>
<p>Selanjutnya disebut <strong>"Pihak Penerima"</strong>.</p>
<h3 style="margin-top:25px">Pasal 1 — Definisi Informasi Rahasia</h3>
<p>{{confidentialScope}}</p>
<h3>Pasal 2 — Jangka Waktu</h3>
<p>NDA berlaku selama <strong>{{ndaDuration}} tahun</strong> sejak {{effectiveDate}}.</p>
<h3>Pasal 3 — Kewajiban</h3>
<p>Pihak Penerima wajib menjaga kerahasiaan dan tidak mengungkapkan informasi tanpa persetujuan tertulis.</p>
<h3>Pasal 4 — Sanksi</h3>
<p>Pelanggaran dikenakan denda sebesar <strong>Rp {{penaltyAmount}}</strong> dan/atau tuntutan hukum.</p>
<div style="margin-top:50px;display:flex;justify-content:space-between"><div style="text-align:center"><p>PIHAK PENGUNGKAP</p><br/><br/><p style="border-top:1px solid #000;padding-top:5px">{{representativeName}}</p></div><div style="text-align:center"><p>PIHAK PENERIMA</p><br/><br/><p style="border-top:1px solid #000;padding-top:5px">{{secondPartyName}}</p></div></div></div>`,
    isPublished: true,
  },

  // 4. PKS (Perjanjian Kerjasama) — NEW in Phase 12
  {
    name: 'Perjanjian Kerjasama (PKS)',
    description: 'Perjanjian kerjasama bisnis antar dua pihak. Cocok untuk partnership, joint venture, atau kolaborasi proyek.',
    category: 'Kontrak',
    formSchema: [
      ...COMPANY_FIELDS,
      { name: 'partnerName', label: 'Nama Pihak Kedua', type: 'text', required: true },
      { name: 'partnerCompany', label: 'Perusahaan Pihak Kedua', type: 'text', required: true },
      { name: 'partnerAddress', label: 'Alamat Pihak Kedua', type: 'text', required: true },
      { name: 'partnerPosition', label: 'Jabatan Pihak Kedua', type: 'text', required: true },
      { name: 'cooperationScope', label: 'Ruang Lingkup Kerjasama', type: 'textarea', required: true },
      { name: 'effectiveDate', label: 'Tanggal Efektif', type: 'date', required: true },
      { name: 'pksDuration', label: 'Durasi Kerjasama (bulan)', type: 'number', required: true },
      { name: 'revenueSharing', label: 'Pembagian Keuntungan', type: 'text', placeholder: '50:50' },
      { name: 'firstPartyObligation', label: 'Kewajiban Pihak Pertama', type: 'textarea', required: true },
      { name: 'secondPartyObligation', label: 'Kewajiban Pihak Kedua', type: 'textarea', required: true },
      { name: 'terminationClause', label: 'Ketentuan Pemutusan', type: 'textarea' },
    ],
    templateHtml: `<div style="font-family:serif;max-width:700px;margin:0 auto;padding:40px;line-height:1.8">
<h1 style="text-align:center;font-size:18px;margin-bottom:4px">PERJANJIAN KERJASAMA</h1>
<p style="text-align:center;font-size:13px;color:#666;margin-bottom:30px">No: PKS/{{companyName}}/{{effectiveDate}}</p>
<p>Yang bertanda tangan di bawah ini:</p>
<table style="margin:15px 0"><tr><td style="width:160px">Nama</td><td>: <strong>{{representativeName}}</strong></td></tr><tr><td>Jabatan</td><td>: {{representativePosition}}</td></tr><tr><td>Perusahaan</td><td>: {{companyName}}</td></tr><tr><td>Alamat</td><td>: {{companyAddress}}</td></tr></table>
<p>Selanjutnya disebut <strong>PIHAK PERTAMA</strong>, dan:</p>
<table style="margin:15px 0"><tr><td style="width:160px">Nama</td><td>: <strong>{{partnerName}}</strong></td></tr><tr><td>Jabatan</td><td>: {{partnerPosition}}</td></tr><tr><td>Perusahaan</td><td>: {{partnerCompany}}</td></tr><tr><td>Alamat</td><td>: {{partnerAddress}}</td></tr></table>
<p>Selanjutnya disebut <strong>PIHAK KEDUA</strong>.</p>
<p>Para Pihak sepakat untuk mengadakan perjanjian kerjasama dengan ketentuan sebagai berikut:</p>
<h3 style="margin-top:25px">Pasal 1 — Ruang Lingkup Kerjasama</h3>
<p>{{cooperationScope}}</p>
<h3>Pasal 2 — Jangka Waktu</h3>
<p>Perjanjian ini berlaku selama <strong>{{pksDuration}} bulan</strong> terhitung sejak {{effectiveDate}} dan dapat diperpanjang atas kesepakatan bersama.</p>
<h3>Pasal 3 — Kewajiban Para Pihak</h3>
<h4>3.1 Kewajiban PIHAK PERTAMA:</h4>
<p>{{firstPartyObligation}}</p>
<h4>3.2 Kewajiban PIHAK KEDUA:</h4>
<p>{{secondPartyObligation}}</p>
<h3>Pasal 4 — Pembagian Keuntungan</h3>
<p>Pembagian hasil kerjasama disepakati dengan rasio <strong>{{revenueSharing}}</strong> antara PIHAK PERTAMA dan PIHAK KEDUA.</p>
<h3>Pasal 5 — Pemutusan Kerjasama</h3>
<p>{{terminationClause}}</p>
<h3>Pasal 6 — Penyelesaian Sengketa</h3>
<p>Sengketa diselesaikan secara musyawarah. Apabila tidak tercapai, akan diselesaikan melalui Badan Arbitrase Nasional Indonesia (BANI).</p>
<div style="margin-top:50px;display:flex;justify-content:space-between"><div style="text-align:center"><p>PIHAK PERTAMA</p><br/><br/><p style="border-top:1px solid #000;padding-top:5px">{{representativeName}}</p></div><div style="text-align:center"><p>PIHAK KEDUA</p><br/><br/><p style="border-top:1px solid #000;padding-top:5px">{{partnerName}}</p></div></div></div>`,
    isPublished: true,
  },

  // 5. Kontrak Freelance — NEW in Phase 12
  {
    name: 'Kontrak Freelance / Jasa',
    description: 'Perjanjian kerja lepas untuk freelancer atau konsultan. Mencakup scope, deliverable, dan pembayaran.',
    category: 'Kontrak',
    formSchema: [
      ...COMPANY_FIELDS,
      { name: 'freelancerName', label: 'Nama Freelancer', type: 'text', required: true },
      { name: 'freelancerAddress', label: 'Alamat Freelancer', type: 'text', required: true },
      { name: 'freelancerIdNumber', label: 'No. KTP Freelancer', type: 'text', required: true },
      { name: 'freelancerNpwp', label: 'NPWP Freelancer', type: 'text' },
      { name: 'projectName', label: 'Nama Proyek', type: 'text', required: true },
      { name: 'scopeOfWork', label: 'Lingkup Pekerjaan', type: 'textarea', required: true },
      { name: 'deliverables', label: 'Deliverables', type: 'textarea', required: true },
      { name: 'startDate', label: 'Tanggal Mulai', type: 'date', required: true },
      { name: 'endDate', label: 'Tanggal Selesai', type: 'date', required: true },
      { name: 'totalFee', label: 'Total Fee (Rp)', type: 'number', required: true },
      { name: 'paymentTerms', label: 'Termin Pembayaran', type: 'select', required: true, options: [
        { label: '100% di muka', value: 'upfront' },
        { label: '50% DP + 50% selesai', value: 'half' },
        { label: '30% DP + 40% progress + 30% final', value: 'milestone' },
        { label: '100% setelah selesai', value: 'completion' },
      ]},
      { name: 'revisionLimit', label: 'Batas Revisi', type: 'number', placeholder: '3' },
      { name: 'ipOwnership', label: 'Kepemilikan HKI', type: 'select', required: true, options: [
        { label: 'Sepenuhnya milik klien', value: 'client' },
        { label: 'Sepenuhnya milik freelancer', value: 'freelancer' },
        { label: 'Shared / lisensi', value: 'shared' },
      ]},
    ],
    templateHtml: `<div style="font-family:serif;max-width:700px;margin:0 auto;padding:40px;line-height:1.8">
<h1 style="text-align:center;font-size:18px;margin-bottom:4px">PERJANJIAN KERJA LEPAS / FREELANCE</h1>
<p style="text-align:center;font-size:13px;color:#666;margin-bottom:30px">No: FRL/{{companyName}}/{{startDate}}</p>
<p>Yang bertanda tangan di bawah ini:</p>
<table style="margin:15px 0"><tr><td style="width:160px">Nama</td><td>: <strong>{{representativeName}}</strong></td></tr><tr><td>Jabatan</td><td>: {{representativePosition}}</td></tr><tr><td>Perusahaan</td><td>: {{companyName}}</td></tr><tr><td>Alamat</td><td>: {{companyAddress}}</td></tr></table>
<p>Selanjutnya disebut <strong>PIHAK PERTAMA (Klien)</strong>, dan:</p>
<table style="margin:15px 0"><tr><td style="width:160px">Nama</td><td>: <strong>{{freelancerName}}</strong></td></tr><tr><td>No. KTP</td><td>: {{freelancerIdNumber}}</td></tr><tr><td>NPWP</td><td>: {{freelancerNpwp}}</td></tr><tr><td>Alamat</td><td>: {{freelancerAddress}}</td></tr></table>
<p>Selanjutnya disebut <strong>PIHAK KEDUA (Freelancer)</strong>.</p>
<h3 style="margin-top:25px">Pasal 1 — Proyek</h3>
<p>PIHAK KEDUA ditugaskan untuk mengerjakan proyek: <strong>{{projectName}}</strong></p>
<h3>Pasal 2 — Lingkup Pekerjaan</h3>
<p>{{scopeOfWork}}</p>
<h3>Pasal 3 — Deliverables</h3>
<p>{{deliverables}}</p>
<h3>Pasal 4 — Jangka Waktu</h3>
<p>Pekerjaan dimulai pada <strong>{{startDate}}</strong> dan harus selesai paling lambat <strong>{{endDate}}</strong>.</p>
<h3>Pasal 5 — Kompensasi</h3>
<p>Total fee sebesar <strong>Rp {{totalFee}}</strong> dengan termin pembayaran: <strong>{{paymentTerms}}</strong>.</p>
<h3>Pasal 6 — Revisi</h3>
<p>PIHAK KEDUA menyediakan maksimal <strong>{{revisionLimit}} kali revisi</strong>. Revisi tambahan dikenakan biaya terpisah.</p>
<h3>Pasal 7 — Hak Kekayaan Intelektual</h3>
<p>Kepemilikan hasil kerja: <strong>{{ipOwnership}}</strong>.</p>
<h3>Pasal 8 — Kerahasiaan</h3>
<p>Kedua pihak wajib menjaga kerahasiaan informasi yang diperoleh selama kerjasama.</p>
<h3>Pasal 9 — Status Hubungan Kerja</h3>
<p>PIHAK KEDUA berstatus sebagai pekerja lepas, BUKAN karyawan PIHAK PERTAMA. Tidak ada hubungan kerja ketenagakerjaan.</p>
<div style="margin-top:50px;display:flex;justify-content:space-between"><div style="text-align:center"><p>PIHAK PERTAMA</p><br/><br/><p style="border-top:1px solid #000;padding-top:5px">{{representativeName}}</p></div><div style="text-align:center"><p>PIHAK KEDUA</p><br/><br/><p style="border-top:1px solid #000;padding-top:5px">{{freelancerName}}</p></div></div></div>`,
    isPublished: true,
  },
];

async function seedDocumentTemplates(): Promise<void> {
  console.log('🔄 Seeding document templates...');

  for (const tpl of TEMPLATES) {
    const existing = await prisma.documentTemplate.findFirst({
      where: { name: tpl.name },
    });

    if (existing) {
      console.log(`  ⏭️  Skip (exists): ${tpl.name}`);
      continue;
    }

    await prisma.documentTemplate.create({
      data: {
        name: tpl.name,
        description: tpl.description,
        category: tpl.category,
        templateHtml: tpl.templateHtml,
        formSchema: tpl.formSchema,
        isPublished: tpl.isPublished,
        version: 1,
      },
    });
    console.log(`  ✅ Created: ${tpl.name}`);
  }

  const count = await prisma.documentTemplate.count();
  console.log(`\n📋 Total templates in DB: ${count}`);
}

seedDocumentTemplates()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
