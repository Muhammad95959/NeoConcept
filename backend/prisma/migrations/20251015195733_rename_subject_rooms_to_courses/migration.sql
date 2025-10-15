/*
  Warnings:

  - You are about to drop the column `roleInSubject` on the `MemberShip` table. All the data in the column will be lost.
  - You are about to drop the column `subjectId` on the `MemberShip` table. All the data in the column will be lost.
  - You are about to drop the column `subjectId` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `subjectId` on the `Resource` table. All the data in the column will be lost.
  - You are about to drop the `SubjectRoom` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `courseId` to the `MemberShip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roleInCourse` to the `MemberShip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `courseId` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `courseId` to the `Resource` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."MemberShip" DROP CONSTRAINT "MemberShip_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Post" DROP CONSTRAINT "Post_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Resource" DROP CONSTRAINT "Resource_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SubjectRoom" DROP CONSTRAINT "SubjectRoom_createdBy_fkey";

-- AlterTable
ALTER TABLE "MemberShip" DROP COLUMN "roleInSubject",
DROP COLUMN "subjectId",
ADD COLUMN     "courseId" INTEGER NOT NULL,
ADD COLUMN     "roleInCourse" "Role" NOT NULL;

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "subjectId",
ADD COLUMN     "courseId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Resource" DROP COLUMN "subjectId",
ADD COLUMN     "courseId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "public"."SubjectRoom";

-- CreateTable
CREATE TABLE "Course" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberShip" ADD CONSTRAINT "MemberShip_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
