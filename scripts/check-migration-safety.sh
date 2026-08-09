#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Migration safety check — scan Prisma migration SQL for
# dangerous data-loss operations before they reach production.
#
# Usage: bash scripts/check-migration-safety.sh
# Exit 1 if any dangerous statement is found.
#
# Why: `prisma migrate deploy` executes migration SQL verbatim.
# If a migration contains DROP/TRUNCATE/etc, it will delete real
# production data. This check blocks such migrations in CI.
# ─────────────────────────────────────────────────────────────

set -euo pipefail

MIGRATIONS_DIR="prisma/migrations"

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "ℹ️  No prisma/migrations directory — nothing to check."
  exit 0
fi

FAILED=0

# ── Dangerous patterns (regex, case-insensitive) ─────────────
# Each entry: "description|regex"
DANGEROUS_PATTERNS=(
  "DROP TABLE|DROP TABLE"
  "DROP COLUMN|DROP COLUMN"
  "DROP SCHEMA|DROP SCHEMA"
  "TRUNCATE|TRUNCATE"
  "ALTER COLUMN TYPE|ALTER COLUMN .* TYPE"
)

echo "=== Migration Safety Check ==="
echo "Scanning $MIGRATIONS_DIR for dangerous SQL operations..."
echo ""

while IFS= read -r -d '' FILE; do
  # Skip files that aren't migration.sql
  [[ "$FILE" != *.sql ]] && continue

  # Extract migration name (parent dir)
  MIGRATION_NAME=$(basename "$(dirname "$FILE")")

  # Skip if file is empty
  [ -s "$FILE" ] || continue

  # Read file content (lowercased for matching)
  CONTENT=$(cat "$FILE")

  for entry in "${DANGEROUS_PATTERNS[@]}"; do
    DESC="${entry%%|*}"
    REGEX="${entry#*|}"
    if echo "$CONTENT" | grep -qEi "$REGEX"; then
      echo "❌ [$MIGRATION_NAME] $DESC"
      echo "   File: $FILE"
      echo ""
      FAILED=1
    fi
  done
done < <(find "$MIGRATIONS_DIR" -name "migration.sql" -print0)

if [ "$FAILED" -eq 1 ]; then
  echo "⛔ DANGER: Found destructive migration operations above."
  echo "   These will DELETE PRODUCTION DATA when deployed."
  echo "   Fix the migration SQL before proceeding."
  exit 1
else
  echo "✅ No dangerous migration operations found."
  exit 0
fi