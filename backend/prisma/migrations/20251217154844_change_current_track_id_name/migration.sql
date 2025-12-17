/*
  Warnings:

  - You are about to drop the column `currentTrackID` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_currentTrackID_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "currentTrackID",
ADD COLUMN     "currentTrackId" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_currentTrackId_fkey" FOREIGN KEY ("currentTrackId") REFERENCES "tracks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
