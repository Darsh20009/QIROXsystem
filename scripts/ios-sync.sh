#!/bin/bash
set -e

echo "[ios-sync] Installing dependencies..."
npm ci --include=dev --ignore-scripts --no-audit --no-fund

echo "[ios-sync] Running cap sync ios..."
npx cap sync ios

echo "[ios-sync] Done."
