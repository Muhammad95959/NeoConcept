import { NextFunction, Request, Response } from "express";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import { QuizService } from "./quiz.service";
import { IdParams, QuizIdParams, AttemptIdParams, SubmitAttemptBody, ManualGradeBody } from "./quiz.validation";

export class QuizController {
  static async getQuizzes(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId } = req.params;
      const { search } = req.query;
      const userId = res.locals.user.id;
      const role = res.locals.user.role;

      const quizzes = await QuizService.getQuizzes({
        courseId: courseId as string,
        userId,
        role,
        search: typeof search === "string" ? search : undefined,
      });

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data: { quizzes } });
    } catch (error) {
      next(error);
    }
  }

  static async getQuiz(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId, id } = res.locals.params as IdParams;
      const userId = res.locals.user.id;
      const role = res.locals.user.role;

      const quiz = await QuizService.getQuiz({ courseId, id, userId, role });

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data: { quiz } });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const courseId = req.params.courseId as string;
      const userId = res.locals.user.id;

      const quiz = await QuizService.create({
        courseId,
        userId,
        ...res.locals.body,
      });

      res.status(201).json({ status: HTTPStatusText.SUCCESS, data: { quiz } });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId, id } = res.locals.params as IdParams;
      const userId = res.locals.user.id;

      const quiz = await QuizService.update({
        courseId,
        id,
        userId,
        ...res.locals.body,
      });

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data: { quiz } });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId, id } = res.locals.params as IdParams;
      const userId = res.locals.user.id;

      await QuizService.delete({ courseId, id, userId });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // ── Attempt Controllers ────────────────────────────────────────────────────────

  static async startAttempt(_req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId, quizId } = res.locals.params as QuizIdParams;
      const studentId = res.locals.user.id;

      const attempt = await QuizService.startAttempt({ courseId, quizId, studentId });

      res.status(201).json({ status: HTTPStatusText.SUCCESS, data: { attempt } });
    } catch (error) {
      next(error);
    }
  }

  static async submitAttempt(_req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId, quizId } = res.locals.params as QuizIdParams;
      const { answers } = res.locals.body as SubmitAttemptBody;
      const studentId = res.locals.user.id;

      const result = await QuizService.submitAttempt({ courseId, quizId, studentId, answers });

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getMyAttempt(_req: Request, res: Response, next: NextFunction) {
    try {
      const { quizId } = res.locals.params as QuizIdParams;
      const studentId = res.locals.user.id;

      const attempt = await QuizService.getMyAttempt({ quizId, studentId });

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data: { attempt } });
    } catch (error) {
      next(error);
    }
  }

  static async getAttempts(_req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId, quizId } = res.locals.params as QuizIdParams;

      const attempts = await QuizService.getQuizAttempts({ courseId, quizId });

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data: { attempts } });
    } catch (error) {
      next(error);
    }
  }

  static async manualGrade(_req: Request, res: Response, next: NextFunction) {
    try {
      const { attemptId } = res.locals.params as AttemptIdParams;
      const { score } = res.locals.body as ManualGradeBody;

      const attempt = await QuizService.manualGrade({ attemptId, score });

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data: { attempt } });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAttempt(_req: Request, res: Response, next: NextFunction) {
    try {
      const { quizId, attemptId } = res.locals.params as AttemptIdParams;

      await QuizService.deleteAttempt({ attemptId, quizId });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}


