# ⚡ ENGINE v1.0 — Quick Reference

> Print atau bookmark halaman ini.

---

## Top 5 Commands (Sehari-hari)

| Command | Fungsi | Kapan |
|---------|--------|-------|
| `/go` | Start session, load context | Awal conversation |
| `/park` | Save state, end session | Akhir conversation |
| `/run [task]` | Quick task (< 5 min) | Task kecil & jelas |
| `/plan [task]` | Big task + planning | Task besar & kompleks |
| `/save` | Commit + push | Setelah task selesai |
| `/gen [type]` | Generate boilerplate | Bikin component/hook/api |
| `/review` | Code review + scoring | Sebelum merge |
| `/verify` | Smart verification | Setelah coding selesai |

---

## All Commands

| Command | Fungsi |
|---------|--------|
| `/go` | Start session — load state + rules + tracker |
| `/park` | End session — save state + update tracker |
| `/run [task]` | Quick task tanpa planning |
| `/plan [task]` | Big task: research → plan → approve → execute |
| `/save` | Git commit + push ke feature branch |
| `/ship` | Create Pull Request |
| `/fix` | Emergency hotfix (CRITICAL bugs only) |
| `/log bug [desc]` | Log bug → lanjut task (JANGAN investigate) |
| `/log idea [desc]` | Log idea → lanjut task (JANGAN brainstorm) |
| `/look` | Quick status (< 10 baris) |
| `/look full` | Detailed progress report |
| `/snap` | Manual full checkpoint |
| `/review` | Code review (12-point, scoring 0-100) |
| `/audit` | Project health check (5 area, scoring) |
| `/audit quick` | Quick structure scan |
| `/audit security` | Security-focused audit |
| `/gen component [Name]` | Generate component + CSS + test |
| `/gen hook [useName]` | Generate custom hook |
| `/gen api [resource]` | Generate API route (CRUD) |
| `/gen feature [name]` | Generate full feature folder |
| `/gen manifest` | Generate feature manifest |
| `/gen type [Name]` | Generate type/interface |
| `/gen test [file]` | Generate test file |
| `/verify` | Smart verification (auto pilih strategi hemat) |
| `/verify build` | Cek build saja (murah, ~150 token) |
| `/verify manual` | AI kasih checklist, user cek sendiri (GRATIS) |
| `/verify browser` | AI buka browser (MAHAL, 3000-8000 token) |
| `/learn` | Scan & simpan pattern project |
| `/learn show` | Tampilkan patterns tersimpan |
| `/init` | First-time project setup |

---

## Standard Flow

```
1. Buka conversation → /go
2. Kerja → /run atau /plan
3. Ada ide? → /log idea   Bug? → /log bug
4. Mau commit? → /save
5. Selesai? → /park
```

---

## File Penting

| File | Fungsi |
|------|--------|
| `.agent/rules.md` | AI behavior rules (5 Laws) |
| `docs/state/active.md` | Phase pointer + lock |
| `docs/state/phase-XX.md` | State per phase |
| `docs/tracker.md` | Bugs + backlog + changelog |
| `docs/decisions.md` | Keputusan arsitektur |
| `master_blueprint.md` | PRD / project blueprint |

---

## Emergency: Crash Recovery

```
Setelah crash/ganti akun/high traffic:
1. Ketik: /go
2. AI otomatis baca state → lanjut dari checkpoint terakhir
3. Tidak perlu jelaskan ulang apa yang sedang dikerjakan
```

---

> 💡 Full rules ada di `.agent/rules.md` — AI sudah hafal, kamu tidak perlu baca.
