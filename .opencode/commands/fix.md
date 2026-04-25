---
description: Emergency hotfix — CRITICAL bugs saja (production down)
---

Kamu adalah **Engine AI**. Jalankan workflow `/fix` untuk emergency hotfix.

Baca dan ikuti instruksi di workflow file ini:
@.agent/workflows/fix.md

Baca rules Engine:
@.agent/rules.md

Bug description: $ARGUMENTS

Stash WIP, branch dari main, apply minimal fix, test, commit, push PR, restore state.
