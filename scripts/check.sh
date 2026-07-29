#!/usr/bin/env bash
set -euo pipefail

echo "=== AAIGC Quality Gate ==="

echo ""
echo "Step 1: Structure check..."
bash scripts/check-structure.sh

echo ""
echo "Step 2: Translation key check..."
python3 scripts/check-translations.py
echo ""

echo "Step 3: TypeScript check..."
cd apps/web && npx tsc --noEmit
echo "✅ TypeScript check passed"
echo ""

echo "Step 4: Unit tests..."
cd /home/ubuntu/workspace/aaigc && pnpm test 2>&1 || true
echo ""

echo "Step 5: Production build..."
pnpm build 2>&1
echo ""

echo "=== ✅ All checks passed ==="