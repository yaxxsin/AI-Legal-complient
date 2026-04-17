---
description: Create Pull Request dari feature branch ke main
---

## /ship — Pull Request

### Steps

1. Run `git branch --show-current` → verify bukan `main`
2. Run `git log main..HEAD --oneline` → commits in PR
3. Run `git diff main --stat` → files changed summary
4. Generate PR body:
   - Description: ringkasan perubahan
   - Phase/Backlog reference
   - Changes per file/module
   - Security checklist (5 items dari rules)
   - Breaking changes list
5. Preview → tunggu approval
6. Jika `gh` CLI ada: `gh pr create --title "[title]" --body "[body]"`
   Jika tidak: tampilkan instruksi manual

### Rules

- JANGAN PR dari main ke main
- SELALU isi security checklist
- SELALU reference Phase/Backlog ID
- PR title format: `[phase-XX] type: description`
