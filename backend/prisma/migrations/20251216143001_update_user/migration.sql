/*
  Warnings:

  - You are about to drop the column `deleted` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "deleted",
ADD COLUMN     "deletedAt" TIMESTAMP(3);
