import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** 6 categories matching blueprint spec */
const CATEGORIES = [
  { name: 'Pendirian Usaha', slug: 'pendirian-usaha', sortOrder: 1 },
  { name: 'Ketenagakerjaan', slug: 'ketenagakerjaan', sortOrder: 2 },
  { name: 'Perpajakan', slug: 'perpajakan', sortOrder: 3 },
  { name: 'Kontrak Bisnis', slug: 'kontrak-bisnis', sortOrder: 4 },
  { name: 'Perizinan', slug: 'perizinan', sortOrder: 5 },
  { name: 'UMKM', slug: 'umkm', sortOrder: 6 },
];

/** 20 seed articles across 6 categories — Indonesian legal content */
const ARTICLES = [
  // ── Pendirian Usaha (4) ──
  {
    title: 'Panduan Lengkap Mendirikan PT di Indonesia 2024',
    slug: 'panduan-mendirikan-pt-indonesia-2024',
    categorySlug: 'pendirian-usaha',
    metaDescription: 'Langkah-langkah lengkap mendirikan Perseroan Terbatas (PT) di Indonesia termasuk syarat, biaya, dan proses di AHU Online.',
    readTimeMinutes: 8,
    author: 'Tim LocalCompliance',
    tags: ['PT', 'AHU Online', 'Badan Hukum'],
    body: `# Panduan Lengkap Mendirikan PT di Indonesia 2024

## Apa Itu PT?

Perseroan Terbatas (PT) adalah badan hukum yang didirikan berdasarkan perjanjian antara dua orang atau lebih. PT merupakan bentuk usaha yang paling populer di Indonesia karena memberikan perlindungan hukum bagi pemiliknya.

## Syarat Mendirikan PT

### 1. Persyaratan Umum
- Minimal 2 (dua) orang pendiri
- Modal dasar minimal Rp 50.000.000
- Modal disetor minimal 25% dari modal dasar
- Akta pendirian dari Notaris

### 2. Dokumen yang Dibutuhkan
- KTP dan NPWP seluruh pendiri dan pengurus
- Pas foto pendiri (3x4, background merah)
- Bukti setor modal ke rekening bank
- Surat pernyataan domisili usaha

## Proses Pendirian

### Langkah 1: Pemesanan Nama PT
Pesan nama melalui **AHU Online** (ahu.go.id). Biaya pemesanan nama Rp 200.000. Nama harus terdiri minimal 3 kata.

### Langkah 2: Pembuatan Akta Notaris
Setelah nama disetujui, buat akta pendirian di hadapan Notaris. Akta harus memuat:
- Nama dan tempat kedudukan
- Maksud dan tujuan serta kegiatan usaha
- Jangka waktu pendirian
- Modal dasar, ditempatkan, dan disetor

### Langkah 3: Pengesahan Kemenkumham
Notaris akan mengajukan pengesahan ke Kemenkumham melalui SABH (Sistem Administrasi Badan Hukum).

### Langkah 4: Penerbitan NIB
Setelah mendapat SK Kemenkumham, daftarkan di **OSS (Online Single Submission)** untuk mendapatkan NIB.

## Biaya Estimasi
| Komponen | Biaya |
|----------|-------|
| Pemesanan nama | Rp 200.000 |
| Jasa Notaris | Rp 3.000.000 - 8.000.000 |
| PNBP Kemenkumham | Rp 1.000.000 |
| SKDP | Rp 500.000 - 1.000.000 |

## Tips Penting
- Pastikan nama PT belum terdaftar sebelum pesan
- Pilih kode KBLI yang sesuai dengan rencana usaha
- Simpan semua dokumen asli di tempat yang aman`,
  },
  {
    title: 'Perbedaan CV dan PT: Mana yang Tepat untuk Bisnis Anda?',
    slug: 'perbedaan-cv-dan-pt',
    categorySlug: 'pendirian-usaha',
    metaDescription: 'Perbandingan lengkap CV (Commanditaire Vennootschap) vs PT (Perseroan Terbatas) dari segi hukum, pajak, dan modal.',
    readTimeMinutes: 6,
    author: 'Tim LocalCompliance',
    tags: ['CV', 'PT', 'Perbandingan'],
    body: `# Perbedaan CV dan PT: Mana yang Tepat?

## Ringkasan Perbandingan

| Aspek | CV | PT |
|-------|-----|-----|
| Badan Hukum | Bukan | Ya |
| Tanggung Jawab | Tidak terbatas (sekutu aktif) | Terbatas pada modal |
| Modal Minimum | Tidak ada | Rp 50 juta |
| Pendiri Minimum | 2 orang | 2 orang |
| Pajak | PPh Final / Umum | PPh Badan 22% |

## Kapan Memilih CV?
CV cocok untuk usaha kecil-menengah yang tidak memerlukan kontrak besar dengan perusahaan lain. Kelebihan CV termasuk proses pendirian yang lebih sederhana dan biaya yang lebih murah.

## Kapan Memilih PT?
PT ideal untuk bisnis yang berencana berkembang besar, mengikuti tender pemerintah, atau mencari pendanaan dari investor. Perlindungan tanggung jawab terbatas menjadi nilai tambah utama.

## Kesimpulan
Pilihan antara CV dan PT bergantung pada skala bisnis, rencana pengembangan, dan kesiapan menghadapi kewajiban hukum yang lebih kompleks.`,
  },
  {
    title: 'Cara Mendaftarkan NIB melalui OSS Risk-Based Approach',
    slug: 'cara-mendaftarkan-nib-oss-rba',
    categorySlug: 'pendirian-usaha',
    metaDescription: 'Tutorial step-by-step mendaftarkan NIB (Nomor Induk Berusaha) melalui sistem OSS RBA terbaru.',
    readTimeMinutes: 5,
    author: 'Tim LocalCompliance',
    tags: ['NIB', 'OSS', 'Perizinan'],
    body: `# Cara Mendaftarkan NIB melalui OSS RBA

## Apa Itu OSS RBA?
OSS RBA (Risk-Based Approach) adalah sistem perizinan berusaha terintegrasi secara elektronik yang menggunakan pendekatan berbasis risiko.

## Langkah Pendaftaran

### 1. Buat Akun OSS
Kunjungi **oss.go.id** dan buat akun baru menggunakan NIK dan email aktif.

### 2. Isi Data Pelaku Usaha
Lengkapi data identitas, termasuk NPWP dan alamat.

### 3. Pilih Kegiatan Usaha (KBLI)
Tentukan kode KBLI 5 digit yang sesuai dengan usaha Anda. Sistem akan otomatis menentukan tingkat risiko.

### 4. Isi Data Usaha
Lengkapi informasi alamat usaha, jumlah tenaga kerja, dan modal investasi.

### 5. Terbitkan NIB
Setelah semua data lengkap, NIB akan diterbitkan secara otomatis.

## Tingkat Risiko
- **Rendah**: NIB langsung berlaku sebagai izin
- **Menengah Rendah**: Perlu sertifikat standar
- **Menengah Tinggi**: Perlu sertifikat standar + verifikasi
- **Tinggi**: Perlu izin dari instansi terkait`,
  },
  {
    title: 'Panduan Pendirian Yayasan di Indonesia',
    slug: 'panduan-pendirian-yayasan',
    categorySlug: 'pendirian-usaha',
    metaDescription: 'Persyaratan dan prosedur lengkap mendirikan yayasan sesuai UU No. 16 Tahun 2001.',
    readTimeMinutes: 7,
    author: 'Tim LocalCompliance',
    tags: ['Yayasan', 'Organisasi Nirlaba'],
    body: `# Panduan Pendirian Yayasan di Indonesia

## Dasar Hukum
Yayasan diatur dalam **UU No. 16 Tahun 2001** jo. **UU No. 28 Tahun 2004** tentang Yayasan.

## Organ Yayasan
1. **Pembina** — pemegang kekuasaan tertinggi
2. **Pengurus** — menjalankan kepengurusan
3. **Pengawas** — mengawasi jalannya yayasan

## Syarat Pendirian
- Minimal 1 orang pendiri
- Kekayaan awal dipisahkan dari pendiri minimal Rp 10 juta
- Akta pendirian dari Notaris
- Tujuan di bidang sosial, keagamaan, atau kemanusiaan

## Proses Pendirian
1. Pemesanan nama yayasan via AHU Online
2. Pembuatan akta notaris
3. Pengesahan dari Kemenkumham
4. Pendaftaran NPWP yayasan
5. Pendaftaran NIB di OSS (jika menjalankan kegiatan usaha)`,
  },

  // ── Ketenagakerjaan (4) ──
  {
    title: 'Panduan Lengkap BPJS Ketenagakerjaan untuk Pemberi Kerja',
    slug: 'panduan-bpjs-ketenagakerjaan-pemberi-kerja',
    categorySlug: 'ketenagakerjaan',
    metaDescription: 'Kewajiban pemberi kerja terkait BPJS Ketenagakerjaan: JHT, JKK, JKM, dan JP beserta tarif iuran terbaru.',
    readTimeMinutes: 7,
    author: 'Tim LocalCompliance',
    tags: ['BPJS', 'JHT', 'JKK', 'JKM', 'JP'],
    body: `# Panduan BPJS Ketenagakerjaan untuk Pemberi Kerja

## Program BPJS Ketenagakerjaan

### 1. JHT (Jaminan Hari Tua)
- Pekerja: **2%** dari upah
- Pemberi Kerja: **3.7%** dari upah
- Pencairan: usia 56 tahun, PHK, atau meninggal

### 2. JKK (Jaminan Kecelakaan Kerja)
- Pemberi Kerja: **0.24% - 1.74%** (tergantung risiko)
- Manfaat: biaya perawatan, santunan, cacat

### 3. JKM (Jaminan Kematian)
- Pemberi Kerja: **0.3%**
- Manfaat: santunan kematian Rp 42 juta, biaya pemakaman Rp 10 juta

### 4. JP (Jaminan Pensiun)
- Pekerja: **1%**
- Pemberi Kerja: **2%**
- Manfaat bulanan setelah usia 56 tahun

## Sanksi Ketidakpatuhan
Pemberi kerja yang tidak mendaftarkan pekerjanya ke BPJS dapat dikenai:
- Teguran tertulis
- Denda administratif
- Pencabutan izin usaha`,
  },
  {
    title: 'Hak Cuti Karyawan Menurut UU Cipta Kerja',
    slug: 'hak-cuti-karyawan-uu-cipta-kerja',
    categorySlug: 'ketenagakerjaan',
    metaDescription: 'Jenis-jenis cuti yang menjadi hak karyawan berdasarkan UU Cipta Kerja dan PP turunannya.',
    readTimeMinutes: 5,
    author: 'Tim LocalCompliance',
    tags: ['Cuti', 'UU Cipta Kerja', 'Hak Karyawan'],
    body: `# Hak Cuti Karyawan Menurut UU Cipta Kerja

## Jenis-Jenis Cuti

### 1. Cuti Tahunan
- **12 hari kerja** setelah bekerja 12 bulan terus-menerus
- Dapat diakumulasi maksimal 6 bulan

### 2. Cuti Sakit
- Sesuai surat dokter
- Upah tetap dibayar:
  - 4 bulan pertama: 100%
  - 4 bulan kedua: 75%
  - 4 bulan ketiga: 50%
  - Selanjutnya: 25%

### 3. Cuti Melahirkan/Keguguran
- Melahirkan: **3 bulan** (1.5 bulan sebelum dan sesudah)
- Keguguran: **1.5 bulan**

### 4. Cuti Penting
- Menikah: 3 hari
- Menikahkan anak: 2 hari
- Khitanan/baptis anak: 2 hari
- Keluarga meninggal: 2 hari
- Anggota serumah meninggal: 1 hari`,
  },
  {
    title: 'Cara Menghitung Pesangon PHK Sesuai UU Cipta Kerja',
    slug: 'cara-menghitung-pesangon-phk',
    categorySlug: 'ketenagakerjaan',
    metaDescription: 'Formula dan contoh perhitungan pesangon, UPMK, dan UPH berdasarkan PP 35/2021 turunan UU Cipta Kerja.',
    readTimeMinutes: 8,
    author: 'Tim LocalCompliance',
    tags: ['Pesangon', 'PHK', 'UU Cipta Kerja'],
    body: `# Cara Menghitung Pesangon PHK

## Komponen Pesangon

### 1. Uang Pesangon (UP)
| Masa Kerja | Kelipatan Gaji |
|-----------|---------------|
| < 1 tahun | 1 bulan |
| 1 - 2 tahun | 2 bulan |
| 2 - 3 tahun | 3 bulan |
| 3 - 4 tahun | 4 bulan |
| 4 - 5 tahun | 5 bulan |
| 5 - 6 tahun | 6 bulan |
| 6 - 7 tahun | 7 bulan |
| 7 - 8 tahun | 8 bulan |
| > 8 tahun | 9 bulan |

### 2. UPMK (Uang Penghargaan Masa Kerja)
Diberikan untuk masa kerja 3 tahun ke atas.

### 3. UPH (Uang Penggantian Hak)
- Cuti tahunan yang belum diambil
- Biaya ongkos pulang
- 15% dari UP dan UPMK

## Contoh Perhitungan
Karyawan dengan gaji Rp 10.000.000, masa kerja 5 tahun, PHK karena efisiensi:
- UP: 6 × Rp 10.000.000 × 1 = Rp 60.000.000
- UPMK: 2 × Rp 10.000.000 = Rp 20.000.000
- UPH: 15% × (60.000.000 + 20.000.000) = Rp 12.000.000
- **Total: Rp 92.000.000**`,
  },
  {
    title: 'Wajib Lapor Ketenagakerjaan: Apa yang Harus Dilaporkan?',
    slug: 'wajib-lapor-ketenagakerjaan',
    categorySlug: 'ketenagakerjaan',
    metaDescription: 'Kewajiban perusahaan melaporkan ketenagakerjaan secara berkala sesuai UU No. 7 Tahun 1981.',
    readTimeMinutes: 4,
    author: 'Tim LocalCompliance',
    tags: ['WLKP', 'Laporan Ketenagakerjaan'],
    body: `# Wajib Lapor Ketenagakerjaan

## Dasar Hukum
**UU No. 7 Tahun 1981** tentang Wajib Lapor Ketenagakerjaan di Perusahaan.

## Siapa yang Wajib Lapor?
Setiap perusahaan yang mempekerjakan **10 orang atau lebih** atau membayar upah minimal Rp 1.000.000/bulan.

## Apa yang Dilaporkan?
1. Identitas perusahaan
2. Jumlah tenaga kerja (WNI/WNA)
3. Jam kerja dan lembur
4. Pengupahan
5. Jaminan sosial tenaga kerja
6. Kesehatan dan keselamatan kerja

## Kapan Dilaporkan?
- Pertama kali: **30 hari** sejak mendirikan perusahaan
- Pembaharuan: setiap **12 bulan** atau ada perubahan
- Penutupan: **30 hari** sebelum perusahaan tutup

## Cara Lapor
Lapor melalui **wajiblapor.kemnaker.go.id** secara online.`,
  },

  // ── Perpajakan (4) ──
  {
    title: 'Panduan NPWP untuk Badan Usaha Baru',
    slug: 'panduan-npwp-badan-usaha-baru',
    categorySlug: 'perpajakan',
    metaDescription: 'Cara mendaftarkan NPWP untuk PT, CV, dan badan usaha lainnya secara online melalui ereg.pajak.go.id.',
    readTimeMinutes: 5,
    author: 'Tim LocalCompliance',
    tags: ['NPWP', 'Pajak', 'Pendaftaran'],
    body: `# Panduan NPWP untuk Badan Usaha Baru

## Kewajiban Memiliki NPWP
Setiap badan usaha **wajib** mendaftarkan diri untuk mendapatkan NPWP paling lambat **1 bulan** setelah didirikan.

## Dokumen Persyaratan
- Akta pendirian dan perubahannya
- SK Kemenkumham (untuk PT)
- KTP dan NPWP pengurus/penanggung jawab
- Surat keterangan domisili usaha
- NIB dari OSS

## Cara Pendaftaran Online
1. Kunjungi **ereg.pajak.go.id**
2. Pilih pendaftaran Wajib Pajak Badan
3. Isi formulir pendaftaran
4. Upload dokumen persyaratan
5. Tunggu verifikasi (3-14 hari kerja)
6. NPWP akan dikirim ke alamat terdaftar

## Setelah Mendapat NPWP
- Aktivasi akun di DJP Online
- Gunakan untuk pelaporan SPT
- Cantumkan pada faktur pajak
- Update jika ada perubahan data`,
  },
  {
    title: 'PPh Final UMKM 0.5%: Siapa yang Berhak?',
    slug: 'pph-final-umkm-05-persen',
    categorySlug: 'perpajakan',
    metaDescription: 'Penjelasan lengkap PP 55/2022 tentang PPh Final 0.5% untuk UMKM termasuk batas waktu dan cara perhitungan.',
    readTimeMinutes: 6,
    author: 'Tim LocalCompliance',
    tags: ['PPh Final', 'UMKM', 'PP 55/2022'],
    body: `# PPh Final UMKM 0.5%

## Dasar Hukum
**PP No. 55 Tahun 2022** (menggantikan PP 23/2018) tentang penyesuaian pengaturan PPh.

## Kriteria
- Omzet bruto **tidak melebihi Rp 4.8 miliar** per tahun
- Berlaku untuk WP Orang Pribadi dan WP Badan

## Batas Waktu Penggunaan
- WP Orang Pribadi: **7 tahun**
- WP Badan (PT): **4 tahun**
- WP Badan (CV, Firma, Koperasi): **4 tahun**

## Cara Perhitungan
PPh Final = **0.5% × omzet bruto bulanan**

### Contoh
Omzet bulan Januari: Rp 100.000.000
PPh Final = 0.5% × 100.000.000 = **Rp 500.000**

## PTKP untuk WP OP
WP Orang Pribadi dengan omzet di bawah **Rp 500 juta per tahun** tidak dikenakan PPh Final.

## Pembayaran dan Pelaporan
- Bayar paling lambat tanggal **15** bulan berikutnya
- Lapor melalui SPT Masa PPh paling lambat tanggal **20**`,
  },
  {
    title: 'Panduan Lengkap PPN untuk Pelaku Usaha',
    slug: 'panduan-ppn-pelaku-usaha',
    categorySlug: 'perpajakan',
    metaDescription: 'Memahami PPN 11%, PKP, faktur pajak, dan kewajiban pelaporan SPT Masa PPN untuk pelaku usaha.',
    readTimeMinutes: 7,
    author: 'Tim LocalCompliance',
    tags: ['PPN', 'PKP', 'Faktur Pajak'],
    body: `# Panduan PPN untuk Pelaku Usaha

## Tarif PPN
Tarif PPN saat ini adalah **11%** (berlaku sejak 1 April 2022).

## Kewajiban PKP
Pengusaha **wajib** dikukuhkan sebagai PKP jika omzet bruto melebihi **Rp 4.8 miliar** dalam 1 tahun.

## Faktur Pajak
PKP wajib membuat faktur pajak untuk setiap:
- Penyerahan BKP (Barang Kena Pajak)
- Penyerahan JKP (Jasa Kena Pajak)
- Ekspor BKP/JKP

## SPT Masa PPN
- Dilaporkan paling lambat **akhir bulan berikutnya**
- Mekanisme: PPN Keluaran - PPN Masukan = yang disetor
- Jika lebih bayar: bisa dikompensasi atau restitusi

## Barang/Jasa Tidak Kena PPN
- Bahan pokok (beras, jagung, sayur, dll)
- Jasa pelayanan kesehatan
- Jasa pendidikan
- Jasa angkutan umum`,
  },
  {
    title: 'Cara Lapor SPT Tahunan Badan Online',
    slug: 'cara-lapor-spt-tahunan-badan',
    categorySlug: 'perpajakan',
    metaDescription: 'Tutorial step-by-step pelaporan SPT Tahunan PPh Badan melalui DJP Online termasuk lampiran yang diperlukan.',
    readTimeMinutes: 6,
    author: 'Tim LocalCompliance',
    tags: ['SPT', 'PPh Badan', 'DJP Online'],
    body: `# Cara Lapor SPT Tahunan Badan Online

## Batas Waktu
SPT Tahunan Badan disampaikan paling lambat **4 bulan** setelah akhir tahun pajak (30 April).

## Dokumen Persiapan
1. Laporan keuangan audited
2. Rekapitulasi peredaran bruto dan PPh Final
3. Daftar penyusutan aktiva tetap
4. Daftar nominatif biaya entertainment
5. Bukti potong PPh 21, 23, 4(2)

## Langkah Pelaporan
1. Login ke **djponline.pajak.go.id**
2. Pilih menu e-Filing
3. Pilih formulir **1771** (SPT Tahunan PPh Badan)
4. Isi lampiran secara berurutan (VI → I)
5. Isi induk SPT
6. Submit dan simpan BPE

## Tips Penting
- Gunakan format CSV untuk input data banyak
- Pastikan NTPN setor sudah ter-record
- Lampiran wajib: laporan keuangan dalam format PDF`,
  },

  // ── Kontrak Bisnis (3) ──
  {
    title: 'Elemen Wajib dalam Kontrak Kerja Karyawan',
    slug: 'elemen-wajib-kontrak-kerja-karyawan',
    categorySlug: 'kontrak-bisnis',
    metaDescription: 'Komponen yang harus ada dalam perjanjian kerja (PKWT/PKWTT) agar sah secara hukum.',
    readTimeMinutes: 5,
    author: 'Tim LocalCompliance',
    tags: ['Kontrak Kerja', 'PKWT', 'PKWTT'],
    body: `# Elemen Wajib dalam Kontrak Kerja

## Jenis Perjanjian Kerja
- **PKWT**: Perjanjian Kerja Waktu Tertentu (kontrak)
- **PKWTT**: Perjanjian Kerja Waktu Tidak Tertentu (tetap)

## Elemen Wajib (Pasal 54 UU Ketenagakerjaan)
1. Nama, alamat, dan jenis usaha perusahaan
2. Nama, jenis kelamin, umur, dan alamat pekerja
3. Jabatan atau jenis pekerjaan
4. Tempat pekerjaan
5. Besarnya upah dan cara pembayaran
6. Syarat-syarat kerja (hak dan kewajiban)
7. Mulai dan jangka waktu berlaku
8. Tempat dan tanggal dibuat
9. Tanda tangan para pihak

## Ketentuan PKWT
- Maksimal **5 tahun** (termasuk perpanjangan)
- Wajib didaftarkan ke **Disnaker** dalam 3 hari
- Jika melanggar → otomatis menjadi PKWTT

## Kompensasi PKWT
Pekerja PKWT berhak atas uang kompensasi sebesar **1 bulan upah per 12 bulan masa kerja**.`,
  },
  {
    title: 'Tips Membuat NDA (Non-Disclosure Agreement) yang Kuat',
    slug: 'tips-membuat-nda-yang-kuat',
    categorySlug: 'kontrak-bisnis',
    metaDescription: 'Panduan menyusun perjanjian kerahasiaan (NDA) yang efektif untuk melindungi informasi bisnis Anda.',
    readTimeMinutes: 5,
    author: 'Tim LocalCompliance',
    tags: ['NDA', 'Kerahasiaan', 'Perjanjian'],
    body: `# Tips Membuat NDA yang Kuat

## Apa Itu NDA?
Non-Disclosure Agreement (NDA) atau perjanjian kerahasiaan adalah kontrak hukum yang melindungi informasi rahasia dari pengungkapan kepada pihak ketiga.

## Elemen Penting NDA
1. **Definisi Informasi Rahasia** — spesifik dan jelas
2. **Kewajiban Penerima** — menjaga kerahasiaan
3. **Pengecualian** — informasi yang sudah publik
4. **Jangka Waktu** — durasi kewajiban kerahasiaan
5. **Sanksi Pelanggaran** — ganti rugi dan denda
6. **Penyelesaian Sengketa** — arbitrase atau pengadilan

## Jenis NDA
- **Unilateral**: satu pihak membagikan informasi
- **Mutual/Bilateral**: kedua pihak saling berbagi

## Kesalahan Umum
- Definisi terlalu luas atau terlalu sempit
- Tidak mencantumkan jangka waktu kerahasiaan
- Tidak ada mekanisme pengembalian dokumen
- Sanksi pelanggaran tidak jelas`,
  },
  {
    title: 'Panduan Membuat Perjanjian Kerjasama Bisnis (MoU)',
    slug: 'panduan-perjanjian-kerjasama-mou',
    categorySlug: 'kontrak-bisnis',
    metaDescription: 'Cara menyusun Memorandum of Understanding (MoU) yang tepat untuk kerjasama bisnis di Indonesia.',
    readTimeMinutes: 5,
    author: 'Tim LocalCompliance',
    tags: ['MoU', 'Kerjasama', 'Perjanjian'],
    body: `# Panduan Membuat MoU Kerjasama Bisnis

## Perbedaan MoU dan Kontrak
MoU bersifat **letter of intent** — menunjukkan keseriusan para pihak sebelum menandatangani kontrak yang mengikat secara hukum.

## Struktur MoU
1. **Judul dan Nomor**
2. **Para Pihak** — identitas lengkap
3. **Latar Belakang** — alasan kerjasama
4. **Ruang Lingkup** — bidang kerjasama
5. **Hak dan Kewajiban** masing-masing pihak
6. **Jangka Waktu** kerjasama
7. **Kerahasiaan**
8. **Penyelesaian Perselisihan**
9. **Penutup dan Tanda Tangan**

## Tips Penting
- MoU sebaiknya dibuat di hadapan Notaris
- Cantumkan klausul force majeure
- Tentukan hukum yang berlaku dengan jelas
- Sertakan mekanisme evaluasi berkala`,
  },

  // ── Perizinan (3) ──
  {
    title: 'Daftar Izin Usaha Wajib untuk Restoran dan Kafe',
    slug: 'izin-usaha-wajib-restoran-kafe',
    categorySlug: 'perizinan',
    metaDescription: 'Perizinan lengkap yang harus dimiliki restoran dan kafe termasuk TDUP, sertifikat halal, dan izin lingkungan.',
    readTimeMinutes: 6,
    author: 'Tim LocalCompliance',
    tags: ['Restoran', 'TDUP', 'Izin Usaha'],
    body: `# Izin Usaha Wajib untuk Restoran dan Kafe

## Izin Utama
1. **NIB** — Nomor Induk Berusaha (via OSS)
2. **TDUP** — Tanda Daftar Usaha Pariwisata
3. **Izin Lokasi** — dari pemerintah daerah

## Izin Pendukung
4. **Sertifikat Laik Hygiene Sanitasi** — dari Dinas Kesehatan
5. **Sertifikat Halal** — dari BPJPH (wajib per UU JPH)
6. **AMDAL/UKL-UPL** — izin lingkungan
7. **HO (Izin Gangguan)** — beberapa daerah masih mewajibkan
8. **Izin Reklame** — untuk papan nama/spanduk

## Proses Pengurusan
Sebagian besar izin dapat diurus melalui **OSS** dan **DPMPTSP** (Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu) setempat.

## Tips
- Urus NIB terlebih dahulu karena menjadi syarat izin lainnya
- Sertifikat Halal kini wajib untuk semua produk makanan dan minuman
- Perhatikan zonasi lokasi sebelum menyewa tempat`,
  },
  {
    title: 'Sertifikasi Halal Wajib: Apa yang Perlu Diketahui UMKM',
    slug: 'sertifikasi-halal-wajib-umkm',
    categorySlug: 'perizinan',
    metaDescription: 'Panduan sertifikasi halal wajib untuk UMKM sesuai UU JPH termasuk proses, biaya, dan self-declare.',
    readTimeMinutes: 5,
    author: 'Tim LocalCompliance',
    tags: ['Halal', 'BPJPH', 'Sertifikasi'],
    body: `# Sertifikasi Halal Wajib untuk UMKM

## Dasar Hukum
**UU No. 33 Tahun 2014** tentang Jaminan Produk Halal (JPH) mewajibkan semua produk yang beredar di Indonesia bersertifikat halal.

## Tahapan untuk UMKM
Pemerintah menyediakan skema **self-declare** untuk mempermudah UMKM:

### 1. Daftar di PTSP
Kunjungi web **ptsp.halal.go.id** dan buat akun.

### 2. Isi Formulir Self-Declare
Lengkapi data produk, bahan baku, dan proses produksi.

### 3. Unggah Dokumen
- Daftar bahan yang digunakan
- Foto proses produksi
- Foto produk

### 4. Pendampingan PPH
Proses Produk Halal (PPH) oleh pendamping dari pemerintah.

### 5. Penerbitan Sertifikat
Sertifikat halal berlaku **4 tahun**.

## Biaya
Untuk UMKM mikro dan kecil: **GRATIS** (disubsidi pemerintah).`,
  },
  {
    title: 'Izin Edar Produk Makanan: BPOM vs Dinkes',
    slug: 'izin-edar-bpom-vs-dinkes',
    categorySlug: 'perizinan',
    metaDescription: 'Perbedaan izin edar BPOM (MD/ML) dan Dinkes (P-IRT) untuk produk makanan beserta cara pengurusan.',
    readTimeMinutes: 5,
    author: 'Tim LocalCompliance',
    tags: ['BPOM', 'P-IRT', 'Izin Edar'],
    body: `# Izin Edar Produk Makanan: BPOM vs Dinkes

## Kapan Perlu BPOM?
Produk olahan yang diproduksi secara **industri** (pabrik) memerlukan izin **MD** (dalam negeri) atau **ML** (impor) dari BPOM.

## Kapan Cukup P-IRT?
Produk **industri rumah tangga** dengan risiko rendah cukup mendaftar **P-IRT** ke Dinas Kesehatan kabupaten/kota.

## Perbandingan
| Aspek | P-IRT | MD (BPOM) |
|-------|-------|-----------|
| Pengelola | Dinkes | BPOM |
| Skala | Rumah tangga | Industri |
| Biaya | Rendah (< Rp 500rb) | Rp 500rb - 5 juta |
| Masa berlaku | 5 tahun | 5 tahun |
| Proses | 1-2 minggu | 1-3 bulan |

## Produk yang Tidak Bisa P-IRT
- Susu dan produk olahan susu
- Daging olahan
- Makanan kaleng
- Makanan bayi
- Air minum dalam kemasan`,
  },

  // ── UMKM (2) ──
  {
    title: 'Checklist Legalitas Lengkap untuk UMKM',
    slug: 'checklist-legalitas-umkm',
    categorySlug: 'umkm',
    metaDescription: 'Daftar lengkap dokumen dan izin legalitas yang harus dimiliki UMKM untuk beroperasi secara sah.',
    readTimeMinutes: 6,
    author: 'Tim LocalCompliance',
    tags: ['UMKM', 'Legalitas', 'Checklist'],
    body: `# Checklist Legalitas UMKM

## Dokumen Dasar
- [ ] **NIB** (Nomor Induk Berusaha)
- [ ] **NPWP** (Nomor Pokok Wajib Pajak)
- [ ] **IUMK** (Izin Usaha Mikro Kecil) bila diperlukan
- [ ] **Sertifikat Halal** (untuk produk makanan/minuman)

## Perizinan Operasional
- [ ] Izin lokasi/domisili usaha
- [ ] Izin lingkungan (UKL-UPL untuk risiko menengah)
- [ ] P-IRT atau izin edar BPOM (produk makanan)
- [ ] Izin khusus sektor (misal: SIUP Perdagangan)

## Ketenagakerjaan (jika punya karyawan)
- [ ] Perjanjian kerja (PKWT/PKWTT)
- [ ] Pendaftaran BPJS Ketenagakerjaan
- [ ] Pendaftaran BPJS Kesehatan
- [ ] Wajib Lapor Ketenagakerjaan (> 10 karyawan)

## Perpajakan
- [ ] Pelaporan SPT Tahunan
- [ ] Pembayaran PPh Final 0.5% (bulanan)
- [ ] Pengukuhan PKP (jika omzet > Rp 4.8M)

## Properti Intelektual (Opsional tapi disarankan)
- [ ] Pendaftaran merek (DJKI)
- [ ] Hak cipta (untuk karya kreatif)`,
  },
  {
    title: 'Akses Pembiayaan UMKM: KUR dan Program Pemerintah',
    slug: 'akses-pembiayaan-umkm-kur',
    categorySlug: 'umkm',
    metaDescription: 'Panduan lengkap Kredit Usaha Rakyat (KUR) dan program pembiayaan pemerintah lainnya untuk UMKM.',
    readTimeMinutes: 6,
    author: 'Tim LocalCompliance',
    tags: ['KUR', 'Pembiayaan', 'UMKM'],
    body: `# Akses Pembiayaan UMKM

## Kredit Usaha Rakyat (KUR)
KUR adalah kredit pembiayaan modal kerja dan/atau investasi dengan bunga **subsidi pemerintah**.

### Jenis KUR
1. **KUR Mikro**: plafon s.d. Rp 50 juta
2. **KUR Kecil**: plafon Rp 50 juta - Rp 500 juta
3. **KUR Super Mikro**: plafon s.d. Rp 10 juta

### Suku Bunga
- KUR Mikro/Kecil: **6% efektif per tahun**
- KUR Super Mikro: **3% efektif per tahun**

### Syarat Umum
- Usaha produktif dan layak
- Belum pernah mendapat KUR (untuk KUR pertama)
- Memiliki NIB atau surat izin usaha
- Minimal sudah berjalan 6 bulan

## Program Lainnya
- **PNM Mekar**: pembiayaan kelompok (perempuan pra-sejahtera)
- **LPDB-KUMKM**: dana bergulir dari Kemenkop
- **Program Matching Fund**: dari Kemendikbud untuk startup
- **Angel Investor / VC**: untuk startup teknologi

## Tips Mengajukan KUR
1. Siapkan laporan keuangan sederhana (3-6 bulan)
2. Pastikan NIB dan NPWP aktif
3. Ajukan sesuai kebutuhan (jangan berlebihan)
4. Tunjukkan bukti omzet (rekening koran)`,
  },
];

