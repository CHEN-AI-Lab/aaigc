#!/usr/bin/env python3
"""用户可见硬编码文案扫描（i18n 门禁）。

判定规则：**含中日韩字符、且不在注释里的字符串字面量**视为违规。

明确豁免：
  * 代码注释（// /* */ /// //! * 开头）—— 注释是给维护者看的，
    本项目文档一律中文，翻成英文反而损失信息
  * 在 allowlist 里登记的文件 —— 用于「已知但暂缓」的情况，
    每条都必须写明原因和跟进单，不允许无理由豁免

当前不扫描 Rust（apps/desktop/src-tauri/src）：桌面端原生菜单/托盘文案
确实需要本地化，但本机没有 Rust 工具链、改了无法验证，已登记为已知缺口，
等有工具链时再纳入（届时应由 build.rs 从 shared/messages 生成 locales.rs）。

用法：
    python3 scripts/check-i18n-hardcode.py            # 违规即退出码 1
    python3 scripts/check-i18n-hardcode.py --list     # 只列出，不判失败
"""

from __future__ import annotations

import io
import json
import os
import re
import sys

CJK = re.compile(r"[\u4e00-\u9fff\u3040-\u30ff]")
COMMENT_PREFIXES = ("//", "/*", "*", "///", "//!", "#", "<!--")

ALLOWLIST_PATH = ".i18n-hardcode-allowlist.json"

SCAN_ROOTS = ["apps"]
SCAN_EXTS = (".ts", ".tsx")
EXCLUDE_DIRS = {"node_modules", ".next", "target", "dist", "build", ".turbo", ".vercel"}


def load_allowlist() -> dict:
    if not os.path.exists(ALLOWLIST_PATH):
        return {}
    with io.open(ALLOWLIST_PATH, encoding="utf-8") as f:
        return json.load(f)


def iter_files():
    for root in SCAN_ROOTS:
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
            for name in filenames:
                if name.endswith(SCAN_EXTS):
                    yield os.path.join(dirpath, name)


# 行尾注释：匹配 // 但排除 URL 里的 ://
TRAILING_COMMENT = re.compile(r"(?<!:)\/\/")

# 开发期诊断：不展示在 UI 上，豁免（构建脚本报错也属于此类）
DEV_DIAGNOSTIC = re.compile(r"\b(console\.(error|warn|info|log)|throw\s+new\s+Error)\b")


def strip_comments(line: str) -> str:
    """去掉行尾 // 注释，但保留 http:// 之类的协议前缀。"""
    m = TRAILING_COMMENT.search(line)
    if m:
        return line[: m.start()]
    return line


def scan_file(path: str) -> list[tuple[int, str]]:
    hits = []
    with io.open(path, encoding="utf-8") as f:
        for i, line in enumerate(f, start=1):
            stripped = line.strip()
            if not stripped:
                continue
            # JSX 注释 {/* ... */} 与块注释
            if stripped.startswith(COMMENT_PREFIXES) or stripped.startswith("{/*"):
                continue
            code = strip_comments(stripped).strip()
            if not code:
                continue
            if DEV_DIAGNOSTIC.search(code):
                continue
            if not CJK.search(code):
                continue
            hits.append((i, code[:120]))
    return hits


def main() -> int:
    list_only = "--list" in sys.argv
    allowlist = load_allowlist()

    violations: dict[str, list[tuple[int, str]]] = {}
    allowed_hits: dict[str, int] = {}

    for path in iter_files():
        key = path.replace("\\", "/")
        hits = scan_file(path)
        if not hits:
            continue
        if key in allowlist:
            allowed_hits[key] = len(hits)
        else:
            violations[key] = hits

    print("=== i18n hardcode check ===")

    if allowed_hits:
        print("已登记豁免（需有跟进单，不允许无理由豁免）：")
        for path, n in sorted(allowed_hits.items()):
            print("  %-56s %3d 处  —— %s" % (path, n, allowlist.get(path, "(缺原因)")))

    if not violations:
        print("✅ i18n hardcode check passed")
        return 0

    print("❌ 发现硬编码的用户可见文案：")
    for path, hits in sorted(violations.items()):
        print("  %s" % path)
        for lineno, text in hits[:8]:
            print("    %d: %s" % (lineno, text))
        if len(hits) > 8:
            print("    …… 另有 %d 处" % (len(hits) - 8))

    print()
    print("处理：把文案下沉到 shared/messages 的对应命名空间（4 语种齐备）；")
    print("      确有理由暂缓的，登记进 %s 并写明原因与跟进单。" % ALLOWLIST_PATH)

    if list_only:
        return 0
    print("❌ i18n hardcode check FAILED")
    return 1


if __name__ == "__main__":
    sys.exit(main())
