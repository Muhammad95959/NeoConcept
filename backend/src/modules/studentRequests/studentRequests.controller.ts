import { Request, Response, NextFunction } from "express";
import { Status } from "../../generated/prisma";
import { StudentRequestService } from "./studentRequests.service";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import { SuccessMessages } from "../../types/successMessages";

export class StudentRequestController {
  static async getCourseStudentRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId, status } = res.locals.query as { courseId: string; status?: string };
      const statusValue = status ? (status.toUpperCase() as Status) : undefined;

      const data = await StudentRequestService.getMany(res.locals.user.id, courseId, statusValue);

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async getCourseStudentRequestById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params as { id: string };

      const data = await StudentRequestService.getById(res.locals.user.id, id);

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async createStudentRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId } = res.locals.body as { courseId: string };
      const data = await StudentRequestService.create(res.locals.user.id, courseId);

      res.status(201).json({ status: HTTPStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async answerStudentRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params as { id: string };
      const { status } = res.locals.body as { status: Status };

      const message = await StudentRequestService.answer(res.locals.user.id, id, status);

      res.status(200).json({ status: HTTPStatusText.SUCCESS, message });
    } catch (err) {
      next(err);
    }
  }

  static async deleteStudentRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params as { id: string };

      await StudentRequestService.delete(res.locals.user.id, id);

      res.status(200).json({ status: HTTPStatusText.SUCCESS, message: SuccessMessages.REQUEST_DELETED });
    } catch (err) {
      next(err);
    }
  }
}
