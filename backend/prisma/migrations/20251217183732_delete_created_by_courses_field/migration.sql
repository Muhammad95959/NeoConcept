/*
  Warnings:

  - You are about to drop the column `createdBy` on the `courses` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "courses" DROP CONSTRAINT "courses_createdBy_fkey";

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "createdBy";
