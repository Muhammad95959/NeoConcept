-- AlterTable
ALTER TABLE "users" ADD COLUMN     "currentTrackID" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_currentTrackID_fkey" FOREIGN KEY ("currentTrackID") REFERENCES "tracks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
