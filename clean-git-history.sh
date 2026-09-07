#!/bin/bash
# This script creates a fresh git history without the large zip files
# Run once: bash clean-git-history.sh

set -e

echo "==> Creating clean git history (removing large files from all commits)..."

# Save current branch name
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Create orphan branch with no history
git checkout --orphan clean-main

# Stage everything (large zips are already deleted + in .gitignore)
git add -A

# Single clean commit
git commit -m "Clean history: remove large zip files exceeding GitHub 100MB limit

Previously tracked via Git LFS (budget exceeded). Files deleted:
- attached_assets/QIROXsystem-100_1774486349529.zip (139MB)
- attached_assets/QIROXsystem-80_1774494181445.zip (154MB)
- attached_assets/c-demo-3_1774156237458.zip (84MB)
- attached_assets/MeetingAppFull-main_1774489710116.zip (56MB)"

# Delete old main branch
git branch -D "$CURRENT_BRANCH" 2>/dev/null || true

# Rename this clean branch to main
git branch -m "$CURRENT_BRANCH"

echo "==> Pushing clean history to GitHub..."
git push origin "$CURRENT_BRANCH" --force

echo "==> Done! Git history is now clean."
echo "==> Total objects:" 
git count-objects -v | grep "^count"
