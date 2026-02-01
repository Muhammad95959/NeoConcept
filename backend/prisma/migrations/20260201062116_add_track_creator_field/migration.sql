/*
  Warnings:

  - A unique constraint covering the columns `[creatorId]` on the table `tracks` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `creatorId` to the `tracks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tracks" ADD COLUMN     "creatorId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "tracks_creatorId_key" ON "tracks"("creatorId");

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
