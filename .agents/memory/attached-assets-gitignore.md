---
name: attached_assets git exclusion
description: attached_assets/ must never be committed — Replit stores user-uploaded files there, which may include env-var dumps with live API keys/tokens.
---

# attached_assets/ — excluded from git

## Rule
`attached_assets/` is in `.gitignore` and must never be committed or staged.

**Why:** Replit stores every file the user pastes/uploads in `attached_assets/`. Users sometimes upload environment-variable exports containing GitHub PATs, Vercel tokens, API keys, etc. GitHub's push protection scans every commit and rejects on any match.

**How to apply:** Before any `git add -A`, check `git status` for `attached_assets/` entries. If they appear, they should be skipped automatically by `.gitignore`. If somehow one gets staged, run `git rm -r --cached attached_assets/` before committing.