async function main(): Promise<void> {
  console.log('🌱 Seeding article categories...');

  // Upsert categories
  const categoryMap = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const record = await prisma.articleCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sortOrder: cat.sortOrder },
      create: cat,
    });
    categoryMap.set(cat.slug, record.id);
  }
  console.log(`   ✅ ${CATEGORIES.length} categories upserted`);

  // Upsert articles
  console.log('🌱 Seeding articles...');
  let created = 0;
  for (const article of ARTICLES) {
    const categoryId = categoryMap.get(article.categorySlug);
    if (!categoryId) {
      console.warn(`   ⚠️ Category ${article.categorySlug} not found, skipping ${article.slug}`);
      continue;
    }

    await prisma.article.upsert({
      where: { slug: article.slug },
      update: {
        title: article.title,
        body: article.body,
        categoryId,
        tags: article.tags,
        metaDescription: article.metaDescription,
        readTimeMinutes: article.readTimeMinutes,
        author: article.author,
      },
      create: {
        title: article.title,
        slug: article.slug,
        body: article.body,
        categoryId,
        tags: article.tags,
        metaDescription: article.metaDescription,
        readTimeMinutes: article.readTimeMinutes,
        author: article.author,
        isPublished: true,
        publishedAt: new Date(),
      },
    });
    created++;
  }

  console.log(`   ✅ ${created} articles upserted`);
  console.log('✨ Article seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
