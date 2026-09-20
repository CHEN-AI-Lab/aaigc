#!/usr/bin/env python3
"""Check that all locale files have identical key structures.

Additional checks (multi-client phase 1):
  * zh-TW is compared too (previously only zh-CN / ja vs en)
  * every ApiErrorCode defined in shared/constants/error-codes.ts must exist
    under the `errors.*` namespace of every locale (SK-2: 错误码 = i18n key)
"""

import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
MSGS = REPO_ROOT / "shared" / "messages"
ERROR_CODES_TS = REPO_ROOT / "shared" / "constants" / "error-codes.ts"
LOCALES = ["en", "zh-CN", "zh-TW", "ja"]


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


def read_api_error_codes() -> list:
    """Extract every quoted literal inside the two `*_API_ERROR_CODES` arrays."""
    if not ERROR_CODES_TS.exists():
        print("❌ shared/constants/error-codes.ts not found")
        sys.exit(1)
    source = ERROR_CODES_TS.read_text(encoding="utf-8")
    codes = []
    for name in ("LEGACY_API_ERROR_CODES", "MULTI_CLIENT_API_ERROR_CODES"):
        match = re.search(rf"{name}\s*=\s*\[(.*?)\]\s*as\s*const", source, re.S)
        if not match:
            print(f"❌ Cannot locate {name} in error-codes.ts")
            sys.exit(1)
        codes.extend(re.findall(r"'([^']+)'", match.group(1)))
    return codes


def check_error_codes(msgs: Path) -> int:
    codes = read_api_error_codes()
    errors = 0
    print(f"Checking {len(codes)} ApiErrorCode values against errors.* namespace...")
    for locale in LOCALES:
        path = msgs / f"{locale}.json"
        if not path.exists():
            print(f"❌ Missing locale file {path}")
            errors += 1
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        error_ns = data.get("errors", {})
        missing = [code for code in codes if code not in error_ns]
        if missing:
            print(f"❌ {locale}: errors.* missing {len(missing)} ApiErrorCode key(s):")
            for code in missing:
                print(f"   - errors.{code}")
            errors += 1
        else:
            print(f"✅ {locale}: all {len(codes)} ApiErrorCode keys present")
    return errors


def main():
    errors = 0
    for locale in LOCALES:
        if locale == "en":
            continue
        errors += check_pair(MSGS, f"{locale}.json", "en.json", locale, "en")
    errors += check_error_codes(MSGS)
    if errors == 0:
        print("✅ All translation files have matching key structures!")
        return 0
    return 1


if __name__ == "__main__":
    sys.exit(main())
