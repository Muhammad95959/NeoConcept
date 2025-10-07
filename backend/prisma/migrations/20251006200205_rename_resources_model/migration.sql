/*
  Warnings:

  - You are about to drop the `Resources` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Resources" DROP CONSTRAINT "Resources_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Resources" DROP CONSTRAINT "Resources_uploadedBy_fkey";

-- DropTable
DROP TABLE "public"."Resources";

-- CreateTable
CREATE TABLE "public"."Resource" (
    "id" SERIAL NOT NULL,
    "uploadedBy" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Resource" ADD CONSTRAINT "Resource_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Resource" ADD CONSTRAINT "Resource_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."SubjectRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
