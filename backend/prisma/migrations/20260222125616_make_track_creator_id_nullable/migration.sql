-- DropForeignKey
ALTER TABLE "tracks" DROP CONSTRAINT "tracks_creatorId_fkey";

-- AlterTable
ALTER TABLE "tracks" ALTER COLUMN "creatorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
