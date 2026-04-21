import express from "express";
import { Role } from "../../generated/prisma/client";
import checkCourseExists from "../../middlewares/checkCourseExists";
import verifyCourseMember from "../../middlewares/verifyCourseMember";
import { protect } from "../../middlewares/protect";
import { restrict } from "../../middlewares/restrict";
import { validate } from "../../middlewares/validate";
import { QuizValidationSchemas } from "./quiz.validation";
import { QuizController } from "./quiz.controller";

const router = express.Router({ mergeParams: true });

// ── Quiz CRUD ─────────────────────────────────────────────────────────────────

router.get(
  "/",
  protect,
  validate({ params: QuizValidationSchemas.courseIdParams, query: QuizValidationSchemas.getManyQuery }),
  checkCourseExists,
  verifyCourseMember,
  QuizController.getQuizzes,
);

router.get(
  "/:id",
  protect,
  validate({ params: QuizValidationSchemas.idParams }),
  checkCourseExists,
  verifyCourseMember,
  QuizController.getQuiz,
);

router.post(
  "/",
  protect,
  restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  validate({ params: QuizValidationSchemas.courseIdParams, body: QuizValidationSchemas.createBody }),
  checkCourseExists,
  verifyCourseMember,
  QuizController.create,
);

router.patch(
  "/:id",
  protect,
  restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  validate({ params: QuizValidationSchemas.idParams, body: QuizValidationSchemas.updateBody }),
  checkCourseExists,
  verifyCourseMember,
  QuizController.update,
);

router.delete(
  "/:id",
  protect,
  restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  validate({ params: QuizValidationSchemas.idParams }),
  checkCourseExists,
  verifyCourseMember,
  QuizController.delete,
);

// ── Attempt Routes ────────────────────────────────────────────────────────────

// Student: start a quiz attempt
router.post(
  "/:quizId/start",
  protect,
  restrict(Role.STUDENT),
  validate({ params: QuizValidationSchemas.quizIdParams }),
  checkCourseExists,
  verifyCourseMember,
  QuizController.startAttempt,
);

// Student: one-time submit
router.post(
  "/:quizId/submit",
  protect,
  restrict(Role.STUDENT),
  validate({ params: QuizValidationSchemas.quizIdParams, body: QuizValidationSchemas.submitAttemptBody }),
  checkCourseExists,
  verifyCourseMember,
  QuizController.submitAttempt,
);

// Student: view my attempt
router.get(
  "/:quizId/attempts/my-attempt",
  protect,
  restrict(Role.STUDENT),
  validate({ params: QuizValidationSchemas.quizIdParams }),
  checkCourseExists,
  verifyCourseMember,
  QuizController.getMyAttempt,
);

// Instructor/Assistant: view all attempts for a quiz
router.get(
  "/:quizId/attempts",
  protect,
  restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  validate({ params: QuizValidationSchemas.quizIdParams }),
  checkCourseExists,
  verifyCourseMember,
  QuizController.getAttempts,
);

// Instructor/Assistant: manually grade an attempt (for SHORT_ANSWER)
router.patch(
  "/:quizId/attempts/:attemptId/grade",
  protect,
  restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  validate({ params: QuizValidationSchemas.attemptIdParams, body: QuizValidationSchemas.manualGradeBody }),
  checkCourseExists,
  verifyCourseMember,
  QuizController.manualGrade,
);

// Instructor/Assistant: delete an attempt (allows student to redo)
router.delete(
  "/:quizId/attempts/:attemptId",
  protect,
  restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  validate({ params: QuizValidationSchemas.attemptIdParams }),
  checkCourseExists,
  verifyCourseMember,
  QuizController.deleteAttempt,
);

export default router;

