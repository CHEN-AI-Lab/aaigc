#!/usr/bin/env bash
# scripts/check-light.sh — WSL 轻量验证
# 每次改代码后执行此脚本，避免撑爆系统
# 详见 docs/lightweight-verify-checklist.md
set -euo pipefail
cd "$(git rev-parse --show-toplevel 2>/dev/null || echo ".")"

echo "╔══════════════════════════════════╗"
echo "║   AAIGC Lightweight Verify      ║"
echo "║   WSL-safe: single-fork, quick  ║"
echo "╚══════════════════════════════════╝"

errors=0

echo ""
echo "=== Step 1: JSON validation ==="
if python3 -c "
import json, os, sys
errs = 0
for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.next', 'dist')]
    for f in files:
        if f.endswith('.json'):
            p = os.path.join(root, f)
            try:
                json.loads(open(p, encoding='utf-8').read())
            except Exception as e:
                print(f'  ❌ {p}: {e}')
                errs += 1
if errs == 0:
    print('  ✅ All JSON files valid')
else:
    print(f'  ❌ {errs} JSON files invalid')
    sys.exit(1)
"; then
    echo "  ✅ JSON check passed"
else
    echo "  ❌ JSON check failed"
    ((errors++))
fi

echo ""
echo "=== Step 2: Translation key check ==="
if python3 scripts/check-translations.py; then
    echo "  ✅ Translation check passed"
else
    echo "  ❌ Translation check failed"
    ((errors++))
fi

echo ""
echo "=== Step 3: Structure check ==="
if bash scripts/check-structure.sh; then
    echo "  ✅ Structure check passed"
else
    echo "  ❌ Structure check failed"
    ((errors++))
fi

echo ""
echo "=== Step 4: TypeScript type check ==="
echo "  → shared..."
if ! pnpm --filter shared exec -- tsc --noEmit; then
    echo "  ❌ shared typecheck failed"
    ((errors++))
fi
echo "  → web..."
if ! pnpm --filter web exec -- tsc --noEmit; then
    echo "  ❌ web typecheck failed"
    ((errors++))
fi
echo "  ✅ TypeScript check passed"

echo ""
echo "=== Step 5: Unit tests (single fork, safe) ==="
if pnpm vitest run \
    --pool=forks \
    --poolOptions.forks.singleFork \
    --maxWorkers=1; then
    echo "  ✅ Tests passed"
else
    echo "  ❌ Tests failed"
    ((errors++))
fi

echo ""
echo "╔══════════════════════════════════╗"
if [ "$errors" -eq 0 ]; then
    echo "║   ✅ ALL CHECKS PASSED           ║"
else
    echo "║   ❌ $errors CHECK(S) FAILED       ║"
fi
echo "╚══════════════════════════════════╝"
exit $errors