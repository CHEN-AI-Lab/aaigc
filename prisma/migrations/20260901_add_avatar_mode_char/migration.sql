-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarChar" TEXT,
ADD COLUMN     "avatarMode" TEXT NOT NULL DEFAULT 'auto';
