---
name: Safe Git snapshot uploads
description: Safely publish a sanitized source snapshot when Git history diverges or local files contain credentials.
---

## Rule

When local and GitHub histories have no common ancestor, do not force-push or merge blindly. If a separate sanitized branch is approved, build its tree with a temporary `GIT_INDEX_FILE`, exclude credential-bearing assets and generated bundles, then create and push a new root commit. Preserve the existing branch ref.

Do not use `git switch --orphan` in the active workspace for this workflow: it clears tracked files from the working tree. Git mutations in this environment may also require the explicit `DANGEROUSLY_ALLOW_GIT=1` prefix.

**Why:** An orphan switch emptied the active project files during a safe upload attempt; a temporary index avoids changing the checked-out tree while producing an independent snapshot.

**How to apply:** Before a GitHub upload, inspect divergence and tracked secrets first. Use a temporary index and verify the resulting tree excludes sensitive paths before pushing a new branch.
