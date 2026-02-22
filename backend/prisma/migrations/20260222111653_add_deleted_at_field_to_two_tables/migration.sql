-- AlterTable
ALTER TABLE "user_courses" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "user_tracks" ADD COLUMN     "deletedAt" TIMESTAMP(3);
