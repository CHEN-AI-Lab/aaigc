#!/usr/bin/env python3
"""J-8 门禁：shared/tools/ 必须保持 0 第三方依赖。

为什么有这条：
`shared/tools/` 里的纯函数要被**所有端**复用 —— Web、CLI、桌面端、App、小程序。
其中小程序有 2MB 主包上限、CLI 有冷启动开销，两者对新增依赖都极度敏感。

风险在于：**给 `shared/tools/yaml-json.ts` 加一个 `js-yaml` 来"修好 GFM 表格丢失"，
在代码评审里看起来完全合理**——不过是加个依赖解决一个 bug。但代价会被五个端
一起承担，而提出改动的人往往只盯着其中一个端。

所以 J-8 把它变成显式规则：**shared/tools/** 不得 import 任何非相对路径模块**
（即不得 import 裸包名、也不得 import 别名化的 workspace 包）。

能力差要抹平，只能在**端侧**引入依赖，然后重走架构 §4.4 的 J-1~J-7。

用法：
    python3 scripts/check-shared-tools-deps.py [--list]
"""

from __future__ import annotations

import io
import os
import re
import sys

SCAN_ROOT = "shared/tools"
SCAN_EXTS = (".ts", ".tsx")

# 匹配 import / export ... from / import() / require()
IMPORT_RE = re.compile(
    r"""(?:^\s*(?:import|export)\b[^;]*?\bfrom\s*|^\s*import\s*\(|require\s*\(\s*)['"]([^'"]+)['"]""",
    re.MULTILINE,
)

# 相对路径（./ ../）与 node: 协议内建模块视为允许
ALLOWED_PREFIXES = (".", "/", "node:")


def iter_files():
    for dirpath, dirnames, filenames in os.walk(SCAN_ROOT):
        dirnames[:] = [d for d in dirnames if d != "node_modules"]
        for name in filenames:
            if name.endswith(SCAN_EXTS):
                yield os.path.join(dirpath, name)


def scan_file(path: str) -> list[tuple[int, str]]:
    with io.open(path, encoding="utf-8") as f:
        text = f.read()
    hits = []
    for m in IMPORT_RE.finditer(text):
        spec = m.group(1)
        if spec.startswith(ALLOWED_PREFIXES):
            continue
        lineno = text[: m.start()].count("\n") + 1
        hits.append((lineno, spec))
    return hits


def main() -> int:
    list_only = "--list" in sys.argv

    violations: dict[str, list[tuple[int, str]]] = {}
    total_imports = 0
    for path in iter_files():
        hits = scan_file(path)
        if hits:
            violations[path] = hits
        total_imports += len([h for h in hits]) or 0

    print("=== shared/tools 依赖检查（J-8）===")

    if not violations:
        print("✅ shared/tools 保持 0 第三方依赖（J-8 passed）")
        return 0

    print("❌ shared/tools 引入了非相对路径模块：")
    for path, hits in sorted(violations.items()):
        print("  %s" % path)
        for lineno, spec in hits:
            print("    %d: %s" % (lineno, spec))

    print()
    print("J-8：shared/tools/ 必须保持 0 第三方依赖。")
    print("      它会被 Web / CLI / 桌面端 / App / 小程序五端复用，")
    print("      其中小程序受 2MB 主包限制、CLI 有冷启动开销。")
    print("      要抹平能力差，请在**端侧**引入依赖并重走架构 §4.4 的 J-1~J-7。")

    if list_only:
        return 0
    print("❌ J-8 check FAILED")
    return 1


if __name__ == "__main__":
    sys.exit(main())
