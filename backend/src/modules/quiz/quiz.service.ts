import prisma from "../../config/db";
import CustomError from "../../types/customError";
import { ErrorMessages } from "../../types/errorsMessages";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import { QuizModel } from "./quiz.model";
import {
  CreateQuizInputService,
  DeleteQuizInput,
  GetQuizInput,
  GetQuizzesInput,
  UpdateQuizInputService,
  StartAttemptInput,
  SubmitAttemptInput,
  GetMyAttemptInput,
  GetAttemptsInput,
  ManualGradeInput,
  DeleteAttemptInput,
} from "./quiz.type";
import { QuestionType, Role } from "../../generated/prisma/client";

export class QuizService {
  static async getQuizzes({ courseId, userId, role, search }: GetQuizzesInput) {
    const where: any = {
      courseId,
      course: { deletedAt: null },
    };

    if (role === Role.STUDENT) {
      where.isPublished = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const quizzes = await QuizModel.findMany(where);

    if (role === Role.STUDENT) {
      const attempts = await prisma.quizAttempt.findMany({
        where: {
          studentId: userId,
          quizId: { in: quizzes.map((q) => q.id) },
        },
      });

      const attemptedQuizIds = new Set(attempts.map((a) => a.quizId));

      return quizzes.map((quiz) => ({
        ...quiz,
        isAnswered: attemptedQuizIds.has(quiz.id),
      }));
    }

    return quizzes;
  }

  static async getQuiz({ courseId, id, userId, role }: GetQuizInput) {
    const quiz = await QuizModel.findFirst({
      courseId,
      id,
      course: { deletedAt: null },
    });

    if (!quiz) throw new CustomError(ErrorMessages.QUIZ_NOT_FOUND || "Quiz not found", 404, HTTPStatusText.FAIL);

    if (role === Role.STUDENT && !quiz.isPublished) {
         throw new CustomError(ErrorMessages.UNAUTHORIZED, 401, HTTPStatusText.FAIL);
    }

    let isAnswered = false;
    if (role === Role.STUDENT) {
      const attempt = await prisma.quizAttempt.findUnique({
        where: { quizId_studentId: { quizId: id, studentId: userId } },
      });
      isAnswered = !!attempt;
    }

    return { ...quiz, isAnswered };
  }

  static async create({ courseId, userId, title, description, durationMinutes, isPublished, questions }: CreateQuizInputService) {
    const course = await prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
    });

    if (!course) throw new CustomError(ErrorMessages.COURSE_NOT_FOUND, 404, HTTPStatusText.FAIL);

    // Transforming questions to match prisma nested create syntax
    const questionsData = questions?.map(q => ({
      questionText: q.questionText,
      type: q.type,
      order: q.order,
      options: {
        create: q.options?.map(o => ({
          text: o.text,
          isCorrect: o.isCorrect
        })) || []
      }
    })) || [];

