-- DropIndex
DROP INDEX IF EXISTS "Favorite_userId_toolId_key";

-- AlterTable
ALTER TABLE "Favorite" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'tool';

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Favorite_userId_toolId_type_key" ON "Favorite"("userId", "toolId", "type");