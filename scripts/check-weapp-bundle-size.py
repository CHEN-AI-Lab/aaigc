#!/usr/bin/env python3
"""小程序主包体积门禁（架构 R-H）。

为什么需要它（以及为什么不能只靠"记得量一次"）：
微信小程序主包上限 **2MB**。架构 R-H 一度是最高风险项；T05.2.2 的 spike 实测
376K（Taro runtime 132KB）后降级为"余量充足（缓解手段常备）"——但那是**只有
base64 一个工具**的数据，不是 22+ 个工具全量接入后的数据。余量是否还够，取决于
之后每一个新增工具的实际增量。而"每次新增工具后记得量一次"靠的是人的纪律，
纪律在本项目已经失效过多次（三次假绿门禁、两处 web-only 类型检查）。

所以这里改成自动门禁：超阈值就红，不依赖记忆。

阈值留安全边距（2MB 上限 → 1.5MB 告警 / 1.8MB 失败），给分包调整留出反应空间。

**分包处理**：主包 ≠ dist 整体。一旦配置了 subpackages，主包只等于
「dist 根层级 + pages/」，子包目录必须排除，否则会把子包体积算进主包、误报超限。
本脚本从 `dist/app.json` 的 `subPackages[].root` 自动读取并排除——**不要改成
手填名单**，手填名单迟早会和真实配置脱节（这正是本脚本要防的那类问题）。

同时校验：源码 `src/app.config.ts` 声明的分包与构建产物 `dist/app.json` 是否一致，
不一致说明产物是旧的（构建没跑或跑失败了），此时量出来的数没有意义。

用法：
    python3 scripts/check-weapp-bundle-size.py              # 门禁模式
    python3 scripts/check-weapp-bundle-size.py --list       # 只报告，不判失败
    python3 scripts/check-weapp-bundle-size.py --record     # 追加记录到 docs/decisions.md
"""

from __future__ import annotations

import datetime
import io
import json
import os
import re
import sys

DIST = "apps/weapp/dist"
DIST_APP_JSON = os.path.join(DIST, "app.json")
SRC_APP_CONFIG = "apps/weapp/src/app.config.ts"

MAIN_LIMIT = 2 * 1024 * 1024
WARN = int(1.5 * 1024 * 1024)
FAIL = int(1.8 * 1024 * 1024)

# 单个分包同样受 2MB 限制。
# ⚠️ 该数值来自微信小程序分包规范，但**未在本项目实测**（目前还没有分包）。
#    首次接入分包时请以真机/开发者工具为准核对一次，并在核对后删掉这句说明。
SUBPACKAGE_LIMIT = 2 * 1024 * 1024

# 一个完整 Taro 构建不可能小于这个值；小于它说明 dist 是空的或只是残渣
SANITY_MIN = 100 * 1024

DECISIONS = "docs/decisions.md"


def human(n: int) -> str:
    return "%.1f KB" % (n / 1024) if n < 1024 * 1024 else "%.2f MB" % (n / (1024 * 1024))


