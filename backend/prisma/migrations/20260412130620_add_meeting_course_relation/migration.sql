/*
  Warnings:

  - Added the required column `courseId` to the `meetings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "meetings" ADD COLUMN     "courseId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
