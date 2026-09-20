#!/usr/bin/env python3
"""小程序主包体积门禁。

为什么需要它（以及为什么不能只靠"记得量一次"）：
微信小程序主包上限 **2MB**。架构 R-H 一度是最高风险项，T05.2.2 的 spike
实测 376K（Taro runtime 132KB）后降级为"余量充足"——但那是**只有 base64
一个工具**的数据，不是 22+ 个工具全量接入后的数据。

余量是否还够，取决于**之后每一个新增工具的实际增量**，而不是那次 spike。
而"每次新增工具后记得量一次"是靠人的纪律，纪律不可靠（本项目已经因为
假绿门禁栽过三次）。所以这里改成自动门禁：超阈值就让门禁红，不依赖记忆。

阈值留了安全边距（2MB 上限 → 1.5MB 告警 / 1.8MB 失败），给分包调整留出空间。

⚠️ 当前实现统计的是 **dist 整体**。等后续接入分包（subpackages）后，
主包只等于 dist 根层级 + pages/，子包目录要排除——届时本脚本需要相应调整，
别以为它一直是对的。

用法：
    python3 scripts/check-weapp-bundle-size.py              # 门禁模式
    python3 scripts/check-weapp-bundle-size.py --list       # 只报告不判失败
    python3 scripts/check-weapp-bundle-size.py --record     # 追加记录到 docs/decisions.md
"""

from __future__ import annotations

import datetime
import io
import os
import sys

DIST = "apps/weapp/dist"
LIMIT = 2 * 1024 * 1024  # 2MB
WARN = int(1.5 * 1024 * 1024)
FAIL = int(1.8 * 1024 * 1024)
DECISIONS = "docs/decisions.md"


def human(n: int) -> str:
    return "%.1f KB" % (n / 1024) if n < 1024 * 1024 else "%.2f MB" % (n / (1024 * 1024))


def dist_size() -> tuple[int, list[tuple[int, str]]]:
    if not os.path.isdir(DIST):
        return 0, []
    entries = []
    total = 0
    for dirpath, dirnames, filenames in os.walk(DIST):
        dirnames[:] = [d for d in dirnames if d != "node_modules"]
        for n in filenames:
            p = os.path.join(dirpath, n)
            try:
                s = os.path.getsize(p)
            except OSError:
                continue
            total += s
            entries.append((s, p))
    entries.sort(reverse=True)
    return total, entries


def main() -> int:
    list_only = "--list" in sys.argv
    record = "--record" in sys.argv

    total, entries = dist_size()

    print("=== 小程序主包体积检查 ===")
    if total == 0:
        print("⚠️ 找不到 %s（还没构建？先跑 Taro build）" % DIST)
        print("   跳过体积检查（不判失败）")
        return 0

    print("  当前：%s / 上限 %s（%.1f%%）" % (human(total), human(LIMIT), total * 100.0 / LIMIT))
    print("  阈值：告警 %s，失败 %s" % (human(WARN), human(FAIL)))
    print()
    print("  体积最大的文件：")
    for s, p in entries[:8]:
        print("    %10s  %s" % (human(s), p))

    if record:
        os.makedirs(os.path.dirname(DECISIONS), exist_ok=True)
        line = "- %s 小程序主包 %s（上限 %s，%.1f%%）\n" % (
            datetime.date.today().isoformat(),
            human(total),
            human(LIMIT),
            total * 100.0 / LIMIT,
        )
        with io.open(DECISIONS, "a", encoding="utf-8") as f:
            f.write(line)
        print()
        print("  已追加记录到 %s" % DECISIONS)

    # ⚠️ 不能让「dist 不存在 / 只剩残渣」静默通过 —— 那跟假绿门禁是同一个毛病：
    # 什么都没量到，却报了个绿。所以除了上限，还要有下限 sanity check。
    SANITY_MIN = 100 * 1024  # 一个跑了 Taro 的产物不可能小于 100KB
    if total < SANITY_MIN:
        print()
        print("⚠️ 产物体积只有 %s，远低于一个完整 Taro 构建的合理下限（%s）" % (human(total), human(SANITY_MIN)))
        print("   多半是 dist 未构建、被清理过、或构建中途失败留下了残渣。")
        print("   **本检查实际上什么都没量到**，不要把它当成'体积没问题'。")
        print("   先跑一次完整构建再来看这个数。")
        return 0 if list_only else 1

    if total >= FAIL:
        print()
        print("❌ 主包体积超过失败阈值 %s" % human(FAIL))
        print("   处理：把工具拆成分包 + preloadRule，或按 toolId 切片 messages")
        print("❌ Weapp bundle size check FAILED")
        return 0 if list_only else 1

    if total >= WARN:
        print()
        print("⚠️ 主包体积进入告警区（%s），距失败阈值还剩 %s" % (human(WARN), human(FAIL - total)))
        print("   建议现在就规划分包，别等超限再救火")

    print("✅ Weapp bundle size check passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