def read_subpackage_roots_from_dist() -> list[str]:
    """从构建产物 dist/app.json 读分包 root（真实生效的分包）。"""
    if not os.path.exists(DIST_APP_JSON):
        return []
    try:
        with io.open(DIST_APP_JSON, encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        return []
    roots = []
    for sp in data.get("subPackages") or []:
        r = (sp.get("root") or "").strip().strip("/")
        if r:
            roots.append(r)
    return roots


def read_subpackage_roots_from_src() -> list[str]:
    """从源码 src/app.config.ts 声明的分包里粗提 root。

    只做保守提取：能识别 `root: 'xxx'` / `root: "xxx"` 的写法。
    识别不出来就返回空——宁可漏报，也不要因为误判把真正的子包算进主包之外。
    """
    if not os.path.exists(SRC_APP_CONFIG):
        return []
    text = io.open(SRC_APP_CONFIG, encoding="utf-8").read()
    if "subPackages" not in text:
        return []
    roots = []
    for m in re.finditer(r"root:\s*['\"]([^'\"]+)['\"]", text):
        r = m.group(1).strip().strip("/")
        if r:
            roots.append(r)
    return roots


def measure(root: str, exclude_roots: list[str]) -> tuple[int, list[tuple[int, str]]]:
    """统计 dist 下、排除分包目录之后的大小。"""
    excl = {os.path.normpath(os.path.join(DIST, r)) for r in exclude_roots}
    total = 0
    entries: list[tuple[int, str]] = []
    for dirpath, dirnames, filenames in os.walk(DIST):
        dirnames[:] = [d for d in dirnames if d != "node_modules"]
        np = os.path.normpath(dirpath)
        if np in excl:
            dirnames[:] = []
            continue
        if any(np.startswith(e + os.sep) for e in excl):
            continue
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


def measure_dir(sub_root: str) -> int:
    d = os.path.join(DIST, sub_root)
    if not os.path.isdir(d):
        return 0
    total = 0
    for dirpath, dirnames, filenames in os.walk(d):
        dirnames[:] = [x for x in dirnames if x != "node_modules"]
        for n in filenames:
            try:
                total += os.path.getsize(os.path.join(dirpath, n))
            except OSError:
                pass
    return total


def main() -> int:
    list_only = "--list" in sys.argv
    record = "--record" in sys.argv

    print("=== 小程序主包体积检查（2MB 上限）===")

    if not os.path.isdir(DIST):
        print("⚠️ 找不到 %s（还没构建？）" % DIST)
        print("   **本检查实际上什么都没量到**，不要把它当成'体积没问题'")
        return 0 if list_only else 1

    sub_roots = read_subpackage_roots_from_dist()
    total, entries = measure(DIST, sub_roots)

    if sub_roots:
        print("  分包（已从主包统计中排除）：%s" % ", ".join(sub_roots))
    else:
        print("  分包：无（未配置 subPackages，主包 = 整个 dist）")

    print("  主包：%s / 上限 %s（%.1f%%）" % (human(total), human(MAIN_LIMIT), total * 100.0 / MAIN_LIMIT))
    print("  阈值：告警 %s，失败 %s" % (human(WARN), human(FAIL)))

    # 产物与源码的分包声明是否一致（不一致 = 产物是旧的）
    src_roots = read_subpackage_roots_from_src()
    if src_roots and set(src_roots) != set(sub_roots):
        print()
        print("⚠️ 源码声明的分包与构建产物不一致：")
        print("     src/app.config.ts : %s" % (", ".join(src_roots) or "(无)"))
        print("     dist/app.json     : %s" % (", ".join(sub_roots) or "(无)"))
        print("   说明 dist 是旧产物（构建没跑或中途失败），此时量出来的数没有意义。")
        return 0 if list_only else 1

    print()
    print("  主包内体积最大的文件：")
    for s, p in entries[:8]:
        print("    %10s  %s" % (human(s), p))

    if sub_roots:
        print()
        print("  各分包体积（单个上限 %s）：" % human(SUBPACKAGE_LIMIT))
        for r in sub_roots:
            sz = measure_dir(r)
            flag = " ❌超限" if sz >= SUBPACKAGE_LIMIT else ""
            print("    %10s  %s%s" % (human(sz), r, flag))
            if sz >= SUBPACKAGE_LIMIT:
                return 0 if list_only else 1

    if total < SANITY_MIN:
        print()
        print("⚠️ 主包体积只有 %s，远低于完整 Taro 构建的合理下限（%s）" % (human(total), human(SANITY_MIN)))
        print("   多半是 dist 未构建、被清理过、或构建中途失败留下残渣。")
        print("   **本检查实际上什么都没量到**，不要把它当成'体积没问题'。")
        return 0 if list_only else 1

    if total >= FAIL:
        print()
        print("❌ 主包体积超过失败阈值 %s" % human(FAIL))
        print("   处理：把工具拆成分包 + preloadRule，或按 toolId 切片 messages")
        print("❌ Weapp bundle size check FAILED")
        return 0 if list_only else 1

    if total >= WARN:
        print()
        print("⚠️ 主包进入告警区（%s），距失败阈值还剩 %s" % (human(WARN), human(FAIL - total)))
        print("   建议现在就规划分包，别等超限再救火")

    if record:
        os.makedirs(os.path.dirname(DECISIONS), exist_ok=True)
        line = "- %s 小程序主包 %s（上限 %s，%.1f%%）\n" % (
            datetime.date.today().isoformat(),
            human(total),
            human(MAIN_LIMIT),
            total * 100.0 / MAIN_LIMIT,
        )
        with io.open(DECISIONS, "a", encoding="utf-8") as f:
            f.write(line)
        print()
        print("  已追加记录到 %s" % DECISIONS)

    print("✅ Weapp bundle size check passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
