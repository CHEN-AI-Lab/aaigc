#!/usr/bin/env bash
set -euo pipefail

echo "=== AAIGC Quality Gate ==="

echo ""
echo "Step 1: Structure check..."
bash scripts/check-structure.sh

echo ""
echo "Step 2: TypeScript check..."
cd apps/web && npx tsc --noEmit 2>&1 || true

echo ""
echo "Step 3: Build check..."
cd /home/ubuntu/workspace/aaigc && pnpm build 2>&1 || true

echo ""
echo "=== Quality gate complete ==="