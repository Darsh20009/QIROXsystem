#!/bin/bash
set -e

# Keep post-merge setup deterministic and non-interactive. The project uses
# MongoDB as its primary database; the legacy Drizzle db:push command targets
# PostgreSQL and must not run automatically during a merge.
npm ci --ignore-scripts --legacy-peer-deps
npm run build