    return QuizModel.create({
      title: title.trim(),
      description: description?.trim(),
      durationMinutes,
      isPublished: isPublished ?? false,
      courseId,
      questions: {
        create: questionsData
      }
    });
  }

  static async update({ courseId, id, userId, title, description, durationMinutes, isPublished }: UpdateQuizInputService) {
    const quiz = await QuizModel.findFirst({
      courseId,
      id,
      course: { deletedAt: null },
    });

    if (!quiz) throw new CustomError(ErrorMessages.QUIZ_NOT_FOUND || "Quiz not found", 404, HTTPStatusText.FAIL);

    const data: any = {};
    if (title !== undefined) data.title = title.trim();
    if (description !== undefined) data.description = description.trim();
    if (durationMinutes !== undefined) data.durationMinutes = durationMinutes;
    if (isPublished !== undefined) data.isPublished = isPublished;

    return QuizModel.update(id, data);
  }

  static async delete({ courseId, id, userId }: DeleteQuizInput) {
    const quiz = await QuizModel.findFirst({
      courseId,
      id,
      course: { deletedAt: null },
    });

    if (!quiz) throw new CustomError(ErrorMessages.QUIZ_NOT_FOUND || "Quiz not found", 404, HTTPStatusText.FAIL);

    await QuizModel.delete(id);
  }

  // ── Attempt Methods ───────────────────────────────────────────────────────────

  static async startAttempt({ courseId, quizId, studentId }: StartAttemptInput) {
    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, courseId, course: { deletedAt: null } },
    });

    if (!quiz) throw new CustomError(ErrorMessages.QUIZ_NOT_FOUND || "Quiz not found", 404, HTTPStatusText.FAIL);
    if (!quiz.isPublished) throw new CustomError("This quiz is not published yet", 400, HTTPStatusText.FAIL);

    const existing = await prisma.quizAttempt.findUnique({
      where: { quizId_studentId: { quizId, studentId } },
    });

    if (existing) throw new CustomError("You already have an attempt for this quiz", 400, HTTPStatusText.FAIL);

    const attempt = await prisma.quizAttempt.create({
      data: { quizId, studentId },
    });

    return attempt;
  }

  static async submitAttempt({ courseId, quizId, studentId, answers }: SubmitAttemptInput) {
    // 1. Find the attempt
    const attempt = await prisma.quizAttempt.findUnique({
      where: { quizId_studentId: { quizId, studentId } },
    });

    if (!attempt) throw new CustomError("No active attempt found. Please start the quiz first", 404, HTTPStatusText.FAIL);
    if (attempt.completedAt) throw new CustomError("You have already submitted this quiz", 400, HTTPStatusText.FAIL);

    // 2. Fetch the quiz for duration and questions
    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, courseId, course: { deletedAt: null } },
      include: {
        questions: {
          include: { options: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!quiz) throw new CustomError(ErrorMessages.QUIZ_NOT_FOUND || "Quiz not found", 404, HTTPStatusText.FAIL);

    // 3. Late submission check
    const deadline = new Date(attempt.startedAt.getTime() + quiz.durationMinutes * 60 * 1000);
    if (new Date() > deadline) {
      throw new CustomError("Submission time has expired", 400, HTTPStatusText.FAIL);
    }

    // 4. Build a lookup map: questionId → question
    const questionMap = new Map(quiz.questions.map((q) => [q.id, q]));

    // 5. Auto-grade MCQs
    let correctCount = 0;
    let totalMcqCount = 0;

    const studentAnswerData = answers.map((answer) => {
      const question = questionMap.get(answer.questionId);
      if (!question) throw new CustomError(`Question ${answer.questionId} does not belong to this quiz`, 400, HTTPStatusText.FAIL);

      if (question.type === QuestionType.MULTIPLE_CHOICE) {
        totalMcqCount++;
        if (answer.selectedOptionId) {
          const selectedOption = question.options.find((o) => o.id === answer.selectedOptionId);
          if (!selectedOption) throw new CustomError(`Option ${answer.selectedOptionId} does not belong to question ${answer.questionId}`, 400, HTTPStatusText.FAIL);
          if (selectedOption.isCorrect) correctCount++;
        }
      }

      return {
        attemptId: attempt.id,
        questionId: answer.questionId,
        selectedOptionId: answer.selectedOptionId ?? null,
        textAnswer: answer.textAnswer ?? null,
      };
    });

    // 6. Compute score — null if quiz is SHORT_ANSWER only
    const scorePercentage = totalMcqCount > 0 ? (correctCount / totalMcqCount) * 100 : null;

    // 7. Prisma transaction: save answers + complete the attempt
    const [, updatedAttempt] = await prisma.$transaction([
      prisma.studentAnswer.createMany({ data: studentAnswerData }),
      prisma.quizAttempt.update({
        where: { id: attempt.id },
        data: { completedAt: new Date(), score: scorePercentage },
        include: { answers: true },
      }),
    ]);

    return {
      attempt: updatedAttempt,
      correctCount,
      totalMcqCount,
      scorePercentage,
    };
  }

  static async getMyAttempt({ quizId, studentId }: GetMyAttemptInput) {
    const attempt = await prisma.quizAttempt.findUnique({
      where: { quizId_studentId: { quizId, studentId } },
      include: {
        answers: {
          include: { question: true },
        },
      },
    });

    if (!attempt) throw new CustomError("No attempt found for this quiz", 404, HTTPStatusText.FAIL);

    return attempt;
  }

  static async getQuizAttempts({ quizId }: GetAttemptsInput) {
    return prisma.quizAttempt.findMany({
      where: { quizId },
      include: {
        student: { select: { id: true, username: true, email: true } },
        answers: {
          include: { question: { select: { id: true, questionText: true, type: true } } },
        },
      },
      orderBy: { startedAt: "desc" },
    });
  }

  static async manualGrade({ attemptId, score }: ManualGradeInput) {
    const attempt = await prisma.quizAttempt.findUnique({ where: { id: attemptId } });

    if (!attempt) throw new CustomError("Attempt not found", 404, HTTPStatusText.FAIL);
    if (!attempt.completedAt) throw new CustomError("Student has not submitted this quiz yet", 400, HTTPStatusText.FAIL);

    return prisma.quizAttempt.update({
      where: { id: attemptId },
      data: { score },
      include: { student: { select: { id: true, username: true, email: true } }, answers: true },
    });
  }

  static async deleteAttempt({ attemptId, quizId }: DeleteAttemptInput) {
    const attempt = await prisma.quizAttempt.findUnique({ where: { id: attemptId } });

    if (!attempt) throw new CustomError("Attempt not found", 404, HTTPStatusText.FAIL);
    if (attempt.quizId !== quizId) throw new CustomError("Attempt does not belong to this quiz", 400, HTTPStatusText.FAIL);

    // onDelete: Cascade on StudentAnswer handles child deletion automatically
    await prisma.quizAttempt.delete({ where: { id: attemptId } });
  }
}


