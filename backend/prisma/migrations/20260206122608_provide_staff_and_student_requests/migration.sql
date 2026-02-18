/*
  Warnings:

  - You are about to drop the `requests` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "requests" DROP CONSTRAINT "requests_courseId_fkey";

-- DropForeignKey
ALTER TABLE "requests" DROP CONSTRAINT "requests_userId_fkey";

-- DropTable
DROP TABLE "requests";

-- CreateTable
CREATE TABLE "staff_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "message" TEXT,
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "staff_requests" ADD CONSTRAINT "staff_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_requests" ADD CONSTRAINT "staff_requests_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_requests" ADD CONSTRAINT "student_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
