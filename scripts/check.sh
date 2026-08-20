#!/usr/bin/env bash
set -euo pipefail

echo "=== AAIGC Quality Gate ==="

echo ""
echo "Step 1: Structure check..."
bash scripts/check-structure.sh

echo ""
echo "Step 1.5: Migration safety check..."
bash scripts/check-migration-safety.sh
echo ""

echo "Step 2: Translation key check..."
python3 scripts/check-translations.py
echo ""

echo "Step 3: Lint..."
(cd apps/web && npx eslint . 2>&1)
echo ""

echo "Step 4: TypeScript check..."
rm -rf apps/web/.next 2>/dev/null
(cd apps/web && npx tsc --noEmit)
echo ""

echo "Step 5: Unit tests..."
cd "$(git rev-parse --show-toplevel)" && pnpm test 2>&1
echo ""

echo "Step 6: Production build..."
pnpm build 2>&1
echo ""

echo "=== ✅ All checks passed ==="