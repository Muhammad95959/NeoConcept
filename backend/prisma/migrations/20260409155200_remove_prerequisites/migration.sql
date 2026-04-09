/*
  Warnings:

  - You are about to drop the `course_prerequisites` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[hostId]` on the table `meetings` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "course_prerequisites" DROP CONSTRAINT "course_prerequisites_courseId_fkey";

-- DropForeignKey
ALTER TABLE "course_prerequisites" DROP CONSTRAINT "course_prerequisites_prerequisiteId_fkey";

-- DropIndex
DROP INDEX "users_email_key";

-- DropIndex
DROP INDEX "users_username_key";

-- DropTable
DROP TABLE "course_prerequisites";

-- CreateIndex
CREATE UNIQUE INDEX "meetings_hostId_key" ON "meetings"("hostId");
