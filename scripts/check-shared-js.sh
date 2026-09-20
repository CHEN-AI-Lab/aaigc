#!/usr/bin/env bash
# 双源防漂移门禁（架构 §2.5 防漂移三件套之 2）
#  1. 重建 shared.mjs 到临时目录 → 与入库产物 diff → 有差异即失败
#  2. 重建 messages 切片 → 与入库切片 diff → 有差异即失败
#
# ⚠️ 为什么这里不能只靠退出码：
# 两个 node 脚本在失败时都会**以退出码 0 退出**（esbuild 平台二进制缺失时尤其明显，
# 它内部会覆盖掉我们的 exit 1）。而且 esbuild 那段 stderr 连 $(... 2>&1) 都抓不到。
# 所以本脚本改为：把输出落到临时文件，再对**输出内容**做失败判定。
# 退出码只看作辅助信号，不作为唯一依据。
set -uo pipefail

echo "=== Shared JS drift check ==="

fail=0
step=0
tmpdir=/tmp/aaigc-drift-check
mkdir -p "$tmpdir"

run_check() {
  label="$1"
  shift
  logfile="$tmpdir/step$((++step)).log"

  "$@" >"$logfile" 2>&1
  rc=$?
  cat "$logfile"

  # 失败判定：优先看输出内容里的失败特征，其次看退出码
  if grep -qE '❌|请运行|could not be found|不可用|不一致' "$logfile"; then
    echo "❌ ${label}：输出包含失败特征"
    fail=1
    return 0
  fi
  if [ "${rc:-0}" -ne 0 ]; then
    echo "❌ ${label}：命令以退出码 ${rc} 失败"
    fail=1
    return 0
  fi
  if ! grep -q "✅" "$logfile"; then
    echo "❌ ${label}：未输出成功标记——很可能被环境静默跳过（假绿）"
    fail=1
  fi
}

run_check "shared.mjs 漂移检查" node scripts/build-shared-js.mjs --check
run_check "messages 切片漂移检查" node scripts/build-shared-messages.mjs --check

if [ "$fail" -ne 0 ]; then
  echo "❌ Shared JS drift check FAILED"
  exit 1
fi

echo "✅ Shared JS drift check passed"
