-- CreateTable
CREATE TABLE "user_tracks" (
    "userId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_tracks_pkey" PRIMARY KEY ("userId","trackId")
);

-- AddForeignKey
ALTER TABLE "user_tracks" ADD CONSTRAINT "user_tracks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tracks" ADD CONSTRAINT "user_tracks_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "tracks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
