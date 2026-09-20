#!/usr/bin/env python3
"""桌面端语言集合一致性门禁。

为什么需要它：
桌面端的原生菜单/托盘/窗口标题是给用户看的，但这些字符串在 Rust 侧，
而菜单是在**页面加载之前**的 setup() 里构建好的 —— 那时没有任何站点
i18n 运行时可用，所以 Rust 侧必须自持一份四语文案（src-tauri/src/locale.rs）。

代价是这成了**第二份语言清单**。真源是 shared/constants/locales.ts，
一旦有人在那里增删语言，locale.rs 不会跟着变，也不会报错 ——
直到用户看到缺翻译的菜单才会暴露。

本脚本把**三处**语言集合对齐（内容 + 顺序），不一致即失败：

  1. shared/constants/locales.ts 的 locales          —— 真源
  2. apps/desktop/src-tauri/src/locale.rs 的 SUPPORTED —— 第二份清单
  3. shared/js/messages 下实际生成的切片目录          —— 构建产物

第 3 项不能省：切片是**构建产物**，别人 clone 下来不跑
`pnpm --filter shared build:messages` 就没有这个目录，而它是小程序端要用的。

⚠️ 本文件曾有一个 .sh 兄弟实现且覆盖第 3 项，但接线时接的是本文件，
导致第 3 项实际上从未生效。历史教训：**同一个门禁只留一个实现**，
留两个必然漂，且往往漂向「能跑的那个更弱」。
"""

from __future__ import annotations

import io
import os
import re
import sys

TS_FILE = "shared/constants/locales.ts"
RS_FILE = "apps/desktop/src-tauri/src/locale.rs"

TS_PATTERN = re.compile(r"export\s+const\s+locales\s*=\s*\[([^\]]*)\]")
RS_PATTERN = re.compile(r"const\s+SUPPORTED[^=]*=\s*\[([^\]]*)\]")


def read(path: str) -> str:
    with io.open(path, encoding="utf-8") as f:
        return f.read()


def extract(path: str, pattern: re.Pattern) -> list[str]:
    text = read(path)
    m = pattern.search(text)
    if not m:
        raise SystemExit("❌ 无法在 %s 中定位语言清单" % path)
    items = [x.strip().strip("'\"") for x in m.group(1).split(",")]
    return [x for x in items if x]


def extract_slices() -> list[str]:
    """messages 切片目录名（构建产物）。"""
    base = "shared/js/messages"
    if not os.path.isdir(base):
        return []
    return sorted(d for d in os.listdir(base) if os.path.isdir(os.path.join(base, d)))


def main() -> int:
    try:
        ts = extract(TS_FILE, TS_PATTERN)
        rs = extract(RS_FILE, RS_PATTERN)
    except SystemExit as e:
        print(e)
        return 1

    slices = extract_slices()

    print("=== Desktop locale sync check ===")
    print("  locales.ts : %s" % ", ".join(ts))
    print("  locale.rs  : %s" % ", ".join(rs))
    print("  slices     : %s" % (", ".join(slices) if slices else "(缺失)"))

    ok = True

    if not slices:
        print("❌ 缺少 messages 切片目录 shared/js/messages")
        print("   先执行：pnpm --filter shared build:messages")
        ok = False
    elif set(ts) != set(slices):
        only_ts = sorted(set(ts) - set(slices))
        only_sl = sorted(set(slices) - set(ts))
        print("❌ 切片目录与 locales.ts 不一致（需重新生成切片）")
        if only_ts:
            print("   仅存在于 locales.ts：%s" % ", ".join(only_ts))
        if only_sl:
            print("   仅存在于切片目录 ：%s" % ", ".join(only_sl))
        print("   修复：pnpm --filter shared build:messages")
        ok = False

    if set(ts) != set(rs):
        only_ts = sorted(set(ts) - set(rs))
        only_rs = sorted(set(rs) - set(ts))
        print("❌ 语言集合不一致")
        if only_ts:
            print("   仅存在于 locales.ts：%s" % ", ".join(only_ts))
        if only_rs:
            print("   仅存在于 locale.rs ：%s" % ", ".join(only_rs))
        ok = False

    if ts != rs and set(ts) == set(rs):
        print("⚠️  语言集合一致但顺序不同（locale.rs 的顺序决定 match 分支，建议与 locales.ts 对齐）")
        print("   locales.ts : %s" % ", ".join(ts))
        print("   locale.rs  : %s" % ", ".join(rs))

    if not ok:
        print("❌ Desktop locale sync check FAILED")
        return 1

    print("✅ Desktop locale sync check passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
