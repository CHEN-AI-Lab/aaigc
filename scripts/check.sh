#!/usr/bin/env bash
# AAIGC 完整质量门禁（较重，含生产构建；日常改代码用 scripts/check-light.sh）
set -euo pipefail

echo "=== AAIGC Quality Gate ==="

echo ""
echo "Step 1: Structure check..."
bash scripts/check-structure.sh

echo ""
echo "Step 1.5: Migration safety check..."
bash scripts/check-migration-safety.sh

echo ""
echo "Step 1.6: i18n hardcode check..."
python3 scripts/check-i18n-hardcode.py

echo ""
echo "Step 1.7: Desktop locale sync check..."
python3 scripts/check-desktop-locale-sync.py

echo ""
echo "Step 1.8: shared/tools 依赖检查（J-8：0 第三方依赖）..."
python3 scripts/check-shared-tools-deps.py

echo ""
echo "Step 1.9: 双源防漂移检查（shared.mjs / messages 切片）..."
bash scripts/check-shared-js.sh

echo ""
echo "Step 2: Translation key check..."
python3 scripts/check-translations.py

echo ""
echo "Step 3: Lint..."
(cd apps/web && npx eslint . 2>&1)

echo ""
# ⚠️ 不要写成 `cd apps/web && tsc`：那只会检查 web 一个包，
#    shared / cli / desktop / app 会被放过。根 typecheck 覆盖全部 workspace 包。
echo "Step 4: TypeScript check (all workspace packages)..."
pnpm typecheck

echo ""
echo "Step 5: Unit tests..."
pnpm test 2>&1

echo ""
echo "Step 6: Production build..."
pnpm build 2>&1

# 小程序主包上限 2MB（架构 R-H）。必须先构建再量，否则门禁量不到东西。
echo ""
echo "Step 6.5: Weapp build + bundle size check (2MB limit)..."
pnpm --filter weapp build 2>&1
python3 scripts/check-weapp-bundle-size.py

echo ""
echo "=== ✅ All checks passed ==="
