import { Request, Response, NextFunction } from "express";
import { Status } from "../../generated/prisma";
import { StudentRequestService } from "./studentRequests.service";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import { SuccessMessages } from "../../types/successMessages";
import { GetManyQuery, IdParams, CreateBody, AnswerBody, UpdateBody } from "./studentRequests.validation";

export class StudentRequestController {
  static async getMany(_req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId, status } = res.locals.query as GetManyQuery;
      const statusValue = status ? (status.toUpperCase() as Status) : undefined;

      const data = await StudentRequestService.getMany(res.locals.user.id, courseId, statusValue);

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async getById(_req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params as IdParams;

      const data = await StudentRequestService.getById(res.locals.user.id, id);

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async create(_req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId, message } = res.locals.body as CreateBody;
      const data = await StudentRequestService.create(res.locals.user.id, courseId, message);

      res.status(201).json({ status: HTTPStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async update(_req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params as IdParams;
      const { message } = res.locals.body as UpdateBody;

      const data = await StudentRequestService.update(res.locals.user.id, id, message);

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async answer(_req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params as IdParams;
      const { status } = res.locals.body as AnswerBody;

      const message = await StudentRequestService.answer(res.locals.user.id, id, status);

      res.status(200).json({ status: HTTPStatusText.SUCCESS, message });
    } catch (err) {
      next(err);
    }
  }

  static async delete(_req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params as IdParams;

      await StudentRequestService.delete(res.locals.user.id, id);

      res.status(200).json({ status: HTTPStatusText.SUCCESS, message: SuccessMessages.REQUEST_DELETED });
    } catch (err) {
      next(err);
    }
  }
}
