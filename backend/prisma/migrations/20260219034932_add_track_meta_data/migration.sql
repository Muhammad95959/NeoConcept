/*
  Warnings:

  - You are about to drop the column `description` on the `tracks` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "track_name_unique_active";

-- DropIndex
DROP INDEX "users_email_unique_active";

-- AlterTable
ALTER TABLE "tracks" DROP COLUMN "description",
ADD COLUMN     "domain" TEXT,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "learningOutcomes" TEXT[],
ADD COLUMN     "level" TEXT,
ADD COLUMN     "longDescription" TEXT,
ADD COLUMN     "pricingModel" TEXT,
ADD COLUMN     "relatedJobs" TEXT[],
ADD COLUMN     "shortDescription" TEXT,
ADD COLUMN     "targetAudience" TEXT;
