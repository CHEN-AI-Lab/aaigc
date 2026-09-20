#!/usr/bin/env bash
# 桌面端语言集合一致性门禁
#
# 背景：桌面端的原生菜单/托盘/窗口标题要给用户看，但这些字符串在 Rust 侧、
# 而菜单是在页面加载前的 setup() 里建好的 —— 那时没有站点 i18n 运行时可用，
# 所以 Rust 侧需要自持一份四语文案（src-tauri/src/locale.rs）。
#
# 这带来一个真实风险：**语言集合出现第三份清单**。
# 真源是 shared/constants/locales.ts；一旦有人在那里增删语言，
# locale.rs 不会自动跟着变，也不会有任何报错 —— 直到用户看到缺翻译的菜单。
#
# 本脚本做的事：把三处语言集合两两对齐，不一致即失败。
#   1. shared/constants/locales.ts 的 locales
#   2. apps/desktop/src-tauri/src/locale.rs 的 SUPPORTED
#   3. shared/js/messages 下实际生成切片的目录名（构建产物）

set -uo pipefail

fail=0

extract_ts_locales() {
  # 取 export const locales = ['en', 'zh-CN', ...] 里的字面量
  sed -n "s/.*export const locales = \[\(.*\)\].*/\1/p" shared/constants/locales.ts \
    | tr -d "'\" " \
    | tr ',' '\n' \
    | sed '/^$/d' \
    | sort
}

extract_rs_locales() {
  # 取 const SUPPORTED: [&str; 4] = ["en", "zh-CN", ...];
  sed -n 's/.*const SUPPORTED.*= \[\(.*\)\];.*/\1/p' apps/desktop/src-tauri/src/locale.rs \
    | tr -d '" ' \
    | tr ',' '\n' \
    | sed '/^$/d' \
    | sort
}

extract_slice_locales() {
  ls shared/js/messages 2>/dev/null | sort
}

TS=$(extract_ts_locales)
RS=$(extract_rs_locales)
SLICES=$(extract_slice_locales)

if [ -z "$TS" ]; then
  echo "❌ 无法从 shared/constants/locales.ts 解析出 locales"
  fail=1
fi

if [ -z "$RS" ]; then
  echo "❌ 无法从 apps/desktop/src-tauri/src/locale.rs 解析出 SUPPORTED"
  fail=1
fi

echo "=== Desktop locale sync check ==="
echo "locales.ts : $(echo "$TS" | tr '\n' ' ')"
echo "locale.rs  : $(echo "$RS" | tr '\n' ' ')"
echo "slices     : $(echo "$SLICES" | tr '\n' ' ')"

if [ -n "$TS" ] && [ -n "$RS" ] && [ "$TS" != "$RS" ]; then
  echo "❌ locale.rs 的 SUPPORTED 与 locales.ts 的 locales 不一致"
  diff <(echo "$TS") <(echo "$RS") | sed 's/^/    /'
  fail=1
fi

if [ -z "$SLICES" ]; then
  echo "❌ 找不到 shared/js/messages 切片目录（需先 pnpm --filter shared build:messages）"
  fail=1
elif [ -n "$TS" ] && [ "$TS" != "$SLICES" ]; then
  echo "❌ messages 切片目录与 locales.ts 的 locales 不一致（需重新 pnpm --filter shared build:messages）"
  diff <(echo "$TS") <(echo "$SLICES") | sed 's/^/    /'
  fail=1
fi

if [ "$fail" -ne 0 ]; then
  echo "❌ Desktop locale sync check FAILED"
  exit 1
fi

echo "✅ Desktop locale sync check passed"
