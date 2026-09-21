#!/usr/bin/env bash
# messages 切片防漂移门禁
#
# 链路：shared/messages/*.json（真源）
#       → scripts/build-shared-messages.mjs
#       → shared/js/messages/<locale>/<namespace>.json（构建产物，小程序端按 namespace 载入）
#
# 为什么要有这道检查：
# 切片是**构建产物**，别人 clone 下来不跑 build:messages 就没有；改了源文案而没重新生成切片，
# 小程序端会静默用旧文案，且不报错。
#
# 2026-09-21：原 check-shared-js.sh 同时检查 shared.mjs 与切片。shared.mjs 已删除（T01.3
# 取消 —— Taro 实测能直接编译 shared/ 的 TS 源码，它成了死代码），故本脚本只保留切片检查。
#
# ⚠️ 为什么不能只靠退出码：
# node 脚本在 env 缺失时可能**以退出码 0 结束**（本项目已因此出现过假绿）。所以改为：把输出落到
# 临时文件，再对**输出内容**做失败判定；退出码只作辅助信号。
set -uo pipefail

echo "=== Message slices drift check ==="

logfile=/tmp/aaigc-slices-check.log
fail=0

node scripts/build-shared-messages.mjs --check >"$logfile" 2>&1
rc=$?
cat "$logfile"

if grep -qE '❌|请运行|could not be found|不可用|不一致' "$logfile"; then
  echo "❌ 输出包含失败特征"
  fail=1
fi

if [ "${rc:-0}" -ne 0 ]; then
  echo "❌ 命令以退出码 ${rc} 失败"
  fail=1
fi

if ! grep -q "✅" "$logfile"; then
  echo "❌ 未输出成功标记——很可能被环境静默跳过（假绿）"
  fail=1
fi

if [ "$fail" -ne 0 ]; then
  echo "❌ Message slices drift check FAILED"
  exit 1
fi

echo "✅ Message slices drift check passed"
