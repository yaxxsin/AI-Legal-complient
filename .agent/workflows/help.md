---
description: Panduan interaktif Engine — tampilkan semua command + contoh penggunaan
---

## /help — Panduan Engine

Tampilkan panduan lengkap saat user butuh bantuan.

### Usage

```
/help              → Tampilkan semua command dengan penjelasan
/help [command]    → Detail command spesifik (misal: /help plan)
```

---

### /help (Full Menu)

Tampilkan EXACT output berikut:

```
╔══════════════════════════════════════════════════════════════╗
║                 🚀 ENGINE v1.0 — PANDUAN                    ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ⚡ LIFECYCLE                                                ║
║  ─────────────────────────────────────────────               ║
║  /go              Mulai kerja. WAJIB di awal conversation.   ║
║                   AI load context + rules, siap kerja.       ║
║                                                              ║
║  /park            Selesai kerja. WAJIB sebelum tutup chat.   ║
║                   AI save semua state, aman ditutup.         ║
║                                                              ║
║  /snap            Checkpoint darurat. Pakai kalau mau:       ║
║                   istirahat, ganti akun, atau merasa perlu   ║
║                   "save dulu nih".                           ║
║                                                              ║
║  ⚙️ KERJA                                                    ║
║  ─────────────────────────────────────────────               ║
║  /run [task]      Task kecil (< 5 menit). Langsung gas.     ║
║                   Contoh: /run fix typo di Navbar            ║
║                                                              ║
║  /plan [task]     Task besar. AI analisis dulu, bikin plan,  ║
║                   minta approval, baru eksekusi.             ║
║                   Contoh: /plan buat halaman dashboard       ║
║                                                              ║
║                   AI riset, generate ide, minta approval,    ║
║                   lalu buat master_blueprint.md (1000+ baris)║
║                                                              ║
║                   → prioritized improvement ideas.           ║
║                                                              ║
║  /log bug [desc]  Catat bug. AI log lalu BALIK ke task.      ║
║                   Contoh: /log bug tombol login nggak respon ║
║                                                              ║
║  /log idea [desc] Catat ide. AI log lalu BALIK ke task.      ║
║                   Contoh: /log idea export ke PDF            ║
║                                                              ║
║  📊 MONITORING                                               ║
║  ─────────────────────────────────────────────               ║
║  /look            Cek status cepat (< 10 baris).            ║
║  /look full       Report lengkap (progress, bugs, backlog). ║
║                                                              ║
║  🔀 GIT                                                      ║
║  ─────────────────────────────────────────────               ║
║  /save            Commit + push ke feature branch.           ║
║  /ship            Buat Pull Request ke main.                 ║
║  /fix             Hotfix darurat (production down).          ║
║                                                              ║
║  🔍 QUALITY                                                   ║
║  ─────────────────────────────────────────────               ║
║  /review          Review code sebelum merge. AI cek 12       ║
║                   point: security, naming, types, scope.     ║
║                   Kasih score 0-100.                         ║
║                                                              ║
║  /audit           Cek kesehatan project. Scan struktur,      ║
║                   keamanan, arsitektur. Score 0-100.          ║
║  /audit quick     Scan cepat (struktur aja, < 30 detik).    ║
║  /audit security  Fokus keamanan aja.                        ║
║                                                              ║
║  📐 GENERATE                                                  ║
║  ─────────────────────────────────────────────               ║
║  /gen component [Name]    Bikin component + CSS + test.      ║
║  /gen hook [useName]      Bikin custom hook.                 ║
║  /gen api [resource]      Bikin API route (CRUD).            ║
║  /gen feature [name]      Bikin folder fitur lengkap.        ║
║  /gen manifest            Bikin manifest.ts.                 ║
║  /gen type [Name]         Bikin type/interface.              ║
║  /gen test [file]         Bikin test file.                   ║
║                                                              ║
║  ✅ VERIFICATION                                             ║
║  ─────────────────────────────────────────────               ║
║  /verify          Verifikasi perubahan (AI pilih strategi    ║
║                   paling hemat token otomatis).              ║
║  /verify build    Cek build aja (paling murah, ~150 token). ║
║  /verify manual   AI kasih checklist, kamu cek sendiri      ║
║                   (0 token — GRATIS).                        ║
║  /verify browser  AI buka browser, cek visual               ║
║                   (MAHAL: 3000-8000 token, harus confirm).  ║
║                                                              ║
║  🧬 LEARNING                                                 ║
║  ─────────────────────────────────────────────               ║
║  /learn           AI scan & simpan pattern project.          ║
║                   Hemat token di sesi-sesi berikutnya.       ║
║  /learn show      Lihat semua pattern yang tersimpan.        ║
║                                                              ║
║  🛠️ SETUP                                                    ║
║  ─────────────────────────────────────────────               ║
║  /init            Setup Engine di project baru/existing.     ║
║  /help            Halaman ini.                               ║
║  /help [cmd]      Detail command tertentu.                   ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  📌 FLOW SEHARI-HARI:                                        ║
║  /go → kerja (/run atau /plan) → /save → /park              ║
║                                                              ║
║  🆘 CRASH / GANTI AKUN?                                      ║
║  Ketik /go di conversation baru → AI otomatis lanjut.        ║
║                                                              ║
║  💡 Ketik /help [command] untuk detail + contoh lengkap.     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

### /help [command] (Detail Mode)

Saat user ketik `/help plan`, `/help snap`, dll:

1. Baca workflow file yang sesuai dari `.agent/workflows/[command].md`
2. Tampilkan dalam format yang mudah dicerna:

```
📖 /[command] — [judul]
━━━━━━━━━━━━━━━━━━━━━━

📝 Apa ini:
   [penjelasan 1-2 kalimat dalam bahasa Indonesia]

⚡ Cara pakai:
   [contoh penggunaan]

🔄 Langkah-langkah:
   1. [step 1]
   2. [step 2]
   ...

⚠️ Yang perlu diingat:
   - [rule penting 1]
   - [rule penting 2]

💡 Tips:
   [tips berguna]
```

---

### Rules

- SELURUH output dalam Bahasa Indonesia
- Gunakan emoji untuk visual appeal
- /help tanpa argumen → SELALU tampilkan box art di atas (copy exact)
- /help [command] → baca workflow file, jelaskan secara ringkas
- Jika command tidak dikenal → "❌ Command tidak ditemukan. Ketik /help untuk lihat semua."
- Total output /help: < 50 baris
- Total output /help [cmd]: < 25 baris
