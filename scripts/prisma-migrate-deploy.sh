#!/usr/bin/env bash
# Prisma migrate deploy with auto-baseline for P3005
# P3005 = database has tables but no migration history
set -euo pipefail

PRISMA="npx prisma"
MIGRATIONS=("0001_init" "20260807105608_add_favorites_likes" "20260807_add_type" "20260809_add_terms_agreed_at" "20260810_add_email_verified")

OUTPUT=$($PRISMA migrate deploy 2>&1) || true

if echo "$OUTPUT" | grep -q "P3005"; then
  echo "⚠️  P3005 detected — baselining existing migrations..."
  for m in "${MIGRATIONS[@]}"; do
    $PRISMA migrate resolve --applied "$m"
  done
  echo "✅ Baseline complete. Retrying prisma migrate deploy..."
  $PRISMA migrate deploy
else
  echo "$OUTPUT"
fi