import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** 6 regulasi prioritas MVP — ringkasan pasal-pasal kunci */
const regulations = [
  {
    title: 'UU No. 13 Tahun 2003 tentang Ketenagakerjaan',
    regulationNumber: 'UU 13/2003',
    type: 'UU',
    issuedBy: 'DPR RI',
    issuedDate: new Date('2003-03-25'),
    effectiveDate: new Date('2003-03-25'),
    status: 'active',
    sectorTags: ['all'],
    sourceUrl: 'https://jdih.kemnaker.go.id/data_puu/UU_13_2003.pdf',
    contentRaw: `UNDANG-UNDANG REPUBLIK INDONESIA NOMOR 13 TAHUN 2003 TENTANG KETENAGAKERJAAN

BAB I KETENTUAN UMUM
Pasal 1: Ketenagakerjaan adalah segala hal yang berhubungan dengan tenaga kerja pada waktu sebelum, selama, dan sesudah masa kerja. Tenaga kerja adalah setiap orang yang mampu melakukan pekerjaan guna menghasilkan barang dan/atau jasa baik untuk memenuhi kebutuhan sendiri maupun untuk masyarakat. Pekerja/buruh adalah setiap orang yang bekerja dengan menerima upah atau imbalan dalam bentuk lain. Pemberi kerja adalah orang perseorangan, pengusaha, badan hukum, atau badan-badan lainnya yang mempekerjakan tenaga kerja dengan membayar upah atau imbalan dalam bentuk lain.

BAB X PERLINDUNGAN, PENGUPAHAN, DAN KESEJAHTERAAN
Pasal 77: Setiap pengusaha wajib melaksanakan ketentuan waktu kerja. Waktu kerja meliputi: 7 jam 1 hari dan 40 jam 1 minggu untuk 6 hari kerja dalam 1 minggu; atau 8 jam 1 hari dan 40 jam 1 minggu untuk 5 hari kerja dalam 1 minggu.

Pasal 78: Pengusaha yang mempekerjakan pekerja melebihi waktu kerja wajib membayar upah kerja lembur. Waktu kerja lembur hanya dapat dilakukan paling banyak 3 jam dalam 1 hari dan 14 jam dalam 1 minggu.

Pasal 79: Pengusaha wajib memberi waktu istirahat dan cuti kepada pekerja/buruh. Istirahat mingguan 1 hari untuk 6 hari kerja dan 2 hari untuk 5 hari kerja. Cuti tahunan sekurang-kurangnya 12 hari kerja setelah pekerja bekerja selama 12 bulan secara terus menerus.

Pasal 88: Setiap pekerja/buruh berhak memperoleh penghasilan yang memenuhi penghidupan yang layak bagi kemanusiaan. Pemerintah menetapkan kebijakan pengupahan yang melindungi pekerja/buruh. Upah minimum ditetapkan berdasarkan kebutuhan hidup layak dengan memperhatikan produktivitas dan pertumbuhan ekonomi.

Pasal 90: Pengusaha dilarang membayar upah lebih rendah dari upah minimum. Bagi pengusaha yang tidak mampu membayar upah minimum dapat dilakukan penangguhan.

BAB XI HUBUNGAN INDUSTRIAL
Pasal 108: Pengusaha yang mempekerjakan pekerja sekurang-kurangnya 10 orang wajib membuat peraturan perusahaan yang mulai berlaku setelah disahkan oleh Menteri atau pejabat yang ditunjuk.

BAB XII PEMUTUSAN HUBUNGAN KERJA
Pasal 150: Ketentuan mengenai pemutusan hubungan kerja dalam undang-undang ini meliputi pemutusan hubungan kerja yang terjadi di badan usaha yang berbadan hukum atau tidak, milik orang perseorangan, milik persekutuan atau milik badan hukum.

Pasal 156: Dalam hal terjadi pemutusan hubungan kerja, pengusaha diwajibkan membayar uang pesangon dan/atau uang penghargaan masa kerja dan uang penggantian hak yang seharusnya diterima.`,
  },
  {
    title: 'PP No. 35 Tahun 2021 tentang PKWT, Alih Daya, Waktu Kerja, Hubungan Kerja dan PHK',
    regulationNumber: 'PP 35/2021',
    type: 'PP',
    issuedBy: 'Presiden RI',
    issuedDate: new Date('2021-02-02'),
    effectiveDate: new Date('2021-02-02'),
    status: 'active',
    sectorTags: ['all'],
    sourceUrl: 'https://jdih.kemnaker.go.id/data_puu/PP_35_2021.pdf',
    contentRaw: `PERATURAN PEMERINTAH REPUBLIK INDONESIA NOMOR 35 TAHUN 2021 TENTANG PERJANJIAN KERJA WAKTU TERTENTU, ALIH DAYA, WAKTU KERJA DAN WAKTU ISTIRAHAT, DAN PEMUTUSAN HUBUNGAN KERJA

BAB II PERJANJIAN KERJA WAKTU TERTENTU (PKWT)
Pasal 4: PKWT didasarkan atas jangka waktu atau selesainya suatu pekerjaan tertentu. PKWT berdasarkan jangka waktu dibuat untuk pekerjaan yang jenis dan sifat atau kegiatannya bersifat tidak tetap.
Pasal 5: PKWT berdasarkan jangka waktu dapat dibuat untuk paling lama 5 tahun termasuk perpanjangan.
Pasal 8: Dalam hal PKWT berdasarkan jangka waktu berakhir, Pengusaha wajib memberikan uang kompensasi kepada Pekerja/Buruh.
Pasal 15: Besaran uang kompensasi diberikan sesuai ketentuan: PKWT selama 12 bulan secara terus menerus diberikan sebesar 1 bulan Upah. PKWT selama 1-6 bulan dihitung secara proporsional.

BAB III ALIH DAYA (OUTSOURCING)
Pasal 18: Hubungan kerja antara perusahaan alih daya dengan pekerja/buruh yang dipekerjakan didasarkan pada PKWT atau PKWTT.
Pasal 19: Perlindungan pekerja/buruh, upah, kesejahteraan, syarat kerja, dan perselisihan yang timbul dilaksanakan sekurang-kurangnya sesuai dengan ketentuan peraturan perundang-undangan.

BAB IV WAKTU KERJA DAN WAKTU ISTIRAHAT
Pasal 21: Waktu kerja meliputi: 7 jam sehari dan 40 jam seminggu untuk 6 hari kerja; atau 8 jam sehari dan 40 jam seminggu untuk 5 hari kerja. Bagi sektor usaha atau pekerjaan tertentu dapat menerapkan waktu kerja kurang dari ketentuan tersebut.
Pasal 26: Waktu kerja lembur hanya dapat dilakukan paling lama 4 jam dalam 1 hari dan 18 jam dalam 1 minggu.
Pasal 28: Perusahaan yang mempekerjakan pekerja pada hari libur resmi wajib membayar upah kerja lembur.

BAB V PEMUTUSAN HUBUNGAN KERJA (PHK)
Pasal 36: PHK dapat terjadi karena: perusahaan melakukan penggabungan/peleburan; perusahaan dalam keadaan merugi; pekerja melakukan pelanggaran; pekerja mengundurkan diri.
Pasal 40: Pemberian uang pesangon, uang penghargaan masa kerja, dan uang penggantian hak dihitung berdasarkan masa kerja pekerja.`,
  },
  {
    title: 'PP No. 36 Tahun 2021 tentang Pengupahan (Pelaksanaan UU Cipta Kerja)',
    regulationNumber: 'PP 36/2021',
    type: 'PP',
    issuedBy: 'Presiden RI',
    issuedDate: new Date('2021-02-02'),
    effectiveDate: new Date('2021-02-02'),
    status: 'active',
    sectorTags: ['all'],
    sourceUrl: 'https://jdih.kemnaker.go.id/data_puu/PP_36_2021.pdf',
    contentRaw: `PERATURAN PEMERINTAH REPUBLIK INDONESIA NOMOR 36 TAHUN 2021 TENTANG PENGUPAHAN

BAB I KETENTUAN UMUM
Pasal 1: Upah adalah hak pekerja/buruh yang diterima dan dinyatakan dalam bentuk uang sebagai imbalan dari pengusaha yang ditetapkan dan dibayarkan menurut suatu perjanjian kerja, kesepakatan, atau peraturan perundang-undangan.

BAB II KEBIJAKAN PENGUPAHAN
Pasal 4: Kebijakan pengupahan meliputi: upah minimum, struktur dan skala upah, upah kerja lembur, upah tidak masuk kerja dan/atau tidak melakukan pekerjaan karena alasan tertentu, bentuk dan cara pembayaran upah, hal-hal yang dapat diperhitungkan dengan upah, dan upah sebagai dasar perhitungan atau pembayaran hak dan kewajiban lainnya.

BAB III UPAH MINIMUM
Pasal 23: Upah Minimum berlaku bagi pekerja/buruh dengan masa kerja kurang dari 1 tahun pada perusahaan yang bersangkutan. Upah bagi pekerja dengan masa kerja 1 tahun atau lebih berpedoman pada struktur dan skala upah.
Pasal 25: Upah minimum provinsi (UMP) ditetapkan oleh gubernur. Upah minimum kabupaten/kota (UMK) dapat ditetapkan dengan syarat tertentu.
Pasal 36: Usaha mikro dan kecil dikecualikan dari ketentuan upah minimum. Upah pada usaha mikro dan kecil ditetapkan berdasarkan kesepakatan antara pengusaha dengan pekerja. Upah tersebut sekurang-kurangnya sebesar persentase tertentu dari rata-rata konsumsi masyarakat tingkat provinsi.

BAB V STRUKTUR DAN SKALA UPAH
Pasal 46: Pengusaha wajib menyusun dan menerapkan struktur dan skala upah di perusahaan dengan memperhatikan kemampuan perusahaan dan produktivitas. Struktur dan skala upah wajib diberitahukan kepada seluruh pekerja/buruh.

BAB VI UPAH KERJA LEMBUR
Pasal 55: Pengusaha yang mempekerjakan pekerja/buruh melebihi waktu kerja wajib membayar upah kerja lembur. Perhitungan upah kerja lembur didasarkan pada upah bulanan. Cara menghitung upah sejam adalah 1/173 kali upah sebulan.
Pasal 58: Upah lembur jam pertama dibayar 1.5 kali upah sejam. Upah lembur jam berikutnya dibayar 2 kali upah sejam.`,
  },
  {
    title: 'PP No. 7 Tahun 2021 tentang Kemudahan, Pelindungan, dan Pemberdayaan KUMKM',
    regulationNumber: 'PP 7/2021',
    type: 'PP',
    issuedBy: 'Presiden RI',
    issuedDate: new Date('2021-02-02'),
    effectiveDate: new Date('2021-02-02'),
    status: 'active',
    sectorTags: ['all'],
    sourceUrl: 'https://peraturan.bpk.go.id/Details/161833/pp-no-7-tahun-2021',
    contentRaw: `PERATURAN PEMERINTAH REPUBLIK INDONESIA NOMOR 7 TAHUN 2021 TENTANG KEMUDAHAN, PELINDUNGAN, DAN PEMBERDAYAAN KOPERASI DAN USAHA MIKRO, KECIL, DAN MENENGAH

BAB I KETENTUAN UMUM
Pasal 1: Usaha Mikro adalah usaha produktif milik orang perorangan dan/atau badan usaha perorangan yang memenuhi kriteria modal usaha paling banyak Rp1.000.000.000 atau hasil penjualan tahunan paling banyak Rp2.000.000.000. Usaha Kecil memenuhi kriteria modal usaha Rp1-5 miliar atau hasil penjualan tahunan Rp2-15 miliar. Usaha Menengah memenuhi kriteria modal usaha Rp5-10 miliar atau hasil penjualan tahunan Rp15-50 miliar.

BAB II PERIZINAN USAHA
Pasal 7: Perizinan Berusaha meliputi Perizinan Berusaha berbasis risiko dan/atau Perizinan Berusaha untuk menunjang kegiatan usaha.
Pasal 8: Perizinan Berusaha berbasis risiko didasarkan pada penetapan tingkat risiko dan peringkat skala kegiatan usaha. Tingkat risiko meliputi: rendah, menengah rendah, menengah tinggi, dan tinggi.
Pasal 9: Perizinan Berusaha untuk kegiatan usaha berisiko rendah berupa Nomor Induk Berusaha (NIB). NIB berlaku sebagai identitas berusaha dan legalitas untuk melaksanakan kegiatan usaha.
Pasal 10: Perizinan Berusaha untuk kegiatan usaha berisiko menengah rendah berupa NIB dan Sertifikat Standar. Perizinan untuk berisiko menengah tinggi berupa NIB dan Sertifikat Standar yang terverifikasi.
Pasal 11: Perizinan Berusaha untuk kegiatan usaha berisiko tinggi berupa NIB dan Izin.

BAB IV PEMBERDAYAAN
Pasal 83: Pemerintah dan Pemerintah Daerah memberikan kemudahan, pelindungan, dan pemberdayaan bagi UMKM. Pemberdayaan dilakukan melalui: kemudahan perizinan, pendampingan, fasilitasi pembiayaan, dan akses pasar.
Pasal 91: Usaha Mikro dan Kecil mendapat insentif pajak penghasilan berdasarkan ketentuan perundang-undangan di bidang perpajakan. Pemerintah memberikan kemudahan perpajakan bagi UMKM.`,
  },
  {
    title: 'UU No. 40 Tahun 2007 tentang Perseroan Terbatas',
    regulationNumber: 'UU 40/2007',
    type: 'UU',
    issuedBy: 'DPR RI',
    issuedDate: new Date('2007-08-16'),
    effectiveDate: new Date('2007-08-16'),
    status: 'active',
    sectorTags: ['all'],
    sourceUrl: 'https://peraturan.bpk.go.id/Details/39965/uu-no-40-tahun-2007',
    contentRaw: `UNDANG-UNDANG REPUBLIK INDONESIA NOMOR 40 TAHUN 2007 TENTANG PERSEROAN TERBATAS

BAB I KETENTUAN UMUM
Pasal 1: Perseroan Terbatas (PT) adalah badan hukum yang merupakan persekutuan modal, didirikan berdasarkan perjanjian, melakukan kegiatan usaha dengan modal dasar yang seluruhnya terbagi dalam saham dan memenuhi persyaratan yang ditetapkan dalam undang-undang ini serta peraturan pelaksanaannya.

BAB II PENDIRIAN, ANGGARAN DASAR, DAN PERUBAHAN ANGGARAN DASAR
Pasal 7: Perseroan didirikan oleh 2 (dua) orang atau lebih dengan akta notaris yang dibuat dalam bahasa Indonesia. Setiap pendiri Perseroan wajib mengambil bagian saham pada saat Perseroan didirikan.
Pasal 8: Akta pendirian memuat anggaran dasar dan keterangan lain berkaitan dengan pendirian Perseroan. Keterangan lain sekurang-kurangnya: nama lengkap, tempat dan tanggal lahir pendiri, susunan, nama lengkap anggota Direksi dan Dewan Komisaris.
Pasal 32: Modal dasar Perseroan paling sedikit Rp50.000.000 (lima puluh juta rupiah). Undang-Undang yang mengatur kegiatan usaha tertentu dapat menentukan jumlah minimum modal Perseroan yang lebih besar.

BAB VII DIREKSI DAN DEWAN KOMISARIS
Pasal 92: Direksi menjalankan pengurusan Perseroan untuk kepentingan Perseroan dan sesuai dengan maksud dan tujuan Perseroan. Direksi berwenang menjalankan pengurusan sesuai kebijakan yang dipandang tepat dalam batas yang ditentukan undang-undang dan/atau anggaran dasar.
Pasal 97: Direksi bertanggung jawab penuh atas pengurusan Perseroan. Setiap anggota Direksi bertanggung jawab secara pribadi jika bersalah atau lalai menjalankan tugasnya.
Pasal 108: Dewan Komisaris melakukan pengawasan atas kebijakan pengurusan, jalannya pengurusan baik mengenai Perseroan maupun usaha Perseroan, dan memberi nasihat kepada Direksi.

BAB VIII RAPAT UMUM PEMEGANG SAHAM (RUPS)
Pasal 78: RUPS terdiri atas RUPS tahunan dan RUPS lainnya. RUPS tahunan wajib diadakan setiap tahun paling lambat 6 bulan setelah tahun buku berakhir. Dalam RUPS tahunan harus diajukan semua dokumen dari laporan tahunan Perseroan.`,
  },
  {
    title: 'PP No. 23 Tahun 2018 tentang Pajak Penghasilan atas Penghasilan dari Usaha (PPh Final UMKM)',
    regulationNumber: 'PP 23/2018',
    type: 'PP',
    issuedBy: 'Presiden RI',
    issuedDate: new Date('2018-06-22'),
    effectiveDate: new Date('2018-07-01'),
    status: 'active',
    sectorTags: ['all'],
    sourceUrl: 'https://peraturan.bpk.go.id/Details/95387/pp-no-23-tahun-2018',
    contentRaw: `PERATURAN PEMERINTAH REPUBLIK INDONESIA NOMOR 23 TAHUN 2018 TENTANG PAJAK PENGHASILAN ATAS PENGHASILAN DARI USAHA YANG DITERIMA ATAU DIPEROLEH WAJIB PAJAK YANG MEMILIKI PEREDARAN BRUTO TERTENTU

BAB I KETENTUAN UMUM
Pasal 1: Atas penghasilan dari usaha yang diterima atau diperoleh Wajib Pajak dalam negeri yang memiliki peredaran bruto tertentu, dikenai Pajak Penghasilan yang bersifat final dalam jangka waktu tertentu.

BAB II OBJEK DAN SUBJEK PAJAK
Pasal 2: Atas penghasilan dari usaha yang diterima atau diperoleh Wajib Pajak dalam negeri yang memiliki peredaran bruto tertentu dikenai Pajak Penghasilan yang bersifat final. Peredaran bruto tertentu yaitu tidak melebihi Rp4.800.000.000 (empat miliar delapan ratus juta rupiah) dalam 1 Tahun Pajak.
Pasal 3: Wajib Pajak yang dikenai PP ini adalah: orang pribadi, badan berbentuk koperasi, persekutuan komanditer, firma, perseroan terbatas.

BAB III TARIF DAN JANGKA WAKTU
Pasal 4: Tarif Pajak Penghasilan yang bersifat final sebesar 0,5% (nol koma lima persen). CATATAN: Mulai tahun 2025, berdasarkan peraturan terbaru, UMKM orang pribadi dengan omzet hingga Rp500 juta per tahun TIDAK dikenakan PPh.
Pasal 5: Jangka waktu pengenaan PPh final: 7 tahun pajak bagi Wajib Pajak orang pribadi; 4 tahun pajak bagi Wajib Pajak badan berbentuk koperasi, persekutuan komanditer, atau firma; 3 tahun pajak bagi Wajib Pajak badan berbentuk perseroan terbatas.

BAB IV PENGHITUNGAN, PENYETORAN, DAN PELAPORAN
Pasal 7: Pajak Penghasilan terutang dihitung berdasarkan tarif dikalikan dengan dasar pengenaan pajak. Dasar pengenaan pajak yaitu jumlah peredaran bruto setiap bulan. Wajib Pajak wajib menyetor sendiri PPh terutang ke kas negara paling lambat tanggal 15 bulan berikutnya setelah Masa Pajak berakhir. Wajib Pajak wajib menyampaikan Surat Pemberitahuan Masa Pajak Penghasilan paling lambat 20 hari setelah Masa Pajak berakhir.

BAB V KETENTUAN LAIN
Pasal 10: Wajib Pajak yang memiliki peredaran bruto tertentu dan telah melewati jangka waktu pengenaan PPh final wajib menghitung, menyetor, dan melaporkan PPh berdasarkan tarif umum. Wajib Pajak badan wajib menyelenggarakan pembukuan. Wajib Pajak orang pribadi dengan omzet di bawah Rp4.800.000.000 dapat menggunakan norma penghitungan penghasilan neto.`,
  },
];

async function seedRegulations(): Promise<void> {
  console.log('📜 Seeding regulations...');

  for (const reg of regulations) {
    const existing = await prisma.regulation.findFirst({
      where: { regulationNumber: reg.regulationNumber },
    });

    if (existing) {
      console.log(`⏭️ Skip (exists): ${reg.regulationNumber}`);
      continue;
    }

    await prisma.regulation.create({ data: reg });
    console.log(`✅ Seeded: ${reg.regulationNumber} — ${reg.title}`);
  }

  const count = await prisma.regulation.count();
  console.log(`\n📜 Total regulations in DB: ${count}`);
}

seedRegulations()
  .catch((e) => {
    console.error('❌ Regulation seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
