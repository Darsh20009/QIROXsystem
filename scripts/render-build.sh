#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Render runs the configured build command as the full build phase. Restore the
# lockfile-defined app dependencies (including Vite and esbuild) before adding
# runtime-only packages below.
NPM_CI_ARGS=(--include=dev --ignore-scripts --no-audit --no-fund)
if [[ -n "${RENDER_SERVICE_ID:-}" || -n "${RENDER:-}" ]]; then
  # Replit's lockfile URLs include both a private host and an /npm/ path prefix.
  # Normalize those URLs for Render before npm ci; host replacement alone keeps
  # the prefix and produces invalid registry.npmjs.org/npm/... URLs.
  node scripts/normalize-render-lock.mjs
  NPM_CI_ARGS+=(--registry=https://registry.npmjs.org)
fi
npm ci "${NPM_CI_ARGS[@]}"

RUNTIME_DIR="$(mktemp -d)"
trap 'rm -rf "$RUNTIME_DIR"' EXIT

printf '{"name":"runtime","version":"1.0.0","private":true}\n' > "$RUNTIME_DIR/package.json"

(
  cd "$RUNTIME_DIR"
  npm install --no-audit --no-fund --ignore-scripts \
    @whiskeysockets/baileys \
    passkit-generator \
    @huggingface/transformers \
    @pdf-lib/fontkit@1.1.1 \
    protobufjs@7.6.5
  npm install --no-audit --no-fund onnxruntime-node
)

mkdir -p "$ROOT_DIR/node_modules"
cp -R "$RUNTIME_DIR/node_modules/." "$ROOT_DIR/node_modules/"
npm run build
