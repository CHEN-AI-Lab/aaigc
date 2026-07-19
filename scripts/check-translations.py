#!/usr/bin/env python3
"""Check that zh-CN.json, ja.json and en.json have identical key structures."""

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


def check_pair(msgs: Path, path_a: str, path_b: str, name_a: str, name_b: str) -> int:
    a = json.loads((msgs / path_a).read_text())
    b = json.loads((msgs / path_b).read_text())

    a_keys = flatten(a)
    b_keys = flatten(b)

    missing_b = a_keys - b_keys
    missing_a = b_keys - a_keys

    errors = 0
    if missing_b:
        print(f"❌ Keys in {name_a} but missing in {name_b} ({len(missing_b)}):")
        for k in sorted(missing_b):
            print(f"   - {k}")
        errors += 1

    if missing_a:
        print(f"❌ Keys in {name_b} but missing in {name_a} ({len(missing_a)}):")
        for k in sorted(missing_a):
            print(f"   - {k}")
        errors += 1

    if errors == 0:
        print(f"✅ All translation keys match between {name_a} and {name_b} ({len(a_keys)} keys)")
    return errors


def main():
    msgs = Path("shared/messages")
    errors = 0
    errors += check_pair(msgs, "zh-CN.json", "en.json", "zh-CN", "en")
    errors += check_pair(msgs, "ja.json", "en.json", "ja", "en")
    if errors == 0:
        print("✅ All translation files have matching key structures!")
        return 0
    return 1


if __name__ == "__main__":
    sys.exit(main())