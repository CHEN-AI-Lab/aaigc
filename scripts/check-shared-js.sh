#!/usr/bin/env bash
# 双源防漂移门禁（架构 §2.5 防漂移三件套之 2）
#  1. 重建 shared.mjs 到临时目录 → 与入库产物 diff → 有差异即失败
#  2. 重建 messages 切片 → 与入库切片 diff → 有差异即失败
set -euo pipefail

echo "=== Shared JS drift check ==="

node scripts/build-shared-js.mjs --check
node scripts/build-shared-messages.mjs --check

echo "✅ Shared JS drift check passed"
