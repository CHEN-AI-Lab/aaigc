-- Additive migration: bind verification codes to a purpose and track failed attempts.
-- Safe for existing rows: both new columns carry a default so NOT NULL backfill is trivial.

ALTER TABLE "VerificationCode" ADD COLUMN "purpose" TEXT NOT NULL DEFAULT 'verify';
ALTER TABLE "VerificationCode" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "VerificationCode_email_purpose_idx" ON "VerificationCode"("email", "purpose");
