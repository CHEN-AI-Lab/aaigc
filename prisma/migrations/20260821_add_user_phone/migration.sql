-- Additive migration: add phone to User for 设置页绑定手机号（不可解绑）.
-- Safe for existing rows: nullable + unique, no backfill needed.

ALTER TABLE "User" ADD COLUMN "phone" TEXT;
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
