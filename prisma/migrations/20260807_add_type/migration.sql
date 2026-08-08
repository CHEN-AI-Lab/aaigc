-- DropIndex
DROP INDEX "Favorite_userId_toolId_key";

-- DropIndex
DROP INDEX "Like_userId_toolId_key";

-- AlterTable
ALTER TABLE "Favorite" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'tool';

-- AlterTable
ALTER TABLE "Like" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'tool';

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_toolId_type_key" ON "Favorite"("userId", "toolId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Like_userId_toolId_type_key" ON "Like"("userId", "toolId", "type");

