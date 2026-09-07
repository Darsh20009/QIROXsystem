---
name: dist/index.cjs git exclusion
description: The bundled server artifact must not be committed — it bakes in secrets that trigger GitHub push protection.
---

# dist/index.cjs — excluded from git

## Rule
`dist/index.cjs` (and `dist/index.cjs.map`) must stay in `.gitignore` and must never be committed.

**Why:** The esbuild server bundle inlines all `import`ed source, including any API keys stored in env-loaded modules (e.g. Mistral AI key). GitHub's push protection scans for known secret patterns and rejects the push with `GH013: Repository rule violations`.

**How to apply:** After every `node script/build.mjs` the file is regenerated locally and used at runtime, but `git add -A` will skip it because `.gitignore` has the entry. Confirm with `git status` before pushing — if `dist/index.cjs` appears as staged, run `git rm --cached dist/index.cjs` before committing.
