/*
  Warnings:

  - You are about to drop the `course_users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "course_users" DROP CONSTRAINT "course_users_courseId_fkey";

-- DropForeignKey
ALTER TABLE "course_users" DROP CONSTRAINT "course_users_userId_fkey";

-- DropTable
DROP TABLE "course_users";

-- CreateTable
CREATE TABLE "user_courses" (
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "roleInCourse" "Role" NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_courses_pkey" PRIMARY KEY ("userId","courseId")
);

-- AddForeignKey
ALTER TABLE "user_courses" ADD CONSTRAINT "user_courses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_courses" ADD CONSTRAINT "user_courses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
