# 🧠 ENGINE STATE — ACTIVE POINTER

> File ini dibaca PERTAMA saat /go atau setelah continue.
> Menunjuk ke phase state yang sedang aktif.

## ACTIVE
- **Phase**: (none)
- **State File**: (none)
- **Developer**: (unset)
- **Since**: (unset)

## PHASE INDEX
| Phase | State File | Status | Last Active |
|-------|-----------|--------|-------------|
<!-- Phases will be auto-populated by /init or /plan -->

## LOCK
<!-- Jika ada conversation aktif yang sedang kerja di phase ini -->
- **Locked**: No
- **By**: -
- **Since**: -

---

> **Recovery Protocol:**
> 1. Baca file ini → identifikasi phase aktif
> 2. Baca state file yang ditunjuk → load full context
> 3. Verify breadcrumbs → confirm file state matches reality
> 4. Run `git diff --stat` → detect untracked changes
> 5. Lanjut kerja
