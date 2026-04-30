-- CreateIndex
CREATE INDEX "community_messages_courseId_createdAt_idx" ON "community_messages"("courseId", "createdAt");

-- CreateIndex
CREATE INDEX "quiz_attempts_quizId_score_idx" ON "quiz_attempts"("quizId", "score");

-- CreateIndex
CREATE INDEX "quiz_attempts_startedAt_idx" ON "quiz_attempts"("startedAt");

-- CreateIndex
CREATE INDEX "quizzes_courseId_idx" ON "quizzes"("courseId");

-- CreateIndex
CREATE INDEX "user_courses_courseId_joinedAt_idx" ON "user_courses"("courseId", "joinedAt");

-- CreateIndex
CREATE INDEX "user_courses_courseId_roleInCourse_idx" ON "user_courses"("courseId", "roleInCourse");
