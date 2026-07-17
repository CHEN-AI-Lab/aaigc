#!/usr/bin/env python3
"""Check that zh-CN.json and en.json have identical key structures."""

import json
import sys
from pathlib import Path


def flatten(obj, prefix=""):
    """Flatten nested JSON to dot-separated keys."""
    keys = set()
    for k, v in obj.items():
        full = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            keys.update(flatten(v, full))
        else:
            keys.add(full)
    return keys


def main():
    msgs = Path("shared/messages")
    zh = json.loads((msgs / "zh-CN.json").read_text())
    en = json.loads((msgs / "en.json").read_text())

    zh_keys = flatten(zh)
    en_keys = flatten(en)

    missing_en = zh_keys - en_keys
    missing_zh = en_keys - zh_keys

    errors = 0
    if missing_en:
        print(f"❌ Keys in zh-CN.json but missing in en.json ({len(missing_en)}):")
        for k in sorted(missing_en):
            print(f"   - {k}")
        errors += 1

    if missing_zh:
        print(f"❌ Keys in en.json but missing in zh-CN.json ({len(missing_zh)}):")
        for k in sorted(missing_zh):
            print(f"   - {k}")
        errors += 1

    if errors == 0:
        print(f"✅ All translation keys match between zh-CN and en ({len(zh_keys)} keys)")
        return 0
    return 1


if __name__ == "__main__":
    sys.exit(main())