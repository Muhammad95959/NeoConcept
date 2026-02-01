/*
  Warnings:

  - You are about to drop the `user_tracks` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "user_tracks" DROP CONSTRAINT "user_tracks_trackId_fkey";

-- DropForeignKey
ALTER TABLE "user_tracks" DROP CONSTRAINT "user_tracks_userId_fkey";

-- DropTable
DROP TABLE "user_tracks";
