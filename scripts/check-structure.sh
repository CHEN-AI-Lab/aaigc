#!/usr/bin/env bash
set -euo pipefail

echo "=== Structure Check ==="

# Check 1: No hooks/ constants/ utils/ validators/ messages/ under apps/
echo "Check 1: No forbidden dirs under apps/..."
found_forbidden=false
for dir in hooks constants utils validators messages; do
  result=$(find apps -path '*/node_modules' -prune -o -path '*/.next' -prune -o -type d -name "$dir" -print 2>/dev/null || true)
  if [ -n "$result" ]; then
    echo "  ❌ Found forbidden dir '$dir' under apps/:"
    echo "$result"
    found_forbidden=true
  fi
done

# Check 2: shared/ should have key dirs
echo "Check 2: shared/ structure..."
for dir in types constants messages i18n utils; do
  if [ -d "shared/$dir" ]; then
    echo "  ✅ shared/$dir"
  else
    echo "  ❌ Missing shared/$dir"
    found_forbidden=true
  fi
done

# Check 3: messages exist
echo "Check 3: Translation files..."
for file in shared/messages/en.json shared/messages/zh-CN.json; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ Missing $file"
    found_forbidden=true
  fi
done

if [ "$found_forbidden" = true ]; then
  echo "❌ Structure check FAILED"
  exit 1
fi
echo "✅ Structure check passed"