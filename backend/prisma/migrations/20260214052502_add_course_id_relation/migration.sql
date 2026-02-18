-- AddForeignKey
ALTER TABLE "student_requests" ADD CONSTRAINT "student_requests_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
