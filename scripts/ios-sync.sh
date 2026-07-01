#!/bin/bash
set -e

echo "[ios-sync] Installing dependencies..."
npm install --include=dev

echo "[ios-sync] Running cap sync ios..."
npx cap sync ios

echo "[ios-sync] Done."
